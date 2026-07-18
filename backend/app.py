"""
Suno A/B Evaluator - Flask Backend
Author: DebugForge Assistant
Date: 2026-07-18

Manages evaluations data state and uploads/serves local audio files on disk.
Serves static React app from frontend/dist if built.
"""

import json
import os
import re
from pathlib import Path
from flask import Flask, jsonify, request, send_from_directory, abort

from schema import validate_project

BASE_DIR = Path(__file__).resolve().parent
PROJECTS_DIR = BASE_DIR / "projects"
FRONTEND_DIST = BASE_DIR.parent / "frontend" / "dist"

PROJECTS_DIR.mkdir(exist_ok=True)

ALLOWED_AUDIO_EXTENSIONS = {"mp3", "wav", "ogg", "m4a", "flac"}
PROJECT_ID_RE = re.compile(r"^[a-zA-Z0-9_-]+$")

app = Flask(
    __name__,
    static_folder=str(FRONTEND_DIST) if FRONTEND_DIST.exists() else None,
    static_url_path="",
)

# --- Helpers ---


def project_dir(project_id: str) -> Path:
    if not PROJECT_ID_RE.match(project_id or ""):
        abort(400, description="معرف مشروع غير صالح")
    return PROJECTS_DIR / project_id


def load_project(project_id: str) -> dict:
    path = project_dir(project_id) / "project.json"
    if not path.exists():
        abort(404, description=f"المشروع '{project_id}' غير موجود")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def build_initial_evaluations(project: dict) -> dict:
    """Creates a fresh dynamic evaluation state conforming to the project's schema."""
    question_ids = [q["id"] for q in project.get("sectionQuestions", [])]
    state = {}
    for sec in project["sections"]:
        answers = {
            qid: {"A": None, "B": None, "detailsA": "", "detailsB": ""}
            for qid in question_ids
        }
        tag_evaluations = {
            t["id"]: {"ratingA": None, "ratingB": None} for t in sec.get("tags", [])
        }
        state[str(sec["id"])] = {
            "sectionId": sec["id"],
            "answers": answers,
            "tagEvaluations": tag_evaluations,
            "notes": "",
            "specialQuestionAnswer": "",
            "generalSuccessA": True,
            "generalSuccessB": True,
            "preferredVersion": None,
        }
    return state


def load_or_create_evaluations(project_id: str) -> dict:
    eval_path = project_dir(project_id) / "evaluations.json"
    if eval_path.exists():
        with open(eval_path, "r", encoding="utf-8") as f:
            return json.load(f)
    project = load_project(project_id)
    fresh = build_initial_evaluations(project)
    save_evaluations(project_id, fresh)
    return fresh


def save_evaluations(project_id: str, data: dict) -> None:
    eval_path = project_dir(project_id) / "evaluations.json"
    eval_path.parent.mkdir(parents=True, exist_ok=True)
    with open(eval_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def audio_manifest(project_id: str) -> dict:
    audio_dir = project_dir(project_id) / "audio"
    manifest = {}
    if audio_dir.exists():
        for file in audio_dir.iterdir():
            if not file.is_file() or file.name.startswith("."):
                continue
            stem = file.stem  # e.g., "1_A"
            if "_" not in stem:
                continue
            section_id, _, version = stem.partition("_")
            manifest[f"{section_id}_{version}"] = {
                "filename": file.name,
                "sizeBytes": file.stat().st_size,
                "url": f"/api/projects/{project_id}/audio/file/{file.name}",
            }
    return manifest


# --- REST API Endpoints ---


@app.get("/api/projects")
def list_projects():
    result = []
    for entry in sorted(PROJECTS_DIR.iterdir()):
        project_file = entry / "project.json"
        if entry.is_dir() and project_file.exists():
            try:
                with open(project_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                result.append(
                    {
                        "projectId": data.get("projectId", entry.name),
                        "title": data.get("title", entry.name),
                        "subtitle": data.get("subtitle", ""),
                        "sectionCount": len(data.get("sections", [])),
                    }
                )
            except (json.JSONDecodeError, OSError):
                continue
    return jsonify(result)


@app.post("/api/projects")
def create_project():
    data = request.get_json(silent=True)
    if data is None:
        abort(400, description="الرجاء تمرير بيانات المشروع بصيغة JSON")

    errors = validate_project(data)
    if errors:
        return jsonify({"errors": errors}), 422

    project_id = data["projectId"]
    if not PROJECT_ID_RE.match(project_id):
        abort(400, description="معرف المشروع يجب أن يكون حروفا وأرقاما بالإنجليزية فقط")

    target_dir = project_dir(project_id)
    if target_dir.exists():
        abort(409, description=f"المشروع '{project_id}' موجود بالفعل")

    target_dir.mkdir(parents=True)
    (target_dir / "audio").mkdir()
    with open(target_dir / "project.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    return jsonify({"projectId": project_id}), 201


@app.post("/api/projects/validate")
def validate_only():
    data = request.get_json(silent=True)
    if data is None:
        abort(400, description="الرجاء تمرير بيانات المشروع بصيغة JSON")
    errors = validate_project(data)
    return jsonify({"valid": len(errors) == 0, "errors": errors})


@app.get("/api/projects/<project_id>")
def get_project(project_id):
    return jsonify(load_project(project_id))


@app.get("/api/projects/<project_id>/evaluations")
def get_evaluations(project_id):
    return jsonify(load_or_create_evaluations(project_id))


@app.put("/api/projects/<project_id>/evaluations")
def put_evaluations(project_id):
    data = request.get_json(silent=True)
    if data is None:
        abort(400, description="الرجاء تمرير التعديلات بصيغة JSON")
    load_project(project_id)  # Returns 404 if project is missing
    save_evaluations(project_id, data)
    return jsonify({"status": "saved"})


@app.post("/api/projects/<project_id>/evaluations/reset")
def reset_evaluations(project_id):
    project = load_project(project_id)
    fresh = build_initial_evaluations(project)
    save_evaluations(project_id, fresh)
    return jsonify(fresh)


@app.get("/api/projects/<project_id>/audio")
def get_audio_manifest(project_id):
    load_project(project_id)
    return jsonify(audio_manifest(project_id))


@app.put("/api/projects/<project_id>/audio/<int:section_id>/<version>")
def upload_audio(project_id, section_id, version):
    if version not in ("A", "B"):
        abort(400, description="النسخة يجب أن تكون A أو B")

    ext = (request.args.get("ext") or "mp3").lower().lstrip(".")
    if ext not in ALLOWED_AUDIO_EXTENSIONS:
        abort(400, description=f"امتداد الملف الصوتي غير مدعوم: {ext}")

    body = request.get_data()
    if not body:
        abort(400, description="الملف الصوتي فارغ")

    audio_dir = project_dir(project_id) / "audio"
    audio_dir.mkdir(parents=True, exist_ok=True)

    # Delete previous file with same section/version but potentially different extension
    for existing in audio_dir.glob(f"{section_id}_{version}.*"):
        existing.unlink()

    target = audio_dir / f"{section_id}_{version}.{ext}"
    with open(target, "wb") as f:
        f.write(body)

    return jsonify({"filename": target.name, "sizeBytes": target.stat().st_size})


@app.get("/api/projects/<project_id>/audio/file/<path:filename>")
def serve_audio(project_id, filename):
    audio_dir = project_dir(project_id) / "audio"
    return send_from_directory(audio_dir, filename)


# --- Serving Built React Frontend SPA ---


@app.get("/")
@app.get("/<path:path>")
def serve_frontend(path=""):
    if not app.static_folder:
        return (
            "Frontend build folder not found. Please run `npm run build` in "
            "frontend/ directory first, or use `npm run dev` for development.",
            200,
        )
    full_path = os.path.join(app.static_folder, path)
    if path and os.path.exists(full_path):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

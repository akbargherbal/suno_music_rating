"""
Shared pytest fixtures for the Flask backend test-suite.

Every test that touches the HTTP layer gets a fully isolated `PROJECTS_DIR`
(a pytest tmp_path) monkeypatched onto the `app` module, so tests never read
or write the real `backend/projects/` data on disk.
"""

import json
import sys
from pathlib import Path

import pytest

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import app as app_module  # noqa: E402


def make_minimal_project(project_id: str = "test_proj") -> dict:
    """A tiny but fully schema-valid project fixture used across tests."""
    return {
        "schemaVersion": 1,
        "projectId": project_id,
        "title": "مشروع اختبار",
        "subtitle": "عنوان فرعي",
        "ratingScale": {
            "id": "default",
            "options": [
                {"value": "RED", "icon": "🔴"},
                {"value": "YELLOW", "icon": "🟡"},
                {"value": "GREEN", "icon": "🟢"},
            ],
        },
        "tagTypes": {
            "melody": {
                "label": "اللحن",
                "ratingLabels": {"RED": "ضعيف", "YELLOW": "مقبول", "GREEN": "ممتاز"},
            }
        },
        "sectionQuestions": [
            {
                "id": "q1",
                "label": "هل يوجد انقطاع؟",
                "type": "single_choice",
                "options": ["no", "yes"],
                "optionLabels": {"no": "لا", "yes": "نعم"},
            }
        ],
        "sections": [
            {
                "id": 1,
                "title": "القسم الأول",
                "lyrics": "بيت شعري تجريبي",
                "tracks": {
                    "A": {"assigned_filename": "1_A.mp3"},
                    "B": {"assigned_filename": "1_B.mp3"},
                },
                "tags": [
                    {
                        "id": "tag1",
                        "tag": "reverb",
                        "expected": "صدى خفيف",
                        "type": "melody",
                    }
                ],
            }
        ],
    }


@pytest.fixture
def isolated_projects_dir(tmp_path, monkeypatch):
    """Point the Flask app's PROJECTS_DIR at a throwaway tmp directory."""
    projects_dir = tmp_path / "projects"
    projects_dir.mkdir()
    monkeypatch.setattr(app_module, "PROJECTS_DIR", projects_dir)
    return projects_dir


@pytest.fixture
def client(isolated_projects_dir):
    app_module.app.config.update(TESTING=True)
    with app_module.app.test_client() as test_client:
        yield test_client


@pytest.fixture
def seeded_project(isolated_projects_dir):
    """Writes a minimal valid project.json directly to disk (bypassing the API)."""
    project = make_minimal_project()
    proj_dir = isolated_projects_dir / project["projectId"]
    (proj_dir / "audio").mkdir(parents=True)
    with open(proj_dir / "project.json", "w", encoding="utf-8") as f:
        json.dump(project, f, ensure_ascii=False)
    return project

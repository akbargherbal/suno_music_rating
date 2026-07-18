"""Integration tests for the Flask REST API in backend/app.py.

Every test uses the `client` fixture (see conftest.py), which points the
app's on-disk storage at a throwaway tmp directory so nothing here touches
real project data.
"""

import json

from conftest import make_minimal_project

# --- /api/projects (list & create) ---------------------------------------


def test_list_projects_empty_when_no_projects_exist(client):
    res = client.get("/api/projects")
    assert res.status_code == 200
    assert res.get_json() == []


def test_list_projects_returns_seeded_project(client, seeded_project):
    res = client.get("/api/projects")
    assert res.status_code == 200
    body = res.get_json()
    assert len(body) == 1
    assert body[0]["projectId"] == seeded_project["projectId"]
    assert body[0]["sectionCount"] == 1


def test_create_project_persists_to_disk(client, isolated_projects_dir):
    project = make_minimal_project("brand_new")
    res = client.post("/api/projects", json=project)
    assert res.status_code == 201
    assert res.get_json() == {"projectId": "brand_new"}
    assert (isolated_projects_dir / "brand_new" / "project.json").exists()


def test_create_project_rejects_invalid_schema(client):
    broken = make_minimal_project()
    del broken["title"]
    res = client.post("/api/projects", json=broken)
    assert res.status_code == 422
    assert "errors" in res.get_json()


def test_create_project_rejects_duplicate_id(client, seeded_project):
    res = client.post("/api/projects", json=seeded_project)
    assert res.status_code == 409


def test_create_project_rejects_bad_project_id_characters(client):
    project = make_minimal_project()
    project["projectId"] = "has spaces"
    res = client.post("/api/projects", json=project)
    # Schema pattern check happens first and also fails, so 422 is expected.
    assert res.status_code == 422


def test_create_project_requires_json_body(client):
    res = client.post("/api/projects", data="not json", content_type="text/plain")
    assert res.status_code == 400


# --- /api/projects/validate -----------------------------------------------


def test_validate_endpoint_reports_valid_project(client):
    res = client.post("/api/projects/validate", json=make_minimal_project())
    assert res.status_code == 200
    assert res.get_json() == {"valid": True, "errors": []}


def test_validate_endpoint_reports_errors_without_persisting(
    client, isolated_projects_dir
):
    broken = make_minimal_project()
    del broken["sections"]
    res = client.post("/api/projects/validate", json=broken)
    body = res.get_json()
    assert body["valid"] is False
    assert body["errors"]
    assert list(isolated_projects_dir.iterdir()) == []


# --- /api/projects/<id> -----------------------------------------------------


def test_get_project_returns_404_for_unknown_project(client):
    res = client.get("/api/projects/does_not_exist")
    assert res.status_code == 404


def test_get_project_returns_full_project_json(client, seeded_project):
    res = client.get(f"/api/projects/{seeded_project['projectId']}")
    assert res.status_code == 200
    assert res.get_json()["title"] == seeded_project["title"]


def test_get_project_rejects_project_id_with_disallowed_characters(client):
    # No slashes here (those wouldn't even match this route); this checks the
    # PROJECT_ID_RE guard inside project_dir() against other unsafe characters.
    res = client.get("/api/projects/..")
    assert res.status_code == 400


# --- evaluations lifecycle ---------------------------------------------------


def test_get_evaluations_creates_fresh_state_on_first_access(client, seeded_project):
    project_id = seeded_project["projectId"]
    res = client.get(f"/api/projects/{project_id}/evaluations")
    assert res.status_code == 200
    body = res.get_json()
    assert body["1"]["tagEvaluations"]["tag1"] == {"ratingA": None, "ratingB": None}
    assert body["1"]["generalSuccessA"] is True


def test_put_evaluations_persists_changes(
    client, seeded_project, isolated_projects_dir
):
    project_id = seeded_project["projectId"]
    # Prime the evaluations file first.
    client.get(f"/api/projects/{project_id}/evaluations")

    updated = {
        "1": {
            "sectionId": 1,
            "answers": {},
            "tagEvaluations": {"tag1": {"ratingA": "GREEN", "ratingB": None}},
            "notes": "ملاحظة تجريبية",
            "specialQuestionAnswer": "",
            "generalSuccessA": True,
            "generalSuccessB": False,
            "preferredVersion": "A",
        }
    }
    res = client.put(f"/api/projects/{project_id}/evaluations", json=updated)
    assert res.status_code == 200
    assert res.get_json() == {"status": "saved"}

    on_disk = json.loads(
        (isolated_projects_dir / project_id / "evaluations.json").read_text(
            encoding="utf-8"
        )
    )
    assert on_disk["1"]["tagEvaluations"]["tag1"]["ratingA"] == "GREEN"
    assert on_disk["1"]["preferredVersion"] == "A"


def test_put_evaluations_for_unknown_project_returns_404(client):
    res = client.put("/api/projects/ghost/evaluations", json={})
    assert res.status_code == 404


def test_reset_evaluations_restores_fresh_defaults(client, seeded_project):
    project_id = seeded_project["projectId"]
    client.get(f"/api/projects/{project_id}/evaluations")
    client.put(
        f"/api/projects/{project_id}/evaluations",
        json={
            "1": {
                "sectionId": 1,
                "answers": {},
                "tagEvaluations": {"tag1": {"ratingA": "RED", "ratingB": "RED"}},
                "notes": "x",
                "specialQuestionAnswer": "",
                "generalSuccessA": False,
                "generalSuccessB": False,
                "preferredVersion": "both",
            }
        },
    )

    res = client.post(f"/api/projects/{project_id}/evaluations/reset")
    assert res.status_code == 200
    body = res.get_json()
    assert body["1"]["tagEvaluations"]["tag1"] == {"ratingA": None, "ratingB": None}
    assert body["1"]["preferredVersion"] is None


# --- audio manifest & upload --------------------------------------------------


def test_audio_manifest_empty_when_no_files_uploaded(client, seeded_project):
    res = client.get(f"/api/projects/{seeded_project['projectId']}/audio")
    assert res.status_code == 200
    assert res.get_json() == {}


def test_upload_audio_then_appears_in_manifest_and_is_downloadable(
    client, seeded_project
):
    project_id = seeded_project["projectId"]
    res = client.put(
        f"/api/projects/{project_id}/audio/1/A?ext=mp3",
        data=b"fake-mp3-bytes",
        content_type="application/octet-stream",
    )
    assert res.status_code == 200
    body = res.get_json()
    assert body["filename"] == "1_A.mp3"
    assert body["sizeBytes"] == len(b"fake-mp3-bytes")

    manifest_res = client.get(f"/api/projects/{project_id}/audio")
    manifest = manifest_res.get_json()
    assert "1_A" in manifest
    assert manifest["1_A"]["filename"] == "1_A.mp3"

    file_res = client.get(f"/api/projects/{project_id}/audio/file/1_A.mp3")
    assert file_res.status_code == 200
    assert file_res.data == b"fake-mp3-bytes"


def test_upload_audio_rejects_invalid_version(client, seeded_project):
    res = client.put(f"/api/projects/{seeded_project['projectId']}/audio/1/C?ext=mp3")
    assert res.status_code == 400


def test_upload_audio_rejects_disallowed_extension(client, seeded_project):
    res = client.put(
        f"/api/projects/{seeded_project['projectId']}/audio/1/A?ext=exe",
        data=b"x",
    )
    assert res.status_code == 400


def test_upload_audio_rejects_empty_body(client, seeded_project):
    res = client.put(
        f"/api/projects/{seeded_project['projectId']}/audio/1/A?ext=mp3", data=b""
    )
    assert res.status_code == 400


def test_reupload_with_different_extension_replaces_previous_file(
    client, seeded_project
):
    project_id = seeded_project["projectId"]
    client.put(f"/api/projects/{project_id}/audio/1/A?ext=mp3", data=b"first")
    client.put(f"/api/projects/{project_id}/audio/1/A?ext=wav", data=b"second")

    manifest = client.get(f"/api/projects/{project_id}/audio").get_json()
    assert "1_A" in manifest
    assert manifest["1_A"]["filename"] == "1_A.wav"
    # The stale .mp3 file must have been removed, not left behind as an antique.
    assert not any(k.endswith("mp3") for k in manifest)

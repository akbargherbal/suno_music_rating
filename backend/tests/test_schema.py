"""Unit tests for backend/schema.py — the generic project.json validator."""

import copy

import pytest

from conftest import make_minimal_project
from schema import validate_project


def test_minimal_valid_project_has_no_errors():
    project = make_minimal_project()
    assert validate_project(project) == []


@pytest.mark.parametrize(
    "field",
    [
        "schemaVersion",
        "projectId",
        "title",
        "ratingScale",
        "tagTypes",
        "sectionQuestions",
        "sections",
    ],
)
def test_missing_required_top_level_field_is_rejected(field):
    project = make_minimal_project()
    del project[field]
    errors = validate_project(project)
    assert errors, f"expected an error when '{field}' is missing"


def test_invalid_project_id_characters_are_rejected():
    project = make_minimal_project()
    project["projectId"] = "not a valid id!"
    errors = validate_project(project)
    assert any("projectId" in e for e in errors)


def test_empty_sections_array_is_rejected():
    project = make_minimal_project()
    project["sections"] = []
    errors = validate_project(project)
    assert errors


def test_section_missing_required_field_is_rejected():
    project = make_minimal_project()
    del project["sections"][0]["lyrics"]
    errors = validate_project(project)
    assert errors


def test_tag_referencing_unknown_type_is_flagged():
    project = make_minimal_project()
    project["sections"][0]["tags"][0]["type"] = "does_not_exist"
    errors = validate_project(project)
    assert any("not declared in tagTypes" in e for e in errors)


def test_duplicate_section_question_ids_are_flagged():
    project = make_minimal_project()
    dup = copy.deepcopy(project["sectionQuestions"][0])
    project["sectionQuestions"].append(dup)
    errors = validate_project(project)
    assert any("duplicate question ids" in e for e in errors)


def test_tag_type_missing_rating_labels_is_rejected():
    project = make_minimal_project()
    del project["tagTypes"]["melody"]["ratingLabels"]
    errors = validate_project(project)
    assert errors


def test_rating_scale_requires_at_least_one_option():
    project = make_minimal_project()
    project["ratingScale"]["options"] = []
    errors = validate_project(project)
    assert errors


def test_additional_properties_on_project_are_allowed():
    """The top-level schema intentionally allows forward-compatible extra fields."""
    project = make_minimal_project()
    project["someFutureField"] = "anything"
    assert validate_project(project) == []


def test_tag_rejects_additional_properties():
    """Unlike the project root, individual tag objects are strict."""
    project = make_minimal_project()
    project["sections"][0]["tags"][0]["unexpectedField"] = "oops"
    errors = validate_project(project)
    assert errors

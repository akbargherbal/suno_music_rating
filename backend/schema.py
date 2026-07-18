"""
Suno A/B Evaluator - JSON Schema Validator
Author: DebugForge Assistant
Date: 2026-07-18

This module validates that any uploaded project.json matches our generic schema.
See README.md for schema guide.
"""

from jsonschema import Draft202012Validator

TRACK_SCHEMA = {
    "type": "object",
    "required": ["assigned_filename"],
    "properties": {
        "clip_id": {"type": "string"},
        "original_title": {"type": "string"},
        "assigned_filename": {"type": "string"},
        "styles": {"type": "string"},
        "lyrics": {"type": "string"},
        "created_at": {"type": "string"},
        "downloaded_at": {"type": "string"},
    },
    "additionalProperties": True,
}

TAG_SCHEMA = {
    "type": "object",
    "required": ["id", "tag", "expected", "type"],
    "properties": {
        "id": {"type": "string"},
        "tag": {"type": "string"},
        "expected": {"type": "string"},
        "type": {"type": "string"},
    },
    "additionalProperties": False,
}

SECTION_QUESTION_SCHEMA = {
    "type": "object",
    "required": ["id", "label", "type"],
    "properties": {
        "id": {"type": "string"},
        "label": {"type": "string"},
        "type": {"enum": ["single_choice", "boolean", "free_text"]},
        "options": {"type": "array", "items": {"type": "string"}},
        "optionLabels": {"type": "object"},
        "hasDetails": {"type": "boolean"},
        "detailsLabel": {"type": "string"},
    },
    "additionalProperties": False,
}

SECTION_SCHEMA = {
    "type": "object",
    "required": ["id", "title", "lyrics", "tracks", "tags"],
    "properties": {
        "id": {"type": "integer"},
        "title": {"type": "string"},
        "meta": {"type": "object"},
        "description": {"type": "string"},
        "watchpoint": {"type": "string"},
        "specialQuestion": {"type": ["string", "null"]},
        "lyrics": {"type": "string"},
        "tracks": {
            "type": "object",
            "required": ["A", "B"],
            "properties": {"A": TRACK_SCHEMA, "B": TRACK_SCHEMA},
            "additionalProperties": False,
        },
        "tags": {"type": "array", "items": TAG_SCHEMA},
    },
    "additionalProperties": True,
}

PROJECT_SCHEMA = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "required": [
        "schemaVersion",
        "projectId",
        "title",
        "ratingScale",
        "tagTypes",
        "sectionQuestions",
        "sections",
    ],
    "properties": {
        "schemaVersion": {"type": "integer"},
        "projectId": {
            "type": "string",
            "pattern": "^[a-zA-Z0-9_-]+$",
            "minLength": 1,
            "maxLength": 64,
        },
        "title": {"type": "string"},
        "subtitle": {"type": "string"},
        "poemTitle": {"type": "string"},
        "brandLetter": {"type": "string"},
        "footerNote": {"type": "string"},
        "ratingScale": {
            "type": "object",
            "required": ["id", "options"],
            "properties": {
                "id": {"type": "string"},
                "options": {
                    "type": "array",
                    "minItems": 1,
                    "items": {
                        "type": "object",
                        "required": ["value"],
                        "properties": {
                            "value": {"type": "string"},
                            "icon": {"type": "string"},
                        },
                    },
                },
            },
        },
        "tagTypes": {
            "type": "object",
            "minProperties": 1,
            "additionalProperties": {
                "type": "object",
                "required": ["label", "ratingLabels"],
                "properties": {
                    "label": {"type": "string"},
                    "ratingLabels": {"type": "object"},
                },
            },
        },
        "sectionQuestions": {"type": "array", "items": SECTION_QUESTION_SCHEMA},
        "sections": {"type": "array", "minItems": 1, "items": SECTION_SCHEMA},
    },
    "additionalProperties": True,
}

_validator = Draft202012Validator(PROJECT_SCHEMA)


def validate_project(data: dict) -> list[str]:
    """Return a list of human-readable error strings. Empty list = valid."""
    errors = sorted(_validator.iter_errors(data), key=lambda e: list(e.path))
    messages = []
    for err in errors:
        path = " -> ".join(str(p) for p in err.path) or "(root)"
        messages.append(f"{path}: {err.message}")

    # Cross-validation checks: Ensure tag types refer to declared tagTypes
    if "tagTypes" in data and "sections" in data and isinstance(data["sections"], list):
        known_types = set(data.get("tagTypes", {}).keys())
        for sec in data["sections"]:
            if not isinstance(sec, dict):
                continue
            for tag in sec.get("tags", []) or []:
                if isinstance(tag, dict) and tag.get("type") not in known_types:
                    messages.append(
                        f"sections[id={sec.get('id')}].tags: tag type "
                        f"'{tag.get('type')}' is not declared in tagTypes"
                    )

    # Ensure no duplicates in question IDs
    if "sectionQuestions" in data and isinstance(data["sectionQuestions"], list):
        ids = [q.get("id") for q in data["sectionQuestions"] if isinstance(q, dict)]
        dupes = {i for i in ids if ids.count(i) > 1}
        if dupes:
            messages.append(
                f"sectionQuestions: duplicate question ids: {sorted(dupes)}"
            )

    return messages

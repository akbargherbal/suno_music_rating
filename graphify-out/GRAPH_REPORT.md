# Graph Report - .  (2026-07-19)

## Corpus Check
- Corpus is ~19,961 words - fits in a single context window. You may not need a graph.

## Summary
- 213 nodes · 299 edges · 14 communities (12 shown, 2 thin omitted)
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 35 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Backend Schema & Testing
- Frontend Core & Types
- Frontend Dev Dependencies
- Frontend Components & Unit Tests
- Backend Flask API
- Backend App Integration Tests
- Frontend TypeScript Config
- Frontend Main Dependencies
- Frontend Package Config
- Project Architecture & Docs
- Frontend Entry Point

## God Nodes (most connected - your core abstractions)
1. `make_minimal_project()` - 19 edges
2. `validate_project()` - 15 edges
3. `compilerOptions` - 15 edges
4. `project_dir()` - 9 edges
5. `scripts` - 9 edges
6. `ProjectData` - 8 edges
7. `load_project()` - 7 edges
8. `load_or_create_evaluations()` - 6 edges
9. `EvaluationState` - 6 edges
10. `save_evaluations()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Backend (Flask)` --references--> `Flask Web Framework`  [INFERRED]
  README.md → backend/requirements.txt
- `Backend (Flask)` --references--> `JSON Schema Validator`  [INFERRED]
  README.md → backend/requirements.txt
- `Evaluation Session Architect` --references--> `Project JSON Specification`  [INFERRED]
  docs/Evaluation_Schema_Guide.md → README.md
- `UI/Schema Gotchas` --rationale_for--> `Project JSON Specification`  [INFERRED]
  docs/Evaluation_Schema_Guide.md → README.md
- `Project JSON Specification` --conceptually_related_to--> `JSON Schema Validator`  [INFERRED]
  README.md → backend/requirements.txt

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Decoupled Monorepo Structure** — readme_backend, readme_frontend, readme_decoupled_monorepo [EXTRACTED 1.00]
- **Project Configuration Lifecycle** — readme_project_json_spec, docs_evaluation_schema_guide_architect, docs_evaluation_schema_guide_gotchas [INFERRED 0.85]

## Communities (14 total, 2 thin omitted)

### Community 0 - "Backend Schema & Testing"
Cohesion: 0.10
Nodes (30): validate_only(), Suno A/B Evaluator - JSON Schema Validator Author: DebugForge Assistant Date: 20, Return a list of human-readable error strings. Empty list = valid., validate_project(), isolated_projects_dir(), make_minimal_project(), Shared pytest fixtures for the Flask backend test-suite.  Every test that touche, A tiny but fully schema-valid project fixture used across tests. (+22 more)

### Community 1 - "Frontend Core & Types"
Cohesion: 0.13
Nodes (17): api, ProjectSelector(), ProjectSelectorProps, SummaryDashboardProps, EvaluationState, LocalAudioFile, ProjectData, ProjectSummary (+9 more)

### Community 2 - "Frontend Dev Dependencies"
Cohesion: 0.08
Nodes (25): autoprefixer, esbuild, devDependencies, autoprefixer, esbuild, jsdom, tailwindcss, @testing-library/jest-dom (+17 more)

### Community 3 - "Frontend Components & Unit Tests"
Cohesion: 0.14
Nodes (16): mockedApi, project, AudioPlayer(), AudioPlayerProps, NEUTRAL_SELECTION, SectionEvaluator(), SectionEvaluatorProps, makeProps() (+8 more)

### Community 4 - "Backend Flask API"
Cohesion: 0.20
Nodes (17): audio_manifest(), build_initial_evaluations(), create_project(), get_audio_manifest(), get_evaluations(), get_project(), load_or_create_evaluations(), load_project() (+9 more)

### Community 6 - "Frontend TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+10 more)

### Community 7 - "Frontend Main Dependencies"
Cohesion: 0.12
Nodes (16): dependencies, lucide-react, motion, react, react-dom, @tailwindcss/vite, vite, @vitejs/plugin-react (+8 more)

### Community 8 - "Frontend Package Config"
Cohesion: 0.14
Nodes (13): name, private, scripts, build, clean, dev, lint, preview (+5 more)

### Community 9 - "Project Architecture & Docs"
Cohesion: 0.18
Nodes (11): Flask Web Framework, JSON Schema Validator, Evaluation Session Architect, UI/Schema Gotchas, Backend (Flask), Decoupled Monorepo Architecture, Flat-file JSON Storage, Frontend (React + Vite) (+3 more)

## Knowledge Gaps
- **69 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+64 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Frontend Dev Dependencies` to `Frontend Package Config`, `Frontend Main Dependencies`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Frontend Main Dependencies` to `Frontend Package Config`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Are the 16 inferred relationships involving `make_minimal_project()` (e.g. with `test_create_project_persists_to_disk()` and `test_create_project_rejects_bad_project_id_characters()`) actually correct?**
  _`make_minimal_project()` has 16 INFERRED edges - model-reasoned connections that need verification._
- **Are the 13 inferred relationships involving `validate_project()` (e.g. with `create_project()` and `validate_only()`) actually correct?**
  _`validate_project()` has 13 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _69 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Backend Schema & Testing` be split into smaller, more focused modules?**
  _Cohesion score 0.09982174688057041 - nodes in this community are weakly interconnected._
- **Should `Frontend Core & Types` be split into smaller, more focused modules?**
  _Cohesion score 0.12923076923076923 - nodes in this community are weakly interconnected._
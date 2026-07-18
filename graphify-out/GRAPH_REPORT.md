# Graph Report - .  (2026-07-18)

## Corpus Check
- Corpus is ~12,178 words - fits in a single context window. You may not need a graph.

## Summary
- 101 nodes · 123 edges · 7 communities
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.9)
- Token cost: 1,200 input · 350 output

## Community Hubs (Navigation)
- React UI & State Logic
- TypeScript Configuration
- Runtime Dependencies
- Build & Development Tools
- Package Configuration Scripts
- Project Entry & Documentation

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 15 edges
2. `SectionEvaluation` - 7 edges
3. `scripts` - 6 edges
4. `SectionData` - 6 edges
5. `Rating` - 4 edges
6. `lib` - 4 edges
7. `App()` - 3 edges
8. `SectionEvaluatorProps` - 3 edges
9. `SummaryDashboardProps` - 3 edges
10. `sectionsData` - 3 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `initialEvaluationState()`  [EXTRACTED]
  src/App.tsx → src/data.ts
- `SectionEvaluatorProps` --references--> `SectionData`  [EXTRACTED]
  src/components/SectionEvaluator.tsx → src/types.ts
- `SectionEvaluatorProps` --references--> `SectionEvaluation`  [EXTRACTED]
  src/components/SectionEvaluator.tsx → src/types.ts
- `SummaryDashboardProps` --references--> `SectionData`  [EXTRACTED]
  src/components/SummaryDashboard.tsx → src/types.ts
- `SummaryDashboardProps` --references--> `SectionEvaluation`  [EXTRACTED]
  src/components/SummaryDashboard.tsx → src/types.ts

## Import Cycles
- None detected.

## Communities (7 total, 0 thin omitted)

### Community 0 - "React UI & State Logic"
Cohesion: 0.20
Nodes (14): App(), AudioPlayer(), AudioPlayerProps, SectionEvaluator(), SectionEvaluatorProps, SummaryDashboardProps, initialEvaluationState(), sectionsData (+6 more)

### Community 1 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (20): ./*, DOM, DOM.Iterable, ES2022, compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators (+12 more)

### Community 2 - "Runtime Dependencies"
Cohesion: 0.11
Nodes (19): dotenv, express, @google/genai, lucide-react, motion, dependencies, dotenv, express (+11 more)

### Community 3 - "Build & Development Tools"
Cohesion: 0.11
Nodes (18): autoprefixer, esbuild, vite, devDependencies, autoprefixer, esbuild, tailwindcss, tsx (+10 more)

### Community 4 - "Package Configuration Scripts"
Cohesion: 0.18
Nodes (10): name, private, scripts, build, clean, dev, lint, preview (+2 more)

### Community 5 - "Project Entry & Documentation"
Cohesion: 0.25
Nodes (7): src/main.tsx, root DOM Node, نموذج تقييم استماع أغاني سونو v4, AI Studio App, .env.local, GEMINI_API_KEY, Node.js

## Knowledge Gaps
- **49 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+44 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Runtime Dependencies` to `Build & Development Tools`, `Package Configuration Scripts`?**
  _High betweenness centrality (0.139) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Build & Development Tools` to `Package Configuration Scripts`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _49 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `TypeScript Configuration` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `Runtime Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `Build & Development Tools` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
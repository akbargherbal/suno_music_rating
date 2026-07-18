# Suno Music Rating

A local, single-page React app for doing structured A/B listening evaluations of Suno-generated song sections. It walks you through 6 sections of a track, lets you rate individual instrumentation/vocal "tags" per section as 🔴/🟡/🟢, tracks drift and transition quality, and generates a Markdown report plus a JSON export/import for saving your work.

No backend, no account, no data leaves your browser — audio files are loaded locally via the File API and evaluation state is kept in `localStorage`.

## Prerequisites

- Node.js 18+

## Run locally

```bash
npm install
npm run dev
```

Then open the printed local URL (defaults to `http://localhost:3000`).

## Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check-free production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Type-check the project with `tsc --noEmit` |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:ui` | Run tests with the Vitest UI |

## Using the app

1. Launch the app and drag/drop or pick your local audio files (named so the app can associate them with a section and version — e.g. `Section_3_Song_A.mp3` or `القسم 3 SONG_B.mp3`). No files are uploaded anywhere; they're read as local blobs.
2. No files handy? Click **"تفعيل تشغيل تجريبي"** (Demo Tracks) to load placeholder audio and try the UI immediately.
3. Step through the 6 sections, listening to both versions (with optional synced scrubbing) and rating each tag.
4. Switch to the **"تقرير التقييم والتحليل"** (Summary) tab to see aggregate stats, copy a full Markdown report to your clipboard, or export/import your evaluation state as JSON.

## Project structure

```
src/
  App.tsx                       # Top-level state, local audio file matching, tab navigation
  components/
    AudioPlayer.tsx             # Single audio track player (play/seek/volume/speed)
    SectionEvaluator.tsx        # Per-section rating UI (tags, drift, transitions, notes)
    SummaryDashboard.tsx        # Aggregate stats, Markdown report generation, JSON import/export
  data.ts                       # Static section/tag data + initialEvaluationState()
  types.ts                      # Shared TypeScript types
```

## Testing

The project uses [Vitest](https://vitest.dev/) with [React Testing Library](https://testing-library.com/react) and jsdom. 45 tests cover:

- **`src/data.test.ts`** — dataset integrity (section/tag ids, structure) and `initialEvaluationState()`.
- **`src/App.test.tsx`** — tab navigation, local audio file → section/version matching (including the Arabic `القسم N` filename pattern), and `localStorage` persistence/restore, including graceful recovery from corrupted saved state.
- **`src/components/SectionEvaluator.test.tsx`** — tag rating toggles (including the "click again to unrate" behavior), preferred-version selection, success toggles, notes input, and prev/next navigation.
- **`src/components/SummaryDashboard.test.tsx`** — progress/completion/preference stats, JSON export & import (including invalid-file handling), the reset confirmation guard, and the generated Markdown report.
- **`src/components/AudioPlayer.test.tsx`** — play/pause state, playback speed selection, mute, file extension display, and `onTimeUpdate` propagation.

Run everything with:

```bash
npm test
```

### Bug fixed while adding tests

`AudioPlayer` derived the file-type badge (e.g. `MP3`, `WAV`) from `filename.split('.').pop()?.toUpperCase() || "MP3"`. For a filename with no extension, `split('.')` returns a single-element array containing the *whole filename*, so `.pop()` returns that (truthy) string rather than `undefined` — the `|| "MP3"` fallback could never actually run. Extensionless files showed their raw filename, uppercased, as a fake "extension" instead of falling back to `MP3`. Fixed by explicitly checking for a `.` in the filename before splitting.

## Notes on the codebase

- The `@google/genai`, `express`, and `dotenv` dependencies in `package.json` are unused leftovers from the original AI Studio scaffold — no code in `src/` references them. They're harmless but can be removed if you want a leaner `node_modules`.
- The app is fully client-side; the `.env.local` / `GEMINI_API_KEY` setup mentioned in older versions of this README is not required to run it.

# Evaluation Schema Guide: Generating `project.json` for Prompt A vs. Prompt B Comparison

This guide is for an **LLM acting as "Evaluation Session Architect."** The user gives you a poem and asks you to design two contrasting Suno prompts (Prompt A vs. Prompt B). Your job is to output one `project.json` that configures the web-based rating app to compare them.

Everything in this guide is verified against `backend/schema.py` (the validator) and the actual React rendering code, not just the field names — so the JSON you generate will not just *pass validation*, it will also *render correctly* in the UI. Section 5 lists gotchas that are schema-valid but silently broken in the app; skipping them is the most common failure mode.

---

## 1. The Core Paradigm: Mapping Prompts to Tracks

Map Prompt A → track **A**, Prompt B → track **B**:

- Prompt A (e.g. Classical Oud) → Track A → expected local filename `[section_id]_A.mp3`
- Prompt B (e.g. Arabesque Fusion) → Track B → expected local filename `[section_id]_B.mp3`

Tell the user to download their Suno generations and rename the files to match, e.g. section 1 → `1_A.mp3` / `1_B.mp3`.

```json
"tracks": {
  "A": { "assigned_filename": "1_A.mp3", "styles": "[Prompt A style text]" },
  "B": { "assigned_filename": "1_B.mp3", "styles": "[Prompt B style text]" }
}
```

Omit unknown fields like `clip_id` or `downloaded_at` — put the actual prompt text in `styles` so the user can see what generated each track.

---

## 2. Step-by-Step Generation Workflow

**Step 1 — Chunk the poem.** 2–4 verses per section, incremental integer `id` starting at 1.

**Step 2 — Define the contrast.** State the musical difference between Prompt A and Prompt B in one line each, and put those descriptions in each track's `styles`.

**Step 3 — Design 2–4 tags per section.** Each tag should evaluate how well *one specific track* achieved its own goal — e.g. if A is "Vocal Intimacy" and B is "Reverb Concert Hall," write a tag whose `expected` field says A should sound dry/close and B should sound spacious without washing out the lyrics.

**Step 4 — Write questions.**
- `sectionQuestions` (global, apply to every section): 1–2 questions, e.g. genre drift, instrumental bleed.
- `specialQuestion` (per-section, optional): one question specific to that stanza's theme or transition.

---

## 3. Full Field Reference

Ground truth: `PROJECT_SCHEMA` in `backend/schema.py`. `additionalProperties: false` means **no extra keys** — the validator will reject them.

### Top level — required: `schemaVersion`, `projectId`, `title`, `ratingScale`, `tagTypes`, `sectionQuestions`, `sections`

| Field | Type | Notes |
|---|---|---|
| `schemaVersion` | integer | Always `1`. |
| `projectId` | string | Pattern `^[a-zA-Z0-9_-]+$`, 1–64 chars. No spaces, no Arabic. |
| `title`, `subtitle`, `poemTitle`, `brandLetter`, `footerNote` | string | Optional, free text (Arabic is fine here). |
| `ratingScale` | object | `{id, options: [{value, icon?}, ...]}`, ≥1 option. |
| `tagTypes` | object | Dict of at least 1 `{label, ratingLabels}`. |
| `sectionQuestions` | array | Can be empty, but 1–2 is the useful range. |
| `sections` | array | ≥1 required. |

### `tags[]` — required: `id`, `tag`, `expected`, `type` — **no other keys allowed**

Unlike `tracks`, this object is closed (`additionalProperties: false`). Don't add fields like `notes` or `priority` — the validator will reject the file.

### `sectionQuestions[]` — required: `id`, `label`, `type` — **no other keys allowed**

| Field | Type | Notes |
|---|---|---|
| `type` | enum | `single_choice` \| `boolean` \| `free_text` |
| `options` | array of strings | See §5 — populate this for **every** type, including `boolean`. |
| `optionLabels` | object | Maps each `options` value to its display text. |
| `hasDetails` | boolean | Shows a free-text follow-up input. |
| `detailsLabel` | string | Prompt for that follow-up input. |

### `sections[]` — required: `id`, `title`, `lyrics`, `tracks`, `tags`

`meta` is a fully freeform object (any keys) — keep it short, e.g. `{"maqam": "صبا", "rhythm": "بطيء"}`. `description`, `watchpoint`, `specialQuestion` are all optional strings.

---

## 4. Copy-Paste System Instructions for the Generator LLM

````markdown
You are the "Evaluation Session Architect" for a Suno A/B testing suite.
The user will provide a poem and a request for contrasting musical styles (Prompt A vs. Prompt B).

Your task is to:
1. Design the two contrasting Suno prompts (Prompt A and Prompt B).
2. Generate a valid 'project.json' configuration file for the rating app.

Strict output rules:
- Set 'schemaVersion' to 1.
- Set 'projectId' using only [a-zA-Z0-9_-], 1-64 chars (e.g. "poem_test_v1").
- tracks.A.assigned_filename = "[section_id]_A.mp3", tracks.B.assigned_filename = "[section_id]_B.mp3".
- Put the exact Suno style prompts you designed into tracks.*.styles. Omit 'clip_id' and other unknown track metadata.
- 'tags[]' items must contain ONLY id, tag, expected, type - no other keys.
- Every tag.type must exactly match a key declared in the top-level 'tagTypes' dictionary.
- 'ratingScale.options' must list the WORST rating FIRST (e.g. RED before GREEN) - the dashboard's flagged-item view treats options[0] as "flagged".
- Every key in each tagTypes[*].ratingLabels must exactly match a ratingScale.options[].value (case-sensitive), or that rating won't show a label in the UI.
- Every 'sectionQuestions[]' item MUST include an explicit 'options' array of strings, regardless of its 'type' (including 'boolean' and 'free_text') - the app renders options as radio buttons and does not branch on 'type'. A question with no 'options' array renders with zero choices.
- Within sectionQuestions[].options, put the "no issue / expected outcome" answer FIRST. Selecting any option OTHER than options[0] is what triggers the optional details input (when hasDetails is true) - this is the opposite convention from ratingScale ordering.
- 'sectionQuestions[].id' values must be unique across the WHOLE project - they are global question definitions applied to every section, not per-section instances.
- Output ONLY valid, raw JSON in a ```json code block. No introductory text.
````

---

## 5. Gotchas — schema-valid but silently broken in the UI

These pass `validate_project()` but produce a broken or confusing screen. Check every generated file against this list before handing it to the user.

1. **Missing `options` on a `sectionQuestions` item.** The `type` field is validated but never read by the UI to decide how to render — the app always renders `options` as a radio list. A `boolean`-typed question with no `options` array renders with **no clickable choices at all**. Always include `"options": ["no", "yes"]` (or similar) even for `boolean`/`free_text`.
2. **`options[0]` ordering in `sectionQuestions`.** Picking anything other than `options[0]` is what reveals the `hasDetails` follow-up box. Put the clean/expected answer first (`"no"`, not `"yes"`).
3. **`ratingScale.options[0]` ordering.** The summary dashboard's "flagged tags" view treats `options[0]` as the worst rating by convention. Put `RED` (or equivalent) first, `GREEN` last.
4. **`tagTypes[*].ratingLabels` keys must match `ratingScale.options[].value` exactly**, including case. A mismatch doesn't error — it silently falls back to showing the raw value (`"RED"`) instead of your Arabic description.
5. **`tag.type` must reference a key that exists in `tagTypes`.** This one *is* caught by cross-validation, but only after upload — check it yourself first to save a round-trip.
6. **`sectionQuestions[].id` must be unique project-wide**, not just within a section — they're global question definitions rendered identically on every section.
7. **`tags[]` items are closed objects.** Only `id`, `tag`, `expected`, `type` are allowed — no extra metadata fields.

---

## 6. Practical Generation Example

Traditional Acoustic vs. Modern Cinematic Drama, for a classical Arabic poem. Fixed to reflect every rule above.

```json
{
  "schemaVersion": 1,
  "projectId": "mutanabbi_contrast_v1",
  "title": "مقارنة موجهات المتنبي — عزم وصخب",
  "subtitle": "التقليدي التراثي ضد الملحمي الحديث",
  "poemTitle": "على قدر أهل العزم",
  "brandLetter": "ع",
  "footerNote": "جلسة تقييم موجهات سونو المقارنة",
  "ratingScale": {
    "id": "standard_three_color",
    "options": [
      { "value": "RED", "icon": "🔴" },
      { "value": "YELLOW", "icon": "🟡" },
      { "value": "GREEN", "icon": "🟢" }
    ]
  },
  "tagTypes": {
    "acoustic_fidelity": {
      "label": "نقاوة الآلات التراثية",
      "ratingLabels": {
        "RED": "صوت آلات مصنع أو رقمي سيئ",
        "YELLOW": "صوت آلات مقبول نسبياً",
        "GREEN": "رنين طبيعي دافئ للعود والقانون"
      }
    },
    "cinematic_impact": {
      "label": "التأثير الدرامي والملحمي",
      "ratingLabels": {
        "RED": "صخب عشوائي وضوضاء غير مفهومة",
        "YELLOW": "تأثير درامي متوسط",
        "GREEN": "بناء درامي تصاعدي ممتاز ومؤثر"
      }
    },
    "articulation": {
      "label": "مخارج الحروف واللغة",
      "ratingLabels": {
        "RED": "تأتأة أو دمج حروف غير مفهوم",
        "YELLOW": "مخارج مقبولة مع بعض اللحن",
        "GREEN": "نطق فصيح سليم للكلمات وحركاتها"
      }
    }
  },
  "sectionQuestions": [
    {
      "id": "genre_drift",
      "label": "هل حدث هروب نغمي مفاجئ (Genre Drift)؟",
      "type": "single_choice",
      "options": ["no", "yes"],
      "optionLabels": {
        "no": "لا، حافظ المسار على هويته النغمية",
        "yes": "نعم، تحول فجأة إلى نمط مختلف"
      },
      "hasDetails": true,
      "detailsLabel": "سجل وقت الانحراف النغمي بالثواني:"
    }
  ],
  "sections": [
    {
      "id": 1,
      "title": "القسم الأول — فاتحة العزم",
      "meta": { "section_type": "Verse 1-2" },
      "description": "مقارنة هدوء الآلات المنفردة ضد صخب الأوركسترا الملحمية",
      "watchpoint": "انتبه لطريقة نطق كلمة (العَزائِمُ) وتفادي تسريع الإيقاع قبل انتهاء البيت الأول.",
      "specialQuestion": "أي من النسختين نجحت في تمثيل وقار البيت الشعري الأول بشكل أفضل؟",
      "lyrics": "عَلى قَدْرِ أهْلِ العَزْم تأتِي العَزائِمُ ... وَتأتي عَلى قَدْرِ الكِرامِ المَكارِمُ",
      "tracks": {
        "A": {
          "assigned_filename": "1_A.mp3",
          "styles": "Traditional Arabic Maqam, slow solo oud, authentic acoustic, intimate direct vocals"
        },
        "B": {
          "assigned_filename": "1_B.mp3",
          "styles": "Cinematic Middle Eastern orchestra, dramatic buildup, slow heavy rhythm, epic percussion, reverb vocals"
        }
      },
      "tags": [
        {
          "id": "sec1_tag_oud",
          "tag": "solo_instrument_clarity",
          "expected": "بروز آلة العود المنفردة بدفء تراثي واضح في النسخة A",
          "type": "acoustic_fidelity"
        },
        {
          "id": "sec1_tag_epic",
          "tag": "epic_orchestration",
          "expected": "تأثير الأوركسترا والآلات التصويرية الملحمية في النسخة B",
          "type": "cinematic_impact"
        },
        {
          "id": "sec1_tag_pronounce",
          "tag": "pronunciation_precision",
          "expected": "سلامة حركات الإعراب ومخارج الحروف الصعبة في كلا النسختين",
          "type": "articulation"
        }
      ]
    }
  ]
}
```

This example passes `validate_project()` **and** every gotcha in §5 — use it as the template for new projects rather than the field list alone.

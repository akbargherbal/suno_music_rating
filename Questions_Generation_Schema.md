# LLM Specification & Generation Guide: Suno A/B Evaluation Schema (`project.json`)

This document is a technical guide and prompt specification for Large Language Models (LLMs) tasked with generating or validating `project.json` configuration files for the **Suno Music Rating System**.

The application is a fully decoupled, dynamic, server-driven evaluation platform. The frontend UI contains zero hardcoded configurations; instead, it renders all evaluation elements—including tag categories, rating scales, and diagnostic questions—directly from the generated `project.json` payload.

---

## 1. Structural JSON Schema Blueprint

Every generated `project.json` file must strictly adhere to the following schema specification. Any structural deviations will fail the backend validator (`schema.py`) and return a `422 Unprocessable Entity` error.

### Type Definitions & Constraints

| Field Path         | Type      | Required? | Constraint / Format                                   | Description                                                                   |
| :----------------- | :-------- | :-------: | :---------------------------------------------------- | :---------------------------------------------------------------------------- |
| `schemaVersion`    | `integer` |  **Yes**  | Must be exactly `1`.                                  | Controls schema versioning.                                                   |
| `projectId`        | `string`  |  **Yes**  | Pattern: `^[a-zA-Z0-9_-]+$`<br>Length: 1 to 64 chars. | Unique system-level folder and database key. No spaces or special characters. |
| `title`            | `string`  |  **Yes**  | Non-empty.                                            | The main title of the poetry or music project.                                |
| `subtitle`         | `string`  |    No     | String.                                               | Subheading describing the project or criteria.                                |
| `poemTitle`        | `string`  |    No     | String.                                               | The original title of the source poem or diwan.                               |
| `brandLetter`      | `string`  |    No     | Typically a single Arabic character.                  | Appears inside the circular logo in the header.                               |
| `footerNote`       | `string`  |    No     | String.                                               | Custom text displayed in the page footer.                                     |
| `ratingScale`      | `object`  |  **Yes**  | See [Section 1.1](#11-ratingscale-object)             | Define the evaluation scale.                                                  |
| `tagTypes`         | `object`  |  **Yes**  | See [Section 1.2](#12-tagtypes-object)                | Dictionary mapping tag types to UI configurations.                            |
| `sectionQuestions` | `array`   |  **Yes**  | See [Section 1.3](#13-sectionquestions-array)         | Global diagnostic questions applied to all sections.                          |
| `sections`         | `array`   |  **Yes**  | Min items: 1. See [Section 1.4](#14-sections-array)   | Individual audio segments (e.g., stanzas or strophes).                        |

---

### 1.1 `ratingScale` Object

Defines the visual rating choices available to the evaluator.

```json
"ratingScale": {
  "id": "string",
  "options": [
    { "value": "string", "icon": "string" }
  ]
}
```

- **`options` constraint:** Must contain at least one item. Each option must have a unique `value` string. The `icon` string is typically an emoji character representing the rating status (e.g., `"🔴"`, `"🟡"`, `"🟢"`).

---

### 1.2 `tagTypes` Object

Maps specific technical domains (such as engineering, performance, or vocal quality) to localized labels.

```json
"tagTypes": {
  "<type_key>": {
    "label": "string",
    "ratingLabels": {
      "<rating_value_1>": "string",
      "<rating_value_2>": "string"
    }
  }
}
```

- **`<type_key>`**: Alphanumeric ASCII string identifying the category (e.g., `"melody"`, `"vocal"`).
- **`ratingLabels`**: A key-value dictionary mapping every potential value defined in `ratingScale.options` to a localized explanatory label (usually in Arabic) to help the evaluator.

---

### 1.3 `sectionQuestions` Array

Global, cross-sectional checklist questions.

```json
"sectionQuestions": [
  {
    "id": "string",
    "label": "string",
    "type": "single_choice" | "boolean" | "free_text",
    "options": ["string"],
    "optionLabels": {
      "<option_value>": "string"
    },
    "hasDetails": true,
    "detailsLabel": "string"
  }
]
```

- **`type`**: Must be one of `"single_choice"`, `"boolean"`, or `"free_text"`.
- **`options`**: Required if type is `"single_choice"`.
- **`hasDetails`**: If set to `true`, the UI renders a dynamic text input when a non-default choice is selected, prompting the user for details (such as timestamps).

---

### 1.4 `sections` Array

The heart of the project. Maps each verse, stanza, or fragment of the poem to its generated audio files and expected outcomes.

```json
"sections": [
  {
    "id": 1,
    "title": "string",
    "meta": {
      "key": "string"
    },
    "description": "string",
    "watchpoint": "string",
    "specialQuestion": "string" | null,
    "lyrics": "string",
    "tracks": {
      "A": {
        "assigned_filename": "string",
        "clip_id": "string",
        "styles": "string",
        "original_title": "string"
      },
      "B": {
        "assigned_filename": "string",
        "clip_id": "string",
        "styles": "string",
        "original_title": "string"
      }
    },
    "tags": [
      {
        "id": "string",
        "tag": "string",
        "expected": "string",
        "type": "string"
      }
    ]
  }
]
```

- **`id`**: Must be a unique, sequential integer starting at `1`.
- **`meta`**: Optional key-value metadata pairs rendered as tags in the section header (e.g., `"maqam": "Saba"`, `"tempo": "78 BPM"`).
- **`watchpoint`**: A high-priority warning message shown in a highlighted panel, warning the evaluator of specific anomalies to look out for.
- **`tracks`**: Must contain exactly two sub-objects, `"A"` and `"B"`.
- **`tracks.[A/B].assigned_filename`**: Crucial string parameter indicating the expected filename structure (by convention, matching `"[id]_[A/B].[ext]"`).
- **`tags`**: Specific check items. The tag's `type` field must reference a key defined in the root-level `tagTypes` dictionary.

---

## 2. Hard Requirements, Rules, & Validation Constraints

To generate configurations that align with both the Python backend and the React frontend, you must observe the following rules:

### Rule 1: The "Worst-Rating-First" Ordering Convention

The ordering of options in the `ratingScale.options` array is semantically significant.

- **Requirement:** Place the lowest/worst rating value as the **first** element in the array.
- **Reason:** The React component `SummaryDashboard` automatically identifies flagged tags and items requiring immediate review by matching them against the first option (`options[0].value`). For example:
  ```json
  "options": [
    { "value": "RED", "icon": "🔴" }, // Must be first!
    { "value": "YELLOW", "icon": "🟡" },
    { "value": "GREEN", "icon": "🟢" }
  ]
  ```

### Rule 2: Tag Type Integrity

The backend schema validator executes cross-checks to ensure tag integrity.

- **Requirement:** Every `type` property defined inside `sections[].tags[]` must exactly match one of the top-level keys declared in the `tagTypes` object.
- **Failure Penalty:** Unregistered tag types will cause the API validation to reject the entire file.

### Rule 3: Unique IDs for `sectionQuestions`

- **Requirement:** No two questions within the `sectionQuestions` array may share the same `id`.
- **Failure Penalty:** The JSON schema compiler checks for uniqueness and rejects duplicates.

### Rule 4: Coherent Section IDs and Filenames

- **Requirement:** Keep section IDs strictly sequential and match the `assigned_filename` fields for tracks A and B accordingly.
- **Example:** For section `1`, use `"assigned_filename": "1_A.mp3"` and `"1_B.mp3"`. For section `2`, use `"2_A.mp3"` and `"2_B.mp3"`.

---

## 3. Semantic & Analytical Guidelines for LLM Generation

When designing evaluation suites for specific poems or literary works, apply these guidelines to build a high-fidelity dataset:

1. **Section Breakdown:** Split long poems into structural narrative chunks (stanzas, thematic shifts, or groups of 3-5 verses). Avoid sections that are too long (which makes it hard to pinpoint timestamps) or too short (which creates excessive clicking).
2. **Watchpoint Extraction:** Identify specific phonetic traps in the Arabic text. If a line contains difficult phonetic combinations (like gutturals, geminated consonants/shaddah, or tanween transition rules), explicitly list these in the `watchpoint` field so the evaluator can verify the synthesizer's articulation.
3. **Domain-Specific Tagging:** Divide your quality checks between structural musical domains (melody, composition) and engineering domains (vocals, clarity, mix). Keep tags concrete and measurable (e.g., target performance details rather than vague subjective criteria).
4. **Targeted Questions:** Use common section questions to target typical defects of generative engines like Suno (such as sudden tempo shifts, instrumental bleeding, or abrupt endings).

---

## 4. Complete Reference Template

This fully valid, tested template demonstrates all structural properties, conventions, and constraints. You can use it as a base when generating new configurations:

```json
{
  "schemaVersion": 1,
  "projectId": "mutanabbi_rhythm_v1",
  "title": "ديوان المتنبي — تقييم النسخ التوليدية",
  "subtitle": "دراسة مقارنة للأداء الموسيقي والنطق اللغوي",
  "poemTitle": "عَلى قَدْرِ أهْلِ العَزْم تأتِي العَزائِمُ",
  "brandLetter": "م",
  "footerNote": "نظام تقييم الأداء التوليدي - كافة الحقوق محفوظة",
  "ratingScale": {
    "id": "three_tier_standard",
    "options": [
      { "value": "RED", "icon": "🔴" },
      { "value": "YELLOW", "icon": "🟡" },
      { "value": "GREEN", "icon": "🟢" }
    ]
  },
  "tagTypes": {
    "vocal_engineering": {
      "label": "جودة وهندسة الصوت للفوكالز",
      "ratingLabels": {
        "RED": "ضوضاء / تداخل تآلفات أو تشويه رقمي",
        "YELLOW": "جودة صوت بشري معقولة ومقبولة",
        "GREEN": "تسجيل نقي، متوازن ومطابق لمعايير الاستوديو"
      }
    },
    "performance": {
      "label": "الأداء النغمي والالتزام بالمقام",
      "ratingLabels": {
        "RED": "نشاز / خروج صريح عن اللحن والمقام الموسيقي",
        "YELLOW": "أداء مقبول مع عيوب طفيفة في الانتقالات",
        "GREEN": "تدفق رائع وانسجام ممتاز مع هوية المقام"
      }
    }
  },
  "sectionQuestions": [
    {
      "id": "genre_drift",
      "label": "الهروب النغمي والانحراف غير المتوقع عن النوع (Genre Drift)؟",
      "type": "single_choice",
      "options": ["no", "yes"],
      "optionLabels": {
        "no": "لا يوجد، انتقال سلس ومتناسق",
        "yes": "نعم، حدث انحراف مفاجئ وصاخب"
      },
      "hasDetails": true,
      "detailsLabel": "حدد زمن حدوث الانحراف ونوعه بالثواني:"
    }
  ],
  "sections": [
    {
      "id": 1,
      "title": "القسم الأول — مطلع القصيدة",
      "meta": {
        "maqam": "حجاز",
        "tempo": "معتدل"
      },
      "description": "الأبيات الافتتاحية المحددة للجو العام للمقام الموسيقي والقصيدة",
      "watchpoint": "راقب نطق الشدّة في كلمتي (تأتِي) و (العَزائِمُ) وتجنب الإدغام الخاطئ لحروف الجر.",
      "specialQuestion": "هل تماشت الطبلة والإيقاع مع سرعة إلقاء المغني للكلمات؟",
      "lyrics": "عَلى قَدْرِ أهْلِ العَزْم تأتِي العَزائِمُ ... وَتأتي عَلى قَدْرِ الكِرامِ المَكارِمُ\nوَتَعْظُمُ في عَينِ الصّغيرِ صغارُها ... وَتَصْغُرُ في عَينِ العَظيمِ العَظائِمُ",
      "tracks": {
        "A": {
          "assigned_filename": "1_A.mp3",
          "clip_id": "suno_uuid_1001a",
          "styles": "Classic Arabic Maqam, Hijaz style, slow oud solo, clear male vocal"
        },
        "B": {
          "assigned_filename": "1_B.mp3",
          "clip_id": "suno_uuid_1001b",
          "styles": "Classic Arabic Maqam, Hijaz style, slow rhythm, acoustic arrangement"
        }
      },
      "tags": [
        {
          "id": "sec1_vocal_clarity",
          "tag": "vocal_clarity",
          "expected": "مخارج الحروف ونطق الميم والهاء بوضوح كامل دون تشويه أو تداخل أسطر",
          "type": "vocal_engineering"
        },
        {
          "id": "sec1_maqam_fidelity",
          "tag": "maqam_fidelity",
          "expected": "الحفاظ على المسار النغمي لمقام الحجاز دون أي قفزات عشوائية",
          "type": "performance"
        }
      ]
    }
  ]
}
```

# The LLM "Evaluation Session Architect" Guide: Generating `project.json` for Prompt A vs. Prompt B Comparison

This guide is designed for **Large Language Models (LLMs)** acting as "Evaluation Session Architects."

In this workflow, the user asks you (the LLM) to design two contrasting Suno text prompts (Prompt A and Prompt B) to generate music for a poem. To compare the outcomes, the user will not fill out manual Markdown files; instead, they will use a web-based evaluation app. Your job is to output a structured `project.json` file that configures this app.

Since you cannot know the user's local filenames or Suno Clip IDs ahead of time, you will use a **standardized mapping convention** that allows the app's UI to link the audio files to your prompts.

---

## 1. The Core Paradigm: Mapping Prompts to Tracks

When configuring the `tracks` object for any section, map Prompt A to version **A** and Prompt B to version **B**:

- **Prompt A (e.g., Classical Oud)** $\rightarrow$ **Track A** $\rightarrow$ Expected local filename: `[section_id]_A.mp3`
- **Prompt B (e.g., Arabesque Fusion)** $\rightarrow$ **Track B** $\rightarrow$ Expected local filename: `[section_id]_B.mp3`

### The Filename Convention

Explain to the user that they must download their generated audio from Suno and rename the files to match this simple format:

- Section 1, Prompt A generation $\rightarrow$ Rename to `1_A.mp3`
- Section 1, Prompt B generation $\rightarrow$ Rename to `1_B.mp3`

### Track Schema Configuration

For the JSON output, omit unknown parameters (like `clip_id` or `downloaded_at`) and focus on documenting the prompt styles inside the `styles` parameter so the user can see them in the app:

```json
"tracks": {
  "A": {
    "assigned_filename": "1_A.mp3",
    "styles": "[Insert the full Suno style prompt text you designed for Prompt A here]"
  },
  "B": {
    "assigned_filename": "1_B.mp3",
    "styles": "[Insert the full Suno style prompt text you designed for Prompt B here]"
  }
}
```

---

## 2. Step-by-Step JSON Generation Workflow for the LLM

When a user asks you to design Suno prompts and generate the evaluation configuration, follow these four steps:

### Step 1: Chunk the Poem into Sections

Divide the poem into logical sections (stanzas, strophes, or thematic shifts).

- Keep sections between 2 to 4 verses.
- Provide an incremental `id` starting at `1`.

### Step 2: Establish the Contrasting Prompts

Define the musical difference between Prompt A and Prompt B (e.g., Traditional Acoustic Oud vs. Modern Orchestral Synth). Keep these descriptions clearly labeled in the `styles` metadata of each track.

### Step 3: Design Targeted Evaluation Tags

Define 2 to 4 evaluation tags per section. Since you are contrasting two distinct prompts, write tags that specifically evaluate how well each prompt achieved its musical goals.

- _Example:_ If Prompt A is "Vocal Intimacy" and Prompt B is "Reverb Concert Hall", create a tag called `vocal_space_coherence` with the expected outcome: _"Check if Version A sounds intimate/dry, and Version B sounds spacious without washing out the lyrics."_

### Step 4: Write Global and Local Diagnostic Questions

- **`sectionQuestions` (Global):** Define 1 or 2 general questions that apply to all sections (e.g., _Genre Drift_, _Abrupt Transistions_, or _Instrumental Bleeding_).
- **`specialQuestion` (Per-Section):** Write a highly specific question targeting the thematic content or transition of that particular stanza.

---

## 3. Copy-Paste System Instructions for the Generator LLM

If you are setting up a system prompt to instruct an LLM to generate these projects, use the following configuration block:

````markdown
You are the "Evaluation Session Architect" for a Suno A/B testing suite.
The user will provide a poem and a request for contrasting musical styles (Prompt A vs. Prompt B).

Your task is to:

1. Design the two contrasting Suno prompts (Prompt A and Prompt B).
2. Generate a valid 'project.json' configuration file that the user can import directly into their rating app.

Follow these strict output rules:

- Set 'schemaVersion' to 1.
- Set 'projectId' using alphanumeric characters, dashes, and underscores only (e.g., "poem_test_v1").
- For each section, set tracks.A.assigned_filename to "[section_id]\_A.mp3" and tracks.B.assigned_filename to "[section_id]\_B.mp3".
- Put the exact Suno style prompts you designed into the 'styles' fields of the respective tracks.
- Do not include 'clip_id' or other unknown metadata fields.
- Ensure 'ratingScale.options' lists the worst rating option FIRST (e.g., "RED" before "GREEN") so the app's review dashboard registers flagged items properly.
- Ensure every tag in 'sections[].tags[]' refers to a key declared in the top-level 'tagTypes' dictionary.
- Output ONLY valid, raw JSON. Do not write introductory text, and do not wrap the JSON in conversational markdown, other than standard ```json code blocks.
````

---

## 4. Practical Generation Example

Below is a generated example comparing a **Traditional Acoustic** prompt against a **Modern Cinematic Drama** prompt for a classical Arabic poem:

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
      "meta": {
        "section_type": "Verse 1-2"
      },
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

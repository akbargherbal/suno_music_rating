/**
 * Shared synthetic fixtures for component tests.
 *
 * These are deliberately generic (no real poem/lyrics content) so tests stay
 * decoupled from any particular project's data, matching the fully dynamic,
 * server-driven architecture of ProjectData / EvaluationState.
 */

import { ProjectData, EvaluationState, SectionEvaluation } from "../types";

export function makeProject(overrides: Partial<ProjectData> = {}): ProjectData {
  return {
    schemaVersion: 1,
    projectId: "test_project",
    title: "مشروع اختبار",
    subtitle: "عنوان فرعي تجريبي",
    brandLetter: "ت",
    footerNote: "ملاحظة تذييل تجريبية",
    ratingScale: {
      id: "default",
      options: [
        { value: "RED", icon: "🔴" },
        { value: "YELLOW", icon: "🟡" },
        { value: "GREEN", icon: "🟢" },
      ],
    },
    tagTypes: {
      melody: {
        label: "اللحن",
        ratingLabels: { RED: "ضعيف", YELLOW: "مقبول", GREEN: "ممتاز" },
      },
    },
    sectionQuestions: [
      {
        id: "q1",
        label: "هل يوجد انقطاع؟",
        type: "single_choice",
        options: ["no", "yes"],
        optionLabels: { no: "لا", yes: "نعم" },
      },
    ],
    sections: [
      {
        id: 1,
        title: "الجمع والتقييم — فاتحة",
        meta: { maqam: "حجاز" },
        description: "وصف تجريبي للقسم",
        lyrics: "سطر تجريبي من النص",
        tracks: {
          A: {
            assigned_filename: "1_A.mp3",
            styles: "برومبت تجريبي",
            clip_id: "clipA",
          },
          B: { assigned_filename: "1_B.mp3", clip_id: "clipB" },
        },
        tags: [
          { id: "tag1", tag: "reverb", expected: "صدى خفيف", type: "melody" },
        ],
      },
      {
        id: 2,
        title: "النهاية والختام — خاتمة",
        lyrics: "سطر تجريبي آخر",
        tracks: {
          A: { assigned_filename: "2_A.mp3" },
          B: { assigned_filename: "2_B.mp3" },
        },
        tags: [
          { id: "tag2", tag: "tempo", expected: "إيقاع ثابت", type: "melody" },
        ],
      },
    ],
    ...overrides,
  };
}

export function makeSectionEvaluation(
  overrides: Partial<SectionEvaluation> = {},
): SectionEvaluation {
  return {
    sectionId: 1,
    answers: {},
    tagEvaluations: { tag1: { ratingA: null, ratingB: null } },
    notes: "",
    specialQuestionAnswer: "",
    generalSuccessA: true,
    generalSuccessB: true,
    preferredVersion: null,
    ...overrides,
  };
}

export function makeEvaluationState(project: ProjectData): EvaluationState {
  const state: EvaluationState = {};
  project.sections.forEach((sec) => {
    const tagEvaluations: SectionEvaluation["tagEvaluations"] = {};
    sec.tags.forEach((t) => {
      tagEvaluations[t.id] = { ratingA: null, ratingB: null };
    });
    state[sec.id] = makeSectionEvaluation({
      sectionId: sec.id,
      tagEvaluations,
    });
  });
  return state;
}

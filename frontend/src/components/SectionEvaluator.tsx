/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { SectionData, SectionEvaluation, ProjectData } from "../types";
import AudioPlayer from "./AudioPlayer";
import {
  AlertCircle,
  HelpCircle,
  ArrowLeft,
  ArrowRight,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SectionEvaluatorProps {
  project: ProjectData;
  section: SectionData;
  evaluation: SectionEvaluation;
  audioUrls: { A: string | null; B: string | null };
  onChange: (updatedEvaluation: SectionEvaluation) => void;
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isLast: boolean;
  sectionIndex: number;
  sectionCount: number;
}

const ACCENT = {
  A: {
    text: "text-amber",
    radio: "accent-amber",
    optionActive: "bg-amber/10 border-amber/50 text-gold-deep font-bold",
    focus: "focus:border-amber",
    dot: "bg-amber",
  },
  B: {
    text: "text-sage",
    radio: "accent-sage",
    optionActive: "bg-sage/10 border-sage/50 text-sage font-bold",
    focus: "focus:border-sage",
    dot: "bg-sage",
  },
} as const;

export default function SectionEvaluator({
  project,
  section,
  evaluation,
  audioUrls,
  onChange,
  onNext,
  onPrev,
  isFirst,
  isLast,
  sectionIndex,
  sectionCount,
}: SectionEvaluatorProps) {
  const [showMetadata, setShowMetadata] = useState(false);
  const [syncTime, setSyncTime] = useState(true);
  const [lastTimeA, setLastTimeA] = useState<number>(0);
  const [lastTimeB, setLastTimeB] = useState<number>(0);

  const updateEvaluationField = <K extends keyof SectionEvaluation>(
    field: K,
    value: SectionEvaluation[K],
  ) => {
    onChange({ ...evaluation, [field]: value });
  };

  const updateAnswer = (
    questionId: string,
    version: "A" | "B",
    value: string,
  ) => {
    const current = evaluation.answers[questionId] || {
      A: null,
      B: null,
      detailsA: "",
      detailsB: "",
    };
    onChange({
      ...evaluation,
      answers: {
        ...evaluation.answers,
        [questionId]: { ...current, [version]: value },
      },
    });
  };

  const updateAnswerDetails = (
    questionId: string,
    field: "detailsA" | "detailsB",
    value: string,
  ) => {
    const current = evaluation.answers[questionId] || {
      A: null,
      B: null,
      detailsA: "",
      detailsB: "",
    };
    onChange({
      ...evaluation,
      answers: {
        ...evaluation.answers,
        [questionId]: { ...current, [field]: value },
      },
    });
  };

  const handleTagRatingChange = (
    tagId: string,
    version: "A" | "B",
    rating: string | null,
  ) => {
    const current = evaluation.tagEvaluations[tagId] || {
      ratingA: null,
      ratingB: null,
    };
    const updated = {
      ...current,
      [version === "A" ? "ratingA" : "ratingB"]: rating,
    };
    onChange({
      ...evaluation,
      tagEvaluations: { ...evaluation.tagEvaluations, [tagId]: updated },
    });
  };

  const handleTimeUpdateA = (time: number) => {
    setLastTimeA(time);
    if (syncTime) setLastTimeB(time);
  };
  const handleTimeUpdateB = (time: number) => {
    setLastTimeB(time);
    if (syncTime) setLastTimeA(time);
  };

  const ratingOptions = project.ratingScale.options;
  const ratedTagsCount = Object.values(evaluation.tagEvaluations).filter(
    (t) => t.ratingA !== null || t.ratingB !== null,
  ).length;
  const totalTagsCount = section.tags.length;
  const metaEntries = Object.entries(section.meta || {});

  return (
    <div
      id={`section-evaluator-${section.id}`}
      className="space-y-6 text-right dir-rtl font-body pb-12"
    >
      {/* Section Header */}
      <div className="bg-paper-raised border border-line p-6 rounded-2xl flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="border border-gold text-gold-deep font-latin px-3 py-1 rounded-full text-[12.5px]">
              القسم {section.id}
            </span>
            {metaEntries.map(([key, value]) => (
              <span
                key={key}
                className="border border-line text-ink-soft font-latin px-3 py-1 rounded-full text-[12.5px] bg-paper-sunk"
              >
                {key}: {value}
              </span>
            ))}
          </div>
          <h2 className="text-[28px] font-display text-ink mt-3 font-bold">
            {section.title}
          </h2>
          {section.description && (
            <p className="text-ink-soft text-[15px] mt-1">
              {section.description}
            </p>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            id="btn-prev-section"
            onClick={onPrev}
            disabled={isFirst}
            className="w-9 h-9 rounded-full border border-gold bg-paper-sunk text-gold-deep hover:bg-line/60 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center cursor-pointer"
            title="القسم السابق"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <span className="font-latin italic text-[13px] text-ink-faint px-1">
            {sectionIndex} من {sectionCount}
          </span>
          <button
            id="btn-next-section"
            onClick={onNext}
            disabled={isLast}
            className="w-9 h-9 rounded-full border border-gold bg-paper-sunk text-gold-deep hover:bg-line/60 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center cursor-pointer"
            title="القسم التالي"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Watchpoint banner */}
      {section.watchpoint && (
        <div className="border border-burgundy bg-burgundy/[0.06] rounded-xl p-4 flex items-start gap-3.5">
          <Info className="w-5 h-5 text-burgundy shrink-0 mt-0.5" />
          <div>
            <h4 className="font-display text-[15px] text-burgundy font-bold">
              نقطة المراقبة والتحقق
            </h4>
            <p className="text-[14.5px] text-[#6b4444] mt-1.5 leading-relaxed">
              {section.watchpoint}
            </p>
          </div>
        </div>
      )}

      {/* Lyrics & Metadata Toggles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-paper-raised border border-line rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
            <h3 className="font-display text-[15px] text-gold-deep font-bold">
              النص والكلمات
            </h3>
          </div>
          <div className="bg-paper-sunk p-5 rounded-xl border border-line overflow-y-auto max-h-[350px] font-display text-[19px] leading-[2.3] text-ink whitespace-pre-wrap select-text dir-rtl text-center">
            {section.lyrics}
          </div>
        </div>

        <div className="bg-paper-raised border border-line rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
              <h3 className="font-display text-[15px] text-gold-deep font-bold">
                ميتاداتا التوليد
              </h3>
            </div>
            <p className="text-[13.5px] text-ink-soft mb-4 leading-relaxed">
              انقر على الزر أدناه لمعاينة ميتاداتا التوليد والبرومبت المستخدم
              للنسختين A وB.
            </p>

            <button
              id="btn-toggle-metadata"
              onClick={() => setShowMetadata(!showMetadata)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-full bg-paper-sunk border border-gold text-ink hover:bg-line/60 transition-all text-sm cursor-pointer"
            >
              <span>
                {showMetadata
                  ? "إخفاء ميتاداتا التوليد"
                  : "عرض ميتاداتا التوليد بالتفصيل"}
              </span>
              {showMetadata ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            <AnimatePresence>
              {showMetadata && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mt-3 space-y-3"
                >
                  <div className="p-3 bg-paper-sunk border border-line rounded-lg font-latin text-xs text-ink-soft max-h-[220px] overflow-y-auto space-y-2">
                    {section.tracks.A.styles && (
                      <div>
                        <span className="text-sage font-bold block mb-1">
                          البرومبت المشترك:
                        </span>
                        <p className="text-[11px] leading-normal whitespace-pre-wrap">
                          {section.tracks.A.styles}
                        </p>
                      </div>
                    )}
                    {section.tracks.A.clip_id && (
                      <div className="border-t border-line pt-2">
                        <span className="text-amber font-bold block mb-1">
                          Clip ID A:
                        </span>
                        <p className="text-[10px] text-ink-faint font-bold">
                          {section.tracks.A.clip_id}
                        </p>
                      </div>
                    )}
                    {section.tracks.B.clip_id && (
                      <div className="border-t border-line pt-2">
                        <span className="text-sage font-bold block mb-1">
                          Clip ID B:
                        </span>
                        <p className="text-[10px] text-ink-faint font-bold">
                          {section.tracks.B.clip_id}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Interactive Listening Deck */}
      <div className="bg-paper-raised border border-line rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 border-b border-line pb-4">
          <div>
            <h3 className="font-display text-lg text-ink font-bold">
              منصة الاستماع والمقارنة الزمنية المتزامنة
            </h3>
            <p className="text-[13px] text-ink-soft mt-1">
              اسمح بمزامنة التوقيت للقفز بين الأغنيتين في نفس الثانية وسماع
              الفروقات بدقة متناهية.
            </p>
          </div>
          <div className="flex items-center gap-2.5 bg-paper-sunk px-3 py-1.5 rounded-lg border border-line">
            <label
              className="text-xs text-ink-soft font-body cursor-pointer"
              htmlFor="sync-time-checkbox"
            >
              مزامنة زمن الاستماع بين النسختين
            </label>
            <input
              id="sync-time-checkbox"
              type="checkbox"
              checked={syncTime}
              onChange={(e) => setSyncTime(e.target.checked)}
              className="w-4 h-4 accent-gold border-line rounded bg-paper-raised cursor-pointer"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AudioPlayer
            src={audioUrls.A}
            filename={section.tracks.A.assigned_filename}
            version="A"
            externalTime={syncTime ? lastTimeB : undefined}
            onTimeUpdate={handleTimeUpdateA}
          />
          <AudioPlayer
            src={audioUrls.B}
            filename={section.tracks.B.assigned_filename}
            version="B"
            externalTime={syncTime ? lastTimeA : undefined}
            onTimeUpdate={handleTimeUpdateB}
          />
        </div>
      </div>

      {/* Dynamic per-section questions, driven entirely by project.sectionQuestions */}
      {project.sectionQuestions.length > 0 && (
        <div
          className={`grid grid-cols-1 gap-6 ${project.sectionQuestions.length > 1 ? "lg:grid-cols-2" : ""}`}
        >
          {project.sectionQuestions.map((q) => {
            const answer = evaluation.answers[q.id] || {
              A: null,
              B: null,
              detailsA: "",
              detailsB: "",
            };
            const options = q.options || [];
            return (
              <div
                key={q.id}
                className="bg-paper-raised border border-line rounded-2xl p-6 space-y-4"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-gold/10 text-gold-deep shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <h3 className="font-display text-lg text-ink font-bold">
                    {q.label}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {(["A", "B"] as const).map((version) => {
                    const accent = ACCENT[version];
                    const currentValue = answer[version];
                    const showDetails =
                      q.hasDetails &&
                      currentValue &&
                      currentValue !== options[0];
                    return (
                      <div
                        key={version}
                        className="p-4 rounded-xl bg-paper-sunk border border-line space-y-3"
                      >
                        <h4 className={`text-xs font-bold ${accent.text}`}>
                          النسخة {version}:
                        </h4>
                        <div className="flex flex-col gap-2">
                          {options.map((opt) => (
                            <label
                              key={opt}
                              className={`flex items-center gap-2.5 p-2 rounded-lg text-xs cursor-pointer border transition-all ${
                                currentValue === opt
                                  ? accent.optionActive
                                  : "bg-paper-raised border-transparent text-ink-soft hover:text-ink"
                              }`}
                            >
                              <input
                                type="radio"
                                name={`${q.id}-${version}-${section.id}`}
                                value={opt}
                                checked={currentValue === opt}
                                onChange={() =>
                                  updateAnswer(q.id, version, opt)
                                }
                                className={accent.radio}
                              />
                              {q.optionLabels?.[opt] || opt}
                            </label>
                          ))}
                        </div>
                        {showDetails && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <label className="block text-[11px] text-ink-soft mb-1 font-bold">
                              {q.detailsLabel || "تفاصيل إضافية:"}
                            </label>
                            <input
                              type="text"
                              value={
                                version === "A"
                                  ? answer.detailsA || ""
                                  : answer.detailsB || ""
                              }
                              onChange={(e) =>
                                updateAnswerDetails(
                                  q.id,
                                  version === "A" ? "detailsA" : "detailsB",
                                  e.target.value,
                                )
                              }
                              className={`w-full bg-paper-raised border border-line rounded-lg px-3 py-1.5 text-xs text-ink focus:outline-none ${accent.focus} font-body`}
                            />
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tags Evaluation Sheet — driven by section.tags + project.tagTypes + project.ratingScale */}
      {section.tags.length > 0 && (
        <div className="bg-paper-raised border border-line rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-line">
            <h3 className="font-display text-[19px] text-ink font-bold">
              تقييم تاقات الأقسام
            </h3>
            <p className="text-[13px] text-ink-soft mt-1">
              قيّم أداء كل عنصر لكل نسخة وفق مقياس التقييم المعتمد.
            </p>
          </div>

          {/* Legend, generated from project.tagTypes */}
          <div className="flex flex-wrap items-center gap-4 bg-paper-sunk p-3 border-b border-line text-xs">
            {Object.entries(project.tagTypes).map(([typeKey, typeDef]) => (
              <div key={typeKey} className="flex items-center gap-2">
                <span className="font-bold text-ink-soft">
                  {typeDef.label}:
                </span>
                {ratingOptions.map((opt) => (
                  <span key={opt.value} className="text-ink-soft">
                    {opt.icon} {typeDef.ratingLabels[opt.value] || opt.value}
                  </span>
                ))}
              </div>
            ))}
          </div>

          <div>
            {section.tags.map((tag, idx) => {
              const typeDef = project.tagTypes[tag.type];
              const tagRating = evaluation.tagEvaluations[tag.id] || {
                ratingA: null,
                ratingB: null,
              };
              return (
                <div
                  key={tag.id}
                  id={`tag-row-${tag.id}`}
                  className="p-5 border-t border-line hover:bg-paper-sunk/40 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 lg:max-w-[45%]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-latin text-xs font-bold text-ink-faint bg-paper-sunk px-2 py-0.5 rounded">
                        #{idx + 1}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border border-line text-gold-deep">
                        {typeDef?.label || tag.type}
                      </span>
                      <span className="font-display text-base text-ink font-bold">
                        {tag.tag}
                      </span>
                    </div>
                    <div className="flex items-start gap-1">
                      <span className="text-[11px] text-ink-faint font-bold whitespace-nowrap pt-0.5">
                        المتوقع منه:
                      </span>
                      <p className="text-[13.5px] text-ink-soft leading-relaxed">
                        {tag.expected}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 shrink-0 bg-paper-sunk p-3 rounded-xl border border-line">
                    {(["A", "B"] as const).map((version) => (
                      <div key={version} className="space-y-2">
                        <span className="font-latin italic text-xs text-ink-faint">
                          {version}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {ratingOptions.map((opt) => {
                            const current =
                              version === "A"
                                ? tagRating.ratingA
                                : tagRating.ratingB;
                            const isActive = current === opt.value;
                            return (
                              <button
                                key={opt.value}
                                id={`btn-tag-${tag.id}-${version}-${opt.value}`}
                                onClick={() =>
                                  handleTagRatingChange(
                                    tag.id,
                                    version,
                                    isActive ? null : opt.value,
                                  )
                                }
                                className={`w-[30px] h-[30px] rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                                  isActive
                                    ? "border-gold bg-gold/20"
                                    : "border-line bg-paper-raised text-ink-faint"
                                }`}
                                title={
                                  typeDef?.ratingLabels[opt.value] || opt.value
                                }
                              >
                                <span className="text-[13px]">
                                  {opt.icon || opt.value[0]}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Notes & Special Questions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-paper-raised border border-line rounded-2xl p-6 space-y-5">
          <h3 className="font-display text-lg text-ink border-b border-line pb-3 font-bold">
            الأسئلة والتدوينات
          </h3>

          {section.specialQuestion && (
            <div className="space-y-2 bg-gold/5 p-4 rounded-xl border border-gold/20">
              <label
                htmlFor="special-question-textarea"
                className="block text-sm font-bold text-gold-deep flex items-center gap-1.5"
              >
                <HelpCircle className="w-4 h-4" /> {section.specialQuestion}
              </label>
              <textarea
                id="special-question-textarea"
                rows={3}
                value={evaluation.specialQuestionAnswer}
                onChange={(e) =>
                  updateEvaluationField("specialQuestionAnswer", e.target.value)
                }
                placeholder="سجل انطباعك وإجابتك التفصيلية هنا..."
                className="w-full bg-paper-sunk border border-line rounded-xl p-3 text-sm text-ink focus:outline-none focus:border-gold font-body leading-relaxed text-right dir-rtl"
              />
            </div>
          )}

          <div className="space-y-2">
            <label
              htmlFor="section-notes-textarea"
              className="block font-display text-[15px] text-gold-deep"
            >
              ملاحظات حرة وانطباعات المستمع العامة لهذا القسم
            </label>
            <textarea
              id="section-notes-textarea"
              rows={4}
              value={evaluation.notes}
              onChange={(e) => updateEvaluationField("notes", e.target.value)}
              placeholder="اكتب ملاحظاتك الفنية، مواطن الجمال، أو أي مشاكل لم تغطها التاقات الفردية..."
              className="w-full bg-paper-sunk border border-line rounded-xl p-3.5 text-[15px] text-ink focus:outline-none focus:border-gold font-body leading-relaxed text-right dir-rtl resize-vertical"
            />
          </div>
        </div>

        <div className="bg-paper-raised border border-line rounded-2xl p-6 flex flex-col justify-between">
          <div className="space-y-5">
            <h3 className="font-display text-lg text-ink border-b border-line pb-3 font-bold">
              النتيجة والخلاصة العامة للقسم
            </h3>

            <div className="space-y-3">
              <label className="block text-xs font-extrabold text-ink-faint uppercase tracking-wide">
                النجاح الفني العام للقسم (هل نجح؟)
              </label>

              {(["A", "B"] as const).map((version) => {
                const success =
                  version === "A"
                    ? evaluation.generalSuccessA
                    : evaluation.generalSuccessB;
                const field =
                  version === "A" ? "generalSuccessA" : "generalSuccessB";
                return (
                  <div
                    key={version}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-paper-sunk border border-line"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${ACCENT[version].dot}`}
                      ></span>
                      <span className="text-sm font-bold text-ink">
                        النسخة {version}
                      </span>
                    </div>
                    <button
                      id={`btn-success-${version}`}
                      onClick={() => updateEvaluationField(field, !success)}
                      className={`font-latin px-3 py-1.5 rounded-full text-xs transition-all border cursor-pointer ${
                        success
                          ? "border-sage text-sage bg-sage/10"
                          : "border-burgundy/40 text-burgundy bg-burgundy/10"
                      }`}
                    >
                      {" "}
                      {success ? "ناجحة" : "غير ناجحة"}{" "}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2.5 pt-1">
              <label className="block text-xs font-extrabold text-ink-faint uppercase tracking-wide">
                النسخة المفضلة من قبلك لهذا القسم:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "A", label: "النسخة A ⭐" },
                  { value: "B", label: "النسخة B ⭐" },
                  { value: "both", label: "كلاهما مقبول" },
                  { value: "neither", label: "لا شيء / يعاد" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    id={`btn-preferred-${opt.value}`}
                    onClick={() =>
                      updateEvaluationField(
                        "preferredVersion",
                        opt.value as any,
                      )
                    }
                    className={`p-2.5 rounded-lg text-sm transition-all border cursor-pointer ${
                      evaluation.preferredVersion === opt.value
                        ? "border-gold text-gold-deep bg-gold/10 font-bold"
                        : "border-line bg-paper-sunk text-ink-soft hover:text-ink"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-line text-center font-latin italic text-[13px] text-ink-faint">
            تم تقييم {ratedTagsCount} من أصل {totalTagsCount} تاقات
          </div>
        </div>
      </div>
    </div>
  );
}

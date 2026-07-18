/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EvaluationState, ProjectData } from '../types';
import { Check, X, Copy, Download, Upload, Lightbulb, Music, Award } from 'lucide-react';
import { useState, ChangeEvent } from 'react';

interface SummaryDashboardProps {
  project: ProjectData;
  evaluations: EvaluationState;
  onImportState: (state: EvaluationState) => void;
  onReset: () => void;
}

export default function SummaryDashboard({ project, evaluations, onImportState, onReset }: SummaryDashboardProps) {
  const [copied, setCopied] = useState(false);
  const sections = project.sections;
  const worstRatingValue = project.ratingScale.options[0]?.value; // convention: worst option listed first

  const totalTagsEvaluated = Object.values(evaluations).reduce((sum, s) => {
    return sum + Object.values(s.tagEvaluations).filter((t) => t.ratingA !== null || t.ratingB !== null).length;
  }, 0);
  const totalTagsCount = sections.reduce((sum, sec) => sum + sec.tags.length, 0);

  const completedSections = sections.filter((sec) => {
    const e = evaluations[sec.id];
    if (!e) return false;
    return sec.tags.every((t) => {
      const r = e.tagEvaluations[t.id];
      return r && r.ratingA !== null && r.ratingB !== null;
    });
  }).length;

  const preferredCount = Object.values(evaluations).reduce(
    (acc, s) => {
      if (s.preferredVersion === 'A') acc.A++;
      else if (s.preferredVersion === 'B') acc.B++;
      else if (s.preferredVersion === 'both') acc.both++;
      else if (s.preferredVersion === 'neither') acc.neither++;
      return acc;
    },
    { A: 0, B: 0, both: 0, neither: 0 }
  );

  // Generic cross-section insight #1: for every question the project defines,
  // how many sections landed on each answer, per version.
  const questionBreakdown = project.sectionQuestions.map((q) => {
    const counts: Record<string, { A: number; B: number }> = {};
    (q.options || []).forEach((opt) => (counts[opt] = { A: 0, B: 0 }));
    sections.forEach((sec) => {
      const answer = evaluations[sec.id]?.answers[q.id];
      if (!answer) return;
      if (answer.A && counts[answer.A]) counts[answer.A].A++;
      if (answer.B && counts[answer.B]) counts[answer.B].B++;
    });
    return { question: q, counts };
  });

  // Generic cross-section insight #2: tags with the worst rating (first
  // option in ratingScale, by convention) show up here.
  const flaggedTags = sections.flatMap((sec) => {
    const e = evaluations[sec.id];
    if (!e) return [];
    return sec.tags
      .map((tag) => {
        const r = e.tagEvaluations[tag.id];
        if (!r) return null;
        const flaggedA = r.ratingA === worstRatingValue;
        const flaggedB = r.ratingB === worstRatingValue;
        if (!flaggedA && !flaggedB) return null;
        return { sectionTitle: sec.title, tag: tag.tag, flaggedA, flaggedB };
      })
      .filter(Boolean) as { sectionTitle: string; tag: string; flaggedA: boolean; flaggedB: boolean }[];
  });

  // Safe concatenation to prevent any Windows/Python backslash swallowing bugs
  const generateMarkdownReport = () => {
    let md = "# " + project.title + " — تقرير التقييم العام\\n\\n";
    md += "**تاريخ التصدير:** " + new Date().toISOString().slice(0, 10) + " | **التقدم الإجمالي:** " + totalTagsEvaluated + " من أصل " + totalTagsCount + " تاقاً.\\n\\n";
    md += "---\\n\\n";

    sections.forEach((sec) => {
      const e = evaluations[sec.id];
      if (!e) return;
      const metaStr = Object.entries(sec.meta || {})
        .map(([k, v]) => k + ": " + v)
        .join(', ');
      md += "## " + sec.title + (metaStr ? " (" + metaStr + ")" : "") + "\\n\\n";

      if (project.sectionQuestions.length > 0) {
        md += "### أسئلة القسم الفنية\\n\\n";
        project.sectionQuestions.forEach((q) => {
          const answer = e.answers[q.id];
          md += "#### " + q.label + "\\n";
          (["A", "B"] as const).forEach((v) => {
            const val = answer?.[v];
            const label = val ? q.optionLabels?.[val] || val : 'لم تُجب';
            md += "* **النسخة " + v + ":** " + label + "\\n";
            const details = v === 'A' ? answer?.detailsA : answer?.detailsB;
            if (details) md += "  - تفاصيل إضافية: " + details + "\\n";
          });
          md += "\\n";
        });
      }

      if (sec.tags.length > 0) {
        md += "### تقييم التاقات بالتفصيل\\n\\n";
        md += "| التاق | المتوقع منه | تقييم A | تقييم B |\\n";
        md += "|---|---|---|---|\\n";
        sec.tags.forEach((tag) => {
          const r = e.tagEvaluations[tag.id];
          const typeDef = project.tagTypes[tag.type];
          const labelFor = (val: string | null) =>
            val ? typeDef?.ratingLabels[val] || val : 'غير مقيم';
          md += "| `" + tag.tag + "` | " + tag.expected + " | " + labelFor(r?.ratingA ?? null) + " | " + labelFor(r?.ratingB ?? null) + " |\\n";
        });
        md += "\\n";
      }

      if (sec.specialQuestion) {
        md += "**سؤال القسم الخاص:** " + sec.specialQuestion + "\\n";
        md += "> الإجابة: " + (e.specialQuestionAnswer || 'لا توجد إجابة مسجلة') + "\\n\\n";
      }

      md += "* **ملاحظات حرة:**\\n```\\n" + (e.notes || 'لا توجد ملاحظات إضافية') + "\\n```\\n\\n";
      md += "* **النجاح العام:** النسخة A: " + (e.generalSuccessA ? '🟢 ناجح' : '🔴 غير ناجح') + " | النسخة B: " + (e.generalSuccessB ? '🟢 ناجح' : '🔴 غير ناجح') + "\\n";
      md += "* **النسخة المفضلة:** " + (e.preferredVersion?.toUpperCase() || 'غير محددة') + "\\n\\n";
      md += "---\\n\\n";
    });

    md += "## ملخص تفضيل النسخ\\n\\n";
    md += "النسخة A مفضلة في (" + preferredCount.A + ") أقسام، النسخة B مفضلة في (" + preferredCount.B + ") أقسام، كلاهما مقبول في (" + preferredCount.both + ") أقسام، ولا شيء مقبول في (" + preferredCount.neither + ") أقسام.\\n\\n";

    if (flaggedTags.length > 0) {
      md += "## تاقات بحاجة لمراجعة فنية دقيقة (حصلت على أسوأ تقييم)\\n\\n";
      flaggedTags.forEach((f) => {
        md += "* **" + f.sectionTitle + "** — التاق: `" + f.tag + "` في (النسخة: " + [f.flaggedA && 'A', f.flaggedB && 'B'].filter(Boolean).join(' و ') + ")\\n";
      });
    }

    return md;
  };

  const copyToClipboard = () => {
    const md = generateMarkdownReport();
    navigator.clipboard.writeText(md).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const downloadJsonState = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(evaluations, null, 2));
    const anchor = document.createElement('a');
    anchor.setAttribute('href', dataStr);
    anchor.setAttribute('download', `${project.projectId}_evaluations_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        onImportState(parsed);
        alert('📊 تم استيراد حالة التقييم بنجاح!');
      } catch {
        alert('❌ فشل قراءة الملف، يرجى التأكد من اختيار ملف JSON صحيح.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div id="summary-dashboard" className="space-y-8 text-right dir-rtl font-body pb-12">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-paper-raised border border-line p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-ink-soft font-bold">التقدم الإجمالي</span>
            <h3 className="text-2xl font-display text-ink mt-1 font-bold">
              {totalTagsEvaluated} <span className="text-sm text-ink-faint font-body font-normal">/ {totalTagsCount} تاقاً</span>
            </h3>
          </div>
          <div className="p-3 bg-gold/10 text-gold-deep rounded-xl">
            <Music className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-paper-raised border border-line p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-ink-soft font-bold">الأقسام المكتملة</span>
            <h3 className="text-2xl font-display text-ink mt-1 font-bold">
              {completedSections} <span className="text-sm text-ink-faint font-body font-normal">/ {sections.length} أقسام</span>
            </h3>
          </div>
          <div className="p-3 bg-sage/10 text-sage rounded-xl">
            <Check className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-paper-raised border border-line p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-ink-soft font-bold">فوز النسخة A</span>
            <h3 className="text-2xl font-display text-amber mt-1 font-bold">
              {preferredCount.A} <span className="text-sm text-ink-faint font-body font-normal">أقسام</span>
            </h3>
          </div>
          <div className="p-3 bg-amber/10 text-amber rounded-xl">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-paper-raised border border-line p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-ink-soft font-bold">فوز النسخة B</span>
            <h3 className="text-2xl font-display text-sage mt-1 font-bold">
              {preferredCount.B} <span className="text-sm text-ink-faint font-body font-normal">أقسام</span>
            </h3>
          </div>
          <div className="p-3 bg-sage/10 text-sage rounded-xl">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Final Summary Table — columns generated dynamically */}
      <div className="bg-paper-raised border border-line rounded-2xl p-6">
        <h3 className="font-display text-xl text-ink mb-4 font-bold">جدول الخلاصة والملخص النهائي</h3>

        <div className="overflow-x-auto">
          <table id="final-summary-table" className="w-full text-right border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-ink-faint font-bold text-xs">
                <th className="py-3 px-4">القسم</th>
                <th className="py-3 px-4 text-center">نجاح A؟</th>
                <th className="py-3 px-4 text-center">نجاح B؟</th>
                {project.sectionQuestions.map((q) => (
                  <th key={q.id} className="py-3 px-4" colSpan={2}>
                    {q.label}
                  </th>
                ))}
                <th className="py-3 px-4 text-center">النسخة المفضلة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60 font-medium">
              {sections.map((sec) => {
                const e = evaluations[sec.id];
                if (!e) return null;
                return (
                  <tr key={sec.id} id={`summary-row-${sec.id}`} className="hover:bg-paper-sunk/50 transition-all">
                    <td className="py-4 px-4 font-display text-ink font-bold">{sec.title}</td>
                    <td className="py-4 px-4 text-center">
                      {e.generalSuccessA ? <Check className="w-5 h-5 text-sage mx-auto" /> : <X className="w-5 h-5 text-burgundy mx-auto" />}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {e.generalSuccessB ? <Check className="w-5 h-5 text-sage mx-auto" /> : <X className="w-5 h-5 text-burgundy mx-auto" />}
                    </td>
                    {project.sectionQuestions.map((q) => {
                      const answer = e.answers[q.id];
                      const renderVal = (val: string | null | undefined) => {
                        if (!val) return <span className="text-ink-faint">—</span>;
                        const label = q.optionLabels?.[val] || val;
                        // By convention, index 1 is the failure/worst option (e.g. Yes for drift)
                        const isWorst = val === (q.options || [])[1];
                        return (
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${isWorst ? 'border-burgundy/40 text-burgundy font-bold' : 'border-sage/40 text-sage'}`}>
                            {label}
                          </span>
                        );
                      };
                      return (
                        <td key={q.id} className="py-4 px-2" colSpan={2}>
                          <div className="flex items-center gap-2">
                            {renderVal(answer?.A)}
                            {renderVal(answer?.B)}
                          </div>
                        </td>
                      );
                    })}
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full border ${
                          e.preferredVersion === 'A'
                            ? 'border-amber text-amber bg-amber/10'
                            : e.preferredVersion === 'B'
                            ? 'border-sage text-sage bg-sage/10'
                            : e.preferredVersion === 'both'
                            ? 'border-gold text-gold-deep bg-gold/10'
                            : 'border-line text-ink-faint bg-paper-sunk'
                        }`}
                      >
                        {e.preferredVersion === 'A'
                          ? 'النسخة A ⭐'
                          : e.preferredVersion === 'B'
                          ? 'النسخة B ⭐'
                          : e.preferredVersion === 'both'
                          ? 'كلاهما مقبول'
                          : e.preferredVersion === 'neither'
                          ? 'إعادة توليد'
                          : 'معلق'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cross-section insights — computed generically */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {questionBreakdown.map(({ question, counts }) => (
          <div key={question.id} className="bg-paper-raised border border-line rounded-2xl p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gold/10 text-gold-deep rounded-lg">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <h4 className="font-display text-base text-ink font-bold">{question.label} — عبر كل الأقسام</h4>
              </div>
              <div className="p-4 bg-paper-sunk border border-line rounded-xl space-y-2">
                {Object.entries(counts).map(([opt, c]) => (
                  <div key={opt} className="flex items-center justify-between text-xs text-ink-soft">
                    <span>{question.optionLabels?.[opt] || opt}</span>
                    <span className="font-latin font-bold">A: {c.A} · B: {c.B}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        <div className="bg-paper-raised border border-line rounded-2xl p-6 flex flex-col justify-between lg:col-span-2">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-burgundy/10 text-burgundy rounded-lg">
                <Lightbulb className="w-5 h-5" />
              </div>
              <h4 className="font-display text-base text-ink font-bold">تاقات بحاجة لمراجعة (حصلت على أسوأ تقييم متكرر)</h4>
            </div>
            {flaggedTags.length === 0 ? (
              <p className="text-xs text-ink-soft">لا توجد تاقات حصلت على أسوأ تقييم حتى الآن. ✅</p>
            ) : (
              <div className="p-4 bg-paper-sunk border border-line rounded-xl space-y-2 max-h-48 overflow-y-auto">
                {flaggedTags.map((f, i) => (
                  <div key={i} className="text-xs text-ink-soft flex items-center justify-between gap-2">
                    <span className="truncate">
                      {f.sectionTitle} — <code>{f.tag}</code>
                    </span>
                    <span className="font-latin text-burgundy shrink-0 font-bold">
                      {[f.flaggedA && 'A', f.flaggedB && 'B'].filter(Boolean).join(' / ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Export & Copy Center */}
      <div className="bg-paper-raised border border-line rounded-2xl p-8 text-center space-y-6">
        <div className="max-w-xl mx-auto space-y-2">
          <h3 className="font-display text-xl text-ink font-bold">مركز الحفظ وتصدير التقارير</h3>
          <p className="text-sm text-ink-soft leading-relaxed">
            يمكنك نسخ التقرير كاملاً بصيغة ماركداون لمشاركته، أو تصدير/استيراد حالة العمل كملف JSON.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            id="btn-copy-markdown"
            onClick={copyToClipboard}
            className={`px-5 py-3 rounded-full font-bold text-sm flex items-center gap-2 transition-all cursor-pointer border ${
              copied ? 'bg-sage text-paper-raised border-sage' : 'bg-gold text-paper-raised border-gold hover:bg-gold-deep'
            }`}
          >
            <Copy className="w-4 h-4" />
            <span>{copied ? 'تم نسخ تقرير Markdown!' : 'نسخ التقرير كاملاً لـ Markdown'}</span>
          </button>

          <button
            id="btn-export-json"
            onClick={downloadJsonState}
            className="px-5 py-3 rounded-full bg-paper-sunk border border-line text-ink-soft hover:text-ink hover:bg-line/40 font-bold text-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>تصدير حالة العمل لملف JSON</span>
          </button>

          <label
            id="label-import-json"
            className="px-5 py-3 rounded-full bg-paper-sunk border border-line text-ink-soft hover:text-ink hover:bg-line/40 font-bold text-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>استيراد حالة العمل السابقة</span>
            <input id="input-import-json-file" type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        <div className="pt-6 border-t border-line max-w-sm mx-auto">
          <button
            id="btn-reset-evaluation"
            onClick={() => {
              if (confirm('⚠️ هل أنت متأكد من مسح جميع بيانات التقييم المسجلة؟ لا يمكن استرجاعها بعد الحذف.')) {
                onReset();
              }
            }}
            className="text-xs font-bold text-burgundy/80 hover:text-burgundy transition-all underline cursor-pointer"
          >
            إعادة تعيين وبدء جلسة تقييم فارغة جديدة
          </button>
        </div>
      </div>
    </div>
  );
}
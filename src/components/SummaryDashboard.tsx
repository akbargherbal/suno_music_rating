/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SectionEvaluation, SectionData, Rating } from '../types';
import { sectionsData } from '../data';
import { Check, X, Copy, Download, Upload, AlertTriangle, Lightbulb, Music, Award, HelpCircle } from 'lucide-react';
import { useState, ChangeEvent } from 'react';

interface SummaryDashboardProps {
  evaluations: Record<number, SectionEvaluation>;
  sections: SectionData[];
  onImportState: (state: Record<number, SectionEvaluation>) => void;
  onReset: () => void;
}

export default function SummaryDashboard({
  evaluations,
  sections,
  onImportState,
  onReset
}: SummaryDashboardProps) {
  const [copied, setCopied] = useState(false);

  // Helper stats calculations
  const totalTagsEvaluated = Object.values(evaluations).reduce((sum, s) => {
    return sum + s.tagEvaluations.filter(t => t.ratingA !== null || t.ratingB !== null).length;
  }, 0);

  const totalTagsCount = Object.values(evaluations).reduce((sum, s) => {
    return sum + s.tagEvaluations.length;
  }, 0);

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

  // Hypotheses and automatic analytic insights
  const evaluateNahawandHypothesis = () => {
    const sec1 = evaluations[1];
    const sec5 = evaluations[5];
    if (!sec1 || !sec5) return "بانتظار تقييم القسم الأول والخامس...";

    const driftA1 = sec1.driftA === 'yes';
    const driftB1 = sec1.driftB === 'yes';
    const driftA5 = sec5.driftA === 'yes';
    const driftB5 = sec5.driftB === 'yes';

    const driftInSec1 = driftA1 || driftB1;
    const driftInSec5 = driftA5 || driftB5;

    if (driftInSec1 && driftInSec5) {
      return "💡 الفرضية مدعومة بقوة! لقد تم رصد دريفت (تحول غربي) في كلا قسمي مقام نهاوند (1 و 5). هذا يؤكد ويرجح بشدة فرضية أن مقام نهاوند تحديداً يحتاج لإعادة كتابة اسم المقام صراحة بالتاقات المحورية لمنع الشرود الموسيقي.";
    } else if (driftInSec1 || driftInSec5) {
      return "💡 الفرضية محتملة جزئياً! لقد تم رصد دريفت في أحد قسمي نهاوند دون الآخر. قد يكون الشرود ناتجاً عن غياب اسم المقام، لكنه يحتاج لمزيد من الفحص للتأكد مما إذا كانت الصدفة لعبت دوراً.";
    } else {
      return "🟢 الفرضية غير مرجحة حالياً. لم يتم رصد دريفت واضح في مقام نهاوند للقسمين 1 و 5. يبدو أن التاقات المخففة لـ v4 نجحت في إبقاء الأداء في طابعه الشرقي حتى بدون ذكر اسم المقام صراحة.";
    }
  };

  const evaluateSystemicIssues = () => {
    let verse2ScreamingA = 0;
    let verse2ScreamingB = 0;
    let totalVerse2 = 0;

    sections.forEach(sec => {
      const evalSec = evaluations[sec.id];
      if (!evalSec) return;
      // Look for Verse 2 tags or transitions
      const verse2Tag = evalSec.tagEvaluations.find(t => t.tag.toLowerCase().includes('verse 2'));
      if (verse2Tag) {
        totalVerse2++;
        if (verse2Tag.ratingA === 'RED') verse2ScreamingA++;
        if (verse2Tag.ratingB === 'RED') verse2ScreamingB++;
      }
    });

    if (verse2ScreamingA > 1 || verse2ScreamingB > 1) {
      return `⚠️ تنبيه نظامي: تم رصد صخب/انفجار صوتي متكرر في المقاطع الوسطية (Verse 2) لأكثر من قسم (النسخة A: ${verse2ScreamingA} مرات، النسخة B: ${verse2ScreamingB} مرات). هذا مؤشر قوي على وجود مشكلة نظامية في الـ workflow.md تتعلق بارتفاع مستوى الطاقة التلقائي لـ Suno عند المقطع الثاني. يجب تصحيح ذلك بالتاقات المانعة للصراخ.`;
    }
    return "✅ لا توجد مشاكل نظامية واضحة في تصاعد المقاطع الوسطية (Verse 2) حتى الآن. الانتقالات تبدو انسيابية ومتزنة.";
  };

  // Helper to generate filled markdown content
  const generateMarkdownReport = () => {
    let md = `# تقرير تقييم الاستماع — توليد v4\n\n`;
    md += `**تاريخ إنشاء التقرير:** 2026-07-18 | **إجمالي التقدم:** تم تقييم ${totalTagsEvaluated} من أصل ${totalTagsCount} تاقاً موسيقياً.\n\n`;
    md += `---\n\n`;

    sections.forEach(sec => {
      const e = evaluations[sec.id];
      md += `## ${sec.title} (مقام ${sec.maqam})\n\n`;
      md += `### المعيارين غير القابلين للتفاوض\n\n`;

      // Drift
      md += `#### 1) الدريفت (Gravitational Well)\n`;
      md += `* **النسخة A:** ${e.driftA === 'no' ? '[x] ما صار دريفت' : '[ ] ما صار دريفت'} | ${e.driftA === 'yes' ? '[x] صار دريفت' : '[ ] صار دريفت'} | ${e.driftA === 'not_sure' ? '[x] مو متأكد / حدّي' : '[ ] مو متأكد / حدّي'}\n`;
      if (e.driftA === 'yes') md += `  - تحديداً وين بالنسخة A: ${e.driftDetailsA || 'غير محدد'}\n`;
      md += `* **النسخة B:** ${e.driftB === 'no' ? '[x] ما صار دريفت' : '[ ] ما صار دريفت'} | ${e.driftB === 'yes' ? '[x] صار دريفت' : '[ ] صار دريفت'} | ${e.driftB === 'not_sure' ? '[x] مو متأكد / حدّي' : '[ ] مو متأكد / حدّي'}\n`;
      if (e.driftB === 'yes') md += `  - تحديداً وين بالنسخة B: ${e.driftDetailsB || 'غير محدد'}\n`;
      md += `\n`;

      // Transitions
      md += `#### 2) الانتقالات المفاجئة (نشاز/انفجار/همس مفاجئ)\n`;
      md += `* **النسخة A:** ${e.transitionsA === 'smooth' ? '[x] انسيابي ومريح' : '[ ] انسيابي ومريح'} | ${e.transitionsA === 'sudden' ? '[x] فيه قفزة مفاجئة' : '[ ] فيه قفزة مفاجئة'} | ${e.transitionsA === 'not_sure' ? '[x] مو متأكد / حدّي' : '[ ] مو متأكد / حدّي'}\n`;
      if (e.transitionsA === 'sudden') md += `  - تحديداً وين بالنسخة A: ${e.transitionsDetailsA || 'غير محدد'}\n`;
      md += `* **النسخة B:** ${e.transitionsB === 'smooth' ? '[x] انسيابي ومريح' : '[ ] انسيابي ومريح'} | ${e.transitionsB === 'sudden' ? '[x] فيه قفزة مفاجئة' : '[ ] فيه قفزة مفاجئة'} | ${e.transitionsB === 'not_sure' ? '[x] مو متأكد / حدّي' : '[ ] مو متأكد / حدّي'}\n`;
      if (e.transitionsB === 'sudden') md += `  - تحديداً وين بالنسخة B: ${e.transitionsDetailsB || 'غير محدد'}\n`;
      md += `\n`;

      // Tags table
      md += `### تقييم التاقات والمقاطع بالتفصيل\n\n`;
      md += `| التاق كما هو بv4 | المتوقع منه | تقييم النسخة A | تقييم النسخة B |\n`;
      md += `|---|---|---|---|\n`;

      e.tagEvaluations.forEach(t => {
        const ratingAStr = t.ratingA === 'GREEN' ? '🟢 معتدل جميل' : t.ratingA === 'YELLOW' ? '🟡 باهت/خامل' : t.ratingA === 'RED' ? '🔴 صاخب/مزعج' : 'غير مقيم';
        const ratingBStr = t.ratingB === 'GREEN' ? '🟢 معتدل جميل' : t.ratingB === 'YELLOW' ? '🟡 باهت/خامل' : t.ratingB === 'RED' ? '🔴 صاخب/مزعج' : 'غير مقيم';
        md += `| \`${t.tag}\` | ${t.expected} | ${ratingAStr} | ${ratingBStr} |\n`;
      });
      md += `\n`;

      if (sec.specialQuestion) {
        md += `**سؤال القسم الخاص:** ${sec.specialQuestion}\n`;
        md += `> الإجابة: ${e.specialQuestionAnswer || 'لا توجد إجابة مسجلة'}\n\n`;
      }

      md += `* **ملاحظات حرة:** \n\`\`\`\n${e.notes || 'لا توجد ملاحظات إضافية'}\n\`\`\`\n\n`;
      md += `* **النجاح العام للقسم:** النسخة A: ${e.generalSuccessA ? '🟢 ناجح' : '🔴 غير ناجح'} | النسخة B: ${e.generalSuccessB ? '🟢 ناجح' : '🔴 غير ناجح'}\n`;
      md += `* **النسخة المفضلة:** النسخة ${e.preferredVersion?.toUpperCase() || 'غير محددة'}\n\n`;
      md += `---\n\n`;
    });

    // Final table
    md += `## جدول الملخص النهائي لجميع الأقسام\n\n`;
    md += `| # | المقام | نجاح A؟ | نجاح B؟ | الدريفت A | الدريفت B | الانتقالات A | الانتقالات B | النسخة المفضلة |\n`;
    md += `|---|--------|---------|---------|-----------|-----------|--------------|--------------|----------------|\n`;

    sections.forEach(sec => {
      const e = evaluations[sec.id];
      const sA = e.generalSuccessA ? '✅' : '❌';
      const sB = e.generalSuccessB ? '✅' : '❌';
      const dA = e.driftA === 'no' ? '🟢 سليم' : e.driftA === 'yes' ? '🔴 دريفت' : '🟡 حدي';
      const dB = e.driftB === 'no' ? '🟢 سليم' : e.driftB === 'yes' ? '🔴 دريفت' : '🟡 حدي';
      const tA = e.transitionsA === 'smooth' ? '🟢 انسيابي' : e.transitionsA === 'sudden' ? '🔴 قفزة' : '🟡 حدي';
      const tB = e.transitionsB === 'smooth' ? '🟢 انسيابي' : e.transitionsB === 'sudden' ? '🔴 قفزة' : '🟡 حدي';
      const pref = e.preferredVersion === 'A' ? 'النسخة A ⭐' : e.preferredVersion === 'B' ? 'النسخة B ⭐' : e.preferredVersion === 'both' ? 'كلاهما' : e.preferredVersion === 'neither' ? 'لا أحد' : 'لم تحدد';

      md += `| ${sec.id} | ${sec.maqam} | ${sA} | ${sB} | ${dA} | ${dB} | ${tA} | ${tB} | ${pref} |\n`;
    });

    md += `\n\n## التوصيات والتحليلات التلقائية للنموذج\n\n`;
    md += `* **تحليل نهاوند (فرضية التاق المحوري):**\n  ${evaluateNahawandHypothesis()}\n\n`;
    md += `* **تحليل المشاكل النظامية (Verse 2):**\n  ${evaluateSystemicIssues()}\n\n`;
    md += `* **توزيع التفضيل:** النسخة A مفضلة في (${preferredCount.A}) أقسام، النسخة B مفضلة في (${preferredCount.B}) أقسام، وكلا النسختين مقبول في (${preferredCount.both}) أقسام.`;

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
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(evaluations, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `suno_evaluation_state_v4_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        onImportState(parsed);
        alert("📊 تم استيراد حالة التقييم المسبقة بنجاح!");
      } catch (err) {
        alert("❌ فشل قراءة الملف، يرجى التأكد من اختيار ملف JSON صحيح لحفظ الحالة.");
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
            <h3 className="text-2xl font-display text-ink mt-1">
              {totalTagsEvaluated} <span className="text-sm text-ink-faint font-body">/ {totalTagsCount} تاقاً</span>
            </h3>
          </div>
          <div className="p-3 bg-gold/10 text-gold-deep rounded-xl">
            <Music className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-paper-raised border border-line p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-ink-soft font-bold">الأقسام المكتملة</span>
            <h3 className="text-2xl font-display text-ink mt-1">
              {Object.values(evaluations).filter(s => s.tagEvaluations.every(t => t.ratingA !== null && t.ratingB !== null)).length}\n              <span className="text-sm text-ink-faint font-body"> / 6 أقسام</span>
            </h3>
          </div>
          <div className="p-3 bg-sage/10 text-sage rounded-xl">
            <Check className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-paper-raised border border-line p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-ink-soft font-bold">فوز النسخة A</span>
            <h3 className="text-2xl font-display text-amber mt-1">
              {preferredCount.A} <span className="text-sm text-ink-faint font-body">أقسام</span>
            </h3>
          </div>
          <div className="p-3 bg-amber/10 text-amber rounded-xl">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-paper-raised border border-line p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-ink-soft font-bold">فوز النسخة B</span>
            <h3 className="text-2xl font-display text-sage mt-1">
              {preferredCount.B} <span className="text-sm text-ink-faint font-body">أقسام</span>
            </h3>
          </div>
          <div className="p-3 bg-sage/10 text-sage rounded-xl">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Final Summary Table */}
      <div className="bg-paper-raised border border-line rounded-2xl p-6">
        <h3 className="font-display text-xl text-ink mb-4">
          جدول الخلاصة والملخص النهائي
        </h3>

        <div className="overflow-x-auto">
          <table id="final-summary-table" className="w-full text-right border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-ink-faint font-bold text-xs">
                <th className="py-3 px-4">القسم</th>
                <th className="py-3 px-4">المقام</th>
                <th className="py-3 px-4 text-center">نجاح A؟</th>
                <th className="py-3 px-4 text-center">نجاح B؟</th>
                <th className="py-3 px-4">دريفت النسخة A</th>
                <th className="py-3 px-4">دريفت النسخة B</th>
                <th className="py-3 px-4">انتقالات النسخة A</th>
                <th className="py-3 px-4">انتقالات النسخة B</th>
                <th className="py-3 px-4 text-center">النسخة المفضلة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60 font-medium">
              {sections.map(sec => {
                const e = evaluations[sec.id];
                if (!e) return null;
                return (
                  <tr key={sec.id} id={`summary-row-${sec.id}`} className="hover:bg-paper-sunk/50 transition-all">
                    <td className="py-4 px-4 font-display text-ink">{sec.title}</td>
                    <td className="py-4 px-4">
                      <span className="border border-line bg-paper-sunk text-ink-soft text-xs px-2.5 py-0.5 rounded-full font-bold">
                        {sec.maqam}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {e.generalSuccessA ? (
                        <Check className="w-5 h-5 text-sage mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-burgundy mx-auto" />
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {e.generalSuccessB ? (
                        <Check className="w-5 h-5 text-sage mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-burgundy mx-auto" />
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full border ${e.driftA === 'no' ? 'border-sage/40 text-sage' : e.driftA === 'yes' ? 'border-burgundy/40 text-burgundy font-bold' : 'border-amber/40 text-amber'}`}>
                        {e.driftA === 'no' ? '🟢 لم يشرد' : e.driftA === 'yes' ? '🔴 دريفت' : '🟡 حدي'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full border ${e.driftB === 'no' ? 'border-sage/40 text-sage' : e.driftB === 'yes' ? 'border-burgundy/40 text-burgundy font-bold' : 'border-amber/40 text-amber'}`}>
                        {e.driftB === 'no' ? '🟢 لم يشرد' : e.driftB === 'yes' ? '🔴 دريفت' : '🟡 حدي'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full border ${e.transitionsA === 'smooth' ? 'border-sage/40 text-sage' : e.transitionsA === 'sudden' ? 'border-burgundy/40 text-burgundy font-bold' : 'border-amber/40 text-amber'}`}>
                        {e.transitionsA === 'smooth' ? '🟢 انسيابي' : e.transitionsA === 'sudden' ? '🔴 قفزات' : '🟡 حدي'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full border ${e.transitionsB === 'smooth' ? 'border-sage/40 text-sage' : e.transitionsB === 'sudden' ? 'border-burgundy/40 text-burgundy font-bold' : 'border-amber/40 text-amber'}`}>
                        {e.transitionsB === 'smooth' ? '🟢 انسيابي' : e.transitionsB === 'sudden' ? '🔴 قفزات' : '🟡 حدي'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        e.preferredVersion === 'A' ? 'border-amber text-amber bg-amber/10' :
                        e.preferredVersion === 'B' ? 'border-sage text-sage bg-sage/10' :
                        e.preferredVersion === 'both' ? 'border-gold text-gold-deep bg-gold/10' :
                        'border-line text-ink-faint bg-paper-sunk'
                      }`}>
                        {e.preferredVersion === 'A' ? 'النسخة A ⭐' :
                         e.preferredVersion === 'B' ? 'النسخة B ⭐' :
                         e.preferredVersion === 'both' ? 'كلاهما مقبول' :
                         e.preferredVersion === 'neither' ? 'إعادة توليد' : 'معلق'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hypothesis & Dynamic Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nahawand Drift check */}
        <div className="bg-paper-raised border border-line rounded-2xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-gold/10 text-gold-deep rounded-lg">
                <Lightbulb className="w-5 h-5" />
              </div>
              <h4 className="font-display text-base text-ink">تحليل دريفت نهاوند (الفرضية والمراقبة)</h4>
            </div>
            <p className="text-xs text-ink-soft leading-relaxed">
              تراقب هذه الفرضية ما إذا كان نهاوند (نظراً لقربه من السلم الغربي) يشرد ويتحول لنمط غربي عند حذف اسم المقام من تاق الهندسة الصوتية v4.
            </p>
            <div className="p-4 bg-paper-sunk border border-line rounded-xl">
              <p className="text-xs text-ink-soft leading-relaxed font-body text-right">
                {evaluateNahawandHypothesis()}
              </p>
            </div>
          </div>
          <div className="font-latin text-[11px] text-ink-faint pt-4 border-t border-line mt-4">
            تتم المقارنة تلقائياً بناءً على تقييماتك في القسم 1 والقسم 5.
          </div>
        </div>

        {/* Systemic bugs check */}
        <div className="bg-paper-raised border border-line rounded-2xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-burgundy/10 text-burgundy rounded-lg">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h4 className="font-display text-base text-ink">تحليل العيوب المنهجية (Verse 2)</h4>
            </div>
            <p className="text-xs text-ink-soft leading-relaxed">
              يتحقق المحلل البرمجي تلقائياً من تكرار عيوب الضجيج أو الصراخ الصوتي في مقاطع Verse 2 الوسطية لجميع الأقسام، لكشف أي أخطاء متأصلة بـ Suno.
            </p>
            <div className="p-4 bg-paper-sunk border border-line rounded-xl">
              <p className="text-xs text-ink-soft leading-relaxed font-body text-right">
                {evaluateSystemicIssues()}
              </p>
            </div>
          </div>
          <div className="font-latin text-[11px] text-ink-faint pt-4 border-t border-line mt-4">
            يتأثر هذا التحليل بكل تاق يحمل وصف Verse 2 يتم تقييمه بـ 🔴 (صاخب مزعج).
          </div>
        </div>
      </div>

      {/* Export & Copy Center */}
      <div className="bg-paper-raised border border-line rounded-2xl p-8 text-center space-y-6">
        <div className="max-w-xl mx-auto space-y-2">
          <h3 className="font-display text-xl text-ink">مركز الحفظ وتصدير التقارير</h3>
          <p className="text-sm text-ink-soft leading-relaxed">
            يمكنك نسخ التقرير كاملاً بصيغة ماركداون (Markdown) غنية ومطابقة لملف التقييم الأصلي لمشاركتها، أو تحميل وحفظ حالة العمل لاستئناف التقييم لاحقاً.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          {/* Copy MD */}
          <button
            id="btn-copy-markdown"
            onClick={copyToClipboard}
            className={`px-5 py-3 rounded-full font-bold text-sm flex items-center gap-2 transition-all cursor-pointer border ${
              copied
                ? 'bg-sage text-paper-raised border-sage'
                : 'bg-gold text-paper-raised border-gold hover:bg-gold-deep'
            }`}
          >
            <Copy className="w-4 h-4" />
            <span>{copied ? 'تم نسخ تقرير Markdown ممتلئاً!' : 'نسخ التقرير كاملاً لـ Markdown'}</span>
          </button>

          {/* Export JSON */}
          <button
            id="btn-export-json"
            onClick={downloadJsonState}
            className="px-5 py-3 rounded-full bg-paper-sunk border border-line text-ink-soft hover:text-ink hover:bg-line/40 font-bold text-sm flex items-center gap-2 transition-all cursor-pointer"
          >\n            <Download className="w-4 h-4" />\n            <span>تصدير حالة العمل لملف JSON</span>\n          </button>

          {/* Import JSON Trigger */}
          <label
            id="label-import-json"
            className="px-5 py-3 rounded-full bg-paper-sunk border border-line text-ink-soft hover:text-ink hover:bg-line/40 font-bold text-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>استيراد حالة العمل السابقة</span>
            <input
              id="input-import-json-file"
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        <div className="pt-6 border-t border-line max-w-sm mx-auto">
          <button
            id="btn-reset-evaluation"
            onClick={() => {
              if (confirm("⚠️ هل أنت متأكد من مسح جميع بيانات التقييم المسجلة؟ لا يمكن استرجاعها بعد الحذف.")) {
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
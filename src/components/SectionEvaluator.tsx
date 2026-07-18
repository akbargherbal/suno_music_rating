/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { SectionData, SectionEvaluation, Rating } from '../types';
import AudioPlayer from './AudioPlayer';
import { AlertCircle, HelpCircle, ArrowLeft, ArrowRight, CheckCircle, Info, Radio, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SectionEvaluatorProps {
  section: SectionData;
  evaluation: SectionEvaluation;
  audioUrls: { A: string | null; B: string | null };
  onChange: (updatedEvaluation: SectionEvaluation) => void;
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export default function SectionEvaluator({
  section,
  evaluation,
  audioUrls,
  onChange,
  onNext,
  onPrev,
  isFirst,
  isLast
}: SectionEvaluatorProps) {
  const [showMetadata, setShowMetadata] = useState(false);
  const [syncTime, setSyncTime] = useState(true);
  const [lastTimeA, setLastTimeA] = useState<number>(0);
  const [lastTimeB, setLastTimeB] = useState<number>(0);

  const updateEvaluationField = <K extends keyof SectionEvaluation>(
    field: K,
    value: SectionEvaluation[K]
  ) => {
    onChange({
      ...evaluation,
      [field]: value
    });
  };

  const handleTagRatingChange = (tagId: string, version: 'A' | 'B', rating: Rating) => {
    const updatedTags = evaluation.tagEvaluations.map(t => {
      if (t.id === tagId) {
        return {
          ...t,
          [version === 'A' ? 'ratingA' : 'ratingB']: rating
        };
      }
      return t;
    });
    updateEvaluationField('tagEvaluations', updatedTags);
  };

  // Synchronized time handlers
  const handleTimeUpdateA = (time: number) => {
    setLastTimeA(time);
    if (syncTime) {
      setLastTimeB(time);
    }
  };

  const handleTimeUpdateB = (time: number) => {
    setLastTimeB(time);
    if (syncTime) {
      setLastTimeA(time);
    }
  };

  const getVocalLabel = (rating: Rating) => {
    if (rating === 'RED') return '🔴 صاخب مزعج';
    if (rating === 'YELLOW') return '🟡 نعسان خامل';
    if (rating === 'GREEN') return '🟢 معتدل جميل';
    return 'غير مقيم';
  };

  const getInstrumentLabel = (rating: Rating) => {
    if (rating === 'RED') return '🔴 فوضى/مزعج';
    if (rating === 'YELLOW') return '🟡 خامل/غايب';
    if (rating === 'GREEN') return '🟢 متوازن';
    return 'غير مقيم';
  };

  return (
    <div id={`section-evaluator-${section.id}`} className="space-y-6 text-right dir-rtl font-body pb-12">
      {/* Section Header */}
      <div className="bg-paper-raised border border-line p-6 rounded-2xl flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="border border-gold text-gold-deep font-latin px-3 py-1 rounded-full text-[12.5px]">
              القسم {section.id}
            </span>
            <span className="border border-line text-ink-soft font-latin px-3 py-1 rounded-full text-[12.5px] bg-paper-sunk">
              مقام {section.maqam}
            </span>
          </div>
          <h2 className="text-[28px] font-display text-ink mt-3">
            {section.title}
          </h2>
          <p className="text-ink-soft text-[15px] mt-1">{section.description}</p>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            id="btn-prev-section"
            onClick={onPrev}
            disabled={isFirst}
            className="w-9 h-9 rounded-full border border-gold bg-paper-sunk text-gold-deep hover:bg-line/60 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center"
            title="القسم السابق"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <span className="font-latin italic text-[13px] text-ink-faint px-1">
            {section.id} من 6
          </span>
          <button
            id="btn-next-section"
            onClick={onNext}
            disabled={isLast}
            className="w-9 h-9 rounded-full border border-gold bg-paper-sunk text-gold-deep hover:bg-line/60 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center"
            title="القسم التالي"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Watchpoint banner */}
      <div className="border border-burgundy bg-burgundy/[0.06] rounded-xl p-4 flex items-start gap-3.5">
        <Info className="w-5 h-5 text-burgundy shrink-0 mt-0.5" />
        <div>
          <h4 className="font-display text-[15px] text-burgundy">نقطة المراقبة والتحقق</h4>
          <p className="text-[14.5px] text-[#6b4444] mt-1.5 leading-relaxed">
            {section.watchpoint}
          </p>
        </div>
      </div>

      {/* Lyrics & Metadata Toggles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lyrics Panel */}
        <div className="lg:col-span-2 bg-paper-raised border border-line rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
            <h3 className="font-display text-[15px] text-gold-deep">
              كلمات القصيدة والتاقات بـ v4
            </h3>
            <span className="font-latin text-xs text-ink-faint">مقسمة حسب الأبيات</span>
          </div>
          <div className="bg-paper-sunk p-5 rounded-xl border border-line overflow-y-auto max-h-[350px] font-display text-[19px] leading-[2.3] text-ink whitespace-pre-wrap select-text dir-rtl text-center">
            {section.lyrics}
          </div>
        </div>

        {/* Suno Prompts & Metadata Panel */}
        <div className="bg-paper-raised border border-line rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
              <h3 className="font-display text-[15px] text-gold-deep">
                هندسة الصوت
              </h3>
            </div>
            <p className="text-[13.5px] text-ink-soft mb-4 leading-relaxed">
              انقر على الزر أدناه لمعاينة كود هندسة الصوت والبرومبت لبرنامج Suno v4 المستخدم لتوليد النسختين.
            </p>

            <button
              id="btn-toggle-metadata"
              onClick={() => setShowMetadata(!showMetadata)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-full bg-paper-sunk border border-gold text-ink hover:bg-line/60 transition-all text-sm"
            >
              <span>{showMetadata ? 'إخفاء ميتاداتا التوليد' : 'عرض ميتاداتا التوليد بالتفصيل'}</span>
              {showMetadata ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <AnimatePresence>
              {showMetadata && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mt-3 space-y-3"
                >
                  <div className="p-3 bg-paper-sunk border border-line rounded-lg font-latin text-xs text-ink-soft max-h-[220px] overflow-y-auto space-y-2">
                    <div>
                      <span className="text-sage font-bold block mb-1">النمط الموسيقي المشترك (Genre & Vocals):</span>
                      <p className="text-[11px] leading-normal">{section.tracks.A.styles.split('\n\n')[1] || section.tracks.A.styles}</p>
                    </div>
                    <div className="border-t border-line pt-2">
                      <span className="text-amber font-bold block mb-1">رقم كليب الأغنية A (Suno ID):</span>
                      <p className="text-[10px] text-ink-faint font-bold">{section.tracks.A.clip_id}</p>
                    </div>
                    <div className="border-t border-line pt-2">
                      <span className="text-sage font-bold block mb-1">رقم كليب الأغنية B (Suno ID):</span>
                      <p className="text-[10px] text-ink-faint font-bold">{section.tracks.B.clip_id}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-6 pt-4 border-t border-line flex items-center justify-between">
            <span className="text-xs text-ink-soft">تاريخ التوليد:</span>
            <span className="font-latin text-xs text-ink-faint">2026-07-18</span>
          </div>
        </div>
      </div>

      {/* Interactive Listening Deck */}
      <div className="bg-paper-raised border border-line rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 border-b border-line pb-4">
          <div>
            <h3 className="font-display text-lg text-ink">
              منصة الاستماع والمقارنة الزمنية المتزامنة
            </h3>
            <p className="text-[13px] text-ink-soft mt-1">
              اسمح بمزامنة التوقيت للقفز بين الأغنيتين في نفس الثانية وسماع الفروقات بدقة متناهية.
            </p>
          </div>

          {/* Sync Switcher */}
          <div className="flex items-center gap-2.5 bg-paper-sunk px-3 py-1.5 rounded-lg border border-line">
            <label className="text-xs text-ink-soft font-body cursor-pointer" htmlFor="sync-time-checkbox">
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

        {/* Audio Players Grid */}
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

      {/* Comparative Non-Negotiable Criteria Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Drift Card */}
        <div className="bg-paper-raised border border-line rounded-2xl p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-burgundy/10 text-burgundy shrink-0">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-lg text-ink">1) الدريفت والشرود (Gravitational Well)</h3>
              <p className="text-[13px] text-ink-soft leading-relaxed mt-1">
                هل حسّيت بلحظة صار فيها المغني أو اللحن يتحول لـ "مغني أمريكي يغني عربي بإيقاع غربي"؟ نهاوند وعجم هما الأكثر عرضة للدريفت.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Version A Drift */}
            <div className="p-4 rounded-xl bg-paper-sunk border border-line space-y-3">
              <h4 className="text-xs font-bold text-amber">الدريفت في النسخة A:</h4>
              <div className="flex flex-col gap-2">
                {[
                  { value: 'no', label: '🟢 ما صار دريفت (حس عربي)' },
                  { value: 'yes', label: '🔴 صار دريفت (تحول غربي)' },
                  { value: 'not_sure', label: '🟡 مو متأكد / حدّي' }
                ].map(opt => (
                  <label key={opt.value} className={`flex items-center gap-2.5 p-2 rounded-lg text-xs cursor-pointer border transition-all ${evaluation.driftA === opt.value ? 'bg-amber/10 border-amber/50 text-gold-deep font-bold' : 'bg-paper-raised border-transparent text-ink-soft hover:text-ink'}`}>
                    <input
                      type="radio"
                      name="driftA"
                      value={opt.value}
                      checked={evaluation.driftA === opt.value}
                      onChange={() => updateEvaluationField('driftA', opt.value as any)}
                      className="accent-amber"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              {evaluation.driftA === 'yes' && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
                  <label className="block text-[11px] text-ink-soft mb-1 font-bold">حدد وين بالضبط (الثانية/البيت):</label>
                  <input
                    id="drift-details-a-input"
                    type="text"
                    value={evaluation.driftDetailsA}
                    onChange={(e) => updateEvaluationField('driftDetailsA', e.target.value)}
                    placeholder="مثال: من الدقيقة 1:20 عند البيت الثالث..."
                    className="w-full bg-paper-raised border border-line rounded-lg px-3 py-1.5 text-xs text-ink focus:outline-none focus:border-amber font-body"
                  />
                </motion.div>
              )}
            </div>

            {/* Version B Drift */}
            <div className="p-4 rounded-xl bg-paper-sunk border border-line space-y-3">
              <h4 className="text-xs font-bold text-sage">الدريفت في النسخة B:</h4>
              <div className="flex flex-col gap-2">
                {[
                  { value: 'no', label: '🟢 ما صار دريفت (حس عربي)' },
                  { value: 'yes', label: '🔴 صار دريفت (تحول غربي)' },
                  { value: 'not_sure', label: '🟡 مو متأكد / حدّي' }
                ].map(opt => (
                  <label key={opt.value} className={`flex items-center gap-2.5 p-2 rounded-lg text-xs cursor-pointer border transition-all ${evaluation.driftB === opt.value ? 'bg-sage/10 border-sage/50 text-sage font-bold' : 'bg-paper-raised border-transparent text-ink-soft hover:text-ink'}`}>
                    <input
                      type="radio"
                      name="driftB"
                      value={opt.value}
                      checked={evaluation.driftB === opt.value}
                      onChange={() => updateEvaluationField('driftB', opt.value as any)}
                      className="accent-sage"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              {evaluation.driftB === 'yes' && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
                  <label className="block text-[11px] text-ink-soft mb-1 font-bold">حدد وين بالضبط (الثانية/البيت):</label>
                  <input
                    id="drift-details-b-input"
                    type="text"
                    value={evaluation.driftDetailsB}
                    onChange={(e) => updateEvaluationField('driftDetailsB', e.target.value)}
                    placeholder="مثال: من الدقيقة 1:20 عند البيت الثالث..."
                    className="w-full bg-paper-raised border border-line rounded-lg px-3 py-1.5 text-xs text-ink focus:outline-none focus:border-sage font-body"
                  />
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Transitions Card */}
        <div className="bg-paper-raised border border-line rounded-2xl p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-gold/10 text-gold-deep shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-lg text-ink">2) الانتقالات المفاجئة (نشاز/انفجار/همس مفاجئ)</h3>
              <p className="text-[13px] text-ink-soft leading-relaxed mt-1">
                هل فيه لحظة يبدأ فيها هادئ وفجأة يقصف (أو العكس)، بشكل يزعج أذن المستمع أثناء القيادة أو العمل؟
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Version A Transitions */}
            <div className="p-4 rounded-xl bg-paper-sunk border border-line space-y-3">
              <h4 className="text-xs font-bold text-amber">الانتقالات في النسخة A:</h4>
              <div className="flex flex-col gap-2">
                {[
                  { value: 'smooth', label: '🟢 انسيابي ومريح للاستماع' },
                  { value: 'sudden', label: '🔴 فيه قفزة مفاجئة مزعجة' },
                  { value: 'not_sure', label: '🟡 مو متأكد / حدّي' }
                ].map(opt => (
                  <label key={opt.value} className={`flex items-center gap-2.5 p-2 rounded-lg text-xs cursor-pointer border transition-all ${evaluation.transitionsA === opt.value ? 'bg-amber/10 border-amber/50 text-gold-deep font-bold' : 'bg-paper-raised border-transparent text-ink-soft hover:text-ink'}`}>
                    <input
                      type="radio"
                      name="transitionsA"
                      value={opt.value}
                      checked={evaluation.transitionsA === opt.value}
                      onChange={() => updateEvaluationField('transitionsA', opt.value as any)}
                      className="accent-amber"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              {evaluation.transitionsA === 'sudden' && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
                  <label className="block text-[11px] text-ink-soft mb-1 font-bold">حدد وين بالضبط:</label>
                  <input
                    id="transitions-details-a-input"
                    type="text"
                    value={evaluation.transitionsDetailsA}
                    onChange={(e) => updateEvaluationField('transitionsDetailsA', e.target.value)}
                    placeholder="مثال: قفزة حادة في الطبول بالثانية 45..."
                    className="w-full bg-paper-raised border border-line rounded-lg px-3 py-1.5 text-xs text-ink focus:outline-none focus:border-amber font-body"
                  />
                </motion.div>
              )}
            </div>

            {/* Version B Transitions */}
            <div className="p-4 rounded-xl bg-paper-sunk border border-line space-y-3">
              <h4 className="text-xs font-bold text-sage">الانتقالات في النسخة B:</h4>
              <div className="flex flex-col gap-2">
                {[
                  { value: 'smooth', label: '🟢 انسيابي ومريح للاستماع' },
                  { value: 'sudden', label: '🔴 فيه قفزة مفاجئة مزعجة' },
                  { value: 'not_sure', label: '🟡 مو متأكد / حدّي' }
                ].map(opt => (
                  <label key={opt.value} className={`flex items-center gap-2.5 p-2 rounded-lg text-xs cursor-pointer border transition-all ${evaluation.transitionsB === opt.value ? 'bg-sage/10 border-sage/50 text-sage font-bold' : 'bg-paper-raised border-transparent text-ink-soft hover:text-ink'}`}>
                    <input
                      type="radio"
                      name="transitionsB"
                      value={opt.value}
                      checked={evaluation.transitionsB === opt.value}
                      onChange={() => updateEvaluationField('transitionsB', opt.value as any)}
                      className="accent-sage"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              {evaluation.transitionsB === 'sudden' && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
                  <label className="block text-[11px] text-ink-soft mb-1 font-bold">حدد وين بالضبط:</label>
                  <input
                    id="transitions-details-b-input"
                    type="text"
                    value={evaluation.transitionsDetailsB}
                    onChange={(e) => updateEvaluationField('transitionsDetailsB', e.target.value)}
                    placeholder="مثال: قفزة حادة في الطبول بالثانية 45..."
                    className="w-full bg-paper-raised border border-line rounded-lg px-3 py-1.5 text-xs text-ink focus:outline-none focus:border-sage font-body"
                  />
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tags Evaluation Sheet */}
      <div className="bg-paper-raised border border-line rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-line">
          <h3 className="font-display text-[19px] text-ink">تقييم التاقات</h3>
          <p className="text-[13px] text-ink-soft mt-1">
            يرجى تقييم أداء كل عنصر وفق المقاييس الفنية المعتمدة للفوكالز والآلات.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 bg-paper-sunk p-3 border-b border-line text-xs">
          <span className="font-bold text-ink-soft">مقياس الفوكالز:</span>
          <span className="text-burgundy">🔴 صاخب مزعج (صراخ)</span>
          <span className="text-amber">🟡 نعسان خامل (باهت)</span>
          <span className="text-sage font-bold">🟢 معتدل جميل (الهدف)</span>
          <span className="text-ink-faint">|</span>
          <span className="font-bold text-ink-soft">مقياس الآلات:</span>
          <span className="text-burgundy">🔴 فوضى/مزعج</span>
          <span className="text-amber">🟡 خامل/غايب</span>
          <span className="text-sage font-bold">🟢 متوازن (يدعم اللحظة)</span>
        </div>

        <div>
          {evaluation.tagEvaluations.map((tagEval, idx) => {
            const isVocal = tagEval.type === 'vocals';
            return (
              <div
                key={tagEval.id}
                id={`tag-row-${tagEval.id}`}
                className="p-5 border-t border-line hover:bg-paper-sunk/40 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Tag Info */}
                <div className="space-y-1.5 lg:max-w-[45%]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-latin text-xs font-bold text-ink-faint bg-paper-sunk px-2 py-0.5 rounded">
                      #{idx + 1}
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border border-line ${isVocal ? 'text-gold-deep' : 'text-burgundy'}`}>
                      {isVocal ? 'فوكالز 🎤' : 'آلات وعزف 🎸'}
                    </span>
                    <span className="font-display text-base text-ink">
                      {tagEval.tag}
                    </span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="text-[11px] text-ink-faint font-bold whitespace-nowrap pt-0.5">المتوقع منه:</span>
                    <p className="text-[13.5px] text-ink-soft leading-relaxed">
                      {tagEval.expected}
                    </p>
                  </div>
                </div>

                {/* Ratings block */}
                <div className="flex flex-wrap items-center gap-6 shrink-0 bg-paper-sunk p-3 rounded-xl border border-line">
                  {/* Version A Rating */}
                  <div className="space-y-2">
                    <span className="font-latin italic text-xs text-ink-faint">A</span>
                    <div className="flex items-center gap-1.5">
                      {(['RED', 'YELLOW', 'GREEN'] as Rating[]).map(val => (
                        <button
                          key={val}
                          id={`btn-tag-${tagEval.id}-A-${val}`}
                          onClick={() => handleTagRatingChange(tagEval.id, 'A', tagEval.ratingA === val ? null : val)}
                          className={`w-[30px] h-[30px] rounded-full border flex items-center justify-center transition-all ${
                            tagEval.ratingA === val
                              ? val === 'GREEN' ? 'bg-sage border-sage' : val === 'YELLOW' ? 'bg-amber border-amber' : 'bg-burgundy border-burgundy'
                              : 'border-line bg-paper-raised text-ink-faint'
                          }`}
                          title={isVocal ? getVocalLabel(val) : getInstrumentLabel(val)}
                        >
                          <span className={tagEval.ratingA === val ? 'text-paper-raised text-[10px]' : 'text-line text-[10px]'}>●</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Version B Rating */}
                  <div className="space-y-2">
                    <span className="font-latin italic text-xs text-ink-faint">B</span>
                    <div className="flex items-center gap-1.5">
                      {(['RED', 'YELLOW', 'GREEN'] as Rating[]).map(val => (
                        <button
                          key={val}
                          id={`btn-tag-${tagEval.id}-B-${val}`}
                          onClick={() => handleTagRatingChange(tagEval.id, 'B', tagEval.ratingB === val ? null : val)}
                          className={`w-[30px] h-[30px] rounded-full border flex items-center justify-center transition-all ${
                            tagEval.ratingB === val
                              ? val === 'GREEN' ? 'bg-sage border-sage' : val === 'YELLOW' ? 'bg-amber border-amber' : 'bg-burgundy border-burgundy'
                              : 'border-line bg-paper-raised text-ink-faint'
                          }`}
                          title={isVocal ? getVocalLabel(val) : getInstrumentLabel(val)}
                        >
                          <span className={tagEval.ratingB === val ? 'text-paper-raised text-[10px]' : 'text-line text-[10px]'}>●</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Notes & Special Questions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Notes & Special Question */}
        <div className="lg:col-span-2 bg-paper-raised border border-line rounded-2xl p-6 space-y-5">
          <h3 className="font-display text-lg text-ink border-b border-line pb-3">
            الأسئلة والتدوينات
          </h3>

          {/* Section Special Question (e.g. for Section 3 or Section 4) */}
          {section.specialQuestion && (
            <div className="space-y-2 bg-gold/5 p-4 rounded-xl border border-gold/20">
              <label htmlFor="special-question-textarea" className="block text-sm font-bold text-gold-deep flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" /> {section.specialQuestion}
              </label>
              <textarea
                id="special-question-textarea"
                rows={3}
                value={evaluation.specialQuestionAnswer}
                onChange={(e) => updateEvaluationField('specialQuestionAnswer', e.target.value)}
                placeholder="سجل انطباعك وإجابتك التفصيلية هنا..."
                className="w-full bg-paper-sunk border border-line rounded-xl p-3 text-sm text-ink focus:outline-none focus:border-gold font-body leading-relaxed text-right dir-rtl"
              />
            </div>
          )}

          {/* General Notes */}
          <div className="space-y-2">
            <label htmlFor="section-notes-textarea" className="block font-display text-[15px] text-gold-deep">
              ملاحظات حرة وانطباعات المستمع العامة لهذا القسم
            </label>
            <textarea
              id="section-notes-textarea"
              rows={4}
              value={evaluation.notes}
              onChange={(e) => updateEvaluationField('notes', e.target.value)}
              placeholder="اكتب ملاحظاتك الفنية، مواطن الجمال، أو أي مشاكل لم تغطها التاقات الفردية..."
              className="w-full bg-paper-sunk border border-line rounded-xl p-3.5 text-[15px] text-ink focus:outline-none focus:border-gold font-body leading-relaxed text-right dir-rtl resize-vertical"
            />
          </div>
        </div>

        {/* Right: Success & Preference */}
        <div className="bg-paper-raised border border-line rounded-2xl p-6 flex flex-col justify-between">
          <div className="space-y-5">
            <h3 className="font-display text-lg text-ink border-b border-line pb-3">
              النتيجة والخلاصة العامة للقسم
            </h3>

            {/* General Success A & B */}
            <div className="space-y-3">
              <label className="block text-xs font-extrabold text-ink-faint uppercase tracking-wide">
                النجاح الفني العام للقسم (هل نجح؟)
              </label>

              {/* Success A */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-paper-sunk border border-line">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber"></span>
                  <span className="text-sm font-bold text-ink">النسخة A</span>
                </div>
                <button
                  id="btn-success-A"
                  onClick={() => updateEvaluationField('generalSuccessA', !evaluation.generalSuccessA)}
                  className={`font-latin px-3 py-1.5 rounded-full text-xs transition-all border ${
                    evaluation.generalSuccessA
                      ? 'border-sage text-sage bg-sage/10'
                      : 'border-burgundy/40 text-burgundy bg-burgundy/10'
                  }`}
                >
                  {evaluation.generalSuccessA ? 'ناجحة' : 'غير ناجحة'}
                </button>
              </div>

              {/* Success B */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-paper-sunk border border-line">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sage"></span>
                  <span className="text-sm font-bold text-ink">النسخة B</span>
                </div>
                <button
                  id="btn-success-B"
                  onClick={() => updateEvaluationField('generalSuccessB', !evaluation.generalSuccessB)}
                  className={`font-latin px-3 py-1.5 rounded-full text-xs transition-all border ${
                    evaluation.generalSuccessB
                      ? 'border-sage text-sage bg-sage/10'
                      : 'border-burgundy/40 text-burgundy bg-burgundy/10'
                  }`}
                >
                  {evaluation.generalSuccessB ? 'ناجحة' : 'غير ناجحة'}
                </button>
              </div>
            </div>

            {/* Preferred Version Selector */}
            <div className="space-y-2.5 pt-1">
              <label className="block text-xs font-extrabold text-ink-faint uppercase tracking-wide">
                النسخة المفضلة من قبلك لهذا القسم:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'A', label: 'النسخة A ⭐' },
                  { value: 'B', label: 'النسخة B ⭐' },
                  { value: 'both', label: 'كلاهما مقبول' },
                  { value: 'neither', label: 'لا شيء / يعاد' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    id={`btn-preferred-${opt.value}`}
                    onClick={() => updateEvaluationField('preferredVersion', opt.value as any)}
                    className={`p-2.5 rounded-lg text-sm transition-all border ${
                      evaluation.preferredVersion === opt.value
                        ? 'border-gold text-gold-deep bg-gold/10 font-bold'
                        : 'border-line bg-paper-sunk text-ink-soft hover:text-ink'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-line text-center font-latin italic text-[13px] text-ink-faint">
            تم تقييم {evaluation.tagEvaluations.filter(t => t.ratingA !== null || t.ratingB !== null).length} من أصل {evaluation.tagEvaluations.length} تاقات
          </div>
        </div>
      </div>
    </div>
  );
}
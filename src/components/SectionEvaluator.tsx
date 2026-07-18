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
    <div id={`section-evaluator-${section.id}`} className="space-y-6 text-right dir-rtl font-sans pb-12">
      {/* Section Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="bg-amber-500/20 text-amber-400 font-bold px-3 py-1 rounded-full text-xs font-mono">
              القسم {section.id}
            </span>
            <span className="bg-indigo-500/20 text-indigo-400 font-bold px-3 py-1 rounded-full text-xs font-mono">
              مقام {section.maqam}
            </span>
          </div>
          <h2 className="text-2xl font-black text-white mt-2 font-sans tracking-tight">
            {section.title}
          </h2>
          <p className="text-gray-400 text-sm mt-1">{section.description}</p>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-2">
          <button
            id="btn-prev-section"
            onClick={onPrev}
            disabled={isFirst}
            className="p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-gray-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-all"
            title="القسم السابق"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <span className="text-sm font-mono text-gray-500 font-bold px-2">
            {section.id} / 6
          </span>
          <button
            id="btn-next-section"
            onClick={onNext}
            disabled={isLast}
            className="p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-gray-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-all"
            title="القسم التالي"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Watchpoint banner */}
      <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3.5">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-extrabold text-amber-400 uppercase tracking-wide">نقطة المراقبة والتحقق</h4>
          <p className="text-sm text-amber-100/90 mt-1 leading-relaxed font-medium">
            {section.watchpoint}
          </p>
        </div>
      </div>

      {/* Lyrics & Metadata Toggles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lyrics Panel */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>📜</span> كلمات القصيدة والتاقات بـ v4
            </h3>
            <span className="text-xs text-gray-500">مقسمة حسب الأبيات</span>
          </div>
          <div className="bg-black/40 p-4 rounded-xl border border-slate-800/60 overflow-y-auto max-h-[350px] font-mono text-sm leading-relaxed text-slate-300 whitespace-pre-wrap select-text dir-rtl text-right">
            {section.lyrics}
          </div>
        </div>

        {/* Suno Prompts & Metadata Panel */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>⚡</span> تاق هندسة الصوت وميتاداتا
              </h3>
            </div>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              انقر على الزر أدناه لمعاينة كود هندسة الصوت والبرومبت لبرنامج Suno v4 المستخدم لتوليد النسختين.
            </p>

            <button
              id="btn-toggle-metadata"
              onClick={() => setShowMetadata(!showMetadata)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-gray-300 hover:text-white hover:bg-slate-800 transition-all text-sm font-medium"
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
                  <div className="p-3 bg-black/50 border border-slate-800 rounded-lg text-xs font-mono text-gray-400 max-h-[220px] overflow-y-auto space-y-2">
                    <div>
                      <span className="text-emerald-400 font-bold block mb-1">النمط الموسيقي المشترك (Genre & Vocals):</span>
                      <p className="text-[11px] leading-normal">{section.tracks.A.styles.split('\n\n')[1] || section.tracks.A.styles}</p>
                    </div>
                    <div className="border-t border-slate-800 pt-2">
                      <span className="text-amber-400 font-bold block mb-1">رقم كليب الأغنية A (Suno ID):</span>
                      <p className="text-[10px] text-gray-500 font-bold">{section.tracks.A.clip_id}</p>
                    </div>
                    <div className="border-t border-slate-800 pt-2">
                      <span className="text-sky-400 font-bold block mb-1">رقم كليب الأغنية B (Suno ID):</span>
                      <p className="text-[10px] text-gray-500 font-bold">{section.tracks.B.clip_id}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-900 flex items-center justify-between">
            <span className="text-xs text-gray-400">تاريخ التوليد:</span>
            <span className="text-xs font-mono text-gray-500">2026-07-18</span>
          </div>
        </div>
      </div>

      {/* Interactive Listening Deck */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🎧</span> منصة الاستماع والمقارنة الزمنية المتزامنة
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              اسمح بمزامنة التوقيت للقفز بين الأغنيتين في نفس الثانية وسماع الفروقات بدقة متناهية.
            </p>
          </div>

          {/* Sync Switcher */}
          <div className="flex items-center gap-2.5 bg-black/40 px-3 py-1.5 rounded-lg border border-slate-800">
            <label className="text-xs font-bold text-gray-300 font-sans cursor-pointer" htmlFor="sync-time-checkbox">
              مزامنة زمن الاستماع بين النسختين
            </label>
            <input
              id="sync-time-checkbox"
              type="checkbox"
              checked={syncTime}
              onChange={(e) => setSyncTime(e.target.checked)}
              className="w-4 h-4 text-emerald-500 focus:ring-emerald-500 border-gray-700 rounded bg-slate-950 cursor-pointer"
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
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">1) الدريفت والشرود (Gravitational Well)</h3>
              <p className="text-xs text-gray-400 leading-relaxed mt-1">
                هل حسّيت بلحظة صار فيها المغني أو اللحن يتحول لـ "مغني أمريكي يغني عربي بإيقاع غربي"؟ نهاوند وعجم هما الأكثر عرضة للدريفت.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Version A Drift */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 space-y-3">
              <h4 className="text-xs font-black text-emerald-400">الدريفت في النسخة A:</h4>
              <div className="flex flex-col gap-2">
                {[
                  { value: 'no', label: '🟢 ما صار دريفت (حس عربي)' },
                  { value: 'yes', label: '🔴 صار دريفت (تحول غربي)' },
                  { value: 'not_sure', label: '🟡 مو متأكد / حدّي' }
                ].map(opt => (
                  <label key={opt.value} className={`flex items-center gap-2.5 p-2 rounded-lg text-xs cursor-pointer border transition-all ${evaluation.driftA === opt.value ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-bold' : 'bg-black/20 border-transparent text-gray-400 hover:text-gray-200'}`}>
                    <input
                      type="radio"
                      name="driftA"
                      value={opt.value}
                      checked={evaluation.driftA === opt.value}
                      onChange={() => updateEvaluationField('driftA', opt.value as any)}
                      className="text-emerald-500 focus:ring-emerald-500"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              {evaluation.driftA === 'yes' && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
                  <label className="block text-[11px] text-gray-400 mb-1 font-bold">حدد وين بالضبط (الثانية/البيت):</label>
                  <input
                    id="drift-details-a-input"
                    type="text"
                    value={evaluation.driftDetailsA}
                    onChange={(e) => updateEvaluationField('driftDetailsA', e.target.value)}
                    placeholder="مثال: من الدقيقة 1:20 عند البيت الثالث..."
                    className="w-full bg-black/40 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-sans"
                  />
                </motion.div>
              )}
            </div>

            {/* Version B Drift */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 space-y-3">
              <h4 className="text-xs font-black text-sky-400">الدريفت في النسخة B:</h4>
              <div className="flex flex-col gap-2">
                {[
                  { value: 'no', label: '🟢 ما صار دريفت (حس عربي)' },
                  { value: 'yes', label: '🔴 صار دريفت (تحول غربي)' },
                  { value: 'not_sure', label: '🟡 مو متأكد / حدّي' }
                ].map(opt => (
                  <label key={opt.value} className={`flex items-center gap-2.5 p-2 rounded-lg text-xs cursor-pointer border transition-all ${evaluation.driftB === opt.value ? 'bg-sky-500/10 border-sky-500/40 text-sky-300 font-bold' : 'bg-black/20 border-transparent text-gray-400 hover:text-gray-200'}`}>
                    <input
                      type="radio"
                      name="driftB"
                      value={opt.value}
                      checked={evaluation.driftB === opt.value}
                      onChange={() => updateEvaluationField('driftB', opt.value as any)}
                      className="text-sky-500 focus:ring-sky-500"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              {evaluation.driftB === 'yes' && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
                  <label className="block text-[11px] text-gray-400 mb-1 font-bold">حدد وين بالضبط (الثانية/البيت):</label>
                  <input
                    id="drift-details-b-input"
                    type="text"
                    value={evaluation.driftDetailsB}
                    onChange={(e) => updateEvaluationField('driftDetailsB', e.target.value)}
                    placeholder="مثال: من الدقيقة 1:20 عند البيت الثالث..."
                    className="w-full bg-black/40 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 font-sans"
                  />
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Transitions Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">2) الانتقالات المفاجئة (نشاز/انفجار/همس مفاجئ)</h3>
              <p className="text-xs text-gray-400 leading-relaxed mt-1">
                هل فيه لحظة يبدأ فيها هادئ وفجأة يقصف (أو العكس)، بشكل يزعج أذن المستمع أثناء القيادة أو العمل؟
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Version A Transitions */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 space-y-3">
              <h4 className="text-xs font-black text-emerald-400">الانتقالات في النسخة A:</h4>
              <div className="flex flex-col gap-2">
                {[
                  { value: 'smooth', label: '🟢 انسيابي ومريح للاستماع' },
                  { value: 'sudden', label: '🔴 فيه قفزة مفاجئة مزعجة' },
                  { value: 'not_sure', label: '🟡 مو متأكد / حدّي' }
                ].map(opt => (
                  <label key={opt.value} className={`flex items-center gap-2.5 p-2 rounded-lg text-xs cursor-pointer border transition-all ${evaluation.transitionsA === opt.value ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-bold' : 'bg-black/20 border-transparent text-gray-400 hover:text-gray-200'}`}>
                    <input
                      type="radio"
                      name="transitionsA"
                      value={opt.value}
                      checked={evaluation.transitionsA === opt.value}
                      onChange={() => updateEvaluationField('transitionsA', opt.value as any)}
                      className="text-emerald-500 focus:ring-emerald-500"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              {evaluation.transitionsA === 'sudden' && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
                  <label className="block text-[11px] text-gray-400 mb-1 font-bold">حدد وين بالضبط:</label>
                  <input
                    id="transitions-details-a-input"
                    type="text"
                    value={evaluation.transitionsDetailsA}
                    onChange={(e) => updateEvaluationField('transitionsDetailsA', e.target.value)}
                    placeholder="مثال: قفزة حادة في الطبول بالثانية 45..."
                    className="w-full bg-black/40 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-sans"
                  />
                </motion.div>
              )}
            </div>

            {/* Version B Transitions */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 space-y-3">
              <h4 className="text-xs font-black text-sky-400">الانتقالات في النسخة B:</h4>
              <div className="flex flex-col gap-2">
                {[
                  { value: 'smooth', label: '🟢 انسيابي ومريح للاستماع' },
                  { value: 'sudden', label: '🔴 فيه قفزة مفاجئة مزعجة' },
                  { value: 'not_sure', label: '🟡 مو متأكد / حدّي' }
                ].map(opt => (
                  <label key={opt.value} className={`flex items-center gap-2.5 p-2 rounded-lg text-xs cursor-pointer border transition-all ${evaluation.transitionsB === opt.value ? 'bg-sky-500/10 border-sky-500/40 text-sky-300 font-bold' : 'bg-black/20 border-transparent text-gray-400 hover:text-gray-200'}`}>
                    <input
                      type="radio"
                      name="transitionsB"
                      value={opt.value}
                      checked={evaluation.transitionsB === opt.value}
                      onChange={() => updateEvaluationField('transitionsB', opt.value as any)}
                      className="text-sky-500 focus:ring-sky-500"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              {evaluation.transitionsB === 'sudden' && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
                  <label className="block text-[11px] text-gray-400 mb-1 font-bold">حدد وين بالضبط:</label>
                  <input
                    id="transitions-details-b-input"
                    type="text"
                    value={evaluation.transitionsDetailsB}
                    onChange={(e) => updateEvaluationField('transitionsDetailsB', e.target.value)}
                    placeholder="مثال: قفزة حادة في الطبول بالثانية 45..."
                    className="w-full bg-black/40 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 font-sans"
                  />
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tags Evaluation Sheet */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="border-b border-slate-800 pb-4 mb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>📊</span> جدول تقييم التاقات والمقاطع التفصيلي (الفوكالز والآلات)
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            يرجى تقييم أداء كل عنصر وفق المقاييس الفنية المعتمدة للفوكالز والآلات.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 bg-black/30 p-3 rounded-xl border border-slate-800/80 mb-6 text-xs">
          <span className="font-bold text-gray-400">مقياس الفوكالز:</span>
          <span className="text-red-400">🔴 صاخب مزعج (صراخ)</span>
          <span className="text-yellow-400">🟡 نعسان خامل (باهت)</span>
          <span className="text-emerald-400 font-bold">🟢 معتدل جميل (الهدف)</span>
          <span className="text-gray-600">|</span>
          <span className="font-bold text-gray-400">مقياس الآلات:</span>
          <span className="text-red-400">🔴 فوضى/مزعج</span>
          <span className="text-yellow-400">🟡 خامل/غايب</span>
          <span className="text-emerald-400 font-bold">🟢 متوازن (يدعم اللحظة)</span>
        </div>

        <div className="space-y-4">
          {evaluation.tagEvaluations.map((tagEval, idx) => {
            const isVocal = tagEval.type === 'vocals';
            return (
              <div
                key={tagEval.id}
                id={`tag-row-${tagEval.id}`}
                className="p-5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Tag Info */}
                <div className="space-y-1.5 lg:max-w-[45%]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-gray-500 bg-black/50 px-2 py-0.5 rounded">
                      #{idx + 1}
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${isVocal ? 'bg-indigo-500/15 text-indigo-300' : 'bg-pink-500/15 text-pink-300'}`}>
                      {isVocal ? 'فوكالز 🎤' : 'آلات وعزف 🎸'}
                    </span>
                    <span className="text-sm font-mono font-bold text-amber-300 bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded leading-none">
                      {tagEval.tag}
                    </span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="text-[11px] text-gray-500 font-extrabold whitespace-nowrap pt-0.5">المتوقع منه:</span>
                    <p className="text-xs text-gray-400 leading-relaxed font-medium">
                      {tagEval.expected}
                    </p>
                  </div>
                </div>

                {/* Ratings block */}
                <div className="flex flex-wrap items-center gap-6 shrink-0 bg-slate-900/40 p-3 rounded-xl border border-slate-900">
                  {/* Version A Rating */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span className="text-xs font-bold text-emerald-400">تقييم النسخة A:</span>
                    </div>
                    <div className="flex items-center gap-1 bg-black/30 p-1 rounded-lg">
                      {(['RED', 'YELLOW', 'GREEN'] as Rating[]).map(val => (
                        <button
                          key={val}
                          id={`btn-tag-${tagEval.id}-A-${val}`}
                          onClick={() => handleTagRatingChange(tagEval.id, 'A', tagEval.ratingA === val ? null : val)}
                          className={`w-10 h-7 rounded text-xs flex items-center justify-center transition-all ${
                            tagEval.ratingA === val
                              ? val === 'GREEN' ? 'bg-emerald-500 text-black font-extrabold' : val === 'YELLOW' ? 'bg-yellow-500 text-black font-extrabold' : 'bg-red-500 text-black font-extrabold'
                              : 'text-gray-500 hover:bg-slate-800 hover:text-gray-300'
                          }`}
                          title={isVocal ? getVocalLabel(val) : getInstrumentLabel(val)}
                        >
                          {val === 'GREEN' ? '🟢' : val === 'YELLOW' ? '🟡' : '🔴'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Version B Rating */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                      <span className="text-xs font-bold text-sky-400">تقييم النسخة B:</span>
                    </div>
                    <div className="flex items-center gap-1 bg-black/30 p-1 rounded-lg">
                      {(['RED', 'YELLOW', 'GREEN'] as Rating[]).map(val => (
                        <button
                          key={val}
                          id={`btn-tag-${tagEval.id}-B-${val}`}
                          onClick={() => handleTagRatingChange(tagEval.id, 'B', tagEval.ratingB === val ? null : val)}
                          className={`w-10 h-7 rounded text-xs flex items-center justify-center transition-all ${
                            tagEval.ratingB === val
                              ? val === 'GREEN' ? 'bg-emerald-500 text-black font-extrabold' : val === 'YELLOW' ? 'bg-yellow-500 text-black font-extrabold' : 'bg-red-500 text-black font-extrabold'
                              : 'text-gray-500 hover:bg-slate-800 hover:text-gray-300'
                          }`}
                          title={isVocal ? getVocalLabel(val) : getInstrumentLabel(val)}
                        >
                          {val === 'GREEN' ? '🟢' : val === 'YELLOW' ? '🟡' : '🔴'}
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
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-md space-y-5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-900 pb-3">
            <span>📝</span> الأسئلة والتدوينات
          </h3>

          {/* Section Special Question (e.g. for Section 3 or Section 4) */}
          {section.specialQuestion && (
            <div className="space-y-2 bg-amber-500/5 p-4 rounded-xl border border-amber-500/10">
              <label htmlFor="special-question-textarea" className="block text-sm font-bold text-amber-300 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" /> {section.specialQuestion}
              </label>
              <textarea
                id="special-question-textarea"
                rows={3}
                value={evaluation.specialQuestionAnswer}
                onChange={(e) => updateEvaluationField('specialQuestionAnswer', e.target.value)}
                placeholder="سجل انطباعك وإجابتك التفصيلية هنا..."
                className="w-full bg-black/40 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500 font-sans leading-relaxed text-right dir-rtl"
              />
            </div>
          )}

          {/* General Notes */}
          <div className="space-y-2">
            <label htmlFor="section-notes-textarea" className="block text-sm font-bold text-gray-300">
              ملاحظات حرة وانطباعات المستمع العامة لهذا القسم:
            </label>
            <textarea
              id="section-notes-textarea"
              rows={4}
              value={evaluation.notes}
              onChange={(e) => updateEvaluationField('notes', e.target.value)}
              placeholder="اكتب ملاحظاتك الفنية، مواطن الجمال، أو أي مشاكل لم تغطها التاقات الفردية..."
              className="w-full bg-black/45 border border-slate-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-sans leading-relaxed text-right dir-rtl"
            />
          </div>
        </div>

        {/* Right: Success & Preference */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col justify-between">
          <div className="space-y-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-900 pb-3">
              <span>🏆</span> النتيجة والخلاصة العامة للقسم
            </h3>

            {/* General Success A & B */}
            <div className="space-y-3">
              <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wide">
                النجاح الفني العام للقسم (هل نجح؟)
              </label>
              
              {/* Success A */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-sm font-bold text-gray-200">النسخة A</span>
                </div>
                <button
                  id="btn-success-A"
                  onClick={() => updateEvaluationField('generalSuccessA', !evaluation.generalSuccessA)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold font-sans transition-all border ${
                    evaluation.generalSuccessA 
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}
                >
                  {evaluation.generalSuccessA ? '🟢 ناجحة تقنياً' : '🔴 غير ناجحة'}
                </button>
              </div>

              {/* Success B */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                  <span className="text-sm font-bold text-gray-200">النسخة B</span>
                </div>
                <button
                  id="btn-success-B"
                  onClick={() => updateEvaluationField('generalSuccessB', !evaluation.generalSuccessB)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold font-sans transition-all border ${
                    evaluation.generalSuccessB 
                      ? 'bg-sky-500/20 text-sky-400 border-sky-500/30' 
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}
                >
                  {evaluation.generalSuccessB ? '🟢 ناجحة تقنياً' : '🔴 غير ناجحة'}
                </button>
              </div>
            </div>

            {/* Preferred Version Selector */}
            <div className="space-y-2.5 pt-1">
              <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wide">
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
                    className={`p-2 rounded-xl text-xs font-bold transition-all border ${
                      evaluation.preferredVersion === opt.value
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-slate-900 border-transparent text-gray-400 hover:text-gray-200 hover:bg-slate-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-900 text-center text-[11px] text-gray-500">
            تم تقييم {evaluation.tagEvaluations.filter(t => t.ratingA !== null || t.ratingB !== null).length} من أصل {evaluation.tagEvaluations.length} تاقات
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { sectionsData, initialEvaluationState } from './data';
import { SectionEvaluation, Rating } from './types';
import SectionEvaluator from './components/SectionEvaluator';
import SummaryDashboard from './components/SummaryDashboard';
import { Play, FileAudio, FolderOpen, UploadCloud, Info, CheckCircle, BarChart3, HelpCircle, Star, Music, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const LOCAL_STORAGE_KEY = 'suno_eval_v4_state';

export default function App() {
  const [activeTab, setActiveTab] = useState<'sections' | 'summary'>('sections');
  const [activeSectionId, setActiveSectionId] = useState<number>(1);
  const [evaluations, setEvaluations] = useState<Record<number, SectionEvaluation>>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse local storage", e);
      }
    }
    return initialEvaluationState(sectionsData);
  });

  // Mapped audio urls
  const [audioUrls, setAudioUrls] = useState<Record<number, { A: string | null; B: string | null }>>(() => {
    const initial: Record<number, { A: string | null; B: string | null }> = {};
    sectionsData.forEach(s => {
      initial[s.id] = { A: null, B: null };
    });
    return initial;
  });

  // Track filenames mapped for displaying to the user
  const [loadedFilesInfo, setLoadedFilesInfo] = useState<Record<string, { size: string; status: 'loaded' | 'missing' }>>(() => {
    const initial: Record<string, { size: string; status: 'loaded' | 'missing' }> = {};
    sectionsData.forEach(s => {
      initial[`${s.id}_A`] = { size: '', status: 'missing' };
      initial[`${s.id}_B`] = { size: '', status: 'missing' };
    });
    return initial;
  });

  // Track if synthesizer mode is enabled (for instant out-of-box demoing)
  const [demoSynthActive, setDemoSynthActive] = useState(false);

  // Synchronize state with local storage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(evaluations));
  }, [evaluations]);

  // Clean up Object URLs when unmounting
  useEffect(() => {
    return () => {
      (Object.values(audioUrls) as { A: string | null; B: string | null }[]).forEach(urls => {
        if (urls.A && urls.A.startsWith('blob:')) URL.revokeObjectURL(urls.A);
        if (urls.B && urls.B.startsWith('blob:')) URL.revokeObjectURL(urls.B);
      });
    };
  }, [audioUrls]);

  const handleEvaluationChange = (updated: SectionEvaluation) => {
    setEvaluations(prev => ({
      ...prev,
      [updated.sectionId]: updated
    }));
  };

  const handleImportState = (imported: Record<number, SectionEvaluation>) => {
    setEvaluations(imported);
  };

  const handleReset = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setEvaluations(initialEvaluationState(sectionsData));
    setDemoSynthActive(false);
    // Revoke all blob URLs
    (Object.values(audioUrls) as { A: string | null; B: string | null }[]).forEach(urls => {
      if (urls.A && urls.A.startsWith('blob:')) URL.revokeObjectURL(urls.A);
      if (urls.B && urls.B.startsWith('blob:')) URL.revokeObjectURL(urls.B);
    });
    const resetUrls: Record<number, { A: string | null; B: string | null }> = {};
    sectionsData.forEach(s => {
      resetUrls[s.id] = { A: null, B: null };
    });
    setAudioUrls(resetUrls);
    const resetInfo: Record<string, { size: string; status: 'loaded' | 'missing' }> = {};
    sectionsData.forEach(s => {
      resetInfo[`${s.id}_A`] = { size: '', status: 'missing' };
      resetInfo[`${s.id}_B`] = { size: '', status: 'missing' };
    });
    setLoadedFilesInfo(resetInfo);
  };

  // Drag & Drop or manual local file upload parser
  const handleAudioFilesUpload = (files: FileList | null) => {
    if (!files) return;

    const newUrls = { ...audioUrls };
    const newInfo = { ...loadedFilesInfo };
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const name = file.name;

      // Extract section number (1 to 6)
      const sectionMatch = name.match(/القسم\s*(\d+)/) || name.match(/Section\s*(\d+)/i) || name.match(/(\d+)/);
      if (!sectionMatch) continue;

      const secId = parseInt(sectionMatch[1], 10);
      if (secId < 1 || secId > 6) continue;

      // Determine version A or B
      const upperName = name.toUpperCase();
      let version: 'A' | 'B' | null = null;
      if (upperName.includes('SONG_A') || upperName.includes('_A.MP3') || upperName.includes(' A.')) {
        version = 'A';
      } else if (upperName.includes('SONG_B') || upperName.includes('_B.MP3') || upperName.includes(' B.')) {
        version = 'B';
      }

      if (version) {
        // Revoke old URL if it exists
        const oldUrl = newUrls[secId][version];
        if (oldUrl && oldUrl.startsWith('blob:')) {
          URL.revokeObjectURL(oldUrl);
        }

        // Generate local blob url
        const objectUrl = URL.createObjectURL(file);
        // IMPORTANT: create a new { A, B } object rather than mutating the
        // existing one in place. `newUrls` is only a shallow copy of
        // `audioUrls`, so `newUrls[secId]` is still the SAME object as
        // `audioUrls[secId]`. Mutating it here would also silently change
        // the previous render's state, which the cleanup effect below
        // (keyed on `[audioUrls]`) closes over — causing it to revoke the
        // blob URL we just created the instant this update commits.
        newUrls[secId] = { ...newUrls[secId], [version]: objectUrl };

        // Size format
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2) + " MB";
        newInfo[`${secId}_${version}`] = { size: sizeMb, status: 'loaded' };
        successCount++;
      }
    }

    if (successCount > 0) {
      setAudioUrls(newUrls);
      setLoadedFilesInfo(newInfo);
      setDemoSynthActive(false); // Disable synth fallback when real files are loaded
    }
  };

  // Interactive Synthesizer fallback for demoing and testing purposes
  const enableDemoSynthMode = () => {
    // Generate simple synth audio urls (using oscillators with Web Audio API and converting to DataURLs isn't easy,
    // so we can use a small pre-recorded base64 beep or silence file that runs in HTML5 player, or we can use
    // some royalty free web audio assets. Let's load standard synthesized audio to make sure players are fully operational).
    // Let's use a standard public short mp3 clip or beep, but even better, we can inject a simple 2-second synthesized sine wave
    // data URL as the source so they can hear sounds and interact with the seekbar!
    
    // A 5-second synthesized sine wave synthesized as data URL
    const demoBeepA = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"; // Or a small stable royalty-free test track
    const demoBeepB = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"; // Diff test track for B

    const demoUrls: Record<number, { A: string | null; B: string | null }> = {};
    const demoInfo = { ...loadedFilesInfo };

    sectionsData.forEach(s => {
      // We will map test tracks to give a flawless demonstration out of the box!
      demoUrls[s.id] = {
        A: `https://actions.google.com/sounds/v1/science_fiction/force_field.ogg`,
        B: `https://actions.google.com/sounds/v1/science_fiction/ambient_space_machine.ogg`
      };
      demoInfo[`${s.id}_A`] = { size: 'Demo OGG', status: 'loaded' };
      demoInfo[`${s.id}_B`] = { size: 'Demo OGG', status: 'loaded' };
    });

    setAudioUrls(demoUrls);
    setLoadedFilesInfo(demoInfo);
    setDemoSynthActive(true);
  };

  const activeSection = sectionsData.find(s => s.id === activeSectionId) || sectionsData[0];
  const activeEvaluation = evaluations[activeSectionId];

  // Global counts for files
  const loadedFilesCount = (Object.values(loadedFilesInfo) as { size: string; status: 'loaded' | 'missing' }[]).filter(f => f.status === 'loaded').length;

  return (
    <div id="app-container" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Premium Navigation Header */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Platform Title */}
          <div className="flex items-center gap-3 text-right dir-rtl">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/25">
              <Music className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white tracking-tight">منصة تقييم استماع أغاني سونو v4</h1>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full font-mono">
                  NABIGHA_01
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-medium">مشروع تقييم 6 أقسام لقصيدة النابغة الذبياني (سونو v4 — مقارنة A/B ثنائية)</p>
            </div>
          </div>

          {/* Tab Switcher & Status */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Tab switchers */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex">
              <button
                id="tab-sections"
                onClick={() => setActiveTab('sections')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'sections' 
                    ? 'bg-indigo-500 text-white shadow-md' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span>🎵</span> الأقسام والمقاطع
              </button>
              <button
                id="tab-summary"
                onClick={() => setActiveTab('summary')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'summary' 
                    ? 'bg-indigo-500 text-white shadow-md' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>📊 تقرير التقييم والتحليل</span>
              </button>
            </div>

            {/* Total File loading info */}
            <div className="text-xs bg-slate-950/40 px-3 py-2 rounded-xl border border-slate-800 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${loadedFilesCount === 12 ? 'bg-emerald-400 animate-ping' : loadedFilesCount > 0 ? 'bg-amber-400' : 'bg-gray-600'}`}></span>
              <span className="text-gray-300 font-sans font-medium">
                {loadedFilesCount === 12 ? '🔊 تم تحميل الـ 12 ملفاً صوتياً بنجاح!' : `الملفات الصوتية: ${loadedFilesCount} / 12`}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {/* Magic File Association & Drag Drop Box */}
        {loadedFilesCount < 12 && (
          <div className="bg-slate-900/60 border border-dashed border-indigo-500/30 rounded-2xl p-5 text-right dir-rtl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl shrink-0">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-sans">تزامن ومزامنة الملفات الصوتية المحلية</h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-xl font-medium">
                    اسحب وأسقط الـ 12 ملفاً من المجلد <code className="text-indigo-300 bg-indigo-950/40 px-1 py-0.5 rounded font-mono">D:\MY_MUSIC\NABIGHA_01_1807206\START_ON TRUE</code> مباشرة هنا! سيقوم النظام تلقائياً بربط الملف بالقسم والنسخة الصحيحة دون رفع أي بايت للإنترنت.
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  id="btn-demo-synth"
                  onClick={enableDemoSynthMode}
                  className="px-4 py-2 bg-slate-800 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer"
                >
                  {demoSynthActive ? '⚡ تشغيل تجريبي مفعل' : '🎭 تفعيل تشغيل تجريبي (Demo Tracks)'}
                </button>
                <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer">
                  <span>📂 اختر الملفات</span>
                  <input
                    id="input-audio-picker"
                    type="file"
                    multiple
                    accept="audio/*"
                    onChange={(e) => handleAudioFilesUpload(e.target.files)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Local files status badges */}
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-800/60">
              {sectionsData.map(s => {
                const statusA = loadedFilesInfo[`${s.id}_A`]?.status === 'loaded';
                const statusB = loadedFilesInfo[`${s.id}_B`]?.status === 'loaded';
                return (
                  <div key={s.id} className="bg-black/30 px-2.5 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2 text-[10px]">
                    <span className="text-gray-400 font-bold font-sans">القسم {s.id}:</span>
                    <span className={`px-1.5 rounded ${statusA ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-500'}`}>A</span>
                    <span className={`px-1.5 rounded ${statusB ? 'bg-sky-500/20 text-sky-400' : 'bg-gray-800 text-gray-500'}`}>B</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Dynamic content render depending on Active Tab */}
        <AnimatePresence mode="wait">
          {activeTab === 'sections' ? (
            <motion.div
              key="sections-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-4 gap-6"
            >
              {/* Left sidebar directory list */}
              <div className="lg:col-span-1 space-y-3 order-last lg:order-first">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md">
                  <h3 className="text-sm font-extrabold text-gray-400 uppercase tracking-wider mb-3">فهرس الأقسام الستة</h3>
                  <div className="space-y-1.5">
                    {sectionsData.map(s => {
                      const isActive = s.id === activeSectionId;
                      const hasFiles = loadedFilesInfo[`${s.id}_A`]?.status === 'loaded' && loadedFilesInfo[`${s.id}_B`]?.status === 'loaded';
                      const ratedTagsCount = evaluations[s.id]?.tagEvaluations.filter(t => t.ratingA !== null || t.ratingB !== null).length || 0;
                      const totalTags = s.tags.length;
                      const isFullyEvaluated = ratedTagsCount === totalTags;

                      return (
                        <button
                          key={s.id}
                          id={`sidebar-sec-btn-${s.id}`}
                          onClick={() => setActiveSectionId(s.id)}
                          className={`w-full text-right p-3 rounded-xl border flex flex-col justify-between transition-all cursor-pointer ${
                            isActive 
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' 
                              : 'bg-slate-950 border-slate-800/80 text-gray-300 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs font-bold font-mono">القسم {s.id}</span>
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                              isActive ? 'bg-indigo-500 text-indigo-100' : 'bg-slate-900 text-gray-400'
                            }`}>
                              مقام {s.maqam}
                            </span>
                          </div>
                          <p className="text-xs font-bold truncate mt-1 text-right font-sans w-full">
                            {s.title.split('—')[1] || s.title}
                          </p>

                          {/* Progress bar info */}
                          <div className="w-full mt-2.5 flex items-center justify-between text-[10px]">
                            <span className={isActive ? 'text-indigo-100' : 'text-gray-500'}>
                              {hasFiles ? '🔊 صوت متوفر' : '⚪ بدون صوت'}
                            </span>
                            <span className={`font-mono font-bold ${isFullyEvaluated ? 'text-emerald-400' : 'text-gray-400'}`}>
                              {ratedTagsCount} / {totalTags} تاق
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Info summary card on sidebar */}
                <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl text-right">
                  <h4 className="text-xs font-bold text-gray-400">نصيحة تقييم:</h4>
                  <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                    استمع لكل قسم **كامل ومرة وحدة بدون توقف** أول شي (زي ما تسمعه وأنت تشتغل)، سجّل الانطباع العام، وبعدين ارجع لكل نقطة بالتفصيل لو احتجت.
                  </p>
                </div>
              </div>

              {/* Main Evaluator panel */}
              <div className="lg:col-span-3">
                <SectionEvaluator
                  section={activeSection}
                  evaluation={activeEvaluation}
                  audioUrls={audioUrls[activeSectionId]}
                  onChange={handleEvaluationChange}
                  onNext={() => {
                    if (activeSectionId < 6) setActiveSectionId(activeSectionId + 1);
                  }}
                  onPrev={() => {
                    if (activeSectionId > 1) setActiveSectionId(activeSectionId - 1);
                  }}
                  isFirst={activeSectionId === 1}
                  isLast={activeSectionId === 6}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="summary-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <SummaryDashboard
                evaluations={evaluations}
                sections={sectionsData}
                onImportState={handleImportState}
                onReset={handleReset}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 text-center text-xs text-gray-500 mt-auto font-sans">
        <p>© 2026 مشروع تقييم قصيدة النابغة الذبياني — Suno v4 | تم التطوير وفقاً لأعلى معايير الإتقان والتصميم المتجانس</p>
      </footer>
    </div>
  );
}
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { sectionsData, initialEvaluationState } from './data';
import { SectionEvaluation, Rating } from './types';
import SectionEvaluator from './components/SectionEvaluator';
import SummaryDashboard from './components/SummaryDashboard';
import { UploadCloud, BarChart3 } from 'lucide-react';
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
    // Generate simple synth audio urls...
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
    <div id="app-container" className="min-h-screen bg-paper text-ink flex flex-col font-body selection:bg-gold selection:text-paper-raised">
      {/* Manuscript Header */}
      <header className="bg-paper-raised border-b-2 border-gold sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Platform Title / Brand roundel */}
          <div className="flex items-center gap-4 text-right dir-rtl">
            <div className="w-12 h-12 rounded-full border-2 border-gold flex items-center justify-center font-display text-xl text-gold-deep bg-[radial-gradient(circle,var(--color-paper-raised)_55%,var(--color-paper-sunk)_100%)] shrink-0">
              ن
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-display font-bold text-ink tracking-tight">ديوان تقييم النابغة</h1>
                <span className="font-latin text-[11px] text-gold-deep border border-gold px-2.5 py-0.5 rounded-full">
                  NABIGHA_01
                </span>
              </div>
              <p className="font-latin italic text-[13px] text-ink-soft mt-0.5">استماع نقدي مقارن — سونو الإصدار الرابع</p>
            </div>
          </div>

          {/* Tab Switcher & Status */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Tab switchers */}
            <div className="flex gap-1">
              <button
                id="tab-sections"
                onClick={() => setActiveTab('sections')}
                className={`px-5 py-2 rounded-t-xl text-[15px] font-body transition-all border cursor-pointer ${
                  activeTab === 'sections'
                    ? 'bg-paper-sunk text-ink border-line font-bold'
                    : 'text-ink-soft border-transparent hover:text-ink'
                }`}
              >
                الأقسام والمقاطع
              </button>
              <button
                id="tab-summary"
                onClick={() => setActiveTab('summary')}
                className={`px-5 py-2 rounded-t-xl text-[15px] font-body transition-all border flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'summary'
                    ? 'bg-paper-sunk text-ink border-line font-bold'
                    : 'text-ink-soft border-transparent hover:text-ink'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>التقرير</span>
              </button>
            </div>

            {/* Total File loading info */}
            <div className="font-latin text-xs text-ink-soft border border-line px-3.5 py-1.5 rounded-full bg-paper-sunk flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${loadedFilesCount === 12 ? 'bg-sage animate-ping' : loadedFilesCount > 0 ? 'bg-amber' : 'bg-ink-faint'}`}></span>
              <span>
                {loadedFilesCount === 12 ? 'تم تحميل الـ 12 ملفاً صوتياً بنجاح' : `الملفات ${loadedFilesCount} / 12`}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">

        {/* Magic File Association & Drag Drop Box */}
        {loadedFilesCount < 12 && (
          <div className="border border-line bg-paper-raised rounded-2xl p-5 text-right dir-rtl shadow-[0_1px_0_var(--color-line)]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-3 bg-paper-sunk text-gold-deep rounded-xl shrink-0 border border-line">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-display text-ink">تزامن الملفات الصوتية</h3>
                  <p className="text-[15px] text-ink-soft mt-1.5 leading-relaxed max-w-xl">
                    اسحب وأسقط الـ 12 ملفاً من المجلد <code className="font-latin italic text-gold-deep px-1 py-0.5 rounded">D:\MY_MUSIC\NABIGHA_01_1807206\START_ON TRUE</code> مباشرة هنا! سيقوم النظام تلقائياً بربط الملف بالقسم والنسخة الصحيحة دون رفع أي بايت للإنترنت.
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  id="btn-demo-synth"
                  onClick={enableDemoSynthMode}
                  className="px-5 py-2.5 bg-paper-sunk text-ink hover:bg-line/60 rounded-full text-sm font-body transition-all border border-gold cursor-pointer"
                >
                  {demoSynthActive ? '⚡ تشغيل تجريبي مفعل' : 'تفعيل تشغيل تجريبي'}
                </button>
                <label className="px-5 py-2.5 bg-gold hover:bg-gold-deep text-paper-raised rounded-full text-sm font-bold transition-all cursor-pointer">
                  <span>اختر الملفات</span>
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
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-dashed border-line">
              {sectionsData.map(s => {
                const statusA = loadedFilesInfo[`${s.id}_A`]?.status === 'loaded';
                const statusB = loadedFilesInfo[`${s.id}_B`]?.status === 'loaded';
                return (
                  <div key={s.id} className="font-latin text-xs border border-line px-2.5 py-1 rounded-full text-ink-soft bg-paper-sunk flex items-center gap-1.5">
                    <b className="text-gold-deep">القسم {s.id}</b>
                    <span className={statusA ? 'text-amber font-bold' : 'text-ink-faint'}>A{statusA ? '●' : '○'}</span>
                    <span className={statusB ? 'text-sage font-bold' : 'text-ink-faint'}>B{statusB ? '●' : '○'}</span>
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
                <div className="bg-paper-raised border border-line p-4 rounded-2xl">
                  <h3 className="font-display text-base text-gold-deep mb-3">فهرس الأقسام الستة</h3>
                  <div className="space-y-2.5">
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
                          className={`w-full text-right p-3.5 rounded-xl border flex flex-col justify-between transition-all cursor-pointer bg-paper-raised ${
                            isActive
                              ? 'border-2 border-gold p-[13px]'
                              : 'border-line hover:bg-paper-sunk'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="w-[26px] h-[26px] rounded-full border-[1.5px] border-gold flex items-center justify-center font-display text-xs text-gold-deep">
                              {s.id}
                            </span>
                            <span className="font-latin italic text-xs text-ink-soft">
                              مقام {s.maqam}
                            </span>
                          </div>
                          <h4 className="font-display text-base text-ink mt-2">
                            {s.title.split('—')[1] || s.title}
                          </h4>

                          {/* Progress bar info */}
                          <div className="w-full mt-2.5 flex items-center justify-between font-latin text-[11.5px] text-ink-faint">
                            <span>
                              {hasFiles ? 'صوت متوفر' : 'بدون صوت'}
                            </span>
                            <span className={isFullyEvaluated ? 'text-sage font-bold' : ''}>
                              {ratedTagsCount} / {totalTags}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Info summary card on sidebar */}
                <div className="border border-line bg-paper-raised p-4 rounded-2xl text-right">
                  <h5 className="font-display text-sm text-gold-deep mb-2">نصيحة تقييم</h5>
                  <p className="text-sm text-ink-soft leading-relaxed">
                    استمع لكل قسم كاملاً بدون توقف أول شي (زي ما تسمعه وأنت تشتغل)، سجّل الانطباع العام، وبعدين ارجع لكل نقطة بالتفصيل لو احتجت.
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
      <footer className="border-t border-line py-8 text-center font-latin italic text-[13px] text-ink-faint mt-auto">
        <p>مشروع تقييم قصيدة النابغة الذبياني — سونو الإصدار الرابع · 2026</p>
      </footer>
    </div>
  );
}
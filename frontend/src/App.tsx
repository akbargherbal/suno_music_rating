/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { ProjectData, EvaluationState } from './types';
import { api } from './api';
import ProjectSelector from './components/ProjectSelector';
import SectionEvaluator from './components/SectionEvaluator';
import SummaryDashboard from './components/SummaryDashboard';
import { UploadCloud, BarChart3, ArrowLeftRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [evaluations, setEvaluations] = useState<EvaluationState | null>(null);
  const [activeTab, setActiveTab] = useState<'sections' | 'summary'>('sections');
  const [activeSectionId, setActiveSectionId] = useState<number>(1);
  const [audioManifest, setAudioManifest] = useState<Record<string, { filename: string; sizeBytes: number; url: string }>>({});
  const [uploadProgress, setUploading] = useState<Record<string, boolean>>({});

  // Fetch project config and evaluations when selection changes
  useEffect(() => {
    if (!activeProjectId) {
      setProject(null);
      setEvaluations(null);
      return;
    }

    Promise.all([
      api.getProject(activeProjectId),
      api.getEvaluations(activeProjectId),
      api.getAudioManifest(activeProjectId)
    ])
      .then(([projData, evalData, audioData]) => {
        setProject(projData);
        setEvaluations(evalData);
        setAudioManifest(audioData);
        if (projData.sections.length > 0) {
          setActiveSectionId(projData.sections[0].id);
        }
      })
      .catch((err) => {
        alert(`❌ فشل تحميل بيانات المشروع: ${err.message}`);
        setActiveProjectId(null);
      });
  }, [activeProjectId]);

  const handleEvaluationChange = (updated: any) => {
    if (!activeProjectId || !evaluations) return;
    const nextState = { ...evaluations, [updated.sectionId]: updated };
    setEvaluations(nextState);
    // Autosave to backend
    api.saveEvaluations(activeProjectId, nextState).catch((err) => {
      console.error('Failed to autosave evaluations:', err);
    });
  };

  const handleImportState = (imported: EvaluationState) => {
    if (!activeProjectId) return;
    setEvaluations(imported);
    api.saveEvaluations(activeProjectId, imported).catch((err) => {
      alert(`⚠️ تعذر مزامنة الملف المستورد مع الخادم: ${err.message}`);
    });
  };

  const handleReset = () => {
    if (!activeProjectId) return;
    api.resetEvaluations(activeProjectId)
      .then((fresh) => {
        setEvaluations(fresh);
        alert('📊 تم تصفير بيانات التقييم بالكامل بنجاح!');
      })
      .catch((err) => {
        alert(`❌ فشل إعادة التهيئة: ${err.message}`);
      });
  };

  const handleAudioUpload = async (files: FileList | null) => {
    if (!activeProjectId || !project || !files) return;

    let successCount = 0;
    const newManifest = { ...audioManifest };

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const name = file.name;

      // Match section number
      const sectionMatch = name.match(/القسم\s*(\d+)/) || name.match(/Section\s*(\d+)/i) || name.match(/(\d+)/);
      if (!sectionMatch) continue;

      const secId = parseInt(sectionMatch[1], 10);
      const matchedSection = project.sections.find((s) => s.id === secId);
      if (!matchedSection) continue;

      // Match version A or B
      const upperName = name.toUpperCase();
      let version: 'A' | 'B' | null = null;
      if (upperName.includes('SONG_A') || upperName.includes('_A.') || upperName.includes(' A.')) {
        version = 'A';
      } else if (upperName.includes('SONG_B') || upperName.includes('_B.') || upperName.includes(' B.')) {
        version = 'B';
      }

      if (version) {
        const key = `${secId}_${version}`;
        setUploading((prev) => ({ ...prev, [key]: true }));
        try {
          const res = await api.uploadAudio(activeProjectId, secId, version, file);
          newManifest[key] = {
            filename: res.filename,
            sizeBytes: res.sizeBytes,
            url: `/api/projects/${activeProjectId}/audio/file/${res.filename}`,
          };
          successCount++;
        } catch (err: any) {
          alert(`❌ فشل رفع الملف ${name}: ${err.message}`);
        } finally {
          setUploading((prev) => ({ ...prev, [key]: false }));
        }
      }
    }

    if (successCount > 0) {
      setAudioManifest(newManifest);
    }
  };

  if (!activeProjectId || !project || !evaluations) {
    return <ProjectSelector onSelect={setActiveProjectId} />;
  }

  const activeSection = project.sections.find((s) => s.id === activeSectionId) || project.sections[0];
  const activeEvaluation = evaluations[activeSectionId];

  // Resolve audio sources from manifest
  const audioUrls = {
    A: audioManifest[`${activeSectionId}_A`]?.url || null,
    B: audioManifest[`${activeSectionId}_B`]?.url || null,
  };

  const loadedFilesCount = Object.keys(audioManifest).length;
  const totalExpectedFiles = project.sections.length * 2;

  return (
    <div id="app-container" className="min-h-screen bg-paper text-ink flex flex-col font-body selection:bg-gold selection:text-paper-raised">
      {/* Header */}
      <header className="bg-paper-raised border-b-2 border-gold sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-right dir-rtl">
            <button
              onClick={() => setActiveProjectId(null)}
              className="w-12 h-12 rounded-full border-2 border-gold flex items-center justify-center font-display text-xl text-gold-deep bg-paper hover:bg-paper-sunk transition-all cursor-pointer shrink-0"
              title="العودة لاختيار مشروع آخر"
            >
              {project.brandLetter || 'ن'}
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-display font-bold text-ink tracking-tight">{project.title}</h1>
                <span className="font-latin text-[11px] text-gold-deep border border-gold px-2.5 py-0.5 rounded-full">
                  {project.projectId}
                </span>
              </div>
              {project.subtitle && <p className="font-latin italic text-[13px] text-ink-soft mt-0.5">{project.subtitle}</p>}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
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
                <span>التقرير الختامي</span>
              </button>
            </div>

            <div className="font-latin text-xs text-ink-soft border border-line px-3.5 py-1.5 rounded-full bg-paper-sunk flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${loadedFilesCount === totalExpectedFiles ? 'bg-sage animate-ping' : loadedFilesCount > 0 ? 'bg-amber' : 'bg-ink-faint'}`}></span>
              <span>
                {loadedFilesCount === totalExpectedFiles ? 'كافة الملفات الصوتية متوفرة ومزامنة' : `الصوتيات المرفوعة: ${loadedFilesCount} / ${totalExpectedFiles}`}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Upload Audio Area */}
        {loadedFilesCount < totalExpectedFiles && (
          <div className="border border-line bg-paper-raised rounded-2xl p-5 text-right dir-rtl shadow-[0_1px_0_var(--color-line)]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-3 bg-paper-sunk text-gold-deep rounded-xl shrink-0 border border-line">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-display text-ink font-bold">مزامنة وحفظ الملفات الصوتية</h3>
                  <p className="text-[15px] text-ink-soft mt-1.5 leading-relaxed max-w-xl">
                    اسحب وألقِ كافة ملفات الـ MP3/WAV الخاصة بالمشروع هنا! سيقوم الخادم تلقائياً بحفظ الملفات وربطها بالقسم والنسخة الصحيحة للأبد.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <label className="px-5 py-2.5 bg-gold hover:bg-gold-deep text-paper-raised rounded-full text-sm font-bold transition-all cursor-pointer">
                  <span>اختر الملفات الصوتية</span>
                  <input
                    id="input-audio-picker"
                    type="file"
                    multiple
                    accept="audio/*"
                    onChange={(e) => handleAudioUpload(e.target.files)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-dashed border-line">
              {project.sections.map((s) => {
                const statusA = audioManifest[`${s.id}_A`];
                const statusB = audioManifest[`${s.id}_B`];
                const loadingA = uploadProgress[`${s.id}_A`];
                const loadingB = uploadProgress[`${s.id}_B`];
                return (
                  <div key={s.id} className="font-latin text-xs border border-line px-2.5 py-1 rounded-full text-ink-soft bg-paper-sunk flex items-center gap-1.5">
                    <b className="text-gold-deep">القسم {s.id}</b>
                    <span className={statusA ? 'text-gold-deep font-bold' : loadingA ? 'text-gold-deep animate-pulse' : 'text-ink-faint'}>
                      A{loadingA ? '⏳' : statusA ? '●' : '○'}
                    </span>
                    <span className={statusB ? 'text-gold-deep font-bold' : loadingB ? 'text-gold-deep animate-pulse' : 'text-ink-faint'}>
                      B{loadingB ? '⏳' : statusB ? '●' : '○'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab views */}
        <AnimatePresence mode="wait">
          {activeTab === 'sections' ? (
            <motion.div
              key="sections-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-4 gap-6"
            >
              {/* Sidebar directory list */}
              <div className="lg:col-span-1 space-y-3 order-last lg:order-first">
                <div className="bg-paper-raised border border-line p-4 rounded-2xl">
                  <h3 className="font-display text-base text-gold-deep mb-3 font-bold">فهرس الأقسام</h3>
                  <div className="space-y-2.5">
                    {project.sections.map((s) => {
                      const isActive = s.id === activeSectionId;
                      const hasFiles = audioManifest[`${s.id}_A`] && audioManifest[`${s.id}_B`];
                      const ratedTagsCount = evaluations[s.id]
                        ? Object.values(evaluations[s.id].tagEvaluations).filter((t: any) => t.ratingA !== null || t.ratingB !== null).length
                        : 0;
                      const totalTags = s.tags.length;
                      const isFullyEvaluated = ratedTagsCount === totalTags;

                      return (
                        <button
                          key={s.id}
                          id={`sidebar-sec-btn-${s.id}`}
                          onClick={() => setActiveSectionId(s.id)}
                          className={`w-full text-right p-3.5 rounded-xl border flex flex-col justify-between transition-all cursor-pointer bg-paper-raised ${
                            isActive ? 'border-2 border-gold p-[13px]' : 'border-line hover:bg-paper-sunk'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="w-[26px] h-[26px] rounded-full border-[1.5px] border-gold flex items-center justify-center font-display text-xs text-gold-deep">
                              {s.id}
                            </span>
                            {s.meta?.maqam && (
                              <span className="font-latin italic text-xs text-ink-soft">مقام {s.meta.maqam}</span>
                            )}
                          </div>
                          <h4 className="font-display text-base text-ink mt-2 font-bold">
                            {s.title.split('—')[1] || s.title}
                          </h4>

                          <div className="w-full mt-2.5 flex items-center justify-between font-latin text-[11.5px] text-ink-faint">
                            <span>{hasFiles ? 'صوت متوفر' : 'بدون صوت'}</span>
                            <span className={isFullyEvaluated ? 'text-sage font-bold' : ''}>
                              {ratedTagsCount} / {totalTags}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border border-line bg-paper-raised p-4 rounded-2xl text-right">
                  <h5 className="font-display text-sm text-gold-deep mb-2 font-bold">نصيحة تقييم</h5>
                  <p className="text-sm text-ink-soft leading-relaxed">
                    استمع لكل قسم كاملاً وبشكل متصل أولاً لتسجيل الانطباع الموسيقي العام وسلاسة النقلات، ثم قم بوضع التقييمات الجزئية الدقيقة.
                  </p>
                </div>
              </div>

              {/* Main Evaluator panel */}
              <div className="lg:col-span-3">
                <SectionEvaluator
                  project={project}
                  section={activeSection}
                  evaluation={activeEvaluation}
                  audioUrls={audioUrls}
                  onChange={handleEvaluationChange}
                  onNext={() => {
                    const idx = project.sections.findIndex((s) => s.id === activeSectionId);
                    if (idx !== -1 && idx < project.sections.length - 1) {
                      setActiveSectionId(project.sections[idx + 1].id);
                    }
                  }}
                  onPrev={() => {
                    const idx = project.sections.findIndex((s) => s.id === activeSectionId);
                    if (idx > 0) {
                      setActiveSectionId(project.sections[idx - 1].id);
                    }
                  }}
                  isFirst={project.sections.findIndex((s) => s.id === activeSectionId) === 0}
                  isLast={project.sections.findIndex((s) => s.id === activeSectionId) === project.sections.length - 1}
                  sectionIndex={project.sections.findIndex((s) => s.id === activeSectionId) + 1}
                  sectionCount={project.sections.length}
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
                project={project}
                evaluations={evaluations}
                onImportState={handleImportState}
                onReset={handleReset}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-line py-8 text-center font-latin italic text-[13px] text-ink-faint mt-auto">
        <p>{project.footerNote || 'نظام التقييم المقارن الفني'}</p>
      </footer>
    </div>
  );
}
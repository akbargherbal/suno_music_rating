/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, ChangeEvent } from 'react';
import { ProjectSummary } from '../types';
import { api } from '../api';
import { BookOpen, UploadCloud, AlertCircle, Loader2 } from 'lucide-react';

interface ProjectSelectorProps {
  onSelect: (projectId: string) => void;
}

export default function ProjectSelector({ onSelect }: ProjectSelectorProps) {
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadErrors, setUploadErrors] = useState<string[] | null>(null);
  const [uploading, setUploading] = useState(false);

  const refresh = () => {
    api
      .listProjects()
      .then(setProjects)
      .catch((e) => setError(String(e.message || e)));
  };

  useEffect(refresh, []);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploading(true);
    setUploadErrors(null);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        await api.createProject(parsed);
        refresh();
      } catch (err: any) {
        setUploadErrors(
          err?.message ? [err.message] : ['تعذر إنشاء المشروع — يرجى التحقق من مطابقة ملف JSON للمخطط العام.']
        );
      } finally {
        setUploading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-paper text-ink flex flex-col items-center justify-center p-6 font-body">
      <div className="w-full max-w-2xl space-y-8 text-center">
        <div>
          <div className="w-16 h-16 mx-auto rounded-full border-2 border-gold flex items-center justify-center font-display text-2xl text-gold-deep mb-4">
            <BookOpen className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-display text-ink">نموذج تقييم استماع أغاني سونو</h1>
          <p className="text-ink-soft text-sm mt-2">
            اختر مشروع التقييم الذي تود العمل عليه، أو قم برفع ملف مشروع جديد بصيغة JSON.
          </p>
        </div>

        {error && (
          <div className="border border-burgundy/40 bg-burgundy/5 text-burgundy rounded-xl p-4 text-sm flex items-center gap-2 justify-center">
            <AlertCircle className="w-4 h-4 shrink-0" />
            تعذر الاتصال بالخادم: {error}
          </div>
        )}

        {projects === null && !error && (
          <div className="text-ink-faint text-sm flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> جاري تحميل قائمة المشاريع...
          </div>
        )}

        {projects && projects.length === 0 && (
          <p className="text-ink-faint text-sm">لا توجد مشاريع مضافة حالياً. ابدأ برفع ملف مشروعك الأول أدناه.</p>
        )}

        {projects && projects.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.map((p) => (
              <button
                key={p.projectId}
                id={`project-card-${p.projectId}`}
                onClick={() => onSelect(p.projectId)}
                className="text-right p-5 rounded-2xl border border-line bg-paper-raised hover:border-gold transition-all cursor-pointer"
              >
                <h3 className="font-display text-lg text-ink font-bold">{p.title}</h3>
                {p.subtitle && <p className="text-xs text-ink-soft mt-1">{p.subtitle}</p>}
                <p className="text-[11px] text-ink-faint font-latin mt-3">{p.sectionCount} أقسام مخصصة</p>
              </button>
            ))}
          </div>
        )}

        <div className="border-t border-line pt-6">
          <label
            id="label-new-project"
            className="inline-flex items-center gap-2.5 px-5 py-3 rounded-full bg-gold hover:bg-gold-deep text-paper-raised font-bold text-sm cursor-pointer transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{uploading ? 'جاري رفع المشروع...' : 'رفع مشروع جديد (project.json)'}</span>
            <input
              id="input-new-project-file"
              type="file"
              accept=".json,application/json"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
          {uploadErrors && (
            <div className="mt-4 text-right text-xs text-burgundy bg-burgundy/5 border border-burgundy/30 rounded-xl p-3 max-h-40 overflow-y-auto">
              {uploadErrors.map((err, i) => (
                <div key={i}>{err}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
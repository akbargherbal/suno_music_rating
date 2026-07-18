#!/usr/bin/env python3
"""
Suno Music Rating - Decoupling & Migration Scaffolder (Self-Healing & Windows Compatible)
Author: DebugForge Assistant
Date: 2026-07-18

This script restructures the cloned 'suno_music_rating' repository:
- Robust against Windows encoding issues (explicit UTF-8)
- Self-healing (detects if files have already been moved to frontend/)
"""

import os
import shutil
import subprocess
import sys
import json
import platform


def log_status(message, success=True):
    symbol = "✅" if success else "❌"
    print(f"{symbol} {message}")


def check_environment():
    """Verify script is run inside the root, and detect if partially migrated"""
    # Self-Healing Check: If files were already moved to frontend/ in previous run
    if os.path.exists("frontend/package.json") and os.path.exists(
        "frontend/src/data.ts"
    ):
        log_status(
            "التحقق من المجلد الحالي: تم كشف هيكلة سابقة مجزأة بنجاح. جاري المتابعة والإصلاح..."
        )
        return "frontend"

    required_paths = ["package.json", "src/App.tsx", "src/data.ts"]
    for path in required_paths:
        if not os.path.exists(path):
            log_status(
                f"الملف المفقود: '{path}'. يرجى وضع السكربت وتشغيله في جذر المجلد suno_music_rating المنسوخ.",
                False,
            )
            sys.exit(1)
    log_status("التحقق من المجلد الحالي: مستند سليم للمشروع الأصلي.")
    return "root"


def migrate_poem_data(env_status):
    """Dynamically export current typescript data using tsx to temp JSON with UTF-8 encoding"""
    log_status("بدء هجرة وتصدير بيانات قصيدة النابغة...")

    # Path is always './src/data' relative to where npx runs
    migration_js_code = """
import { sectionsData } from './src/data';

const project = {
  schemaVersion: 1,
  projectId: 'nabigha_v4',
  title: 'ديوان تقييم النابغة',
  subtitle: 'استماع نقدي مقارن — سونو الإصدار الرابع',
  poemTitle: 'قصيدة يا دار ميّة — النابغة الذبياني',
  brandLetter: 'ن',
  footerNote: 'مشروع تقييم قصيدة النابغة الذبياني — سونو الإصدار الرابع · 2026',
  ratingScale: {
    id: 'traffic_light',
    options: [
      { value: 'RED', icon: '🔴' },
      { value: 'YELLOW', icon: '🟡' },
      { value: 'GREEN', icon: '🟢' },
    ],
  },
  tagTypes: {
    vocals: {
      label: 'فوكال',
      ratingLabels: { RED: 'صاخب مزعج', YELLOW: 'نعسان خامل', GREEN: 'معتدل جميل' },
    },
    instruments: {
      label: 'آلات',
      ratingLabels: { RED: 'فوضى/مزعج', YELLOW: 'خامل/غايب', GREEN: 'متوازن' },
    },
  },
  sectionQuestions: [
    {
      id: 'drift',
      label: 'هل حصل انحراف عن المقام؟',
      type: 'single_choice',
      options: ['no', 'yes', 'not_sure'],
      optionLabels: { no: 'لا', yes: 'نعم', not_sure: 'غير متأكد' },
      hasDetails: true,
      detailsLabel: 'تفاصيل الانحراف (إن وجد)',
    },
    {
      id: 'transitions',
      label: 'الانتقالات بين المقاطع',
      type: 'single_choice',
      options: ['smooth', 'sudden', 'not_sure'],
      optionLabels: { smooth: 'سلسة', sudden: 'مفاجئة', not_sure: 'غير متأكد' },
      hasDetails: true,
      detailsLabel: 'تفاصيل الانتقال (إن وجد)',
    },
  ],
  sections: sectionsData.map((s) => ({
    id: s.id,
    title: s.title,
    meta: { maqam: s.maqam },
    description: s.description,
    watchpoint: s.watchpoint,
    specialQuestion: s.specialQuestion ?? null,
    lyrics: s.lyrics,
    tracks: s.tracks,
    tags: s.tags,
  })),
};

console.log(JSON.stringify(project, null, 2));
"""
    temp_script = "temp_export_project.ts"
    with open(temp_script, "w", encoding="utf-8") as f:
        f.write(migration_js_code)

    is_windows = platform.system() == "Windows"

    # Determine running directory and check node_modules
    cwd = "frontend" if env_status == "frontend" else None
    node_modules_path = (
        "frontend/node_modules" if env_status == "frontend" else "node_modules"
    )

    if not os.path.exists(node_modules_path):
        log_status(
            "مجلد node_modules غير موجود. جاري التثبيت المؤقت للحزم لتشغيل سكربت الهجرة..."
        )
        try:
            subprocess.run(
                ["npm", "install", "--no-audit", "--no-fund"],
                cwd=cwd,
                shell=is_windows,
                check=True,
            )
        except Exception as e:
            log_status(
                f"فشل تشغيل أمر 'npm install'. تأكد من تثبيت Node.js. الخطأ: {e}", False
            )
            if os.path.exists(temp_script):
                os.remove(temp_script)
            sys.exit(1)

    # Execute the export with strict UTF-8 decoding
    project_json_content = None
    try:
        if env_status == "frontend":
            shutil.move(temp_script, os.path.join("frontend", temp_script))

        cmd = ["npx", "tsx", temp_script]
        result = subprocess.run(
            cmd,
            cwd=cwd,
            shell=is_windows,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",  # Forces explicit UTF-8 and ignores Windows local encoding issues
            check=True,
        )
        project_json_content = result.stdout
        log_status("تم تصدير بيانات القصيدة بنجاح من data.ts الأصلي.")
    except subprocess.CalledProcessError as e:
        log_status(
            f"فشل تصدير البيانات ديناميكياً باستخدام tsx. كود الخطأ: {e.returncode}",
            False,
        )
        print("--- stderr ---")
        print(e.stderr)
        print("--------------")
        sys.exit(1)
    except FileNotFoundError as e:
        log_status(
            f"لم يتم العثور على npx/Node في PATH الخاص بالنظام. الخطأ: {e}", False
        )
        sys.exit(1)
    finally:
        # Cleanup temp scripts
        fe_temp_script = os.path.join("frontend", temp_script)
        if os.path.exists(fe_temp_script):
            os.remove(fe_temp_script)
        if os.path.exists(temp_script):
            os.remove(temp_script)

    return project_json_content


def build_monorepo_directories():
    """Create backend and frontend target structures"""
    os.makedirs("frontend", exist_ok=True)
    os.makedirs("backend/projects/nabigha_v4/audio", exist_ok=True)
    log_status("تم إنشاء هيكل المجلدات الجديد للـ monorepo.")


def move_frontend_files(env_status):
    """Shift root react files into frontend/ subfolder (skip if already moved)"""
    if env_status == "frontend":
        log_status(
            "الملفات تم نقلها مسبقاً في الجلسة الماضية. جاري تخطي خطوة النقل والبدء بالبناء."
        )
        return

    assets_to_move = [
        "src",
        "index.html",
        "package.json",
        "package-lock.json",
        "tsconfig.json",
        "vite.config.ts",
        "vitest.config.ts",
    ]

    for asset in assets_to_move:
        if os.path.exists(asset):
            dest = os.path.join("frontend", asset)
            if os.path.isdir(dest):
                shutil.rmtree(dest)
            elif os.path.exists(dest):
                os.remove(dest)
            try:
                shutil.move(asset, dest)
            except Exception as e:
                # Windows fallback
                if os.path.isdir(asset):
                    shutil.copytree(asset, dest)
                    shutil.rmtree(asset)
                else:
                    shutil.copy2(asset, dest)
                    os.remove(asset)

    log_status("تم نقل كافة ملفات React من المجلد الرئيسي إلى مجلد /frontend.")


def write_skeletons(migrated_json):
    """Write static data and skeletons for code file locations"""
    if not migrated_json:
        log_status("خطأ فادح: فشل جلب محتوى ملف الإعدادات للمشروع المهاجر.", False)
        sys.exit(1)

    # Save the migrated project
    with open("backend/projects/nabigha_v4/project.json", "w", encoding="utf-8") as f:
        f.write(migrated_json)
    # Keep the directory on git
    with open("backend/projects/nabigha_v4/audio/.gitkeep", "w") as f:
        f.write("")
    log_status(
        "تمت كتابة بيانات قصيدة النابغة المهاجرة في مسارها الجديد: 'backend/projects/nabigha_v4/project.json'."
    )

    # Define skeletons/placeholders to be overwritten in the next steps
    files_to_create = {
        # Backend Skeletons
        "backend/requirements.txt": ("Flask==3.1.0\n" "jsonschema==4.23.0\n"),
        "backend/schema.py": (
            "# TODO: كود التحقق من المخطط JSON Schema سيُوضع هنا في الخطوة القادمة\n"
        ),
        "backend/app.py": (
            "# TODO: تطبيق Flask الرئيسي والتحكم في نقاط الـ API سيُوضع هنا في الخطوة القادمة\n"
        ),
        # Frontend API Skeletons
        "frontend/src/types.ts": (
            "// TODO: تعريف الأنواع العامة والجديدة القابلة للنقل والنقل المتطابق\n"
        ),
        "frontend/src/api.ts": (
            "// TODO: مغلّف استدعاءات API والتواصل مع الـ Backend\n"
        ),
        # Frontend Component Skeletons
        "frontend/src/components/ProjectSelector.tsx": (
            "// TODO: واجهة اختيار ورفع المشاريع الجديدة\n"
            "export default function ProjectSelector() { return null; }\n"
        ),
        "frontend/src/components/SectionEvaluator.tsx": (
            "// TODO: لوحة التقييم الديناميكية الجديدة المقترنة بالمشروع النشط\n"
            "export default function SectionEvaluator() { return null; }\n"
        ),
        "frontend/src/components/SummaryDashboard.tsx": (
            "// TODO: لوحة التقرير العام والتحليل الإحصائي العام للمشروع النشط\n"
            "export default function SummaryDashboard() { return null; }\n"
        ),
    }

    for path, content in files_to_create.items():
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)

    log_status(
        "تم إنشاء كافة ملفات الهيكل العظمي (skeletons) كحوافظ أكواد فارغة بنجاح."
    )


def clean_and_update_git():
    """Remove old TypeScript hardcoded data and update .gitignore"""

    # 1. Delete redundant data files (data is now completely decoupled as JSON)
    old_data_file = "frontend/src/data.ts"
    old_test_file = "frontend/src/data.test.ts"
    if os.path.exists(old_data_file):
        os.remove(old_data_file)
    if os.path.exists(old_test_file):
        os.remove(old_test_file)
    log_status("تمت إزالة ملفات البيانات المشفرة القديمة (data.ts) بنجاح.")

    # 2. Update .gitignore with monorepo rules
    gitignore_rules = """
# Vite and Node outputs
frontend/node_modules/
frontend/dist/
frontend/dist-ssr/
*.local

# Python files
backend/.venv/
backend/__pycache__/
*.pyc

# Local audio and saved evaluations
backend/projects/*/evaluations.json
backend/projects/*/audio/*
!backend/projects/*/audio/.gitkeep
"""
    with open(".gitignore", "w", encoding="utf-8") as f:
        f.write(gitignore_rules)
    log_status("تم تحديث ملف .gitignore ليدعم البيئة المشتركة.")


def main():
    print("=" * 60)
    print("🚀 Suno Music Rating Scaffolder — إعادة بناء هيكلية المشروع")
    print("=" * 60)

    env_status = check_environment()
    migrated_json = migrate_poem_data(env_status)
    build_monorepo_directories()
    move_frontend_files(env_status)
    write_skeletons(migrated_json)
    clean_and_update_git()

    print("=" * 60)
    log_status("اكتمل تشغيل السكافولد بنجاح!")
    print("الملفات المهاجرة جاهزة الآن في مجلداتها المخصصة.")
    print("أنا الآن بانتظار تعليماتك لترقيتك بكافة الأكواد المقابلة لملئها.")
    print("=" * 60)


if __name__ == "__main__":
    main()

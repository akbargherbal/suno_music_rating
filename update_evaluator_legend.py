from pathlib import Path
import sys

file_path = Path("frontend/src/components/SectionEvaluator.tsx")
if not file_path.exists():
    file_path = Path("src/components/SectionEvaluator.tsx")

if not file_path.exists():
    print("❌ خطأ: لم يتم العثور على ملف SectionEvaluator.tsx")
    sys.exit(1)

content = file_path.read_text(encoding="utf-8")
badge_text = "دليل رموز المقياس (للإرشاد فقط):"

if badge_text in content:
    print("ℹ️ الملف محدث بالفعل ومحتوي على الشارة التوضيحية!")
    sys.exit(0)

anchor = '<div className="flex flex-wrap items-center gap-4 bg-paper-sunk p-3 border-b border-line text-xs">'

if anchor not in content:
    print("❌ خطأ: لم يتم العثور على السطر المستهدف داخل الملف.")
    sys.exit(1)

eol = "\r\n" if "\r\n" in content else "\n"
badge_html = (
    eol
    + " " * 14
    + '<span className="font-bold text-gold-deep bg-gold/10 px-2.5 py-1 rounded-md border border-gold/30 shrink-0 flex items-center gap-1">'
    + eol
    + " " * 16
    + '<Info className="w-3.5 h-3.5" /> دليل رموز المقياس (للإرشاد فقط):'
    + eol
    + " " * 14
    + "</span>"
)

new_content = content.replace(anchor, anchor + badge_html, 1)
file_path.write_text(new_content, encoding="utf-8")

if badge_text in file_path.read_text(encoding="utf-8"):
    print("✅ تم الاستبدال والتحقق بنجاح!")
else:
    print("❌ فشلت عملية التحقق!")
    sys.exit(1)

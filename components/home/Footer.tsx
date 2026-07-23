import Link from "next/link";
import {
  BookOpen,
  Code2,
  BriefcaseBusiness,
  Mail,
  ShieldCheck,
} from "lucide-react";

const productLinks = [
  { label: "المميزات", href: "#features" },
  { label: "مجالات البحث", href: "#research-domains" },
  { label: "كيف تعمل المنصة", href: "#how-it-works" },
  { label: "الأسعار", href: "#pricing" },
];

const resourceLinks = [
  { label: "ابدأ مشروعًا جديدًا", href: "/projects/new" },
  { label: "المشروعات", href: "/projects" },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      id="footer"
      dir="rtl"
      className="relative overflow-hidden border-t border-blue-400/10 bg-[#01050d] px-6 pb-8 pt-16 text-white"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-[8%] top-8 h-64 w-64 rounded-full bg-blue-500/10 blur-[110px]" />
        <div className="absolute bottom-[-100px] right-[8%] h-72 w-72 rounded-full bg-amber-400/10 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="grid gap-12 border-b border-white/10 pb-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">

          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/25 bg-amber-400/10 text-amber-300">
                <BookOpen className="h-6 w-6" />
              </div>

              <div>
                <div className="text-2xl font-black">أثر</div>
                <div className="mt-1 text-xs font-semibold tracking-[0.2em] text-blue-300">
                  AI HISTORIAN
                </div>
              </div>
            </Link>

            <p className="mt-6 max-w-md text-sm leading-7 text-slate-400">
              منصة بحث تاريخي مدعومة بالذكاء الاصطناعي تساعد الباحثين على تحليل
              الوثائق، واستخراج الشخصيات والأحداث، وبناء الشبكات المعرفية
              والتقارير التاريخية.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <a
                href="mailto:hello@athar.ai"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/15 bg-blue-500/10 text-slate-400 transition hover:border-blue-300/40 hover:text-blue-300"
              >
                <Mail className="h-5 w-5" />
              </a>

              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/15 bg-blue-500/10 text-slate-400 transition hover:border-blue-300/40 hover:text-blue-300"
              >
                <BriefcaseBusiness className="h-5 w-5" />
              </a>

              <a
                href="https://github.com/shimaamosaad/ai-historian-studio"
                target="_blank"
                rel="noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/15 bg-blue-500/10 text-slate-400 transition hover:border-blue-300/40 hover:text-blue-300"
              >
                <Code2 className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-black">المنصة</h3>

            <ul className="mt-5 space-y-3">
              {productLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-slate-400 transition hover:text-amber-300"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-black">روابط سريعة</h3>

            <ul className="mt-5 space-y-3">
              {resourceLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-slate-400 transition hover:text-amber-300"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-black">أمان البيانات</h3>

            <div className="mt-5 rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <div className="flex items-center gap-2 text-sm font-black text-emerald-300">
                <ShieldCheck className="h-5 w-5" />
                حماية بيانات الباحث
              </div>

              <p className="mt-3 text-xs leading-6 text-slate-400">
                نحافظ على خصوصية ملفاتك البحثية ولا يتم استخدامها إلا لتنفيذ
                العمليات التي تطلبها داخل المنصة.
              </p>
            </div>
          </div>

        </div>

        <div className="flex flex-col items-center justify-between gap-4 pt-8 text-center text-xs text-slate-500 md:flex-row md:text-right">
          <p>© {currentYear} منصة أثر. جميع الحقوق محفوظة.</p>

          <p>صُممت لخدمة الباحثين والمؤرخين بالذكاء الاصطناعي.</p>
        </div>
      </div>
    </footer>
  );
}
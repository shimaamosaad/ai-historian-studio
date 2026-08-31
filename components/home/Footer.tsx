import Link from "next/link";
import {
  BookOpen,
  Code2,
  Mail,
  ShieldCheck,
} from "lucide-react";

const productLinks = [
  {
    label: "المميزات",
    href: "#platform",
  },
  {
    label: "مجالات البحث",
    href: "#research-domains",
  },
  {
    label: "كيف تعمل المنصة",
    href: "#how-it-works",
  },
  {
    label: "الأسعار",
    href: "#pricing",
  },
];

const resourceLinks = [
  {
    label: "ابدأ مشروعًا جديدًا",
    href: "/projects/new",
  },
  {
    label: "المشروعات",
    href: "/projects",
  },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      id="footer"
      dir="rtl"
      className="relative overflow-hidden border-t border-blue-400/10 bg-[#01050d] px-4 pb-6 pt-12 text-white sm:px-6 sm:pb-8 sm:pt-14 lg:pt-16"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[8%] top-8 h-52 w-52 rounded-full bg-blue-500/10 blur-[100px] sm:h-64 sm:w-64 sm:blur-[110px]" />

        <div className="absolute bottom-[-100px] right-[8%] h-60 w-60 rounded-full bg-amber-400/10 blur-[110px] sm:h-72 sm:w-72 sm:blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="grid gap-8 border-b border-white/10 pb-10 sm:gap-10 sm:pb-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-12">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-3"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-300/25 bg-amber-400/10 text-amber-300 sm:h-12 sm:w-12 sm:rounded-2xl">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>

              <div>
                <div className="text-xl font-black sm:text-2xl">
                  أثر
                </div>

                <div className="mt-1 text-[10px] font-semibold tracking-[0.18em] text-blue-300 sm:text-xs sm:tracking-[0.2em]">
                  AI HISTORIAN
                </div>
              </div>
            </Link>

            <p className="mt-5 max-w-md text-sm leading-7 text-slate-400 sm:mt-6">
              منصة بحث تاريخي مدعومة بالذكاء الاصطناعي
              تساعد الباحثين على تحليل الوثائق، واستخراج
              الشخصيات والأحداث، وبناء الشبكات المعرفية
              والتقارير التاريخية.
            </p>

            <div className="mt-5 flex items-center gap-3 sm:mt-6">
              <a
                href="mailto:shimaamosaad58@gmail.com"
                aria-label="البريد الإلكتروني"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/15 bg-blue-500/10 text-slate-400 transition hover:border-blue-300/40 hover:text-blue-300"
              >
                <Mail className="h-5 w-5" />
              </a>

              <a
                href="https://github.com/shimaamosaad/ai-historian-studio"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/15 bg-blue-500/10 text-slate-400 transition hover:border-blue-300/40 hover:text-blue-300"
              >
                <Code2 className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-black text-white sm:text-base">
              المنصة
            </h3>

            <ul className="mt-4 space-y-2.5 sm:mt-5 sm:space-y-3">
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
            <h3 className="text-sm font-black text-white sm:text-base">
              روابط سريعة
            </h3>

            <ul className="mt-4 space-y-2.5 sm:mt-5 sm:space-y-3">
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
            <h3 className="text-sm font-black text-white sm:text-base">
              أمان البيانات
            </h3>

            <div className="mt-4 rounded-xl border border-emerald-400/15 bg-emerald-400/5 p-4 sm:mt-5 sm:rounded-2xl">
              <div className="flex items-center gap-2 text-sm font-black text-emerald-300">
                <ShieldCheck className="h-5 w-5 shrink-0" />

                <span>
                  حماية بيانات الباحث
                </span>
              </div>

              <p className="mt-3 text-xs leading-6 text-slate-400">
                نحافظ على خصوصية ملفاتك البحثية، ولا يتم
                استخدامها إلا لتنفيذ العمليات التي تطلبها
                داخل المنصة.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 pt-6 text-center text-[11px] leading-6 text-slate-500 sm:gap-4 sm:pt-8 sm:text-xs md:flex-row md:text-right">
          <p>
            © {currentYear} منصة أثر. جميع الحقوق محفوظة.
          </p>

          <p>
            صُممت لخدمة الباحثين والمؤرخين بالذكاء الاصطناعي.
          </p>
        </div>
      </div>
    </footer>
  );
}
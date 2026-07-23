import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  BookOpen,
  CheckCircle2,
  FileSearch,
  FolderOpen,
  Menu,
  Network,
  Search,
  Sparkles,
  Timeline,
} from "lucide-react";

const capabilities = [
  {
    title: "تحليل المصادر",
    description: "تنظيم الوثائق والمراجع واستخراج أهم المعلومات منها.",
    icon: FileSearch,
  },
  {
    title: "بناء العلاقات",
    description: "ربط الشخصيات والأماكن والأحداث داخل شبكة معرفية.",
    icon: Network,
  },
  {
    title: "التسلسل الزمني",
    description: "ترتيب الأحداث تاريخيًا وعرض تطورها بصورة واضحة.",
    icon: Timeline,
  },
];

function BrandLogo() {
  return (
    <div className="flex items-center gap-4">
      <div className="relative flex h-20 w-20 items-center justify-center md:h-24 md:w-24">
        <div className="absolute inset-0 rounded-[28px] border border-amber-300/35 bg-gradient-to-br from-amber-300/20 via-amber-500/5 to-transparent shadow-[0_0_45px_rgba(245,158,11,0.2)]" />
        <BookOpen className="absolute bottom-3 h-8 w-8 text-amber-300 md:h-10 md:w-10" />
        <span className="relative -translate-y-3 text-5xl font-black leading-none text-amber-300 drop-shadow-[0_0_18px_rgba(245,158,11,0.45)] md:text-6xl">
          أ
        </span>
      </div>

      <div>
        <p className="text-6xl font-black leading-none text-amber-300 drop-shadow-[0_0_24px_rgba(245,158,11,0.32)] md:text-8xl">
          أثر
        </p>
        <p
          className="mt-3 text-sm font-semibold tracking-[0.42em] text-amber-100/70 md:text-base"
          dir="ltr"
        >
          ATHAR AI
        </p>
        <p className="mt-2 text-sm text-slate-500">
          منصة الذكاء الاصطناعي للبحث التاريخي
        </p>
      </div>
    </div>
  );
}

function CompactBrand() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/30 bg-amber-300/10">
        <BookOpen className="absolute bottom-1.5 h-4 w-4 text-amber-300" />
        <span className="-translate-y-1 text-2xl font-black text-amber-300">
          أ
        </span>
      </div>

      <div>
        <p className="text-2xl font-black leading-none text-amber-300">أثر</p>
        <p className="mt-1 text-[9px] tracking-[0.35em] text-slate-500" dir="ltr">
          ATHAR AI
        </p>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section
      className="relative min-h-screen overflow-hidden bg-[#040914] px-4 pb-20 pt-4 text-white md:px-6 md:pt-6"
      dir="rtl"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-[-8%] top-[-12%] h-[540px] w-[540px] rounded-full bg-amber-400/10 blur-[150px]" />
        <div className="absolute bottom-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-[170px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:52px_52px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />
      </div>

      <header className="relative z-20 mx-auto flex max-w-[1450px] items-center gap-4 rounded-3xl border border-white/10 bg-[#08111f]/90 px-4 py-3 shadow-2xl backdrop-blur-2xl md:px-6">
        <Link href="/" aria-label="الصفحة الرئيسية">
          <CompactBrand />
        </Link>

        <nav className="mr-4 hidden items-center gap-2 lg:flex">
          {[
            { label: "الرئيسية", href: "/" },
            { label: "المشاريع", href: "/projects" },
            { label: "التخصصات", href: "#research-domains" },
            { label: "المميزات", href: "#features" },
            { label: "كيف تعمل المنصة؟", href: "#how-it-works" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-amber-300"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mr-auto hidden w-full max-w-sm items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-slate-500 xl:flex">
          <Search className="h-5 w-5" />
          <span className="text-sm">ابحث في المشاريع والمستندات...</span>
          <span className="mr-auto rounded-md bg-white/5 px-2 py-1 text-[11px]">
            Ctrl + K
          </span>
        </div>

        <button
          type="button"
          className="hidden h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 md:flex"
          aria-label="الإشعارات"
        >
          <Bell className="h-5 w-5" />
        </button>

        <Link
          href="/projects"
          className="hidden rounded-xl border border-amber-300/25 bg-amber-300/10 px-5 py-3 text-sm font-black text-amber-200 transition hover:-translate-y-0.5 hover:bg-amber-300/15 sm:inline-flex"
        >
          مشاريعي
        </Link>

        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 lg:hidden"
          aria-label="فتح القائمة"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      <div className="relative z-10 mx-auto grid max-w-[1450px] items-center gap-12 py-16 lg:grid-cols-[0.95fr_1.05fr] lg:py-20">
        <div className="order-2 lg:order-1">
          <div className="relative">
            <div className="absolute inset-10 rounded-full bg-amber-300/10 blur-[100px]" />

            <div className="relative overflow-hidden rounded-[34px] border border-white/10 bg-gradient-to-b from-[#0b1425]/95 to-[#07101d]/95 p-3 shadow-[0_45px_120px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
              <div className="rounded-[28px] border border-white/8 bg-[#0b1425] p-5 md:p-7">
                <div className="flex items-start justify-between gap-5 border-b border-white/10 pb-5">
                  <div>
                    <p className="text-sm font-bold text-amber-300">
                      مشروع بحثي نشط
                    </p>
                    <h2 className="mt-2 text-2xl font-black md:text-3xl">
                      الحياة العلمية في العصر المملوكي
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      تحليل المصادر وبناء المعرفة التاريخية
                    </p>
                  </div>

                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-300">
                    <BookOpen className="h-7 w-7" />
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  {[
                    { value: "24", label: "شخصية" },
                    { value: "18", label: "حدثًا" },
                    { value: "31", label: "علاقة" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-2xl border border-white/8 bg-white/[0.035] p-4 text-center"
                    >
                      <p className="text-3xl font-black text-amber-300">
                        {stat.value}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl border border-white/8 bg-white/[0.035] p-5">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-white">ملخص التحليل</p>
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
                      مكتمل
                    </span>
                  </div>

                  <p className="mt-4 leading-8 text-slate-400">
                    تم تحليل المصادر التاريخية واستخراج الشخصيات والأماكن
                    والأحداث والعلاقات المرتبطة بها، مع تجهيز التقرير
                    والتسلسل الزمني.
                  </p>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    "صلاح الدين الأيوبي",
                    "القاهرة",
                    "العصر المملوكي",
                    "الحياة العلمية",
                  ].map((item, index) => (
                    <div
                      key={item}
                      className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.025] px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-300/10 text-sm font-black text-amber-300">
                          {index + 1}
                        </span>
                        <span className="font-semibold text-slate-300">
                          {item}
                        </span>
                      </div>

                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    </div>
                  ))}
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-300">
                      تقدم التحليل
                    </span>
                    <span className="font-black text-amber-300">94%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/8">
                    <div className="h-full w-[94%] rounded-full bg-gradient-to-l from-amber-300 to-yellow-500 shadow-[0_0_18px_rgba(251,191,36,0.35)]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 -left-5 hidden rounded-2xl border border-white/10 bg-[#0c1727]/95 p-4 shadow-2xl backdrop-blur-xl md:block">
              <p className="text-xs text-slate-500">حالة المشروع</p>
              <p className="mt-1 font-black text-emerald-300">
                جاهز للتقرير
              </p>
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <BrandLogo />

          <div className="mt-9 inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-sm font-bold text-amber-300">
            <Sparkles className="h-4 w-4" />
            نسخة Beta • منصة ذكية للعلوم الإنسانية
          </div>

          <h1 className="mt-7 max-w-3xl text-4xl font-black leading-[1.25] md:text-6xl">
            أول منصة عربية
            <span className="mt-2 block bg-gradient-to-l from-amber-200 via-amber-300 to-yellow-500 bg-clip-text text-transparent">
              للباحث الذكي
            </span>
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-9 text-slate-300 md:text-xl">
            تساعدك أثر على تحليل الوثائق والمراجع، واستخراج الشخصيات
            والأماكن والأحداث والعلاقات، وبناء تقارير علمية وتسلسل زمني
            وشبكات معرفية في مكان واحد.
          </p>

          <p className="mt-4 max-w-2xl leading-8 text-slate-500">
            صُممت لخدمة الباحثين في العلوم الإنسانية، وتبدأ بالتاريخ مع
            خطة للتوسع إلى الآثار والأدب والدراسات الإسلامية والقانون
            وسائر التخصصات الأكاديمية.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/projects/new"
              className="group inline-flex items-center justify-center gap-3 rounded-xl bg-gradient-to-l from-amber-300 to-yellow-500 px-8 py-4 font-black text-slate-950 shadow-[0_18px_50px_rgba(245,158,11,0.2)] transition hover:-translate-y-1 hover:shadow-[0_25px_70px_rgba(245,158,11,0.3)]"
            >
              ابدأ مشروعًا جديدًا
              <ArrowLeft className="h-5 w-5 transition group-hover:-translate-x-1" />
            </Link>

            <Link
              href="/projects"
              className="inline-flex items-center justify-center gap-3 rounded-xl border border-white/12 bg-white/5 px-8 py-4 font-bold text-white transition hover:-translate-y-1 hover:border-amber-300/25 hover:bg-amber-300/10 hover:text-amber-200"
            >
              <FolderOpen className="h-5 w-5" />
              استعرض مشاريعي
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {capabilities.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/8 bg-white/[0.035] p-4 backdrop-blur-sm transition hover:-translate-y-1 hover:border-amber-300/20 hover:bg-white/[0.055]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300/10 text-amber-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="font-bold text-white">{item.title}</p>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
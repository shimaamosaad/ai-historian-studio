import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  BookOpenText,
  BrainCircuit,
  Building2,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  FileSearch,
  Menu,
  Network,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

const features = [
  { title: "الذكاء الاصطناعي", icon: BrainCircuit },
  { title: "تحليل الوثائق", icon: FileSearch },
  { title: "التسلسل الزمني", icon: Clock3 },
  { title: "الشبكات المعرفية", icon: Network },
];

const documents = ["تاريخ بيت المقدس", "مذكرات الرحالة", "السيرة النبوية"];

const timelineItems = [
  { year: "1095", label: "بداية الحروب" },
  { year: "1187", label: "معركة حطين" },
  { year: "1204", label: "سقوط القسطنطينية" },
  { year: "1291", label: "نهاية الحروب" },
];

const graphNodes = [
  { label: "صلاح الدين", x: "50%", y: "50%", main: true },
  { label: "القاهرة", x: "21%", y: "34%" },
  { label: "حطين", x: "76%", y: "30%" },
  { label: "القدس", x: "82%", y: "65%" },
  { label: "دمشق", x: "27%", y: "72%" },
  { label: "الصليبيون", x: "51%", y: "15%" },
];

export default function Hero() {
  return (
    <section
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-[#020712] text-white"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <Image
          src="/images/hero-city.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-42 saturate-[0.68] contrast-110"
        />

        <div className="absolute inset-0 bg-[#031126]/58 mix-blend-color" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#020712]/10 via-[#020712]/34 to-[#020712]/88" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020712] via-[#020712]/18 to-[#020712]/48" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_28%,rgba(37,99,235,0.22),transparent_29%),radial-gradient(circle_at_72%_26%,rgba(30,64,175,0.18),transparent_31%),radial-gradient(circle_at_45%_36%,rgba(245,158,11,0.08),transparent_26%)]" />
        <div className="absolute inset-0 opacity-[0.07] bg-[linear-gradient(rgba(96,165,250,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(96,165,250,0.035)_1px,transparent_1px)] bg-[size:58px_58px]" />
        <div className="absolute inset-x-0 top-[79px] h-px bg-gradient-to-r from-transparent via-blue-400/35 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-52 bg-gradient-to-t from-[#01040a] via-[#01040a]/72 to-transparent" />
      </div>

      <header className="relative z-30 border-b border-white/[0.07] bg-[#020713]/92 backdrop-blur-2xl">
        <div className="mx-auto flex h-[78px] max-w-[1536px] items-center gap-5 px-5 lg:px-8">
          <button
            type="button"
            aria-label="فتح القائمة"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-400/35 bg-blue-500/[0.05] text-blue-300 transition hover:bg-blue-500/10"
          >
            <Menu className="h-6 w-6" />
          </button>

          <Link href="/" className="flex shrink-0 items-center gap-4">
            <span className="bg-gradient-to-b from-[#ffe79b] via-[#eba62e] to-[#a85c08] bg-clip-text text-[3.4rem] font-black leading-none text-transparent">
              أثر
            </span>
            <span
              className="hidden border-r border-white/10 pr-4 sm:block"
              dir="ltr"
            >
              <span className="block text-sm font-bold tracking-[0.34em] text-[#ecd79f]">
                ATHAR AI
              </span>
              <span className="mt-1 block text-[10px] text-slate-500">
                منصة الباحث الذكي
              </span>
            </span>
          </Link>

          <nav className="mr-3 hidden items-center gap-1 xl:flex">
            <Link
              href="/"
              className="relative rounded-xl px-4 py-3 text-sm font-black text-blue-300"
            >
              الرئيسية
              <span className="absolute inset-x-4 -bottom-[16px] h-px bg-gradient-to-r from-blue-400 via-amber-300 to-blue-400 shadow-[0_0_14px_rgba(96,165,250,.75)]" />
            </Link>
            <a
              href="#platform"
              className="rounded-xl px-4 py-3 text-sm font-bold text-slate-300 transition hover:text-blue-200"
            >
              المنصة
            </a>
            <Link
              href="/projects"
              className="rounded-xl px-4 py-3 text-sm font-bold text-slate-300 transition hover:text-blue-200"
            >
              المشاريع
            </Link>
            <a
              href="#domains"
              className="rounded-xl px-4 py-3 text-sm font-bold text-slate-300 transition hover:text-blue-200"
            >
              التخصصات
            </a>
            <a
              href="#pricing"
              className="rounded-xl px-4 py-3 text-sm font-bold text-slate-300 transition hover:text-blue-200"
            >
              الأسعار
            </a>
          </nav>

          <div className="mr-auto hidden w-full max-w-[325px] items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3 lg:flex">
            <Search className="h-5 w-5 shrink-0 text-slate-300" />
            <span className="truncate text-sm text-slate-500">
              ابحث في المشاريع والمستندات...
            </span>
            <span className="mr-auto shrink-0 rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[10px] text-slate-500">
              Ctrl + K
            </span>
          </div>

          <button
            type="button"
            aria-label="الإشعارات"
            className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/[0.035] text-blue-300 md:flex"
          >
            <Bell className="h-5 w-5" />
          </button>

          <Link
            href="/projects"
            className="hidden shrink-0 items-center gap-2 rounded-xl border border-blue-400/45 bg-blue-500/[0.07] px-5 py-3 text-sm font-black text-blue-200 transition hover:bg-blue-500/12 md:inline-flex"
          >
            <Sparkles className="h-4 w-4" />
            مشاريعي
          </Link>
        </div>
      </header>

      <div dir="ltr"
        className="relative z-10 mx-auto grid max-w-[1536px] items-start gap-10 px-5 pb-14 pt-6 lg:grid-cols-[0.84fr_1.16fr] lg:px-8 lg:pb-8 lg:pt-0">
        <div dir="rtl" className="order-2 self-start pt-3 lg:order-1 lg:pt-0">
          <div className="relative w-full max-w-[510px]">
            <div className="absolute inset-8 rounded-full bg-amber-400/10 blur-[75px]" />

            <Image
              src="/images/athar-logo.png"
              alt="أثر ATHAR AI"
              width={450}
              height={305}
              priority
              className="relative h-auto w-full max-w-[450px] object-contain drop-shadow-[0_18px_35px_rgba(218,145,34,0.18)]"
            />
          </div>

          <h1 className="mt-8 max-w-2xl text-5xl font-black leading-[1.18] tracking-tight md:text-6xl xl:text-7xl">
            أول منصة عربية
            <span className="mt-0 block bg-gradient-to-l from-[#ffe7a3] via-[#f3b84b] to-[#c97a17] bg-clip-text text-transparent">
              للباحث الذكي
            </span>
          </h1>

          <p className="mt-4 max-w-2xl text-lg leading-9 text-slate-300 md:text-xl">
            منصة مدعومة بالذكاء الاصطناعي لتحليل الوثائق التاريخية، واستخراج
            الشخصيات والأماكن والأحداث، وبناء الشبكات المعرفية والتقارير العلمية
            الموثوقة.
          </p>

          <div className="mt-6 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="group flex flex-col items-center rounded-2xl border border-blue-400/22 bg-[#061225]/74 px-3 py-4 text-center backdrop-blur-md transition duration-300 hover:-translate-y-1.5 hover:border-blue-300/55 hover:bg-blue-500/[0.10] hover:shadow-[0_14px_36px_rgba(37,99,235,.14)]"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-blue-400/45 bg-blue-500/[0.08] text-blue-300">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="mt-3 text-sm font-bold leading-6 text-slate-200">
                    {feature.title}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/projects/new"
              className="group inline-flex min-w-[220px] items-center justify-center gap-3 rounded-xl border border-amber-200/60 bg-gradient-to-l from-[#ffe08a] via-[#e9a62f] to-[#bd6c0d] px-7 py-4 text-lg font-black text-[#1c1204] shadow-[0_18px_50px_rgba(217,142,31,.22)] transition hover:-translate-y-1"
            >
              ابدأ الآن
              <ArrowLeft className="h-5 w-5 transition group-hover:-translate-x-1" />
            </Link>

            <a
              href="#platform"
              className="inline-flex min-w-[220px] items-center justify-center gap-3 rounded-xl border border-blue-400/45 bg-blue-500/[0.06] px-7 py-4 text-lg font-bold text-white transition hover:border-blue-300/70 hover:bg-blue-500/[0.12]"
            >
              <Play className="h-5 w-5 text-blue-300" />
              شاهد المنصة
            </a>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-slate-400">
            <div className="flex -space-x-2 space-x-reverse">
              {["م", "س", "ع"].map((letter) => (
                <span
                  key={letter}
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#070c12] bg-[#1a2531] font-bold text-blue-200"
                >
                  {letter}
                </span>
              ))}
            </div>
            <span>+2,500 باحث ومؤسسة يثقون في أثر</span>
            <ShieldCheck className="h-5 w-5 text-blue-300" />
          </div>
        </div>

        <div dir="rtl" className="order-1 lg:order-2">
          <div className="relative mx-auto mt-8 max-w-[950px]">
            <div className="absolute -inset-8 rounded-[52px] bg-blue-500/[0.08] blur-[75px]" />
            <div className="absolute -bottom-10 left-[8%] right-[8%] h-16 rounded-[50%] bg-black/90 blur-3xl" />

            <div className="relative rounded-[48px] border border-[#c38a31]/62 bg-gradient-to-br from-[#7b5422] via-[#0b1a31] to-[#030711] p-[6px] shadow-[0_58px_145px_rgba(0,0,0,.86),0_0_0_1px_rgba(255,215,128,.10),0_0_58px_rgba(37,99,235,.25)]">
              <span className="absolute left-1/2 top-[4px] z-20 h-2.5 w-2.5 -translate-x-1/2 rounded-full border border-white/10 bg-black shadow-[inset_0_0_3px_rgba(255,255,255,.15)]" />
              <span className="pointer-events-none absolute inset-x-12 top-[2px] h-px bg-gradient-to-r from-transparent via-amber-200/70 to-transparent" />
              <span className="pointer-events-none absolute left-8 top-6 h-24 w-px bg-gradient-to-b from-blue-300/35 to-transparent" />
              <span className="pointer-events-none absolute right-10 top-8 h-20 w-px bg-gradient-to-b from-amber-200/35 to-transparent" />
              <span className="pointer-events-none absolute bottom-4 left-1/2 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent" />
              <span className="absolute -right-[5px] top-28 h-20 w-[5px] rounded-l-full bg-gradient-to-b from-[#bb7b20] via-[#4a3418] to-[#1a130b]" />
              <span className="absolute -right-[5px] top-52 h-12 w-[5px] rounded-l-full bg-gradient-to-b from-[#bb7b20] via-[#4a3418] to-[#1a130b]" />

              <div className="overflow-hidden rounded-[38px] border border-white/[0.09] bg-[#030914] p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,.03),inset_0_0_40px_rgba(0,0,0,.82)]">
                <div className="grid gap-3 md:grid-cols-[1fr_2.2fr_1fr]">
                <div className="space-y-3">
                  <div className="rounded-2xl border border-white/[0.08] bg-[#061122] p-4">
                    <p className="text-sm font-black text-amber-300">تقرير ذكي</p>

                    <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/[0.04] p-3">
                      <div className="h-24 rounded-lg border border-white/[0.07] bg-[linear-gradient(135deg,#45331d,#17120c)] p-3">
                        <div className="h-2 w-2/3 rounded bg-amber-100/50" />
                        <div className="mt-3 h-1.5 w-full rounded bg-amber-100/20" />
                        <div className="mt-2 h-1.5 w-5/6 rounded bg-amber-100/20" />
                        <div className="mt-2 h-1.5 w-4/6 rounded bg-amber-100/20" />
                      </div>

                      <div className="mt-4 flex items-center gap-3">
                        <div className="relative h-12 w-12 rounded-full border-[5px] border-amber-400/20">
                          <span className="absolute inset-[-5px] rounded-full border-[5px] border-transparent border-r-amber-400 border-t-amber-400" />
                        </div>
                        <div>
                          <p className="text-xl font-black text-white">87%</p>
                          <p className="text-[11px] text-slate-500">
                            موثوقية المعلومات
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="mt-4 w-full rounded-lg border border-amber-400/35 px-3 py-2 text-sm font-bold text-blue-300"
                      >
                        عرض التقرير
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/[0.08] bg-[#061122] p-4">
                    <p className="text-sm font-black text-blue-300">
                      أحدث المستندات
                    </p>

                    <div className="mt-3 space-y-2">
                      {documents.map((document) => (
                        <div
                          key={document}
                          className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2"
                        >
                          <span className="text-xs text-slate-300">
                            {document}
                          </span>
                          <BookOpenText className="h-4 w-4 text-blue-300" />
                        </div>
                      ))}
                    </div>

                    <Link
                      href="/projects"
                      className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-300"
                    >
                      عرض الكل
                      <ChevronLeft className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl border border-white/[0.08] bg-[#061122] p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-black text-amber-300">
                        الشبكة المعرفية
                      </p>
                      <Network className="h-5 w-5 text-blue-300" />
                    </div>

                    <div className="relative mt-3 h-[270px] overflow-hidden rounded-xl border border-white/[0.06] bg-[radial-gradient(circle_at_center,rgba(37,99,235,.16),transparent_55%),linear-gradient(180deg,#07162b,#030914)]">
                      <svg
                        viewBox="0 0 100 100"
                        className="absolute inset-0 h-full w-full"
                        aria-hidden="true"
                      >
                        <g stroke="rgba(96,165,250,.48)" strokeWidth="0.45">
                          <line x1="50" y1="50" x2="21" y2="34" />
                          <line x1="50" y1="50" x2="76" y2="30" />
                          <line x1="50" y1="50" x2="82" y2="65" />
                          <line x1="50" y1="50" x2="27" y2="72" />
                          <line x1="50" y1="50" x2="51" y2="15" />
                          <line x1="21" y1="34" x2="51" y2="15" />
                          <line x1="76" y1="30" x2="82" y2="65" />
                          <line x1="27" y1="72" x2="82" y2="65" />
                        </g>
                      </svg>

                      {graphNodes.map((node) => (
                        <div
                          key={node.label}
                          className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border text-center shadow-[0_0_25px_rgba(245,158,11,.15)] ${
                            node.main
                              ? "flex h-16 w-16 items-center justify-center border-blue-300/65 bg-blue-500/20"
                              : "flex h-11 w-11 items-center justify-center border-blue-400/45 bg-[#07162b]"
                          }`}
                          style={{ left: node.x, top: node.y }}
                          title={node.label}
                        >
                          {node.main ? (
                            <Users className="h-7 w-7 text-blue-200" />
                          ) : node.label === "القاهرة" ||
                            node.label === "القدس" ? (
                            <Building2 className="h-5 w-5 text-blue-300" />
                          ) : (
                            <Users className="h-5 w-5 text-blue-300" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/[0.08] bg-[#061122] p-4">
                    <p className="text-sm font-black text-amber-300">
                      التسلسل الزمني
                    </p>

                    <div className="relative mt-5">
                      <div className="absolute left-3 right-3 top-2 h-px bg-gradient-to-l from-blue-400/25 via-blue-400 to-amber-300/45" />

                      <div className="relative grid grid-cols-4 gap-2">
                        {timelineItems.map((item) => (
                          <div key={item.year} className="text-center">
                            <span className="mx-auto block h-4 w-4 rounded-full border-2 border-[#090f16] bg-blue-400 shadow-[0_0_14px_rgba(96,165,250,.75)]" />
                            <p className="mt-3 text-sm font-black text-white">
                              {item.year}
                            </p>
                            <p className="mt-1 text-[10px] leading-4 text-slate-500">
                              {item.label}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl border border-white/[0.08] bg-[#061122] p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-black text-amber-300">
                        ملخص المشروع
                      </p>
                      <Sparkles className="h-4 w-4 text-blue-300" />
                    </div>

                    <h2 className="mt-4 text-xl font-black text-white">
                      الحروب الصليبية
                    </h2>
                    <p className="mt-2 text-xs text-slate-500">
                      1095 — 1291 م
                    </p>

                    <div className="mt-5 flex items-center justify-between text-xs">
                      <span className="text-slate-500">اكتمال التحليل</span>
                      <span className="font-black text-blue-300">94%</span>
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                      <div className="h-full w-[94%] rounded-full bg-gradient-to-l from-blue-400 via-blue-500 to-amber-300" />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/[0.08] bg-[#061122] p-4">
                    <p className="text-sm font-black text-blue-300">
                      المستندات
                    </p>

                    <div className="mt-4 space-y-3">
                      {[
                        { value: "12", label: "مستند", icon: BookOpenText },
                        { value: "248", label: "كيان", icon: Building2 },
                        { value: "156", label: "علاقة", icon: Network },
                        { value: "24", label: "حدث", icon: Clock3 },
                      ].map((item) => {
                        const Icon = item.icon;

                        return (
                          <div
                            key={item.label}
                            className="flex items-center justify-between border-b border-white/[0.06] pb-3 last:border-0 last:pb-0"
                          >
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-blue-300" />
                              <div>
                                <p className="text-sm font-black text-white">
                                  {item.value}
                                </p>
                                <p className="text-[10px] text-slate-500">
                                  {item.label}
                                </p>
                              </div>
                            </div>
                            <ChevronLeft className="h-4 w-4 text-blue-300" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-400/15 bg-emerald-400/[0.04] px-4 py-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <div>
                    <p className="text-sm font-bold text-emerald-300">
                      التحليل جاهز
                    </p>
                    <p className="text-[11px] text-emerald-300/50">
                      التقرير والشبكة والتسلسل الزمني متاحون الآن
                    </p>
                  </div>
                </div>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,.9)]" />
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      <div className="relative z-10 border-t border-blue-400/10 bg-[#020713]/72">
        <div className="mx-auto flex max-w-[1536px] flex-col items-center justify-between gap-5 px-5 py-6 text-center lg:flex-row lg:px-8">
          <p className="font-bold text-amber-300">
            موثوق من باحثين ومؤسسات حول العالم
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-semibold text-slate-500">
            <span>جامعة القاهرة</span>
            <span>مكتبة الإسكندرية</span>
            <span>جامعة قطر</span>
            <span>جامعة الإمام</span>
            <span>مركز الملك فيصل</span>
          </div>
        </div>
      </div>
    </section>
  );
}
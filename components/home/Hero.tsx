import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export default function Hero() {
  return (
    <section
      className="relative overflow-hidden bg-slate-950 px-6 py-24 text-white md:py-32"
      dir="rtl"
    >
      <div className="absolute inset-0">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl" />

        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-300">
            <Sparkles className="h-4 w-4" />
            منصة ذكاء اصطناعي للعلوم الإنسانية
          </div>

          <h1 className="mt-7 text-5xl font-black leading-tight md:text-7xl">
            ابحث بعمق أكبر

            <span className="mt-2 block text-amber-300">
              مع منصة أثر
            </span>
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-9 text-slate-300 md:text-xl">
            تساعدك أثر في تحليل الوثائق والمصادر، واستخراج
            المعلومات والعلاقات والتسلسل الزمني، وتحويل المادة
            العلمية إلى معرفة منظمة تدعم البحث الأكاديمي.
          </p>

          <p className="mt-4 max-w-2xl leading-8 text-slate-400">
            يبدأ أثر حاليًا بتخصص التاريخ، ثم يتوسع تدريجيًا
            ليشمل الآثار والأدب والدراسات الإسلامية والقانون
            وبقية مجالات العلوم الإنسانية.
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/projects/new"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-7 py-4 font-bold text-slate-950 transition hover:bg-amber-300"
            >
              ابدأ مشروعًا تاريخيًا

              <ArrowLeft className="h-5 w-5" />
            </Link>

<Link
  href="/projects"
  className="inline-flex items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-7 py-4 font-bold text-cyan-300 transition hover:bg-cyan-500/20"
>
  📂 مشاريعي
</Link>

            <a
              href="/#research-domains"
              className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-7 py-4 font-bold text-white transition hover:border-white/30 hover:bg-white/10"
            >
              استكشف التخصصات
            </a>
          </div>

          <div className="mt-10 flex flex-wrap gap-5 text-sm text-slate-300">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              تحليل المصادر
            </span>

            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              استخراج الكيانات
            </span>

            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              بناء العلاقات
            </span>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl backdrop-blur-xl md:p-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div>
                <p className="text-sm text-slate-400">
                  مشروع بحثي
                </p>

                <h2 className="mt-1 text-xl font-bold">
                  الحياة العلمية في العصر المملوكي
                </h2>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-300">
                <BookOpen className="h-6 w-6" />
              </div>
            </div>

            <div className="mt-7 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-slate-400">
                  ملخص التحليل
                </p>

                <p className="mt-3 leading-7 text-slate-200">
                  تحليل الوثائق التاريخية واستخراج الشخصيات
                  والأماكن والأحداث والعلاقات المرتبطة بها.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-2xl font-black text-amber-300">
                    24
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    شخصية
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-2xl font-black text-amber-300">
                    18
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    حدثًا
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-2xl font-black text-amber-300">
                    31
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    علاقة
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-300">
                جاهز للتحليل وبناء التقرير البحثي
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
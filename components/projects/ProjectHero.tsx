type Props = {
  project: any;
  projectState: string;
};

function formatDate(value?: string) {
  if (!value) {
    return "غير متوفر";
  }

  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

export default function ProjectHero({
  project,
  projectState,
}: Props) {
  return (
    <section className="relative overflow-hidden rounded-3xl sm:rounded-[34px] border border-white/10 bg-[#081525] shadow-2xl shadow-black/40">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(245,158,11,0.18),transparent_34%),linear-gradient(90deg,rgba(3,9,20,0.1),rgba(3,9,20,0.88))]" />

      <div className="absolute inset-y-0 left-0 hidden w-[46%] opacity-30 lg:block">
        <div className="h-full w-full bg-[linear-gradient(135deg,rgba(245,158,11,0.22),transparent_55%)]" />
      </div>

      <div className="relative grid items-center gap-6 p-5 sm:min-h-[390px] sm:gap-8 sm:p-8 lg:grid-cols-[1.25fr_0.75fr] lg:p-12">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-sm font-bold text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              {projectState}
            </span>

            <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-sm font-bold text-amber-300">
              مشروع تاريخي
            </span>
          </div>

          <h1 className="mt-5 max-w-5xl break-words text-3xl font-black leading-[1.25] sm:mt-6 sm:text-5xl lg:text-7xl">
            {project.title}
          </h1>

          <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-300 sm:mt-5 sm:text-lg sm:leading-8">
            {project.description ||
              "لا يوجد وصف مضاف لهذا المشروع حتى الآن."}
          </p>

          <div className="mt-6 grid gap-3 sm:mt-7 sm:flex sm:flex-wrap">
            <div className="min-w-0 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
              <span className="text-slate-500">
                الفترة التاريخية
              </span>

              <span className="mr-2 font-black text-white">
                {project.period || "غير محددة"}
              </span>
            </div>

            <div className="min-w-0 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
              <span className="text-slate-500">
                تاريخ الإنشاء
              </span>

              <span className="mr-2 font-black text-white">
                {formatDate(project.createdAt)}
              </span>
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:mt-8 sm:flex sm:flex-wrap">
            <a
              href="#document-upload"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-l sm:w-auto from-amber-400 to-orange-500 px-6 py-4 font-bold text-slate-950 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/20"
            >
              رفع مستند جديد
            </a>

            <a
              href="#documents"
              className="inline-flex w-full items-center justify-center rounded-2xl border border-white/15 sm:w-auto bg-white/[0.04] px-6 py-3.5 font-bold text-white transition hover:border-amber-400/30 hover:bg-amber-400/[0.06]"
            >
              استعراض المستندات
            </a>
          </div>
        </div>

        <div className="hidden lg:flex lg:justify-end">
          <div className="relative flex h-64 w-64 items-center justify-center rounded-full border border-amber-400/20 bg-amber-400/[0.035] shadow-2xl shadow-amber-950/20">
            <div className="absolute inset-6 rounded-full border border-dashed border-amber-400/25" />

            <div className="absolute inset-12 rounded-full border border-white/[0.06]" />

            <div className="relative text-center">
              <div className="text-7xl">𓂀</div>

              <div className="mt-3 text-3xl font-black text-amber-400">
                أثر
              </div>

              <div className="mt-1 text-xs font-bold tracking-[0.32em] text-slate-500">
                ATHAR AI
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
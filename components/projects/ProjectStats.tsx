type Props = {
  documents: any[];
  projectEntities: any[];
  people: any[];
  completedDocuments: number;
  projectStatus: string;
};

const statItemClassName =
  "min-w-0 bg-[#0a1727] p-3 sm:rounded-2xl sm:border sm:border-white/10 sm:p-5 sm:shadow-lg sm:shadow-black/15";

const statContentClassName =
  "flex min-w-0 items-center gap-3 sm:justify-between";

const iconClassName =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg sm:order-last sm:h-12 sm:w-12 sm:rounded-2xl sm:text-2xl";

export default function ProjectStats({
  documents,
  projectEntities,
  people,
  completedDocuments,
  projectStatus,
}: Props) {
  return (
    <section
      aria-label="إحصائيات المشروع"
      className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:mt-6 sm:gap-4 sm:overflow-visible sm:rounded-none sm:border-0 sm:bg-transparent xl:grid-cols-4"
    >
      <div className={statItemClassName}>
        <div className={statContentClassName}>
          <div
            aria-hidden="true"
            className={`${iconClassName} bg-amber-400/10`}
          >
            📄
          </div>

          <div className="min-w-0">
            <p className="text-xs text-slate-400 sm:text-sm">
              المستندات
            </p>

            <p className="mt-0.5 text-xl font-black sm:mt-2 sm:text-3xl">
              {documents.length}
            </p>
          </div>
        </div>

        <p className="mt-4 hidden text-sm leading-5 text-slate-500 sm:block">
          مستند داخل المشروع
        </p>
      </div>

      <div className={statItemClassName}>
        <div className={statContentClassName}>
          <div
            aria-hidden="true"
            className={`${iconClassName} bg-cyan-400/10 text-cyan-300`}
          >
            ◉
          </div>

          <div className="min-w-0">
            <p className="text-xs text-slate-400 sm:text-sm">
              الكيانات
            </p>

            <p className="mt-0.5 text-xl font-black sm:mt-2 sm:text-3xl">
              {projectEntities.length}
            </p>
          </div>
        </div>

        <p className="mt-4 hidden text-sm leading-5 text-slate-500 sm:block">
          أشخاص وأماكن وأحداث
        </p>
      </div>

      <div className={statItemClassName}>
        <div className={statContentClassName}>
          <div
            aria-hidden="true"
            className={`${iconClassName} bg-violet-400/10`}
          >
            👤
          </div>

          <div className="min-w-0">
            <p className="text-xs text-slate-400 sm:text-sm">
              الأشخاص
            </p>

            <p className="mt-0.5 text-xl font-black sm:mt-2 sm:text-3xl">
              {people.length}
            </p>
          </div>
        </div>

        <p className="mt-4 hidden text-sm leading-5 text-slate-500 sm:block">
          شخصية تاريخية
        </p>
      </div>

      <div className={statItemClassName}>
        <div className={statContentClassName}>
          <div
            aria-hidden="true"
            className={`${iconClassName} bg-emerald-400/10 text-emerald-300`}
          >
            ✓
          </div>

          <div className="min-w-0">
            <p className="text-xs text-slate-400 sm:text-sm">
              حالة المعالجة
            </p>

            <p className="mt-0.5 break-words text-xs font-black leading-5 text-emerald-300 sm:mt-2 sm:text-xl sm:leading-7 xl:text-2xl">
              {projectStatus}
            </p>
          </div>
        </div>

        <p className="mt-4 hidden text-sm leading-5 text-slate-500 sm:block">
          {completedDocuments} من {documents.length} مكتمل
        </p>
      </div>
    </section>
  );
}

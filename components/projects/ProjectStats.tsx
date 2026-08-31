type Props = {
  documents: any[];
  projectEntities: any[];
  people: any[];
  completedDocuments: number;
  projectStatus: string;
};

export default function ProjectStats({
  documents,
  projectEntities,
  people,
  completedDocuments,
  projectStatus,
}: Props) {
  return (
    <section className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4 xl:grid-cols-4">
      <div className="rounded-2xl border border-white/10 bg-[#0a1727] p-4 shadow-lg sm:p-5 shadow-black/15">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">المستندات</p>
            <p className="mt-1.5 text-2xl font-black sm:mt-2 sm:text-3xl">
              {documents.length}
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl sm:h-12 sm:w-12 sm:rounded-2xl bg-amber-400/10 text-2xl">
            📄
          </div>
        </div>

        <p className="mt-3 text-xs leading-5 text-slate-500 sm:mt-4 sm:text-sm">
          مستند داخل المشروع
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0a1727] p-4 shadow-lg sm:p-5 shadow-black/15">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">الكيانات</p>

            <p className="mt-1.5 text-2xl font-black sm:mt-2 sm:text-3xl">
              {projectEntities.length}
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl sm:h-12 sm:w-12 sm:rounded-2xl bg-cyan-400/10 text-2xl">
            ◉
          </div>
        </div>

        <p className="mt-3 text-xs leading-5 text-slate-500 sm:mt-4 sm:text-sm">
          أشخاص وأماكن وأحداث
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0a1727] p-4 shadow-lg sm:p-5 shadow-black/15">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">الأشخاص</p>

            <p className="mt-1.5 text-2xl font-black sm:mt-2 sm:text-3xl">
              {people.length}
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl sm:h-12 sm:w-12 sm:rounded-2xl bg-violet-400/10 text-2xl">
            👤
          </div>
        </div>

        <p className="mt-3 text-xs leading-5 text-slate-500 sm:mt-4 sm:text-sm">
          شخصية تاريخية
        </p>
      </div>

      <div className="rounded-2xl border border-emerald-400/15 bg-[#0a1727] p-4 shadow-lg sm:p-5 shadow-black/15">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">
              حالة المعالجة
            </p>

            <p className="mt-1.5 break-words text-base font-black leading-6 text-emerald-300 sm:mt-2 sm:text-xl xl:text-2xl">
              {projectStatus}
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl sm:h-12 sm:w-12 sm:rounded-2xl bg-emerald-400/10 text-2xl text-emerald-300">
            ✓
          </div>
        </div>

        <p className="mt-3 text-xs leading-5 text-slate-500 sm:mt-4 sm:text-sm">
          {completedDocuments} من {documents.length} مكتمل
        </p>
      </div>
    </section>
  );
}
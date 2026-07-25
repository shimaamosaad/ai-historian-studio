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
    <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-2xl border border-white/10 bg-[#0a1727] p-5 shadow-lg shadow-black/15">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">المستندات</p>
            <p className="mt-2 text-3xl font-black">
              {documents.length}
            </p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/10 text-2xl">
            📄
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-500">
          مستند داخل المشروع
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0a1727] p-5 shadow-lg shadow-black/15">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">الكيانات</p>

            <p className="mt-2 text-3xl font-black">
              {projectEntities.length}
            </p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-2xl">
            ◉
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-500">
          أشخاص وأماكن وأحداث
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0a1727] p-5 shadow-lg shadow-black/15">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">الأشخاص</p>

            <p className="mt-2 text-3xl font-black">
              {people.length}
            </p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-400/10 text-2xl">
            👤
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-500">
          شخصية تاريخية
        </p>
      </div>

      <div className="rounded-2xl border border-emerald-400/15 bg-[#0a1727] p-5 shadow-lg shadow-black/15">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">
              حالة المعالجة
            </p>

            <p className="mt-2 text-2xl font-black text-emerald-300">
              {projectStatus}
            </p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-2xl text-emerald-300">
            ✓
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-500">
          {completedDocuments} من {documents.length} مكتمل
        </p>
      </div>
    </section>
  );
}
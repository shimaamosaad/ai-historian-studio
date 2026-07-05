export default function Timeline() {
  return (
    <div className="sticky top-24">

      <div className="rounded-3xl border border-slate-800 bg-[#0C1525] p-6">

        <h2 className="mb-8 text-center text-xl font-bold text-cyan-300">
          الخط الزمني
        </h2>

        <div className="space-y-6">

          <div className="border-r-4 border-amber-400 pr-4">
            <h3 className="font-bold">1258م</h3>
            <p className="text-sm text-slate-400">
              سقوط بغداد
            </p>
          </div>

          <div className="border-r-4 border-cyan-400 pr-4">
            <h3 className="font-bold">1517م</h3>
            <p className="text-sm text-slate-400">
              دخول العثمانيين مصر
            </p>
          </div>

          <div className="border-r-4 border-emerald-400 pr-4">
            <h3 className="font-bold">1798م</h3>
            <p className="text-sm text-slate-400">
              الحملة الفرنسية
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
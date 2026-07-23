import {
  BrainCircuit,
  FileSearch,
  GitBranch,
  LibraryBig,
  ScanText,
  Sparkles,
  Timeline,
} from "lucide-react";

const features = [
  {
    title: "تحليل الوثائق",
    description:
      "رفع ملفات PDF وWord وتحويل محتواها إلى نص قابل للبحث والتحليل داخل المشروع.",
    icon: FileSearch,
    metric: "PDF & Word",
  },
  {
    title: "استخراج الكيانات",
    description:
      "التعرّف على الشخصيات والأماكن والأحداث والمصطلحات المهمة وربطها بالمصدر.",
    icon: BrainCircuit,
    metric: "AI Analysis",
  },
  {
    title: "الشبكات المعرفية",
    description:
      "إظهار العلاقات بين الشخصيات والأماكن والأحداث في شبكة تفاعلية قابلة للتوسّع.",
    icon: GitBranch,
    metric: "Knowledge Graph",
  },
  {
    title: "التسلسل الزمني",
    description:
      "ترتيب الأحداث تاريخيًا وعرض تطورها في خط زمني واضح يساعد على فهم السياق.",
    icon: Timeline,
    metric: "Timeline",
  },
  {
    title: "البحث داخل المصادر",
    description:
      "طرح أسئلة مباشرة على المستندات والوصول إلى المقاطع الأقرب للسؤال بسرعة.",
    icon: ScanText,
    metric: "Smart Search",
  },
  {
    title: "إدارة المشروعات",
    description:
      "تنظيم المستندات والتحليلات والتقارير والكيانات داخل مساحة بحثية واحدة.",
    icon: LibraryBig,
    metric: "Research Hub",
  },
];

export default function Features() {
  return (
    <section
      id="platform"
      dir="rtl"
      className="relative overflow-hidden border-t border-blue-400/10 bg-[#020712] py-24 text-white"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[8%] top-0 h-72 w-72 rounded-full bg-blue-500/10 blur-[110px]" />
        <div className="absolute bottom-[-80px] right-[10%] h-80 w-80 rounded-full bg-amber-400/[0.055] blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.055] bg-[linear-gradient(rgba(96,165,250,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(96,165,250,0.045)_1px,transparent_1px)] bg-[size:58px_58px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1450px] px-5 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/25 bg-blue-500/[0.07] px-4 py-2 text-sm font-bold text-blue-300">
            <Sparkles className="h-4 w-4" />
            أدوات بحثية متكاملة
          </div>

          <h2 className="mt-6 text-4xl font-black leading-tight md:text-5xl">
            كل ما يحتاجه الباحث
            <span className="mt-2 block bg-gradient-to-l from-[#ffe5a0] via-[#efb64a] to-[#c97a17] bg-clip-text text-transparent">
              في منصة واحدة
            </span>
          </h2>

          <p className="mt-6 text-lg leading-9 text-slate-400">
            من رفع المصدر حتى بناء التقرير، تساعدك أثر على تنظيم المعرفة
            التاريخية وتحليلها والوصول إلى العلاقات المهمة بصورة أسرع وأوضح.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <article
                key={feature.title}
                className="group relative overflow-hidden rounded-[24px] border border-blue-400/15 bg-[#061225]/78 p-6 backdrop-blur-xl transition duration-300 hover:-translate-y-1.5 hover:border-blue-300/40 hover:shadow-[0_22px_60px_rgba(15,64,140,.17)]"
              >
                <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-blue-400/35 to-transparent opacity-0 transition group-hover:opacity-100" />

                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-400/30 bg-blue-500/[0.08] text-blue-300 shadow-[0_12px_28px_rgba(37,99,235,.12)] transition group-hover:border-amber-300/35 group-hover:text-amber-300">
                    <Icon className="h-7 w-7" />
                  </div>

                  <span className="text-4xl font-black text-white/[0.035]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <h3 className="mt-6 text-2xl font-black text-white">
                  {feature.title}
                </h3>

                <p className="mt-4 min-h-[84px] text-base leading-7 text-slate-400">
                  {feature.description}
                </p>

                <div className="mt-6 flex items-center justify-between border-t border-white/[0.06] pt-4">
                  <span className="text-xs font-bold tracking-wide text-blue-300">
                    {feature.metric}
                  </span>

                  <span className="h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_14px_rgba(252,211,77,.75)]" />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
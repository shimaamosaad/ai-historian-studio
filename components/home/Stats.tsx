"use client";

import { motion } from "framer-motion";
import {
  BrainCircuit,
  FileSearch,
  Network,
  Timeline,
} from "lucide-react";

const capabilities = [
  {
    icon: FileSearch,
    title: "تحليل الوثائق التاريخية",
    description:
      "ارفع ملفات PDF وWord، واستخرج محتواها وابحث داخلها بسرعة من خلال أدوات مخصصة للباحثين.",
  },
  {
    icon: BrainCircuit,
    title: "استخراج المعرفة تلقائيًا",
    description:
      "تتعرف المنصة على الشخصيات والأماكن والأحداث والعلاقات المهمة داخل الوثائق التاريخية.",
  },
  {
    icon: Network,
    title: "بناء شبكة معرفية",
    description:
      "حوّل المعلومات المتفرقة إلى شبكة تفاعلية توضح العلاقات بين الشخصيات والأحداث والأماكن.",
  },
  {
    icon: Timeline,
    title: "تقارير وتسلسل زمني",
    description:
      "أنشئ تقارير تاريخية منظمة وتسلسلًا زمنيًا يساعدك على فهم الأحداث وتتبع تطورها.",
  },
];

export default function Stats() {
  return (
    <section
      id="capabilities"
      dir="rtl"
      className="relative overflow-hidden border-t border-blue-400/10 bg-[#020712] px-6 py-24 text-white"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[8%] top-16 h-80 w-80 rounded-full bg-blue-500/10 blur-[120px]" />

        <div className="absolute bottom-[-120px] right-[8%] h-96 w-96 rounded-full bg-amber-400/[0.06] blur-[140px]" />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(96,165,250,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(96,165,250,0.035)_1px,transparent_1px)] bg-[size:58px_58px] opacity-[0.07]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center rounded-full border border-blue-400/30 bg-blue-500/10 px-5 py-2 text-sm font-semibold text-blue-300">
            قدرات منصة أثر
          </span>

          <h2 className="mt-6 text-4xl font-black leading-tight md:text-5xl">
            ماذا تستطيع منصة
            <span className="mr-3 bg-gradient-to-l from-[#ffe5a0] via-[#efb64a] to-[#c97a17] bg-clip-text text-transparent">
              أثر أن تفعل؟
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-400">
            مجموعة متكاملة من أدوات الذكاء الاصطناعي تساعد الباحث والمؤرخ على
            تحليل الوثائق، واستخراج المعرفة، وتنظيم المعلومات التاريخية بصورة
            واضحة ومترابطة.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {capabilities.map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                }}
                className="group relative flex h-full flex-col overflow-hidden rounded-[28px] border border-blue-400/15 bg-[#061225]/85 p-7 backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:border-blue-300/40 hover:shadow-[0_24px_70px_rgba(15,64,140,.2)]"
              >
                <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-blue-400/50 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />

                <div className="absolute -left-16 -top-16 h-36 w-36 rounded-full bg-blue-500/10 blur-3xl transition duration-300 group-hover:bg-blue-500/20" />

                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-400/30 bg-gradient-to-br from-blue-500/15 to-amber-400/10 text-blue-300 shadow-[0_14px_35px_rgba(37,99,235,.12)] transition duration-300 group-hover:border-amber-300/35 group-hover:text-amber-300">
                      <Icon className="h-8 w-8" />
                    </div>

                    <span className="text-4xl font-black text-white/[0.04]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <h3 className="mt-7 text-xl font-black leading-8 text-white">
                    {item.title}
                  </h3>

                  <p className="mt-4 text-sm leading-7 text-slate-400">
                    {item.description}
                  </p>
                </div>

                <div className="mt-auto pt-7">
                  <div className="h-px bg-gradient-to-r from-blue-400/25 via-white/[0.05] to-transparent" />

                  <div className="mt-5 flex items-center gap-2 text-sm font-bold text-blue-300 transition group-hover:text-amber-300">
                    <span>استكشف الإمكانية</span>
                    <span className="transition duration-300 group-hover:-translate-x-1">
                      ←
                    </span>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-14 flex flex-col items-center justify-between gap-5 rounded-[26px] border border-amber-300/15 bg-gradient-to-l from-amber-400/[0.07] via-blue-500/[0.05] to-transparent px-7 py-6 text-center md:flex-row md:text-right"
        >
          <div>
            <h3 className="text-lg font-black text-white">
              كل أدوات البحث التاريخي في مساحة عمل واحدة
            </h3>

            <p className="mt-2 text-sm leading-7 text-slate-400">
              من رفع الوثيقة إلى استخراج النتائج وبناء التقرير النهائي، تساعدك
              منصة أثر على إدارة رحلة البحث بصورة أكثر تنظيمًا ووضوحًا.
            </p>
          </div>

          <div className="shrink-0 rounded-full border border-amber-300/25 bg-amber-400/10 px-5 py-2 text-sm font-black text-amber-300">
            مدعوم بالذكاء الاصطناعي
          </div>
        </motion.div>
      </div>
    </section>
  );
}
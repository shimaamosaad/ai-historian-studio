"use client";

import { motion } from "framer-motion";
import {
  FolderPlus,
  Upload,
  BrainCircuit,
  BarChart3,
  ArrowLeft,
} from "lucide-react";

const steps = [
  {
    icon: FolderPlus,
    title: "أنشئ مشروعًا",
    text: "ابدأ مشروعًا جديدًا وحدد موضوع البحث أو الفترة التاريخية التي تعمل عليها.",
  },
  {
    icon: Upload,
    title: "أضف المصادر",
    text: "ارفع الكتب والمخطوطات والوثائق والصور ليبدأ النظام في معالجتها.",
  },
  {
    icon: BrainCircuit,
    title: "تحليل بالذكاء الاصطناعي",
    text: "يستخرج أثر الشخصيات والأماكن والأحداث والعلاقات ويحلل المحتوى تلقائيًا.",
  },
  {
    icon: BarChart3,
    title: "نتائج تفاعلية",
    text: "استكشف التقارير والخرائط والخطوط الزمنية والرسوم البيانية في واجهة واحدة.",
  },
];

export default function HowItWorks() {
  return (
    <section className="relative overflow-hidden bg-slate-950 py-28 px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#06b6d420,transparent_70%)]" />

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-20 text-center"
        >
          <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-500/10 px-5 py-2 text-sm font-semibold text-cyan-300">
            آلية العمل
          </span>

          <h2 className="mt-6 text-4xl font-black text-white md:text-5xl">
            كيف يعمل أثر؟
          </h2>

          <p className="mx-auto mt-6 max-w-3xl leading-8 text-slate-400">
            رحلة بسيطة تبدأ من رفع المصادر التاريخية وتنتهي بتحليلات ذكية
            تساعد الباحث على اكتشاف المعرفة بصورة أسرع وأكثر دقة.
          </p>
        </motion.div>

        <div className="grid gap-10 lg:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.45,
                  delay: index * 0.1,
                }}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl transition-all duration-500 hover:-translate-y-3 hover:border-cyan-400/40"
              >
                <div className="absolute right-6 top-6 text-6xl font-black text-white/5">
                  0{index + 1}
                </div>

                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-300 transition-transform duration-300 group-hover:scale-110">
                  <Icon size={30} />
                </div>

                <h3 className="mt-8 text-2xl font-bold text-white">
                  {step.title}
                </h3>

                <p className="mt-4 leading-8 text-slate-400">
                  {step.text}
                </p>

                {index < steps.length - 1 && (
                  <ArrowLeft className="absolute -left-5 top-1/2 hidden -translate-y-1/2 text-cyan-500/40 lg:block" />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
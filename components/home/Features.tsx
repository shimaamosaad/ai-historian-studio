"use client";

import { motion } from "framer-motion";
import {
  Brain,
  ScrollText,
  MapPinned,
  Users,
  Clock3,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "تحليل بالذكاء الاصطناعي",
    text: "حلّل المخطوطات والوثائق التاريخية خلال ثوانٍ مع استخراج المعلومات المهمة تلقائيًا.",
  },
  {
    icon: ScrollText,
    title: "قراءة المخطوطات",
    text: "تحويل الوثائق والمخطوطات إلى نصوص قابلة للبحث والتحليل بسهولة.",
  },
  {
    icon: Users,
    title: "استخراج الشخصيات",
    text: "التعرف على الشخصيات التاريخية وربطها بالأحداث والعلاقات المختلفة.",
  },
  {
    icon: MapPinned,
    title: "الأماكن التاريخية",
    text: "ربط المواقع التاريخية بخرائط تفاعلية لعرض الامتداد الجغرافي للأحداث.",
  },
  {
    icon: Clock3,
    title: "الخط الزمني",
    text: "إنشاء Timeline ذكي للأحداث التاريخية وترتيبها تلقائيًا.",
  },
  {
    icon: Sparkles,
    title: "مساعد الباحث",
    text: "اسأل الذكاء الاصطناعي عن أي وثيقة أو شخصية أو حدث واحصل على إجابة مدعومة بالسياق.",
  },
];

export default function Features() {
  return (
    <section className="relative overflow-hidden bg-slate-950 py-28 px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#0891b233,transparent_65%)]" />

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-20 text-center"
        >
          <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-500/10 px-5 py-2 text-sm font-semibold text-cyan-300">
            مميزات منصة أثر
          </span>

          <h2 className="mt-6 text-4xl font-black text-white md:text-5xl">
            أدوات ذكية للباحث التاريخي
          </h2>

          <p className="mx-auto mt-6 max-w-3xl leading-8 text-slate-400">
            صُممت منصة أثر لتجمع بين قوة الذكاء الاصطناعي وأدوات البحث
            الأكاديمي، لتمنح الباحث تجربة حديثة في تحليل الوثائق
            وربط الشخصيات والأماكن والأحداث.
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {features.map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.45,
                  delay: index * 0.08,
                }}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl transition-all duration-500 hover:-translate-y-3 hover:border-cyan-400/40 hover:bg-white/10"
              >
                <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl transition-all duration-500 group-hover:bg-cyan-400/20" />

                <div className="relative">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-300 transition-transform duration-300 group-hover:scale-110">
                    <Icon size={30} />
                  </div>

                  <h3 className="mb-4 text-2xl font-bold text-white">
                    {item.title}
                  </h3>

                  <p className="leading-8 text-slate-400">
                    {item.text}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  FileText,
  Users,
  Globe2,
} from "lucide-react";

const stats = [
  {
    icon: FileText,
    value: "2M+",
    label: "وثيقة تاريخية",
  },
  {
    icon: BookOpen,
    value: "250K+",
    label: "مخطوطة وكتاب",
  },
  {
    icon: Users,
    value: "50K+",
    label: "شخصية تاريخية",
  },
  {
    icon: Globe2,
    value: "120+",
    label: "منطقة وموقع تاريخي",
  },
];

export default function Stats() {
  return (
    <section
  id="stats"
  className="relative overflow-hidden bg-slate-950 py-24"
>
      <div className="absolute inset-0 bg-[radial-gradient(circle,#06b6d415,transparent_70%)]" />

      <div className="relative mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-500/10 px-5 py-2 text-sm font-semibold text-cyan-300">
            أرقام تتحدث
          </span>

          <h2 className="mt-6 text-4xl font-black text-white md:text-5xl">
            قوة منصة أثر في أرقام
          </h2>

          <p className="mx-auto mt-6 max-w-3xl leading-8 text-slate-400">
            صُممت المنصة للتعامل مع كميات ضخمة من البيانات التاريخية
            مع الحفاظ على سرعة البحث ودقة النتائج.
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.45,
                  delay: index * 0.08,
                }}
                className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:border-cyan-400/40"
              >
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                  <Icon className="text-cyan-300" size={30} />
                </div>

                <div className="text-5xl font-black text-white">
                  {item.value}
                </div>

                <p className="mt-4 text-slate-400">
                  {item.label}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
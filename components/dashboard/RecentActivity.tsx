"use client";

import { motion } from "framer-motion";
import {
  BrainCircuit,
  FileText,
  MapPinned,
  Users,
  Clock3,
} from "lucide-react";

const activities = [
  {
    icon: BrainCircuit,
    title: "اكتمل تحليل مشروع الدولة الفاطمية",
    time: "منذ 5 دقائق",
  },
  {
    icon: FileText,
    title: "تمت إضافة 24 وثيقة جديدة",
    time: "منذ 18 دقيقة",
  },
  {
    icon: Users,
    title: "تم اكتشاف 13 شخصية تاريخية جديدة",
    time: "منذ ساعة",
  },
  {
    icon: MapPinned,
    title: "تم ربط 8 أماكن تاريخية بالخريطة",
    time: "اليوم",
  },
];

export default function RecentActivity() {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-white">
          النشاط الأخير
        </h2>

        <p className="mt-2 text-slate-400">
          آخر العمليات التي تمت داخل المنصة.
        </p>
      </div>

      <div className="space-y-5">
        {activities.map((item, index) => {
          const Icon = item.icon;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 25 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: index * 0.08,
              }}
              className="flex items-start gap-4 rounded-2xl border border-white/5 bg-slate-950/40 p-4 transition-all duration-300 hover:border-cyan-500/30"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                <Icon size={22} />
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-white">
                  {item.title}
                </h3>

                <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                  <Clock3 size={14} />
                  {item.time}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
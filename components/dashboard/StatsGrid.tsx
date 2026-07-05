"use client";

import { motion } from "framer-motion";
import {
  FileText,
  Users,
  MapPinned,
  Landmark,
} from "lucide-react";

const stats = [
  {
    title: "الوثائق",
    value: "12,548",
    icon: FileText,
    color: "from-cyan-500 to-blue-600",
  },
  {
    title: "الشخصيات",
    value: "3,412",
    icon: Users,
    color: "from-emerald-500 to-teal-600",
  },
  {
    title: "الأماكن",
    value: "1,286",
    icon: MapPinned,
    color: "from-amber-500 to-orange-600",
  },
  {
    title: "الأحداث",
    value: "5,973",
    icon: Landmark,
    color: "from-violet-500 to-fuchsia-600",
  },
];

export default function StatsGrid() {
  return (
    <section>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-white">
          نظرة سريعة
        </h2>

        <p className="mt-2 text-slate-400">
          ملخص البيانات الموجودة داخل منصة أثر.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item, index) => {
          const Icon = item.icon;

          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.08,
              }}
              className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/30"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">
                    {item.title}
                  </p>

                  <h3 className="mt-3 text-4xl font-black text-white">
                    {item.value}
                  </h3>
                </div>

                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color}`}
                >
                  <Icon size={30} className="text-white" />
                </div>
              </div>

              <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                  style={{ width: `${75 + index * 5}%` }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
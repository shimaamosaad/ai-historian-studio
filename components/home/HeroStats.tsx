"use client";

import { motion } from "framer-motion";
import {
  Search,
  ScrollText,
  BrainCircuit,
  MapPinned,
} from "lucide-react";

const stats = [
  {
    icon: Search,
    title: "+2M",
    desc: "وثيقة تاريخية",
    color: "text-cyan-400",
  },
  {
    icon: ScrollText,
    title: "+300K",
    desc: "مخطوطة",
    color: "text-amber-400",
  },
  {
    icon: BrainCircuit,
    title: "AI",
    desc: "تحليل ذكي",
    color: "text-blue-400",
  },
  {
    icon: MapPinned,
    title: "Maps",
    desc: "خرائط تاريخية",
    color: "text-emerald-400",
  },
];

export default function HeroStats() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-14 grid grid-cols-2 gap-5 lg:grid-cols-4"
    >
      {stats.map((item, index) => {
        const Icon = item.icon;

        return (
          <motion.div
            key={index}
            whileHover={{ y: -8, scale: 1.03 }}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition"
          >
            <Icon className={`mb-5 h-8 w-8 ${item.color}`} />

            <h3 className="text-3xl font-black text-white">
              {item.title}
            </h3>

            <p className="mt-2 text-sm text-slate-300">
              {item.desc}
            </p>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import Button from "../ui/Button";

export default function HeroInfo() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
    >
      <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-5 py-2 backdrop-blur-xl">

        <Sparkles className="h-4 w-4 text-cyan-300" />

        <span className="text-sm text-cyan-100">
          منصة بحث تاريخي مدعومة بالذكاء الاصطناعي
        </span>

      </div>

      <h1 className="leading-tight">

        <span className="block bg-gradient-to-r from-cyan-300 via-blue-500 to-amber-300 bg-clip-text text-7xl font-black text-transparent lg:text-8xl">

          أثــــر

        </span>

        <span className="mt-6 block text-4xl font-black text-white lg:text-6xl">

          المستقبل يبدأ
          <br />
          من فهم الماضي

        </span>

      </h1>

      <p className="mt-8 max-w-2xl text-lg leading-9 text-slate-300">

        منصة ذكية لتحليل الوثائق والمخطوطات التاريخية،
        وربط الشخصيات والأماكن والأحداث باستخدام
        أحدث تقنيات الذكاء الاصطناعي.

      </p>

      <div className="mt-10 flex flex-wrap gap-4">

        <Button size="lg">

          ابدأ البحث

          <ArrowRight className="ms-2 h-5 w-5" />

        </Button>

        <Button variant="outline" size="lg">

          استكشف المنصة

        </Button>

      </div>

    </motion.div>
  );
}
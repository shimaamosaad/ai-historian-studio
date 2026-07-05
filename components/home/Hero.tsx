"use client";

import HeroBackground from "./HeroBackground";
import HeroInfo from "./HeroInfo";
import HeroStats from "./HeroStats";
import SearchPanel from "./SearchPanel";

import { motion } from "framer-motion";
import {
  Sparkles,
  Search,
  ScrollText,
  BrainCircuit,
  MapPinned,
  ArrowRight,
} from "lucide-react";

import Button from "../ui/Button";
import Container from "../ui/Container";

const features = [
  {
    icon: Search,
    title: "بحث ذكي",
  },
  {
    icon: ScrollText,
    title: "تحليل الوثائق",
  },
  {
    icon: BrainCircuit,
    title: "ذكاء اصطناعي",
  },
  {
    icon: MapPinned,
    title: "ربط الأماكن",
  },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-slate-950">
      <HeroBackground />

      <Container className="relative z-10">
        <div className="grid min-h-screen items-center gap-20 py-24 lg:grid-cols-2">
          {/* Left */}
          <div>
            <HeroInfo />

            <HeroStats />

            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="mt-10 flex flex-wrap gap-3"
            >
              {features.map((item) => (
                <div
                  key={item.title}
                  className="flex items-center gap-2 rounded-full border border-cyan-400/20 bg-white/5 px-4 py-2 backdrop-blur-xl transition-all duration-300 hover:border-cyan-400/40 hover:bg-cyan-500/10"
                >
                  <item.icon className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm text-slate-200">
                    {item.title}
                  </span>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-10 flex flex-wrap gap-4"
            >
              <Button className="group">
                ابدأ البحث الآن
                <ArrowRight className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
              </Button>

              <Button variant="outline">
                استكشف المنصة
              </Button>
            </motion.div>
          </div>

          {/* Right */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-[0_0_60px_rgba(6,182,212,0.15)] backdrop-blur-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5" />

              <div className="relative">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/15 px-4 py-2 text-sm font-semibold text-cyan-300">
                  <Sparkles className="h-4 w-4" />
                  تجربة البحث الذكي
                </div>

                <h2 className="text-4xl font-black leading-tight text-white lg:text-5xl">
                  ابحث في ملايين الوثائق
                  <br />
                  خلال ثوانٍ
                </h2>

                <p className="mt-6 max-w-xl leading-8 text-slate-300">
                  استخدم الذكاء الاصطناعي لفهم الوثائق التاريخية،
                  استخراج المعلومات، وربط الشخصيات والأماكن
                  والأحداث بصورة دقيقة وسريعة.
                </p>

                <div className="mt-8">
                  <SearchPanel />
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                    <div className="text-2xl font-black text-cyan-400">
                      +2M
                    </div>
                    <div className="mt-1 text-sm text-slate-400">
                      وثيقة مؤرشفة
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                    <div className="text-2xl font-black text-cyan-400">
                      AI
                    </div>
                    <div className="mt-1 text-sm text-slate-400">
                      تحليل ذكي فوري
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  FolderOpen,
  FileText,
  Users,
  MapPinned,
  CalendarDays,
  ArrowLeft,
  Plus,
} from "lucide-react";

import AtharButton from "@/components/ui/AtharButton";

const projects = [
  {
    title: "الحياة العلمية في العصر المملوكي",
    status: "قيد التحليل",
    documents: 186,
    people: 94,
    places: 41,
    events: 132,
    updated: "منذ 12 دقيقة",
    color: "from-amber-500 to-orange-500",
  },
  {
    title: "مخطوطات الأزهر",
    status: "مكتمل",
    documents: 742,
    people: 318,
    places: 115,
    events: 687,
    updated: "أمس",
    color: "from-emerald-500 to-teal-600",
  },
  {
    title: "رحلات ابن بطوطة",
    status: "جديد",
    documents: 37,
    people: 28,
    places: 19,
    events: 56,
    updated: "منذ ساعة",
    color: "from-cyan-500 to-blue-600",
  },
];

export default function Projects() {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-8 backdrop-blur-xl">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-black text-white">
            المشاريع البحثية
          </h2>

          <p className="mt-2 text-slate-400">
            اختر مشروعًا لمتابعة التحليل أو أنشئ مشروعًا جديدًا.
          </p>
        </div>

        <Link href="/projects/new">
          <AtharButton>
            <Plus size={18} />
            مشروع جديد
          </AtharButton>
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {projects.map((project, index) => (
          <motion.div
            key={project.title}
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="group rounded-3xl border border-white/10 bg-slate-950/50 p-6 transition-all duration-300 hover:-translate-y-2 hover:border-cyan-500/30"
          >
            <div
              className={`mb-6 h-2 w-24 rounded-full bg-gradient-to-r ${project.color}`}
            />

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10">
                <FolderOpen className="text-cyan-400" size={22} />
              </div>

              <div>
                <h3 className="font-bold text-white">
                  {project.title}
                </h3>

                <p className="text-sm text-cyan-300">
                  {project.status}
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-slate-900 p-3">
                <div className="flex items-center gap-2 text-slate-400">
                  <FileText size={16} />
                  الوثائق
                </div>

                <div className="mt-2 text-2xl font-bold text-white">
                  {project.documents}
                </div>
              </div>

              <div className="rounded-xl bg-slate-900 p-3">
                <div className="flex items-center gap-2 text-slate-400">
                  <Users size={16} />
                  الشخصيات
                </div>

                <div className="mt-2 text-2xl font-bold text-white">
                  {project.people}
                </div>
              </div>

              <div className="rounded-xl bg-slate-900 p-3">
                <div className="flex items-center gap-2 text-slate-400">
                  <MapPinned size={16} />
                  الأماكن
                </div>

                <div className="mt-2 text-2xl font-bold text-white">
                  {project.places}
                </div>
              </div>

              <div className="rounded-xl bg-slate-900 p-3">
                <div className="flex items-center gap-2 text-slate-400">
                  <CalendarDays size={16} />
                  الأحداث
                </div>

                <div className="mt-2 text-2xl font-bold text-white">
                  {project.events}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
              <span className="text-sm text-slate-500">
                آخر تحديث: {project.updated}
              </span>

              <button className="flex items-center gap-2 text-cyan-300 transition hover:text-cyan-200">
                فتح المشروع
                <ArrowLeft size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  FolderOpen,
  Search,
  FileText,
  Users,
  MapPinned,
  Landmark,
  Clock3,
  BarChart3,
  Settings,
  BrainCircuit,
} from "lucide-react";

const items = [
  {
    href: "/dashboard",
    label: "لوحة التحكم",
    icon: LayoutDashboard,
  },
  {
    href: "/projects",
    label: "المشاريع",
    icon: FolderOpen,
  },
  {
    href: "/search",
    label: "البحث الذكي",
    icon: Search,
  },
  {
    href: "/documents",
    label: "الوثائق",
    icon: FileText,
  },
  {
    href: "/characters",
    label: "الشخصيات",
    icon: Users,
  },
  {
    href: "/places",
    label: "الأماكن",
    icon: MapPinned,
  },
  {
    href: "/events",
    label: "الأحداث",
    icon: Landmark,
  },
  {
    href: "/timeline",
    label: "الخط الزمني",
    icon: Clock3,
  },
  {
    href: "/reports",
    label: "التقارير",
    icon: BarChart3,
  },
  {
    href: "/settings",
    label: "الإعدادات",
    icon: Settings,
  },
];

export default function Sidebar() {
  return (
    <aside className="flex h-screen w-72 flex-col border-l border-white/10 bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-white/10 p-6">
        <div className="flex items-center gap-4">
          {/* مكان اللوجو */}
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600">
            <BrainCircuit size={28} className="text-white" />
          </div>

          <div>
            <h2 className="text-2xl font-black">أثر</h2>

            <p className="text-xs text-slate-400">
              AI Historian Studio
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          القائمة الرئيسية
        </p>

        <div className="space-y-2">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-4 rounded-2xl px-4 py-3 text-slate-300 transition-all duration-300 hover:bg-cyan-500/10 hover:text-cyan-300"
              >
                <Icon
                  size={20}
                  className="transition-transform duration-300 group-hover:scale-110"
                />

                <span className="font-medium">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-5">
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
          <h3 className="text-sm font-bold text-cyan-300">
            منصة أثر
          </h3>

          <p className="mt-2 text-xs leading-6 text-slate-400">
            منصة بحث تاريخي تعتمد على الذكاء الاصطناعي لتحليل الوثائق
            وربط الشخصيات والأماكن والأحداث.
          </p>
        </div>
      </div>
    </aside>
  );
}
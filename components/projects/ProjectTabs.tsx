"use client";

import { useState } from "react";

type Tab =
  | "overview"
  | "documents"
  | "analysis"
  | "timeline"
  | "graph"
  | "ask";

const tabs: {
  id: Tab;
  label: string;
  icon: string;
}[] = [
  {
    id: "overview",
    label: "نظرة عامة",
    icon: "📊",
  },
  {
    id: "documents",
    label: "المستندات",
    icon: "📄",
  },
  {
    id: "analysis",
    label: "التحليل",
    icon: "🤖",
  },
  {
    id: "timeline",
    label: "التسلسل الزمني",
    icon: "📅",
  },
  {
    id: "graph",
    label: "الشبكة المعرفية",
    icon: "🕸️",
  },
  {
    id: "ask",
    label: "اسأل المستندات",
    icon: "💬",
  },
];

export default function ProjectTabs() {
  const [active, setActive] =
    useState<Tab>("overview");

  return (
    <section className="mb-8 rounded-3xl border border-white/10 bg-[#081525] p-3 shadow-xl shadow-black/20">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const selected = active === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={`rounded-2xl px-5 py-3 text-sm font-bold transition ${
                selected
                  ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-950/30"
                  : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="ml-2">
                {tab.icon}
              </span>

              {tab.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
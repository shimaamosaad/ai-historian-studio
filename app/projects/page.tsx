"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Project = {
  id: number;
  title: string;
  description: string;
  period: string;
  region: string;
  language: string;
  createdAt: string;
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch("/api/projects");
        const data = await res.json();
        setProjects(data);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-4xl font-black">المشاريع</h1>

          <Link
            href="/projects/new"
            className="px-5 py-2 rounded-xl bg-white text-black font-medium hover:bg-slate-200 transition"
          >
            + مشروع جديد
          </Link>
        </div>

        {/* Loading */}
        {loading ? (
          <p className="text-slate-400">جاري التحميل...</p>
        ) : projects.length === 0 ? (
          <div className="text-center text-slate-400 border border-white/10 rounded-2xl p-10">
            لا توجد مشاريع بعد
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block rounded-2xl border border-white/10 bg-slate-900/50 p-6 hover:bg-slate-900 transition"
              >
                <h2 className="text-xl font-bold mb-2">
                  {project.title}
                </h2>

                <p className="text-slate-400 text-sm mb-4 line-clamp-3">
                  {project.description}
                </p>

                <div className="text-xs text-slate-500 space-y-1">
                  <p>📜 {project.period}</p>
                  <p>🌍 {project.region}</p>
                  <p>🗣 {project.language}</p>
                </div>

                <div className="mt-4 text-xs text-slate-600">
                  {new Date(project.createdAt).toLocaleDateString("ar-EG")}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
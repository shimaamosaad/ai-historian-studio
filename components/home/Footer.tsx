"use client";

import Link from "next/link";
import {
  BrainCircuit,
  Mail,
  ArrowUp,
} from "lucide-react";

const links = [
  { title: "الرئيسية", href: "#" },
  { title: "المميزات", href: "#features" },
  { title: "كيف يعمل", href: "#how-it-works" },
  { title: "الإحصائيات", href: "#stats" },
];

export default function Footer() {
  const scrollTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,#06b6d420,transparent_70%)]" />

      <div className="relative mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-3">
          {/* Logo */}
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600">
                <BrainCircuit size={24} className="text-white" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-white">
                  أثر
                </h3>

                <p className="text-sm text-slate-400">
                  AI Historian Studio
                </p>
              </div>
            </div>

            <p className="mt-6 max-w-md leading-8 text-slate-400">
              منصة أثر تستخدم الذكاء الاصطناعي لتحليل الوثائق
              والمخطوطات وربط الشخصيات والأماكن والأحداث التاريخية
              في منصة واحدة تخدم الباحثين في التاريخ والإنسانيات
              الرقمية.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="mb-6 text-xl font-bold text-white">
              التنقل
            </h4>

            <div className="flex flex-col gap-4">
              {links.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="transition-colors duration-300 hover:text-cyan-300 text-slate-400"
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-6 text-xl font-bold text-white">
              تواصل معنا
            </h4>

            <div className="flex items-center gap-3 text-slate-400">
              <Mail size={18} />
              <span>contact@athar-ai.com</span>
            </div>

            <div className="mt-8 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5">
              <p className="text-sm leading-7 text-slate-400">
                الإصدار الأول من منصة <span className="font-bold text-cyan-300">أثر</span>
                يركز على دعم الباحثين في التاريخ وتحليل المصادر
                التاريخية باستخدام الذكاء الاصطناعي.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-6 border-t border-white/10 pt-8 md:flex-row">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Athar AI Historian Studio.
            جميع الحقوق محفوظة.
          </p>

          <button
            onClick={scrollTop}
            className="flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-5 py-3 text-cyan-300 transition-all duration-300 hover:bg-cyan-500/20"
          >
            <ArrowUp size={18} />
            العودة إلى الأعلى
          </button>
        </div>
      </div>
    </footer>
  );
}
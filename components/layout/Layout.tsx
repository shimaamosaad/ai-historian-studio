"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, Search, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const links = [
  { title: "الرئيسية", href: "#" },
  { title: "المميزات", href: "#features" },
  { title: "كيف يعمل", href: "#how" },
  { title: "المخطوطات", href: "#manuscripts" },
  { title: "المدونة", href: "#blog" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "backdrop-blur-xl bg-slate-950/80 border-b border-cyan-500/20 shadow-2xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">

        {/* Logo */}

        <Link href="/" className="flex items-center gap-3">

          <div className="relative">

            <div className="absolute inset-0 rounded-full bg-cyan-500 blur-xl opacity-70" />

            <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-cyan-400/50 bg-slate-900">

              <span className="text-2xl font-black bg-gradient-to-r from-cyan-300 via-blue-400 to-amber-300 bg-clip-text text-transparent">
                أ
              </span>

            </div>

          </div>

          <div>

            <h1 className="text-3xl font-black tracking-wide bg-gradient-to-r from-cyan-300 via-blue-400 to-amber-300 bg-clip-text text-transparent">
              أثر
            </h1>

            <p className="text-xs text-slate-300">
              AI Historian Studio
            </p>

          </div>

        </Link>

        {/* Desktop */}

        <nav className="hidden lg:flex items-center gap-10">

          {links.map((item) => (

            <Link
              key={item.title}
              href={item.href}
              className="text-slate-200 transition hover:text-cyan-300"
            >
              {item.title}
            </Link>

          ))}

        </nav>

        {/* Actions */}

        <div className="hidden lg:flex items-center gap-3">

          <button className="flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-slate-900/60 px-4 py-2 text-slate-200 transition hover:border-cyan-400 hover:bg-slate-800">

            <Globe size={18} />

            العربية

          </button>

          <button className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 px-5 py-3 font-bold text-slate-900 transition hover:scale-105">

            <Search size={18} />

            ابدأ البحث

          </button>

        </div>

        {/* Mobile */}

        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden text-white"
        >
          {open ? <X /> : <Menu />}
        </button>

      </div>

      <AnimatePresence>

        {open && (

          <motion.div
            initial={{ opacity: 0, y: -25 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -25 }}
            className="border-t border-cyan-500/20 bg-slate-950 lg:hidden"
          >

            <div className="flex flex-col p-6 gap-5">

              {links.map((item) => (

                <Link
                  key={item.title}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="text-slate-200"
                >
                  {item.title}
                </Link>

              ))}

              <button className="mt-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 py-3 font-bold text-slate-900">

                ابدأ البحث

              </button>

            </div>

          </motion.div>

        )}

      </AnimatePresence>

    </header>
  );
}
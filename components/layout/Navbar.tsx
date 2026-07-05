"use client";

import Link from "next/link";
import { Menu, X, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import Button from "../ui/Button";
import Container from "../ui/Container";

const navItems = [
  { label: "الرئيسية", href: "#" },
  { label: "المميزات", href: "#features" },
  { label: "كيف يعمل", href: "#how-it-works" },
  { label: "الإحصائيات", href: "#stats" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 15);

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-xl shadow-sm"
          : "bg-transparent"
      }`}
    >
      <Container>
        <div className="flex h-20 items-center justify-between">

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-600 text-white shadow-lg">
              <Sparkles size={20} />
            </div>

            <div>
              <h1 className="text-xl font-bold text-slate-900">
                أثر
              </h1>

              <p className="text-xs text-slate-500">
                AI Historian Studio
              </p>
            </div>
          </Link>

          {/* Desktop Menu */}
          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-slate-600 transition hover:text-amber-600"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost">
              تسجيل الدخول
            </Button>

            <Button>
              ابدأ البحث
            </Button>
          </div>

          {/* Mobile Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-xl border border-slate-200 p-2 md:hidden"
          >
            {mobileOpen ? (
              <X size={22} />
            ) : (
              <Menu size={22} />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg md:hidden">

            <div className="flex flex-col gap-4">

              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-slate-700 hover:text-amber-600"
                >
                  {item.label}
                </Link>
              ))}

              <Button
                fullWidth
                variant="outline"
              >
                تسجيل الدخول
              </Button>

              <Button fullWidth>
                ابدأ البحث
              </Button>

            </div>

          </div>
        )}

      </Container>
    </header>
  );
}
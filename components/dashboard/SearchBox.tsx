"use client";

import {
  Search,
  Upload,
  Image as ImageIcon,
  FolderPlus,
  Sparkles,
} from "lucide-react";

export default function SearchBox() {
  return (
    <section className="rounded-[32px] border border-white/10 bg-slate-900/60 p-10 shadow-2xl backdrop-blur-xl">
      {/* Header */}

      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-5xl shadow-xl">
            📖
          </div>
        </div>

        <h1 className="text-7xl font-black text-white">
          أثــــر
        </h1>

        <p className="mt-4 text-2xl text-slate-300">
          مساعدك الذكي للبحث في التاريخ والإنسانيات الرقمية
        </p>
      </div>

      {/* Search */}

      <div className="mt-12">
        <div className="flex items-center rounded-3xl border-2 border-slate-700 bg-slate-950 px-6 py-5 transition duration-300 focus-within:border-cyan-400">
          <Search
            className="text-slate-400"
            size={26}
          />

          <input
            type="text"
            placeholder="اسأل أثر... مثال: ما العلاقة بين صلاح الدين والأيوبيين؟"
            className="mr-4 w-full bg-transparent text-lg text-white outline-none placeholder:text-slate-500"
          />

          <button className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 p-3 text-white transition duration-300 hover:scale-105">
            <Sparkles size={22} />
          </button>
        </div>
      </div>

      {/* Quick Tools */}

      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <button className="flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 transition duration-300 hover:bg-slate-800">
          <Upload size={20} />
          رفع وثيقة
        </button>

        <button className="flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 transition duration-300 hover:bg-slate-800">
          <ImageIcon size={20} />
          تحليل مخطوطة
        </button>

        <button className="flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 transition duration-300 hover:bg-slate-800">
          <FolderPlus size={20} />
          مشروع جديد
        </button>
      </div>

      {/* AI Suggestions */}

      <div className="mt-12">
        <h2 className="mb-6 text-xl font-bold text-white">
          اقتراحات ذكية
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="cursor-pointer rounded-2xl border border-white/10 bg-slate-950 p-5 transition duration-300 hover:border-cyan-500 hover:bg-slate-800">
            📜 لخّص هذه الوثيقة التاريخية
          </div>

          <div className="cursor-pointer rounded-2xl border border-white/10 bg-slate-950 p-5 transition duration-300 hover:border-cyan-500 hover:bg-slate-800">
            👤 استخرج الشخصيات والعلاقات بينها
          </div>

          <div className="cursor-pointer rounded-2xl border border-white/10 bg-slate-950 p-5 transition duration-300 hover:border-cyan-500 hover:bg-slate-800">
            🗺️ أنشئ خريطة للأماكن المذكورة
          </div>

          <div className="cursor-pointer rounded-2xl border border-white/10 bg-slate-950 p-5 transition duration-300 hover:border-cyan-500 hover:bg-slate-800">
            📅 أنشئ خطًا زمنيًا للأحداث
          </div>

          <div className="cursor-pointer rounded-2xl border border-white/10 bg-slate-950 p-5 transition duration-300 hover:border-cyan-500 hover:bg-slate-800">
            📚 قارن بين مصدرين تاريخيين
          </div>

          <div className="cursor-pointer rounded-2xl border border-white/10 bg-slate-950 p-5 transition duration-300 hover:border-cyan-500 hover:bg-slate-800">
            ✨ اقترح موضوعات بحث جديدة
          </div>
        </div>
      </div>
    </section>
  );
}
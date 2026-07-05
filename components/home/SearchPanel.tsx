"use client";

import { motion } from "framer-motion";
import {
  Search,
  Upload,
  BrainCircuit,
  CalendarDays,
  Globe,
  Users,
  Landmark,
  ScrollText,
} from "lucide-react";

import Button from "../ui/Button";

const searchTypes = [
  {
    label: "شخصيات",
    icon: Users,
  },
  {
    label: "أماكن",
    icon: Landmark,
  },
  {
    label: "مخطوطات",
    icon: ScrollText,
  },
];

export default function SearchPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.6,
      }}
      className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-xl backdrop-blur"
    >
      {/* Title */}

      <div className="mb-8">

        <h3 className="text-2xl font-bold text-slate-900">
          البحث الذكي
        </h3>

        <p className="mt-2 text-slate-600">
          ابحث داخل الوثائق والمراجع والمخطوطات باستخدام الذكاء الاصطناعي.
        </p>

      </div>

      {/* Search Input */}

      <div className="relative">

        <Search
          className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400"
          size={20}
        />

        <input
          type="text"
          placeholder="ابحث عن شخصية، مكان، حدث أو مخطوطة..."
          className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pr-14 pl-5 outline-none transition focus:border-amber-500 focus:bg-white"
        />

      </div>

      {/* Filters */}

      <div className="mt-8 grid gap-4 md:grid-cols-3">

        <div>

          <label className="mb-2 block text-sm font-medium text-slate-700">
            نوع البحث
          </label>

          <select className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4">

            {searchTypes.map((item) => (
              <option key={item.label}>
                {item.label}
              </option>
            ))}

          </select>

        </div>

        <div>

          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">

            <CalendarDays size={16} />

            الفترة الزمنية

          </label>

          <select className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4">

            <option>جميع الفترات</option>
            <option>العصر النبوي</option>
            <option>الخلافة الراشدة</option>
            <option>الدولة الأموية</option>
            <option>الدولة العباسية</option>

          </select>

        </div>

        <div>

          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">

            <Globe size={16} />

            اللغة

          </label>

          <select className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4">

            <option>العربية</option>
            <option>English</option>

          </select>

        </div>

      </div>
            {/* Actions */}

      <div className="mt-8 flex flex-col gap-4 md:flex-row">

        <Button
          variant="outline"
          className="flex-1"
        >
          <Upload
            size={18}
            className="ms-2"
          />

          رفع ملف PDF أو صورة

        </Button>

        <Button
          className="flex-1"
        >
          <BrainCircuit
            size={18}
            className="ms-2"
          />

          بحث بالذكاء الاصطناعي

        </Button>

      </div>

      {/* Quick Search */}

      <div className="mt-10 grid gap-4 md:grid-cols-3">

        <button className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-right transition hover:border-amber-400 hover:bg-amber-50">

          <Users className="mb-3 text-amber-600" />

          <h4 className="font-semibold text-slate-900">
            الشخصيات التاريخية
          </h4>

          <p className="mt-2 text-sm text-slate-500">
            الخلفاء، العلماء، القادة، والرحالة.
          </p>

        </button>

        <button className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-right transition hover:border-amber-400 hover:bg-amber-50">

          <Landmark className="mb-3 text-amber-600" />

          <h4 className="font-semibold text-slate-900">
            الأماكن التاريخية
          </h4>

          <p className="mt-2 text-sm text-slate-500">
            المدن، المساجد، القلاع، والمواقع الأثرية.
          </p>

        </button>

        <button className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-right transition hover:border-amber-400 hover:bg-amber-50">

          <ScrollText className="mb-3 text-amber-600" />

          <h4 className="font-semibold text-slate-900">
            المخطوطات والوثائق
          </h4>

          <p className="mt-2 text-sm text-slate-500">
            استكشف المصادر الأصلية واربطها بالأحداث.
          </p>

        </button>

      </div>

    </motion.div>
  );
}
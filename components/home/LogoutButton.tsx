"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() =>
        signOut({
          callbackUrl: "/",
        })
      }
      className="inline-flex w-full shrink-0 cursor-pointer items-center justify-start gap-2 rounded-xl border border-red-400/35 bg-red-500/[0.06] px-3 py-2 text-sm font-black text-red-200 transition hover:bg-red-500/10 xl:w-auto"
    >
      <LogOut className="h-4 w-4" />
      تسجيل الخروج
    </button>
  );
}

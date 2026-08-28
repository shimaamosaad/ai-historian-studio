"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <header className="border-b border-slate-800 bg-slate-950 text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/projects" className="text-xl font-bold">
          أثر
        </Link>

        <div className="flex items-center gap-4">
          {session?.user?.name && (
            <span className="text-sm text-slate-300">
              {session.user.name}
            </span>
          )}

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="cursor-pointer rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    </header>
  );
}
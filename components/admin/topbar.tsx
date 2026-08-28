"use client";

import React from "react";
import { signOut, useSession } from "next-auth/react";
import { Search, Bell, LogOut, User as UserIcon } from "lucide-react";

export function AdminTopbar() {
  const { data: session } = useSession();
  const userName = session?.user?.name || "Administrator";
  const userEmail = session?.user?.email || "admin@uccenters.id";

  return (
    <header className="h-[64px] bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Global Search Bar */}
      <div className="relative w-72">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Cari data, center, lead..."
          className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b64b4]"
        />
      </div>

      {/* Right User Actions */}
      <div className="flex items-center gap-4">
        {/* Notification Indicator */}
        <button className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
        </button>

        {/* User Info & Logout */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-[#003366] text-white flex items-center justify-center font-bold text-xs">
            {userName.charAt(0)}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-[#111c2d] leading-none">{userName}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{userEmail}</div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors ml-2"
            title="Keluar / Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

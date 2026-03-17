"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HandCoins,
  PieChart,
  Receipt,
  BookOpen,
  BarChart3,
  LogOut
} from "lucide-react";

const tabs = [
  { name: "Collections Management", href: "/dashboard", icon: HandCoins },
  { name: "Budget and Cost Allocation", href: "/dashboard/module2", icon: PieChart },
  { name: "Expense Tracking & Tax", href: "/dashboard/module3", icon: Receipt },
  { name: "General Ledger", href: "/dashboard/module4", icon: BookOpen },
  { name: "Financial Reporting", href: "/dashboard/module5", icon: BarChart3 },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // 🔄 LOADING STATE (modernized)
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // 🔒 NO SESSION
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        <div className="relative max-w-md w-full">
          {/* Glow */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-20" />

          <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl p-8 text-center">
            <h1 className="text-xl font-semibold text-white mb-3">
              Access Denied
            </h1>
            <p className="text-sm text-slate-400 mb-6">
              Please sign in to access the dashboard.
            </p>

            <a
              href="/login"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 
              text-white text-sm font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 relative overflow-hidden">
      {/* Background FX */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10 blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-cyan-500/10 via-transparent to-blue-500/10 blur-3xl" />
      </div>

      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900/80 backdrop-blur-xl border-r border-slate-700/50 flex flex-col fixed h-full z-10">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-slate-700/50">
          <h1 className="text-lg font-semibold text-white tracking-tight">
            Crane & Trucking
          </h1>
          <p className="text-xs text-slate-400">
            Financial Management
          </p>
        </div>

        {/* NAV */}
        <nav className="flex-1 px-3 py-4">
          <ul className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = pathname === tab.href;

              return (
                <li key={tab.href}>
                  <Link
                    href={tab.href}
                    className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 transition-transform ${
                        isActive ? "" : "group-hover:scale-110"
                      }`}
                    />
                    {tab.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* USER */}
        <div className="px-4 py-4 border-t border-slate-700/50">
          <div className="mb-3 px-3">
            <p className="text-sm text-white font-medium truncate">
              {session.user?.name || "User"}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {session.user?.email || ""}
            </p>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all duration-300"
          >
            <LogOut className="w-5 h-5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 ml-64 p-6 relative z-10">
        {/* CONTENT CARD WRAPPER */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          {children}
        </div>
      </main>
    </div>
  );
}

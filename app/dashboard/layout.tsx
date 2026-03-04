"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  LayoutDashboard,
  Users,
  FolderKanban,
  FileText,
  LogOut,
} from "lucide-react";

const tabs = [
  { name: "Module 1", href: "/dashboard", icon: BarChart3 },
  { name: "Module 2", href: "/dashboard/module2", icon: LayoutDashboard },
  { name: "Module 3", href: "/dashboard/module3", icon: Users },
  { name: "Module 4", href: "/dashboard/module4", icon: FolderKanban },
  { name: "Module 5", href: "/dashboard/module5", icon: FileText },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f2f2f2]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#0067b8] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#5c5c5c]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f2f2f2]">
        <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200 text-center">
          <h1 className="text-xl text-[#1a1a1a] font-semibold mb-4">Access Denied</h1>
          <p className="text-[#5c5c5c] mb-4">Please sign in to access the dashboard.</p>
          <a
            href="/login"
            className="inline-block px-6 py-2 bg-[#0067b8] hover:bg-[#005a9e] text-white text-sm font-semibold rounded-sm transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f2f2] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full">
        {/* Logo/Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-xl text-[#1a1a1a] font-semibold">Dashboard</h1>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 px-4 py-4">
          <ul className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = pathname === tab.href;
              return (
                <li key={tab.href}>
                  <Link
                    href={tab.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-sm text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-[#0067b8] text-white"
                        : "text-[#5c5c5c] hover:bg-[#f2f2f2] hover:text-[#1a1a1a]"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Info & Sign Out */}
        <div className="px-4 py-4 border-t border-gray-200">
          <div className="mb-3 px-4">
            <p className="text-sm text-[#1a1a1a] font-medium truncate">
              {session.user?.name || "User"}
            </p>
            <p className="text-xs text-[#5c5c5c] truncate">
              {session.user?.email || ""}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#5c5c5c] hover:bg-[#f2f2f2] hover:text-[#1a1a1a] rounded-sm transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-6">
        {children}
      </main>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { AdminThemeProvider, useAdminTheme } from "@/lib/admin-theme";
import { I18nProvider, useI18n, LanguageToggle } from "@/lib/i18n";

const navItems = [
  { href: "/manage-jfc/dashboard", labelKey: "navDashboard" as const, icon: "🏠" },
  { href: "/manage-jfc/dashboard/settings", labelKey: "navSettings" as const, icon: "⚙️" },
  { href: "/manage-jfc/dashboard/highlights", labelKey: "navGallery" as const, icon: "📷" },
  { href: "/manage-jfc/dashboard/news", labelKey: "navNews" as const, icon: "📰" },
  { href: "/manage-jfc/dashboard/events", labelKey: "navEvents" as const, icon: "⚽" },
  { href: "/manage-jfc/dashboard/jerseys", labelKey: "navJersey" as const, icon: "👕" },
  { href: "/manage-jfc/dashboard/votes", labelKey: "navVotes" as const, icon: "🗳️" },
  { href: "/manage-jfc/dashboard/reports", labelKey: "navReports" as const, icon: "📊" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <AdminThemeProvider>
        <DashboardShell>{children}</DashboardShell>
      </AdminThemeProvider>
    </I18nProvider>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { primary } = useAdminTheme();
  const { t } = useI18n();

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/manage-jfc");
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-lg"
      >
        ☰
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-gray-800 transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">JOIN FC Admin</h2>
          <LanguageToggle />
        </div>
        <nav className="p-4 space-y-1 overflow-y-auto" style={{ maxHeight: "calc(100vh - 140px)" }}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                pathname === item.href
                  ? "text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
              style={pathname === item.href ? { backgroundColor: primary } : undefined}
            >
              <span>{item.icon}</span>
              <span>{t(item.labelKey)}</span>
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition"
          >
            {t("logout")}
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <main className="flex-1 p-4 pt-16 lg:pt-8 lg:p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}

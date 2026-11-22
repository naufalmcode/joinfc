"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

const LOGIN_PATH = "/manage-jfc";
const SESSION_CHECK_INTERVAL_MS = 60_000;

let redirecting = false;
function redirectToLogin() {
  if (redirecting) return;
  redirecting = true;
  // Full reload so all client state is dropped
  window.location.replace(LOGIN_PATH);
}

/**
 * Sends the admin back to the login page as soon as the session expires:
 * - any /api/* response with 401 (except the login call itself)
 * - periodic check, on route change, and when the tab regains focus
 */
function useSessionGuard(pathname: string) {
  // Intercept fetch for 401 responses
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const res = await originalFetch(...args);
      if (res.status === 401) {
        const input = args[0];
        const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
        const path = new URL(url, window.location.origin).pathname;
        const method = (args[1]?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
        const isLoginAttempt = path === "/api/auth" && method === "POST";
        if (path.startsWith("/api/") && !isLoginAttempt) redirectToLogin();
      }
      return res;
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Active session checks
  useEffect(() => {
    async function check() {
      try {
        const res = await fetch("/api/auth", { cache: "no-store" });
        if (res.status === 401) redirectToLogin();
      } catch {
        // network error — ignore, try again later
      }
    }
    check();
    const interval = setInterval(check, SESSION_CHECK_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", check);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", check);
    };
  }, [pathname]);
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { primary } = useAdminTheme();
  const { t } = useI18n();

  useSessionGuard(pathname);

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
        <div className="p-6 border-b border-gray-700">
          <div className="mb-2">
            <LanguageToggle />
          </div>
          <h2 className="text-xl font-bold text-white">{t("adminTitle")}</h2>
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
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            <span>🚪</span>
            <span>{t("logout")}</span>
          </button>
        </nav>
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

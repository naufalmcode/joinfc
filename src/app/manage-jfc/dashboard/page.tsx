"use client";

import { useEffect, useState } from "react";
import { useAdminTheme } from "@/lib/admin-theme";
import { useI18n } from "@/lib/i18n";

export default function DashboardPage() {
  const { primary, secondary, accent } = useAdminTheme();
  const { t } = useI18n();
  const [stats, setStats] = useState({ events: 0, jerseys: 0, highlights: 0 });

  useEffect(() => {
    async function load() {
      const [eventsRes, jerseysRes, highlightsRes] = await Promise.all([
        fetch("/api/events"),
        fetch("/api/jerseys"),
        fetch("/api/highlights"),
      ]);
      const [events, jerseys, highlights] = await Promise.all([
        eventsRes.json(),
        jerseysRes.json(),
        highlightsRes.json(),
      ]);
      setStats({
        events: events.data?.length || 0,
        jerseys: jerseys.data?.length || 0,
        highlights: highlights.data?.length || 0,
      });
    }
    load();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">{t("dashboard")}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title={t("openEvents")} value={stats.events} icon="⚽" color={primary} />
        <StatCard title={t("jerseyLaunch")} value={stats.jerseys} icon="👕" color={secondary} />
        <StatCard title={t("highlights")} value={stats.highlights} icon="📷" color={accent} />
      </div>

      <div className="mt-8 bg-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">{t("quickLinks")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QuickLink href="/manage-jfc/dashboard/events" label={t("createEvent")} desc={t("createEventDesc")} />
          <QuickLink href="/manage-jfc/dashboard/jerseys" label={t("launchNewJersey")} desc={t("launchJerseyDesc")} />
          <QuickLink href="/manage-jfc/dashboard/settings" label={t("websiteSettings")} desc={t("settingsDesc")} />
          <QuickLink href="/manage-jfc/dashboard/reports" label={t("downloadReports")} desc={t("downloadReportsDesc")} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: string; color: string }) {
  return (
    <div className="rounded-xl p-6 text-white" style={{ backgroundColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-80">{title}</p>
          <p className="text-4xl font-bold mt-2">{value}</p>
        </div>
        <span className="text-4xl">{icon}</span>
      </div>
    </div>
  );
}

function QuickLink({ href, label, desc }: { href: string; label: string; desc: string }) {
  return (
    <a
      href={href}
      className="block p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
    >
      <p className="text-white font-medium">{label}</p>
      <p className="text-gray-400 text-sm mt-1">{desc}</p>
    </a>
  );
}

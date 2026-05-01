"use client";

import { useEffect, useState } from "react";
import { useAdminTheme } from "@/lib/admin-theme";
import { useI18n } from "@/lib/i18n";

interface EventItem { id: string; title: string; }
interface JerseyItem { id: string; title: string; }

export default function ReportsPage() {
  const { primary } = useAdminTheme();
  const { t } = useI18n();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [jerseys, setJerseys] = useState<JerseyItem[]>([]);

  useEffect(() => {
    fetch("/api/events").then((r) => r.json()).then((d) => setEvents(d.data || []));
    fetch("/api/jerseys").then((r) => r.json()).then((d) => setJerseys(d.data || []));
  }, []);

  async function download(url: string) {
    try {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="?([^"]+)"?/);
      a.download = match ? match[1] : "report.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      alert("Download gagal. Pastikan sesi admin masih aktif.");
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">{t("downloadReports")}</h1>

      <div className="space-y-6 max-w-2xl">
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">{t("eventReports")}</h2>
          <button
            onClick={() => download("/api/reports?type=all-events")}
            className="w-full mb-4 px-4 py-3 admin-btn-primary rounded-lg transition font-medium"
          >
            📥 {t("downloadAllEvents")}
          </button>
          <div className="space-y-2">
            {events.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <span className="text-gray-300">{ev.title}</span>
                <button
                  onClick={() => download(`/api/reports?type=event&id=${ev.id}`)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition"
                >
                  {t("download")}
                </button>
              </div>
            ))}
            {events.length === 0 && <p className="text-gray-500 text-sm">{t("noEventsYet")}</p>}
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">{t("jerseyReports")}</h2>
          <div className="space-y-2">
            {jerseys.map((j) => (
              <div key={j.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <span className="text-gray-300">{j.title}</span>
                <button
                  onClick={() => download(`/api/reports?type=jersey&id=${j.id}`)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition"
                >
                  {t("download")}
                </button>
              </div>
            ))}
            {jerseys.length === 0 && <p className="text-gray-500 text-sm">{t("noJerseysYet")}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

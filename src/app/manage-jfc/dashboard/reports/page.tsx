"use client";

import { useEffect, useState } from "react";
import { useAdminTheme } from "@/lib/admin-theme";

interface EventItem { id: string; title: string; }
interface JerseyItem { id: string; title: string; }

export default function ReportsPage() {
  const { primary } = useAdminTheme();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [jerseys, setJerseys] = useState<JerseyItem[]>([]);

  useEffect(() => {
    fetch("/api/events").then((r) => r.json()).then((d) => setEvents(d.data || []));
    fetch("/api/jerseys").then((r) => r.json()).then((d) => setJerseys(d.data || []));
  }, []);

  function download(url: string) {
    window.open(url, "_blank");
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Download Reports</h1>

      <div className="space-y-6 max-w-2xl">
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Event Reports</h2>
          <button
            onClick={() => download("/api/reports?type=all-events")}
            className="w-full mb-4 px-4 py-3 admin-btn-primary rounded-lg transition font-medium"
          >
            📥 Download Semua Event
          </button>
          <div className="space-y-2">
            {events.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <span className="text-gray-300">{ev.title}</span>
                <button
                  onClick={() => download(`/api/reports?type=event&id=${ev.id}`)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition"
                >
                  Download
                </button>
              </div>
            ))}
            {events.length === 0 && <p className="text-gray-500 text-sm">Belum ada event.</p>}
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Jersey Reports</h2>
          <div className="space-y-2">
            {jerseys.map((j) => (
              <div key={j.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <span className="text-gray-300">{j.title}</span>
                <button
                  onClick={() => download(`/api/reports?type=jersey&id=${j.id}`)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition"
                >
                  Download
                </button>
              </div>
            ))}
            {jerseys.length === 0 && <p className="text-gray-500 text-sm">Belum ada jersey launch.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

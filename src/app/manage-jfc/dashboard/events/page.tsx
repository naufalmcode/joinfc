"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useAdminTheme } from "@/lib/admin-theme";
import ConfirmModal from "@/components/ConfirmModal";
import { useI18n } from "@/lib/i18n";

interface EventReg {
  id: string;
  name: string;
  phone: string;
  position: string;
  status: string;
  createdAt: string;
}

interface EventItem {
  id: string;
  title: string;
  description: string | null;
  location: string;
  locationUrl: string | null;
  eventDate: string;
  bankAccount: string;
  maxPlayers: number;
  maxGoalkeepers: number;
  status: string;
  registrations: EventReg[];
}

export default function EventsPage() {
  const { primary } = useAdminTheme();
  const { t } = useI18n();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [form, setForm] = useState({
    title: "", description: "", location: "", locationUrl: "", eventDate: "",
    bankAccount: "", maxPlayers: 22, maxGoalkeepers: 3,
  });
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewEvent, setViewEvent] = useState<EventItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteRegId, setDeleteRegId] = useState<string | null>(null);
  const [deleteRegEventId, setDeleteRegEventId] = useState<string | null>(null);

  async function loadData() {
    const res = await fetch("/api/events");
    const data = await res.json();
    if (data.data) setEvents(data.data);
  }

  useEffect(() => { loadData(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...form,
      maxPlayers: Number(form.maxPlayers),
      maxGoalkeepers: Number(form.maxGoalkeepers),
    };

    if (editing) {
      await fetch(`/api/events/${editing}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setForm({ title: "", description: "", location: "", locationUrl: "", eventDate: "", bankAccount: "", maxPlayers: 22, maxGoalkeepers: 3 });
    setEditing(null);
    setLoading(false);
    loadData();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/events/${id}`, { method: "DELETE" });
    setDeleteId(null);
    loadData();
  }

  async function toggleStatus(ev: EventItem) {
    const newStatus = ev.status === "open" ? "closed" : "open";
    await fetch(`/api/events/${ev.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    loadData();
  }

  async function updateRegStatus(regId: string, status: string) {
    await fetch(`/api/events/registrations/${regId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadData();
  }

  async function updateRegPosition(regId: string, position: string) {
    await fetch(`/api/events/registrations/${regId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ position }),
    });
    loadData();
  }

  async function deleteReg(regId: string) {
    await fetch(`/api/events/registrations/${regId}`, { method: "DELETE" });
    setDeleteRegId(null);
    setDeleteRegEventId(null);
    loadData();
  }

  function handleEdit(ev: EventItem) {
    setEditing(ev.id);
    setForm({
      title: ev.title,
      description: ev.description || "",
      location: ev.location,
      locationUrl: ev.locationUrl || "",
      eventDate: new Date(ev.eventDate).toISOString().slice(0, 16),
      bankAccount: ev.bankAccount,
      maxPlayers: ev.maxPlayers,
      maxGoalkeepers: ev.maxGoalkeepers,
    });
  }

  const ic = "w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 admin-input";

  function downloadReport(url: string) {
    window.open(url, "_blank");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-white">{t("events")}</h1>
        <button
          onClick={() => downloadReport("/api/reports?type=all-events")}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
        >
          📥 {t("downloadAllEvents")}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl p-6 mb-8 space-y-4 max-w-2xl">
        <h2 className="text-lg font-semibold text-white">{editing ? t("editEvent") : t("createEvent")}</h2>
        <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder={t("eventTitle")} className={ic} required />
        <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder={t("descOptional")} rows={2} className={ic} />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-300 text-sm mb-1">{t("location")}</label>
            <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="Lapangan ABC" className={ic} required />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-1">{t("dateTime")}</label>
            <input type="datetime-local" value={form.eventDate} onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))}
              className={ic} required />
          </div>
        </div>
        <div>
          <label className="block text-gray-300 text-sm mb-1">{t("locationLinkLabel")}</label>
          <input value={form.locationUrl} onChange={(e) => setForm((f) => ({ ...f, locationUrl: e.target.value }))}
            placeholder={t("locationLinkPlaceholder")} className={ic} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-300 text-sm mb-1">{t("bankAccount")}</label>
            <input value={form.bankAccount} onChange={(e) => setForm((f) => ({ ...f, bankAccount: e.target.value }))}
              placeholder="BCA 123456789 a/n John" className={ic} required />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-1">{t("maxPlayers")}</label>
            <input type="number" min={1} value={form.maxPlayers} onChange={(e) => setForm((f) => ({ ...f, maxPlayers: Number(e.target.value) }))}
              className={ic} required />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-1">{t("maxGoalkeepers")}</label>
            <input type="number" min={0} value={form.maxGoalkeepers} onChange={(e) => setForm((f) => ({ ...f, maxGoalkeepers: Number(e.target.value) }))}
              className={ic} required />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="px-6 py-2 admin-btn-primary rounded-lg transition disabled:opacity-50">
            {loading ? t("loading") : t("save")}
          </button>
          {editing && (
            <button type="button" onClick={() => { setEditing(null); setForm({ title: "", description: "", location: "", locationUrl: "", eventDate: "", bankAccount: "", maxPlayers: 22, maxGoalkeepers: 3 }); }}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition">{t("cancel")}</button>
          )}
        </div>
      </form>

      <div className="space-y-4">
        {events.map((ev) => {
          const confirmedPlayers = ev.registrations.filter((r) => (r.status === "confirmed" || r.status === "registered") && r.position === "player").length;
          const confirmedGK = ev.registrations.filter((r) => (r.status === "confirmed" || r.status === "registered") && r.position === "goalkeeper").length;
          const waiting = ev.registrations.filter((r) => r.status === "waiting").length;

          return (
            <div key={ev.id} className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-start flex-col sm:flex-row sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-white font-bold text-lg">{ev.title}</h3>
                    {ev.status === "open" ? (
                      <span className="px-2 py-0.5 rounded text-xs font-medium text-white" style={{ backgroundColor: primary }}>{t("statusOpen")}</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-600 text-white">{t("statusClosed")}</span>
                    )}
                  </div>
                  <p className="text-sm mt-1" style={{ color: primary }}>
                    {format(new Date(ev.eventDate), "EEEE, dd MMMM yyyy - HH:mm", { locale: idLocale })}
                  </p>
                  <p className="text-gray-400 text-sm">
                    📍 {ev.location}
                    {ev.locationUrl && (
                      <a href={ev.locationUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 ml-2 hover:underline">🔗 Maps</a>
                    )}
                  </p>
                  <p className="text-gray-400 text-sm">💳 {ev.bankAccount}</p>
                  <p className="text-gray-300 text-sm mt-2">
                    {t("players")}: <span className="font-semibold" style={{ color: primary }}>{confirmedPlayers}/{ev.maxPlayers}</span>
                    {" | "}{t("goalkeepers")}: <span className="text-blue-400 font-semibold">{confirmedGK}/{ev.maxGoalkeepers}</span>
                    {waiting > 0 && <span className="text-yellow-400 ml-2">+ {waiting} {t("waitingList")}</span>}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0 flex-wrap">
                  <button onClick={() => setViewEvent(viewEvent?.id === ev.id ? null : ev)}
                    className="px-3 py-1 bg-gray-600 text-white rounded text-sm">{viewEvent?.id === ev.id ? t("closeView") : t("viewDetail")}</button>
                  <button onClick={() => downloadReport(`/api/reports?type=event&id=${ev.id}`)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition">📥 Report</button>
                  <button onClick={() => toggleStatus(ev)}
                    className={`px-3 py-1 rounded text-sm text-white ${ev.status === "open" ? "bg-yellow-600" : ""}`}
                    style={ev.status !== "open" ? { backgroundColor: primary } : undefined}>
                    {ev.status === "open" ? t("closeStatus") : t("openStatus")}
                  </button>
                  <button onClick={() => handleEdit(ev)} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">{t("editEvent")}</button>
                  <button onClick={() => setDeleteId(ev.id)} className="px-3 py-1 bg-red-600 text-white rounded text-sm">{t("delete")}</button>
                </div>
              </div>

              {viewEvent?.id === ev.id && (
                <div className="mt-4 border-t border-gray-700 pt-4">
                  <h4 className="text-white font-semibold mb-2">{t("participants")}</h4>
                  {ev.registrations.length === 0 ? (
                    <p className="text-gray-500 text-sm">{t("noRegistrations")}</p>
                  ) : (
                    <div className="overflow-x-auto -mx-6 px-6">
                    <table className="w-full text-sm min-w-[600px]">
                      <thead>
                        <tr className="text-gray-400 text-left">
                          <th className="py-1">#</th>
                          <th className="py-1">{t("name")}</th>
                          <th className="py-1">{t("phoneCol")}</th>
                          <th className="py-1">{t("position")}</th>
                          <th className="py-1">{t("actions")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ev.registrations.map((r, i) => (
                          <tr key={r.id} className="text-gray-300 border-t border-gray-700">
                            <td className="py-1.5">{i + 1}</td>
                            <td className="py-1.5">{r.name}</td>
                            <td className="py-1.5">{r.phone || "-"}</td>
                            <td className="py-1.5">
                              <span className={`px-2 py-0.5 rounded text-xs ${r.position === "goalkeeper" ? "bg-blue-800 text-blue-300" : "bg-gray-600 text-gray-300"}`}>
                                {r.position === "goalkeeper" ? `🧤 ${t("goalkeeper")}` : `⚽ ${t("player")}`}
                              </span>
                            </td>
                            <td className="py-1.5">
                              <div className="flex gap-1 flex-wrap items-center">
                                <select value={r.status} onChange={(e) => updateRegStatus(r.id, e.target.value)}
                                  className={`px-2 py-0.5 rounded text-xs font-medium border-0 cursor-pointer ${
                                    r.status === "confirmed" ? "bg-green-700 text-white" :
                                    r.status === "registered" ? "bg-blue-700 text-white" :
                                    "bg-yellow-700 text-white"
                                  }`}>
                                  <option value="waiting">⏳ {t("waiting")}</option>
                                  <option value="registered">📋 {t("statusRegistered")}</option>
                                  <option value="confirmed">✓ {t("confirmed")}</option>
                                </select>
                                <button onClick={() => updateRegPosition(r.id, r.position === "player" ? "goalkeeper" : "player")}
                                  className="px-2 py-0.5 bg-purple-700 hover:bg-purple-600 text-white rounded text-xs transition">
                                  → {r.position === "player" ? t("goalkeeper") : t("player")}
                                </button>
                                <button onClick={() => { setDeleteRegId(r.id); setDeleteRegEventId(ev.id); }}
                                  className="px-2 py-0.5 bg-red-700 hover:bg-red-600 text-white rounded text-xs transition">{t("delete")}</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {events.length === 0 && <p className="text-gray-500">{t("noEventsYet")}</p>}
      </div>

      <ConfirmModal
        open={!!deleteId}
        title={t("deleteEventTitle")}
        message={t("deleteEventMessage")}
        confirmText={t("delete")}
        cancelText={t("cancel")}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
      />

      <ConfirmModal
        open={!!deleteRegId}
        title={t("deleteParticipantTitle")}
        message={t("deleteParticipantMessage")}
        confirmText={t("delete")}
        cancelText={t("cancel")}
        onConfirm={() => deleteRegId && deleteReg(deleteRegId)}
        onCancel={() => { setDeleteRegId(null); setDeleteRegEventId(null); }}
      />
    </div>
  );
}

"use client";

import { useEffect, useState, use } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { enUS } from "date-fns/locale";
import Link from "next/link";
import { useI18n, LanguageToggle } from "@/lib/i18n";

interface EventReg {
  id: string;
  name: string;
  phone: string;
  position: string;
  status: string;
}

interface EventDetail {
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

export default function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, locale } = useI18n();
  const dateLocale = locale === "id" ? idLocale : enUS;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [settings, setSettings] = useState<{ primaryColor: string; accentColor: string } | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", position: "player" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ status: string; message: string } | null>(null);
  const [error, setError] = useState("");

  async function loadEvent() {
    const res = await fetch(`/api/events/${id}`);
    const data = await res.json();
    if (data.data) setEvent(data.data);
  }

  useEffect(() => {
    loadEvent();
    fetch("/api/settings").then((r) => r.json()).then((d) => {
      if (d.data) setSettings({ primaryColor: d.data.primaryColor, accentColor: d.data.accentColor });
    });
  }, [id]);

  const primary = settings?.primaryColor || "#16a34a";
  const accent = settings?.accentColor || "#fbbf24";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    const res = await fetch(`/api/events/${id}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (data.success) {
      setResult({
        status: "registered",
        message: t("registeredSuccess"),
      });
      setForm({ name: "", phone: "", position: "player" });
      loadEvent();
    } else {
      setError(data.error || t("registrationFailed"));
    }
    setLoading(false);
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">{t("loading")}</div>
      </div>
    );
  }

  const confirmedPlayers = event.registrations.filter((r) => (r.status === "confirmed" || r.status === "registered") && r.position === "player");
  const confirmedGK = event.registrations.filter((r) => (r.status === "confirmed" || r.status === "registered") && r.position === "goalkeeper");
  const waitingPlayers = event.registrations.filter((r) => r.status === "waiting" && r.position === "player");
  const waitingGK = event.registrations.filter((r) => r.status === "waiting" && r.position === "goalkeeper");
  const playerSpotsLeft = event.maxPlayers - confirmedPlayers.length;
  const gkSpotsLeft = event.maxGoalkeepers - confirmedGK.length;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="fixed top-4 right-4 z-50">
        <LanguageToggle />
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-lg text-sm font-medium text-white transition hover:opacity-90" style={{ backgroundColor: primary }}>{t("backToHome")}</Link>

        <div className="bg-gray-800 rounded-xl p-6 md:p-8">
          <h1 className="text-3xl font-bold">{event.title}</h1>
          <div className="mt-4 space-y-2">
            <p style={{ color: accent }}>
              {format(new Date(event.eventDate), "EEEE, dd MMMM yyyy - HH:mm", { locale: dateLocale })}
            </p>
            <p className="text-gray-400">
              📍 {event.location}
              {event.locationUrl && (
                <a href={event.locationUrl} target="_blank" rel="noopener noreferrer"
                  className="text-blue-400 ml-2 hover:underline">
                  {t("locationLink")} →
                </a>
              )}
            </p>
            {event.description && <p className="text-gray-500">{event.description}</p>}
            <div className="p-3 bg-gray-700 rounded-lg mt-4">
              <p className="text-sm text-gray-400">{t("transferTo")}</p>
              <p className="text-white font-medium">{event.bankAccount}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gray-700 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-400">{confirmedPlayers.length}/{event.maxPlayers}</p>
              <p className="text-xs text-gray-400">{t("registeredPlayers")}</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-400">{confirmedGK.length}/{event.maxGoalkeepers}</p>
              <p className="text-xs text-gray-400">{t("registeredGoalkeepers")}</p>
            </div>
            {playerSpotsLeft > 0 ? (
              <div className="bg-green-900/30 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-400">{playerSpotsLeft}</p>
                <p className="text-xs text-gray-400">{t("slotsLeft")} ({t("player")})</p>
              </div>
            ) : (
              <div className="bg-yellow-900/30 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-yellow-400">{waitingPlayers.length}</p>
                <p className="text-xs text-gray-400">{t("waitingList")}</p>
              </div>
            )}
            {gkSpotsLeft > 0 ? (
              <div className="bg-blue-900/30 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-blue-400">{gkSpotsLeft}</p>
                <p className="text-xs text-gray-400">{t("slotsLeft")} ({t("goalkeeper")})</p>
              </div>
            ) : (
              <div className="bg-yellow-900/30 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-yellow-400">{waitingGK.length}</p>
                <p className="text-xs text-gray-400">{t("waitingList")} ({t("goalkeeper")})</p>
              </div>
            )}
          </div>
        </div>

        {/* Registration Form */}
        {event.status === "open" ? (
          <div className="bg-gray-800 rounded-xl p-6 md:p-8 mt-6">
            <h2 className="text-xl font-bold mb-4">{t("registerPlay")}</h2>
            {result && (
              <div className="p-4 rounded-lg mb-4 bg-green-900/50 text-green-300">
                {result.message}
              </div>
            )}
            {error && <div className="p-4 rounded-lg mb-4 bg-red-900/50 text-red-300">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm mb-1">{t("fullName")} <span className="text-red-400">*</span></label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder={t("enterName")}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-green-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-1">{t("phone")}</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="08xxxxxxxxxx"
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-green-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-1">{t("position")} <span className="text-red-400">*</span></label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg cursor-pointer border-2 transition select-none ${
                    form.position === "player" ? "border-green-500 bg-green-900/30" : "border-gray-600 bg-gray-700"
                  }`}>
                    <input type="radio" name="position" value="player" checked={form.position === "player"}
                      onChange={() => setForm((f) => ({ ...f, position: "player" }))} className="hidden" />
                    <span className="text-lg">⚽</span>
                    <span className="text-white font-medium">{t("player")}</span>
                    <span className="text-xs text-gray-400">({confirmedPlayers.length}/{event.maxPlayers})</span>
                  </label>
                  <label className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg cursor-pointer border-2 transition select-none ${
                    form.position === "goalkeeper" ? "border-blue-500 bg-blue-900/30" : "border-gray-600 bg-gray-700"
                  }`}>
                    <input type="radio" name="position" value="goalkeeper" checked={form.position === "goalkeeper"}
                      onChange={() => setForm((f) => ({ ...f, position: "goalkeeper" }))} className="hidden" />
                    <span className="text-lg">🧤</span>
                    <span className="text-white font-medium">{t("goalkeeper")}</span>
                    <span className="text-xs text-gray-400">({confirmedGK.length}/{event.maxGoalkeepers})</span>
                  </label>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
              >
                {loading ? t("registering") : t("registerNow")}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl p-6 mt-6 text-center">
            <p className="text-red-400 font-semibold">{t("registrationClosed")}</p>
          </div>
        )}

        {/* Player List */}
        {/* Goalkeeper List */}
        <div className="bg-gray-800 rounded-xl p-6 md:p-8 mt-6">
          <h2 className="text-xl font-bold mb-4">{t("goalkeeperList")} ({confirmedGK.length})</h2>
          {confirmedGK.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {confirmedGK.map((r, i) => (
                <div key={r.id} className="flex items-center gap-2 p-2 bg-gray-700 rounded">
                  <span className="w-6 h-6 flex items-center justify-center bg-blue-600 text-white rounded-full text-xs">{i + 1}</span>
                  <span className="text-sm text-gray-300 truncate">🧤 {r.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">{t("noRegistrations")}</p>
          )}

          {waitingGK.length > 0 && (
            <>
              <h3 className="text-lg font-semibold mt-6 mb-3 text-yellow-400">🧤 {t("waitingList")} {t("goalkeeper")} ({waitingGK.length})</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {waitingGK.map((r, i) => (
                  <div key={r.id} className="flex items-center gap-2 p-2 bg-gray-700 rounded">
                    <span className="w-6 h-6 flex items-center justify-center bg-yellow-600 text-white rounded-full text-xs">{i + 1}</span>
                    <span className="text-sm text-gray-300 truncate">🧤 {r.name}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Player List */}
        <div className="bg-gray-800 rounded-xl p-6 md:p-8 mt-6">
          <h2 className="text-xl font-bold mb-4">{t("playerList")} ({confirmedPlayers.length})</h2>
          {confirmedPlayers.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {confirmedPlayers.map((r, i) => (
                <div key={r.id} className="flex items-center gap-2 p-2 bg-gray-700 rounded">
                  <span className="w-6 h-6 flex items-center justify-center bg-green-600 text-white rounded-full text-xs">{i + 1}</span>
                  <span className="text-sm text-gray-300 truncate">{r.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">{t("noRegistrations")}</p>
          )}

          {waitingPlayers.length > 0 && (
            <>
              <h3 className="text-lg font-semibold mt-6 mb-3 text-yellow-400">⚽ {t("waitingList")} {t("player")} ({waitingPlayers.length})</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {waitingPlayers.map((r, i) => (
                  <div key={r.id} className="flex items-center gap-2 p-2 bg-gray-700 rounded">
                    <span className="w-6 h-6 flex items-center justify-center bg-yellow-600 text-white rounded-full text-xs">{i + 1}</span>
                    <span className="text-sm text-gray-300 truncate">{r.name}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

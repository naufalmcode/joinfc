"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useI18n, LanguageToggle } from "@/lib/i18n";

interface JerseyReg {
  id: string;
  name: string;
  number: number;
  size: string;
  jerseyType: string;
}

interface JerseyDetail {
  id: string;
  title: string;
  designUrls: string[];
  slug: string;
  status: string;
  registrations: JerseyReg[];
}

const SIZES = ["S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL", "6XL"];

export default function JerseyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { t } = useI18n();
  const [jersey, setJersey] = useState<JerseyDetail | null>(null);
  const [form, setForm] = useState({ registrantName: "", name: "", phone: "", number: 0, size: "L", jerseyType: "player" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [takenMap, setTakenMap] = useState<Record<number, string>>({});
  const [notFound, setNotFound] = useState(false);
  const [tappedNum, setTappedNum] = useState<number | null>(null);
  const [settings, setSettings] = useState<{ primaryColor: string } | null>(null);

  async function loadJersey() {
    const res = await fetch(`/api/jerseys/slug/${slug}`);
    const data = await res.json();
    if (data.data) {
      setJersey(data.data);
      const map: Record<number, string> = {};
      data.data.registrations.forEach((r: JerseyReg) => { map[r.number] = r.name; });
      setTakenMap(map);
    } else {
      setNotFound(true);
    }
  }

  useEffect(() => {
    loadJersey();
    fetch("/api/settings").then((r) => r.json()).then((d) => {
      if (d.data) setSettings({ primaryColor: d.data.primaryColor });
    });
  }, [slug]);

  const primary = settings?.primaryColor || "#16a34a";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.number) {
      setError(t("pickAbove"));
      return;
    }
    setLoading(true);
    setError("");
    setResult("");

    const res = await fetch(`/api/jerseys/${jersey!.id}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (data.success) {
      setResult(`Jersey #${form.number} (${form.size}) — ${form.name} ✓`);
      setForm({ registrantName: "", name: "", phone: "", number: 0, size: "L", jerseyType: "player" });
      loadJersey();
    } else {
      setError(data.error || "Failed");
    }
    setLoading(false);
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">{t("jerseyNotFound")}</p>
          <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition hover:opacity-90" style={{ backgroundColor: primary }}>{t("backToHome")}</Link>
        </div>
      </div>
    );
  }

  if (!jersey) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">{t("loading")}</div>
      </div>
    );
  }

  const takenNumbers = Object.keys(takenMap).map(Number);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="fixed top-4 right-4 z-50">
        <LanguageToggle />
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-lg text-sm font-medium text-white transition hover:opacity-90" style={{ backgroundColor: primary }}>{t("backToHome")}</Link>

        <div className="bg-gray-800 rounded-xl overflow-hidden">
          {(jersey.designUrls || []).length > 0 && (
            <div className={`grid ${jersey.designUrls.length === 1 ? "grid-cols-1" : "grid-cols-2"} gap-1`}>
              {jersey.designUrls.map((url, idx) => (
                <img key={idx} src={url} alt={`${jersey.title} ${idx + 1}`} className={`w-full ${jersey.designUrls.length === 1 ? "h-72 md:h-96" : "h-48 md:h-64"} object-cover`} />
              ))}
            </div>
          )}
          <div className="p-6 md:p-8">
            <h1 className="text-3xl font-bold">{jersey.title}</h1>
            <p className="text-gray-400 mt-2">{jersey.registrations.length} {t("peopleRegistered")}</p>
          </div>
        </div>

        {/* Number Grid */}
        <div className="bg-gray-800 rounded-xl p-6 md:p-8 mt-6">
          <h2 className="text-xl font-bold mb-4">{t("chooseNumber")}</h2>
          <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 gap-1.5 md:gap-2">
            {Array.from({ length: 99 }, (_, i) => i + 1).map((num) => {
              const taken = takenNumbers.includes(num);
              const selected = form.number === num;
              const owner = takenMap[num];
              return (
                <div key={num} className="relative group">
                  <button
                    type="button"
                    disabled={taken || jersey.status !== "open"}
                    onClick={() => {
                      if (taken) { setTappedNum(tappedNum === num ? null : num); return; }
                      setForm((f) => ({ ...f, number: num }));
                    }}
                    className={`w-full aspect-square rounded text-xs sm:text-sm font-mono font-bold transition
                      ${taken ? "bg-red-900/50 text-red-500 cursor-pointer" : ""}
                      ${selected ? "bg-green-600 text-white ring-2 ring-green-400" : ""}
                      ${!taken && !selected ? "bg-gray-700 text-gray-300 hover:bg-green-700 hover:text-white" : ""}
                    `}
                  >
                    {num}
                  </button>
                  {owner && (
                    <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-[10px] rounded whitespace-nowrap pointer-events-none z-10 transition ${tappedNum === num ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                      {owner}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-3 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-700 rounded inline-block" /> {t("available")}</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-600 rounded inline-block" /> {t("selected")}</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-900/50 rounded inline-block" /> {t("taken")}</span>
          </div>
        </div>

        {/* Registration Form */}
        {jersey.status === "open" ? (
          <div className="bg-gray-800 rounded-xl p-6 md:p-8 mt-6">
            <h2 className="text-xl font-bold mb-4">{t("registrationForm")}</h2>
            {result && <div className="p-4 rounded-lg mb-4 bg-green-900/50 text-green-300">{result}</div>}
            {error && <div className="p-4 rounded-lg mb-4 bg-red-900/50 text-red-300">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm mb-1">{t("registrantName")}</label>
                <input
                  value={form.registrantName}
                  onChange={(e) => setForm((f) => ({ ...f, registrantName: e.target.value }))}
                  placeholder={t("registrantNamePlaceholder")}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-green-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-1">{t("nameForJersey")}</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder={t("namePrintPlaceholder")}
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
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-2">{t("jerseyTypeLabel")}</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, jerseyType: "player" }))}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 font-semibold transition ${
                      form.jerseyType === "player"
                        ? "bg-green-600/20 border-green-500 text-green-400"
                        : "bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500"
                    }`}
                  >
                    ⚽ {t("jerseyPlayer")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, jerseyType: "goalkeeper" }))}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 font-semibold transition ${
                      form.jerseyType === "goalkeeper"
                        ? "bg-blue-600/20 border-blue-500 text-blue-400"
                        : "bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500"
                    }`}
                  >
                    🧤 {t("jerseyGoalkeeper")}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-1">{t("jerseyNumber")}</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={form.number || ""}
                    onChange={(e) => setForm((f) => ({ ...f, number: Number(e.target.value) }))}
                    placeholder={t("pickAbove")}
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-green-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">{t("size")}</label>
                  <select
                    value={form.size}
                    onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-green-500 focus:outline-none"
                  >
                    {SIZES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || !form.number}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
              >
                {loading ? t("registering") : `${t("orderJerseyNum")}${form.number || "?"}`}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl p-6 mt-6 text-center">
            <p className="text-red-400 font-semibold">{t("jerseyClosedMsg")}</p>
          </div>
        )}

        {/* Registered List */}
        {jersey.registrations.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6 md:p-8 mt-6">
            <h2 className="text-xl font-bold mb-4">{t("registered")} ({jersey.registrations.length})</h2>
            <div className="space-y-2">
              {jersey.registrations.map((r) => (
                <div key={r.id} className="flex items-center gap-3 p-2 bg-gray-700 rounded">
                  <span className="w-10 h-10 flex items-center justify-center bg-green-600 text-white rounded font-mono font-bold">{r.number}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{r.name}</p>
                    <p className="text-gray-500 text-xs">{t("size")}: {r.size}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    r.jerseyType === "goalkeeper" ? "bg-blue-800 text-blue-300" : "bg-gray-600 text-gray-300"
                  }`}>
                    {r.jerseyType === "goalkeeper" ? "🧤 " + t("jerseyGoalkeeper") : "⚽ " + t("jerseyPlayer")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

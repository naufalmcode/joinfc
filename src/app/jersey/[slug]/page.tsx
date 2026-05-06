"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import { useI18n, LanguageToggle } from "@/lib/i18n";

interface JerseyReg {
  id: string;
  name: string;
  number: number;
  size: string;
  shirtSize: string;
  jerseyType: string;
  itemType: string;
  totalPrice: number;
  paymentStatus: string;
  createdAt: string;
}

interface JerseyDetail {
  id: string;
  title: string;
  designUrls: string[];
  slug: string;
  status: string;
  basePrice: number;
  shirtOnlyPrice: number | null;
  shortsOnlyPrice: number | null;
  sizeSurcharges: string;
  registrations: JerseyReg[];
}

const SIZES = ["S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL", "6XL"];

type SurchargeEntry = {
  target?: "base" | "shirt";
  size?: string;
  itemType?: string;
  shirtSize?: string;
  surcharge?: number;
  price?: number;
};

function formatRupiah(amount: number): string {
  return "Rp " + amount.toLocaleString("id-ID");
}

function formatDateWIB(dateStr: string): string {
  return new Date(dateStr).toLocaleString("sv-SE", { timeZone: "UTC" });
}

function getPublicStatusColor(status: string): string {
  switch (status) {
    case "dp": return "bg-yellow-800 text-yellow-300";
    case "paid": return "bg-green-800 text-green-300";
    case "production": return "bg-blue-800 text-blue-300";
    case "done": return "bg-emerald-800 text-emerald-300";
    default: return "bg-gray-600 text-gray-300";
  }
}

function parseSurchargeList(raw: string): SurchargeEntry[] {
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function JerseyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { t } = useI18n();
  const [jersey, setJersey] = useState<JerseyDetail | null>(null);
  const [form, setForm] = useState({ registrantName: "", name: "", phone: "", number: 0, size: "L", shirtSize: "", jerseyType: "player", itemType: "set" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [takenMap, setTakenMap] = useState<Record<number, string>>({});
  const [notFound, setNotFound] = useState(false);
  const [tappedNum, setTappedNum] = useState<number | null>(null);
  const [settings, setSettings] = useState<{ primaryColor: string } | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  async function loadJersey() {
    const res = await fetch(`/api/jerseys/slug/${slug}`);
    const data = await res.json();
    if (data.data) {
      setJersey(data.data);
      const map: Record<number, string> = {};
      data.data.registrations
        .filter((r: JerseyReg) => r.paymentStatus !== "cancel" && r.paymentStatus !== "dropped")
        .forEach((r: JerseyReg) => { map[r.number] = r.name; });
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

  const images = jersey?.designUrls || [];
  const prevSlide = useCallback(() => setCurrentSlide((s) => (s - 1 + images.length) % images.length), [images.length]);
  const nextSlide = useCallback(() => setCurrentSlide((s) => (s + 1) % images.length), [images.length]);

  // Auto-slide every 3 seconds (pause when lightbox open)
  useEffect(() => {
    if (images.length <= 1 || lightboxOpen) return;
    const timer = setInterval(() => {
      setCurrentSlide((s) => (s + 1) % images.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [images.length, lightboxOpen]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft") prevSlide();
      if (e.key === "ArrowRight") nextSlide();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxOpen, prevSlide, nextSlide]);

  // Calculate price for display
  function getCalculatedPrice(): number {
    if (!jersey) return 0;
    const itemType = form.itemType || "set";
    let price = jersey.basePrice || 0;
    const surchargeList = parseSurchargeList(jersey.sizeSurcharges || "[]");
    const baseRules = surchargeList.filter((entry) => entry.target !== "shirt");
    const exact = baseRules.find((entry) => entry.size === form.size && (entry.itemType || "set") === itemType);
    if (exact) {
      price += (exact.surcharge ?? exact.price ?? 0);
    } else {
      const bySize = baseRules.find((entry) => entry.size === form.size);
      if (bySize) price += (bySize.surcharge ?? bySize.price ?? 0);
    }

    if (itemType === "set" && form.shirtSize && form.shirtSize !== form.size) {
      const shirtRule = surchargeList.find((entry) => entry.target === "shirt" && (entry.shirtSize || entry.size) === form.shirtSize);
      if (shirtRule) {
        price += (shirtRule.surcharge ?? shirtRule.price ?? 0);
      } else {
        const shirtBase = baseRules.find((entry) => entry.size === form.shirtSize);
        const mainBase = exact || baseRules.find((entry) => entry.size === form.size);
        const shirtSurcharge = shirtBase ? (shirtBase.surcharge ?? shirtBase.price ?? 0) : 0;
        const mainSurcharge = mainBase ? (mainBase.surcharge ?? mainBase.price ?? 0) : 0;
        if (shirtSurcharge > mainSurcharge) price += (shirtSurcharge - mainSurcharge);
      }
    }
    return price;
  }

  // Get available item types from surcharge list
  function getAvailableItemTypes(): string[] {
    if (!jersey) return ["set"];
    const types = new Set<string>(["set"]);
    parseSurchargeList(jersey.sizeSurcharges || "[]")
      .filter((entry) => entry.target !== "shirt")
      .forEach((entry) => {
        if (entry.itemType) types.add(entry.itemType);
      });
    return Array.from(types);
  }

  function getAvailableCustomShirtSizes(): string[] {
    if (!jersey) return [];
    const sizes = new Set<string>();
    parseSurchargeList(jersey.sizeSurcharges || "[]")
      .filter((entry) => entry.target === "shirt")
      .forEach((entry) => {
        const value = entry.shirtSize || entry.size;
        if (value) sizes.add(value);
      });
    return SIZES.filter((size) => sizes.has(size));
  }

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
      body: JSON.stringify({
        ...form,
        shirtSize: form.itemType === "set" ? form.shirtSize : "",
      }),
    });
    const data = await res.json();

    if (data.success) {
      setResult(`Jersey #${form.number} (${form.size}) — ${form.name} ✓`);
      setForm({ registrantName: "", name: "", phone: "", number: 0, size: "L", shirtSize: "", jerseyType: "player", itemType: "set" });
      loadJersey();
    } else {
      setError(data.error || t("registrationFailed"));
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
  const hasPrice = jersey.basePrice > 0;
  const availableItemTypes = getAvailableItemTypes();
  const availableCustomShirtSizes = getAvailableCustomShirtSizes();
  const activeRegistrations = jersey.registrations.filter(
    (r) => r.paymentStatus !== "cancel" && r.paymentStatus !== "dropped"
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="fixed top-4 right-4 z-50">
        <LanguageToggle />
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && images.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
          <button onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }} className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white text-2xl transition z-10">&times;</button>
          {images.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); prevSlide(); }} className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white text-2xl transition z-10">&#8249;</button>
              <button onClick={(e) => { e.stopPropagation(); nextSlide(); }} className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white text-2xl transition z-10">&#8250;</button>
            </>
          )}
          <img src={images[currentSlide]} alt={`${jersey.title} ${currentSlide + 1}`} className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, idx) => (
                <button key={idx} onClick={(e) => { e.stopPropagation(); setCurrentSlide(idx); }} className={`w-2.5 h-2.5 rounded-full transition ${idx === currentSlide ? "bg-white" : "bg-white/40"}`} />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-lg text-sm font-medium text-white transition hover:opacity-90" style={{ backgroundColor: primary }}>{t("backToHome")}</Link>

        <div className="bg-gray-800 rounded-xl overflow-hidden">
          {/* Image Carousel */}
          {images.length > 0 && (
            <div className="relative group">
              <img
                src={images[currentSlide]}
                alt={`${jersey.title} ${currentSlide + 1}`}
                className="w-full h-72 md:h-96 object-cover cursor-pointer"
                onClick={() => setLightboxOpen(true)}
              />
              {images.length > 1 && (
                <>
                  <button onClick={prevSlide} className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/50 hover:bg-black/70 rounded-full text-white text-xl transition opacity-0 group-hover:opacity-100">&#8249;</button>
                  <button onClick={nextSlide} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/50 hover:bg-black/70 rounded-full text-white text-xl transition opacity-0 group-hover:opacity-100">&#8250;</button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, idx) => (
                      <button key={idx} onClick={() => setCurrentSlide(idx)} className={`w-2 h-2 rounded-full transition ${idx === currentSlide ? "bg-white" : "bg-white/40"}`} />
                    ))}
                  </div>
                </>
              )}
              <div className="absolute top-3 right-3 flex items-center gap-2">
                {images.length > 1 && (
                  <span className="bg-black/50 text-white text-xs px-2 py-1 rounded">
                    {currentSlide + 1} / {images.length}
                  </span>
                )}
              </div>
              <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer" onClick={() => setLightboxOpen(true)}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                {t("clickToView")}
              </div>
            </div>
          )}
          <div className="p-6 md:p-8">
            <h1 className="text-3xl font-bold">{jersey.title}</h1>
            <p className="text-gray-400 mt-2">{activeRegistrations.length} {t("peopleRegistered")}</p>
            {hasPrice && (
              <p className="text-green-400 font-semibold text-lg mt-1">{formatRupiah(jersey.basePrice)}</p>
            )}
          </div>
        </div>

        {/* Number Grid */}
        <div className="bg-gray-800 rounded-xl p-6 md:p-8 mt-6">
          <h2 className="text-xl font-bold mb-4">{t("chooseNumber")}</h2>
          <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 gap-1.5 md:gap-2">
            {Array.from({ length: 100 }, (_, i) => i).map((num) => {
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
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value.toUpperCase() }))}
                  placeholder={t("namePrintPlaceholder")}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-green-500 focus:outline-none uppercase"
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
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 font-semibold transition ${form.jerseyType === "player"
                      ? "bg-green-600/20 border-green-500 text-green-400"
                      : "bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500"
                      }`}
                  >
                    ⚽ {t("jerseyPlayer")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, jerseyType: "goalkeeper" }))}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 font-semibold transition ${form.jerseyType === "goalkeeper"
                      ? "bg-blue-600/20 border-blue-500 text-blue-400"
                      : "bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500"
                      }`}
                  >
                    🧤 {t("jerseyGoalkeeper")}
                  </button>
                </div>
              </div>
              {/* Item Type Selector */}
              {hasPrice && availableItemTypes.length > 1 && (
                <div>
                  <label className="block text-gray-300 text-sm mb-2">{t("itemTypeLabel")}</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {availableItemTypes.includes("set") && (
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, itemType: "set" }))}
                        className={`px-4 py-3 rounded-lg border-2 font-semibold transition text-sm ${form.itemType === "set"
                          ? "bg-green-600/20 border-green-500 text-green-400"
                          : "bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500"
                          }`}
                      >
                        👕👟 {t("itemTypeSet")}
                      </button>
                    )}
                    {availableItemTypes.includes("shirt") && (
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, itemType: "shirt", shirtSize: "" }))}
                        className={`px-4 py-3 rounded-lg border-2 font-semibold transition text-sm ${form.itemType === "shirt"
                          ? "bg-green-600/20 border-green-500 text-green-400"
                          : "bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500"
                          }`}
                      >
                        👕 {t("itemTypeShirt")}
                      </button>
                    )}
                    {availableItemTypes.includes("shorts") && (
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, itemType: "shorts", shirtSize: "" }))}
                        className={`px-4 py-3 rounded-lg border-2 font-semibold transition text-sm ${form.itemType === "shorts"
                          ? "bg-green-600/20 border-green-500 text-green-400"
                          : "bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500"
                          }`}
                      >
                        👟 {t("itemTypeShorts")}
                      </button>
                    )}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-1">{t("jerseyNumber")}</label>
                  <input
                    type="number"
                    min={0}
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
                    onChange={(e) => {
                      const newSize = e.target.value;
                      const newSizeIdx = SIZES.indexOf(newSize);
                      setForm((f) => {
                        const shirtIdx = SIZES.indexOf(f.shirtSize);
                        const shirtStillValid = f.shirtSize && shirtIdx > newSizeIdx;
                        return { ...f, size: newSize, shirtSize: shirtStillValid ? f.shirtSize : "" };
                      });
                    }}
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-green-500 focus:outline-none"
                  >
                    {SIZES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              {hasPrice && form.itemType === "set" && availableCustomShirtSizes.filter((s) => SIZES.indexOf(s) > SIZES.indexOf(form.size)).length > 0 && (
                <div>
                  <label className="block text-gray-300 text-sm mb-1">{t("customShirtSizeLabel")}</label>
                  <select
                    value={form.shirtSize}
                    onChange={(e) => setForm((f) => ({ ...f, shirtSize: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-green-500 focus:outline-none"
                  >
                    <option value="">{`${t("sameAsMainSize")} (${form.size})`}</option>
                    {availableCustomShirtSizes
                      .filter((size) => SIZES.indexOf(size) > SIZES.indexOf(form.size))
                      .map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                  </select>
                  <p className="text-gray-500 text-xs mt-1">{t("customShirtSizeHint")}</p>
                </div>
              )}
              {/* Price Summary */}
              {hasPrice && (
                <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                  {form.itemType === "set" && form.shirtSize && form.shirtSize !== form.size && (
                    <div className="flex justify-between text-sm text-gray-300 mb-2">
                      <span>{t("customShirtSizeLabel")}</span>
                      <span>{form.shirtSize}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-green-400">
                    <span>{t("totalPriceLabel")}</span>
                    <span>{formatRupiah(getCalculatedPrice())}</span>
                  </div>
                </div>
              )}
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
        {activeRegistrations.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6 md:p-8 mt-6">
            <h2 className="text-xl font-bold mb-4">{t("registered")} ({activeRegistrations.length})</h2>
            <div className="space-y-2">
              {activeRegistrations.map((r) => (
                <div key={r.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 bg-gray-700 rounded">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="w-10 h-10 flex items-center justify-center bg-green-600 text-white rounded font-mono font-bold flex-shrink-0">{r.number}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">{r.name}</p>
                      <p className="text-gray-300 text-xs">
                        {t("size")}: {r.size}
                        {r.shirtSize ? ` · ${t("customShirtSizeLabel")}: ${r.shirtSize}` : ""}
                        {r.itemType && r.itemType !== "set" ? ` · ${r.itemType === "shirt" ? t("itemTypeShirt") : t("itemTypeShorts")}` : ""}
                      </p>
                      <p className="text-gray-300 text-[10px] mt-0.5">{formatDateWIB(r.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-13 sm:ml-0">
                    {hasPrice && r.totalPrice > 0 && (
                      <span className="text-green-400 text-sm font-semibold whitespace-nowrap">{formatRupiah(r.totalPrice)}</span>
                    )}
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPublicStatusColor(r.paymentStatus)}`}>
                      {r.paymentStatus === "paid" ? "Lunas" : r.paymentStatus === "dp" ? "DP" : r.paymentStatus === "production" ? "Produksi" : r.paymentStatus === "done" ? "Selesai" : "Terdaftar"}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${r.jerseyType === "goalkeeper" ? "bg-blue-800 text-blue-300" : "bg-gray-600 text-gray-300"
                      }`}>
                      {r.jerseyType === "goalkeeper" ? "🧤 " + t("jerseyGoalkeeper") : "⚽ " + t("jerseyPlayer")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

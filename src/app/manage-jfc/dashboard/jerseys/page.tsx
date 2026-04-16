"use client";

import { useEffect, useRef, useState } from "react";
import { useAdminTheme } from "@/lib/admin-theme";
import { useI18n } from "@/lib/i18n";
import ConfirmModal from "@/components/ConfirmModal";
import UploadProgressBar from "@/components/UploadProgressBar";
import { uploadFiles, type UploadProgress } from "@/lib/upload";

interface JerseyReg {
  id: string;
  registrantName: string;
  name: string;
  phone: string;
  number: number;
  size: string;
  shirtSize: string;
  jerseyType: string;
  itemType: string;
  totalPrice: number;
  paymentStatus: string;
  createdAt: string;
}

interface JerseyItem {
  id: string;
  title: string;
  designUrls: string[];
  slug: string;
  status: string;
  isVisible: boolean;
  basePrice: number;
  shirtOnlyPrice: number | null;
  shortsOnlyPrice: number | null;
  sizeSurcharges: string;
  _count?: { registrations: number };
  registrations?: JerseyReg[];
}

const SIZES = ["S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL", "6XL"];

const PAYMENT_STATUSES = ["registered", "dp", "paid", "cancel", "dropped", "production", "done"] as const;

const REPORT_COLUMNS = [
  { key: "no", label: "No" },
  { key: "registrantName", label: "registrantCol" },
  { key: "name", label: "jerseyName2" },
  { key: "phone", label: "phoneCol" },
  { key: "number", label: "numberCol" },
  { key: "size", label: "sizeCol" },
  { key: "shirtSize", label: "shirtSizeCol" },
  { key: "jerseyType", label: "typeCol" },
  { key: "itemType", label: "itemCol" },
  { key: "totalPrice", label: "priceCol" },
  { key: "paymentStatus", label: "statusCol" },
  { key: "createdAt", label: "dateCol" },
] as const;

type BaseSurchargeRule = { size: string; itemType: string; surcharge: number };
type ShirtSizeSurchargeRule = { shirtSize: string; surcharge: number };

function formatRupiah(amount: number): string {
  return "Rp " + amount.toLocaleString("id-ID");
}

function formatNumber(value: number): string {
  if (!value) return "";
  return value.toLocaleString("id-ID");
}

function parseNumber(formatted: string): number {
  return Number(formatted.replace(/\./g, "").replace(/,/g, "")) || 0;
}

export default function JerseysPage() {
  const { primary } = useAdminTheme();
  const { t } = useI18n();
  const [jerseys, setJerseys] = useState<JerseyItem[]>([]);
  const [form, setForm] = useState({ title: "", designUrls: [] as string[], basePrice: 0, surchargeList: [] as BaseSurchargeRule[], shirtSizeSurchargeList: [] as ShirtSizeSurchargeRule[] });
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewJersey, setViewJersey] = useState<string | null>(null);
  const [viewRegistrations, setViewRegistrations] = useState<Record<string, JerseyReg[]>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [pendingImages, setPendingImages] = useState<{ file: File; previewUrl: string }[]>([]);
  const pendingImagesRef = useRef<{ file: File; previewUrl: string }[]>([]);
  const [editingReg, setEditingReg] = useState<string | null>(null);
  const [editRegForm, setEditRegForm] = useState<Partial<JerseyReg>>({});
  const [reportColumns, setReportColumns] = useState<Record<string, string[]>>({});
  const [showReportConfig, setShowReportConfig] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<(UploadProgress & { current?: number; totalFiles?: number }) | null>(null);

  useEffect(() => {
    pendingImagesRef.current = pendingImages;
  }, [pendingImages]);

  useEffect(() => {
    return () => {
      pendingImagesRef.current.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
  }, []);

  async function loadData() {
    const res = await fetch("/api/jerseys?summary=1");
    const data = await res.json();
    if (data.data) setJerseys(data.data);
  }

  async function loadRegistrations(jerseyId: string) {
    if (viewRegistrations[jerseyId]) return; // already cached
    const res = await fetch(`/api/jerseys/${jerseyId}`);
    const data = await res.json();
    if (data.data?.registrations) {
      setViewRegistrations((prev) => ({ ...prev, [jerseyId]: data.data.registrations }));
    }
  }

  async function toggleView(jerseyId: string) {
    if (viewJersey === jerseyId) {
      setViewJersey(null);
    } else {
      setViewJersey(jerseyId);
      loadRegistrations(jerseyId);
    }
  }

  useEffect(() => { loadData(); }, []);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newItems = Array.from(files).map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    setPendingImages((prev) => [...prev, ...newItems]);
    e.target.value = "";
  }

  function removePendingFile(index: number) {
    setPendingImages((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  function removeDesignUrl(index: number) {
    setForm((f) => ({ ...f, designUrls: f.designUrls.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // Upload pending files first
    let uploadedUrls: string[] = [];
    if (pendingImages.length > 0) {
      try {
        uploadedUrls = await uploadFiles(pendingImages.map((img) => img.file), (p) => setUploadProgress(p));
      } catch (err) {
        setLoading(false);
        setUploadProgress(null);
        return;
      }
    }
    setUploadProgress(null);
    const allUrls = [...form.designUrls, ...uploadedUrls];

    const payload = {
      title: form.title,
      designUrls: allUrls,
      basePrice: form.basePrice,
      shirtOnlyPrice: null,
      shortsOnlyPrice: null,
      sizeSurcharges: JSON.stringify([
        ...form.surchargeList.map((item) => ({ ...item, target: "base" })),
        ...form.shirtSizeSurchargeList.map((item) => ({ ...item, target: "shirt", itemType: "set" })),
      ]),
    };
    if (editing) {
      await fetch(`/api/jerseys/${editing}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/jerseys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setForm({ title: "", designUrls: [], basePrice: 0, surchargeList: [], shirtSizeSurchargeList: [] });
    setPendingImages((prev) => {
      prev.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      return [];
    });
    setEditing(null);
    setLoading(false);
    loadData();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/jerseys/${id}`, { method: "DELETE" });
    setDeleteId(null);
    loadData();
  }

  async function toggleStatus(j: JerseyItem) {
    const newStatus = j.status === "open" ? "closed" : "open";
    await fetch(`/api/jerseys/${j.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    loadData();
  }

  async function toggleVisibility(j: JerseyItem) {
    await fetch(`/api/jerseys/${j.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isVisible: !j.isVisible }),
    });
    loadData();
  }

  function downloadReport(url: string) {
    window.open(url, "_blank");
  }

  async function saveRegEdit(regId: string, jerseyId: string) {
    try {
      const res = await fetch(`/api/jerseys/registrations/${regId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editRegForm),
      });
      if (res.ok) {
        const data = await res.json();
        setViewRegistrations((prev) => ({
          ...prev,
          [jerseyId]: prev[jerseyId].map((r) => r.id === regId ? { ...r, ...data.data } : r),
        }));
        setEditingReg(null);
        setEditRegForm({});
      }
    } catch { /* ignore */ }
  }

  async function updatePaymentStatus(regId: string, jerseyId: string, status: string) {
    try {
      const res = await fetch(`/api/jerseys/registrations/${regId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: status }),
      });
      if (res.ok) {
        setViewRegistrations((prev) => ({
          ...prev,
          [jerseyId]: prev[jerseyId].map((r) => r.id === regId ? { ...r, paymentStatus: status } : r),
        }));
      }
    } catch { /* ignore */ }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case "registered": return "bg-gray-600 text-gray-300";
      case "dp": return "bg-yellow-700 text-yellow-200";
      case "paid": return "bg-green-700 text-green-200";
      case "cancel": return "bg-red-700 text-red-200";
      case "dropped": return "bg-red-900 text-red-300";
      case "production": return "bg-blue-700 text-blue-200";
      case "done": return "bg-emerald-700 text-emerald-200";
      default: return "bg-gray-600 text-gray-300";
    }
  }

  function getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      registered: t("statusRegistered"),
      dp: t("statusDp"),
      paid: t("statusPaid"),
      cancel: t("statusCancel"),
      dropped: t("statusDropped"),
      production: t("statusProduction"),
      done: t("statusDone"),
    };
    return map[status] || status;
  }

  const DEFAULT_REPORT_COLS = REPORT_COLUMNS.map((c) => c.key).filter((k) => k !== "phone");

  function toggleReportColumn(jerseyId: string, col: string) {
    setReportColumns((prev) => {
      const current = prev[jerseyId] || DEFAULT_REPORT_COLS;
      return {
        ...prev,
        [jerseyId]: current.includes(col) ? current.filter((c) => c !== col) : [...current, col],
      };
    });
  }

  function downloadCustomReport(jerseyId: string) {
    const cols = reportColumns[jerseyId] || DEFAULT_REPORT_COLS;
    if (cols.length === 0) return;
    window.open(`/api/reports?type=jersey&id=${jerseyId}&columns=${cols.join(",")}`, "_blank");
    setShowReportConfig(null);
  }

  function parseSurcharges(raw: string) {
    try {
      const parsed = JSON.parse(raw || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  }

  function getValidShirtSizes(_jersey: JerseyItem, mainSize: string): string[] {
    const mainIdx = SIZES.indexOf(mainSize);
    return SIZES.filter((_, i) => i > mainIdx);
  }

  function calcEditPrice(jersey: JerseyItem, regForm: Partial<JerseyReg>): number {
    let price = jersey.basePrice || 0;
    const surcharges = parseSurcharges(jersey.sizeSurcharges);
    const size = regForm.size || "L";
    const itemType = regForm.itemType || "set";
    const shirtSize = regForm.shirtSize || "";

    const baseRules = surcharges.filter((e: { target?: string }) => e.target !== "shirt");
    const exact = baseRules.find((e: { size?: string; itemType?: string }) => e.size === size && (e.itemType || "set") === itemType);
    if (exact) {
      price += (exact.surcharge ?? exact.price ?? 0);
    } else {
      const bySize = baseRules.find((e: { size?: string }) => e.size === size);
      if (bySize) price += (bySize.surcharge ?? bySize.price ?? 0);
    }

    if (itemType === "set" && shirtSize && shirtSize !== size) {
      const shirtRule = surcharges.find((e: { target?: string; shirtSize?: string; size?: string }) => e.target === "shirt" && (e.shirtSize || e.size) === shirtSize);
      if (shirtRule) {
        price += (shirtRule.surcharge ?? shirtRule.price ?? 0);
      } else {
        // Fallback: use base surcharge difference between shirt size and main size
        const shirtBase = baseRules.find((e: { size?: string }) => e.size === shirtSize);
        const mainBase = exact || baseRules.find((e: { size?: string }) => e.size === size);
        const shirtSurcharge = shirtBase ? (shirtBase.surcharge ?? shirtBase.price ?? 0) : 0;
        const mainSurcharge = mainBase ? (mainBase.surcharge ?? mainBase.price ?? 0) : 0;
        if (shirtSurcharge > mainSurcharge) price += (shirtSurcharge - mainSurcharge);
      }
    }
    return price;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">{t("jerseyLaunch")}</h1>

      <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl p-6 mb-8 space-y-4 max-w-2xl">
        <h2 className="text-lg font-semibold text-white">{editing ? `${t("edit")} Jersey` : t("launchNewJersey")}</h2>
        <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder={t("jerseyName")} className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 admin-input" required />
        <div>
          <label className="block text-gray-300 text-sm mb-1">{t("uploadDesign")}</label>
          <p className="text-gray-500 text-xs mb-2">{t("recommendDesignSize")}</p>
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg cursor-pointer transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            {t("chooseFile")}
            <input type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
          </label>
          {(form.designUrls.length > 0 || pendingImages.length > 0) && (
            <div className="mt-2 flex flex-wrap gap-2">
              {form.designUrls.map((url, idx) => (
                <div key={`existing-${idx}`} className="relative group">
                  <img src={url} alt={`Design ${idx + 1}`} className="w-24 h-24 object-cover rounded" />
                  <button type="button" onClick={() => removeDesignUrl(idx)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold opacity-80 group-hover:opacity-100 transition">✕</button>
                </div>
              ))}
              {pendingImages.map((img, idx) => (
                <div key={`pending-${idx}`} className="relative group">
                  <img src={img.previewUrl} alt={`Pending ${idx + 1}`} className="w-24 h-24 object-cover rounded border-2 border-dashed border-yellow-500" />
                  <button type="button" onClick={() => removePendingFile(idx)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold opacity-80 group-hover:opacity-100 transition">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Pricing Section */}
        <div className="border-t border-gray-700 pt-4 mt-4">
          <h3 className="text-white font-semibold mb-3">{t("jerseyPricing")}</h3>
          <div>
            <label className="block text-gray-300 text-sm mb-1">{t("normalPrice")}</label>
            <div className="relative w-full sm:w-64">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
              <input type="text" inputMode="numeric" value={formatNumber(form.basePrice)} onChange={(e) => setForm((f) => ({ ...f, basePrice: parseNumber(e.target.value) }))}
                placeholder="200.000" className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 admin-input" />
            </div>
            <p className="text-gray-500 text-xs mt-1">{t("normalPriceHint")}</p>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-gray-300 text-sm font-medium">{t("sizeSurchargeLabel")}</label>
              <button type="button" onClick={() => setForm((f) => ({ ...f, surchargeList: [...f.surchargeList, { size: "XXL", itemType: "set", surcharge: 0 }] }))}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition">{t("addMore")}</button>
            </div>
            {form.surchargeList.length === 0 ? (
              <p className="text-gray-500 text-sm">{t("noSurchargesYet")}</p>
            ) : (
              <div className="space-y-2">
                {form.surchargeList.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-gray-700/50 p-2 rounded-lg">
                    <select value={item.size} onChange={(e) => {
                      setForm((f) => { const list = [...f.surchargeList]; list[idx] = { ...list[idx], size: e.target.value }; return { ...f, surchargeList: list }; });
                    }} className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 text-sm admin-input">
                      {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {/* <span className="px-3 py-2 text-gray-400 text-xs whitespace-nowrap">harga 1 stel</span> */}
                    <div className="flex-1">
                      <div className="relative w-full">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">Rp</span>
                        <input type="text" inputMode="numeric" value={formatNumber(item.surcharge)} onChange={(e) => {
                          setForm((f) => { const list = [...f.surchargeList]; list[idx] = { ...list[idx], surcharge: parseNumber(e.target.value) }; return { ...f, surchargeList: list }; });
                        }} placeholder="50.000" className="w-full pl-8 pr-3 py-2 bg-gray-700 text-white rounded border border-gray-600 text-sm admin-input" />
                      </div>
                    </div>
                    <button type="button" onClick={() => setForm((f) => ({ ...f, surchargeList: f.surchargeList.filter((_, i) => i !== idx) }))}
                      className="w-8 h-8 flex items-center justify-center bg-red-600 hover:bg-red-500 text-white rounded transition text-sm font-bold">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-4 border-t border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-gray-300 text-sm font-medium">{t("shirtSizeSurchargeLabel")}</label>
              <button type="button" onClick={() => setForm((f) => ({ ...f, shirtSizeSurchargeList: [...f.shirtSizeSurchargeList, { shirtSize: "XXL", surcharge: 0 }] }))}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition">{t("addMore")}</button>
            </div>
            {form.shirtSizeSurchargeList.length === 0 ? (
              <p className="text-gray-500 text-sm">{t("noShirtSurchargesYet")}</p>
            ) : (
              <div className="space-y-2">
                {form.shirtSizeSurchargeList.map((item, idx) => (
                  <div key={`shirt-${idx}`} className="flex items-center gap-2 bg-gray-700/50 p-2 rounded-lg">
                    <select value={item.shirtSize} onChange={(e) => {
                      setForm((f) => { const list = [...f.shirtSizeSurchargeList]; list[idx] = { ...list[idx], shirtSize: e.target.value }; return { ...f, shirtSizeSurchargeList: list }; });
                    }} className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 text-sm admin-input">
                      {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <div className="flex-1">
                      <div className="relative w-full">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">Rp</span>
                        <input type="text" inputMode="numeric" value={formatNumber(item.surcharge)} onChange={(e) => {
                          setForm((f) => { const list = [...f.shirtSizeSurchargeList]; list[idx] = { ...list[idx], surcharge: parseNumber(e.target.value) }; return { ...f, shirtSizeSurchargeList: list }; });
                        }} placeholder="25.000" className="w-full pl-8 pr-3 py-2 bg-gray-700 text-white rounded border border-gray-600 text-sm admin-input" />
                      </div>
                    </div>
                    <button type="button" onClick={() => setForm((f) => ({ ...f, shirtSizeSurchargeList: f.shirtSizeSurchargeList.filter((_, i) => i !== idx) }))}
                      className="w-8 h-8 flex items-center justify-center bg-red-600 hover:bg-red-500 text-white rounded transition text-sm font-bold">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {uploadProgress && (
            <div className="max-w-md">
              <UploadProgressBar progress={uploadProgress} />
            </div>
          )}
          <div className="flex gap-2">
          <button type="submit" disabled={loading} className="px-6 py-2 admin-btn-primary rounded-lg transition disabled:opacity-50">
            {loading ? t("uploadingAndSaving") : editing ? t("update") : t("launch")}
          </button>
          {editing && (
            <button type="button"
              onClick={() => {
                setEditing(null);
                setForm({ title: "", designUrls: [], basePrice: 0, surchargeList: [], shirtSizeSurchargeList: [] });
                setPendingImages((prev) => {
                  prev.forEach((img) => URL.revokeObjectURL(img.previewUrl));
                  return [];
                });
              }}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition"
              >{t("cancel")}</button>
          )}
          </div>
        </div>
      </form>

      <div className="space-y-4">
        {jerseys.map((j) => (
          <div key={j.id} className="bg-gray-800 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-4">
              <div className="flex gap-4">
                {(j.designUrls || []).length > 0 && (
                  <div className="flex gap-1 flex-shrink-0">
                    {j.designUrls.slice(0, 3).map((url, idx) => (
                      <img key={idx} src={url} alt="" className="w-24 h-24 object-cover rounded" />
                    ))}
                    {j.designUrls.length > 3 && (
                      <div className="w-24 h-24 rounded bg-gray-700 flex items-center justify-center text-gray-400 text-sm">+{j.designUrls.length - 3}</div>
                    )}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-white font-bold text-lg">{j.title}</h3>
                    {j.status === "open" ? (
                      <span className="px-2 py-0.5 rounded text-xs font-medium text-white" style={{ backgroundColor: primary }}>
                        {j.status}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-600 text-white">
                        {j.status}
                      </span>
                    )}
                    {j.isVisible ? (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-600 text-white">👁 {t("showPublic")}</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-600/70 text-white">🙈 {t("hidePublic")}</span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm mt-1">{t("registrantsCount")}: {j._count?.registrations ?? j.registrations?.length ?? 0}</p>
                  {j.basePrice > 0 && <p className="text-green-400 text-sm mt-1">{t("priceLabel")}: {formatRupiah(j.basePrice)}</p>}
                  <p className="text-blue-400 text-sm mt-1">
                    Link: <code className="bg-gray-700 px-2 py-0.5 rounded">/jersey/{j.slug}</code>
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0 flex-wrap">
                <button onClick={() => toggleView(j.id)}
                    className="px-3 py-1 bg-gray-600 text-white rounded text-sm">{viewJersey === j.id ? t("closeView") : t("viewDetail")}</button>
                <button onClick={() => downloadReport(`/api/reports?type=jersey&id=${j.id}`)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition">📥</button>
                <button onClick={() => toggleStatus(j)}
                  className={`px-3 py-1 rounded text-sm text-white ${j.status === "open" ? "bg-yellow-600" : ""}`}
                  style={j.status !== "open" ? { backgroundColor: primary } : undefined}>
                  {j.status === "open" ? t("closeStatus") : t("openStatus")}
                </button>
                <button onClick={() => toggleVisibility(j)}
                  className={`px-3 py-1 rounded text-sm font-medium transition ${j.isVisible ? "bg-red-600 hover:bg-red-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"}`}>
                  {j.isVisible ? `🙈 ${t("hidePublic")}` : `👁 ${t("showPublic")}`}
                </button>
                <button onClick={() => {
                  setEditing(j.id);
                  let surchargeList: BaseSurchargeRule[] = [];
                  let shirtSizeSurchargeList: ShirtSizeSurchargeRule[] = [];
                  try {
                    const parsed = JSON.parse(j.sizeSurcharges || "[]");
                    if (Array.isArray(parsed)) {
                      surchargeList = parsed
                        .filter((p: { target?: string }) => p.target !== "shirt")
                        .map((p: { size: string; itemType?: string; surcharge?: number; price?: number }) => ({ size: p.size, itemType: p.itemType || "set", surcharge: p.surcharge ?? p.price ?? 0 }));
                      shirtSizeSurchargeList = parsed
                        .filter((p: { target?: string }) => p.target === "shirt")
                        .map((p: { shirtSize?: string; size?: string; surcharge?: number; price?: number }) => ({ shirtSize: p.shirtSize || p.size || "XXL", surcharge: p.surcharge ?? p.price ?? 0 }));
                    }
                  } catch { /* ignore */ }
                  setForm({ title: j.title, designUrls: j.designUrls ?? [], basePrice: j.basePrice || 0, surchargeList, shirtSizeSurchargeList });
                  setPendingImages((prev) => {
                    prev.forEach((img) => URL.revokeObjectURL(img.previewUrl));
                    return [];
                  });
                }}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm">{t("edit")}</button>
                <button onClick={() => setDeleteId(j.id)} className="px-3 py-1 bg-red-600 text-white rounded text-sm">{t("delete")}</button>
              </div>
            </div>

            {viewJersey === j.id && (
              <div className="mt-4 border-t border-gray-700 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-semibold">{t("registrantList")}</h4>
                  <button onClick={() => setShowReportConfig(j.id)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition">
                    📥 {t("generateReport")}
                  </button>
                </div>
                {!viewRegistrations[j.id] ? (
                  <p className="text-gray-400 text-sm">{t("loading")}</p>
                ) : viewRegistrations[j.id].length === 0 ? (
                  <p className="text-gray-500 text-sm">{t("noRegistrantsYet")}</p>
                ) : (
                  <div className="overflow-x-auto -mx-6 px-6">
                  <table className="w-full text-sm min-w-[800px]">
                    <thead><tr className="text-gray-400 text-left">
                      <th className="py-1">#</th><th>{t("registrantCol")}</th><th>{t("jerseyName2")}</th><th>{t("phoneCol")}</th><th>{t("numberCol")}</th><th>{t("sizeCol")}</th><th>{t("shirtSizeCol")}</th><th>{t("typeCol")}</th><th>{t("itemCol")}</th><th>{t("priceCol")}</th><th>{t("statusCol")}</th><th>{t("actions")}</th>
                    </tr></thead>
                    <tbody>
                      {viewRegistrations[j.id].map((r, i) => (
                        <tr key={r.id} className="text-gray-300 border-t border-gray-700">
                          <td className="py-1">{i + 1}</td>
                          {editingReg === r.id ? (
                            <>
                              <td><input value={editRegForm.registrantName ?? ""} onChange={(e) => setEditRegForm((f) => ({ ...f, registrantName: e.target.value }))} className="w-full px-1 py-0.5 bg-gray-700 text-white rounded border border-gray-600 text-sm" /></td>
                              <td><input value={editRegForm.name ?? ""} onChange={(e) => setEditRegForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-1 py-0.5 bg-gray-700 text-white rounded border border-gray-600 text-sm" /></td>
                              <td><input value={editRegForm.phone ?? ""} onChange={(e) => setEditRegForm((f) => ({ ...f, phone: e.target.value }))} className="w-full px-1 py-0.5 bg-gray-700 text-white rounded border border-gray-600 text-sm" /></td>
                              <td><input type="number" min={1} max={99} value={editRegForm.number ?? ""} onChange={(e) => setEditRegForm((f) => ({ ...f, number: Number(e.target.value) }))} className="w-16 px-1 py-0.5 bg-gray-700 text-white rounded border border-gray-600 text-sm" /></td>
                              <td>
                                <select value={editRegForm.size ?? "L"} onChange={(e) => {
                                  const newSize = e.target.value;
                                  setEditRegForm((f) => {
                                    const newSizeIdx = SIZES.indexOf(newSize);
                                    const shirtIdx = SIZES.indexOf(f.shirtSize || "");
                                    const shirtStillValid = f.shirtSize && shirtIdx > newSizeIdx;
                                    const updatedShirt = shirtStillValid ? f.shirtSize : "";
                                    const updated = { ...f, size: newSize, shirtSize: updatedShirt };
                                    updated.totalPrice = calcEditPrice(j, updated);
                                    return updated;
                                  });
                                }} className="px-1 py-0.5 bg-gray-700 text-white rounded border border-gray-600 text-sm">
                                  {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                              </td>
                              <td>
                                {(() => {
                                  const validShirtSizes = getValidShirtSizes(j, editRegForm.size || "L");
                                  return validShirtSizes.length > 0 ? (
                                    <select value={editRegForm.shirtSize ?? ""} onChange={(e) => {
                                      setEditRegForm((f) => {
                                        const updated = { ...f, shirtSize: e.target.value };
                                        updated.totalPrice = calcEditPrice(j, updated);
                                        return updated;
                                      });
                                    }} className="px-1 py-0.5 bg-gray-700 text-white rounded border border-gray-600 text-sm">
                                      <option value="">-</option>
                                      {validShirtSizes.map((s) => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                  ) : <span className="text-gray-500 text-xs">-</span>;
                                })()}
                              </td>
                              <td>
                                <select value={editRegForm.jerseyType ?? "player"} onChange={(e) => setEditRegForm((f) => ({ ...f, jerseyType: e.target.value }))}
                                  className="px-1 py-0.5 bg-gray-700 text-white rounded border border-gray-600 text-xs">
                                  <option value="player">⚽ {t("player")}</option>
                                  <option value="goalkeeper">🧤 {t("goalkeeper")}</option>
                                </select>
                              </td>
                              <td>
                                <span className="text-xs text-gray-400">
                                  {(editRegForm.itemType || r.itemType) === "shirt" ? `👕 ${t("itemTypeShirt")}` : (editRegForm.itemType || r.itemType) === "shorts" ? `👟 ${t("itemTypeShorts")}` : `👕👟 ${t("setLabel")}`}
                                </span>
                              </td>
                              <td>
                                {(editRegForm.totalPrice ?? 0) > 0 ? <span className="text-green-400 font-medium">{formatRupiah(editRegForm.totalPrice ?? 0)}</span> : <span className="text-gray-500">-</span>}
                              </td>
                              <td>
                                <select value={editRegForm.paymentStatus ?? "registered"} onChange={(e) => setEditRegForm((f) => ({ ...f, paymentStatus: e.target.value }))} className={`px-1 py-0.5 rounded text-xs ${getStatusColor(editRegForm.paymentStatus ?? "registered")}`}>
                                  {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
                                </select>
                              </td>
                              <td className="whitespace-nowrap">
                                <button onClick={() => saveRegEdit(r.id, j.id)} className="px-2 py-0.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs mr-1">✓</button>
                                <button onClick={() => { setEditingReg(null); setEditRegForm({}); }} className="px-2 py-0.5 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs">✕</button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td>{r.registrantName || "-"}</td>
                              <td>{r.name}</td>
                              <td>{r.phone}</td>
                              <td><span className="bg-green-800 text-green-300 px-2 py-0.5 rounded font-mono">{r.number}</span></td>
                              <td>{r.size}</td>
                              <td>{r.shirtSize || "-"}</td>
                              <td>
                                <span className={`px-2 py-0.5 rounded text-xs ${r.jerseyType === "goalkeeper" ? "bg-blue-800 text-blue-300" : "bg-gray-600 text-gray-300"}`}>
                                  {r.jerseyType === "goalkeeper" ? `🧤 ${t("goalkeeper")}` : `⚽ ${t("player")}`}
                                </span>
                              </td>
                              <td>
                                <span className="text-xs text-gray-400">
                                  {r.itemType === "shirt" ? `👕 ${t("itemTypeShirt")}` : r.itemType === "shorts" ? `👟 ${t("itemTypeShorts")}` : `👕👟 ${t("setLabel")}`}
                                </span>
                              </td>
                              <td>
                                {r.totalPrice > 0 ? <span className="text-green-400 font-medium">{formatRupiah(r.totalPrice)}</span> : <span className="text-gray-500">-</span>}
                              </td>
                              <td>
                                <select value={r.paymentStatus || "registered"} onChange={(e) => updatePaymentStatus(r.id, j.id, e.target.value)}
                                  className={`px-2 py-0.5 rounded text-xs cursor-pointer ${getStatusColor(r.paymentStatus || "registered")}`}>
                                  {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
                                </select>
                              </td>
                              <td>
                                <button onClick={() => { setEditingReg(r.id); setEditRegForm({ registrantName: r.registrantName, name: r.name, phone: r.phone, number: r.number, size: r.size, shirtSize: r.shirtSize, jerseyType: r.jerseyType, itemType: r.itemType, totalPrice: r.totalPrice, paymentStatus: r.paymentStatus || "registered" }); }}
                                  className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs">✏️</button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {jerseys.length === 0 && <p className="text-gray-500">{t("noJerseysYet")}</p>}
      </div>

      <ConfirmModal
        open={!!deleteId}
        title={t("deleteJerseyTitle")}
        message={t("deleteJerseyMessage")}
        confirmText={t("delete")}
        cancelText={t("cancel")}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
      />

      {/* Report Column Picker Modal */}
      {showReportConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowReportConfig(null)}>
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-semibold">{t("selectColumns")}</h3>
              <button onClick={() => setShowReportConfig(null)} className="text-gray-400 hover:text-white text-xl leading-none">&times;</button>
            </div>
            <div className="space-y-2">
              {REPORT_COLUMNS.map((col) => {
                const selected = reportColumns[showReportConfig] || DEFAULT_REPORT_COLS;
                return (
                  <label key={col.key} className="flex items-center gap-3 text-gray-300 text-sm cursor-pointer hover:text-white py-1">
                    <input type="checkbox" checked={selected.includes(col.key)}
                      onChange={() => toggleReportColumn(showReportConfig, col.key)}
                      className="rounded w-4 h-4" />
                    {t(col.label as Parameters<typeof t>[0])}
                  </label>
                );
              })}
            </div>
            <button onClick={() => downloadCustomReport(showReportConfig)}
              className="mt-5 w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition">
              📥 {t("download")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

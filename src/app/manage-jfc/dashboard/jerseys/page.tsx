"use client";

import { useEffect, useRef, useState } from "react";
import { useAdminTheme } from "@/lib/admin-theme";
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
  jerseyType: string;
  itemType: string;
  totalPrice: number;
  createdAt: string;
}

interface JerseyItem {
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
  const [jerseys, setJerseys] = useState<JerseyItem[]>([]);
  const [form, setForm] = useState({ title: "", designUrls: [] as string[], basePrice: 0, surchargeList: [] as { size: string; itemType: string; surcharge: number }[] });
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewJersey, setViewJersey] = useState<JerseyItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [pendingImages, setPendingImages] = useState<{ file: File; previewUrl: string }[]>([]);
  const pendingImagesRef = useRef<{ file: File; previewUrl: string }[]>([]);
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
    const res = await fetch("/api/jerseys");
    const data = await res.json();
    if (data.data) setJerseys(data.data);
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

    const payload = { title: form.title, designUrls: allUrls, basePrice: form.basePrice, shirtOnlyPrice: null, shortsOnlyPrice: null, sizeSurcharges: JSON.stringify(form.surchargeList) };
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

    setForm({ title: "", designUrls: [], basePrice: 0, surchargeList: [] });
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

  function downloadReport(url: string) {
    window.open(url, "_blank");
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Jersey Launch</h1>

      <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl p-6 mb-8 space-y-4 max-w-2xl">
        <h2 className="text-lg font-semibold text-white">{editing ? "Edit Jersey" : "Launch Jersey Baru"}</h2>
        <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Nama Jersey (contoh: Jersey Home 2024)" className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 admin-input" required />
        <div>
          <label className="block text-gray-300 text-sm mb-1">Upload Desain Jersey</label>
          <p className="text-gray-500 text-xs mb-2">Rekomendasi: 800 × 800 px (rasio 1:1, bisa upload banyak)</p>
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg cursor-pointer transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Pilih File
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
          <h3 className="text-white font-semibold mb-3">Harga Jersey</h3>
          <div>
            <label className="block text-gray-300 text-sm mb-1">Harga Normal</label>
            <div className="relative w-full sm:w-64">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
              <input type="text" inputMode="numeric" value={formatNumber(form.basePrice)} onChange={(e) => setForm((f) => ({ ...f, basePrice: parseNumber(e.target.value) }))}
                placeholder="200.000" className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 admin-input" />
            </div>
            <p className="text-gray-500 text-xs mt-1">Harga default untuk semua ukuran & tipe (jika tidak ada harga khusus di bawah)</p>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-gray-300 text-sm font-medium">Tambahan Harga per Ukuran (opsional)</label>
              <button type="button" onClick={() => setForm((f) => ({ ...f, surchargeList: [...f.surchargeList, { size: "XXL", itemType: "set", surcharge: 0 }] }))}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition">+ Tambah</button>
            </div>
            {form.surchargeList.length === 0 ? (
              <p className="text-gray-500 text-sm">Belum ada tambahan harga. Semua ukuran menggunakan harga normal.</p>
            ) : (
              <div className="space-y-2">
                {form.surchargeList.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-gray-700/50 p-2 rounded-lg">
                    <select value={item.size} onChange={(e) => {
                      setForm((f) => { const list = [...f.surchargeList]; list[idx] = { ...list[idx], size: e.target.value }; return { ...f, surchargeList: list }; });
                    }} className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 text-sm admin-input">
                      {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select value={item.itemType} onChange={(e) => {
                      setForm((f) => { const list = [...f.surchargeList]; list[idx] = { ...list[idx], itemType: e.target.value }; return { ...f, surchargeList: list }; });
                    }} className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 text-sm admin-input">
                      <option value="set">1 Stel</option>
                      <option value="shirt">Baju Saja</option>
                    </select>
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
        </div>
        <div className="flex flex-col gap-3">
          {uploadProgress && (
            <div className="max-w-md">
              <UploadProgressBar progress={uploadProgress} />
            </div>
          )}
          <div className="flex gap-2">
          <button type="submit" disabled={loading} className="px-6 py-2 admin-btn-primary rounded-lg transition disabled:opacity-50">
            {loading ? "Uploading & Saving..." : editing ? "Update" : "Launch"}
          </button>
          {editing && (
            <button type="button"
              onClick={() => {
                setEditing(null);
                setForm({ title: "", designUrls: [], basePrice: 0, surchargeList: [] });
                setPendingImages((prev) => {
                  prev.forEach((img) => URL.revokeObjectURL(img.previewUrl));
                  return [];
                });
              }}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition"
              >Batal</button>
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
                  </div>
                  <p className="text-gray-400 text-sm mt-1">Pendaftar: {j.registrations.length}</p>
                  {j.basePrice > 0 && <p className="text-green-400 text-sm mt-1">Harga: {formatRupiah(j.basePrice)}</p>}
                  <p className="text-blue-400 text-sm mt-1">
                    Link: <code className="bg-gray-700 px-2 py-0.5 rounded">/jersey/{j.slug}</code>
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0 flex-wrap">
                <button onClick={() => setViewJersey(viewJersey?.id === j.id ? null : j)}
                  className="px-3 py-1 bg-gray-600 text-white rounded text-sm">{viewJersey?.id === j.id ? "Tutup" : "Lihat"}</button>
                <button onClick={() => downloadReport(`/api/reports?type=jersey&id=${j.id}`)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition">📥 Report</button>
                <button onClick={() => toggleStatus(j)}
                  className={`px-3 py-1 rounded text-sm text-white ${j.status === "open" ? "bg-yellow-600" : ""}`}
                  style={j.status !== "open" ? { backgroundColor: primary } : undefined}>
                  {j.status === "open" ? "Close" : "Open"}
                </button>
                <button onClick={() => {
                  setEditing(j.id);
                  let surchargeList: { size: string; itemType: string; surcharge: number }[] = [];
                  try { const parsed = JSON.parse(j.sizeSurcharges || "[]"); surchargeList = Array.isArray(parsed) ? parsed.map((p: { size: string; itemType?: string; surcharge?: number; price?: number }) => ({ size: p.size, itemType: p.itemType || "set", surcharge: p.surcharge ?? p.price ?? 0 })) : []; } catch { /* ignore */ }
                  setForm({ title: j.title, designUrls: j.designUrls ?? [], basePrice: j.basePrice || 0, surchargeList });
                  setPendingImages((prev) => {
                    prev.forEach((img) => URL.revokeObjectURL(img.previewUrl));
                    return [];
                  });
                }}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Edit</button>
                <button onClick={() => setDeleteId(j.id)} className="px-3 py-1 bg-red-600 text-white rounded text-sm">Hapus</button>
              </div>
            </div>

            {viewJersey?.id === j.id && (
              <div className="mt-4 border-t border-gray-700 pt-4">
                <h4 className="text-white font-semibold mb-2">Daftar Peserta</h4>
                {j.registrations.length === 0 ? (
                  <p className="text-gray-500 text-sm">Belum ada yang daftar.</p>
                ) : (
                  <div className="overflow-x-auto -mx-6 px-6">
                  <table className="w-full text-sm min-w-[600px]">
                    <thead><tr className="text-gray-400 text-left">
                      <th className="py-1">#</th><th>Pendaftar</th><th>Nama Jersey</th><th>Telepon</th><th>Nomor</th><th>Ukuran</th><th>Tipe</th><th>Item</th><th>Harga</th>
                    </tr></thead>
                    <tbody>
                      {j.registrations.map((r, i) => (
                        <tr key={r.id} className="text-gray-300 border-t border-gray-700">
                          <td className="py-1">{i + 1}</td>
                          <td>{r.registrantName || "-"}</td>
                          <td>{r.name}</td>
                          <td>{r.phone}</td>
                          <td><span className="bg-green-800 text-green-300 px-2 py-0.5 rounded font-mono">{r.number}</span></td>
                          <td>{r.size}</td>
                          <td>
                            <span className={`px-2 py-0.5 rounded text-xs ${r.jerseyType === "goalkeeper" ? "bg-blue-800 text-blue-300" : "bg-gray-600 text-gray-300"}`}>
                              {r.jerseyType === "goalkeeper" ? "🧤 Kiper" : "⚽ Pemain"}
                            </span>
                          </td>
                          <td>
                            <span className="text-xs text-gray-400">
                              {r.itemType === "shirt" ? "👕 Baju" : r.itemType === "shorts" ? "👟 Celana" : "👕👟 Stel"}
                            </span>
                          </td>
                          <td>
                            {r.totalPrice > 0 ? <span className="text-green-400 font-medium">{formatRupiah(r.totalPrice)}</span> : <span className="text-gray-500">-</span>}
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
        ))}
        {jerseys.length === 0 && <p className="text-gray-500">Belum ada jersey launch.</p>}
      </div>

      <ConfirmModal
        open={!!deleteId}
        title="Hapus Jersey"
        message="Yakin ingin menghapus jersey launch ini?"
        confirmText="Hapus"
        cancelText="Batal"
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

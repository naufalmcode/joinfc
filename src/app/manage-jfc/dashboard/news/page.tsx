"use client";

import { useEffect, useState, useMemo } from "react";
import { useAdminTheme } from "@/lib/admin-theme";
import ConfirmModal from "@/components/ConfirmModal";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  imageUrls: string[];
  isActive: boolean;
  createdAt: string;
}

export default function NewsPage() {
  const { primary } = useAdminTheme();
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [form, setForm] = useState({ title: "", content: "" });
  const [existingUrls, setExistingUrls] = useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const pendingPreviews = useMemo(
    () => pendingFiles.map((f) => URL.createObjectURL(f)),
    [pendingFiles]
  );

  useEffect(() => {
    return () => pendingPreviews.forEach((url) => URL.revokeObjectURL(url));
  }, [pendingPreviews]);

  async function loadData() {
    const res = await fetch("/api/news");
    const data = await res.json();
    if (data.data) setNewsList(data.data);
  }

  useEffect(() => { loadData(); }, []);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) setPendingFiles((prev) => [...prev, ...files]);
    e.target.value = "";
  }

  function removePendingFile(index: number) {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function removeExistingUrl(index: number) {
    setExistingUrls((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadFiles(files: File[]): Promise<string[]> {
    const urls: string[] = [];
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (data.success) urls.push(data.data.url);
      } catch { /* skip failed */ }
    }
    return urls;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const uploadedUrls = await uploadFiles(pendingFiles);
    const allUrls = [...existingUrls, ...uploadedUrls];

    const payload = { ...form, imageUrls: allUrls };

    if (editing) {
      await fetch(`/api/news/${editing}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setForm({ title: "", content: "" });
    setExistingUrls([]);
    setPendingFiles([]);
    setEditing(null);
    setLoading(false);
    loadData();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/news/${id}`, { method: "DELETE" });
    setDeleteId(null);
    loadData();
  }

  function handleEdit(n: NewsItem) {
    setEditing(n.id);
    setForm({ title: n.title, content: n.content });
    setExistingUrls(n.imageUrls || []);
    setPendingFiles([]);
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Berita & Aktivitas</h1>

      <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl p-6 mb-8 space-y-4 max-w-2xl">
        <h2 className="text-lg font-semibold text-white">
          {editing ? "Edit Berita" : "Tambah Berita"}
        </h2>
        <input
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Judul Berita"
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 admin-input"
          required
        />
        <textarea
          value={form.content}
          onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
          placeholder="Isi berita..."
          rows={5}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 admin-input"
          required
        />
        <div>
          <label className="block text-gray-300 text-sm mb-1">Gambar (opsional, bisa upload banyak)</label>
          <p className="text-gray-500 text-xs mb-2">Rekomendasi: 800 × 450 px (rasio 16:9)</p>
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg cursor-pointer transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Pilih File
            <input type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
          </label>
          {(existingUrls.length > 0 || pendingFiles.length > 0) && (
            <div className="mt-2 flex flex-wrap gap-2">
              {existingUrls.map((url, idx) => (
                <div key={`existing-${idx}`} className="relative group">
                  <img src={url} alt="" className="w-24 h-24 object-cover rounded" />
                  <button type="button" onClick={() => removeExistingUrl(idx)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold opacity-80 group-hover:opacity-100 transition">✕</button>
                </div>
              ))}
              {pendingFiles.map((_, idx) => (
                <div key={`pending-${idx}`} className="relative group">
                  <img src={pendingPreviews[idx]} alt="" className="w-24 h-24 object-cover rounded border-2 border-dashed border-yellow-500" />
                  <button type="button" onClick={() => removePendingFile(idx)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold opacity-80 group-hover:opacity-100 transition">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={loading}
            className="px-6 py-2 admin-btn-primary rounded-lg transition disabled:opacity-50">
            {loading ? "Uploading & Saving..." : editing ? "Update" : "Tambah"}
          </button>
          {editing && (
            <button type="button" onClick={() => { setEditing(null); setForm({ title: "", content: "" }); setExistingUrls([]); setPendingFiles([]); }}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition">Batal</button>
          )}
        </div>
      </form>

      <div className="space-y-4">
        {newsList.map((n) => (
          <div key={n.id} className="bg-gray-800 rounded-xl p-4 flex flex-col sm:flex-row items-start gap-4">
            {(n.imageUrls || []).length > 0 && (
              <div className="flex gap-1 flex-shrink-0">
                {n.imageUrls.slice(0, 2).map((url, idx) => (
                  <img key={idx} src={url} alt="" className="w-full sm:w-24 h-40 sm:h-16 object-cover rounded" />
                ))}
                {n.imageUrls.length > 2 && (
                  <div className="w-16 h-16 rounded bg-gray-700 flex items-center justify-center text-gray-400 text-xs">+{n.imageUrls.length - 2}</div>
                )}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold">{n.title}</h3>
              <p className="text-gray-400 text-sm mt-1 line-clamp-2">{n.content}</p>
              <p className="text-gray-500 text-xs mt-1">{new Date(n.createdAt).toLocaleDateString("id-ID")}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => handleEdit(n)} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Edit</button>
              <button onClick={() => setDeleteId(n.id)} className="px-3 py-1 bg-red-600 text-white rounded text-sm">Hapus</button>
            </div>
          </div>
        ))}
        {newsList.length === 0 && <p className="text-gray-500">Belum ada berita.</p>}
      </div>

      <ConfirmModal
        open={!!deleteId}
        title="Hapus Berita"
        message="Yakin ingin menghapus berita ini?"
        confirmText="Hapus"
        cancelText="Batal"
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

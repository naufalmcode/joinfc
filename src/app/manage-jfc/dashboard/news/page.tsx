"use client";

import { useEffect, useState } from "react";
import { useAdminTheme } from "@/lib/admin-theme";
import ConfirmModal from "@/components/ConfirmModal";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function NewsPage() {
  const { primary } = useAdminTheme();
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [form, setForm] = useState({ title: "", content: "", imageUrl: "" });
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function loadData() {
    const res = await fetch("/api/news");
    const data = await res.json();
    if (data.data) setNewsList(data.data);
  }

  useEffect(() => { loadData(); }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (data.success) setForm((f) => ({ ...f, imageUrl: data.data.url }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (editing) {
      await fetch(`/api/news/${editing}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }

    setForm({ title: "", content: "", imageUrl: "" });
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
    setForm({ title: n.title, content: n.content, imageUrl: n.imageUrl || "" });
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
          <label className="block text-gray-300 text-sm mb-1">Gambar (opsional)</label>
          <p className="text-gray-500 text-xs mb-2">Rekomendasi: 800 × 450 px (rasio 16:9)</p>
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg cursor-pointer transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Pilih File
            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          </label>
          {form.imageUrl && <img src={form.imageUrl} alt="" className="mt-2 w-32 h-20 object-cover rounded" />}
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={loading}
            className="px-6 py-2 admin-btn-primary rounded-lg transition disabled:opacity-50">
            {loading ? "Saving..." : editing ? "Update" : "Tambah"}
          </button>
          {editing && (
            <button type="button" onClick={() => { setEditing(null); setForm({ title: "", content: "", imageUrl: "" }); }}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition">Batal</button>
          )}
        </div>
      </form>

      <div className="space-y-4">
        {newsList.map((n) => (
          <div key={n.id} className="bg-gray-800 rounded-xl p-4 flex items-start gap-4">
            {n.imageUrl && <img src={n.imageUrl} alt="" className="w-24 h-16 object-cover rounded flex-shrink-0" />}
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

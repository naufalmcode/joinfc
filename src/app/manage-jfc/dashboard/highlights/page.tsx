"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useAdminTheme } from "@/lib/admin-theme";
import ConfirmModal from "@/components/ConfirmModal";

interface Highlight {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

function RichTextEditor({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }
    isInternalChange.current = false;
  }, [value]);

  const handleInput = useCallback(() => {
    isInternalChange.current = true;
    onChange(editorRef.current?.innerHTML || "");
  }, [onChange]);

  function exec(command: string, val?: string) {
    document.execCommand(command, false, val);
    editorRef.current?.focus();
    handleInput();
  }

  return (
    <div className="border border-gray-600 rounded-lg overflow-hidden">
      <div className="flex flex-wrap gap-1 p-2 bg-gray-600 border-b border-gray-500">
        <button type="button" onClick={() => exec("bold")} className="px-2 py-1 bg-gray-700 hover:bg-gray-500 text-white rounded text-sm font-bold transition" title="Bold">B</button>
        <button type="button" onClick={() => exec("italic")} className="px-2 py-1 bg-gray-700 hover:bg-gray-500 text-white rounded text-sm italic transition" title="Italic">I</button>
        <button type="button" onClick={() => exec("underline")} className="px-2 py-1 bg-gray-700 hover:bg-gray-500 text-white rounded text-sm underline transition" title="Underline">U</button>
        <button type="button" onClick={() => exec("strikeThrough")} className="px-2 py-1 bg-gray-700 hover:bg-gray-500 text-white rounded text-sm line-through transition" title="Strikethrough">S</button>
        <div className="w-px bg-gray-500 mx-1" />
        <button type="button" onClick={() => exec("insertUnorderedList")} className="px-2 py-1 bg-gray-700 hover:bg-gray-500 text-white rounded text-sm transition" title="Bullet List">• List</button>
        <button type="button" onClick={() => exec("insertOrderedList")} className="px-2 py-1 bg-gray-700 hover:bg-gray-500 text-white rounded text-sm transition" title="Numbered List">1. List</button>
        <div className="w-px bg-gray-500 mx-1" />
        <button type="button" onClick={() => exec("formatBlock", "h3")} className="px-2 py-1 bg-gray-700 hover:bg-gray-500 text-white rounded text-sm font-bold transition" title="Heading">H</button>
        <button type="button" onClick={() => exec("formatBlock", "p")} className="px-2 py-1 bg-gray-700 hover:bg-gray-500 text-white rounded text-sm transition" title="Paragraph">¶</button>
        <button type="button" onClick={() => exec("removeFormat")} className="px-2 py-1 bg-gray-700 hover:bg-gray-500 text-white rounded text-sm transition" title="Clear Format">✕</button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="min-h-[100px] p-3 bg-gray-700 text-white text-sm focus:outline-none rich-text"
        style={{ whiteSpace: "pre-wrap" }}
      />
    </div>
  );
}

export default function HighlightsPage() {
  const { primary } = useAdminTheme();
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [form, setForm] = useState({ title: "", description: "", imageUrl: "" });
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const pendingPreview = useMemo(() => pendingFile ? URL.createObjectURL(pendingFile) : null, [pendingFile]);
  useEffect(() => { return () => { if (pendingPreview) URL.revokeObjectURL(pendingPreview); }; }, [pendingPreview]);
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function loadData() {
    const res = await fetch("/api/highlights");
    const data = await res.json();
    if (data.data) setHighlights(data.data);
  }

  useEffect(() => { loadData(); }, []);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPendingFile(file);
    e.target.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    let imageUrl = form.imageUrl;
    if (pendingFile) {
      const fd = new FormData();
      fd.append("file", pendingFile);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (data.success) imageUrl = data.data.url;
        else { alert(data.error || "Upload gagal"); setLoading(false); return; }
      } catch { alert("Upload gagal. Cek koneksi atau konfigurasi."); setLoading(false); return; }
    }

    const payload = { ...form, imageUrl };

    if (editing) {
      await fetch(`/api/highlights/${editing}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/highlights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setForm({ title: "", description: "", imageUrl: "" });
    setPendingFile(null);
    setEditing(null);
    setLoading(false);
    loadData();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/highlights/${id}`, { method: "DELETE" });
    setDeleteId(null);
    loadData();
  }

  function handleEdit(h: Highlight) {
    setEditing(h.id);
    setForm({
      title: h.title,
      description: h.description || "",
      imageUrl: h.imageUrl || "",
    });
    setPendingFile(null);
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Galeri Aktivitas</h1>

      <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl p-6 mb-8 space-y-4 max-w-2xl">
        <h2 className="text-lg font-semibold text-white">
          {editing ? "Edit Foto" : "Tambah Foto Aktivitas"}
        </h2>
        <input
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Keterangan foto"
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 admin-input"
          required
        />
        <div>
          <label className="block text-gray-300 text-sm mb-1">Deskripsi (opsional)</label>
          <RichTextEditor
            value={form.description}
            onChange={(val) => setForm((f) => ({ ...f, description: val }))}
          />
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-2">Rekomendasi: 800 × 600 px (rasio 4:3)</p>
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg cursor-pointer transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Pilih Foto
              <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            </label>
            {(form.imageUrl || pendingFile) && (
              <button type="button" onClick={() => { setForm((f) => ({ ...f, imageUrl: "" })); setPendingFile(null); }}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition">
                ✕ Hapus Foto
              </button>
            )}
          </div>
          {pendingFile && pendingPreview && (
            <div className="mt-2">
              <img src={pendingPreview} alt="" className="w-32 h-24 object-cover rounded border-2 border-dashed border-yellow-500" />
            </div>
          )}
          {!pendingFile && form.imageUrl && <img src={form.imageUrl} alt="" className="mt-2 w-32 h-24 object-cover rounded" />}
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={loading}
            className="px-6 py-2 admin-btn-primary rounded-lg transition disabled:opacity-50">
            {loading ? "Uploading & Saving..." : editing ? "Update" : "Tambah"}
          </button>
          {editing && (
            <button type="button" onClick={() => { setEditing(null); setForm({ title: "", description: "", imageUrl: "" }); setPendingFile(null); }}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition">Batal</button>
          )}
        </div>
      </form>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {highlights.map((h) => (
          <div key={h.id} className="bg-gray-800 rounded-xl overflow-hidden group relative">
            {h.imageUrl ? (
              <img src={h.imageUrl} alt={h.title} className="w-full h-40 object-cover" />
            ) : (
              <div className="w-full h-40 bg-gray-700 flex items-center justify-center text-gray-500">No Image</div>
            )}
            <div className="p-3">
              <p className="text-white text-sm font-medium truncate">{h.title}</p>
            </div>
            <div className="absolute top-2 right-2 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
              <button onClick={() => handleEdit(h)} className="p-1.5 bg-blue-600 text-white rounded text-xs">Edit</button>
              <button onClick={() => setDeleteId(h.id)} className="p-1.5 bg-red-600 text-white rounded text-xs">Hapus</button>
            </div>
          </div>
        ))}
      </div>
      {highlights.length === 0 && <p className="text-gray-500">Belum ada foto aktivitas.</p>}

      <ConfirmModal
        open={!!deleteId}
        title="Hapus Foto"
        message="Yakin ingin menghapus foto ini?"
        confirmText="Hapus"
        cancelText="Batal"
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAdminTheme } from "@/lib/admin-theme";
import { useI18n } from "@/lib/i18n";
import ConfirmModal from "@/components/ConfirmModal";
import UploadProgressBar from "@/components/UploadProgressBar";
import { uploadFile, uploadFiles as uploadFilesUtil, type UploadProgress, IMAGE_QUALITY_OPTIONS, type ImageQuality } from "@/lib/upload";

interface Highlight {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  imageUrls: string[];
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
  const { t } = useI18n();
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [form, setForm] = useState({ title: "", description: "", imageUrl: "" });
  const [pendingImages, setPendingImages] = useState<{ file: File; previewUrl: string }[]>([]);
  const pendingImagesRef = useRef<{ file: File; previewUrl: string }[]>([]);
  useEffect(() => {
    pendingImagesRef.current = pendingImages;
  }, [pendingImages]);

  useEffect(() => {
    return () => {
      pendingImagesRef.current.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
  }, []);
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<(UploadProgress & { current?: number; totalFiles?: number }) | null>(null);
  const [imageQuality, setImageQuality] = useState<ImageQuality>("original");

  async function loadData() {
    const res = await fetch("/api/highlights");
    const data = await res.json();
    if (data.data) setHighlights(data.data);
  }

  useEffect(() => { loadData(); }, []);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newItems = files.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
      setPendingImages((prev) => [...prev, ...newItems]);
    }
    e.target.value = "";
  }

  function removePendingFile(index: number) {
    setPendingImages((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (editing) {
      // Editing: upload new pending files and merge with existing
      let imageUrls = [...(form.imageUrl ? [form.imageUrl] : [])];
      // Parse existing imageUrls from form — stored as comma-joined in imageUrl field for edit
      const existingHighlight = highlights.find((h) => h.id === editing);
      if (existingHighlight) {
        imageUrls = [...(existingHighlight.imageUrls?.length ? existingHighlight.imageUrls : (existingHighlight.imageUrl ? [existingHighlight.imageUrl] : []))];
      }
      if (pendingImages.length > 0) {
        try {
          const newUrls = await uploadFilesUtil(pendingImages.map((img) => img.file), (p) => setUploadProgress(p), imageQuality);
          imageUrls = [...imageUrls, ...newUrls];
        } catch (err) {
          alert(err instanceof Error ? err.message : "Upload gagal");
          setLoading(false);
          setUploadProgress(null);
          return;
        }
      }
      setUploadProgress(null);
      await fetch(`/api/highlights/${editing}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title, description: form.description, imageUrl: imageUrls[0] || null, imageUrls }),
      });
    } else {
      // Adding new: all images go into ONE post
      let imageUrls: string[] = [];
      if (pendingImages.length > 0) {
        try {
          imageUrls = await uploadFilesUtil(pendingImages.map((img) => img.file), (p) => setUploadProgress(p), imageQuality);
        } catch (err) {
          alert(err instanceof Error ? err.message : "Upload gagal");
          setLoading(false);
          setUploadProgress(null);
          return;
        }
        setUploadProgress(null);
      }
      await fetch("/api/highlights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, imageUrl: imageUrls[0] || form.imageUrl || null, imageUrls }),
      });
    }

    setForm({ title: "", description: "", imageUrl: "" });
    setPendingImages((prev) => {
      prev.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      return [];
    });
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
    setPendingImages((prev) => {
      prev.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      return [];
    });
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">{t("highlights")}</h1>

      <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl p-6 mb-8 space-y-4 max-w-2xl">
        <h2 className="text-lg font-semibold text-white">
          {editing ? t("editHighlight") : t("addHighlight")}
        </h2>
        <input
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder={t("caption")}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 admin-input"
          required
        />
        <div>
          <label className="block text-gray-300 text-sm mb-1">{t("descriptionOptional")}</label>
          <RichTextEditor
            value={form.description}
            onChange={(val) => setForm((f) => ({ ...f, description: val }))}
          />
        </div>
        <div>
          <label className="block text-gray-300 text-sm mb-1">{t("photoMultiple")}</label>
          <p className="text-gray-500 text-xs mb-2">{t("recommendPhotoSize")}</p>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg cursor-pointer transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              {t("chooseFile")}
              <input type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
            </label>
            <div className="flex items-center gap-2">
              <label className="text-gray-400 text-xs">{t("imageQuality")}:</label>
              <select
                value={imageQuality}
                onChange={(e) => setImageQuality(e.target.value as ImageQuality)}
                className="px-2 py-1 bg-gray-700 text-white rounded text-xs border border-gray-600"
              >
                {IMAGE_QUALITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}{opt.desc ? ` (${opt.desc})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {(form.imageUrl || pendingImages.length > 0) && (
            <div className="mt-2 flex flex-wrap gap-2">
              {!editing && form.imageUrl && (
                <div className="relative group">
                  <img src={form.imageUrl} alt="" className="w-32 h-24 object-cover rounded" />
                  <button type="button" onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold opacity-80 group-hover:opacity-100 transition">✕</button>
                </div>
              )}
              {editing && !pendingImages.length && form.imageUrl && (
                <div className="relative group">
                  <img src={form.imageUrl} alt="" className="w-32 h-24 object-cover rounded" />
                  <button type="button" onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold opacity-80 group-hover:opacity-100 transition">✕</button>
                </div>
              )}
              {pendingImages.map((img, idx) => (
                <div key={`pending-${idx}`} className="relative group">
                  <img src={img.previewUrl} alt="" className="w-32 h-24 object-cover rounded border-2 border-dashed border-yellow-500" />
                  <button type="button" onClick={() => removePendingFile(idx)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold opacity-80 group-hover:opacity-100 transition">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-3">
          {uploadProgress && (
            <div className="max-w-md">
              <UploadProgressBar progress={uploadProgress} />
            </div>
          )}
          <div className="flex gap-2">
          <button type="submit" disabled={loading}
            className="px-6 py-2 admin-btn-primary rounded-lg transition disabled:opacity-50">
            {loading ? t("uploadingAndSaving") : editing ? t("update") : t("save")}
          </button>
          {editing && (
            <button type="button" onClick={() => {
              setEditing(null);
              setForm({ title: "", description: "", imageUrl: "" });
              setPendingImages((prev) => {
                prev.forEach((img) => URL.revokeObjectURL(img.previewUrl));
                return [];
              });
            }}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition">{t("cancel")}</button>
          )}
          </div>
        </div>
      </form>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {highlights.map((h) => {
          const allImages = h.imageUrls?.length ? h.imageUrls : (h.imageUrl ? [h.imageUrl] : []);
          return (
            <div key={h.id} className="bg-gray-800 rounded-xl overflow-hidden group relative">
              {allImages.length > 0 ? (
                <div className="relative">
                  <img src={allImages[0]} alt={h.title} className="w-full h-40 object-cover" />
                  {allImages.length > 1 && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 text-white text-xs rounded-full">
                      📷 {allImages.length}
                    </span>
                  )}
                </div>
              ) : (
                <div className="w-full h-40 bg-gray-700 flex items-center justify-center text-gray-500">{t("noImage")}</div>
              )}
              <div className="p-3">
                <p className="text-white text-sm font-medium truncate">{h.title}</p>
              </div>
              <div className="absolute top-2 right-2 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
                <button onClick={() => handleEdit(h)} className="p-1.5 bg-blue-600 text-white rounded text-xs">{t("edit")}</button>
                <button onClick={() => setDeleteId(h.id)} className="p-1.5 bg-red-600 text-white rounded text-xs">{t("delete")}</button>
              </div>
            </div>
          );
        })}
      </div>
      {highlights.length === 0 && <p className="text-gray-500">{t("noHighlightsYet")}</p>}

      <ConfirmModal
        open={!!deleteId}
        title={t("deletePhotoTitle")}
        message={t("deletePhotoMessage")}
        confirmText={t("delete")}
        cancelText={t("cancel")}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

"use client";

import { useEffect, useState, useMemo } from "react";
import { useAdminTheme } from "@/lib/admin-theme";
import { useI18n } from "@/lib/i18n";
import ConfirmModal from "@/components/ConfirmModal";
import UploadProgressBar from "@/components/UploadProgressBar";
import { uploadFile, type UploadProgress } from "@/lib/upload";

interface VoteOptionItem {
  id: string;
  name: string;
  imageUrl: string | null;
  _count: { responses: number };
}

interface VoteItem {
  id: string;
  title: string;
  status: string;
  options: VoteOptionItem[];
  createdAt: string;
}

interface OptionForm {
  name: string;
  imageUrl: string;
  pendingFile?: File | null;
}

export default function VotesPage() {
  const { primary } = useAdminTheme();
  const { t } = useI18n();
  const [votes, setVotes] = useState<VoteItem[]>([]);
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState<OptionForm[]>([{ name: "", imageUrl: "" }]);
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<(UploadProgress & { current?: number; totalFiles?: number }) | null>(null);

  async function loadData() {
    const res = await fetch("/api/votes");
    const data = await res.json();
    if (data.data) setVotes(data.data);
  }

  useEffect(() => { loadData(); }, []);

  function handleOptionFileSelect(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setOptions((prev) => prev.map((opt, i) => i === index ? { ...opt, pendingFile: file } : opt));
    e.target.value = "";
  }

  function removeOptionImage(index: number) {
    setOptions((prev) => prev.map((opt, i) => i === index ? { ...opt, imageUrl: "", pendingFile: null } : opt));
  }

  function addOption() {
    setOptions((prev) => [...prev, { name: "", imageUrl: "" }]);
  }

  function removeOption(index: number) {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }

  function updateOptionName(index: number, name: string) {
    setOptions((prev) => prev.map((opt, i) => i === index ? { ...opt, name } : opt));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);

    // Upload pending files first
    const filesToUpload = options.filter((o) => o.name.trim() && o.pendingFile);
    let uploadIdx = 0;
    const resolvedOptions = [];
    for (const o of options.filter((o) => o.name.trim())) {
      let imageUrl = o.imageUrl || undefined;
      if (o.pendingFile) {
        try {
          uploadIdx++;
          imageUrl = await uploadFile(o.pendingFile, (p) => {
            setUploadProgress({ ...p, current: uploadIdx, totalFiles: filesToUpload.length });
          });
        } catch {
          alert("Gagal upload gambar.");
        }
      }
      resolvedOptions.push({ name: o.name, imageUrl });
    }
    setUploadProgress(null);

    const payload = { title, options: resolvedOptions };

    if (editing) {
      await fetch(`/api/votes/${editing}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setTitle("");
    setOptions([{ name: "", imageUrl: "" }]);
    setEditing(null);
    setLoading(false);
    loadData();
  }

  function startEdit(vote: VoteItem) {
    setEditing(vote.id);
    setTitle(vote.title);
    setOptions(
      vote.options.length > 0
        ? vote.options.map((o) => ({ name: o.name, imageUrl: o.imageUrl || "" }))
        : [{ name: "", imageUrl: "" }]
    );
  }

  async function toggleStatus(vote: VoteItem) {
    const newStatus = vote.status === "open" ? "closed" : "open";
    await fetch(`/api/votes/${vote.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    loadData();
  }

  async function confirmDelete() {
    if (!deleteId) return;
    await fetch(`/api/votes/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    loadData();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">{t("votingTitle")}</h1>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl p-6 mb-8 space-y-4">
        <h2 className="text-lg font-semibold text-white">
          {editing ? t("editVote") : t("createVote")}
        </h2>
        <div>
          <label className="block text-sm text-gray-300 mb-1">{t("voteTitle")}</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("voteTitlePlaceholder")}
            className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2"
            style={{ "--tw-ring-color": primary } as React.CSSProperties}
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-2">{t("voteOptions")}</label>
          <div className="space-y-3">
            {options.map((opt, i) => (
              <div key={i} className="flex gap-3 items-start bg-gray-700 rounded-lg p-3">
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={opt.name}
                    onChange={(e) => updateOptionName(i, e.target.value)}
                    placeholder={t("optionNamePlaceholder")}
                    className="w-full px-3 py-2 rounded bg-gray-600 text-white border border-gray-500 focus:outline-none"
                  />
                  {(opt.imageUrl || opt.pendingFile) ? (
                    <div className="relative inline-block">
                      <img src={opt.pendingFile ? URL.createObjectURL(opt.pendingFile) : opt.imageUrl} alt={opt.name} className={`w-24 h-24 object-cover rounded ${opt.pendingFile ? "border-2 border-dashed border-yellow-500" : ""}`} />
                      <button
                        type="button"
                        onClick={() => removeOptionImage(i)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full text-xs hover:bg-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-lg cursor-pointer transition">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        {t("uploadImage")}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleOptionFileSelect(i, e)}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-1">📐 800×800 px (1:1)</p>
                    </div>
                  )}
                </div>
                {options.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeOption(i)}
                    className="text-red-400 hover:text-red-300 text-xl mt-1"
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addOption}
            className="mt-3 px-4 py-2 text-sm rounded-lg border border-dashed border-gray-500 text-gray-300 hover:border-gray-400 hover:text-white transition"
          >
            + {t("addOption")}
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {uploadProgress && (
            <div className="max-w-md">
              <UploadProgressBar progress={uploadProgress} />
            </div>
          )}
          <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 text-white rounded-lg font-medium transition"
            style={{ backgroundColor: primary }}
          >
            {loading ? "..." : editing ? t("editVote") : t("createVote")}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => { setEditing(null); setTitle(""); setOptions([{ name: "", imageUrl: "" }]); }}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg"
            >
              {t("cancel")}
            </button>
          )}
          </div>
        </div>
      </form>

      {/* Vote List */}
      <div className="space-y-4">
        {votes.map((vote) => {
          const totalVotes = vote.options.reduce((sum, o) => sum + o._count.responses, 0);
          return (
            <div key={vote.id} className="bg-gray-800 rounded-xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">{vote.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded ${vote.status === "open" ? "bg-green-600" : "bg-red-600"} text-white`}>
                    {vote.status === "open" ? "Open" : "Closed"}
                  </span>
                  <span className="text-xs text-gray-400 ml-2">{t("totalVotes")}: {totalVotes}</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => toggleStatus(vote)}
                    className="px-3 py-1 text-sm rounded bg-gray-600 text-white hover:bg-gray-500 transition"
                  >
                    {vote.status === "open" ? "Close" : "Open"}
                  </button>
                  <button
                    onClick={() => startEdit(vote)}
                    className="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 transition"
                  >
                    {t("edit")}
                  </button>
                  <button
                    onClick={() => setDeleteId(vote.id)}
                    className="px-3 py-1 text-sm rounded bg-red-600 text-white hover:bg-red-700 transition"
                  >
                    {t("delete")}
                  </button>
                </div>
              </div>
              {/* Options with results */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {vote.options.map((opt) => {
                  const percent = totalVotes > 0 ? Math.round((opt._count.responses / totalVotes) * 100) : 0;
                  return (
                    <div key={opt.id} className="bg-gray-700 rounded-lg p-3 text-center">
                      {opt.imageUrl && (
                        <img src={opt.imageUrl} alt={opt.name} className="w-full h-32 object-cover rounded mb-2" />
                      )}
                      <p className="text-white text-sm font-medium">{opt.name}</p>
                      <div className="mt-2 bg-gray-600 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${percent}%`, backgroundColor: primary }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {opt._count.responses} {t("voteCount")} ({percent}%)
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {votes.length === 0 && (
          <p className="text-gray-500 text-center py-8">{t("noVotesYet")}</p>
        )}
      </div>

      <ConfirmModal
        open={!!deleteId}
        title={t("deleteVoteTitle")}
        message={t("deleteVoteMessage")}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

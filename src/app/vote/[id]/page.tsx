"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useI18n, LanguageToggle } from "@/lib/i18n";

interface VoteOption {
  id: string;
  name: string;
  imageUrl: string | null;
  _count: { responses: number };
}

interface VoteDetail {
  id: string;
  title: string;
  status: string;
  options: VoteOption[];
  createdAt: string;
}

export default function VotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useI18n();

  const [vote, setVote] = useState<VoteDetail | null>(null);
  const [settings, setSettings] = useState<{ primaryColor: string; accentColor: string } | null>(null);
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);

  async function loadVote() {
    const res = await fetch(`/api/votes/${id}`);
    const data = await res.json();
    if (data.data) {
      setVote(data.data);
    } else {
      setNotFound(true);
    }
  }

  useEffect(() => {
    loadVote();
    fetch("/api/settings").then((r) => r.json()).then((d) => {
      if (d.data) setSettings({ primaryColor: d.data.primaryColor, accentColor: d.data.accentColor });
    });
    // Check localStorage for previous vote
    const stored = localStorage.getItem(`vote_${id}`);
    if (stored) setVotedOptionId(stored);
  }, [id]);

  const primary = settings?.primaryColor || "#16a34a";
  const accent = settings?.accentColor || "#fbbf24";

  async function handleVote(optionId: string) {
    if (votedOptionId) return;
    const res = await fetch(`/api/votes/${id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId }),
    });
    if (res.ok) {
      setVotedOptionId(optionId);
      localStorage.setItem(`vote_${id}`, optionId);
      loadVote();
    }
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">{t("voteNotFound")}</p>
          <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition hover:opacity-90" style={{ backgroundColor: primary }}>{t("backToHome")}</Link>
        </div>
      </div>
    );
  }

  if (!vote) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">{t("loading")}</div>
      </div>
    );
  }

  const totalVotes = vote.options.reduce((sum, o) => sum + o._count.responses, 0);
  const isClosed = vote.status !== "open";
  const hasVoted = !!votedOptionId;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="fixed top-4 right-4 z-50">
        <LanguageToggle />
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-lg text-sm font-medium text-white transition hover:opacity-90" style={{ backgroundColor: primary }}>
          {t("backToHome")}
        </Link>

        <h1 className="text-3xl font-bold mb-2">{vote.title}</h1>

        {isClosed && (
          <p className="text-red-400 text-sm mb-4">{t("voteClosed")}</p>
        )}
        {hasVoted && !isClosed && (
          <p className="text-green-400 text-sm mb-4">✓ {t("voteSuccess")}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
          {vote.options.map((opt) => {
            const percent = totalVotes > 0 ? Math.round((opt._count.responses / totalVotes) * 100) : 0;
            const isSelected = votedOptionId === opt.id;
            const showResults = hasVoted || isClosed;
            return (
              <button
                key={opt.id}
                onClick={() => handleVote(opt.id)}
                disabled={hasVoted || isClosed}
                className={`bg-gray-800 rounded-xl p-4 text-center transition ${
                  isSelected ? "ring-2" : ""
                } ${hasVoted || isClosed ? "cursor-default" : "cursor-pointer hover:bg-gray-700 hover:ring-2"}`}
                style={{ "--tw-ring-color": primary } as React.CSSProperties}
              >
                {opt.imageUrl && (
                  <div className="relative group mb-3">
                    <img src={opt.imageUrl} alt={opt.name} className="w-full h-40 object-cover rounded-lg" />
                    <div
                      onClick={(e) => { e.stopPropagation(); setPreviewImage({ url: opt.imageUrl!, name: opt.name }); }}
                      className="absolute inset-0 bg-black/0 hover:bg-black/30 active:bg-black/30 transition flex items-center justify-center rounded-lg cursor-pointer"
                    >
                      <span className="text-white text-2xl opacity-70 sm:opacity-0 group-hover:opacity-100 transition">🔍</span>
                    </div>
                  </div>
                )}
                <p className="text-white font-semibold">{opt.name}</p>
                {showResults && (
                  <div className="mt-3">
                    <div className="bg-gray-600 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${percent}%`, backgroundColor: primary }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {opt._count.responses} {t("voteCount")} ({percent}%)
                    </p>
                  </div>
                )}
                {!showResults && (
                  <p className="text-xs mt-3 font-medium text-white">{t("voteNow")}</p>
                )}
              </button>
            );
          })}
        </div>

        {(hasVoted || isClosed) && (
          <p className="text-sm text-gray-500 mt-4">{t("totalVotes")}: {totalVotes}</p>
        )}
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setPreviewImage(null)}>
          <div className="max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={previewImage.url} alt={previewImage.name} className="w-full rounded-2xl shadow-2xl" />
            <div className="flex items-center justify-between mt-3">
              <p className="text-white font-semibold">{previewImage.name}</p>
              <button onClick={() => setPreviewImage(null)}
                className="px-4 py-1.5 rounded-lg text-white text-sm font-medium transition hover:opacity-90"
                style={{ backgroundColor: primary }}>
                {t("close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

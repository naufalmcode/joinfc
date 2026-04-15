"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useI18n, LanguageToggle } from "@/lib/i18n";

interface HighlightDetail {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
}

export default function HighlightPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useI18n();

  const [highlight, setHighlight] = useState<HighlightDetail | null>(null);
  const [settings, setSettings] = useState<{ primaryColor: string; accentColor: string } | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/highlights/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setHighlight(d.data);
        else setNotFound(true);
      });
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setSettings({ primaryColor: d.data.primaryColor, accentColor: d.data.accentColor });
      });
  }, [id]);

  const primary = settings?.primaryColor || "#16a34a";

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">{t("loading")}</p>
          <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition hover:opacity-90" style={{ backgroundColor: primary }}>{t("backToHome")}</Link>
        </div>
      </div>
    );
  }

  if (!highlight) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">{t("loading")}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="fixed top-4 right-4 z-50">
        <LanguageToggle />
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-lg text-sm font-medium text-white transition hover:opacity-90" style={{ backgroundColor: primary }}>
          {t("backToHome")}
        </Link>

        <div className="bg-gray-800 rounded-2xl overflow-hidden shadow-2xl">
          {highlight.imageUrl && (
            <img
              src={highlight.imageUrl}
              alt={highlight.title}
              className="w-full max-h-[60vh] object-cover"
            />
          )}
          <div className="p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold">{highlight.title}</h1>
            {highlight.description && (
              <div
                className="text-gray-300 mt-4 text-sm md:text-base leading-relaxed rich-text"
                dangerouslySetInnerHTML={{ __html: highlight.description }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

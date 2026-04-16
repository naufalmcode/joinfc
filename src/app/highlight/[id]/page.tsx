"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { useI18n, LanguageToggle } from "@/lib/i18n";

interface HighlightDetail {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  imageUrls: string[];
  createdAt: string;
}

export default function HighlightPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useI18n();

  const [highlight, setHighlight] = useState<HighlightDetail | null>(null);
  const [settings, setSettings] = useState<{ primaryColor: string; accentColor: string } | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

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

  const images = highlight?.imageUrls?.length ? highlight.imageUrls : (highlight?.imageUrl ? [highlight.imageUrl] : []);
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
          <img src={images[currentSlide]} alt={`${highlight.title} ${currentSlide + 1}`} className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, idx) => (
                <button key={idx} onClick={(e) => { e.stopPropagation(); setCurrentSlide(idx); }} className={`w-2.5 h-2.5 rounded-full transition ${idx === currentSlide ? "bg-white" : "bg-white/40"}`} />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-lg text-sm font-medium text-white transition hover:opacity-90" style={{ backgroundColor: primary }}>
          {t("backToHome")}
        </Link>

        <div className="bg-gray-800 rounded-2xl overflow-hidden shadow-2xl">
          {/* Image Carousel */}
          {images.length > 0 && (
            <div className="relative group">
              <img
                src={images[currentSlide]}
                alt={`${highlight.title} ${currentSlide + 1}`}
                className="w-full max-h-[60vh] object-cover cursor-pointer"
                onClick={() => setLightboxOpen(true)}
              />
              {images.length > 1 && (
                <>
                  <button onClick={prevSlide} className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/50 hover:bg-black/70 rounded-full text-white text-xl transition opacity-0 group-hover:opacity-100">&#8249;</button>
                  <button onClick={nextSlide} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/50 hover:bg-black/70 rounded-full text-white text-xl transition opacity-0 group-hover:opacity-100">&#8250;</button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, idx) => (
                      <button key={idx} onClick={() => setCurrentSlide(idx)} className={`w-2 h-2 rounded-full transition ${idx === currentSlide ? "bg-white" : "bg-white/50"}`} />
                    ))}
                  </div>
                  <span className="absolute top-3 right-3 px-2 py-0.5 bg-black/60 text-white text-xs rounded-full">
                    {currentSlide + 1} / {images.length}
                  </span>
                </>
              )}
            </div>
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

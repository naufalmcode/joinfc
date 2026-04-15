"use client";

import { useEffect, useState, useRef } from "react";
import { useAdminTheme } from "@/lib/admin-theme";
import ConfirmModal from "@/components/ConfirmModal";
import UploadProgressBar from "@/components/UploadProgressBar";
import { uploadFile, type UploadProgress } from "@/lib/upload";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function SettingsPage() {
  const { primary } = useAdminTheme();
  const { t } = useI18n();
  const [settings, setSettings] = useState({
    siteName: "",
    description: "",
    logoUrl: "",
    primaryColor: "#16a34a",
    secondaryColor: "#065f46",
    accentColor: "#fbbf24",
    instagramUrl: "",
    whatsappUrl: "",
    heroType: "gradient",
    heroImageUrl: "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [pendingLogo, setPendingLogo] = useState<File | null>(null);
  const [pendingHero, setPendingHero] = useState<File | null>(null);
  const logoBlobRef = useRef<string | null>(null);
  const heroBlobRef = useRef<string | null>(null);

  function getLogoPreview() {
    if (!pendingLogo) { if (logoBlobRef.current) { URL.revokeObjectURL(logoBlobRef.current); logoBlobRef.current = null; } return null; }
    if (!logoBlobRef.current) logoBlobRef.current = URL.createObjectURL(pendingLogo);
    return logoBlobRef.current;
  }
  function getHeroPreview() {
    if (!pendingHero) { if (heroBlobRef.current) { URL.revokeObjectURL(heroBlobRef.current); heroBlobRef.current = null; } return null; }
    if (!heroBlobRef.current) heroBlobRef.current = URL.createObjectURL(pendingHero);
    return heroBlobRef.current;
  }
  const logoPreview = getLogoPreview();
  const heroPreview = getHeroPreview();

  useEffect(() => { return () => { if (logoBlobRef.current) URL.revokeObjectURL(logoBlobRef.current); if (heroBlobRef.current) URL.revokeObjectURL(heroBlobRef.current); }; }, []);
  const [modal, setModal] = useState<{ open: boolean; message: string }>({ open: false, message: "" });
  const [uploadProgress, setUploadProgress] = useState<(UploadProgress & { current?: number; totalFiles?: number }) | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setSettings({
          siteName: d.data.siteName || "",
          description: d.data.description || "",
          logoUrl: d.data.logoUrl || "",
          primaryColor: d.data.primaryColor || "#16a34a",
          secondaryColor: d.data.secondaryColor || "#065f46",
          accentColor: d.data.accentColor || "#fbbf24",
          instagramUrl: d.data.instagramUrl || "",
          whatsappUrl: d.data.whatsappUrl || "",
          heroType: d.data.heroType || "gradient",
          heroImageUrl: d.data.heroImageUrl || "",
        });
      });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");

    const updated = { ...settings };

    // Upload pending files with progress
    const filesToUpload = [[pendingLogo, "logoUrl"], [pendingHero, "heroImageUrl"]] as const;
    const activeUploads = filesToUpload.filter(([file]) => file);
    for (let i = 0; i < filesToUpload.length; i++) {
      const [file, field] = filesToUpload[i];
      if (file) {
        try {
          const url = await uploadFile(file, (p) => {
            setUploadProgress({ ...p, current: i + 1, totalFiles: activeUploads.length });
          });
          (updated as Record<string, string>)[field] = url;
        } catch (err) {
          setMsg(t("uploadFailed") + (err instanceof Error ? err.message : "Unknown error"));
          setSaving(false);
          setUploadProgress(null);
          return;
        }
      }
    }
    setUploadProgress(null);

    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    const data = await res.json();
    if (data.success) {
      setMsg(t("savedSuccess"));
      setSettings(updated);
      setPendingLogo(null);
      setPendingHero(null);
    } else {
      setMsg(t("saveFailed") + data.error);
    }
    setSaving(false);
  }

  function handleFileSelect(
    e: React.ChangeEvent<HTMLInputElement>,
    field: "logoUrl" | "heroImageUrl"
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (field === "logoUrl") {
      if (logoBlobRef.current) { URL.revokeObjectURL(logoBlobRef.current); logoBlobRef.current = null; }
      setPendingLogo(file);
    } else {
      if (heroBlobRef.current) { URL.revokeObjectURL(heroBlobRef.current); heroBlobRef.current = null; }
      setPendingHero(file);
    }
    e.target.value = "";
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">{t("websiteSettings")}</h1>
      <form onSubmit={handleSave} className="max-w-2xl space-y-6">
        {/* General Info */}
        <div className="bg-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">{t("generalInfo")}</h2>

          <div>
            <label className="block text-gray-300 text-sm mb-1">{t("siteName")}</label>
            <input
              value={settings.siteName}
              onChange={(e) => setSettings((s) => ({ ...s, siteName: e.target.value }))}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 admin-input"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-1">{t("description")}</label>
            <textarea
              value={settings.description}
              onChange={(e) => setSettings((s) => ({ ...s, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 admin-input"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-1">{t("logo")}</label>
            <p className="text-gray-500 text-xs mb-2">{t("recommendLogoSize")}</p>
            <div className="flex items-center gap-4">
              {(pendingLogo ? logoPreview : settings.logoUrl) && (
                <img src={(pendingLogo ? logoPreview : settings.logoUrl)!} alt="Logo" className={`w-16 h-16 object-contain bg-gray-700 rounded ${pendingLogo ? "border-2 border-dashed border-yellow-500" : ""}`} />
              )}
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg cursor-pointer transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                {t("chooseFile")}
                <input type="file" accept="image/*" onChange={(e) => handleFileSelect(e, "logoUrl")} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="bg-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">{t("socialMedia")}</h2>
          <div>
            <label className="block text-gray-300 text-sm mb-1">{t("instagramLink")}</label>
            <div className="flex items-center gap-2">
              <span className="text-pink-500 text-xl">📷</span>
              <input
                value={settings.instagramUrl}
                onChange={(e) => setSettings((s) => ({ ...s, instagramUrl: e.target.value }))}
                placeholder="https://www.instagram.com/joinfc_/"
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 admin-input"
              />
            </div>
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-1">{t("whatsappLink")}</label>
            <div className="flex items-center gap-2">
              <span className="text-green-500 text-xl">💬</span>
              <input
                value={settings.whatsappUrl}
                onChange={(e) => setSettings((s) => ({ ...s, whatsappUrl: e.target.value }))}
                placeholder="https://wa.me/628xxxxxxxxxx"
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 admin-input"
              />
            </div>
          </div>
        </div>

        {/* Hero Background */}
        <div className="bg-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">{t("heroBackground")}</h2>
          <div className="flex flex-wrap gap-4">
            <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer border-2 transition ${settings.heroType === "gradient" ? "bg-gray-700" : "border-gray-600 bg-gray-700/50"}`}
              style={settings.heroType === "gradient" ? { borderColor: primary } : undefined}>
              <input type="radio" name="heroType" value="gradient" checked={settings.heroType === "gradient"}
                onChange={() => setSettings((s) => ({ ...s, heroType: "gradient" }))} className="hidden" />
              <span className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-green-500" />
              <span className="text-white text-sm">{t("heroGradient")}</span>
            </label>
            <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer border-2 transition ${settings.heroType === "image" ? "bg-gray-700" : "border-gray-600 bg-gray-700/50"}`}
              style={settings.heroType === "image" ? { borderColor: primary } : undefined}>
              <input type="radio" name="heroType" value="image" checked={settings.heroType === "image"}
                onChange={() => setSettings((s) => ({ ...s, heroType: "image" }))} className="hidden" />
              <span className="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center text-xs">🖼</span>
              <span className="text-white text-sm">{t("heroImage")}</span>
            </label>
          </div>

          {settings.heroType === "image" && (
            <div>
              <label className="block text-gray-300 text-sm mb-2">{t("uploadHeroImage")}</label>
              <p className="text-gray-500 text-xs mb-2">{t("recommendHeroSize")}</p>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg cursor-pointer transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                {t("chooseFile")}
                <input type="file" accept="image/*" onChange={(e) => handleFileSelect(e, "heroImageUrl")} className="hidden" />
              </label>
              {(pendingHero ? heroPreview : settings.heroImageUrl) && (
                <img src={(pendingHero ? heroPreview : settings.heroImageUrl)!} alt="Hero" className={`mt-2 w-full h-32 object-cover rounded ${pendingHero ? "border-2 border-dashed border-yellow-500" : ""}`} />
              )}
            </div>
          )}
        </div>

        {/* Theme Colors */}
        <div className="bg-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">{t("themeColors")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-300 text-sm mb-1">{t("primary")}</label>
              <div className="flex items-center gap-2">
                <input type="color" value={settings.primaryColor}
                  onChange={(e) => setSettings((s) => ({ ...s, primaryColor: e.target.value }))}
                  className="w-10 h-10 rounded cursor-pointer" />
                <span className="text-gray-400 text-sm">{settings.primaryColor}</span>
              </div>
            </div>
            <div>
              <label className="block text-gray-300 text-sm mb-1">{t("secondary")}</label>
              <div className="flex items-center gap-2">
                <input type="color" value={settings.secondaryColor}
                  onChange={(e) => setSettings((s) => ({ ...s, secondaryColor: e.target.value }))}
                  className="w-10 h-10 rounded cursor-pointer" />
                <span className="text-gray-400 text-sm">{settings.secondaryColor}</span>
              </div>
            </div>
            <div>
              <label className="block text-gray-300 text-sm mb-1">{t("accent")}</label>
              <div className="flex items-center gap-2">
                <input type="color" value={settings.accentColor}
                  onChange={(e) => setSettings((s) => ({ ...s, accentColor: e.target.value }))}
                  className="w-10 h-10 rounded cursor-pointer" />
                <span className="text-gray-400 text-sm">{settings.accentColor}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: settings.primaryColor }}>
            <p className="font-bold" style={{ color: settings.accentColor }}>{t("previewColors")}</p>
            <p className="text-sm" style={{ color: "#fff" }}>{t("previewText")}</p>
          </div>
        </div>

        {msg && (
          <p className={`text-sm ${msg === t("savedSuccess") ? "text-green-400" : "text-red-400"}`}>{msg}</p>
        )}

        {uploadProgress && (
          <div className="max-w-md">
            <UploadProgressBar progress={uploadProgress} />
          </div>
        )}

        <button type="submit" disabled={saving}
          className="px-6 py-3 admin-btn-primary rounded-lg font-semibold transition disabled:opacity-50">
          {saving ? t("saving") : t("saveSettings")}
        </button>
      </form>

      <div className="max-w-2xl mt-6">
        <Link href="/manage-jfc/dashboard/password"
          className="inline-flex items-center gap-2 px-5 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition font-medium">
          🔒 {t("changeAdminPassword")} →
        </Link>
      </div>

      <ConfirmModal open={modal.open} type="alert" message={modal.message}
        confirmText="OK" onConfirm={() => setModal({ open: false, message: "" })} />
    </div>
  );
}

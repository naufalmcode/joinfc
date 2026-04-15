"use client";

import { useEffect, useState } from "react";
import { useAdminTheme } from "@/lib/admin-theme";
import ConfirmModal from "@/components/ConfirmModal";

export default function SettingsPage() {
  const { primary } = useAdminTheme();
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
  const [passwordForm, setPasswordForm] = useState({ current: "", newPassword: "", confirm: "" });
  const [passwordMsg, setPasswordMsg] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [modal, setModal] = useState<{ open: boolean; message: string }>({ open: false, message: "" });

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
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    if (data.success) {
      setMsg("Berhasil disimpan!");
    } else {
      setMsg("Gagal: " + data.error);
    }
    setSaving(false);
  }

  async function handleUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    field: "logoUrl" | "heroImageUrl"
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (data.success) {
      setSettings((s) => ({ ...s, [field]: data.data.url }));
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Pengaturan Website</h1>
      <form onSubmit={handleSave} className="max-w-2xl space-y-6">
        {/* General Info */}
        <div className="bg-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Informasi Umum</h2>

          <div>
            <label className="block text-gray-300 text-sm mb-1">Nama Situs</label>
            <input
              value={settings.siteName}
              onChange={(e) => setSettings((s) => ({ ...s, siteName: e.target.value }))}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 admin-input"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-1">Deskripsi</label>
            <textarea
              value={settings.description}
              onChange={(e) => setSettings((s) => ({ ...s, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 admin-input"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-1">Logo</label>
            <p className="text-gray-500 text-xs mb-2">Rekomendasi: 200 × 200 px (rasio 1:1, format PNG transparan)</p>
            <div className="flex items-center gap-4">
              {settings.logoUrl && (
                <img src={settings.logoUrl} alt="Logo" className="w-16 h-16 object-contain bg-gray-700 rounded" />
              )}
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg cursor-pointer transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                Pilih File
                <input type="file" accept="image/*" onChange={(e) => handleUpload(e, "logoUrl")} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="bg-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Sosial Media</h2>
          <div>
            <label className="block text-gray-300 text-sm mb-1">Link Instagram</label>
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
            <label className="block text-gray-300 text-sm mb-1">Link WhatsApp</label>
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
          <h2 className="text-lg font-semibold text-white">Background Header</h2>
          <div className="flex gap-4">
            <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer border-2 transition ${settings.heroType === "gradient" ? "bg-gray-700" : "border-gray-600 bg-gray-700/50"}`}
              style={settings.heroType === "gradient" ? { borderColor: primary } : undefined}>
              <input type="radio" name="heroType" value="gradient" checked={settings.heroType === "gradient"}
                onChange={() => setSettings((s) => ({ ...s, heroType: "gradient" }))} className="hidden" />
              <span className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-green-500" />
              <span className="text-white text-sm">Gradient Warna</span>
            </label>
            <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer border-2 transition ${settings.heroType === "image" ? "bg-gray-700" : "border-gray-600 bg-gray-700/50"}`}
              style={settings.heroType === "image" ? { borderColor: primary } : undefined}>
              <input type="radio" name="heroType" value="image" checked={settings.heroType === "image"}
                onChange={() => setSettings((s) => ({ ...s, heroType: "image" }))} className="hidden" />
              <span className="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center text-xs">🖼</span>
              <span className="text-white text-sm">Gambar</span>
            </label>
          </div>

          {settings.heroType === "image" && (
            <div>
              <label className="block text-gray-300 text-sm mb-2">Upload Gambar Header</label>
              <p className="text-gray-500 text-xs mb-2">Rekomendasi: 1920 × 600 px (rasio 16:5, landscape)</p>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg cursor-pointer transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Pilih File
                <input type="file" accept="image/*" onChange={(e) => handleUpload(e, "heroImageUrl")} className="hidden" />
              </label>
              {settings.heroImageUrl && (
                <img src={settings.heroImageUrl} alt="Hero" className="mt-2 w-full h-32 object-cover rounded" />
              )}
            </div>
          )}
        </div>

        {/* Theme Colors */}
        <div className="bg-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Warna Tema</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-300 text-sm mb-1">Primary</label>
              <div className="flex items-center gap-2">
                <input type="color" value={settings.primaryColor}
                  onChange={(e) => setSettings((s) => ({ ...s, primaryColor: e.target.value }))}
                  className="w-10 h-10 rounded cursor-pointer" />
                <span className="text-gray-400 text-sm">{settings.primaryColor}</span>
              </div>
            </div>
            <div>
              <label className="block text-gray-300 text-sm mb-1">Secondary</label>
              <div className="flex items-center gap-2">
                <input type="color" value={settings.secondaryColor}
                  onChange={(e) => setSettings((s) => ({ ...s, secondaryColor: e.target.value }))}
                  className="w-10 h-10 rounded cursor-pointer" />
                <span className="text-gray-400 text-sm">{settings.secondaryColor}</span>
              </div>
            </div>
            <div>
              <label className="block text-gray-300 text-sm mb-1">Accent</label>
              <div className="flex items-center gap-2">
                <input type="color" value={settings.accentColor}
                  onChange={(e) => setSettings((s) => ({ ...s, accentColor: e.target.value }))}
                  className="w-10 h-10 rounded cursor-pointer" />
                <span className="text-gray-400 text-sm">{settings.accentColor}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: settings.primaryColor }}>
            <p className="font-bold" style={{ color: settings.accentColor }}>Preview Warna Tema</p>
            <p className="text-sm" style={{ color: "#fff" }}>Ini adalah preview warna yang dipilih</p>
          </div>
        </div>

        {msg && (
          <p className={`text-sm ${msg.startsWith("Gagal") ? "text-red-400" : "text-green-400"}`}>{msg}</p>
        )}

        <button type="submit" disabled={saving}
          className="px-6 py-3 admin-btn-primary rounded-lg font-semibold transition disabled:opacity-50">
          {saving ? "Menyimpan..." : "Simpan Pengaturan"}
        </button>
      </form>

      {/* Change Password Section */}
      <form onSubmit={async (e) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirm) {
          setPasswordMsg("Password baru tidak cocok!");
          return;
        }
        if (passwordForm.newPassword.length < 6) {
          setPasswordMsg("Password minimal 6 karakter!");
          return;
        }
        setSavingPassword(true);
        setPasswordMsg("");
        const res = await fetch("/api/settings/password", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPassword: passwordForm.current, newPassword: passwordForm.newPassword }),
        });
        const data = await res.json();
        if (data.success) {
          setPasswordMsg("Password berhasil diubah!");
          setPasswordForm({ current: "", newPassword: "", confirm: "" });
        } else {
          setPasswordMsg("Gagal: " + (data.error || "Error"));
        }
        setSavingPassword(false);
      }} className="max-w-2xl mt-6 space-y-6">
        <div className="bg-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Ubah Password Admin</h2>
          <div>
            <label className="block text-gray-300 text-sm mb-1">Password Saat Ini</label>
            <input type="password" value={passwordForm.current}
              onChange={(e) => setPasswordForm((f) => ({ ...f, current: e.target.value }))}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 admin-input" required />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-1">Password Baru</label>
            <input type="password" value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 admin-input" required />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-1">Konfirmasi Password Baru</label>
            <input type="password" value={passwordForm.confirm}
              onChange={(e) => setPasswordForm((f) => ({ ...f, confirm: e.target.value }))}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 admin-input" required />
          </div>
          {passwordMsg && (
            <p className={`text-sm ${passwordMsg.startsWith("Gagal") ? "text-red-400" : "text-green-400"}`}>{passwordMsg}</p>
          )}
          <button type="submit" disabled={savingPassword}
            className="px-6 py-3 admin-btn-primary rounded-lg font-semibold transition disabled:opacity-50">
            {savingPassword ? "Menyimpan..." : "Ubah Password"}
          </button>
        </div>
      </form>

      <ConfirmModal open={modal.open} type="alert" message={modal.message}
        confirmText="OK" onConfirm={() => setModal({ open: false, message: "" })} />
    </div>
  );
}

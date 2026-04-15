"use client";

import { useState } from "react";
import { useAdminTheme } from "@/lib/admin-theme";
import { useI18n } from "@/lib/i18n";
import Link from "next/link";

export default function PasswordPage() {
  const { primary } = useAdminTheme();
  const { t } = useI18n();
  const [form, setForm] = useState({ current: "", newPassword: "", confirm: "" });
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.newPassword !== form.confirm) {
      setMsg(t("passwordMismatch"));
      setIsError(true);
      return;
    }
    if (form.newPassword.length < 6) {
      setMsg(t("passwordMinLength"));
      setIsError(true);
      return;
    }
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/settings/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: form.current, newPassword: form.newPassword }),
    });
    const data = await res.json();
    if (data.success) {
      setMsg(t("passwordChanged"));
      setIsError(false);
      setForm({ current: "", newPassword: "", confirm: "" });
    } else {
      setMsg(t("saveFailed") + (data.error || "Error"));
      setIsError(true);
    }
    setSaving(false);
  }

  const ic = "w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 admin-input";

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link href="/manage-jfc/dashboard/settings" className="text-gray-400 hover:text-white transition">
          ← {t("back")}
        </Link>
        <h1 className="text-3xl font-bold text-white">{t("changeAdminPassword")}</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-md space-y-6">
        <div className="bg-gray-800 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-gray-300 text-sm mb-1">{t("currentPassword")}</label>
            <input type="password" value={form.current}
              onChange={(e) => setForm((f) => ({ ...f, current: e.target.value }))}
              className={ic} required />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-1">{t("newPassword")}</label>
            <input type="password" value={form.newPassword}
              onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
              className={ic} required />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-1">{t("confirmPassword")}</label>
            <input type="password" value={form.confirm}
              onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
              className={ic} required />
          </div>
          {msg && (
            <p className={`text-sm ${isError ? "text-red-400" : "text-green-400"}`}>{msg}</p>
          )}
          <button type="submit" disabled={saving}
            className="px-6 py-3 admin-btn-primary rounded-lg font-semibold transition disabled:opacity-50">
            {saving ? t("saving") : t("changePassword")}
          </button>
        </div>
      </form>
    </div>
  );
}

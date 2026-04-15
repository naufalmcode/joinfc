"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t } = useI18n();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const data = await res.json();
    if (data.success) {
      router.push("/manage-jfc/dashboard");
    } else {
      setError(data.error || t("loginFailed"));
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">{t("adminTitle")}</h1>
          <p className="text-gray-400 mt-2">{t("loginPrompt")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("password")}
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 admin-input"
              required
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 admin-btn-primary rounded-lg font-semibold transition disabled:opacity-50"
          >
            {loading ? t("loading") : t("login")}
          </button>
        </form>
      </div>
    </div>
  );
}

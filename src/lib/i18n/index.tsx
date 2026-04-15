"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations, Locale, TranslationKey } from "./translations";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: "id",
  setLocale: () => {},
  t: (key) => translations.id[key],
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("id");

  useEffect(() => {
    const saved = localStorage.getItem("jfc_lang") as Locale | null;
    if (saved && (saved === "id" || saved === "en")) {
      setLocaleState(saved);
    }
  }, []);

  function setLocale(l: Locale) {
    setLocaleState(l);
    localStorage.setItem("jfc_lang", l);
  }

  function t(key: TranslationKey): string {
    return translations[locale][key] || translations.id[key] || key;
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export function LanguageToggle() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex items-center gap-1 bg-gray-800 rounded-full p-1">
      <button
        onClick={() => setLocale("id")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${
          locale === "id" ? "bg-green-600 text-white" : "text-gray-400 hover:text-white"
        }`}
      >
        <svg className="w-4 h-3 rounded-sm overflow-hidden flex-shrink-0" viewBox="0 0 20 14">
          <rect width="20" height="7" fill="#FF0000" />
          <rect y="7" width="20" height="7" fill="#FFFFFF" />
        </svg>
        ID
      </button>
      <button
        onClick={() => setLocale("en")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${
          locale === "en" ? "bg-green-600 text-white" : "text-gray-400 hover:text-white"
        }`}
      >
        <svg className="w-4 h-3 rounded-sm overflow-hidden flex-shrink-0" viewBox="0 0 60 30">
          <clipPath id="s"><path d="M0,0 v30 h60 v-30 z"/></clipPath>
          <clipPath id="t"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath>
          <g clipPath="url(#s)">
            <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
            <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
            <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t)" stroke="#C8102E" strokeWidth="4"/>
            <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
            <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
          </g>
        </svg>
        EN
      </button>
    </div>
  );
}

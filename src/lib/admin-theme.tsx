"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface AdminTheme {
  primary: string;
  secondary: string;
  accent: string;
  loaded: boolean;
}

const AdminThemeContext = createContext<AdminTheme>({
  primary: "#16a34a",
  secondary: "#065f46",
  accent: "#fbbf24",
  loaded: false,
});

export function AdminThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<AdminTheme>({
    primary: "#16a34a",
    secondary: "#065f46",
    accent: "#fbbf24",
    loaded: false,
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          setTheme({
            primary: d.data.primaryColor || "#16a34a",
            secondary: d.data.secondaryColor || "#065f46",
            accent: d.data.accentColor || "#fbbf24",
            loaded: true,
          });
        }
      });
  }, []);

  return (
    <AdminThemeContext.Provider value={theme}>
      <div
        style={{
          ["--admin-primary" as string]: theme.primary,
          ["--admin-secondary" as string]: theme.secondary,
          ["--admin-accent" as string]: theme.accent,
        }}
      >
        {children}
      </div>
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  return useContext(AdminThemeContext);
}

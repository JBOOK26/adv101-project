"use client";

import { useEffect, useState } from "react";
import useLocalStorage from "./useLocalStorage";

export default function ThemeToggle() {
  const [theme, setTheme] = useLocalStorage("theme", "dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    try {
      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-theme", theme || "dark");
      }
    } catch {}
  }, [theme]);

  function toggle() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  // Render a deterministic placeholder on the server / before mount to avoid
  // hydration mismatches. Only render dynamic aria/title and icon after mount.
  const ariaLabel = mounted
    ? `Switch to ${theme === "dark" ? "light" : "dark"} theme`
    : "Toggle color theme";

  const title = ariaLabel;

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={ariaLabel}
      title={title}
    >
      {mounted ? (
        theme === "dark" ? (
          // sun icon for light (we show opposite because clicking switches)
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 22v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 12H2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 12h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5 5l-1.5-1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19 19l-1.5-1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5 19L3.5 20.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19 5l-1.5-1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          // moon icon
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )
      ) : (
        // placeholder: simple neutral circle to keep layout stable
        <span style={{ display: "inline-block", width: 16, height: 16, borderRadius: 8, background: "currentColor", opacity: 0.08 }} />
      )}
    </button>
  );
}

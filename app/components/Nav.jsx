"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Nav() {
  const router = useRouter();

  // theme state (for top-right button)
  const [theme, setTheme] = useState("light");

  // profile dropdown
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // user name + avatar
  const [userName, setUserName] = useState("User");
  const [avatar, setAvatar] = useState(null); // data URL for uploaded image
  const fileInputRef = useRef(null);

  /* ---------------- INITIAL LOAD ---------------- */
  useEffect(() => {
    if (typeof window === "undefined") return;

    // theme
    const storedTheme = window.localStorage.getItem("theme");
    const initialTheme = storedTheme === "dark" ? "dark" : "light";
    setTheme(initialTheme);
    document.documentElement.dataset.theme = initialTheme;

    // name
    const storedName = window.localStorage.getItem("userName");
    if (storedName) setUserName(storedName);

    // avatar
    const storedAvatar = window.localStorage.getItem("userAvatar");
    if (storedAvatar) setAvatar(storedAvatar);
  }, []);

  /* ---------------- THEME TOGGLE (NAV ONLY) ---------------- */
  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("theme", next);
    }
    document.documentElement.dataset.theme = next;
  }

  /* ---------------- PROFILE DROPDOWN BEHAVIOR ---------------- */
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    } finally {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("userName");
        // Keep userAvatar persisted across logout/login
      }
      router.push("/auth/login");
    }
  }

  /* ---------------- AVATAR UPLOAD HANDLERS ---------------- */
  function triggerFilePicker() {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      setAvatar(result);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("userAvatar", result);
      }
    };
    reader.readAsDataURL(file);
  }

  function clearAvatar() {
    setAvatar(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("userAvatar");
    }
  }

  const initial = userName?.trim()?.charAt(0)?.toUpperCase() || "U";

  return (
    <header className="container" style={{ marginBottom: 6 }}>
      <nav className="nav">
        {/* LEFT: brand + links */}
        <div className="nav-left">
          <div>
            <div className="nav-brand">Inventory</div>
            <div className="small" style={{ marginTop: 0 }}>
              lightweight
            </div>
          </div>

          <div className="nav-links">
            <Link href="/products">Products</Link>
            <Link href="/sales/new">Record Sale</Link>
            <Link href="/sales">Sales</Link>
          </div>
        </div>

        {/* RIGHT: theme toggle + profile */}
        <div className="nav-right">
          {/* theme toggle (outside menu) */}
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle color theme"
          >
            <span style={{ fontSize: 16 }}>
              {theme === "light" ? "🌞" : "🌙"}
            </span>
            <span className="small">
              {theme === "light" ? "Light" : "Dark"} mode
            </span>
          </button>

          {/* profile avatar + dropdown */}
          <div ref={menuRef} style={{ position: "relative" }}>
            <button
              type="button"
              className="avatar-wrapper"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Open profile menu"
            >
              {avatar ? (
                <img
                  src={avatar}
                  alt="Profile"
                  className="avatar-img"
                />
              ) : (
                <span className="avatar-initial">{initial}</span>
              )}
            </button>

            {/* hidden file input for avatar upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleAvatarChange}
            />

            {menuOpen && (
              <div
                className="card"
                style={{
                  position: "absolute",
                  right: 0,
                  top: "115%",
                  minWidth: 230,
                  padding: 12,
                  borderRadius: 16,
                  boxShadow: "0 18px 45px rgba(15,23,42,0.22)",
                  zIndex: 80,
                }}
              >
                {/* mini profile header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <div
                    className="avatar-wrapper"
                    style={{ width: 38, height: 38 }}
                  >
                    {avatar ? (
                      <img
                        src={avatar}
                        alt="Profile"
                        className="avatar-img"
                      />
                    ) : (
                      <span
                        className="avatar-initial"
                        style={{ fontSize: 14 }}
                      >
                        {initial}
                      </span>
                    )}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "var(--text)",
                      }}
                    >
                      {userName || "User"}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--muted)",
                      }}
                    >
                      Inventory manager
                    </div>
                  </div>
                </div>

                <hr
                  style={{
                    border: "none",
                    borderTop: "1px solid var(--border)",
                    margin: "8px 0",
                  }}
                />

                {/* Change / remove photo */}
                <button
                  type="button"
                  className="btn ghost"
                  style={{ width: "100%", justifyContent: "flex-start" }}
                  onClick={triggerFilePicker}
                >
                  Change profile picture
                </button>

                {avatar && (
                  <button
                    type="button"
                    className="btn ghost"
                    style={{
                      width: "100%",
                      justifyContent: "flex-start",
                      marginTop: 4,
                    }}
                    onClick={clearAvatar}
                  >
                    Remove profile picture
                  </button>
                )}

                {/* Switch account / logout */}
                <button
                  type="button"
                  className="btn ghost"
                  style={{
                    width: "100%",
                    justifyContent: "flex-start",
                    marginTop: 8,
                  }}
                  onClick={() => {
                    setMenuOpen(false);
                    router.push("/auth/register");
                  }}
                >
                  Switch account
                </button>

                <button
                  type="button"
                  className="btn secondary"
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    marginTop: 8,
                  }}
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}

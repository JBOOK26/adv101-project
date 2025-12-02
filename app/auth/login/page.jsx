"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "../../components/ThemeToggle";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("");

    // Validation
    if (!email.trim()) {
      setStatus("Email is required.");
      return;
    }
    if (!password) {
      setStatus("Password is required.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.error || "Login failed.");
        setSubmitting(false);
        return;
      }

      // Success - persist user name and redirect
      if (data.name && typeof window !== "undefined") {
        try {
          window.localStorage.setItem("userName", data.name);
        } catch {}
      }

      setTimeout(() => router.push("/products"), 300);
    } catch (err) {
      setStatus("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-wrapper">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
          <div>
            <h1 className="auth-title">Sign in</h1>
            <p className="auth-sub">Access your inventory dashboard.</p>
          </div>
          <ThemeToggle />
        </div>

        <input
          type="email"
          className="auth-input"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
          autoComplete="email"
        />

        <input
          type="password"
          className="auth-input"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={submitting}
          autoComplete="current-password"
        />

        <button 
          className={`auth-btn ${submitting ? "loading" : ""}`} 
          type="submit"
          disabled={submitting}
        >
          {submitting ? "" : "Sign in"}
        </button>

        {status && (
          <div className="auth-error">
            ✕ {status}
          </div>
        )}

        <div className="auth-link">
          Don’t have an account?
          <a href="/auth/register">Register</a>
        </div>
      </form>
    </div>
  );
}

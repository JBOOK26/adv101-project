// app/auth/register/page.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "../../components/ThemeToggle";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function submit(e) {
    e.preventDefault();
    setStatus(null);

    // Validation
    if (!form.name.trim()) {
      setStatus({ type: "error", text: "Name is required." });
      return;
    }
    if (!form.email.trim()) {
      setStatus({ type: "error", text: "Email is required." });
      return;
    }
    if (!form.password) {
      setStatus({ type: "error", text: "Password is required." });
      return;
    }
    if (form.password.length < 6) {
      setStatus({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }

    setSubmitting(true);

    try {
      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Registration failed");
      
      // After registration, immediately log the user in and redirect to dashboard
      try {
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
        const loginJson = await loginRes.json();
        if (!loginRes.ok) throw new Error(loginJson.error || "Login failed after registration");

        // persist user name for Nav/profile
        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem("userName", loginJson.name || form.name || "User");
          } catch {}
        }

        setStatus({ type: "success", text: "✓ Account created! Redirecting to dashboard..." });
        setTimeout(() => router.push("/"), 400);
      } catch (loginErr) {
        console.error("Auto-login failed:", loginErr);
        setStatus({ type: "success", text: "✓ Account created! Please sign in." });
        setTimeout(() => router.push("/auth/login"), 600);
      }
    } catch (err) {
      setStatus({ type: "error", text: err.message });
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-wrapper">
      <form className="auth-card" onSubmit={submit}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
          <div>
            <h1 className="auth-title">Create account</h1>
            <p className="auth-sub">Register a new user.</p>
          </div>
          <ThemeToggle />
        </div>

        <input 
          className="auth-input" 
          placeholder="Full name" 
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          disabled={submitting}
        />
        
        <input 
          className="auth-input" 
          placeholder="Email" 
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          disabled={submitting}
          autoComplete="email"
        />
        
        <input 
          className="auth-input" 
          placeholder="Password (min 6 chars)" 
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          disabled={submitting}
          autoComplete="new-password"
        />

        <button 
          className={`auth-btn ${submitting ? "loading" : ""}`} 
          type="submit"
          disabled={submitting}
        >
          {submitting ? "" : "Create account"}
        </button>

        {status && (
          <div className={status.type === "error" ? "auth-error" : "auth-success"}>
            {status.type === "error" ? "✕" : "✓"} {status.text}
          </div>
        )}

        <div className="auth-link">
          Already have an account?
          <a href="/auth/login">Sign in</a>
        </div>
      </form>
    </div>
  );
}

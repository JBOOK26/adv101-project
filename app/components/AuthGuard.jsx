// app/components/AuthGuard.jsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthGuard({ children }) {
  const [ok, setOk] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function check() {
      const res = await fetch("/api/auth/check");
      const j = await res.json();
      if (!j.authenticated) {
        router.push("/auth/login");
      } else {
        setOk(true);
      }
    }
    check();
  }, [router]);

  if (!ok) return <div className="container">Loading…</div>;
  return <>{children}</>;
}

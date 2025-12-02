"use client";
import { useEffect, useState } from "react";

export default function Toast({ message, type = "info", onClose }) {
  const [visible, setVisible] = useState(!!message);

  useEffect(() => {
    setVisible(!!message);
    if (message) {
      const t = setTimeout(() => {
        setVisible(false);
        onClose?.();
      }, 3500);
      return () => clearTimeout(t);
    }
  }, [message, onClose]);

  if (!message || !visible) return null;

  const icons = {
    success: "✓",
    error: "✕",
    info: "ℹ",
    warning: "⚠",
  };

  return (
    <div style={{
      position: "fixed",
      right: 18,
      bottom: 22,
      zIndex: 9999,
      minWidth: 240,
      animation: "slideInRight 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
    }}>
      <div className={`msg ${type === "error" ? "error" : type === "success" ? "success" : "info"}`}>
        <span style={{ marginRight: "4px" }}>{icons[type]}</span>
        {message}
      </div>
    </div>
  );
}


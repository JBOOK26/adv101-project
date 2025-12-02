// app/components/useLocalStorage.js
import { useEffect, useState } from "react";

/**
 * useLocalStorage(key, initial)
 * lightweight hook to persist state in localStorage
 */
export default function useLocalStorage(key, initial) {
  const [state, setState] = useState(() => {
    try {
      const raw = typeof window !== "undefined" && localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);

  return [state, setState];
}

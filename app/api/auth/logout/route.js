// app/api/auth/logout/route.js
import { clearAuthCookie } from "../../../../lib/auth";

export async function POST() {
  const clear = clearAuthCookie();
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Set-Cookie": clear, "Content-Type": "application/json" } });
}

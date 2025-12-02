// app/api/auth/check/route.js
import { verifyToken } from "../../../../lib/auth";
import cookie from "cookie";

export async function GET(req) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const parsed = cookie.parse(cookieHeader || "");
    const token = parsed[process.env.COOKIE_NAME || "inventory_token"];
    if (!token) return new Response(JSON.stringify({ authenticated: false }), { status: 200 });

    const data = verifyToken(token);
    if (!data) return new Response(JSON.stringify({ authenticated: false }), { status: 200 });

    return new Response(JSON.stringify({ authenticated: true, user: data }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ authenticated: false }), { status: 200 });
  }
}

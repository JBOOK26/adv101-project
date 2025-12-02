// app/api/auth/login/route.js
import pool from "../../../../lib/db";
import bcrypt from "bcryptjs";
import { signToken, createAuthCookie } from "../../../../lib/auth";

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return new Response(JSON.stringify({ error: "Missing" }), { status: 400 });

    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    const user = rows[0];
    if (!user) return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });

    const token = signToken({ id: user.id, email: user.email, name: user.name || null });
    const cookieHeader = createAuthCookie(token);

    return new Response(JSON.stringify({ id: user.id, name: user.name, email: user.email }), {
      status: 200,
      headers: { "Set-Cookie": cookieHeader, "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}

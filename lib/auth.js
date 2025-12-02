// lib/auth.js
import jwt from "jsonwebtoken";
import cookie from "cookie";

const JWT_SECRET = process.env.JWT_SECRET || "changeme";
const COOKIE_NAME = process.env.COOKIE_NAME || "inventory_token";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export function createAuthCookie(token) {
  return cookie.serialize(COOKIE_NAME, token, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7 // 7 days
  });
}

export function clearAuthCookie() {
  return cookie.serialize(COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0
  });
}

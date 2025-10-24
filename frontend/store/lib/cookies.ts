"use client";

const CART_COOKIE = "cartProductIds";
const COOKIE_MAX_AGE_DAYS = 14;

export function readCartCookie(): number[] {
  if (typeof document === "undefined") return [];
  try {
    const match = document.cookie.split(";").map((c) => c.trim()).find((c) => c.startsWith(CART_COOKIE + "="));
    if (!match) return [];
    const val = decodeURIComponent(match.split("=")[1] || "");
    const arr = JSON.parse(val);
    if (Array.isArray(arr)) return arr.filter((n) => Number.isFinite(n)).map((n) => Number(n));
    return [];
  } catch {
    return [];
  }
}

export function writeCartCookie(items: number[]) {
  if (typeof document === "undefined") return;
  try {
    const data = JSON.stringify(items ?? []);
    const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
    document.cookie = `${CART_COOKIE}=${encodeURIComponent(data)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
  } catch {
    // ignore
  }
}

export function clearCartCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${CART_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
}

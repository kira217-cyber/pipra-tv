import axios from "axios";

// The real API server (also where uploaded images live).
export const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

// In `npm run dev` requests go to Vite itself, which caches site data and
// serves resized images (dev/localCache.js) and proxies the rest to
// API_ORIGIN. A production build talks to API_ORIGIN directly.
export const api = axios.create({
  baseURL: import.meta.env.DEV ? "" : API_ORIGIN,
});

import axios from "axios";

// The new Pipra-TV API (Pipra-TV-NEW-VERSION/server).
export const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5100").replace(/\/$/, "");

// In `npm run dev` requests go through Vite (see vite.config.js); a
// production build calls API_ORIGIN directly.
export const api = axios.create({ baseURL: import.meta.env.DEV ? "" : API_ORIGIN });

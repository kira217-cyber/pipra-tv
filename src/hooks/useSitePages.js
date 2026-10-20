import { useEffect, useState } from "react";

import { api } from "../api/axios";

// The sidebar footer (brand lines, flag, copyright) and the information
// page links, as set in the admin panel. Kept in localStorage like the site
// settings, so the footer paints at once and refreshes in the background.
const STORAGE_KEY = "pipra_site_pages_v1";

const readStored = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    return null;
  }
};

let cached = readStored();
let fetched = false;
let inflight = null;
const listeners = new Set();

const load = () => {
  if (inflight) return inflight;
  inflight = api
    .get("/api/site/pages")
    .then(({ data }) => {
      if (data?.data) {
        cached = data.data;
        fetched = true;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
        } catch {
          // no instant paint next time, that's all
        }
        listeners.forEach((notify) => notify(cached));
      }
    })
    .catch(() => {})
    .finally(() => {
      inflight = null;
    });
  return inflight;
};

export const useSitePages = () => {
  const [value, setValue] = useState(cached);
  useEffect(() => {
    listeners.add(setValue);
    if (!fetched) load();
    return () => listeners.delete(setValue);
  }, []);
  return value || { footer: null, groups: [] };
};

export const pagePath = (slug) => `/page/${slug}`;

export default useSitePages;

import { api } from "../api/axios";

// Uploaded images are stored server-side as "/uploads/x.jpg"; video files
// live on the CDN as full URLs. Either kind goes through here. `width` asks
// the local dev cache for a resized WebP (ignored by the production API).
export const mediaUrl = (path, width) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const sized = width && import.meta.env.DEV ? `?w=${width}` : "";
  return `${api.defaults.baseURL}${path}${sized}`;
};

// Standard sizes, so the same image is resized (and cached) only once.
export const IMG = { avatar: 160, logo: 240, card: 480, portrait: 360, hero: 1280 };

// 1234 → "1.2K", 3100000 → "3.1M"
export const formatCount = (value) => {
  const n = Number(value) || 0;
  if (n >= 1e9) return `${trim(n / 1e9)}B`;
  if (n >= 1e6) return `${trim(n / 1e6)}M`;
  if (n >= 1e3) return `${trim(n / 1e3)}K`;
  return String(n);
};

const trim = (n) => (n >= 100 ? Math.round(n) : n.toFixed(1).replace(/\.0$/, ""));

const UNITS = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
];

export const timeAgo = (date) => {
  if (!date) return "";
  const seconds = Math.max(0, (Date.now() - new Date(date).getTime()) / 1000);

  for (const [unit, size] of UNITS) {
    const amount = Math.floor(seconds / size);
    if (amount >= 1) return `${amount} ${unit}${amount > 1 ? "s" : ""} ago`;
  }

  return "just now";
};

// "5.4M views · 3 weeks ago", leaving out whichever half isn't known.
export const videoMeta = (video) =>
  [
    typeof video?.views === "number" ? `${formatCount(video.views)} views` : null,
    video?.createdAt ? timeAgo(video.createdAt) : null,
  ]
    .filter(Boolean)
    .join(" · ");

export const formatMoney = (value) =>
  `$${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// Video id shape differs by endpoint: summaries use `id`, raw documents `_id`.
export const videoId = (video) => video?.id || video?._id;

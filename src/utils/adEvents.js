import { api } from "../api/axios";

// Ad analytics (admin → Ads analytics). `type` is view / click / skip /
// complete; `where` is the place it was shown — home_top, home_feed, video,
// short, shorts_feed or live. Fire and forget: a lost count never bothers
// the viewer.
export const trackAd = (id, type, where) => {
  if (!id || !where) return;
  api.post(`/api/site/ads/${id}/event`, { type, where }).catch(() => {});
};

// Banners are shuffled once per visit (page load): a new order every visit,
// but steady while the viewer moves around the site.
const visitOrder = new Map();
export const visitRank = (id) => {
  if (!visitOrder.has(id)) visitOrder.set(id, Math.random());
  return visitOrder.get(id);
};

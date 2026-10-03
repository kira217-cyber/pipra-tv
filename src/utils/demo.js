// Preview figures for creator features the server doesn't track yet
// (subscribers, likes, comments, watch time, revenue, audience). They are
// stable per creator — derived from a seed rather than Math.random — so a
// page doesn't jump around on every visit. Replace with API data once the
// endpoints exist.

const seeded = (seed) => {
  let state = 0;
  for (const char of String(seed)) state = (state * 31 + char.charCodeAt(0)) >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const dayLabels = (days) => {
  const labels = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    labels.push(`${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}`);
  }
  return labels;
};

// A gently rising, noisy daily series.
export const demoSeries = (seed, days, base) => {
  const random = seeded(seed);
  return dayLabels(days).map((label, index) => ({
    label,
    value: Math.round(base * (0.55 + (index / days) * 0.5 + random() * 0.45)),
  }));
};

export const demoChannel = (seed) => {
  const random = seeded(`${seed}-channel`);
  return {
    subscribers: Math.round(80000 + random() * 60000),
    likes: Math.round(180000 + random() * 90000),
    comments: Math.round(9000 + random() * 5000),
    watchHours: Math.round(120000 + random() * 80000),
    revenue: 400 + random() * 200,
    growth: {
      views: 20 + random() * 12,
      subscribers: 8 + random() * 8,
      likes: 12 + random() * 10,
      comments: 20 + random() * 15,
      watch: 15 + random() * 10,
      revenue: 12 + random() * 10,
    },
  };
};

export const DEMO_AUDIENCE = {
  male: 68,
  female: 32,
  ages: [
    { label: "13–17", value: 12 },
    { label: "18–24", value: 45 },
    { label: "25–34", value: 28 },
    { label: "35–44", value: 10 },
    { label: "45+", value: 5 },
  ],
};

export const DEMO_TRAFFIC = [
  { label: "PipraTV Search", value: 42, color: "#ff3d7f" },
  { label: "Browse Features", value: 28, color: "#2f86e6" },
  { label: "External", value: 8, color: "#d97706" },
  { label: "Suggested Videos", value: 18, color: "#a855f7" },
  { label: "Other", value: 4, color: "#6b7280" },
];

export const demoEarning = (seed) => {
  const random = seeded(`${seed}-earning`);
  const total = 450 + random() * 150;
  const pending = total * 0.18;
  return {
    total,
    available: total - pending,
    pending,
    paidOut: 1000 + random() * 400,
    lastPayment: "Aug 15, 2026",
    growth: { total: 18.5, available: 12.3, pending: 8.7 },
  };
};

// Per-video estimated earnings for the "Top Earning Videos" list.
export const demoVideoEarning = (video) => {
  const random = seeded(video?.id || video?._id || video?.title);
  return Math.max(5, (video?.views || 0) / 1000 * (0.8 + random() * 0.6) || 10 + random() * 120);
};

export const demoVideoEngagement = (video) => {
  const random = seeded(`${video?.id || video?._id}-engagement`);
  const views = video?.views || Math.round(1000 + random() * 50000);
  return {
    likes: Math.round(views * (0.01 + random() * 0.03)),
    comments: Math.round(views * (0.0005 + random() * 0.002)),
    growth: Math.round(10 + random() * 55),
  };
};

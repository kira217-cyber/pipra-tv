import { api } from "./axios";

// "Try demo account": lets anyone see the signed-in creator pages without
// a real account. While demo mode is on, every /api/studio request is
// answered here in the browser — reads come back as a sample creator whose
// videos are real public videos; writes are refused, nothing reaches the
// server.
export const DEMO_FLAG = "pipra_demo_mode";

export const DEMO_USER = {
  id: "demo-creator",
  fullName: "Demo Creator",
  email: "demo@pipratv.com",
  phone: "01700000000",
  status: "active",
  channel: { name: "PipraTV Demo", logo: null, featured: false },
  createdAt: "2025-01-15T00:00:00.000Z",
};

export const isDemoMode = () => {
  try {
    return localStorage.getItem(DEMO_FLAG) === "1";
  } catch {
    return false;
  }
};

const STATUSES = ["active", "active", "active", "pending", "active", "rejected"];

let demoVideos = null;

const loadDemoVideos = async () => {
  if (demoVideos) return demoVideos;
  try {
    const { data } = await api.get("/api/site/videos", { params: { limit: 24 } });
    demoVideos = (data?.data?.videos || []).map((video, index) => ({
      ...video,
      id: video.id,
      status: STATUSES[index % STATUSES.length],
      rejectionReason: STATUSES[index % STATUSES.length] === "rejected" ? "Thumbnail text is hard to read" : null,
      views: video.views || Math.round(250000 / (index + 1)),
      createdAt: video.createdAt || new Date(Date.now() - index * 3 * 86400000).toISOString(),
      trailer: null,
    }));
  } catch {
    demoVideos = [];
  }
  return demoVideos;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const statsFor = (videos) => {
  const count = (status) => videos.filter((video) => video.status === status).length;
  const byCategory = new Map();
  videos.forEach((video) => byCategory.set(video.category, (byCategory.get(video.category) || 0) + 1));
  const now = new Date();

  return {
    total: videos.length,
    active: count("active"),
    pending: count("pending"),
    rejected: count("rejected"),
    views: videos.reduce((sum, video) => sum + (video.views || 0), 0),
    uploadsOverTime: Array.from({ length: 6 }, (_, i) => ({
      label: MONTHS[(now.getMonth() - 5 + i + 12) % 12],
      count: [3, 5, 2, 6, 4, 4][i],
    })),
    topVideosByViews: [...videos].sort((a, b) => b.views - a.views).slice(0, 6).map((v) => ({ title: v.title, views: v.views })),
    categoryBreakdown: [...byCategory.entries()]
      .map(([category, total]) => ({ category, count: total }))
      .sort((a, b) => b.count - a.count),
  };
};

const reply = (config, status, data, message = "OK") => {
  const response = { data: { success: status < 400, message, data }, status, statusText: message, headers: {}, config };
  if (status >= 400) {
    const error = new Error(message);
    error.response = response;
    error.config = config;
    return Promise.reject(error);
  }
  return Promise.resolve(response);
};

export const demoAdapter = async (config) => {
  const method = (config.method || "get").toLowerCase();
  const url = new URL(config.url, "http://demo");
  const path = url.pathname;
  const params = { ...Object.fromEntries(url.searchParams), ...(config.params || {}) };

  if (method !== "get") {
    return reply(config, 403, null, "Demo mode — sign in with a real account to save changes.");
  }

  if (path === "/api/studio/profile") return reply(config, 200, { user: DEMO_USER });
  if (path === "/api/studio/channel") return reply(config, 200, { channel: DEMO_USER.channel });

  const videos = await loadDemoVideos();

  if (path === "/api/studio/videos/stats") return reply(config, 200, statsFor(videos));
  if (path.startsWith("/api/studio/videos/upload-progress/")) return reply(config, 200, { percent: 0 });

  const single = path.match(/^\/api\/studio\/videos\/([^/]+)$/);
  if (single) {
    const video = videos.find((item) => item.id === single[1]);
    return video ? reply(config, 200, { video }) : reply(config, 404, null, "Video not found");
  }

  if (path === "/api/studio/videos") {
    let list = videos;
    if (params.status) list = list.filter((video) => video.status === params.status);
    if (params.search) {
      const query = String(params.search).toLowerCase();
      list = list.filter((video) => video.title.toLowerCase().includes(query));
    }
    const limit = Number(params.limit) || 30;
    const page = Number(params.page) || 1;
    return reply(config, 200, {
      videos: list.slice((page - 1) * limit, page * limit),
      total: list.length,
      page,
      totalPages: Math.max(1, Math.ceil(list.length / limit)),
    });
  }

  return reply(config, 404, null, "Not available in demo mode");
};

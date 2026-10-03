// Dev-only speed-up for working against the remote Pipra-TV API.
//
// The live server answers slowly from here and its thumbnails are 2–3 MB
// PNGs, so local pages sat empty for seconds. During `npm run dev` the
// browser talks to Vite instead, and this plugin:
//
//   • /uploads/*          — fetches each image from the API once, keeps it
//                           on disk, and with ?w=480 serves a resized WebP
//                           (a ~3 MB poster becomes ~30 KB).
//   • GET /api/site/*     — keeps the list endpoints (settings, videos,
//                           channels, live-tv) cached on disk and in memory;
//                           answers instantly from cache and refreshes in
//                           the background (stale-while-revalidate).
//
// Everything else (/api/studio, uploads, socket.io …) goes straight
// through Vite's proxy. Nothing here ships in the production build.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const CACHE_DIR = path.resolve(".cache");
const MEDIA_DIR = path.join(CACHE_DIR, "media");
const API_DIR = path.join(CACHE_DIR, "api");

// List endpoints that are safe to serve slightly stale. Detail pages,
// now-playing and ad campaigns always go live (they bump view counts or
// depend on the current second).
const CACHEABLE_API = [
  /^\/api\/site\/settings(\?|$)/,
  /^\/api\/site\/videos(\?|$)/,
  /^\/api\/site\/channels(\?|$)/,
  /^\/api\/site\/channels\/[^/?]+(\?|$)/,
  /^\/api\/site\/live-tv(\?|$)/,
];
const API_FRESH_MS = 60 * 1000;
const ALLOWED_WIDTHS = [96, 160, 240, 360, 480, 720, 960, 1280, 1600];

const hash = (value) => crypto.createHash("sha1").update(value).digest("hex");
const ensureDir = (dir) => fs.mkdirSync(dir, { recursive: true });

const fetchBuffer = async (url) => {
  // The API host serves uploads slowly (~30 KB/s), so give big images time.
  const response = await fetch(url, { signal: AbortSignal.timeout(10 * 60 * 1000) });
  if (!response.ok) {
    const error = new Error(`Upstream ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    type: response.headers.get("content-type") || "application/octet-stream",
  };
};

// One in-flight download per key, however many requests ask for it.
const inflight = new Map();
const once = (key, task) => {
  if (!inflight.has(key)) {
    inflight.set(
      key,
      task().finally(() => inflight.delete(key)),
    );
  }
  return inflight.get(key);
};

const snapWidth = (raw) => {
  const wanted = Number(raw);
  if (!wanted) return null;
  return ALLOWED_WIDTHS.find((w) => w >= wanted) || ALLOWED_WIDTHS[ALLOWED_WIDTHS.length - 1];
};

const mediaFile = (target, pathname) => path.join(MEDIA_DIR, hash(`${target}${pathname}`));

// Downloads one upload into the disk cache (once), returning its bytes.
const getOriginal = (target, pathname) => {
  const source = `${target}${pathname}`;
  const file = mediaFile(target, pathname);
  return once(source, async () => {
    if (fs.existsSync(file)) {
      return { buffer: fs.readFileSync(file), type: fs.readFileSync(`${file}.type`, "utf8") };
    }
    const fetched = await fetchBuffer(source);
    ensureDir(MEDIA_DIR);
    fs.writeFileSync(file, fetched.buffer);
    fs.writeFileSync(`${file}.type`, fetched.type);
    return fetched;
  });
};

// Background warm-up: every image mentioned by a cached API response is
// downloaded a few at a time, so pages find it on disk instead of waiting
// on the slow upstream when someone first scrolls to it.
const queued = new Set();
const queue = [];
let running = 0;
const WARM_CONCURRENCY = 4;

const pump = (target) => {
  while (running < WARM_CONCURRENCY && queue.length) {
    const pathname = queue.shift();
    running += 1;
    getOriginal(target, pathname)
      .catch(() => queued.delete(pathname))
      .finally(() => {
        running -= 1;
        pump(target);
      });
  }
};

const warmFrom = (target, text) => {
  const found = text.match(/\/uploads\/[^"\?#\s]+/g) || [];
  found.forEach((pathname) => {
    if (queued.has(pathname) || fs.existsSync(mediaFile(target, pathname))) return;
    queued.add(pathname);
    queue.push(pathname);
  });
  pump(target);
};

const handleMedia = async (target, req, res) => {
  const url = new URL(req.url, "http://local");
  const width = snapWidth(url.searchParams.get("w"));
  const originalFile = mediaFile(target, url.pathname);
  const original = await getOriginal(target, url.pathname);

  let body = original.buffer;
  let type = original.type;

  const resizable = /^image\/(png|jpe?g|webp)$/i.test(type);
  if (width && resizable) {
    const resizedFile = `${originalFile}-${width}.webp`;
    body = await once(resizedFile, async () => {
      if (fs.existsSync(resizedFile)) return fs.readFileSync(resizedFile);
      const { default: sharp } = await import("sharp");
      const out = await sharp(original.buffer)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 78 })
        .toBuffer();
      fs.writeFileSync(resizedFile, out);
      return out;
    });
    type = "image/webp";
  }

  res.statusCode = 200;
  res.setHeader("Content-Type", type);
  res.setHeader("Content-Length", body.length);
  // Upload filenames are timestamped and never reused, so cache hard.
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.end(body);
};

const memory = new Map(); // url -> { at, status, type, body }

const readApiDisk = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
};

const refreshApi = (target, url, file) =>
  once(`api:${url}`, async () => {
    const response = await fetch(`${target}${url}`, { signal: AbortSignal.timeout(30000) });
    const entry = {
      at: Date.now(),
      status: response.status,
      type: response.headers.get("content-type") || "application/json",
      body: await response.text(),
    };
    if (response.ok) {
      memory.set(url, entry);
      warmFrom(target, entry.body);
      ensureDir(API_DIR);
      fs.writeFileSync(file, JSON.stringify(entry));
    }
    return entry;
  });

const handleApi = async (target, req, res) => {
  const url = req.url;
  const file = path.join(API_DIR, `${hash(url)}.json`);
  let entry = memory.get(url) || readApiDisk(file);

  if (entry) {
    memory.set(url, entry);
    if (Date.now() - entry.at > API_FRESH_MS) {
      refreshApi(target, url, file).catch(() => {});
    }
  } else {
    entry = await refreshApi(target, url, file);
  }

  res.statusCode = entry.status;
  res.setHeader("Content-Type", entry.type);
  res.setHeader("Cache-Control", "no-cache");
  res.end(entry.body);
};

export const localCache = (target) => ({
  name: "pipra-local-cache",
  apply: "serve",
  configureServer(server) {
    // Warm the image cache from what's on disk, then refresh the lists
    // the home and Live TV pages use (which warms anything new).
    try {
      fs.readdirSync(API_DIR).forEach((name) => warmFrom(target, fs.readFileSync(path.join(API_DIR, name), "utf8")));
    } catch {
      // No API cache yet.
    }
    ["/api/site/settings", "/api/site/live-tv?limit=500", "/api/site/videos?limit=24"].forEach((url) =>
      refreshApi(target, url, path.join(API_DIR, `${hash(url)}.json`)).catch(() => {}),
    );

    server.middlewares.use(async (req, res, next) => {
      if (req.method !== "GET" || !req.url) return next();

      try {
        if (req.url.startsWith("/uploads/")) {
          await handleMedia(target, req, res);
          return;
        }
        if (CACHEABLE_API.some((pattern) => pattern.test(req.url))) {
          await handleApi(target, req, res);
          return;
        }
      } catch (error) {
        res.statusCode = error.status || 502;
        res.end(String(error.message || error));
        return;
      }

      next();
    });
  },
});

export default localCache;

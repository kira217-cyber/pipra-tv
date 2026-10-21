// Keeps open tabs on the newest deploy.
//
// Every build writes /version.json with its build id (see vite.config.js).
// The tab checks it now and then; when a newer build is out, the next page
// change loads it fresh instead of carrying on with the old code. A page
// whose code file was removed by a deploy (the old version asked for it)
// loads the new version straight away instead of failing.
//
// Nothing reloads while an upload is running (holdUpdates).

const BUILD = import.meta.env.VITE_BUILD_ID;
const CHECK_EVERY_MS = 5 * 60 * 1000;
const RELOAD_KEY = "pipra_update_reload_at";

let waiting = false;
let holds = 0;

// Reloads at most once every 30 s, so a broken deploy can't loop.
const reload = () => {
  if (holds > 0) return false;
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY)) || 0;
    if (Date.now() - last < 30000) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // Storage blocked — reload anyway.
  }
  window.location.reload();
  return true;
};

const check = async () => {
  if (waiting || !BUILD || import.meta.env.DEV) return;
  try {
    const response = await fetch(`/version.json?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return;
    const { build } = await response.json();
    if (build && build !== BUILD) waiting = true;
  } catch {
    // Offline — try again later.
  }
};

// Call while something must not be interrupted; call the returned
// function when it's done.
export const holdUpdates = () => {
  holds += 1;
  return () => {
    holds = Math.max(0, holds - 1);
  };
};

// `reloadWhenHidden`: also update a tab the viewer isn't looking at (only
// where there are no forms that could lose typing).
export const startUpdateCheck = (router, { reloadWhenHidden = false } = {}) => {
  window.addEventListener("vite:preloadError", (event) => {
    if (reload()) event.preventDefault();
  });

  check();
  window.setInterval(check, CHECK_EVERY_MS);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") check();
    else if (waiting && reloadWhenHidden) reload();
  });

  // A finished page change while a new version waits: load that page fresh.
  router.subscribe((state) => {
    if (waiting && state.navigation.state === "idle") reload();
  });
};

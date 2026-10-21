import { api } from "../api/axios";
import { studioApi, TOKEN_KEY } from "../api/studioApi";
import { countView, visitorId } from "./visitor";

// Measures how long a <video> is really watched and reports it, for views
// and watch hours (monetization):
//   • only time while it's playing in a visible tab counts — pausing,
//     background tabs and jumping around (seeking, a Short looping back to
//     the start) add nothing;
//   • the view is counted after 10 seconds of watching (half of a very short
//     video), not the moment playback starts;
//   • watched seconds are sent every 30 seconds and whenever playback stops
//     (pause, leaving the page, switching video).
// Returns a function that stops tracking (and sends what's left).

const VIEW_AFTER = 10;
const REPORT_EVERY = 30;

const send = (videoId, seconds) => {
  const client = localStorage.getItem(TOKEN_KEY) ? studioApi : api;
  return client.post(`/api/videos/${videoId}/watch`, { seconds: Math.round(seconds), visitorId: visitorId() }).catch(() => {});
};

export const trackWatching = (video, { videoId, onView } = {}) => {
  if (!video || !videoId) return () => {};
  let watched = 0;
  let pending = 0;
  let last = null;
  let viewed = false;

  const flush = () => {
    if (pending >= 1) send(videoId, pending);
    pending = 0;
  };

  const onTime = () => {
    const now = video.currentTime;
    if (video.paused || document.hidden || last === null) {
      last = now;
      return;
    }
    const step = now - last;
    last = now;
    // A normal step is a fraction of a second (up to ~2 s at 2× speed);
    // anything else is a seek or a loop back to the start.
    if (step <= 0 || step > 2.5) return;
    watched += step;
    pending += step;

    const duration = video.duration || 0;
    if (!viewed && (watched >= VIEW_AFTER || (duration > 0 && duration < 2 * VIEW_AFTER && watched >= duration / 2))) {
      viewed = true;
      Promise.resolve(countView(videoId)).then((response) => onView?.(response));
    }
    if (pending >= REPORT_EVERY) flush();
  };
  const onPlay = () => {
    last = video.currentTime;
  };
  const onHidden = () => {
    if (document.hidden) flush();
  };

  video.addEventListener("timeupdate", onTime);
  video.addEventListener("playing", onPlay);
  video.addEventListener("seeking", onPlay);
  video.addEventListener("pause", flush);
  video.addEventListener("ended", flush);
  document.addEventListener("visibilitychange", onHidden);
  window.addEventListener("pagehide", flush);

  return () => {
    video.removeEventListener("timeupdate", onTime);
    video.removeEventListener("playing", onPlay);
    video.removeEventListener("seeking", onPlay);
    video.removeEventListener("pause", flush);
    video.removeEventListener("ended", flush);
    document.removeEventListener("visibilitychange", onHidden);
    window.removeEventListener("pagehide", flush);
    flush();
  };
};

export default trackWatching;

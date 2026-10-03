import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  BadgeCheck,
  EllipsisVertical,
  Heart,
  MessageCircle,
  Music2,
  Play,
  Plus,
  Repeat2,
  Share2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "react-toastify";

import { Spinner } from "../../components/ui/ui";
import { useFetch } from "../../hooks/useFetch";
import { useLocalFlag } from "../../hooks/useLocalFlag";
import { useWatchPresence } from "../../hooks/useWatchPresence";
import { IMG, mediaUrl, videoId } from "../../utils/format";

const TABS = [
  { key: "foryou", label: "For You" },
  { key: "following", label: "Following" },
  { key: "trending", label: "Trending" },
];

const RailButton = ({ icon: Icon, label, active, onClick, fill }) => (
  <button type="button" onClick={onClick} className="flex cursor-pointer flex-col items-center gap-0.5 text-white">
    <Icon
      className={`h-7 w-7 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] transition active:scale-90 lg:h-8 lg:w-8 ${active ? "fill-live text-live" : fill ? "fill-white" : ""}`}
      strokeWidth={1.75}
    />
    <span className="text-[11px] font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] lg:text-xs">{label}</span>
  </button>
);

const handleOf = (name) => `@${(name || "pipratv").toLowerCase().replace(/[^a-z0-9_]+/g, "")}`;

const ShortItem = ({ video, muted, onToggleMute }) => {
  const id = videoId(video);
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [liked, toggleLike] = useLocalFlag(`pipra_like_${id}`);
  const [subscribed, toggleSubscribe] = useLocalFlag(`pipra_sub_${video.channelId}`);

  useWatchPresence("video", playing ? id : null, video.title);

  // Play the short that's on screen, pause the rest.
  useEffect(() => {
    const el = containerRef.current;
    const player = videoRef.current;
    if (!el || !player) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) player.play().catch(() => {});
        else player.pause();
      },
      { threshold: 0.6 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const togglePlay = () => {
    const player = videoRef.current;
    if (!player) return;
    if (player.paused) player.play().catch(() => {});
    else player.pause();
  };

  const share = async () => {
    const url = `${window.location.origin}/watch/${id}`;
    try {
      if (navigator.share) await navigator.share({ title: video.title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch {
      // Share sheet dismissed.
    }
  };

  return (
    <div ref={containerRef} className="relative flex h-full w-full justify-center">
      <div className="relative h-full w-full overflow-hidden bg-black lg:aspect-[9/16] lg:w-auto lg:rounded-2xl">
        <video
          ref={videoRef}
          src={video.video?.url}
          poster={mediaUrl(video.thumbnail?.portrait, IMG.portrait)}
          muted={muted}
          loop
          playsInline
          preload="metadata"
          onClick={togglePlay}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(event) => {
            const { currentTime, duration } = event.currentTarget;
            if (duration) setProgress(currentTime / duration);
          }}
          className="h-full w-full cursor-pointer object-contain"
        />

        {!playing && (
          <button
            type="button"
            aria-label="Play"
            onClick={togglePlay}
            className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/40 backdrop-blur-sm"
          >
            <Play className="ml-1 h-9 w-9 fill-white text-white" />
          </button>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

        <div className="absolute right-2 top-[max(0.75rem,env(safe-area-inset-top))] flex gap-1">
          <button
            type="button"
            aria-label={muted ? "Unmute" : "Mute"}
            onClick={onToggleMute}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white"
          >
            {muted ? <VolumeX className="h-[18px] w-[18px]" /> : <Volume2 className="h-[18px] w-[18px]" />}
          </button>
          <span className="flex h-9 w-9 items-center justify-center text-white">
            <EllipsisVertical className="h-5 w-5" />
          </span>
        </div>

        {/* Right-hand action rail */}
        <div className="absolute bottom-20 right-1.5 flex flex-col items-center gap-4 sm:right-3 lg:bottom-24 lg:gap-5">
          <Link to={video.channelId ? `/channel/${video.channelId}` : "#"} className="relative mb-1.5">
            <span className="block h-11 w-11 overflow-hidden rounded-full border-2 border-white bg-black lg:h-12 lg:w-12">
              {video.channelLogo ? (
                <img src={mediaUrl(video.channelLogo, IMG.avatar)} alt="" className="h-full w-full object-cover" />
              ) : (
                <img src={mediaUrl(video.thumbnail?.portrait, IMG.portrait)} alt="" className="h-full w-full object-cover" />
              )}
            </span>
            {!subscribed && (
              <span className="absolute -bottom-2 left-1/2 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full bg-live">
                <Plus className="h-3.5 w-3.5 text-white" strokeWidth={3} />
              </span>
            )}
          </Link>
          <RailButton icon={Heart} label="Like" active={liked} onClick={toggleLike} fill />
          <RailButton icon={MessageCircle} label="Comment" fill onClick={() => toast.info("Comments are coming soon")} />
          <RailButton icon={Share2} label="Share" fill onClick={share} />
          <RailButton icon={Repeat2} label="Remix" onClick={() => toast.info("Remix is coming soon")} />
        </div>

        {/* Channel + caption */}
        <div className="absolute inset-x-0 bottom-0 px-3 pb-3.5 pr-16 lg:p-4 lg:pr-20">
          <div className="flex items-center gap-2">
            <Link to={video.channelId ? `/channel/${video.channelId}` : "#"} className="flex min-w-0 items-center gap-1">
              <span className="truncate text-sm font-semibold text-white">{handleOf(video.channelName)}</span>
              <BadgeCheck className="h-4 w-4 shrink-0 fill-[#2f86e6] text-white" />
            </Link>
            <button
              type="button"
              onClick={toggleSubscribe}
              className={`ml-1 shrink-0 cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition ${
                subscribed ? "bg-white/20 text-white" : "bg-white text-black"
              }`}
            >
              {subscribed ? "Subscribed" : "Subscribe"}
            </button>
          </div>
          <Link to={`/watch/${id}`} className="mt-1.5 line-clamp-1 block text-[13px] leading-snug text-white/95 lg:line-clamp-2 lg:text-sm">
            {video.title}
          </Link>
          {video.category && <p className="mt-0.5 truncate text-xs text-white/70">#PipraTV #{video.category} #Shorts</p>}
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-white/80">
            <Music2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Original Sound - {video.channelName || "PipraTV"}</span>
          </p>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/20">
          <div className="h-full bg-brand" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
    </div>
  );
};

const SWIPE_PX = 50;

const Shorts = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("foryou");
  const [muted, setMuted] = useState(true);
  const [index, setIndex] = useState(0);
  const feedRef = useRef(null);
  const drag = useRef(null);
  const wheelLock = useRef(0);
  const { data, loading } = useFetch("/api/site/videos", { sort: "random", limit: 30 });

  const videos = useMemo(() => {
    const list = data?.videos || [];
    if (tab === "trending") return [...list].sort((a, b) => (b.views || 0) - (a.views || 0));
    return list;
  }, [data, tab]);

  // The feed owns the gestures on this page — stop the page behind it
  // from scrolling (or bouncing) at the same time.
  useEffect(() => {
    const html = document.documentElement;
    const previous = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = previous;
    };
  }, []);

  const goTo = (next) => {
    const feed = feedRef.current;
    if (!feed || !videos.length) return;
    const target = Math.max(0, Math.min(videos.length - 1, next));
    feed.scrollTo({ top: target * feed.clientHeight, behavior: "smooth" });
  };

  const current = () => {
    const feed = feedRef.current;
    return feed ? Math.round(feed.scrollTop / Math.max(1, feed.clientHeight)) : 0;
  };

  // Keyboard: arrow keys / J-K move between shorts.
  useEffect(() => {
    const onKey = (event) => {
      if (event.target.closest?.("input, textarea")) return;
      if (event.key === "ArrowDown" || event.key === "j") {
        event.preventDefault();
        goTo(current() + 1);
      } else if (event.key === "ArrowUp" || event.key === "k") {
        event.preventDefault();
        goTo(current() - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Touch swipes scroll natively (scroll-snap); a mouse can drag too.
  const onPointerDown = (event) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    drag.current = { y: event.clientY, from: current() };
  };
  const onPointerUp = (event) => {
    if (!drag.current) return;
    const delta = drag.current.y - event.clientY;
    const from = drag.current.from;
    drag.current = null;
    if (Math.abs(delta) > SWIPE_PX) goTo(from + (delta > 0 ? 1 : -1));
  };

  // One wheel flick = one short (trackpads fire dozens of events).
  const onWheel = (event) => {
    event.preventDefault();
    const now = Date.now();
    if (now - wheelLock.current < 600 || Math.abs(event.deltaY) < 8) return;
    wheelLock.current = now;
    goTo(current() + (event.deltaY > 0 ? 1 : -1));
  };

  // React's onWheel is passive; attach a real listener so preventDefault works.
  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return undefined;
    feed.addEventListener("wheel", onWheel, { passive: false });
    return () => feed.removeEventListener("wheel", onWheel);
  });

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  return (
    <div className="relative flex h-[100dvh] flex-col bg-black lg:h-[calc(100dvh-4rem)] lg:bg-transparent">
      {/* Back — the only way out on phones, where the top bar is hidden. */}
      <button
        type="button"
        aria-label="Back"
        onClick={goBack}
        className="absolute left-2 top-[max(0.75rem,env(safe-area-inset-top))] z-20 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm lg:hidden"
      >
        <ArrowLeft className="h-6 w-6" />
      </button>

      <div className="hidden items-center justify-between gap-2 px-4 py-3 lg:flex lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Back"
            onClick={goBack}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-card-2 text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold">Shorts</h1>
        </div>
        <div className="flex rounded-2xl border border-line bg-card p-1">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`cursor-pointer whitespace-nowrap rounded-xl px-5 py-2 text-sm font-medium transition ${
                tab === item.key ? "bg-card-2 text-white shadow-[inset_0_-2px_0_#2f86e6]" : "text-slate-300"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative min-h-0 flex-1 pb-[calc(4.75rem+env(safe-area-inset-bottom))] lg:px-8 lg:pb-4">
        {loading ? (
          <Spinner className="h-full" />
        ) : tab === "following" ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <Heart className="h-12 w-12 text-brand" />
            <p className="mt-3 text-lg font-semibold">Follow creators you love</p>
            <p className="mt-1 max-w-sm text-sm text-muted">Shorts from channels you subscribe to will show up here.</p>
          </div>
        ) : (
          <>
            <div
              ref={feedRef}
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
              onPointerLeave={() => (drag.current = null)}
              onScroll={(event) => setIndex(Math.round(event.currentTarget.scrollTop / Math.max(1, event.currentTarget.clientHeight)))}
              className="no-scrollbar h-full snap-y snap-mandatory overflow-y-scroll overflow-x-hidden overscroll-contain"
            >
              {videos.map((video) => (
                <div key={videoId(video)} className="h-full snap-start snap-always lg:py-2">
                  <ShortItem video={video} muted={muted} onToggleMute={() => setMuted((value) => !value)} />
                </div>
              ))}
            </div>

            {/* Desktop: previous / next buttons beside the player */}
            <div className="absolute right-8 top-1/2 hidden -translate-y-1/2 flex-col gap-3 lg:flex">
              <button
                type="button"
                aria-label="Previous short"
                disabled={index === 0}
                onClick={() => goTo(index - 1)}
                className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-card-2 text-white transition hover:bg-white/15 disabled:cursor-default disabled:opacity-30"
              >
                <ChevronUp className="h-6 w-6" />
              </button>
              <button
                type="button"
                aria-label="Next short"
                disabled={index >= videos.length - 1}
                onClick={() => goTo(index + 1)}
                className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-card-2 text-white transition hover:bg-white/15 disabled:cursor-default disabled:opacity-30"
              >
                <ChevronDown className="h-6 w-6" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Shorts;

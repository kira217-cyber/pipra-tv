import React, { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
} from "lucide-react";

import AdOverlay from "../AdOverlay/AdOverlay";
import { useAdCampaigns } from "../../hooks/useAdCampaigns";
import { useWatchPresence } from "../../hooks/useWatchPresence";
import { trackAction } from "../../hooks/presenceSocket";

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds)) return "0:00";

  const totalSeconds = Math.floor(seconds);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = (totalSeconds % 60).toString().padStart(2, "0");

  return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${s}` : `${m}:${s}`;
};

const VideoPlayer = ({ src, poster, title, adsTarget }) => {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const hideTimer = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const { campaigns } = useAdCampaigns(adsTarget);
  useWatchPresence("video", adsTarget?.video, title);

  // Autoplay as soon as a video is opened — most browsers block autoplay
  // with sound without prior interaction, so fall back to muted playback
  // rather than leaving the player stalled on a blocked play() promise.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const tryPlay = async () => {
      try {
        await video.play();
      } catch {
        video.muted = true;
        setMuted(true);
        video.play().catch(() => {});
      }
    };

    tryPlay();
  }, [src]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused || video.ended) {
      video.play();
      trackAction("Played video", title);
    } else {
      video.pause();
      trackAction("Paused video", title);
    }
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Number(e.target.value);
    setCurrent(Number(e.target.value));
  };

  const skip = (delta) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(Math.max(video.currentTime + delta, 0), duration);
    trackAction(delta > 0 ? "Skipped forward 10s" : "Rewound 10s", title);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    trackAction(video.muted ? "Muted video" : "Unmuted video", title);
  };

  const handleVolume = (e) => {
    const video = videoRef.current;
    if (!video) return;
    const value = Number(e.target.value);
    video.volume = value;
    video.muted = value === 0;
    setVolume(value);
    setMuted(value === 0);
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
      trackAction("Entered fullscreen", title);
    } else {
      document.exitFullscreen?.();
      trackAction("Exited fullscreen", title);
    }
  };

  useEffect(() => {
    const onFsChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const resetHideTimer = (stillPlaying = playing) => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    if (stillPlaying) {
      hideTimer.current = setTimeout(() => setShowControls(false), 3000);
    }
  };

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  return (
    <div
      ref={containerRef}
      onMouseMove={() => resetHideTimer()}
      className="group relative aspect-video w-full overflow-hidden rounded-sm border border-[#ff2d6f]/20 bg-black shadow-2xl shadow-black/40 sm:rounded-2xl"
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="h-full w-full cursor-pointer bg-black object-contain"
        onClick={togglePlay}
        onPlay={() => {
          setPlaying(true);
          setHasStarted(true);
          resetHideTimer(true);
        }}
        onPause={() => {
          setPlaying(false);
          setShowControls(true);
        }}
        onEnded={() => {
          setPlaying(false);
          setShowControls(true);
        }}
        onWaiting={() => setBuffering(true)}
        onCanPlay={() => setBuffering(false)}
        onPlaying={() => setBuffering(false)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
      />

      <AdOverlay
        videoRef={videoRef}
        mode="pause"
        campaigns={campaigns}
        playbackStarted={hasStarted}
      />

      {buffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-[#ff2d6f]" />
        </div>
      )}

      {!playing && !buffering && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/25 transition hover:bg-black/35"
        >
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#ff7aa5] via-[#ff2d6f] to-[#b0103f] shadow-[0_0_50px_rgba(22,214,220,0.5)] transition group-hover:scale-110">
            <Play className="ml-1 h-9 w-9 text-white" fill="black" />
          </span>
        </button>
      )}

      {title && (!playing || showControls) && (
        <div className="pointer-events-none absolute left-0 top-0 w-full bg-gradient-to-b from-black/70 to-transparent px-5 py-4">
          <p className="truncate text-sm font-bold text-white sm:text-base">
            {title}
          </p>
        </div>
      )}

      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-4 pb-3 pt-8 transition-opacity duration-300 ${
          showControls || !playing ? "opacity-100" : "opacity-0"
        }`}
      >
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={current}
          onChange={handleSeek}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/25 accent-[#ff2d6f]"
        />

        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              className="cursor-pointer text-white transition hover:text-[#ff2d6f]"
            >
              {playing ? (
                <Pause className="h-6 w-6" fill="currentColor" />
              ) : (
                <Play className="h-6 w-6" fill="currentColor" />
              )}
            </button>

            <button
              type="button"
              onClick={() => skip(-10)}
              className="cursor-pointer text-white transition hover:text-[#ff2d6f]"
            >
              <RotateCcw className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => skip(10)}
              className="cursor-pointer text-white transition hover:text-[#ff2d6f]"
            >
              <RotateCw className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMute}
                className="cursor-pointer text-white transition hover:text-[#ff2d6f]"
              >
                {muted || volume === 0 ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={handleVolume}
                className="hidden h-1 w-20 cursor-pointer appearance-none rounded-full bg-white/25 accent-[#ff2d6f] sm:block"
              />
            </div>

            <span className="text-xs font-semibold tabular-nums text-slate-200">
              {formatTime(current)} / {formatTime(duration)}
            </span>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="cursor-pointer text-white transition hover:text-[#ff2d6f]"
          >
            {fullscreen ? (
              <Minimize className="h-5 w-5" />
            ) : (
              <Maximize className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;

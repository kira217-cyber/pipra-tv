import React, { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Mic, Pause, Play, Square, Trash2, X } from "lucide-react";

import { toast } from "../../utils/alerts";

// Voice and picture comments: recording a voice comment (with its
// waveform), playing one, and picking a picture. What the admin allows
// comes from hooks/useCommentSettings.

const BARS = 48;

const clock = (seconds) => {
  const s = Math.max(0, Math.round(seconds || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

// The loudness of the recording in BARS bars (0–1), for the waveform.
const measurePeaks = async (blob) => {
  try {
    const Context = window.AudioContext || window.webkitAudioContext;
    const context = new Context();
    const audio = await context.decodeAudioData(await blob.arrayBuffer());
    context.close();
    const data = audio.getChannelData(0);
    const size = Math.max(1, Math.floor(data.length / BARS));
    const bars = Array.from({ length: BARS }, (_, i) => {
      let sum = 0;
      for (let j = i * size; j < Math.min(data.length, (i + 1) * size); j += 1) sum += data[j] * data[j];
      return Math.sqrt(sum / size);
    });
    const top = Math.max(...bars, 0.0001);
    return bars.map((b) => Math.round((b / top) * 100) / 100);
  } catch {
    return [];
  }
};

const pickMime = () => ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"].find((type) => window.MediaRecorder?.isTypeSupported?.(type)) || "";

// ---------- playing a voice comment ----------

export const Waveform = ({ peaks, progress = 0, onSeek }) => {
  const bars = peaks?.length ? peaks : Array.from({ length: BARS }, (_, i) => 0.25 + 0.2 * Math.abs(Math.sin(i * 1.7)));
  return (
    <div
      className={`flex h-8 min-w-0 flex-1 items-center gap-[2px] ${onSeek ? "cursor-pointer" : ""}`}
      onClick={(event) => {
        if (!onSeek) return;
        const box = event.currentTarget.getBoundingClientRect();
        onSeek((event.clientX - box.left) / box.width);
      }}
    >
      {bars.map((peak, i) => (
        <span
          key={i}
          className={`w-[3px] shrink-0 rounded-full ${i / bars.length < progress ? "bg-[#c084fc]" : "bg-white/35"}`}
          style={{ height: `${Math.max(12, peak * 100)}%` }}
        />
      ))}
    </div>
  );
};

export const VoicePlayer = ({ voice }) => {
  const audio = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [measured, setMeasured] = useState(0); // the file's own length, when the comment doesn't say
  const length = voice.seconds || measured;

  const toggle = () => {
    const el = audio.current;
    if (!el) return;
    if (el.paused) {
      // Only one voice comment plays at a time.
      document.querySelectorAll("audio[data-voice]").forEach((other) => other !== el && other.pause());
      el.play().catch(() => toast.error("Couldn't play this voice comment"));
    } else el.pause();
  };

  return (
    <div className="flex w-full max-w-md items-center gap-3 rounded-2xl border border-[#a855f7]/30 bg-[#a855f7]/10 py-2 pl-2 pr-4">
      <button type="button" onClick={toggle} aria-label={playing ? "Pause" : "Play"} className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-[#a855f7] to-[#6d28d9] text-white">
        {playing ? <Pause className="h-5 w-5 fill-white" /> : <Play className="ml-0.5 h-5 w-5 fill-white" />}
      </button>
      <Waveform
        peaks={voice.peaks}
        progress={length ? time / length : 0}
        onSeek={(ratio) => {
          if (audio.current && length) audio.current.currentTime = ratio * length;
        }}
      />
      <span className="shrink-0 text-xs tabular-nums text-slate-300">{clock(playing || time ? time : length)}</span>
      <audio
        ref={audio}
        data-voice
        src={voice.url}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setTime(0);
        }}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => Number.isFinite(e.currentTarget.duration) && setMeasured(e.currentTarget.duration)}
      />
    </div>
  );
};

// ---------- recording ----------

// "ভয়েস কমেন্ট": record (stops by itself at `maxSeconds`), listen, keep or
// throw away. `onChange({ blob, peaks, seconds })` or null.
export const VoiceRecorder = ({ maxSeconds = 60, value, onChange, onRecordingChange }) => {
  const [state, setState] = useState("idle"); // idle | recording
  const [elapsed, setElapsed] = useState(0);
  const recorder = useRef(null);
  const stream = useRef(null);
  const timer = useRef(null);
  const started = useRef(0);
  const previewUrl = useMemo(() => (value?.blob ? URL.createObjectURL(value.blob) : null), [value]);

  useEffect(
    () => () => {
      clearInterval(timer.current);
      stream.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl]);

  const stop = () => {
    clearInterval(timer.current);
    if (recorder.current?.state === "recording") recorder.current.stop();
  };

  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      toast.error("This browser can't record voice — try Chrome or Safari");
      return;
    }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast.error("Allow the microphone to record a voice comment");
      return;
    }
    const mimeType = pickMime();
    const rec = new MediaRecorder(stream.current, mimeType ? { mimeType } : undefined);
    const chunks = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = async () => {
      stream.current?.getTracks().forEach((t) => t.stop());
      const seconds = Math.min(maxSeconds, (Date.now() - started.current) / 1000);
      setState("idle");
      onRecordingChange?.(false);
      if (seconds < 1) {
        toast.info("Hold on a little longer — the recording was too short");
        return;
      }
      const blob = new Blob(chunks, { type: rec.mimeType || mimeType || "audio/webm" });
      onChange({ blob, seconds, peaks: await measurePeaks(blob) });
    };
    recorder.current = rec;
    started.current = Date.now();
    setElapsed(0);
    setState("recording");
    onRecordingChange?.(true);
    rec.start(250);
    timer.current = setInterval(() => {
      const s = (Date.now() - started.current) / 1000;
      setElapsed(s);
      if (s >= maxSeconds) stop();
    }, 200);
  };

  if (state === "recording") {
    return (
      <div className="flex w-full items-center gap-3 rounded-2xl border border-live/40 bg-live/10 px-3 py-2">
        <span className="h-3 w-3 shrink-0 animate-pulse rounded-full bg-live" />
        <span className="text-sm font-semibold tabular-nums">
          {clock(elapsed)} / {clock(maxSeconds)}
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-live" style={{ width: `${Math.min(100, (elapsed / maxSeconds) * 100)}%` }} />
        </div>
        <button type="button" onClick={stop} className="flex cursor-pointer items-center gap-1.5 rounded-full bg-live px-3 py-1.5 text-sm font-semibold text-white">
          <Square className="h-3.5 w-3.5 fill-white" /> Stop
        </button>
      </div>
    );
  }

  if (value?.blob) {
    return (
      <div className="flex w-full items-center gap-2">
        <VoicePlayer voice={{ url: previewUrl, seconds: value.seconds, peaks: value.peaks }} />
        <button type="button" onClick={() => onChange(null)} aria-label="Remove the recording" className="cursor-pointer rounded-full p-2 text-muted hover:bg-white/10 hover:text-white">
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={start}
      className="flex cursor-pointer items-center gap-1.5 rounded-full border border-[#a855f7]/60 bg-[#a855f7]/10 px-4 py-2 text-sm font-semibold text-[#d8b4fe] hover:bg-[#a855f7]/20"
    >
      <Mic className="h-4 w-4" /> ভয়েস কমেন্ট
    </button>
  );
};

// ---------- pictures ----------

export const ImagePickButton = ({ onPick }) => (
  <label className="flex cursor-pointer items-center justify-center rounded-full p-2 text-muted hover:bg-white/10 hover:text-white" title="Add a picture">
    <ImagePlus className="h-5 w-5" />
    <input
      type="file"
      accept="image/*"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        if (file.size > 25 * 1024 * 1024) toast.error("The picture is too large (25 MB at most)");
        else onPick(file);
      }}
    />
  </label>
);

export const ImagePreview = ({ file, onRemove }) => {
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return (
    <div className="relative inline-block">
      {url && <img src={url} alt="" className="max-h-40 rounded-xl border border-line object-contain" />}
      <button type="button" onClick={onRemove} aria-label="Remove the picture" className="absolute -right-2 -top-2 cursor-pointer rounded-full bg-black/80 p-1 text-white hover:bg-black">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export const CommentImage = ({ src }) => (
  <a href={src} target="_blank" rel="noreferrer" className="inline-block">
    <img src={src} alt="" loading="lazy" className="max-h-72 max-w-full rounded-xl border border-line object-contain" />
  </a>
);

import React, { useRef, useState } from "react";
import {
  ImageUp,
  UploadCloud,
  Film,
  Clapperboard,
  Info,
  Save,
} from "lucide-react";

// Reads a video file's real duration in seconds. Some MP4 exports (common
// from phones/screen recorders that don't "faststart" the file) report
// duration as Infinity right at loadedmetadata — forcing a seek to a huge
// timestamp is the standard trick that makes the browser compute the real
// duration. A timeout guards against browsers where even that never fires.
const probeVideoDuration = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const probe = document.createElement("video");
    probe.preload = "metadata";

    const finish = (result, isError) => {
      clearTimeout(timeoutId);
      probe.removeAttribute("src");
      probe.load();
      URL.revokeObjectURL(url);
      if (isError) reject(result);
      else resolve(result);
    };

    const timeoutId = setTimeout(() => finish(probe.duration, false), 6000);

    probe.onloadedmetadata = () => {
      if (Number.isFinite(probe.duration)) {
        finish(probe.duration, false);
        return;
      }

      probe.currentTime = Number.MAX_SAFE_INTEGER;
      probe.ontimeupdate = () => {
        probe.ontimeupdate = null;
        finish(probe.duration, false);
      };
    };

    probe.onerror = () => finish(new Error("Could not read video metadata"), true);

    probe.src = url;
  });

import {
  MATURITY_RATING_OPTIONS,
  CATEGORY_OPTIONS,
} from "../../utils/videoOptions";

const MAX_THUMBNAIL_SIZE = 20 * 1024 * 1024;
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-matroska",
  "video/x-msvideo",
  "video/3gpp",
];

const FileSlot = ({
  label,
  guidance,
  icon,
  accept,
  currentLabel,
  fileName,
  onChange,
  inputRef,
}) => (
  <div>
    <label className="mb-2 block text-sm font-semibold text-slate-200">
      {label}
    </label>

    <div className="mb-3 flex items-start gap-2 rounded-2xl border border-[#ff2d6f]/15 bg-[#ff2d6f]/5 px-4 py-3 text-xs leading-relaxed text-slate-300">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#ff2d6f]" />
      <span>{guidance}</span>
    </div>

    <input
      ref={inputRef}
      type="file"
      accept={accept}
      onChange={onChange}
      className="hidden"
    />

    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="flex cursor-pointer items-center gap-2 rounded-2xl border border-[#ff2d6f]/25 bg-[#ff2d6f]/10 px-5 py-3 text-sm font-bold text-pink-200 transition hover:bg-[#ff2d6f]/20"
    >
      {icon}
      {fileName ? "Change File" : currentLabel ? "Replace File" : "Choose File"}
    </button>

    {fileName && (
      <p className="mt-2 truncate text-xs text-slate-400">
        Selected: {fileName}
      </p>
    )}

    {!fileName && currentLabel && (
      <p className="mt-2 truncate text-xs text-slate-400">
        Current: {currentLabel}
      </p>
    )}
  </div>
);

const VideoForm = ({
  mode = "create",
  initialValues = {},
  submitting = false,
  progress = 0,
  onSubmit,
}) => {
  const landscapeInputRef = useRef(null);
  const portraitInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const trailerInputRef = useRef(null);

  const [title, setTitle] = useState(initialValues.title || "");
  const [description, setDescription] = useState(initialValues.description || "");
  const [duration, setDuration] = useState(initialValues.duration || "");
  const [maturityRating, setMaturityRating] = useState(
    initialValues.maturityRating || "",
  );
  const [category, setCategory] = useState(initialValues.category || "");

  const [landscapeFile, setLandscapeFile] = useState(null);
  const [landscapePreview, setLandscapePreview] = useState(
    initialValues.landscapePreview || null,
  );
  const [portraitFile, setPortraitFile] = useState(null);
  const [portraitPreview, setPortraitPreview] = useState(
    initialValues.portraitPreview || null,
  );
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [trailerFile, setTrailerFile] = useState(null);
  const [trailerPreview, setTrailerPreview] = useState(null);
  const [wantsTrailer, setWantsTrailer] = useState(
    Boolean(initialValues.trailerFileLabel),
  );

  const [error, setError] = useState("");

  const handleLandscapeChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!IMAGE_TYPES.includes(file.type)) {
      setError("Thumbnail must be PNG, JPG, JPEG, WEBP, or GIF");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_THUMBNAIL_SIZE) {
      setError("Thumbnail must be 20MB or smaller");
      e.target.value = "";
      return;
    }

    setError("");
    setLandscapeFile(file);
    setLandscapePreview(URL.createObjectURL(file));
  };

  const handlePortraitChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!IMAGE_TYPES.includes(file.type)) {
      setError("Thumbnail must be PNG, JPG, JPEG, WEBP, or GIF");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_THUMBNAIL_SIZE) {
      setError("Thumbnail must be 20MB or smaller");
      e.target.value = "";
      return;
    }

    setError("");
    setPortraitFile(file);
    setPortraitPreview(URL.createObjectURL(file));
  };

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!VIDEO_TYPES.includes(file.type)) {
      setError("Video files must be MP4, WEBM, MOV, MKV, or AVI");
      e.target.value = "";
      return;
    }

    setError("");
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handleTrailerChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!VIDEO_TYPES.includes(file.type)) {
      setError("Trailer must be MP4, WEBM, MOV, MKV, or AVI");
      e.target.value = "";
      return;
    }

    try {
      const duration = await probeVideoDuration(file);

      if (!Number.isFinite(duration) || duration < 1 || duration > 240) {
        setError(
          `Trailer must be between 1 second and 4 minutes long (yours is ${Math.round(duration)}s)`,
        );
        e.target.value = "";
        return;
      }

      setError("");
      setTrailerFile(file);
      setTrailerPreview(URL.createObjectURL(file));
    } catch {
      setError("Could not read the trailer file — try a different file");
      e.target.value = "";
    }
  };

  const handleTrailerWantChange = (wants) => {
    setWantsTrailer(wants);

    if (!wants) {
      setTrailerFile(null);
      setTrailerPreview(null);
      if (trailerInputRef.current) trailerInputRef.current.value = "";
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim() || !duration.trim() || !maturityRating || !category) {
      setError("Title, duration, maturity rating, and category are required");
      return;
    }

    if (mode === "create" && (!landscapeFile || !portraitFile)) {
      setError("Both the landscape and portrait thumbnail images are required");
      return;
    }

    if (mode === "create" && !videoFile) {
      setError("The full video file is required");
      return;
    }

    if (wantsTrailer && !trailerFile && !initialValues.trailerFileLabel) {
      setError("Choose a trailer file, or switch trailer to \"No\"");
      return;
    }

    setError("");

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("duration", duration.trim());
    formData.append("maturityRating", maturityRating);
    formData.append("category", category);
    if (landscapeFile) formData.append("thumbnailLandscape", landscapeFile);
    if (portraitFile) formData.append("thumbnailPortrait", portraitFile);
    if (videoFile) formData.append("video", videoFile);
    if (trailerFile) formData.append("trailer", trailerFile);

    onSubmit(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-[28px] border border-[#ff2d6f]/20 bg-white/[0.06] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl md:p-8"
    >
      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-300">
          {error}
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-200">
          Video Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. The Last Sunrise"
          className="w-full rounded-2xl border border-[#ff2d6f]/20 bg-black/35 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 transition focus:border-[#ff2d6f]/70 focus:ring-2 focus:ring-[#ff2d6f]/20"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-200">
          Short Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="A brief summary of what viewers can expect..."
          className="w-full rounded-2xl border border-[#ff2d6f]/20 bg-black/35 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 transition focus:border-[#ff2d6f]/70 focus:ring-2 focus:ring-[#ff2d6f]/20"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-200">
            Runtime / Duration
          </label>
          <input
            type="text"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="e.g. 2h 15m"
            className="w-full rounded-2xl border border-[#ff2d6f]/20 bg-black/35 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 transition focus:border-[#ff2d6f]/70 focus:ring-2 focus:ring-[#ff2d6f]/20"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-200">
            Maturity Rating
          </label>
          <select
            value={maturityRating}
            onChange={(e) => setMaturityRating(e.target.value)}
            className="w-full cursor-pointer rounded-2xl border border-[#ff2d6f]/20 bg-black/35 px-4 py-3 text-sm text-white outline-none transition focus:border-[#ff2d6f]/70 focus:ring-2 focus:ring-[#ff2d6f]/20"
          >
            <option value="" className="bg-[#1a0c14]">
              Select rating
            </option>
            {MATURITY_RATING_OPTIONS.map((option) => (
              <option key={option} value={option} className="bg-[#1a0c14]">
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-200">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full cursor-pointer rounded-2xl border border-[#ff2d6f]/20 bg-black/35 px-4 py-3 text-sm text-white outline-none transition focus:border-[#ff2d6f]/70 focus:ring-2 focus:ring-[#ff2d6f]/20"
          >
            <option value="" className="bg-[#1a0c14]">
              Select category
            </option>
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option} className="bg-[#1a0c14]">
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <FileSlot
            label="Thumbnail — Landscape (Desktop/Laptop)"
            icon={<ImageUp className="h-4 w-4" />}
            accept="image/png,image/jpeg,image/webp,image/gif"
            guidance={
              <>
                Recommended{" "}
                <span className="font-bold text-white">1080×608px</span>{" "}
                (16:9), exactly. Used by the home slider from tablet up, on
                desktop/laptop cards, and as the video player's poster. Max
                file size:{" "}
                <span className="font-bold text-white">20MB</span>.
              </>
            }
            currentLabel={initialValues.landscapePreview ? "existing thumbnail" : null}
            fileName={landscapeFile?.name}
            onChange={handleLandscapeChange}
            inputRef={landscapeInputRef}
          />

          {landscapePreview && (
            <div className="mt-3 w-full max-w-md overflow-hidden rounded-2xl border border-[#ff2d6f]/20">
              <img
                src={landscapePreview}
                alt="Landscape thumbnail preview"
                className="aspect-video w-full object-cover"
              />
            </div>
          )}
        </div>

        <div>
          <FileSlot
            label="Thumbnail — Portrait (Mobile)"
            icon={<ImageUp className="h-4 w-4" />}
            accept="image/png,image/jpeg,image/webp,image/gif"
            guidance={
              <>
                Recommended{" "}
                <span className="font-bold text-white">320×480px</span>{" "}
                (2:3), exactly. Shown on mobile card grids and the home slider
                on phones. Max file size:{" "}
                <span className="font-bold text-white">20MB</span>.
              </>
            }
            currentLabel={initialValues.portraitPreview ? "existing thumbnail" : null}
            fileName={portraitFile?.name}
            onChange={handlePortraitChange}
            inputRef={portraitInputRef}
          />

          {portraitPreview && (
            <div className="mt-3 w-full max-w-55 overflow-hidden rounded-2xl border border-[#ff2d6f]/20">
              <img
                src={portraitPreview}
                alt="Portrait thumbnail preview"
                className="aspect-[2/3] w-full object-cover"
              />
            </div>
          )}
        </div>
      </div>

      <p className="-mt-2 text-xs text-slate-500">
        Supported formats:{" "}
        <span className="font-semibold text-slate-300">
          PNG, JPG, JPEG, WEBP, GIF
        </span>
        .
      </p>

      <div>
        <FileSlot
          label="Full Video"
          icon={<UploadCloud className="h-4 w-4" />}
          accept="video/mp4,video/webm,video/quicktime,video/x-matroska,video/x-msvideo,video/3gpp"
          guidance={
            <>
              Supported formats:{" "}
              <span className="font-bold text-white">
                MP4, WEBM, MOV, MKV, AVI
              </span>
              . Max file size:{" "}
              <span className="font-bold text-white">up to 2GB</span>. Larger
              files may take longer to upload — keep this tab open until it
              finishes.
            </>
          }
          currentLabel={initialValues.videoFileLabel}
          fileName={videoFile?.name}
          onChange={handleVideoChange}
          inputRef={videoInputRef}
        />

        {videoPreview && (
          <video
            src={videoPreview}
            controls
            className="mt-3 w-full max-w-md rounded-2xl border border-[#ff2d6f]/20 bg-black"
          />
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-200">
          Trailer (Optional)
        </label>

        <p className="mb-3 text-xs leading-relaxed text-slate-400">
          A short preview clip (up to 4 minutes) viewers watch before the
          full video. Do you want to add one?
        </p>

        <div className="mb-4 flex gap-3">
          <button
            type="button"
            onClick={() => handleTrailerWantChange(true)}
            className={`flex-1 cursor-pointer rounded-2xl border px-4 py-2.5 text-sm font-bold transition ${
              wantsTrailer
                ? "border-[#ff2d6f]/60 bg-[#ff2d6f]/20 text-pink-200"
                : "border-[#ff2d6f]/20 bg-black/25 text-slate-400 hover:bg-[#ff2d6f]/10"
            }`}
          >
            Yes, add a trailer
          </button>

          <button
            type="button"
            onClick={() => handleTrailerWantChange(false)}
            className={`flex-1 cursor-pointer rounded-2xl border px-4 py-2.5 text-sm font-bold transition ${
              !wantsTrailer
                ? "border-[#ff2d6f]/60 bg-[#ff2d6f]/20 text-pink-200"
                : "border-[#ff2d6f]/20 bg-black/25 text-slate-400 hover:bg-[#ff2d6f]/10"
            }`}
          >
            No trailer
          </button>
        </div>

        {wantsTrailer && (
          <>
            <FileSlot
              label="Trailer File"
              icon={<Clapperboard className="h-4 w-4" />}
              accept="video/mp4,video/webm,video/quicktime,video/x-matroska,video/x-msvideo,video/3gpp"
              guidance={
                <>
                  Must be{" "}
                  <span className="font-bold text-white">4 minutes or shorter</span>{" "}
                  . Same supported formats as the full video.
                </>
              }
              currentLabel={initialValues.trailerFileLabel}
              fileName={trailerFile?.name}
              onChange={handleTrailerChange}
              inputRef={trailerInputRef}
            />

            {trailerPreview && (
              <video
                src={trailerPreview}
                controls
                className="mt-3 w-full max-w-md rounded-2xl border border-[#ff2d6f]/20 bg-black"
              />
            )}
          </>
        )}
      </div>

      {submitting && (
        <div>
          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Film className="h-3.5 w-3.5 text-[#ff2d6f]" />
              Uploading...
            </span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-black/40">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#ff7aa5] via-[#ff2d6f] to-[#c026d3] transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ff7aa5] via-[#ff2d6f] to-[#c026d3] px-5 py-3.5 text-sm font-black text-white shadow-[0_18px_50px_rgba(245,158,11,0.30)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Save className="h-5 w-5" />
        {submitting
          ? "Uploading..."
          : mode === "create"
            ? "Submit for Review"
            : "Save Changes"}
      </button>
    </form>
  );
};

export default VideoForm;

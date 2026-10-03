import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "react-toastify";

import VideoForm from "../../components/VideoForm/VideoForm";
import UploadProgressModal from "../../components/UploadProgressModal/UploadProgressModal";
import { EmptyState, PageHeader, Spinner } from "../../components/ui/ui";
import { apiError, studioApi } from "../../api/studioApi";
import { useFetch } from "../../hooks/useFetch";
import { isUploadCancelled, useUploadProgress } from "../../hooks/useUploadProgress";
import { IMG, mediaUrl } from "../../utils/format";

const newUploadId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

// Upload a new video, or edit one (mode="edit"). The server streams the
// file straight to storage as it arrives; progress, time remaining and
// cancel work exactly as in the old Studio app.
const VideoEditor = ({ mode }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = mode === "edit";

  const { data, loading, error } = useFetch(isEdit ? `/api/studio/videos/${id}` : null, undefined, studioApi);
  const video = data?.video;

  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const { upload, start, reportSent, reportStored, complete, fail, cancel, reset } = useUploadProgress();

  const handleSubmit = async (formData) => {
    const uploadId = newUploadId();
    formData.append("uploadId", uploadId);

    const videoFile = formData.get("video");
    const trailerFile = formData.get("trailer");
    const sendingFile = videoFile instanceof File || trailerFile instanceof File;

    // The id and byte counts go in the query string: the server needs them
    // before the file part starts arriving.
    const query = new URLSearchParams({ uploadId });
    if (videoFile instanceof File) query.set("videoBytes", String(videoFile.size));
    if (trailerFile instanceof File) query.set("trailerBytes", String(trailerFile.size));

    const poll = setInterval(async () => {
      try {
        const { data: result } = await studioApi.get(`/api/studio/videos/upload-progress/${uploadId}`);
        const percent = result?.data?.percent ?? 0;
        setProgress((previous) => Math.max(previous, 50 + Math.round(percent / 2)));
        reportStored(percent);
      } catch {
        // Non-critical — the bar just won't advance this tick.
      }
    }, 400);

    try {
      setSubmitting(true);
      setProgress(0);

      let signal;
      if (sendingFile) {
        const biggest = videoFile instanceof File ? videoFile : trailerFile;
        signal = start({ fileName: biggest.name, fileSize: biggest.size, storedBytes: 0 });
      }

      const url = isEdit ? `/api/studio/videos/${id}?${query}` : `/api/studio/videos?${query}`;
      await studioApi[isEdit ? "put" : "post"](url, formData, {
        signal,
        onUploadProgress: (event) => {
          if (!event.total) return;
          setProgress((previous) => Math.max(previous, Math.round((event.loaded / event.total) * 50)));
          reportSent(event.loaded, event.total);
        },
      });

      setProgress(100);
      if (sendingFile) {
        complete();
        // Let the "Upload successful" state be seen before moving on.
        await new Promise((resolve) => setTimeout(resolve, 1400));
      }

      toast.success(
        isEdit ? "Video updated and sent back for review" : "Video uploaded! It will go live once an admin approves it.",
      );
      navigate("/studio/videos");
    } catch (err) {
      if (isUploadCancelled(err)) {
        reset();
        toast.info("Upload cancelled");
      } else {
        const message = apiError(err, isEdit ? "Failed to update video" : "Failed to upload video");
        fail(message);
        toast.error(message);
      }
    } finally {
      clearInterval(poll);
      setSubmitting(false);
      setProgress(0);
    }
  };

  if (isEdit && error) {
    return (
      <EmptyState title="Couldn't load this video" text={apiError(error, "It may have been deleted.")}>
        <Link to="/studio/videos" className="text-sm font-semibold text-brand">
          Back to All Videos
        </Link>
      </EmptyState>
    );
  }
  if (isEdit && (loading || !video)) return <Spinner className="min-h-[60vh]" />;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={isEdit ? "Edit Video" : "Upload Video"}
        subtitle={
          isEdit
            ? "Saving changes sends the video back to admin for review."
            : "Fill in the details below. Your video goes live after an admin reviews it."
        }
      />

      <VideoForm
        mode={isEdit ? "edit" : "create"}
        submitting={submitting}
        progress={upload.active ? upload.percent : progress}
        onSubmit={handleSubmit}
        initialValues={
          isEdit
            ? {
                title: video.title,
                description: video.description,
                duration: video.duration,
                maturityRating: video.maturityRating,
                category: video.category,
                landscapePreview: mediaUrl(video.thumbnail?.landscape, IMG.card),
                portraitPreview: mediaUrl(video.thumbnail?.portrait, IMG.portrait),
                videoFileLabel: "current video file",
                trailerFileLabel: video.trailer ? "current trailer file" : null,
              }
            : undefined
        }
      />

      <UploadProgressModal upload={upload} onClose={reset} onCancel={cancel} />
    </div>
  );
};

export default VideoEditor;

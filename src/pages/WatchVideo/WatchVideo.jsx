import React, { useState } from "react";
import { Link, Navigate, useParams } from "react-router";
import { Bookmark, Share2, ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "react-toastify";

import VideoPlayer from "../../components/VideoPlayer/VideoPlayer";
import ViewerStats from "../../components/ViewerStats/ViewerStats";
import { VideoRail } from "../../components/VideoCard/VideoCard";
import { Avatar, SectionHeader, Spinner } from "../../components/ui/ui";
import { useFetch } from "../../hooks/useFetch";
import { useLocalFlag } from "../../hooks/useLocalFlag";
import { categoryLabel } from "../../utils/categories";
import { IMG, mediaUrl, timeAgo } from "../../utils/format";

const share = async (title) => {
  const url = window.location.href;
  try {
    if (navigator.share) {
      await navigator.share({ title, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    }
  } catch {
    // The share sheet was dismissed.
  }
};

const Pill = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
      active ? "bg-brand text-white" : "bg-card-2 text-white hover:bg-white/10"
    }`}
  >
    {children}
  </button>
);

const WatchVideo = () => {
  const { id } = useParams();
  const { data, loading, error } = useFetch(`/api/site/videos/${id}`);
  const { data: related } = useFetch("/api/site/videos", { sort: "random", limit: 12 });

  const [liked, toggleLike] = useLocalFlag(`pipra_like_${id}`);
  const [disliked, toggleDislike] = useLocalFlag(`pipra_dislike_${id}`);
  const [saved, toggleSave] = useLocalFlag(`pipra_save_${id}`);
  const [subscribed, toggleSubscribe] = useLocalFlag(`pipra_sub_${data?.video?.studioUser?.id}`);
  const [expanded, setExpanded] = useState(false);

  if (error) return <Navigate to="/videos" replace />;
  if (loading || !data) return <Spinner className="min-h-[60vh]" />;

  const { video, moreFromChannel = [] } = data;
  const channel = video.studioUser?.channel;
  const channelName = channel?.name || video.studioUser?.fullName || "PipraTV";
  const recommended = (related?.videos || []).filter((item) => item.id !== video.id);

  return (
    <div className="player-frame mx-auto">
      <div className="-mx-4 sm:mx-0">
        <VideoPlayer
          key={video.id}
          src={video.video?.url}
          poster={mediaUrl(video.thumbnail?.landscape, IMG.hero)}
          title={video.title}
          adsTarget={{ video: id }}
        />
      </div>

      <h1 className="mt-4 text-lg font-bold leading-snug text-white sm:text-2xl">{video.title}</h1>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Link to={`/channel/${video.studioUser?.id}`} className="flex min-w-0 items-center gap-3">
          <Avatar src={mediaUrl(channel?.logo, IMG.avatar)} name={channelName} size="h-11 w-11" />
          <span className="min-w-0">
            <span className="block truncate font-semibold text-white">{channelName}</span>
            <span className="block text-xs text-muted">{categoryLabel(video.category)}</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={toggleSubscribe}
          className={`ml-auto cursor-pointer rounded-full px-5 py-2 text-sm font-semibold transition sm:ml-2 ${
            subscribed ? "bg-card-2 text-white" : "bg-live text-white hover:brightness-110"
          }`}
        >
          {subscribed ? "Subscribed" : "Subscribe"}
        </button>
      </div>

      <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <Pill
          active={liked}
          onClick={() => {
            if (disliked) toggleDislike();
            toggleLike();
          }}
        >
          <ThumbsUp className="h-4 w-4" /> Like
        </Pill>
        <Pill
          active={disliked}
          onClick={() => {
            if (liked) toggleLike();
            toggleDislike();
          }}
        >
          <ThumbsDown className="h-4 w-4" />
        </Pill>
        <Pill onClick={() => share(video.title)}>
          <Share2 className="h-4 w-4" /> Share
        </Pill>
        <Pill active={saved} onClick={toggleSave}>
          <Bookmark className="h-4 w-4" /> {saved ? "Saved" : "Save"}
        </Pill>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="mt-4 block w-full cursor-pointer rounded-2xl bg-card p-4 text-left"
      >
        <p className="text-sm font-semibold text-white">
          {timeAgo(video.createdAt)} · {video.duration} · {video.maturityRating}
        </p>
        {video.description && (
          <p className={`mt-2 whitespace-pre-line text-sm text-slate-300 ${expanded ? "" : "line-clamp-2"}`}>
            {video.description}
          </p>
        )}
        <div className="mt-3 border-t border-line pt-3">
          <ViewerStats id={id} className="!flex-row gap-4" />
        </div>
      </button>

      {moreFromChannel.length > 0 && (
        <section className="mt-8">
          <SectionHeader title={`More from ${channelName}`} to={`/channel/${video.studioUser?.id}`} />
          <VideoRail videos={moreFromChannel} showChannel={false} />
        </section>
      )}

      {recommended.length > 0 && (
        <section className="mt-8">
          <SectionHeader title="Recommended for You" to="/videos" />
          <VideoRail videos={recommended} />
        </section>
      )}
    </div>
  );
};

export default WatchVideo;

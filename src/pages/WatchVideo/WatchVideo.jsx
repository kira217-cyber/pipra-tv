import React, { useState } from "react";
import { Link, Navigate, useParams } from "react-router";
import { BadgeCheck, Bookmark, ChevronDown, Share2, ThumbsDown, ThumbsUp } from "lucide-react";

import VideoPlayer from "../../components/VideoPlayer/VideoPlayer";
import { VideoCard } from "../../components/VideoCard/VideoCard";
import SubscribeButton from "../../components/SubscribeButton/SubscribeButton";
import SaveDialog from "../../components/SaveDialog/SaveDialog";
import Comments from "../../components/Comments/Comments";
import { Avatar, SectionHeader, Spinner } from "../../components/ui/ui";
import { reactToVideo } from "../../api/engage";
import { apiError, studioApi, TOKEN_KEY } from "../../api/studioApi";
import { api } from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useFetch } from "../../hooks/useFetch";
import { useRequireSignIn } from "../../hooks/useRequireSignIn";
import { categoryLabel } from "../../utils/categories";
import { channelPath, formatCount, fullDate, timeAgo, videoId, viewsText } from "../../utils/format";
import { countShare, countView } from "../../utils/visitor";
import { toast } from "../../utils/alerts";
import StudioLink from "../../components/StudioLink/StudioLink";

const Pill = ({ onClick, children, className = "" }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex shrink-0 cursor-pointer items-center gap-2 bg-card-2 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15 ${className}`}
  >
    {children}
  </button>
);

// Compact "up next" row used in the desktop sidebar.
const UpNextRow = ({ video }) => (
  <Link to={`/watch/${videoId(video)}`} className="group flex gap-2">
    <div className="relative w-40 shrink-0 overflow-hidden rounded-lg bg-card-2">
      {video.thumbnail && <img src={video.thumbnail} alt="" loading="lazy" className="aspect-video w-full object-cover" />}
      <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 text-[11px] font-semibold">{video.duration}</span>
    </div>
    <div className="min-w-0">
      <p className="line-clamp-2 text-sm font-medium leading-snug group-hover:text-white">{video.title}</p>
      <p className="mt-1 truncate text-xs text-muted">{video.channel?.name}</p>
      <p className="text-xs text-muted">
        {viewsText(video.views)} · {timeAgo(video.publishedAt)}
      </p>
    </div>
  </Link>
);

// Everything below the fetch — keyed by video so all state starts fresh.
const WatchBody = ({ video, viewer }) => {
  const id = video.id;
  const { channel: myChannel } = useAuth();
  const requireSignIn = useRequireSignIn();
  const { data: moreData } = useFetch("/api/videos", { channel: video.channel?.id, exclude: id, limit: 12 });
  const { data: nextData } = useFetch("/api/videos", { sort: "random", exclude: id, limit: 16 });

  const [reaction, setReaction] = useState(viewer?.reaction || 0);
  const [likes, setLikes] = useState(video.likes || 0);
  const [subscribers, setSubscribers] = useState(video.channel?.subscriberCount || 0);
  const [views, setViews] = useState(video.views);
  const [commentCount, setCommentCount] = useState(video.commentCount || 0);
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const channel = video.channel;
  const isMine = myChannel && channel && myChannel.id === channel.id;
  const moreFromChannel = moreData?.videos || [];
  const upNext = (nextData?.videos || []).filter((item) => item.channel?.id !== channel?.id || moreFromChannel.length === 0);

  const react = async (value) => {
    if (!requireSignIn(value === "like" ? "Sign in to like videos" : "Sign in to rate videos")) return;
    const target = { like: 1, dislike: -1 }[value];
    const next = reaction === target ? 0 : target;
    const before = { reaction, likes };
    setReaction(next);
    setLikes(likes + (next === 1) - (reaction === 1));
    try {
      const result = await reactToVideo(id, next === 1 ? "like" : next === -1 ? "dislike" : "none");
      setLikes(result.likes);
    } catch (error) {
      setReaction(before.reaction);
      setLikes(before.likes);
      toast.error(apiError(error, "Couldn't save"));
    }
  };

  const share = async () => {
    const url = `${window.location.origin}/watch/${id}`;
    try {
      if (navigator.share) await navigator.share({ title: video.title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
      countShare(id);
    } catch {
      // Share sheet dismissed.
    }
  };

  return (
    <div className="mx-auto grid max-w-[1700px] gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
      <div className="min-w-0">
        <div className="-mx-4 overflow-hidden sm:mx-0 sm:rounded-2xl">
          <VideoPlayer
            src={video.videoUrl}
            poster={video.thumbnail}
            title={video.title}
            adsTarget={{ video: id }}
            onStart={() =>
              countView(id).then((response) => {
                const next = response?.data?.data?.views;
                if (next) setViews(next);
              })
            }
          />
        </div>

        <h1 className="mt-3 text-lg font-bold leading-snug text-white sm:text-xl">{video.title}</h1>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Link to={channelPath(channel)} className="flex min-w-0 items-center gap-3">
            <Avatar src={channel?.avatar} name={channel?.name} size="h-10 w-10" ring={false} />
            <span className="min-w-0">
              <span className="flex items-center gap-1 font-semibold text-white">
                <span className="truncate">{channel?.name}</span>
                {channel?.verified && <BadgeCheck className="h-4 w-4 shrink-0 fill-muted text-page" />}
              </span>
              <span className="block text-xs text-muted">
                {formatCount(subscribers)} {subscribers === 1 ? "subscriber" : "subscribers"}
              </span>
            </span>
          </Link>
          {isMine ? (
            <StudioLink to={`/videos/${id}/edit`} className="rounded-full bg-card-2 px-4 py-2 text-sm font-semibold hover:bg-white/15">
              Edit video
            </StudioLink>
          ) : (
            <SubscribeButton key={channel?.id} channelId={channel?.id} initial={viewer} onCount={setSubscribers} />
          )}

          <div className="no-scrollbar -mx-4 flex w-[calc(100%+2rem)] gap-2 overflow-x-auto px-4 sm:mx-0 sm:ml-auto sm:w-auto sm:px-0">
            <div className="flex shrink-0 overflow-hidden rounded-full">
              <Pill className="border-r border-white/10" onClick={() => react("like")}>
                <ThumbsUp className={`h-5 w-5 ${reaction === 1 ? "fill-white" : ""}`} />
                {formatCount(likes)}
              </Pill>
              <Pill onClick={() => react("dislike")}>
                <ThumbsDown className={`h-5 w-5 ${reaction === -1 ? "fill-white" : ""}`} />
              </Pill>
            </div>
            <Pill className="rounded-full" onClick={share}>
              <Share2 className="h-5 w-5" /> Share
            </Pill>
            <Pill className="rounded-full" onClick={() => requireSignIn("Sign in to save videos") && setSaving(true)}>
              <Bookmark className="h-5 w-5" /> Save
            </Pill>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-4 block w-full cursor-pointer rounded-xl bg-card-2 p-3 text-left text-sm hover:bg-white/10"
        >
          <p className="font-semibold text-white">
            {expanded ? `${views.toLocaleString("en-US")} ${views === 1 ? "view" : "views"}` : viewsText(views)} ·{" "}
            {expanded ? fullDate(video.publishedAt) : timeAgo(video.publishedAt)}
            {video.tags?.length > 0 && <span className="ml-2 font-normal text-[#3ea6ff]">{video.tags.slice(0, 3).map((tag) => `#${tag}`).join(" ")}</span>}
          </p>
          {video.description ? (
            <p className={`mt-1 whitespace-pre-line text-slate-200 ${expanded ? "" : "line-clamp-2"}`}>{video.description}</p>
          ) : (
            <p className="mt-1 text-muted">No description.</p>
          )}
          {expanded && (
            <p className="mt-3 text-xs text-muted">
              {categoryLabel(video.category)} · {video.duration}
              {video.isShort ? " · Short" : ""}
            </p>
          )}
          <p className="mt-1 text-xs font-semibold text-white">{expanded ? "Show less" : "...more"}</p>
        </button>

        {/* Comments: always open on desktop; a tap-to-open card on phones. */}
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowComments((v) => !v)}
            className="flex w-full cursor-pointer items-center justify-between rounded-xl bg-card-2 p-3 text-left lg:hidden"
          >
            <span className="font-semibold">
              Comments <span className="font-normal text-muted">{formatCount(commentCount)}</span>
            </span>
            <ChevronDown className={`h-5 w-5 transition ${showComments ? "rotate-180" : ""}`} />
          </button>
          <div className={`${showComments ? "mt-4 block" : "hidden"} lg:block`}>
            <Comments videoId={id} creator={channel} onCountChange={setCommentCount} />
          </div>
        </div>

        {moreFromChannel.length > 0 && (
          <section className="mt-8">
            <SectionHeader title={`More from ${channel?.name}`} to={channelPath(channel)} />
            <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              {moreFromChannel.map((item) => (
                <VideoCard key={item.id} video={item} showChannel={false} className="w-[44%] shrink-0 sm:w-[31%] lg:w-[23%]" />
              ))}
            </div>
          </section>
        )}

        {upNext.length > 0 && (
          <section className="mt-8 xl:hidden">
            <SectionHeader title="Up next" />
            <div className="grid grid-cols-1 gap-y-5 sm:grid-cols-2 sm:gap-x-3 lg:grid-cols-3">
              {upNext.map((item) => (
                <VideoCard key={item.id} video={item} />
              ))}
            </div>
          </section>
        )}
      </div>

      {upNext.length > 0 && (
        <aside className="hidden space-y-3 xl:block">
          {upNext.map((item) => (
            <UpNextRow key={item.id} video={item} />
          ))}
        </aside>
      )}

      {saving && <SaveDialog videoId={id} onClose={() => setSaving(false)} />}
    </div>
  );
};

const WatchVideo = () => {
  const { id } = useParams();
  const client = localStorage.getItem(TOKEN_KEY) ? studioApi : api;
  const { data, loading, error } = useFetch(`/api/videos/${id}`, undefined, client);

  if (error) return <Navigate to="/videos" replace />;
  if (loading || !data?.video) return <Spinner className="min-h-[60vh]" />;
  return <WatchBody key={id} video={data.video} viewer={data.viewer} />;
};

export default WatchVideo;

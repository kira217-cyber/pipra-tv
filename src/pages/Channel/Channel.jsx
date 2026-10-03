import React, { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router";
import {
  BadgeCheck,
  Bell,
  BellRing,
  ChevronRight,
  Clapperboard,
  Film,
  Gamepad2,
  Laugh,
  ListVideo,
  MessagesSquare,
  Theater,
  Trophy,
} from "lucide-react";

import { VideoGrid, VideoRail, VideoRow } from "../../components/VideoCard/VideoCard";
import { Avatar, EmptyState, Logo, SectionHeader, Spinner } from "../../components/ui/ui";
import { useFetch } from "../../hooks/useFetch";
import { useLocalFlag } from "../../hooks/useLocalFlag";
import { categoryLabel } from "../../utils/categories";
import { formatCount, IMG, mediaUrl } from "../../utils/format";

const TABS = ["Home", "Videos", "Shorts", "Playlists", "Community", "About"];

const PLAYLIST_STYLE = {
  Movie: { icon: Film, tint: "#3a3f4a" },
  Natok: { icon: Theater, tint: "#3b2a12" },
  Drama: { icon: Theater, tint: "#3b2a12" },
  Animation: { icon: Gamepad2, tint: "#4a1d2b" },
  Comedy: { icon: Laugh, tint: "#4a1d2b" },
  Sports: { icon: Trophy, tint: "#13294b" },
};

const handleOf = (name) => `@${(name || "channel").toLowerCase().replace(/[^a-z0-9_]+/g, "")}`;

// Channel banner — the server has no cover image yet, so the banner is
// the PipraTV mark over the channel's own category line-up.
const Banner = ({ categories }) => (
  <div className="relative -mx-4 overflow-hidden sm:mx-0 sm:rounded-2xl">
    <div className="relative flex aspect-[16/6] flex-col items-center justify-center bg-gradient-to-r from-[#2a0818] via-[#120d1f] to-[#2a0818] sm:aspect-[16/4.5]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,45,111,0.35),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(192,38,211,0.3),transparent_45%)]" />
      <Logo className="relative h-12 sm:h-16 lg:h-20" />
      <p className="relative mt-1 text-xs text-white/90 sm:text-sm">Watch Together · Grow Together</p>
      {categories.length > 0 && (
        <p className="relative mt-2 rounded bg-live/90 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white sm:text-xs">
          {categories.slice(0, 5).join(" | ")}
        </p>
      )}
      <p className="absolute right-4 top-3 rotate-[-6deg] font-serif text-sm italic text-white/80 sm:text-lg">
        Entertainment
        <br />
        For Everyone
      </p>
    </div>
  </div>
);

const Channel = () => {
  const { id } = useParams();
  const { data, loading, error } = useFetch(`/api/site/channels/${id}`);
  const [tab, setTab] = useState("Home");
  const [subscribed, toggleSubscribe] = useLocalFlag(`pipra_sub_${id}`);
  const [bell, toggleBell] = useLocalFlag(`pipra_bell_${id}`);

  const channel = data?.channel;

  // Raw channel videos, shaped like the list summaries the cards expect.
  const videos = useMemo(
    () =>
      (data?.videos || []).map((video) => ({
        ...video,
        id: video._id,
        channelName: channel?.name,
        channelId: channel?.id,
        channelLogo: channel?.logo,
      })),
    [data, channel],
  );

  const playlists = useMemo(() => {
    const groups = new Map();
    videos.forEach((video) => {
      if (!groups.has(video.category)) groups.set(video.category, []);
      groups.get(video.category).push(video);
    });
    return [...groups.entries()]
      .map(([category, list]) => ({ category, list }))
      .sort((a, b) => b.list.length - a.list.length);
  }, [videos]);

  if (error) return <Navigate to="/channels" replace />;
  if (loading || !data) return <Spinner className="min-h-[60vh]" />;

  const totalViews = videos.reduce((sum, video) => sum + (video.views || 0), 0);
  const popular = [...videos].sort((a, b) => (b.views || 0) - (a.views || 0));
  const [latest, ...rest] = videos;
  const categoryNames = playlists.map((item) => categoryLabel(item.category).toUpperCase());

  return (
    <div>
      <Banner categories={categoryNames} />

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Avatar src={mediaUrl(channel.logo, IMG.avatar)} name={channel.name} size="h-20 w-20 sm:h-24 sm:w-24" />
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
            <span className="truncate">{channel.name}</span>
            <BadgeCheck className="h-6 w-6 shrink-0 fill-[#2f86e6] text-white" />
          </h1>
          <p className="text-sm text-muted">{handleOf(channel.name)}</p>
          <p className="text-sm text-slate-300">
            {videos.length} videos
            {totalViews > 0 && ` · ${formatCount(totalViews)} views`}
          </p>
        </div>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <button
            type="button"
            aria-label="Notifications"
            onClick={toggleBell}
            className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full bg-card-2 hover:bg-white/10"
          >
            {bell ? <BellRing className="h-5 w-5 fill-white" /> : <Bell className="h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={toggleSubscribe}
            className={`h-12 flex-1 cursor-pointer rounded-full px-8 font-semibold transition sm:flex-none ${
              subscribed ? "bg-card-2 text-white" : "bg-live text-white hover:brightness-110"
            }`}
          >
            {subscribed ? "Subscribed" : "Subscribe"}
          </button>
        </div>
      </div>

      <p className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-300">
        সবার জন্য বিনোদন! নতুন সিনেমা, নাটক, কার্টুন, খেলা এবং আরও অনেক কিছু — সব একসাথে {channel.name}-তে।
        <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
      </p>

      <div className="no-scrollbar -mx-4 mt-4 flex overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0">
        {TABS.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setTab(name)}
            className={`shrink-0 cursor-pointer border-b-[3px] px-4 py-3 text-[15px] font-medium transition sm:px-6 ${
              tab === name ? "border-live text-live" : "border-transparent text-slate-200 hover:text-white"
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {videos.length === 0 && tab !== "About" && tab !== "Community" ? (
          <EmptyState icon={Clapperboard} title="No videos yet" text="This channel hasn't published anything yet." />
        ) : tab === "Home" ? (
          <div className="space-y-8">
            {latest && (
              <VideoRow video={latest}>
                <p className="mt-2 line-clamp-3 text-sm text-slate-300">
                  {categoryLabel(latest.category)} · {latest.duration}
                </p>
              </VideoRow>
            )}

            {rest.length > 0 && (
              <section>
                <SectionHeader title="For You" />
                <VideoRail videos={rest} showChannel={false} />
              </section>
            )}

            {popular.length > 1 && (
              <section>
                <SectionHeader title="Popular Videos" />
                <VideoRail videos={popular.slice(0, 12)} showChannel={false} />
              </section>
            )}

            {playlists.length > 0 && (
              <section>
                <SectionHeader title="Created Playlists" />
                <PlaylistGrid playlists={playlists} onOpen={() => setTab("Playlists")} />
              </section>
            )}
          </div>
        ) : tab === "Videos" ? (
          <VideoGrid videos={videos} showChannel={false} />
        ) : tab === "Shorts" ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {videos.map((video) => (
              <Link key={video.id} to="/shorts" className="group relative aspect-[9/16] overflow-hidden rounded-xl bg-card-2">
                <img
                  src={mediaUrl(video.thumbnail?.portrait, IMG.portrait)}
                  alt={video.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
                <span className="absolute inset-x-0 bottom-0 line-clamp-2 bg-gradient-to-t from-black/90 p-2 text-xs font-medium">
                  {video.title}
                </span>
              </Link>
            ))}
          </div>
        ) : tab === "Playlists" ? (
          <div className="space-y-8">
            {playlists.map((playlist) => (
              <section key={playlist.category}>
                <SectionHeader title={`${categoryLabel(playlist.category)} · ${playlist.list.length} videos`} />
                <VideoRail videos={playlist.list} showChannel={false} />
              </section>
            ))}
          </div>
        ) : tab === "Community" ? (
          <EmptyState icon={MessagesSquare} title="No posts yet" text="Community posts from this channel will show up here." />
        ) : (
          <div className="rounded-2xl border border-line bg-card p-5 text-sm text-slate-300">
            <p className="font-semibold text-white">About {channel.name}</p>
            <p className="mt-2">
              সবার জন্য বিনোদন! নতুন সিনেমা, নাটক, কার্টুন, খেলা এবং আরও অনেক কিছু — সব একসাথে PipraTV-তে।
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat label="Videos" value={videos.length} />
              <Stat label="Total views" value={formatCount(totalViews)} />
              <Stat label="Playlists" value={playlists.length} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Stat = ({ label, value }) => (
  <div className="rounded-xl bg-card-2 p-3">
    <p className="text-lg font-bold text-white">{value}</p>
    <p className="text-xs text-muted">{label}</p>
  </div>
);

const PlaylistGrid = ({ playlists, onOpen }) => (
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
    {playlists.slice(0, 8).map(({ category, list }) => {
      const style = PLAYLIST_STYLE[category] || { icon: ListVideo, tint: "#1d2a3a" };
      const Icon = style.icon;
      return (
        <button
          key={category}
          type="button"
          onClick={onOpen}
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-3 text-left transition hover:brightness-125"
          style={{ background: style.tint }}
        >
          <Icon className="h-10 w-10 shrink-0 text-white/90" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{categoryLabel(category)}</span>
            <span className="block text-xs text-slate-300">{list.length} videos</span>
          </span>
        </button>
      );
    })}
  </div>
);

export default Channel;

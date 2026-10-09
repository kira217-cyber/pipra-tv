import React, { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router";
import { BadgeCheck, ChevronRight, Clapperboard, Globe, Info, Link2, ListVideo, Mail, MapPin, TrendingUp, Zap } from "lucide-react";

import { VideoCard, VideoGrid, VideoRow } from "../../components/VideoCard/VideoCard";
import { Avatar, Chips, EmptyState, Logo, SectionHeader, Spinner } from "../../components/ui/ui";
import { useAuth } from "../../context/AuthContext";
import { useFetch } from "../../hooks/useFetch";
import SubscribeButton from "../../components/SubscribeButton/SubscribeButton";
import { categoryLabel } from "../../utils/categories";
import { formatCount, fullDate, viewsText } from "../../utils/format";
import StudioLink from "../../components/StudioLink/StudioLink";

const TABS = ["Home", "Videos", "Shorts", "Playlists", "About"];
const SORTS = [
  { label: "Latest", value: "latest" },
  { label: "Popular", value: "popular" },
  { label: "Oldest", value: "oldest" },
];

const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

const Banner = ({ url }) => (
  <div className="-mx-4 overflow-hidden sm:mx-0 sm:rounded-2xl">
    {url ? (
      <img src={url} alt="" className="aspect-[16/4] w-full object-cover sm:aspect-[6/1]" />
    ) : (
      <div className="relative flex aspect-[16/4] items-center justify-center bg-gradient-to-r from-[#2a0818] via-[#120d1f] to-[#2a0818] sm:aspect-[6/1]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,45,111,0.3),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(192,38,211,0.25),transparent_45%)]" />
        <Logo className="relative h-10 opacity-80 sm:h-14" />
      </div>
    )}
  </div>
);

const ShortTile = ({ video }) => (
  <Link to={`/shorts?v=${video.id}`} className="group relative block overflow-hidden rounded-xl bg-card-2">
    <div className="aspect-[9/16]">
      {video.thumbnail && <img src={video.thumbnail} alt={video.title} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />}
    </div>
    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2 pt-8">
      <span className="line-clamp-2 text-xs font-semibold">{video.title}</span>
      <span className="text-[11px] text-white/80">{viewsText(video.views)}</span>
    </span>
  </Link>
);

const Rail = ({ children }) => <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:px-0">{children}</div>;

const Channel = ({ handle }) => {
  const { id } = useParams();
  const key = handle ? `@${handle}` : id;
  const { channel: mine } = useAuth();
  const { data, loading, error } = useFetch(`/api/channels/${encodeURIComponent(key)}`);
  const channel = data?.channel;
  const cid = channel?.id;

  const [tab, setTab] = useState("Home");
  const [sort, setSort] = useState("latest");
  const [subscribers, setSubscribers] = useState(null);
  const { data: playlistData } = useFetch(cid ? `/api/channels/${cid}/playlists` : null);

  const { data: videosData } = useFetch(cid ? "/api/videos" : null, { channel: cid, type: "videos", sort, limit: 48 });
  const { data: shortsData } = useFetch(cid ? "/api/videos" : null, { channel: cid, type: "shorts", sort: "latest", limit: 48 });
  const { data: popularData } = useFetch(cid ? "/api/videos" : null, { channel: cid, sort: "popular", limit: 12 });

  const videos = useMemo(() => videosData?.videos || [], [videosData]);
  const shorts = shortsData?.videos || [];
  const popular = popularData?.videos || [];

  const playlists = useMemo(() => {
    const groups = new Map();
    videos.forEach((video) => {
      if (!groups.has(video.category)) groups.set(video.category, []);
      groups.get(video.category).push(video);
    });
    return [...groups.entries()].map(([category, list]) => ({ category, list })).sort((a, b) => b.list.length - a.list.length);
  }, [videos]);

  if (error) return <Navigate to="/channels" replace />;
  if (loading || !channel) return <Spinner className="min-h-[60vh]" />;

  const isMine = mine?.id === channel.id;
  const subscriberCount = subscribers ?? channel.subscriberCount;
  const userPlaylists = playlistData?.playlists || [];
  const [spotlight, ...restVideos] = videos;
  const total = (channel.longCount || 0) + (channel.shortCount || 0);
  const links = channel.links || [];

  return (
    <div>
      <Banner url={channel.banner} />

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar src={channel.avatar} name={channel.name} size="h-20 w-20 sm:h-36 sm:w-36" ring={false} />
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-4xl">
            <span className="truncate">{channel.name}</span>
            {channel.verified && <BadgeCheck className="h-6 w-6 shrink-0 fill-muted text-page" />}
          </h1>
          <p className="mt-1 text-sm text-muted">
            <span className="font-semibold text-white">@{channel.handle}</span> · {formatCount(subscriberCount)} {subscriberCount === 1 ? "subscriber" : "subscribers"} · {total} videos
          </p>
          {channel.description && (
            <button type="button" onClick={() => setTab("About")} className="mt-1 flex max-w-2xl cursor-pointer items-center gap-1 text-left text-sm text-muted hover:text-white">
              <span className="line-clamp-1">{channel.description}</span>
              <ChevronRight className="h-4 w-4 shrink-0" />
            </button>
          )}
          {links.length > 0 && (
            <p className="mt-1 text-sm">
              <a href={links[0].url} target="_blank" rel="noreferrer" className="font-semibold text-[#3ea6ff] hover:underline">
                {hostOf(links[0].url)}
              </a>
              {links.length > 1 && (
                <button type="button" onClick={() => setTab("About")} className="ml-1 cursor-pointer text-muted hover:text-white">
                  and {links.length - 1} more link{links.length > 2 ? "s" : ""}
                </button>
              )}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {isMine ? (
              <>
                <StudioLink to="/customize" className="rounded-full bg-card-2 px-4 py-2 text-sm font-semibold hover:bg-white/15">
                  Customize channel
                </StudioLink>
                <StudioLink to="/videos" className="rounded-full bg-card-2 px-4 py-2 text-sm font-semibold hover:bg-white/15">
                  Manage videos
                </StudioLink>
              </>
            ) : (
              <SubscribeButton key={channel.id} channelId={channel.id} initial={data?.viewer} onCount={setSubscribers} />
            )}
          </div>
        </div>
      </div>

      <div className="no-scrollbar -mx-4 mt-4 flex overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0">
        {TABS.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setTab(name)}
            className={`shrink-0 cursor-pointer border-b-[3px] px-4 py-3 text-[15px] font-semibold transition sm:px-6 ${
              tab === name ? "border-white text-white" : "border-transparent text-muted hover:text-white"
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === "Home" &&
          (total === 0 ? (
            <EmptyState icon={Clapperboard} title={isMine ? "Upload your first video" : "This channel doesn't have any content"} text={isMine ? "Your videos and Shorts will appear here." : undefined}>
              {isMine && (
                <StudioLink to="/upload" className="bg-brand-gradient rounded-xl px-5 py-2.5 text-sm font-semibold">
                  Upload video
                </StudioLink>
              )}
            </EmptyState>
          ) : (
            <div className="space-y-8">
              {spotlight && (
                <VideoRow video={spotlight}>
                  {spotlight.description && <p className="mt-2 line-clamp-3 text-sm text-slate-300">{spotlight.description}</p>}
                </VideoRow>
              )}
              {restVideos.length > 0 && (
                <section>
                  <SectionHeader title="Videos" action="Play all" />
                  <Rail>
                    {restVideos.slice(0, 12).map((video) => (
                      <VideoCard key={video.id} video={video} showChannel={false} className="w-[44%] shrink-0 sm:w-[31%] lg:w-[23%] xl:w-[18.8%]" />
                    ))}
                  </Rail>
                </section>
              )}
              {shorts.length > 0 && (
                <section>
                  <h2 className="mb-3 flex items-center gap-2 text-lg font-bold sm:text-xl">
                    <Zap className="h-5 w-5 fill-live text-live" /> Shorts
                  </h2>
                  <Rail>
                    {shorts.slice(0, 12).map((video) => (
                      <div key={video.id} className="w-[38%] shrink-0 sm:w-[22%] lg:w-[15%]">
                        <ShortTile video={video} />
                      </div>
                    ))}
                  </Rail>
                </section>
              )}
              {popular.length > 1 && (
                <section>
                  <h2 className="mb-3 flex items-center gap-2 text-lg font-bold sm:text-xl">
                    <TrendingUp className="h-5 w-5 text-brand" /> Popular
                  </h2>
                  <Rail>
                    {popular.map((video) => (
                      <VideoCard key={video.id} video={video} showChannel={false} className="w-[44%] shrink-0 sm:w-[31%] lg:w-[23%] xl:w-[18.8%]" />
                    ))}
                  </Rail>
                </section>
              )}
            </div>
          ))}

        {tab === "Videos" && (
          <>
            <Chips items={SORTS} value={sort} onChange={setSort} className="mb-5" />
            {videos.length === 0 ? <EmptyState icon={Clapperboard} title="No videos yet" /> : <VideoGrid videos={videos} showChannel={false} />}
          </>
        )}

        {tab === "Shorts" &&
          (shorts.length === 0 ? (
            <EmptyState icon={Zap} title="No Shorts yet" />
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              {shorts.map((video) => (
                <ShortTile key={video.id} video={video} />
              ))}
            </div>
          ))}

        {tab === "Playlists" &&
          (playlists.length === 0 && userPlaylists.length === 0 ? (
            <EmptyState icon={ListVideo} title="No playlists yet" />
          ) : (
            <div className="space-y-8">
              {userPlaylists.length > 0 && (
                <section>
                  <SectionHeader title="Created playlists" />
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {userPlaylists.map((playlist) => (
                      <Link key={playlist.id} to={`/playlist/${playlist.id}`} className="group block">
                        <div className="relative aspect-video overflow-hidden rounded-xl bg-card-2">
                          {playlist.thumbnail && <img src={playlist.thumbnail} alt="" className="h-full w-full object-cover" />}
                          <span className="absolute inset-y-0 right-0 flex w-2/5 flex-col items-center justify-center bg-black/75 text-sm font-semibold">
                            <ListVideo className="h-5 w-5" /> {playlist.videoCount}
                          </span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm font-semibold group-hover:text-white">{playlist.title}</p>
                        <p className="text-xs text-muted">View full playlist</p>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
              {playlists.map((playlist) => (
                <section key={playlist.category}>
                  <SectionHeader title={`${categoryLabel(playlist.category)} · ${playlist.list.length} videos`} />
                  <Rail>
                    {playlist.list.map((video) => (
                      <VideoCard key={video.id} video={video} showChannel={false} className="w-[44%] shrink-0 sm:w-[31%] lg:w-[23%] xl:w-[18.8%]" />
                    ))}
                  </Rail>
                </section>
              ))}
            </div>
          ))}

        {tab === "About" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold">Description</h2>
                <p className="mt-2 whitespace-pre-line text-sm text-slate-200">{channel.description || "No description."}</p>
              </div>
              {links.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold">Links</h2>
                  <ul className="mt-2 space-y-3">
                    {links.map((link) => (
                      <li key={link.url} className="flex items-start gap-3">
                        <Link2 className="mt-0.5 h-5 w-5 shrink-0 text-muted" />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold">{link.title || hostOf(link.url)}</span>
                          <a href={link.url} target="_blank" rel="noreferrer" className="block truncate text-sm text-[#3ea6ff] hover:underline">
                            {link.url}
                          </a>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold">Channel details</h2>
              <ul className="mt-3 space-y-3 text-sm text-slate-200">
                {channel.contactEmail && (
                  <li className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted" />
                    <a href={`mailto:${channel.contactEmail}`} className="text-[#3ea6ff] hover:underline">
                      {channel.contactEmail}
                    </a>
                  </li>
                )}
                <li className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-muted" /> pipratv.com/@{channel.handle}
                </li>
                <li className="flex items-center gap-3">
                  <Info className="h-5 w-5 text-muted" /> {formatCount(subscriberCount)} subscribers · {total} videos
                </li>
                <li className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-muted" /> {channel.totalViews.toLocaleString("en-US")} views
                </li>
                <li className="flex items-center gap-3">
                  <Info className="h-5 w-5 text-muted" /> Joined {fullDate(channel.createdAt)}
                </li>
                {channel.country && (
                  <li className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted" /> {channel.country}
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// "/@handle" — the YouTube-style channel address.
export const ChannelByHandle = () => {
  const { at } = useParams();
  if (!at?.startsWith("@") || at.length < 2) return <Navigate to="/" replace />;
  const handle = at.slice(1);
  return <Channel key={handle} handle={handle} />;
};

export default Channel;

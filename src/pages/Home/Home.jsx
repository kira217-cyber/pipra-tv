import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { ArrowUpRight, EllipsisVertical } from "lucide-react";

import FeedCard from "../../components/FeedCard/FeedCard";
import LivePreviewCard from "../../components/LivePreviewCard/LivePreviewCard";
import ChannelCircle, { ChannelRail, railItemClass } from "../../components/ChannelCircle/ChannelCircle";
import { Logo, SectionHeader, Spinner } from "../../components/ui/ui";
import { api } from "../../api/axios";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { useFetch } from "../../hooks/useFetch";
import { HOME_ROWS } from "../../utils/categories";
import { IMG, formatCount, mediaUrl, videoId } from "../../utils/format";

const PAGE_SIZE = 12;

const ShortsMark = () => (
  <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden="true">
    <path
      fill="#ff1f4b"
      d="M15.5 3.2 7.9 7.4a3.4 3.4 0 0 0 .2 6l.7.3-1.1.6a3.4 3.4 0 1 0 3.3 6l7.6-4.2a3.4 3.4 0 0 0-.2-6l-.7-.3 1.1-.6a3.4 3.4 0 1 0-3.3-6Z"
    />
    <path fill="#fff" d="m10.3 9.3 4.4 2.7-4.4 2.7Z" />
  </svg>
);

// Sponsored card — the admin's home ad (Site → Ads), in the feed style.
const SponsoredCard = ({ ad }) => {
  const host = (() => {
    try {
      return new URL(ad.url).hostname.replace(/^www\./, "");
    } catch {
      return "PipraTV";
    }
  })();
  const open = ad.url ? { href: ad.url, target: "_blank", rel: "noreferrer" } : {};

  return (
    <article>
      <a {...open} className="relative block overflow-hidden rounded-2xl border border-line bg-card-2">
        <img src={mediaUrl(ad.image, IMG.hero)} alt="Sponsored" className="aspect-video w-full object-cover" loading="eager" />
        {ad.url && (
          <span className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white">
            <ArrowUpRight className="h-6 w-6" />
          </span>
        )}
      </a>
      <div className="mt-3 flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black p-1">
          <Logo className="h-full" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[15px] font-semibold leading-snug text-white">Special offer — tap to learn more</p>
          <p className="text-[13px] text-muted">
            <span className="font-semibold text-slate-200">Sponsored</span> · {host}
          </p>
        </div>
        <EllipsisVertical className="h-5 w-5 shrink-0 text-white/80" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <a {...open} className="rounded-full bg-card-2 py-2.5 text-center text-sm font-semibold text-white hover:bg-white/10">
          Watch
        </a>
        <Link to="/register" className="rounded-full bg-white py-2.5 text-center text-sm font-semibold text-black hover:bg-white/90">
          Sign up
        </Link>
      </div>
    </article>
  );
};

const ShortsShelf = ({ videos }) => (
  <section className="sm:col-span-2 lg:col-span-3">
    <div className="mb-3 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-xl font-bold">
        <ShortsMark /> Shorts
      </h2>
      <EllipsisVertical className="h-5 w-5 text-white/80" />
    </div>
    <div className="no-scrollbar -mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      {videos.map((video) => (
        <Link
          key={videoId(video)}
          to="/shorts"
          className="group relative w-[42%] shrink-0 snap-start overflow-hidden rounded-2xl bg-card-2 min-[480px]:w-[31%] sm:w-[23%] lg:w-[16%]"
        >
          <div className="aspect-[9/16]">
            <img
              src={mediaUrl(video.thumbnail?.portrait || video.thumbnail?.landscape, IMG.portrait)}
              alt={video.title}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2.5 pt-10">
            <p className="line-clamp-2 text-[13px] font-semibold leading-tight text-white">{video.title}</p>
            {typeof video.views === "number" && (
              <p className="mt-0.5 text-xs text-white/80">{formatCount(video.views)} views</p>
            )}
          </div>
        </Link>
      ))}
    </div>
  </section>
);

const Home = () => {
  const { settings, loading } = useSiteSettings();
  const { data: shortsData } = useFetch("/api/site/videos", { sort: "random", limit: 10 });

  const [pages, setPages] = useState({ videos: [], page: 0, totalPages: 1, loading: true });
  const sentinel = useRef(null);

  // Endless feed: newest videos, a page at a time as you scroll.
  const appendPage = useCallback((page, data) => {
    setPages((previous) => ({
      videos: page === 1 ? data?.videos || [] : [...previous.videos, ...(data?.videos || [])],
      page,
      totalPages: data?.totalPages || 1,
      loading: false,
    }));
  }, []);

  const fetchPage = (page) => api.get("/api/site/videos", { params: { limit: PAGE_SIZE, page } }).then(({ data }) => data?.data);

  const loadPage = useCallback(
    (page) => {
      setPages((previous) => ({ ...previous, loading: true }));
      fetchPage(page)
        .then((data) => appendPage(page, data))
        .catch(() => setPages((previous) => ({ ...previous, loading: false })));
    },
    [appendPage],
  );

  useEffect(() => {
    let cancelled = false;
    fetchPage(1)
      .then((data) => !cancelled && appendPage(1, data))
      .catch(() => !cancelled && setPages((previous) => ({ ...previous, loading: false })));
    return () => {
      cancelled = true;
    };
  }, [appendPage]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !pages.loading && pages.page > 0 && pages.page < pages.totalPages) {
          loadPage(pages.page + 1);
        }
      },
      { rootMargin: "800px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [pages, loadPage]);

  // Admin-promoted rows lead the feed, then everything else newest-first.
  const feed = useMemo(() => {
    const seen = new Set();
    const promoted = HOME_ROWS.flatMap((row) => settings?.promotedVideos?.[row.key] || []);
    return [...(settings?.promotedVideos?.slider || []), ...promoted, ...pages.videos].filter((video) => {
      const id = videoId(video);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [settings, pages.videos]);

  if (loading && !settings) return <Spinner className="min-h-[60vh]" />;

  const liveChannels = settings?.liveTv || [];
  const ownChannel = liveChannels.find((channel) => channel.channelType === "scheduled") || liveChannels[0];
  const channels = settings?.channels || [];
  const ad = settings?.ads?.ads1;
  const shorts = shortsData?.videos || [];
  const heroImage = mediaUrl(settings?.heroSlides?.[0]?.image, IMG.hero);

  const blocks = [];
  feed.forEach((video, index) => {
    blocks.push(<FeedCard key={videoId(video)} video={video} eager={index < 2} />);
    if (index === 0 && shorts.length) blocks.push(<ShortsShelf key="shorts" videos={shorts} />);
    if (index === 3 && liveChannels.length > 1) {
      blocks.push(
        <section key="live" className="sm:col-span-2 lg:col-span-3">
          <SectionHeader title="Live TV Channels" to="/live-tv" />
          <ChannelRail>
            {liveChannels.map((channel) => (
              <ChannelCircle key={channel._id} name={channel.name} logo={channel.logo} to={`/live-tv/${channel._id}`} live className={railItemClass} />
            ))}
          </ChannelRail>
        </section>,
      );
    }
    if (index === 6 && settings?.ads?.ads2?.image) {
      blocks.push(<SponsoredCard key="ad2" ad={settings.ads.ads2} />);
    }
    if (index === 9 && channels.length) {
      blocks.push(
        <section key="channels" className="sm:col-span-2 lg:col-span-3">
          <SectionHeader title="Popular Channels" to="/channels" />
          <ChannelRail>
            {channels.map((channel) => (
              <ChannelCircle key={channel.id} name={channel.name} logo={channel.logo} to={`/channel/${channel.id}`} className={railItemClass} />
            ))}
          </ChannelRail>
        </section>,
      );
    }
  });

  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 [&>*]:min-w-0">
      {ad?.image && <SponsoredCard ad={ad} />}
      {ownChannel && <LivePreviewCard channel={ownChannel} fallbackImage={heroImage} />}
      {blocks}
      <div ref={sentinel} className="sm:col-span-2 lg:col-span-3">
        {pages.loading && <Spinner className="py-6" />}
      </div>
    </div>
  );
};

export default Home;

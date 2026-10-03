import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  BadgeCheck,
  BarChart3,
  ChevronRight,
  Clock,
  CloudUpload,
  EllipsisVertical,
  Filter,
  Globe,
  ListFilter,
  MessageSquare,
  Pencil,
  Search,
  Share2,
  ThumbsUp,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "react-toastify";

import { Avatar, Card, EmptyState, GhostButton, Spinner } from "../../components/ui/ui";
import { apiError, studioApi } from "../../api/studioApi";
import { useAuth } from "../../context/AuthContext";
import { useFetch } from "../../hooks/useFetch";
import { creatorHandle } from "../../utils/menu";
import { VIDEO_CATEGORIES } from "../../utils/categories";
import { formatCount, IMG, mediaUrl, timeAgo } from "../../utils/format";
import { demoChannel, demoVideoEngagement } from "../../utils/demo";

const PAGE_SIZE = 20;

// The server's review states, shown with the design's tab look.
const TABS = [
  { label: "All", value: "" },
  { label: "Public", value: "active" },
  { label: "In Review", value: "pending" },
  { label: "Rejected", value: "rejected" },
];

const SORTS = [
  { label: "Latest", value: "latest" },
  { label: "Oldest", value: "oldest" },
  { label: "Most viewed", value: "views" },
];

const STATUS = {
  active: { label: "Public", icon: Globe, className: "bg-[#22c55e]/15 text-[#4ade80]" },
  pending: { label: "In Review", icon: Clock, className: "bg-[#2f86e6]/15 text-[#60a5fa]" },
  rejected: { label: "Rejected", icon: XCircle, className: "bg-live/15 text-[#f87171]" },
};

export const StatusPill = ({ status }) => {
  const meta = STATUS[status] || STATUS.pending;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.className}`}>
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
};

const ActionButton = ({ icon: Icon, label, onClick, danger }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition sm:px-3 sm:text-sm ${
      danger ? "bg-live/80 text-white hover:bg-live" : "border border-line bg-card-2 text-white hover:bg-white/10"
    }`}
  >
    <Icon className="h-4 w-4" />
    {label}
  </button>
);

const ConfirmDelete = ({ video, busy, onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-4 sm:items-center">
    <Card className="w-full max-w-sm p-5">
      <p className="text-lg font-bold">Delete this video?</p>
      <p className="mt-2 text-sm text-muted">
        “{video.title}” will be removed permanently, including its video file. This can't be undone.
      </p>
      <div className="mt-5 flex gap-3">
        <GhostButton onClick={onCancel} className="flex-1" disabled={busy}>
          Cancel
        </GhostButton>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="flex-1 cursor-pointer rounded-xl bg-live px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
        >
          {busy ? "Deleting..." : "Delete"}
        </button>
      </div>
    </Card>
  </div>
);

const MyVideos = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: stats } = useFetch("/api/studio/videos/stats", undefined, studioApi);

  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("latest");
  const [category, setCategory] = useState("");
  const [showFilter, setShowFilter] = useState(false);

  const [list, setList] = useState({ key: null, videos: [], page: 1, totalPages: 1, total: 0 });
  const [loadingMore, setLoadingMore] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const listKey = `${status}|${query}`;

  useEffect(() => {
    let cancelled = false;
    studioApi
      .get("/api/studio/videos", { params: { status: status || undefined, search: query || undefined, limit: PAGE_SIZE, page: 1 } })
      .then(({ data }) => {
        if (cancelled) return;
        setList({
          key: listKey,
          videos: data?.data?.videos || [],
          page: 1,
          totalPages: data?.data?.totalPages || 1,
          total: data?.data?.total || 0,
        });
      })
      .catch((error) => {
        if (!cancelled) {
          toast.error(apiError(error, "Couldn't load your videos"));
          setList({ key: listKey, videos: [], page: 1, totalPages: 1, total: 0 });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [status, query, listKey]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const page = list.page + 1;
      const { data } = await studioApi.get("/api/studio/videos", {
        params: { status: status || undefined, search: query || undefined, limit: PAGE_SIZE, page },
      });
      setList((previous) => ({ ...previous, videos: [...previous.videos, ...(data?.data?.videos || [])], page }));
    } finally {
      setLoadingMore(false);
    }
  };

  const shown = useMemo(() => {
    const filtered = category ? list.videos.filter((video) => video.category === category) : list.videos;
    const sorted = [...filtered];
    if (sort === "oldest") sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (sort === "views") sorted.sort((a, b) => (b.views || 0) - (a.views || 0));
    return sorted;
  }, [list.videos, category, sort]);

  const share = async (video) => {
    const url = `${window.location.origin}/watch/${video.id}`;
    if (video.status !== "active") {
      toast.info("This video isn't public yet — it can be shared once it's approved.");
      return;
    }
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

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await studioApi.delete(`/api/studio/videos/${toDelete.id}`);
      setList((previous) => ({
        ...previous,
        videos: previous.videos.filter((video) => video.id !== toDelete.id),
        total: Math.max(0, previous.total - 1),
      }));
      toast.success("Video deleted");
      setToDelete(null);
    } catch (error) {
      toast.error(apiError(error, "Couldn't delete the video"));
    } finally {
      setDeleting(false);
    }
  };

  const demo = demoChannel(user.id);

  return (
    <div>
      {/* Creator header */}
      <div className="flex flex-wrap items-center gap-4">
        <Link to={`/channel/${user.id}`} className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar src={mediaUrl(user.channel?.logo, IMG.avatar)} name={user.channel?.name || user.fullName} size="h-16 w-16 sm:h-20 sm:w-20" />
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 text-xl font-bold sm:text-2xl">
              <span className="truncate">{user.channel?.name || user.fullName}</span>
              <BadgeCheck className="h-5 w-5 shrink-0 fill-[#2f86e6] text-white" />
            </span>
            <span className="block text-sm text-muted">{creatorHandle(user)}</span>
            <span className="block text-sm text-slate-300">Content Creator</span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
        </Link>

        <div className="grid w-full grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-card py-3 text-center sm:w-auto sm:min-w-[22rem]">
          <div className="px-3">
            <p className="text-lg font-bold">{stats ? formatCount(stats.total) : "–"}</p>
            <p className="text-xs text-muted">Videos</p>
          </div>
          <div className="px-3">
            <p className="text-lg font-bold">{stats ? formatCount(stats.views) : "–"}</p>
            <p className="text-xs text-muted">Total Views</p>
          </div>
          <div className="px-3" title="Preview — subscriptions aren't tracked yet">
            <p className="text-lg font-bold">{formatCount(demo.subscribers)}</p>
            <p className="text-xs text-muted">Subscribers*</p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">All Videos</h1>
          <p className="mt-1 text-sm text-muted sm:text-base">Manage and update your uploaded videos</p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/studio/upload")}
          className="flex cursor-pointer items-center gap-2 rounded-xl bg-live px-5 py-3 font-semibold shadow-lg shadow-live/25 hover:brightness-110"
        >
          <CloudUpload className="h-5 w-5" /> Upload Video
        </button>
      </div>

      <div className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatus(tab.value)}
            className={`shrink-0 cursor-pointer rounded-xl px-5 py-2.5 text-sm font-medium transition ${
              status === tab.value ? "bg-live text-white" : "border border-line bg-card-2 text-slate-200 hover:bg-white/10"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <label className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-xl border border-line bg-card px-4">
          <Search className="h-5 w-5 shrink-0 text-muted" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search your videos..."
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          />
        </label>
        <button
          type="button"
          onClick={() => setShowFilter((value) => !value)}
          className={`flex h-12 cursor-pointer items-center gap-2 rounded-xl border px-4 text-sm ${
            category ? "border-brand/60 bg-brand/15" : "border-line bg-card"
          }`}
        >
          <Filter className="h-4 w-4" /> <span className="hidden sm:inline">Filter</span>
        </button>
        <label className="flex h-12 items-center gap-2 rounded-xl border border-line bg-card px-3 text-sm">
          <ListFilter className="h-4 w-4 shrink-0" />
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="cursor-pointer bg-transparent outline-none [color-scheme:dark]"
          >
            {SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {showFilter && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {VIDEO_CATEGORIES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setCategory(item.value)}
              className={`shrink-0 cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium ${
                category === item.value ? "bg-brand text-white" : "bg-card-2 text-slate-300"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4">
        {list.key !== listKey ? (
          <Spinner />
        ) : shown.length === 0 ? (
          <EmptyState icon={CloudUpload} title="No videos here" text={query ? "No videos match your search." : "Upload a video to get started."} />
        ) : (
          <div className="divide-y divide-line">
            {shown.map((video) => {
              const engagement = demoVideoEngagement(video);
              return (
                <div key={video.id} className="space-y-3 py-4">
                  <div className="flex gap-3 sm:gap-4">
                    <Link
                      to={video.status === "active" ? `/watch/${video.id}` : `/studio/videos/${video.id}/edit`}
                      className="relative w-[38%] shrink-0 self-start overflow-hidden rounded-xl border border-line sm:w-56"
                    >
                      <img src={mediaUrl(video.thumbnail?.landscape, IMG.card)} alt="" loading="lazy" className="aspect-video w-full object-cover" />
                      <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 text-xs font-semibold">{video.duration}</span>
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex gap-2">
                        <p className="line-clamp-2 flex-1 text-sm font-medium sm:text-base">{video.title}</p>
                        <EllipsisVertical className="h-5 w-5 shrink-0 text-muted" />
                      </div>
                      <p className="mt-0.5 text-xs text-muted sm:text-sm">
                        {formatCount(video.views)} views · {timeAgo(video.createdAt)}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted sm:text-sm">
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4" /> {formatCount(engagement.likes)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" /> {formatCount(engagement.comments)}
                        </span>
                        <StatusPill status={video.status} />
                      </div>
                      {video.status === "rejected" && video.rejectionReason && (
                        <p className="mt-1.5 text-xs text-[#f87171]">Reason: {video.rejectionReason}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 sm:flex sm:gap-2 sm:pl-60">
                    <ActionButton icon={Pencil} label="Edit" onClick={() => navigate(`/studio/videos/${video.id}/edit`)} />
                    <ActionButton icon={BarChart3} label="Analytics" onClick={() => navigate("/studio/analytics")} />
                    <ActionButton icon={Share2} label="Share" onClick={() => share(video)} />
                    <ActionButton icon={Trash2} label="Delete" danger onClick={() => setToDelete(video)} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {list.key === listKey && list.page < list.totalPages && (
          <div className="mt-6 flex justify-center">
            <GhostButton onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? "Loading..." : "Load more"}
            </GhostButton>
          </div>
        )}

        <p className="mt-6 text-xs text-slate-500">* Subscribers, likes and comments are preview figures until those features go live.</p>
      </div>

      {toDelete && (
        <ConfirmDelete video={toDelete} busy={deleting} onCancel={() => setToDelete(null)} onConfirm={confirmDelete} />
      )}
    </div>
  );
};

export default MyVideos;

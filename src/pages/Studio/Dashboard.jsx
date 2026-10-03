import React from "react";
import { Link } from "react-router";
import {
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  CloudUpload,
  Eye,
  Film,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { BarChart } from "../../components/Charts/Charts";
import { Avatar, Card, EmptyState, PageHeader, SectionHeader, Spinner } from "../../components/ui/ui";
import { studioApi } from "../../api/studioApi";
import { useAuth } from "../../context/AuthContext";
import { useFetch } from "../../hooks/useFetch";
import { categoryLabel } from "../../utils/categories";
import { creatorHandle } from "../../utils/menu";
import { formatCount, IMG, mediaUrl, timeAgo } from "../../utils/format";
import { StatusPill } from "./MyVideos";

const StatTile = ({ icon: Icon, label, value, color }) => (
  <Card className="p-4">
    <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${color}26`, color }}>
      <Icon className="h-5 w-5" />
    </span>
    <p className="mt-3 text-2xl font-bold">{value}</p>
    <p className="text-sm text-muted">{label}</p>
  </Card>
);

const QUICK_ACTIONS = [
  { to: "/studio/upload", label: "Upload video", icon: CloudUpload, color: "#ff2d6f" },
  { to: "/studio/analytics", label: "Analytics", icon: BarChart3, color: "#16a34a" },
  { to: "/studio/earning", label: "Earning", icon: CircleDollarSign, color: "#d97706" },
  { to: "/studio/verify", label: "Get verified", icon: ShieldCheck, color: "#2f86e6" },
];

// Creator home: real numbers from /api/studio/videos/stats.
const Dashboard = () => {
  const { user } = useAuth();
  const { data: stats, loading } = useFetch("/api/studio/videos/stats", undefined, studioApi);
  const { data: recent } = useFetch("/api/studio/videos", { limit: 5 }, studioApi);

  if (loading || !stats) return <Spinner className="min-h-[60vh]" />;

  const uploads = (stats.uploadsOverTime || []).map((item) => ({ label: item.label, value: item.count }));
  const categories = stats.categoryBreakdown || [];
  const maxCategory = Math.max(1, ...categories.map((item) => item.count));

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle={`Welcome back, ${user.fullName.split(" ")[0]}! Here's how your channel is doing.`}>
        <Link to="/studio/upload" className="bg-brand-gradient flex items-center gap-2 rounded-xl px-5 py-3 font-semibold">
          <CloudUpload className="h-5 w-5" /> Upload Video
        </Link>
      </PageHeader>

      {!user.channel && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-brand/30 bg-brand/10 p-4">
          <p className="text-sm">
            <span className="font-semibold">Set up your channel</span> — add a channel name and logo so viewers can find you.
          </p>
          <Link to="/studio/profile" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold">
            Set up channel
          </Link>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile icon={Film} label="Total videos" value={stats.total} color="#a855f7" />
        <StatTile icon={Eye} label="Total views" value={formatCount(stats.views)} color="#2f86e6" />
        <StatTile icon={CheckCircle2} label="Public" value={stats.active} color="#22c55e" />
        <StatTile icon={Clock} label="In review" value={stats.pending} color="#d97706" />
        <StatTile icon={XCircle} label="Rejected" value={stats.rejected} color="#e3172f" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <p className="font-semibold">Uploads per month</p>
          <p className="mb-3 text-xs text-muted">Last 6 months</p>
          <BarChart data={uploads} color="#ff3d7f" format={(v) => Math.round(v)} />
        </Card>

        <Card className="p-4">
          <p className="mb-3 font-semibold">Videos by category</p>
          {categories.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">No videos yet</p>
          ) : (
            <ul className="space-y-3">
              {categories.slice(0, 6).map((item) => (
                <li key={item.category}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-slate-300">{categoryLabel(item.category)}</span>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-[#2f86e6]" style={{ width: `${(item.count / maxCategory) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {QUICK_ACTIONS.map(({ to, label, icon: Icon, color }) => (
          <Link key={to} to={to} className="flex items-center gap-3 rounded-2xl border border-line bg-card p-4 transition hover:bg-card-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: color }}>
              <Icon className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold">{label}</span>
          </Link>
        ))}
      </div>

      <section>
        <SectionHeader title="Recent uploads" to="/studio/videos" />
        {recent?.videos?.length ? (
          <Card className="divide-y divide-line">
            {recent.videos.map((video) => (
              <Link key={video.id} to={`/studio/videos/${video.id}/edit`} className="flex items-center gap-3 p-3 hover:bg-white/[0.03]">
                <img src={mediaUrl(video.thumbnail?.landscape, IMG.card)} alt="" className="aspect-video w-28 shrink-0 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{video.title}</p>
                  <p className="text-xs text-muted">
                    {formatCount(video.views)} views · {timeAgo(video.createdAt)}
                  </p>
                </div>
                <StatusPill status={video.status} />
              </Link>
            ))}
          </Card>
        ) : (
          <EmptyState icon={CloudUpload} title="No uploads yet" text="Upload your first video to start your channel.">
            <Link to="/studio/upload" className="bg-brand-gradient rounded-xl px-5 py-2.5 text-sm font-semibold">
              Upload video
            </Link>
          </EmptyState>
        )}
      </section>

      <Card className="flex items-center gap-3 p-4 lg:hidden">
        <Avatar src={mediaUrl(user.channel?.logo, IMG.avatar)} name={user.channel?.name || user.fullName} size="h-10 w-10" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{user.channel?.name || user.fullName}</p>
          <p className="text-xs text-muted">{creatorHandle(user)}</p>
        </div>
        <Link to={`/channel/${user.id}`} className="text-sm font-semibold text-brand">
          View channel
        </Link>
      </Card>
    </div>
  );
};

export default Dashboard;

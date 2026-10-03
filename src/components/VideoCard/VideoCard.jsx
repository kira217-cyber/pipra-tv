import React from "react";
import { Link } from "react-router";
import { EllipsisVertical, Play } from "lucide-react";

import { Avatar } from "../ui/ui";
import VideoPreview from "../VideoPreview/VideoPreview";
import { IMG, mediaUrl, videoId, videoMeta } from "../../utils/format";

const Thumb = ({ video, className = "aspect-video", autoplayInView = false }) => (
  <VideoPreview
    id={`card-${videoId(video)}-${className}`}
    src={video.video?.url}
    poster={mediaUrl(video.thumbnail?.landscape, IMG.card)}
    alt={video.title}
    duration={video.duration}
    autoplayInView={autoplayInView}
    className={`w-full rounded-xl border border-line bg-card-2 ${className}`}
  />
);

// The standard card in every row: 16:9 poster, title, channel, meta.
export const VideoCard = ({ video, showChannel = true, className = "" }) => (
  <Link to={`/watch/${videoId(video)}`} className={`group block min-w-0 ${className}`}>
    <Thumb video={video} />
    <p className="mt-2 line-clamp-2 text-sm font-medium leading-snug text-white sm:text-[15px]">
      {video.title}
    </p>
    {showChannel && video.channelName && (
      <p className="mt-0.5 truncate text-xs text-muted sm:text-sm">{video.channelName}</p>
    )}
    {videoMeta(video) && (
      <p className="truncate text-xs text-muted sm:text-sm">{videoMeta(video)}</p>
    )}
  </Link>
);

// A horizontally scrolling row of cards — swipe on mobile, scroll on desktop.
export const VideoRail = ({ videos, showChannel = true }) => (
  <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 sm:mx-0 sm:px-0">
    {videos.map((video) => (
      <VideoCard
        key={videoId(video)}
        video={video}
        showChannel={showChannel}
        className="w-[44%] shrink-0 snap-start sm:w-[31%] lg:w-[23.5%] xl:w-[18.8%]"
      />
    ))}
  </div>
);

export const VideoGrid = ({ videos, showChannel = true }) => (
  <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
    {videos.map((video) => (
      <VideoCard key={videoId(video)} video={video} showChannel={showChannel} />
    ))}
  </div>
);

// The large "featured" video at the top of the Videos page.
export const FeaturedVideo = ({ video }) => (
  <div>
    <Link to={`/watch/${videoId(video)}`} className="group relative block">
      <Thumb video={video} className="aspect-video rounded-2xl" autoplayInView />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/90 bg-black/35 backdrop-blur-sm transition group-hover:scale-110 sm:h-20 sm:w-20">
          <Play className="ml-1 h-7 w-7 fill-white text-white sm:h-9 sm:w-9" />
        </span>
      </span>
    </Link>

    <div className="mt-3 flex gap-3">
      <Link to={video.channelId ? `/channel/${video.channelId}` : "#"}>
        <Avatar src={mediaUrl(video.channelLogo, IMG.avatar)} name={video.channelName} size="h-11 w-11" />
      </Link>
      <Link to={`/watch/${videoId(video)}`} className="min-w-0 flex-1">
        <p className="line-clamp-2 text-base font-semibold text-white sm:text-lg">{video.title}</p>
        <p className="truncate text-sm text-muted">
          {[video.channelName, videoMeta(video)].filter(Boolean).join(" · ")}
        </p>
      </Link>
      <EllipsisVertical className="h-5 w-5 shrink-0 text-muted" />
    </div>
  </div>
);

// Wide row: thumbnail left, details right — channel home "latest upload".
export const VideoRow = ({ video, children }) => (
  <Link to={`/watch/${videoId(video)}`} className="group flex gap-3 sm:gap-4">
    <div className="w-[48%] shrink-0 sm:w-[40%] lg:w-[34%]">
      <Thumb video={video} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="line-clamp-2 text-sm font-semibold text-white sm:text-lg">{video.title}</p>
      {videoMeta(video) && <p className="mt-1 text-xs text-muted sm:text-sm">{videoMeta(video)}</p>}
      {children}
    </div>
  </Link>
);

export default VideoCard;

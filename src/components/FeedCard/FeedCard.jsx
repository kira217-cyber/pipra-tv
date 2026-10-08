import React from "react";
import { Link } from "react-router";
import { BadgeCheck, EllipsisVertical } from "lucide-react";

import { Avatar } from "../ui/ui";
import VideoPreview from "../VideoPreview/VideoPreview";
import { channelPath, videoId, videoMeta } from "../../utils/format";

// Full-width feed card from the new Home design: big poster, then the
// channel avatar beside a two-line title and "channel ✓ · views · age".
const FeedCard = ({ video, eager = false }) => {
  const to = `/watch/${videoId(video)}`;
  return (
    <article className="min-w-0">
      <Link to={to} className="block overflow-hidden rounded-2xl border border-line bg-card-2">
        <VideoPreview
          id={`feed-${videoId(video)}`}
          src={video.videoUrl}
          poster={video.thumbnail}
          alt={video.title}
          duration={video.duration}
          eager={eager}
          autoplayInView
          className="aspect-video"
        />
      </Link>

      <div className="mt-3 flex gap-3">
        <Link to={channelPath(video.channel)} className="shrink-0">
          <Avatar src={video.channel?.avatar} name={video.channel?.name} size="h-10 w-10" ring={false} />
        </Link>
        <Link to={to} className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-white sm:text-base">{video.title}</h3>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[13px] text-muted">
            {video.channel?.name && (
              <span className="flex min-w-0 items-center gap-1">
                <span className="truncate">{video.channel?.name}</span>
                {video.channel?.verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 fill-muted text-page" />}
              </span>
            )}
            {videoMeta(video) && <span>{videoMeta(video)}</span>}
          </p>
        </Link>
        <EllipsisVertical className="mt-0.5 h-5 w-5 shrink-0 text-white/80" />
      </div>
    </article>
  );
};

export default FeedCard;

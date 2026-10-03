import React from "react";
import { Link } from "react-router";
import { BadgeCheck, EllipsisVertical } from "lucide-react";

import { Avatar } from "../ui/ui";
import VideoPreview from "../VideoPreview/VideoPreview";
import { IMG, mediaUrl, videoId, videoMeta } from "../../utils/format";

// Full-width feed card from the new Home design: big poster, then the
// channel avatar beside a two-line title and "channel ✓ · views · age".
const FeedCard = ({ video, eager = false }) => {
  const to = `/watch/${videoId(video)}`;
  return (
    <article className="min-w-0">
      <Link to={to} className="block overflow-hidden rounded-2xl border border-line bg-card-2">
        <VideoPreview
          id={`feed-${videoId(video)}`}
          src={video.video?.url}
          poster={mediaUrl(video.thumbnail?.landscape, IMG.card)}
          alt={video.title}
          duration={video.duration}
          eager={eager}
          autoplayInView
          className="aspect-video"
        />
      </Link>

      <div className="mt-3 flex gap-3">
        <Link to={video.channelId ? `/channel/${video.channelId}` : to} className="shrink-0">
          <Avatar src={mediaUrl(video.channelLogo, IMG.avatar)} name={video.channelName} size="h-10 w-10" ring={false} />
        </Link>
        <Link to={to} className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-white sm:text-base">{video.title}</h3>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[13px] text-muted">
            {video.channelName && (
              <span className="flex min-w-0 items-center gap-1">
                <span className="truncate">{video.channelName}</span>
                <BadgeCheck className="h-3.5 w-3.5 shrink-0 fill-muted text-page" />
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

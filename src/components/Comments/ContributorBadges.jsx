import React from "react";
import { Crown, Eye, Gift, MessageCircle, ThumbsUp } from "lucide-react";

// A fan's contributor badges on this channel (Top Contributor …), next to
// their name in the comments. Names and colours come from the admin.
const ICONS = { top: Crown, gift: Gift, comment: MessageCircle, like: ThumbsUp, view: Eye };

const ContributorBadges = ({ badges }) =>
  badges?.length
    ? badges.map((badge) => {
        const Icon = ICONS[badge.key] || Crown;
        return (
          <span
            key={badge.key}
            title={badge.rank ? `#${badge.rank} on this channel` : badge.label}
            className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-4"
            style={{ color: badge.color, borderColor: `${badge.color}66`, background: `${badge.color}1f` }}
          >
            <Icon className="h-3 w-3" style={badge.key === "top" ? { fill: badge.color } : undefined} />
            {badge.label}
          </span>
        );
      })
    : null;

export default ContributorBadges;

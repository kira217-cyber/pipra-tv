import React from "react";
import { BadgeCheck, Crown, Eye, Flame, Gem, Gift, Heart, MessageCircle, Shield, Star, ThumbsUp, Trophy } from "lucide-react";

// A badge an admin gave someone (VIP, Top Contributor…): a small round mark
// on the corner of their picture / channel logo, and a pill next to a name.
const ICONS = { crown: Crown, gift: Gift, comment: MessageCircle, like: ThumbsUp, view: Eye, star: Star, shield: Shield, gem: Gem, heart: Heart, check: BadgeCheck, flame: Flame, trophy: Trophy };

export const BadgeMark = ({ badge }) => {
  const Icon = ICONS[badge.icon] || Star;
  return (
    <span
      title={badge.label}
      className="absolute -bottom-0.5 -right-0.5 flex aspect-square w-[40%] min-w-[16px] max-w-[30px] items-center justify-center rounded-full border-2 border-page shadow-md"
      style={{ background: badge.color }}
    >
      <Icon className="h-[62%] w-[62%] fill-white/30 text-white" strokeWidth={2.5} />
    </span>
  );
};

export const BadgeLabel = ({ badge, className = "" }) => {
  if (!badge) return null;
  const Icon = ICONS[badge.icon] || Star;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-4 ${className}`}
      style={{ color: badge.color, borderColor: `${badge.color}66`, background: `${badge.color}1f` }}
    >
      <Icon className="h-3 w-3" style={{ fill: badge.color }} />
      {badge.label}
    </span>
  );
};

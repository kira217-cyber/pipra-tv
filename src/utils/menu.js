import {
  BarChart3,
  CircleDollarSign,
  Clapperboard,
  History,
  House,
  Library,
  LayoutDashboard,
  Palette,
  Play,
  Rss,
  Settings,
  ShieldCheck,
  Tv,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";

// Everything a viewer can browse — shown in the desktop sidebar (the
// bottom nav covers the same ground on mobile).
export const BROWSE_MENU = [
  { label: "Home", to: "/", icon: House, color: "#3b82f6", end: true },
  { label: "Live TV", to: "/live-tv", icon: Tv, color: "#e3172f" },
  { label: "Shorts", to: "/shorts", icon: Clapperboard, color: "#a855f7" },
  { label: "Videos", to: "/videos", icon: Play, color: "#22c55e" },
  { label: "Subscriptions", to: "/feed/subscriptions", icon: Rss, color: "#f97316" },
  { label: "You", to: "/you", icon: Library, color: "#6366f1" },
  { label: "History", to: "/feed/history", icon: History, color: "#64748b" },
  { label: "Channels", to: "/channels", icon: Users, color: "#0ea5e9" },
];

// The creator menu from the drawer design. "View Chanel" is filled in
// at render time with the signed-in creator's own channel id.
export const CREATOR_MENU = [
  { label: "Dashboard", to: "/studio", icon: LayoutDashboard, color: "#ff2d6f", end: true },
  { label: "Content", to: "/studio/videos", icon: Play, color: "#7c3aed" },
  { label: "Your channel", to: "__channel__", icon: Users, color: "#2f86e6" },
  { label: "Analytics", to: "/studio/analytics", icon: BarChart3, color: "#16a34a" },
  { label: "Earning", to: "/studio/earning", icon: CircleDollarSign, color: "#d97706" },
];

export const SETTINGS_MENU = [
  { label: "Customize channel", to: "/studio/customize", icon: Palette, color: "#db2777" },
  { label: "Account", to: "/studio/profile", icon: UserRound, color: "#2f86e6" },
  { label: "Verified Identity", to: "/studio/verify", icon: ShieldCheck, color: "#16a34a" },
  { label: "Payout information", to: "/studio/payout", icon: Wallet, color: "#7c3aed" },
  { label: "Billing & payment", to: "/studio/billing", icon: Settings, color: "#d97706" },
];


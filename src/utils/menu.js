import {
  BarChart3,
  CircleDollarSign,
  Clapperboard,
  House,
  LayoutDashboard,
  Play,
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
  { label: "Channels", to: "/channels", icon: Users, color: "#0ea5e9" },
];

// The creator menu from the drawer design. "View Chanel" is filled in
// at render time with the signed-in creator's own channel id.
export const CREATOR_MENU = [
  { label: "Dashboard", to: "/studio", icon: LayoutDashboard, color: "#ff2d6f", end: true },
  { label: "All Videos", to: "/studio/videos", icon: Play, color: "#7c3aed" },
  { label: "View Channel", to: "__channel__", icon: Users, color: "#2f86e6" },
  { label: "Analytics", to: "/studio/analytics", icon: BarChart3, color: "#16a34a" },
  { label: "Earning", to: "/studio/earning", icon: CircleDollarSign, color: "#d97706" },
];

export const SETTINGS_MENU = [
  { label: "Account & profile", to: "/studio/profile", icon: UserRound, color: "#2f86e6" },
  { label: "Verified Identity", to: "/studio/verify", icon: ShieldCheck, color: "#16a34a" },
  { label: "Payout information", to: "/studio/payout", icon: Wallet, color: "#7c3aed" },
  { label: "Billing & payment", to: "/studio/billing", icon: Settings, color: "#d97706" },
];

// A creator's "@handle" — derived from the channel name, falling back to
// the email's local part, since the server doesn't store a handle yet.
export const creatorHandle = (user) => {
  const source = user?.channel?.name || user?.email?.split("@")[0] || "creator";
  return `@${source.toLowerCase().replace(/[^a-z0-9_]+/g, "")}`;
};

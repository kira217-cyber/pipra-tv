import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { ArrowLeft, Bell, CloudUpload, Menu, Search } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { Avatar, Logo } from "../ui/ui";
import { IMG, mediaUrl } from "../../utils/format";

// Placeholder notifications until the server has a notifications feed.
const NOTIFICATIONS = [
  { id: 1, title: "Welcome to the new PipraTV", text: "Watch, upload and grow — all in one place.", time: "Just now" },
  { id: 2, title: "Live TV is on", text: "Pipra-TV and dozens of channels are streaming now.", time: "Today" },
  { id: 3, title: "Get verified", text: "Verify your identity to unlock monetization.", time: "Today", to: "/studio/verify" },
];

const SearchBox = ({ autoFocus, onDone }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState(() =>
    location.pathname === "/search" ? new URLSearchParams(location.search).get("q") || "" : "",
  );

  const submit = (event) => {
    event.preventDefault();
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    onDone?.();
  };

  return (
    <form
      onSubmit={submit}
      className="flex h-11 w-full items-center gap-2 rounded-full border border-line bg-card-2 px-4 focus-within:border-brand/60"
    >
      <Search className="h-5 w-5 shrink-0 text-muted" />
      <input
        autoFocus={autoFocus}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search videos, channels..."
        className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
      />
    </form>
  );
};

const Notifications = () => {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(NOTIFICATIONS.length);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => {
          setOpen((value) => !value);
          setUnread(0);
        }}
        className="relative flex h-10 w-9 cursor-pointer items-center justify-center rounded-full text-white transition hover:bg-white/10 min-[380px]:w-10"
      >
        <Bell className="h-6 w-6" />
        {unread > 0 && (
          <span className="absolute right-2 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-header bg-live" aria-label={`${unread} new`} />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-line bg-card shadow-2xl shadow-black/50">
          <p className="border-b border-line px-4 py-3 font-semibold text-white">Notifications</p>
          {NOTIFICATIONS.map((item) => (
            <Link
              key={item.id}
              to={item.to || "#"}
              onClick={() => setOpen(false)}
              className="block border-b border-line px-4 py-3 last:border-0 hover:bg-white/5"
            >
              <p className="text-sm font-medium text-white">{item.title}</p>
              <p className="mt-0.5 text-xs text-muted">{item.text}</p>
              <p className="mt-1 text-[11px] text-slate-500">{item.time}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const Header = ({ onMenu }) => {
  const { user } = useAuth();
  const [mobileSearch, setMobileSearch] = useState(false);

  if (mobileSearch) {
    return (
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center gap-2 border-b border-line bg-header px-3 lg:hidden">
        <button
          type="button"
          aria-label="Close search"
          onClick={() => setMobileSearch(false)}
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <SearchBox autoFocus onDone={() => setMobileSearch(false)} />
      </header>
    );
  }

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center gap-1 border-b border-line bg-header/95 px-2 backdrop-blur min-[380px]:gap-2 sm:px-4 lg:gap-4 lg:px-6">
      <button
        type="button"
        aria-label="Open menu"
        onClick={onMenu}
        className="flex h-10 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-white hover:bg-white/10 min-[380px]:w-10"
      >
        <Menu className="h-7 w-7" />
      </button>

      <Link to="/" className="min-w-0 shrink">
        <Logo className="h-10 max-w-full min-[380px]:h-12 sm:h-[52px]" />
      </Link>

      <div className="mx-auto hidden w-full max-w-xl lg:block">
        <SearchBox />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-0.5 min-[380px]:gap-1 sm:gap-2 lg:ml-0">
        <button
          type="button"
          aria-label="Search"
          onClick={() => setMobileSearch(true)}
          className="flex h-10 w-9 cursor-pointer items-center justify-center rounded-full text-white hover:bg-white/10 min-[380px]:w-10 lg:hidden"
        >
          <Search className="h-6 w-6" />
        </button>

        <Notifications />

        <Link
          to="/live-tv"
          className="ml-1 flex items-center gap-1.5 rounded-full bg-live px-3 py-2 text-sm font-bold tracking-wide text-white shadow-[0_0_16px_rgba(227,23,47,0.55)] transition hover:brightness-110 min-[380px]:px-4 sm:text-base"
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
          LIVE
        </Link>

        <Link
          to="/studio/upload"
          className="bg-upload-gradient ml-1 hidden items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white lg:flex"
        >
          <CloudUpload className="h-5 w-5" />
          Upload
        </Link>

        {user ? (
          <Link to="/studio" className="ml-1 hidden lg:block" aria-label="Dashboard">
            <Avatar src={mediaUrl(user.channel?.logo, IMG.avatar)} name={user.channel?.name || user.fullName} size="h-9 w-9" />
          </Link>
        ) : (
          <Link
            to="/login"
            className="ml-1 hidden rounded-full border border-line px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 lg:block"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;

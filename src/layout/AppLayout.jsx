import React, { Suspense, useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { FacebookIcon, TelegramIcon, YoutubeIcon } from "./socialIcons";

import Header from "../components/Header/Header";
import BottomNav from "../components/BottomNav/BottomNav";
import NavMenu from "../components/NavMenu/NavMenu";
import { Logo, Spinner } from "../components/ui/ui";
import { getPresenceSocket } from "../hooks/presenceSocket";
import { useSiteFavicon } from "../hooks/useSiteFavicon";
import { useSiteSettings } from "../hooks/useSiteSettings";
import { IMG, mediaUrl } from "../utils/format";

const Footer = () => {
  const { settings } = useSiteSettings();
  const social = [
    { url: settings?.socialLinks?.facebook, icon: FacebookIcon, label: "Facebook" },
    { url: settings?.socialLinks?.youtube, icon: YoutubeIcon, label: "YouTube" },
    { url: settings?.socialLinks?.telegram, icon: TelegramIcon, label: "Telegram" },
  ].filter((item) => item.url);

  return (
    <footer className="mt-10 hidden border-t border-line px-6 py-8 lg:block">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <Logo className="h-9" />
          <p className="mt-2 text-sm text-muted">Watch Together, Grow Together.</p>
        </div>

        {settings?.footerLinks?.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            {settings.footerLinks.map((link) => (
              <a
                key={link._id}
                href={link.url}
                target={link.openInNewTab ? "_blank" : undefined}
                rel="noreferrer"
                title={link.label}
                className="overflow-hidden rounded-lg border border-line bg-card-2"
              >
                <img src={mediaUrl(link.image, IMG.avatar)} alt={link.label} className="h-10 w-auto object-contain" />
              </a>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          {social.map(({ url, icon: Icon, label }) => (
            <a
              key={label}
              href={url}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-card-2 text-white transition hover:bg-brand"
            >
              <Icon />
            </a>
          ))}
        </div>
      </div>
      <p className="mt-6 text-xs text-slate-500">
        © {new Date().getFullYear()} PipraTV. All rights reserved. ·{" "}
        <Link to="/channels" className="hover:text-white">Channels</Link>
      </p>
    </footer>
  );
};

const AppLayout = () => {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useSiteFavicon();

  // Live visitor feed for admin → Site Analytics, same as the old site.
  useEffect(() => {
    getPresenceSocket().emit("page:view", { path: location.pathname });
  }, [location.pathname]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  // The drawer covers the page; stop the page scrolling behind it.
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [drawerOpen]);

  const isShorts = location.pathname.startsWith("/shorts");

  const toggleMenu = () => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setSidebarOpen((value) => !value);
    } else {
      setDrawerOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-page text-white">
      {/* Shorts is full-screen on phones — no top bar there. */}
      <div className={isShorts ? "hidden lg:block" : undefined}>
        <Header onMenu={toggleMenu} />
      </div>

      {/* Mobile / tablet drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${drawerOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!drawerOpen}
      >
        <div
          onClick={() => setDrawerOpen(false)}
          className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
            drawerOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <aside
          className={`absolute inset-y-0 left-0 w-[84%] max-w-sm overflow-y-auto bg-header px-4 pb-6 pt-[max(1rem,env(safe-area-inset-top))] shadow-2xl transition-transform duration-300 ${
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <NavMenu showBrowse onNavigate={() => setDrawerOpen(false)} />
        </aside>
      </div>

      {/* Desktop sidebar */}
      {sidebarOpen && (
        <aside className="no-scrollbar fixed bottom-0 left-0 top-16 z-30 hidden w-72 overflow-y-auto border-r border-line bg-header px-3 py-4 lg:block">
          <NavMenu showBrowse />
        </aside>
      )}

      <div className={`${isShorts ? "lg:pt-16" : "pt-16"} ${sidebarOpen ? "lg:pl-72" : ""}`}>
        {isShorts ? (
          <Suspense fallback={<Spinner className="min-h-[60vh]" />}>
            <Outlet />
          </Suspense>
        ) : (
          <main className="pb-bottom-nav mx-auto w-full max-w-[1600px] px-4 pt-4 sm:px-6 lg:px-8 lg:pt-6">
            <Suspense fallback={<Spinner className="min-h-[60vh]" />}>
              <Outlet />
            </Suspense>
            <Footer />
          </main>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default AppLayout;

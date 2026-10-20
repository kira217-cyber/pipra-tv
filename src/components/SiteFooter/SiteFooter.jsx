import React from "react";
import { Link } from "react-router";
import { BadgeCheck } from "lucide-react";

import { LogoMark } from "../ui/ui";
import { pagePath, useSitePages } from "../../hooks/useSitePages";

const BUILT_IN_FLAG = "/flag-bd.gif"; // public/flag-bd.gif
// Each licence card gets its own colours (pink → purple, orange → pink, …).
const LICENSE_COLORS = [
  ["#ff2d6f", "#c026d3"],
  ["#ff9a1f", "#ff2d6f"],
  ["#22c55e", "#06b6d4"],
  ["#6366f1", "#06b6d4"],
];

// The bottom of the sidebar: the brand, the waving Bangladesh flag in a
// glowing RGB frame, "Made in Bangladesh", the information page links in
// small groups (the way YouTube lays its footer out) and the copyright.
// Every line and link comes from the admin panel (Pages & footer).
const SiteFooter = ({ onNavigate }) => {
  const { footer, groups } = useSitePages();
  if (!footer && !groups.length) return null;

  return (
    <footer className="flex flex-col items-center gap-4 border-t border-line px-1 pb-4 pt-5 text-center">
      <Link to="/" onClick={onNavigate} className="flex items-center gap-2.5">
        <LogoMark className="h-12" />
        <span className="text-left leading-tight">
          <span className="block text-xl font-extrabold tracking-tight text-white">PipraTube</span>
          {footer?.tagline && <span className="block text-[11px] font-semibold text-slate-300">{footer.tagline}</span>}
        </span>
      </Link>

      {footer?.showFlag !== false && (
        <div className="rgb-active flag-frame rounded-2xl p-2">
          <img src={footer?.flag || BUILT_IN_FLAG} alt="Flag of Bangladesh" width="120" height="84" loading="lazy" className="h-[70px] w-auto rounded-md" draggable={false} />
        </div>
      )}

      {(footer?.countryLine || footer?.madeIn) && (
        <div className="-mt-1 leading-tight">
          {footer.countryLine && <p className="text-[13px] font-semibold text-slate-200">{footer.countryLine}</p>}
          {footer.madeIn && <p className="rgb-text mt-0.5 text-[15px] font-extrabold">{footer.madeIn}</p>}
        </div>
      )}

      {footer?.licenses?.length > 0 && (
        <div className="flex w-full flex-col gap-2.5">
          {footer.licenses.map((license, index) => {
            const [from, to] = LICENSE_COLORS[index % LICENSE_COLORS.length];
            return (
              <div
                key={`${license.name}-${license.number}`}
                className="license-shine relative overflow-hidden rounded-2xl p-[1.5px] shadow-lg"
                style={{ background: `linear-gradient(135deg, ${from}, ${to})`, boxShadow: `0 10px 28px -14px ${from}` }}
              >
                <div className="relative flex items-center gap-3 rounded-[15px] bg-[#101624] px-3 py-2.5 text-left">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-inner" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
                    <BadgeCheck className="h-5 w-5 text-white" strokeWidth={2.4} />
                  </span>
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block truncate text-[14px] font-extrabold text-white">{license.name}</span>
                    {license.label && (
                      <span className="mt-0.5 block text-[10.5px] font-bold uppercase tracking-wider" style={{ color: from }}>
                        {license.label}
                      </span>
                    )}
                    {license.number && (
                      <span className="mt-1.5 inline-block rounded-md bg-white/[0.07] px-1.5 py-0.5 font-mono text-[11.5px] font-semibold tracking-tight text-slate-100 ring-1 ring-white/10">
                        {license.number}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {groups.length > 0 && (
        <nav aria-label="PipraTube information" className="flex w-full flex-col gap-2.5">
          {groups.map((group) => (
            <div key={group.key} className="flex flex-wrap justify-center gap-x-3 gap-y-1">
              {group.pages.map((page) => (
                <Link key={page.slug} to={pagePath(page.slug)} onClick={onNavigate} className="text-[13px] font-semibold text-slate-300 transition hover:text-white">
                  {page.title}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      )}

      {footer?.copyright && <p className="text-xs text-muted">{footer.copyright}</p>}
    </footer>
  );
};

export default SiteFooter;

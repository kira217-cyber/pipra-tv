import React, { useEffect, useState } from "react";
import { Link, NavLink, useParams } from "react-router";
import { FileText } from "lucide-react";

import { api } from "../../api/axios";
import { EmptyState, Spinner } from "../../components/ui/ui";
import { pagePath, useSitePages } from "../../hooks/useSitePages";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

// An information page (About, Contact, Terms, Privacy, Ads…): everything on
// it — title, subtitle, description, cover picture, video and the sections
// below — is written in the admin panel (Pages & footer).

// Links, emails and phone numbers inside the text become clickable.
const LINK = /(https?:\/\/[^\s]+|[\w.+-]+@[\w-]+\.[\w.-]+|\+?88?0?1[3-9]\d{8})/g;
const linkify = (line) =>
  line.split(LINK).map((part, i) => {
    if (i % 2 === 0) return part;
    const href = part.startsWith("http") ? part : part.includes("@") ? `mailto:${part}` : `tel:${part}`;
    return (
      <a key={i} href={href} target={part.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="font-semibold text-brand hover:underline">
        {part}
      </a>
    );
  });

// Blank lines start a new paragraph; single line breaks are kept.
const Text = ({ value, className = "" }) =>
  String(value || "")
    .split(/\n\s*\n/)
    .filter((p) => p.trim())
    .map((paragraph, i) => (
      <p key={i} className={`whitespace-pre-line leading-relaxed ${className}`}>
        {linkify(paragraph)}
      </p>
    ));

// YouTube / Facebook links play in their own player; anything else is a file.
const embedUrl = (url) => {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  if (/facebook\.com|fb\.watch/.test(url)) return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`;
  return null;
};

const Video = ({ url }) => {
  if (!url) return null;
  const embed = embedUrl(url);
  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl border border-line bg-black">
      {embed ? (
        <iframe src={embed} title="Video" className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" />
      ) : (
        <video src={url} controls playsInline preload="metadata" className="h-full w-full" />
      )}
    </div>
  );
};

const OtherPages = ({ groups, current }) => (
  <nav aria-label="More pages" className="space-y-5 rounded-2xl border border-line bg-card p-4">
    {groups.map((group) => (
      <div key={group.key}>
        <p className="mb-1.5 px-2 text-xs font-bold uppercase tracking-wider text-muted">{group.label}</p>
        {/* Chips on phones (short), a list beside the page on wide screens. */}
        <div className="flex flex-wrap gap-1.5 lg:block">
          {group.pages.map((page) => (
            <NavLink
              key={page.slug}
              to={pagePath(page.slug)}
              className={`block rounded-lg px-2.5 py-1.5 text-sm font-medium transition max-lg:border max-lg:border-line ${page.slug === current ? "bg-brand/15 text-brand" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}
            >
              {page.title}
            </NavLink>
          ))}
        </div>
      </div>
    ))}
  </nav>
);

const InfoPage = () => {
  const { slug } = useParams();
  const { groups } = useSitePages();
  const [state, setState] = useState({ slug: null, page: null, missing: false });

  useEffect(() => {
    let alive = true;
    api
      .get(`/api/site/pages/${encodeURIComponent(slug)}`)
      .then(({ data }) => alive && setState({ slug, page: data.data.page, missing: false }))
      .catch(() => alive && setState({ slug, page: null, missing: true }));
    return () => {
      alive = false;
    };
  }, [slug]);

  const loading = state.slug !== slug;
  const page = loading ? null : state.page;
  useDocumentTitle(page?.title);

  return (
    <div className="mx-auto w-full max-w-6xl px-1 py-4 sm:px-2 lg:py-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <article className="min-w-0 space-y-6">
          {loading ? (
            <Spinner className="py-24" />
          ) : state.missing ? (
            <EmptyState icon={FileText} title="Page not found" text="This page doesn't exist or isn't public right now.">
              <Link to="/" className="inline-block rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white">
                Go home
              </Link>
            </EmptyState>
          ) : (
            <>
              <header className="relative overflow-hidden rounded-3xl border border-brand/25 bg-gradient-to-br from-[#2a0f2a] via-card to-card-2 p-6 sm:p-10">
                <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand/25 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-brand-2/20 blur-3xl" />
                <h1 className="relative text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{page.title}</h1>
                {page.subtitle && <p className="relative mt-3 max-w-2xl text-base text-slate-200 sm:text-lg">{page.subtitle}</p>}
              </header>

              {page.cover?.url && <img src={page.cover.url} alt="" className="w-full rounded-2xl border border-line object-cover" />}

              {page.description && (
                <div className="space-y-4 text-[15px] text-slate-200 sm:text-base">
                  <Text value={page.description} />
                </div>
              )}

              <Video url={page.video?.url} />

              {page.sections.map((section) => (
                <section key={section.id} className="space-y-4 rounded-2xl border border-line bg-card p-5 sm:p-6">
                  {section.heading && <h2 className="text-xl font-bold text-white">{section.heading}</h2>}
                  {section.body && (
                    <div className="space-y-3 text-[15px] text-slate-300">
                      <Text value={section.body} />
                    </div>
                  )}
                  {section.image?.url && <img src={section.image.url} alt="" loading="lazy" className="w-full rounded-xl object-cover" />}
                  <Video url={section.video?.url} />
                </section>
              ))}

              {page.updatedAt && <p className="text-xs text-muted">Last updated {new Date(page.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>}
            </>
          )}
        </article>

        {groups.length > 0 && (
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <OtherPages groups={groups} current={slug} />
          </aside>
        )}
      </div>
    </div>
  );
};

export default InfoPage;

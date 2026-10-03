# Pipra-TV — new client

The new version of the Pipra-TV website. It's one responsive React app for desktop and mobile browsers, built from the mobile designs in `../../site-structure/`. Viewers and creators use the same app:

- **Viewer pages:** Home, Live TV (with categories and a watch page), Videos, Watch, Shorts, Channel, Channels, Search.
- **Creator pages** (sign in with a Studio account): Dashboard, All Videos, Upload/Edit, Analytics, Earning, Verified Identity, Account & Profile.

It talks to the same `server/` API as the old site. The old `client/` and `studio/` apps are left untouched.

## Run

```
npm install
cp .env.example .env   # point VITE_API_URL at your server
npm run dev            # http://localhost:5175
npm run build
```

## Local speed-up (dev only)

The live API sends uploaded images very slowly (about 30 KB/s, so a 2–3 MB thumbnail takes over a minute). During `npm run dev` the browser talks to Vite, and `dev/localCache.js` does the following:

- Caches the site list endpoints (settings, videos, channels, live-tv) in `.cache/api`. Pages get an instant answer and the data refreshes in the background.
- Downloads every image those endpoints mention into `.cache/media` in the background. `?w=480` returns a resized WebP (~30 KB instead of ~3 MB).
- Forwards everything else (`/api/studio`, uploads, socket.io) unchanged.

The first run takes a while to fill the image cache. After that, images load instantly. Delete `.cache/` to start over. The production build doesn't use any of this: it talks to `VITE_API_URL` directly. In production the real fix is to serve `/uploads` from a CDN (for example Bunny, which already hosts the videos) as resized images.

## Demo account

"Try Demo Account" on the sign-in page (and in the menu) opens the creator pages as a sample creator. All `/api/studio` calls are answered in the browser (`src/api/demoAdapter.js`). The sample creator's videos are real public videos. Anything that would save is refused with a "Demo mode" message, and nothing is sent to the server.

## Where the data comes from

| Feature | Source |
|---|---|
| Videos, channels, Live TV, slider, home rows, ads, logo/favicon | Real — `/api/site/*` |
| Sign in / sign up, profile name/email/phone, channel name + logo | Real — `/api/studio/*` |
| My videos, upload, edit, delete, upload progress | Real — `/api/studio/videos*` |
| Total views, uploads per month, category breakdown | Real — `/api/studio/videos/stats` |
| Subscribers, likes, comments, watch time, revenue, earnings, audience, traffic | **Preview data** — `src/utils/demo.js` |
| Like / save / subscribe buttons, identity verification, extra profile fields, cover image | Saved in the browser (localStorage) until the server has endpoints |

Pages that show preview data say so on the page. To switch a number to real data, replace its `demo*` call with an API call. Each one is used in only a few places.

## Layout

- `src/layout/AppLayout.jsx` — header, mobile drawer, desktop sidebar, bottom nav, footer
- `src/components/` — shared UI. The video players, `AdOverlay`, the upload modal and `VideoForm` are copied from the old client and studio, recoloured to the new brand.
- `src/pages/` — one folder per page. Creator pages are in `pages/Studio/`.
- `src/index.css` — design tokens (`bg-page`, `bg-card`, `text-brand`, …)

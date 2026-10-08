import React, { lazy } from "react";
import { createBrowserRouter } from "react-router";

import AppLayout from "../layout/AppLayout";
import RequireAuth from "./RequireAuth";

import Home from "../pages/Home/Home";
import Videos from "../pages/Videos/Videos";
import WatchVideo from "../pages/WatchVideo/WatchVideo";
const Shorts = lazy(() => import("../pages/Shorts/Shorts"));
import LiveTv from "../pages/LiveTv/LiveTv";
import LiveTvCategory from "../pages/LiveTv/LiveTvCategory";
import LiveTvWatch from "../pages/LiveTv/LiveTvWatch";
const Channel = lazy(() => import("../pages/Channel/Channel"));
const Channels = lazy(() => import("../pages/Channels/Channels"));
const Search = lazy(() => import("../pages/Search/Search"));
const Login = lazy(() => import("../pages/Auth/Login"));
const Register = lazy(() => import("../pages/Auth/Register"));
import NotFound from "../pages/NotFound/NotFound";

const Dashboard = lazy(() => import("../pages/Studio/Dashboard"));
const MyVideos = lazy(() => import("../pages/Studio/MyVideos"));
const VideoEditor = lazy(() => import("../pages/Studio/VideoEditor"));
const Analytics = lazy(() => import("../pages/Studio/Analytics"));
const Earning = lazy(() => import("../pages/Studio/Earning"));
const VerifyIdentity = lazy(() => import("../pages/Studio/VerifyIdentity"));
const Profile = lazy(() => import("../pages/Studio/Profile"));
const ComingSoon = lazy(() => import("../pages/Studio/ComingSoon"));
const CreateChannel = lazy(() => import("../pages/Studio/CreateChannel"));
const CustomizeChannel = lazy(() => import("../pages/Studio/CustomizeChannel"));
const libraryPage = (name) => lazy(() => import("../pages/Library/Library").then((module) => ({ default: module[name] })));
const You = libraryPage("You");
const SubscriptionsFeed = libraryPage("SubscriptionsFeed");
const History = libraryPage("History");
const Liked = libraryPage("Liked");
const PlaylistPage = libraryPage("PlaylistPage");
const ChannelByHandle = lazy(() => import("../pages/Channel/Channel").then((module) => ({ default: module.ChannelByHandle })));

// Signed in, and (for creator tools) owning a channel.
const signedIn = (element) => <RequireAuth>{element}</RequireAuth>;
const creator = (element) => <RequireAuth channel>{element}</RequireAuth>;

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Home /> },
      { path: "videos", element: <Videos /> },
      { path: "watch/:id", element: <WatchVideo /> },
      { path: "shorts", element: <Shorts /> },
      { path: "live-tv", element: <LiveTv /> },
      { path: "live-tv/category/:key", element: <LiveTvCategory /> },
      { path: "live-tv/:id", element: <LiveTvWatch /> },
      { path: "channel/:id", element: <Channel /> },
      { path: "channels", element: <Channels /> },
      { path: "search", element: <Search /> },
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
      { path: "channel/create", element: signedIn(<CreateChannel />) },
      { path: "you", element: signedIn(<You />) },
      { path: "feed/subscriptions", element: signedIn(<SubscriptionsFeed />) },
      { path: "feed/history", element: signedIn(<History />) },
      { path: "feed/liked", element: signedIn(<Liked />) },
      { path: "playlist/:id", element: <PlaylistPage /> },

      { path: "studio", element: creator(<Dashboard />) },
      { path: "studio/videos", element: creator(<MyVideos />) },
      { path: "studio/upload", element: creator(<VideoEditor mode="create" />) },
      { path: "studio/videos/:id/edit", element: creator(<VideoEditor mode="edit" />) },
      { path: "studio/customize", element: creator(<CustomizeChannel />) },
      { path: "studio/analytics", element: creator(<Analytics />) },
      { path: "studio/earning", element: creator(<Earning />) },
      { path: "studio/verify", element: signedIn(<VerifyIdentity />) },
      { path: "studio/profile", element: signedIn(<Profile />) },
      {
        path: "studio/payout",
        element: creator(
          <ComingSoon
            title="Payout information"
            text="Add bKash, Nagad or a bank account to receive your earnings. This is coming soon."
          />,
        ),
      },
      {
        path: "studio/billing",
        element: creator(
          <ComingSoon
            title="Billing & payment"
            text="Invoices and payment history will appear here once monetization goes live."
          />,
        ),
      },

      // YouTube-style channel address: /@handle
      { path: ":at", element: <ChannelByHandle /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

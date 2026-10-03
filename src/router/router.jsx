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

const creator = (element) => <RequireAuth>{element}</RequireAuth>;

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

      { path: "studio", element: creator(<Dashboard />) },
      { path: "studio/videos", element: creator(<MyVideos />) },
      { path: "studio/upload", element: creator(<VideoEditor mode="create" />) },
      { path: "studio/videos/:id/edit", element: creator(<VideoEditor mode="edit" />) },
      { path: "studio/analytics", element: creator(<Analytics />) },
      { path: "studio/earning", element: creator(<Earning />) },
      { path: "studio/verify", element: creator(<VerifyIdentity />) },
      { path: "studio/profile", element: creator(<Profile />) },
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

      { path: "*", element: <NotFound /> },
    ],
  },
]);

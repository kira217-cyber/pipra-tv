import React from "react";
import { Navigate, useLocation } from "react-router";

import { useAuth } from "../context/AuthContext";
import { Spinner } from "../components/ui/ui";

// Signed-in pages. With `channel`, the page also needs the user to own a
// channel (upload, content, analytics…) — otherwise they're sent to
// create one first, like YouTube does.
const RequireAuth = ({ children, channel: needsChannel = false }) => {
  const { user, channel, checking } = useAuth();
  const location = useLocation();

  if (checking && !user) return <Spinner className="min-h-[60vh]" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (needsChannel && !channel) return <Navigate to="/channel/create" replace state={{ from: location.pathname }} />;
  return children;
};

export default RequireAuth;

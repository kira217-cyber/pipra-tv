import React from "react";
import { Navigate, useLocation } from "react-router";

import { useAuth } from "../context/AuthContext";
import { Spinner } from "../components/ui/ui";

// Creator pages need a signed-in account; everything else is public.
const RequireAuth = ({ children }) => {
  const { user, checking } = useAuth();
  const location = useLocation();

  if (checking && !user) return <Spinner className="min-h-[60vh]" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
};

export default RequireAuth;

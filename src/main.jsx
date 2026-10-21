import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";

import "./index.css";
import { router } from "./router/router";
import { AuthProvider } from "./context/AuthContext";
import { startUpdateCheck } from "./utils/appUpdate";

startUpdateCheck(router, { reloadWhenHidden: true });

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
);

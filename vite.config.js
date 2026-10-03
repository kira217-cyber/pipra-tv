import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

import { localCache } from "./dev/localCache.js";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target = (env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

  return {
    plugins: [react(), tailwindcss(), localCache(target)],
    server: {
      port: 5175,
      // In dev the browser only talks to Vite (see src/api/axios.js); these
      // forward whatever the local cache doesn't answer itself.
      proxy: {
        "/api": { target, changeOrigin: true },
        "/uploads": { target, changeOrigin: true },
        "/socket.io": { target, changeOrigin: true, ws: true },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom", "react-router"],
            hls: ["hls.js"],
          },
        },
      },
    },
  };
});

import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// A new id on every build: the app carries it and /version.json shows the
// newest one, so open tabs can tell a new deploy is out (src/utils/appUpdate.js).
const BUILD_ID = Date.now().toString(36);
const versionFile = () => ({
  name: "version-file",
  apply: "build",
  generateBundle() {
    this.emitFile({ type: "asset", fileName: "version.json", source: JSON.stringify({ build: BUILD_ID }) });
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target = (env.VITE_API_URL || "http://localhost:5100").replace(/\/$/, "");

  return {
    plugins: [react(), tailwindcss(), versionFile()],
    define: { "import.meta.env.VITE_BUILD_ID": JSON.stringify(BUILD_ID) },
    server: {
      port: 5173,
      // In dev the browser only talks to Vite (see src/api/axios.js).
      proxy: {
        "/api": { target, changeOrigin: true },
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

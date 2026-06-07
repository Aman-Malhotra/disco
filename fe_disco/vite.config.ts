import path from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const BACKEND_DEV_TARGET = process.env.VITE_BACKEND_DEV_TARGET ?? "http://localhost:4002";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 4001,
    strictPort: true,
    proxy: {
      "/api": {
        target: BACKEND_DEV_TARGET,
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4001,
    strictPort: true,
  },
});

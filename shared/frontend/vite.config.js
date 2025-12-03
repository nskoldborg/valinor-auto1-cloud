import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  // ✅ Allow @ imports (e.g., "@/components/ui/Button")
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    host: "0.0.0.0", // ✅ makes it accessible inside Docker / LAN
    port: 5173,
    proxy: {
      "/api": {
        target: "http://10.46.0.140:8650",
        changeOrigin: true,
        secure: false,
      },
      "/auth": {
        target: "http://10.46.0.140:8650",
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    outDir: "dist",
    sourcemap: false,
  },

  base: "/", // ✅ ensures correct routing under Nginx
});
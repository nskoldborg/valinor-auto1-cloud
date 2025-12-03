import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Load environment variables from .env files
// The actual environment variable for the proxy target should be available when running the Vite dev server
const env = loadEnv('', process.cwd(), '');

// Fallback to the internal Docker service name (api-dev:8000)
// The API_HOST variable should be set in the api-dev service of docker-compose.yml
const API_PROXY_TARGET = env.VITE_API_PROXY_HOST || 'http://api-dev:8000';

export default defineConfig({
  plugins: [react()],

  // ✅ Allow @ imports (e.g., "@/components/ui/Button")
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    host: "0.0.0.0", // ✅ makes it accessible inside Docker
    port: 5173,
    proxy: {
      "/api": {
        // CRITICAL FIX: Use the internal Docker service name and port (api-dev:8000)
        target: API_PROXY_TARGET,
        changeOrigin: true,
        secure: false,
      },
      "/auth": {
        // CRITICAL FIX: Use the internal Docker service name and port
        target: API_PROXY_TARGET,
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
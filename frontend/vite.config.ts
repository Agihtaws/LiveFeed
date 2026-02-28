import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy /api and /feed to backend during dev — avoids CORS
      "/api":  { target: "http://localhost:4020", changeOrigin: true },
      "/feed": { target: "http://localhost:4020", changeOrigin: true },
      // Proxy Base Sepolia RPC through Vite — avoids browser CORS block on public RPCs
      "/rpc":  {
        target:      "https://base-sepolia-rpc.publicnode.com",
        changeOrigin: true,
        rewrite:     (path) => path.replace(/^\/rpc/, ""),
      },
    },
  },
});
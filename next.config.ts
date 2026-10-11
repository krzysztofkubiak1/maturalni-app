import type { NextConfig } from "next";

// Adres backendu FastAPI. Domyślnie lokalny uvicorn na :8000.
// Na produkcji ustaw zmienną API_PROXY_TARGET na adres wdrożonego API.
const API_PROXY_TARGET = process.env.API_PROXY_TARGET ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  // Samodzielny serwer (server.js + tylko potrzebne node_modules) do obrazu Dockera —
  // patrz Dockerfile w korzeniu repo.
  output: "standalone",
  async rewrites() {
    // Wszystko spod /api/* w przeglądarce leci do backendu w Pythonie.
    // Dzięki temu front i API są dla przeglądarki jedną domeną (ciasteczka sesji działają bez CORS).
    return [
      {
        source: "/api/:path*",
        destination: `${API_PROXY_TARGET}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

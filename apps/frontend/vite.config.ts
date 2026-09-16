import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd() + "/../..", "");
  const port = Number(env.FRONTEND_PORT) || 5173;
  const backendPort = Number(env.BACKEND_PORT) || 3001;

  return {
    plugins: [react()],
    server: {
      port,
      open: true,
    },
    define: {
      __BACKEND_URL__: JSON.stringify(`http://localhost:${backendPort}`),
      __BACKEND_WS_URL__: JSON.stringify(`ws://localhost:${backendPort}`),
    },
  };
});

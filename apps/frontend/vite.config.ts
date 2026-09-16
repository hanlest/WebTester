import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
  const rootDir = resolve(__dirname, "../..");
  const env = loadEnv(mode, rootDir, "");
  const port = Number(env.FRONTEND_PORT) || 5173;
  const backendPort = Number(env.BACKEND_PORT) || 3001;

  return {
    envDir: rootDir,
    envPrefix: ["VITE_", "BACKEND_"],
    plugins: [react()],
    server: {
      port,
      open: true,
    },
  };
});

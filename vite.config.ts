import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import { handleLanderRequest } from "./server/landerApi";

function landerApiPlugin(env: Record<string, string>): Plugin {
  const middleware = (
    req: IncomingMessage & { originalUrl?: string },
    res: ServerResponse,
    next: () => void,
  ) => {
    const path = (req.originalUrl ?? req.url ?? "").split("?")[0];
    if (path !== "/api/lander" && path !== "/api/lander/") {
      next();
      return;
    }
    void handleLanderRequest(req, res, env);
  };

  return {
    name: "lander-api",
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), tailwindcss(), landerApiPlugin(env)],
    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
  };
});

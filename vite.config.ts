import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { handleLanderRequest } from "./server/landerApi";

function landerApiPlugin(env: Record<string, string>): Plugin {
  return {
    name: "lander-api",
    configureServer(server) {
      server.middlewares.use("/api/lander", (req, res) => {
        void handleLanderRequest(req, res, env);
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), tailwindcss(), landerApiPlugin(env)],
  };
});

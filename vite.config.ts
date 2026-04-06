import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEVEL_PATH = path.resolve(__dirname, "public/levels/main.json");

function levelSavePlugin() {
  return {
    name: "level-save-plugin",
    configureServer(server: import("vite").ViteDevServer) {
      server.middlewares.use("/__editor/save-level", async (req, res, next) => {
        if (req.method !== "POST") return next();

        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", async () => {
          try {
            const json = JSON.parse(body);
            if (!json?.metadata || !Array.isArray(json?.entities) || !json?.surfaceLayers) {
              res.statusCode = 400;
              res.end("Invalid level payload");
              return;
            }
            await writeFile(LEVEL_PATH, `${JSON.stringify(json, null, 2)}\n`, "utf8");
            res.statusCode = 200;
            res.end("ok");
          } catch (error) {
            res.statusCode = 500;
            res.end((error as Error).message);
          }
        });
      });
    },
  };
}

export default defineConfig({
  server: {
    host: true,
  },
  plugins: [levelSavePlugin()],
});

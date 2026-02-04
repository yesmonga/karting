import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Plugin pour les messages mock cross-device (dev only)
function mockMessagesPlugin(): Plugin {
  let currentMessage: { text: string; timestamp: string; id: number } | null = null;

  return {
    name: "mock-messages",
    configureServer(server) {
      // POST /api/mock-message - envoyer un message
      server.middlewares.use("/api/mock-message", (req, res, next) => {
        if (req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => (body += chunk));
          req.on("end", () => {
            try {
              const data = JSON.parse(body);
              currentMessage = {
                text: data.text?.toUpperCase() || "",
                timestamp: new Date().toISOString(),
                id: Date.now(),
              };
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: true, message: currentMessage }));
            } catch (e) {
              res.writeHead(400);
              res.end("Invalid JSON");
            }
          });
        } else if (req.method === "GET") {
          // GET /api/mock-message - récupérer le dernier message
          res.writeHead(200, {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          });
          res.end(JSON.stringify(currentMessage));
        } else {
          next();
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  preview: {
    host: "0.0.0.0",
    port: parseInt(process.env.PORT || "4173"),
  },
  plugins: [
    react(),
    // Only include mock messages plugin in development
    command === 'serve' ? mockMessagesPlugin() : null,
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));


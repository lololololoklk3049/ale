import { createServer } from "http";
import { createBareServer } from "bare-server-node";
import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync, existsSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8080;

const app = express();
const bareServer = createBareServer("/bare/");

// Serve static files
app.use(express.static(join(__dirname, "public")));

// Settings API
let settings = {
  theme: "red",
  searchEngine: "duckduckgo",
  homepage: "about:home",
  adblock: true,
  javascript: true,
  darkMode: true,
  animations: true,
  proxy: "scramjet",
  panicKey: "Escape+Escape",
  customCSS: "",
};

app.use(express.json());

app.get("/api/settings", (req, res) => {
  res.json(settings);
});

app.post("/api/settings", (req, res) => {
  settings = { ...settings, ...req.body };
  res.json({ ok: true, settings });
});

// Proxy status endpoint
app.get("/api/status", (req, res) => {
  res.json({
    version: "1.0.0",
    proxy: "Scramjet",
    search: "DuckDuckGo",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// Fallback: serve index.html for SPA routes
app.get("*", (req, res) => {
  res.sendFile(join(__dirname, "public", "index.html"));
});

// Create HTTP server and handle bare WebSocket upgrades
const httpServer = createServer((req, res) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeRequest(req, res);
  } else {
    app(req, res);
  }
});

httpServer.on("upgrade", (req, socket, head) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeUpgrade(req, socket, head);
  } else {
    socket.destroy();
  }
});

httpServer.listen(PORT, () => {
  console.log(`
  ██████╗ ███████╗██████╗ 
  ██╔══██╗██╔════╝██╔══██╗
  ██████╔╝█████╗  ██║  ██║
  ██╔══██╗██╔══╝  ██║  ██║
  ██║  ██║███████╗██████╔╝
  ╚═╝  ╚═╝╚══════╝╚═════╝ 
                           
  RED Browser v1.0.0
  ─────────────────────────
  Server:  http://localhost:${PORT}
  Proxy:   Scramjet (via Bare)
  Search:  DuckDuckGo
  Bare:    /bare/
  ─────────────────────────
  `);
});

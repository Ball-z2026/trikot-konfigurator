import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import path from "node:path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerLocalAuthRoutes } from "../localAuth";
import { registerUploadRoute } from "../uploadRoute";
import { registerStorageProxy } from "./storageProxy";
import { registerMockupOgRoute } from "../mockupOgRoute";
import { appRouter } from "../routers";
import { ensureAdminExists } from "../db";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerLocalAuthRoutes(app);
  registerUploadRoute(app);
  // tRPC API
  // Ensure at least one admin exists
  await ensureAdminExists();
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // OG meta tags for social media crawlers (must be before Vite/static)
  registerMockupOgRoute(app);

  // kiez-design-api (Variante B): laeuft im selben Prozess, muss vor dem
  // Vite/Static-Catch-all gemountet werden. Faellt der Mount aus (z. B. weil
  // OPENAI_API_KEY fehlt), laeuft die Haupt-App unveraendert weiter.
  try {
    const kiezRoot = path.resolve(process.cwd(), "kiez-design-api");
    // @ts-ignore - reines JS-ESM-Modul, keine Typdefinitionen noetig
    const { createKiezRouter } = await import("../../kiez-design-api/mount.js");
    const { router: kiezRouter } = await createKiezRouter({ root: kiezRoot });
    app.use(kiezRouter);
    console.log("kiez-design-api gemountet: /api/kiez/*, /kiez/test/");
  } catch (e) {
    console.warn("kiez-design-api NICHT gemountet:", (e as Error).message);
  }

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);

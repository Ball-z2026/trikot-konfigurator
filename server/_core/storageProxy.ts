import type { Express, Response } from "express";
import { ENV } from "./env";

/**
 * Shared handler that fetches a file from storage and pipes it through.
 * Used by both /manus-storage/* (dev) and /api/storage-proxy/* (deployed).
 */
async function handleStorageRequest(key: string, res: Response) {
  if (!key) {
    res.status(400).send("Missing storage key");
    return;
  }

  if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
    res.status(500).send("Storage proxy not configured");
    return;
  }

  try {
    const forgeUrl = new URL(
      "v1/storage/presign/get",
      ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
    );
    forgeUrl.searchParams.set("path", key);

    const forgeResp = await fetch(forgeUrl, {
      headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
    });

    if (!forgeResp.ok) {
      const body = await forgeResp.text().catch(() => "");
      console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
      res.status(502).send("Storage backend error");
      return;
    }

    const { url } = (await forgeResp.json()) as { url: string };
    if (!url) {
      res.status(502).send("Empty signed URL from backend");
      return;
    }

    // Pipe the file through instead of redirecting to avoid browser
    // issues with cross-origin 307 redirects for <img> tags (iOS Safari)
    const fileResp = await fetch(url);
    if (!fileResp.ok) {
      console.error(`[StorageProxy] file fetch error: ${fileResp.status}`);
      res.status(502).send("Storage file fetch error");
      return;
    }

    const contentType = fileResp.headers.get("content-type");
    const contentLength = fileResp.headers.get("content-length");

    if (contentType) res.set("Content-Type", contentType);
    if (contentLength) res.set("Content-Length", contentLength);
    res.set("Cache-Control", "public, max-age=3600");
    res.set("Access-Control-Allow-Origin", "*");

    // Stream the response body
    const buffer = Buffer.from(await fileResp.arrayBuffer());
    res.send(buffer);
  } catch (err) {
    console.error("[StorageProxy] failed:", err);
    res.status(502).send("Storage proxy error");
  }
}

export function registerStorageProxy(app: Express) {
  // Original route - works on dev server but CDN intercepts on deployed version
  app.get("/manus-storage/*", async (req, res) => {
    const key = req.params[0];
    await handleStorageRequest(key, res);
  });

  // New API route - bypasses CDN layer on deployed version
  // CDN only intercepts /manus-storage/* but passes /api/* through to Express
  app.get("/api/storage-proxy/*", async (req, res) => {
    const key = req.params[0];
    await handleStorageRequest(key, res);
  });
}

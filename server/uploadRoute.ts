import type { Express, Request, Response } from "express";
import { storagePut } from "./storage";
import { sdk } from "./_core/sdk";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "image/gif",
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * POST /api/upload
 * Accepts base64-encoded file data and uploads to S3 storage.
 * Requires admin authentication.
 * Body: { fileName: string, data: string (base64), contentType: string }
 * Returns: { url: string, key: string }
 */
export function registerUploadRoute(app: Express) {
  app.post("/api/upload", async (req: Request, res: Response) => {
    try {
      // Auth check: only admins can upload product images
      let user;
      try {
        user = await sdk.authenticateRequest(req);
      } catch {
        res.status(401).json({ error: "Nicht authentifiziert" });
        return;
      }

      if (user.role !== "admin") {
        res.status(403).json({ error: "Nur Administratoren dürfen Bilder hochladen" });
        return;
      }

      const { fileName, data, contentType } = req.body;

      if (!fileName || !data || !contentType) {
        res.status(400).json({ error: "Fehlende Felder: fileName, data oder contentType" });
        return;
      }

      // MIME type validation
      if (!ALLOWED_MIME_TYPES.includes(contentType)) {
        res.status(400).json({
          error: `Nicht unterstützter Dateityp: ${contentType}. Erlaubt: ${ALLOWED_MIME_TYPES.join(", ")}`,
        });
        return;
      }

      // Convert base64 to Buffer
      const buffer = Buffer.from(data, "base64");

      // File size validation
      if (buffer.length > MAX_FILE_SIZE_BYTES) {
        res.status(400).json({
          error: `Datei zu groß (${(buffer.length / 1024 / 1024).toFixed(1)} MB). Maximum: ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB`,
        });
        return;
      }

      // Sanitize filename
      const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const fileKey = `products/${Date.now()}-${safeName}`;
      const result = await storagePut(fileKey, buffer, contentType);

      res.json({ url: result.url, key: result.key });
    } catch (error) {
      console.error("[Upload] Failed:", error);
      res.status(500).json({ error: "Upload fehlgeschlagen" });
    }
  });
}

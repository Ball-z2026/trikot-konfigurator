import { Express, Request, Response } from "express";
import { getMockupByShareToken } from "./db";

/**
 * Register a route that serves OG meta tags for social media crawlers.
 * When WhatsApp/Facebook/Twitter crawl /mockup/:token, they get a minimal HTML page
 * with Open Graph tags so the link preview shows the mockup image.
 * Regular browsers get redirected to the SPA which handles rendering.
 */
export function registerMockupOgRoute(app: Express) {
  app.get("/mockup/:token", async (req: Request, res: Response) => {
    const userAgent = (req.headers["user-agent"] || "").toLowerCase();
    
    // Detect social media crawlers
    const isCrawler = /whatsapp|facebookexternalhit|twitterbot|linkedinbot|slackbot|telegrambot|discordbot|googlebot/i.test(userAgent);
    
    if (!isCrawler) {
      // Regular browser → let the SPA handle it (fall through to Vite/static)
      return (res as any).next ? (res as any).next() : res.status(200).end();
    }

    try {
      const mockup = await getMockupByShareToken(req.params.token);
      
      if (!mockup) {
        return res.status(404).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta property="og:title" content="Mockup nicht gefunden" />
            <meta property="og:description" content="Dieses Mockup existiert nicht mehr." />
          </head>
          <body></body>
          </html>
        `);
      }

      const title = mockup.title || "KI-Mockup";
      const side = mockup.side === "front" ? "Vorderseite" : "Rückseite";
      const description = `${title} – ${side} | Erstellt mit dem Trikot-Konfigurator`;
      
      // Build absolute image URL
      const protocol = req.headers["x-forwarded-proto"] || "https";
      const host = req.headers["x-forwarded-host"] || req.headers.host || "trikoconfig-3uavwxvc.manus.space";
      const baseUrl = `${protocol}://${host}`;
      
      // imageUrl is stored as a storage key or full path
      let imageUrl = mockup.imageUrl;
      if (imageUrl.startsWith("/")) {
        imageUrl = `${baseUrl}${imageUrl}`;
      } else if (!imageUrl.startsWith("http")) {
        imageUrl = `${baseUrl}/manus-storage/${imageUrl}`;
      }

      const pageUrl = `${baseUrl}/mockup/${req.params.token}`;

      res.status(200).send(`<!DOCTYPE html>
<html prefix="og: http://ogp.me/ns#">
<head>
  <meta charset="utf-8" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(imageUrl)}" />
  <meta property="og:image:width" content="1024" />
  <meta property="og:image:height" content="1024" />
  <meta property="og:url" content="${escapeHtml(pageUrl)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
  <title>${escapeHtml(title)}</title>
</head>
<body>
  <p>${escapeHtml(description)}</p>
  <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(title)}" />
</body>
</html>`);
    } catch (error) {
      // On error, fall through to SPA
      return res.status(200).end();
    }
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

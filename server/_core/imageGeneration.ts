/**
 * Image generation helper using internal ImageService
 *
 * Example usage:
 *   const { url: imageUrl } = await generateImage({
 *     prompt: "A serene landscape with mountains"
 *   });
 *
 * For editing:
 *   const { url: imageUrl } = await generateImage({
 *     prompt: "Add a rainbow to this landscape",
 *     originalImages: [{
 *       url: "https://example.com/original.jpg",
 *       mimeType: "image/jpeg"
 *     }]
 *   });
 */
import { storagePut } from "../storage";
import { ENV } from "./env";
import { generateImageViaMcp } from "./imageMcpClient";

export type GenerateImageOptions = {
  prompt: string;
  originalImages?: Array<{
    url?: string;
    b64Json?: string;
    mimeType?: string;
  }>;
};

export type GenerateImageResponse = {
  url?: string;
};

export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  // Ist ein externer MCP-Server konfiguriert, läuft die Bildgenerierung
  // darüber statt über die eingebaute Forge-Image-API.
  if (ENV.imageMcpUrl) {
    return generateImageViaMcpBackend(options);
  }

  if (!ENV.forgeApiUrl) {
    throw new Error("BUILT_IN_FORGE_API_URL is not configured");
  }
  if (!ENV.forgeApiKey) {
    throw new Error("BUILT_IN_FORGE_API_KEY is not configured");
  }

  // Build the full URL by appending the service path to the base URL
  const baseUrl = ENV.forgeApiUrl.endsWith("/")
    ? ENV.forgeApiUrl
    : `${ENV.forgeApiUrl}/`;
  const fullUrl = new URL(
    "images.v1.ImageService/GenerateImage",
    baseUrl
  ).toString();

  const response = await fetch(fullUrl, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "connect-protocol-version": "1",
      authorization: `Bearer ${ENV.forgeApiKey}`,
    },
    body: JSON.stringify({
      prompt: options.prompt,
      original_images: (options.originalImages || []).map(img => ({
        ...(img.url ? { url: img.url } : {}),
        ...(img.b64Json ? { b64_json: img.b64Json } : {}),
        ...(img.mimeType ? { mime_type: img.mimeType } : {}),
      })),
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Image generation request failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
    );
  }

  const result = (await response.json()) as {
    image: {
      b64Json: string;
      mimeType: string;
    };
  };
  const base64Data = result.image.b64Json;
  const buffer = Buffer.from(base64Data, "base64");

  // Save to S3
  const { url } = await storagePut(
    `generated/${Date.now()}.png`,
    buffer,
    result.image.mimeType
  );
  return {
    url,
  };
}

/**
 * Bildgenerierung über den externen MCP-Server (ballz-image-mcp).
 * Das Ergebnis wird – wie beim Forge-Pfad – in unseren Storage geschrieben,
 * damit stromabwärts immer eine stabile URL aus unserem Speicher vorliegt.
 */
async function generateImageViaMcpBackend(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  const mcp = await generateImageViaMcp(
    ENV.imageMcpUrl,
    {
      prompt: options.prompt,
      originalImages: options.originalImages,
    },
    ENV.imageMcpToolName || undefined
  );

  let buffer: Buffer;
  let mimeType = mcp.mimeType ?? "image/png";

  if (mcp.b64Json) {
    buffer = Buffer.from(mcp.b64Json, "base64");
  } else if (mcp.url) {
    const resp = await fetch(mcp.url);
    if (!resp.ok) {
      throw new Error(
        `Herunterladen des MCP-Bildes fehlgeschlagen (${resp.status} ${resp.statusText})`
      );
    }
    mimeType = resp.headers.get("content-type") ?? mimeType;
    buffer = Buffer.from(await resp.arrayBuffer());
  } else {
    throw new Error("MCP-Bildgenerierung lieferte weder Bilddaten noch eine URL");
  }

  const ext = mimeType.includes("jpeg") || mimeType.includes("jpg") ? "jpg" : "png";
  const { url } = await storagePut(
    `generated/${Date.now()}.${ext}`,
    buffer,
    mimeType
  );
  return { url };
}

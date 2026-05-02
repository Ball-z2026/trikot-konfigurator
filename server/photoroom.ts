/**
 * Photoroom Virtual Model API Helper
 * 
 * Converts garment images into photorealistic lifestyle photos with virtual models.
 * Requires a Photoroom API key (Plus plan).
 * 
 * Docs: https://docs.photoroom.com/image-editing-api-plus-plan/virtual-model
 */
import { ENV } from "./_core/env";
import { storagePut } from "./storage";

export type PhotoroomOptions = {
  /** Base64-encoded image of the garment (PNG) */
  imageBase64: string;
  /** Model preset name (default: "avery") */
  modelPreset?: string;
  /** Scene preset name (default: "street") */
  scenePreset?: string;
  /** Pose (default: "standing") */
  pose?: string;
  /** Output size (default: "PORTRAIT_HD_3_2") */
  size?: string;
};

export type PhotoroomResult = {
  url: string;
};

/**
 * Generate a photorealistic mockup using Photoroom Virtual Model API.
 * Takes a garment screenshot and returns a lifestyle photo with a virtual model wearing it.
 */
export async function generatePhotoroomMockup(
  options: PhotoroomOptions
): Promise<PhotoroomResult> {
  if (!ENV.photoroomApiKey) {
    throw new Error(
      "PHOTOROOM_API_KEY ist nicht konfiguriert. Bitte den API Key in den Einstellungen hinterlegen."
    );
  }

  const {
    imageBase64,
    modelPreset = "avery",
    scenePreset = "street",
    pose = "standing",
    size = "PORTRAIT_HD_3_2",
  } = options;

  // Convert base64 to Buffer
  const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  const imageBuffer = Buffer.from(cleanBase64, "base64");

  // Build multipart form data
  const boundary = `----FormBoundary${Date.now()}`;
  const parts: Buffer[] = [];

  // Helper to add a form field
  const addField = (name: string, value: string) => {
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`
      )
    );
  };

  // Helper to add a file field
  const addFile = (name: string, filename: string, contentType: string, data: Buffer) => {
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${name}"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`
      )
    );
    parts.push(data);
    parts.push(Buffer.from("\r\n"));
  };

  // Add the image file
  addFile("imageFile", "design.png", "image/png", imageBuffer);

  // Add Virtual Model parameters
  addField("virtualModel.mode", "ai.auto");
  addField("virtualModel.model.preset.name", modelPreset);
  addField("virtualModel.scene.preset.name", scenePreset);
  addField("virtualModel.pose", pose);
  addField("virtualModel.size", size);

  // Keep the original garment design intact
  addField("removeBackground", "false");
  addField("referenceBox", "originalImage");

  // Close boundary
  parts.push(Buffer.from(`--${boundary}--\r\n`));

  const body = Buffer.concat(parts);

  const response = await fetch("https://image-api.photoroom.com/v2/edit", {
    method: "POST",
    headers: {
      "x-api-key": ENV.photoroomApiKey,
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
      Accept: "image/png",
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Photoroom API Fehler (${response.status}): ${errorText || response.statusText}`
    );
  }

  // Response is the image binary
  const resultBuffer = Buffer.from(await response.arrayBuffer());

  // Save to S3
  const { url } = await storagePut(
    `photoroom-mockups/${Date.now()}.png`,
    resultBuffer,
    "image/png"
  );

  return { url };
}

/** Check if Photoroom API is configured */
export function isPhotoroomConfigured(): boolean {
  return !!ENV.photoroomApiKey;
}

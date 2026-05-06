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
  /** Model preset name (default: "avery") - ignored if customModelImageBase64 is set */
  modelPreset?: string;
  /** Scene preset name (default: "street") */
  scenePreset?: string;
  /** Pose (default: "standing") */
  pose?: string;
  /** Output size (default: "PORTRAIT_HD_3_2") */
  size?: string;
  /** Base64-encoded custom model photo (person photo to use as model) */
  customModelImageBase64?: string;
  /** Side of the garment: "front" or "back" */
  side?: "front" | "back";
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
  
  // Use custom model image or preset
  if (options.customModelImageBase64) {
    const cleanModelBase64 = options.customModelImageBase64.replace(/^data:image\/\w+;base64,/, "");
    const modelBuffer = Buffer.from(cleanModelBase64, "base64");
    addFile("virtualModel.model.imageFile", "model.png", "image/png", modelBuffer);
  } else {
    addField("virtualModel.model.preset.name", modelPreset);
  }
  
  addField("virtualModel.scene.preset.name", scenePreset);
  addField("virtualModel.pose", pose);
  addField("virtualModel.size", size);

  // Add prompt for back view if side is "back"
  if (options.side === "back") {
    addField("virtualModel.prompt", "back view of model, showing the back of the garment, model facing away from camera");
  }

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

/**
 * Remove background from an image using PhotoRoom API.
 * Returns a PNG with transparent background, stored in S3.
 * 
 * Uses the Remove Background API (Basic Plan endpoint) for fastest response.
 * Docs: https://docs.photoroom.com/remove-background-api-basic-plan/quickstart-guide
 */
export async function removeBackground(
  imageInput: { url?: string; base64?: string }
): Promise<{ url: string; key: string }> {
  if (!ENV.photoroomApiKey) {
    throw new Error(
      "PHOTOROOM_API_KEY ist nicht konfiguriert. Bitte den API Key in den Einstellungen hinterlegen."
    );
  }

  let imageBuffer: Buffer;

  if (imageInput.base64) {
    const cleanBase64 = imageInput.base64.replace(/^data:image\/\w+;base64,/, "");
    imageBuffer = Buffer.from(cleanBase64, "base64");
  } else if (imageInput.url) {
    // Download image from URL
    const response = await fetch(imageInput.url);
    if (!response.ok) {
      throw new Error(`Bild konnte nicht heruntergeladen werden: ${response.status}`);
    }
    imageBuffer = Buffer.from(await response.arrayBuffer());
  } else {
    throw new Error("Entweder url oder base64 muss angegeben werden");
  }

  // Build multipart form data for Remove Background API
  const boundary = `----FormBoundary${Date.now()}`;
  const parts: Buffer[] = [];

  // Add the image file
  parts.push(
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="image_file"; filename="input.png"\r\nContent-Type: image/png\r\n\r\n`
    )
  );
  parts.push(imageBuffer);
  parts.push(Buffer.from("\r\n"));

  // Request PNG format with transparency
  parts.push(
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="format"\r\n\r\npng\r\n`
    )
  );

  // Request transparent channels
  parts.push(
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="channels"\r\n\r\nrgba\r\n`
    )
  );

  // Close boundary
  parts.push(Buffer.from(`--${boundary}--\r\n`));

  const body = Buffer.concat(parts);

  const response = await fetch("https://sdk.photoroom.com/v1/segment", {
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
      `PhotoRoom Freistellung fehlgeschlagen (${response.status}): ${errorText || response.statusText}`
    );
  }

  // Response is the image binary (PNG with transparent background)
  const resultBuffer = Buffer.from(await response.arrayBuffer());

  // Save to S3
  const storageKey = `templates/freigestellt-${Date.now()}.png`;
  const { url, key } = await storagePut(
    storageKey,
    resultBuffer,
    "image/png"
  );

  return { url, key };
}

/** Check if Photoroom API is configured */
export function isPhotoroomConfigured(): boolean {
  return !!ENV.photoroomApiKey;
}

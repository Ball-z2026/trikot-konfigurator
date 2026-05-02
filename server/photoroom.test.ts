import { describe, it, expect } from "vitest";

describe("Photoroom API Key", () => {
  it("should have PHOTOROOM_API_KEY set in environment", () => {
    // The key is injected via webdev_request_secrets
    const key = process.env.PHOTOROOM_API_KEY;
    expect(key).toBeDefined();
    expect(key).not.toBe("");
    expect(key!.startsWith("sk_pr_")).toBe(true);
  });

  it("should validate the API key with a lightweight request", async () => {
    const key = process.env.PHOTOROOM_API_KEY;
    if (!key) {
      console.warn("PHOTOROOM_API_KEY not set, skipping API validation");
      return;
    }

    // Use a minimal request to check if the API key is valid
    // We send a tiny 1x1 PNG to test authentication
    const tinyPng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );

    const boundary = `----FormBoundary${Date.now()}`;
    const parts: Buffer[] = [];

    // Add the image file
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="imageFile"; filename="test.png"\r\nContent-Type: image/png\r\n\r\n`
      )
    );
    parts.push(tinyPng);
    parts.push(Buffer.from("\r\n"));

    // Just remove background as a simple test
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="removeBackground"\r\n\r\ntrue\r\n`
      )
    );

    parts.push(Buffer.from(`--${boundary}--\r\n`));

    const body = Buffer.concat(parts);

    const response = await fetch("https://image-api.photoroom.com/v2/edit", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        Accept: "application/json",
      },
      body,
    });

    // 200 = success, 402 = payment required (valid key but no credits)
    // 401 or 403 = invalid key
    expect([200, 402]).toContain(response.status);
  }, 15000);
});

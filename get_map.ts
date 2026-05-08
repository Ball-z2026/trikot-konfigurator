import { ENV } from "./server/_core/env";
import { writeFileSync } from "fs";

async function main() {
  const baseUrl = ENV.forgeApiUrl.replace(/\/+$/, "");
  const apiKey = ENV.forgeApiKey;

  const params = new URLSearchParams({
    center: "53.3482958,9.9868598",
    zoom: "14",
    size: "800x800",
    maptype: "roadmap",
    key: apiKey,
  });
  // Styles für Straßenkarte in Vereinsfarben (Gelb + Dunkelblau)
  params.append("style", "feature:all|element:labels|visibility:off");
  params.append("style", "feature:road|element:geometry|color:0xfefb41");
  params.append("style", "feature:landscape|element:geometry|color:0x012f7b");
  params.append("style", "feature:water|element:geometry|color:0x001a4d");
  params.append("style", "feature:road.arterial|element:geometry|color:0xfefb41");
  params.append("style", "feature:road.local|element:geometry|color:0x3a5faa");

  const url = `${baseUrl}/v1/maps/proxy/maps/api/staticmap?${params.toString()}`;
  console.log("Fetching map...");
  
  const response = await fetch(url);
  console.log("Response status:", response.status);
  console.log("Content-Type:", response.headers.get("content-type"));
  
  if (response.ok) {
    const buffer = Buffer.from(await response.arrayBuffer());
    writeFileSync("/home/ubuntu/trikot-parts/strassenkarte.png", buffer);
    console.log("Map saved! Size:", buffer.length, "bytes");
  } else {
    const text = await response.text();
    console.log("Error:", text.substring(0, 500));
  }
}
main().catch(console.error);

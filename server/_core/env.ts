export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  photoroomApiKey: process.env.PHOTOROOM_API_KEY ?? "",
  // Optionaler externer MCP-Server für die Bildgenerierung (ballz-image-mcp).
  // Die vollständige Endpoint-URL enthält bereits den Zugriffs-Token im Pfad
  // und darf deshalb NICHT im Quellcode landen – nur als Umgebungsvariable.
  // Ist diese Variable gesetzt, läuft die Bildgenerierung über den MCP-Server
  // statt über die eingebaute Forge-Image-API.
  imageMcpUrl: process.env.BALLZ_IMAGE_MCP_URL ?? "",
  // Optionaler Override für den Tool-Namen des MCP-Servers. Bleibt er leer,
  // wird das passende Bild-Tool automatisch per tools/list ermittelt.
  imageMcpToolName: process.env.BALLZ_IMAGE_MCP_TOOL ?? "",
};

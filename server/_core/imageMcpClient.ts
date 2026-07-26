/**
 * Minimaler MCP-Client (Streamable HTTP) für externe Bildgenerierungs-Server.
 *
 * Spricht das Model-Context-Protocol über einen einzigen HTTP-Endpoint:
 *   1. initialize            -> Session aushandeln (Mcp-Session-Id merken)
 *   2. notifications/initialized
 *   3. tools/list            -> passendes Bild-Tool + dessen inputSchema finden
 *   4. tools/call            -> Bild erzeugen
 *
 * Der Server (z. B. ballz-image-mcp) wird ausschließlich über die
 * Umgebungsvariable BALLZ_IMAGE_MCP_URL konfiguriert – die URL enthält den
 * Zugriffs-Token im Pfad und darf nicht im Quellcode stehen.
 *
 * Da die konkrete Tool-Schnittstelle des Servers nicht fix bekannt ist, wird
 * sie zur Laufzeit aus tools/list gelesen und die Argumente werden adaptiv auf
 * die tatsächlich vorhandenen Properties des inputSchema gemappt.
 */

export type McpImageInput = {
  prompt: string;
  originalImages?: Array<{
    url?: string;
    b64Json?: string;
    mimeType?: string;
  }>;
};

export type McpImageResult = {
  /** Base64-kodierte Bilddaten (ohne data:-Präfix), falls der Server Bytes liefert. */
  b64Json?: string;
  mimeType?: string;
  /** Direkte Bild-URL, falls der Server stattdessen einen Link liefert. */
  url?: string;
};

type JsonRpcResponse = {
  jsonrpc: "2.0";
  id?: number | string | null;
  result?: any;
  error?: { code: number; message: string; data?: unknown };
};

let requestId = 0;
function nextId(): number {
  requestId += 1;
  return requestId;
}

/**
 * Antwort eines Streamable-HTTP-Endpoints parsen. Der Server darf entweder
 * eine einzelne JSON-RPC-Antwort (application/json) oder einen Server-Sent-
 * Events-Stream (text/event-stream) liefern. Beides wird hier unterstützt.
 */
async function readJsonRpc(resp: Response): Promise<JsonRpcResponse> {
  const contentType = resp.headers.get("content-type") ?? "";
  const raw = await resp.text();

  if (contentType.includes("text/event-stream") || /^\s*(event|data):/m.test(raw)) {
    // SSE: alle "data:"-Zeilen einsammeln, die letzte gültige JSON-RPC-Antwort nehmen.
    let last: JsonRpcResponse | null = null;
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice("data:".length).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const parsed = JSON.parse(payload) as JsonRpcResponse;
        if (parsed && (parsed.result !== undefined || parsed.error !== undefined)) {
          last = parsed;
        }
      } catch {
        // Nicht-JSON-Zeilen (z. B. reine Events) ignorieren.
      }
    }
    if (last) return last;
    throw new Error(`MCP: keine verwertbare SSE-Antwort erhalten: ${raw.slice(0, 300)}`);
  }

  try {
    return JSON.parse(raw) as JsonRpcResponse;
  } catch {
    throw new Error(`MCP: Antwort ist kein gültiges JSON: ${raw.slice(0, 300)}`);
  }
}

function assertOk(resp: Response, body: JsonRpcResponse, context: string): void {
  if (!resp.ok) {
    throw new Error(`MCP ${context} fehlgeschlagen (HTTP ${resp.status} ${resp.statusText})`);
  }
  if (body.error) {
    throw new Error(`MCP ${context} fehlgeschlagen: ${body.error.message} (Code ${body.error.code})`);
  }
}

/**
 * Aus dem inputSchema eines Tools den Namen der Property heraussuchen, die am
 * besten zu einem gesuchten Zweck passt (Prompt bzw. Referenzbilder).
 */
function pickProperty(
  schema: any,
  candidates: string[],
  keywords: string[],
): string | undefined {
  const props = schema?.properties;
  if (!props || typeof props !== "object") return undefined;
  const names = Object.keys(props);

  // 1. Exakte Kandidaten bevorzugen.
  for (const c of candidates) {
    const hit = names.find(n => n.toLowerCase() === c.toLowerCase());
    if (hit) return hit;
  }
  // 2. Sonst nach Schlüsselwörtern im Property-Namen suchen.
  for (const n of names) {
    const lower = n.toLowerCase();
    if (keywords.some(k => lower.includes(k))) return n;
  }
  return undefined;
}

/** Prüft, ob eine Property laut Schema ein Array erwartet. */
function isArrayProperty(schema: any, name: string): boolean {
  return schema?.properties?.[name]?.type === "array";
}

/**
 * Aus dem Ergebnis eines tools/call ein Bild extrahieren. MCP-Tool-Ergebnisse
 * liefern ein content-Array; Bilder kommen als {type:"image", data, mimeType},
 * URLs häufig als Text- oder Resource-Content.
 */
function extractImage(result: any): McpImageResult {
  const contents: any[] = Array.isArray(result?.content) ? result.content : [];

  // 1. Direktes Bild-Content-Element.
  const image = contents.find(c => c?.type === "image" && (c.data || c.b64_json || c.b64Json));
  if (image) {
    return {
      b64Json: image.data ?? image.b64_json ?? image.b64Json,
      mimeType: image.mimeType ?? image.mime_type ?? "image/png",
    };
  }

  // 2. Resource mit eingebetteten Blob-Daten oder URI.
  const resource = contents.find(c => c?.type === "resource" && c.resource);
  if (resource) {
    const r = resource.resource;
    if (r.blob) return { b64Json: r.blob, mimeType: r.mimeType ?? r.mime_type ?? "image/png" };
    if (r.uri && /^https?:\/\//i.test(r.uri)) return { url: r.uri };
  }

  // 3. Strukturierte Ausgabe (structuredContent) durchsuchen.
  const structured = result?.structuredContent ?? result?.structured_content;
  if (structured) {
    const url = structured.url ?? structured.image_url ?? structured.imageUrl;
    if (typeof url === "string" && /^https?:\/\//i.test(url)) return { url };
    const b64 = structured.b64_json ?? structured.b64Json ?? structured.image;
    if (typeof b64 === "string" && b64.length > 0) {
      return { b64Json: b64, mimeType: structured.mimeType ?? structured.mime_type ?? "image/png" };
    }
  }

  // 4. Text-Content, der eine Bild-URL oder eine data:-URI enthält.
  for (const c of contents) {
    if (c?.type === "text" && typeof c.text === "string") {
      const dataUri = c.text.match(/data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)/);
      if (dataUri) return { b64Json: dataUri[2], mimeType: dataUri[1] };
      const httpUrl = c.text.match(/https?:\/\/[^\s"'<>]+/);
      if (httpUrl) return { url: httpUrl[0] };
    }
  }

  throw new Error(
    `MCP: Bild-Tool lieferte kein erkennbares Bild. Ergebnis: ${JSON.stringify(result).slice(0, 400)}`,
  );
}

/**
 * Ein Bild über einen MCP-Server erzeugen.
 *
 * @param endpoint Vollständige MCP-Endpoint-URL (inkl. Token im Pfad).
 * @param input    Prompt und optionale Referenzbilder.
 * @param toolNameOverride Optionaler fester Tool-Name (sonst automatische Erkennung).
 */
export async function generateImageViaMcp(
  endpoint: string,
  input: McpImageInput,
  toolNameOverride?: string,
): Promise<McpImageResult> {
  const baseHeaders: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
  };

  async function rpc(
    method: string,
    params: unknown,
    sessionId: string | undefined,
    isNotification = false,
  ): Promise<{ body: JsonRpcResponse; sessionId?: string }> {
    const headers = { ...baseHeaders };
    if (sessionId) headers["mcp-session-id"] = sessionId;
    const payload: Record<string, unknown> = { jsonrpc: "2.0", method, params };
    if (!isNotification) payload.id = nextId();

    const resp = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    const newSession = resp.headers.get("mcp-session-id") ?? undefined;

    // Notifications liefern i. d. R. 202 ohne Body.
    if (isNotification) {
      if (!resp.ok && resp.status !== 202) {
        throw new Error(`MCP ${method} fehlgeschlagen (HTTP ${resp.status})`);
      }
      await resp.text().catch(() => "");
      return { body: { jsonrpc: "2.0" }, sessionId: newSession };
    }

    const body = await readJsonRpc(resp);
    assertOk(resp, body, method);
    return { body, sessionId: newSession };
  }

  // 1. initialize
  const init = await rpc(
    "initialize",
    {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "trikot-konfigurator", version: "1.0.0" },
    },
    undefined,
  );
  const sessionId = init.sessionId;

  // 2. initialized-Notification
  await rpc("notifications/initialized", {}, sessionId, true);

  // 3. Bild-Tool bestimmen
  let toolName = toolNameOverride?.trim() || "";
  let inputSchema: any = undefined;

  const toolsList = await rpc("tools/list", {}, sessionId);
  const tools: any[] = toolsList.body.result?.tools ?? [];

  if (toolName) {
    inputSchema = tools.find(t => t?.name === toolName)?.inputSchema;
  } else {
    // Tool anhand von Name/Beschreibung erkennen (generate/create/image/paint/draw).
    const kw = ["image", "img", "picture", "bild", "generate", "create", "paint", "draw", "render"];
    const scored = tools
      .map(t => {
        const hay = `${t?.name ?? ""} ${t?.description ?? ""}`.toLowerCase();
        const score = kw.reduce((s, k) => (hay.includes(k) ? s + 1 : s), 0);
        return { t, score };
      })
      .sort((a, b) => b.score - a.score);
    const best = scored[0];
    if (best && best.score > 0) {
      toolName = best.t.name;
      inputSchema = best.t.inputSchema;
    } else if (tools.length === 1) {
      toolName = tools[0].name;
      inputSchema = tools[0].inputSchema;
    }
  }

  if (!toolName) {
    const available = tools.map(t => t?.name).filter(Boolean).join(", ") || "(keine)";
    throw new Error(
      `MCP: kein Bildgenerierungs-Tool gefunden. Verfügbare Tools: ${available}. ` +
        `Ggf. BALLZ_IMAGE_MCP_TOOL setzen.`,
    );
  }

  // 4. Argumente adaptiv aufbauen
  const args: Record<string, unknown> = {};
  const promptProp = pickProperty(inputSchema, ["prompt"], ["prompt", "text", "description", "caption"]) ?? "prompt";
  args[promptProp] = input.prompt;

  const refs = input.originalImages ?? [];
  if (refs.length > 0) {
    const imageProp = pickProperty(inputSchema, ["images", "image", "reference_images", "input_images"], [
      "image",
      "img",
      "reference",
      "photo",
    ]);
    if (imageProp) {
      // Referenzbilder bevorzugt als URL, sonst als data:-URI übergeben.
      const values = refs.map(r => {
        if (r.url) return r.url;
        if (r.b64Json) return `data:${r.mimeType ?? "image/png"};base64,${r.b64Json}`;
        return undefined;
      }).filter((v): v is string => Boolean(v));

      if (values.length > 0) {
        args[imageProp] = isArrayProperty(inputSchema, imageProp) ? values : values[0];
      }
    }
  }

  const call = await rpc("tools/call", { name: toolName, arguments: args }, sessionId);
  const result = call.body.result;

  if (result?.isError) {
    const msg = Array.isArray(result.content)
      ? result.content.map((c: any) => c?.text).filter(Boolean).join(" ")
      : "unbekannter Fehler";
    throw new Error(`MCP-Tool "${toolName}" meldete einen Fehler: ${msg}`);
  }

  return extractImage(result);
}

# kiez-design-api — Live-Test auf deinem Server

Master-Prompt liegt nur in `lib/prompt.js`, Faktenkarten in `data/cities.json`.
Die gesamte Logik/Routen liegen in `mount.js` (eine Quelle der Wahrheit) und
werden von beiden Betriebsvarianten geteilt:

- **Variante A — eigener Prozess/Container** (`server.js`, Port 3100), siehe unten.
- **Variante B — im bestehenden trikot-konfigurator-Prozess** (kein zweiter
  Prozess), siehe Abschnitt „Variante B".

Routen in beiden Varianten:

- API: `GET /api/kiez/cities` · `/api/kiez/resolve` · `POST /api/kiez/generate`
  · `GET /api/kiez/job/:id` · `GET /api/kiez/preview/:file` · `POST /api/kiez/claim`
- Test-UI: `GET /kiez/test/`
- Webhook: `POST /webhook/shopify/orders_paid`

## Variante B: Im bestehenden Prozess (kein zweiter Container)

`server/_core/index.ts` mountet den Router direkt in die Express-App der
Haupt-Anwendung — vor dem Vite/Static-Catch-all:

```ts
const { createKiezRouter } = await import("../../kiez-design-api/mount.js");
const { router: kiezRouter } = await createKiezRouter({
  root: path.resolve(process.cwd(), "kiez-design-api"),
});
app.use(kiezRouter);
```

Voraussetzungen:

- `OPENAI_API_KEY` in der **Env der Haupt-App** (derselbe Key wie beim
  ballz-image-mcp). Fehlt er, wird der Mount übersprungen und die Haupt-App
  läuft unverändert weiter (kein Absturz).
- `openai` ist als Dependency ergänzt; `express`, `sharp`, `nanoid` waren schon da.
- Der Ordner `kiez-design-api/` muss im Deployment vorhanden sein (data/ + public/
  werden zur Laufzeit über `root` gelesen — funktioniert in Dev **und** im
  gebündelten Prod-Start `node dist/index.js`, da beide aus dem Repo-Root laufen).
- **`PUBLIC_BASE_URL` = Origin der Haupt-App** (ohne `/kiez`-Suffix), denn die
  API liegt hier unter `/<origin>/api/kiez/*`. Beispiel:
  `PUBLIC_BASE_URL=https://<deine-app-domain>` → Vorschau-URLs werden zu
  `https://<deine-app-domain>/api/kiez/preview/...`.

Test-UI dann unter `https://<deine-app-domain>/kiez/test/`.

## Deploy (Docker, 3 Schritte)

1. Ordner auf den Server kopieren (z. B. `/opt/kiez-design-api`)
2. `.env.example` → `.env` kopieren, `OPENAI_API_KEY` eintragen (derselbe Key wie beim MCP-Server)
3. `docker compose up -d --build`

Test-Oberfläche: `http://SERVER:3100/kiez/test/`  
Für den Live-Test bleiben `SHOPIFY_APP_SECRET` und `TURNSTILE_SECRET` leer → Signatur und Captcha sind aus.

Alternativ ohne Docker: `npm install && npm start` (Node 20).

## Reverse Proxy (Caddy/Nginx/Traefik)

`https://mcp.markusassemacher.de/kiez/*` → `localhost:3100/*` und `PUBLIC_BASE_URL=https://mcp.markusassemacher.de/kiez` in `.env` setzen.

## Freitext-Orte

Der Kunde tippt jeden Ort ein. Ablauf: Nominatim (Koordinaten, Landkreis, Bundesland) → Wikipedia DE →
LLM baut die Faktenkarte (`storage/cards/`). Kuratierte Großstädte in `data/cities.json` haben Vorrang.
Ohne Wahrzeichen (`tier=village`) wird der Ortscharakter zum Motiv: regionale Bauweise + Landschaft.
Faktenkarten kannst du in `storage/cards/*.json` nachträglich korrigieren – sie werden 30 Tage gecacht.

## Was passiert pro Design

Formular → Prompt (Master V1 + Faktenkarte) → gpt-image-1, transparent, 1024×1536  
→ Text-QA (Vision liest Stadtname + Koordinaten) + Weiß-Check → bei Fehler 1× Retry  
→ `storage/masters/{designId}_PRINT_MASTER.png` (unbearbeitet, Druckmaster)  
→ `storage/previews/{designId}.png` (800 px, Wasserzeichen, signierte URL, 7 Tage)  
→ `storage/jobs/{designId}.json` (Prompt, QA-Protokoll)

Nicht reservierte Entwürfe werden nach 7 Tagen gelöscht.

## Kosten pro Design (Richtwert)

gpt-image-1 medium 1024×1536 ≈ 0,07 € · QA-Call ≈ 0,003 € · Retry verdoppelt.  
Limits: 3/Session · 10/IP/Tag · 300/Tag gesamt (`.env`).

## Stufe 2 (nach erfolgreichem Test)

- Shopify App Proxy `/apps/design` anlegen → `SHOPIFY_APP_SECRET` setzen
- Turnstile-Key setzen
- Theme-Section (bestehender Konfigurator) statt `/test/`
- Drive-Sync der Master nach `KIEZFASHION_MEISTERWERK/01_Entwuerfe`
- orders/paid → Textil-Ableitungen via edit_ballz_image → `03_Druckdaten`

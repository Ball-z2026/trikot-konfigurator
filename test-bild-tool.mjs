import { invokeLLM } from "./server/_core/llm.ts";
import fs from "fs";
import path from "path";

async function main() {
  // Bild als Base64 laden
  const imagePath = "/home/ubuntu/upload/IMG_4960.PNG";
  const imageBuffer = fs.readFileSync(imagePath);
  const base64 = imageBuffer.toString("base64");
  const dataUrl = `data:image/png;base64,${base64}`;

  console.log("=== KI-Bild-Analyse gestartet ===");
  console.log("Bild:", imagePath);

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `Du bist ein Experte für Sportbekleidung und Trikot-Design. Analysiere das hochgeladene Bild eines Trikots/Sportartikels und erkenne alle Positionen von Texten, Nummern, Logos und Namen.

Gib die Positionen in ZENTIMETERN an. Verwende als Referenzmaße:
- Basketball-Trikot (ärmellos): ca. 50cm breit, 70cm hoch
- Fußball-Trikot: ca. 55cm breit, 75cm hoch
- Handball-Trikot: ca. 55cm breit, 75cm hoch

Antworte NUR mit einem JSON-Array. Jedes Element hat:
- "name": Beschreibung der Zone (z.B. "Spielername Rücken")
- "purpose": Einer von: playerName, playerNumber, clubName, logo, sponsor, custom
- "x_cm": X-Position in cm (von links)
- "y_cm": Y-Position in cm (von oben)
- "width_cm": Breite in cm
- "height_cm": Höhe in cm
- "side": "front" oder "back"

Antworte NUR mit dem JSON-Array, keine weiteren Erklärungen.`
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Analysiere dieses Trikot-Bild und erkenne alle Positionen:" },
          { type: "image_url", image_url: { url: dataUrl, detail: "high" } }
        ]
      }
    ]
  });

  const content = response.choices[0].message.content;
  console.log("\n=== KI-Ergebnis (roh) ===");
  console.log(content);

  // JSON parsen
  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const zones = JSON.parse(jsonMatch[0]);
      console.log("\n=== Erkannte Zonen in cm ===");
      for (let i = 0; i < zones.length; i++) {
        const z = zones[i];
        console.log(`${i+1}. ${z.name} (${z.purpose}) - Position: ${z.x_cm}cm/${z.y_cm}cm, Größe: ${z.width_cm}x${z.height_cm}cm, Seite: ${z.side}`);
      }
    }
  } catch (e) {
    console.log("JSON-Parse-Fehler:", e.message);
  }

  process.exit(0);
}
main();

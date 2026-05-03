import { invokeLLM } from "./server/_core/llm.ts";

const imageUrl = "file:///home/ubuntu/upload/IMG_4960.PNG";

// Simuliere den Analyse-Prompt wie im Backend
const systemPrompt = `Du bist ein Experte für Sportbekleidung und Trikot-Design. Analysiere das hochgeladene Bild eines Trikots oder Sportbekleidungsstücks.

Identifiziere alle sichtbaren Elemente und ihre ungefähren Positionen auf dem Bild. Gib die Positionen als Prozent-Werte (0-100) relativ zur Bildgröße an.

Erkenne folgende Elemente (falls vorhanden):
- Spielername (playerName): Text auf Rücken/Brust
- Spielernummer (playerNumber): Nummer auf Rücken/Brust
- Vereinsname/Teamname (clubName): Teambezeichnung
- Logo/Wappen (logo): Vereinswappen, Sponsorenlogos
- Sponsor (sponsor): Sponsoren-Logos/Text
- Kürzel (abbreviation): Kurze Texte/Initialen

Antworte NUR mit einem JSON-Array. Jedes Element hat:
{
  "name": "Beschreibender Name",
  "purpose": "playerName|playerNumber|clubName|logo|sponsor|abbreviation|custom",
  "x": Prozent von links (0-100),
  "y": Prozent von oben (0-100),
  "width": Breite in Prozent (5-50),
  "height": Höhe in Prozent (5-30),
  "side": "front|back"
}`;

async function test() {
  try {
    // Bild als base64 lesen
    const fs = await import('fs');
    const imageBuffer = fs.readFileSync('/home/ubuntu/upload/IMG_4960.PNG');
    const base64 = imageBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: "Analysiere dieses Trikot-Bild und identifiziere alle Elemente mit ihren Positionen. Sportart: basketball" },
            { type: "image_url", image_url: { url: dataUrl, detail: "high" } }
          ]
        }
      ]
    });

    const content = response.choices[0].message.content;
    console.log("=== KI-Analyse Ergebnis ===");
    console.log(content);
    
    // Versuche JSON zu parsen
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const zones = JSON.parse(jsonMatch[0]);
      console.log("\n=== Erkannte Zonen ===");
      zones.forEach((z, i) => {
        console.log(`${i+1}. ${z.name} (${z.purpose}) - Position: ${z.x}%/${z.y}%, Größe: ${z.width}%x${z.height}%, Seite: ${z.side}`);
      });
    }
  } catch (error) {
    console.error("Fehler:", error.message || error);
  }
}

test();

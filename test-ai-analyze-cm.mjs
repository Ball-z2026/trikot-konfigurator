import { invokeLLM } from "./server/_core/llm.ts";
import fs from "fs";

const systemPrompt = `Du bist ein Experte für Sportbekleidung und Trikot-Design. Analysiere das hochgeladene Bild eines Trikots oder Sportbekleidungsstücks.

Identifiziere alle sichtbaren Elemente und ihre ungefähren Positionen. 

WICHTIG: Gib alle Maße in ZENTIMETERN (cm) an, basierend auf den typischen realen Maßen eines Basketball-Trikots (Erwachsene Größe L):
- Gesamtbreite: ca. 55 cm
- Gesamthöhe: ca. 75 cm
- Die Position (x, y) ist der Abstand von der oberen linken Ecke des Trikots in cm
- Breite und Höhe der Zone in cm

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
  "x_cm": Abstand von links in cm,
  "y_cm": Abstand von oben in cm,
  "width_cm": Breite in cm,
  "height_cm": Höhe in cm,
  "side": "front|back"
}`;

async function test() {
  try {
    const imageBuffer = fs.readFileSync('/home/ubuntu/upload/IMG_4960.PNG');
    const base64 = imageBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;

    console.log("Analysiere Bild mit KI (cm-Angaben)...");

    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: "Analysiere dieses Basketball-Trikot-Bild und identifiziere alle Elemente mit ihren Positionen in Zentimetern. Das Trikot hat die typischen Maße eines Erwachsenen-Basketball-Trikots (ca. 55cm breit, 75cm hoch)." },
            { type: "image_url", image_url: { url: dataUrl, detail: "high" } }
          ]
        }
      ]
    });

    const content = response.choices[0].message.content;
    console.log("=== KI-Analyse Ergebnis (cm) ===");
    console.log(content);
    
    // JSON parsen
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const zones = JSON.parse(jsonMatch[0]);
      console.log("\n=== Erkannte Zonen (cm) ===");
      zones.forEach((z, i) => {
        console.log(`${i+1}. ${z.name} (${z.purpose})`);
        console.log(`   Position: ${z.x_cm} cm von links, ${z.y_cm} cm von oben`);
        console.log(`   Größe: ${z.width_cm} cm x ${z.height_cm} cm`);
        console.log(`   Seite: ${z.side === "front" ? "Vorne" : "Rücken"}`);
      });

      // Ergebnis als JSON speichern für die Visualisierung
      fs.writeFileSync('/home/ubuntu/trikot-konfigurator/analyze-result.json', JSON.stringify(zones, null, 2));
      console.log("\nErgebnis gespeichert in analyze-result.json");
    }
  } catch (error) {
    console.error("Fehler:", error.message || error);
  }
}

test();

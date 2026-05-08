# Schnittmuster-Workflow: KI-Design → Druckbogen

## Vorhandene Schnittmuster (Größe L)

Quelle: `/home/ubuntu/trikot-parts/` (aus `L_aufbereitet.pdf`)

| Teil | Datei | Maße (px) | Beschreibung |
|------|-------|-----------|--------------|
| Vorderteil | part_8.png | 1679x2266 | U-Rundhals-Ausschnitt |
| Rückteil | part_7.png | 1679x2260 | V-Halsausschnitt |
| Ärmel 1 | part_2.png | 1380x764 | Pentagon-Form mit Bogen oben |
| Ärmel 2 | part_4.png | 1380x764 | Gleiche Form wie Ärmel 1 |
| Kragen | part_6.png | 1457x210 | Breiter rechteckiger Streifen |
| Bündchen 1 | part_3.png | 1139x223 | Trapezförmiger Streifen |
| Bündchen 2 | part_5.png | 1139x223 | Gleich wie Bündchen 1 |

## Geplanter Workflow

### Schritt 1: KI generiert Design auf flachem Schnittmuster
- KI bekommt die Schnittmuster-Teile als Referenz
- Prompt: "Generiere ein Sublimations-Design auf diesen flachen Schnittteilen"
- Ergebnis: Jedes Teil hat ein Design, das an den Kanten zusammenpasst

### Schritt 2: Photoroom-Mockup für Vorschau
- Flaches Design → Photoroom API → Mockup mit Person
- Ergebnis: Coole Vorschau für den Kunden

### Schritt 3: Druckbogen
- Flaches Design direkt als Druckvorlage verwenden
- Logos, Nummern, Namen als Vektor-Overlay drauf (Post-Processing)
- Skalierung auf andere Größen (XS-5XL + Kindergrößen)

## Offene Fragen
- Wie stellt die KI sicher, dass das Muster an den Nähten zusammenpasst?
- Auflösung: 1679px bei ~49cm Breite = ~87 DPI → braucht Upscaling für 300 DPI
- Skalierung auf andere Größen: proportional oder mit Anpassung?

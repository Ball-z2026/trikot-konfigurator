# 3D-Mockup Optionen-Analyse

## Übersicht der evaluierten Optionen

### Option 1: Three.js (Self-Hosted, Open Source)

**Beschreibung:** JavaScript-3D-Bibliothek für Browser-basierte 3D-Darstellung. Erfordert eigene 3D-Modelle (.glb/.gltf) und UV-Mapping.

**Vorteile:**
- Keine laufenden Kosten (Open Source, MIT-Lizenz)
- Volle Kontrolle über Darstellung und Interaktion
- Echtzeit-Rendering im Browser (keine API-Aufrufe)
- Große Community und viele Beispiele (T-Shirt-Konfiguratoren existieren)
- Kann direkt in React integriert werden (@react-three/fiber)

**Nachteile:**
- Hoher Entwicklungsaufwand: 3D-Modelle müssen erstellt werden (Blender/Maya)
- UV-Mapping für jedes Textil-Produkt nötig (Trikot, Hose, Jacke etc.)
- Performance auf schwachen Mobilgeräten eingeschränkt
- Realismus begrenzt (kein Fotorealismus ohne aufwändiges Shading)
- Geschätzter Aufwand: 40-80 Stunden für Grundimplementierung + 3D-Modelle

**Kosten:** 0 EUR (nur Entwicklungszeit)

**Empfehlung:** Beste Langzeitlösung bei hohem Qualitätsanspruch. Erfordert aber 3D-Modell-Erstellung.

---

### Option 2: Dynamic Mockups API (SaaS)

**Beschreibung:** REST-API für Mockup-Generierung aus Photoshop-Templates (.psd). Unterstützt T-Shirts, Hoodies, etc.

**Vorteile:**
- Schnelle Integration (1 POST-Request = 1 Mockup)
- Median Renderzeit < 1 Sekunde
- 100k+ Mockup-Templates verfügbar (T-Shirts, Hoodies, etc.)
- Eigene PSD-Templates möglich
- SDKs für JavaScript, Python, Laravel, Rails
- 99.9% Uptime SLA

**Nachteile:**
- Laufende Kosten (Credit-basiert)
- Abhängigkeit von externem Dienst
- Keine echte 3D-Interaktion (nur statische Bilder)
- Custom Templates erfordern Photoshop-Kenntnisse

**Preise:**
| Plan | Preis | Credits | Pro Credit |
|------|-------|---------|------------|
| Free | 0 EUR | 50 Credits | - |
| Pro | ab 15 USD/Monat (jährlich) | 3.600-120.000/Jahr | 0.051 USD |
| Custom | Individuell | 10.000+/Monat | Volumenrabatt |

**Empfehlung:** Schnellste Integration, gutes Preis-Leistungs-Verhältnis. Ideal für MVP.

---

### Option 3: VirtualThreads (3D-Animierte Mockups)

**Beschreibung:** Browser-basierter 3D-Mockup-Generator mit Animationen (Wind, Walking).

**Vorteile:**
- Echte 3D-Darstellung mit Animationen
- HD-Bildexport kostenlos
- Farbanpassung der Kleidungsstücke
- Video-Export (Pro)

**Nachteile:**
- Kein API-Zugang (nur Web-Interface)
- Keine programmatische Integration möglich
- Begrenzte Produktauswahl im Free-Plan
- Keine Custom-Templates

**Preise:**
| Plan | Preis | Features |
|------|-------|----------|
| Free | 0 USD | 3D-Mockups, HD-Export, Farbanpassung |
| Pro Yearly | 8.25 USD/Monat (99 USD/Jahr) | Alle Produkte, Video, 3D-Export, Animationen |

**Empfehlung:** Nicht für programmatische Integration geeignet. Nur als manuelles Design-Tool.

---

### Option 4: KI-Bildgenerierung (Manus Built-in)

**Beschreibung:** Nutzung der integrierten Manus Image-Generation-API um fotorealistische Mockups per KI zu erzeugen.

**Vorteile:**
- Bereits im Projekt verfügbar (generateImage-Helper)
- Keine zusätzlichen Kosten
- Fotorealistische Ergebnisse möglich
- Flexibel für alle Textil-Typen

**Nachteile:**
- Unvorhersagbare Ergebnisse (KI-generiert, nicht deterministisch)
- Design-Platzierung nicht pixelgenau
- Latenz: 5-20 Sekunden pro Bild
- Nicht geeignet für exakte Vorschau (Farben, Positionen können abweichen)

**Empfehlung:** Gut für Marketing-Bilder, nicht für exakte Konfigurator-Vorschau.

---

## Empfohlene Strategie

### Kurzfristig (MVP): Dynamic Mockups API
- Schnelle Integration (1-2 Tage)
- 50 kostenlose Credits zum Testen
- PSD-Templates für Trikot, Hose, Jacke erstellen
- Ab 15 USD/Monat für Produktionsbetrieb

### Mittelfristig: Three.js + @react-three/fiber
- 3D-Modelle in Blender erstellen (Trikot, Hose, Jacke, etc.)
- UV-Mapping für Design-Platzierung
- Echtzeit-Vorschau im Browser ohne API-Kosten
- Geschätzter Aufwand: 40-80 Stunden

### Langfristig: Hybrid-Ansatz
- Three.js für Echtzeit-Vorschau im Konfigurator
- Dynamic Mockups API für hochauflösende Export-Bilder
- KI-Bildgenerierung für Marketing-Material

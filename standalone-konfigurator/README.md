# Ballz Trikot-Konfigurator – Standalone Demo

Eine **eigenständige, offline lauffähige Kopie** des Trikot-Konfigurators als
einzelne HTML-Datei – ganz ohne Backend, Datenbank, Build-Schritt oder
Abhängigkeiten.

## Nutzung

Einfach `index.html` im Browser öffnen (Doppelklick genügt). Es wird kein
Server benötigt. Für die Sport-Schriftarten (Oswald, Anton, Bebas Neue …)
ist eine Internetverbindung zu Google Fonts hilfreich; offline fällt die
Anzeige auf System-Schriften zurück, alles bleibt funktionsfähig.

## Nachgebildete Kernfunktionen

Extrahiert aus `client/src/pages/CustomerConfigurator.tsx`:

- **Parts** (Korpus, Ärmel links/rechts, Kragen) – einzeln einfärbbar, mit
  Live-**CMYK**-Anzeige für den Textildruck (Umrechnung portiert aus
  `client/src/lib/cmyk.ts`).
- **Zonen** mit prozentualer Positionierung (`posX/posY/width/height`) und
  Purposes: `clubLogo`, `playerName`, `playerNumber`, `playerInitials`,
  `clubName`, `custom` – Text skaliert per SVG in die Zone (wie im Original).
- **Spielerliste** (Nummer / Name / Größe) – der gewählte Spieler wird live
  auf das Trikot übertragen (Namen-, Nummern-, Kürzel-Zonen).
- **Vorder-/Rückseite** umschaltbar mit jeweils eigenen Zonen.
- **Google Fonts**, Schriftgröße, -stärke und -farbe pro Zone.
- **Vorlagen** (Fußball, Handball, Basketball-Tank, Volleyball) mit
  Standardfarben – Struktur wie `shared/templates.ts`.
- **Logo-Upload** (Vereinswappen) per Datei → Data-URL.
- **PNG-Export** als hochauflösende Druckdatei (2000 × 2400 px) via Canvas.

## Abgrenzung

Alle Daten sind **Mock-Daten**. Es gibt bewusst keine tRPC-/DB-Anbindung,
kein Speichern von Designs, keine Verbandsregel-Validierung und keine
KI-Mockups – dies ist eine self-contained Demo/Prototyp-Fassung des
Konfigurators zum Weitergeben und lokalen Ausprobieren.

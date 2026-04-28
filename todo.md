# Project TODO

## Admin-Backend
- [x] Datenbank-Schema für Produkte (products) und Zonen (product_zones) erstellen
- [x] tRPC-Router für Produkt-CRUD (erstellen, bearbeiten, löschen, auflisten)
- [x] tRPC-Router für Zonen-CRUD (erstellen, bearbeiten, löschen pro Produkt)
- [x] Produktbild-Upload über S3 Storage
- [x] Admin-Dashboard mit Produktliste
- [x] Admin Produkt-Editor mit Bild-Upload
- [x] Admin Zonen-Editor: Drag & Drop Positionierung auf dem Produktbild
- [x] Admin Zonen-Editor: Skalierung der Zonen
- [x] Produkt veröffentlichen/unveröffentlichen Toggle
- [x] Rollenbasierte Zugriffskontrolle (nur Admin darf Produkte verwalten)

## Kunden-Frontend
- [x] Produktübersicht für Kunden (nur veröffentlichte Produkte)
- [x] Produkt-Konfigurator: Zonen anzeigen wie vom Admin definiert
- [x] Logo-Upload in den vordefinierten Zonen
- [x] Mannschaftslisten-Import (CSV) mit automatischer Platzierung
- [x] Vorschau mit platzierten Logos und Texten
- [x] Export als PNG (Einzelansicht)
- [x] Batch-Export aller Spieler als ZIP

## Allgemein
- [x] Vitest Tests für Backend-Routen
- [x] UI/UX Feinschliff und responsive Design (Mobile-optimierte Header, Breakpoints, Touch-freundliche Elemente)

## Verbesserungen & Lücken
- [x] /api/upload absichern (Auth-Check) und MIME-/Dateigrößen-Validierung
- [x] Admin Bild-Upload Error-Handling und Loading-States verbessern
- [x] Zonen-Mapping für Name/Nummer explizit modellieren (purpose-Feld: logo, playerName, playerNumber, custom)
- [x] PNG-/ZIP-Export stabilisieren (double rAF + reduzierter Timeout, Error-Handling pro Spieler, Dateinamen-Sanitization)

## Trikot-Template als Vorlage bei Produkterstellung
- [x] Trikot-Teile in höherer Auflösung extrahieren und als Assets hochladen
- [x] DB-Schema: productParts Tabelle + productZones mit partId erweitert + products mit templateId
- [x] Admin-Produkterstellung: Template-Auswahl Dropdown/Karten bei "Neues Produkt"
- [x] Bei Template-Auswahl: Teile-Bilder und vordefinierte Zonen automatisch anlegen
- [x] Konfigurator: Einzelteile-Navigation (Vorderteil, Rückteil, Ärmel etc.) statt nur Vorder-/Rückseite
- [x] Konfigurator: Zusammengebaute Trikot-Gesamtvorschau (alle Teile gleichzeitig in einem Grid-Layout)
- [x] UI-Toggle zwischen Einzelteil-Bearbeitung und Gesamtvorschau (Einzelteile / Gesamtübersicht Buttons)
- [x] Home-Seite: Vorschau für Parts-basierte Produkte (Template-Icon Fallback)

## Sublimation vs. DTF Varianten
- [x] Template-System: Sublimationstrikot (alle 7 Teile konfigurierbar)
- [x] Template-System: DTF-Trikot (nur Vorderteil, Rückteil, Ärmel Links, Ärmel Rechts)
- [x] Admin-Produkterstellung: Varianten-Auswahl (Sublimation / DTF) bei Trikot-Vorlage mit Druckverfahren-Badge
- [ ] Skill erstellen mit skill-creator für den gesamten Textil-Konfigurator-Prozess

## Erweiterter Zonen-Editor
- [x] DB-Schema: Rotation (Grad), Breite/Höhe in cm, Schriftart, erweiterte Feldtypen (inkl. clubName)
- [x] Backend: Router und DB-Helpers für neue Felder aktualisieren (rotation, cm, font, clubName)
- [x] Admin-Editor: Felder frei hinzufügen und benennen
- [x] Admin-Editor: Größe in cm angeben (Breite/Höhe)
- [x] Admin-Editor: Rotation in Grad (Drehen)
- [x] Admin-Editor: Schriftarten-Auswahl für Text-Zonen (10 sportliche Fonts, Größe, Farbe, Gewicht, Ausrichtung, Vorschau)
- [x] Admin-Editor: Feste Feldtypen (Nummer, Vereinsname, Spielername, Logo, Freitext) als Zweck-Typ
- [x] Kunden-Konfigurator: Feste Felder (Spielername, Nummer, Vereinsname) automatisch befüllen
- [x] Kunden-Konfigurator: Schriftarten, Rotation, cm-Maße korrekt anzeigen (Google Fonts dynamisch laden)
- [x] Tests aktualisieren (14 Tests bestanden, inkl. rotation, cm, font, clubName)

## Farbauswahl pro Trikotteil (nur Sublimation)
- [x] DB-Schema: Farbpalette-Feld am Produkt (colorPalette JSON) und Standardfarbe pro Part (defaultColor)
- [x] Backend: Router für Farbpalette (product.update) und Part-Farben (part.update defaultColor) aktualisieren
- [x] Admin-Editor: Farbpalette definieren und Standardfarben pro Teil setzen (nur bei Sublimation-Produkten)
- [x] Kunden-Konfigurator: Farbauswahl pro Teil mit Color-Overlay (nur bei Sublimation templateId)
- [x] Tests aktualisieren (18 Tests bestanden, inkl. colorPalette und defaultColor)

## DTF-Trikot: Grundfarbe / Markentrikot
- [x] Kunden-Konfigurator (DTF): Grundfarbe des Trikots auswählen (Farbpalette oder freie Farbwahl)
- [x] Kunden-Konfigurator (DTF): Leeres Markentrikot hochladen als Basis (Bild wird als Hintergrund verwendet)
- [x] DTF-Markentrikot: Datei-Auswahl-Flow mit FileReader und DataURL-Übergabe in dtfBrandImage implementiert
- [x] Farb-Overlay oder hochgeladenes Trikotbild im Canvas korrekt darstellen
- [x] Export-Logik: DTF-Grundfarbe und Markentrikot-Bild werden automatisch im PNG/ZIP-Export einbezogen (html-to-image rendert alle DOM-Overlays)

## 2D-Zusammenstellung (Composite View)
- [x] Alle Einzelteile visuell als zusammengesetztes Trikot in 2D darstellen (Vorderteil mittig, Ärmel seitlich, Kragen oben, Bündchen an den Ärmeln)
- [x] Composite View im Kunden-Konfigurator nutzbar
- [x] Composite View: Klick auf ein Teil wechselt zur Einzelteil-Ansicht (onClick setzt activePartId und viewMode='parts')

## Sportart-Auswahl bei Produkterstellung
- [x] Template-System: Sportarten definieren (Fußball, Handball, Volleyball, Basketball)
- [x] Jede Sportart hat eigene Trikot-Templates (Sublimation/DTF) mit passenden Teilen
- [x] Admin-Produkterstellung: Sportart-Auswahl als erster Schritt vor Template-Wahl
- [x] UI: Sportart-Karten mit Icons (Fußball, Handball, Volleyball, Basketball)

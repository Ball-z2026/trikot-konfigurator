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

## Bug-Fix: DTF Grundfarbe nur auf Teilen
- [x] DTF-Grundfarbe nur auf den Trikot-Teilen anzeigen (Flood-Fill-Algorithmus färbt nur Innenfläche)
- [x] Teilbild als Maske verwenden (BFS von Rändern erkennt Außenbereich, Innenfläche wird eingefärbt)
- [x] Auch in Composite View, Overview und Teil-Navigation korrekt dargestellt (processedPartImages)

## Bug: Einzelteile-Ansicht zeigt nichts an
- [x] Einzelteile-Ansicht im Kunden-Konfigurator zeigt jetzt Bild an (Flood-Fill mit Standard-Graufarbe färbt Innenfläche)

## Bug: Farben können nicht mehr ausgewählt werden
- [x] Farbauswahl im Kunden-Konfigurator funktioniert (getestet auf Preview + deployed Version - Rot wird korrekt angezeigt)

## Bug: Einzelteile-Ansicht zeigt nichts an (deployed Version)
- [x] Einzelteile-Ansicht zeigt jetzt Bild an (Flood-Fill immer mit Standard-Grau #d4d4d8, Farbe nur bei Auswahl)

## Bug: Logos/Texte in Einzelansicht nicht sichtbar
- [x] Logos, Texte und andere Zonen-Inhalte werden jetzt in der Einzelansicht angezeigt (z-index: 10 auf ZoneOverlay Komponente)

## Rollen- und Berechtigungssystem

### Datenbank-Schema
- [x] Organisation-Tabelle (Verein/Firma): id, name, type, createdAt, ownerId
- [x] Abteilung/Sparte-Tabelle: id, orgId, name, createdAt
- [x] Mitgliedschaft-Tabelle: userId, orgId, departmentId, role (owner/department_lead/trainer)
- [x] Logo-Varianten-Tabelle: id, orgId, name, imageUrl, storageKey, isDefault, sortOrder
- [x] Schriftarten-Freigabe-Tabelle: id, departmentId, fontFamily, fontUrl, isDefault, approvedBy, createdAt

### Rolle: Hauptverantwortlicher (Vereins-/Firmenadmin)
- [x] Kann alles im Verein/Firma sehen und verwalten (Backend: requireOrgOwner Guard)
- [x] Einziger der Vereins-/Firmenlogos hochladen darf (Backend: orgLogo.upload mit Owner-Check)
- [ ] Logo-Varianten werden automatisch in allen Produkten bei Vereins-/Firmenlogo-Zonen gesetzt
- [x] Kann Spartenleiter und Trainer einladen/zuweisen (Backend: membership.add mit Owner-Check)

### Rolle: Spartenleiter / Abteilungsleiter
- [x] Sieht nur seine eigene Sparte/Abteilung (Backend: department.listByOrg filtert nach Rolle)
- [x] Kann Schriftarten für seine Sparte freigeben (Backend: deptFont.approve mit Lead-Check)
- [ ] Freigegebene Schriften werden automatisch in Produkten der Sparte verwendet

### Frontend
- [x] Organisations-Dashboard für Hauptverantwortlichen (Logo-Management, Mitglieder-Verwaltung)
- [x] Abteilungs-Dashboard für Spartenleiter (Schriftarten-Freigabe, Mitglieder-Übersicht)
- [ ] Auto-Zuweisung von Logos in Konfigurator-Zonen (Vereinslogo automatisch gesetzt)
- [ ] Auto-Zuweisung von Schriften in Konfigurator (Abteilungs-Schrift automatisch verwendet)

### Bug-Fixes & Verbesserungen
- [x] org.listMine -> org.list Aufruf in OrgDashboard korrigiert
- [x] department.getById Route im Backend hinzugefügt
- [x] CustomerConfigurator: Infinite-Loop-Bug behoben (parts/allZones mit useMemo stabilisiert)
- [x] Navigation: Organisation-Link in Home.tsx Header hinzugefügt
- [x] Vitest: 30 Tests bestanden (auth, products, org-roles)

### Offene Punkte
- [ ] OrgDashboard: Logo-Management im Browser verifizieren (Upload, Default-Setzen, Löschen)
- [ ] Trainer-Rolle definieren und Ablauf festlegen (nächster Schritt mit Benutzer)

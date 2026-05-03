# Produktkonfigurator Redesign – Analyse & Plan

## Ist-Zustand

### Zwei getrennte Bereiche (werden zusammengeführt):
1. **Admin Produktdesigner** (`/designer/products`) – Nur Admin kann Produkte anlegen/bearbeiten
2. **Kunden-Konfigurator** (`/konfigurator`) – Produkt auswählen → Zonen befüllen → Export

### Bestehende Funktionen (bleiben erhalten):
- Zonen-System: Logo, Vereinswappen, Spielername, Spielernummer, Kürzel, Vereinsname, Hashtag, Koordinaten, Custom
- Farbpalette / Sublimation-Farben pro Teil
- Mannschaftsliste (Spieler mit Namen, Nummern, Größen)
- Verbandsregeln-Validierung (Nummerngrößen, Platzierung je Sportart/Liga)
- Design speichern & laden (savedDesigns)
- Vorlagen-System (isOrgTemplate)
- Sponsor-Templates mit Freigabe-Workflow
- Kollektionen
- KI-Mockup-Generierung
- Export als PNG / ZIP
- Freie Zonen (freeZoneMode) für Nicht-Trikot-Artikel
- CMYK-Farbwähler
- PDF-Vorschau für Sponsor-Logos

### DB-Tabellen (relevant):
- `products` + `productParts` + `productZones` – Produkt-Templates
- `savedDesigns` – Gespeicherte Konfigurationen
- `sponsorTemplates` – Sponsor-Vorlagen
- `collections` + `collectionItems` – Kollektionen
- `teams` + `players` – Mannschaften & Spieler
- `mockupGallery` + `mockupApprovals` – Mockups & Freigaben

### Template-System (shared/templates.ts):
- 17 vordefinierte Templates mit Sportart-Zuordnung
- Sportarten: Fußball, Handball, Volleyball, Basketball
- Druckverfahren: Sublimation, DTF, SVG-DTF
- Bekleidung: Trainingshose, Aufwärmshirt, Zip-Jacke, Half-Zipper, Warme Jacke

---

## Soll-Zustand (Neuer Konfigurator)

### Zugang:
- **Alle Vereinsmitglieder** (Owner, Spartenleiter, Trainer) können Produkte designen
- Kein Admin-Only mehr für Produkterstellung

### Neuer Einstiegs-Flow:
1. **Sportart auswählen** (Pflicht bei Trikots, für Verbandsregeln)
2. **Mannschaft auswählen** (aus angelegten Mannschaften des Vereins)
3. **Vorlage auswählen** (bestehende Templates oder eigene Vorlagen)
4. → Editor öffnet sich mit allen bestehenden Funktionen

### Neue Funktionen:
- **Ausrüster-Regel**: Wenn Ausrüster vorgeschrieben → nur dessen Produkte/Logos wählbar
- **Vorlagen für alle**: Jeder kann Vorlagen hochladen (nicht nur Owner)
- **Bild-Upload → Vorlage**: Hochgeladenes Bild mit Positionierung als eigene Vorlage speichern

### Regeln:
- Bei Trikots: Sportart PFLICHT (für Verbandsregeln)
- Bei Bekleidung (Hoodie, Jacke etc.): Sportart optional
- Ausrüster-Bindung: Wenn `supplierBrand` + `supplierScope` gesetzt → Einschränkung

---

## Umsetzungsplan (Schritt für Schritt)

### Schritt 1: DB-Schema erweitern
- `savedDesigns`: Feld `sportId` hinzufügen (Sportart-Referenz)
- Evtl. neues Feld `isTemplate` oder `templateVisibility` für Vorlagen-Sichtbarkeit
- Prüfen ob `products` Tabelle angepasst werden muss

### Schritt 2: Backend-Router umbauen
- Produkt-Erstellung: Zugang für alle Vereinsmitglieder (nicht nur Admin)
- Sportart-Pflicht-Validierung bei Trikots
- Ausrüster-Regel im Backend durchsetzen
- Vorlagen-CRUD für alle Rollen

### Schritt 3: Neues Frontend – Konfigurator-Einstieg
- Neue Seite: Sportart → Mannschaft → Vorlage → Editor
- Ersetzt `/konfigurator` (ProductSelect) und `/designer/products` (AdminProducts)

### Schritt 4: Editor mit allen Funktionen
- Bestehende CustomerConfigurator-Funktionen übernehmen
- Erweitert um: Sportart-Kontext, Ausrüster-Prüfung, Vorlagen-Upload

### Schritt 5: Vorlagen-System
- Bild-Upload mit Positionsübernahme als Vorlage
- Vorlagen-Verwaltung (eigene + Vereinsvorlagen)

### Schritt 6: Tests & Feinschliff

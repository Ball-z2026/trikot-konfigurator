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

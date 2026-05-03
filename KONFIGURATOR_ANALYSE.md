# Konfigurator Analyse – Bestehende Funktionen

## CustomerConfigurator.tsx (3587 Zeilen)

### Kernfunktionen die erhalten bleiben müssen:
1. **Produkt-Anzeige**: Parts (Teile) mit Zonen, Vorder-/Rückseite
2. **Zonen-System**: Logo, Vereinswappen, Spielername, Nummer, Kürzel, Vereinsname, Freitext
3. **Farb-Konfiguration**: Part-Farben (CMYK), DTF-Basisfarbe
4. **Schrift-System**: Google Fonts, Schriftgröße, -farbe, -gewicht
5. **Spieler-Liste**: Nummern, Namen, Größen
6. **Sponsor-Vorlagen**: Drag & Drop auf Zonen
7. **Verbandsregeln**: Sportart-basierte Validierung (Nummerngrößen, Platzierung)
8. **Saved Designs**: Speichern, Laden, Duplizieren, Kategorien
9. **AI Mockup**: Mockup-Generierung und Galerie
10. **Export**: Druckdatei-Export (PNG mit DPI)
11. **Free Zone Mode**: Bekleidung – Zonen frei positionierbar
12. **Auto-Zuweisung**: Org-Logo + Abt.-Schrift automatisch
13. **Mannschafts-Auswahl**: Trainer wählt Mannschaft
14. **Gesperrte Zonen**: Vereinswappen nur Owner änderbar

### Datenquellen:
- `trpc.product.getById` – Produkt mit Parts und Zonen
- `trpc.team.mine` – Mannschaften des Users
- `trpc.membership.mine` – Vereinsmitgliedschaften
- `trpc.org.getById` – Organisation (Bundesland, Sport)
- `trpc.orgLogo.getDefault` – Standard-Logo
- `trpc.deptFont.getDefault` – Standard-Schrift
- `trpc.sponsorTemplate.list` – Sponsor-Vorlagen
- `trpc.sponsorTemplate.mandatory` – Pflicht-Sponsoren
- `trpc.savedDesign.*` – Gespeicherte Designs
- `trpc.mockupGallery.save` – Mockup speichern

### Routing:
- URL: `/configurator/:id` (Produkt-ID)
- Query-Param: `?teamId=X`

## Was NEU werden soll:
1. **Einstiegsseite**: Sportart → Mannschaft → Vorlage (statt direkt Produkt-ID)
2. **Zugang für alle**: Nicht nur Admin/Owner
3. **Sportart-Pflicht bei Trikots**: Muss gewählt werden
4. **Ausrüster-Regel**: Nur erlaubte Templates wenn Ausrüster vorgeschrieben
5. **Vorlagen-Upload**: Bild hochladen → Positionierung → eigene Vorlage

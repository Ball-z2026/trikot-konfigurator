# Umstrukturierungsplan: 3 Module

## Aktueller Stand

### Seiten (Frontend)
| Datei | Zeilen | Funktion |
|-------|--------|----------|
| CustomerConfigurator.tsx | 3525 | Konfigurator (Farben, Logos, Spieler) |
| TrainerDashboard.tsx | 1982 | Trainer: Mannschaft, Spieler, Bestellungen |
| DeptDashboard.tsx | 1719 | Spartenleiter: Übersicht, Fonts, Bestellungen |
| OrgDashboard.tsx | 1243 | Vereinsleiter: Übersicht, Logos, Sparten |
| AdminProductEditor.tsx | 1172 | Admin: Produkt bearbeiten, Zonen anlegen |
| AdminProducts.tsx | 582 | Admin: Produktliste |
| AdminUsers.tsx | 737 | Admin: Benutzerverwaltung |
| DeptFonts.tsx | 867 | Spartenleiter: Schriften verwalten |
| Home.tsx | 235 | Startseite mit Produktvorschau |
| Login/Register/etc. | ~700 | Auth-Seiten |

### Backend Router-Gruppen
| Router | Funktion |
|--------|----------|
| auth | Login/Logout |
| product, part, zone | Produktverwaltung |
| org, department, membership | Vereinsverwaltung |
| orgLogo, deptFont | Logos & Schriften |
| team, player | Mannschaften & Spieler |
| payment, orderOverview, orderComment | Bestellungen & Zahlungen |
| adminUsers | Benutzerverwaltung |
| savedDesign | Gespeicherte Designs |
| sponsorTemplate | Sponsor-Vorlagen |
| mockupGallery, mockup | Mockup-Galerie |
| collection | Kollektionen |
| jerseyRules | Trikot-Regeln |

### DB-Tabellen (23 Tabellen)
users, organizations, departments, memberships, orgLogos, departmentFonts,
products, productParts, productZones, teams, players, passwordResetTokens,
teamPayments, sponsors, playerPayments, orderComments, commentReadReceipts,
savedDesigns, sponsorTemplates, mockupGallery, collections, collectionItems,
collectionAssignments

---

## Neues Modul-Layout

### Modul 1: VERWALTUNG (`/verwaltung/...`)
**Zweck:** Vereine, Sparten, Mannschaften, Spieler verwalten

**Seiten (bestehend, werden verschoben):**
- OrgDashboard.tsx → `/verwaltung/org/:id`
- DeptDashboard.tsx → `/verwaltung/org/:id/dept/:deptId`
- DeptFonts.tsx → `/verwaltung/org/:id/dept/:deptId/fonts`
- TrainerDashboard.tsx → `/verwaltung/trainer/:id/:deptId`
- AdminUsers.tsx → `/verwaltung/admin/users`

**Backend-Router:**
- org, department, membership
- orgLogo, deptFont
- team, player
- payment, orderOverview, orderComment
- adminUsers

### Modul 2: PRODUKTDESIGNER (`/designer/...`)
**Zweck:** Produkte anlegen, Templates definieren, Zonen konfigurieren

**Seiten (bestehend, werden verschoben):**
- AdminProducts.tsx → `/designer/products`
- AdminProductEditor.tsx → `/designer/products/:id`

**Backend-Router:**
- product, part, zone
- sponsorTemplate
- collection
- jerseyRules

### Modul 3: KONFIGURATOR (`/konfigurator/...`)
**Zweck:** Trainer/Kunde konfiguriert Textilien

**Seiten (bestehend, bleiben):**
- CustomerConfigurator.tsx → `/konfigurator/:id` (bleibt gleich)
- MockupShare.tsx → `/mockup/:token` (bleibt gleich)

**Backend-Router:**
- savedDesign
- mockupGallery, mockup

### Gemeinsam (alle Module)
- Home.tsx → `/` (Startseite mit Links zu allen 3 Modulen)
- Login/Register/Auth-Seiten
- auth Router

---

## Umsetzungsplan

### Schritt 1: Neue Navigation auf Home-Seite
- 3 große Kacheln: Verwaltung, Produktdesigner, Konfigurator
- Jede Kachel führt zum jeweiligen Modul

### Schritt 2: Routes in App.tsx umstrukturieren
- Verwaltungs-Routes unter `/verwaltung/...`
- Designer-Routes unter `/designer/...`
- Konfigurator-Routes bleiben unter `/konfigurator/...`

### Schritt 3: Navigation innerhalb der Module
- Jedes Modul bekommt eine eigene Sub-Navigation
- Zurück-Button zur Startseite

### WICHTIG: Was NICHT geändert wird
- Kein Code in den Seiten-Dateien selbst wird umgeschrieben
- Backend bleibt komplett unverändert
- Datenbank bleibt komplett unverändert
- Nur Routes und Navigation werden angepasst

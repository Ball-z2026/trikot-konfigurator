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
- [x] Skill erstellen mit skill-creator für den gesamten Textil-Konfigurator-Prozess (zurückgestellt - wird bei Bedarf erstellt)

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
- [x] Logo-Varianten werden automatisch im Konfigurator bei Logo-Zonen gesetzt (basierend auf User-Mitgliedschaft)
- [x] Kann Spartenleiter und Trainer einladen/zuweisen (Backend: membership.add mit Owner-Check)

### Rolle: Spartenleiter / Abteilungsleiter
- [x] Sieht nur seine eigene Sparte/Abteilung (Backend: department.listByOrg filtert nach Rolle)
- [x] Kann Schriftarten für seine Sparte freigeben (Backend: deptFont.approve mit Lead-Check)
- [x] Freigegebene Schriften werden automatisch im Konfigurator für Text-Zonen verwendet (basierend auf User-Mitgliedschaft)

### Frontend
- [x] Organisations-Dashboard für Hauptverantwortlichen (Logo-Management, Mitglieder-Verwaltung)
- [x] Abteilungs-Dashboard für Spartenleiter (Schriftarten-Freigabe, Mitglieder-Übersicht)
- [x] Auto-Zuweisung von Logos in Konfigurator-Zonen (Vereinslogo basierend auf erster Mitgliedschaft gesetzt)
- [x] Auto-Zuweisung von Schriften in Konfigurator (Abteilungs-Schrift basierend auf erster Mitgliedschaft verwendet)

### Bug-Fixes & Verbesserungen
- [x] org.listMine -> org.list Aufruf in OrgDashboard korrigiert
- [x] department.getById Route im Backend hinzugefügt
- [x] CustomerConfigurator: Infinite-Loop-Bug behoben (parts/allZones mit useMemo stabilisiert)
- [x] Navigation: Organisation-Link in Home.tsx Header hinzugefügt
- [x] Vitest: 65 Tests bestanden (auth, products, org-roles inkl. membership, team, player CRUD, Trainer-Verbote, Einladungskette)

### Offene Punkte
- [x] OrgDashboard: Organisation erstellt, Abteilung erstellt, Schrift freigegeben (im Browser verifiziert)
- [x] OrgDashboard: Logo-Upload im Browser durchgeführt (SW-Logo hochgeladen, erscheint als zweite Variante)
- [x] OrgDashboard: Nicht-Standard-Logo als Standard gesetzt (Badge wechselt korrekt von LOGO! zu SW-Logo)
- [x] OrgDashboard: Logo-Löschen im Browser ausgeführt (LOGO! gelöscht, nur SW-Logo mit Standard-Badge übrig)
- [x] Trainer-Rolle definiert und implementiert (Mannschaften, Spieler, Einladungskette)

## Trainer/Betreuer-Rolle & Mannschaften

### DB-Schema
- [x] Mannschaften-Tabelle (teams): id, departmentId, orgId, name, trainerId, createdAt
- [x] Spieler-Tabelle (players): id, teamId, name, number, position, createdAt

### Einladungskette
- [x] Owner legt Spartenleiter an (membership.add nur für department_lead durch Owner)
- [x] Spartenleiter legt Trainer an (membership.addTrainer durch department_lead)
- [x] Jede Rolle kann nur die nächste Stufe darunter anlegen
- [x] Zugangslink wird per E-Mail/Benachrichtigung gesendet (notifyOwner bei Einladung)
- [x] OrgDashboard: Spartenleiter-Einladung durch Owner (mit Abteilungs-Auswahl)
- [x] DeptFonts: Trainer-Einladung durch Spartenleiter (mit Berechtigungs-Info)

### Backend
- [x] DB-Helpers für Mannschaften (CRUD) und Spieler (CRUD, CSV-Import)
- [x] tRPC-Router: team.create, team.list, team.getById, team.update, team.delete
- [x] tRPC-Router: player.create, player.list, player.update, player.delete, player.importCsv
- [x] Berechtigungsprüfung: Trainer darf nur eigene Mannschaften sehen/bearbeiten
- [x] Berechtigungsprüfung: Trainer kann KEINE Logos hochladen und KEINE Schriften freigeben (orgLogo.upload/deptFont.approve prüfen Owner/Lead)
- [x] Trainer sieht automatisch Vereinslogo und freigegebene Schriften seiner Abteilung (Auto-Zuweisung im Konfigurator)

### Frontend
- [x] Trainer-Dashboard: Übersicht der eigenen Mannschaft(en)
- [x] Mannschaft anlegen/bearbeiten/löschen
- [x] Spieler hinzufügen (manuell + CSV-Import)
- [x] Spielerliste anzeigen und bearbeiten
- [x] Direktlink zum Konfigurator mit Mannschaftskontext
- [x] Navigation: Trainer wird zu seinem Dashboard geleitet (TrainerQuickLink in Home.tsx)
- [x] Tests für Trainer-Berechtigungen und Mannschafts-CRUD (65 Tests bestanden)
- [x] Browser-Test: Spieler bearbeiten (Name ändern) funktioniert
- [x] Browser-Test: CSV-Import (4 Spieler importiert) funktioniert
- [x] Browser-Test: Spieler löschen (mit Confirm-Dialog) funktioniert
- [x] Org-Auswahl im Konfigurator implementiert (Dropdown bei mehreren Mitgliedschaften)
- [x] listMembershipsByUser erweitert mit orgName/departmentName per JOIN
- [x] Konfigurator: Beim Wechsel der Org-/Abt.-Auswahl auto-gesetzte Logos/Schriften korrekt überschreiben (prevAutoLogoUrl/prevAutoFontFamily Refs)
- [x] Vitest-Test für membership.mine mit orgName/departmentName Feldern (66 Tests bestanden)
- [x] Konfigurator: Beim Wechsel zu Org ohne Default-Logo/Schrift vorherige auto-gesetzte Werte zurücksetzen (onChange Handler räumt Zonen auf)

## Eigenständiges Login-System für Spartenleiter/Trainer

### DB-Schema
- [x] E-Mail-Feld zur memberships-Tabelle hinzufügen (oder separate localUsers-Tabelle)
- [x] Passwort-Hash-Feld für lokale Benutzer (passwordHash in users-Tabelle)
- [x] Einladungs-Token für Erstanmeldung (mustChangePassword Flag)

### Backend: Lokales Auth-System
- [x] Passwort-Hashing mit bcryptjs
- [x] Login-Route: POST /api/auth/local-login (E-Mail + Passwort)
- [x] Session-Cookie setzen nach erfolgreichem Login (kompatibel mit bestehendem Auth-System)
- [x] Lokale User in ctx.user verfügbar machen (gleiche Struktur wie OAuth-User)

### Backend: Einladungs-Flow
- [x] Vereinsverantwortlicher: Spartenleiter anlegen (Name, E-Mail, Sparte) → Passwort generieren
- [x] Spartenleiter: Trainer anlegen (Name, E-Mail, Mannschaft) → Passwort generieren
- [x] Generiertes Passwort wird im Dialog angezeigt (statt E-Mail)
- [x] Passwort-Änderung nach Erstanmeldung ermöglichen (POST /api/auth/change-password)

### Frontend: Login-Seite
- [x] Separates Login-Formular für Spartenleiter/Trainer (E-Mail + Passwort)
- [x] Login-Seite unter /login erreichbarbar
- [x] Nach Login: Weiterleitung zum jeweiligen Dashboard (Spartenleiter → DeptFonts, Trainer → TrainerDashboard)

### Frontend: Einladungs-Dialoge
- [x] OrgDashboard: Spartenleiter-Einladung mit Name + E-Mail-Feld und Passwort-Anzeige
- [x] DeptFonts: Trainer-Einladung mit Name + E-Mail-Feld und Passwort-Anzeige
- [x] Einladungs-Bestätigung mit kopierbarem Passwort (Credentials-Dialog)

### Tests
- [x] Vitest: Lokales Login, Passwort-Hashing, Einladungs-Flow (73 Tests bestanden)
- [x] Browser-Test: Login als Spartenleiter/Trainer (Login-Seite und Redirect-Logik verifiziert)

## Gesperrte Zonen: Vereinsname und Vereinswappen

- [x] Vereinsname-Zonen (purpose=clubName) automatisch mit Organisationsname befüllen
- [x] Vereinsname-Zonen verwenden automatisch die vom Spartenleiter freigegebene Standard-Schrift
- [x] Vereinswappen/Logo-Zonen (purpose=logo) automatisch mit Standard-Logo der Organisation befüllen
- [x] Vereinsname und Vereinswappen sind für Trainer NICHT änderbar (gesperrt/readonly)
- [x] Visuelle Kennzeichnung gesperrter Zonen im Konfigurator (Schloss-Icon, amber Rahmen, Gesperrt-Badge)

## Automatische Skalierung und CM-Feldgrößen

### Skalierung auf volle Feldhöhe
- [x] Schriften/Text (playerName, clubName, custom) auf volle Höhe des Feldes skalieren (SVG viewBox implementiert)
- [x] PlayerNumber-Rendering: Nummern nutzen gleichen renderZoneText-Pfad mit SVG viewBox (volle Zonenhöhe)
- [x] Logo-Rendering: Logos nutzen object-contain + w-full h-full (maximale Zonenhöhe bei erhaltener Aspect Ratio)
- [x] Render-Konsistenz: Export nutzt html-to-image toPng auf dem gleichen DOM-Element (canvasRef) wie die Vorschau - SVG-Text wird korrekt gerendert

### CM-basierte Feldgrößen
- [x] Zonen-Größe in cm definierbar (widthCm/heightCm bereits im DB-Schema vorhanden)
- [x] CM-Eingabefelder im Admin-Bereich für Zonen-Definition (bereits implementiert)
- [x] CM-Anzeige im Konfigurator mit echten widthCm/heightCm-Werten verifiziert (Zone 1: 8cm x 3cm korrekt angezeigt)
- [x] CM-zu-Pixel-Umrechnung: CM-Werte werden im Admin definiert und im Konfigurator angezeigt (exakte DPI-basierte Vorschau optional)

## Passwort vergessen / Passwort zurücksetzen

### Backend
- [x] DB-Schema: passwordResetTokens-Tabelle (id, userId, token, expiresAt, usedAt)
- [x] Route: POST /api/auth/forgot-password (E-Mail eingeben → Reset-Token generieren, Notification an Owner senden)
- [x] Route: POST /api/auth/reset-password (Token + neues Passwort → Passwort zurücksetzen)
- [x] Token-Ablauf nach 1 Stunde, Token nur einmal verwendbar

### Frontend
- [x] "Passwort vergessen"-Link auf der Login-Seite
- [x] Passwort-vergessen-Formular (E-Mail-Eingabe) unter /forgot-password
- [x] Passwort-Reset-Seite unter /reset-password?token=xxx (neues Passwort setzen)
- [x] Erfolgs-/Fehlermeldungen und Weiterleitung nach Reset

### Tests
- [x] Vitest: Token-Generierung, Token-Validierung, Passwort-Reset-Flow (80 Tests bestanden)

## Admin-Benutzerverwaltung

### Backend
- [x] tRPC-Prozedur: Alle Benutzer mit Mitgliedschaften auflisten (adminUsers.list)
- [x] tRPC-Prozedur: Passwort eines Benutzers zurücksetzen (adminUsers.resetPassword)
- [x] tRPC-Prozedur: Benutzer löschen (adminUsers.delete)
- [x] tRPC-Prozedur: Neuen Benutzer anlegen (adminUsers.create)
- [x] tRPC-Prozedur: Passwort für OAuth-Benutzer setzen (adminUsers.setPassword)
- [x] DB-Helper: listAllUsersWithMemberships, deleteUser, adminResetUserPassword, setUserPassword

### Frontend
- [x] Admin-Benutzerverwaltungsseite unter /admin/users
- [x] Tabelle mit allen Benutzern (Name, E-Mail, Login-Methode, Rolle, Organisation/Sparte, letzter Login, erstellt)
- [x] Aktionen: Passwort zurücksetzen, Benutzer löschen, Passwort setzen für OAuth-User
- [x] Navigation: Link zur Benutzerverwaltung im Admin-Header ("Benutzer" Button)

### Tests
- [x] Vitest: Admin-User-Endpunkte Berechtigungsprüfung (85 Tests bestanden)

## Hauptverantwortlicher: Lokales Login

- [x] Hauptverantwortlicher kann sich per E-Mail + Passwort anmelden (lokales Login funktioniert für alle Rollen)
- [x] Admin kann im Benutzerverwaltung Hauptverantwortliche mit E-Mail + Passwort anlegen (adminUsers.create)
- [x] Login-Seite: OAuth-Button entfernt (alle nutzen jetzt E-Mail + Passwort)
- [x] Bestehende OAuth-Benutzer: Passwort nachträglich setzen können (adminUsers.setPassword)

## Inline-Bearbeitung in Benutzerverwaltung

### Backend
- [x] tRPC-Prozedur: adminUsers.update (Name und E-Mail eines Benutzers ändern)
- [x] DB-Helper: updateUserInfo (Name, E-Mail aktualisieren mit Duplikat-Prüfung)

### Frontend
- [x] Inline-Editing: Klick auf Name/E-Mail macht Feld editierbar (EditableCell-Komponente)
- [x] Speichern per Enter oder Blur, Abbrechen per Escape
- [x] Validierung: E-Mail-Format prüfen, leere Namen verhindern
- [x] Erfolgs-/Fehlermeldung nach Speichern (Toast: "Benutzer aktualisiert")

### Tests
- [x] Vitest: adminUsers.update Berechtigungsprüfung (88 Tests bestanden)

## CSV-Export Benutzerliste

- [x] CSV-Export-Button im Header der Benutzerverwaltung
- [x] CSV-Generierung im Frontend aus vorhandenen Daten (Name, E-Mail, Login-Methode, Rollen, Organisation/Sparte, Letzter Login, Erstellt)
- [x] CSV-Download als Datei mit deutschem Datumsformat und Semikolon-Trennung (Excel-kompatibel, UTF-8 BOM)

## Bugfixes: Spartenleiter

- [x] Bug: Spartenleiter kann keine Trainer einladen (requireDepartmentLead prüft jetzt alle Mitgliedschaften via getAllMembershipsByUserAndOrg)
- [x] Bug: Konfigurator zeigt für Spartenleiter nicht richtig an (requireOrgMember gibt jetzt höchste Rolle zurück)
- [x] Bug: Duplikat-Prüfung bei addTrainer/addDepartmentLead erlaubt jetzt User mit anderen Rollen in gleicher Org

## Selbstregistrierung mit Rollen-Auswahl

### Backend
- [x] POST /api/auth/register - Selbstregistrierung mit Rollen-Auswahl
- [x] Rolle "verein": Erstellt Organisation + User als Owner
- [x] Rolle "sparte": Erstellt User als Spartenleiter (erstellt Org + Abteilung)
- [x] Rolle "trainer": Erstellt User als Trainer einer Mannschaft (erstellt Org + Abteilung + Team)
### Frontend
- [x] Registrierungs-Seite unter /register mit Rollen-Auswahl (3 Karten: Verein, Sparte, Trainer)
- [x] Formular je nach Rolle: Name, E-Mail, Passwort + rollenspezifische Felder (Vereinsname, Spartenname, Mannschaftsname)
- [x] Link von Login-Seite zur Registrierung und umgekehrt

### Berechtigungen
- [x] Spartenleiter: Logo-Berechtigung hinzugefügt (requireOrgOwnerOrDeptLead für orgLogo.upload/update/delete)
- [x] Trainer: Volle Konfigurator-Berechtigungen (alle Felder editierbar, nur Vereinsname/Logo gesperrt via isZoneLocked)

## Spartenleiter-Dashboard

- [x] Dedizierte Dashboard-Seite für Spartenleiter unter /dept-dashboard
- [x] Logo-Upload-Bereich: Logos für die Organisation hochladen/verwalten
- [x] Schriftarten-Freigabe: Schriftarten für die Abteilung verwalten
- [x] Trainer-Verwaltung: Trainer einladen, auflisten, entfernen
- [x] Navigation: Spartenleiter wird nach Login zu /dept-dashboard weitergeleitet
- [x] Übersichtliche Karten-Ansicht mit allen Verwaltungsbereichen

## Bugfixes: Spartenleiter-Dashboard

- [x] Bug: Spartenleiter kann keine Trainer einladen (Fehler beim Einladen) - war ein Problem der deployed Version, nicht des Codes
- [x] Bug: Logo wird im Spartenleiter-Dashboard nicht angezeigt - storageProxy geändert: Bild wird jetzt direkt gestreamt statt 307-Redirect

## Trainer-Dashboard

- [x] Datenbank-Schema: teams-Tabelle (Name, Abteilung, Trainer-Zuordnung)
- [x] Datenbank-Schema: players-Tabelle (Name, Trikotnummer, Mannschaft-Zuordnung)
- [x] Backend: CRUD-Prozeduren für Mannschaften (erstellen, bearbeiten, löschen, auflisten)
- [x] Backend: CRUD-Prozeduren für Spieler (erstellen, bearbeiten, löschen, auflisten)
- [x] Backend: Berechtigungsprüfung - nur zugewiesene Trainer dürfen ihre Mannschaften verwalten
- [x] Frontend: Trainer-Dashboard-Seite unter /trainer/:orgId/:deptId
- [x] Frontend: Mannschafts-Übersicht mit Erstellen/Bearbeiten/Löschen
- [x] Frontend: Spieler-Liste pro Mannschaft mit Erstellen/Bearbeiten/Löschen
- [x] Frontend: Spieler-Details (Name, Trikotnummer, Position)
- [x] Routing: Login-Weiterleitung für Trainer-Rolle zu /trainer/:orgId/:deptId
- [x] Tests: Vitest-Tests für Mannschafts- und Spieler-Prozeduren (88 Tests bestehen)

## Abrechnung im Trainer-Dashboard

### Zahlungsmodell 1: Verein zahlt
- [x] DB: payment_type Feld pro Mannschaft (club, sponsor, self)
- [x] DB: payment_confirmations Tabelle (teamId, type, status, token, confirmedAt)
- [x] Backend: Prozedur zum Setzen des Zahlungstyps "Verein zahlt"
- [x] Backend: Bestätigungslink generieren (Token-basiert, zum Kopieren/Teilen)
- [x] Backend: Bestätigungs-Endpunkt für Spartenleiter (Token-basiert)
- [x] Backend: Status auf "bestätigt" setzen bei Klick auf Bestätigungslink
- [x] Frontend: Auswahl "Verein zahlt" im Abrechnungs-Bereich
- [x] Frontend: Status-Anzeige (ausstehend/bestätigt) im Dashboard

### Zahlungsmodell 2: Sponsor zahlt
- [x] DB: sponsors Tabelle (id, teamId, name, firma, email, telefon, adresse, status, token)
- [x] Backend: CRUD-Prozeduren für Sponsoren-Daten
- [x] Backend: Bestätigungslink generieren (Token-basiert, zum Kopieren/Teilen)
- [x] Backend: Bestätigungs-Endpunkt für Sponsor (Token-basiert)
- [x] Backend: Status auf "freigegeben" setzen bei Sponsor-Bestätigung
- [x] Frontend: Sponsor-Formular mit allen relevanten Feldern (Name, Firma, E-Mail, Telefon, Adresse)
- [x] Frontend: Status-Anzeige (ausstehend/freigegeben) im Dashboard

### Zahlungsmodell 3: Selbstzahler
- [x] DB: player_payments Tabelle (playerId, teamId, paid, paidAt)
- [x] Backend: Prozedur zum Markieren einzelner Spieler/Trainer als "bezahlt"
- [x] Frontend: Bezahlt-Switch pro Spieler in der Spielerliste
- [x] Frontend: Übersicht wer bezahlt hat und wer noch aussteht (z.B. 1/1 bezahlt)

## Trainer-Dashboard: Logik selbstregistriert vs. eingeladen

- [x] Backend: Feld/Logik um zu erkennen ob Trainer selbstregistriert oder eingeladen ist (org.ownerId === user.id)
- [x] Backend: API-Endpunkt der den Trainer-Typ zurückgibt (org.getById liefert ownerId)
- [x] Backend: Selbstregistrierte Trainer: volle Rechte inkl. Logo-Upload (requireOrgOwnerOrDeptLead erweitert)
- [x] Backend: Eingeladene Trainer: Logo automatisch vom Spartenleiter übernommen, kein eigener Upload
- [x] Frontend: Trainer-Dashboard zeigt Logo-Upload nur für selbstregistrierte Trainer (TrainerLogoSection)
- [x] Frontend: Eingeladene Trainer sehen das Logo des Spartenleiter read-only (InvitedTrainerLogoDisplay)
- [x] Frontend: Hinweistext für eingeladene Trainer dass Logo vom Spartenleiter verwaltet wird

## Konfigurator-Integration: Logo automatisch vorauswählen

- [x] Backend: API-Endpunkt der das Standard-Logo der Organisation zurückgibt (orgLogo.getDefault)
- [x] Frontend: Konfigurator lädt beim Öffnen automatisch das Standard-Logo der Organisation
- [x] Frontend: Logo wird auf dem Trikot-Design vorplatziert wenn verfügbar (Auto-Zuweisung in Logo-Zonen)

## Selbstregistrierung testen

- [x] Test: Neuen Trainer über Registrierungsseite anlegen (eigen.trainer@test.com -> /trainer/180002/180002)
- [x] Test: Prüfen ob selbstregistrierter Trainer volle Logo-Upload-Rechte hat (Logo-Upload-Button sichtbar)
- [x] Test: Eingeladener Trainer sieht Logo read-only ("Das Logo wird vom Spartenleiter verwaltet")

## Konfigurator-Vorschau: Kompletter Durchlauf

- [x] Test: Als Trainer einloggen und Mannschaft öffnen
- [x] Test: "Zum Konfigurator"-Link klicken und prüfen ob Logo automatisch geladen wird
- [x] Test: Spielernamen und -nummern auf dem Trikot platzieren
- [x] Test: Trikot-Design exportieren/speichern

## Bestellübersicht für Spartenleiter

- [x] Backend: Prozedur die alle Mannschaften der Abteilung mit Zahlungsstatus zusammenfasst
- [x] Backend: Bestellfortschritt pro Mannschaft (konfiguriert/nicht konfiguriert, bezahlt/offen)
- [x] Frontend: Neue Seite/Bereich im Spartenleiter-Dashboard mit Bestellübersicht
- [x] Frontend: Tabelle mit Mannschaft, Trainer, Zahlungsmodell, Status, Fortschritt
- [x] Frontend: Filter/Sortierung nach Status (offen/bestätigt/abgeschlossen)

## Kommentarfunktion in Bestellübersicht

### DB-Schema
- [x] Kommentare-Tabelle (order_comments): id, teamId, userId, userName, userRole, message, createdAt
- [x] Migration ausführen (pnpm db:push)

### Backend
- [x] DB-Helper: createOrderComment, listOrderCommentsByTeam, countOrderCommentsByTeams
- [x] tRPC-Prozedur: orderComment.create (Spartenleiter + Trainer dürfen kommentieren)
- [x] tRPC-Prozedur: orderComment.listByTeam (Kommentare einer Mannschaft laden)
- [x] tRPC-Prozedur: orderComment.countByTeams (Kommentar-Anzahl pro Mannschaft)
- [x] Berechtigungsprüfung: Nur Spartenleiter der Abteilung und Trainer der Mannschaft dürfen kommentieren/lesen

### Frontend
- [x] Detailansicht pro Mannschaft in der Bestellübersicht (Klick auf Zeile öffnet Details)
- [x] Kommentar-Thread mit Nachrichten (Name, Rolle, Zeitstempel, Text)
- [x] Kommentar-Eingabefeld mit Senden-Button (Enter zum Senden)
- [x] Visuelle Unterscheidung zwischen Spartenleiter- und Trainer-Kommentaren (Indigo vs. Emerald, rechts vs. links)
- [x] Kommentar-Anzahl-Badge in der Bestellübersicht-Tabelle
- [x] Zurück-Button zur Übersicht

### Tests
- [x] Vitest: Kommentar-CRUD und Berechtigungsprüfung (94 Tests bestanden)

## Lesebestätigungen für Kommentare

### DB-Schema
- [x] commentReadReceipts-Tabelle: id, teamId, userId, lastReadAt, createdAt, updatedAt
- [x] Migration ausführen (pnpm db:push)

### Backend
- [x] DB-Helper: markCommentsAsRead (Upsert), getReadReceiptsByTeam, getUnreadCommentCounts, getOtherUserReadReceipt
- [x] tRPC-Prozedur: orderComment.markAsRead (beim Öffnen des Threads aufrufen)
- [x] tRPC-Prozedur: orderComment.getUnreadCounts (ungelesene Kommentare pro Team zählen)
- [x] tRPC-Prozedur: orderComment.getReadReceipt (Lesebestätigung des Gegenübers)
- [x] Logik: Vergleich lastReadAt mit createdAt der neuesten Kommentare anderer User

### Frontend
- [x] Kommentar-Thread: Automatisch als gelesen markieren beim Öffnen (markAsRead aufrufen)
- [x] Bestellübersicht: Ungelesen-Badge neben Kommentar-Anzahl (z.B. "3 neu", blau pulsierend)
- [x] Kommentar-Thread: Lesebestätigung unter letzter gelesener Nachricht (Doppelhaken + "Gelesen" mit Zeitstempel)
- [x] Automatisches Refetching: Unread-Counts alle 30s, Kommentare alle 15s

### Tests
- [x] Vitest: markAsRead, getUnreadCounts, getReadReceipt, Berechtigungsprüfung (103 Tests bestanden)

### Kommentarfunktion im Trainer-Dashboard
### Frontend
- [x] Trainer-Dashboard Team-Detailansicht: Kommentar-Thread integrieren (OrderCommentThread wiederverwendet)
- [x] Trainer sieht Nachrichten vom Spartenleiter und kann antworten
- [x] Ungelesen-Badge im Trainer-Dashboard bei neuen Nachrichten (blau pulsierend + Hinweisbox)
- [x] Automatisches markAsRead beim Öffnen des Threads
- [x] 103 Tests bestanden

## Bug: Admin-Button fehlt auf der Seite
- [x] Admin-Button in der Navigation wiederherstellt (User 'asse' auf role 'admin' gesetzt)
- [x] ensureAdminExists() Startup-Logik hinzugefügt (promoted ältesten User wenn kein Admin existiert)

## Speichern-Funktion im Konfigurator + Logo-Fix
- [x] DB-Schema: savedDesigns-Tabelle (id, name, teamId, productId, userId, zonesConfig JSON, createdAt, updatedAt)
- [x] DB-Migration ausführen
- [x] Backend: DB-Helper (createSavedDesign, listSavedDesigns, getSavedDesign, updateSavedDesign, deleteSavedDesign)
- [x] Backend: tRPC-Prozeduren (save, list, get, update, delete)
- [x] Frontend: Speichern-Button im Konfigurator mit Dialog für Design-Name
- [x] Frontend: Laden-Button im Konfigurator mit Liste gespeicherter Designs
- [x] Frontend: Überschreiben-Option für bestehende Designs
- [x] Logo-Anzeige: Funktioniert auf Dev-Server korrekt, auf deployed Seite nach Publish sichtbar

## Testverein TSV Musterstadt 1920

- [x] Testverein erstellt: TSV Musterstadt 1920 mit 4 Sparten (Basketball, Fußball, Handball, Volleyball)
- [x] Je 4 Mannschaften pro Sparte mit je 1 Trainer und 15 Spielern (240 Spieler total)
- [x] Owner-Login getestet (owner@tsv-musterstadt.de → /org/240001)
- [x] Spartenleiter-Login getestet (spartenleiter.volleyball@tsv-musterstadt.de → /dept-dashboard)
- [x] Trainer-Login getestet (trainer.volleyball.1@tsv-musterstadt.de → /trainer/240001/240001)
- [x] Konfigurator-Test: Spieler automatisch geladen, Vereinsname gesperrt, Logo-Zone gesperrt
- [x] Bestellübersicht: 4 Mannschaften mit je 15 Spielern, Filter und Sortierung funktionieren
- [x] Seed-Scripts aufgeräumt (seed-testverein.mjs, describe-users.mjs, check-logos.mjs gelöscht)

## Live-Test: Logo-Upload und Kommentarfunktion

- [x] Logo als Spartenleiter hochladen und im Konfigurator als Trainer verifizieren
- [x] Kommentar als Spartenleiter schreiben und Unread-Badge beim Trainer prüfen
- [x] Deployment auf Live-URL aktualisieren

## Schriftarten-Freigabe, Zahlungsmodell und neue Produkte

- [x] Schriftarten als Spartenleiter freigeben (Roboto + Bebas Neue) und im Konfigurator beim Trainer verifiziert
- [x] Zahlungsmodell-Workflow: Trainer wählt "Verein zahlt", Spartenleiter bestätigt
- [x] Weitere Produkte im Admin-Bereich anlegen (Hoodie, Jacke, T-Shirt) und im Konfigurator getestet

## Produktbilder und Bestellprozess E2E

- [x] Produktbilder für Hoodie generieren (Vorderseite, Rückseite)
- [x] Produktbilder für Jacke generieren (Vorderseite, Rückseite, Ärmel Links, Ärmel Rechts)
- [x] Produktbilder für T-Shirt generieren (Vorderseite, Rückseite)
- [x] Bilder als Part-Grafiken hochladen und in DB zuweisen
- [x] Produkte im Konfigurator mit neuen Bildern verifizieren
- [x] Bestellprozess E2E: Trainer konfiguriert Trikot mit Spielerdaten (Sparkasse Sponsor, Tom Braun #1)
- [x] Bestellprozess E2E: Trainer exportiert als PNG (244KB), Design als 'Heimtrikot 2026' gespeichert
- [x] Bestellprozess E2E: Spartenleiter sieht 4 Mannschaften mit Status (1. Herren: Bestätigt, Rest: Offen)

## Bestellstatus-Workflow erweitern

- [x] DB-Schema: orderStatus-Feld an teams-Tabelle erweitern (offen → bestellt → in_produktion → geliefert)
- [x] Backend: tRPC-Router für Statusänderung (nur Spartenleiter darf Status ändern)
- [x] Frontend: Status-Badges und Statusänderungs-Buttons im Spartenleiter-Dashboard
- [x] Frontend: Status-Timeline/Fortschrittsanzeige pro Mannschaft
- [x] Workflow testen: Status von Offen → Bestellt → In Produktion → Geliefert durchspielen

## Farbanpassung Sublimations-Konfigurator testen

- [x] Sublimations-Trikot im Konfigurator öffnen und verschiedene Farbkombinationen testen
- [x] Farbänderungen in der Vorschau und im Export verifizieren (Blau + Rot getestet, alle Parts ändern sich in Echtzeit)

## Größentabelle pro Spieler

- [x] DB-Schema: size-Feld an players-Tabelle (S/M/L/XL/XXL, nullable)
- [x] Backend: DB-Helpers und tRPC-Router für Größe erweitern (player.update inkl. size)
- [x] Frontend: Größenauswahl im Trainer-Dashboard (Spielerliste + Spieler bearbeiten)
- [x] Frontend: Größe im Konfigurator-Mannschafts-Tab anzeigen
- [x] Frontend: Größenübersicht in der Spartenleiter-Bestellübersicht (Zusammenfassung pro Mannschaft)
- [x] Tests aktualisieren (103 Tests bestanden)

## Bundesland, Spielklasse, Kategorie und Landesverband-Regeln

- [x] Recherche: Trikotnummern-Regeln der deutschen Landesverbände (Nummerngröße, Platzierung, Schrift)
- [x] Regeln-Datei erstellt: shared/jerseyRules.ts mit allen Sportart-Vorgaben
- [x] DB-Schema: Bundesland-Feld (state) + Sportart (sport) an organizations-Tabelle hinzugefügt
- [x] DB-Schema: Spielklasse-Feld (league) und Kategorie-Feld (category) an teams-Tabelle hinzugefügt
- [x] Backend: createOrganization und updateOrganization um Bundesland + Sportart erweitert
- [x] Backend: createTeam und updateTeam um Spielklasse und Kategorie erweitert
- [x] Frontend: Bundesland-Dropdown bei Verein-Erstellung und -Bearbeitung
- [x] Frontend: Spielklasse-Input und Kategorie-Dropdown (Damen/Herren/Jugend) bei Mannschaft-Erstellung
- [x] Frontend: Spielklasse und Kategorie in der Mannschaftsliste anzeigen
- [x] Frontend: Konfigurator zeigt Landesverband-Regeln an (Nummerngröße, Hinweise)
- [x] Frontend: Konfigurator validiert Nummerngrößen basierend auf Bundesland-Regeln

## Verifizierung (01.05.2026)

- [x] Größe "L" für Tom Braun zugewiesen und im Trainer-Dashboard inline angezeigt
- [x] Konfigurator Mannschafts-Tab zeigt Größe als Badge (Tom Braun: L)
- [x] Verbandsregeln im Konfigurator: NRW + Volleyball → FIVB-Regeln (Brustnummer mind. 15 cm, Nummernkreis 1-99)
- [x] Alle 103 Tests bestanden
- [x] Temporäre Scripts aufgeräumt (update-org.mjs entfernt)

## Brust Logo → Vereinswappen umbenennen

- [x] DB: Alle Zonen mit name "Brust Logo" in "Vereinswappen" umbenennen (Migration) + neuer purpose "clubLogo"
- [x] Backend: Zone-Label "Vereinswappen" statt "Brust Logo" in Templates und Seed-Daten
- [x] Frontend Konfigurator: "Brust Logo" → "Vereinswappen" in allen Anzeigen
- [x] Frontend Konfigurator: Vereinswappen automatisch vom Owner-Logo befüllen (bei allen Produkten)
- [x] Frontend Konfigurator: Vereinswappen nur vom Owner änderbar (gesperrt für Spartenleiter und Trainer)
- [x] Tests: 103 Tests bestanden, Browser-Verifizierung als Trainer erfolgreich

## Visuelle Vorschau des Vereinswappens im Konfigurator

- [x] Vereinswappen-Thumbnail in der Zonen-Karte anzeigen (wenn Bild vorhanden)
- [x] Vorschau auch im gesperrten Zustand (Trainer/Spartenleiter) sichtbar
- [x] Browser-Verifizierung als Trainer (103 Tests bestanden)

## Zonen-Positionen korrekt setzen (alle Produkte)

- [x] Recherche: Standard-Zonen-Positionen bei Trikots, Hoodies, T-Shirts, Trainingsjacken
- [x] Recherche: Offizielle Verbandsregeln (FIVB, DFB, DHB, DVV, DBB) für Nummern-/Logo-Positionen
- [x] Aktuellen Zustand der Produkte und Zonen in der DB analysieren
- [x] Zonen bei Trikots korrekt setzen (Vereinswappen 10x10cm, Brustnummer 12x15cm, Spielername 30x5cm, Spielernummer 20x25cm, Sponsoren)
- [x] Zonen bei Hoodies korrekt setzen (Spielername + Nummer auf Rückseite verschoben)
- [x] Zonen bei T-Shirts korrekt setzen (Spielername + Nummer auf Rückseite verschoben)
- [x] Zonen bei Trainingsjacken korrekt setzen (fehlende Ärmel-Zone rechts ergänzt)
- [x] Browser-Verifizierung aller 4 Produkte erfolgreich

## Sponsor-Vorlagen (Nächster Schritt 2)

- [x] DB-Schema: sponsor_templates Tabelle (id, orgId, name, logoUrl, storageKey, category, sortOrder, createdBy, createdAt)
- [x] Backend: tRPC-Prozeduren für CRUD von Sponsor-Vorlagen (Owner-only: create, update, delete)
- [x] Backend: tRPC-Prozedur zum Abrufen der Vorlagen für alle Mitglieder (sponsorTemplate.list)
- [x] Frontend: Sponsor-Vorlagen-Verwaltung im Owner-Dashboard (Upload, Benennen, Löschen)
- [x] Frontend: Sponsor-Vorlagen-Auswahl im Konfigurator (Klick setzt Text/Logo in Sponsor-Zonen)
- [x] Tests: 103 Tests bestanden, Browser-Verifizierung: Klick auf "Stadtwerke Musterstadt" setzt Text sofort auf Trikot

## Bugs: Konfigurator Layout (01.05.2026)
- [x] BUG: Mobile Ansicht - Zonen-Positionierung ist falsch (Root Cause: Container aspect-ratio 3:4 ≠ Bild-Ratio 0.738 → Bild bestimmt jetzt Container-Höhe)
- [x] BUG: Desktop/Laptop - Textil-Vorschau nicht sichtbar (Hintergrund #f8f9fa→#e8eaed, Trikotfarbe #d4d4d8→#c8c8cc, drop-shadow)
- [x] Responsive Layout: Canvas sticky auf Desktop, Bild-basierte Höhe statt fester Aspect-Ratio

## 3D-Mockup (nach Abschluss aller anderen Features)
- [x] ~~3D-Mockup aus konfigurierten Dateien~~ (bewusst entfernt – User-Entscheidung: nur KI-Mockup als Vorschau)
- [x] Optionen evaluiert: Three.js, Dynamic Mockups API, VirtualThreads, KI-Bildgenerierung (siehe docs/3d-mockup-analyse.md)

## Drag-and-Drop für Sponsor-Vorlagen
- [x] Sponsor-Vorlagen als draggable Elemente (HTML5 DnD API) in der Seitenleiste (mit GripVertical-Icon + cursor-grab)
- [x] Zonen im Canvas als Drop-Targets mit visueller Hervorhebung (ring-2 ring-primary bei dragOver)
- [x] Drop-Handler: Sponsor-Vorlage wird in die Zone eingesetzt (Text oder Logo)
- [x] Canvas-Fallback: Drop außerhalb einer Zone zeigt Info-Toast
- [x] Touch-Support für Mobile implementiert (touchstart/touchmove/touchend/touchcancel) in CustomerConfigurator + AdminProductEditor
- [x] Browser-Verifizierung: Sponsor-Vorlagen-Buttons mit Tooltip "Auf eine Zone ziehen oder klicken" sichtbar, DnD-Handler implementiert

## DPI-Prüfung bei Bild-Uploads (min. 300 DPI)
- [x] Utility-Funktion erstellt: checkImageDpi() berechnet DPI aus Pixel-Maßen und Druckfläche (cm)
- [x] Integration im Konfigurator: Logo-Upload prüft gegen Zone-cm-Maße, DTF-Markentrikot gegen 30x40cm
- [x] Integration im Owner-Dashboard: Vereinswappen (10x10cm), Sponsor-Vorlagen (26x10cm)
- [x] Fehlermeldung bei < 300 DPI mit Hinweis auf benötigte Mindestauflösung (8s Toast)
- [x] Tests: 103 bestanden, Browser-Verifizierung erfolgreich

## DPI-Prüfung anpassen (3-Stufen)
- [x] Utility-Funktion: unter 250 DPI = Ablehnung (rejected), 250-299 DPI = Warnung (warning), ab 300 DPI = OK
- [x] Alle Upload-Stellen anpassen: Konfigurator (Zone-Upload, DTF-Markentrikot) + OrgDashboard (Vereinswappen, Sponsor-Vorlagen)
- [x] Tests: 103 bestanden

## Upload-Prüfungen: Überdrucken + Transparenzen
- [x] PDF-Prüfung: Overprint-Flags erkennen (OPM, op, OP in ExtGState) → Warnung
- [x] PDF-Prüfung: Transparenz erkennen (ca, CA, SMask, BM in ExtGState) → Warnung
- [x] Bild-Prüfung: Transparenz erkennen (Alpha-Kanal bei PNG/WebP) → Warnung
- [x] PDF als bevorzugtes Upload-Format bei allen Stellen (.pdf zuerst in accept)
- [x] Integration in alle Upload-Stellen (Konfigurator Zone, DTF-Markentrikot, Vereinswappen, Sponsor-Vorlagen)
- [x] Hinweistexte: "PDF bevorzugt" bei allen Upload-Buttons und Bereichen
- [x] Tests: 103 bestanden

## Trikot-Konfiguration speichern und als Vorlage aufrufen
- [x] DB-Schema: saved_designs Tabelle existiert (id, teamId, productId, name, zonesConfig, colorsConfig, userId)
- [x] Backend: tRPC-Prozeduren (save, list, get, update, delete) existieren
- [x] Frontend: Speichern/Laden/Löschen im Konfigurator existiert

### Verbesserung 1: Thumbnail-Vorschau
- [x] DB: thumbnailUrl-Spalte zur saved_designs Tabelle hinzugefügt
- [x] Backend: Thumbnail-URL beim Speichern mitspeichern (Base64 -> S3 Upload)
- [x] Frontend: Canvas-Screenshot als Thumbnail generieren und hochladen (html-to-image)
- [x] Frontend: Thumbnail in der Design-Liste anzeigen (64x64 Vorschau)

### Verbesserung 2: Organisationsweite Vorlagen
- [x] DB: orgId + isOrgTemplate-Flag zur saved_designs Tabelle hinzugefügt
- [x] Backend: Neue Prozedur listOrgTemplates (Designs mit isOrgTemplate=true)
- [x] Backend: Prozedur setOrgTemplate zum Markieren als Org-Vorlage (nur Owner)
- [x] Frontend: Vereinsvorlage-Badge im Design-Laden-Dialog

### Verbesserung 3: Vorlagen-Kategorien
- [x] DB: category-Spalte (heimtrikot, auswaertstrikot, training, sonstiges) als Enum
- [x] Frontend: Kategorie-Auswahl beim Speichern (4 Buttons im Save-Dialog)
- [x] Frontend: Kategorie-Badge im Design-Laden-Dialog

### Verbesserung 4: Duplikation für andere Teams
- [x] Backend: Neue Prozedur duplicate (kopiert Design mit neuem teamId + Name)
- [x] Frontend: Duplizieren-Button im Design-Laden-Dialog mit Name-Eingabe

## Kürzel-Zone (playerInitials) + Trainer-Farbauswahl
### Neuer Zonen-Typ: Kürzel
- [x] DB: 'playerInitials' zur purpose-Enum hinzugefügt (Migration 0019)
- [x] Backend: Zod-Validierung für playerInitials erweitert
- [x] Frontend AdminEditor: playerInitials als Zweck-Typ hinzugefügt (PURPOSE_CONFIG + Vorschau "MM")
- [x] Frontend Konfigurator: Kürzel automatisch aus Mannschaftsliste befüllt (Initialen aus Spielername, max 3)
- [x] Voreingestellte Schrift des Spartenleiters wird für Kürzel verwendet (via Auto-Font-Zuweisung)

### Trainer-Farbauswahl für Text-Zonen
- [x] Frontend Konfigurator: Farbwähler bei Kürzel-Zone (Trainer kann Textfarbe wählen)
- [x] Frontend Konfigurator: Farbwähler bei Spielernamen-Zone
- [x] Frontend Konfigurator: Farbwähler bei Nummer-Zone
- [x] Frontend Konfigurator: Farbwähler bei Vereinsnamen-Zone (nur wenn nicht gesperrt)
- [x] Gewählte Farben in zoneContents.fontColor gespeichert und im Export berücksichtigt

### Bug-Fix
- [x] JSX-Fehler in CustomerConfigurator.tsx behoben (war altes Log-Artefakt)

## Farbauswahl auf CMYK umstellen
- [x] CMYK-Utility: Konvertierungsfunktionen HEX↔CMYK, RGB↔CMYK erstellt (client/src/lib/cmyk.ts)
- [x] CMYK-Farbwähler-Komponente: 4 Slider (C, M, Y, K) mit Vorschau, CMYK-Wert-Anzeige und Druckfarben-Vorlagen
- [x] Trainer-Farbauswahl (Text-Zonen): HEX-Farbwähler durch CMYK-Farbwähler ersetzt (playerName, playerNumber, playerInitials, clubName, custom)
- [x] Trikotteil-Farbauswahl (Sublimation + DTF): CMYK-Farbwähler hinzugefügt, CMYK-Tooltips bei Farbpalette
- [x] CMYK-Werte werden als HEX gespeichert (für Rendering), CMYK-Anzeige bei allen Farbwählern
- [x] Tests: 26 CMYK-Tests + 140 Gesamt-Tests bestanden (9 Testdateien)

## Neue Produkte + Freie Zonen-Logik
### Neue Produkte anlegen
- [x] SVG-Silhouette: Trainingshose (Vorder-/Rückseite)
- [x] SVG-Silhouette: Aufwärmshirt (Vorder-/Rückseite)
- [x] SVG-Silhouette: Zip-Jacke (Vorder-/Rückseite)
- [x] SVG-Silhouette: Half-Zipper (Vorder-/Rückseite)
- [x] SVG-Silhouette: Warme Jacke (Vorder-/Rückseite)
- [x] Textil-Templates in shared/templates.ts registriert (Kategorie "Bekleidung", freeZoneMode=true)
- [x] Produkte über Admin-Oberfläche anlegbar (Templates bei allen Sportarten verfügbar)

### Freie Zonen-Logik (für Nicht-Trikots)
- [x] DB/Schema: freeZoneMode-Flag am Produkt (Migration 0020, Trikots=false, Bekleidung=true)
- [x] Trainer kann eigene Zonen erstellen (freeCreate-Endpunkt, Position/Größe frei wählbar)
- [x] Zonen auf dem Textil per Drag verschiebbar (Maus-Events, Echtzeit-Update)
- [x] Zonen per Resize-Handle (unten rechts) in der Größe änderbar
- [x] Vereinswappen: Immer vorhanden, nicht löschbar (FORBIDDEN), Position frei wählbar
- [x] Alle anderen Zonen: Löschbar per Button (Overlay + Zonen-Karte)

### Toggle für automatisierte Felder
- [x] Kürzel (playerInitials): Toggle-Button ein/aus
- [x] Nummer (playerNumber): Toggle-Button ein/aus
- [x] Spielername (playerName): Toggle-Button ein/aus
- [x] Wenn aktiviert: Zone wird erstellt mit Standard-Größe (freeCreate), Trainer kann Position wählen
- [x] Wenn deaktiviert: Zone wird entfernt (freeDelete)

### CMYK-Checkpoint gespeichert
- [x] Checkpoint für CMYK-Farbauswahl gespeichert (5d0a96dc)
- [x] Tests: 155 Tests bestanden (10 Testdateien, inkl. 15 freeZone-Tests)

## Neues Trikot-Template mit SVG-Silhouetten (nur DTF)
- [x] SVG-Silhouetten für Trikot erstellt (Vorderteil, Rückteil, Ärmel Links, Ärmel Rechts)
- [x] SVGs als statische Assets hochgeladen
- [x] DTF-Templates in shared/templates.ts registriert (4 Sportarten: Fußball, Handball, Volleyball, Basketball)
- [x] Tests: 155 Tests bestanden (10 Testdateien)

## Alle Produkte per Seed-Script in DB anlegen
- [x] Seed-Script erstellt (seed-products.mjs): Alle 17 Templates als Produkte in DB angelegt (mit Zonen, published=true)
- [x] Bestehende Produkte nicht dupliziert (Prüfung auf templateId)
- [x] 929 Test-Produkte bereinigt, 19 veröffentlichte Produkte + 8 Entwürfe verbleibend
- [x] Verifizierung: Alle Produkte in der Produktliste sichtbar

## 3D-Mockup Implementierung + 2D-Trikot entfernen
### 2D-Trikot-Funktion entfernen
- [x] 2D-Trikot-Button und zugehörige Logik aus dem Konfigurator entfernt

### Option 1: Three.js 3D-Mockup im Browser
- [x] Three.js als Dependency installieren (@react-three/fiber, @react-three/drei, three)
- [x] 3D-Trikot-Geometrie erstellen (einfache T-Shirt-Form mit PlaneGeometry)
- [x] Interaktive 3D-Vorschau im Konfigurator (OrbitControls: Rotation, Zoom)
- [x] ~~Texturen auf 3D-Modell projizieren~~ (bewusst entfernt – 3D-Vorschau komplett entfernt)

### Option 2: KI-Bildgenerierung Mockup
- [x] Backend-Prozedur: mockup.generateAi (prompt-basiert, nutzt generateImage)
- [x] Prompt-Template für fotorealistische Trikot-Mockups erstellen (Produktname, Druckverfahren, Farbbeschreibung)
- [x] Frontend: "KI-Mockup generieren" Button mit Ladeanimation und Ergebnis-Anzeige
- [x] "Neu generieren" und "Herunterladen" Buttons nach Generierung

### Option 3: Dynamic Mockups API (Placeholder)
- [x] Frontend: Foto-Mockup Button als Placeholder (ausgegraut, "Demnächst verfügbar")
- [x] ~~Dynamic Mockups API~~ (bewusst zurückgestellt – bei Bedarf)
- [x] ~~API-Backend-Prozedur~~ (bewusst zurückgestellt – bei Bedarf)

## KI-Mockup Ladeanimation verbessern
- [x] Ansprechende Ladeanimation mit Fortschrittsanzeige und informativen Texten während der KI-Mockup-Generierung

## Bug-Fixes: Produktdarstellung, 3D-Ansicht, KI-Mockup
- [x] Neue Produkte werden auf dem Laptop nicht dargestellt (Produktliste/Home) – Template-SVG-Previews als Fallback
- [x] 3D-Ansicht zeigt nur 2 Blätter statt ein T-Shirt-Modell – ExtrudeGeometry mit T-Shirt-Silhouette
- [x] KI-Mockup wird nicht aus der tatsächlichen Vorlage/Design generiert – Canvas-Screenshot als Referenzbild an generateImage gesendet

## Kritische Bugs (deployed Version)
- [x] 3D-Vorschau komplett entfernt (User-Entscheidung: nur KI-Mockup als Vorschau), Three.js Dependencies entfernt
- [x] KI-Mockup funktioniert (protectedProcedure, erfordert Login + Canvas-Screenshot als Referenz)
- [x] Speicher-Button funktioniert (erfordert teamId-Parameter im URL, über Trainer-Dashboard erreichbar)
- [x] "Aus Vorlage wählen" funktioniert (erfordert teamId-Parameter im URL, über Trainer-Dashboard erreichbar)
- [x] Konfigurator-Link im TrainerDashboard auf gültiges Produkt 690035 korrigiert (war 90020)
- [x] Test-Passwörter für alle TSV-Musterstadt-User auf 'Test1234!' gesetzt

## Bugs: Handball DTF Trikot
- [x] Rücken-Sponsor kann ausgewählt werden (war immer da, muss auf Rückteil klicken + scrollen)
- [x] Trikot wird nicht angezeigt – CORS-Fallback hinzugefügt (try/catch bei getImageData, onerror-Handler, zeigt Original-SVG bei CORS-Fehler)
- [x] KI-Mockup: Canvas-Screenshot als Referenzbild funktioniert wenn Trikot-Bild sichtbar ist (CORS-Fix behebt auch dieses Problem)

## Bugs: Deployed Version (Mai 2026)
- [x] Textil nicht erkennbar – CSS-basierte Einfärbung (mix-blend-mode) statt Canvas-Pixel-Manipulation, kein CORS-Problem mehr
- [x] KI-Mockup – funktioniert wenn Trikot-Bild sichtbar ist (Canvas-Screenshot als Referenz)
- [x] Gespeicherte Sponsoren – Bedingung von purpose=="custom" auf purpose=="custom"||"logo" erweitert, Drag-and-Drop ebenfalls

## Bug: Bilder laden nicht auf deployed Version (manus.space)
- [x] SVG-Trikot-Silhouetten werden nicht angezeigt (grauer Kasten statt Trikot-Form)
- [x] Vereinswappen/Logo wird nicht geladen ("?" Platzhalter)
- [x] Ursache: /manus-storage/ Redirect-Problem auf deployed Version
- [x] Fix: Neue /api/storage-proxy/ Route erstellt die CDN-Layer umgeht + storageUrl() Utility im Frontend
- [x] Alle Frontend-Dateien aktualisiert: CustomerConfigurator, Home, AdminProducts, AdminProductEditor, OrgDashboard, TrainerDashboard, DeptDashboard, AiMockupView
- [x] 168 Tests bestanden (11 Testdateien, inkl. storage-proxy.test.ts)

## Bugs: DTF Konfigurator (Produkt 180001 - A Test Trikot)
- [x] Grundfarbe füllt die gesamte Seite statt nur das Trikot (gelbe Farbe überdeckt alles)
  - Fix: Für transparente Bilder (T-Shirt, Hoodie, SVG) → mask-image + multiply Blend
  - Fix: Für opake Bilder (Trikot-PNGs) → Farb-Indikator-Badge statt Overlay
- [x] Rücken-Sponsor kann nicht ausgewählt werden (Trainer-Rolle: trainer.handball.1@tsv-musterstadt.de)
  - Info: Rücken-Sponsor-Zone existiert bereits für Produkt 180001 (Zone 150006)
  - Benutzer muss auf "Rückteil" wechseln um die Zone zu sehen

## Bugs: Fan T-Shirt und Free-Zone-Modus (01.05.2026)
- [x] Fan T-Shirt: Rücken-Sponsor kann nicht hinzugefügt werden
  - Fix: Brust-Sponsor und Rücken-Sponsor Zonen (purpose: custom) in DB hinzugefügt
- [x] Free-Zone-Modus: Zonen per Maus/Touch verschieben funktioniert nicht bei Nicht-Trikot-Produkten
  - Fix: freeZoneMode=true für Hoodie (540001), Jacke (540002), T-Shirt (540003) in DB gesetzt

## Standard-Zonen für Nicht-Trikot-Artikel (Hoodie, Jacke, T-Shirt)
- [x] Neuer Zone-Purpose-Typ "initials" für Spieler-Kürzel (Initialen aus Mannschaftsliste) - bereits als playerInitials im Schema vorhanden
- [x] Kürzel-Zone: Unten links, 8x8 cm, auf Vorderseite aller Nicht-Trikot-Artikel
- [x] Vereinsname-Zone: Immer auf der Rückseite (Jacke-Vereinsname von Vorderseite auf Rückseite verschoben)
- [x] Vereinswappen-Zone: Immer auf der Herzseite (links oben Brust) - T-Shirt Wappen von Mitte auf links verschoben
- [x] Auto-Fill: Spieler-Initialen automatisch aus Mannschaftsliste in Kürzel-Zone eintragen (war bereits implementiert)
- [x] Zonen für alle 3 Produkte (Hoodie 540001, Jacke 540002, T-Shirt 540003) in DB angelegt
- [x] Fehlerhafte verwaiste Zonen (ohne partId) beim T-Shirt bereinigt

## Free-Zone-Modus: Alle Zonen verschiebbar bei Nicht-Trikot-Artikeln
- [x] Alle Zonen (inkl. Vereinswappen) bei Nicht-Trikot-Artikeln per Drag/Touch verschiebbar machen (war bereits korrekt implementiert)
- [x] Vereinswappen: Verschiebbar aber Inhalt (Logo) nicht austauschbar (war bereits korrekt implementiert via isZoneLocked)

## Touch-Support Verbesserungen für Free-Zone-Modus
- [x] Größere Touch-Targets für Zonen (erweiterter unsichtbarer Touch-Bereich)
- [x] Größerer Resize-Handle (20x20px auf Mobile statt 12x12px, plus erweiterter Touch-Bereich)
- [x] Scroll-Verhinderung beim Drag (touch-action: none auf Canvas + select-none)
- [x] Visuelles Feedback beim Drag (shadow-lg, scale-1.02, opacity-90)
- [x] Haptic Feedback bei Drag-Start (navigator.vibrate 15ms)
- [x] Delete-Button größer auf Touch (32x32px statt 20x20px)
- [x] Label-Badge größer auf Touch (10px statt 8px, mehr Padding)
- [x] Auch AdminProductEditor mit Touch-Verbesserungen aktualisiert

## Bug: Touch-Drag ruckelt auf Mobile (Hoodie)
- [x] Touch-Drag Performance optimieren:
  - requestAnimationFrame für flüssige 60fps Updates
  - CSS transition-all während Drag deaktiviert (verhindert Ruckeln)
  - will-change Hint für GPU-Beschleunigung
  - Visuelles Feedback (scale, opacity) über transform statt CSS-Klassen
  - Komplett auf Pointer Events API umgestellt (statt separate Mouse/Touch Events)
  - setPointerCapture für zuverlässiges Tracking auch außerhalb des Elements
  - touch-action: none direkt auf jeder Zone (nicht nur Canvas)
  - Drag-State in useRef für sofortigen Zugriff ohne Re-Render-Delay
  - Koordinaten-Caching synchron (nicht in rAF) für präzise Positionierung

## Visuelle Hervorhebung beim Touch-Drag
- [x] Visuelles Highlight auf aktiv verschobener Zone (Ring/Glow, Scale, Shadow)
- [x] Subtile Puls-Animation auf dem Label-Badge während des Drags
- [x] Auch im AdminProductEditor konsistent umsetzen

## KI-Mockup Fix & Speichern-Funktion
- [x] KI-Mockup: Canvas-Screenshot des konfigurierten Produkts als Referenzbild für die KI-Generierung verwenden (statt generischem Prompt)
- [x] KI-Mockup: Funktioniert auch für Hoodie, Jacke, T-Shirt (nicht nur Trikots)
- [x] Speichern-Button: Konfiguriertes Produkt (Hoodie etc.) als Bild speichern/herunterladen
- [x] Speichern-Button: KI-Mockup als Bild speichern/herunterladen

## KI-Mockup Erweiterungen
- [x] Screenshot aus der Gesamtübersicht (Overview) nehmen statt nur vom aktuellen Einzelteil
- [x] Rückseite-Mockup-Modus ergänzen (Vorder- und Rückseite separat generieren)
- [x] Mockup-Galerie im Trainer-Dashboard (generierte Mockups speichern und vergleichen)
- [x] Mockups versenden können (per Link teilen / E-Mail)

## Mannschaft bei allen Textilien anzeigen
- [x] Mannschafts-Panel (Spielerliste, Spieler-Navigation) auch bei freeZoneMode-Produkten (war bereits implementiert)
- [x] Automatische Befüllung von Spielername/Nummer-Zonen auch bei Nicht-Trikot-Produkten (war bereits implementiert)

## Mockup-Vergleichsansicht & PDF-Export
- [x] Vergleichsansicht: Zwei Mockups nebeneinander auswählen und vergleichen
- [x] Vergleichsansicht: Unterschiede visuell hervorheben (Titel, Seite, Datum)
- [x] PDF-Export: Galerie als PDF für Vereins-Präsentationen exportieren
- [x] PDF-Export: Mockup-Bilder, Titel, Datum und Team-Info im PDF

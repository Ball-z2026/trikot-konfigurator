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

# Konzept: Patch-Maker – B2B-Portal (Siebdruck-Transfers & DTF)

> Status: Entwurf · Erstellt: 2026-07-28 · Branch: `claude/new-page-concept-u4qn6r`
> Marke: **Patch-Maker** · Ziel-Domain: **patch-maker.de** (wird die neue Homepage;
> dort liegt aktuell noch eine Platzhalter-/andere Seite)

## 1. Ziel & Kurzbeschreibung

Ein **eigenständiges B2B-Portal**, über das Geschäftskunden (Textiler, Werbetechniker,
Vereinsausstatter, Wiederverkäufer) **Patches** bestellen können – konkret:

- **Siebdruck-Transfers** (Spot-/Sonderfarben, meist Vektordaten)
- **DTF-Transfers** (Digital-Film-Transfer, Vollfarbe)

Kernanforderung: Kunden laden ihre **Druckdaten** hoch, das Portal berechnet einen
**Sofortpreis**, und die Bestellung wird direkt **online bezahlt**. Mehrere Motive pro
Bestellung sind möglich, hochgeladene Daten durchlaufen eine **automatische Datenprüfung
(Preflight)**.

Das Portal ist **klar vom bestehenden Vereins-Trikot-Konfigurator getrennt** (eigener
Login-/Kundenbereich), nutzt aber technisch die vorhandene Infrastruktur (Datenbank,
S3-Storage, tRPC, UI-Komponenten) mit.

Die Marke tritt als **Patch-Maker** unter der Domain **patch-maker.de** auf. Diese Domain
soll die künftige öffentliche Homepage des Portals werden (aktuell liegt dort noch eine
andere/Platzhalter-Seite). Das Branding (Logo, Farben, Wording) läuft eigenständig unter
Patch-Maker – losgelöst vom Vereins-Konfigurator.

---

## 2. Zielgruppe & Rollen

| Rolle | Beschreibung | Rechte |
|-------|--------------|--------|
| **B2B-Kunde (Besteller)** | Registrierter Geschäftskunde | Motive/Bestellungen anlegen, Daten hochladen, bezahlen, Bestellhistorie & Nachbestellung |
| **B2B-Team-Mitglied** *(optional, Phase 2)* | Weiterer Nutzer unter demselben Kundenkonto | Bestellungen im Firmenkontext sehen/anlegen |
| **Produktions-/Admin-Mitarbeiter** | Interner Mitarbeiter | Alle Bestellungen sehen, Status setzen, Druckdaten prüfen/ablehnen, Preise/Staffeln pflegen |

Bestehende `users.role`-Enum ist `["user", "admin"]`. Für das B2B-Portal wird eine
**separate Kundenentität** empfohlen (siehe Datenmodell), damit B2B-Konten nicht mit den
Vereins-Usern vermischt werden. Alternativ Erweiterung der Rollen-Enum um `b2b_customer`.

---

## 3. Abgrenzung zum bestehenden Konfigurator

| Aspekt | Vereins-Konfigurator (bestehend) | B2B-Patch-Portal (neu) |
|--------|----------------------------------|------------------------|
| Zielgruppe | Vereine/Sparten/Trainer | Geschäftskunden |
| Produkt | Komplettes Trikot konfigurieren | Patches nach Druckdaten |
| Einstieg | `/` bzw. `/konfigurator` | `/b2b` (eigener Bereich) |
| Login | Vereins-User | Eigener B2B-Login |
| Bezahlung | Beitrags-/Sponsorenmodell (Token) | Echte Online-Zahlung (Sofortpreis) |
| Upload | Bilder (Logos), max. 10 MB | Druckdaten (Vektor), große Dateien via S3-Presign |

---

## 4. Funktionaler Umfang (Scope)

### 4.1 MVP (Phase 1)

1. **B2B-Landing/Registrierung**
   - Öffentliche Info-Seite (Techniken, Ablauf, Datenanforderungen)
   - Registrierung als Geschäftskunde (Firmenname, USt-IdNr., Adresse, Ansprechpartner)
   - Login (nutzt vorhandene `localAuth`-Mechanik)

2. **Bestellung anlegen (Konfigurator light)**
   - Technik wählen: *Siebdruck-Transfer* oder *DTF*
   - Pro Motiv: Datei-Upload, Größe (Breite × Höhe in mm bzw. cm), Menge, ggf. Farbanzahl (Siebdruck)
   - **Mehrere Motive** in einem Warenkorb / einer Bestellung
   - Live-**Sofortpreis** je Motiv + Gesamtsumme

3. **Datei-Upload + Preflight**
   - Formate: **PDF, AI, EPS, SVG** (Vektor). *(DTF ist technisch Vollfarbe – Empfehlung: PNG/TIFF ergänzen, siehe Offene Punkte)*
   - Große Dateien über **S3-Presigned-URL** (nicht über den bestehenden 10-MB-Base64-Endpoint)
   - **Automatische Datenprüfung** mit Ampel-Feedback (siehe Abschnitt 6)

4. **Checkout & Online-Zahlung**
   - Rechnungs-/Lieferadresse
   - Zahlungsanbieter (Stripe empfohlen – siehe Abschnitt 7)
   - Bestellbestätigung + Beleg (PDF)

5. **Bestellhistorie & Nachbestellung**
   - Liste eigener Bestellungen mit Status
   - „Nachbestellen" (gleiche Motive/Daten, neue Menge)

6. **Interne Bestellverwaltung (Admin)**
   - Eingehende Bestellungen, Status-Workflow, Zugriff auf Druckdaten
   - Druckdaten-Freigabe / Ablehnung mit Kommentar

### 4.2 Später (Phase 2+)

- Team-Accounts (mehrere Nutzer pro Firma), Rollen im Kundenkonto
- Individuelle Preislisten / Rabattstaffeln pro Kunde
- Zahlung **auf Rechnung** für geprüfte Bestandskunden
- Reklamations-/Nachdruck-Workflow
- API/CSV-Massenupload für Wiederverkäufer

---

## 5. Seitenstruktur & Routing

Neuer, abgegrenzter Bereich unter `/b2b`. Umsetzung mit `wouter` analog zu `App.tsx`.

```
/b2b                         → B2B-Landingpage (öffentlich)
/b2b/login                   → B2B-Login
/b2b/register                → B2B-Registrierung (Firmendaten)
/b2b/bestellen               → Konfigurator: Technik + Motive + Upload + Sofortpreis
/b2b/warenkorb               → Warenkorb / Zusammenfassung
/b2b/checkout                → Adresse + Zahlung
/b2b/checkout/success/:id    → Bestellbestätigung
/b2b/konto                   → Kundenkonto: Stammdaten
/b2b/konto/bestellungen      → Bestellhistorie
/b2b/konto/bestellungen/:id  → Bestelldetail + Nachbestellung
/b2b/admin/bestellungen      → (Admin) Bestellverwaltung
```

Empfehlung: Eigenes Layout `B2BLayout.tsx` (getrennte Navigation/Branding vom
Vereins-Dashboard), damit die Trennung auch visuell klar ist.

---

## 6. Datei-Upload & automatische Datenprüfung (Preflight)

### 6.1 Upload-Architektur

Der bestehende Endpoint `POST /api/upload` (`server/uploadRoute.ts`) nimmt Base64 an und
limitiert auf **10 MB** und **nur Bildformate**. Für druckfähige Vektordaten (oft >10 MB,
Formate PDF/AI/EPS) ist das ungeeignet. Deshalb:

- **Direkter S3-Upload über Presigned-URL** (`@aws-sdk/s3-request-presigner` ist bereits
  installiert). Flow:
  1. Client fordert Presigned-PUT-URL an (`b2bUpload.getPresignedUrl`, tRPC)
  2. Client lädt Datei **direkt zu S3** hoch (kein Server-Roundtrip, kein Base64)
  3. Client meldet fertigen Key zurück → Server startet Preflight
- Neuer Storage-Prefix, z. B. `b2b/print-data/{orderId}/{motifId}-{filename}`
- Erlaubte Formate (MVP): `application/pdf`, `application/postscript` (AI/EPS),
  `image/svg+xml`. Größenlimit z. B. **100 MB** (konfigurierbar).

### 6.2 Automatische Datenprüfung (Preflight)

Ziel: dem Kunden **vor dem Absenden** Warnungen zeigen und Nacharbeit reduzieren.
Ausgabe als **Ampel** (grün = ok, gelb = Warnung, rot = Blocker).

| Prüfung | Technik | Bibliothek (bereits vorhanden) |
|---------|---------|-------------------------------|
| Datei lesbar / nicht beschädigt | PDF/SVG parsen | `pdfjs-dist`, `pdfkit` |
| Seiten-/Motivgröße vs. angegebene Maße | Bounding-Box auslesen | `pdfjs-dist`, `sharp` |
| Auflösung (bei eingebetteten Pixeln / DTF) | DPI ≥ 300 prüfen | `sharp` |
| Farbmodus (CMYK für Siebdruck) | Farbraum erkennen | `sharp` |
| Transparenter Hintergrund (Freisteller) | Alphakanal prüfen | `sharp` |
| Farbanzahl (Siebdruck: Spot-Farben zählen) | Vektor-Farben analysieren | eigener Parser / `pdfjs-dist` |
| Mindestgröße / Sicherheitsabstand | Geometrie | eigene Logik |

Ergebnis wird an der Motiv-Zeile gespeichert (z. B. `preflightStatus`, `preflightReport`
als JSON). Rote Blocker verhindern den Checkout; gelbe Warnungen erfordern ein bewusstes
„Trotzdem so beauftragen".

> Hinweis: Bei DTF ist eine **Vorschau/Freisteller-Prüfung** besonders wichtig. Die bereits
> vorhandene `photoroom`-Integration (`server/photoroom.ts`, Hintergrundentfernung) kann für
> eine Freisteller-Vorschau wiederverwendet werden.

---

## 7. Preisberechnung & Online-Zahlung

### 7.1 Sofortpreis

Preis wird clientseitig live angezeigt und **serverseitig verbindlich nachgerechnet**
(nie dem Client-Preis vertrauen).

Preisparameter (konfigurierbar in einer Preistabelle):

- **Technik** (Siebdruck vs. DTF) – eigene Grundpreise
- **Fläche** (Breite × Höhe) bzw. Größenklassen
- **Menge / Mengenstaffel** (Stückpreis sinkt mit Menge)
- **Siebdruck:** Anzahl Farben (pro Farbe Aufschlag / Klischeekosten)
- **Optionen:** Sonderfarben, Metallic/Neon, Veredelung (Phase 2)
- **Einrichtekosten** pro Motiv (einmalig)

Preisformel (vereinfachtes Beispiel):

```
motivPreis = (grundpreisProCm2[technik] × flaecheCm2 × mengenfaktor(menge))
           + farbaufschlag(anzahlFarben)        // nur Siebdruck
           + einrichtekosten[technik]
gesamt = summe(motivPreise) + versand − rabatte + MwSt
```

Preise/Staffeln liegen in der DB (`patch_price_rules`) und sind im Admin pflegbar.

### 7.2 Zahlung

**Es ist noch kein echter Payment-Provider integriert.** Die vorhandenen `teamPayments`/
`playerPayments` sind nur Status-/Token-Bestätigungen für Vereinsbeiträge – **keine echte
Zahlungsabwicklung**.

Empfehlung für Online-Zahlung:

- **Stripe** (Checkout Session oder Payment Intents) – gute B2B-Unterstützung, SEPA,
  Kreditkarte, ggf. Rechnung/Klarna. Neue Abhängigkeit `stripe` erforderlich.
- Alternative: **Mollie** (im DACH-Raum verbreitet, SEPA/Sofort).

Flow (Stripe Checkout Session):

1. `checkout.create` (tRPC) berechnet Preis serverseitig, legt Bestellung `status = pending_payment` an
2. Erzeugt Stripe-Checkout-Session, gibt Redirect-URL zurück
3. Kunde zahlt bei Stripe, kommt auf `/b2b/checkout/success/:id` zurück
4. **Webhook** `POST /api/b2b/stripe/webhook` bestätigt Zahlung → `status = paid` → Produktion
5. Beleg-PDF via `pdfkit`/`jspdf` (bereits vorhanden) generieren

---

## 8. Datenmodell (neue Tabellen)

Neue Drizzle-Tabellen in `drizzle/schema.ts` (MySQL). Vorschlag:

```ts
// B2B-Kundenkonto (Firma)
b2b_customers {
  id, userId (FK users.id),        // Login-Verknüpfung
  companyName, vatId (USt-IdNr.),
  contactFirstName, contactLastName, email, phone,
  street, zip, city, country,
  createdAt, updatedAt
}

// Bestellung (Kopf)
patch_orders {
  id, customerId (FK b2b_customers.id),
  status enum('draft','pending_payment','paid','in_production','shipped','cancelled'),
  currency, subtotal, shipping, tax, total,
  billingAddress (JSON), shippingAddress (JSON),
  paymentProvider, paymentRef,     // z.B. Stripe Session/PaymentIntent-ID
  createdAt, updatedAt
}

// Einzelnes Motiv / Position
patch_order_items {
  id, orderId (FK patch_orders.id),
  technique enum('siebdruck','dtf'),
  fileKey,                          // S3-Key der Druckdaten
  fileName, fileFormat,
  widthMm, heightMm, quantity,
  colorCount,                       // nur Siebdruck
  unitPrice, setupCost, linePrice,
  preflightStatus enum('ok','warning','error','pending'),
  preflightReport (JSON),          // Ergebnisse der Datenprüfung
  createdAt, updatedAt
}

// Preisregeln (Admin-pflegbar)
patch_price_rules {
  id, technique, minQty, maxQty,
  pricePerCm2, setupCost, colorSurcharge,
  active, createdAt, updatedAt
}
```

Migration über vorhandenes Setup: `pnpm db:push` (drizzle-kit generate + migrate).

---

## 9. Backend / API (tRPC-Router)

Neuer Router `b2bRouter` (registriert in `server/routers.ts`), Auth über bestehende
`sdk.authenticateRequest` / `localAuth`.

| Procedure | Typ | Zweck |
|-----------|-----|-------|
| `b2b.register` | mutation | B2B-Kunde anlegen |
| `b2b.me` | query | Eigene Kundendaten |
| `b2bUpload.getPresignedUrl` | mutation | S3-Presigned-PUT-URL für Druckdaten |
| `b2bUpload.runPreflight` | mutation | Datenprüfung starten, Report zurückgeben |
| `patchOrder.priceQuote` | query | Serverseitiger Sofortpreis für Motive |
| `patchOrder.create` | mutation | Bestellung anlegen (status draft/pending) |
| `patchOrder.list` | query | Bestellhistorie des Kunden |
| `patchOrder.get` | query | Bestelldetail |
| `patchOrder.reorder` | mutation | Nachbestellung |
| `checkout.create` | mutation | Zahlung starten (Stripe Session) |
| `admin.patchOrders.list/setStatus/reviewData` | mutation/query | Interne Verwaltung |

Zusätzlich REST-Endpunkt für den **Stripe-Webhook** (analog zu `registerUploadRoute` in
`server/_core/index.ts` registriert), da Webhooks kein tRPC-Auth durchlaufen.

---

## 10. UI-Komponenten (Wiederverwendung)

Vorhandene shadcn/ui-Bausteine reichen weitgehend aus:

- **Upload/Preflight:** neue Komponente `PatchDataUpload.tsx` (Drag&Drop, Fortschritt,
  Ampel-Feedback) – Vorbild: `TemplateUpload.tsx`, `LogoCropEditor.tsx`
- **Motiv-Liste / Warenkorb:** `card`, `table`, `badge`, `input`, `select`
- **Preisanzeige:** eigenes `PriceSummary.tsx`
- **Checkout:** `form` (react-hook-form + zod, bereits im Stack)
- **Admin-Übersicht:** `table`, `dropdown-menu`, `dialog` (wie bestehende Admin-Seiten)
- **Layout:** `B2BLayout.tsx` (angelehnt an `DashboardLayout.tsx`)

---

## 11. Sicherheit & Rechtliches

- **Datei-Validierung** server- und clientseitig (MIME + Größe + Inhalt), Schutz vor
  Upload-Missbrauch; Presigned-URLs kurzlebig (z. B. 5 Min.).
- **Preis immer serverseitig** verbindlich berechnen.
- **Stripe-Webhook-Signatur** verifizieren.
- **Zugriffsschutz:** Kunde sieht nur eigene Bestellungen/Daten (Row-Level-Checks).
- **DSGVO:** Druckdaten sind Kundendaten – Löschkonzept/Aufbewahrungsfrist definieren.
- **AGB/Widerruf:** B2B-Sonderanfertigung → i. d. R. kein Widerrufsrecht; AGB im Checkout
  bestätigen lassen.

---

## 12. Umsetzungsplan (Meilensteine)

| Phase | Inhalt | Ergebnis |
|-------|--------|----------|
| **M1** | Datenmodell + B2B-Auth/Registrierung + `B2BLayout` + Routing-Grundgerüst | Kunde kann sich registrieren/einloggen |
| **M2** | Upload via Presigned-URL + Preflight (Grundprüfungen) | Druckdaten hochladen mit Ampel-Feedback |
| **M3** | Konfigurator (Technik/Motive/Menge) + Sofortpreis (server-verbindlich) | Warenkorb mit Live-Preis |
| **M4** | Checkout + Stripe-Integration + Webhook + Beleg-PDF | Echte Online-Bezahlung |
| **M5** | Bestellhistorie + Nachbestellung + Admin-Bestellverwaltung | End-to-End produktiv |
| **M6** | Feinschliff Preflight (Farbanzahl, CMYK), Reporting, Doku | Produktionsreife |

---

## 13. Offene Punkte / zu entscheiden

1. **DTF-Pixeldaten:** DTF ist Vollfarbe – reine Vektorformate reichen oft nicht.
   Empfehlung: **PNG/TIFF (hochauflösend, transparent) zusätzlich zulassen.** Bitte bestätigen.
2. **Payment-Provider:** Stripe vs. Mollie – Präferenz? (beeinflusst Integration & Gebühren)
3. **Preislogik:** Gibt es bestehende Preislisten/Staffeln, die ich übernehmen soll?
   (Grundpreise, Klischeekosten, Mengenstaffeln, Mindermengenzuschlag)
4. **Versand:** Feste Versandkosten, gewichts-/mengenabhängig, oder Abholung?
5. **USt./Reverse-Charge:** EU-B2B mit gültiger USt-IdNr. ggf. ohne MwSt. – nötig?
6. **Datei-Limit:** Maximale Uploadgröße pro Datei (Vorschlag: 100 MB) bestätigen.
7. **Kundenfreigabe:** Soll jede Bestellung vor Produktion intern **datengeprüft/freigegeben**
   werden, oder läuft sie nach Zahlung automatisch in Produktion?

---

*Nächster Schritt nach Freigabe dieses Konzepts: Umsetzung M1 (Datenmodell + B2B-Auth +
Routing-Grundgerüst).*

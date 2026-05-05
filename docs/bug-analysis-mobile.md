# Root-Cause-Analyse: Mobile Bugs im Produktdesigner

## Problem 1: Bearbeiten-Button nicht klickbar auf Mobile

### Identifizierter Flow:
1. User drückt "Neues Produkt" → Dialog öffnet sich (modal=false)
2. User wählt "KI-Bild-Analyse" → TemplateUpload-Komponente wird geladen
3. User lädt Trikot-Bild hoch, KI analysiert es
4. User wählt ein Zielprodukt aus dem Select-Dropdown
5. "Bearbeiten"-Button erscheint (Zeile 862 in TemplateUpload.tsx) → öffnet Fullscreen-Editor

### Root Cause:
Der "Neues Produkt"-Dialog verwendet `modal={false}` mit einem **manuellen Overlay**:
```jsx
{dialogOpen && (
  <div className="fixed inset-0 z-40 bg-black/50 pointer-events-none" />
)}
```

**Auf iOS Safari**: `pointer-events: none` wird bei Touch-Events NICHT zuverlässig respektiert 
für `position: fixed; inset: 0` Elemente. iOS macht den Touch-Hit-Test anders.

**Zusätzlich**: Der Dialog-Inhalt (TemplateUpload) enthält einen Select-Dropdown ("Produkt wählen").
Auf iOS können Select-Dropdowns innerhalb von non-modal Dialogs problematisch sein.
Der "Bearbeiten"-Button (Zeile 862) ist ein normaler Button mit onClick, der den Fullscreen-Editor öffnet.
Auf Mobile ist dieser Button möglicherweise:
- Durch das pointer-events-none Overlay blockiert (iOS-Bug)
- Zu klein für Touch (keine explizite min-height/min-width)
- Durch den Dialog-Scroll verdeckt

### Fix-Strategie:
1. Dialog auf `modal={true}` umstellen (Standard-Verhalten)
2. Das manuelle Overlay komplett entfernen
3. Touch-Target-Größe auf min 44x44px setzen
4. Fullscreen-Editor direkt als Route statt als Dialog implementieren

## Problem 2: Feedback-Widget Screenshot lässt Seite verschwinden

### Root Cause:
`html-to-image` (toPng) klont den gesamten DOM und manipuliert ihn.
Auf iOS/Mobile kann das zu Memory-Problemen führen und React-State verlieren.

### Fix:
Screenshot-Button auf Mobile deaktivieren, stattdessen nativen Screenshot-Hinweis zeigen.

## Problem 3: Trikot nicht groß genug auf Laptop (AdminProductEditor)

### Root Cause:
Der Fullscreen-Editor in TemplateUpload hat `maxWidth: '700px'` (Zeile 1101).
Das begrenzt die Darstellungsgröße unnötig.

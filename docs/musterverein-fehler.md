# Fehlerdokumentation Musterverein-Test

## Fehler beim Anlegen und Testen

### BUG-001: Hintergrund komplett weiß - kein abgesetzter Hintergrund
- **Status**: BEHOBEN
- **Beschreibung**: Der Seitenhintergrund war fast weiß (oklch 0.985), die Produktvorschau-Karten hatten bg-muted/50 (oklch 0.96/50% = fast unsichtbar). Weiße Textilien waren kaum vom Hintergrund zu unterscheiden.
- **Fix**: 
  - `--background` von oklch(0.985) auf oklch(0.93) geändert (deutlich sichtbares Grau)
  - `--muted` von oklch(0.96) auf oklch(0.91) geändert
  - Home-Seite Produktvorschau von `bg-muted/50` auf `bg-[#e0e2e6]` geändert
- **Ergebnis**: Textilien sind jetzt deutlich vom Hintergrund abgesetzt. Der graue Hintergrund ist sichtbar.

---

## Testprotokoll

(wird während des Tests befüllt)

# Hintergrund-Bug Analyse

## Problem: Einzelteile-Ansicht hat weißen Hintergrund
- Der Canvas-Bereich in der Einzelteile-Ansicht (viewMode="parts") hat einen weißen Hintergrund
- Das Trikot-Bild ist nicht sichtbar weil es weiß auf weiß ist
- Die Gesamtübersicht (viewMode="overview") hat bg-[#e8eaed] - korrekt
- Die Einzelteile-Ansicht braucht auch bg-[#e8eaed]

## Zu fixende Stellen:
- Zeile 1904: overview bg-[#e8eaed] - OK
- Zeile 1983: ? - prüfen
- Zeile 2040: ? - prüfen
- Der Canvas-Bereich für Einzelteile (canvasRef) hat KEINEN grauen Hintergrund

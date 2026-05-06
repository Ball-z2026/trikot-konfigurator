# Recherche-Notizen: Trikot-Konfiguratoren & PhotoRoom API

## Marktanalyse: Gängige Trikot-Konfiguratoren

| Anbieter | Features | KI-Analyse | Verbandsregeln |
|----------|----------|------------|----------------|
| owayo | 3D-Konfigurator, Farben, Muster, Logos frei platzierbar, Designvorlagen | Nein | Nein |
| JAKO Team Creator | 37 Farben, 65 Muster, 14 Schriftarten, Spielername/Nummer/Logo | Nein | Nein |
| Konfiwear | AI-powered 3D Kit Designer, Shopify/WooCommerce Integration, AI Graphic Generator | Nur AI für Grafik-Generierung, keine Analyse | Nein |
| spized | 3D-Konfigurator, Vereinstrikots, Druckkosten inklusive | Nein | Nein |
| deineteamwear | Farben, Muster, Schriftzüge, Logos, Spielernamen, Nummern, Sponsoren | Nein | Nein |

## Alleinstellungsmerkmale unseres Tools

1. **KI-Analyse mit automatischer Zonenerkennung** - Kein anderer Anbieter bietet das
2. **Automatische Verbandsregeln-Prüfung** - Kein anderer Anbieter prüft DFB/DHB/etc. Vorgaben
3. **Freistellung + Template-Erstellung aus Foto** - Revolutionärer Workflow

## PhotoRoom API - Background Removal

### Remove Background API (Basic Plan)
- Endpoint: `POST https://sdk.photoroom.com/v1/segment`
- Header: `x-api-key: YOUR_API_KEY`
- Form-Data: `image_file=@/path/to/image.jpg`
- Output: PNG mit transparentem Hintergrund
- Keine Veränderung am Produkt selbst - nur Hintergrund wird entfernt

### Image Editing API (Plus Plan) - bereits im Projekt für Virtual Model genutzt
- Endpoint: `POST https://image-api.photoroom.com/v2/edit`
- Kann auch `removeBackground` als Parameter setzen
- Wir nutzen bereits den Plus Plan für Virtual Model Mockups

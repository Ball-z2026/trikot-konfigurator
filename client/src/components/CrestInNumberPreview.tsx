import { useState, useRef, useEffect } from "react";
import { storageUrl } from "@/lib/utils";

/**
 * CrestInNumberPreview – Live-Vorschau für "Wappen in Rückennummer"
 *
 * Zeigt visuell, wie das Vereinswappen in den Ziffern der Rückennummer positioniert wird:
 * - Schriftbreite am UNTEREN Ende der Ziffer messen (= W)
 * - Wappen = 50% von W
 * - Horizontal zentriert innerhalb der Ziffer
 * - 1cm vom unteren Ende der Ziffer platziert (fest, nicht proportional)
 *
 * Implementierung: Canvas-basiert für pixelgenaue Darstellung.
 */

interface CrestInNumberPreviewProps {
  crestImageUrl: string;
  number?: string; // z.B. "10", "7", "23"
  fontFamily?: string;
  fontColor?: string;
  outlineColor?: string;
}

export default function CrestInNumberPreview({
  crestImageUrl,
  number = "10",
  fontFamily = "Oswald",
  fontColor = "#1e293b",
  outlineColor = "#ffffff",
}: CrestInNumberPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [crestImg, setCrestImg] = useState<HTMLImageElement | null>(null);
  const [fontLoaded, setFontLoaded] = useState(false);

  // Lade das Wappen-Bild
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setCrestImg(img);
    img.onerror = () => setCrestImg(null);
    const url = storageUrl(crestImageUrl) || crestImageUrl;
    img.src = url;
  }, [crestImageUrl]);

  // Lade die Schriftart
  useEffect(() => {
    if (!fontFamily) return;
    const link = document.querySelector(`link[href*="${encodeURIComponent(fontFamily)}"]`);
    if (!link) {
      const newLink = document.createElement("link");
      newLink.rel = "stylesheet";
      newLink.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@700;900&display=swap`;
      document.head.appendChild(newLink);
    }
    // Warte auf Font-Laden
    const checkFont = () => {
      if (document.fonts.check(`bold 48px "${fontFamily}"`)) {
        setFontLoaded(true);
      } else {
        document.fonts.ready.then(() => setFontLoaded(true));
      }
    };
    const timer = setTimeout(checkFont, 300);
    return () => clearTimeout(timer);
  }, [fontFamily]);

  // Zeichne die Vorschau
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !crestImg) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    // Clear
    ctx.clearRect(0, 0, W, H);

    // Hintergrund: leichtes Grau (simuliert Trikot-Stoff)
    ctx.fillStyle = "#f1f5f9";
    ctx.fillRect(0, 0, W, H);

    // Schriftgröße: Nummer füllt ca. 80% der Canvas-Höhe
    const fontSize = Math.floor(H * 0.75);
    const font = `900 ${fontSize}px "${fontFamily}", sans-serif`;
    ctx.font = font;
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "center";

    // Zeichne jede Ziffer einzeln
    const digits = number.split("");
    const digitMetrics = digits.map((d) => {
      const m = ctx.measureText(d);
      return {
        char: d,
        width: m.width,
        // actualBoundingBox für exakte Positionierung
        ascent: m.actualBoundingBoxAscent || fontSize * 0.75,
        descent: m.actualBoundingBoxDescent || fontSize * 0.1,
      };
    });

    const totalWidth = digitMetrics.reduce((sum, m) => sum + m.width, 0);
    const spacing = fontSize * 0.05; // Kleiner Abstand zwischen Ziffern
    const totalWithSpacing = totalWidth + spacing * (digits.length - 1);
    let startX = (W - totalWithSpacing) / 2;

    // 1cm in Pixel umrechnen (basierend auf Trikot-Größe L = 75cm Höhe)
    // Canvas-Höhe repräsentiert ca. 40cm (Nummer-Bereich auf dem Rücken)
    // → 1cm = H / 40
    const oneCmPx = H / 40;

    for (let i = 0; i < digitMetrics.length; i++) {
      const dm = digitMetrics[i];
      const digitCenterX = startX + dm.width / 2;
      const digitBaselineY = H * 0.82; // Baseline der Ziffer

      // Zeichne Outline (Kontur)
      if (outlineColor) {
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = fontSize * 0.04;
        ctx.lineJoin = "round";
        ctx.strokeText(dm.char, digitCenterX, digitBaselineY);
      }

      // Zeichne die Ziffer
      ctx.fillStyle = fontColor;
      ctx.fillText(dm.char, digitCenterX, digitBaselineY);

      // === WAPPEN-POSITIONIERUNG ===
      // Breite am UNTEREN Ende der Ziffer messen
      // Für die Vorschau: Wir verwenden die gemessene Zeichenbreite als Annäherung
      const digitBottomWidth = dm.width;

      // Wappen = 50% der Ziffern-Breite am unteren Ende
      const crestWidth = digitBottomWidth * 0.5;
      const crestAspect = crestImg.naturalHeight / crestImg.naturalWidth;
      const crestHeight = crestWidth * crestAspect;

      // Horizontal: Zentriert innerhalb der Ziffer
      const crestX = digitCenterX - crestWidth / 2;

      // Vertikal: 1cm vom unteren Ende der Ziffer
      // Unteres Ende der Ziffer = baseline + descent
      const digitBottom = digitBaselineY + dm.descent;
      const crestY = digitBottom - oneCmPx - crestHeight;

      // Zeichne das Wappen (halbtransparent als Wasserzeichen-Effekt)
      ctx.globalAlpha = 0.7;
      ctx.drawImage(crestImg, crestX, crestY, crestWidth, crestHeight);
      ctx.globalAlpha = 1.0;

      // Nächste Ziffer
      startX += dm.width + spacing;
    }

    // Beschriftungen / Hilfslinien
    ctx.font = "11px Inter, sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.textAlign = "left";
    ctx.fillText("Live-Vorschau: Wappen in Nummer", 8, 16);

    // Legende unten
    ctx.font = "10px Inter, sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "center";
    ctx.fillText("Wappen = 50% Ziffernbreite · 1cm vom Boden · zentriert", W / 2, H - 8);

  }, [crestImg, number, fontFamily, fontColor, outlineColor, fontLoaded]);

  return (
    <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50/50 p-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center">
          <span className="text-[10px] font-bold text-blue-700">W</span>
        </div>
        <span className="text-xs font-medium text-blue-800">
          Vorschau: Wappen-Positionierung in Rückennummer
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={400}
        height={240}
        className="w-full max-w-[400px] h-auto rounded border border-blue-100 bg-white mx-auto block"
      />
      <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-blue-600">
        <span className="bg-blue-100 px-1.5 py-0.5 rounded">Breite am unteren Ende messen</span>
        <span className="bg-blue-100 px-1.5 py-0.5 rounded">Wappen = 50% davon</span>
        <span className="bg-blue-100 px-1.5 py-0.5 rounded">1cm vom Boden</span>
        <span className="bg-blue-100 px-1.5 py-0.5 rounded">Horizontal zentriert</span>
      </div>
    </div>
  );
}

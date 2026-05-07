import { useState, useRef, useEffect } from "react";
import { storageUrl } from "@/lib/utils";

/**
 * CrestInNumberPreview – Live-Vorschau für "Wappen in Rückennummer"
 *
 * Neue Positionierungsregeln:
 * - Wappen-Höhe = 7% der Höhe der Rückennummer
 * - Horizontal zentriert im UNTEREN Bereich der jeweiligen Ziffer
 * - Bei zweistelligen Nummern: Beide Wappen auf GLEICHER Höhe
 */

interface CrestInNumberPreviewProps {
  crestImageUrl: string;
  number?: string;
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

    // Schriftgröße: Nummer füllt ca. 75% der Canvas-Höhe
    const fontSize = Math.floor(H * 0.75);
    const font = `900 ${fontSize}px "${fontFamily}", sans-serif`;
    ctx.font = font;
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "center";

    // === NEUE LOGIK: Wappen-Höhe = 7% der Nummern-Höhe ===
    const numberHeight = fontSize; // Die Höhe der Rückennummer
    const crestHeight = numberHeight * 0.07; // 7% davon
    const crestAspect = crestImg.naturalWidth / crestImg.naturalHeight;
    const crestWidth = crestHeight * crestAspect;

    // Zeichne jede Ziffer einzeln
    const digits = number.split("");
    const digitMetrics = digits.map((d) => {
      const m = ctx.measureText(d);
      return {
        char: d,
        width: m.width,
        ascent: m.actualBoundingBoxAscent || fontSize * 0.75,
        descent: m.actualBoundingBoxDescent || fontSize * 0.1,
      };
    });

    const totalWidth = digitMetrics.reduce((sum, m) => sum + m.width, 0);
    const spacing = fontSize * 0.05;
    const totalWithSpacing = totalWidth + spacing * (digits.length - 1);
    let startX = (W - totalWithSpacing) / 2;

    const digitBaselineY = H * 0.82;

    // === GLEICHE HÖHE für alle Wappen bei zweistelligen Nummern ===
    // Berechne eine einheitliche Y-Position für alle Wappen:
    // "Mitte des unteren Bereichs" = Mittelpunkt der UNTEREN HÄLFTE der Ziffer
    const digitTop = digitBaselineY - (digitMetrics[0]?.ascent || fontSize * 0.75);
    const digitBottom = digitBaselineY + (digitMetrics[0]?.descent || fontSize * 0.1);
    const digitTotalHeight = digitBottom - digitTop;
    // "CENTER OF THE LOWER HALF" = Mittelpunkt zwischen Mitte und Boden der Ziffer
    const digitMiddle = digitTop + digitTotalHeight * 0.5;
    const lowerHalfCenter = (digitMiddle + digitBottom) / 2; // Mitte der unteren Hälfte
    const crestY = lowerHalfCenter - crestHeight / 2;

    for (let i = 0; i < digitMetrics.length; i++) {
      const dm = digitMetrics[i];
      const digitCenterX = startX + dm.width / 2;

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
      // Horizontal: Zentriert im unteren Bereich der Ziffer
      const crestX = digitCenterX - crestWidth / 2;

      // Zeichne das Wappen
      ctx.globalAlpha = 0.75;
      ctx.drawImage(crestImg, crestX, crestY, crestWidth, crestHeight);
      ctx.globalAlpha = 1.0;

      // Nächste Ziffer
      startX += dm.width + spacing;
    }

    // === Hilfslinien zur Verdeutlichung ===
    // Horizontale Linie auf Wappen-Höhe (zeigt "gleiche Höhe")
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W * 0.1, crestY + crestHeight / 2);
    ctx.lineTo(W * 0.9, crestY + crestHeight / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Beschriftung der Hilfslinie
    ctx.font = "9px Inter, sans-serif";
    ctx.fillStyle = "#ef4444";
    ctx.textAlign = "right";
    ctx.fillText("gleiche Höhe", W * 0.95, crestY + crestHeight / 2 - 4);

    // Beschriftungen
    ctx.font = "11px Inter, sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.textAlign = "left";
    ctx.fillText("Live-Vorschau: Wappen in Nummer", 8, 16);

    // Legende unten
    ctx.font = "10px Inter, sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "center";
    ctx.fillText("Wappen = 7% der Nummernhöhe · Mitte unterer Bereich · gleiche Höhe", W / 2, H - 8);

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
        <span className="bg-blue-100 px-1.5 py-0.5 rounded">7% der Nummernhöhe</span>
        <span className="bg-blue-100 px-1.5 py-0.5 rounded">Mitte unterer Bereich</span>
        <span className="bg-blue-100 px-1.5 py-0.5 rounded">Gleiche Höhe bei 2-stellig</span>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { FileText } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

// Vite-kompatibles Worker-Setup: Importiert den Worker als URL
// @ts-ignore - Vite-spezifischer Import mit ?url Suffix
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

interface PdfPreviewProps {
  url: string;
  className?: string;
  width?: number;
  height?: number;
}

/**
 * Rendert die erste Seite eines PDFs als Bild-Vorschau.
 * Verwendet pdfjs-dist mit Vite-gebundeltem Worker.
 */
export function PdfPreview({ url, className = "", width = 200, height = 200 }: PdfPreviewProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function renderPdf() {
      try {
        setLoading(true);
        setError(false);
        setImgSrc(null);

        // PDF per fetch laden um Redirect/CORS-Probleme zu umgehen
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();

        if (cancelled) return;

        // PDF aus ArrayBuffer laden
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        if (cancelled) return;

        const page = await pdf.getPage(1);

        if (cancelled) return;

        // Skalierung berechnen um in die gewünschte Größe zu passen
        const viewport = page.getViewport({ scale: 1 });
        const scaleX = width / viewport.width;
        const scaleY = height / viewport.height;
        const scale = Math.min(scaleX, scaleY) * 2; // 2x für Retina-Qualität
        const scaledViewport = page.getViewport({ scale });

        // Offscreen-Canvas erstellen
        const offscreenCanvas = document.createElement("canvas");
        offscreenCanvas.width = scaledViewport.width;
        offscreenCanvas.height = scaledViewport.height;
        const ctx = offscreenCanvas.getContext("2d");
        if (!ctx) throw new Error("Canvas context not available");

        await page.render({
          canvasContext: ctx,
          viewport: scaledViewport,
        }).promise;

        if (cancelled) return;

        // Canvas zu Data-URL konvertieren für stabiles Rendering
        const dataUrl = offscreenCanvas.toDataURL("image/png");
        setImgSrc(dataUrl);
        setLoading(false);
      } catch (err) {
        console.error("PDF-Vorschau Fehler:", err);
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }

    if (url) {
      renderPdf();
    } else {
      setError(true);
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [url, width, height]);

  if (error) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center justify-center bg-muted rounded hover:bg-muted/80 transition-colors cursor-pointer ${className}`}
        style={{ width, height }}
        title="PDF öffnen"
      >
        <div className="flex flex-col items-center gap-1">
          <FileText className="w-8 h-8 text-red-500" />
          <span className="text-[10px] text-muted-foreground font-medium">PDF öffnen</span>
        </div>
      </a>
    );
  }

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width, height }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted rounded">
          <div className="flex flex-col items-center gap-1">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] text-muted-foreground">PDF laden...</span>
          </div>
        </div>
      )}
      {imgSrc && (
        <img
          src={imgSrc}
          alt="PDF-Vorschau"
          className="object-contain rounded"
          style={{ 
            maxWidth: width, 
            maxHeight: height,
          }}
        />
      )}
    </div>
  );
}

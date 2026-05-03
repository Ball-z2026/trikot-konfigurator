import { useEffect, useRef, useState } from "react";
import { FileText } from "lucide-react";

interface PdfPreviewProps {
  url: string;
  className?: string;
  width?: number;
  height?: number;
}

/**
 * Rendert die erste Seite eines PDFs als Bild-Vorschau.
 * Fällt auf ein FileText-Icon zurück wenn das Rendering fehlschlägt.
 * Kompatibel mit pdfjs-dist v5.x (canvas ist Pflicht-Parameter).
 */
export function PdfPreview({ url, className = "", width = 200, height = 200 }: PdfPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function renderPdf() {
      try {
        setLoading(true);
        setError(false);

        // Dynamischer Import um Bundle-Größe zu reduzieren
        const pdfjsLib = await import("pdfjs-dist");
        
        // Worker konfigurieren
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;

        if (cancelled) return;

        const page = await pdf.getPage(1);

        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        // Skalierung berechnen um in die gewünschte Größe zu passen
        const viewport = page.getViewport({ scale: 1 });
        const scaleX = width / viewport.width;
        const scaleY = height / viewport.height;
        const scale = Math.min(scaleX, scaleY);
        const scaledViewport = page.getViewport({ scale });

        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        // pdfjs-dist v5: canvas ist Pflicht-Parameter
        await page.render({
          canvas: canvas,
          viewport: scaledViewport,
        }).promise;

        if (!cancelled) {
          setLoading(false);
        }
      } catch (err) {
        console.error("PDF-Vorschau Fehler:", err);
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }

    renderPdf();

    return () => {
      cancelled = true;
    };
  }, [url, width, height]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded ${className}`} style={{ width, height }}>
        <FileText className="w-8 h-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted rounded">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="object-contain rounded"
        style={{ 
          maxWidth: width, 
          maxHeight: height,
          display: loading ? "none" : "block"
        }}
      />
    </div>
  );
}

import { useState } from "react";
import { Loader2, ImageOff, FileText } from "lucide-react";

interface SponsorLogoImageProps {
  src: string | undefined;
  alt: string;
  className?: string;
  /** Optional: MIME-Type des Logos (z.B. "application/pdf") */
  mimeType?: string | null;
}

/**
 * Sponsor-Logo mit Ladeanzeige (Skeleton/Spinner) und Fehler-Fallback.
 * Unterstützt auch PDF-Dateien mit einem PDF-Icon und Vorschau-Link.
 */
export function SponsorLogoImage({ src, alt, className = "max-w-full max-h-full object-contain", mimeType }: SponsorLogoImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  if (!src) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <ImageOff className="w-6 h-6 text-muted-foreground/40" />
      </div>
    );
  }

  // PDF-Erkennung: über mimeType oder URL-Endung
  const isPdf = mimeType === "application/pdf" || 
    src.toLowerCase().endsWith(".pdf") ||
    src.toLowerCase().includes(".pdf?");

  if (isPdf) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <a href={src} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center gap-1 hover:opacity-80 transition-opacity">
          <FileText className="w-8 h-8 text-red-500" />
          <span className="text-[10px] text-muted-foreground font-medium">PDF</span>
          <span className="text-[9px] text-muted-foreground/70">{alt}</span>
        </a>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20 animate-pulse rounded">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/50" />
        </div>
      )}
      {error ? (
        <div className="flex flex-col items-center justify-center gap-1">
          <ImageOff className="w-6 h-6 text-muted-foreground/40" />
          <span className="text-[10px] text-muted-foreground/50">Fehler</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={`${className} ${loading ? "opacity-0" : "opacity-100"} transition-opacity duration-200`}
          onLoad={() => setLoading(false)}
          onError={() => { setLoading(false); setError(true); }}
        />
      )}
    </div>
  );
}

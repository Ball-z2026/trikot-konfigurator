import { useState } from "react";
import { Loader2, ImageOff } from "lucide-react";

interface SponsorLogoImageProps {
  src: string | undefined;
  alt: string;
  className?: string;
}

/**
 * Sponsor-Logo mit Ladeanzeige (Skeleton/Spinner) und Fehler-Fallback.
 */
export function SponsorLogoImage({ src, alt, className = "max-w-full max-h-full object-contain" }: SponsorLogoImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  if (!src) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <ImageOff className="w-6 h-6 text-muted-foreground/40" />
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

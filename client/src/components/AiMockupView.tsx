import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Download, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface AiMockupViewProps {
  productName: string;
  sortedParts: Array<{ id: number; key: string; label: string; imageUrl: string | null }>;
  processedPartImages: Record<number, string>;
  partColors: Record<number, string>;
  isSublimation: boolean;
  isDtf: boolean;
  dtfBaseColor: string;
}

export function AiMockupView({
  productName,
  sortedParts,
  partColors,
  isSublimation,
  isDtf,
  dtfBaseColor,
}: AiMockupViewProps) {
  const [mockupUrl, setMockupUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const generateMockup = trpc.mockup.generateAi.useMutation();

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // Sammle Farbinformationen für den Prompt
      const colorDescriptions = sortedParts.map((part) => {
        const color = partColors[part.id] || (isDtf ? dtfBaseColor : "#ffffff");
        return `${part.label}: ${color}`;
      }).join(", ");

      const productType = isSublimation ? "Sublimation" : isDtf ? "DTF-Druck" : "Standard";

      const result = await generateMockup.mutateAsync({
        productName,
        productType,
        colorDescription: colorDescriptions,
      });

      if (result.url) {
        setMockupUrl(result.url);
        toast.success("KI-Mockup erfolgreich generiert!");
      } else {
        toast.error("Kein Mockup-Bild erhalten");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
      toast.error(`Mockup-Generierung fehlgeschlagen: ${msg}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!mockupUrl) return;
    const a = document.createElement("a");
    a.href = mockupUrl;
    a.download = `${productName.replace(/\s+/g, "_")}_mockup.png`;
    a.click();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {!mockupUrl && !isGenerating && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-purple-500" />
          </div>
          <div className="text-center max-w-sm">
            <h3 className="font-semibold text-lg mb-1">KI-Mockup generieren</h3>
            <p className="text-sm text-muted-foreground">
              Erstelle ein fotorealistisches Mockup deines Designs mit KI-Bildgenerierung.
              Die aktuellen Farben und das Design werden als Vorlage verwendet.
            </p>
          </div>
          <Button
            onClick={handleGenerate}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Mockup generieren
          </Button>
          <p className="text-xs text-muted-foreground">
            Dauer: ca. 10-20 Sekunden
          </p>
        </div>
      )}

      {isGenerating && (
        <div className="flex flex-col items-center gap-4 py-12">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 animate-pulse" />
            <Loader2 className="w-10 h-10 text-purple-500 animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="text-center">
            <p className="font-medium">KI generiert dein Mockup...</p>
            <p className="text-sm text-muted-foreground mt-1">
              Dies kann 10-20 Sekunden dauern
            </p>
          </div>
        </div>
      )}

      {mockupUrl && !isGenerating && (
        <div className="flex flex-col items-center gap-3 w-full">
          <div className="relative w-full max-w-md mx-auto rounded-lg overflow-hidden shadow-lg">
            <img
              ref={imgRef}
              src={mockupUrl}
              alt="KI-generiertes Mockup"
              className="w-full h-auto"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleGenerate}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Neu generieren
            </Button>
            <Button size="sm" onClick={handleDownload}>
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Herunterladen
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            KI-generiertes Bild. Farben und Positionen können leicht abweichen.
          </p>
        </div>
      )}
    </div>
  );
}

export default AiMockupView;

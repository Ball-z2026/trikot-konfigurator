import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Download, RefreshCw } from "lucide-react";
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
  /** Referenz auf das Canvas-Container-Element für Screenshot */
  canvasContainerRef?: React.RefObject<HTMLDivElement | null>;
}

const LOADING_STEPS = [
  { text: "Design wird analysiert...", duration: 3000 },
  { text: "Farben und Muster werden erfasst...", duration: 4000 },
  { text: "Fotorealistisches Mockup wird erstellt...", duration: 8000 },
  { text: "Details werden verfeinert...", duration: 10000 },
  { text: "Bild wird fertiggestellt...", duration: 15000 },
];

export function AiMockupView({
  productName,
  sortedParts,
  processedPartImages,
  partColors,
  isSublimation,
  isDtf,
  dtfBaseColor,
  canvasContainerRef,
}: AiMockupViewProps) {
  const [mockupUrl, setMockupUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const startTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number>(0);

  const generateMockup = trpc.mockup.generateAi.useMutation();

  // Fortschrittsanimation während der Generierung
  useEffect(() => {
    if (!isGenerating) {
      setCurrentStep(0);
      setProgress(0);
      return;
    }

    startTimeRef.current = Date.now();

    const updateProgress = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const targetProgress = Math.min(95, (elapsed / 600) * (1 - elapsed / 120000));
      const smoothProgress = 95 * (1 - Math.exp(-elapsed / 25000));
      setProgress(Math.min(95, Math.max(targetProgress, smoothProgress)));

      let stepIndex = 0;
      let accumulated = 0;
      for (let i = 0; i < LOADING_STEPS.length; i++) {
        accumulated += LOADING_STEPS[i].duration;
        if (elapsed < accumulated) break;
        stepIndex = Math.min(i + 1, LOADING_STEPS.length - 1);
      }
      setCurrentStep(stepIndex);

      animFrameRef.current = requestAnimationFrame(updateProgress);
    };

    animFrameRef.current = requestAnimationFrame(updateProgress);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isGenerating]);

  /** Erstelle ein Composite-Bild aus den processedPartImages als Referenz für die KI */
  const captureDesignImage = async (): Promise<string | undefined> => {
    // Methode 1: Verwende canvasContainerRef für einen Screenshot des aktuellen Designs
    if (canvasContainerRef?.current) {
      try {
        const { toPng } = await import("html-to-image");
        const dataUrl = await toPng(canvasContainerRef.current, {
          quality: 0.7,
          pixelRatio: 1,
          skipFonts: true,
        });
        return dataUrl;
      } catch {
        // Fallback zu Methode 2
      }
    }

    // Methode 2: Erstelle ein Composite aus den processedPartImages
    const partEntries = sortedParts
      .filter(p => processedPartImages[p.id])
      .map(p => processedPartImages[p.id]);

    if (partEntries.length === 0) return undefined;

    // Verwende das erste verfügbare Bild (Vorderteil) als Referenz
    return partEntries[0];
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setMockupUrl(null);
    try {
      const colorDescriptions = sortedParts.map((part) => {
        const color = partColors[part.id] || (isDtf ? dtfBaseColor : "#ffffff");
        return `${part.label}: ${color}`;
      }).join(", ");

      const productType = isSublimation ? "Sublimation" : isDtf ? "DTF-Druck" : "Standard";

      // Erfasse das aktuelle Design als Referenzbild
      const designImageBase64 = await captureDesignImage();

      const result = await generateMockup.mutateAsync({
        productName,
        productType,
        colorDescription: colorDescriptions,
        designImageBase64,
      });

      if (result.url) {
        setProgress(100);
        await new Promise(resolve => setTimeout(resolve, 400));
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
      {/* Initialer Zustand: Generieren-Button */}
      {!mockupUrl && !isGenerating && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-purple-500" />
          </div>
          <div className="text-center max-w-sm">
            <h3 className="font-semibold text-lg mb-1">KI-Mockup generieren</h3>
            <p className="text-sm text-muted-foreground">
              Erstelle ein fotorealistisches Mockup basierend auf deinem aktuellen Design.
              Farben, Logos und Muster werden als Vorlage verwendet.
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
            Dauer: ca. 10-60 Sekunden
          </p>
        </div>
      )}

      {/* Ladeanimation */}
      {isGenerating && (
        <div className="flex flex-col items-center gap-6 py-8 w-full max-w-sm">
          {/* Animierter Kreis mit Pulseffekt */}
          <div className="relative w-28 h-28">
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 border-r-pink-500 animate-spin" style={{ animationDuration: "2s" }} />
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-purple-400 border-l-pink-400 animate-spin" style={{ animationDuration: "3s", animationDirection: "reverse" }} />
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 animate-pulse flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-purple-500 animate-pulse" />
            </div>
          </div>

          {/* Fortschrittsbalken */}
          <div className="w-full space-y-2">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>{Math.round(progress)}%</span>
              <span>{LOADING_STEPS[currentStep].text}</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Schritte-Anzeige */}
          <div className="w-full space-y-1.5">
            {LOADING_STEPS.map((step, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 text-xs transition-all duration-300 ${
                  index < currentStep
                    ? "text-green-600"
                    : index === currentStep
                    ? "text-purple-600 font-medium"
                    : "text-muted-foreground/50"
                }`}
              >
                <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                  index < currentStep
                    ? "bg-green-100 text-green-600"
                    : index === currentStep
                    ? "bg-purple-100 text-purple-600"
                    : "bg-muted"
                }`}>
                  {index < currentStep ? (
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : index === currentStep ? (
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                  )}
                </div>
                <span>{step.text}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground text-center mt-2">
            Die KI erstellt ein einzigartiges Mockup basierend auf deinem Design.
            <br />
            Bitte warte, bis der Vorgang abgeschlossen ist.
          </p>
        </div>
      )}

      {/* Ergebnis-Anzeige */}
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
            KI-generiertes Bild basierend auf deinem Design. Farben und Positionen können leicht abweichen.
          </p>
        </div>
      )}
    </div>
  );
}

export default AiMockupView;

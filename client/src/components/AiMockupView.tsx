import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Download, RefreshCw, Save, Share2, Camera, User, Upload, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { storageUrl } from "@/lib/utils";

interface AiMockupViewProps {
  productName: string;
  sortedParts: Array<{ id: number; key: string; label: string; imageUrl: string | null }>;
  processedPartImages: Record<number, string>;
  partColors: Record<number, string>;
  isSublimation: boolean;
  isDtf: boolean;
  dtfBaseColor: string;
  /** Vorab-gecachter Screenshot des Canvas (data:image/png;base64,...) */
  cachedScreenshot?: string | null;
  /** Referenz auf das Canvas-Container-Element für Screenshot (Fallback) */
  canvasContainerRef?: React.RefObject<HTMLDivElement | null>;
  /** Beschreibung der Zonen-Inhalte für den KI-Prompt */
  zoneDescriptions?: string;
  /** Seite: "front" oder "back" (für Vorder-/Rückseite-Modus) */
  side?: "front" | "back";
  /** Callback wenn Mockup in Galerie gespeichert werden soll */
  onSaveToGallery?: (mockupUrl: string, side: string) => void;
  /** Callback wenn Mockup geteilt werden soll */
  onShare?: (mockupUrl: string) => void;
}

type MockupMode = "photoroom" | "ai";

const MODEL_PRESETS = [
  { value: "avery", label: "Avery (männlich)" },
  { value: "jackson", label: "Jackson (männlich)" },
  { value: "ava", label: "Ava (weiblich)" },
  { value: "random", label: "Zufällig" },
];

const SCENE_PRESETS = [
  { value: "random", label: "Zufällig" },
  { value: "street", label: "Straße" },
  { value: "library", label: "Bibliothek" },
  { value: "bedroom", label: "Schlafzimmer" },
];

const POSE_PRESETS = [
  { value: "random", label: "Zufällig" },
  { value: "standing", label: "Stehend" },
  { value: "crossedarms", label: "Arme verschränkt" },
  { value: "seated", label: "Sitzend" },
];

const LOADING_STEPS_AI = [
  { text: "Design wird analysiert...", duration: 3000 },
  { text: "Farben und Muster werden erfasst...", duration: 4000 },
  { text: "Fotorealistisches Mockup wird erstellt...", duration: 8000 },
  { text: "Details werden verfeinert...", duration: 10000 },
  { text: "Bild wird fertiggestellt...", duration: 15000 },
];

const LOADING_STEPS_PHOTOROOM = [
  { text: "Bild wird an Photoroom gesendet...", duration: 2000 },
  { text: "Hintergrund wird entfernt...", duration: 3000 },
  { text: "Virtuelles Model wird erstellt...", duration: 5000 },
  { text: "Kleidung wird angepasst...", duration: 8000 },
  { text: "Szene wird gerendert...", duration: 10000 },
];

export function AiMockupView({
  productName,
  sortedParts,
  processedPartImages,
  partColors,
  isSublimation,
  isDtf,
  dtfBaseColor,
  cachedScreenshot,
  canvasContainerRef,
  zoneDescriptions,
  side = "front",
  onSaveToGallery,
  onShare,
}: AiMockupViewProps) {
  const [mockupUrl, setMockupUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [mode, setMode] = useState<MockupMode>("photoroom");
  const [modelPreset, setModelPreset] = useState("avery");
  const [scenePreset, setScenePreset] = useState("street");
  const [posePreset, setPosePreset] = useState("standing");
  const [useCustomModel, setUseCustomModel] = useState(false);
  const [customModelImage, setCustomModelImage] = useState<string | null>(null);
  const [customModelPreview, setCustomModelPreview] = useState<string | null>(null);
  const customModelInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const startTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number>(0);

  const generateAiMockup = trpc.mockup.generateAi.useMutation();
  const generatePhotoroomMockup = trpc.mockup.generatePhotoroom.useMutation();
  const { data: photoroomStatus } = trpc.mockup.photoroomStatus.useQuery();

  const isPhotoroomAvailable = photoroomStatus?.configured ?? false;

  // Wenn Photoroom nicht verfügbar ist, auf AI umschalten
  useEffect(() => {
    if (photoroomStatus && !photoroomStatus.configured && mode === "photoroom") {
      setMode("ai");
    }
  }, [photoroomStatus, mode]);

  // Wenn Seite wechselt: Altes Mockup zurücksetzen
  useEffect(() => {
    setMockupUrl(null);
    setIsGenerating(false);
  }, [side]);

  // Wenn sich der gecachte Screenshot ändert: Mockup zurücksetzen
  useEffect(() => {
    setMockupUrl(null);
  }, [cachedScreenshot]);

  const loadingSteps = mode === "photoroom" ? LOADING_STEPS_PHOTOROOM : LOADING_STEPS_AI;

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
      for (let i = 0; i < loadingSteps.length; i++) {
        accumulated += loadingSteps[i].duration;
        if (elapsed < accumulated) break;
        stepIndex = Math.min(i + 1, loadingSteps.length - 1);
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
  }, [isGenerating, loadingSteps]);

  /** Erstelle ein Referenzbild für die KI-Generierung */
  const captureDesignImage = async (): Promise<string | undefined> => {
    if (cachedScreenshot) {
      return cachedScreenshot;
    }

    if (canvasContainerRef?.current) {
      try {
        const { toPng } = await import("html-to-image");
        const dataUrl = await toPng(canvasContainerRef.current, {
          quality: 0.8,
          pixelRatio: 1.5,
          skipFonts: true,
        });
        return dataUrl;
      } catch {
        // Fallback
      }
    }

    const partEntries = sortedParts
      .filter(p => processedPartImages[p.id])
      .map(p => processedPartImages[p.id]);

    if (partEntries.length === 0) return undefined;
    return partEntries[0];
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setMockupUrl(null);
    try {
      const designImageBase64 = await captureDesignImage();

      if (!designImageBase64) {
        toast.error("Kein Design-Screenshot verfügbar. Bitte zuerst das Design konfigurieren.");
        setIsGenerating(false);
        return;
      }

      let resultUrl: string | undefined;

      if (mode === "photoroom") {
        // Photoroom Virtual Model API
        const result = await generatePhotoroomMockup.mutateAsync({
          designImageBase64,
          modelPreset: useCustomModel ? undefined : modelPreset,
          scenePreset,
          pose: posePreset,
          customModelImageBase64: useCustomModel ? (customModelImage || undefined) : undefined,
        });
        resultUrl = result.url;
      } else {
        // Standard KI-Generierung
        const colorDescriptions = sortedParts.map((part) => {
          const color = partColors[part.id] || (isDtf ? dtfBaseColor : "#ffffff");
          return `${part.label}: ${color}`;
        }).join(", ");

        const productType = isSublimation ? "Sublimation" : isDtf ? "DTF-Druck" : "Standard";

        const result = await generateAiMockup.mutateAsync({
          productName,
          productType,
          colorDescription: colorDescriptions,
          designImageBase64,
          zoneDescriptions,
          side,
        });
        resultUrl = result.url;
      }

      if (resultUrl) {
        setProgress(100);
        await new Promise(resolve => setTimeout(resolve, 400));
        setMockupUrl(resultUrl);
        toast.success("Mockup erfolgreich generiert!");
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
    a.href = storageUrl(mockupUrl) || mockupUrl;
    a.download = `${productName.replace(/\s+/g, "_")}_Mockup.png`;
    a.target = "_blank";
    a.click();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Vorschau des gecachten Screenshots */}
      {cachedScreenshot && !mockupUrl && !isGenerating && (
        <div className="w-full max-w-xs mx-auto mb-2">
          <p className="text-xs text-muted-foreground text-center mb-1.5">Dein aktuelles Design (Vorlage):</p>
          <div className="rounded-lg overflow-hidden border bg-white shadow-sm">
            <img src={cachedScreenshot} alt="Aktuelles Design" className="w-full h-auto" />
          </div>
        </div>
      )}

      {/* Initialer Zustand: Modus-Auswahl + Generieren-Button */}
      {!mockupUrl && !isGenerating && (
        <div className="flex flex-col items-center gap-4 py-4 w-full max-w-sm">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-purple-500" />
          </div>
          <div className="text-center max-w-sm">
            <h3 className="font-semibold text-lg mb-1">Mockup generieren</h3>
            <p className="text-sm text-muted-foreground">
              Erstelle ein fotorealistisches Mockup basierend auf deinem aktuellen Design.
            </p>
          </div>

          {/* Modus-Auswahl */}
          <div className="w-full space-y-2">
            <p className="text-xs font-medium text-muted-foreground text-center">Methode wählen:</p>
            <div className="grid grid-cols-2 gap-2">
              {/* Photoroom Option */}
              <button
                onClick={() => isPhotoroomAvailable && setMode("photoroom")}
                className={`relative flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-left ${
                  mode === "photoroom"
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30"
                    : isPhotoroomAvailable
                    ? "border-border hover:border-purple-300"
                    : "border-border opacity-50 cursor-not-allowed"
                }`}
              >
                <User className="w-5 h-5 text-purple-600" />
                <span className="text-xs font-medium">Photoroom</span>
                <span className="text-[10px] text-muted-foreground text-center leading-tight">
                  Virtuelles Model mit Szene
                </span>
                {!isPhotoroomAvailable && (
                  <span className="text-[9px] text-amber-600 font-medium">API Key fehlt</span>
                )}
              </button>

              {/* Standard KI Option */}
              <button
                onClick={() => setMode("ai")}
                className={`relative flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-left ${
                  mode === "ai"
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30"
                    : "border-border hover:border-purple-300"
                }`}
              >
                <Camera className="w-5 h-5 text-purple-600" />
                <span className="text-xs font-medium">Standard KI</span>
                <span className="text-[10px] text-muted-foreground text-center leading-tight">
                  KI-generiertes Produktfoto
                </span>
              </button>
            </div>
          </div>

          {/* Photoroom Optionen */}
          {mode === "photoroom" && isPhotoroomAvailable && (
            <div className="w-full space-y-3 bg-muted/30 rounded-lg p-3">
              {/* Model-Auswahl: Preset oder Custom */}
              <div>
                <label className="text-[10px] font-medium text-muted-foreground block mb-1.5">Model</label>
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  <button
                    onClick={() => setUseCustomModel(false)}
                    className={`text-xs py-1.5 px-2 rounded border transition-all ${
                      !useCustomModel
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30 font-medium"
                        : "border-border hover:border-purple-300"
                    }`}
                  >
                    Preset-Model
                  </button>
                  <button
                    onClick={() => setUseCustomModel(true)}
                    className={`text-xs py-1.5 px-2 rounded border transition-all flex items-center justify-center gap-1 ${
                      useCustomModel
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30 font-medium"
                        : "border-border hover:border-purple-300"
                    }`}
                  >
                    <Upload className="w-3 h-3" />
                    Eigenes Foto
                  </button>
                </div>

                {/* Preset-Model Dropdown */}
                {!useCustomModel && (
                  <select
                    value={modelPreset}
                    onChange={(e) => setModelPreset(e.target.value)}
                    className="w-full text-xs border rounded px-2 py-1.5 bg-background"
                  >
                    {MODEL_PRESETS.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                )}

                {/* Custom Model Upload */}
                {useCustomModel && (
                  <div className="space-y-2">
                    <input
                      ref={customModelInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 10 * 1024 * 1024) {
                          toast.error("Bild darf maximal 10 MB groß sein.");
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => {
                          const dataUrl = reader.result as string;
                          setCustomModelImage(dataUrl);
                          setCustomModelPreview(dataUrl);
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                    {customModelPreview ? (
                      <div className="relative">
                        <img
                          src={customModelPreview}
                          alt="Custom Model"
                          className="w-full h-24 object-cover rounded border"
                        />
                        <button
                          onClick={() => {
                            setCustomModelImage(null);
                            setCustomModelPreview(null);
                            if (customModelInputRef.current) customModelInputRef.current.value = "";
                          }}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <p className="text-[9px] text-green-600 mt-1">Eigenes Model-Foto geladen</p>
                      </div>
                    ) : (
                      <button
                        onClick={() => customModelInputRef.current?.click()}
                        className="w-full py-3 border-2 border-dashed rounded-lg text-xs text-muted-foreground hover:border-purple-400 hover:text-purple-600 transition-colors flex flex-col items-center gap-1"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Foto hochladen</span>
                        <span className="text-[9px]">(Person als Model verwenden)</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Szene und Pose */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground block mb-1">Szene</label>
                  <select
                    value={scenePreset}
                    onChange={(e) => setScenePreset(e.target.value)}
                    className="w-full text-xs border rounded px-2 py-1.5 bg-background"
                  >
                    {SCENE_PRESETS.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground block mb-1">Pose</label>
                  <select
                    value={posePreset}
                    onChange={(e) => setPosePreset(e.target.value)}
                    className="w-full text-xs border rounded px-2 py-1.5 bg-background"
                  >
                    {POSE_PRESETS.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-[9px] text-muted-foreground text-center">$0.10 pro Generierung</p>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white w-full"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {mode === "photoroom" ? "Photoroom Mockup generieren" : "KI-Mockup generieren"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Dauer: ca. {mode === "photoroom" ? "5-15" : "10-60"} Sekunden
          </p>
          {!cachedScreenshot && (
            <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 rounded-md">
              Hinweis: Kein Design-Screenshot verfügbar. Bitte zuerst das Design konfigurieren.
            </p>
          )}
        </div>
      )}

      {/* Ladeanimation */}
      {isGenerating && (
        <div className="flex flex-col items-center gap-6 py-8 w-full max-w-sm">
          <div className="relative w-28 h-28">
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 border-r-pink-500 animate-spin" style={{ animationDuration: "2s" }} />
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-purple-400 border-l-pink-400 animate-spin" style={{ animationDuration: "3s", animationDirection: "reverse" }} />
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 animate-pulse flex items-center justify-center">
              {mode === "photoroom" ? (
                <User className="w-8 h-8 text-purple-500 animate-pulse" />
              ) : (
                <Sparkles className="w-8 h-8 text-purple-500 animate-pulse" />
              )}
            </div>
          </div>

          <div className="w-full space-y-2">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>{Math.round(progress)}%</span>
              <span>{loadingSteps[currentStep]?.text}</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="w-full space-y-1.5">
            {loadingSteps.map((step, index) => (
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
            {mode === "photoroom"
              ? "Photoroom erstellt ein fotorealistisches Mockup mit virtuellem Model."
              : "Die KI erstellt ein einzigartiges Mockup basierend auf deinem Design."}
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
              src={storageUrl(mockupUrl) || mockupUrl}
              alt="Generiertes Mockup"
              className="w-full h-auto"
            />
            {/* Badge für Methode */}
            <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
              {mode === "photoroom" ? "Photoroom" : "KI"}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            <Button variant="outline" size="sm" onClick={handleGenerate}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Neu generieren
            </Button>
            <Button size="sm" onClick={handleDownload}>
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Herunterladen
            </Button>
            {onSaveToGallery && (
              <Button variant="outline" size="sm" onClick={() => onSaveToGallery(mockupUrl!, side)}>
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Speichern
              </Button>
            )}
            {onShare && (
              <Button variant="outline" size="sm" onClick={() => onShare(mockupUrl!)}>
                <Share2 className="w-3.5 h-3.5 mr-1.5" />
                Teilen
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {mode === "photoroom"
              ? "Fotorealistisches Mockup erstellt mit Photoroom Virtual Model."
              : "KI-generiertes Bild basierend auf deinem Design. Farben und Positionen können leicht abweichen."}
          </p>
        </div>
      )}
    </div>
  );
}

export default AiMockupView;

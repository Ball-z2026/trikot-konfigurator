import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Save, Sparkles, Loader2, ChevronLeft, Maximize2, AlertTriangle, Wand2, Palette, RefreshCw, Upload, Image, Mountain, Layers } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { storageUrl } from "@/lib/utils";
import { useLocation } from "wouter";
import { useZoneEditor } from "@/contexts/ZoneEditorContext";
import { getJerseyRules, validateZonesAgainstRules } from "@shared/jerseyRules";
import { SPORT_TYPES } from "@shared/templates";
import { useAuth } from "@/_core/hooks/useAuth";

// ── Zone-Typ ──
interface Zone {
  id: string;
  name: string;
  purpose: string;
  x: number;
  y: number;
  width: number;
  height: number;
  side?: "front" | "back";
  textStyle?: "arc" | "straight";
  arcDegree?: number;
  fontColor?: string;
  outlineColor?: string;
  outlineWidth?: number;
  fontStyle?: "block" | "serif" | "sans" | "script" | "outline" | "shadow";
  fontFamily?: string;
  fontWeight?: "normal" | "bold";
  fontSize?: number;
  enabled?: boolean; // Toggle: Zone mit verwenden oder nicht
}

// ── Extrahierte Farbe aus Muster ──
interface ExtractedColor {
  hex: string;
  percentage: number;
  replacementHex: string; // Kann vom User geändert werden
}

const ZONE_PURPOSES = [
  { value: "logo", label: "Logo / Wappen" },
  { value: "playerName", label: "Spielername" },
  { value: "playerNumber", label: "Spielernummer" },
  { value: "clubName", label: "Vereinsname" },
  { value: "sponsor", label: "Sponsor" },
  { value: "abbreviation", label: "Kürzel" },
  { value: "coordinates", label: "Koordinaten" },
  { value: "hashtag", label: "Hashtag" },
  { value: "custom", label: "Freitext" },
];

// ── Stil-Optionen ──
const DESIGN_STYLES = [
  { value: "modern", label: "Modern / Minimalistisch" },
  { value: "classic", label: "Klassisch / Traditionell" },
  { value: "bold", label: "Mutig / Auffällig" },
  { value: "gradient", label: "Farbverlauf" },
  { value: "geometric", label: "Geometrisch" },
  { value: "stripes", label: "Streifen" },
  { value: "retro", label: "Retro / Vintage" },
];

// ── Sublimation-Bereiche ──
const SUBLIMATION_AREAS = [
  { id: "body_front", label: "Körper Vorne", defaultEnabled: true },
  { id: "body_back", label: "Körper Hinten", defaultEnabled: true },
  { id: "sleeve_left", label: "Ärmel Links", defaultEnabled: true },
  { id: "sleeve_right", label: "Ärmel Rechts", defaultEnabled: true },
  { id: "collar", label: "Kragen", defaultEnabled: false },
  { id: "cuff_left", label: "Bündchen Links", defaultEnabled: false },
  { id: "cuff_right", label: "Bündchen Rechts", defaultEnabled: false },
];

export default function KiDesign() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { openEditor, registerSaveCallback, registerDiscardCallback } = useZoneEditor();
  const utils = trpc.useUtils();

  // ── State ──
  const [step, setStep] = useState<"configure" | "generate" | "edit" | "save">("configure");
  const [generating, setGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [visibility, setVisibility] = useState<"private" | "team" | "department" | "org">("team");
  const [saving, setSaving] = useState(false);
  const [selectedSport, setSelectedSport] = useState<string>("");
  const [designStyle, setDesignStyle] = useState<string>("modern");
  const [primaryColor, setPrimaryColor] = useState<string>("#1e40af");
  const [secondaryColor, setSecondaryColor] = useState<string>("#ffffff");
  const [accentColor, setAccentColor] = useState<string>("#ef4444");
  const [clubName, setClubName] = useState<string>("");
  const [additionalNotes, setAdditionalNotes] = useState<string>("");
  const [addingZone, setAddingZone] = useState(false);
  const [newZoneName, setNewZoneName] = useState("");
  const [newZonePurpose, setNewZonePurpose] = useState("logo");
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  // ── Vereins-Integration State ──
  const [useClubColors, setUseClubColors] = useState(false);
  const [useClubLogo, setUseClubLogo] = useState(true);
  const [useClubFont, setUseClubFont] = useState(true);
  const [useHashtag, setUseHashtag] = useState(false);
  const [useCoordinates, setUseCoordinates] = useState(false);

  // ── Wahrzeichen-Upload State ──
  const [landmarkImage, setLandmarkImage] = useState<string | null>(null);
  const [landmarkSilhouette, setLandmarkSilhouette] = useState<string | null>(null);
  const [extractingSilhouette, setExtractingSilhouette] = useState(false);
  const [useLandmark, setUseLandmark] = useState(false);

  // ── Muster-Upload State ──
  const [patternImage, setPatternImage] = useState<string | null>(null);
  const [patternColors, setPatternColors] = useState<ExtractedColor[]>([]);
  const [extractingColors, setExtractingColors] = useState(false);
  const [usePattern, setUsePattern] = useState(false);

  // ── Sublimation-Bereiche State ──
  const [printMethod, setPrintMethod] = useState<"dtf" | "sublimation">("sublimation");
  const [sublimationAreas, setSublimationAreas] = useState<Record<string, boolean>>(
    Object.fromEntries(SUBLIMATION_AREAS.map(a => [a.id, a.defaultEnabled]))
  );

  // Drag & Drop State
  const [draggingZone, setDraggingZone] = useState<string | null>(null);
  const [resizingZone, setResizingZone] = useState<string | null>(null);
  const dragStateRef = useRef<{
    dragging: string | null;
    resizing: string | null;
    startX: number;
    startY: number;
    zoneX: number;
    zoneY: number;
    zoneW: number;
    zoneH: number;
  }>({ dragging: null, resizing: null, startX: 0, startY: 0, zoneX: 0, zoneY: 0, zoneW: 0, zoneH: 0 });
  const liveDragPosRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const rafRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // tRPC Mutations & Queries
  const analyzeImage = trpc.designTemplate.analyzeImage.useMutation();
  const createTemplate = trpc.designTemplate.create.useMutation();
  const generateAiMockup = trpc.mockup.generateAi.useMutation();
  const removeBackgroundMut = trpc.mockup.removeBackground.useMutation();

  // Membership für orgId / deptId
  const { data: memberships } = trpc.membership.mine.useQuery();
  const orgId = memberships?.[0]?.orgId || 0;
  const deptId = memberships?.[0]?.departmentId || 0;

  // Vereinsdaten laden
  const { data: orgData } = trpc.org.getById.useQuery(
    { id: orgId },
    { enabled: orgId > 0 }
  );
  const { data: defaultLogo } = trpc.orgLogo.getDefault.useQuery(
    { orgId },
    { enabled: orgId > 0 }
  );
  const { data: defaultFont } = trpc.deptFont.getDefault.useQuery(
    { departmentId: deptId },
    { enabled: deptId > 0 }
  );

  // ── Vereinsfarben automatisch übernehmen wenn Toggle aktiv ──
  useEffect(() => {
    if (useClubColors && orgData) {
      if (orgData.primaryColor) setPrimaryColor(orgData.primaryColor);
      if (orgData.secondaryColor) setSecondaryColor(orgData.secondaryColor);
    }
  }, [useClubColors, orgData]);

  // ── Vereinsname automatisch setzen ──
  useEffect(() => {
    if (orgData?.jerseyName && !clubName) {
      setClubName(orgData.jerseyName);
    } else if (orgData?.name && !clubName) {
      setClubName(orgData.name);
    }
  }, [orgData]);

  // ── Verbandsregeln für Prompt ──
  const rules = selectedSport ? getJerseyRules(selectedSport as any, "amateur") : null;

  // ── Wahrzeichen-Upload Handler ──
  const handleLandmarkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setLandmarkImage(dataUrl);
      setUseLandmark(true);
      // Automatisch Silhouette extrahieren
      setExtractingSilhouette(true);
      try {
        // Upload und Freistellen
        const base64 = dataUrl.split(",")[1];
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: base64, filename: file.name, mimeType: file.type }),
        });
        const uploadData = await uploadRes.json();
        if (uploadData.url) {
          const fullUrl = uploadData.url.startsWith("http") ? uploadData.url : `${window.location.origin}${storageUrl(uploadData.url) || uploadData.url}`;
          const result = await removeBackgroundMut.mutateAsync({ imageUrl: fullUrl });
          setLandmarkSilhouette(result.url);
          toast.success("Silhouette erkannt!");
        }
      } catch (err: any) {
        toast.error("Silhouetten-Erkennung fehlgeschlagen: " + (err.message || "Unbekannter Fehler"));
      } finally {
        setExtractingSilhouette(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // ── Muster-Upload Handler mit Farbextraktion ──
  const handlePatternUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setPatternImage(dataUrl);
      setUsePattern(true);
      setExtractingColors(true);
      try {
        // Farben aus dem Bild extrahieren via Canvas
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          canvas.width = Math.min(img.width, 200);
          canvas.height = Math.min(img.height, 200);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const pixels = imageData.data;
          
          // Farben zählen (quantisiert auf 16er-Schritte)
          const colorMap = new Map<string, number>();
          const totalPixels = pixels.length / 4;
          for (let i = 0; i < pixels.length; i += 4) {
            const r = Math.round(pixels[i] / 16) * 16;
            const g = Math.round(pixels[i + 1] / 16) * 16;
            const b = Math.round(pixels[i + 2] / 16) * 16;
            const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
            colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
          }
          
          // Top-Farben sortieren und filtern (mind. 3% Anteil)
          const sorted = [...colorMap.entries()]
            .sort((a, b) => b[1] - a[1])
            .filter(([, count]) => count / totalPixels > 0.03)
            .slice(0, 8);
          
          const extracted: ExtractedColor[] = sorted.map(([hex, count]) => ({
            hex,
            percentage: Math.round((count / totalPixels) * 100),
            replacementHex: hex, // Initial gleich
          }));
          
          setPatternColors(extracted);
          setExtractingColors(false);
          toast.success(`${extracted.length} Farben im Muster erkannt!`);
        };
        img.src = dataUrl;
      } catch (err: any) {
        toast.error("Farbextraktion fehlgeschlagen");
        setExtractingColors(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // ── KI-Design generieren ──
  const handleGenerate = async () => {
    if (!selectedSport) { toast.error("Bitte eine Sportart wählen"); return; }

    setGenerating(true);
    try {
      const sportInfo = SPORT_TYPES.find(s => s.id === selectedSport);
      const styleInfo = DESIGN_STYLES.find(s => s.value === designStyle);
      
      // Verbandsregeln in den Prompt einbauen
      let rulesContext = "";
      if (rules) {
        const rulesParts: string[] = [];
        if (rules.number.frontMinHeight) rulesParts.push(`Front number: min ${rules.number.frontMinHeight}cm height`);
        if (rules.number.backMinHeight) rulesParts.push(`Back number: min ${rules.number.backMinHeight}cm height`);
        if (rules.sponsor.maxSponsorsTotal) rulesParts.push(`Max ${rules.sponsor.maxSponsorsTotal} sponsors allowed`);
        if (rules.emblem.heartSideRequired) rulesParts.push(`Club emblem on heart side (required)`);
        if (rulesParts.length > 0) {
          rulesContext = ` The design must comply with ${sportInfo?.name || selectedSport} federation rules: ${rulesParts.join(", ")}.`;
        }
      }

      // Zusätzliche Prompt-Teile basierend auf Optionen
      let extraPrompt = "";
      if (useLandmark && landmarkSilhouette) {
        extraPrompt += " Incorporate a subtle landmark silhouette pattern into the jersey design as a watermark or texture element.";
      }
      if (usePattern && patternColors.length > 0) {
        const colorList = patternColors.map(c => c.replacementHex).join(", ");
        extraPrompt += ` Use a pattern-inspired design with these colors: ${colorList}.`;
      }
      if (printMethod === "sublimation") {
        const activeAreas = SUBLIMATION_AREAS.filter(a => sublimationAreas[a.id]).map(a => a.label).join(", ");
        extraPrompt += ` Full sublimation print covering: ${activeAreas}.`;
        if (sublimationAreas.collar) extraPrompt += " Include printed collar design.";
        if (sublimationAreas.cuff_left || sublimationAreas.cuff_right) extraPrompt += " Include printed cuff/sleeve band design.";
      }
      if (useClubLogo && defaultLogo) {
        extraPrompt += " Include a club crest/emblem on the heart side (left chest).";
      }
      if (useHashtag && orgData?.hashtag) {
        extraPrompt += ` Include the hashtag "${orgData.hashtag}" subtly in the design.`;
      }
      if (useCoordinates && orgData?.latitude && orgData?.longitude) {
        extraPrompt += ` Include subtle geographic coordinates (${orgData.latitude}, ${orgData.longitude}) as a design element.`;
      }

      const prompt = `Professional product photography of a ${sportInfo?.name || selectedSport} jersey (${sportInfo?.description || "sports jersey"}), flat lay on white background. Design style: ${styleInfo?.label || designStyle}. Primary color: ${primaryColor}, secondary color: ${secondaryColor}, accent color: ${accentColor}.${clubName ? ` Club: ${clubName}.` : ""}${additionalNotes ? ` Additional details: ${additionalNotes}.` : ""}${rulesContext}${extraPrompt} The jersey should look like a real professional sports jersey, clean design with proper proportions. Front view, high-end product photography, studio lighting, no wrinkles.`;

      const result = await generateAiMockup.mutateAsync({
        productName: `${sportInfo?.name || selectedSport} Trikot`,
        productType: "trikot",
        colorDescription: `Primary: ${primaryColor}, Secondary: ${secondaryColor}, Accent: ${accentColor}`,
        side: "front",
      });

      if (result.url) {
        setGeneratedImageUrl(result.url);
        toast.success("Trikot-Design generiert! Sie können jetzt Zonen hinzufügen.");
        setStep("generate");
      }
    } catch (error: any) {
      toast.error(error.message || "Design-Generierung fehlgeschlagen");
    } finally {
      setGenerating(false);
    }
  };

  // ── KI-Analyse auf generiertem Bild ──
  const handleAnalyzeGenerated = async () => {
    if (!generatedImageUrl) return;
    setGenerating(true);
    try {
      const fullImageUrl = generatedImageUrl.startsWith("http") ? generatedImageUrl : `${window.location.origin}${storageUrl(generatedImageUrl) || generatedImageUrl}`;
      const result = await analyzeImage.mutateAsync({
        imageUrl: fullImageUrl,
        sport: selectedSport as any || undefined,
        category: "trikot" as any,
      });
      if (result.zones && result.zones.length > 0) {
        const newZones: Zone[] = result.zones.map((z: any, idx: number) => ({
          id: `ai_zone_${Date.now()}_${idx}`,
          name: z.name,
          purpose: z.purpose,
          x: Math.max(0, Math.min(95, z.x)),
          y: Math.max(0, Math.min(95, z.y)),
          width: Math.max(3, Math.min(100 - z.x, z.width)),
          height: Math.max(3, Math.min(100 - z.y, z.height)),
          side: z.side === 'V' ? 'front' as const : z.side === 'R' ? 'back' as const : z.side,
          fontColor: z.fontColor || "#000000",
          fontFamily: useClubFont && defaultFont?.fontFamily ? defaultFont.fontFamily : (z.fontFamily || "Oswald"),
          fontWeight: z.fontWeight || "bold",
          fontSize: z.fontSize || 85,
          enabled: true,
        }));
        setZones(newZones);
        toast.success(`${newZones.length} Zonen erkannt!`);
        setStep("edit");
      } else {
        toast.info("Keine Zonen erkannt – fügen Sie manuell Zonen hinzu.");
        setStep("edit");
      }
    } catch (error: any) {
      toast.error(error.message || "Analyse fehlgeschlagen");
      setStep("edit");
    } finally {
      setGenerating(false);
    }
  };

  // ── Fullscreen-Editor öffnen ──
  const openFullscreenEditor = useCallback(() => {
    const enabledZones = zones.filter(z => z.enabled !== false);
    const snapshot = JSON.parse(JSON.stringify(enabledZones));
    registerSaveCallback((savedZones) => setZones(savedZones));
    registerDiscardCallback(() => setZones(snapshot));
    const displayImageUrl = generatedImageUrl ? (generatedImageUrl.startsWith("http") ? generatedImageUrl : (storageUrl(generatedImageUrl) || generatedImageUrl)) : undefined;
    openEditor({
      zones: JSON.parse(JSON.stringify(enabledZones)),
      selectedProductId: null,
      selectedPartId: null,
      orgId,
      sport: selectedSport,
      category: "trikot",
      snapshot,
      templateImageUrl: displayImageUrl,
      jerseyColor: primaryColor,
    });
    setLocation('/designer/zone-editor');
  }, [zones, orgId, selectedSport, primaryColor, openEditor, registerSaveCallback, registerDiscardCallback, setLocation, generatedImageUrl]);

  // ── Speichern ──
  const handleSave = async () => {
    if (!templateName.trim()) { toast.error("Bitte einen Namen eingeben"); return; }
    if (!generatedImageUrl) { toast.error("Bitte zuerst ein Design generieren"); return; }
    if (!selectedSport) { toast.error("Bitte eine Sportart wählen"); return; }

    const enabledZones = zones.filter(z => z.enabled !== false);
    setSaving(true);
    try {
      await createTemplate.mutateAsync({
        name: templateName,
        imageUrl: generatedImageUrl,
        storageKey: undefined,
        positionsConfig: enabledZones.length > 0 ? { productId: null, zones: enabledZones, jerseyColor: primaryColor } : undefined,
        orgId,
        departmentId: undefined,
        teamId: undefined,
        sport: selectedSport as any,
        category: "trikot" as any,
        visibility,
        productId: undefined,
        zones: enabledZones.length > 0 ? enabledZones.map(z => ({
          name: z.name,
          purpose: z.purpose,
          x: z.x,
          y: z.y,
          width: z.width,
          height: z.height,
          side: z.side || "front",
          fontColor: z.fontColor,
          fontWeight: z.fontWeight,
          fontSize: z.fontSize,
          fontFamily: z.fontFamily,
          textStyle: z.textStyle as "arc" | "straight" | undefined,
          arcDegree: z.arcDegree,
          outlineColor: z.outlineColor,
          outlineWidth: z.outlineWidth,
        })) : undefined,
      });
      toast.success("KI-Design als Vorlage gespeichert!");
      utils.designTemplate.list.invalidate();
      setLocation('/designer/products');
    } catch (error: any) {
      toast.error(error.message || "Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  // ── Zone hinzufügen ──
  const addZone = () => {
    if (!newZoneName.trim()) { toast.error("Bitte einen Namen eingeben"); return; }
    setZones([...zones, {
      id: `zone_${Date.now()}`,
      name: newZoneName,
      purpose: newZonePurpose,
      x: 30, y: 30, width: 20, height: 15,
      fontFamily: useClubFont && defaultFont?.fontFamily ? defaultFont.fontFamily : "Oswald",
      enabled: true,
    }]);
    setNewZoneName("");
    setAddingZone(false);
  };

  // ── Drag & Drop ──
  const getRelativePosition = useCallback((e: React.PointerEvent | PointerEvent, canvasEl: HTMLDivElement) => {
    const rect = canvasEl.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 };
  }, []);

  const handleZonePointerDown = useCallback((e: React.PointerEvent, zoneId: string, isResize = false) => {
    e.preventDefault();
    e.stopPropagation();
    const zone = zones.find((z) => z.id === zoneId);
    if (!zone) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    if (e.pointerType === "touch" && navigator.vibrate) navigator.vibrate(15);
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const pos = getRelativePosition(e, canvasEl);
    dragStateRef.current = {
      dragging: isResize ? null : zoneId,
      resizing: isResize ? zoneId : null,
      startX: pos.x, startY: pos.y,
      zoneX: zone.x, zoneY: zone.y, zoneW: zone.width, zoneH: zone.height,
    };
    if (isResize) setResizingZone(zoneId);
    else setDraggingZone(zoneId);
    setSelectedZoneId(zoneId);
  }, [zones, getRelativePosition]);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const ds = dragStateRef.current;
      if (!ds.dragging && !ds.resizing) return;
      const canvasEl = canvasRef.current;
      if (!canvasEl) return;
      const rect = canvasEl.getBoundingClientRect();
      const posX = ((e.clientX - rect.left) / rect.width) * 100;
      const posY = ((e.clientY - rect.top) / rect.height) * 100;
      const dx = posX - ds.startX;
      const dy = posY - ds.startY;
      if (ds.dragging) {
        liveDragPosRef.current = {
          x: Math.max(0, Math.min(100 - ds.zoneW, ds.zoneX + dx)),
          y: Math.max(0, Math.min(100 - ds.zoneH, ds.zoneY + dy)),
          w: ds.zoneW, h: ds.zoneH,
        };
      }
      if (ds.resizing) {
        liveDragPosRef.current = {
          x: ds.zoneX, y: ds.zoneY,
          w: Math.max(3, Math.min(100 - ds.zoneX, ds.zoneW + dx)),
          h: Math.max(3, Math.min(100 - ds.zoneY, ds.zoneH + dy)),
        };
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const targetId = ds.dragging || ds.resizing;
        if (!targetId || !liveDragPosRef.current || !canvasEl) return;
        const el = canvasEl.querySelector(`[data-zone-id="${targetId}"]`) as HTMLElement;
        if (el) {
          el.style.left = `${liveDragPosRef.current.x}%`;
          el.style.top = `${liveDragPosRef.current.y}%`;
          el.style.width = `${liveDragPosRef.current.w}%`;
          el.style.height = `${liveDragPosRef.current.h}%`;
        }
      });
    };
    const handlePointerUp = () => {
      const ds = dragStateRef.current;
      const targetId = ds.dragging || ds.resizing;
      if (targetId && liveDragPosRef.current) {
        const pos = liveDragPosRef.current;
        if (ds.dragging) setZones((prev) => prev.map((z) => z.id === targetId ? { ...z, x: pos.x, y: pos.y } : z));
        if (ds.resizing) setZones((prev) => prev.map((z) => z.id === targetId ? { ...z, width: pos.w, height: pos.h } : z));
      }
      liveDragPosRef.current = null;
      dragStateRef.current = { dragging: null, resizing: null, startX: 0, startY: 0, zoneX: 0, zoneY: 0, zoneW: 0, zoneH: 0 };
      setDraggingZone(null);
      setResizingZone(null);
    };
    if (draggingZone || resizingZone) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerUp);
      document.body.style.userSelect = 'none';
      return () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("pointercancel", handlePointerUp);
        document.body.style.userSelect = '';
      };
    }
  }, [draggingZone, resizingZone]);

  // ── Verbandsregeln-Validierung ──
  const validationResult = rules && zones.length > 0
    ? validateZonesAgainstRules(zones as any, rules)
    : null;

  // ── Angezeigtes Bild ──
  const displayImage = generatedImageUrl ? (storageUrl(generatedImageUrl) || generatedImageUrl) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setLocation('/designer/products')}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Zurück
            </Button>
            <div className="h-6 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <Wand2 className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">KI-Design</h1>
                <p className="text-xs text-muted-foreground">Neues Trikot-Design generieren (Verbandsregeln beachtet)</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(step === "edit" || step === "save") && zones.filter(z => z.enabled !== false).length > 0 && (
              <Button size="sm" variant="outline" onClick={openFullscreenEditor}>
                <Maximize2 className="w-4 h-4 mr-1" />
                Vollbild-Editor
              </Button>
            )}
            {(step === "edit" || step === "save") && (
              <Button size="sm" onClick={handleSave} disabled={saving || !templateName.trim() || !selectedSport}>
                <Save className="w-4 h-4 mr-1" />
                {saving ? "Speichert..." : "Vorlage speichern"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stepper */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto">
          {[
            { key: "configure", label: "1. Konfigurieren" },
            { key: "generate", label: "2. Generieren" },
            { key: "edit", label: "3. Zonen setzen" },
            { key: "save", label: "4. Speichern" },
          ].map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                step === s.key ? "bg-purple-600 text-white" :
                ["configure", "generate", "edit", "save"].indexOf(step) > i ? "bg-green-100 text-green-700" :
                "bg-gray-100 text-gray-500"
              }`}>
                {s.label}
              </div>
              {i < 3 && <div className="w-4 h-px bg-gray-300" />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Linke Spalte: Vorschau / Generiertes Bild */}
          <div className="lg:col-span-2 space-y-4">
            {!generatedImageUrl ? (
              /* Konfigurations-Panel */
              <div className="bg-white rounded-xl border p-6 space-y-6">
                <div className="text-center mb-4">
                  <Wand2 className="w-10 h-10 mx-auto mb-3 text-purple-500" />
                  <h2 className="text-xl font-semibold">Neues Trikot-Design erstellen</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Konfigurieren Sie Ihr Wunschtrikot und lassen Sie die KI ein Design generieren.
                  </p>
                </div>

                {/* ═══ VEREINS-INTEGRATION ═══ */}
                {orgData && (
                  <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-blue-600" />
                      </div>
                      <h3 className="text-sm font-semibold text-blue-800">Vereinsdaten: {orgData.name}</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Vereinsfarben Toggle */}
                      <div className="flex items-center justify-between p-2 bg-white rounded border">
                        <div className="flex items-center gap-2">
                          <Palette className="w-4 h-4 text-blue-600" />
                          <span className="text-sm">Vereinsfarben übernehmen</span>
                        </div>
                        <Switch checked={useClubColors} onCheckedChange={setUseClubColors} />
                      </div>

                      {/* Vereinswappen Toggle */}
                      {defaultLogo && (
                        <div className="flex items-center justify-between p-2 bg-white rounded border">
                          <div className="flex items-center gap-2">
                            <img src={storageUrl(defaultLogo.imageUrl) || defaultLogo.imageUrl} alt="Wappen" className="w-5 h-5 object-contain" />
                            <span className="text-sm">Vereinswappen</span>
                          </div>
                          <Switch checked={useClubLogo} onCheckedChange={setUseClubLogo} />
                        </div>
                      )}

                      {/* Schrift Toggle */}
                      {defaultFont && (
                        <div className="flex items-center justify-between p-2 bg-white rounded border">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-blue-600">Aa</span>
                            <span className="text-sm">Schrift: {defaultFont.fontFamily}</span>
                          </div>
                          <Switch checked={useClubFont} onCheckedChange={setUseClubFont} />
                        </div>
                      )}

                      {/* Hashtag Toggle */}
                      {orgData.hashtag && (
                        <div className="flex items-center justify-between p-2 bg-white rounded border">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-blue-600">#</span>
                            <span className="text-sm truncate">{orgData.hashtag}</span>
                          </div>
                          <Switch checked={useHashtag} onCheckedChange={setUseHashtag} />
                        </div>
                      )}

                      {/* Koordinaten Toggle */}
                      {orgData.latitude && orgData.longitude && (
                        <div className="flex items-center justify-between p-2 bg-white rounded border">
                          <div className="flex items-center gap-2">
                            <Mountain className="w-4 h-4 text-blue-600" />
                            <span className="text-sm">Koordinaten</span>
                          </div>
                          <Switch checked={useCoordinates} onCheckedChange={setUseCoordinates} />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ═══ DRUCKVERFAHREN ═══ */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold uppercase text-gray-500">Druckverfahren</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setPrintMethod("sublimation")}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        printMethod === "sublimation"
                          ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                          : "border-gray-200 hover:border-gray-300 text-gray-600"
                      }`}
                    >
                      <Layers className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-sm">Sublimation</span>
                    </button>
                    <button
                      onClick={() => setPrintMethod("dtf")}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        printMethod === "dtf"
                          ? "border-orange-500 bg-orange-50 text-orange-700 font-medium"
                          : "border-gray-200 hover:border-gray-300 text-gray-600"
                      }`}
                    >
                      <Image className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-sm">DTF</span>
                    </button>
                  </div>
                </div>

                {/* ═══ SUBLIMATION-BEREICHE ═══ */}
                {printMethod === "sublimation" && (
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold uppercase text-gray-500">Bedruckbare Bereiche</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {SUBLIMATION_AREAS.map((area) => (
                        <div key={area.id} className="flex items-center justify-between p-2 bg-white rounded border">
                          <span className="text-xs">{area.label}</span>
                          <Switch
                            checked={sublimationAreas[area.id]}
                            onCheckedChange={(checked) => setSublimationAreas(prev => ({ ...prev, [area.id]: checked }))}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ═══ FARBEN ═══ */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold uppercase text-gray-500">Farbschema</Label>
                  {useClubColors && orgData?.primaryColor && (
                    <p className="text-xs text-blue-600">Vereinsfarben aktiv – Farben werden automatisch übernommen</p>
                  )}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Hauptfarbe</Label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={primaryColor} onChange={(e) => { setPrimaryColor(e.target.value); if (useClubColors) setUseClubColors(false); }} className="w-10 h-10 rounded cursor-pointer border" />
                        <span className="text-xs text-muted-foreground">{primaryColor}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Zweitfarbe</Label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={secondaryColor} onChange={(e) => { setSecondaryColor(e.target.value); if (useClubColors) setUseClubColors(false); }} className="w-10 h-10 rounded cursor-pointer border" />
                        <span className="text-xs text-muted-foreground">{secondaryColor}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Akzentfarbe</Label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border" />
                        <span className="text-xs text-muted-foreground">{accentColor}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ═══ DESIGN-STIL ═══ */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold uppercase text-gray-500">Design-Stil</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {DESIGN_STYLES.map((style) => (
                      <button
                        key={style.value}
                        onClick={() => setDesignStyle(style.value)}
                        className={`p-3 rounded-lg border text-sm text-center transition-all ${
                          designStyle === style.value
                            ? "border-purple-500 bg-purple-50 text-purple-700 font-medium"
                            : "border-gray-200 hover:border-gray-300 text-gray-600"
                        }`}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ═══ WAHRZEICHEN-UPLOAD ═══ */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold uppercase text-gray-500">Wahrzeichen (optional)</Label>
                  <p className="text-xs text-muted-foreground">Laden Sie ein Foto eines Wahrzeichens hoch – die Silhouette wird automatisch erkannt und ins Design eingebaut.</p>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-gray-300 hover:border-purple-400 hover:bg-purple-50 cursor-pointer transition-all">
                      <Mountain className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Foto hochladen</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleLandmarkUpload} />
                    </label>
                    {landmarkImage && (
                      <div className="flex items-center gap-2">
                        <img src={landmarkImage} alt="Wahrzeichen" className="w-12 h-12 object-cover rounded border" />
                        {extractingSilhouette && <Loader2 className="w-4 h-4 animate-spin text-purple-500" />}
                        {landmarkSilhouette && (
                          <>
                            <span className="text-xs text-green-600">Silhouette erkannt</span>
                            <Switch checked={useLandmark} onCheckedChange={setUseLandmark} />
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* ═══ MUSTER-UPLOAD ═══ */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold uppercase text-gray-500">Muster-Vorlage (optional)</Label>
                  <p className="text-xs text-muted-foreground">Laden Sie ein Foto mit einem Muster hoch – jede Farbe wird erkannt und kann einzeln geändert werden.</p>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-gray-300 hover:border-purple-400 hover:bg-purple-50 cursor-pointer transition-all">
                      <Palette className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Muster hochladen</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handlePatternUpload} />
                    </label>
                    {patternImage && (
                      <div className="flex items-center gap-2">
                        <img src={patternImage} alt="Muster" className="w-12 h-12 object-cover rounded border" />
                        {extractingColors && <Loader2 className="w-4 h-4 animate-spin text-purple-500" />}
                        {patternColors.length > 0 && <Switch checked={usePattern} onCheckedChange={setUsePattern} />}
                      </div>
                    )}
                  </div>
                  {/* Farb-Picker pro extrahierte Farbe */}
                  {patternColors.length > 0 && usePattern && (
                    <div className="bg-white rounded-lg border p-3 space-y-2">
                      <p className="text-xs font-medium text-gray-600">Farben im Muster (klicken zum Ändern):</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {patternColors.map((color, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 rounded border bg-gray-50">
                            <div className="w-6 h-6 rounded border" style={{ backgroundColor: color.hex }} title={`Original: ${color.hex}`} />
                            <span className="text-xs text-gray-400">→</span>
                            <input
                              type="color"
                              value={color.replacementHex}
                              onChange={(e) => {
                                setPatternColors(prev => prev.map((c, i) => i === idx ? { ...c, replacementHex: e.target.value } : c));
                              }}
                              className="w-6 h-6 rounded cursor-pointer border-0"
                            />
                            <span className="text-[10px] text-gray-500">{color.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Vereinsname */}
                <div className="space-y-2">
                  <Label>Vereinsname (optional)</Label>
                  <Input
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    placeholder="z.B. FC Musterstadt"
                  />
                </div>

                {/* Zusätzliche Hinweise */}
                <div className="space-y-2">
                  <Label>Zusätzliche Wünsche (optional)</Label>
                  <Textarea
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="z.B. Diagonale Streifen, V-Ausschnitt, Raglan-Ärmel..."
                    rows={3}
                  />
                </div>

                {/* Verbandsregeln-Info */}
                {rules && (
                  <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
                    <h4 className="text-sm font-semibold text-purple-800 mb-2">Verbandsregeln ({SPORT_TYPES.find(s => s.id === selectedSport)?.name})</h4>
                    <ul className="text-xs text-purple-700 space-y-1">
                      {rules.number.backMinHeight > 0 && <li>• Rückennummer: mind. {rules.number.backMinHeight}cm Höhe</li>}
                      {rules.number.frontMinHeight && <li>• Brustnummer: mind. {rules.number.frontMinHeight}cm Höhe</li>}
                      {rules.sponsor.maxSponsorsTotal && <li>• Max. {rules.sponsor.maxSponsorsTotal} Sponsoren</li>}
                      {rules.emblem.heartSideRequired && <li>• Vereinswappen: Herzseite (Pflicht)</li>}
                      {rules.emblem.chestMaxAreaCm2 && <li>• Wappen max. {rules.emblem.chestMaxAreaCm2}cm² Fläche</li>}
                    </ul>
                  </div>
                )}

                {/* Generieren-Button */}
                <Button
                  size="lg"
                  onClick={handleGenerate}
                  disabled={generating || !selectedSport}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {generating ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Design wird generiert...</>
                  ) : (
                    <><Wand2 className="w-4 h-4 mr-2" />Trikot-Design generieren</>
                  )}
                </Button>
              </div>
            ) : (
              /* Generiertes Bild mit Zonen */
              <div className="bg-white rounded-xl border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Generiertes Design</Label>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setGeneratedImageUrl(null); setZones([]); setStep("configure"); }}>
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Neu generieren
                    </Button>
                    {step === "generate" && (
                      <Button size="sm" variant="outline" onClick={handleAnalyzeGenerated} disabled={generating}>
                        {generating ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                        Zonen erkennen
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => { setStep("edit"); setAddingZone(true); }}>
                      <Plus className="w-3 h-3 mr-1" />
                      Zone manuell
                    </Button>
                  </div>
                </div>

                {/* Canvas mit Bild und Zonen */}
                <div
                  ref={canvasRef}
                  className="relative border rounded-lg overflow-hidden select-none bg-gray-100"
                  style={{ touchAction: (draggingZone || resizingZone) ? 'none' : 'auto' }}
                >
                  <img
                    src={displayImage || ""}
                    alt="Generiertes Trikot-Design"
                    className="w-full h-auto"
                    draggable={false}
                  />
                  {/* Zonen-Overlays */}
                  {zones.filter(z => z.enabled !== false).map((zone) => {
                    const isSelected = selectedZoneId === zone.id;
                    const purposeColors: Record<string, string> = {
                      logo: "border-blue-500 bg-blue-500/20",
                      playerName: "border-green-500 bg-green-500/20",
                      playerNumber: "border-red-500 bg-red-500/20",
                      clubName: "border-purple-500 bg-purple-500/20",
                      sponsor: "border-yellow-500 bg-yellow-500/20",
                      abbreviation: "border-pink-500 bg-pink-500/20",
                      coordinates: "border-teal-500 bg-teal-500/20",
                      hashtag: "border-indigo-500 bg-indigo-500/20",
                      custom: "border-gray-500 bg-gray-500/20",
                    };
                    return (
                      <div
                        key={zone.id}
                        data-zone-id={zone.id}
                        className={`absolute border-2 ${purposeColors[zone.purpose] || "border-gray-400 bg-gray-400/20"} ${isSelected ? "ring-2 ring-offset-1 ring-purple-400" : ""} cursor-move rounded-sm`}
                        style={{ left: `${zone.x}%`, top: `${zone.y}%`, width: `${zone.width}%`, height: `${zone.height}%` }}
                        onPointerDown={(e) => handleZonePointerDown(e, zone.id)}
                      >
                        <span className="absolute -top-5 left-0 text-[10px] font-medium bg-white/90 px-1 rounded truncate max-w-full">
                          {zone.name}
                        </span>
                        <div
                          className="absolute bottom-0 right-0 w-3 h-3 bg-white border border-gray-400 cursor-se-resize rounded-sm"
                          onPointerDown={(e) => { e.stopPropagation(); handleZonePointerDown(e, zone.id, true); }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Rechte Spalte: Einstellungen */}
          <div className="space-y-4">
            {/* Metadaten */}
            <div className="bg-white rounded-xl border p-4 space-y-4">
              <h3 className="font-semibold text-sm uppercase text-gray-500">Vorlage-Details</h3>
              <div className="space-y-2">
                <Label>Vorlagenname *</Label>
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="z.B. KI-Design Heimtrikot 2025"
                />
              </div>
              <div className="space-y-2">
                <Label>Sportart *</Label>
                <Select value={selectedSport} onValueChange={setSelectedSport}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sportart wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SPORT_TYPES.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.icon} {s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sichtbarkeit</Label>
                <Select value={visibility} onValueChange={(v: any) => setVisibility(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Nur ich</SelectItem>
                    <SelectItem value="team">Meine Mannschaft</SelectItem>
                    <SelectItem value="department">Meine Sparte</SelectItem>
                    <SelectItem value="org">Gesamter Verein</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Verbandsregeln-Hinweise */}
            {validationResult && validationResult.length > 0 && (
              <div className="bg-white rounded-xl border p-4 space-y-2">
                <h3 className="font-semibold text-sm uppercase text-gray-500">Verbandsregeln</h3>
                {validationResult.filter((v: any) => v.severity === "error").map((e: any, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-red-700 bg-red-50 p-2 rounded">
                    <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                    <span>{e.message}</span>
                  </div>
                ))}
                {validationResult.filter((v: any) => v.severity === "warning").map((w: any, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-yellow-700 bg-yellow-50 p-2 rounded">
                    <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                    <span>{w.message}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ═══ ZONEN-LISTE MIT TOGGLE ═══ */}
            {zones.length > 0 && (
              <div className="bg-white rounded-xl border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm uppercase text-gray-500">Zonen ({zones.filter(z => z.enabled !== false).length}/{zones.length})</h3>
                  <Button size="sm" variant="outline" onClick={() => setAddingZone(true)}>
                    <Plus className="w-3 h-3 mr-1" />
                    Zone
                  </Button>
                </div>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {zones.map((zone) => (
                    <div
                      key={zone.id}
                      className={`flex items-center justify-between p-2 rounded text-sm cursor-pointer hover:bg-gray-50 ${selectedZoneId === zone.id ? "bg-purple-50 border border-purple-200" : ""} ${zone.enabled === false ? "opacity-50" : ""}`}
                      onClick={() => setSelectedZoneId(zone.id)}
                    >
                      <div className="flex items-center gap-2">
                        {/* Toggle pro Zone */}
                        <Switch
                          checked={zone.enabled !== false}
                          onCheckedChange={(checked) => setZones(prev => prev.map(z => z.id === zone.id ? { ...z, enabled: checked } : z))}
                          className="scale-75"
                        />
                        <div className={`w-2 h-2 rounded-full ${
                          zone.purpose === "logo" ? "bg-blue-500" :
                          zone.purpose === "playerNumber" ? "bg-red-500" :
                          zone.purpose === "playerName" ? "bg-green-500" :
                          zone.purpose === "clubName" ? "bg-purple-500" :
                          zone.purpose === "sponsor" ? "bg-yellow-500" :
                          zone.purpose === "coordinates" ? "bg-teal-500" :
                          zone.purpose === "hashtag" ? "bg-indigo-500" :
                          "bg-gray-500"
                        }`} />
                        <span className="truncate text-xs">{zone.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-gray-400">{Math.round(zone.x)},{Math.round(zone.y)}</span>
                        <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={(e) => { e.stopPropagation(); setZones(zones.filter(z => z.id !== zone.id)); }}>
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* KI-Design-Info */}
            <div className="bg-purple-50 rounded-xl border border-purple-200 p-4">
              <h3 className="font-semibold text-sm text-purple-800 mb-2">KI-Design</h3>
              <ul className="text-xs text-purple-700 space-y-1">
                <li>• Komplett neues Trikot-Design per KI</li>
                <li>• Verbandsregeln werden automatisch beachtet</li>
                <li>• Vereinsdaten (Wappen, Farben, Schrift) optional</li>
                <li>• Wahrzeichen-Silhouette als Design-Element</li>
                <li>• Muster-Upload mit Farb-Anpassung</li>
                <li>• Sublimation: Kragen & Bündchen bedruckbar</li>
                <li>• Zonen einzeln ein-/ausschaltbar</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Zone hinzufügen Dialog */}
      <Dialog open={addingZone} onOpenChange={setAddingZone}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zone hinzufügen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Zonenname</Label>
              <Input value={newZoneName} onChange={(e) => setNewZoneName(e.target.value)} placeholder="z.B. Vereinswappen, Rückennummer..." />
            </div>
            <div className="space-y-2">
              <Label>Zonentyp</Label>
              <Select value={newZonePurpose} onValueChange={setNewZonePurpose}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ZONE_PURPOSES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddingZone(false)}>Abbrechen</Button>
            <Button onClick={addZone}>Hinzufügen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

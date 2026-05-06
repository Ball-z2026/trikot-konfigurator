import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Upload, Plus, Trash2, Save, Sparkles, Loader2, ChevronLeft, Maximize2, Ruler, AlertTriangle, Palette } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { storageUrl } from "@/lib/utils";
import { useLocation } from "wouter";
import { useZoneEditor } from "@/contexts/ZoneEditorContext";
import { getJerseyRules, validateZonesAgainstRules } from "@shared/jerseyRules";
import { SPORT_TYPES } from "@shared/templates";
import { useAuth } from "@/_core/hooks/useAuth";

// ── Font-Mapping ──
const FONT_STYLE_MAP: Record<string, string> = {
  block: "Oswald",
  sans: "Montserrat",
  serif: "Playfair Display",
  script: "Dancing Script",
  outline: "Bebas Neue",
  shadow: "Anton",
};

function inferFontStyle(fontFamily: string): "block" | "serif" | "sans" | "script" | "outline" | "shadow" {
  const lower = fontFamily.toLowerCase();
  if (["oswald", "anton", "bebas neue", "teko", "barlow condensed", "black ops one", "bungee", "russo one", "righteous", "passion one"].some(f => lower.includes(f))) return "block";
  if (["playfair", "merriweather", "lora", "crimson"].some(f => lower.includes(f))) return "serif";
  if (["dancing script", "pacifico", "great vibes", "satisfy"].some(f => lower.includes(f))) return "script";
  if (["montserrat", "poppins", "inter", "roboto", "open sans", "lato"].some(f => lower.includes(f))) return "sans";
  return "block";
}

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
  rotation?: number;
}

const ZONE_PURPOSES = [
  { value: "logo", label: "Logo / Wappen" },
  { value: "playerName", label: "Spielername" },
  { value: "playerNumber", label: "Spielernummer" },
  { value: "clubName", label: "Vereinsname" },
  { value: "sponsor", label: "Sponsor" },
  { value: "abbreviation", label: "Kürzel" },
  { value: "custom", label: "Freitext" },
];

// ── Hilfsfunktion: Bild weiß machen ──
function makeWhiteTemplate(imageUrl: string): Promise<{ url: string; key: string } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = async () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 0) {
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 255;
        }
      }
      ctx.putImageData(imageData, 0, 0);
      canvas.toBlob(async (blob) => {
        if (!blob) { resolve(null); return; }
        const reader = new FileReader();
        reader.onload = async (ev) => {
          const base64 = (ev.target?.result as string).split(",")[1];
          try {
            const response = await fetch("/api/upload", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                fileName: `white-template-${Date.now()}.png`,
                data: base64,
                contentType: "image/png",
              }),
            });
            if (!response.ok) { resolve(null); return; }
            const { url, key } = await response.json();
            resolve({ url, key });
          } catch { resolve(null); }
        };
        reader.readAsDataURL(blob);
      }, "image/png");
    };
    img.onerror = () => resolve(null);
    img.src = imageUrl.startsWith("http") ? imageUrl : (storageUrl(imageUrl) || imageUrl);
  });
}
// ── Hilfsfunktion: Einfärben ───
function colorizeTemplate(imageUrl: string, color: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      ctx.globalCompositeOperation = "source-atop";
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "source-over";
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(null);
    img.src = imageUrl.startsWith("http") ? imageUrl : (storageUrl(imageUrl) || imageUrl);
  });
}
export default function KiAnalyseDtf() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { openEditor, registerSaveCallback, registerDiscardCallback } = useZoneEditor();
  const utils = trpc.useUtils();

  // ── State ──
  const [step, setStep] = useState<"upload" | "analyze" | "edit" | "save">("upload");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageStorageKey, setImageStorageKey] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dpiWarning, setDpiWarning] = useState<string | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [visibility, setVisibility] = useState<"private" | "team" | "department" | "org">("team");
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);
  const [cutoutImageUrl, setCutoutImageUrl] = useState<string | null>(null);
  const [whiteTemplateUrl, setWhiteTemplateUrl] = useState<string | null>(null);
  const [whiteTemplateKey, setWhiteTemplateKey] = useState<string | null>(null);
  const [selectedSport, setSelectedSport] = useState<string>("");
  const [jerseyColor, setJerseyColor] = useState<string>("#ffffff");
  const [colorizedPreviewUrl, setColorizedPreviewUrl] = useState<string | null>(null);
  const [addingZone, setAddingZone] = useState(false);
  const [newZoneName, setNewZoneName] = useState("");
  const [newZonePurpose, setNewZonePurpose] = useState("logo");
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // tRPC Mutations
  const analyzeImage = trpc.designTemplate.analyzeImage.useMutation();
  const removeBackgroundMutation = trpc.mockup.removeBackground.useMutation();
  const createTemplate = trpc.designTemplate.create.useMutation();

  // Membership für orgId
  const { data: memberships } = trpc.membership.mine.useQuery();
  const orgId = memberships?.[0]?.orgId || 0;

  // ── Einfärben bei Farbänderung ──
  useEffect(() => {
    if (!cutoutImageUrl || jerseyColor === "#ffffff") {
      setColorizedPreviewUrl(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      colorizeTemplate(cutoutImageUrl, jerseyColor).then((result) => {
        if (!cancelled) setColorizedPreviewUrl(result);
      });
    }, 150);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [cutoutImageUrl, jerseyColor]);

  // ── Google Fonts laden ──
  const fontFamiliesKey = zones.map(z => z.fontFamily || FONT_STYLE_MAP[z.fontStyle || "block"] || "").sort().join(",");
  useEffect(() => {
    const families = new Set<string>();
    for (const z of zones) {
      const family = z.fontFamily || FONT_STYLE_MAP[z.fontStyle || "block"];
      if (family && family !== "Inter") families.add(family);
    }
    if (families.size === 0) return;
    const existing = document.getElementById("ki-dtf-fonts");
    const newHref = `https://fonts.googleapis.com/css2?${[...families]
      .map((f) => `family=${f.replace(/ /g, "+")}:wght@400;700;900`)
      .join("&")}&display=swap`;
    if (existing && existing.getAttribute("href") === newHref) return;
    if (existing) existing.remove();
    const link = document.createElement("link");
    link.id = "ki-dtf-fonts";
    link.rel = "stylesheet";
    link.href = newHref;
    document.head.appendChild(link);
  }, [fontFamiliesKey]);

  // ── DPI-Prüfung ──
  const checkImageDpi = useCallback((file: File): Promise<number | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        if (data[0] === 0xFF && data[1] === 0xD8) {
          for (let i = 2; i < data.length - 10; i++) {
            if (data[i] === 0xFF && data[i + 1] === 0xE0) {
              const units = data[i + 11];
              if (units === 1) {
                const xDpi = (data[i + 12] << 8) | data[i + 13];
                resolve(xDpi);
                return;
              }
            }
          }
        }
        resolve(null);
      };
      reader.readAsArrayBuffer(file.slice(0, 1024));
    });
  }, []);

  // ── Bild hochladen ──
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dpi = await checkImageDpi(file);
    if (dpi !== null) {
      if (dpi < 250) setDpiWarning(`Niedrige Auflösung: ${dpi} DPI. Mindestens 300 DPI empfohlen.`);
      else if (dpi < 300) setDpiWarning(`${dpi} DPI – akzeptabel, 300 DPI wäre optimal.`);
      else setDpiWarning(null);
    } else setDpiWarning(null);

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = (ev.target?.result as string).split(",")[1];
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: file.name, data: base64, contentType: file.type }),
        });
        if (!response.ok) throw new Error("Upload fehlgeschlagen");
        const { url, key } = await response.json();
        setImageUrl(url);
        setImageStorageKey(key);
        setUploading(false);
        setStep("analyze");
        toast.success("Bild hochgeladen – bereit für KI-Analyse");
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      toast.error(error.message || "Upload fehlgeschlagen");
      setUploading(false);
    }
  };

  // ── KI-Analyse starten ──
  const handleAiAnalyze = async () => {
    if (!imageUrl) return;
    setAnalyzing(true);
    try {
      const fullImageUrl = imageUrl.startsWith("http") ? imageUrl : `${window.location.origin}${storageUrl(imageUrl)}`;

      // Schritt 1: Zonen erkennen
      const result = await analyzeImage.mutateAsync({
        imageUrl: fullImageUrl,
        sport: selectedSport as any || undefined,
        category: "trikot" as any,
      });

      if (result.zones && result.zones.length > 0) {
        const newZones: Zone[] = result.zones.map((z: any, idx: number) => {
          const fontFamily = z.fontFamily || FONT_STYLE_MAP[z.fontStyle || "block"] || "Oswald";
          const fontStyle = z.fontStyle || inferFontStyle(fontFamily);
          return {
            id: `ai_zone_${Date.now()}_${idx}`,
            name: z.name,
            purpose: z.purpose,
            x: Math.max(0, Math.min(95, z.x)),
            y: Math.max(0, Math.min(95, z.y)),
            width: Math.max(3, Math.min(100 - z.x, z.width)),
            height: Math.max(3, Math.min(100 - z.y, z.height)),
            side: z.side === 'V' ? 'front' : z.side === 'R' ? 'back' : z.side,
            textStyle: z.textStyle || "straight",
            arcDegree: z.arcDegree || 0,
            fontColor: z.fontColor || "#000000",
            outlineColor: z.outlineColor === "none" ? undefined : z.outlineColor,
            outlineWidth: z.outlineWidth || 0,
            fontStyle,
            fontFamily,
            fontWeight: z.fontWeight || "bold",
            fontSize: z.fontSize || 85,
          };
        });
        setZones(newZones);
        toast.success(`${newZones.length} Zonen erkannt – Freistellung wird gestartet...`);

        // Schritt 2: Hintergrund entfernen (DTF-spezifisch)
        setRemovingBg(true);
        try {
          const bgResult = await removeBackgroundMutation.mutateAsync({ imageUrl: fullImageUrl });
          const whiteResult = await makeWhiteTemplate(bgResult.url);
          setCutoutImageUrl(bgResult.url);
          setImageUrl(bgResult.url);
          if (bgResult.key) setImageStorageKey(bgResult.key);
          if (whiteResult) {
            setWhiteTemplateUrl(whiteResult.url);
            setWhiteTemplateKey(whiteResult.key);
            toast.success("Freigestellt! Wählen Sie jetzt die Trikotfarbe.");
          } else {
            toast.success("Freigestellt!");
          }
        } catch {
          toast.warning("Freistellung fehlgeschlagen – Original-Bild wird verwendet.");
        } finally {
          setRemovingBg(false);
        }
        setStep("edit");
      } else {
        toast.info("Keine Zonen erkannt. Versuchen Sie ein deutlicheres Bild.");
      }
    } catch (error: any) {
      toast.error(error.message || "KI-Analyse fehlgeschlagen");
    } finally {
      setAnalyzing(false);
    }
  };

  // ── Fullscreen-Editor öffnen ──
  const openFullscreenEditor = useCallback(() => {
    const snapshot = JSON.parse(JSON.stringify(zones));
    registerSaveCallback((savedZones) => setZones(savedZones));
    registerDiscardCallback(() => setZones(snapshot));
    const displayImageUrl = colorizedPreviewUrl || cutoutImageUrl || imageUrl;
    openEditor({
      zones: JSON.parse(JSON.stringify(zones)),
      selectedProductId: null,
      selectedPartId: null,
      orgId,
      sport: selectedSport,
      category: "trikot",
      snapshot,
      templateImageUrl: displayImageUrl || undefined,
      jerseyColor,
    });
    setLocation('/designer/zone-editor');
  }, [zones, orgId, selectedSport, openEditor, registerSaveCallback, registerDiscardCallback, setLocation, colorizedPreviewUrl, cutoutImageUrl, imageUrl, jerseyColor]);

  // ── Speichern ──
  const handleSave = async () => {
    if (!templateName.trim()) { toast.error("Bitte einen Namen eingeben"); return; }
    if (!imageUrl) { toast.error("Bitte ein Bild hochladen"); return; }
    if (!selectedSport) { toast.error("Bitte eine Sportart wählen"); return; }

    setSaving(true);
    try {
      const templateImageUrl = whiteTemplateUrl || imageUrl;
      const templateStorageKey = whiteTemplateKey || imageStorageKey || undefined;
      const result = await createTemplate.mutateAsync({
        name: templateName,
        imageUrl: templateImageUrl,
        storageKey: templateStorageKey,
        positionsConfig: zones.length > 0 ? { productId: null, zones, jerseyColor } : undefined,
        orgId,
        departmentId: undefined,
        teamId: undefined,
        sport: selectedSport as any,
        category: "trikot" as any,
        visibility,
        productId: undefined,
        zones: zones.length > 0 ? zones.map(z => ({
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
      toast.success("DTF-Vorlage gespeichert!");
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
  const rules = selectedSport ? getJerseyRules(selectedSport as any, "amateur") : null;
  const validationResult = rules && zones.length > 0
    ? validateZonesAgainstRules(zones as any, rules)
    : null;

  // ── Angezeigtes Bild ──
  const displayImage = colorizedPreviewUrl || (cutoutImageUrl ? storageUrl(cutoutImageUrl) : imageUrl ? storageUrl(imageUrl) : null);

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
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">KI-Analyse – DTF</h1>
                <p className="text-xs text-muted-foreground">Direct-to-Film Druckvorlage erstellen</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {step === "edit" && zones.length > 0 && (
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
        <div className="flex items-center gap-2 mb-6">
          {[
            { key: "upload", label: "1. Bild hochladen" },
            { key: "analyze", label: "2. KI analysieren" },
            { key: "edit", label: "3. Zonen bearbeiten" },
            { key: "save", label: "4. Speichern" },
          ].map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                step === s.key ? "bg-orange-600 text-white" :
                ["upload", "analyze", "edit", "save"].indexOf(step) > i ? "bg-green-100 text-green-700" :
                "bg-gray-100 text-gray-500"
              }`}>
                {s.label}
              </div>
              {i < 3 && <div className="w-4 h-px bg-gray-300" />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Linke Spalte: Bild + Zonen */}
          <div className="lg:col-span-2 space-y-4">
            {/* Upload-Bereich */}
            {!imageUrl ? (
              <div
                className="border-2 border-dashed border-orange-300 rounded-xl p-12 text-center cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-all bg-white"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-orange-400" />
                <p className="text-lg font-medium text-gray-700">
                  {uploading ? "Wird hochgeladen..." : "Trikot-Bild hochladen"}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Laden Sie ein Foto eines bestehenden Trikots hoch.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, PNG, WebP – mind. 300 DPI empfohlen
                </p>
                <p className="text-xs text-orange-600 font-medium mt-3">
                  DTF: Die KI erkennt Positionen, stellt frei und erstellt ein weißes Template zum Einfärben.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="bg-white rounded-xl border p-4 space-y-3">
                {dpiWarning && (
                  <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {dpiWarning}
                  </div>
                )}

                {/* Canvas mit Bild und Zonen */}
                <div
                  ref={canvasRef}
                  className={`relative border rounded-lg overflow-hidden select-none ${
                    cutoutImageUrl ? 'bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20width%3D%2720%27%20height%3D%2720%27%3E%3Crect%20width%3D%2710%27%20height%3D%2710%27%20fill%3D%27%23f0f0f0%27/%3E%3Crect%20x%3D%2710%27%20y%3D%2710%27%20width%3D%2710%27%20height%3D%2710%27%20fill%3D%27%23f0f0f0%27/%3E%3Crect%20x%3D%2710%27%20width%3D%2710%27%20height%3D%2710%27%20fill%3D%27%23fff%27/%3E%3Crect%20y%3D%2710%27%20width%3D%2710%27%20height%3D%2710%27%20fill%3D%27%23fff%27/%3E%3C/svg%3E")]' : 'bg-gray-100'
                  }`}
                  style={{ touchAction: (draggingZone || resizingZone) ? 'none' : 'auto' }}
                >
                  <img
                    src={displayImage || ""}
                    alt="Trikot"
                    className="w-full h-auto"
                    draggable={false}
                  />
                  {/* Zonen-Overlays */}
                  {zones.map((zone) => {
                    const isSelected = selectedZoneId === zone.id;
                    const purposeColors: Record<string, string> = {
                      logo: "border-blue-500 bg-blue-500/20",
                      playerName: "border-green-500 bg-green-500/20",
                      playerNumber: "border-red-500 bg-red-500/20",
                      clubName: "border-purple-500 bg-purple-500/20",
                      sponsor: "border-yellow-500 bg-yellow-500/20",
                      abbreviation: "border-pink-500 bg-pink-500/20",
                      custom: "border-gray-500 bg-gray-500/20",
                    };
                    return (
                      <div
                        key={zone.id}
                        data-zone-id={zone.id}
                        className={`absolute border-2 ${purposeColors[zone.purpose] || "border-gray-400 bg-gray-400/20"} ${isSelected ? "ring-2 ring-offset-1 ring-blue-400" : ""} cursor-move rounded-sm`}
                        style={{ left: `${zone.x}%`, top: `${zone.y}%`, width: `${zone.width}%`, height: `${zone.height}%` }}
                        onPointerDown={(e) => handleZonePointerDown(e, zone.id)}
                      >
                        <span className="absolute -top-5 left-0 text-[10px] font-medium bg-white/90 px-1 rounded truncate max-w-full">
                          {zone.name}
                        </span>
                        {/* Resize-Handle */}
                        <div
                          className="absolute bottom-0 right-0 w-3 h-3 bg-white border border-gray-400 cursor-se-resize rounded-sm"
                          onPointerDown={(e) => { e.stopPropagation(); handleZonePointerDown(e, zone.id, true); }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Farbauswahl (nur wenn freigestellt) */}
                {cutoutImageUrl && (
                  <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <Palette className="w-5 h-5 text-gray-500" />
                    <Label className="text-sm font-medium">Trikotfarbe:</Label>
                    <input
                      type="color"
                      value={jerseyColor}
                      onChange={(e) => setJerseyColor(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border"
                    />
                    <span className="text-xs text-muted-foreground">{jerseyColor}</span>
                    {jerseyColor !== "#ffffff" && (
                      <Button size="sm" variant="ghost" onClick={() => setJerseyColor("#ffffff")}>
                        Zurücksetzen
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Analyse-Button */}
            {step === "analyze" && imageUrl && (
              <div className="bg-white rounded-xl border p-6 text-center">
                <Sparkles className="w-8 h-8 mx-auto mb-3 text-orange-500" />
                <h3 className="text-lg font-semibold mb-2">KI-Analyse starten</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Die KI erkennt automatisch alle Druckpositionen, stellt das Trikot frei und erstellt ein weißes DTF-Template.
                </p>
                <Button
                  size="lg"
                  onClick={handleAiAnalyze}
                  disabled={analyzing || removingBg}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {analyzing ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analysiert...</>
                  ) : removingBg ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Freistellen...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" />KI-Analyse starten</>
                  )}
                </Button>
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
                  placeholder="z.B. Heimtrikot Saison 2025/26"
                />
              </div>
              <div className="space-y-2">
                <Label>Sportart (für Verbandsregeln) *</Label>
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

            {/* Zonen-Liste */}
            {zones.length > 0 && (
              <div className="bg-white rounded-xl border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm uppercase text-gray-500">Zonen ({zones.length})</h3>
                  <Button size="sm" variant="outline" onClick={() => setAddingZone(true)}>
                    <Plus className="w-3 h-3 mr-1" />
                    Zone
                  </Button>
                </div>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {zones.map((zone) => (
                    <div
                      key={zone.id}
                      className={`flex items-center justify-between p-2 rounded text-sm cursor-pointer hover:bg-gray-50 ${selectedZoneId === zone.id ? "bg-blue-50 border border-blue-200" : ""}`}
                      onClick={() => setSelectedZoneId(zone.id)}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          zone.purpose === "logo" ? "bg-blue-500" :
                          zone.purpose === "playerNumber" ? "bg-red-500" :
                          zone.purpose === "playerName" ? "bg-green-500" :
                          zone.purpose === "clubName" ? "bg-purple-500" :
                          zone.purpose === "sponsor" ? "bg-yellow-500" :
                          "bg-gray-500"
                        }`} />
                        <span className="truncate">{zone.name}</span>
                      </div>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); setZones(zones.filter(z => z.id !== zone.id)); }}>
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DTF-Info */}
            <div className="bg-orange-50 rounded-xl border border-orange-200 p-4">
              <h3 className="font-semibold text-sm text-orange-800 mb-2">DTF-Druckverfahren</h3>
              <ul className="text-xs text-orange-700 space-y-1">
                <li>• Einzelne Druckflächen (Transfers)</li>
                <li>• Weißes Template wird eingefärbt</li>
                <li>• Ideal für kleine Auflagen</li>
                <li>• Jede Zone = ein separater Transfer</li>
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

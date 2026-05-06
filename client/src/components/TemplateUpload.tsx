import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Upload, Plus, Trash2, Move, Save, Image as ImageIcon, AlertTriangle, Sparkles, Loader2, ChevronLeft, Maximize2, X, Ruler } from "lucide-react";
import { createPortal } from "react-dom";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { storageUrl } from "@/lib/utils";
import { toPng } from "html-to-image";
import { getJerseyRules, validateZonesAgainstRules } from "@shared/jerseyRules";
import { TEXTIL_TEMPLATES } from "@shared/templates";

// Mapping: KI fontStyle-Kategorie -> konkrete Google Font Familie
const FONT_STYLE_MAP: Record<string, string> = {
  block: "Oswald",
  sans: "Montserrat",
  serif: "Playfair Display",
  script: "Dancing Script",
  outline: "Bebas Neue",
  shadow: "Anton",
};

// Reverse-Mapping: Von Google Font Name zur Stil-Kategorie
function inferFontStyle(fontFamily: string): "block" | "serif" | "sans" | "script" | "outline" | "shadow" {
  const lower = fontFamily.toLowerCase();
  if (["oswald", "anton", "bebas neue", "teko", "barlow condensed", "black ops one", "bungee", "russo one", "righteous", "passion one"].some(f => lower.includes(f))) return "block";
  if (["playfair", "merriweather", "lora", "crimson"].some(f => lower.includes(f))) return "serif";
  if (["dancing script", "pacifico", "great vibes", "satisfy"].some(f => lower.includes(f))) return "script";
  if (["montserrat", "poppins", "inter", "roboto", "open sans", "lato"].some(f => lower.includes(f))) return "sans";
  return "block";
}

interface Zone {
  id: string;
  name: string;
  purpose: string;
  x: number; // Prozent
  y: number; // Prozent
  width: number; // Prozent
  height: number; // Prozent
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
  rotation?: number; // Grad (0-360)
}
interface TemplateUploadProps {
  orgId: number;
  departmentId?: number;
  teamId?: number;
  sport?: string;
  category?: string;
  onSaved?: (templateId: number) => void;
  onCancel?: () => void;
  onFullscreenChange?: (isFullscreen: boolean) => void;
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

export function TemplateUpload({
  orgId,
  departmentId,
  teamId,
  sport,
  category,
  onSaved,
  onCancel,
  onFullscreenChange,
}: TemplateUploadProps) {
  // ─── State ───
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageStorageKey, setImageStorageKey] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dpiWarning, setDpiWarning] = useState<string | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [visibility, setVisibility] = useState<"private" | "team" | "department" | "org">("team");
  const [saving, setSaving] = useState(false);
  const [addingZone, setAddingZone] = useState(false);
  const [newZoneName, setNewZoneName] = useState("");
  const [newZonePurpose, setNewZonePurpose] = useState("logo");
  const [analyzing, setAnalyzing] = useState(false);

  // Split-View: Ausgewähltes Produkt
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedPartId, setSelectedPartId] = useState<number | null>(null);
  // Fullscreen-Editor
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const fullscreenCanvasRef = useRef<HTMLDivElement>(null);

  // Kommuniziere Fullscreen-Status nach außen
  useEffect(() => {
    onFullscreenChange?.(fullscreenMode);
  }, [fullscreenMode, onFullscreenChange]);

  // ─── Robuste Pointer-Events Drag & Drop (wie AdminProductEditor) ───
  const [draggingZone, setDraggingZone] = useState<string | null>(null);
  const [resizingZone, setResizingZone] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const dragStateRef = useRef<{
    dragging: string | null;
    resizing: string | null;
    startX: number;
    startY: number;
    zoneX: number;
    zoneY: number;
    zoneW: number;
    zoneH: number;
    canvas: "left" | "right";
  }>({ dragging: null, resizing: null, startX: 0, startY: 0, zoneX: 0, zoneY: 0, zoneW: 0, zoneH: 0, canvas: "left" });
  const rafRef = useRef<number | null>(null);

  const leftCanvasRef = useRef<HTMLDivElement>(null);
  const rightCanvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createTemplate = trpc.designTemplate.create.useMutation();
  const analyzeImage = trpc.designTemplate.analyzeImage.useMutation();

  // Produkte laden
  const { data: products } = trpc.product.list.useQuery();
  const { data: productParts } = trpc.product.getById.useQuery(
    { id: selectedProductId! },
    { enabled: !!selectedProductId }
  );

  // Erstes Part (Vorderteil) automatisch auswählen
  useEffect(() => {
    if (productParts?.parts && productParts.parts.length > 0 && !selectedPartId) {
      setSelectedPartId(productParts.parts[0].id);
    }
  }, [productParts, selectedPartId]);

  const activePart = productParts?.parts?.find((p: any) => p.id === selectedPartId);

  // Google Fonts für erkannte Schriften laden
  useEffect(() => {
    const families = new Set<string>();
    for (const z of zones) {
      const family = z.fontFamily || FONT_STYLE_MAP[z.fontStyle || "block"];
      if (family && family !== "Inter") families.add(family);
    }
    if (families.size === 0) return;
    const existing = document.getElementById("template-upload-fonts");
    if (existing) existing.remove();
    const link = document.createElement("link");
    link.id = "template-upload-fonts";
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?${[...families]
      .map((f) => `family=${f.replace(/ /g, "+")}:wght@400;700;900`)
      .join("&")}&display=swap`;
    document.head.appendChild(link);
  }, [zones]);

  // DPI-Prüfung
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const dpi = await checkImageDpi(file);
    if (dpi !== null) {
      if (dpi < 250) {
        setDpiWarning(`Niedrige Auflösung: ${dpi} DPI. Für gute Druckqualität werden mindestens 300 DPI empfohlen.`);
      } else if (dpi < 300) {
        setDpiWarning(`Auflösung: ${dpi} DPI. Akzeptabel, aber 300 DPI wäre optimal für Druck.`);
      } else {
        setDpiWarning(null);
      }
    } else {
      setDpiWarning(null);
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = (ev.target?.result as string).split(",")[1];
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            data: base64,
            contentType: file.type,
          }),
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "Upload fehlgeschlagen");
        }
        const { url, key } = await response.json();
        setImageUrl(url);
        setImageStorageKey(key);
        setUploading(false);
        toast.success("Bild hochgeladen");
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      toast.error(error.message || "Upload fehlgeschlagen");
      setUploading(false);
    }
  };

  // ─── KI-Analyse: Positionen automatisch erkennen ───
  const handleAiAnalyze = async () => {
    if (!imageUrl) {
      toast.error("Bitte zuerst ein Bild hochladen");
      return;
    }

    setAnalyzing(true);
    try {
      const fullImageUrl = imageUrl.startsWith("http")
        ? imageUrl
        : `${window.location.origin}${storageUrl(imageUrl)}`;

      const result = await analyzeImage.mutateAsync({
        imageUrl: fullImageUrl,
        sport: sport as any,
        category: category as any,
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

        const arcCount = newZones.filter(z => z.textStyle === "arc").length;
        const outlineCount = newZones.filter(z => z.outlineColor).length;
        let summary = `${newZones.length} Zonen erkannt`;
        if (arcCount > 0) summary += `, ${arcCount} mit Bogentext`;
        if (outlineCount > 0) summary += `, ${outlineCount} mit Outline`;
        toast.success(summary + " – Positionen per Drag & Drop korrigieren!");
      } else {
        toast.info("Keine Elemente erkannt. Versuchen Sie ein deutlicheres Bild.");
      }
    } catch (error: any) {
      toast.error(error.message || "KI-Analyse fehlgeschlagen");
    } finally {
      setAnalyzing(false);
    }
  };

  const addZone = () => {
    if (!newZoneName.trim()) {
      toast.error("Bitte einen Namen für die Zone eingeben");
      return;
    }
    const zone: Zone = {
      id: `zone_${Date.now()}`,
      name: newZoneName,
      purpose: newZonePurpose,
      x: 30,
      y: 30,
      width: 20,
      height: 15,
    };
    setZones([...zones, zone]);
    setNewZoneName("");
    setAddingZone(false);
  };

  const removeZone = (id: string) => {
    setZones(zones.filter((z) => z.id !== id));
    if (selectedZoneId === id) setSelectedZoneId(null);
  };

  // ─── Pointer Events Drag & Drop (robust, wie AdminProductEditor) ───
  const getRelativePosition = useCallback((e: React.PointerEvent | PointerEvent, canvasEl: HTMLDivElement) => {
    const rect = canvasEl.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
  }, []);

  const handleZonePointerDown = useCallback(
    (e: React.PointerEvent, zoneId: string, isResize = false, canvas: "left" | "right" = "left") => {
      e.preventDefault();
      e.stopPropagation();
      const zone = zones.find((z) => z.id === zoneId);
      if (!zone) return;
      // Capture pointer for reliable tracking
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      // Haptic feedback on touch
      if (e.pointerType === "touch" && navigator.vibrate) {
        navigator.vibrate(15);
      }
      const canvasEl = canvas === "left" ? leftCanvasRef.current : (fullscreenMode ? fullscreenCanvasRef.current : rightCanvasRef.current);
      if (!canvasEl) return;
      const pos = getRelativePosition(e, canvasEl);
      dragStateRef.current = {
        dragging: isResize ? null : zoneId,
        resizing: isResize ? zoneId : null,
        startX: pos.x,
        startY: pos.y,
        zoneX: zone.x,
        zoneY: zone.y,
        zoneW: zone.width,
        zoneH: zone.height,
        canvas,
      };
      if (isResize) setResizingZone(zoneId);
      else setDraggingZone(zoneId);
      setSelectedZoneId(zoneId);
    },
    [zones, getRelativePosition]
  );

  // Window-level pointer move/up für zuverlässiges Tracking
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const ds = dragStateRef.current;
      if (ds.dragging === null && ds.resizing === null) return;
      e.preventDefault();
      const canvasEl = ds.canvas === "left" ? leftCanvasRef.current : (fullscreenMode ? fullscreenCanvasRef.current : rightCanvasRef.current);
      if (!canvasEl) return;
      const rect = canvasEl.getBoundingClientRect();
      const posX = ((e.clientX - rect.left) / rect.width) * 100;
      const posY = ((e.clientY - rect.top) / rect.height) * 100;
      const dx = posX - ds.startX;
      const dy = posY - ds.startY;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        if (ds.dragging !== null) {
          setZones((prev) =>
            prev.map((z) =>
              z.id === ds.dragging
                ? {
                    ...z,
                    x: Math.max(0, Math.min(100 - z.width, ds.zoneX + dx)),
                    y: Math.max(0, Math.min(100 - z.height, ds.zoneY + dy)),
                  }
                : z
            )
          );
        }
        if (ds.resizing !== null) {
          setZones((prev) =>
            prev.map((z) =>
              z.id === ds.resizing
                ? {
                    ...z,
                    width: Math.max(3, Math.min(100 - z.x, ds.zoneW + dx)),
                    height: Math.max(3, Math.min(100 - z.y, ds.zoneH + dy)),
                  }
                : z
            )
          );
        }
      });
    };

    const handlePointerUp = () => {
      dragStateRef.current = { dragging: null, resizing: null, startX: 0, startY: 0, zoneX: 0, zoneY: 0, zoneW: 0, zoneH: 0, canvas: "left" };
      setDraggingZone(null);
      setResizingZone(null);
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    };

    if (draggingZone !== null || resizingZone !== null) {
      window.addEventListener("pointermove", handlePointerMove, { passive: false });
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerUp);
      return () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("pointercancel", handlePointerUp);
      };
    }
  }, [draggingZone, resizingZone]);

  const handleSave = async () => {
    if (!templateName.trim()) {
      toast.error("Bitte einen Namen für die Vorlage eingeben");
      return;
    }
    if (!imageUrl) {
      toast.error("Bitte ein Bild hochladen");
      return;
    }

    setSaving(true);
    try {
      // Screenshot des Produkt-Bereichs (rechte Seite) als Vorlagen-Bild generieren
      let templateImageUrl = imageUrl;
      let templateStorageKey = imageStorageKey || undefined;
      const canvasEl = fullscreenMode ? fullscreenCanvasRef.current : rightCanvasRef.current;
      if (canvasEl && selectedProductId && zones.length > 0) {
        try {
          const dataUrl = await toPng(canvasEl, {
            backgroundColor: '#f3f4f6',
            pixelRatio: 2,
          });
          // Upload des Screenshots
          const base64 = dataUrl.split(',')[1];
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: `vorlage-${templateName.replace(/\s+/g, '-')}.png`,
              data: base64,
              contentType: 'image/png',
            }),
          });
          if (uploadRes.ok) {
            const { url, key } = await uploadRes.json();
            templateImageUrl = url;
            templateStorageKey = key;
          }
        } catch (screenshotErr) {
          console.warn('Screenshot fehlgeschlagen, verwende Original-Bild:', screenshotErr);
        }
      }

      const result = await createTemplate.mutateAsync({
        name: templateName,
        imageUrl: templateImageUrl,
        storageKey: templateStorageKey,
        positionsConfig: zones.length > 0 ? { productId: selectedProductId || null, zones } : undefined,
        orgId,
        departmentId,
        teamId,
        sport: sport as any,
        category: category as any,
        visibility,
        productId: selectedProductId || undefined,
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
      toast.success("Vorlage gespeichert! Zonen wurden auf das Produkt übertragen.");
      onSaved?.(result.id);
    } catch (error: any) {
      toast.error(error.message || "Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  // ─── Zone-Overlay Renderer ───
  const renderZoneOverlay = (zone: Zone, editable: boolean, canvas: "left" | "right") => {
    const previewText = zone.purpose === "playerName" ? "MUSTER"
      : zone.purpose === "playerNumber" ? "10"
      : zone.purpose === "clubName" ? "FC MUSTER"
      : zone.purpose === "abbreviation" ? "FCM"
      : "";
    const isTextZone = ["playerName", "playerNumber", "clubName", "abbreviation"].includes(zone.purpose);
    const fontFamily = zone.fontFamily || FONT_STYLE_MAP[zone.fontStyle || "block"] || "Oswald";
    const isSelected = selectedZoneId === zone.id;
    
    const isLightColor = (color: string) => {
      if (!color) return false;
      const hex = color.replace('#', '');
      if (hex.length < 6) return false;
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      return (r * 299 + g * 587 + b * 114) / 1000 > 180;
    };
    const needsContrastStroke = isLightColor(zone.fontColor || '#000000') && !zone.outlineColor;
    const contrastStrokeColor = needsContrastStroke ? '#333333' : undefined;

    const borderColor = isSelected ? "#f59e0b" : (zone.fontColor && zone.fontColor !== "#000000" && !isLightColor(zone.fontColor) ? zone.fontColor : "#3b82f6");

    return (
      <div
        key={`${zone.id}_${canvas}`}
        className={`absolute flex items-center justify-center overflow-hidden ${editable ? "cursor-move" : "pointer-events-none"}`}
        style={{
          left: `${zone.x}%`,
          top: `${zone.y}%`,
          width: `${zone.width}%`,
          height: `${zone.height}%`,
          border: `2px solid ${borderColor}`,
          backgroundColor: isSelected ? "rgba(245,158,11,0.12)" : "rgba(59,130,246,0.07)",
          touchAction: editable ? 'none' : undefined,
          boxShadow: isSelected ? `0 0 0 2px ${borderColor}, 0 2px 8px rgba(0,0,0,0.15)` : undefined,
          zIndex: isSelected ? 10 : 1,
          transform: zone.rotation ? `rotate(${zone.rotation}deg)` : undefined,
        }}
        onPointerDown={editable ? (e) => handleZonePointerDown(e, zone.id, false, canvas) : undefined}
      >
        {/* Text-Vorschau */}
        {isTextZone && previewText ? (
          <div className="w-full h-full flex items-center justify-center">
            {zone.textStyle === "arc" && zone.arcDegree ? (
              <svg viewBox="0 0 200 80" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <path id={`preview_arc_${zone.id}_${canvas}`} d="M 10 60 A 100 100 0 0 1 190 60" fill="none" />
                </defs>
                {(zone.outlineColor && zone.outlineWidth && zone.outlineWidth > 0) || needsContrastStroke ? (
                  <text fontFamily={fontFamily} fontWeight={zone.fontWeight || "bold"} fontSize="28" fill="none" stroke={zone.outlineColor || contrastStrokeColor} strokeWidth={zone.outlineWidth ? zone.outlineWidth * 0.5 : 1.5} strokeLinejoin="round">
                    <textPath href={`#preview_arc_${zone.id}_${canvas}`} startOffset="50%" textAnchor="middle">{previewText}</textPath>
                  </text>
                ) : null}
                <text fontFamily={fontFamily} fontWeight={zone.fontWeight || "bold"} fontSize="28" fill={zone.fontColor || "#000000"}>
                  <textPath href={`#preview_arc_${zone.id}_${canvas}`} startOffset="50%" textAnchor="middle">{previewText}</textPath>
                </text>
              </svg>
            ) : (
              <svg viewBox={`0 0 ${previewText.length * 30} 50`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                {(zone.outlineColor && zone.outlineWidth && zone.outlineWidth > 0) || needsContrastStroke ? (
                  <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontFamily={fontFamily} fontWeight={zone.fontWeight || "bold"} fontSize="40" fill="none" stroke={zone.outlineColor || contrastStrokeColor} strokeWidth={zone.outlineWidth ? zone.outlineWidth * 0.5 : 2} strokeLinejoin="round">
                    {previewText}
                  </text>
                ) : null}
                <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontFamily={fontFamily} fontWeight={zone.fontWeight || "bold"} fontSize="40" fill={zone.fontColor || "#000000"}>
                  {previewText}
                </text>
              </svg>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] font-medium text-blue-900 bg-white/90 px-1 rounded truncate max-w-full leading-tight">
              {zone.name}
            </span>
            <div className="flex gap-0.5">
              {zone.textStyle === "arc" && (
                <span className="text-[7px] bg-purple-600 text-white px-0.5 rounded leading-tight">
                  ⌒ {zone.arcDegree}°
                </span>
              )}
            </div>
          </div>
        )}
        {/* Side-Indicator */}
        {zone.side && (
          <span className="absolute top-0 left-0 text-[8px] bg-blue-600 text-white px-0.5 rounded-br leading-tight">
            {zone.side === "front" ? "V" : "R"}
          </span>
        )}
        {/* Farb-Indikatoren */}
        {zone.fontColor && (
          <div className="absolute bottom-0 left-0 flex gap-0.5 p-0.5">
            <div className="w-2.5 h-2.5 rounded-full border border-white" style={{ backgroundColor: zone.fontColor }} />
            {zone.outlineColor && zone.outlineColor !== "none" && (
              <div className="w-2.5 h-2.5 rounded-full border border-white" style={{ backgroundColor: zone.outlineColor }} />
            )}
          </div>
        )}
        {/* Font-Family Badge */}
        {isTextZone && fontFamily && (
          <span className="absolute bottom-0 right-0 text-[7px] bg-gray-800 text-white px-0.5 rounded-tl leading-tight">
            {fontFamily}
          </span>
        )}
        {/* Resize Handle + Delete (nur editierbar) */}
        {editable && (
          <>
            {/* Resize-Handle: größer und deutlicher */}
            <div
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-sm cursor-se-resize flex items-center justify-center"
              style={{ backgroundColor: borderColor, touchAction: 'none' }}
              onPointerDown={(e) => {
                e.stopPropagation();
                handleZonePointerDown(e, zone.id, true, canvas);
              }}
            >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path d="M7 1L1 7M7 4L4 7M7 7L7 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {/* Erweiterter Touch-Bereich */}
              <div
                className="absolute -top-2 -left-2 -right-0 -bottom-0 w-8 h-8"
                style={{ touchAction: 'none' }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  handleZonePointerDown(e, zone.id, true, canvas);
                }}
              />
            </div>
            {/* Delete-Button */}
            <button
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 z-20"
              onClick={(e) => {
                e.stopPropagation();
                removeZone(zone.id);
              }}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </>
        )}
      </div>
    );
  };

  // ─── Hilfslinien-Overlay (Crosshair bei Drag) ───
  const renderGuidelines = (canvasType: "left" | "right") => {
    if (!selectedZoneId || (draggingZone === null && resizingZone === null)) return null;
    const zone = zones.find(z => z.id === selectedZoneId);
    if (!zone) return null;
    const centerX = zone.x + zone.width / 2;
    const centerY = zone.y + zone.height / 2;
    return (
      <>
        {/* Vertikale Mittellinie */}
        <div className="absolute top-0 bottom-0 pointer-events-none" style={{ left: `${centerX}%`, width: '1px', backgroundColor: 'rgba(245,158,11,0.5)' }} />
        {/* Horizontale Mittellinie */}
        <div className="absolute left-0 right-0 pointer-events-none" style={{ top: `${centerY}%`, height: '1px', backgroundColor: 'rgba(245,158,11,0.5)' }} />
        {/* 50%-Markierungen */}
        <div className="absolute top-0 bottom-0 pointer-events-none" style={{ left: '50%', width: '1px', backgroundColor: 'rgba(100,100,100,0.2)', borderLeft: '1px dashed rgba(100,100,100,0.3)' }} />
        <div className="absolute left-0 right-0 pointer-events-none" style={{ top: '50%', height: '1px', backgroundColor: 'rgba(100,100,100,0.2)', borderTop: '1px dashed rgba(100,100,100,0.3)' }} />
        {/* Position-Anzeige */}
        <div className="absolute top-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none z-30">
          {Math.round(zone.x)}%, {Math.round(zone.y)}% | {Math.round(zone.width)}%×{Math.round(zone.height)}%
        </div>
      </>
    );
  };

  return (
    <Card className="w-full max-w-none">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          KI-Bild-Analyse – Positionskopie
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Laden Sie ein Vorlagenbild hoch (links). Die KI erkennt alle Positionen und überträgt sie 1:1 auf Ihr Produkt (rechts).
          <strong className="text-foreground"> Verschieben und skalieren Sie die Zonen per Drag & Drop für 100% Genauigkeit.</strong>
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Schritt 1: Name + Produkt auswählen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="template-name">Vorlagenname *</Label>
            <Input
              id="template-name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="z.B. Heimtrikot Saison 2025/26"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Zielprodukt auswählen *</Label>
            <Select
              value={selectedProductId?.toString() || ""}
              onValueChange={(v) => {
                setSelectedProductId(Number(v));
                setSelectedPartId(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Produkt wählen..." />
              </SelectTrigger>
              <SelectContent>
                {products?.map((p: any) => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Sichtbarkeit</Label>
            <Select value={visibility} onValueChange={(v: any) => setVisibility(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Nur ich</SelectItem>
                <SelectItem value="team">Meine Mannschaft</SelectItem>
                <SelectItem value="department">Meine Sparte</SelectItem>
                <SelectItem value="org">Gesamter Verein</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Part-Auswahl (wenn Produkt gewählt) */}
        {productParts?.parts && productParts.parts.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {productParts.parts
              .filter((part: any) => ['vorderteil', 'rueckteil'].includes(part.key))
              .map((part: any) => (
              <Button
                key={part.id}
                size="sm"
                variant={selectedPartId === part.id ? "default" : "outline"}
                onClick={() => setSelectedPartId(part.id)}
              >
                {part.label || part.key}
              </Button>
            ))}
          </div>
        )}

        {/* ═══ SPLIT VIEW: Links Vorlage, Rechts unser Produkt ═══ */}
        {fullscreenMode && (
          <div className="p-8 text-center bg-indigo-50 border border-indigo-200 rounded-lg">
            <p className="text-sm text-indigo-700 font-medium">Fullscreen-Editor ist geöffnet</p>
            <p className="text-xs text-indigo-500 mt-1">Schließen Sie den Editor um zurückzukehren</p>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ display: fullscreenMode ? 'none' : undefined }}>
          {/* ─── LINKE SEITE: Vorlagenbild ─── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Vorlage (Original)</Label>
              {imageUrl && (
                <Button
                  size="sm"
                  onClick={handleAiAnalyze}
                  disabled={analyzing}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Analysiert...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-1" />
                      KI analysieren
                    </>
                  )}
                </Button>
              )}
            </div>

            {!imageUrl ? (
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-purple-400 transition-colors bg-gray-50 min-h-[300px] flex flex-col items-center justify-center"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-10 h-10 mb-3 text-purple-400" />
                <p className="text-sm font-medium text-gray-700">
                  {uploading ? "Wird hochgeladen..." : "Vorlagenbild hochladen"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Laden Sie ein Bild eines Trikots oder Sportbekleidungsstücks hoch.
                </p>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, WebP – mind. 300 DPI empfohlen
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
              <div className="space-y-2">
                {dpiWarning && (
                  <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {dpiWarning}
                  </div>
                )}
                <div
                  ref={leftCanvasRef}
                  data-canvas="left"
                  className="relative border rounded-lg overflow-hidden bg-gray-100 select-none"
                  style={{ touchAction: (draggingZone || resizingZone) ? 'none' : 'auto' }}
                >
                  <img src={storageUrl(imageUrl)} alt="Vorlage" className="w-full h-auto" draggable={false} />
                  {/* Hilfslinien bei Drag */}
                  {renderGuidelines("left")}
                  {/* Zonen auf Vorlage: EDITIERBAR (Drag & Drop + Resize) */}
                  {zones.map((zone) => renderZoneOverlay(zone, true, "left"))}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setImageUrl(null);
                      setImageStorageKey(null);
                      setZones([]);
                    }}
                  >
                    Bild ersetzen
                  </Button>
                  {zones.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      Tipp: Ziehen Sie die Zonen an die richtige Position
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ─── RECHTE SEITE: Unser Produkt mit kopierten Positionen ─── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Unser Produkt (Ergebnis)</Label>
              <div className="flex gap-1">
                {selectedProductId && zones.length > 0 && (
                  <Button size="sm" variant="default" onClick={() => setFullscreenMode(true)} className="bg-indigo-600 hover:bg-indigo-700 min-h-[44px] min-w-[44px] touch-manipulation">
                    <Maximize2 className="w-4 h-4 mr-1" />
                    Bearbeiten
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => setAddingZone(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Zone hinzufügen
                </Button>
              </div>
            </div>

            {!selectedProductId ? (
              <div className="border-2 border-dashed rounded-lg p-8 text-center bg-gray-50 min-h-[300px] flex flex-col items-center justify-center">
                <ImageIcon className="w-10 h-10 mb-3 text-gray-300" />
                <p className="text-sm font-medium text-gray-500">
                  Bitte wählen Sie oben ein Zielprodukt aus
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Die erkannten Positionen werden auf dieses Produkt übertragen
                </p>
              </div>
            ) : (
              <div
                ref={rightCanvasRef}
                data-canvas="right"
                className="relative border rounded-lg overflow-hidden bg-gray-100 select-none"
                style={{ touchAction: (draggingZone || resizingZone) ? 'none' : 'auto' }}
              >
                {/* Produkt-Bild (Part-Bild) */}
                {activePart?.imageUrl ? (
                  <img
                    src={storageUrl(activePart.imageUrl)}
                    alt={activePart?.label || "Produkt"}
                    className="w-full h-auto"
                    draggable={false}
                  />
                ) : (
                  <div className="w-full aspect-[3/4] bg-white flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">Kein Bild für dieses Teil</p>
                  </div>
                )}

                {/* Hilfslinien bei Drag */}
                {renderGuidelines("right")}

                {/* 1:1 kopierte Zonen auf unserem Produkt (editierbar) - gefiltert nach Seite */}
                {zones
                  .filter((zone) => {
                    if (!zone.side) return true;
                    const partKey = (activePart as any)?.key || '';
                    const isFrontPart = partKey.toLowerCase().includes('vorder') || partKey.toLowerCase().includes('front');
                    const isBackPart = partKey.toLowerCase().includes('rueck') || partKey.toLowerCase().includes('back');
                    if (isFrontPart) return zone.side === 'front';
                    if (isBackPart) return zone.side === 'back';
                    return true;
                  })
                  .map((zone) => renderZoneOverlay(zone, true, "right"))}

                {/* Übertragungspfeil-Overlay wenn Zonen vorhanden */}
                {zones.length > 0 && imageUrl && (
                  <div className="absolute top-2 left-2 bg-green-600 text-white text-[10px] px-2 py-1 rounded font-medium">
                    {zones.length} Zonen übertragen
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ─── Zonen-Liste (unter dem Split-View) ─── */}
        {zones.length > 0 && (
          <div className="space-y-2">
            <Label>Erkannte Zonen ({zones.length})</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {zones.map((zone) => (
                <div
                  key={zone.id}
                  className={`p-2 rounded-lg text-sm space-y-1 cursor-pointer transition-colors ${selectedZoneId === zone.id ? 'bg-amber-50 border border-amber-300' : 'bg-muted hover:bg-muted/80'}`}
                  onClick={() => setSelectedZoneId(zone.id)}
                >
                  <div className="flex items-center gap-2">
                    <Move className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="font-medium truncate text-xs">{zone.name}</span>
                    <span className="text-muted-foreground text-[10px] shrink-0">
                      ({ZONE_PURPOSES.find((p) => p.value === zone.purpose)?.label})
                    </span>
                    {zone.side && (
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded shrink-0">
                        {zone.side === "front" ? "V" : "R"}
                      </span>
                    )}
                    <span className="text-muted-foreground text-[10px] ml-auto shrink-0">
                      {Math.round(zone.x)}%, {Math.round(zone.y)}% | {Math.round(zone.width)}%×{Math.round(zone.height)}%
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0 text-red-500 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeZone(zone.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  {(zone.textStyle || zone.fontColor) && (
                    <div className="flex items-center gap-1.5 pl-6 flex-wrap">
                      {zone.textStyle === "arc" && (
                        <span className="text-[9px] bg-purple-100 text-purple-700 px-1 py-0.5 rounded">⌒ Bogen {zone.arcDegree}°</span>
                      )}
                      {zone.textStyle === "straight" && (
                        <span className="text-[9px] bg-gray-100 text-gray-600 px-1 py-0.5 rounded">→ Gerade</span>
                      )}
                      {zone.fontColor && (
                        <span className="text-[9px] flex items-center gap-0.5">
                          <span className="w-2.5 h-2.5 rounded-full border inline-block" style={{ backgroundColor: zone.fontColor }} />
                          {zone.fontColor}
                        </span>
                      )}
                      {zone.outlineColor && zone.outlineColor !== "none" && (
                        <span className="text-[9px] flex items-center gap-0.5">
                          <span className="w-2.5 h-2.5 rounded-full border inline-block" style={{ backgroundColor: zone.outlineColor }} />
                          Outline
                        </span>
                      )}
                      {zone.fontFamily && (
                        <span className="text-[9px] bg-gray-100 text-gray-600 px-1 py-0.5 rounded">{zone.fontFamily}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Aktionen ─── */}
        <div className="flex gap-3 pt-4 border-t">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Zurück
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={saving || !imageUrl || !templateName.trim() || !selectedProductId}
            className="ml-auto"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Wird gespeichert..." : "Vorlage speichern"}
          </Button>
        </div>

        {/* Zone hinzufügen Dialog */}
        <Dialog open={addingZone} onOpenChange={setAddingZone}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Zone manuell hinzufügen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Zonenname</Label>
                <Input
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  placeholder="z.B. Vereinswappen, Rückennummer..."
                />
              </div>
              <div className="space-y-2">
                <Label>Zonentyp</Label>
                <Select value={newZonePurpose} onValueChange={setNewZonePurpose}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ZONE_PURPOSES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddingZone(false)}>
                Abbrechen
              </Button>
              <Button onClick={addZone}>Hinzufügen</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* ═══ FULLSCREEN EDITOR DIALOG (Portal: außerhalb des Radix-Dialogs) ═══ */}
        {fullscreenMode && createPortal(
          <div className="fixed inset-0 z-[9999] bg-white flex">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 h-14 bg-gray-900 text-white flex items-center justify-between px-4 z-10">
              <div className="flex items-center gap-3">
                <h2 className="font-semibold text-lg">Vorlagen-Editor</h2>
                {productParts?.parts && productParts.parts.length > 1 && (
                  <div className="flex gap-1">
                    {productParts.parts
                      .filter((part: any) => ['vorderteil', 'rueckteil'].includes(part.key))
                      .map((part: any) => (
                        <Button
                          key={part.id}
                          size="sm"
                          variant={selectedPartId === part.id ? "default" : "secondary"}
                          onClick={() => setSelectedPartId(part.id)}
                          className="h-7 text-xs"
                        >
                          {part.label || part.key}
                        </Button>
                      ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => setAddingZone(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Zone
                </Button>
                <Button size="sm" variant="ghost" className="text-white hover:bg-gray-700" onClick={() => setFullscreenMode(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Main Content: Canvas links, Sidebar rechts */}
            <div className="flex w-full pt-14 flex-col lg:flex-row">
              {/* ─── Canvas (großes Trikot-Bild) ─── */}
              <div className="flex-1 flex items-center justify-center bg-gray-100 p-4 lg:p-8 overflow-auto">
                <div
                  ref={fullscreenCanvasRef}
                  data-canvas="right"
                  className="relative bg-gray-100 select-none shadow-xl rounded-lg overflow-hidden"
                  style={{ maxWidth: '900px', width: '100%', touchAction: (draggingZone || resizingZone) ? 'none' : 'auto' }}
                >
                  {activePart?.imageUrl ? (
                    <img
                      src={storageUrl(activePart.imageUrl)}
                      alt={activePart?.label || "Produkt"}
                      className="w-full h-auto"
                      draggable={false}
                    />
                  ) : (
                    <div className="w-full aspect-[3/4] bg-white flex items-center justify-center">
                      <p className="text-sm text-muted-foreground">Kein Bild</p>
                    </div>
                  )}
                  {/* Hilfslinien */}
                  {renderGuidelines("right")}
                  {/* Zonen */}
                  {zones
                    .filter((zone) => {
                      if (!zone.side) return true;
                      const partKey = (activePart as any)?.key || '';
                      const isFrontPart = partKey.toLowerCase().includes('vorder') || partKey.toLowerCase().includes('front');
                      const isBackPart = partKey.toLowerCase().includes('rueck') || partKey.toLowerCase().includes('back');
                      if (isFrontPart) return zone.side === 'front';
                      if (isBackPart) return zone.side === 'back';
                      return true;
                    })
                    .map((zone) => renderZoneOverlay(zone, true, "right"))}
                </div>
              </div>

              {/* ─── Sidebar: Zone-Eigenschaften ─── */}
              <div className="hidden lg:block w-80 border-l bg-white overflow-y-auto p-4 space-y-3">
                <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Zonen</h3>
                
                {/* Verbandsregeln-Warnungen */}
                {(() => {
                  const effectiveSport = sport || 'fussball';
                  const rules = getJerseyRules(effectiveSport as any);
                  if (!rules) return null;
                  const baseWidthCm = (activePart as any)?.realWidthCm || 49;
                  const baseHeightCm = (activePart as any)?.realHeightCm || 68;
                  const partKey = (activePart as any)?.key || 'vorderteil';
                  const partName = partKey.includes('vorder') ? 'front' : partKey.includes('rueck') ? 'back' : 'front';
                  const warnings = validateZonesAgainstRules(
                    zones.map(z => ({
                      purpose: z.purpose,
                      widthCm: z.width / 100 * baseWidthCm,
                      heightCm: z.height / 100 * baseHeightCm,
                      part: z.side || partName,
                    })),
                    rules
                  );
                  if (warnings.length === 0) return null;
                  return (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 space-y-1">
                      <div className="flex items-center gap-1 text-amber-700 font-medium text-xs">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Verbandsvorgaben
                      </div>
                      {warnings.map((w, i) => (
                        <p key={i} className="text-[11px] text-amber-600">{w.message}</p>
                      ))}
                    </div>
                  );
                })()}

                {/* Zone-Liste */}
                {zones
                  .filter((zone) => {
                    if (!zone.side) return true;
                    const partKey = (activePart as any)?.key || '';
                    const isFrontPart = partKey.toLowerCase().includes('vorder') || partKey.toLowerCase().includes('front');
                    const isBackPart = partKey.toLowerCase().includes('rueck') || partKey.toLowerCase().includes('back');
                    if (isFrontPart) return zone.side === 'front';
                    if (isBackPart) return zone.side === 'back';
                    return true;
                  })
                  .map((zone) => {
                    const isSelected = selectedZoneId === zone.id;
                    const baseWidthCm = (activePart as any)?.realWidthCm || 49;
                    const baseHeightCm = (activePart as any)?.realHeightCm || 68;
                    const widthCm = (zone.width / 100 * baseWidthCm).toFixed(1);
                    const heightCm = (zone.height / 100 * baseHeightCm).toFixed(1);
                    const areaCm2 = (parseFloat(widthCm) * parseFloat(heightCm)).toFixed(1);

                    return (
                      <div
                        key={zone.id}
                        className={`border rounded-lg p-3 cursor-pointer transition-all ${
                          isSelected ? 'border-amber-400 bg-amber-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedZoneId(isSelected ? null : zone.id)}
                      >
                        {/* Zone Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{zone.name}</span>
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{zone.purpose}</span>
                          </div>
                          <button
                            className="text-red-400 hover:text-red-600 p-1"
                            onClick={(e) => { e.stopPropagation(); removeZone(zone.id); }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* cm-Maße */}
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                          <Ruler className="w-3 h-3" />
                          <span>{widthCm} × {heightCm} cm</span>
                          <span className="text-gray-400">|</span>
                          <span>{areaCm2} cm²</span>
                        </div>

                        {/* Erweiterte Einstellungen bei Auswahl */}
                        {isSelected && (
                          <div className="mt-3 space-y-3 border-t pt-3">
                            {/* Größe (Breite x Höhe in cm) */}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-[11px] text-gray-500">Breite (cm)</Label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={widthCm}
                                  onChange={(e) => {
                                    const newWidthCm = parseFloat(e.target.value) || 0;
                                    const newWidthPct = (newWidthCm / baseWidthCm) * 100;
                                    setZones(zones.map(z => z.id === zone.id ? { ...z, width: Math.min(100, Math.max(1, newWidthPct)) } : z));
                                  }}
                                  className="h-7 text-xs"
                                />
                              </div>
                              <div>
                                <Label className="text-[11px] text-gray-500">Höhe (cm)</Label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={heightCm}
                                  onChange={(e) => {
                                    const newHeightCm = parseFloat(e.target.value) || 0;
                                    const newHeightPct = (newHeightCm / baseHeightCm) * 100;
                                    setZones(zones.map(z => z.id === zone.id ? { ...z, height: Math.min(100, Math.max(1, newHeightPct)) } : z));
                                  }}
                                  className="h-7 text-xs"
                                />
                              </div>
                            </div>

                            {/* Rotation */}
                            <div>
                              <Label className="text-[11px] text-gray-500">Rotation ({zone.rotation || 0}°)</Label>
                              <Slider
                                value={[zone.rotation || 0]}
                                min={-180}
                                max={180}
                                step={1}
                                onValueChange={([val]) => {
                                  setZones(zones.map(z => z.id === zone.id ? { ...z, rotation: val } : z));
                                }}
                                className="mt-1"
                              />
                            </div>

                            {/* Schriftfarbe */}
                            <div>
                              <Label className="text-[11px] text-gray-500">Schriftfarbe</Label>
                              <div className="flex items-center gap-2 mt-1">
                                <input
                                  type="color"
                                  value={zone.fontColor || '#000000'}
                                  onChange={(e) => setZones(zones.map(z => z.id === zone.id ? { ...z, fontColor: e.target.value } : z))}
                                  className="w-8 h-8 rounded border cursor-pointer"
                                />
                                <Input
                                  value={zone.fontColor || '#000000'}
                                  onChange={(e) => setZones(zones.map(z => z.id === zone.id ? { ...z, fontColor: e.target.value } : z))}
                                  className="h-7 text-xs flex-1"
                                />
                              </div>
                            </div>

                            {/* Outline-Farbe */}
                            <div>
                              <Label className="text-[11px] text-gray-500">Outline-Farbe</Label>
                              <div className="flex items-center gap-2 mt-1">
                                <input
                                  type="color"
                                  value={zone.outlineColor || '#ffffff'}
                                  onChange={(e) => setZones(zones.map(z => z.id === zone.id ? { ...z, outlineColor: e.target.value } : z))}
                                  className="w-8 h-8 rounded border cursor-pointer"
                                />
                                <Input
                                  value={zone.outlineColor || ''}
                                  onChange={(e) => setZones(zones.map(z => z.id === zone.id ? { ...z, outlineColor: e.target.value } : z))}
                                  className="h-7 text-xs flex-1"
                                  placeholder="keine"
                                />
                                <Input
                                  type="number"
                                  value={zone.outlineWidth || 0}
                                  onChange={(e) => setZones(zones.map(z => z.id === zone.id ? { ...z, outlineWidth: parseFloat(e.target.value) || 0 } : z))}
                                  className="h-7 text-xs w-14"
                                  placeholder="px"
                                />
                              </div>
                            </div>

                            {/* Schriftart */}
                            {["playerName", "playerNumber", "clubName", "abbreviation"].includes(zone.purpose) && (
                              <div>
                                <Label className="text-[11px] text-gray-500">Schriftart</Label>
                                <Select
                                  value={zone.fontFamily || FONT_STYLE_MAP[zone.fontStyle || "block"]}
                                  onValueChange={(val) => {
                                    const style = inferFontStyle(val);
                                    setZones(zones.map(z => z.id === zone.id ? { ...z, fontFamily: val, fontStyle: style } : z));
                                  }}
                                >
                                  <SelectTrigger className="h-7 text-xs mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(FONT_STYLE_MAP).map(([style, family]) => (
                                      <SelectItem key={style} value={family}>
                                        <span style={{ fontFamily: family }}>{family}</span>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {/* Bogentext */}
                            {["playerName", "clubName", "abbreviation"].includes(zone.purpose) && (
                              <div className="flex items-center gap-2">
                                <Label className="text-[11px] text-gray-500">Bogentext</Label>
                                <Button
                                  size="sm"
                                  variant={zone.textStyle === 'arc' ? 'default' : 'outline'}
                                  className="h-6 text-[10px] px-2"
                                  onClick={() => {
                                    setZones(zones.map(z => z.id === zone.id ? {
                                      ...z,
                                      textStyle: z.textStyle === 'arc' ? 'straight' : 'arc',
                                      arcDegree: z.textStyle === 'arc' ? undefined : 30,
                                    } : z));
                                  }}
                                >
                                  ⌒ Bogen
                                </Button>
                                {zone.textStyle === 'arc' && (
                                  <Input
                                    type="number"
                                    value={zone.arcDegree || 30}
                                    onChange={(e) => setZones(zones.map(z => z.id === zone.id ? { ...z, arcDegree: parseInt(e.target.value) || 30 } : z))}
                                    className="h-6 text-xs w-16"
                                    min={5}
                                    max={180}
                                  />
                                )}
                              </div>
                            )}

                            {/* Schriftstärke */}
                            <div className="flex items-center gap-2">
                              <Label className="text-[11px] text-gray-500">Fett</Label>
                              <Button
                                size="sm"
                                variant={zone.fontWeight === 'bold' ? 'default' : 'outline'}
                                className="h-6 text-[10px] px-2"
                                onClick={() => {
                                  setZones(zones.map(z => z.id === zone.id ? { ...z, fontWeight: z.fontWeight === 'bold' ? 'normal' : 'bold' } : z));
                                }}
                              >
                                B
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>,
          document.body
        )}
      </CardContent>
    </Card>
  );
}

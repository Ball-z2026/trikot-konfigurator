import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Upload, Plus, Trash2, Move, Save, Image as ImageIcon, AlertTriangle, Sparkles, Loader2, ChevronLeft, Maximize2, Ruler } from "lucide-react";

import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { storageUrl } from "@/lib/utils";
import { useLocation } from "wouter";
import { useZoneEditor } from "@/contexts/ZoneEditorContext";
// toPng nicht mehr benötigt – Template-Bild wird direkt gespeichert
import { getJerseyRules, validateZonesAgainstRules } from "@shared/jerseyRules";
import { TEXTIL_TEMPLATES, SPORT_TYPES } from "@shared/templates";

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

/**
 * Macht alle nicht-transparenten Pixel eines freigestellten Bildes weiß.
 * Der Alpha-Kanal bleibt erhalten (Silhouette bleibt sichtbar).
 * Lädt das Ergebnis auf den Server hoch und gibt die Storage-URL zurück.
 */
async function makeWhiteTemplate(imageUrl: string): Promise<{ url: string; key: string } | null> {
  try {
    // Bild über die korrekte Proxy-URL laden
    const resolvedUrl = imageUrl.startsWith("/manus-storage/")
      ? imageUrl.replace("/manus-storage/", "/api/storage-proxy/")
      : imageUrl;

    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Bild konnte nicht geladen werden für Weiß-Konvertierung"));
      img.src = resolvedUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Alle Pixel mit Alpha > 0 werden weiß gefärbt, Alpha bleibt erhalten
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 0) { // Pixel ist nicht komplett transparent
        data[i] = 255;     // R = weiß
        data[i + 1] = 255; // G = weiß
        data[i + 2] = 255; // B = weiß
        // data[i + 3] bleibt unverändert (Alpha-Kanal = Silhouette)
      }
    }

    ctx.putImageData(imageData, 0, 0);
    
    // Canvas als PNG exportieren und auf Server hochladen
    const dataUrl = canvas.toDataURL("image/png");
    const base64 = dataUrl.split(",")[1];
    
    const uploadRes = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: `template-weiss-${Date.now()}.png`,
        data: base64,
        contentType: "image/png",
      }),
    });
    
    if (uploadRes.ok) {
      const { url, key } = await uploadRes.json();
      return { url, key };
    }
    
    // Fallback: Data-URL zurückgeben wenn Upload fehlschlägt
    console.warn("Upload des weißen Templates fehlgeschlagen, verwende Data-URL");
    return null;
  } catch (err) {
    console.warn("makeWhiteTemplate fehlgeschlagen:", err);
    return null;
  }
}

export function TemplateUpload({
  orgId,
  departmentId,
  teamId,
  sport,
  category,
  onSaved,
  onCancel,
}: TemplateUploadProps) {
  const [, setLocation] = useLocation();
  const { openEditor, registerSaveCallback, registerDiscardCallback } = useZoneEditor();
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
  const [removingBg, setRemovingBg] = useState(false);
  // Freigestelltes Bild (nach KI-Analyse + Hintergrund-Entfernung)
  const [cutoutImageUrl, setCutoutImageUrl] = useState<string | null>(null);
  // Sportart-Auswahl (für Verbandsregeln)
  const [selectedSport, setSelectedSport] = useState<string>(sport || "");
  // Trikotfarbe (frei wählbar auf weißem Template)
  const [jerseyColor, setJerseyColor] = useState<string>("#ffffff");

  // Split-View: Ausgewähltes Produkt
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedPartId, setSelectedPartId] = useState<number | null>(null);
  // Fullscreen-Editor: Navigation zur eigenständigen Route
  const openFullscreenEditor = useCallback(() => {
    const snapshot = JSON.parse(JSON.stringify(zones));
    // Registriere Callbacks für Speichern/Verwerfen
    registerSaveCallback((savedZones) => {
      setZones(savedZones);
    });
    registerDiscardCallback(() => {
      setZones(snapshot);
    });
    // Öffne den Editor als eigene Route
    openEditor({
      zones: JSON.parse(JSON.stringify(zones)),
      selectedProductId,
      selectedPartId,
      orgId,
      sport,
      category,
      snapshot,
    });
    setLocation('/designer/zone-editor');
  }, [zones, selectedProductId, selectedPartId, orgId, sport, category, openEditor, registerSaveCallback, registerDiscardCallback, setLocation]);

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
  const removeBackgroundMutation = trpc.mockup.removeBackground.useMutation();

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

  // Google Fonts für erkannte Schriften laden (nur wenn sich Font-Familien ändern)
  const fontFamiliesKey = zones.map(z => z.fontFamily || FONT_STYLE_MAP[z.fontStyle || "block"] || "").sort().join(",");
  useEffect(() => {
    const families = new Set<string>();
    for (const z of zones) {
      const family = z.fontFamily || FONT_STYLE_MAP[z.fontStyle || "block"];
      if (family && family !== "Inter") families.add(family);
    }
    if (families.size === 0) return;
    const existing = document.getElementById("template-upload-fonts");
    const newHref = `https://fonts.googleapis.com/css2?${[...families]
      .map((f) => `family=${f.replace(/ /g, "+")}:wght@400;700;900`)
      .join("&")}&display=swap`;
    // Nur aktualisieren wenn sich die Fonts geändert haben
    if (existing && existing.getAttribute("href") === newHref) return;
    if (existing) existing.remove();
    const link = document.createElement("link");
    link.id = "template-upload-fonts";
    link.rel = "stylesheet";
    link.href = newHref;
    document.head.appendChild(link);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontFamiliesKey]);

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

      // Schritt 1: KI-Analyse – Zonen erkennen
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
        toast.success(summary + " – Freistellung wird gestartet...");

        // Schritt 2: Hintergrund entfernen (Freistellung)
        setRemovingBg(true);
        try {
          const bgResult = await removeBackgroundMutation.mutateAsync({
            imageUrl: fullImageUrl,
          });
          // Schritt 3: Trikot-Innenfläche weiß machen (Silhouette erhalten, Farbe entfernen)
          // Alle nicht-transparenten Pixel werden weiß gefärbt, der Alpha-Kanal bleibt erhalten
          const whiteResult = await makeWhiteTemplate(bgResult.url);
          
          if (whiteResult) {
            // Weißes Template erfolgreich erstellt und hochgeladen
            setCutoutImageUrl(whiteResult.url);
            setImageUrl(whiteResult.url);
            setImageStorageKey(whiteResult.key);
            toast.success("Trikot freigestellt & weiß gemacht! Wählen Sie jetzt eine Farbe.");
          } else {
            // Fallback: Freigestelltes Bild ohne Weiß-Konvertierung verwenden
            setCutoutImageUrl(bgResult.url);
            setImageUrl(bgResult.url);
            if (bgResult.key) {
              setImageStorageKey(bgResult.key);
            }
            toast.success("Trikot freigestellt! Das freigestellte Bild ist jetzt euer Template.");
          }
        } catch (bgError: any) {
          // Freistellung fehlgeschlagen – trotzdem mit Original-Bild weiterarbeiten
          toast.warning(
            "Freistellung fehlgeschlagen – Original-Bild wird verwendet. " +
            (bgError.message || "")
          );
        } finally {
          setRemovingBg(false);
        }
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
      const canvasEl = canvas === "left" ? leftCanvasRef.current : rightCanvasRef.current;
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
  // Ref für live Drag-Position (DOM-Updates ohne React-Rerenders)
  const liveDragPosRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const ds = dragStateRef.current;
      if (ds.dragging === null && ds.resizing === null) return;
      // Nur auf dem Canvas-Element preventDefault, nicht global
      const canvasEl = ds.canvas === "left" ? leftCanvasRef.current : rightCanvasRef.current;
      if (!canvasEl) return;
      const rect = canvasEl.getBoundingClientRect();
      const posX = ((e.clientX - rect.left) / rect.width) * 100;
      const posY = ((e.clientY - rect.top) / rect.height) * 100;
      const dx = posX - ds.startX;
      const dy = posY - ds.startY;

      // Live-Position in Ref speichern (kein setState = kein Rerender)
      if (ds.dragging !== null) {
        liveDragPosRef.current = {
          x: Math.max(0, Math.min(100 - ds.zoneW, ds.zoneX + dx)),
          y: Math.max(0, Math.min(100 - ds.zoneH, ds.zoneY + dy)),
          w: ds.zoneW,
          h: ds.zoneH,
        };
      }
      if (ds.resizing !== null) {
        liveDragPosRef.current = {
          x: ds.zoneX,
          y: ds.zoneY,
          w: Math.max(3, Math.min(100 - ds.zoneX, ds.zoneW + dx)),
          h: Math.max(3, Math.min(100 - ds.zoneY, ds.zoneH + dy)),
        };
      }

      // Visuelles Update via DOM (kein React-Rerender)
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const targetId = ds.dragging || ds.resizing;
        if (!targetId || !liveDragPosRef.current) return;
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
      // Commit: Nur einmal setState bei pointerup
      if (targetId && liveDragPosRef.current) {
        const pos = liveDragPosRef.current;
        if (ds.dragging !== null) {
          setZones((prev) =>
            prev.map((z) => z.id === targetId ? { ...z, x: pos.x, y: pos.y } : z)
          );
        }
        if (ds.resizing !== null) {
          setZones((prev) =>
            prev.map((z) => z.id === targetId ? { ...z, width: pos.w, height: pos.h } : z)
          );
        }
      }
      liveDragPosRef.current = null;
      dragStateRef.current = { dragging: null, resizing: null, startX: 0, startY: 0, zoneX: 0, zoneY: 0, zoneW: 0, zoneH: 0, canvas: "left" };
      setDraggingZone(null);
      setResizingZone(null);
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    };

    if (draggingZone !== null || resizingZone !== null) {
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
      // Das weiße Template-Bild (Silhouette) wird direkt als Vorlagen-Bild verwendet
      // KEIN Screenshot mit toPng – das würde die Zonen-Overlays mitrendern
      const templateImageUrl = imageUrl;
      const templateStorageKey = imageStorageKey || undefined;

      const result = await createTemplate.mutateAsync({
        name: templateName,
        imageUrl: templateImageUrl,
        storageKey: templateStorageKey,
        positionsConfig: zones.length > 0 ? { productId: null, zones, jerseyColor } : undefined,
        orgId,
        departmentId,
        teamId,
        sport: selectedSport as any || sport as any,
        category: category as any,
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
        data-zone-id={zone.id}
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
            <Label>Sportart (für Verbandsregeln) *</Label>
            <Select
              value={selectedSport}
              onValueChange={(v) => setSelectedSport(v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sportart wählen..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {SPORT_TYPES.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.icon} {s.name}
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

        {/* ═══ TRIKOT-CANVAS: Freigestelltes Template mit Zonen ═══ */}
        <div className="grid grid-cols-1 gap-4">
          {/* ─── LINKE SEITE: Vorlagenbild ─── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                {cutoutImageUrl ? "Trikot-Template (freigestellt)" : "Trikot hochladen"}
              </Label>
              <div className="flex gap-2">
                {imageUrl && zones.length > 0 && (
                  <Button size="sm" variant="default" onClick={openFullscreenEditor} className="bg-indigo-600 hover:bg-indigo-700 min-h-[44px] min-w-[44px] touch-manipulation">
                    <Maximize2 className="w-4 h-4 mr-1" />
                    Bearbeiten
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => setAddingZone(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Zone
                </Button>
                {imageUrl && (
                  <Button
                    size="sm"
                    onClick={handleAiAnalyze}
                    disabled={analyzing || removingBg}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Zonen erkennen...
                    </>
                  ) : removingBg ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Freistellen...
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
                  className={`relative border rounded-lg overflow-hidden select-none ${cutoutImageUrl ? 'bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20width%3D%2720%27%20height%3D%2720%27%3E%3Crect%20width%3D%2710%27%20height%3D%2710%27%20fill%3D%27%23f0f0f0%27/%3E%3Crect%20x%3D%2710%27%20y%3D%2710%27%20width%3D%2710%27%20height%3D%2710%27%20fill%3D%27%23f0f0f0%27/%3E%3Crect%20x%3D%2710%27%20width%3D%2710%27%20height%3D%2710%27%20fill%3D%27%23fff%27/%3E%3Crect%20y%3D%2710%27%20width%3D%2710%27%20height%3D%2710%27%20fill%3D%27%23fff%27/%3E%3C/svg%3E")]' : 'bg-gray-100'}`}
                  style={{ touchAction: (draggingZone || resizingZone) ? 'none' : 'auto' }}
                >
                  <img src={storageUrl(imageUrl)} alt="Vorlage" className="w-full h-auto" draggable={false} />
                  {/* Farb-Overlay: Trikotfarbe über weißem Template (multiply blend mode) */}
                  {cutoutImageUrl && jerseyColor !== "#ffffff" && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        backgroundColor: jerseyColor,
                        mixBlendMode: "multiply",
                        opacity: 0.85,
                      }}
                    />
                  )}
                  {/* Hilfslinien bei Drag */}
                  {renderGuidelines("left")}

                  {/* Zonen-Overlays (editierbar per Drag & Drop) */}
                  {zones.map((zone) => renderZoneOverlay(zone, true, "left"))}
                </div>
                {cutoutImageUrl && (
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1">
                      <span>✓</span>
                      <span>Freigestellt & weiß – Wählen Sie die Trikotfarbe</span>
                    </div>
                    {/* Farbauswahl für Trikot */}
                    <div className="flex items-center gap-3">
                      <Label className="text-sm font-medium whitespace-nowrap">Trikotfarbe:</Label>
                      <input
                        type="color"
                        value={jerseyColor}
                        onChange={(e) => setJerseyColor(e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer border border-gray-300"
                      />
                      <div className="flex gap-1 flex-wrap">
                        {["#ffffff", "#000000", "#dc2626", "#2563eb", "#16a34a", "#eab308", "#7c3aed", "#f97316", "#ec4899", "#06b6d4"].map((color) => (
                          <button
                            key={color}
                            className={`w-7 h-7 rounded-full border-2 transition-transform ${jerseyColor === color ? 'border-gray-900 scale-110' : 'border-gray-300 hover:scale-105'}`}
                            style={{ backgroundColor: color }}
                            onClick={() => setJerseyColor(color)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
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
            disabled={saving || !imageUrl || !templateName.trim()}
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

      </CardContent>
    </Card>
  );
}

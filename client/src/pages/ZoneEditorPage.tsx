import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Plus, Trash2, X, Ruler, Check, Undo2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { storageUrl } from "@/lib/utils";
import { useZoneEditor, type Zone } from "@/contexts/ZoneEditorContext";
import { getJerseyRules, validateZonesAgainstRules } from "@shared/jerseyRules";

// Mapping: KI fontStyle-Kategorie -> konkrete Google Font Familie
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

const ZONE_PURPOSES = [
  { value: "logo", label: "Logo / Wappen" },
  { value: "playerName", label: "Spielername" },
  { value: "playerNumber", label: "Spielernummer" },
  { value: "clubName", label: "Vereinsname" },
  { value: "sponsor", label: "Sponsor" },
  { value: "abbreviation", label: "Kürzel" },
  { value: "custom", label: "Freitext" },
];

export default function ZoneEditorPage() {
  const [, setLocation] = useLocation();
  const { editorData, onSave, onDiscard } = useZoneEditor();

  // Lokaler Zonen-State (Kopie von editorData.zones)
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedPartId, setSelectedPartId] = useState<number | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [addingZone, setAddingZone] = useState(false);
  const [newZoneName, setNewZoneName] = useState("");
  const [newZonePurpose, setNewZonePurpose] = useState("logo");
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Drag & Drop State
  const [draggingZone, setDraggingZone] = useState<string | null>(null);
  const [resizingZone, setResizingZone] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
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
  const rafRef = useRef<number | null>(null);
  const liveDragPosRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  // Template-Bild aus editorData (freigestelltes/eingefärbtes Trikot)
  const templateImageUrl = editorData?.templateImageUrl || null;

  // Initialisierung: Zonen aus Context laden
  useEffect(() => {
    if (editorData) {
      setZones(JSON.parse(JSON.stringify(editorData.zones)));
      setSelectedPartId(editorData.selectedPartId);
    }
  }, [editorData]);

  // Redirect wenn keine Editor-Daten vorhanden
  useEffect(() => {
    if (!editorData) {
      setLocation("/designer/products");
    }
  }, [editorData, setLocation]);

  // Google Fonts laden
  const fontFamiliesKey = zones.map(z => z.fontFamily || FONT_STYLE_MAP[z.fontStyle || "block"] || "").sort().join(",");
  useEffect(() => {
    const families = new Set<string>();
    for (const z of zones) {
      const family = z.fontFamily || FONT_STYLE_MAP[z.fontStyle || "block"];
      if (family && family !== "Inter") families.add(family);
    }
    if (families.size === 0) return;
    const existing = document.getElementById("zone-editor-fonts");
    const newHref = `https://fonts.googleapis.com/css2?${[...families]
      .map((f) => `family=${f.replace(/ /g, "+")}:wght@400;700;900`)
      .join("&")}&display=swap`;
    if (existing && existing.getAttribute("href") === newHref) return;
    if (existing) existing.remove();
    const link = document.createElement("link");
    link.id = "zone-editor-fonts";
    link.rel = "stylesheet";
    link.href = newHref;
    document.head.appendChild(link);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontFamiliesKey]);

  // activePart wird nicht mehr benötigt - Bild kommt direkt aus editorData.templateImageUrl

  // ─── Speichern / Verwerfen / Schließen ───
  const handleSave = useCallback(() => {
    onSave(zones);
    toast.success("Änderungen gespeichert");
    setLocation("/designer/products");
  }, [zones, onSave, setLocation]);

  const handleDiscard = useCallback(() => {
    onDiscard();
    toast.info("Änderungen verworfen");
    setLocation("/designer/products");
  }, [onDiscard, setLocation]);

  const handleClose = useCallback(() => {
    if (!editorData) {
      setLocation("/designer/products");
      return;
    }
    const hasChanges = JSON.stringify(zones) !== JSON.stringify(editorData.snapshot);
    if (hasChanges) {
      setShowDiscardConfirm(true);
    } else {
      onDiscard();
      setLocation("/designer/products");
    }
  }, [zones, editorData, onDiscard, setLocation]);

  // ─── Zone hinzufügen / entfernen ───
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

  // ─── Pointer Events Drag & Drop ───
  const getRelativePosition = useCallback((e: React.PointerEvent | PointerEvent, canvasEl: HTMLDivElement) => {
    const rect = canvasEl.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
  }, []);

  const handleZonePointerDown = useCallback(
    (e: React.PointerEvent, zoneId: string, isResize = false) => {
      e.preventDefault();
      e.stopPropagation();
      const zone = zones.find((z) => z.id === zoneId);
      if (!zone) return;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      if (e.pointerType === "touch" && navigator.vibrate) {
        navigator.vibrate(15);
      }
      const canvasEl = canvasRef.current;
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
      };
      if (isResize) setResizingZone(zoneId);
      else setDraggingZone(zoneId);
      setSelectedZoneId(zoneId);
    },
    [zones, getRelativePosition]
  );

  // Window-level pointer move/up
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const ds = dragStateRef.current;
      if (ds.dragging === null && ds.resizing === null) return;
      const canvasEl = canvasRef.current;
      if (!canvasEl) return;
      const rect = canvasEl.getBoundingClientRect();
      const posX = ((e.clientX - rect.left) / rect.width) * 100;
      const posY = ((e.clientY - rect.top) / rect.height) * 100;
      const dx = posX - ds.startX;
      const dy = posY - ds.startY;

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
      dragStateRef.current = { dragging: null, resizing: null, startX: 0, startY: 0, zoneX: 0, zoneY: 0, zoneW: 0, zoneH: 0 };
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

  // ─── Hilfslinien-Overlay ───
  const renderGuidelines = () => {
    if (!selectedZoneId || (draggingZone === null && resizingZone === null)) return null;
    const zone = zones.find(z => z.id === selectedZoneId);
    if (!zone) return null;
    const centerX = zone.x + zone.width / 2;
    const centerY = zone.y + zone.height / 2;
    return (
      <>
        <div className="absolute top-0 bottom-0 pointer-events-none" style={{ left: `${centerX}%`, width: '1px', backgroundColor: 'rgba(245,158,11,0.5)' }} />
        <div className="absolute left-0 right-0 pointer-events-none" style={{ top: `${centerY}%`, height: '1px', backgroundColor: 'rgba(245,158,11,0.5)' }} />
        <div className="absolute top-0 bottom-0 pointer-events-none" style={{ left: '50%', width: '1px', backgroundColor: 'rgba(100,100,100,0.2)', borderLeft: '1px dashed rgba(100,100,100,0.3)' }} />
        <div className="absolute left-0 right-0 pointer-events-none" style={{ top: '50%', height: '1px', backgroundColor: 'rgba(100,100,100,0.2)', borderTop: '1px dashed rgba(100,100,100,0.3)' }} />
        <div className="absolute top-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none z-30">
          {Math.round(zone.x)}%, {Math.round(zone.y)}% | {Math.round(zone.width)}%×{Math.round(zone.height)}%
        </div>
      </>
    );
  };

  // ─── Zone-Overlay Renderer ───
  const renderZoneOverlay = (zone: Zone) => {
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
        key={zone.id}
        data-zone-id={zone.id}
        className="absolute flex items-center justify-center overflow-hidden cursor-move"
        style={{
          left: `${zone.x}%`,
          top: `${zone.y}%`,
          width: `${zone.width}%`,
          height: `${zone.height}%`,
          border: `2px solid ${borderColor}`,
          backgroundColor: isSelected ? "rgba(245,158,11,0.12)" : "rgba(59,130,246,0.07)",
          touchAction: 'none',
          boxShadow: isSelected ? `0 0 0 2px ${borderColor}, 0 2px 8px rgba(0,0,0,0.15)` : undefined,
          zIndex: isSelected ? 10 : 1,
          transform: zone.rotation ? `rotate(${zone.rotation}deg)` : undefined,
        }}
        onPointerDown={(e) => handleZonePointerDown(e, zone.id, false)}
      >
        {/* Text-Vorschau */}
        {isTextZone && previewText ? (
          <div className="w-full h-full flex items-center justify-center">
            {zone.textStyle === "arc" && zone.arcDegree ? (
              <svg viewBox="0 0 200 80" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <path id={`editor_arc_${zone.id}`} d="M 10 60 A 100 100 0 0 1 190 60" fill="none" />
                </defs>
                {(zone.outlineColor && zone.outlineWidth && zone.outlineWidth > 0) || needsContrastStroke ? (
                  <text fontFamily={fontFamily} fontWeight={zone.fontWeight || "bold"} fontSize="28" fill="none" stroke={zone.outlineColor || contrastStrokeColor} strokeWidth={zone.outlineWidth ? zone.outlineWidth * 0.5 : 1.5} strokeLinejoin="round">
                    <textPath href={`#editor_arc_${zone.id}`} startOffset="50%" textAnchor="middle">{previewText}</textPath>
                  </text>
                ) : null}
                <text fontFamily={fontFamily} fontWeight={zone.fontWeight || "bold"} fontSize="28" fill={zone.fontColor || "#000000"}>
                  <textPath href={`#editor_arc_${zone.id}`} startOffset="50%" textAnchor="middle">{previewText}</textPath>
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
        {/* Resize Handle + Delete */}
        <div
          className="absolute -bottom-1 -right-1 w-4 h-4 rounded-sm cursor-se-resize flex items-center justify-center"
          style={{ backgroundColor: borderColor, touchAction: 'none' }}
          onPointerDown={(e) => {
            e.stopPropagation();
            handleZonePointerDown(e, zone.id, true);
          }}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M7 1L1 7M7 4L4 7M7 7L7 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <div
            className="absolute -top-2 -left-2 -right-0 -bottom-0 w-8 h-8"
            style={{ touchAction: 'none' }}
            onPointerDown={(e) => {
              e.stopPropagation();
              handleZonePointerDown(e, zone.id, true);
            }}
          />
        </div>
        <button
          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 z-20"
          onClick={(e) => {
            e.stopPropagation();
            removeZone(zone.id);
          }}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    );
  };

  // Wenn keine Editor-Daten vorhanden, zeige nichts (Redirect passiert via useEffect)
  if (!editorData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Alle Zonen anzeigen (kein Part-Filter mehr nötig, da nur ein Bild)
  const filteredZones = zones;

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col">
      {/* Header */}
      <div className="h-14 bg-gray-900 text-white flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-lg">Vorlagen-Editor</h2>
          {editorData?.sport && (
            <span className="text-xs bg-gray-700 px-2 py-1 rounded">{editorData.sport}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => setAddingZone(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Zone
          </Button>
          <Button size="sm" variant="ghost" className="text-red-300 hover:text-red-100 hover:bg-red-900/50" onClick={handleDiscard}>
            <Undo2 className="w-4 h-4 mr-1" />
            Verwerfen
          </Button>
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleSave}>
            <Check className="w-4 h-4 mr-1" />
            Speichern
          </Button>
          <Button size="sm" variant="ghost" className="text-white hover:bg-gray-700" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Content: Canvas links, Sidebar rechts */}
      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        {/* ─── Canvas (großes Trikot-Bild) ─── */}
        <div className="flex-1 flex items-center justify-center bg-gray-100 p-4 lg:p-8 overflow-auto">
          <div
            ref={canvasRef}
            className="relative bg-gray-100 select-none shadow-xl rounded-lg overflow-hidden"
            style={{ maxWidth: '900px', width: '100%', touchAction: (draggingZone || resizingZone) ? 'none' : 'auto' }}
          >
            {templateImageUrl ? (
              <img
                src={templateImageUrl.startsWith('data:') ? templateImageUrl : storageUrl(templateImageUrl)}
                alt="Trikot-Vorlage"
                className="w-full h-auto"
                draggable={false}
              />
            ) : (
              <div className="w-full aspect-[3/4] bg-white flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Kein Bild vorhanden</p>
              </div>
            )}
            {/* Hilfslinien */}
            {renderGuidelines()}
            {/* Zonen */}
            {filteredZones.map((zone) => renderZoneOverlay(zone))}
          </div>
        </div>

        {/* ─── Sidebar: Zone-Eigenschaften ─── */}
        <div className="hidden lg:block w-80 border-l bg-white overflow-y-auto p-4 space-y-3">
          <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Zonen</h3>

          {/* Verbandsregeln-Warnungen */}
          {(() => {
            const effectiveSport = editorData.sport || 'fussball';
            const rules = getJerseyRules(effectiveSport as any);
            if (!rules) return null;
            const baseWidthCm = 49;
            const baseHeightCm = 68;
            const partName = 'front';
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
          {filteredZones.map((zone) => {
            const isSelected = selectedZoneId === zone.id;
            const baseWidthCm = 49;
            const baseHeightCm = 68;
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

      {/* AlertDialog: Bestätigung beim Schließen mit ungespeicherten Änderungen */}
      <AlertDialog open={showDiscardConfirm} onOpenChange={setShowDiscardConfirm}>
        <AlertDialogContent className="z-[99999]">
          <AlertDialogHeader>
            <AlertDialogTitle>Ungespeicherte Änderungen</AlertDialogTitle>
            <AlertDialogDescription>
              Sie haben Änderungen an den Zonen vorgenommen. Möchten Sie diese speichern oder verwerfen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDiscardConfirm(false)}>Zurück zum Editor</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                setShowDiscardConfirm(false);
                handleDiscard();
              }}
            >
              Verwerfen
            </AlertDialogAction>
            <AlertDialogAction
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                setShowDiscardConfirm(false);
                handleSave();
              }}
            >
              Speichern
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

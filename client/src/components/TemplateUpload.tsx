import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Upload, Plus, Trash2, Move, Save, Image as ImageIcon, AlertTriangle, Sparkles, Loader2, ArrowRight, ChevronLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { storageUrl } from "@/lib/utils";

interface Zone {
  id: string;
  name: string;
  purpose: string;
  x: number; // Prozent
  y: number; // Prozent
  width: number; // Prozent
  height: number; // Prozent
  side?: "front" | "back";
  // Stil-Erkennung durch KI
  textStyle?: "arc" | "straight";
  arcDegree?: number;
  fontColor?: string;
  outlineColor?: string;
  outlineWidth?: number;
  fontStyle?: "block" | "serif" | "sans" | "script" | "outline" | "shadow";
  fontWeight?: "normal" | "bold";
  fontSize?: number;
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

export function TemplateUpload({
  orgId,
  departmentId,
  teamId,
  sport,
  category,
  onSaved,
  onCancel,
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

  // Drag/Resize State (für rechte Seite – unser Produkt)
  const [dragging, setDragging] = useState<string | null>(null);
  const [resizing, setResizing] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const leftCanvasRef = useRef<HTMLDivElement>(null);
  const rightCanvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createTemplate = trpc.designTemplate.create.useMutation();
  const analyzeImage = trpc.designTemplate.analyzeImage.useMutation();

  // Produkte laden
  const { data: products } = trpc.product.list.useQuery();
  // Parts des ausgewählten Produkts laden
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
        const newZones: Zone[] = result.zones.map((z: any, idx: number) => ({
          id: `ai_zone_${Date.now()}_${idx}`,
          name: z.name,
          purpose: z.purpose,
          x: Math.max(0, Math.min(100, z.x)),
          y: Math.max(0, Math.min(100, z.y)),
          width: Math.max(5, Math.min(100 - z.x, z.width)),
          height: Math.max(5, Math.min(100 - z.y, z.height)),
          side: z.side,
          textStyle: z.textStyle || "straight",
          arcDegree: z.arcDegree || 0,
          fontColor: z.fontColor || "#000000",
          outlineColor: z.outlineColor === "none" ? undefined : z.outlineColor,
          outlineWidth: z.outlineWidth || 0,
          fontStyle: z.fontStyle || "block",
          fontWeight: z.fontWeight || "bold",
          fontSize: z.fontSize || 80,
        }));

        setZones(newZones);

        const arcCount = newZones.filter(z => z.textStyle === "arc").length;
        const outlineCount = newZones.filter(z => z.outlineColor).length;
        let summary = `${newZones.length} Zonen erkannt`;
        if (arcCount > 0) summary += `, ${arcCount} mit Bogentext`;
        if (outlineCount > 0) summary += `, ${outlineCount} mit Outline`;
        toast.success(summary + " – Positionen auf Produkt übertragen!");
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
  };

  // ─── Drag & Resize auf der rechten Seite (unser Produkt) ───
  const handleMouseDown = (e: React.MouseEvent, zoneId: string, type: "drag" | "resize") => {
    e.preventDefault();
    e.stopPropagation();
    if (type === "drag") {
      setDragging(zoneId);
    } else {
      setResizing(zoneId);
    }
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleTouchStart = (e: React.TouchEvent, zoneId: string, type: "drag" | "resize") => {
    e.stopPropagation();
    const touch = e.touches[0];
    if (type === "drag") {
      setDragging(zoneId);
    } else {
      setResizing(zoneId);
    }
    setDragStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!rightCanvasRef.current) return;
      const rect = rightCanvasRef.current.getBoundingClientRect();
      const dx = ((e.clientX - dragStart.x) / rect.width) * 100;
      const dy = ((e.clientY - dragStart.y) / rect.height) * 100;

      if (dragging) {
        setZones((prev) =>
          prev.map((z) =>
            z.id === dragging
              ? { ...z, x: Math.max(0, Math.min(100 - z.width, z.x + dx)), y: Math.max(0, Math.min(100 - z.height, z.y + dy)) }
              : z
          )
        );
        setDragStart({ x: e.clientX, y: e.clientY });
      }

      if (resizing) {
        setZones((prev) =>
          prev.map((z) =>
            z.id === resizing
              ? { ...z, width: Math.max(5, z.width + dx), height: Math.max(5, z.height + dy) }
              : z
          )
        );
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    },
    [dragging, resizing, dragStart]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!rightCanvasRef.current) return;
      const touch = e.touches[0];
      const rect = rightCanvasRef.current.getBoundingClientRect();
      const dx = ((touch.clientX - dragStart.x) / rect.width) * 100;
      const dy = ((touch.clientY - dragStart.y) / rect.height) * 100;

      if (dragging) {
        setZones((prev) =>
          prev.map((z) =>
            z.id === dragging
              ? { ...z, x: Math.max(0, Math.min(100 - z.width, z.x + dx)), y: Math.max(0, Math.min(100 - z.height, z.y + dy)) }
              : z
          )
        );
        setDragStart({ x: touch.clientX, y: touch.clientY });
      }

      if (resizing) {
        setZones((prev) =>
          prev.map((z) =>
            z.id === resizing
              ? { ...z, width: Math.max(5, z.width + dx), height: Math.max(5, z.height + dy) }
              : z
          )
        );
        setDragStart({ x: touch.clientX, y: touch.clientY });
      }
    },
    [dragging, resizing, dragStart]
  );

  const handleMouseUp = () => {
    setDragging(null);
    setResizing(null);
  };

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
      const result = await createTemplate.mutateAsync({
        name: templateName,
        imageUrl,
        storageKey: imageStorageKey || undefined,
        positionsConfig: zones.length > 0 ? zones : undefined,
        orgId,
        departmentId,
        teamId,
        sport: sport as any,
        category: category as any,
        visibility,
        // Produkt-Zuordnung speichern
        productId: selectedProductId || undefined,
      });
      toast.success("Vorlage gespeichert!");
      onSaved?.(result.id);
    } catch (error: any) {
      toast.error(error.message || "Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  // ─── Zone-Overlay Renderer (wiederverwendbar für links und rechts) ───
  const renderZoneOverlay = (zone: Zone, editable: boolean) => (
    <div
      key={zone.id}
      className={`absolute border-2 flex items-center justify-center ${editable ? "cursor-move" : "pointer-events-none"}`}
      style={{
        left: `${zone.x}%`,
        top: `${zone.y}%`,
        width: `${zone.width}%`,
        height: `${zone.height}%`,
        borderColor: zone.fontColor && zone.fontColor !== "#000000" ? zone.fontColor : "#3b82f6",
        backgroundColor: `${zone.fontColor && zone.fontColor !== "#000000" ? zone.fontColor : "#3b82f6"}22`,
        touchAction: editable ? 'none' : undefined,
      }}
      onMouseDown={editable ? (e) => handleMouseDown(e, zone.id, "drag") : undefined}
      onTouchStart={editable ? (e) => handleTouchStart(e, zone.id, "drag") : undefined}
    >
      {/* Zonenname + Stil-Info */}
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
          {zone.outlineColor && zone.outlineColor !== "none" && (
            <span className="text-[7px] text-white px-0.5 rounded leading-tight" style={{ backgroundColor: zone.outlineColor }}>
              Outline
            </span>
          )}
        </div>
      </div>
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
      {/* Resize + Delete nur auf editierbarer Seite */}
      {editable && (
        <>
          <div
            className="absolute bottom-0 right-0 w-3 h-3 bg-blue-600 cursor-se-resize"
            onMouseDown={(e) => handleMouseDown(e, zone.id, "resize")}
            onTouchStart={(e) => handleTouchStart(e, zone.id, "resize")}
          />
          <button
            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
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

  return (
    <Card className="w-full max-w-none">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          KI-Bild-Analyse – Positionskopie
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Laden Sie ein Vorlagenbild hoch (links). Die KI erkennt alle Positionen und überträgt sie 1:1 auf Ihr Produkt (rechts).
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
            {productParts.parts.map((part: any) => (
              <Button
                key={part.id}
                size="sm"
                variant={selectedPartId === part.id ? "default" : "outline"}
                onClick={() => setSelectedPartId(part.id)}
              >
                {part.name}
              </Button>
            ))}
          </div>
        )}

        {/* ═══ SPLIT VIEW: Links Vorlage, Rechts unser Produkt ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                  className="relative border rounded-lg overflow-hidden bg-gray-100"
                >
                  <img src={storageUrl(imageUrl)} alt="Vorlage" className="w-full h-auto" draggable={false} />
                  {/* Zonen auf Vorlage anzeigen (nicht editierbar, nur Anzeige) */}
                  {zones.map((zone) => renderZoneOverlay(zone, false))}
                </div>
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
              </div>
            )}
          </div>

          {/* ─── PFEIL in der Mitte (nur Desktop) ─── */}
          {/* Wird durch das Grid-Layout implizit getrennt */}

          {/* ─── RECHTE SEITE: Unser Produkt mit kopierten Positionen ─── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Unser Produkt (Ergebnis)</Label>
              <Button size="sm" variant="outline" onClick={() => setAddingZone(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Zone hinzufügen
              </Button>
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
                className="relative border rounded-lg overflow-hidden bg-gray-100"
                style={{ touchAction: (dragging || resizing) ? 'none' : 'auto' }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUp}
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

                {/* 1:1 kopierte Zonen auf unserem Produkt (editierbar) - gefiltert nach Seite */}
                {zones
                  .filter((zone) => {
                    if (!zone.side) return true;
                    // Part-Key bestimmt welche Seite angezeigt wird
                    const partKey = (activePart as any)?.key || '';
                    const isFrontPart = partKey.toLowerCase().includes('vorder') || partKey.toLowerCase().includes('front');
                    const isBackPart = partKey.toLowerCase().includes('rueck') || partKey.toLowerCase().includes('back');
                    if (isFrontPart) return zone.side === 'front';
                    if (isBackPart) return zone.side === 'back';
                    return true; // Wenn Part-Key unklar, alle Zonen zeigen
                  })
                  .map((zone) => renderZoneOverlay(zone, true))}

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
                <div key={zone.id} className="p-2 bg-muted rounded-lg text-sm space-y-1">
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
                      {Math.round(zone.x)}%, {Math.round(zone.y)}% | {Math.round(zone.width)}%x{Math.round(zone.height)}%
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0 text-red-500 shrink-0"
                      onClick={() => removeZone(zone.id)}
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
                      {zone.fontStyle && (
                        <span className="text-[9px] bg-gray-100 text-gray-600 px-1 py-0.5 rounded">{zone.fontStyle}</span>
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
      </CardContent>
    </Card>
  );
}

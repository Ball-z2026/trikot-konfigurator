import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Upload, Plus, Trash2, Move, Save, Image as ImageIcon, AlertTriangle, Sparkles, Loader2 } from "lucide-react";
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
  arcDegree?: number; // Bogengrad (0 = gerade, 15-30 = typisch)
  fontColor?: string; // HEX
  outlineColor?: string; // HEX oder "none"
  outlineWidth?: number; // % der Schrifthöhe
  fontStyle?: "block" | "serif" | "sans" | "script" | "outline" | "shadow";
  fontWeight?: "normal" | "bold";
  fontSize?: number; // % der Zonenhöhe
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
  const [dragging, setDragging] = useState<string | null>(null);
  const [resizing, setResizing] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [analyzing, setAnalyzing] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createTemplate = trpc.designTemplate.create.useMutation();
  const analyzeImage = trpc.designTemplate.analyzeImage.useMutation();

  // DPI-Prüfung aus dem Bild
  const checkImageDpi = useCallback((file: File): Promise<number | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        // JPEG DPI aus EXIF/JFIF Header lesen
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

    // DPI prüfen
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
      // Vollständige URL für die KI-Analyse erstellen
      const fullImageUrl = imageUrl.startsWith("http")
        ? imageUrl
        : `${window.location.origin}${storageUrl(imageUrl)}`;

      const result = await analyzeImage.mutateAsync({
        imageUrl: fullImageUrl,
        sport: sport as any,
        category: category as any,
      });

      if (result.zones && result.zones.length > 0) {
        // Erkannte Zonen übernehmen inkl. Stil-Informationen
        const newZones: Zone[] = result.zones.map((z: any, idx: number) => ({
          id: `ai_zone_${Date.now()}_${idx}`,
          name: z.name,
          purpose: z.purpose,
          x: Math.max(0, Math.min(100, z.x)),
          y: Math.max(0, Math.min(100, z.y)),
          width: Math.max(5, Math.min(100 - z.x, z.width)),
          height: Math.max(5, Math.min(100 - z.y, z.height)),
          side: z.side,
          // Stil-Informationen von KI
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
        
        // Zusammenfassung der erkannten Stile
        const arcCount = newZones.filter(z => z.textStyle === "arc").length;
        const outlineCount = newZones.filter(z => z.outlineColor).length;
        let summary = `${newZones.length} Zonen erkannt`;
        if (arcCount > 0) summary += `, ${arcCount} mit Bogentext`;
        if (outlineCount > 0) summary += `, ${outlineCount} mit Outline`;
        toast.success(summary + "!");
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

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
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
      });
      toast.success("Vorlage gespeichert!");
      onSaved?.(result.id);
    } catch (error: any) {
      toast.error(error.message || "Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Neue Vorlage erstellen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="template-name">Vorlagenname *</Label>
          <Input
            id="template-name"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="z.B. Heimtrikot Saison 2025/26"
          />
        </div>

        {/* Sichtbarkeit */}
        <div className="space-y-2">
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

        {/* Bild-Upload */}
        <div className="space-y-2">
          <Label>Vorlagen-Bild *</Label>
          {!imageUrl ? (
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {uploading ? "Wird hochgeladen..." : "Klicken zum Hochladen (JPG, PNG, WebP)"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Laden Sie ein Bild eines Trikots oder Sportbekleidungsstücks hoch.
                Die KI erkennt automatisch die Positionen von Name, Nummer, Logo etc.
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
            <div className="space-y-3">
              {/* DPI-Warnung */}
              {dpiWarning && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {dpiWarning}
                </div>
              )}

              {/* KI-Analyse Button */}
              <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <Sparkles className="w-5 h-5 text-purple-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-purple-900">KI-Positionserkennung</p>
                  <p className="text-xs text-purple-700">
                    Analysiert das Bild und erkennt automatisch die Positionen von Spielername, Nummer, Logo, Teamname etc.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={handleAiAnalyze}
                  disabled={analyzing}
                  className="bg-purple-600 hover:bg-purple-700 text-white shrink-0"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Analysiert...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-1" />
                      Analysieren
                    </>
                  )}
                </Button>
              </div>

              {/* Canvas mit Bild und Zonen */}
              <div
                ref={canvasRef}
                className="relative border rounded-lg overflow-hidden select-none"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <img src={storageUrl(imageUrl)} alt="Vorlage" className="w-full h-auto" draggable={false} />

                {/* Zonen-Overlays */}
                {zones.map((zone) => (
                  <div
                    key={zone.id}
                    className="absolute border-2 cursor-move flex items-center justify-center"
                    style={{
                      left: `${zone.x}%`,
                      top: `${zone.y}%`,
                      width: `${zone.width}%`,
                      height: `${zone.height}%`,
                      borderColor: zone.fontColor && zone.fontColor !== "#000000" ? zone.fontColor : "#3b82f6",
                      backgroundColor: `${zone.fontColor && zone.fontColor !== "#000000" ? zone.fontColor : "#3b82f6"}33`,
                    }}
                    onMouseDown={(e) => handleMouseDown(e, zone.id, "drag")}
                  >
                    {/* Zonenname + Stil-Info */}
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-xs font-medium text-blue-900 bg-white/90 px-1 rounded truncate max-w-full">
                        {zone.name}
                      </span>
                      {/* Stil-Badges */}
                      <div className="flex gap-0.5">
                        {zone.textStyle === "arc" && (
                          <span className="text-[8px] bg-purple-600 text-white px-1 rounded">
                            ⌒ Bogen {zone.arcDegree}°
                          </span>
                        )}
                        {zone.outlineColor && zone.outlineColor !== "none" && (
                          <span className="text-[8px] text-white px-1 rounded" style={{ backgroundColor: zone.outlineColor }}>
                            Outline
                          </span>
                        )}
                        {zone.fontStyle && zone.fontStyle !== "block" && (
                          <span className="text-[8px] bg-gray-600 text-white px-1 rounded">
                            {zone.fontStyle}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Side-Indicator */}
                    {zone.side && (
                      <span className="absolute top-0 left-0 text-[9px] bg-blue-600 text-white px-1 rounded-br">
                        {zone.side === "front" ? "V" : "R"}
                      </span>
                    )}
                    {/* Farb-Indikator */}
                    {zone.fontColor && (
                      <div className="absolute bottom-0 left-0 flex gap-0.5 p-0.5">
                        <div className="w-3 h-3 rounded-full border border-white" style={{ backgroundColor: zone.fontColor }} title={`Textfarbe: ${zone.fontColor}`} />
                        {zone.outlineColor && zone.outlineColor !== "none" && (
                          <div className="w-3 h-3 rounded-full border border-white" style={{ backgroundColor: zone.outlineColor }} title={`Outline: ${zone.outlineColor}`} />
                        )}
                      </div>
                    )}
                    {/* Resize-Handle */}
                    <div
                      className="absolute bottom-0 right-0 w-3 h-3 bg-blue-600 cursor-se-resize"
                      onMouseDown={(e) => handleMouseDown(e, zone.id, "resize")}
                    />
                    {/* Delete-Button */}
                    <button
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeZone(zone.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Bild ersetzen */}
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

        {/* Zonen-Verwaltung (nur wenn Bild vorhanden) */}
        {imageUrl && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Positionierungszonen ({zones.length})</Label>
              <Button size="sm" variant="outline" onClick={() => setAddingZone(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Zone manuell hinzufügen
              </Button>
            </div>

            {zones.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Noch keine Zonen definiert. Nutzen Sie die KI-Analyse oder fügen Sie Zonen manuell hinzu.
              </p>
            )}

            {zones.length > 0 && (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {zones.map((zone) => (
                  <div key={zone.id} className="p-2 bg-muted rounded-lg text-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <Move className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="font-medium truncate">{zone.name}</span>
                      <span className="text-muted-foreground text-xs shrink-0">
                        ({ZONE_PURPOSES.find((p) => p.value === zone.purpose)?.label})
                      </span>
                      {zone.side && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded shrink-0">
                          {zone.side === "front" ? "Vorne" : "Rücken"}
                        </span>
                      )}
                      <span className="text-muted-foreground text-xs ml-auto shrink-0">
                        {Math.round(zone.width)}% x {Math.round(zone.height)}%
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-red-500 shrink-0"
                        onClick={() => removeZone(zone.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    {/* Stil-Details (nur wenn KI-Analyse Daten vorhanden) */}
                    {(zone.textStyle || zone.fontColor) && (
                      <div className="flex items-center gap-2 pl-8 flex-wrap">
                        {zone.textStyle === "arc" && (
                          <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                            ⌒ Bogen {zone.arcDegree}°
                          </span>
                        )}
                        {zone.textStyle === "straight" && (
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                            → Gerade
                          </span>
                        )}
                        {zone.fontColor && (
                          <span className="text-[10px] flex items-center gap-1">
                            <span className="w-3 h-3 rounded-full border inline-block" style={{ backgroundColor: zone.fontColor }} />
                            {zone.fontColor}
                          </span>
                        )}
                        {zone.outlineColor && zone.outlineColor !== "none" && (
                          <span className="text-[10px] flex items-center gap-1">
                            <span className="w-3 h-3 rounded-full border inline-block" style={{ backgroundColor: zone.outlineColor }} />
                            Outline {zone.outlineWidth}%
                          </span>
                        )}
                        {zone.fontStyle && (
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                            {zone.fontStyle} / {zone.fontWeight}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Aktionen */}
        <div className="flex gap-3 pt-4 border-t">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Abbrechen
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving || !imageUrl || !templateName.trim()} className="ml-auto">
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

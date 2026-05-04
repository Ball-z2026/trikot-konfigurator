import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  Upload,
  Plus,
  Trash2,
  Save,
  Eye,
  EyeOff,
  Image,
  Type,
  Layers,
  Move,
  User,
  Hash,
  FileImage,
  PenTool,
  Loader2,
  LayoutGrid,
  RotateCw,
  Ruler,
  Palette,
  Building2,
  Shield,
  Droplets,
  X,
  MapPin,
  AtSign,
} from "lucide-react";
import { TEXTIL_TEMPLATES } from "@shared/templates";
import { storageUrl } from "@/lib/utils";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";

type PartData = {
  id: number;
  key: string;
  label: string;
  imageUrl: string | null;
  sortOrder: number;
  defaultColor: string | null;
};

type ZoneData = {
  id: number;
  label: string;
  partId: number | null;
  side: "front" | "back";
  type: "image" | "text" | "both";
  purpose: "logo" | "clubLogo" | "playerName" | "playerNumber" | "playerInitials" | "clubName" | "abbreviation" | "coordinates" | "hashtag" | "custom";
  posX: number;
  posY: number;
  width: number;
  height: number;
  widthCm: number | null;
  heightCm: number | null;
  rotation: number;
  fontFamily: string | null;
  fontSize: number | null;
  fontColor: string | null;
  fontWeight: string | null;
  textAlign: string | null;
  sortOrder: number;
};

const PURPOSE_CONFIG: Record<string, { label: string; icon: typeof FileImage; description: string; autoType: "image" | "text" | "both" }> = {
  logo: { label: "Logo", icon: FileImage, description: "Bild-Upload (Logo, Sponsor)", autoType: "image" as const },
  clubLogo: { label: "Vereinswappen", icon: Shield, description: "Vereinswappen – automatisch vom Owner gesetzt, nur Owner kann ändern", autoType: "image" as const },
  playerName: { label: "Spielername", icon: User, description: "Automatisch aus Mannschaftsliste", autoType: "text" as const },
  playerNumber: { label: "Nummer", icon: Hash, description: "Automatisch aus Mannschaftsliste", autoType: "text" as const },
  playerInitials: { label: "Kürzel", icon: Type, description: "Initialen des Spielers (z.B. MM für Max Müller)", autoType: "text" as const },
  clubName: { label: "Vereinsname", icon: Building2, description: "Fester Vereinsname für alle Trikots", autoType: "text" as const },
  abbreviation: { label: "Kürzel", icon: Type, description: "Kürzel/Abkürzung (z.B. Vereinskürzel)", autoType: "text" as const },
  coordinates: { label: "Koordinaten", icon: MapPin, description: "GPS-Koordinaten des Vereins (automatisch aus Adresse)", autoType: "text" as const },
  hashtag: { label: "Hashtag", icon: AtSign, description: "Vereins-Hashtag (z.B. #TSVMusterstadt)", autoType: "text" as const },
  custom: { label: "Freitext", icon: PenTool, description: "Freie Texteingabe durch Kunde", autoType: "text" as const },
};

const FONT_OPTIONS = [
  { value: "Inter", label: "Inter (Standard)" },
  { value: "Oswald", label: "Oswald (Sportlich)" },
  { value: "Bebas Neue", label: "Bebas Neue (Block)" },
  { value: "Roboto Condensed", label: "Roboto Condensed" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Anton", label: "Anton (Impact)" },
  { value: "Barlow Condensed", label: "Barlow Condensed" },
  { value: "Teko", label: "Teko (Schmal)" },
  { value: "Rajdhani", label: "Rajdhani" },
  { value: "Russo One", label: "Russo One" },
];

const FONT_WEIGHT_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "bold", label: "Fett" },
  { value: "100", label: "Dünn (100)" },
  { value: "300", label: "Leicht (300)" },
  { value: "500", label: "Medium (500)" },
  { value: "700", label: "Fett (700)" },
  { value: "900", label: "Schwarz (900)" },
];

const TEXT_ALIGN_OPTIONS = [
  { value: "left", label: "Links" },
  { value: "center", label: "Zentriert" },
  { value: "right", label: "Rechts" },
];

export default function AdminProductEditor() {
  const { id } = useParams<{ id: string }>();
  const productId = parseInt(id || "0");
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data: productData, isLoading } = trpc.product.getById.useQuery(
    { id: productId },
    { enabled: productId > 0 }
  );

  const updateProduct = trpc.product.update.useMutation({
    onSuccess: () => {
      utils.product.getById.invalidate({ id: productId });
      toast.success("Produkt gespeichert");
    },
    onError: (err) => toast.error(`Fehler: ${err.message}`),
  });

  const createPart = trpc.part.create.useMutation({
    onSuccess: () => {
      utils.product.getById.invalidate({ id: productId });
      toast.success("Teil hinzugefügt");
    },
  });

  const updatePartMut = trpc.part.update.useMutation({
    onSuccess: () => utils.product.getById.invalidate({ id: productId }),
  });

  const deletePartMut = trpc.part.delete.useMutation({
    onSuccess: () => {
      utils.product.getById.invalidate({ id: productId });
      toast.success("Teil gelöscht");
    },
  });

  const createZone = trpc.zone.create.useMutation({
    onSuccess: () => {
      utils.product.getById.invalidate({ id: productId });
      toast.success("Zone erstellt");
    },
  });

  const updateZoneMut = trpc.zone.update.useMutation({
    onSuccess: () => utils.product.getById.invalidate({ id: productId }),
  });

  const deleteZoneMut = trpc.zone.delete.useMutation({
    onSuccess: () => {
      utils.product.getById.invalidate({ id: productId });
      toast.success("Zone gelöscht");
    },
  });

  const bulkUpdatePositions = trpc.zone.bulkUpdatePositions.useMutation({
    onSuccess: () => utils.product.getById.invalidate({ id: productId }),
  });

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [activePartId, setActivePartId] = useState<number | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [draggingZone, setDraggingZone] = useState<number | null>(null);
  const [resizingZone, setResizingZone] = useState<number | null>(null);
  const [localZones, setLocalZones] = useState<ZoneData[]>([]);
  const [dragStart, setDragStart] = useState<{
    x: number; y: number; zoneX: number; zoneY: number; zoneW: number; zoneH: number;
  } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{ dragging: number | null; resizing: number | null; startX: number; startY: number; zoneX: number; zoneY: number; zoneW: number; zoneH: number }>({ dragging: null, resizing: null, startX: 0, startY: 0, zoneX: 0, zoneY: 0, zoneW: 0, zoneH: 0 });
  const rafRef = useRef<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [colorPalette, setColorPalette] = useState<string[]>([]);
  const [newColor, setNewColor] = useState("#1e40af");

  const parts: PartData[] = (productData?.parts as PartData[]) || [];
  const hasParts = parts.length > 0;

  // Sublimation-Erkennung: Farbauswahl nur für Sublimationsprodukte
  const isSublimation = useMemo(() => {
    if (!productData?.templateId) return false;
    const tmpl = TEXTIL_TEMPLATES.find((t) => t.id === productData.templateId);
    return tmpl?.printMethod === "sublimation";
  }, [productData?.templateId]);

  useEffect(() => {
    if (productData) {
      setName(productData.name);
      setCategory(productData.category || "");
      setDescription(productData.description || "");
      setColorPalette((productData as any).colorPalette || []);
      setLocalZones(
        (productData.zones as ZoneData[]).map((z) => ({
          ...z,
          purpose: z.purpose || "logo",
          rotation: z.rotation ?? 0,
          widthCm: z.widthCm ?? null,
          heightCm: z.heightCm ?? null,
          fontFamily: z.fontFamily ?? null,
          fontSize: z.fontSize ?? null,
          fontColor: z.fontColor ?? null,
          fontWeight: z.fontWeight ?? null,
          textAlign: z.textAlign ?? null,
        }))
      );
      if (activePartId === null && productData.parts?.length) {
        setActivePartId((productData.parts as PartData[])[0].id);
      }
    }
  }, [productData]);

  const activePart = parts.find((p) => p.id === activePartId);
  const currentImage = storageUrl(hasParts ? activePart?.imageUrl || null : null) || null;
  const currentZones = hasParts
    ? localZones.filter((z) => z.partId === activePartId)
    : localZones;
  const selectedZone = localZones.find((z) => z.id === selectedZoneId);

  // ─── Image Upload for Part ─────────────────────────────────────────────
  const handlePartImageUpload = useCallback(
    async (partId: number) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/jpeg,image/png,image/webp,image/svg+xml,image/gif";
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
          toast.error(`Datei zu groß (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum: 10 MB`);
          return;
        }
        setUploading(true);
        setUploadProgress("Wird hochgeladen...");
        try {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string).split(",")[1]);
            reader.onerror = () => reject(new Error("Datei konnte nicht gelesen werden"));
            reader.readAsDataURL(file);
          });
          const resp = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileName: file.name, data: base64, contentType: file.type }),
          });
          if (!resp.ok) {
            const errData = await resp.json().catch(() => ({}));
            throw new Error(errData.error || `Upload fehlgeschlagen (${resp.status})`);
          }
          const { url } = await resp.json();
          await updatePartMut.mutateAsync({ id: partId, imageUrl: url });
          toast.success("Bild hochgeladen");
        } catch (err: any) {
          toast.error(err.message || "Upload fehlgeschlagen");
        } finally {
          setUploading(false);
          setUploadProgress("");
        }
      };
      input.click();
    },
    [updatePartMut]
  );

  // ─── Zone Drag & Drop (Pointer Events API - iOS Safari kompatibel) ─────────────────────────
  const getRelativePosition = useCallback((e: React.PointerEvent | PointerEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
  }, []);

  const handleZonePointerDown = useCallback(
    (e: React.PointerEvent, zoneId: number, isResize = false) => {
      e.preventDefault();
      e.stopPropagation();
      const zone = localZones.find((z) => z.id === zoneId);
      if (!zone) return;
      // Capture pointer for reliable tracking on touch
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      // Haptic feedback on touch
      if (e.pointerType === "touch" && navigator.vibrate) {
        navigator.vibrate(15);
      }
      const pos = getRelativePosition(e);
      dragStateRef.current = {
        dragging: isResize ? null : zoneId,
        resizing: isResize ? zoneId : null,
        startX: pos.x,
        startY: pos.y,
        zoneX: zone.posX,
        zoneY: zone.posY,
        zoneW: zone.width,
        zoneH: zone.height,
      };
      setDragStart({ x: pos.x, y: pos.y, zoneX: zone.posX, zoneY: zone.posY, zoneW: zone.width, zoneH: zone.height });
      if (isResize) setResizingZone(zoneId);
      else setDraggingZone(zoneId);
      setSelectedZoneId(zoneId);
    },
    [localZones, getRelativePosition]
  );

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const ds = dragStateRef.current;
      if (ds.dragging === null && ds.resizing === null) return;
      e.preventDefault();
      const canvasEl = canvasRef.current;
      if (!canvasEl) return;
      const rect = canvasEl.getBoundingClientRect();
      const posX = ((e.clientX - rect.left) / rect.width) * 100;
      const posY = ((e.clientY - rect.top) / rect.height) * 100;
      const dx = posX - ds.startX;
      const dy = posY - ds.startY;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        if (ds.dragging !== null) {
          setLocalZones((prev) =>
            prev.map((z) =>
              z.id === ds.dragging
                ? { ...z, posX: Math.max(0, Math.min(100 - z.width, ds.zoneX + dx)), posY: Math.max(0, Math.min(100 - z.height, ds.zoneY + dy)) }
                : z
            )
          );
        }
        if (ds.resizing !== null) {
          setLocalZones((prev) =>
            prev.map((z) =>
              z.id === ds.resizing
                ? { ...z, width: Math.max(3, Math.min(100 - z.posX, ds.zoneW + dx)), height: Math.max(3, Math.min(100 - z.posY, ds.zoneH + dy)) }
                : z
            )
          );
        }
      });
    };

    const handlePointerUp = () => {
      const ds = dragStateRef.current;
      if (ds.dragging !== null || ds.resizing !== null) {
        const changedZones = localZones
          .filter((z) => {
            const orig = productData?.zones?.find((oz: any) => oz.id === z.id);
            if (!orig) return false;
            return orig.posX !== z.posX || orig.posY !== z.posY || orig.width !== z.width || orig.height !== z.height;
          })
          .map((z) => ({
            id: z.id,
            posX: Math.round(z.posX * 100) / 100,
            posY: Math.round(z.posY * 100) / 100,
            width: Math.round(z.width * 100) / 100,
            height: Math.round(z.height * 100) / 100,
          }));
        if (changedZones.length > 0) bulkUpdatePositions.mutate({ zones: changedZones });
      }
      dragStateRef.current = { dragging: null, resizing: null, startX: 0, startY: 0, zoneX: 0, zoneY: 0, zoneW: 0, zoneH: 0 };
      setDraggingZone(null);
      setResizingZone(null);
      setDragStart(null);
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
  }, [draggingZone, resizingZone, localZones, productData, bulkUpdatePositions]);

  // ─── Zone update helper ────────────────────────────────────────────────
  const updateLocalZone = (zoneId: number, updates: Partial<ZoneData>) => {
    setLocalZones((prev) => prev.map((z) => z.id === zoneId ? { ...z, ...updates } : z));
  };

  const saveZoneField = (zoneId: number, field: string, value: any) => {
    updateZoneMut.mutate({ id: zoneId, [field]: value });
  };

  // ─── Zone Colors ────────────────────────────────────────────────────────
  const zoneColors = [
    "rgba(59, 130, 246, 0.3)", "rgba(16, 185, 129, 0.3)", "rgba(245, 158, 11, 0.3)",
    "rgba(239, 68, 68, 0.3)", "rgba(139, 92, 246, 0.3)", "rgba(236, 72, 153, 0.3)",
  ];
  const zoneBorderColors = [
    "rgb(59, 130, 246)", "rgb(16, 185, 129)", "rgb(245, 158, 11)",
    "rgb(239, 68, 68)", "rgb(139, 92, 246)", "rgb(236, 72, 153)",
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-muted-foreground">Produkt nicht gefunden oder kein Zugriff.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-20">
        <div className="container flex items-center justify-between h-12 sm:h-14 px-3 sm:px-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link href="/designer">
              <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 sm:h-9 sm:w-9"><ArrowLeft className="w-4 h-4" /></Button>
            </Link>
            <h1 className="text-sm sm:text-lg font-bold truncate">{productData.name}</h1>
            <Badge variant={productData.published ? "default" : "secondary"} className="hidden sm:inline-flex">
              {productData.published ? "Veröffentlicht" : "Entwurf"}
            </Badge>
          </div>
          <div className="flex gap-1.5 sm:gap-2 shrink-0">
            <Button variant="outline" size="sm" className="h-8 text-xs sm:text-sm" onClick={() => updateProduct.mutate({ id: productId, published: !productData.published })}>
              {productData.published ? <><EyeOff className="w-3.5 h-3.5 sm:mr-1.5" /><span className="hidden sm:inline">Zurückziehen</span></> : <><Eye className="w-3.5 h-3.5 sm:mr-1.5" /><span className="hidden sm:inline">Veröffentlichen</span></>}
            </Button>
            <Button size="sm" className="h-8 text-xs sm:text-sm" onClick={() => updateProduct.mutate({ id: productId, name, category: category || undefined, description: description || undefined })}>
              <Save className="w-3.5 h-3.5 sm:mr-1.5" /><span className="hidden sm:inline">Speichern</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-4 sm:py-6 px-3 sm:px-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-4 sm:gap-6">
          {/* Left: Canvas */}
          <div className="space-y-3">
            {/* Part Tabs / Navigation */}
            {hasParts && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <LayoutGrid className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Teile</span>
                </div>
                <ScrollArea className="w-full">
                  <div className="flex gap-2 pb-2">
                    {parts.sort((a, b) => a.sortOrder - b.sortOrder).map((part) => {
                      const isActive = activePartId === part.id;
                      const partZones = localZones.filter((z) => z.partId === part.id);
                      return (
                        <button
                          key={part.id}
                          className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all min-w-[90px] sm:min-w-[110px] ${
                            isActive ? "border-primary bg-primary/5 shadow-sm" : "border-transparent hover:border-muted-foreground/20 hover:bg-muted/50"
                          }`}
                          onClick={() => { setActivePartId(part.id); setSelectedZoneId(null); }}
                        >
                          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-muted/30 rounded overflow-hidden">
                            {part.imageUrl ? (
                              <img src={storageUrl(part.imageUrl)} alt={part.label} className="w-full h-full object-contain" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><Image className="w-5 h-5 text-muted-foreground/30" /></div>
                            )}
                          </div>
                          <span className="text-[10px] sm:text-xs font-medium text-center leading-tight">{part.label}</span>
                          {isSublimation && part.defaultColor && (
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: part.defaultColor }} />
                              <span className="text-[8px] font-mono text-muted-foreground">{part.defaultColor}</span>
                            </div>
                          )}
                          {partZones.length > 0 && (
                            <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">{partZones.length} {partZones.length === 1 ? "Zone" : "Zonen"}</Badge>
                          )}
                        </button>
                      );
                    })}
                    <button
                      className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5 transition-all min-w-[90px] sm:min-w-[110px]"
                      onClick={() => createPart.mutate({ productId, key: `teil_${parts.length + 1}`, label: `Teil ${parts.length + 1}`, sortOrder: parts.length })}
                    >
                      <Plus className="w-5 h-5 text-muted-foreground" />
                      <span className="text-[10px] sm:text-xs text-muted-foreground">Neues Teil</span>
                    </button>
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>

                {activePart && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-xs sm:text-sm" onClick={() => handlePartImageUpload(activePart.id)} disabled={uploading}>
                      {uploading ? <><Loader2 className="w-3.5 h-3.5 sm:mr-1.5 animate-spin" /><span className="hidden sm:inline">{uploadProgress}</span></> : <><Upload className="w-3.5 h-3.5 sm:mr-1.5" /><span className="hidden sm:inline">Bild für {activePart.label}</span></>}
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => { if (confirm(`"${activePart.label}" wirklich löschen?`)) { deletePartMut.mutate({ id: activePart.id }); setActivePartId(parts.find((p) => p.id !== activePart.id)?.id || null); } }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Canvas Area */}
            <Card className="overflow-hidden">
              <div
                ref={canvasRef}
                className="relative bg-[#f8f9fa] aspect-[3/4] select-none"
                style={{ cursor: draggingZone ? "grabbing" : "default", touchAction: (draggingZone !== null || resizingZone !== null) ? "none" : "pan-y" }}
                onClick={() => setSelectedZoneId(null)}
              >
                {currentImage ? (
                  <img src={currentImage} alt="Produktansicht" className="w-full h-full object-contain pointer-events-none" draggable={false} />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground px-4">
                    <Upload className="w-10 h-10 sm:w-12 sm:h-12 mb-3 opacity-30" />
                    <p className="text-xs sm:text-sm text-center">
                      {hasParts && activePart ? `Klicke oben auf "Bild hochladen" um ein Bild für "${activePart.label}" hinzuzufügen` : "Kein Teil ausgewählt"}
                    </p>
                  </div>
                )}

                {/* Zones Overlay */}
                {currentZones.map((zone, idx) => {
                  const colorIdx = idx % zoneColors.length;
                  const isSelected = selectedZoneId === zone.id;
                  const PurposeIcon = PURPOSE_CONFIG[zone.purpose]?.icon || FileImage;
                  const isBeingDragged = draggingZone === zone.id || resizingZone === zone.id;
                  return (
                    <div
                      key={zone.id}
                      className={`absolute group ${isBeingDragged ? 'zone-dragging' : ''}`}
                      style={{
                        left: `${zone.posX}%`, top: `${zone.posY}%`, width: `${zone.width}%`, height: `${zone.height}%`,
                        backgroundColor: isSelected ? zoneColors[colorIdx].replace("0.3", "0.5") : zoneColors[colorIdx],
                        border: isBeingDragged ? `2px solid hsl(var(--primary))` : `2px ${isSelected ? "solid" : "dashed"} ${zoneBorderColors[colorIdx]}`,
                        borderRadius: "4px",
                        cursor: draggingZone === zone.id ? "grabbing" : "grab",
                        zIndex: isBeingDragged ? 50 : isSelected ? 10 : 1,
                        transform: isBeingDragged
                          ? `rotate(${zone.rotation || 0}deg) scale(1.04)`
                          : `rotate(${zone.rotation || 0}deg)`,
                        transformOrigin: "center center",
                        transition: isBeingDragged ? 'none' : 'all 150ms',
                        touchAction: 'none',
                      }}
                      onPointerDown={(e) => handleZonePointerDown(e, zone.id)}
                      onClick={(e) => { e.stopPropagation(); setSelectedZoneId(zone.id); }}
                    >
                      {/* Zone Label */}
                      <div
                        className={`absolute -top-5 sm:-top-6 left-0 text-[10px] sm:text-xs font-medium px-1 sm:px-1.5 py-0.5 rounded whitespace-nowrap flex items-center gap-1 ${isBeingDragged ? 'zone-dragging-label' : ''}`}
                        style={{ backgroundColor: isBeingDragged ? 'hsl(var(--primary))' : zoneBorderColors[colorIdx], color: "white", transform: `rotate(${-(zone.rotation || 0)}deg)`, fontWeight: isBeingDragged ? 600 : undefined }}
                      >
                        <PurposeIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />{zone.label}
                      </div>

                      {/* Zone Content Preview */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        {zone.type === "text" || zone.type === "both" ? (
                          <span
                            className="text-[10px] sm:text-xs opacity-60 truncate px-1"
                            style={{
                              fontFamily: zone.fontFamily || "Inter",
                              fontWeight: zone.fontWeight || "normal",
                              color: zone.fontColor || "#333",
                              textAlign: (zone.textAlign as any) || "center",
                            }}
                          >
                            {zone.purpose === "playerName" ? "MÜLLER" :
                             zone.purpose === "playerNumber" ? "10" :
                             zone.purpose === "playerInitials" ? "MM" :
                             zone.purpose === "clubName" ? "FC Muster" :
                             zone.purpose === "coordinates" ? "51.51°N 7.47°E" :
                             zone.purpose === "hashtag" ? "#TSV" :
                             zone.purpose === "abbreviation" ? "TSV" :
                             "Abc"}
                          </span>
                        ) : (
                          <Move className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow opacity-0 group-hover:opacity-60 transition-opacity" />
                        )}
                      </div>

                      {/* Resize Handle */}
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-4 sm:h-4 rounded-sm cursor-se-resize" style={{ backgroundColor: zoneBorderColors[colorIdx], touchAction: 'none' }} onPointerDown={(e) => handleZonePointerDown(e, zone.id, true)}>
                        {/* Erweiterter Touch-Bereich */}
                        <div className="absolute -top-3 -left-3 -right-1 -bottom-1" style={{ touchAction: 'none' }} onPointerDown={(e) => handleZonePointerDown(e, zone.id, true)} />
                      </div>

                      {/* Rotation indicator */}
                      {(zone.rotation || 0) !== 0 && (
                        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-mono opacity-70 whitespace-nowrap" style={{ color: zoneBorderColors[colorIdx], transform: `rotate(${-(zone.rotation || 0)}deg)` }}>
                          {zone.rotation}°
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Right: Settings Panel */}
          <div className="space-y-4">
            <Tabs defaultValue="zones">
              <TabsList className="w-full">
                <TabsTrigger value="details" className="flex-1 text-xs sm:text-sm">Details</TabsTrigger>
                {hasParts && activePart && (
                  <TabsTrigger value="part" className="flex-1 text-xs sm:text-sm">Teil</TabsTrigger>
                )}
                <TabsTrigger value="zones" className="flex-1 text-xs sm:text-sm">Zonen</TabsTrigger>
              </TabsList>

              {/* Product Details Tab */}
              <TabsContent value="details" className="space-y-4 mt-3 sm:mt-4">
                <Card>
                  <CardHeader className="pb-2 sm:pb-3"><CardTitle className="text-sm sm:text-base">Produktdetails</CardTitle></CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div>
                      <Label htmlFor="edit-name" className="text-xs sm:text-sm">Name</Label>
                      <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} className="h-8 sm:h-9" />
                    </div>
                    <div>
                      <Label htmlFor="edit-category" className="text-xs sm:text-sm">Kategorie</Label>
                      <Input id="edit-category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="z.B. Trikot, Hoodie, Jacke..." className="h-8 sm:h-9" />
                    </div>
                    <div>
                      <Label htmlFor="edit-desc" className="text-xs sm:text-sm">Beschreibung</Label>
                      <Input id="edit-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optionale Beschreibung..." className="h-8 sm:h-9" />
                    </div>
                  </CardContent>
                </Card>

                {/* Color Palette Editor - nur für Sublimation */}
                {isSublimation && (
                  <Card>
                    <CardHeader className="pb-2 sm:pb-3">
                      <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                        <Droplets className="w-4 h-4" />
                        Farbpalette (Sublimation)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        Definiere die verfügbaren Farben, aus denen Kunden pro Trikotteil wählen können.
                      </p>

                      {/* Existing colors */}
                      {colorPalette.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {colorPalette.map((color, idx) => (
                            <div key={idx} className="relative group">
                              <div
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg border-2 border-border shadow-sm cursor-pointer transition-transform hover:scale-110"
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                              <button
                                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                  const updated = colorPalette.filter((_, i) => i !== idx);
                                  setColorPalette(updated);
                                  updateProduct.mutate({ id: productId, colorPalette: updated.length > 0 ? updated : null });
                                }}
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                              <span className="text-[8px] font-mono text-muted-foreground text-center block mt-0.5 leading-none">{color}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add new color */}
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          className="w-8 h-8 rounded border cursor-pointer"
                          value={newColor}
                          onChange={(e) => setNewColor(e.target.value)}
                        />
                        <Input
                          className="h-8 text-xs font-mono flex-1"
                          value={newColor}
                          onChange={(e) => setNewColor(e.target.value)}
                          placeholder="#000000"
                        />
                        <Button
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => {
                            if (newColor && /^#[0-9a-fA-F]{6}$/.test(newColor) && !colorPalette.includes(newColor)) {
                              const updated = [...colorPalette, newColor];
                              setColorPalette(updated);
                              updateProduct.mutate({ id: productId, colorPalette: updated });
                              toast.success(`Farbe ${newColor} hinzugefügt`);
                            } else if (colorPalette.includes(newColor)) {
                              toast.error("Farbe bereits vorhanden");
                            } else {
                              toast.error("Ungültiger Hex-Farbwert (z.B. #1e40af)");
                            }
                          }}
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />Hinzufügen
                        </Button>
                      </div>

                      {colorPalette.length === 0 && (
                        <p className="text-[10px] text-muted-foreground italic text-center py-2">
                          Noch keine Farben definiert. Füge Farben hinzu, damit Kunden die Trikotteile einfärben können.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Part Details Tab */}
              {hasParts && activePart && (
                <TabsContent value="part" className="space-y-4 mt-3 sm:mt-4">
                  <Card>
                    <CardHeader className="pb-2 sm:pb-3"><CardTitle className="text-sm sm:text-base">Teil: {activePart.label}</CardTitle></CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4">
                      <div>
                        <Label className="text-xs sm:text-sm">Bezeichnung</Label>
                        <Input className="h-8 sm:h-9" defaultValue={activePart.label} onBlur={(e) => updatePartMut.mutate({ id: activePart.id, label: e.target.value })} />
                      </div>
                      <div>
                        <Label className="text-xs sm:text-sm">Schlüssel</Label>
                        <Input className="h-8 sm:h-9 font-mono text-xs" defaultValue={activePart.key} onBlur={(e) => updatePartMut.mutate({ id: activePart.id, key: e.target.value })} />
                      </div>
                      <div>
                        <Label className="text-xs sm:text-sm">Sortierung</Label>
                        <Input type="number" className="h-8 sm:h-9" defaultValue={activePart.sortOrder} onBlur={(e) => updatePartMut.mutate({ id: activePart.id, sortOrder: parseInt(e.target.value) || 0 })} />
                      </div>

                      {/* Default Color - nur für Sublimation */}
                      {isSublimation && (
                        <>
                          <Separator />
                          <div>
                            <Label className="text-xs sm:text-sm flex items-center gap-1.5">
                              <Droplets className="w-3.5 h-3.5" />
                              Standardfarbe für dieses Teil
                            </Label>
                            <p className="text-[10px] text-muted-foreground mb-2">
                              Diese Farbe wird als Voreinstellung für Kunden verwendet.
                            </p>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                className="w-8 h-8 rounded border cursor-pointer"
                                value={activePart.defaultColor || "#ffffff"}
                                onChange={(e) => {
                                  updatePartMut.mutate({ id: activePart.id, defaultColor: e.target.value });
                                }}
                              />
                              <Input
                                className="h-8 text-xs font-mono flex-1"
                                value={activePart.defaultColor || ""}
                                placeholder="Keine Farbe (transparent)"
                                onChange={(e) => {
                                  if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value) || e.target.value === "") {
                                    // Allow typing
                                  }
                                }}
                                onBlur={(e) => {
                                  const val = e.target.value.trim();
                                  if (val === "") {
                                    updatePartMut.mutate({ id: activePart.id, defaultColor: null });
                                  } else if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                                    updatePartMut.mutate({ id: activePart.id, defaultColor: val });
                                  }
                                }}
                              />
                              {activePart.defaultColor && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => updatePartMut.mutate({ id: activePart.id, defaultColor: null })}
                                  title="Farbe entfernen"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>

                            {/* Quick-Select from Palette */}
                            {colorPalette.length > 0 && (
                              <div className="mt-2">
                                <Label className="text-[10px] text-muted-foreground mb-1 block">Aus Palette wählen:</Label>
                                <div className="flex flex-wrap gap-1.5">
                                  {colorPalette.map((color, idx) => (
                                    <button
                                      key={idx}
                                      className={`w-6 h-6 rounded border-2 transition-all hover:scale-110 ${
                                        activePart.defaultColor === color ? "border-primary ring-1 ring-primary" : "border-border"
                                      }`}
                                      style={{ backgroundColor: color }}
                                      title={color}
                                      onClick={() => updatePartMut.mutate({ id: activePart.id, defaultColor: color })}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {/* Zones Tab */}
              <TabsContent value="zones" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                {/* Add Zone Button */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Platzierungszonen</span>
                  <Button
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() =>
                      createZone.mutate({
                        productId,
                        partId: activePartId || undefined,
                        label: `Zone ${currentZones.length + 1}`,
                        side: "front",
                        type: "image",
                        purpose: "logo",
                        posX: 25,
                        posY: 25,
                        width: 25,
                        height: 20,
                        rotation: 0,
                        sortOrder: currentZones.length,
                      })
                    }
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />Zone hinzufügen
                  </Button>
                </div>

                {/* Zone List */}
                {currentZones.length === 0 ? (
                  <Card>
                    <CardContent className="py-8">
                      <div className="text-center text-muted-foreground text-xs sm:text-sm">
                        <Layers className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-30" />
                        {hasParts && activePart ? `Noch keine Zonen für "${activePart.label}".` : "Noch keine Zonen vorhanden."}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <ScrollArea className="max-h-[calc(100vh-280px)]">
                    <div className="space-y-3 pr-2">
                      {currentZones.map((zone, idx) => {
                        const colorIdx = idx % zoneBorderColors.length;
                        const isSelected = selectedZoneId === zone.id;
                        const PurposeIcon = PURPOSE_CONFIG[zone.purpose]?.icon || FileImage;
                        const isTextZone = zone.type === "text" || zone.type === "both";

                        return (
                          <Card
                            key={zone.id}
                            className={`transition-all cursor-pointer ${isSelected ? "ring-2 shadow-md" : "hover:shadow-sm"}`}
                            style={{ borderColor: isSelected ? zoneBorderColors[colorIdx] : undefined, ...(isSelected ? { ringColor: zoneBorderColors[colorIdx] } : {}) }}
                            onClick={() => setSelectedZoneId(zone.id)}
                          >
                            <CardContent className="p-3 space-y-3">
                              {/* Header: Name + Purpose Badge + Delete */}
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: zoneBorderColors[colorIdx] }} />
                                <Input
                                  value={zone.label}
                                  className="h-7 text-xs sm:text-sm font-semibold flex-1"
                                  onChange={(e) => updateLocalZone(zone.id, { label: e.target.value })}
                                  onBlur={() => saveZoneField(zone.id, "label", zone.label)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <Badge variant="outline" className="text-[10px] shrink-0 gap-1">
                                  <PurposeIcon className="w-2.5 h-2.5" />
                                  {PURPOSE_CONFIG[zone.purpose]?.label}
                                </Badge>
                                <Button variant="ghost" size="icon" className="shrink-0 h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); deleteZoneMut.mutate({ id: zone.id }); }}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>

                              {/* Row: Type + Purpose */}
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-[10px] text-muted-foreground mb-1 block">Typ</Label>
                                  <Select
                                    value={zone.type}
                                    onValueChange={(val: "image" | "text" | "both") => {
                                      updateLocalZone(zone.id, { type: val });
                                      saveZoneField(zone.id, "type", val);
                                    }}
                                  >
                                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="image"><div className="flex items-center gap-1.5"><Image className="w-3 h-3" />Bild</div></SelectItem>
                                      <SelectItem value="text"><div className="flex items-center gap-1.5"><Type className="w-3 h-3" />Text</div></SelectItem>
                                      <SelectItem value="both"><div className="flex items-center gap-1.5"><Layers className="w-3 h-3" />Beides</div></SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-[10px] text-muted-foreground mb-1 block">Zweck</Label>
                                  <Select
                                    value={zone.purpose}
                                    onValueChange={(val: string) => {
                                      const purpose = val as "custom" | "logo" | "clubLogo" | "playerName" | "playerNumber" | "playerInitials" | "clubName" | "abbreviation" | "coordinates" | "hashtag";
                                      const autoType = PURPOSE_CONFIG[val]?.autoType || zone.type;
                                      updateLocalZone(zone.id, { purpose, type: autoType });
                                      updateZoneMut.mutate({ id: zone.id, purpose, type: autoType });
                                    }}
                                  >
                                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      {Object.entries(PURPOSE_CONFIG).map(([key, cfg]) => {
                                        const Icon = cfg.icon;
                                        return (
                                          <SelectItem key={key} value={key}>
                                            <div className="flex items-center gap-1.5"><Icon className="w-3 h-3" />{cfg.label}</div>
                                          </SelectItem>
                                        );
                                      })}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              {/* Expanded details when selected */}
                              {isSelected && (
                                <>
                                  <Separator className="my-1" />

                                  {/* Size in cm */}
                                  <div>
                                    <Label className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><Ruler className="w-3 h-3" />Druckmaße (cm)</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="relative">
                                        <Input
                                          type="number"
                                          step="0.1"
                                          min="0"
                                          placeholder="Breite"
                                          className="h-7 text-xs pr-8"
                                          value={zone.widthCm ?? ""}
                                          onChange={(e) => updateLocalZone(zone.id, { widthCm: e.target.value ? parseFloat(e.target.value) : null })}
                                          onBlur={() => saveZoneField(zone.id, "widthCm", zone.widthCm)}
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">cm</span>
                                      </div>
                                      <div className="relative">
                                        <Input
                                          type="number"
                                          step="0.1"
                                          min="0"
                                          placeholder="Höhe"
                                          className="h-7 text-xs pr-8"
                                          value={zone.heightCm ?? ""}
                                          onChange={(e) => updateLocalZone(zone.id, { heightCm: e.target.value ? parseFloat(e.target.value) : null })}
                                          onBlur={() => saveZoneField(zone.id, "heightCm", zone.heightCm)}
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">cm</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Rotation */}
                                  <div>
                                    <Label className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><RotateCw className="w-3 h-3" />Rotation</Label>
                                    <div className="flex items-center gap-3">
                                      <Slider
                                        min={0}
                                        max={360}
                                        value={[zone.rotation || 0]}
                                        onValueChange={([val]) => updateLocalZone(zone.id, { rotation: val })}
                                        onValueCommit={([val]) => saveZoneField(zone.id, "rotation", val)}
                                        className="flex-1"
                                      />
                                      <div className="relative w-16 shrink-0">
                                        <Input
                                          type="number"
                                          min="0"
                                          max="360"
                                          className="h-7 text-xs pr-5"
                                          value={zone.rotation || 0}
                                          onChange={(e) => updateLocalZone(zone.id, { rotation: parseInt(e.target.value) || 0 })}
                                          onBlur={() => saveZoneField(zone.id, "rotation", zone.rotation)}
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">°</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Position info */}
                                  <div className="grid grid-cols-4 gap-1.5">
                                    <div>
                                      <Label className="text-[10px] text-muted-foreground">X %</Label>
                                      <Input type="number" min="0" max="100" step="0.5" className="h-7 text-xs" value={Math.round(zone.posX * 10) / 10} onChange={(e) => { const v = parseFloat(e.target.value) || 0; updateLocalZone(zone.id, { posX: v }); }} onBlur={() => saveZoneField(zone.id, "posX", zone.posX)} onClick={(e) => e.stopPropagation()} />
                                    </div>
                                    <div>
                                      <Label className="text-[10px] text-muted-foreground">Y %</Label>
                                      <Input type="number" min="0" max="100" step="0.5" className="h-7 text-xs" value={Math.round(zone.posY * 10) / 10} onChange={(e) => { const v = parseFloat(e.target.value) || 0; updateLocalZone(zone.id, { posY: v }); }} onBlur={() => saveZoneField(zone.id, "posY", zone.posY)} onClick={(e) => e.stopPropagation()} />
                                    </div>
                                    <div>
                                      <Label className="text-[10px] text-muted-foreground">B %</Label>
                                      <Input type="number" min="1" max="100" step="0.5" className="h-7 text-xs" value={Math.round(zone.width * 10) / 10} onChange={(e) => { const v = parseFloat(e.target.value) || 1; updateLocalZone(zone.id, { width: v }); }} onBlur={() => saveZoneField(zone.id, "width", zone.width)} onClick={(e) => e.stopPropagation()} />
                                    </div>
                                    <div>
                                      <Label className="text-[10px] text-muted-foreground">H %</Label>
                                      <Input type="number" min="1" max="100" step="0.5" className="h-7 text-xs" value={Math.round(zone.height * 10) / 10} onChange={(e) => { const v = parseFloat(e.target.value) || 1; updateLocalZone(zone.id, { height: v }); }} onBlur={() => saveZoneField(zone.id, "height", zone.height)} onClick={(e) => e.stopPropagation()} />
                                    </div>
                                  </div>

                                  {/* Font Settings (only for text zones) */}
                                  {isTextZone && (
                                    <>
                                      <Separator className="my-1" />
                                      <div>
                                        <Label className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><Palette className="w-3 h-3" />Schrift-Einstellungen</Label>
                                        <div className="space-y-2">
                                          {/* Font Family */}
                                          <Select
                                            value={zone.fontFamily || "Inter"}
                                            onValueChange={(val) => {
                                              updateLocalZone(zone.id, { fontFamily: val });
                                              saveZoneField(zone.id, "fontFamily", val);
                                            }}
                                          >
                                            <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Schriftart..." /></SelectTrigger>
                                            <SelectContent>
                                              {FONT_OPTIONS.map((f) => (
                                                <SelectItem key={f.value} value={f.value}>
                                                  <span style={{ fontFamily: f.value }}>{f.label}</span>
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>

                                          {/* Font Size + Weight + Align */}
                                          <div className="grid grid-cols-3 gap-2">
                                            <div className="relative">
                                              <Input
                                                type="number"
                                                min="8"
                                                max="200"
                                                placeholder="Größe"
                                                className="h-7 text-xs pr-6"
                                                value={zone.fontSize ?? ""}
                                                onChange={(e) => updateLocalZone(zone.id, { fontSize: e.target.value ? parseInt(e.target.value) : null })}
                                                onBlur={() => saveZoneField(zone.id, "fontSize", zone.fontSize)}
                                                onClick={(e) => e.stopPropagation()}
                                              />
                                              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground">px</span>
                                            </div>
                                            <Select
                                              value={zone.fontWeight || "normal"}
                                              onValueChange={(val) => {
                                                updateLocalZone(zone.id, { fontWeight: val });
                                                saveZoneField(zone.id, "fontWeight", val);
                                              }}
                                            >
                                              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                              <SelectContent>
                                                {FONT_WEIGHT_OPTIONS.map((w) => (
                                                  <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                            <Select
                                              value={zone.textAlign || "center"}
                                              onValueChange={(val) => {
                                                updateLocalZone(zone.id, { textAlign: val });
                                                saveZoneField(zone.id, "textAlign", val);
                                              }}
                                            >
                                              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                              <SelectContent>
                                                {TEXT_ALIGN_OPTIONS.map((a) => (
                                                  <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          </div>

                                          {/* Font Color */}
                                          <div className="flex items-center gap-2">
                                            <Label className="text-[10px] text-muted-foreground shrink-0">Farbe</Label>
                                            <input
                                              type="color"
                                              className="w-7 h-7 rounded border cursor-pointer"
                                              value={zone.fontColor || "#000000"}
                                              onChange={(e) => {
                                                updateLocalZone(zone.id, { fontColor: e.target.value });
                                                saveZoneField(zone.id, "fontColor", e.target.value);
                                              }}
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                            <Input
                                              className="h-7 text-xs font-mono flex-1"
                                              value={zone.fontColor || "#000000"}
                                              onChange={(e) => updateLocalZone(zone.id, { fontColor: e.target.value })}
                                              onBlur={() => saveZoneField(zone.id, "fontColor", zone.fontColor)}
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                          </div>

                                          {/* Font Preview */}
                                          <div
                                            className="p-2 rounded border bg-muted/30 text-center"
                                            style={{
                                              fontFamily: zone.fontFamily || "Inter",
                                              fontSize: `${Math.min(zone.fontSize || 24, 48)}px`,
                                              fontWeight: zone.fontWeight || "normal",
                                              color: zone.fontColor || "#000",
                                              textAlign: (zone.textAlign as any) || "center",
                                            }}
                                          >
                                            {zone.purpose === "playerName" ? "MÜLLER" :
                                             zone.purpose === "playerNumber" ? "10" :
                                             zone.purpose === "playerInitials" ? "MM" :
                                             zone.purpose === "clubName" ? "FC Muster" :
                                             zone.purpose === "coordinates" ? "51.51°N 7.47°E" :
                                             zone.purpose === "hashtag" ? "#TSV" :
                                             zone.purpose === "abbreviation" ? "TSV" :
                                             "Vorschau"}
                                          </div>
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}

                <p className="text-[10px] sm:text-xs text-muted-foreground text-center px-4">
                  Ziehe die Zonen auf dem Bild, um sie zu positionieren. Klicke eine Zone an, um alle Einstellungen zu sehen.
                </p>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}

import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";

type ZoneData = {
  id: number;
  label: string;
  side: "front" | "back";
  type: "image" | "text" | "both";
  purpose: "logo" | "playerName" | "playerNumber" | "custom";
  posX: number;
  posY: number;
  width: number;
  height: number;
  sortOrder: number;
};

const PURPOSE_CONFIG = {
  logo: { label: "Logo", icon: FileImage, description: "Bild-Upload (Logo, Sponsor)" },
  playerName: { label: "Spielername", icon: User, description: "Automatisch: Spielername" },
  playerNumber: { label: "Nummer", icon: Hash, description: "Automatisch: Spielernummer" },
  custom: { label: "Freitext", icon: PenTool, description: "Freie Texteingabe" },
};

export default function AdminProductEditor() {
  const { id } = useParams<{ id: string }>();
  const productId = parseInt(id || "0");
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
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
  const [activeSide, setActiveSide] = useState<"front" | "back">("front");
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [draggingZone, setDraggingZone] = useState<number | null>(null);
  const [resizingZone, setResizingZone] = useState<number | null>(null);
  const [localZones, setLocalZones] = useState<ZoneData[]>([]);
  const [dragStart, setDragStart] = useState<{
    x: number; y: number; zoneX: number; zoneY: number; zoneW: number; zoneH: number;
  } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  useEffect(() => {
    if (productData) {
      setName(productData.name);
      setCategory(productData.category || "");
      setDescription(productData.description || "");
      setLocalZones(
        (productData.zones as ZoneData[]).map((z) => ({
          ...z,
          purpose: z.purpose || "logo",
        }))
      );
    }
  }, [productData]);

  const currentImage = activeSide === "front" ? productData?.frontImageUrl : productData?.backImageUrl;
  const currentZones = localZones.filter((z) => z.side === activeSide);

  // ─── Image Upload ───────────────────────────────────────────────────────
  const handleImageUpload = useCallback(
    async (side: "front" | "back") => {
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
        setUploadProgress("Wird gelesen...");
        try {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string).split(",")[1]);
            reader.onerror = () => reject(new Error("Datei konnte nicht gelesen werden"));
            reader.readAsDataURL(file);
          });

          setUploadProgress("Wird hochgeladen...");
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
          await updateProduct.mutateAsync({
            id: productId,
            ...(side === "front" ? { frontImageUrl: url } : { backImageUrl: url }),
          });
          toast.success(`${side === "front" ? "Vorderseite" : "Rückseite"} hochgeladen`);
        } catch (err: any) {
          toast.error(err.message || "Upload fehlgeschlagen");
        } finally {
          setUploading(false);
          setUploadProgress("");
        }
      };
      input.click();
    },
    [productId, updateProduct]
  );

  // ─── Zone Drag & Drop ──────────────────────────────────────────────────
  const getRelativePosition = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
  }, []);

  const handleZoneMouseDown = useCallback(
    (e: React.MouseEvent, zoneId: number, isResize = false) => {
      e.preventDefault();
      e.stopPropagation();
      const zone = localZones.find((z) => z.id === zoneId);
      if (!zone) return;
      const pos = getRelativePosition(e);
      setDragStart({ x: pos.x, y: pos.y, zoneX: zone.posX, zoneY: zone.posY, zoneW: zone.width, zoneH: zone.height });
      if (isResize) setResizingZone(zoneId);
      else setDraggingZone(zoneId);
      setSelectedZoneId(zoneId);
    },
    [localZones, getRelativePosition]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStart) return;
      const pos = getRelativePosition(e);
      const dx = pos.x - dragStart.x;
      const dy = pos.y - dragStart.y;
      if (draggingZone !== null) {
        setLocalZones((prev) =>
          prev.map((z) =>
            z.id === draggingZone
              ? { ...z, posX: Math.max(0, Math.min(100 - z.width, dragStart.zoneX + dx)), posY: Math.max(0, Math.min(100 - z.height, dragStart.zoneY + dy)) }
              : z
          )
        );
      }
      if (resizingZone !== null) {
        setLocalZones((prev) =>
          prev.map((z) =>
            z.id === resizingZone
              ? { ...z, width: Math.max(5, Math.min(100 - z.posX, dragStart.zoneW + dx)), height: Math.max(5, Math.min(100 - z.posY, dragStart.zoneH + dy)) }
              : z
          )
        );
      }
    };

    const handleMouseUp = () => {
      if (draggingZone !== null || resizingZone !== null) {
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
      setDraggingZone(null);
      setResizingZone(null);
      setDragStart(null);
    };

    if (draggingZone !== null || resizingZone !== null) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [draggingZone, resizingZone, dragStart, localZones, productData, bulkUpdatePositions, getRelativePosition]);

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

  if (!productData || !isAdmin) {
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
            <Link href="/admin/products">
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
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 sm:gap-6">
          {/* Left: Canvas */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant={activeSide === "front" ? "default" : "outline"} size="sm" className="h-8" onClick={() => setActiveSide("front")}>Vorderseite</Button>
              <Button variant={activeSide === "back" ? "default" : "outline"} size="sm" className="h-8" onClick={() => setActiveSide("back")}>Rückseite</Button>
              <div className="flex-1" />
              <Button variant="outline" size="sm" className="h-8 text-xs sm:text-sm" onClick={() => handleImageUpload(activeSide)} disabled={uploading}>
                {uploading ? <><Loader2 className="w-3.5 h-3.5 sm:mr-1.5 animate-spin" /><span className="hidden sm:inline">{uploadProgress}</span></> : <><Upload className="w-3.5 h-3.5 sm:mr-1.5" /><span className="hidden sm:inline">{activeSide === "front" ? "Vorder" : "Rück"}seite hochladen</span></>}
              </Button>
            </div>

            {/* Canvas Area */}
            <Card className="overflow-hidden">
              <div ref={canvasRef} className="relative bg-[#f8f9fa] aspect-[3/4] select-none" style={{ cursor: draggingZone ? "grabbing" : "default" }} onClick={() => setSelectedZoneId(null)}>
                {currentImage ? (
                  <img src={currentImage} alt={`${activeSide} Ansicht`} className="w-full h-full object-contain pointer-events-none" draggable={false} />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground px-4">
                    <Upload className="w-10 h-10 sm:w-12 sm:h-12 mb-3 opacity-30" />
                    <p className="text-xs sm:text-sm text-center">Klicke oben auf &quot;Hochladen&quot; um ein Bild hinzuzufügen</p>
                  </div>
                )}

                {/* Zones Overlay */}
                {currentZones.map((zone, idx) => {
                  const colorIdx = idx % zoneColors.length;
                  const isSelected = selectedZoneId === zone.id;
                  const PurposeIcon = PURPOSE_CONFIG[zone.purpose]?.icon || FileImage;
                  return (
                    <div
                      key={zone.id}
                      className="absolute group"
                      style={{
                        left: `${zone.posX}%`, top: `${zone.posY}%`, width: `${zone.width}%`, height: `${zone.height}%`,
                        backgroundColor: isSelected ? zoneColors[colorIdx].replace("0.3", "0.5") : zoneColors[colorIdx],
                        border: `2px ${isSelected ? "solid" : "dashed"} ${zoneBorderColors[colorIdx]}`,
                        borderRadius: "4px", cursor: draggingZone === zone.id ? "grabbing" : "grab", zIndex: isSelected ? 10 : 1,
                      }}
                      onMouseDown={(e) => handleZoneMouseDown(e, zone.id)}
                      onClick={(e) => { e.stopPropagation(); setSelectedZoneId(zone.id); }}
                    >
                      <div className="absolute -top-5 sm:-top-6 left-0 text-[10px] sm:text-xs font-medium px-1 sm:px-1.5 py-0.5 rounded whitespace-nowrap flex items-center gap-1" style={{ backgroundColor: zoneBorderColors[colorIdx], color: "white" }}>
                        <PurposeIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />{zone.label}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-60 transition-opacity pointer-events-none">
                        <Move className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-sm cursor-se-resize" style={{ backgroundColor: zoneBorderColors[colorIdx] }} onMouseDown={(e) => handleZoneMouseDown(e, zone.id, true)} />
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Right: Settings Panel */}
          <div className="space-y-4">
            <Tabs defaultValue="details">
              <TabsList className="w-full">
                <TabsTrigger value="details" className="flex-1 text-xs sm:text-sm">Details</TabsTrigger>
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
              </TabsContent>

              {/* Zones Tab */}
              <TabsContent value="zones" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                <Card>
                  <CardHeader className="pb-2 sm:pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm sm:text-base">Platzierungszonen</CardTitle>
                    <Button size="sm" className="h-8 text-xs" onClick={() => createZone.mutate({ productId, label: `Zone ${currentZones.length + 1}`, side: activeSide, type: "image", purpose: "logo", posX: 30, posY: 30, width: 25, height: 20, sortOrder: currentZones.length })}>
                      <Plus className="w-3.5 h-3.5 mr-1" />Zone hinzufügen
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {currentZones.length === 0 ? (
                      <div className="text-center py-6 sm:py-8 text-muted-foreground text-xs sm:text-sm">
                        <Layers className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-30" />
                        Noch keine Zonen für diese Seite.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {currentZones.map((zone, idx) => {
                          const colorIdx = idx % zoneBorderColors.length;
                          const isSelected = selectedZoneId === zone.id;
                          return (
                            <div
                              key={zone.id}
                              className={`p-2.5 sm:p-3 rounded-lg border-2 transition-colors cursor-pointer ${isSelected ? "bg-accent" : "hover:bg-accent/50"}`}
                              style={{ borderColor: isSelected ? zoneBorderColors[colorIdx] : "transparent" }}
                              onClick={() => setSelectedZoneId(zone.id)}
                            >
                              {/* Row 1: Label + Delete */}
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0" style={{ backgroundColor: zoneBorderColors[colorIdx] }} />
                                <Input
                                  value={zone.label}
                                  className="h-7 text-xs sm:text-sm font-medium"
                                  onChange={(e) => setLocalZones((prev) => prev.map((z) => z.id === zone.id ? { ...z, label: e.target.value } : z))}
                                  onBlur={() => updateZoneMut.mutate({ id: zone.id, label: zone.label })}
                                />
                                <Button variant="ghost" size="icon" className="shrink-0 h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); deleteZoneMut.mutate({ id: zone.id }); }}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>

                              {/* Row 2: Type */}
                              <div className="flex items-center gap-2 mb-2">
                                <Label className="text-[10px] sm:text-xs text-muted-foreground shrink-0 w-8 sm:w-10">Typ</Label>
                                <Select
                                  value={zone.type}
                                  onValueChange={(val: "image" | "text" | "both") => {
                                    setLocalZones((prev) => prev.map((z) => z.id === zone.id ? { ...z, type: val } : z));
                                    updateZoneMut.mutate({ id: zone.id, type: val });
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

                              {/* Row 3: Purpose */}
                              <div className="flex items-center gap-2 mb-2">
                                <Label className="text-[10px] sm:text-xs text-muted-foreground shrink-0 w-8 sm:w-10">Zweck</Label>
                                <Select
                                  value={zone.purpose}
                                  onValueChange={(val: "logo" | "playerName" | "playerNumber" | "custom") => {
                                    let newType = zone.type;
                                    if (val === "playerName" || val === "playerNumber" || val === "custom") newType = "text";
                                    else if (val === "logo") newType = "image";
                                    setLocalZones((prev) => prev.map((z) => z.id === zone.id ? { ...z, purpose: val, type: newType } : z));
                                    updateZoneMut.mutate({ id: zone.id, purpose: val, type: newType });
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

                              {/* Row 4: Position */}
                              <div className="text-[10px] sm:text-xs text-muted-foreground text-right">
                                {Math.round(zone.posX)}%, {Math.round(zone.posY)}% | {Math.round(zone.width)}x{Math.round(zone.height)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
                <p className="text-[10px] sm:text-xs text-muted-foreground text-center px-4">
                  Ziehe die Zonen auf dem Bild, um sie zu positionieren. Nutze den Griff unten rechts zum Skalieren.
                </p>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}

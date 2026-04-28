import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  Upload,
  Image,
  Users,
  Download,
  Trash2,
  Plus,
  FileDown,
  Shirt,
  RotateCcw,
  Loader2,
  FileImage,
  User,
  Hash,
  PenTool,
} from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";

type ZoneContent = {
  zoneId: number;
  imageDataUrl?: string;
  text?: string;
  fontSize?: number;
  fontColor?: string;
};

type Player = {
  number: string;
  name: string;
};

const PURPOSE_ICONS: Record<string, typeof FileImage> = {
  logo: FileImage,
  playerName: User,
  playerNumber: Hash,
  custom: PenTool,
};

export default function CustomerConfigurator() {
  const { id } = useParams<{ id: string }>();
  const productId = parseInt(id || "0");

  const { data: productData, isLoading } = trpc.product.getById.useQuery(
    { id: productId },
    { enabled: productId > 0 }
  );

  const [activeSide, setActiveSide] = useState<"front" | "back">("front");
  const [zoneContents, setZoneContents] = useState<Record<number, ZoneContent>>({});
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerNumber, setNewPlayerNumber] = useState("");
  const [newPlayerName, setNewPlayerName] = useState("");
  const [activePlayerIdx, setActivePlayerIdx] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const zones = productData?.zones ?? [];
  const currentZones = zones.filter((z: any) => z.side === activeSide);
  const currentImage = activeSide === "front" ? productData?.frontImageUrl : productData?.backImageUrl;

  // ─── Zone Content Management ───────────────────────────────────────────
  const updateZoneContent = useCallback((zoneId: number, updates: Partial<ZoneContent>) => {
    setZoneContents((prev) => ({ ...prev, [zoneId]: { ...prev[zoneId], zoneId, ...updates } }));
  }, []);

  const handleImageUploadToZone = useCallback((zoneId: number) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        updateZoneContent(zoneId, { imageDataUrl: reader.result as string });
        toast.success("Bild platziert");
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [updateZoneContent]);

  // ─── Player Management ─────────────────────────────────────────────────
  const addPlayer = useCallback(() => {
    if (!newPlayerName.trim()) return;
    setPlayers((prev) => [...prev, { number: newPlayerNumber.trim(), name: newPlayerName.trim().toUpperCase() }]);
    setNewPlayerNumber("");
    setNewPlayerName("");
  }, [newPlayerNumber, newPlayerName]);

  const removePlayer = useCallback((idx: number) => {
    setPlayers((prev) => prev.filter((_, i) => i !== idx));
    if (activePlayerIdx === idx) setActivePlayerIdx(null);
    else if (activePlayerIdx !== null && activePlayerIdx > idx) setActivePlayerIdx(activePlayerIdx - 1);
  }, [activePlayerIdx]);

  const handleCsvImport = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv,.txt";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        const lines = text.split("\n").filter((l) => l.trim());
        const newPlayers: Player[] = [];
        for (const line of lines) {
          const parts = line.split(/[,;\t]/).map((p) => p.trim());
          if (parts.length >= 2) {
            newPlayers.push({ number: parts[0], name: parts[1].toUpperCase() });
          } else if (parts.length === 1 && parts[0]) {
            newPlayers.push({ number: "", name: parts[0].toUpperCase() });
          }
        }
        if (newPlayers.length > 0) {
          setPlayers((prev) => [...prev, ...newPlayers]);
          toast.success(`${newPlayers.length} Spieler importiert`);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  // ─── Purpose-based Content Resolution ─────────────────────────────────
  const activePlayer = activePlayerIdx !== null ? players[activePlayerIdx] : null;

  const getEffectiveContent = useCallback((zoneId: number) => {
    const zone = zones.find((z: any) => z.id === zoneId);
    const content = zoneContents[zoneId];

    if (activePlayer && zone) {
      const purpose = (zone as any).purpose || "custom";
      if (purpose === "playerName") {
        return { ...content, text: activePlayer.name };
      }
      if (purpose === "playerNumber") {
        return { ...content, text: activePlayer.number };
      }
    }

    return content;
  }, [activePlayer, zoneContents, zones]);

  // Check if a zone should show upload controls (only logo and custom zones)
  const isUserEditableZone = useCallback((zone: any) => {
    const purpose = zone.purpose || "custom";
    return purpose === "logo" || purpose === "custom";
  }, []);

  // ─── Export ─────────────────────────────────────────────────────────────
  const exportCanvas = useCallback(async (side: "front" | "back") => {
    if (!canvasRef.current) return null;
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(canvasRef.current, { quality: 1, pixelRatio: 2, backgroundColor: "#f8f9fa" });
      return dataUrl;
    } catch {
      toast.error("Export fehlgeschlagen");
      return null;
    }
  }, []);

  const handleExportSingle = useCallback(async () => {
    setExporting(true);
    const dataUrl = await exportCanvas(activeSide);
    setExporting(false);
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.download = `${productData?.name || "textil"}_${activeSide}.png`;
    link.href = dataUrl;
    link.click();
    toast.success("Bild exportiert");
  }, [activeSide, exportCanvas, productData]);

  const handleExportBatch = useCallback(async () => {
    if (players.length === 0) {
      toast.error("Keine Spieler vorhanden");
      return;
    }
    setExporting(true);
    toast.info("Batch-Export wird vorbereitet...");

    try {
      const JSZip = (await import("jszip")).default;
      const { toPng } = await import("html-to-image");
      const zip = new JSZip();

      for (let i = 0; i < players.length; i++) {
        setActivePlayerIdx(i);
        await new Promise((r) => setTimeout(r, 400));

        for (const side of ["front", "back"] as const) {
          setActiveSide(side);
          await new Promise((r) => setTimeout(r, 400));

          if (canvasRef.current) {
            const dataUrl = await toPng(canvasRef.current, { quality: 1, pixelRatio: 2, backgroundColor: "#f8f9fa" });
            const base64 = dataUrl.split(",")[1];
            zip.file(`${players[i].number || i + 1}_${players[i].name}_${side}.png`, base64, { base64: true });
          }
        }
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const { saveAs } = await import("file-saver");
      saveAs(blob, `${productData?.name || "textil"}_mannschaft.zip`);
      toast.success("Batch-Export abgeschlossen");
    } catch {
      toast.error("Batch-Export fehlgeschlagen");
    } finally {
      setExporting(false);
      setActivePlayerIdx(null);
    }
  }, [players, productData]);

  // ─── Zone Colors ────────────────────────────────────────────────────────
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
        <div className="text-center">
          <Shirt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Produkt nicht gefunden.</p>
          <Link href="/"><Button variant="outline" className="mt-4">Zurück</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-20">
        <div className="container flex items-center justify-between h-12 sm:h-14 px-3 sm:px-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link href="/"><Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 sm:h-9 sm:w-9"><ArrowLeft className="w-4 h-4" /></Button></Link>
            <h1 className="text-sm sm:text-lg font-bold truncate">{productData.name}</h1>
            {productData.category && <Badge variant="secondary" className="hidden sm:inline-flex">{productData.category}</Badge>}
          </div>
          <div className="flex gap-1.5 sm:gap-2 shrink-0">
            <Button variant="outline" size="sm" className="h-8 text-xs sm:text-sm" onClick={handleExportSingle} disabled={exporting}>
              {exporting ? <Loader2 className="w-3.5 h-3.5 sm:mr-1.5 animate-spin" /> : <Download className="w-3.5 h-3.5 sm:mr-1.5" />}
              <span className="hidden sm:inline">Exportieren</span>
            </Button>
            {players.length > 0 && (
              <Button size="sm" className="h-8 text-xs sm:text-sm" onClick={handleExportBatch} disabled={exporting}>
                {exporting ? <Loader2 className="w-3.5 h-3.5 sm:mr-1.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5 sm:mr-1.5" />}
                <span className="hidden sm:inline">Alle exportieren ({players.length})</span>
                <span className="sm:hidden">{players.length}</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container py-4 sm:py-6 px-3 sm:px-4">
        {/* Mobile: Stacked layout, Desktop: Side-by-side */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 sm:gap-6">
          {/* Left: Canvas */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant={activeSide === "front" ? "default" : "outline"} size="sm" className="h-8" onClick={() => setActiveSide("front")}>Vorderseite</Button>
              <Button variant={activeSide === "back" ? "default" : "outline"} size="sm" className="h-8" onClick={() => setActiveSide("back")}>Rückseite</Button>
              {activePlayer && (
                <Badge variant="outline" className="ml-auto text-xs">
                  <User className="w-3 h-3 mr-1" />{activePlayer.number} {activePlayer.name}
                </Badge>
              )}
            </div>

            <Card className="overflow-hidden">
              <div ref={canvasRef} className="relative bg-[#f8f9fa] aspect-[3/4]" onClick={() => setSelectedZoneId(null)}>
                {currentImage ? (
                  <img src={currentImage} alt={`${activeSide} Ansicht`} className="w-full h-full object-contain pointer-events-none" draggable={false} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Shirt className="w-12 h-12 sm:w-16 sm:h-16 opacity-20" />
                  </div>
                )}

                {/* Zone Overlays */}
                {currentZones.map((zone: any, idx: number) => {
                  const content = getEffectiveContent(zone.id);
                  const colorIdx = idx % zoneBorderColors.length;
                  const isSelected = selectedZoneId === zone.id;
                  const purpose = zone.purpose || "custom";
                  const PurposeIcon = PURPOSE_ICONS[purpose] || PenTool;

                  return (
                    <div
                      key={zone.id}
                      className="absolute overflow-hidden flex items-center justify-center"
                      style={{
                        left: `${zone.posX}%`, top: `${zone.posY}%`, width: `${zone.width}%`, height: `${zone.height}%`,
                        border: isSelected ? `2px solid ${zoneBorderColors[colorIdx]}` : content?.imageDataUrl || content?.text ? "none" : `1px dashed ${zoneBorderColors[colorIdx]}40`,
                        borderRadius: "2px", cursor: "pointer",
                      }}
                      onClick={(e) => { e.stopPropagation(); setSelectedZoneId(zone.id); }}
                    >
                      {content?.imageDataUrl && (
                        <img src={content.imageDataUrl} alt="" className="w-full h-full object-contain" draggable={false} />
                      )}
                      {content?.text && !content?.imageDataUrl && (
                        <span className="font-bold text-center leading-tight" style={{ fontSize: `${content.fontSize || 24}px`, color: content.fontColor || "#ffffff", textShadow: "1px 1px 2px rgba(0,0,0,0.5)", wordBreak: "break-word" }}>
                          {content.text}
                        </span>
                      )}
                      {!content?.imageDataUrl && !content?.text && (
                        <div className="text-center opacity-40">
                          <PurposeIcon className="w-3 h-3 sm:w-4 sm:h-4 mx-auto" />
                          <span className="text-[8px] sm:text-[10px] block mt-0.5">{zone.label}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Right: Configuration Panel */}
          <div className="space-y-4">
            <Tabs defaultValue="zones">
              <TabsList className="w-full">
                <TabsTrigger value="zones" className="flex-1 text-xs sm:text-sm"><Image className="w-3.5 h-3.5 mr-1 sm:mr-1.5" />Zonen</TabsTrigger>
                <TabsTrigger value="team" className="flex-1 text-xs sm:text-sm"><Users className="w-3.5 h-3.5 mr-1 sm:mr-1.5" />Mannschaft</TabsTrigger>
              </TabsList>

              {/* Zones Tab */}
              <TabsContent value="zones" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                {currentZones.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">Keine Zonen auf dieser Seite definiert.</div>
                ) : (
                  currentZones.map((zone: any, idx: number) => {
                    const content = getEffectiveContent(zone.id);
                    const colorIdx = idx % zoneBorderColors.length;
                    const isSelected = selectedZoneId === zone.id;
                    const purpose = zone.purpose || "custom";
                    const PurposeIcon = PURPOSE_ICONS[purpose] || PenTool;
                    const editable = isUserEditableZone(zone);

                    return (
                      <Card key={zone.id} className={`cursor-pointer transition-all ${isSelected ? "ring-2" : ""}`} style={isSelected ? { "--tw-ring-color": zoneBorderColors[colorIdx] } as any : {}} onClick={() => setSelectedZoneId(zone.id)}>
                        <CardContent className="pt-3 sm:pt-4 space-y-2 sm:space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0" style={{ backgroundColor: zoneBorderColors[colorIdx] }} />
                            <PurposeIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground" />
                            <span className="font-medium text-xs sm:text-sm">{zone.label}</span>
                            <Badge variant="outline" className="text-[10px] sm:text-xs ml-auto">
                              {purpose === "logo" ? "Logo" : purpose === "playerName" ? "Spielername" : purpose === "playerNumber" ? "Nummer" : "Freitext"}
                            </Badge>
                          </div>

                          {/* Logo zones: Image Upload */}
                          {purpose === "logo" && (
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={(e) => { e.stopPropagation(); handleImageUploadToZone(zone.id); }}>
                                <Upload className="w-3.5 h-3.5 mr-1.5" />{content?.imageDataUrl ? "Bild ändern" : "Logo hochladen"}
                              </Button>
                              {content?.imageDataUrl && (
                                <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={(e) => { e.stopPropagation(); updateZoneContent(zone.id, { imageDataUrl: undefined }); }}>
                                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                </Button>
                              )}
                            </div>
                          )}

                          {/* Player Name/Number zones: Auto-filled info */}
                          {(purpose === "playerName" || purpose === "playerNumber") && (
                            <div className="text-xs text-muted-foreground bg-accent/50 rounded-md p-2">
                              {activePlayer ? (
                                <span className="text-foreground font-medium">
                                  {purpose === "playerName" ? activePlayer.name : activePlayer.number}
                                </span>
                              ) : (
                                <span>Wähle einen Spieler aus der Mannschaftsliste, um {purpose === "playerName" ? "den Namen" : "die Nummer"} automatisch zu platzieren.</span>
                              )}
                            </div>
                          )}

                          {/* Custom zones: Free text input */}
                          {purpose === "custom" && (
                            <div className="space-y-2">
                              <Input placeholder="Text eingeben..." value={content?.text || ""} className="h-8 text-xs sm:text-sm" onChange={(e) => updateZoneContent(zone.id, { text: e.target.value })} onClick={(e) => e.stopPropagation()} />
                              <div className="flex gap-2 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                  <Label className="text-xs">Größe</Label>
                                  <Input type="number" min={8} max={120} value={content?.fontSize || 24} className="h-7 w-14 sm:w-16 text-xs" onChange={(e) => updateZoneContent(zone.id, { fontSize: parseInt(e.target.value) || 24 })} onClick={(e) => e.stopPropagation()} />
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Label className="text-xs">Farbe</Label>
                                  <input type="color" value={content?.fontColor || "#ffffff"} className="w-7 h-7 rounded border cursor-pointer" onChange={(e) => updateZoneContent(zone.id, { fontColor: e.target.value })} onClick={(e) => e.stopPropagation()} />
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </TabsContent>

              {/* Team Tab */}
              <TabsContent value="team" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                <Card>
                  <CardHeader className="pb-2 sm:pb-3"><CardTitle className="text-sm sm:text-base">Mannschaftsliste</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Input placeholder="Nr." value={newPlayerNumber} onChange={(e) => setNewPlayerNumber(e.target.value)} className="w-14 sm:w-16 h-8 text-xs sm:text-sm" />
                      <Input placeholder="Name" value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} className="flex-1 h-8 text-xs sm:text-sm" onKeyDown={(e) => e.key === "Enter" && addPlayer()} />
                      <Button size="sm" className="h-8 shrink-0" onClick={addPlayer}><Plus className="w-3.5 h-3.5" /></Button>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={handleCsvImport}>
                        <Upload className="w-3.5 h-3.5 mr-1.5" />CSV importieren
                      </Button>
                      {players.length > 0 && (
                        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setPlayers([]); setActivePlayerIdx(null); }}>
                          <RotateCcw className="w-3.5 h-3.5 mr-1" />Leeren
                        </Button>
                      )}
                    </div>

                    <Separator />

                    {players.length === 0 ? (
                      <div className="text-center py-4 sm:py-6 text-muted-foreground text-xs sm:text-sm">
                        <Users className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-30" />
                        Noch keine Spieler hinzugefügt.
                      </div>
                    ) : (
                      <div className="space-y-1 max-h-[300px] sm:max-h-[400px] overflow-y-auto">
                        {players.map((player, idx) => (
                          <div key={idx} className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${activePlayerIdx === idx ? "bg-primary/10 text-primary" : "hover:bg-accent"}`} onClick={() => setActivePlayerIdx(activePlayerIdx === idx ? null : idx)}>
                            <span className="w-7 sm:w-8 text-center font-mono text-xs sm:text-sm font-bold">{player.number || "-"}</span>
                            <span className="flex-1 text-xs sm:text-sm font-medium truncate">{player.name}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={(e) => { e.stopPropagation(); removePlayer(idx); }}>
                              <Trash2 className="w-3 h-3 text-muted-foreground" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {players.length > 0 && (
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        Klicke auf einen Spieler, um Name und Nummer automatisch auf dem Textil zu platzieren.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}

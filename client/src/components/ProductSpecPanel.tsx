/**
 * ProductSpecPanel – Spezifikationsansicht für ein Produkt.
 * Zeigt alle Elemente (Zonen) mit Originaldatei, Farbe, Größe, Schrift, Position.
 * Dient als Grundlage für den Druckbogen und als PDF-Export/Datenblatt.
 */
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Download,
  Printer,
  Palette,
  Type,
  Ruler,
  MapPin,
  Image,
  Shield,
  Hash,
  User,
  Building2,
  AtSign,
  Fingerprint,
  Flag,
  QrCode,
  PenTool,
  Shirt,
  FileImage,
  Loader2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { hexToCmyk, formatCmyk } from "@/lib/cmyk";

// Purpose-Konfiguration für Anzeige
const PURPOSE_LABELS: Record<string, { label: string; icon: typeof FileImage }> = {
  logo: { label: "Logo", icon: FileImage },
  clubLogo: { label: "Vereinswappen", icon: Shield },
  playerName: { label: "Spielername", icon: User },
  playerNumber: { label: "Spielernummer", icon: Hash },
  playerInitials: { label: "Kürzel (Spieler)", icon: Fingerprint },
  clubName: { label: "Vereinsname", icon: Building2 },
  abbreviation: { label: "Kürzel (Verein)", icon: Type },
  coordinates: { label: "Koordinaten", icon: MapPin },
  hashtag: { label: "Hashtag", icon: AtSign },
  flag: { label: "Flagge", icon: Flag },
  qrCode: { label: "QR-Code", icon: QrCode },
  sponsor: { label: "Sponsor", icon: Shirt },
  custom: { label: "Freitext", icon: PenTool },
};

type ZoneData = {
  id: number;
  label: string;
  partId: number | null;
  side: "front" | "back";
  type: "image" | "text" | "both";
  purpose: string;
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
};

type PartData = {
  id: number;
  key: string;
  label: string;
  imageUrl: string | null;
};

interface ProductSpecPanelProps {
  productId: number;
  productName: string;
  zones: ZoneData[];
  parts: PartData[];
  templateId?: string | null;
  colorPalette?: string[];
  /** Callback wenn PDF-Export gestartet wird */
  onExportPdf?: () => void;
}

export default function ProductSpecPanel({
  productId,
  productName,
  zones,
  parts,
  templateId,
  colorPalette,
  onExportPdf,
}: ProductSpecPanelProps) {
  // Zonen nach Part gruppieren
  const zonesByPart = useMemo(() => {
    const grouped: Record<string, { part: PartData | null; zones: ZoneData[] }> = {};
    for (const zone of zones) {
      const part = parts.find((p) => p.id === zone.partId);
      const key = part ? part.key : "unassigned";
      if (!grouped[key]) {
        grouped[key] = { part: part || null, zones: [] };
      }
      grouped[key].zones.push(zone);
    }
    return grouped;
  }, [zones, parts]);

  // Statistiken
  const stats = useMemo(() => {
    const textZones = zones.filter((z) => z.type === "text" || z.type === "both");
    const imageZones = zones.filter((z) => z.type === "image" || z.type === "both");
    const usedFonts = [...new Set(textZones.map((z) => z.fontFamily).filter(Boolean))];
    const usedColors = [...new Set(textZones.map((z) => z.fontColor).filter(Boolean))];
    return { textZones: textZones.length, imageZones: imageZones.length, usedFonts, usedColors };
  }, [zones]);

  // Position-Beschreibung generieren
  const getPositionDescription = (zone: ZoneData): string => {
    const x = zone.posX.toFixed(1);
    const y = zone.posY.toFixed(1);
    const w = zone.width.toFixed(1);
    const h = zone.height.toFixed(1);
    return `X: ${x}% | Y: ${y}% | B: ${w}% | H: ${h}%`;
  };

  // Farbe mit CMYK-Wert formatieren
  const formatColor = (hex: string | null): string => {
    if (!hex) return "–";
    try {
      const cmyk = hexToCmyk(hex);
      return `${hex.toUpperCase()} (${formatCmyk(cmyk)})`;
    } catch {
      return hex.toUpperCase();
    }
  };

  return (
    <div className="space-y-3">
      {/* Übersicht */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Produkt-Spezifikation
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={onExportPdf}
            >
              <Download className="w-3 h-3 mr-1" />
              PDF-Datenblatt
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Produkt-Info */}
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <span className="text-muted-foreground">Produkt:</span>
              <span className="ml-1 font-medium">{productName}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Template:</span>
              <span className="ml-1 font-medium">{templateId || "–"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Teile:</span>
              <span className="ml-1 font-medium">{parts.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Zonen:</span>
              <span className="ml-1 font-medium">{zones.length}</span>
            </div>
          </div>

          {/* Statistiken */}
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="text-[10px] h-5">
              <Type className="w-3 h-3 mr-0.5" />{stats.textZones} Text
            </Badge>
            <Badge variant="secondary" className="text-[10px] h-5">
              <Image className="w-3 h-3 mr-0.5" />{stats.imageZones} Bild
            </Badge>
            <Badge variant="secondary" className="text-[10px] h-5">
              <Palette className="w-3 h-3 mr-0.5" />{stats.usedColors.length} Farben
            </Badge>
          </div>

          {/* Farbpalette */}
          {colorPalette && colorPalette.length > 0 && (
            <div>
              <span className="text-[10px] text-muted-foreground block mb-1">Farbpalette (Sublimation):</span>
              <div className="flex flex-wrap gap-1">
                {colorPalette.map((color, idx) => (
                  <div key={idx} className="flex items-center gap-1 bg-muted/50 rounded px-1.5 py-0.5">
                    <div className="w-3 h-3 rounded-sm border" style={{ backgroundColor: color }} />
                    <span className="text-[9px] font-mono">{color.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verwendete Schriften */}
      {stats.usedFonts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Type className="w-4 h-4" />
              Verwendete Schriften
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {stats.usedFonts.map((font) => (
                <div key={font} className="flex items-center justify-between text-[10px] py-0.5">
                  <span className="font-medium" style={{ fontFamily: font || undefined }}>{font}</span>
                  <Badge variant="outline" className="text-[9px] h-4">
                    {zones.filter((z) => z.fontFamily === font).length}x verwendet
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verwendete Farben */}
      {stats.usedColors.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Verwendete Farben
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {stats.usedColors.map((color) => (
                <div key={color} className="flex items-center gap-2 text-[10px] py-0.5">
                  <div className="w-4 h-4 rounded-sm border shrink-0" style={{ backgroundColor: color || undefined }} />
                  <span className="font-mono flex-1">{formatColor(color)}</span>
                  <Badge variant="outline" className="text-[9px] h-4">
                    {zones.filter((z) => z.fontColor === color).length}x
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Zonen-Details pro Part */}
      {Object.entries(zonesByPart).map(([partKey, { part, zones: partZones }]) => (
        <Card key={partKey}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Ruler className="w-4 h-4" />
              {part ? part.label : "Nicht zugeordnet"}
              <Badge variant="secondary" className="text-[10px] h-4 ml-1">
                {partZones.length} Zonen
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2">
                {partZones.map((zone) => {
                  const purposeConfig = PURPOSE_LABELS[zone.purpose] || PURPOSE_LABELS.custom;
                  const Icon = purposeConfig.icon;
                  const isText = zone.type === "text" || zone.type === "both";
                  const isImage = zone.type === "image" || zone.type === "both";

                  return (
                    <div
                      key={zone.id}
                      className="border rounded-md p-2 space-y-1.5 bg-muted/20"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Icon className="w-3.5 h-3.5 text-primary" />
                          <span className="text-xs font-medium">{purposeConfig.label}</span>
                          <Badge variant="outline" className="text-[9px] h-4">
                            {zone.type === "text" ? "Text" : zone.type === "image" ? "Bild" : "Beides"}
                          </Badge>
                        </div>
                        {zone.widthCm && zone.heightCm && (
                          <span className="text-[9px] text-muted-foreground font-mono">
                            {zone.widthCm} × {zone.heightCm} cm
                          </span>
                        )}
                      </div>

                      {/* Details-Grid */}
                      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
                        {/* Position */}
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Position: </span>
                          <span className="font-mono">{getPositionDescription(zone)}</span>
                        </div>

                        {/* Rotation */}
                        {zone.rotation > 0 && (
                          <div>
                            <span className="text-muted-foreground">Rotation: </span>
                            <span className="font-mono">{zone.rotation}°</span>
                          </div>
                        )}

                        {/* Schrift-Details (nur für Text-Zonen) */}
                        {isText && (
                          <>
                            {zone.fontFamily && (
                              <div>
                                <span className="text-muted-foreground">Schrift: </span>
                                <span className="font-medium">{zone.fontFamily}</span>
                              </div>
                            )}
                            {zone.fontSize && (
                              <div>
                                <span className="text-muted-foreground">Größe: </span>
                                <span className="font-mono">{zone.fontSize}px</span>
                              </div>
                            )}
                            {zone.fontWeight && (
                              <div>
                                <span className="text-muted-foreground">Gewicht: </span>
                                <span>{zone.fontWeight}</span>
                              </div>
                            )}
                            {zone.textAlign && (
                              <div>
                                <span className="text-muted-foreground">Ausrichtung: </span>
                                <span>{zone.textAlign === "left" ? "Links" : zone.textAlign === "right" ? "Rechts" : "Zentriert"}</span>
                              </div>
                            )}
                            {zone.fontColor && (
                              <div className="col-span-2 flex items-center gap-1">
                                <span className="text-muted-foreground">Farbe: </span>
                                <div className="w-3 h-3 rounded-sm border inline-block" style={{ backgroundColor: zone.fontColor }} />
                                <span className="font-mono">{formatColor(zone.fontColor)}</span>
                              </div>
                            )}
                          </>
                        )}

                        {/* Bild-Referenz (für Bild-Zonen) */}
                        {isImage && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Typ: </span>
                            <span>Bild-Upload (Originaldatei wird beim Konfigurieren zugewiesen)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      ))}

      {/* Hinweis */}
      <div className="text-[10px] text-muted-foreground text-center px-4 py-2">
        <Printer className="w-3 h-3 inline mr-1" />
        Alle Angaben fließen automatisch in den Druckbogen ein.
        Änderungen im Designer werden sofort übernommen.
      </div>
    </div>
  );
}

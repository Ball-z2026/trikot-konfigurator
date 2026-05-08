import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Save, Sparkles, Loader2, ChevronLeft, Maximize2, AlertTriangle, Wand2, Palette, RefreshCw, Upload, Image, Mountain, Layers, MapPin, Users, Shield, ThumbsUp } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { storageUrl } from "@/lib/utils";
import { useLocation } from "wouter";
import { useZoneEditor } from "@/contexts/ZoneEditorContext";
import { getJerseyRules, validateZonesAgainstRules, BACK_LAYOUT_OPTIONS, type BackLayoutType, DEFAULT_BACK_LAYOUT, getPositionRulesForAI } from "@shared/jerseyRules";
import { SPORT_TYPES } from "@shared/templates";
import { useAuth } from "@/_core/hooks/useAuth";
import CrestInNumberPreview from "@/components/CrestInNumberPreview";

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
  enabled?: boolean; // Toggle: Zone mit verwenden oder nicht
}

// ── Extrahierte Farbe aus Muster ──
interface ExtractedColor {
  hex: string;
  percentage: number;
  replacementHex: string; // Kann vom User geändert werden
}

const ZONE_PURPOSES = [
  { value: "logo", label: "Logo / Wappen" },
  { value: "playerName", label: "Spielername" },
  { value: "playerNumber", label: "Spielernummer" },
  { value: "clubName", label: "Vereinsname" },
  { value: "sponsor", label: "Sponsor" },
  { value: "abbreviation", label: "Kürzel" },
  { value: "coordinates", label: "Koordinaten" },
  { value: "hashtag", label: "Hashtag" },
  { value: "custom", label: "Freitext" },
];

// ── Stil-Optionen ──
const DESIGN_STYLES = [
  { value: "modern", label: "Modern / Minimalistisch" },
  { value: "classic", label: "Klassisch / Traditionell" },
  { value: "bold", label: "Mutig / Auffällig" },
  { value: "gradient", label: "Farbverlauf" },
  { value: "geometric", label: "Geometrisch" },
  { value: "stripes", label: "Streifen" },
  { value: "retro", label: "Retro / Vintage" },
];

// ── Sublimation-Bereiche ──
const SUBLIMATION_AREAS = [
  { id: "body_front", label: "Körper Vorne", defaultEnabled: true },
  { id: "body_back", label: "Körper Hinten", defaultEnabled: true },
  { id: "sleeve_left", label: "Ärmel Links", defaultEnabled: true },
  { id: "sleeve_right", label: "Ärmel Rechts", defaultEnabled: true },
  { id: "collar", label: "Kragen", defaultEnabled: false },
  { id: "cuff_left", label: "Bündchen Links", defaultEnabled: false },
  { id: "cuff_right", label: "Bündchen Rechts", defaultEnabled: false },
];

export default function KiDesign() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { openEditor, registerSaveCallback, registerDiscardCallback } = useZoneEditor();
  const utils = trpc.useUtils();

  // ── State ──
  const [step, setStep] = useState<"configure" | "generate" | "edit" | "save">("configure");
  const [generating, setGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [visibility, setVisibility] = useState<"private" | "team" | "department" | "org">("team");
  const [saving, setSaving] = useState(false);
  const [selectedSport, setSelectedSport] = useState<string>("");
  const [designStyle, setDesignStyle] = useState<string>("modern");
  const [primaryColor, setPrimaryColor] = useState<string>("#1e40af");
  const [secondaryColor, setSecondaryColor] = useState<string>("#ffffff");
  const [accentColor, setAccentColor] = useState<string>("#ef4444");
  const [clubName, setClubName] = useState<string>("");
  const [additionalNotes, setAdditionalNotes] = useState<string>("");
  const [addingZone, setAddingZone] = useState(false);
  const [newZoneName, setNewZoneName] = useState("");
  const [newZonePurpose, setNewZonePurpose] = useState("logo");
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  // ── Vereins-Integration State ──
   const [useClubColors, setUseClubColors] = useState(true);
  const [useWappenInNumber] = useState(false); // Wappen in Rückennummer – DEAKTIVIERT (funktioniert nicht zuverlässig)
  const [useManufacturerLogo, setUseManufacturerLogo] = useState(false); // Hersteller-Logo optional
  const [manufacturerLogoUrl, setManufacturerLogoUrl] = useState<string | null>(null); // Hochgeladenes Hersteller-Logo
  const [useClubLogo, setUseClubLogo] = useState(true);
  const [useClubFont, setUseClubFont] = useState(true);
  const [useHashtag, setUseHashtag] = useState(false);
  const [useCoordinates, setUseCoordinates] = useState(false);

  // ── Wahrzeichen-Upload State ──
  const [landmarkImage, setLandmarkImage] = useState<string | null>(null);
  const [landmarkSilhouette, setLandmarkSilhouette] = useState<string | null>(null);
  const [extractingSilhouette, setExtractingSilhouette] = useState(false);
  const [useLandmark, setUseLandmark] = useState(false);
  // Wahrzeichen-Optionen: Darstellungsart + Platzierung + Deckkraft
  const [landmarkStyle, setLandmarkStyle] = useState<"large" | "pattern">("large"); // groß oder kleine als Muster
  const [landmarkPlacement, setLandmarkPlacement] = useState<"front" | "both">("front"); // nur Front oder Front+Rück
  const [landmarkOpacity, setLandmarkOpacity] = useState<number>(20); // eigener Deckkraft-Slider

  // ── Muster-Upload State ──
  const [patternImage, setPatternImage] = useState<string | null>(null);
  const [patternColors, setPatternColors] = useState<ExtractedColor[]>([]);
  const [extractingColors, setExtractingColors] = useState(false);
  const [usePattern, setUsePattern] = useState(false);

  // ── Sponsoren-Upload State ──
  const [sponsorLogos, setSponsorLogos] = useState<Array<{ id: string; name: string; imageUrl: string; type: string; enabled: boolean }>>([]);
  const [sponsorPositions, setSponsorPositions] = useState<Record<string, string>>({}); // id -> position ("chest", "back", "sleeve_left", "sleeve_right", "side", "collar")
  const [uploadingSponsor, setUploadingSponsor] = useState(false);

  // ── Straßenkarte als Wasserzeichen State ──
  const [useMapWatermark, setUseMapWatermark] = useState(false);
  const [mapImageUrl, setMapImageUrl] = useState<string | null>(null);
  const [loadingMap, setLoadingMap] = useState(false);

  // ── Wasserzeichen-Deckung (Transparenz) ──
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(20); // Prozent (10-50)

  // ── Sublimation-Bereiche State ──
  const [printMethod, setPrintMethod] = useState<"dtf" | "sublimation">("sublimation");
  const [sublimationAreas, setSublimationAreas] = useState<Record<string, boolean>>(
    Object.fromEntries(SUBLIMATION_AREAS.map(a => [a.id, a.defaultEnabled]))
  );

  // Passende Hose (Upselling)
  const [matchingShortsUrl, setMatchingShortsUrl] = useState<string | null>(null);
  const [generatingShorts, setGeneratingShorts] = useState(false);
  
  // Änderungsfunktion nach Generierung
  const [editDescription, setEditDescription] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [backLayout, setBackLayout] = useState<BackLayoutType>(DEFAULT_BACK_LAYOUT);
  const [useBackCrestWatermark, setUseBackCrestWatermark] = useState(false); // Wappen als großes Wasserzeichen auf Rücken
  const [backCrestOpacity, setBackCrestOpacity] = useState<number>(20); // Deckkraft für Wappen-Wasserzeichen auf Rücken

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

  // tRPC Mutations & Queries
  const analyzeImage = trpc.designTemplate.analyzeImage.useMutation();
  const createTemplate = trpc.designTemplate.create.useMutation();
  const generateAiMockup = trpc.mockup.generateAi.useMutation();
  const removeBackgroundMut = trpc.mockup.removeBackground.useMutation();
  const compositeCrestInNumberMut = trpc.mockup.compositeCrestInNumber.useMutation();

  // Membership für orgId / deptId
  const { data: memberships } = trpc.membership.mine.useQuery();
  const orgId = memberships?.[0]?.orgId || 0;
  const deptId = memberships?.[0]?.departmentId || 0;

  // Vereinsdaten laden
  const { data: orgData } = trpc.org.getById.useQuery(
    { id: orgId },
    { enabled: orgId > 0 }
  );
  const { data: defaultLogo } = trpc.orgLogo.getDefault.useQuery(
    { orgId },
    { enabled: orgId > 0 }
  );
  const { data: defaultFont } = trpc.deptFont.getDefault.useQuery(
    { departmentId: deptId },
    { enabled: deptId > 0 }
  );

  // Sponsoren des Vereins laden
  const { data: orgSponsors } = trpc.sponsorTemplate.list.useQuery(
    { orgId },
    { enabled: orgId > 0 }
  );

  // Sponsoren in lokalen State laden wenn sie ankommen
  useEffect(() => {
    if (orgSponsors && orgSponsors.length > 0 && sponsorLogos.length === 0) {
      setSponsorLogos(orgSponsors.map(s => ({
        id: String(s.id),
        name: s.name,
        imageUrl: s.logoUrl,
        type: s.sponsorType || "hauptsponsor",
        enabled: s.obligation === "alle_produkte" || s.obligation === "nur_trikot",
      })));
    }
  }, [orgSponsors]);

  // Straßenkarte aus Vereinsadresse generieren
  const generateMapImage = async () => {
    if (!orgData?.street || !orgData?.city) {
      toast.error("Keine Vereinsadresse hinterlegt. Bitte zuerst in der Verwaltung die Vereinsadresse eintragen.");
      return;
    }
    setLoadingMap(true);
    try {
      // Vollständige Adresse aus den Vereinsdaten zusammenbauen
      const fullAddress = `${orgData.street}, ${orgData.zip || ""} ${orgData.city}, ${orgData.country || "Deutschland"}`;
      
      // Verwende Google Static Maps API über den Manus Proxy (Frontend-Zugang)
      const forgeUrl = import.meta.env.VITE_FRONTEND_FORGE_API_URL || "https://forge.butterfly-effect.dev";
      const apiKey = import.meta.env.VITE_FRONTEND_FORGE_API_KEY;
      
      // PRIORITÄT: Wenn Koordinaten im Verein hinterlegt sind, diese verwenden (präziser)
      // Ansonsten die vollständige Adresse als Geocoding-Fallback
      let center: string;
      if (orgData.latitude && orgData.longitude && orgData.latitude !== 0 && orgData.longitude !== 0) {
        center = `${orgData.latitude},${orgData.longitude}`;
      } else {
        // Adresse URL-encodiert als Fallback
        center = encodeURIComponent(fullAddress);
      }
      
      // Karte mit minimalistischem Stil (nur Straßen, keine Labels) für Wasserzeichen-Effekt
      const mapUrl = `${forgeUrl}/v1/maps/proxy/maps/api/staticmap?center=${center}&zoom=15&size=600x600&maptype=roadmap&style=feature:all|element:labels|visibility:off&style=feature:road|element:geometry|color:0x333333&style=feature:road.local|element:geometry|color:0x555555&style=feature:water|element:geometry|color:0x111111&style=feature:landscape|element:geometry|color:0x000000&style=feature:poi|visibility:off&style=feature:transit|visibility:off&key=${apiKey}`;
      
      // Karte herunterladen und in Storage hochladen (damit die KI eine öffentliche URL bekommt)
      const mapResponse = await fetch(mapUrl, {
        headers: { "Authorization": `Bearer ${apiKey}` },
      });
      if (!mapResponse.ok) throw new Error(`Karte konnte nicht geladen werden (${mapResponse.status})`);
      const mapBlob = await mapResponse.blob();
      const mapReader = new FileReader();
      const mapBase64: string = await new Promise((resolve, reject) => {
        mapReader.onload = () => resolve((mapReader.result as string).split(",")[1]);
        mapReader.onerror = reject;
        mapReader.readAsDataURL(mapBlob);
      });
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: mapBase64, fileName: `map_${Date.now()}.png`, contentType: "image/png" }),
      });
      if (!uploadRes.ok) throw new Error("Karten-Upload fehlgeschlagen");
      const { url: storedMapUrl } = await uploadRes.json();
      
      setMapImageUrl(storedMapUrl);
      setUseMapWatermark(true);
      toast.success(`Straßenkarte für "${fullAddress}" geladen und gespeichert!`);
    } catch (error) {
      toast.error("Karte konnte nicht geladen werden");
    } finally {
      setLoadingMap(false);
    }
  };

  // ── Vereinsfarben automatisch übernehmen wenn Toggle aktiv ──
  useEffect(() => {
    if (useClubColors && orgData) {
      if (orgData.primaryColor) setPrimaryColor(orgData.primaryColor);
      if (orgData.secondaryColor) setSecondaryColor(orgData.secondaryColor);
    }
  }, [useClubColors, orgData]);

  // ── Vereinsname automatisch setzen ──
  useEffect(() => {
    if (orgData?.jerseyName && !clubName) {
      setClubName(orgData.jerseyName);
    } else if (orgData?.name && !clubName) {
      setClubName(orgData.name);
    }
  }, [orgData]);

  // ── Verbandsregeln für Prompt ──
  const rules = selectedSport ? getJerseyRules(selectedSport as any, "amateur") : null;

  // ── Wahrzeichen-Upload Handler ──
  const handleLandmarkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setLandmarkImage(dataUrl); // Vorschau-Bild (Data-URL für UI)
      setUseLandmark(true);
      setExtractingSilhouette(true);
      try {
        // Upload des Bildes
        const base64 = dataUrl.split(",")[1];
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: base64, fileName: file.name, contentType: file.type }),
        });
        const uploadData = await uploadRes.json();
        if (uploadData.url) {
          // Speichere die echte Upload-URL für die KI (nicht die Data-URL)
          setLandmarkSilhouette(uploadData.url);
          toast.success("Wahrzeichen hochgeladen!");
        }
      } catch (err: any) {
        toast.error("Upload fehlgeschlagen: " + (err.message || "Unbekannter Fehler"));
      } finally {
        setExtractingSilhouette(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // ── Muster-Upload Handler mit Farbextraktion ──
  const handlePatternUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setPatternImage(dataUrl);
      setUsePattern(true);
      setExtractingColors(true);
      try {
        // Farben aus dem Bild extrahieren via Canvas
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          canvas.width = Math.min(img.width, 200);
          canvas.height = Math.min(img.height, 200);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const pixels = imageData.data;
          
          // Farben zählen (quantisiert auf 16er-Schritte)
          const colorMap = new Map<string, number>();
          const totalPixels = pixels.length / 4;
          for (let i = 0; i < pixels.length; i += 4) {
            const r = Math.round(pixels[i] / 16) * 16;
            const g = Math.round(pixels[i + 1] / 16) * 16;
            const b = Math.round(pixels[i + 2] / 16) * 16;
            const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
            colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
          }
          
          // Top-Farben sortieren und filtern (mind. 3% Anteil)
          const sorted = [...colorMap.entries()]
            .sort((a, b) => b[1] - a[1])
            .filter(([, count]) => count / totalPixels > 0.03)
            .slice(0, 8);
          
          const extracted: ExtractedColor[] = sorted.map(([hex, count]) => ({
            hex,
            percentage: Math.round((count / totalPixels) * 100),
            replacementHex: hex, // Initial gleich
          }));
          
          setPatternColors(extracted);
          setExtractingColors(false);
          toast.success(`${extracted.length} Farben im Muster erkannt!`);
        };
        img.src = dataUrl;
      } catch (err: any) {
        toast.error("Farbextraktion fehlgeschlagen");
        setExtractingColors(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // ── Sportart-spezifische Kleidungsstücke für den Prompt ──
  const getGarmentDescription = (sportId: string): string => {
    const map: Record<string, string> = {
      fussball: "soccer jersey with shorts",
      handball: "handball jersey (tight-fit, short sleeves) with shorts",
      volleyball: "volleyball jersey (lightweight, sleeveless or short-sleeve) with shorts",
      basketball: "basketball jersey (sleeveless tank top) with basketball shorts",
      hockey: "field hockey jersey with skirt/shorts",
      rugby: "rugby jersey (reinforced, long-sleeve) with shorts",
      american_football: "american football jersey (mesh, oversized) with pants",
      eishockey: "ice hockey jersey (long-sleeve, loose-fit)",
      tischtennis: "table tennis polo shirt with shorts",
      badminton: "badminton jersey (lightweight, breathable) with shorts",
      tennis: "tennis polo shirt with tennis skirt/shorts",
    };
    return map[sportId] || "sports jersey";
  };

  // ── KI-Design generieren ──
  const handleGenerate = async () => {
    if (!selectedSport) { toast.error("Bitte eine Sportart wählen"); return; }

    setGenerating(true);
    try {
      const sportInfo = SPORT_TYPES.find(s => s.id === selectedSport);
      const styleInfo = DESIGN_STYLES.find(s => s.value === designStyle);
      const garmentDesc = getGarmentDescription(selectedSport);
      
      // Verbandsregeln in den Prompt einbauen
      let rulesContext = "";
      if (rules) {
        const rulesParts: string[] = [];
        if (rules.number.frontMinHeight) rulesParts.push(`Front number: min ${rules.number.frontMinHeight}cm height`);
        if (rules.number.backMinHeight) rulesParts.push(`Back number: min ${rules.number.backMinHeight}cm height`);
        if (rules.sponsor.maxSponsorsTotal) rulesParts.push(`Max ${rules.sponsor.maxSponsorsTotal} sponsors allowed`);
        if (rules.emblem.heartSideRequired) rulesParts.push(`Club emblem on heart side (required)`);
        if (rulesParts.length > 0) {
          rulesContext = ` The design must comply with ${sportInfo?.name || selectedSport} federation rules: ${rulesParts.join(", ")}.`;
        }
      }

      // ===== FESTE BILDPOSITIONEN-LOGIK =====
      // Jedes Element hat eine FESTE Slot-Nummer. Ist der Slot belegt, kommt das Bild rein.
      // Ist er leer, wird im Prompt "LEER" geschrieben.
      // So weiß die KI IMMER welches Bild was ist.
      
      // Slot-Definitionen (feste Reihenfolge):
      // Slot 1: Vereinswappen
      // Slot 2: Wahrzeichen
      // Slot 3: Straßenkarte
      // Slot 4: Sponsor Brust
      // Slot 5: Sponsor Rücken
      // Slot 6: Sponsor Ärmel links
      // Slot 7: Sponsor Ärmel rechts
      // Slot 8: Sponsor Seite links
      // Slot 9: Sponsor Seite rechts
      // Slot 10: Sponsor Kragen
      
      const enabledSponsors = sponsorLogos.filter(s => s.enabled && s.imageUrl);
      
      // Sponsoren nach Position gruppieren
      const sponsorByPosition: Record<string, typeof enabledSponsors[0] | null> = {
        chest: null,
        back: null,
        sleeve_left: null,
        sleeve_right: null,
        side_left: null,
        side_right: null,
        collar: null,
      };
      enabledSponsors.forEach(s => {
        const pos = sponsorPositions[s.id] || "chest";
        // Falls mehrere Sponsoren auf gleicher Position: nur den ersten nehmen
        if (!sponsorByPosition[pos]) {
          sponsorByPosition[pos] = s;
        }
      });
      
      // Bilder-Array aufbauen (NUR belegte Slots senden, aber Prompt beschreibt ALLE)
      const imageSlots: { url: string | null; slotNum: number; description: string }[] = [
        { slotNum: 1, url: defaultLogo?.imageUrl || null, description: "Vereinswappen" },
        { slotNum: 2, url: (useLandmark && landmarkSilhouette) ? landmarkSilhouette : null, description: "Wahrzeichen" },
        { slotNum: 3, url: (useMapWatermark && mapImageUrl) ? mapImageUrl : null, description: "Straßenkarte" },
        { slotNum: 4, url: sponsorByPosition.chest?.imageUrl || null, description: "Sponsor Brust" },
        { slotNum: 5, url: sponsorByPosition.back?.imageUrl || null, description: "Sponsor Rücken" },
        { slotNum: 6, url: sponsorByPosition.sleeve_left?.imageUrl || null, description: "Sponsor Ärmel links" },
        { slotNum: 7, url: sponsorByPosition.sleeve_right?.imageUrl || null, description: "Sponsor Ärmel rechts" },
        { slotNum: 8, url: sponsorByPosition.side_left?.imageUrl || null, description: "Sponsor Seite links" },
        { slotNum: 9, url: sponsorByPosition.side_right?.imageUrl || null, description: "Sponsor Seite rechts" },
        { slotNum: 10, url: sponsorByPosition.collar?.imageUrl || null, description: "Sponsor Kragen" },
      ];
      
      // Nur belegte Bilder an die KI senden (in fester Reihenfolge)
      const additionalRefs: string[] = [];
      const sentSlots: number[] = [];
      imageSlots.forEach(slot => {
        if (slot.url) {
          additionalRefs.push(slot.url);
          sentSlots.push(slot.slotNum);
        }
      });
      
      // PROMPT: Bildzuordnung klar beschreiben
      let extraPrompt = "";
      
      // Bildzuordnungs-Header: Sagt der KI exakt welches gesendete Bild welcher Slot ist
      extraPrompt += " BILDZUORDNUNG (die Bilder werden in genau dieser Reihenfolge gesendet):";
      let sentIndex = 1;
      imageSlots.forEach(slot => {
        if (slot.url) {
          extraPrompt += ` Gesendetes Bild ${sentIndex} = ${slot.description} (Slot ${slot.slotNum}).`;
          sentIndex++;
        }
      });
      
      // SLOT 1: Vereinswappen
      if (defaultLogo?.imageUrl) {
        extraPrompt += ` VEREINSWAPPEN (Slot 1): Platziere dieses Bild auf der RECHTEN SEITE der Brust (Herzseite, aus Betrachtersicht rechts). Position: 60-65% von links, 32% von oben. Größe: 8-10cm. Übernimm 1 zu 1.`;
      }
      
      // SLOT 2: Wahrzeichen
      if (useLandmark && landmarkSilhouette) {
        const opacityVal = landmarkOpacity || 15;
        if (landmarkStyle === "large") {
          extraPrompt += ` WAHRZEICHEN (Slot 2): Dieses Bild ist DIREKT IN DEN STOFF EINGEARBEITET wie ein Sublimationsdruck. GROSS und ZENTRIERT auf dem Torso beider Seiten. Gleicher Farbton wie Trikot, ${opacityVal}% heller/dunkler. Liegt HINTER allen Logos und Nummern.`;
        } else {
          extraPrompt += ` WAHRZEICHEN (Slot 2): Dieses Bild ist als WIEDERHOLENDES MUSTER in den Stoff eingearbeitet (Sublimationsdruck). Viele kleine Kopien (2-5cm) bedecken den gesamten Stoff. Gleicher Farbton wie Trikot, ${opacityVal}% heller/dunkler. Liegt HINTER allen Logos und Nummern.`;
        }
      }
      
      // SLOT 3: Straßenkarte
      if (useMapWatermark && mapImageUrl) {
        extraPrompt += ` STRASSENKARTE (Slot 3): Diese Karte ist DIREKT IN DEN STOFF EINGEARBEITET wie ein Sublimationsdruck. Die Straßenlinien bilden ein Muster im Stoff. Ton-in-Ton, ${watermarkOpacity}% heller/dunkler als Trikotfarbe. Bedeckt den gesamten Stoff. Liegt HINTER allen Logos und Nummern.`;
      }
      
      // SLOT 4-10: Sponsoren
      const sponsorSlotDescriptions: { slot: number; pos: string; placement: string }[] = [
        { slot: 4, pos: "chest", placement: "front center chest, below crest and number, centered horizontally" },
        { slot: 5, pos: "back", placement: "lower back, below player name, centered" },
        { slot: 6, pos: "sleeve_left", placement: "left sleeve (viewer's left), centered on sleeve" },
        { slot: 7, pos: "sleeve_right", placement: "right sleeve (viewer's right), centered on sleeve" },
        { slot: 8, pos: "side_left", placement: "left side of torso" },
        { slot: 9, pos: "side_right", placement: "right side of torso" },
        { slot: 10, pos: "collar", placement: "back collar/nape area" },
      ];
      
      sponsorSlotDescriptions.forEach(({ slot, pos, placement }) => {
        if (sponsorByPosition[pos]?.imageUrl) {
          extraPrompt += ` SPONSOR (Slot ${slot}): Übernimm dieses Logo-Bild 1 zu 1 an Position: ${placement}. NICHT als Text – das BILD übernehmen!`;
        }
      });
      
      // VEREINSWAPPEN ALS WASSERZEICHEN AUF DER RÜCKSEITE
      if (useBackCrestWatermark && defaultLogo?.imageUrl) {
        extraPrompt += ` WAPPEN-WASSERZEICHEN RÜCKSEITE: Das Vereinswappen (Slot 1) zusätzlich als großes Wasserzeichen auf der Rückseite. Zentriert, 60-70% Breite, ${backCrestOpacity}% Deckkraft, tonal. Liegt HINTER Nummer, Name und Text.`;
      }

      // MUSTER-UPLOAD
      if (usePattern && patternColors.length > 0) {
        const colorList = patternColors.map(c => c.replacementHex).join(", ");
        extraPrompt += ` Use a pattern-inspired design with these colors: ${colorList}.`;
      }
      
      // SUBLIMATION-BEREICHE
      if (printMethod === "sublimation") {
        const activeAreas = SUBLIMATION_AREAS.filter(a => sublimationAreas[a.id]).map(a => a.label).join(", ");
        extraPrompt += ` Full sublimation print covering: ${activeAreas}.`;
        if (sublimationAreas.collar) extraPrompt += " Include printed collar design.";
        if (sublimationAreas.cuff_left || sublimationAreas.cuff_right) extraPrompt += " Include printed cuff/sleeve band design.";
      }

      // NUMMER: Vorne und hinten IDENTISCH, einfarbig
      extraPrompt += ` NUMMER: Vorne und hinten DIESELBE Nummer, DIESELBE FARBE. EINFARBIG – KEINE Muster, KEINE Texturen. Saubere, fette, gut lesbare Zahl in EINER Farbe. RÜCKENNUMMER: Groß (25-35cm), zentriert. BRUSTNUMMER: Kleiner (10cm), links (gegenüber Wappen).`;

      // RÜCKSEITEN-LAYOUT
      const layoutOption = BACK_LAYOUT_OPTIONS.find(o => o.type === backLayout);
      if (layoutOption) {
        const orderDesc = layoutOption.order.map((el, i) => {
          const labels: Record<string, string> = {
            clubName: `Club name "${clubName || 'CLUB'}"`,
            playerName: "Player name",
            playerNumber: "Back number (large, 25-35cm)",
          };
          return `${i + 1}. ${labels[el]}`;
        }).join(", then ");
        extraPrompt += ` BACK VIEW (right jersey) - LAYOUT ORDER from top to bottom: ${orderDesc}. `;
        if (layoutOption.hasClubName && clubName) {
          extraPrompt += `The club name "${clubName}" MUST appear on the back in its designated position. `;
        }
        extraPrompt += `Player name max 7.5cm height. Back number 25-35cm. All centered.`;
      } else if (clubName) {
        extraPrompt += ` MUST include club name "${clubName}" on the BACK, above the number.`;
      }
      
      // HASHTAG
      if (useHashtag && orgData?.hashtag) {
        extraPrompt += ` Text "${orgData.hashtag}" on BACK NECK/NAPE area, small but visible.`;
      }
      
      // KOORDINATEN
      if (useCoordinates && orgData?.latitude && orgData?.longitude) {
        const lat = Number(orgData.latitude).toFixed(4);
        const lng = Number(orgData.longitude).toFixed(4);
        const latDir = Number(orgData.latitude) >= 0 ? "N" : "S";
        const lngDir = Number(orgData.longitude) >= 0 ? "E" : "W";
        const coordText = `${Math.abs(Number(lat))}°${latDir} ${Math.abs(Number(lng))}°${lngDir}`;
        extraPrompt += ` Coordinates "${coordText}" on collar or sleeve cuff, small monospace font.`;
      }

      // Markenrecht-Schutz: Keine ERFUNDENEN Logos oder Marken!
      // Die KI darf NUR die als Referenz übergebenen echten Logos verwenden.
      const brandProtection = " ABSOLUTE RULE - NO MANUFACTURER LOGOS: There is NO manufacturer/brand logo on this jersey. Do NOT add ANY logo, text, symbol, or mark on the shoulders, sleeves, collar, or anywhere else that is not EXPLICITLY described in the instructions above. NO three stripes, NO swoosh, NO puma, NO Hummel, NO Erima, NO Jako, NO Mizuno, NO 'Front', NO invented brand names. The shoulders, collar area, and any position not explicitly assigned to a sponsor MUST remain completely EMPTY and show only the jersey fabric/pattern. ONLY place elements that are EXPLICITLY instructed above.";

      const prompt = `Professional product photography of a ${garmentDesc} for ${sportInfo?.name || selectedSport}, flat lay on white background. Design style: ${styleInfo?.label || designStyle}. Primary color: ${primaryColor}, secondary color: ${secondaryColor}, accent color: ${accentColor}.${clubName ? ` Club: ${clubName}.` : ""}${additionalNotes ? ` Additional details: ${additionalNotes}.` : ""}${rulesContext}${extraPrompt}${brandProtection} The jersey is SIZE L (75cm height). All proportions and element sizes are based on this reference size. The jersey should look like a real professional ${sportInfo?.name || selectedSport} jersey with sport-specific cut and proportions. Show FRONT and BACK view side by side (front on left, back on right). CRITICAL: Show ONLY the jersey/shirt - do NOT include shorts, pants, socks, or any other clothing items. The image must contain ONLY the upper body garment (jersey/shirt). High-end product photography, studio lighting, no wrinkles.`;

      // additionalRefs wurde oben im Slot-System aufgebaut

      const result = await generateAiMockup.mutateAsync({
        productName: `${sportInfo?.name || selectedSport} Trikot`,
        productType: "trikot",
        colorDescription: `Primary: ${primaryColor}, Secondary: ${secondaryColor}, Accent: ${accentColor}`,
        side: "front",
        customPrompt: prompt,
        referenceImageUrl: undefined,
        referenceImageUrls: additionalRefs.length > 0 ? additionalRefs : undefined,
      });

      if (result.url) {
        let finalUrl = result.url;
        
        // Wappen in Rückennummer – DEAKTIVIERT (später als Feature)
        
        setGeneratedImageUrl(finalUrl);
        toast.success("Trikot-Design generiert! Sie können jetzt Zonen hinzufügen.");
        setStep("generate");
      }
    } catch (error: any) {
      toast.error(error.message || "Design-Generierung fehlgeschlagen");
    } finally {
      setGenerating(false);
    }
  };

  // ── KI-Analyse auf generiertem Bild ──
  const handleAnalyzeGenerated = async () => {
    if (!generatedImageUrl) return;
    setGenerating(true);
    try {
      const fullImageUrl = generatedImageUrl.startsWith("http") ? generatedImageUrl : `${window.location.origin}${storageUrl(generatedImageUrl) || generatedImageUrl}`;
      const result = await analyzeImage.mutateAsync({
        imageUrl: fullImageUrl,
        sport: selectedSport as any || undefined,
        category: "trikot" as any,
      });
      if (result.zones && result.zones.length > 0) {
        const newZones: Zone[] = result.zones.map((z: any, idx: number) => ({
          id: `ai_zone_${Date.now()}_${idx}`,
          name: z.name,
          purpose: z.purpose,
          x: Math.max(0, Math.min(95, z.x)),
          y: Math.max(0, Math.min(95, z.y)),
          width: Math.max(3, Math.min(100 - z.x, z.width)),
          height: Math.max(3, Math.min(100 - z.y, z.height)),
          side: z.side === 'V' ? 'front' as const : z.side === 'R' ? 'back' as const : z.side,
          fontColor: z.fontColor || "#000000",
          fontFamily: useClubFont && defaultFont?.fontFamily ? defaultFont.fontFamily : (z.fontFamily || "Oswald"),
          fontWeight: z.fontWeight || "bold",
          fontSize: z.fontSize || 85,
          enabled: true,
        }));
        setZones(newZones);
        toast.success(`${newZones.length} Zonen erkannt!`);
        setStep("edit");
      } else {
        toast.info("Keine Zonen erkannt – fügen Sie manuell Zonen hinzu.");
        setStep("edit");
      }
    } catch (error: any) {
      toast.error(error.message || "Analyse fehlgeschlagen");
      setStep("edit");
    } finally {
      setGenerating(false);
    }
  };

  // ── Fullscreen-Editor öffnen ──
  const openFullscreenEditor = useCallback(() => {
    const enabledZones = zones.filter(z => z.enabled !== false);
    const snapshot = JSON.parse(JSON.stringify(enabledZones));
    registerSaveCallback((savedZones) => setZones(savedZones));
    registerDiscardCallback(() => setZones(snapshot));
    const displayImageUrl = generatedImageUrl ? (generatedImageUrl.startsWith("http") ? generatedImageUrl : (storageUrl(generatedImageUrl) || generatedImageUrl)) : undefined;
    openEditor({
      zones: JSON.parse(JSON.stringify(enabledZones)),
      selectedProductId: null,
      selectedPartId: null,
      orgId,
      sport: selectedSport,
      category: "trikot",
      snapshot,
      templateImageUrl: displayImageUrl,
      jerseyColor: primaryColor,
    });
    setLocation('/designer/zone-editor');
  }, [zones, orgId, selectedSport, primaryColor, openEditor, registerSaveCallback, registerDiscardCallback, setLocation, generatedImageUrl]);

  // ── Speichern ──
  const handleSave = async () => {
    if (!generatedImageUrl) { toast.error("Bitte zuerst ein Design generieren"); return; }
    // Wenn kein Name eingegeben wurde, automatisch einen Standardnamen generieren
    let saveName = templateName.trim();
    if (!saveName) {
      const sportLabel = SPORT_TYPES.find(s => s.id === selectedSport)?.name || "Trikot";
      saveName = `KI-Design ${sportLabel} ${new Date().toLocaleDateString("de-DE")}`;
      setTemplateName(saveName);
      toast.info(`Vorlagenname automatisch gesetzt: "${saveName}"`);
    }
    if (!selectedSport) { toast.error("Bitte eine Sportart wählen"); return; }

    const enabledZones = zones.filter(z => z.enabled !== false);
    setSaving(true);
    try {
      await createTemplate.mutateAsync({
        name: saveName,
        imageUrl: generatedImageUrl,
        storageKey: undefined,
        positionsConfig: enabledZones.length > 0 ? { productId: null, zones: enabledZones, jerseyColor: primaryColor } : undefined,
        orgId,
        departmentId: undefined,
        teamId: undefined,
        sport: selectedSport as any,
        category: "Trikot" as any,
        visibility,
        productId: undefined,
        zones: enabledZones.length > 0 ? enabledZones.map(z => ({
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
      toast.success("KI-Design als Vorlage gespeichert!");
      utils.designTemplate.list.invalidate();
      setLocation('/designer/products');
    } catch (error: any) {
      toast.error(error.message || "Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  // ── Hosen-Optionen State ──
  const [shortsIncludeNumber, setShortsIncludeNumber] = useState(true);
  const [shortsIncludeCrest, setShortsIncludeCrest] = useState(true);
  const [shortsSponsorIds, setShortsSponsorIds] = useState<string[]>([]);
  const [shortsSponsorPlacements, setShortsSponsorPlacements] = useState<Record<string, "front" | "back">>({});
  const [shortsSponsorSizes, setShortsSponsorSizes] = useState<Record<string, "small" | "medium" | "large">>({});

  // ── Passende Hose generieren (mit Nummer, Wappen, Sponsoren) ──
  const generateMatchingShorts = async () => {
    if (!generatedImageUrl) return;
    setGeneratingShorts(true);
    try {
      const currentSportInfo = SPORT_TYPES.find(s => s.id === selectedSport);
      const currentStyleInfo = DESIGN_STYLES.find(s => s.value === designStyle);
      
      // Hosen-Prompt mit optionalen Elementen
      let shortsExtras = "";
      
      // Sponsoren-Logik: Prüfe ob ein Sponsor VORNE platziert ist
      const shortsSponsorLogos = sponsorLogos.filter(s => shortsSponsorIds.includes(s.id) && s.imageUrl);
      const hasFrontSponsor = shortsSponsorLogos.some(s => (shortsSponsorPlacements[s.id] || "front") === "front");
      
      // Referenzbilder für die Hose aufbauen: Trikot ist immer Bild 1 (referenceUrl)
      // Danach: Wappen (wenn gewählt), dann Sponsoren
      const shortsAdditionalRefs: string[] = [];
      let imgCounter = 1; // Bild 1 = Trikot (referenceUrl)
      
      // Wappen als Referenzbild hinzufügen (nur wenn gewählt UND kein Sponsor vorne)
      let crestImgNum = 0;
      if (shortsIncludeCrest && defaultLogo?.imageUrl && !hasFrontSponsor) {
        imgCounter++;
        crestImgNum = imgCounter;
        shortsAdditionalRefs.push(defaultLogo.imageUrl);
      }
      
      // Sponsor-Bilder als Referenz hinzufügen
      const sponsorImgNums: Record<string, number> = {};
      shortsSponsorLogos.forEach(s => {
        if (s.imageUrl) {
          imgCounter++;
          sponsorImgNums[s.id] = imgCounter;
          shortsAdditionalRefs.push(s.imageUrl);
        }
      });
      
      // POSITIONIERUNG: Alle Elemente UNTEN am Hosenbein-Saum
      if (shortsIncludeNumber) {
        shortsExtras += ` VORDERSEITE - NUMMER: Spielernummer "23" auf dem LINKEN Hosenbein (aus Betrachtersicht links). Position: UNTEN am Bein, nahe am Saum. Größe: ca. 8cm. Gleiche Schriftart und Farbe wie die Rücken-Nummer des Trikots.`;
      }
      
      // Wappen nur wenn gewählt UND kein Sponsor vorne
      if (crestImgNum > 0) {
        shortsExtras += ` VORDERSEITE - VEREINSWAPPEN: Referenzbild ${crestImgNum} ist das Vereinswappen. Übernimm es 1 zu 1 auf dem RECHTEN Hosenbein (aus Betrachtersicht rechts). Position: UNTEN am Bein, nahe am Saum, gleiche Höhe wie Nummer gegenüber. Größe: ca. 5-6cm.`;
      }
      
      // Sponsoren auf der Hose
      if (shortsSponsorLogos.length > 0) {
        shortsSponsorLogos.forEach((s) => {
          const placement = shortsSponsorPlacements[s.id] || "front";
          const size = shortsSponsorSizes[s.id] || "medium";
          const sizeMap = { small: "5cm breit x 2cm hoch", medium: "8cm breit x 3cm hoch", large: "12cm breit x 5cm hoch" };
          const imgNum = sponsorImgNums[s.id];
          if (!imgNum) return;
          
          if (placement === "front") {
            shortsExtras += ` VORDERSEITE - SPONSOR-LOGO: Referenzbild ${imgNum} ist ein Sponsor-Logo. Übernimm dieses Bild 1 zu 1 auf dem RECHTEN Hosenbein (aus Betrachtersicht rechts). Position: UNTEN am Bein, nahe am Saum. Größe: ca. ${sizeMap[size]}. NICHT als Text schreiben - das BILD übernehmen!`;
          } else {
            shortsExtras += ` RÜCKSEITE - SPONSOR-LOGO: Referenzbild ${imgNum} ist ein Sponsor-Logo. Übernimm dieses Bild 1 zu 1 auf der RÜCKSEITE der Hose. Position: UNTEN am Bein, nahe am Saum, zentriert. Größe: ca. ${sizeMap[size]}. NICHT als Text schreiben - das BILD übernehmen!`;
          }
        });
      }

      const shortsPrompt = `Professionelle Produktfotografie von NUR einer Sporthose für ${currentSportInfo?.name || selectedSport}, flach liegend auf weißem Hintergrund. WICHTIG: Zeige NUR die Hose - KEIN Trikot, KEIN Shirt, KEINE Socken, KEINE anderen Kleidungsstücke. NUR DIE HOSE. Die Hose muss zum Trikot-Design passen (Referenzbild 1): Primärfarbe: ${primaryColor}, Sekundärfarbe: ${secondaryColor}, Akzentfarbe: ${accentColor}. Design-Stil: ${currentStyleInfo?.label || designStyle}. Zeige VORDERSEITE und RÜCKSEITE nebeneinander (vorne links, hinten rechts). Größe L.${shortsExtras} WICHTIG: Erfinde KEINE Logos oder Marken die nicht als Referenzbild mitgegeben wurden. Alle Sponsor-Logos müssen 1 zu 1 vom Referenzbild übernommen werden.`;

      const result = await generateAiMockup.mutateAsync({
        productName: `${currentSportInfo?.name || selectedSport} Hose`,
        productType: "hose",
        colorDescription: `Primary: ${primaryColor}, Secondary: ${secondaryColor}, Accent: ${accentColor}`,
        side: "front",
        customPrompt: shortsPrompt,
        referenceImageUrl: generatedImageUrl.startsWith("http") ? generatedImageUrl : `${window.location.origin}${generatedImageUrl}`,
        referenceImageUrls: shortsAdditionalRefs.length > 0 ? shortsAdditionalRefs : undefined,
      });

      if (result.url) {
        setMatchingShortsUrl(result.url);
        toast.success("Passende Hose generiert!");
      }
    } catch (error: any) {
      console.error("Hosen-Generierung fehlgeschlagen:", error);
      toast.error("Hosen-Generierung fehlgeschlagen");
    } finally {
      setGeneratingShorts(false);
    }
  };

  // ── Design ändern (Image-to-Image Edit) ──
  const handleEditDesign = async () => {
    if (!generatedImageUrl || !editDescription.trim()) return;
    setIsEditing(true);
    try {
      const editPrompt = `Modify this existing jersey design based on the following instruction: "${editDescription.trim()}". Keep everything else EXACTLY the same - same colors, same layout, same logos, same numbers, same overall style. ONLY change what is explicitly requested. The result must still be a professional flat-lay product photo on white background showing front and back view side by side.`;

      const result = await generateAiMockup.mutateAsync({
        productName: "Trikot (Bearbeitung)",
        productType: "trikot",
        side: "front",
        customPrompt: editPrompt,
        referenceImageUrl: generatedImageUrl.startsWith("http") ? generatedImageUrl : `${window.location.origin}${generatedImageUrl}`,
      });

      if (result.url) {
        setGeneratedImageUrl(result.url);
        setEditDescription("");
        toast.success("Änderung angewendet!");
      }
    } catch (error: any) {
      console.error("Design-Änderung fehlgeschlagen:", error);
      toast.error("Änderung fehlgeschlagen: " + (error.message || "Unbekannter Fehler"));
    } finally {
      setIsEditing(false);
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
      fontFamily: useClubFont && defaultFont?.fontFamily ? defaultFont.fontFamily : "Oswald",
      enabled: true,
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
  const validationResult = rules && zones.length > 0
    ? validateZonesAgainstRules(zones as any, rules)
    : null;

  // ── Angezeigtes Bild ──
  const displayImage = generatedImageUrl ? (storageUrl(generatedImageUrl) || generatedImageUrl) : null;

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
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <Wand2 className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">KI-Design</h1>
                <p className="text-xs text-muted-foreground">Neues Trikot-Design generieren (Verbandsregeln beachtet)</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(step === "edit" || step === "save") && zones.filter(z => z.enabled !== false).length > 0 && (
              <Button size="sm" variant="outline" onClick={openFullscreenEditor}>
                <Maximize2 className="w-4 h-4 mr-1" />
                Vollbild-Editor
              </Button>
            )}
            {(step === "generate" || step === "edit" || step === "save") && generatedImageUrl && (
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-1" />
                {saving ? "Speichert..." : "Vorlage speichern"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stepper */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto">
          {[
            { key: "configure", label: "1. Konfigurieren" },
            { key: "generate", label: "2. Generieren" },
            { key: "edit", label: "3. Zonen setzen" },
            { key: "save", label: "4. Speichern" },
          ].map((s, i) => {
            const steps = ["configure", "generate", "edit", "save"];
            const currentIdx = steps.indexOf(step);
            const canNavigate = i < currentIdx; // Nur zu vorherigen Steps navigieren
            return (
              <div key={s.key} className="flex items-center gap-2">
                <button
                  onClick={() => canNavigate && setStep(s.key as any)}
                  disabled={!canNavigate && step !== s.key}
                  className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    step === s.key ? "bg-purple-600 text-white" :
                    currentIdx > i ? "bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer" :
                    "bg-gray-100 text-gray-500"
                  }`}
                >
                  {s.label}
                </button>
                {i < 3 && <div className="w-4 h-px bg-gray-300" />}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Linke Spalte: Vorschau / Generiertes Bild */}
          <div className="lg:col-span-2 space-y-4">
            {step === "configure" ? (
              /* Konfigurations-Panel */
              <div className="bg-white rounded-xl border p-6 space-y-6">
                <div className="text-center mb-4">
                  <Wand2 className="w-10 h-10 mx-auto mb-3 text-purple-500" />
                  <h2 className="text-xl font-semibold">Neues Trikot-Design erstellen</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Konfigurieren Sie Ihr Wunschtrikot und lassen Sie die KI ein Design generieren.
                  </p>
                </div>

                {/* ═══ VEREINS-INTEGRATION ═══ */}
                {orgData && (
                  <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-blue-600" />
                      </div>
                      <h3 className="text-sm font-semibold text-blue-800">Vereinsdaten: {orgData.name}</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Vereinsfarben Toggle */}
                      <div className="flex items-center justify-between p-2 bg-white rounded border">
                        <div className="flex items-center gap-2">
                          <Palette className="w-4 h-4 text-blue-600" />
                          <span className="text-sm">Vereinsfarben übernehmen</span>
                        </div>
                        <Switch checked={useClubColors} onCheckedChange={setUseClubColors} />
                      </div>

                      {/* Vereinswappen = ZWINGEND (Verbandsregel, kein Toggle) */}
                      {defaultLogo && (
                        <>
                          <div className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                            <div className="flex items-center gap-2">
                              <img src={storageUrl(defaultLogo.imageUrl) || defaultLogo.imageUrl} alt="Wappen" className="w-6 h-6 object-contain" />
                              <div>
                                <span className="text-sm font-medium">Vereinswappen (Brust links)</span>
                                <span className="text-[10px] text-green-700 block">Pflicht (Verbandsregel: Herzseite)</span>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">PFLICHT</span>
                          </div>
                          {/* Wappen in Rückennummer – DEAKTIVIERT (später als Feature hinzufügen) */}
                        </>
                      )}

                      {/* Schrift Toggle */}
                      {defaultFont && (
                        <div className="flex items-center justify-between p-2 bg-white rounded border">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-blue-600">Aa</span>
                            <span className="text-sm">Schrift: {defaultFont.fontFamily}</span>
                          </div>
                          <Switch checked={useClubFont} onCheckedChange={setUseClubFont} />
                        </div>
                      )}

                      {/* Hashtag Toggle */}
                      {orgData.hashtag && (
                        <div className="flex items-center justify-between p-2 bg-white rounded border">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-blue-600">#</span>
                            <span className="text-sm truncate">{orgData.hashtag}</span>
                          </div>
                          <Switch checked={useHashtag} onCheckedChange={setUseHashtag} />
                        </div>
                      )}

                      {/* Koordinaten Toggle */}
                      {orgData.latitude && orgData.longitude && (
                        <div className="flex items-center justify-between p-2 bg-white rounded border">
                          <div className="flex items-center gap-2">
                            <Mountain className="w-4 h-4 text-blue-600" />
                            <span className="text-sm">Koordinaten</span>
                          </div>
                          <Switch checked={useCoordinates} onCheckedChange={setUseCoordinates} />
                        </div>
                      )}

                      {/* Hersteller-Logo Toggle (OPTIONAL - nur wenn hochgeladen) */}
                      <div className="flex items-center justify-between p-2 bg-white rounded border col-span-1 sm:col-span-2">
                        <div className="flex items-center gap-2">
                          {manufacturerLogoUrl ? (
                            <img src={storageUrl(manufacturerLogoUrl)} alt="Hersteller" className="w-5 h-5 object-contain" />
                          ) : (
                            <Shield className="w-4 h-4 text-gray-400" />
                          )}
                          <div>
                            <span className="text-sm">Hersteller-Logo</span>
                            <span className="text-[10px] text-muted-foreground block">
                              {manufacturerLogoUrl ? "Logo wird platziert" : "Optional – Logo hochladen um zu aktivieren"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!manufacturerLogoUrl && (
                            <label className="cursor-pointer text-xs text-blue-600 hover:underline">
                              Hochladen
                              <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  const reader = new FileReader();
                                  reader.onload = async () => {
                                    const dataUrl = reader.result as string;
                                    const base64 = dataUrl.split(',')[1];
                                    const res = await fetch('/api/upload', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        data: base64,
                                        fileName: `manufacturer_${Date.now()}_${file.name}`,
                                        contentType: file.type,
                                      }),
                                    });
                                    if (!res.ok) throw new Error('Upload fehlgeschlagen');
                                    const { url } = await res.json();
                                    setManufacturerLogoUrl(url);
                                    setUseManufacturerLogo(true);
                                    toast.success("Hersteller-Logo hochgeladen");
                                  };
                                  reader.readAsDataURL(file);
                                } catch {
                                  toast.error("Upload fehlgeschlagen");
                                }
                              }} />
                            </label>
                          )}
                          {manufacturerLogoUrl && (
                            <button
                              className="text-xs text-red-500 hover:underline"
                              onClick={() => { setManufacturerLogoUrl(null); setUseManufacturerLogo(false); }}
                            >
                              Entfernen
                            </button>
                          )}
                          <Switch
                            checked={useManufacturerLogo}
                            disabled={!manufacturerLogoUrl}
                            onCheckedChange={setUseManufacturerLogo}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ═══ RÜCKSEITEN-LAYOUT ═══ */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold uppercase text-gray-500">Rückseiten-Layout</Label>
                  <Select value={backLayout} onValueChange={(v) => setBackLayout(v as BackLayoutType)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Layout wählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {BACK_LAYOUT_OPTIONS.map(opt => (
                        <SelectItem key={opt.type} value={opt.type}>
                          <div className="flex flex-col">
                            <span>{opt.label}</span>
                            <span className="text-xs text-muted-foreground">{opt.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* Wappen als Wasserzeichen auf Rücken */}
                  {defaultLogo && (
                    <div className="mt-2 space-y-2">
                      <div className={`flex items-center justify-between p-2 rounded border ${useLandmark && landmarkPlacement === "both" ? "bg-gray-100 opacity-50" : "bg-white"}`}>
                        <div className="flex items-center gap-2">
                          <img src={storageUrl(defaultLogo.imageUrl) || defaultLogo.imageUrl} alt="Wappen" className="w-4 h-4 object-contain opacity-40" />
                          <div>
                            <span className="text-sm">Wappen als Wasserzeichen (Rücken)</span>
                            <span className="text-[10px] text-muted-foreground block">
                              {useLandmark && landmarkPlacement === "both"
                                ? "Nicht verfügbar: Wahrzeichen auf Rückseite aktiv"
                                : "Groß, halbtransparent HINTER der Nummer"}
                            </span>
                          </div>
                        </div>
                        <Switch
                          checked={useBackCrestWatermark}
                          onCheckedChange={setUseBackCrestWatermark}
                          disabled={useLandmark && landmarkPlacement === "both"}
                        />
                      </div>
                      {useBackCrestWatermark && (
                        <div className="pl-6 space-y-1">
                          <span className="text-xs font-medium text-gray-600">Deckkraft: {backCrestOpacity}%</span>
                          <Slider
                            value={[backCrestOpacity]}
                            onValueChange={(v) => setBackCrestOpacity(v[0])}
                            min={5}
                            max={50}
                            step={5}
                            className="w-full"
                          />
                          <div className="flex justify-between text-[10px] text-gray-400">
                            <span>5%</span>
                            <span>50%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ═══ DRUCKVERFAHREN ═══ */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold uppercase text-gray-500">Druckverfahren</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setPrintMethod("sublimation")}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        printMethod === "sublimation"
                          ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                          : "border-gray-200 hover:border-gray-300 text-gray-600"
                      }`}
                    >
                      <Layers className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-sm">Sublimation</span>
                    </button>
                    <button
                      onClick={() => setPrintMethod("dtf")}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        printMethod === "dtf"
                          ? "border-orange-500 bg-orange-50 text-orange-700 font-medium"
                          : "border-gray-200 hover:border-gray-300 text-gray-600"
                      }`}
                    >
                      <Image className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-sm">DTF</span>
                    </button>
                  </div>
                </div>

                {/* ═══ SUBLIMATION-BEREICHE ═══ */}
                {printMethod === "sublimation" && (
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold uppercase text-gray-500">Bedruckbare Bereiche</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {SUBLIMATION_AREAS.map((area) => (
                        <div key={area.id} className="flex items-center justify-between p-2 bg-white rounded border">
                          <span className="text-xs">{area.label}</span>
                          <Switch
                            checked={sublimationAreas[area.id]}
                            onCheckedChange={(checked) => setSublimationAreas(prev => ({ ...prev, [area.id]: checked }))}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ═══ FARBEN ═══ */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold uppercase text-gray-500">Farbschema</Label>
                  {useClubColors && orgData?.primaryColor && (
                    <p className="text-xs text-blue-600">Vereinsfarben aktiv – Farben werden automatisch übernommen</p>
                  )}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Hauptfarbe</Label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={primaryColor} onChange={(e) => { setPrimaryColor(e.target.value); if (useClubColors) setUseClubColors(false); }} className="w-10 h-10 rounded cursor-pointer border" />
                        <span className="text-xs text-muted-foreground">{primaryColor}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Zweitfarbe</Label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={secondaryColor} onChange={(e) => { setSecondaryColor(e.target.value); if (useClubColors) setUseClubColors(false); }} className="w-10 h-10 rounded cursor-pointer border" />
                        <span className="text-xs text-muted-foreground">{secondaryColor}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Akzentfarbe</Label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border" />
                        <span className="text-xs text-muted-foreground">{accentColor}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ═══ DESIGN-STIL ═══ */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold uppercase text-gray-500">Design-Stil</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {DESIGN_STYLES.map((style) => (
                      <button
                        key={style.value}
                        onClick={() => setDesignStyle(style.value)}
                        className={`p-3 rounded-lg border text-sm text-center transition-all ${
                          designStyle === style.value
                            ? "border-purple-500 bg-purple-50 text-purple-700 font-medium"
                            : "border-gray-200 hover:border-gray-300 text-gray-600"
                        }`}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ═══ WAHRZEICHEN-UPLOAD ═══ */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold uppercase text-gray-500">Wahrzeichen (optional)</Label>
                  <p className="text-xs text-muted-foreground">Laden Sie ein Bild hoch – es wird als Wasserzeichen ins Trikot-Design übernommen.</p>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-gray-300 hover:border-purple-400 hover:bg-purple-50 cursor-pointer transition-all">
                      <Mountain className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Foto hochladen</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleLandmarkUpload} />
                    </label>
                    {landmarkImage && (
                      <div className="flex items-center gap-3">
                        <img src={landmarkImage} alt="Wahrzeichen Original" className="w-12 h-12 object-cover rounded border" />
                        {extractingSilhouette && (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                            <span className="text-xs text-purple-600">Wird hochgeladen...</span>
                          </div>
                        )}
                        {landmarkSilhouette && (
                          <div className="flex items-center gap-3">
                            <div className="relative w-16 h-16 rounded border-2 border-green-300 bg-gray-900 p-1">
                              <img 
                                src={storageUrl(landmarkSilhouette) || landmarkSilhouette} 
                                alt="Silhouette" 
                                className="w-full h-full object-contain invert" 
                              />
                              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[8px] px-1 rounded">Bereit</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-xs text-green-600 font-medium">Als Wasserzeichen übernehmen</span>
                              <Switch checked={useLandmark} onCheckedChange={setUseLandmark} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Wahrzeichen-Optionen: Darstellungsart + Platzierung + Deckkraft */}
                  {useLandmark && (landmarkImage || landmarkSilhouette) && (
                    <div className="mt-3 space-y-3 p-3 rounded-lg border border-purple-200 bg-purple-50/50">
                      {/* Darstellungsart */}
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-purple-800">Darstellungsart</span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setLandmarkStyle("large")}
                            className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                              landmarkStyle === "large"
                                ? "border-purple-500 bg-purple-100 text-purple-800"
                                : "border-gray-200 bg-white text-gray-600 hover:border-purple-300"
                            }`}
                          >
                            Groß als Wasserzeichen
                          </button>
                          <button
                            type="button"
                            onClick={() => setLandmarkStyle("pattern")}
                            className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                              landmarkStyle === "pattern"
                                ? "border-purple-500 bg-purple-100 text-purple-800"
                                : "border-gray-200 bg-white text-gray-600 hover:border-purple-300"
                            }`}
                          >
                            Kleine als Muster
                          </button>
                        </div>
                        <p className="text-[10px] text-purple-600">
                          {landmarkStyle === "large"
                            ? "Ein großes Wasserzeichen zentriert im Hintergrund"
                            : "Viele kleine Kopien zufällig verteilt als Muster-Wasserzeichen"}
                        </p>
                      </div>

                      {/* Platzierung */}
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-purple-800">Platzierung</span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setLandmarkPlacement("front")}
                            className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                              landmarkPlacement === "front"
                                ? "border-purple-500 bg-purple-100 text-purple-800"
                                : "border-gray-200 bg-white text-gray-600 hover:border-purple-300"
                            }`}
                          >
                            Nur Vorderseite
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setLandmarkPlacement("both");
                              // Ausschluss: Wenn Rückseite gewählt → Vereinswappen-Wasserzeichen deaktivieren
                              setUseBackCrestWatermark(false);
                            }}
                            className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                              landmarkPlacement === "both"
                                ? "border-purple-500 bg-purple-100 text-purple-800"
                                : "border-gray-200 bg-white text-gray-600 hover:border-purple-300"
                            }`}
                          >
                            Vorder- & Rückseite
                          </button>
                        </div>
                        {landmarkPlacement === "both" && (
                          <p className="text-[10px] text-amber-600 font-medium">
                            Hinweis: Vereinswappen als Wasserzeichen (Rücken) ist bei dieser Auswahl nicht möglich.
                          </p>
                        )}
                      </div>

                      {/* Deckkraft-Slider */}
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-purple-800">Deckkraft: {landmarkOpacity}%</span>
                        <Slider
                          value={[landmarkOpacity]}
                          onValueChange={(v) => setLandmarkOpacity(v[0])}
                          min={5}
                          max={50}
                          step={5}
                          className="w-full"
                        />
                        <div className="flex justify-between text-[10px] text-purple-400">
                          <span>5% (kaum sichtbar)</span>
                          <span>50% (deutlich)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ═══ MUSTER-UPLOAD ═══ */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold uppercase text-gray-500">Muster-Vorlage (optional)</Label>
                  <p className="text-xs text-muted-foreground">Laden Sie ein Foto mit einem Muster hoch – jede Farbe wird erkannt und kann einzeln geändert werden.</p>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-gray-300 hover:border-purple-400 hover:bg-purple-50 cursor-pointer transition-all">
                      <Palette className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Muster hochladen</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handlePatternUpload} />
                    </label>
                    {patternImage && (
                      <div className="flex items-center gap-2">
                        <img src={patternImage} alt="Muster" className="w-12 h-12 object-cover rounded border" />
                        {extractingColors && <Loader2 className="w-4 h-4 animate-spin text-purple-500" />}
                        {patternColors.length > 0 && <Switch checked={usePattern} onCheckedChange={setUsePattern} />}
                      </div>
                    )}
                  </div>
                  {/* Farb-Picker pro extrahierte Farbe */}
                  {patternColors.length > 0 && usePattern && (
                    <div className="bg-white rounded-lg border p-3 space-y-2">
                      <p className="text-xs font-medium text-gray-600">Farben im Muster (klicken zum Ändern):</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {patternColors.map((color, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 rounded border bg-gray-50">
                            <div className="w-6 h-6 rounded border" style={{ backgroundColor: color.hex }} title={`Original: ${color.hex}`} />
                            <span className="text-xs text-gray-400">→</span>
                            <input
                              type="color"
                              value={color.replacementHex}
                              onChange={(e) => {
                                setPatternColors(prev => prev.map((c, i) => i === idx ? { ...c, replacementHex: e.target.value } : c));
                              }}
                              className="w-6 h-6 rounded cursor-pointer border-0"
                            />
                            <span className="text-[10px] text-gray-500">{color.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* ═══ SPONSOREN ═══ */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold uppercase text-gray-500">Sponsoren</Label>
                  <p className="text-xs text-muted-foreground">Sponsorenlogos für das Trikot-Design. Verpflichtende Sponsoren sind automatisch aktiviert.</p>
                  
                  {sponsorLogos.length > 0 ? (
                    <div className="space-y-2">
                      {sponsorLogos.map((sponsor) => (
                        <div key={sponsor.id} className={`p-2 bg-white rounded border ${sponsor.enabled ? 'border-blue-200' : 'border-gray-200 opacity-60'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <img 
                                src={storageUrl(sponsor.imageUrl) || sponsor.imageUrl} 
                                alt={sponsor.name} 
                                className="w-8 h-8 object-contain rounded border bg-gray-50" 
                              />
                              <div className="min-w-0">
                                <span className="text-xs font-medium truncate block">{sponsor.name}</span>
                                <span className="text-[10px] text-muted-foreground capitalize">{sponsor.type.replace('sponsor', '')}</span>
                              </div>
                            </div>
                            <Switch 
                              checked={sponsor.enabled} 
                              onCheckedChange={(checked) => {
                                setSponsorLogos(prev => prev.map(s => s.id === sponsor.id ? { ...s, enabled: checked } : s));
                              }}
                            />
                          </div>
                          {sponsor.enabled && (
                            <div className="mt-2 pl-10">
                              <select
                                className="text-xs border rounded px-2 py-1 w-full bg-gray-50"
                                value={sponsorPositions[sponsor.id] || "chest"}
                                onChange={(e) => setSponsorPositions(prev => ({ ...prev, [sponsor.id]: e.target.value }))}
                              >
                                <option value="chest">Brust (vorne, mittig)</option>
                                <option value="back">Rücken (unten)</option>
                                <option value="sleeve_left">Linker Ärmel</option>
                                <option value="sleeve_right">Rechter Ärmel</option>
                                <option value="side_left">Linke Seite</option>
                                <option value="side_right">Rechte Seite</option>
                                <option value="collar">Kragen</option>
                              </select>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Keine Sponsoren im Verein hinterlegt. Sponsoren können in der Verwaltung angelegt werden.</p>
                  )}

                  {/* Neuen Sponsor hochladen */}
                  <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all w-fit">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Sponsor-Logo hochladen</span>
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingSponsor(true);
                      try {
                        const reader = new FileReader();
                        reader.onload = async () => {
                          const dataUrl = reader.result as string;
                          const base64 = dataUrl.split(',')[1];
                          const name = file.name.replace(/\.[^.]+$/, '');
                          // Upload ans Backend
                          const res = await fetch('/api/upload', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              data: base64,
                              fileName: `sponsor_${Date.now()}_${file.name}`,
                              contentType: file.type,
                            }),
                          });
                          if (!res.ok) throw new Error('Upload fehlgeschlagen');
                          const { url } = await res.json();
                          setSponsorLogos(prev => [...prev, {
                            id: `custom_${Date.now()}`,
                            name,
                            imageUrl: url,
                            type: "mannschaftssponsor",
                            enabled: true,
                          }]);
                          toast.success(`Sponsor "${name}" hinzugefügt`);
                        };
                        reader.readAsDataURL(file);
                      } catch (err: any) {
                        toast.error(err.message || 'Sponsor-Upload fehlgeschlagen');
                      } finally {
                        setUploadingSponsor(false);
                      }
                    }} />
                    {uploadingSponsor && <Loader2 className="w-4 h-4 animate-spin" />}
                  </label>
                </div>

                {/* ═══ STRASSENKARTE ALS WASSERZEICHEN ═══ */}
                {orgData?.street && orgData?.city && (
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold uppercase text-gray-500">Straßenkarte (optional)</Label>
                    <p className="text-xs text-muted-foreground">Straßenkarte von: <strong>{orgData.street}, {orgData.zip} {orgData.city}</strong></p>
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={generateMapImage}
                        disabled={loadingMap}
                      >
                        {loadingMap ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <MapPin className="w-4 h-4 mr-1" />}
                        Karte generieren
                      </Button>
                      {mapImageUrl && (
                        <div className="flex items-center gap-3">
                          <img src={mapImageUrl} alt="Straßenkarte" className="w-16 h-16 object-cover rounded border" />
                          <Switch checked={useMapWatermark} onCheckedChange={setUseMapWatermark} />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ═══ STRASSENKARTE-DECKUNG ═══ */}
                {useMapWatermark && (
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold uppercase text-gray-500">Karten-Deckung: {watermarkOpacity}%</Label>
                    <p className="text-xs text-muted-foreground">Wie stark soll die Straßenkarte sichtbar sein?</p>
                    <Slider
                      value={[watermarkOpacity]}
                      onValueChange={(v) => setWatermarkOpacity(v[0])}
                      min={5}
                      max={50}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400">
                      <span>5% (kaum sichtbar)</span>
                      <span>50% (deutlich)</span>
                    </div>
                  </div>
                )}

                {/* Vereinsname */}
                <div className="space-y-2">
                  <Label>Vereinsname (optional)</Label>
                  <Input
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    placeholder="z.B. FC Musterstadt"
                  />
                </div>

                {/* Zusätzliche Hinweise */}
                <div className="space-y-2">
                  <Label>Zusätzliche Wünsche (optional)</Label>
                  <Textarea
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="z.B. Diagonale Streifen, V-Ausschnitt, Raglan-Ärmel..."
                    rows={3}
                  />
                </div>

                {/* Verbandsregeln-Info */}
                {rules && (
                  <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
                    <h4 className="text-sm font-semibold text-purple-800 mb-2">Verbandsregeln ({SPORT_TYPES.find(s => s.id === selectedSport)?.name})</h4>
                    <ul className="text-xs text-purple-700 space-y-1">
                      {rules.number.backMinHeight > 0 && <li>• Rückennummer: mind. {rules.number.backMinHeight}cm Höhe</li>}
                      {rules.number.frontMinHeight && <li>• Brustnummer: mind. {rules.number.frontMinHeight}cm Höhe</li>}
                      {rules.sponsor.maxSponsorsTotal && <li>• Max. {rules.sponsor.maxSponsorsTotal} Sponsoren</li>}
                      {rules.emblem.heartSideRequired && <li>• Vereinswappen: Herzseite (Pflicht)</li>}
                      {rules.emblem.chestMaxAreaCm2 && <li>• Wappen max. {rules.emblem.chestMaxAreaCm2}cm² Fläche</li>}
                    </ul>
                  </div>
                )}

                {/* Generieren-Button */}
                <Button
                  size="lg"
                  onClick={handleGenerate}
                  disabled={generating || !selectedSport}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {generating ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Design wird generiert...</>
                  ) : (
                    <><Wand2 className="w-4 h-4 mr-2" />Trikot-Design generieren</>
                  )}
                </Button>
              </div>
            ) : (
              /* Generiertes Bild mit Zonen */
              <div className="bg-white rounded-xl border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Generiertes Design</Label>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setStep("configure")}>
                      <ChevronLeft className="w-3 h-3 mr-1" />
                      Zurück zur Konfiguration
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setGeneratedImageUrl(null); setZones([]); setStep("configure"); }}>
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Komplett neu
                    </Button>
                    {step === "generate" && (
                      <Button size="sm" variant="outline" onClick={handleAnalyzeGenerated} disabled={generating}>
                        {generating ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                        Zonen erkennen
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => { setStep("edit"); setAddingZone(true); }}>
                      <Plus className="w-3 h-3 mr-1" />
                      Zone manuell
                    </Button>
                  </div>
                </div>

                {/* Canvas mit Bild und Zonen */}
                <div
                  ref={canvasRef}
                  className="relative border rounded-lg overflow-hidden select-none bg-gray-100"
                  style={{ touchAction: (draggingZone || resizingZone) ? 'none' : 'auto' }}
                >
                  <img
                    src={displayImage || ""}
                    alt="Generiertes Trikot-Design"
                    className="w-full h-auto"
                    draggable={false}
                  />
                  {/* Zonen-Overlays */}
                  {zones.filter(z => z.enabled !== false).map((zone) => {
                    const isSelected = selectedZoneId === zone.id;
                    const purposeColors: Record<string, string> = {
                      logo: "border-blue-500 bg-blue-500/20",
                      playerName: "border-green-500 bg-green-500/20",
                      playerNumber: "border-red-500 bg-red-500/20",
                      clubName: "border-purple-500 bg-purple-500/20",
                      sponsor: "border-yellow-500 bg-yellow-500/20",
                      abbreviation: "border-pink-500 bg-pink-500/20",
                      coordinates: "border-teal-500 bg-teal-500/20",
                      hashtag: "border-indigo-500 bg-indigo-500/20",
                      custom: "border-gray-500 bg-gray-500/20",
                    };
                    return (
                      <div
                        key={zone.id}
                        data-zone-id={zone.id}
                        className={`absolute border-2 ${purposeColors[zone.purpose] || "border-gray-400 bg-gray-400/20"} ${isSelected ? "ring-2 ring-offset-1 ring-purple-400" : ""} cursor-move rounded-sm`}
                        style={{ left: `${zone.x}%`, top: `${zone.y}%`, width: `${zone.width}%`, height: `${zone.height}%` }}
                        onPointerDown={(e) => handleZonePointerDown(e, zone.id)}
                      >
                        <span className="absolute -top-5 left-0 text-[10px] font-medium bg-white/90 px-1 rounded truncate max-w-full">
                          {zone.name}
                        </span>
                        <div
                          className="absolute bottom-0 right-0 w-3 h-3 bg-white border border-gray-400 cursor-se-resize rounded-sm"
                          onPointerDown={(e) => { e.stopPropagation(); handleZonePointerDown(e, zone.id, true); }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* ═══ ÄNDERUNGEN AM DESIGN ═══ */}
                {generatedImageUrl && (
                  <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200 space-y-2">
                    <span className="text-sm text-amber-800 font-semibold">Änderungen gewünscht?</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="z.B. Muster ändern, Farbe anpassen, Logo größer..."
                        className="flex-1 text-xs border border-amber-300 rounded px-2 py-1.5 bg-white placeholder:text-amber-400"
                        onKeyDown={(e) => { if (e.key === "Enter" && editDescription.trim()) handleEditDesign(); }}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-amber-500 text-amber-700 hover:bg-amber-100 text-xs"
                        onClick={handleEditDesign}
                        disabled={isEditing || !editDescription.trim()}
                      >
                        {isEditing ? (
                          <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Ändere...</>
                        ) : (
                          "Anpassen"
                        )}
                      </Button>
                    </div>
                    <p className="text-[10px] text-amber-600">Beschreibe was geändert werden soll. Das aktuelle Design wird als Basis verwendet.</p>
                  </div>
                )}

                {/* ═══ GEFÄLLT MIR + HOSEN-UPSELLING ═══ */}
                {generatedImageUrl && !matchingShortsUrl && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200 space-y-3">
                    <span className="text-sm text-green-800 font-semibold">Passende Hose generieren?</span>
                    
                    {/* Hosen-Optionen */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-green-700">Nummer übernehmen</span>
                        <Switch checked={shortsIncludeNumber} onCheckedChange={setShortsIncludeNumber} />
                      </div>
                      {defaultLogo?.imageUrl && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-green-700">Vereinswappen übernehmen</span>
                          <Switch checked={shortsIncludeCrest} onCheckedChange={setShortsIncludeCrest} />
                        </div>
                      )}
                      {sponsorLogos.filter(s => s.enabled && s.imageUrl).length > 0 && (
                        <div className="space-y-2">
                          <span className="text-xs text-green-700 font-medium">Sponsoren auf Hose:</span>
                          {sponsorLogos.filter(s => s.enabled && s.imageUrl).map(s => (
                            <div key={s.id} className="space-y-1 p-2 bg-white rounded border border-green-100">
                              <label className="flex items-center gap-2 text-xs cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={shortsSponsorIds.includes(s.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setShortsSponsorIds(prev => [...prev, s.id]);
                                    } else {
                                      setShortsSponsorIds(prev => prev.filter(id => id !== s.id));
                                    }
                                  }}
                                  className="rounded border-green-400"
                                />
                                <img src={storageUrl(s.imageUrl) || s.imageUrl} alt={s.name} className="w-5 h-5 object-contain" />
                                <span className="text-green-800">{s.name}</span>
                              </label>
                              {shortsSponsorIds.includes(s.id) && (
                                <div className="ml-6 flex gap-2 flex-wrap">
                                  <select
                                    value={shortsSponsorPlacements[s.id] || "front"}
                                    onChange={(e) => setShortsSponsorPlacements(prev => ({ ...prev, [s.id]: e.target.value as "front" | "back" }))}
                                    className="text-[10px] px-2 py-1 rounded border border-green-300 bg-green-50"
                                  >
                                    <option value="front">Vorne</option>
                                    <option value="back">Hinten</option>
                                  </select>
                                  <select
                                    value={shortsSponsorSizes[s.id] || "medium"}
                                    onChange={(e) => setShortsSponsorSizes(prev => ({ ...prev, [s.id]: e.target.value as "small" | "medium" | "large" }))}
                                    className="text-[10px] px-2 py-1 rounded border border-green-300 bg-green-50"
                                  >
                                    <option value="small">Klein (5cm)</option>
                                    <option value="medium">Mittel (8cm)</option>
                                    <option value="large">Groß (12cm)</option>
                                  </select>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="border-green-500 text-green-700 hover:bg-green-100 w-full"
                      onClick={generateMatchingShorts}
                      disabled={generatingShorts}
                    >
                      {generatingShorts ? (
                        <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Hose wird generiert...</>
                      ) : (
                        <><ThumbsUp className="w-3 h-3 mr-1" />Passende Hose generieren</>
                      )}
                    </Button>
                  </div>
                )}

                {/* Generierte Hose anzeigen */}
                {matchingShortsUrl && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-blue-800">Passende Hose (Vorschlag)</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => setMatchingShortsUrl(null)}
                      >
                        Ausblenden
                      </Button>
                    </div>
                    <img
                      src={storageUrl(matchingShortsUrl) || matchingShortsUrl}
                      alt="Passende Hose"
                      className="w-full max-w-[300px] mx-auto rounded-lg border bg-white"
                    />
                  </div>
                )}
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
                  placeholder="z.B. KI-Design Heimtrikot 2025"
                />
              </div>
              <div className="space-y-2">
                <Label>Sportart *</Label>
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

            {/* ═══ ZONEN-LISTE MIT TOGGLE ═══ */}
            {zones.length > 0 && (
              <div className="bg-white rounded-xl border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm uppercase text-gray-500">Zonen ({zones.filter(z => z.enabled !== false).length}/{zones.length})</h3>
                  <Button size="sm" variant="outline" onClick={() => setAddingZone(true)}>
                    <Plus className="w-3 h-3 mr-1" />
                    Zone
                  </Button>
                </div>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {zones.map((zone) => (
                    <div
                      key={zone.id}
                      className={`flex items-center justify-between p-2 rounded text-sm cursor-pointer hover:bg-gray-50 ${selectedZoneId === zone.id ? "bg-purple-50 border border-purple-200" : ""} ${zone.enabled === false ? "opacity-50" : ""}`}
                      onClick={() => setSelectedZoneId(zone.id)}
                    >
                      <div className="flex items-center gap-2">
                        {/* Toggle pro Zone */}
                        <Switch
                          checked={zone.enabled !== false}
                          onCheckedChange={(checked) => setZones(prev => prev.map(z => z.id === zone.id ? { ...z, enabled: checked } : z))}
                          className="scale-75"
                        />
                        <div className={`w-2 h-2 rounded-full ${
                          zone.purpose === "logo" ? "bg-blue-500" :
                          zone.purpose === "playerNumber" ? "bg-red-500" :
                          zone.purpose === "playerName" ? "bg-green-500" :
                          zone.purpose === "clubName" ? "bg-purple-500" :
                          zone.purpose === "sponsor" ? "bg-yellow-500" :
                          zone.purpose === "coordinates" ? "bg-teal-500" :
                          zone.purpose === "hashtag" ? "bg-indigo-500" :
                          "bg-gray-500"
                        }`} />
                        <span className="truncate text-xs">{zone.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-gray-400">{Math.round(zone.x)},{Math.round(zone.y)}</span>
                        <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={(e) => { e.stopPropagation(); setZones(zones.filter(z => z.id !== zone.id)); }}>
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* KI-Design-Info */}
            <div className="bg-purple-50 rounded-xl border border-purple-200 p-4">
              <h3 className="font-semibold text-sm text-purple-800 mb-2">KI-Design</h3>
              <ul className="text-xs text-purple-700 space-y-1">
                <li>• Komplett neues Trikot-Design per KI</li>
                <li>• Verbandsregeln werden automatisch beachtet</li>
                <li>• Vereinsdaten (Wappen, Farben, Schrift) optional</li>
                <li>• Wahrzeichen als Wasserzeichen-Element</li>
                <li>• Muster-Upload mit Farb-Anpassung</li>
                <li>• Sublimation: Kragen & Bündchen bedruckbar</li>
                <li>• Zonen einzeln ein-/ausschaltbar</li>
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

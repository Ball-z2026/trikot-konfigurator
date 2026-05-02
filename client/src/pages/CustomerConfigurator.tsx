import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  LayoutGrid,
  Shield,
  Type,
  Droplets,
  Palette,
  Lock,
  Save,
  FolderOpen,
  MoreVertical,
  Pencil,
  GripVertical,
  Move,
  ToggleLeft,
  ToggleRight,
  X,
  Sparkles,
  Ruler,
} from "lucide-react";
import { TEXTIL_TEMPLATES } from "@shared/templates";
import { getNumberRules, getJerseyRules, validateZonesAgainstRules, BUNDESLAENDER, type NumberRule, type JerseyRuleSet, type ValidationWarning, type ZoneForValidation, type SportartCode } from "@shared/jerseyRules";
import { useState, useRef, useCallback, useEffect, useMemo, Suspense, lazy } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { AlertTriangle, Info } from "lucide-react";
import { CmykColorPicker } from "@/components/CmykColorPicker";
import { formatCmyk, hexToCmyk } from "@/lib/cmyk";
import { storageUrl } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useMobile";

const AiMockupView = lazy(() => import("@/components/AiMockupView"));

// ─── Google Fonts for sport typography ────────────────────────────────────
const FONT_OPTIONS = [
  { value: "Inter", label: "Inter" },
  { value: "Oswald", label: "Oswald" },
  { value: "Bebas Neue", label: "Bebas Neue" },
  { value: "Anton", label: "Anton" },
  { value: "Teko", label: "Teko" },
  { value: "Russo One", label: "Russo One" },
  { value: "Black Ops One", label: "Black Ops One" },
  { value: "Orbitron", label: "Orbitron" },
  { value: "Rajdhani", label: "Rajdhani" },
  { value: "Saira Condensed", label: "Saira Condensed" },
];

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
  purpose: "logo" | "clubLogo" | "playerName" | "playerNumber" | "playerInitials" | "clubName" | "custom" | "abbreviation";
  posX: number;
  posY: number;
  width: number;
  height: number;
  rotation: number;
  widthCm: number | null;
  heightCm: number | null;
  fontFamily: string | null;
  fontSize: number | null;
  fontColor: string | null;
  fontWeight: string | null;
  textAlign: string | null;
  sortOrder: number;
};

type ZoneContent = {
  zoneId: number;
  imageDataUrl?: string;
  imageUrl?: string;
  text?: string;
  fontSize?: number;
  fontColor?: string;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: string;
};

type Player = {
  number: string;
  name: string;
  size?: string;
};

const PURPOSE_ICONS: Record<string, typeof FileImage> = {
  logo: FileImage,
  clubLogo: Shield,
  playerName: User,
  playerNumber: Hash,
  playerInitials: Type,
  abbreviation: Type,
  clubName: Shield,
  custom: PenTool,
};

const PURPOSE_LABELS: Record<string, string> = {
  logo: "Logo",
  clubLogo: "Vereinswappen",
  playerName: "Spielername",
  playerNumber: "Nummer",
  playerInitials: "Kürzel",
  abbreviation: "Kürzel (8x8cm)",
  clubName: "Vereinsname",
  custom: "Freitext",
};

// Load Google Fonts dynamically
function useGoogleFonts(zones: ZoneData[]) {
  useEffect(() => {
    const families = new Set<string>();
    for (const z of zones) {
      if (z.fontFamily && z.fontFamily !== "Inter") families.add(z.fontFamily);
    }
    if (families.size === 0) return;

    const existing = document.getElementById("konfig-google-fonts");
    if (existing) existing.remove();

    const link = document.createElement("link");
    link.id = "konfig-google-fonts";
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?${[...families]
      .map((f) => `family=${f.replace(/ /g, "+")}:wght@400;700;900`)
      .join("&")}&display=swap`;
    document.head.appendChild(link);
  }, [zones]);
}

const DEFAULT_JERSEY_COLOR = "#c8c8cc";
export default function CustomerConfigurator() {
  const { id } = useParams<{ id: string }>();
  const productId = parseInt(id || "0");

  // ─── Auth ────────────────────────────────────────────────────────────
  const { user, isAuthenticated } = useAuth();

  // Team-ID: Aus URL-Parameter oder Trainer-Mannschaftsauswahl
  const teamIdFromUrl = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("teamId") ? parseInt(params.get("teamId")!) : null;
  }, []);
  const [selectedTeamIdState, setSelectedTeamIdState] = useState<number | null>(null);
  // Lade alle Mannschaften des Trainers (wenn angemeldet)
  const { data: myTeams } = trpc.team.mine.useQuery(undefined, { enabled: isAuthenticated });
  // Effektives teamId: URL-Parameter hat Vorrang, dann manuelle Auswahl, dann erste Mannschaft
  const teamIdParam = useMemo(() => {
    if (teamIdFromUrl) return teamIdFromUrl;
    if (selectedTeamIdState) return selectedTeamIdState;
    if (myTeams && myTeams.length > 0) return myTeams[0].id;
    return null;
  }, [teamIdFromUrl, selectedTeamIdState, myTeams]);

  const { data: productData, isLoading } = trpc.product.getById.useQuery(
    { id: productId },
    { enabled: productId > 0 }
  );

  const [activePartId, setActivePartId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"parts" | "overview" | "ai-mockup">("parts");
  const [activeSide, setActiveSide] = useState<"front" | "back">("front");
  const [zoneContents, setZoneContents] = useState<Record<number, ZoneContent>>({});
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [clubName, setClubName] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamPlayersLoaded, setTeamPlayersLoaded] = useState(false);
  const [newPlayerNumber, setNewPlayerNumber] = useState("");
  const [newPlayerName, setNewPlayerName] = useState("");
  const [activePlayerIdx, setActivePlayerIdx] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [cachedMockupScreenshots, setCachedMockupScreenshots] = useState<{ front: string | null; back: string | null }>({ front: null, back: null });
  const [mockupSide, setMockupSide] = useState<"front" | "back">("front");

  // ─── Mockup-Galerie Mutation ──────────────────────────────────────────────────────────
  const saveMockupMutation = trpc.mockupGallery.save.useMutation({
    onSuccess: (result) => {
      toast.success("Mockup in Galerie gespeichert!");
      // Share-Link in Zwischenablage kopieren
      const shareUrl = `${window.location.origin}/mockup/${result.shareToken}`;
      navigator.clipboard.writeText(shareUrl).catch(() => {});
    },
    onError: () => toast.error("Speichern fehlgeschlagen"),
  });
  const saveMockupToGallery = (params: { mockupUrl: string; side: string; productId: number; teamId: number }) => {
    saveMockupMutation.mutate({
      teamId: params.teamId,
      productId: params.productId,
      imageUrl: params.mockupUrl,
      side: params.side as "front" | "back",
    });
  };

  // ─── Saved Designs State ─────────────────────────────────────────────────────────────
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [designName, setDesignName] = useState("");
  const [savingDesign, setSavingDesign] = useState(false);
  const [currentDesignId, setCurrentDesignId] = useState<number | null>(null);
  const [currentDesignName, setCurrentDesignName] = useState<string | null>(null);
  const [designCategory, setDesignCategory] = useState<"heimtrikot" | "auswaertstrikot" | "training" | "sonstiges">("sonstiges");
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicateSourceId, setDuplicateSourceId] = useState<number | null>(null);
  const [duplicateTargetTeamId, setDuplicateTargetTeamId] = useState<number | null>(null);
  const [duplicateName, setDuplicateName] = useState("");
  
  // ─── Saved Designs tRPC ─────────────────────────────────────────────────
  const { data: savedDesigns, refetch: refetchDesigns } = trpc.savedDesign.list.useQuery(
    { teamId: teamIdParam! },
    { enabled: !!teamIdParam }
  );
  const saveMutation = trpc.savedDesign.save.useMutation({
    onSuccess: (result) => {
      setCurrentDesignId(result.id);
      setCurrentDesignName(result.name);
      setSaveDialogOpen(false);
      setDesignName("");
      setSavingDesign(false);
      refetchDesigns();
      toast.success(`Design "${result.name}" gespeichert`);
    },
    onError: () => {
      setSavingDesign(false);
      toast.error("Speichern fehlgeschlagen");
    },
  });
  const updateMutation = trpc.savedDesign.update.useMutation({
    onSuccess: () => {
      setSavingDesign(false);
      refetchDesigns();
      toast.success("Design aktualisiert");
    },
    onError: () => {
      setSavingDesign(false);
      toast.error("Aktualisierung fehlgeschlagen");
    },
  });
  const deleteMutation = trpc.savedDesign.delete.useMutation({
    onSuccess: () => {
      refetchDesigns();
      toast.success("Design gelöscht");
    },
  });
  const duplicateMutation = trpc.savedDesign.duplicate.useMutation({
    onSuccess: () => {
      setDuplicateDialogOpen(false);
      refetchDesigns();
      toast.success("Design dupliziert");
    },
    onError: () => {
      toast.error("Duplizieren fehlgeschlagen");
    },
  });
  const [partColors, setPartColors] = useState<Record<number, string>>({});
  const [dtfBaseColor, setDtfBaseColor] = useState<string | null>(null);
  const [dtfBrandImage, setDtfBrandImage] = useState<string | null>(null);
  // processedImageUrl and processedPartImages removed - using CSS-based coloring instead

  // ─── Drag-and-Drop für Sponsor-Vorlagen ──────────────────────────────
  const [dragOverZoneId, setDragOverZoneId] = useState<number | null>(null);
  const dragSponsorRef = useRef<{ id: number; name: string; logoUrl: string } | null>(null);

  // ─── Auto-Zuweisung: Org-Logo & Abt.-Schrift ─────────────────────────
  const isMobile = useIsMobile();
  const { data: myMemberships } = trpc.membership.mine.useQuery(undefined, { enabled: isAuthenticated });
  // Org-/Abt.-Auswahl wenn User mehreren Orgs angehört
  const [selectedMembershipIdx, setSelectedMembershipIdx] = useState<number>(0);
  const primaryMembership = useMemo(() => myMemberships?.[selectedMembershipIdx] ?? myMemberships?.[0] ?? null, [myMemberships, selectedMembershipIdx]);
  const userOrgId = primaryMembership?.orgId ?? null;
  const userDeptId = primaryMembership?.departmentId ?? null;
  const userRole = primaryMembership?.role ?? null;
  const isTrainer = userRole === "trainer";
  const hasMultipleMemberships = (myMemberships?.length ?? 0) > 1;

  // Gesperrte Zonen: Vereinswappen und Vereinsname sind für Nicht-Owner nicht änderbar
  const isOwner = userRole === "owner";
  const isZoneLocked = useCallback((zone: ZoneData) => {
    // clubLogo (Vereinswappen) ist NUR vom Owner änderbar
    if (zone.purpose === "clubLogo") return !isOwner;
    // clubName ist für Trainer gesperrt
    if (zone.purpose === "clubName") return isTrainer;
    return false;
  }, [isOwner, isTrainer]);

  // Standard-Logo der Organisation laden
  const { data: orgDefaultLogo } = trpc.orgLogo.getDefault.useQuery(
    { orgId: userOrgId! },
    { enabled: !!userOrgId }
  );
  // Standard-Schrift der Abteilung laden
  const { data: deptDefaultFont } = trpc.deptFont.getDefault.useQuery(
    { departmentId: userDeptId! },
    { enabled: !!userDeptId }
  );

  const [autoLogoApplied, setAutoLogoApplied] = useState(false);
  const [autoFontApplied, setAutoFontApplied] = useState(false);

  // Organisation-Daten laden für Bundesland-Regeln
  const { data: orgData } = trpc.org.getById.useQuery(
    { id: userOrgId! },
    { enabled: !!userOrgId }
  );

  // Sponsor-Vorlagen laden
  const { data: sponsorTemplates } = trpc.sponsorTemplate.list.useQuery(
    { orgId: userOrgId! },
    { enabled: !!userOrgId }
  );

  // Sportart ermitteln: Primär aus dem Produkt-Template, Fallback auf orgData.sport
  const effectiveSport: SportartCode | null = useMemo(() => {
    // 1. Sportart aus dem Produkt-Template (am genauesten, da templateId sportartspezifisch ist)
    if (productData?.templateId) {
      const tmpl = TEXTIL_TEMPLATES.find((t) => t.id === productData.templateId);
      if (tmpl?.sport) return tmpl.sport as SportartCode;
    }
    // 2. Fallback: Sportart der Organisation
    if (orgData?.sport) return orgData.sport as SportartCode;
    return null;
  }, [productData?.templateId, orgData?.sport]);

  // Trikotnummern-Regeln basierend auf Sportart
  const numberRules: NumberRule | null = useMemo(() => {
    if (!effectiveSport) return null;
    return getNumberRules(effectiveSport, "amateur");
  }, [effectiveSport]);

  const orgStateName = useMemo(() => {
    if (!orgData?.state) return null;
    return BUNDESLAENDER.find(b => b.value === orgData.state)?.label || orgData.state;
  }, [orgData?.state]);

  // Vollständiges Regelwerk (Nummern + Sponsoren + Emblem + Spielername + Vereinsname)
  const fullRuleSet: JerseyRuleSet | null = useMemo(() => {
    if (!effectiveSport) return null;
    return getJerseyRules(effectiveSport, "amateur");
  }, [effectiveSport]);

  const canvasRef = useRef<HTMLDivElement>(null);
  const overviewRef = useRef<HTMLDivElement>(null);
  const parts: PartData[] = useMemo(() => (productData?.parts as PartData[]) || [], [productData?.parts]);
  const hasParts = parts.length > 0;
  const allZones: ZoneData[] = useMemo(() => (productData?.zones as ZoneData[]) || [], [productData?.zones]);

  // Live-Validierung der Zonen gegen Verbandsvorgaben
  const [validationWarnings, setValidationWarnings] = useState<ValidationWarning[]>([]);

  useEffect(() => {
    if (!fullRuleSet || !allZones.length) {
      setValidationWarnings([]);
      return;
    }
    // Zonen in das Validierungs-Format konvertieren
    const zonesForValidation: ZoneForValidation[] = allZones.map(z => {
      // Part-Name aus der Zone bestimmen
      const part = parts.find(p => p.id === z.partId);
      const partKey = part?.key || "front";
      return {
        purpose: z.purpose || "custom",
        widthCm: z.widthCm || undefined,
        heightCm: z.heightCm || undefined,
        part: partKey,
      };
    });
    const warnings = validateZonesAgainstRules(zonesForValidation, fullRuleSet);
    setValidationWarnings(warnings);
  }, [fullRuleSet, allZones, parts]);

  // Druckverfahren erkennen (auch alte templateIds und Part-Anzahl berücksichtigen)
  const isSublimation = useMemo(() => {
    if (!productData?.templateId) return false;
    const tmpl = TEXTIL_TEMPLATES.find((t) => t.id === productData.templateId);
    if (tmpl) return tmpl.printMethod === "sublimation";
    // Fallback: Wenn templateId nicht in TEXTIL_TEMPLATES gefunden wird,
    // prüfe ob es ein Sublimation-Produkt ist anhand der Part-Keys
    const partKeys = parts.map((p) => p.key);
    const hasSublimationParts = partKeys.includes("kragen") || partKeys.includes("buendchen_links");
    if (hasSublimationParts) return true;
    // Wenn 5+ Parts vorhanden sind, ist es wahrscheinlich Sublimation
    if (parts.length >= 5) return true;
    return false;
  }, [productData?.templateId, parts]);

  const isDtf = useMemo(() => {
    if (!productData?.templateId) return false;
    const tmpl = TEXTIL_TEMPLATES.find((t) => t.id === productData.templateId);
    if (tmpl) return tmpl.printMethod === "dtf";
    // Fallback: Wenn templateId nicht in TEXTIL_TEMPLATES gefunden wird,
    // und es kein Sublimation ist, prüfe ob es DTF sein könnte
    const partKeys = parts.map((p) => p.key);
    const hasSublimationParts = partKeys.includes("kragen") || partKeys.includes("buendchen_links");
    if (!hasSublimationParts && parts.length > 0 && parts.length <= 4) return true;
    return false;
  }, [productData?.templateId, parts]);

  // ─── Erkennung ob Produktbilder Transparenz haben (für Farb-Overlay) ───
  // Transparenz-Erkennung: Nur SVG-basierte Bilder sind transparent.
  // Alle PNG-Bilder (Trikots, Hoodies, T-Shirts, Jacken, etc.) haben weiße Hintergründe
  // und benötigen den multiply-Overlay statt CSS-Mask.
  const hasTransparentImages = useMemo(() => {
    // SVG-Templates erkennen (aus TEXTIL_TEMPLATES)
    const tmpl = productData?.templateId ? TEXTIL_TEMPLATES.find((t) => t.id === productData.templateId) : null;
    if (tmpl?.parts?.[0]?.imageUrl?.includes('.svg')) return true;
    // Prüfe ob die Part-Bilder SVGs sind (aus DB)
    if (parts.length > 0 && parts[0]?.imageUrl?.includes('.svg')) return true;
    // Alle anderen (PNG) sind nicht transparent
    return false;
  }, [productData?.templateId, parts]);

  // ─── Free Zone Mode erkennen (Bekleidung: Trainer definiert Zonen selbst) ───
  const isFreeZoneMode = useMemo(() => {
    if (!productData?.templateId) return (productData as any)?.freeZoneMode ?? false;
    const tmpl = TEXTIL_TEMPLATES.find((t) => t.id === productData.templateId);
    return tmpl?.freeZoneMode ?? (productData as any)?.freeZoneMode ?? false;
  }, [productData?.templateId, (productData as any)?.freeZoneMode]);

  // ─── Free Zone: Drag & Resize State ───
  const [draggingZone, setDraggingZone] = useState<number | null>(null);
  const [resizingZone, setResizingZone] = useState<number | null>(null);
  const [localZones, setLocalZones] = useState<ZoneData[]>([]);
  const [dragStart, setDragStart] = useState<{
    x: number; y: number; zoneX: number; zoneY: number; zoneW: number; zoneH: number;
  } | null>(null);
  const rafRef = useRef<number | null>(null);
  // Refs für sofortige Touch-Koordinaten (kein Re-Render nötig)
  const dragStateRef = useRef<{
    dragging: number | null;
    resizing: number | null;
    rotating: number | null;
    startX: number;
    startY: number;
    zoneX: number;
    zoneY: number;
    zoneW: number;
    zoneH: number;
    startAngle: number;
    startRotation: number;
  }>({ dragging: null, resizing: null, rotating: null, startX: 0, startY: 0, zoneX: 0, zoneY: 0, zoneW: 0, zoneH: 0, startAngle: 0, startRotation: 0 });

  // ─── Free Zone: Toggle-State für automatisierte Felder ───
  const [enabledAutoFields, setEnabledAutoFields] = useState<Record<string, boolean>>({
    playerName: false,
    playerNumber: false,
    playerInitials: false,
  });

  // Sync localZones mit allZones
  useEffect(() => {
    if (isFreeZoneMode && allZones.length > 0) {
      setLocalZones(allZones.map(z => ({ ...z })));
      // Prüfe welche Auto-Felder bereits als Zonen existieren
      const existing: Record<string, boolean> = {
        playerName: allZones.some(z => z.purpose === "playerName"),
        playerNumber: allZones.some(z => z.purpose === "playerNumber"),
        playerInitials: allZones.some(z => z.purpose === "playerInitials"),
      };
      setEnabledAutoFields(existing);
    }
  }, [isFreeZoneMode, allZones]);

  // ─── Free Zone: tRPC Mutations für Zone-Management (Trainer-Endpunkte) ───
  const utils = trpc.useUtils();
  const createZoneMut = trpc.zone.freeCreate.useMutation({
    onSuccess: () => utils.product.getById.invalidate({ id: productId }),
  });
  const deleteZoneMut = trpc.zone.freeDelete.useMutation({
    onSuccess: () => utils.product.getById.invalidate({ id: productId }),
  });
  const bulkUpdatePositions = trpc.zone.freeBulkUpdatePositions.useMutation({
    onSuccess: () => utils.product.getById.invalidate({ id: productId }),
  });
  const freeUpdateZoneMut = trpc.zone.freeUpdate.useMutation({
    onSuccess: () => utils.product.getById.invalidate({ id: productId }),
  });

  // ─── Free Zone: Drag & Resize Handlers ───
  const getRelativePosition = useCallback((e: { clientX: number; clientY: number } | React.MouseEvent | MouseEvent | React.TouchEvent | TouchEvent | React.PointerEvent | PointerEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    // PointerEvent und MouseEvent haben clientX/clientY direkt
    // TouchEvent braucht touches[0]
    let clientX: number, clientY: number;
    if ("touches" in e) {
      const touch = (e as TouchEvent).touches[0] || (e as TouchEvent).changedTouches?.[0];
      if (!touch) return { x: 0, y: 0 };
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    };
  }, []);

  const handleFreeZonePointerDown = useCallback(
    (e: React.PointerEvent, zoneId: number, isResize = false, isRotating = false) => {
      if (!isFreeZoneMode) return;
      e.preventDefault();
      e.stopPropagation();
      const zone = localZones.find((z) => z.id === zoneId);
      if (!zone) return;
      // Vereinswappen bei Trikots: Nur verschieben erlaubt, kein Resize/Rotation
      if (zone.purpose === "clubLogo" && productData?.category === 'Trikot' && (isResize || isRotating)) return;
      // Capture pointer for reliable tracking
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      // Haptic feedback on touch
      if (e.pointerType === "touch" && navigator.vibrate) {
        navigator.vibrate(15);
      }
      const pos = getRelativePosition(e);
      
      // Berechne Startwinkel für Rotation
      let startAngle = 0;
      if (isRotating) {
        const canvasEl = canvasRef.current;
        if (canvasEl) {
          const rect = canvasEl.getBoundingClientRect();
          const zoneCenterX = rect.left + (zone.posX + zone.width / 2) / 100 * rect.width;
          const zoneCenterY = rect.top + (zone.posY + zone.height / 2) / 100 * rect.height;
          startAngle = Math.atan2(e.clientY - zoneCenterY, e.clientX - zoneCenterX) * (180 / Math.PI);
        }
      }
      
      // Speichere in Ref für sofortigen Zugriff ohne Re-Render
      dragStateRef.current = {
        dragging: (!isResize && !isRotating) ? zoneId : null,
        resizing: isResize ? zoneId : null,
        rotating: isRotating ? zoneId : null,
        startX: pos.x,
        startY: pos.y,
        zoneX: zone.posX,
        zoneY: zone.posY,
        zoneW: zone.width,
        zoneH: zone.height,
        startAngle,
        startRotation: zone.rotation || 0,
      };
      setDragStart({ x: pos.x, y: pos.y, zoneX: zone.posX, zoneY: zone.posY, zoneW: zone.width, zoneH: zone.height });
      if (isResize) setResizingZone(zoneId);
      else if (isRotating) setDraggingZone(zoneId); // Reuse dragging state for visual feedback
      else setDraggingZone(zoneId);
      setSelectedZoneId(zoneId);
    },
    [isFreeZoneMode, localZones, getRelativePosition]
  );

  useEffect(() => {
    if (!isFreeZoneMode) return;
    const handlePointerMove = (e: PointerEvent) => {
      const ds = dragStateRef.current;
      if (ds.dragging === null && ds.resizing === null && ds.rotating === null) return;
      e.preventDefault();
      // Cache Koordinaten SOFORT (nicht in rAF) - PointerEvent ist stabil
      const canvasEl = canvasRef.current;
      if (!canvasEl) return;
      const rect = canvasEl.getBoundingClientRect();
      // Cache alle Event-Werte SOFORT (PointerEvent kann im rAF recycled sein)
      const clientX = e.clientX;
      const clientY = e.clientY;
      const posX = ((clientX - rect.left) / rect.width) * 100;
      const posY = ((clientY - rect.top) / rect.height) * 100;
      const dx = posX - ds.startX;
      const dy = posY - ds.startY;
      // Verwende requestAnimationFrame für flüssige Updates
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
                ? { ...z, width: Math.max(5, Math.min(100 - z.posX, ds.zoneW + dx)), height: Math.max(5, Math.min(100 - z.posY, ds.zoneH + dy)) }
                : z
            )
          );
        }
        if (ds.rotating !== null) {
          // Berechne Winkel relativ zum Zentrum der Zone (verwende gecachte clientX/Y)
          const zoneCenterX = rect.left + (ds.zoneX + ds.zoneW / 2) / 100 * rect.width;
          const zoneCenterY = rect.top + (ds.zoneY + ds.zoneH / 2) / 100 * rect.height;
          const currentAngle = Math.atan2(clientY - zoneCenterY, clientX - zoneCenterX) * (180 / Math.PI);
          const deltaAngle = currentAngle - ds.startAngle;
          // Snap auf 15°-Schritte wenn nahe
          let newRotation = ds.startRotation + deltaAngle;
          const snapAngle = Math.round(newRotation / 15) * 15;
          if (Math.abs(newRotation - snapAngle) < 3) newRotation = snapAngle;
          setLocalZones((prev) =>
            prev.map((z) =>
              z.id === ds.rotating
                ? { ...z, rotation: Math.round(newRotation) }
                : z
            )
          );
        }
      });
    };
    const handlePointerUp = () => {
      const ds = dragStateRef.current;
      if (ds.dragging !== null || ds.resizing !== null || ds.rotating !== null) {
        const changedZones = localZones
          .filter((z) => {
            const orig = allZones.find((oz) => oz.id === z.id);
            if (!orig) return false;
            return orig.posX !== z.posX || orig.posY !== z.posY || orig.width !== z.width || orig.height !== z.height || (orig.rotation || 0) !== (z.rotation || 0);
          })
          .map((z) => ({
            id: z.id,
            posX: Math.round(z.posX * 100) / 100,
            posY: Math.round(z.posY * 100) / 100,
            width: Math.round(z.width * 100) / 100,
            height: Math.round(z.height * 100) / 100,
            rotation: z.rotation || 0,
          }));
        if (changedZones.length > 0) bulkUpdatePositions.mutate({ productId, zones: changedZones });
      }
      dragStateRef.current = { dragging: null, resizing: null, rotating: null, startX: 0, startY: 0, zoneX: 0, zoneY: 0, zoneW: 0, zoneH: 0, startAngle: 0, startRotation: 0 };
      setDraggingZone(null);
      setResizingZone(null);
      setDragStart(null);
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    };
    // Verwende Pointer Events API - funktioniert zuverlässig auf iOS Safari
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
  }, [isFreeZoneMode, draggingZone, resizingZone, localZones, allZones, bulkUpdatePositions]);

  // ─── Free Zone: Toggle Auto-Felder (Spielername, Nummer, Kürzel) ───
  const handleToggleAutoField = useCallback(async (purpose: "playerName" | "playerNumber" | "playerInitials") => {
    if (!activePartId) return;
    const isEnabled = enabledAutoFields[purpose];
    if (isEnabled) {
      // Deaktivieren: Zone löschen
      const zone = allZones.find(z => z.purpose === purpose && z.partId === activePartId);
      if (zone) {
        deleteZoneMut.mutate({ id: zone.id, productId });
        setEnabledAutoFields(prev => ({ ...prev, [purpose]: false }));
      }
    } else {
      // Aktivieren: Neue Zone erstellen
      const labels: Record<string, string> = { playerName: "Spielername", playerNumber: "Nummer", playerInitials: "Kürzel" };
      const defaults: Record<string, { posX: number; posY: number; width: number; height: number }> = {
        playerName: { posX: 25, posY: 75, width: 50, height: 8 },
        playerNumber: { posX: 35, posY: 40, width: 30, height: 20 },
        playerInitials: { posX: 35, posY: 65, width: 30, height: 8 },
      };
      const d = defaults[purpose];
      createZoneMut.mutate({
        productId,
        partId: activePartId ?? undefined,
        label: labels[purpose],
        side: activeSide,
        type: "text",
        purpose,
        posX: d.posX,
        posY: d.posY,
        width: d.width,
        height: d.height,
        sortOrder: allZones.length + 1,
      });
      setEnabledAutoFields(prev => ({ ...prev, [purpose]: true }));
    }
  }, [activePartId, activeSide, enabledAutoFields, allZones, deleteZoneMut, createZoneMut, productId]);

  // ─── Free Zone: Custom-Zone hinzufügen ───
  const [addZoneDialogOpen, setAddZoneDialogOpen] = useState(false);
  const [newZoneLabel, setNewZoneLabel] = useState("");
  const [newZoneType, setNewZoneType] = useState<"text" | "image" | "both">("both");
  const [newZonePurpose, setNewZonePurpose] = useState<"custom" | "logo" | "clubLogo" | "playerName" | "playerNumber" | "playerInitials" | "abbreviation" | "clubName">("custom");

  // Zweck-Optionen für das Auswahlfeld
  const zonePurposeOptions = [
    { value: "custom" as const, label: "Benutzerdefiniert", defaultType: "both" as const },
    { value: "logo" as const, label: "Sponsor-Logo", defaultType: "image" as const },
    { value: "clubLogo" as const, label: "Vereinswappen", defaultType: "image" as const },
    { value: "playerName" as const, label: "Spielername", defaultType: "text" as const },
    { value: "playerNumber" as const, label: "Spielernummer", defaultType: "text" as const },
    { value: "playerInitials" as const, label: "Kürzel", defaultType: "text" as const },
    { value: "abbreviation" as const, label: "Kürzel (8x8cm)", defaultType: "image" as const },
    { value: "clubName" as const, label: "Vereinsname", defaultType: "text" as const },
  ];

  const handleAddCustomZone = useCallback(() => {
    if (!activePartId || !newZoneLabel.trim()) return;
    // Standard-Positionen basierend auf Zweck
    let posX = 30, posY = 30, width = 25, height = 15;
    if (newZonePurpose === "clubLogo") { posX = 10; posY = 15; width = 15; height = 20; }
    else if (newZonePurpose === "playerInitials") { posX = 10; posY = 75; width = 12; height = 12; }
    else if (newZonePurpose === "clubName") { posX = 20; posY = 10; width = 60; height = 10; }
    else if (newZonePurpose === "playerName") { posX = 20; posY = 15; width = 60; height = 10; }
    else if (newZonePurpose === "playerNumber") { posX = 30; posY = 30; width = 40; height = 30; }
    else if (newZonePurpose === "abbreviation") { posX = 5; posY = 75; width = 15; height = 15; }
    else if (newZonePurpose === "logo") { posX = 25; posY = 40; width = 50; height = 20; }
    
    createZoneMut.mutate({
      productId,
      partId: activePartId ?? undefined,
      label: newZoneLabel.trim(),
      side: activeSide,
      type: newZoneType,
      purpose: newZonePurpose,
      posX,
      posY,
      width,
      height,
      ...(newZonePurpose === "abbreviation" ? { widthCm: 8, heightCm: 8 } : {}),
      sortOrder: allZones.length + 1,
    });
    setNewZoneLabel("");
    setNewZonePurpose("custom");
    setAddZoneDialogOpen(false);
    toast.success(`Zone "${newZoneLabel.trim()}" hinzugefügt`);
  }, [activePartId, newZoneLabel, newZoneType, newZonePurpose, activeSide, createZoneMut, productId, allZones.length]);

  // ─── Free Zone: Zone löschen (nur nicht-clubLogo) ───
  const handleDeleteFreeZone = useCallback((zone: ZoneData) => {
    if (zone.purpose === "clubLogo") {
      toast.error("Das Vereinswappen kann nicht entfernt werden.");
      return;
    }
    deleteZoneMut.mutate({ id: zone.id, productId });
    if (selectedZoneId === zone.id) setSelectedZoneId(null);
    toast.success(`Zone "${zone.label}" entfernt`);
  }, [deleteZoneMut, selectedZoneId, productId]);

  const colorPalette: string[] = (productData as any)?.colorPalette || [];

  // Initialize partColors from defaultColor
  useEffect(() => {
    if (parts.length > 0 && Object.keys(partColors).length === 0) {
      const defaults: Record<number, string> = {};
      for (const part of parts) {
        if (part.defaultColor) {
          defaults[part.id] = part.defaultColor;
        }
      }
      if (Object.keys(defaults).length > 0) {
        setPartColors(defaults);
      }
    }
  }, [parts]);

  // Load Google Fonts used by zones
  useGoogleFonts(allZones);

   // Track previous auto-assigned values so we can overwrite on org switch
  const prevAutoLogoUrl = useRef<string | null>(null);
  const prevAutoFontFamily = useRef<string | null>(null);
  // ─── Auto-Zuweisung: Vereinsname aus Organisation setzen ───
  useEffect(() => {
    if (!primaryMembership?.orgName) return;
    setClubName(primaryMembership.orgName);
  }, [primaryMembership?.orgName]);

  // ─── Auto-Zuweisung: Org-Logo in alle Vereinswappen-Zonen (clubLogo) setzen ───
  useEffect(() => {
    if (autoLogoApplied || !orgDefaultLogo?.imageUrl || allZones.length === 0) return;
    const logoZones = allZones.filter((z) => z.purpose === "clubLogo");
    if (logoZones.length === 0) return;
    setZoneContents((prev) => {
      const updated = { ...prev };
      for (const zone of logoZones) {
        const current = updated[zone.id]?.imageDataUrl;
        // Überschreibe wenn leer ODER wenn es das vorherige auto-gesetzte Logo ist
        if (!current || current === prevAutoLogoUrl.current) {
          updated[zone.id] = {
            ...updated[zone.id],
            zoneId: zone.id,
            imageDataUrl: orgDefaultLogo.imageUrl,
          };
        }
      }
      return updated;
    });
    prevAutoLogoUrl.current = orgDefaultLogo.imageUrl;
    setAutoLogoApplied(true);
  }, [orgDefaultLogo, allZones, autoLogoApplied]);
  // ─── Auto-Zuweisung: Abt.-Schrift in alle Text-Zonen setzen ───
  useEffect(() => {
    if (autoFontApplied || !deptDefaultFont?.fontFamily || allZones.length === 0) return;
    const textZones = allZones.filter((z) => z.purpose !== "logo" && z.purpose !== "clubLogo");
    if (textZones.length === 0) return;
    setZoneContents((prev) => {
      const updated = { ...prev };
      for (const zone of textZones) {
        const current = updated[zone.id]?.fontFamily;
        // Überschreibe wenn leer ODER wenn es die vorherige auto-gesetzte Schrift ist
        if (!current || current === prevAutoFontFamily.current) {
          updated[zone.id] = {
            ...updated[zone.id],
            zoneId: zone.id,
            fontFamily: deptDefaultFont.fontFamily,
          };
        }
      }
      return updated;
    });
    prevAutoFontFamily.current = deptDefaultFont.fontFamily;
    setAutoFontApplied(true);
    if (deptDefaultFont.fontFamily !== "Inter") {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${deptDefaultFont.fontFamily.replace(/ /g, "+")}:wght@400;700;900&display=swap`;
      document.head.appendChild(link);
    }
  }, [deptDefaultFont, allZones, autoFontApplied]);

  // ─── Auto-Ladung: Spieler aus Team laden (wenn teamId-Parameter vorhanden) ───
  const { data: teamData } = trpc.team.getById.useQuery(
    { id: teamIdParam!, orgId: userOrgId! },
    { enabled: !!teamIdParam && !!userOrgId && !teamPlayersLoaded }
  );
  useEffect(() => {
    if (teamPlayersLoaded || !teamData?.players || teamData.players.length === 0) return;
    const loadedPlayers: Player[] = teamData.players.map((p: any) => ({
      number: p.number || "",
      name: p.name,
      size: p.size || undefined,
    }));
    setPlayers(loadedPlayers);
    setTeamPlayersLoaded(true);
    toast.success(`${loadedPlayers.length} Spieler aus "${teamData.name}" geladen`);
  }, [teamData, teamPlayersLoaded]);

  // Auto-select first parttt
  useEffect(() => {
    if (hasParts && activePartId === null && parts.length > 0) {
      const sorted = [...parts].sort((a, b) => a.sortOrder - b.sortOrder);
      setActivePartId(sorted[0].id);
    }
  }, [hasParts, parts, activePartId]);

  const activePart = parts.find((p) => p.id === activePartId);
  const sortedParts = useMemo(() => [...parts].sort((a, b) => a.sortOrder - b.sortOrder), [parts]);

  const rawCurrentImage = hasParts
    ? activePart?.imageUrl || null
    : activeSide === "front"
    ? productData?.frontImageUrl
    : productData?.backImageUrl;

   // Always process images to make jersey shape visible; use selected color or default light gray
  // DEFAULT_JERSEY_COLOR is defined outside the component
  const activeColor = isSublimation && activePartId && partColors[activePartId]
    ? partColors[activePartId]
    : isDtf && dtfBaseColor && !dtfBrandImage
    ? dtfBaseColor
    : DEFAULT_JERSEY_COLOR;
  // CSS-based coloring: no Canvas/CORS needed. The image is shown directly and
  // colored via a CSS overlay with mix-blend-mode.
  const currentImage = storageUrl(rawCurrentImage) || null;
  // activeColor is used as CSS overlay color in the rendering section below

  // Part colors for CSS overlay (no Canvas processing needed)
  const getPartColor = useCallback((partId: number) => {
    if (isSublimation && partColors[partId]) return partColors[partId];
    if (isDtf && dtfBaseColor && !dtfBrandImage) return dtfBaseColor;
    return DEFAULT_JERSEY_COLOR;
  }, [isSublimation, isDtf, dtfBaseColor, dtfBrandImage, partColors]);

  // Im freeZoneMode verwende localZones für Echtzeit-Drag-Updates
  const zonesSource = isFreeZoneMode ? localZones : allZones;
  const currentZones = hasParts
    ? zonesSource.filter((z) => z.partId === activePartId)
    : zonesSource.filter((z) => z.side === activeSide);

  // ─── Zone Content Management ───────────────────────────────────────────
  const updateZoneContent = useCallback((zoneId: number, updates: Partial<ZoneContent>) => {
    setZoneContents((prev) => ({ ...prev, [zoneId]: { ...prev[zoneId], zoneId, ...updates } }));
  }, []);

  // ─── Drag-and-Drop Handlers für Sponsor-Vorlagen ───────────────────
  const handleZoneDragOver = useCallback((e: React.DragEvent, zone: ZoneData) => {
    // Custom- und Logo-Zonen (Sponsor) akzeptieren Drops
    if (zone.purpose !== "custom" && zone.purpose !== "logo" || isZoneLocked(zone)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDragOverZoneId(zone.id);
  }, [isZoneLocked]);

  const handleZoneDragLeave = useCallback(() => {
    setDragOverZoneId(null);
  }, []);

  const handleZoneDrop = useCallback((e: React.DragEvent, zone: ZoneData) => {
    e.preventDefault();
    setDragOverZoneId(null);
    if (zone.purpose !== "custom" && zone.purpose !== "logo" || isZoneLocked(zone)) return;
    const sponsor = dragSponsorRef.current;
    if (!sponsor) return;
    if (sponsor.logoUrl) {
      updateZoneContent(zone.id, { imageUrl: sponsor.logoUrl, text: "" });
    } else {
      updateZoneContent(zone.id, { text: sponsor.name, imageUrl: "" });
    }
    toast.success(`Sponsor "${sponsor.name}" in "${zone.label}" eingesetzt`);
    dragSponsorRef.current = null;
  }, [isZoneLocked, updateZoneContent]);

  const handleImageUploadToZone = useCallback(
    (zoneId: number) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".pdf,image/*";
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        // Überdrucken- und Transparenz-Prüfung
        try {
          const { checkUploadFile } = await import("@/hooks/useUploadChecks");
          const checkResult = await checkUploadFile(file);
          for (const w of checkResult.warnings) {
            toast.warning(w.message, { duration: 10000 });
          }
        } catch { /* Bei Fehler fortfahren */ }

        // DPI-Prüfung (nur für Bilder, nicht für PDFs)
        const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
        const zone = allZones.find(z => z.id === zoneId);
        const widthCm = zone?.widthCm || null;
        const heightCm = zone?.heightCm || null;

        if (!isPdf) {
          try {
            const { checkImageDpi } = await import("@/hooks/useDpiCheck");
            // DPI-Prüfung: Wenn cm-Maße vorhanden, verwende diese; sonst Standard 10x10cm
            const result = await checkImageDpi(file, widthCm, heightCm);
            if (result.status === "warning") {
              toast.warning(result.message, { duration: 8000 });
            } else if (result.status === "ok") {
              toast.success(result.message);
            }
          } catch {
            // Bei Fehler trotzdem fortfahren
          }
        }

        const reader = new FileReader();
        reader.onload = () => {
          updateZoneContent(zoneId, { imageDataUrl: reader.result as string });
          toast.success("Datei platziert");
        };
        reader.readAsDataURL(file);
      };
      input.click();
    },
    [updateZoneContent, allZones]
  );

  // ─── Player Management ─────────────────────────────────────────────────
  const addPlayer = useCallback(() => {
    if (!newPlayerName.trim()) return;
    setPlayers((prev) => [
      ...prev,
      { number: newPlayerNumber.trim(), name: newPlayerName.trim().toUpperCase() },
    ]);
    setNewPlayerNumber("");
    setNewPlayerName("");
  }, [newPlayerNumber, newPlayerName]);

  const removePlayer = useCallback(
    (idx: number) => {
      setPlayers((prev) => prev.filter((_, i) => i !== idx));
      if (activePlayerIdx === idx) setActivePlayerIdx(null);
      else if (activePlayerIdx !== null && activePlayerIdx > idx)
        setActivePlayerIdx(activePlayerIdx - 1);
    },
    [activePlayerIdx]
  );

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
          const cols = line.split(/[,;\t]/).map((p) => p.trim());
          if (cols.length >= 2) {
            newPlayers.push({ number: cols[0], name: cols[1].toUpperCase() });
          } else if (cols.length === 1 && cols[0]) {
            newPlayers.push({ number: "", name: cols[0].toUpperCase() });
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

  const getEffectiveContent = useCallback(
    (zone: ZoneData): ZoneContent => {
      const content = zoneContents[zone.id] || { zoneId: zone.id };
      const purpose = zone.purpose || "custom";

      // Merge admin-defined font defaults
      const merged: ZoneContent = {
        ...content,
        fontFamily: content.fontFamily || zone.fontFamily || "Inter",
        fontSize: content.fontSize || zone.fontSize || 24,
        fontColor: content.fontColor || zone.fontColor || "#ffffff",
        fontWeight: content.fontWeight || zone.fontWeight || "700",
        textAlign: content.textAlign || zone.textAlign || "center",
      };

      if (purpose === "playerName" && activePlayer) {
        return { ...merged, text: activePlayer.name };
      }
      if (purpose === "playerNumber" && activePlayer) {
        return { ...merged, text: activePlayer.number };
      }
      if (purpose === "playerInitials" && activePlayer) {
        // Kürzel aus dem Spielernamen generieren (z.B. "Max Müller" -> "MM", "Hans-Peter Schmidt" -> "HS")
        const initials = activePlayer.name
          .split(/[\s-]+/)
          .map((part: string) => part.charAt(0).toUpperCase())
          .filter(Boolean)
          .slice(0, 3) // Max 3 Initialen
          .join("");
        return { ...merged, text: initials };
      }
      if (purpose === "clubName" && clubName) {
        return { ...merged, text: clubName };
      }

      return merged;
    },
    [activePlayer, clubName, zoneContents, allZones]
  );
  // ─── Render Zone Text (volle Feldhöhe) ─────────────────────────────────────────────────────────
  const renderZoneText = (content: ZoneContent, _scale = 1) => (
    <span
      className="text-center leading-none block w-full h-full flex items-center justify-center"
      style={{
        fontFamily: content.fontFamily || "Inter",
        fontSize: "100%",
        color: content.fontColor || "#ffffff",
        fontWeight: (content.fontWeight as any) || "700",
        textAlign: (content.textAlign as any) || "center",
        textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
        wordBreak: "break-word",
        lineHeight: 1,
        // SVG-basierte Skalierung: Text füllt die volle Höhe der Zone
        display: "flex",
        alignItems: "center",
        justifyContent: (content.textAlign as any) === "left" ? "flex-start" : (content.textAlign as any) === "right" ? "flex-end" : "center",
      }}
    >
      <svg viewBox={`0 0 ${(content.text?.length || 1) * 60} 100`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <text
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor={content.textAlign === "left" ? "start" : content.textAlign === "right" ? "end" : "middle"}
          fill={content.fontColor || "#ffffff"}
          fontFamily={content.fontFamily || "Inter"}
          fontWeight={(content.fontWeight as any) || "700"}
          fontSize="90"
          style={{ filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.5))" }}
        >
          {content.text}
        </text>
      </svg>
    </span>
  );
  // ─── Save/Load Design ──────────────────────────────────────────────────────
  // Thumbnail-Capture: Canvas als Base64-PNG
  const captureThumbnail = useCallback(async (): Promise<string | undefined> => {
    if (!canvasRef.current) return undefined;
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(canvasRef.current, { quality: 0.6, pixelRatio: 0.5, cacheBust: true, includeQueryParams: true });
      // Entferne den data:image/png;base64, Prefix
      return dataUrl.split(",")[1];
    } catch {
      return undefined;
    }
  }, []);

  const handleSaveDesign = useCallback(() => {
    if (!teamIdParam) {
      toast.error("Bitte wähle zuerst eine Mannschaft aus dem Dropdown oben");
      return;
    }
    if (currentDesignId) {
      // Bestehendes Design überschreiben
      setSavingDesign(true);
      captureThumbnail().then(thumbnailBase64 => {
        updateMutation.mutate({
          id: currentDesignId,
          zonesConfig: zoneContents,
          colorsConfig: { partColors, dtfBaseColor },
          thumbnailBase64,
        });
      });
    } else {
      // Neues Design - Dialog öffnen für Namen
      setSaveDialogOpen(true);
    }
  }, [teamIdParam, currentDesignId, zoneContents, partColors, dtfBaseColor, updateMutation, captureThumbnail]);

  const handleSaveAsNew = useCallback(async () => {
    if (!designName.trim()) {
      toast.error("Bitte einen Namen eingeben");
      return;
    }
    setSavingDesign(true);
    const thumbnailBase64 = await captureThumbnail();
    saveMutation.mutate({
      name: designName.trim(),
      teamId: teamIdParam!,
      productId,
      zonesConfig: zoneContents,
      colorsConfig: { partColors, dtfBaseColor },
      thumbnailBase64,
      category: designCategory,
    });
  }, [designName, teamIdParam, productId, zoneContents, partColors, dtfBaseColor, saveMutation, captureThumbnail, designCategory]);

  const handleLoadDesign = useCallback((design: any) => {
    // Zonen-Konfiguration laden
    if (design.zonesConfig) {
      setZoneContents(design.zonesConfig as Record<number, any>);
    }
    // Farben laden
    if (design.colorsConfig) {
      const colors = design.colorsConfig as any;
      if (colors.partColors) setPartColors(colors.partColors);
      if (colors.dtfBaseColor) setDtfBaseColor(colors.dtfBaseColor);
    }
    setCurrentDesignId(design.id);
    setCurrentDesignName(design.name);
    setLoadDialogOpen(false);
    toast.success(`Design "${design.name}" geladen`);
  }, []);

  // ─── Export ───────────────────────────────────────────────────────────────────────
  const waitForRepaint = useCallback(() => {
    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });
  }, []);

  const handleExportSingle = useCallback(async () => {
    if (!canvasRef.current) return;
    // Ensure we're in parts view for correct rendering (incl. DTF overlay)
    if (viewMode !== "parts") setViewMode("parts");
    setExporting(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(canvasRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "#e8eaed",
        cacheBust: true,
        includeQueryParams: true,
      });
      const link = document.createElement("a");
      const partLabel = hasParts && activePart ? activePart.label : activeSide;
      link.download = `${productData?.name || "textil"}_${partLabel}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Bild exportiert");
    } catch {
      toast.error("Export fehlgeschlagen");
    } finally {
      setExporting(false);
    }
  }, [hasParts, activePart, activeSide, productData, viewMode]);

  const handleExportBatch = useCallback(async () => {
    if (players.length === 0) {
      toast.error("Keine Spieler vorhanden");
      return;
    }
    setExporting(true);
    // Ensure we're in parts view for correct rendering (incl. DTF overlay)
    if (viewMode !== "parts") setViewMode("parts");
    await waitForRepaint();
    toast.info(`Batch-Export für ${players.length} Spieler wird vorbereitet...`);
    try {
      const JSZip = (await import("jszip")).default;
      const { toPng } = await import("html-to-image");
      const zip = new JSZip();
      let exported = 0;

      const exportTargets: { label: string; setView: () => void }[] = [];

      if (hasParts) {
        for (const part of sortedParts) {
          const partZones = allZones.filter((z) => z.partId === part.id);
          if (partZones.length > 0) {
            exportTargets.push({
              label: part.key,
              setView: () => setActivePartId(part.id),
            });
          }
        }
      } else {
        exportTargets.push(
          { label: "front", setView: () => setActiveSide("front") },
          { label: "back", setView: () => setActiveSide("back") }
        );
      }

      for (let i = 0; i < players.length; i++) {
        setActivePlayerIdx(i);
        await waitForRepaint();
        await new Promise((r) => setTimeout(r, 100));

        for (const target of exportTargets) {
          target.setView();
          await waitForRepaint();
          await new Promise((r) => setTimeout(r, 150));

          if (canvasRef.current) {
            try {
              const dataUrl = await toPng(canvasRef.current, {
                quality: 1,
                pixelRatio: 2,
                backgroundColor: "#e8eaed",
                cacheBust: true,
                includeQueryParams: true,
              });
              const base64 = dataUrl.split(",")[1];
              const safeName = players[i].name.replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, "_");
              zip.file(`${players[i].number || i + 1}_${safeName}_${target.label}.png`, base64, {
                base64: true,
              });
              exported++;
            } catch {
              console.warn(`Export fehlgeschlagen für Spieler ${i + 1} (${target.label})`);
            }
          }
        }
      }

      if (exported === 0) {
        toast.error("Kein Bild konnte exportiert werden");
        return;
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const { saveAs } = await import("file-saver");
      saveAs(blob, `${productData?.name || "textil"}_mannschaft.zip`);
      toast.success(`Batch-Export abgeschlossen (${exported} Bilder)`);
    } catch (err) {
      console.error("Batch-Export Fehler:", err);
      toast.error("Batch-Export fehlgeschlagen");
    } finally {
      setExporting(false);
      setActivePlayerIdx(null);
    }
  }, [players, productData, hasParts, sortedParts, allZones, waitForRepaint, viewMode]);

  // ─── Zone Colors ────────────────────────────────────────────────────────
  const zoneBorderColors = [
    "rgb(59, 130, 246)",
    "rgb(16, 185, 129)",
    "rgb(245, 158, 11)",
    "rgb(239, 68, 68)",
    "rgb(139, 92, 246)",
    "rgb(236, 72, 153)",
  ];

  // ─── Zone Overlay Component ─────────────────────────────────────────────
  const ZoneOverlay = ({
    zone,
    idx,
    scale = 1,
    interactive = true,
  }: {
    zone: ZoneData;
    idx: number;
    scale?: number;
    interactive?: boolean;
  }) => {
    const content = getEffectiveContent(zone);
    const colorIdx = idx % zoneBorderColors.length;
    const isSelected = interactive && selectedZoneId === zone.id;
    const isDragTarget = interactive && dragOverZoneId === zone.id;
    const isDroppable = interactive && (zone.purpose === "custom" || zone.purpose === "logo") && !isZoneLocked(zone);
    const purpose = zone.purpose || "custom";
    const PurposeIcon = PURPOSE_ICONS[purpose] || PenTool;
    const rotation = zone.rotation || 0;
    const isFreeZoneDraggable = isFreeZoneMode && interactive;
    const isBeingDragged = draggingZone === zone.id || resizingZone === zone.id;
    const canDelete = isFreeZoneMode && zone.purpose !== "clubLogo";

    return (
      <div
        className={`absolute flex items-center justify-center ${isBeingDragged ? "zone-dragging" : "transition-all duration-150"} ${isDragTarget ? "ring-2 ring-primary ring-offset-1 bg-primary/10" : ""}`}
        style={{
          left: `${zone.posX}%`,
          top: `${zone.posY}%`,
          width: `${zone.width}%`,
          height: `${zone.height}%`,
          zIndex: isBeingDragged ? 50 : isDragTarget ? 20 : isSelected ? 15 : 10,
          transform: isBeingDragged
            ? `${rotation !== 0 ? `rotate(${rotation}deg) ` : ""}scale(1.04)`
            : rotation !== 0 ? `rotate(${rotation}deg)` : undefined,
          opacity: isBeingDragged ? 0.92 : undefined,
          willChange: isBeingDragged ? "left, top, width, height, transform" : undefined,
          border: isBeingDragged
            ? `2px solid hsl(var(--primary))`
            : isFreeZoneDraggable
            ? `2px ${isSelected ? "solid" : "dashed"} ${zoneBorderColors[colorIdx]}`
            : isDragTarget
            ? "2px solid hsl(var(--primary))"
            : isSelected
            ? `2px solid ${zoneBorderColors[colorIdx]}`
            : content?.imageDataUrl || content?.imageUrl || content?.text
            ? "none"
            : `1px dashed ${zoneBorderColors[colorIdx]}40`,
          borderRadius: isBeingDragged ? "4px" : "2px",
          cursor: isFreeZoneDraggable ? (isBeingDragged ? "grabbing" : "grab") : interactive ? "pointer" : "default",
          overflow: "hidden",
          touchAction: (isFreeZoneDraggable && (draggingZone !== null || resizingZone !== null)) ? "none" : undefined,
          userSelect: isFreeZoneDraggable ? "none" : undefined,
          WebkitUserSelect: isFreeZoneDraggable ? "none" : undefined,
        }}
        onPointerDown={isFreeZoneDraggable ? (e) => handleFreeZonePointerDown(e, zone.id) : undefined}
        onClick={
          interactive
            ? (e) => {
                e.stopPropagation();
                setSelectedZoneId(zone.id);
              }
            : undefined
        }
        onDragOver={interactive && isDroppable ? (e) => handleZoneDragOver(e, zone) : undefined}
        onDragLeave={interactive && isDroppable ? handleZoneDragLeave : undefined}
        onDrop={interactive && isDroppable ? (e) => handleZoneDrop(e, zone) : undefined}
      >
        {(content?.imageDataUrl || content?.imageUrl) && (
          <img
            src={storageUrl(content.imageDataUrl || content.imageUrl || "") || content.imageDataUrl || content.imageUrl || ""}
            alt=""
            className={`w-full h-full ${zone.widthCm && zone.heightCm ? 'object-fill' : 'object-contain'}`}
            draggable={false}
            crossOrigin="anonymous"
          />
        )}
        {content?.text && !content?.imageDataUrl && !content?.imageUrl && renderZoneText(content, scale)}
        {!content?.imageDataUrl && !content?.imageUrl && !content?.text && (
          <div className="text-center opacity-40">
            <PurposeIcon
              className="mx-auto"
              style={{
                width: `${Math.max(10, 16 * scale)}px`,
                height: `${Math.max(10, 16 * scale)}px`,
              }}
            />
            <span
              className="block mt-0.5"
              style={{ fontSize: `${Math.max(7, 10 * scale)}px` }}
            >
              {zone.label}
            </span>
          </div>
        )}
        {/* freeZoneMode: Rotation-Handle (oben Mitte) - nicht für clubLogo bei Trikots */}
        {isFreeZoneDraggable && isSelected && !(zone.purpose === "clubLogo" && productData?.category === 'Trikot') && (
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full flex flex-col items-center"
            style={{ zIndex: 35, touchAction: 'none' }}
          >
            <div
              className="bg-primary rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing"
              style={{
                width: isMobile ? '24px' : '16px',
                height: isMobile ? '24px' : '16px',
                marginBottom: isMobile ? '4px' : '2px',
              }}
              onPointerDown={(e) => handleFreeZonePointerDown(e, zone.id, false, true)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className={isMobile ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5'}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                <polyline points="22 2 22 8 16 8" />
              </svg>
            </div>
          </div>
        )}
        {/* freeZoneMode: Resize-Handle (unten rechts) - nicht für clubLogo bei Trikots */}
        {isFreeZoneDraggable && isSelected && !(zone.purpose === "clubLogo" && productData?.category === 'Trikot') && (
          <div
            className="absolute bottom-0 right-0 bg-primary cursor-se-resize"
            style={{
              zIndex: 30,
              width: isMobile ? '20px' : '12px',
              height: isMobile ? '20px' : '12px',
              borderTopLeftRadius: isMobile ? '4px' : '2px',
              touchAction: 'none',
            }}
            onPointerDown={(e) => handleFreeZonePointerDown(e, zone.id, true)}
          >
            {/* Unsichtbarer erweiterter Touch-Bereich */}
            <div
              className="absolute"
              style={{
                top: isMobile ? '-12px' : '-6px',
                left: isMobile ? '-12px' : '-6px',
                right: '-2px',
                bottom: '-2px',
                touchAction: 'none',
              }}
              onPointerDown={(e) => handleFreeZonePointerDown(e, zone.id, true)}
            />
          </div>
        )}
        {/* Delete-Button wurde entfernt - Löschen nur über das Zonen-Panel unten */}
        {/* freeZoneMode: Label-Badge - größer auf Touch, pulsiert beim Drag */}
        {isFreeZoneDraggable && (
          <div
            className={`absolute top-0 left-0 text-white leading-tight truncate max-w-full ${isMobile ? 'px-1.5 py-0.5 text-[10px]' : 'px-1 text-[8px]'} ${isBeingDragged ? 'zone-dragging-label' : ''}`}
            style={{
              backgroundColor: isBeingDragged ? 'hsl(var(--primary))' : zoneBorderColors[colorIdx],
              zIndex: 25,
              pointerEvents: "none",
              fontWeight: isBeingDragged ? 600 : undefined,
            }}
          >
            {zone.label}
          </div>
        )}
      </div>
    );
  };

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
          <Link href="/">
            <Button variant="outline" className="mt-4">
              Zurück
            </Button>
          </Link>
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
            <Link href="/">
              <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 sm:h-9 sm:w-9">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-sm sm:text-lg font-bold truncate">{productData.name}</h1>
            {productData.category && (
              <Badge variant="secondary" className="hidden sm:inline-flex">
                {productData.category}
              </Badge>
            )}
            {/* Mannschafts-Dropdown: Zeige alle Teams des Trainers */}
            {myTeams && myTeams.length > 0 && (
              <Select
                value={teamIdParam?.toString() ?? ""}
                onValueChange={(val) => {
                  setSelectedTeamIdState(parseInt(val));
                  setTeamPlayersLoaded(false); // Spieler neu laden
                }}
              >
                <SelectTrigger className="h-7 sm:h-8 text-xs sm:text-sm w-auto max-w-[140px] sm:max-w-[180px]">
                  <Users className="w-3.5 h-3.5 mr-1 shrink-0" />
                  <SelectValue placeholder="Mannschaft" />
                </SelectTrigger>
                <SelectContent>
                  {myTeams.map((team) => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="flex gap-1.5 sm:gap-2 shrink-0">
            {/* Save/Load Buttons */}
            {teamIdParam && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 text-xs sm:text-sm">
                      <Save className="w-3.5 h-3.5 sm:mr-1.5" />
                      <span className="hidden sm:inline">{currentDesignName || "Speichern"}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {currentDesignId && (
                      <DropdownMenuItem onClick={handleSaveDesign}>
                        <Save className="w-4 h-4 mr-2" />
                        Speichern (überschreiben)
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => { setDesignName(""); setSaveDialogOpen(true); }}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Speichern unter...
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLoadDialogOpen(true)}>
                      <FolderOpen className="w-4 h-4 mr-2" />
                      Design laden
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs sm:text-sm"
              onClick={handleExportSingle}
              disabled={exporting}
            >
              {exporting ? (
                <Loader2 className="w-3.5 h-3.5 sm:mr-1.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 sm:mr-1.5" />
              )}
              <span className="hidden sm:inline">Exportieren</span>
            </Button>
            {players.length > 0 && (
              <Button
                size="sm"
                className="h-8 text-xs sm:text-sm"
                onClick={handleExportBatch}
                disabled={exporting}
              >
                {exporting ? (
                  <Loader2 className="w-3.5 h-3.5 sm:mr-1.5 animate-spin" />
                ) : (
                  <FileDown className="w-3.5 h-3.5 sm:mr-1.5" />
                )}
                <span className="hidden sm:inline">Alle exportieren ({players.length})</span>
                <span className="sm:hidden">{players.length}</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container py-4 sm:py-6 px-3 sm:px-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 sm:gap-6 items-start">
          {/* Left: Canvas */}
          <div className="space-y-3 lg:sticky lg:top-4">
            {/* Part Navigation */}
            {hasParts ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <LayoutGrid className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Teile</span>
                  {activePlayer && (
                    <Badge variant="outline" className="ml-auto text-xs">
                      <User className="w-3 h-3 mr-1" />
                      {activePlayer.number} {activePlayer.name}
                    </Badge>
                  )}
                </div>
                <ScrollArea className="w-full">
                  <div className="flex gap-2 pb-2">
                    {sortedParts.map((part) => {
                      const isActive = activePartId === part.id;
                      const partZones = allZones.filter((z) => z.partId === part.id);
                      return (
                        <button
                          key={part.id}
                          className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all min-w-[80px] sm:min-w-[100px] ${
                            isActive
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-transparent hover:border-muted-foreground/20 hover:bg-muted/50"
                          }`}
                          onClick={() => {
                            setActivePartId(part.id);
                            setSelectedZoneId(null);
                            setViewMode("parts");
                          }}
                        >
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded overflow-hidden relative"
                            style={{ backgroundColor: (!hasTransparentImages && getPartColor(part.id) !== "#ffffff" && getPartColor(part.id) !== "#FFFFFF" && !dtfBrandImage) ? getPartColor(part.id) : undefined }}
                          >
                            {part.imageUrl ? (
                              <>
                                <img
                                  src={storageUrl(part.imageUrl)}
                                  alt={part.label}
                                  className="w-full h-full object-contain relative"
                                  crossOrigin="anonymous"
                                />
                                {/* Farb-Overlay für transparente Bilder (SVG): CSS-Mask + multiply */}
                                {hasTransparentImages && getPartColor(part.id) !== "#ffffff" && getPartColor(part.id) !== "#FFFFFF" && !dtfBrandImage && (
                                  <div className="absolute inset-0 pointer-events-none" style={{
                                    backgroundColor: getPartColor(part.id),
                                    mixBlendMode: "multiply" as const,
                                    WebkitMaskImage: `url(${storageUrl(part.imageUrl)})`,
                                    WebkitMaskSize: "contain",
                                    WebkitMaskRepeat: "no-repeat",
                                    WebkitMaskPosition: "center",
                                    maskImage: `url(${storageUrl(part.imageUrl)})`,
                                    maskSize: "contain",
                                    maskRepeat: "no-repeat",
                                    maskPosition: "center",
                                  }} />
                                )}
                                {/* Farb-Overlay für nicht-transparente Bilder (PNG) */}
                                {!hasTransparentImages && getPartColor(part.id) !== "#ffffff" && getPartColor(part.id) !== "#FFFFFF" && !dtfBrandImage && (
                                  <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                      backgroundColor: getPartColor(part.id),
                                      mixBlendMode: "multiply" as const,
                                    }}
                                  />
                                )}
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Image className="w-4 h-4 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] sm:text-xs font-medium text-center leading-tight">
                            {part.label}
                          </span>
                          {partZones.length > 0 && (
                            <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                              {partZones.length} {partZones.length === 1 ? "Zone" : "Zonen"}
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant={activeSide === "front" && viewMode !== "ai-mockup" ? "default" : "outline"}
                  size="sm"
                  className="h-8"
                  onClick={() => { setActiveSide("front"); setViewMode("parts"); }}
                >
                  Vorderseite
                </Button>
                <Button
                  variant={activeSide === "back" && viewMode !== "ai-mockup" ? "default" : "outline"}
                  size="sm"
                  className="h-8"
                  onClick={() => { setActiveSide("back"); setViewMode("parts"); }}
                >
                  Rückseite
                </Button>
                <Button
                  variant={viewMode === "ai-mockup" ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={async () => {
                    // Screenshot der aktuellen Seite erstellen
                    const currentSide = activeSide;
                    const screenshots: { front: string | null; back: string | null } = { front: null, back: null };
                    const { toPng } = await import("html-to-image");
                    
                    // Screenshot der aktuellen Seite
                    if (canvasRef.current) {
                      try {
                        screenshots[currentSide] = await toPng(canvasRef.current, { quality: 0.8, pixelRatio: 1.5, skipFonts: true, cacheBust: true, includeQueryParams: true });
                      } catch { /* kein Screenshot */ }
                    }
                    
                    // Wechsle zur anderen Seite für den zweiten Screenshot
                    const otherSide = currentSide === "front" ? "back" : "front";
                    setActiveSide(otherSide);
                    await new Promise(r => setTimeout(r, 350));
                    if (canvasRef.current) {
                      try {
                        screenshots[otherSide] = await toPng(canvasRef.current, { quality: 0.8, pixelRatio: 1.5, skipFonts: true, cacheBust: true, includeQueryParams: true });
                      } catch { /* kein Screenshot */ }
                    }
                    
                    // Zurück zur ursprünglichen Seite und Mockup-View öffnen
                    setActiveSide(currentSide);
                    setCachedMockupScreenshots(screenshots);
                    setMockupSide(currentSide);
                    setViewMode("ai-mockup");
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  KI-Mockup
                </Button>
                {activePlayer && (
                  <Badge variant="outline" className="ml-auto text-xs">
                    <User className="w-3 h-3 mr-1" />
                    {activePlayer.number} {activePlayer.name}
                  </Badge>
                )}
              </div>
            )}

            {/* Overview Toggle */}
            {hasParts && (
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={viewMode === "parts" ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setViewMode("parts")}
                >
                  <LayoutGrid className="w-3.5 h-3.5 mr-1.5" />
                  Einzelteile
                </Button>
                <Button
                  variant={viewMode === "overview" ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setViewMode("overview")}
                >
                  <Shirt className="w-3.5 h-3.5 mr-1.5" />
                  Gesamtübersicht
                </Button>

                <Button
                  variant={viewMode === "ai-mockup" ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={async () => {
                    // Screenshots für beide Seiten aus der Gesamtübersicht erstellen
                    const { toPng } = await import("html-to-image");
                    const screenshots: { front: string | null; back: string | null } = { front: null, back: null };
                    
                    // Wechsle zur Overview für den Screenshot
                    const prevMode = viewMode;
                    if (prevMode !== "overview") {
                      setViewMode("overview");
                      await new Promise(r => setTimeout(r, 300));
                    }
                    
                    // Screenshot der Gesamtübersicht (zeigt alle Teile)
                    if (overviewRef.current) {
                      try {
                        screenshots.front = await toPng(overviewRef.current, { quality: 0.8, pixelRatio: 1.5, skipFonts: true, cacheBust: true, includeQueryParams: true });
                        // Für die Rückseite verwenden wir den gleichen Screenshot als Basis
                        // da die Overview alle Teile zeigt
                        screenshots.back = screenshots.front;
                      } catch { /* kein Screenshot */ }
                    } else if (canvasRef.current) {
                      try {
                        screenshots.front = await toPng(canvasRef.current, { quality: 0.8, pixelRatio: 1.5, skipFonts: true, cacheBust: true, includeQueryParams: true });
                        screenshots.back = screenshots.front;
                      } catch { /* kein Screenshot */ }
                    }
                    setCachedMockupScreenshots(screenshots);
                    setMockupSide("front");
                    setViewMode("ai-mockup");
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  KI-Mockup
                </Button>

              </div>
            )}

            {/* Overview Mode */}
            {hasParts && viewMode === "overview" && (
              <Card className="overflow-hidden">
                <div ref={overviewRef} className="bg-[#e8eaed] p-3 sm:p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                    {sortedParts.map((part) => {
                      const partZones = allZones.filter((z) => z.partId === part.id);
                      return (
                        <div
                          key={part.id}
                          className="relative rounded-lg border overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all"
                          style={{ backgroundColor: (!hasTransparentImages && getPartColor(part.id) !== "#ffffff" && getPartColor(part.id) !== "#FFFFFF" && !dtfBrandImage) ? getPartColor(part.id) : "#ffffff" }}
                          onClick={() => {
                            setActivePartId(part.id);
                            setViewMode("parts");
                          }}
                        >
                          <div className="relative">
                            {part.imageUrl ? (
                              <>
                                <img
                                  src={storageUrl(part.imageUrl)}
                                  alt={part.label}
                                  className="w-full h-auto block p-1 relative"
                                  draggable={false}
                                  crossOrigin="anonymous"
                                />
                                {/* Farb-Overlay für transparente Bilder (SVG): CSS-Mask + multiply */}
                                {hasTransparentImages && getPartColor(part.id) !== "#ffffff" && getPartColor(part.id) !== "#FFFFFF" && !dtfBrandImage && (
                                  <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                      backgroundColor: getPartColor(part.id),
                                      mixBlendMode: "multiply" as const,
                                      WebkitMaskImage: `url(${storageUrl(part.imageUrl)})`,
                                      WebkitMaskSize: "100% 100%",
                                      WebkitMaskRepeat: "no-repeat",
                                      WebkitMaskPosition: "center",
                                      maskImage: `url(${storageUrl(part.imageUrl)})`,
                                      maskSize: "100% 100%",
                                      maskRepeat: "no-repeat",
                                      maskPosition: "center",
                                    }}
                                  />
                                )}
                                {/* Farb-Overlay für nicht-transparente Bilder (PNG) */}
                                {!hasTransparentImages && getPartColor(part.id) !== "#ffffff" && getPartColor(part.id) !== "#FFFFFF" && !dtfBrandImage && (
                                  <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                      backgroundColor: getPartColor(part.id),
                                      mixBlendMode: "multiply" as const,
                                    }}
                                  />
                                )}
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Image className="w-6 h-6 text-muted-foreground/20" />
                              </div>
                            )}
                            {partZones.map((zone, zIdx) => (
                              <ZoneOverlay
                                key={zone.id}
                                zone={zone}
                                idx={zIdx}
                                scale={0.4}
                                interactive={false}
                              />
                            ))}
                          </div>
                          <div className="px-2 py-1.5 bg-muted/30 border-t">
                            <span className="text-[10px] sm:text-xs font-medium block text-center truncate">
                              {part.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            )}



            {/* KI-Mockup */}
            {hasParts && viewMode === "ai-mockup" && (
              <Card className="overflow-hidden">
                <div className="bg-[#e8eaed] p-4 sm:p-6">
                  {/* Vorderseite / Rückseite Tabs */}
                  <div className="flex gap-2 mb-4 justify-center">
                    <Button
                      variant={mockupSide === "front" ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setMockupSide("front")}
                    >
                      Vorderseite
                    </Button>
                    <Button
                      variant={mockupSide === "back" ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setMockupSide("back")}
                    >
                      Rückseite
                    </Button>
                  </div>
                  <AiMockupView
                    productName={productData?.name || "Trikot"}
                    sortedParts={sortedParts}
                    processedPartImages={{}}
                    partColors={partColors}
                    isSublimation={isSublimation}
                    isDtf={isDtf}
                    dtfBaseColor={dtfBaseColor || ""}
                    cachedScreenshot={cachedMockupScreenshots[mockupSide]}
                    canvasContainerRef={overviewRef}
                    side={mockupSide}
                    zoneDescriptions={allZones.filter(z => z.side === mockupSide).map(z => {
                      const c = zoneContents[z.id];
                      const parts: string[] = [];
                      if (z.label) parts.push(z.label);
                      if (c?.text) parts.push(`Text: "${c.text}"`);
                      if (c?.imageDataUrl || c?.imageUrl) parts.push("Logo/Bild vorhanden");
                      if (z.purpose === "clubLogo") parts.push("Vereinswappen");
                      parts.push(`Position: ${Math.round(z.posX)}% von links, ${Math.round(z.posY)}% von oben, Größe: ${Math.round(z.width)}%x${Math.round(z.height)}%`);
                      return parts.length > 1 ? parts.join(" - ") : null;
                    }).filter(Boolean).join("; ")}
                    onSaveToGallery={teamIdParam ? (url, side) => {
                      saveMockupToGallery({ mockupUrl: url, side, productId, teamId: teamIdParam });
                    } : undefined}
                    onShare={(url) => {
                      const fullUrl = window.location.origin + (storageUrl(url) || url);
                      navigator.clipboard.writeText(fullUrl);
                      toast.success("Mockup-Link in Zwischenablage kopiert!");
                    }}
                  />
                </div>
              </Card>
            )}

            {/* KI-Mockup für freeZoneMode-Produkte (Hoodie, Jacke, etc.) */}
            {!hasParts && viewMode === "ai-mockup" && (
              <Card className="overflow-hidden">
                <div className="bg-[#e8eaed] p-4 sm:p-6">
                  {/* Vorderseite / Rückseite Tabs */}
                  <div className="flex gap-2 mb-4 justify-center">
                    <Button
                      variant={mockupSide === "front" ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setMockupSide("front")}
                    >
                      Vorderseite
                    </Button>
                    <Button
                      variant={mockupSide === "back" ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setMockupSide("back")}
                    >
                      Rückseite
                    </Button>
                  </div>
                  <AiMockupView
                    productName={productData?.name || "Textil"}
                    sortedParts={sortedParts}
                    processedPartImages={{}}
                    partColors={partColors}
                    isSublimation={isSublimation}
                    isDtf={isDtf}
                    dtfBaseColor={dtfBaseColor || ""}
                    cachedScreenshot={cachedMockupScreenshots[mockupSide]}
                    canvasContainerRef={canvasRef}
                    side={mockupSide}
                    zoneDescriptions={allZones.filter(z => z.side === mockupSide).map(z => {
                      const c = zoneContents[z.id];
                      const parts: string[] = [];
                      if (z.label) parts.push(z.label);
                      if (c?.text) parts.push(`Text: "${c.text}"`);
                      if (c?.imageDataUrl || c?.imageUrl) parts.push("Logo/Bild vorhanden");
                      if (z.purpose === "clubLogo") parts.push("Vereinswappen");
                      parts.push(`Position: ${Math.round(z.posX)}% von links, ${Math.round(z.posY)}% von oben, Größe: ${Math.round(z.width)}%x${Math.round(z.height)}%`);
                      return parts.length > 1 ? parts.join(" - ") : null;
                    }).filter(Boolean).join("; ")}
                    onSaveToGallery={teamIdParam ? (url, side) => {
                      saveMockupToGallery({ mockupUrl: url, side, productId, teamId: teamIdParam });
                    } : undefined}
                    onShare={(url) => {
                      const fullUrl = window.location.origin + (storageUrl(url) || url);
                      navigator.clipboard.writeText(fullUrl);
                      toast.success("Mockup-Link in Zwischenablage kopiert!");
                    }}
                  />
                </div>
              </Card>
            )}

            {/* Single Part Canvas */}
            {(viewMode === "parts" || (!hasParts && viewMode !== "ai-mockup")) && (
              <Card className="overflow-hidden">
                <div
                  ref={canvasRef}
                   className="relative w-full mx-auto select-none"
                   style={{
                     ...((isFreeZoneMode && (draggingZone !== null || resizingZone !== null)) ? { touchAction: "none" } : {}),
                     backgroundColor: (!hasTransparentImages && activeColor && activeColor !== "#ffffff" && activeColor !== "#FFFFFF" && !dtfBrandImage) ? activeColor : "#e8eaed",
                   }}
                  onClick={() => setSelectedZoneId(null)}
                  onDragOver={(e) => {
                    // Erlaube Drop auf dem Canvas (wird von den Zonen abgefangen)
                    if (dragSponsorRef.current) {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "copy";
                    }
                  }}
                  onDrop={(e) => {
                    // Fallback: Wenn auf den Canvas (nicht auf eine Zone) gedroppt wird
                    e.preventDefault();
                    setDragOverZoneId(null);
                    if (!dragSponsorRef.current) return;
                    // Finde die nächste custom-Zone unter dem Cursor
                    const canvasRect = canvasRef.current?.getBoundingClientRect();
                    if (!canvasRect) return;
                    const relX = ((e.clientX - canvasRect.left) / canvasRect.width) * 100;
                    const relY = ((e.clientY - canvasRect.top) / canvasRect.height) * 100;
                    const targetZone = currentZones.find(z => 
                      (z.purpose === "custom" || z.purpose === "logo") && !isZoneLocked(z) &&
                      relX >= z.posX && relX <= z.posX + z.width &&
                      relY >= z.posY && relY <= z.posY + z.height
                    );
                    if (targetZone) {
                      const sponsor = dragSponsorRef.current;
                      if (sponsor.logoUrl) {
                        updateZoneContent(targetZone.id, { imageUrl: sponsor.logoUrl, text: "" });
                      } else {
                        updateZoneContent(targetZone.id, { text: sponsor.name, imageUrl: "" });
                      }
                      toast.success(`Sponsor "${sponsor.name}" in "${targetZone.label}" eingesetzt`);
                    } else {
                      toast.info("Bitte auf eine Sponsor-Zone ziehen");
                    }
                    dragSponsorRef.current = null;
                  }}
                >
                  {/* CSS-based coloring: color behind image, visible through transparent areas */}
                  {currentImage ? (
                    <div className="relative w-full" style={{ position: "relative", zIndex: 1 }}>
                      {/* Hauptbild */}
                      <img
                        src={currentImage}
                        alt={hasParts && activePart ? activePart.label : `${activeSide} Ansicht`}
                        className="w-full h-auto block pointer-events-none drop-shadow-md relative"
                        draggable={false}
                        crossOrigin="anonymous"
                      />
                      {/* Farb-Overlay für transparente Bilder (SVG): CSS-Mask + multiply über dem Bild */}
                      {hasTransparentImages && activeColor && activeColor !== "#ffffff" && activeColor !== "#FFFFFF" && !dtfBrandImage && (
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            backgroundColor: activeColor,
                            mixBlendMode: "multiply" as const,
                            WebkitMaskImage: `url(${currentImage})`,
                            WebkitMaskSize: "100% 100%",
                            WebkitMaskRepeat: "no-repeat",
                            WebkitMaskPosition: "center",
                            maskImage: `url(${currentImage})`,
                            maskSize: "100% 100%",
                            maskRepeat: "no-repeat",
                            maskPosition: "center",
                          }}
                        />
                      )}
                      {/* Farb-Overlay für nicht-transparente Bilder (Trikot-PNGs mit weißem Hintergrund) */}
                      {!hasTransparentImages && activeColor && activeColor !== "#ffffff" && activeColor !== "#FFFFFF" && !dtfBrandImage && (
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            backgroundColor: activeColor,
                            mixBlendMode: "multiply" as const,
                          }}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="w-full aspect-[3/4] flex flex-col items-center justify-center text-muted-foreground" style={{ position: "relative", zIndex: 1 }}>
                      <Shirt className="w-12 h-12 sm:w-16 sm:h-16 opacity-20" />
                      <p className="text-xs text-muted-foreground/50 mt-2">
                        {hasParts && activePart ? activePart.label : "Keine Ansicht verf\u00fcgbar"}
                      </p>
                    </div>
                  )}
                  {/* DTF Brand Image Background */}
                  {isDtf && dtfBrandImage && (
                    <img
                      src={dtfBrandImage}
                      alt="Markentrikot"
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                      style={{ opacity: 0.85, zIndex: 2 }}
                      draggable={false}
                    />
                  )}
                  {/* Zone Overlays */}
                  {currentZones.map((zone, idx) => (
                    <ZoneOverlay key={zone.id} zone={zone} idx={idx} scale={1} interactive={true} />
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Right: Configuration Panel */}
          <div className="space-y-4">
            {/* Org-/Abt.-Auswahl bei mehreren Mitgliedschaften */}
            {isAuthenticated && myMemberships && myMemberships.length > 0 && (
              <Card className="p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="font-medium">
                    {primaryMembership?.orgName ?? "Organisation"}
                    {primaryMembership?.departmentName ? ` / ${primaryMembership.departmentName}` : ""}
                  </span>
                  {hasMultipleMemberships && (
                    <select
                      className="ml-auto text-xs border rounded px-2 py-1 bg-background"
                      value={selectedMembershipIdx}
                      onChange={(e) => {
                        // Vorherige auto-gesetzte Werte aus Logo-/Text-Zonen entfernen
                        setZoneContents((prev) => {
                          const updated = { ...prev };
                          for (const zone of allZones) {
                            if (zone.purpose === "clubLogo" && updated[zone.id]?.imageDataUrl === prevAutoLogoUrl.current) {
                              updated[zone.id] = { ...updated[zone.id], zoneId: zone.id, imageDataUrl: undefined as any };
                            }
                            if (zone.purpose !== "logo" && zone.purpose !== "clubLogo" && updated[zone.id]?.fontFamily === prevAutoFontFamily.current) {
                              updated[zone.id] = { ...updated[zone.id], zoneId: zone.id, fontFamily: undefined as any };
                            }
                          }
                          return updated;
                        });
                        prevAutoLogoUrl.current = null;
                        prevAutoFontFamily.current = null;
                        setSelectedMembershipIdx(Number(e.target.value));
                        setAutoLogoApplied(false);
                        setAutoFontApplied(false);
                      }}
                    >
                      {myMemberships.map((m, i) => (
                        <option key={i} value={i}>
                          {m.orgName}{m.departmentName ? ` / ${m.departmentName}` : ""} ({m.role === "owner" ? "Verantwortlicher" : m.role === "department_lead" ? "Spartenleiter" : "Trainer"})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </Card>
            )}
            <Tabs defaultValue="zones">
              <TabsList className="w-full">
                {(isSublimation || isDtf) && (
                  <TabsTrigger value="colors" className="flex-1 text-xs sm:text-sm">
                    <Palette className="w-3.5 h-3.5 mr-1 sm:mr-1.5" />
                    Farben
                  </TabsTrigger>
                )}
                <TabsTrigger value="zones" className="flex-1 text-xs sm:text-sm">
                  <Image className="w-3.5 h-3.5 mr-1 sm:mr-1.5" />
                  Zonen
                </TabsTrigger>
                <TabsTrigger value="team" className="flex-1 text-xs sm:text-sm">
                  <Users className="w-3.5 h-3.5 mr-1 sm:mr-1.5" />
                  Mannschaft
                </TabsTrigger>
              </TabsList>

              {/* Colors Tab */}
              {(isSublimation || isDtf) && (
                <TabsContent value="colors" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                  {/* Sublimation: Per-Part Color Selection */}
                  {isSublimation && (
                    <Card>
                      <CardHeader className="pb-2 sm:pb-3">
                        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                          <Droplets className="w-4 h-4" />
                          Trikotfarben
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          Wähle für jedes Teil eine Farbe aus. Die Farbe wird als Overlay auf dem Teil angezeigt.
                        </p>
                        {sortedParts.map((part) => (
                          <div key={part.id} className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs sm:text-sm font-medium">{part.label}</Label>
                              <div className="flex items-center gap-2">
                                {partColors[part.id] && (
                                  <span className="text-[10px] font-mono text-muted-foreground">
                                    {formatCmyk(hexToCmyk(partColors[part.id]))}
                                  </span>
                                )}
                                {partColors[part.id] && (
                                  <button
                                    className="text-[10px] text-muted-foreground hover:text-destructive transition-colors"
                                    onClick={() => {
                                      const updated = { ...partColors };
                                      delete updated[part.id];
                                      setPartColors(updated);
                                    }}
                                  >
                                    Zurücksetzen
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {colorPalette.length > 0 ? (
                                colorPalette.map((color, idx) => (
                                  <button
                                    key={idx}
                                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border-2 transition-all hover:scale-110 ${
                                      partColors[part.id] === color
                                        ? "border-primary ring-2 ring-primary/30 scale-110"
                                        : "border-border hover:border-muted-foreground"
                                    }`}
                                    style={{ backgroundColor: color }}
                                    title={`${color} | ${formatCmyk(hexToCmyk(color))}`}
                                    onClick={() => setPartColors((prev) => ({ ...prev, [part.id]: color }))}
                                  />
                                ))
                              ) : (
                                <p className="text-[10px] text-muted-foreground italic">
                                  Keine Farbpalette definiert. Der Admin muss zuerst Farben festlegen.
                                </p>
                              )}
                            </div>
                            {/* CMYK-Farbwähler für freie Farbwahl */}
                            <CmykColorPicker
                              value={partColors[part.id] || "#c8c8cc"}
                              onChange={(hex) => setPartColors((prev) => ({ ...prev, [part.id]: hex }))}
                              label="Eigene Farbe (CMYK)"
                            />
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* DTF: Base Color or Brand Jersey Upload */}
                  {isDtf && (
                    <Card>
                      <CardHeader className="pb-2 sm:pb-3">
                        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                          <Shirt className="w-4 h-4" />
                          Grundtrikot
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          Wähle eine Grundfarbe für das Trikot oder lade ein Foto eines leeren Markentrikots hoch.
                        </p>

                        {/* Option 1: Base Color */}
                        <div className="space-y-2">
                          <Label className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
                            <Palette className="w-3.5 h-3.5" />
                            Grundfarbe
                          </Label>
                          <div className="flex flex-wrap gap-1.5">
                            {["#ffffff", "#000000", "#1e3a5f", "#dc2626", "#16a34a", "#eab308", "#7c3aed", "#f97316", "#ec4899", "#6b7280"].map((color) => (
                              <button
                                key={color}
                                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border-2 transition-all hover:scale-110 ${
                                  dtfBaseColor === color && !dtfBrandImage
                                    ? "border-primary ring-2 ring-primary/30 scale-110"
                                    : "border-border hover:border-muted-foreground"
                                }`}
                                style={{ backgroundColor: color }}
                                title={`${color} | ${formatCmyk(hexToCmyk(color))}`}
                                onClick={() => {
                                  setDtfBaseColor(color);
                                  setDtfBrandImage(null);
                                }}
                              />
                            ))}
                          </div>
                          {/* CMYK-Farbwähler für freie DTF-Grundfarbe */}
                          <CmykColorPicker
                            value={dtfBaseColor || "#ffffff"}
                            onChange={(hex) => {
                              setDtfBaseColor(hex);
                              setDtfBrandImage(null);
                            }}
                            label="Eigene Grundfarbe (CMYK)"
                          />
                          {dtfBaseColor && !dtfBrandImage && (
                            <span className="text-[10px] font-mono text-muted-foreground">
                              Gewählt: {formatCmyk(hexToCmyk(dtfBaseColor))}
                            </span>
                          )}
                          {dtfBaseColor && !dtfBrandImage && (
                            <button
                              className="text-[10px] text-muted-foreground hover:text-destructive transition-colors"
                              onClick={() => setDtfBaseColor(null)}
                            >
                              Grundfarbe entfernen
                            </button>
                          )}
                        </div>

                        <Separator />

                        {/* Option 2: Brand Jersey Upload */}
                        <div className="space-y-2">
                          <Label className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5" />
                            Markentrikot hochladen
                          </Label>
                          <p className="text-[10px] text-muted-foreground">
                            Lade ein Foto eines leeren Markentrikots hoch (z.B. Nike, Adidas, Puma). Die Druckzonen werden darauf platziert.
                          </p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 h-8 text-xs"
                              onClick={() => {
                                const input = document.createElement("input");
                                input.type = "file";
                                input.accept = ".pdf,image/*";
                                input.onchange = async (e) => {
                                  const file = (e.target as HTMLInputElement).files?.[0];
                                  if (!file) return;
                                  // Überdrucken- und Transparenz-Prüfung
                                  try {
                                    const { checkUploadFile } = await import("@/hooks/useUploadChecks");
                                    const checkResult = await checkUploadFile(file);
                                    for (const w of checkResult.warnings) {
                                      toast.warning(w.message, { duration: 10000 });
                                    }
                                  } catch { /* Bei Fehler fortfahren */ }
                                  // DPI-Prüfung (nur für Bilder, nicht für PDFs)
                                  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
                                  if (!isPdf) {
                                    try {
                                      const { checkImageDpi } = await import("@/hooks/useDpiCheck");
                                      const result = await checkImageDpi(file, 30, 40);
                                      if (result.status === "warning") {
                                        toast.warning(result.message, { duration: 8000 });
                                      } else if (result.status === "ok") {
                                        toast.success(result.message);
                                      }
                                    } catch { /* Bei Fehler fortfahren */ }
                                  }
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    setDtfBrandImage(reader.result as string);
                                    setDtfBaseColor(null);
                                    toast.success("Markentrikot geladen");
                                  };
                                  reader.readAsDataURL(file);
                                };
                                input.click();
                              }}
                            >
                              <Upload className="w-3.5 h-3.5 mr-1.5" />
                              {dtfBrandImage ? "Bild ändern" : "Trikot-Foto wählen"}
                            </Button>
                            {dtfBrandImage && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setDtfBrandImage(null)}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-destructive" />
                              </Button>
                            )}
                          </div>
                          {dtfBrandImage && (
                            <div className="w-full aspect-[3/4] bg-muted/30 rounded-lg border overflow-hidden">
                              <img src={dtfBrandImage} alt="Markentrikot" className="w-full h-full object-contain" />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              )}

              {/* Zones Tab */}
              <TabsContent value="zones" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                {/* Verbandsvorgaben-Warnungen */}
                {validationWarnings.length > 0 && productData?.category === 'Trikot' && (
                  <Card className="border-amber-300 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-950/30">
                    <CardContent className="pt-3 pb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">Verbandsvorgaben-Prüfung</span>
                        <Badge variant="outline" className="ml-auto text-[10px] border-amber-400 text-amber-700">
                          {validationWarnings.filter(w => w.severity === 'error').length} Fehler, {validationWarnings.filter(w => w.severity === 'warning').length} Hinweise
                        </Badge>
                      </div>
                      <div className="space-y-1.5 ml-6">
                        {validationWarnings.map((w, i) => (
                          <div key={i} className={`text-xs flex items-start gap-1.5 ${w.severity === 'error' ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
                            <span className="shrink-0">{w.severity === 'error' ? '❌' : '⚠️'}</span>
                            <span><strong>{w.zone}:</strong> {w.message}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-amber-600/70 mt-2 ml-6">Quelle: {fullRuleSet?.number.source}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Regelwerk-Übersicht (wenn keine Warnungen, aber Regeln vorhanden) */}
                {validationWarnings.length === 0 && fullRuleSet && productData?.category === 'Trikot' && (
                  <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400 bg-green-50/50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md p-2">
                    <span>✅</span>
                    <span>Alle Verbandsvorgaben eingehalten ({effectiveSport ? effectiveSport.charAt(0).toUpperCase() + effectiveSport.slice(1) : 'Sportart'}{orgStateName ? `, ${orgStateName}` : ''})</span>
                  </div>
                )}

                {/* Club Name Input (if any zone uses clubName) */}
                {allZones.some((z) => z.purpose === "clubName") && (
                  <Card className={isTrainer ? "border-amber-200 bg-amber-50/30 dark:border-amber-800 dark:bg-amber-950/20" : ""}>
                    <CardContent className="pt-3 sm:pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        {isTrainer ? <Lock className="w-4 h-4 text-amber-600" /> : <Shield className="w-4 h-4 text-primary" />}
                        <Label className="text-sm font-medium">Vereinsname</Label>
                        {isTrainer && <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 ml-auto">Gesperrt</Badge>}
                      </div>
                      <Input
                        placeholder="z.B. FC Musterstadt"
                        value={clubName}
                        onChange={(e) => !isTrainer && setClubName(e.target.value)}
                        readOnly={isTrainer}
                        className={`h-9 ${isTrainer ? "bg-muted cursor-not-allowed" : ""}`}
                      />
                      <p className="text-[10px] text-muted-foreground mt-1.5">
                        {isTrainer
                          ? "Vom Verein festgelegt. Kann nicht ge\u00e4ndert werden."
                          : "Wird automatisch in allen Vereinsname-Feldern platziert."}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* freeZoneMode: Auto-Feld-Toggles und Zone-Hinzufügen */}
                {isFreeZoneMode && (
                  <Card className="border-blue-200 bg-blue-50/30 dark:border-blue-800 dark:bg-blue-950/20">
                    <CardContent className="pt-3 sm:pt-4 space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Move className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Freie Zonen-Bearbeitung</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Verschiebe und skaliere Zonen direkt auf dem Textil. Wähle welche automatischen Felder angezeigt werden sollen.
                      </p>
                      {/* Auto-Feld-Toggles */}
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Automatische Felder</Label>
                        <div className="flex flex-wrap gap-2">
                          {(["playerName", "playerNumber", "playerInitials"] as const).map((field) => (
                            <button
                              key={field}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-all ${
                                enabledAutoFields[field]
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50"
                              }`}
                              onClick={() => handleToggleAutoField(field)}
                              disabled={createZoneMut.isPending || deleteZoneMut.isPending}
                            >
                              {enabledAutoFields[field] ? (
                                <ToggleRight className="w-3.5 h-3.5" />
                              ) : (
                                <ToggleLeft className="w-3.5 h-3.5" />
                              )}
                              {field === "playerName" ? "Spielername" : field === "playerNumber" ? "Nummer" : "Kürzel"}
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* Custom-Zone hinzufügen */}
                      <div className="pt-1">
                        {addZoneDialogOpen ? (
                          <div className="space-y-2 p-2 border rounded-md bg-background">
                            {/* Zweck-Auswahl */}
                            <div className="grid grid-cols-4 gap-1">
                              {zonePurposeOptions.filter(opt => {
                                // Kürzel (abbreviation) nur bei Bekleidung (freeZoneMode), nicht bei Trikots
                                if (opt.value === 'abbreviation' && !isFreeZoneMode) return false;
                                return true;
                              }).map((opt) => (
                                <button
                                  key={opt.value}
                                  className={`px-1.5 py-1 rounded text-[9px] border transition-colors ${
                                    newZonePurpose === opt.value ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"
                                  }`}
                                  onClick={() => {
                                    setNewZonePurpose(opt.value);
                                    setNewZoneType(opt.defaultType);
                                    // Auto-Label setzen wenn leer
                                    if (!newZoneLabel.trim() || zonePurposeOptions.some(o => o.label === newZoneLabel)) {
                                      setNewZoneLabel(opt.label);
                                    }
                                  }}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                            <Input
                              placeholder="Zonen-Name (z.B. Sponsor Rücken)"
                              value={newZoneLabel}
                              onChange={(e) => setNewZoneLabel(e.target.value)}
                              className="h-8 text-xs"
                              onKeyDown={(e) => e.key === "Enter" && handleAddCustomZone()}
                            />
                            <div className="flex gap-1.5">
                              {(["text", "image", "both"] as const).map((t) => (
                                <button
                                  key={t}
                                  className={`flex-1 px-2 py-1 rounded text-[10px] border transition-colors ${
                                    newZoneType === t ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"
                                  }`}
                                  onClick={() => setNewZoneType(t)}
                                >
                                  {t === "text" ? "Text" : t === "image" ? "Bild" : "Beides"}
                                </button>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" className="flex-1 h-7 text-xs" onClick={handleAddCustomZone} disabled={!newZoneLabel.trim()}>
                                <Plus className="w-3 h-3 mr-1" /> Hinzufügen
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setAddZoneDialogOpen(false); setNewZonePurpose("custom"); }}>
                                Abbrechen
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-8 text-xs border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                            onClick={() => setAddZoneDialogOpen(true)}
                          >
                            <Plus className="w-3.5 h-3.5 mr-1.5" />
                            Neue Zone hinzufügen
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {currentZones.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">
                    {hasParts && activePart
                      ? `Keine Zonen für "${activePart.label}" definiert.`
                      : "Keine Zonen auf dieser Seite definiert."}
                  </div>
                ) : (
                  currentZones.map((zone, idx) => {
                    const content = getEffectiveContent(zone);
                    const colorIdx = idx % zoneBorderColors.length;
                    const isSelected = selectedZoneId === zone.id;
                    const purpose = zone.purpose || "custom";
                    const PurposeIcon = PURPOSE_ICONS[purpose] || PenTool;

                    return (
                      <Card
                        key={zone.id}
                        className={`cursor-pointer transition-all ${isSelected ? "ring-2" : ""} ${isZoneLocked(zone) ? "border-amber-200 dark:border-amber-800" : ""}`}
                        style={
                          isSelected
                            ? ({ "--tw-ring-color": zoneBorderColors[colorIdx] } as any)
                            : {}
                        }
                        onClick={() => setSelectedZoneId(zone.id)}
                      >
                        <CardContent className="pt-3 sm:pt-4 space-y-2 sm:space-y-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0"
                              style={{ backgroundColor: zoneBorderColors[colorIdx] }}
                            />
                            {isZoneLocked(zone) ? <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600" /> : <PurposeIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground" />}
                            <span className="font-medium text-xs sm:text-sm">{zone.label}</span>
                            {isZoneLocked(zone) ? (
                              <Badge variant="outline" className="text-[10px] sm:text-xs ml-auto border-amber-300 text-amber-700">Gesperrt</Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] sm:text-xs ml-auto">
                                {PURPOSE_LABELS[purpose] || "Freitext"}
                              </Badge>
                            )}
                            {/* freeZoneMode: Lösch-Button (nicht für clubLogo) */}
                            {isFreeZoneMode && zone.purpose !== "clubLogo" && (
                              <button
                                className="ml-1 p-1 rounded-md text-destructive hover:bg-destructive/10 transition-colors"
                                title="Zone entfernen"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteFreeZone(zone);
                                }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Dimensions in cm - editierbar bei Nicht-Trikots im freeZoneMode */}
                          {isFreeZoneMode && productData?.category !== 'Trikot' ? (
                            <div className="flex items-center gap-1.5 mt-1">
                              <Ruler className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span className="text-[10px] text-muted-foreground shrink-0">Größe:</span>
                              <input
                                type="number"
                                step="0.5"
                                min="1"
                                max="100"
                                placeholder="B"
                                className="w-12 h-5 text-[10px] text-center border rounded bg-background px-1"
                                value={zone.widthCm ?? ""}
                                onChange={(e) => {
                                  const val = e.target.value ? parseFloat(e.target.value) : null;
                                  setLocalZones(prev => prev.map(z => z.id === zone.id ? { ...z, widthCm: val } : z));
                                }}
                                onBlur={(e) => {
                                  const val = e.target.value ? parseFloat(e.target.value) : null;
                                  // Berechne Zone-Breite basierend auf cm-Seitenverhältnis
                                  const hCm = zone.heightCm;
                                  if (val && hCm && canvasRef.current) {
                                    const rect = canvasRef.current.getBoundingClientRect();
                                    const canvasAspect = rect.width / rect.height;
                                    const cmAspect = val / hCm;
                                    const newWidth = zone.height * cmAspect / canvasAspect;
                                    setLocalZones(prev => prev.map(z => z.id === zone.id ? { ...z, width: Math.min(newWidth, 95) } : z));
                                    // Speichere widthCm + neue width
                                    bulkUpdatePositions.mutate({
                                      productId,
                                      zones: [{ id: zone.id, posX: zone.posX, posY: zone.posY, width: Math.min(newWidth, 95), height: zone.height, rotation: zone.rotation || 0 }],
                                    });
                                  }
                                  freeUpdateZoneMut.mutate({ id: zone.id, productId, widthCm: val });
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span className="text-[10px] text-muted-foreground">×</span>
                              <input
                                type="number"
                                step="0.5"
                                min="1"
                                max="100"
                                placeholder="H"
                                className="w-12 h-5 text-[10px] text-center border rounded bg-background px-1"
                                value={zone.heightCm ?? ""}
                                onChange={(e) => {
                                  const val = e.target.value ? parseFloat(e.target.value) : null;
                                  setLocalZones(prev => prev.map(z => z.id === zone.id ? { ...z, heightCm: val } : z));
                                }}
                                onBlur={(e) => {
                                  const val = e.target.value ? parseFloat(e.target.value) : null;
                                  // Berechne Zone-Breite basierend auf cm-Seitenverhältnis (Höhe ist ausschlaggebend)
                                  const wCm = zone.widthCm;
                                  if (val && wCm && canvasRef.current) {
                                    const rect = canvasRef.current.getBoundingClientRect();
                                    const canvasAspect = rect.width / rect.height;
                                    const cmAspect = wCm / val;
                                    const newWidth = zone.height * cmAspect / canvasAspect;
                                    setLocalZones(prev => prev.map(z => z.id === zone.id ? { ...z, width: Math.min(newWidth, 95) } : z));
                                    // Speichere heightCm + neue width
                                    bulkUpdatePositions.mutate({
                                      productId,
                                      zones: [{ id: zone.id, posX: zone.posX, posY: zone.posY, width: Math.min(newWidth, 95), height: zone.height, rotation: zone.rotation || 0 }],
                                    });
                                  }
                                  freeUpdateZoneMut.mutate({ id: zone.id, productId, heightCm: val });
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span className="text-[10px] text-muted-foreground">cm</span>
                              {zone.rotation ? <span className="text-[10px] text-muted-foreground ml-1">{zone.rotation}°</span> : null}
                            </div>
                          ) : (zone.widthCm || zone.heightCm) ? (
                            <p className="text-[10px] text-muted-foreground">
                              Druckfläche: {zone.widthCm ? `${zone.widthCm} cm` : "–"} ×{" "}
                              {zone.heightCm ? `${zone.heightCm} cm` : "–"}
                              {zone.rotation ? ` · ${zone.rotation}°` : ""}
                            </p>
                          ) : null}

                          {/* Font preview for text zones */}
                          {zone.fontFamily && purpose !== "logo" && (
                            <div
                              className="text-xs px-2 py-1 bg-muted/30 rounded border"
                              style={{
                                fontFamily: zone.fontFamily,
                                fontWeight: (zone.fontWeight as any) || "700",
                                color: zone.fontColor || undefined,
                              }}
                            >
                              <Type className="w-3 h-3 inline mr-1 opacity-50" />
                              {zone.fontFamily}
                              {zone.fontSize ? ` · ${zone.fontSize}px` : ""}
                            </div>
                          )}

                          {/* Vereinswappen (clubLogo): Automatisch vom Owner-Logo, nur Owner kann ändern */}
                          {purpose === "clubLogo" && (
                            <div className="space-y-2">
                              {/* Wappen-Vorschau Thumbnail */}
                              {content?.imageDataUrl && (
                                <div className={`flex items-center gap-3 rounded-lg p-2.5 ${isZoneLocked(zone) ? "bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800" : "bg-accent/40 border border-border"}`}>
                                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-md overflow-hidden bg-white dark:bg-gray-900 border border-border shrink-0 flex items-center justify-center p-1">
                                    <img
                                      src={storageUrl(content.imageDataUrl) || content.imageDataUrl}
                                      alt="Vereinswappen"
                                      className="w-full h-full object-contain"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-foreground truncate">Vereinswappen</p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                      {isZoneLocked(zone) ? "Vom Verein festgelegt" : "Vom Owner hochgeladen"}
                                    </p>
                                  </div>
                                </div>
                              )}
                              {/* Gesperrt-Hinweis oder Upload-Buttons */}
                              {isZoneLocked(zone) ? (
                                <div className="text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 rounded-md p-2 flex items-center gap-2">
                                  <Lock className="w-3.5 h-3.5 shrink-0" />
                                  <span>
                                    {content?.imageDataUrl
                                      ? "Nur der Vereinsverantwortliche kann das Wappen \u00e4ndern."
                                      : "Vereinswappen wird automatisch gesetzt, sobald der Vereinsverantwortliche ein Logo hochl\u00e4dt."}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 h-8 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleImageUploadToZone(zone.id);
                                    }}
                                  >
                                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                                    {content?.imageDataUrl ? "Wappen \u00e4ndern" : "Vereinswappen hochladen"}
                                  </Button>
                                  {/* Wappen-Lösch-Button: Bei Trikots nicht anzeigen (nur verschieben erlaubt) */}
                                  {content?.imageDataUrl && productData?.category !== 'Trikot' && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="shrink-0 h-8 w-8"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateZoneContent(zone.id, { imageDataUrl: undefined });
                                      }}
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                    </Button>
                                  )}
                                </div>
                              )}
                              {/* Hinweis bei Trikots: Wappen kann nur verschoben werden */}
                              {productData?.category === 'Trikot' && content?.imageDataUrl && !isZoneLocked(zone) && (
                                <div className="text-xs text-blue-700 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400 rounded-md p-2 flex items-center gap-2">
                                  <Move className="w-3.5 h-3.5 shrink-0" />
                                  <span>Bei Trikots kann das Vereinswappen nur verschoben, nicht gelöscht oder in der Größe verändert werden.</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Abbreviation zone: Image Upload (8x8cm Kürzel) */}
                          {purpose === "abbreviation" && (
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs flex-1"
                                  onClick={() => {
                                    const input = document.createElement("input");
                                    input.type = "file";
                                    input.accept = "image/*,.pdf";
                                    input.onchange = (e) => {
                                      const file = (e.target as HTMLInputElement).files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onload = () => {
                                          updateZoneContent(zone.id, { imageDataUrl: reader.result as string });
                                          toast.success("Kürzel platziert");
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    };
                                    input.click();
                                  }}
                                >
                                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                                  {content?.imageDataUrl || content?.imageUrl ? "Kürzel ändern" : "Kürzel hochladen"}
                                </Button>
                                {(content?.imageDataUrl || content?.imageUrl) && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="shrink-0 h-8 w-8"
                                    onClick={() => updateZoneContent(zone.id, { imageDataUrl: "", imageUrl: "" })}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </div>
                          )}

                          {/* Logo zones: Image Upload (allgemeiner Logo-Upload, z.B. Sponsor) */}
                          {purpose === "logo" && (
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 h-8 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleImageUploadToZone(zone.id);
                                  }}
                                >
                                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                                  {content?.imageDataUrl ? "Datei ändern" : "Datei hochladen (PDF bevorzugt)"}
                                </Button>
                                {content?.imageDataUrl && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="shrink-0 h-8 w-8"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateZoneContent(zone.id, { imageDataUrl: undefined });
                                    }}
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                  </Button>
                                )}
                              </div>
                          )}

                          {/* Player Name/Number: Auto-filled */}
                          {(purpose === "playerName" || purpose === "playerNumber") && (
                            <div className="text-xs text-muted-foreground bg-accent/50 rounded-md p-2">
                              {activePlayer ? (
                                <span
                                  className="text-foreground font-medium"
                                  style={{
                                    fontFamily: zone.fontFamily || undefined,
                                    fontWeight: (zone.fontWeight as any) || "700",
                                  }}
                                >
                                  {purpose === "playerName"
                                    ? activePlayer.name
                                    : activePlayer.number}
                                </span>
                              ) : (
                                <span>
                                  Wähle einen Spieler aus der Mannschaftsliste, um{" "}
                                  {purpose === "playerName" ? "den Namen" : "die Nummer"} automatisch
                                  zu platzieren.
                                </span>
                              )}
                            </div>
                          )}

                          {/* Landesverband-Regeln für Nummern-Zonen */}
                          {purpose === "playerNumber" && numberRules && productData?.category === 'Trikot' && (
                            <div className="text-xs rounded-md p-2 mt-1 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <Info className="w-3.5 h-3.5 shrink-0" />
                                <span className="font-semibold">Verbandsregeln{orgStateName ? ` (${orgStateName})` : ""}</span>
                              </div>
                              <div className="space-y-0.5 ml-5">
                                {zone.side === "back" || zone.partId === null ? (
                                  <p>Rückennummer: mind. <strong>{numberRules.backMinHeight} cm</strong> Höhe
                                    {numberRules.backRequired && <Badge variant="outline" className="ml-1 text-[9px] px-1 py-0 border-blue-300">Pflicht</Badge>}
                                  </p>
                                ) : (
                                  numberRules.frontMinHeight && (
                                    <p>Brustnummer: mind. <strong>{numberRules.frontMinHeight} cm</strong> Höhe
                                      {numberRules.frontRequired && <Badge variant="outline" className="ml-1 text-[9px] px-1 py-0 border-blue-300">Pflicht</Badge>}
                                    </p>
                                  )
                                )}
                                <p className="text-[10px] opacity-75">Nummernkreis: {numberRules.numberRange.min}–{numberRules.numberRange.max} | {numberRules.source}</p>
                                {zone.heightCm && zone.heightCm < (zone.side === "back" ? numberRules.backMinHeight : (numberRules.frontMinHeight || 0)) && (
                                  <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 mt-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span className="font-medium">Aktuelle Höhe ({zone.heightCm} cm) unterschreitet Mindestmaß!</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Player Initials: Auto-filled */}
                          {purpose === "playerInitials" && (
                            <div className="text-xs text-muted-foreground bg-accent/50 rounded-md p-2">
                              {activePlayer ? (
                                <span
                                  className="text-foreground font-medium"
                                  style={{
                                    fontFamily: zone.fontFamily || undefined,
                                    fontWeight: (zone.fontWeight as any) || "700",
                                  }}
                                >
                                  {activePlayer.name
                                    .split(/[\s-]+/)
                                    .map((part: string) => part.charAt(0).toUpperCase())
                                    .filter(Boolean)
                                    .slice(0, 3)
                                    .join("")}
                                </span>
                              ) : (
                                <span>
                                  Wähle einen Spieler aus der Mannschaftsliste, um das Kürzel automatisch zu platzieren.
                                </span>
                              )}
                            </div>
                          )}

                          {/* Club Name: Auto-filled */}
                          {purpose === "clubName" && (
                            <div className={`text-xs rounded-md p-2 ${isZoneLocked(zone) ? "text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400" : "text-muted-foreground bg-accent/50"}`}>
                              {isZoneLocked(zone) && (
                                <div className="flex items-center gap-1.5 mb-1">
                                  <Lock className="w-3 h-3" />
                                  <span className="font-medium">Vom Verein festgelegt</span>
                                </div>
                              )}
                              {clubName ? (
                                <span
                                  className="text-foreground font-medium"
                                  style={{
                                    fontFamily: zone.fontFamily || undefined,
                                    fontWeight: (zone.fontWeight as any) || "700",
                                  }}
                                >
                                  {clubName}
                                </span>
                              ) : (
                                <span>
                                  {isZoneLocked(zone)
                                    ? "Vereinsname wird automatisch gesetzt."
                                    : "Gib oben den Vereinsnamen ein, um ihn automatisch zu platzieren."}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Trainer-Farbauswahl für Text-Zonen (CMYK) */}
                          {(purpose === "playerName" || purpose === "playerNumber" || purpose === "playerInitials" || (purpose === "clubName" && !isZoneLocked(zone))) && (
                            <div className="mt-1">
                              <CmykColorPicker
                                value={content?.fontColor || zone.fontColor || "#ffffff"}
                                onChange={(hex) => updateZoneContent(zone.id, { fontColor: hex })}
                                label="Textfarbe (CMYK)"
                              />
                            </div>
                          )}

                          {/* Custom zones: Free text input */}
                          {purpose === "custom" && (zone.type === "text" || zone.type === "both") && (
                            <div className="space-y-2">
                              <Input
                                placeholder="Text eingeben..."
                                value={content?.text || ""}
                                className="h-8 text-xs sm:text-sm"
                                style={{ fontFamily: zone.fontFamily || undefined }}
                                onChange={(e) =>
                                  updateZoneContent(zone.id, { text: e.target.value })
                                }
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="flex gap-2 flex-wrap">
                                {/* Feldgröße in cm (nur Anzeige - wird im Admin definiert) */}
                                {(zone.widthCm || zone.heightCm) && (
                                  <div className="flex items-center gap-1.5">
                                    <Label className="text-xs text-muted-foreground">Feld:</Label>
                                    <span className="text-xs text-muted-foreground">
                                      {zone.widthCm ? `${zone.widthCm}` : "–"} × {zone.heightCm ? `${zone.heightCm}` : "–"} cm
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1.5">
                                  <CmykColorPicker
                                    value={content?.fontColor || zone.fontColor || "#ffffff"}
                                    onChange={(hex) => updateZoneContent(zone.id, { fontColor: hex })}
                                    label="Farbe (CMYK)"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Both zones: Image Upload option */}
                          {purpose === "custom" && zone.type === "both" && !content?.text && (
                            <div className="flex gap-2 mt-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 h-7 text-[10px]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleImageUploadToZone(zone.id);
                                }}
                              >
                                <Upload className="w-3 h-3 mr-1" />
                                 Datei hochladen (PDF bevorzugt)
                              </Button>
                            </div>
                          )}

                          {/* Sponsor-Vorlagen-Auswahl */}
                          {(purpose === "custom" || purpose === "logo") && sponsorTemplates && sponsorTemplates.length > 0 && (
                            <div className="mt-2">
                              <Label className="text-[10px] text-muted-foreground mb-1 block">Sponsor-Vorlagen</Label>
                              <div className="flex gap-1.5 flex-wrap">
                                {sponsorTemplates.map((tpl: { id: number; name: string; logoUrl: string; }) => (
                                  <button
                                    key={tpl.id}
                                    draggable
                                    onDragStart={(e) => {
                                      dragSponsorRef.current = tpl;
                                      e.dataTransfer.effectAllowed = "copy";
                                      e.dataTransfer.setData("text/plain", tpl.name);
                                      // Kleines Drag-Ghost-Element
                                      const ghost = document.createElement("div");
                                      ghost.style.cssText = "padding:4px 10px;background:#2563eb;color:#fff;border-radius:6px;font-size:12px;font-weight:600;white-space:nowrap;position:absolute;top:-1000px;";
                                      ghost.textContent = tpl.name;
                                      document.body.appendChild(ghost);
                                      e.dataTransfer.setDragImage(ghost, ghost.offsetWidth / 2, ghost.offsetHeight / 2);
                                      requestAnimationFrame(() => document.body.removeChild(ghost));
                                    }}
                                    onDragEnd={() => {
                                      dragSponsorRef.current = null;
                                      setDragOverZoneId(null);
                                    }}
                                    className={`group relative border rounded p-1 hover:border-primary transition-colors cursor-grab active:cursor-grabbing ${
                                      (tpl.logoUrl && content?.imageUrl === tpl.logoUrl) || (!tpl.logoUrl && content?.text === tpl.name)
                                        ? "border-primary bg-primary/5"
                                        : "border-border"
                                    }`}
                                    title={`${tpl.name} – Auf eine Zone ziehen oder klicken`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (tpl.logoUrl) {
                                        updateZoneContent(zone.id, { imageUrl: tpl.logoUrl, text: "" });
                                      } else {
                                        updateZoneContent(zone.id, { text: tpl.name, imageUrl: "" });
                                      }
                                      toast.success(`Sponsor "${tpl.name}" eingesetzt`);
                                    }}
                                  >
                                    <GripVertical className="absolute top-0.5 right-0.5 w-3 h-3 text-muted-foreground/40 group-hover:text-muted-foreground/70" />
                                    {tpl.logoUrl ? (
                                      <img
                                        src={storageUrl(tpl.logoUrl)}
                                        alt={tpl.name}
                                        className="w-10 h-10 object-contain rounded"
                                        draggable={false}
                                      />
                                    ) : (
                                      <div className="w-10 h-10 flex items-center justify-center text-[8px] text-center leading-tight font-medium">
                                        {tpl.name.length > 12 ? tpl.name.substring(0, 12) + "..." : tpl.name}
                                      </div>
                                    )}
                                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] text-muted-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                      {tpl.name}
                                    </span>
                                  </button>
                                ))}
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
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-sm sm:text-base">Mannschaftsliste</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nr."
                        value={newPlayerNumber}
                        onChange={(e) => setNewPlayerNumber(e.target.value)}
                        className="w-14 sm:w-16 h-8 text-xs sm:text-sm"
                      />
                      <Input
                        placeholder="Name"
                        value={newPlayerName}
                        onChange={(e) => setNewPlayerName(e.target.value)}
                        className="flex-1 h-8 text-xs sm:text-sm"
                        onKeyDown={(e) => e.key === "Enter" && addPlayer()}
                      />
                      <Button size="sm" className="h-8 shrink-0" onClick={addPlayer}>
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={handleCsvImport}
                      >
                        <Upload className="w-3.5 h-3.5 mr-1.5" />
                        CSV importieren
                      </Button>
                      {players.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => {
                            setPlayers([]);
                            setActivePlayerIdx(null);
                          }}
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1" />
                          Leeren
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
                          <div
                            key={idx}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                              activePlayerIdx === idx
                                ? "bg-primary/10 text-primary"
                                : "hover:bg-accent"
                            }`}
                            onClick={() =>
                              setActivePlayerIdx(activePlayerIdx === idx ? null : idx)
                            }
                          >
                            <span className="w-7 sm:w-8 text-center font-mono text-xs sm:text-sm font-bold">
                              {player.number || "-"}
                            </span>
                            <span className="flex-1 text-xs sm:text-sm font-medium truncate">
                              {player.name}
                            </span>
                            {player.size && (
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 shrink-0">
                                {player.size}
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                removePlayer(idx);
                              }}
                            >
                              <Trash2 className="w-3 h-3 text-muted-foreground" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {players.length > 0 && (
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        Klicke auf einen Spieler, um Name und Nummer automatisch auf dem Textil zu
                        platzieren.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      {/* Save Design Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Design speichern</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="design-name">Name des Designs</Label>
              <Input
                id="design-name"
                placeholder="z.B. Heimtrikot 2026, Auswärts-Design..."
                value={designName}
                onChange={(e) => setDesignName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveAsNew()}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Kategorie</Label>
              <div className="flex gap-2 flex-wrap">
                {(["heimtrikot", "auswaertstrikot", "training", "sonstiges"] as const).map((cat) => (
                  <Button
                    key={cat}
                    variant={designCategory === cat ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                    onClick={() => setDesignCategory(cat)}
                  >
                    {cat === "heimtrikot" ? "Heimtrikot" : cat === "auswaertstrikot" ? "Auswärtstrikot" : cat === "training" ? "Training" : "Sonstiges"}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSaveAsNew} disabled={savingDesign || !designName.trim()}>
              {savingDesign ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Design Dialog */}
      <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Gespeicherte Designs laden</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4 max-h-96 overflow-y-auto">
            {!savedDesigns || savedDesigns.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Noch keine Designs gespeichert</p>
            ) : (
              savedDesigns.map((design: any) => (
                <div key={design.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer group" onClick={() => handleLoadDesign(design)}>
                  {/* Thumbnail */}
                  {design.thumbnailUrl ? (
                    <div className="w-16 h-16 rounded-md overflow-hidden bg-muted shrink-0 border">
                      <img src={storageUrl(design.thumbnailUrl)} alt={design.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-md bg-muted shrink-0 border flex items-center justify-center">
                      <Shirt className="w-6 h-6 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{design.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {design.category && design.category !== "sonstiges" && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {design.category === "heimtrikot" ? "Heim" : design.category === "auswaertstrikot" ? "Auswärts" : design.category === "training" ? "Training" : "Sonstiges"}
                        </Badge>
                      )}
                      {design.isOrgTemplate && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          Vereinsvorlage
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(design.updatedAt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100" title="Duplizieren" onClick={(e) => {
                      e.stopPropagation();
                      setDuplicateSourceId(design.id);
                      setDuplicateName(design.name + " (Kopie)");
                      setDuplicateDialogOpen(true);
                    }}>
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate({ id: design.id }); }}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Duplicate Design Dialog */}
      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Design duplizieren</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name der Kopie</Label>
              <Input
                value={duplicateName}
                onChange={(e) => setDuplicateName(e.target.value)}
                placeholder="Name für die Kopie..."
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Das Design wird für das aktuelle Team dupliziert.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={() => {
              if (!duplicateSourceId || !teamIdParam) return;
              duplicateMutation.mutate({
                sourceId: duplicateSourceId,
                targetTeamId: teamIdParam,
                newName: duplicateName.trim() || undefined,
              });
            }} disabled={!duplicateName.trim()}>
              Duplizieren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

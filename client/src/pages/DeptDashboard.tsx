import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import {
  Building2,
  Image,
  Loader2,
  LogIn,
  Plus,
  Shield,
  Star,
  StarOff,
  Trash2,
  Type,
  Upload,
  UserPlus,
  Users,
  MessageCircle,
  Send,
  ArrowLeft,
  Package,
  Factory,
  Truck,
  CircleDot,
  ChevronRight,
  Library,
  FolderOpen,
  Lock,
  Shirt,
  CheckCircle2,
  HandCoins,
  FileText,
} from "lucide-react";
import { useState, useRef, useCallback, useMemo } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderCommentThread } from "./OrderCommentThread";
import { storageUrl } from "@/lib/utils";
import { PdfPreview } from "@/components/PdfPreview";
import { SponsorLogoImage } from "@/components/SponsorLogoImage";

/** Vordefinierte Google-Fonts-Auswahl */
const PRESET_FONTS = [
  "Inter",
  "Oswald",
  "Bebas Neue",
  "Roboto",
  "Montserrat",
  "Poppins",
  "Open Sans",
  "Lato",
  "Raleway",
  "Anton",
  "Barlow Condensed",
  "Teko",
  "Russo One",
  "Orbitron",
  "Permanent Marker",
];

export default function DeptDashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  // Lade alle Mitgliedschaften des Users
  const { data: memberships, isLoading: membLoading } =
    trpc.membership.mine.useQuery(undefined, { enabled: isAuthenticated });

  // Finde die department_lead Mitgliedschaft
  const deptLeadMembership = memberships?.find(
    (m) => m.role === "department_lead"
  );

  const orgId = deptLeadMembership?.orgId || 0;
  const deptId = deptLeadMembership?.departmentId || 0;

  // Queries (nur wenn orgId und deptId vorhanden)
  const { data: org } = trpc.org.getById.useQuery(
    { id: orgId },
    { enabled: isAuthenticated && orgId > 0 }
  );
  const { data: dept } = trpc.department.getById.useQuery(
    { id: deptId, orgId },
    { enabled: isAuthenticated && deptId > 0 && orgId > 0 }
  );
  const { data: logos } = trpc.orgLogo.list.useQuery(
    { orgId },
    { enabled: isAuthenticated && orgId > 0 }
  );
  const { data: fonts } = trpc.deptFont.list.useQuery(
    { departmentId: deptId, orgId },
    { enabled: isAuthenticated && deptId > 0 && orgId > 0 }
  );
  const { data: members } = trpc.membership.listByDepartment.useQuery(
    { departmentId: deptId, orgId },
    { enabled: isAuthenticated && deptId > 0 && orgId > 0 }
  );

  // Loading
  if (authLoading || membLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Nicht angemeldet
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Shield className="w-12 h-12 text-primary mx-auto mb-2" />
            <CardTitle>Anmeldung erforderlich</CardTitle>
            <CardDescription>
              Bitte melden Sie sich an, um das Spartenleiter-Dashboard zu
              nutzen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button className="w-full">
                <LogIn className="w-4 h-4 mr-2" />
                Anmelden
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Keine Spartenleiter-Mitgliedschaft: Zum Vereins-Onboarding weiterleiten
  if (!deptLeadMembership) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Building2 className="w-12 h-12 text-primary mx-auto mb-2" />
            <CardTitle>Willkommen beim Textil-Konfigurator</CardTitle>
            <CardDescription>
              Sie sind noch keinem Verein zugeordnet. Erstellen Sie einen neuen Verein oder lassen Sie sich von einem Vereinsverantwortlichen einladen.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/verwaltung/org">
              <Button className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Verein anlegen
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">
                Zurück zur Startseite
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-30">
        <div className="container flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">
                {dept?.name || "Abteilung"}
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {org?.name || "Organisation"}
                </span>
                <Badge className="text-xs">Spartenleiter</Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="sm">
                Startseite
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="container py-6 space-y-6">
        {/* Übersichtskarten */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Image className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{logos?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Logos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Type className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{fonts?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Schriftarten</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {members?.filter((m) => m.role === "trainer").length || 0}
                </p>
                <p className="text-xs text-muted-foreground">Trainer</p>
              </div>
            </CardContent>
          </Card>
        </div>

         {/* Logo-Verwaltung */}
        <LogoSection orgId={orgId} logos={logos} />
        <Separator />
        {/* Sponsoren-Verwaltung */}
        <DeptSponsorSection orgId={orgId} deptId={deptId} />
        <Separator />
        {/* Schriftarten-Verwaltung */}
        <FontSection orgId={orgId} deptId={deptId} fonts={fonts} />

        <Separator />

        {/* Trainer-Verwaltung */}
        <TrainerSection
          orgId={orgId}
          deptId={deptId}
          members={members}
        />

        <Separator />

        {/* Kollektionen */}
        <DeptCollectionsSection orgId={orgId} deptId={deptId} />

        <Separator />

        {/* Bestellübersicht */}
        <OrderOverviewSection orgId={orgId} deptId={deptId} />
      </div>
    </div>
  );
}

// ─── Logo Section ─────────────────────────────────────────────────────────────
function LogoSection({
  orgId,
  logos,
}: {
  orgId: number;
  logos: any[] | undefined;
}) {
  const utils = trpc.useUtils();
  const [showUpload, setShowUpload] = useState(false);
  const [logoName, setLogoName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isDefault, setIsDefault] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadLogo = trpc.orgLogo.upload.useMutation({
    onSuccess: () => {
      utils.orgLogo.list.invalidate({ orgId });
      setShowUpload(false);
      setLogoName("");
      setLogoFile(null);
      setLogoPreview(null);
      setIsDefault(false);
      toast.success("Logo hochgeladen");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteLogo = trpc.orgLogo.delete.useMutation({
    onSuccess: () => {
      utils.orgLogo.list.invalidate({ orgId });
      toast.success("Logo gelöscht");
    },
    onError: (e) => toast.error(e.message),
  });

  const setDefaultLogo = trpc.orgLogo.update.useMutation({
    onSuccess: () => {
      utils.orgLogo.list.invalidate({ orgId });
      toast.success("Standard-Logo gesetzt");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    },
    []
  );

  const handleUpload = useCallback(async () => {
    if (!logoFile || !logoName.trim()) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1] || dataUrl;
      uploadLogo.mutate({
        orgId,
        name: logoName,
        imageBase64: base64,
        mimeType: logoFile.type,
        isDefault,
      });
    };
    reader.readAsDataURL(logoFile);
  }, [logoFile, logoName, isDefault, orgId, uploadLogo]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Image className="w-5 h-5 text-blue-600" />
            Logo-Verwaltung
          </h2>
          <p className="text-sm text-muted-foreground">
            Laden Sie Logo-Varianten hoch, die automatisch im Konfigurator
            verwendet werden.
          </p>
        </div>
        <Dialog open={showUpload} onOpenChange={setShowUpload}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Logo hochladen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Logo hochladen</DialogTitle>
              <DialogDescription>
                Laden Sie eine neue Logo-Variante hoch.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Bezeichnung</Label>
                <Input
                  value={logoName}
                  onChange={(e) => setLogoName(e.target.value)}
                  placeholder="z.B. Farb-Logo, SW-Logo, Mini-Logo"
                />
              </div>
              <div className="space-y-2">
                <Label>Bilddatei</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Vorschau"
                      className="max-h-32 mx-auto"
                    />
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Klicken zum Auswählen (max. 5 MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefaultLogo"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="isDefaultLogo">
                  Als Standard-Logo setzen
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowUpload(false)}
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleUpload}
                disabled={
                  !logoName.trim() || !logoFile || uploadLogo.isPending
                }
              >
                {uploadLogo.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Hochladen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!logos || logos.length === 0 ? (
        <div className="text-center py-10 bg-muted/30 rounded-xl border border-dashed">
          <Image className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            Noch keine Logos hochgeladen
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Logos werden automatisch im Konfigurator für Ihre Abteilung
            verwendet.
          </p>
          <Button
            className="mt-4"
            size="sm"
            onClick={() => setShowUpload(true)}
          >
            <Upload className="w-4 h-4 mr-2" />
            Erstes Logo hochladen
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {logos.map((logo) => (
            <Card key={logo.id} className="overflow-hidden">
              <div className="aspect-square bg-muted/30 flex items-center justify-center p-4 relative">
                <img
                  src={storageUrl(logo.imageUrl)}
                  alt={logo.name}
                  className="max-w-full max-h-full object-contain"
                />
                {logo.isDefault && (
                  <Badge className="absolute top-2 right-2 gap-1">
                    <Star className="w-3 h-3" />
                    Standard
                  </Badge>
                )}
              </div>
              <CardContent className="pt-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{logo.name}</p>
                  <div className="flex items-center gap-1">
                    {!logo.isDefault && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          setDefaultLogo.mutate({
                            id: logo.id,
                            orgId,
                            isDefault: true,
                          })
                        }
                        title="Als Standard setzen"
                      >
                        <StarOff className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => {
                        if (
                          confirm(
                            `Logo "${logo.name}" wirklich löschen?`
                          )
                        )
                          deleteLogo.mutate({ id: logo.id, orgId });
                      }}
                      title="Löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Dept Sponsor Section ──────────────────────────────────────────────────────────────────────
function DeptSponsorSection({ orgId, deptId }: { orgId: number; deptId: number }) {
  const utils = trpc.useUtils();
  const { data: sponsors, isLoading } = trpc.sponsorTemplate.list.useQuery({ orgId });
  const { data: teams } = trpc.team.listByOrg.useQuery({ orgId });
  const [showDialog, setShowDialog] = useState(false);
  const [sponsorForm, setSponsorForm] = useState({
    name: "",
    sponsorType: "spartensponsor" as "spartensponsor" | "mannschaftssponsor",
    obligation: "nicht_verpflichtend" as "alle_produkte" | "nur_trikot" | "nicht_verpflichtend",
    departmentId: deptId,
    teamId: undefined as number | undefined,
    contactFirstName: "",
    contactLastName: "",
    contactEmail: "",
    contactPhone: "",
    street: "",
    zip: "",
    city: "",
    country: "Deutschland",
    vatId: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createSponsor = trpc.sponsorTemplate.create.useMutation({
    onSuccess: () => {
      utils.sponsorTemplate.list.invalidate({ orgId });
      setShowDialog(false);
      resetForm();
      toast.success("Sponsor erfolgreich angelegt");
    },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => {
    setSponsorForm({
      name: "",
      sponsorType: "spartensponsor",
      obligation: "nicht_verpflichtend",
      departmentId: deptId,
      teamId: undefined,
      contactFirstName: "",
      contactLastName: "",
      contactEmail: "",
      contactPhone: "",
      street: "",
      zip: "",
      city: "",
      country: "Deutschland",
      vatId: "",
    });
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setLogoPreview(null);
    }
  };

  const handleCreate = async () => {
    if (!logoFile || !sponsorForm.name.trim()) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1] || dataUrl;
      createSponsor.mutate({
        orgId,
        name: sponsorForm.name,
        logoBase64: base64,
        mimeType: logoFile.type,
        sponsorType: sponsorForm.sponsorType,
        obligation: sponsorForm.obligation,
        departmentId: sponsorForm.departmentId,
        teamId: sponsorForm.teamId,
        contactFirstName: sponsorForm.contactFirstName || undefined,
        contactLastName: sponsorForm.contactLastName || undefined,
        contactEmail: sponsorForm.contactEmail || undefined,
        contactPhone: sponsorForm.contactPhone || undefined,
        street: sponsorForm.street || undefined,
        zip: sponsorForm.zip || undefined,
        city: sponsorForm.city || undefined,
        country: sponsorForm.country || undefined,
        vatId: sponsorForm.vatId || undefined,
      });
    };
    reader.readAsDataURL(logoFile);
  };

  // Filter: Nur Sponsoren dieser Sparte anzeigen
  const deptSponsors = sponsors?.filter(s =>
    s.sponsorType === "hauptsponsor" ||
    (s.sponsorType === "spartensponsor" && s.departmentId === deptId) ||
    (s.sponsorType === "mannschaftssponsor" && s.departmentId === deptId)
  ) || [];

  const deptTeams = teams?.filter(t => t.departmentId === deptId) || [];

  const canCreate = sponsorForm.name.trim() && logoFile &&
    sponsorForm.contactFirstName.trim() && sponsorForm.contactLastName.trim() &&
    sponsorForm.contactEmail.trim() &&
    (sponsorForm.sponsorType !== "mannschaftssponsor" || sponsorForm.teamId);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <HandCoins className="w-5 h-5 text-green-600" />
            Sponsoren
          </h2>
          <p className="text-sm text-muted-foreground">
            Verwalten Sie die Sponsoren Ihrer Sparte.
          </p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Sponsor hinzufügen
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Neuen Sponsor anlegen</DialogTitle>
              <DialogDescription>Erfassen Sie die Daten des neuen Sponsors.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Sponsorname */}
              <div className="space-y-2">
                <Label>Sponsorname *</Label>
                <Input
                  value={sponsorForm.name}
                  onChange={(e) => setSponsorForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="z.B. Stadtwerke München"
                />
              </div>
              {/* Sponsor-Typ */}
              <div className="space-y-2">
                <Label>Sponsor-Typ</Label>
                <Select
                  value={sponsorForm.sponsorType}
                  onValueChange={(v) => setSponsorForm(p => ({ ...p, sponsorType: v as any }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spartensponsor">Spartensponsor</SelectItem>
                    <SelectItem value="mannschaftssponsor">Mannschaftssponsor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Mannschaft (bei Mannschaftssponsor) */}
              {sponsorForm.sponsorType === "mannschaftssponsor" && (
                <div className="space-y-2">
                  <Label>Mannschaft *</Label>
                  <Select
                    value={sponsorForm.teamId?.toString() || ""}
                    onValueChange={(v) => setSponsorForm(p => ({ ...p, teamId: parseInt(v) }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Mannschaft wählen" /></SelectTrigger>
                    <SelectContent>
                      {deptTeams.map(t => (
                        <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {/* Verpflichtung */}
              <div className="space-y-2">
                <Label>Verpflichtung</Label>
                <Select
                  value={sponsorForm.obligation}
                  onValueChange={(v) => setSponsorForm(p => ({ ...p, obligation: v as any }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nicht_verpflichtend">Nicht verpflichtend</SelectItem>
                    <SelectItem value="nur_trikot">Nur Trikot</SelectItem>
                    <SelectItem value="alle_produkte">Alle Produkte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Kontaktperson */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Kontaktperson *</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Vorname</Label>
                    <Input
                      value={sponsorForm.contactFirstName}
                      onChange={(e) => setSponsorForm(p => ({ ...p, contactFirstName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Nachname</Label>
                    <Input
                      value={sponsorForm.contactLastName}
                      onChange={(e) => setSponsorForm(p => ({ ...p, contactLastName: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="space-y-1">
                    <Label className="text-xs">E-Mail</Label>
                    <Input
                      type="email"
                      value={sponsorForm.contactEmail}
                      onChange={(e) => setSponsorForm(p => ({ ...p, contactEmail: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Telefon</Label>
                    <Input
                      value={sponsorForm.contactPhone}
                      onChange={(e) => setSponsorForm(p => ({ ...p, contactPhone: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              {/* Firmenadresse */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Firmenadresse</h4>
                <div className="space-y-2">
                  <Input
                    value={sponsorForm.street}
                    onChange={(e) => setSponsorForm(p => ({ ...p, street: e.target.value }))}
                    placeholder="Straße + Hausnr."
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      value={sponsorForm.zip}
                      onChange={(e) => setSponsorForm(p => ({ ...p, zip: e.target.value }))}
                      placeholder="PLZ"
                    />
                    <Input
                      className="col-span-2"
                      value={sponsorForm.city}
                      onChange={(e) => setSponsorForm(p => ({ ...p, city: e.target.value }))}
                      placeholder="Ort"
                    />
                  </div>
                </div>
              </div>
              {/* USt-IdNr */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Rechnungsdaten</h4>
                <div className="space-y-1">
                  <Label className="text-xs">USt-IdNr.</Label>
                  <Input
                    value={sponsorForm.vatId}
                    onChange={(e) => setSponsorForm(p => ({ ...p, vatId: e.target.value }))}
                    placeholder="DE123456789"
                  />
                </div>
              </div>
              {/* Logo-Upload */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Sponsor-Logo *</h4>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="Vorschau" className="max-h-24 mx-auto" />
                  ) : logoFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="w-8 h-8 text-red-500" />
                      <span className="text-sm">{logoFile.name}</span>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">PNG, JPG, SVG, PDF (max. 10 MB)</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowDialog(false); resetForm(); }}>Abbrechen</Button>
              <Button
                onClick={handleCreate}
                disabled={!canCreate || createSponsor.isPending}
              >
                {createSponsor.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Sponsor erstellen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sponsor-Liste */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : deptSponsors.length === 0 ? (
        <div className="text-center py-8 bg-muted/30 rounded-xl border border-dashed">
          <HandCoins className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Noch keine Sponsoren angelegt</p>
          <Button className="mt-4" size="sm" onClick={() => setShowDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ersten Sponsor anlegen
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {deptSponsors.map((sponsor) => (
            <Card key={sponsor.id} className="overflow-hidden">
              <div className="aspect-video bg-muted/30 flex items-center justify-center p-4">
                {sponsor.logoMimeType?.includes("pdf") || sponsor.logoUrl?.endsWith(".pdf") ? (
                  <PdfPreview url={storageUrl(sponsor.logoUrl)} className="max-h-full max-w-full" />
                ) : (
                  <SponsorLogoImage src={storageUrl(sponsor.logoUrl)} alt={sponsor.name} className="max-w-full max-h-full object-contain" />
                )}
              </div>
              <CardContent className="pt-3">
                <p className="font-medium text-sm">{sponsor.name}</p>
                <div className="flex gap-1 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {sponsor.sponsorType === "hauptsponsor" ? "Hauptsponsor" :
                     sponsor.sponsorType === "spartensponsor" ? "Spartensponsor" : "Mannschaftssponsor"}
                  </Badge>
                  {sponsor.obligation !== "nicht_verpflichtend" && (
                    <Badge className="text-xs">
                      {sponsor.obligation === "alle_produkte" ? "Alle Produkte" : "Nur Trikot"}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Font Section ───────────────────────────────────────────────────────────────────────────────
function FontSection({
  orgId,
  deptId,
  fonts,
}: {
  orgId: number;
  deptId: number;
  fonts: any[] | undefined;
}) {
  const utils = trpc.useUtils();
  const [showAdd, setShowAdd] = useState(false);
  const [fontFamily, setFontFamily] = useState("");
  const [fontUrl, setFontUrl] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [useCustom, setUseCustom] = useState(false);

  const approveFont = trpc.deptFont.approve.useMutation({
    onSuccess: () => {
      utils.deptFont.list.invalidate({ departmentId: deptId, orgId });
      setShowAdd(false);
      setFontFamily("");
      setFontUrl("");
      setIsDefault(false);
      setUseCustom(false);
      toast.success("Schriftart freigegeben");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteFont = trpc.deptFont.delete.useMutation({
    onSuccess: () => {
      utils.deptFont.list.invalidate({ departmentId: deptId, orgId });
      toast.success("Schriftart entfernt");
    },
    onError: (e) => toast.error(e.message),
  });

  const setDefaultFont = trpc.deptFont.update.useMutation({
    onSuccess: () => {
      utils.deptFont.list.invalidate({ departmentId: deptId, orgId });
      toast.success("Standard-Schrift gesetzt");
    },
    onError: (e) => toast.error(e.message),
  });

  // Google Fonts Vorschau laden
  const loadFontPreview = (family: string) => {
    const linkId = `gf-preview-${family.replace(/\s+/g, "-")}`;
    if (document.getElementById(linkId)) return;
    const link = document.createElement("link");
    link.id = linkId;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}&display=swap`;
    document.head.appendChild(link);
  };

  fonts?.forEach((f) => loadFontPreview(f.fontFamily));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Type className="w-5 h-5 text-purple-600" />
            Schriftarten-Freigabe
          </h2>
          <p className="text-sm text-muted-foreground">
            Schriften, die in Ihrer Abteilung für Trikots verwendet werden
            dürfen. Die Standard-Schrift wird automatisch vorausgewählt.
          </p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Schrift freigeben
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Schriftart freigeben</DialogTitle>
              <DialogDescription>
                Wählen Sie eine Schriftart aus der Liste oder geben Sie eine
                eigene an.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Toggle: Vordefiniert vs. Custom */}
              <div className="flex items-center gap-4">
                <Button
                  variant={!useCustom ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setUseCustom(false);
                    setFontFamily("");
                    setFontUrl("");
                  }}
                >
                  Aus Liste wählen
                </Button>
                <Button
                  variant={useCustom ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setUseCustom(true);
                    setFontFamily("");
                  }}
                >
                  Eigene Schrift
                </Button>
              </div>

              {!useCustom ? (
                <div className="space-y-2">
                  <Label>Schriftart auswählen</Label>
                  <div className="grid grid-cols-1 gap-1.5 max-h-64 overflow-y-auto border rounded-lg p-2">
                    {PRESET_FONTS.map((font) => {
                      loadFontPreview(font);
                      const alreadyApproved = fonts?.some(
                        (f) =>
                          f.fontFamily.toLowerCase() ===
                          font.toLowerCase()
                      );
                      return (
                        <button
                          key={font}
                          type="button"
                          disabled={alreadyApproved}
                          className={`text-left px-3 py-2 rounded-md transition-colors text-sm ${
                            fontFamily === font
                              ? "bg-primary text-primary-foreground"
                              : alreadyApproved
                                ? "opacity-40 cursor-not-allowed bg-muted"
                                : "hover:bg-muted cursor-pointer"
                          }`}
                          onClick={() => setFontFamily(font)}
                        >
                          <span
                            style={{
                              fontFamily: `'${font}', sans-serif`,
                            }}
                          >
                            {font}
                          </span>
                          {alreadyApproved && (
                            <span className="text-xs ml-2 text-muted-foreground">
                              (bereits freigegeben)
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Schriftart-Name</Label>
                    <Input
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      placeholder="z.B. Meine Custom Font"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Font-URL{" "}
                      <span className="text-muted-foreground">
                        (optional, z.B. Google Fonts CSS-URL)
                      </span>
                    </Label>
                    <Input
                      value={fontUrl}
                      onChange={(e) => setFontUrl(e.target.value)}
                      placeholder="https://fonts.googleapis.com/css2?family=..."
                    />
                  </div>
                </>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefaultFontDept"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="isDefaultFontDept">
                  Als Standard-Schrift der Abteilung setzen
                </Label>
              </div>

              {/* Vorschau */}
              {fontFamily && (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-2">
                    Vorschau:
                  </p>
                  <p
                    className="text-2xl"
                    style={{
                      fontFamily: `'${fontFamily}', sans-serif`,
                    }}
                  >
                    Muster Trikot 2026
                  </p>
                  <p
                    className="text-lg mt-1"
                    style={{
                      fontFamily: `'${fontFamily}', sans-serif`,
                    }}
                  >
                    ABCDEFGHIJKLM 0123456789
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={() =>
                  approveFont.mutate({
                    departmentId: deptId,
                    orgId,
                    fontFamily: fontFamily.trim(),
                    fontUrl: fontUrl.trim() || undefined,
                    isDefault,
                  })
                }
                disabled={!fontFamily.trim() || approveFont.isPending}
              >
                {approveFont.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Freigeben
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!fonts || fonts.length === 0 ? (
        <div className="text-center py-10 bg-muted/30 rounded-xl border border-dashed">
          <Type className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            Noch keine Schriftarten freigegeben
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Geben Sie Schriften frei, die in Ihrer Abteilung für Trikots
            verwendet werden dürfen.
          </p>
          <Button
            className="mt-4"
            size="sm"
            onClick={() => setShowAdd(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Erste Schrift freigeben
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {fonts.map((font) => {
            loadFontPreview(font.fontFamily);
            return (
              <Card key={font.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">
                        {font.fontFamily}
                      </p>
                      {font.isDefault && (
                        <Badge
                          variant="secondary"
                          className="text-xs gap-1"
                        >
                          <Star className="w-3 h-3" />
                          Standard
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {!font.isDefault && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            setDefaultFont.mutate({
                              id: font.id,
                              departmentId: deptId,
                              orgId,
                              isDefault: true,
                            })
                          }
                          title="Als Standard setzen"
                        >
                          <StarOff className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => {
                          if (
                            confirm(
                              `Schrift "${font.fontFamily}" wirklich entfernen?`
                            )
                          )
                            deleteFont.mutate({
                              id: font.id,
                              departmentId: deptId,
                              orgId,
                            });
                        }}
                        title="Entfernen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="border rounded-lg p-3 bg-muted/20">
                    <p
                      className="text-lg"
                      style={{
                        fontFamily: `'${font.fontFamily}', sans-serif`,
                      }}
                    >
                      Muster Trikot 2026
                    </p>
                    <p
                      className="text-sm text-muted-foreground"
                      style={{
                        fontFamily: `'${font.fontFamily}', sans-serif`,
                      }}
                    >
                      ABCDEFGHIJKLM 0123456789
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Trainer Section ──────────────────────────────────────────────────────────
function TrainerSection({
  orgId,
  deptId,
  members,
}: {
  orgId: number;
  deptId: number;
  members: any[] | undefined;
}) {
  const utils = trpc.useUtils();
  const [showInvite, setShowInvite] = useState(false);
  const [trainerName, setTrainerName] = useState("");
  const [trainerEmail, setTrainerEmail] = useState("");
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState<{
    email: string;
    password: string;
    name: string;
  } | null>(null);

  const addTrainer = trpc.membership.addTrainer.useMutation({
    onSuccess: (data) => {
      utils.membership.listByDepartment.invalidate({
        departmentId: deptId,
        orgId,
      });
      if (data.generatedPassword) {
        setCredentials({
          email: data.userEmail || trainerEmail,
          password: data.generatedPassword,
          name: data.userName || trainerName,
        });
        setShowInvite(false);
        setShowCredentials(true);
      } else {
        setShowInvite(false);
        toast.success(
          `${data.userName || data.userEmail} als Trainer eingeladen`
        );
      }
      setTrainerName("");
      setTrainerEmail("");
    },
    onError: (e) => toast.error(e.message),
  });

  const removeMember = trpc.membership.remove.useMutation({
    onSuccess: () => {
      utils.membership.listByDepartment.invalidate({
        departmentId: deptId,
        orgId,
      });
      toast.success("Trainer entfernt");
    },
    onError: (e) => toast.error(e.message),
  });

  const trainers = members?.filter((m) => m.role === "trainer") || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            Trainer-Verwaltung
          </h2>
          <p className="text-sm text-muted-foreground">
            Laden Sie Trainer ein, die Mannschaften anlegen und Spieler
            verwalten können.
          </p>
        </div>
        <Dialog open={showInvite} onOpenChange={setShowInvite}>
          <DialogTrigger asChild>
            <Button size="sm">
              <UserPlus className="w-4 h-4 mr-2" />
              Trainer einladen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Trainer einladen</DialogTitle>
              <DialogDescription>
                Laden Sie einen Trainer für Ihre Abteilung ein. Der Trainer
                erhält automatisch Zugangsdaten.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">
                  Berechtigungen des Trainers:
                </p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Mannschaften in dieser Abteilung anlegen</li>
                  <li>Spieler zur Mannschaft hinzufügen</li>
                  <li>Trikot-Konfigurationen erstellen</li>
                  <li>
                    Vereinslogo und Schriften werden automatisch zugewiesen
                  </li>
                </ul>
              </div>
              <div className="space-y-2">
                <Label>
                  Name des Trainers{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="text"
                  value={trainerName}
                  onChange={(e) => setTrainerName(e.target.value)}
                  placeholder="Max Mustermann"
                />
              </div>
              <div className="space-y-2">
                <Label>
                  E-Mail-Adresse{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="email"
                  value={trainerEmail}
                  onChange={(e) => setTrainerEmail(e.target.value)}
                  placeholder="trainer@beispiel.de"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowInvite(false)}
              >
                Abbrechen
              </Button>
              <Button
                onClick={() =>
                  addTrainer.mutate({
                    orgId,
                    departmentId: deptId,
                    userName: trainerName,
                    userEmail: trainerEmail,
                  })
                }
                disabled={
                  !trainerName.trim() ||
                  !trainerEmail.trim() ||
                  addTrainer.isPending
                }
              >
                {addTrainer.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Einladen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Credentials Dialog */}
      <Dialog open={showCredentials} onOpenChange={setShowCredentials}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zugangsdaten erstellt</DialogTitle>
            <DialogDescription>
              Der Trainer wurde erfolgreich eingeladen. Bitte teilen Sie die
              folgenden Zugangsdaten mit.
            </DialogDescription>
          </DialogHeader>
          {credentials && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg bg-green-50 border border-green-200 p-4 space-y-3">
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Name
                  </p>
                  <p className="text-sm text-green-700 font-mono">
                    {credentials.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800">
                    E-Mail
                  </p>
                  <p className="text-sm text-green-700 font-mono">
                    {credentials.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Passwort
                  </p>
                  <p className="text-lg text-green-700 font-mono font-bold tracking-wider">
                    {credentials.password}
                  </p>
                </div>
              </div>
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                <p className="font-medium">Wichtig:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>
                    Notieren Sie das Passwort jetzt – es wird nicht erneut
                    angezeigt.
                  </li>
                  <li>
                    Der Trainer wird beim ersten Login aufgefordert, das
                    Passwort zu ändern.
                  </li>
                  <li>
                    Login-Seite:{" "}
                    <span className="font-mono">/login</span>
                  </li>
                </ul>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Zugangsdaten für den Textil-Konfigurator:\nName: ${credentials.name}\nE-Mail: ${credentials.email}\nPasswort: ${credentials.password}\nLogin: ${window.location.origin}/login`
                  );
                  toast.success(
                    "Zugangsdaten in die Zwischenablage kopiert"
                  );
                }}
              >
                Zugangsdaten kopieren
              </Button>
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={() => {
                setShowCredentials(false);
                setCredentials(null);
              }}
            >
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Trainer-Liste */}
      {trainers.length === 0 ? (
        <div className="text-center py-10 bg-muted/30 rounded-xl border border-dashed">
          <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            Noch keine Trainer in Ihrer Abteilung
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Laden Sie Trainer ein, damit diese Mannschaften anlegen können.
          </p>
          <Button
            className="mt-4"
            size="sm"
            onClick={() => setShowInvite(true)}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Ersten Trainer einladen
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {trainers.map((m) => (
            <Card key={m.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-green-500/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-green-600">
                      {(m.userName || m.userEmail || "?")
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {m.userName || m.userEmail}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Trainer
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => {
                    if (
                      confirm(
                        `Trainer "${m.userName || m.userEmail}" wirklich entfernen?`
                      )
                    )
                      removeMember.mutate({ id: m.id, orgId });
                  }}
                  title="Entfernen"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


// ─── Kollektions-Verwaltung (Spartenleiter) ──────────────────────────────────────────
function DeptCollectionsSection({ orgId, deptId }: { orgId: number; deptId: number }) {
  const utils = trpc.useUtils();
  const { data: allCollections, isLoading } = trpc.collection.list.useQuery(
    { orgId },
    { enabled: orgId > 0 }
  );
  const { data: departments } = trpc.department.listByOrg.useQuery(
    { orgId },
    { enabled: orgId > 0 }
  );

  const [showCreate, setShowCreate] = useState(false);
  const [collName, setCollName] = useState("");
  const [collDesc, setCollDesc] = useState("");

  const createColl = trpc.collection.create.useMutation({
    onSuccess: () => {
      utils.collection.list.invalidate({ orgId });
      setShowCreate(false);
      setCollName("");
      setCollDesc("");
      toast.success("Kollektion erstellt");
    },
    onError: (e) => toast.error(e.message),
  });

  const assignColl = trpc.collection.assign.useMutation({
    onSuccess: () => {
      utils.collection.list.invalidate({ orgId });
      toast.success("Kollektion für Sparte freigegeben");
    },
    onError: (e) => toast.error(e.message),
  });

  const unassignColl = trpc.collection.unassign.useMutation({
    onSuccess: () => {
      utils.collection.list.invalidate({ orgId });
      toast.success("Freigabe zurückgenommen");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteColl = trpc.collection.delete.useMutation({
    onSuccess: () => {
      utils.collection.list.invalidate({ orgId });
      toast.success("Kollektion gelöscht");
    },
    onError: (e) => toast.error(e.message),
  });

  // Alle Kollektionen anzeigen (Spartenleiter sieht alles)
  const collections = allCollections || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Library className="w-5 h-5" />
            Kollektionen
          </h2>
          <p className="text-sm text-muted-foreground">
            Verwalten und freigeben von Design-Kollektionen für Ihre Sparte
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Sparten-Kollektion
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sparten-Kollektion erstellen</DialogTitle>
              <DialogDescription>
                Erstellen Sie eine Kollektion, die allen Trainern in Ihrer Sparte zur Verfügung steht.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input placeholder="z.B. Saison 2025/26" value={collName} onChange={(e) => setCollName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Beschreibung (optional)</Label>
                <Input placeholder="Kurze Beschreibung" value={collDesc} onChange={(e) => setCollDesc(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Abbrechen</Button>
              <Button
                onClick={() => createColl.mutate({ name: collName, description: collDesc || undefined, orgId, departmentId: deptId, scope: "department" })}
                disabled={!collName.trim() || createColl.isPending}
              >
                {createColl.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Erstellen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : collections.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>Noch keine Kollektionen vorhanden.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {collections.map((coll: any) => {
            const scopeLabel = coll.scope === "org" ? "Verein" : coll.scope === "department" ? "Sparte" : "Team";
            const scopeColor = coll.scope === "org" ? "bg-purple-100 text-purple-700" : coll.scope === "department" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700";
            const isAssigned = coll.assignedDepartments?.includes(deptId);
            const isMandatory = coll.scope === "org" && coll.enforcement === "mandatory";

            return (
              <Card key={coll.id} className={isMandatory ? "border-destructive/30" : ""}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{coll.name}</span>
                      <Badge variant="outline" className={`text-[10px] ${scopeColor}`}>{scopeLabel}</Badge>
                      {isMandatory && <Badge variant="destructive" className="text-[10px]"><Lock className="w-3 h-3 mr-1" /> Pflicht</Badge>}
                      {isAssigned && <Badge className="text-[10px] bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3 mr-1" /> Freigegeben</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Freigabe-Toggle (nur für nicht-org Kollektionen) */}
                      {coll.scope !== "org" && (
                        isAssigned ? (
                          <Button variant="outline" size="sm" onClick={() => unassignColl.mutate({ collectionId: coll.id, departmentId: deptId })}>
                            Freigabe zurücknehmen
                          </Button>
                        ) : (
                          <Button size="sm" onClick={() => assignColl.mutate({ collectionId: coll.id, departmentId: deptId })}>
                            Für Sparte freigeben
                          </Button>
                        )
                      )}
                      {/* Löschen (nur eigene, nicht Pflicht) */}
                      {!isMandatory && coll.scope !== "org" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                          onClick={() => { if (confirm(`"${coll.name}" löschen?`)) deleteColl.mutate({ id: coll.id }); }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {coll.description && <p className="text-xs text-muted-foreground mt-1">{coll.description}</p>}
                  {coll.items && coll.items.length > 0 && (
                    <div className="flex gap-2 mt-3 overflow-x-auto">
                      {coll.items.slice(0, 6).map((item: any) => (
                        <div key={item.id} className="w-14 h-14 rounded border bg-muted/30 overflow-hidden shrink-0">
                          {item.design?.thumbnailUrl ? (
                            <img src={storageUrl(item.design.thumbnailUrl)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Shirt className="w-5 h-5 text-muted-foreground" /></div>
                          )}
                        </div>
                      ))}
                      {coll.items.length > 6 && (
                        <div className="w-14 h-14 rounded border bg-muted/30 flex items-center justify-center shrink-0">
                          <span className="text-xs text-muted-foreground">+{coll.items.length - 6}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Order Overview Section (Bestellübersicht) ──────────────────────────────────────────
function OrderOverviewSection({
  orgId,
  deptId,
}: {
  orgId: number;
  deptId: number;
}) {
  const utils = trpc.useUtils();
  const { data: overview, isLoading } = trpc.orderOverview.byDepartment.useQuery(
    { departmentId: deptId, orgId },
    { enabled: deptId > 0 && orgId > 0 }
  );
  const updateStatusMutation = trpc.orderOverview.updateStatus.useMutation({
    onSuccess: () => {
      utils.orderOverview.byDepartment.invalidate();
      toast.success("Bestellstatus aktualisiert");
    },
    onError: (err) => toast.error(err.message),
  });
  const [statusFilter, setStatusFilter] = useState<"all" | "offen" | "ausstehend" | "bestaetigt">("all");
  const [sortBy, setSortBy] = useState<"name" | "status">("name");
  const [selectedTeam, setSelectedTeam] = useState<{
    teamId: number;
    teamName: string;
    trainerName: string;
  } | null>(null);

  // Kommentar-Anzahl pro Team laden
  const teamIds = useMemo(() => (overview || []).map((t) => t.teamId), [overview]);
  const { data: commentCounts } = trpc.orderComment.countByTeams.useQuery(
    { teamIds },
    { enabled: teamIds.length > 0 }
  );

  // Ungelesene Kommentare pro Team laden
  const { data: unreadCounts } = trpc.orderComment.getUnreadCounts.useQuery(
    { teamIds },
    { enabled: teamIds.length > 0, refetchInterval: 30000 }
  );

  const paymentTypeLabel = (type: string | null) => {
    switch (type) {
      case "club": return "Verein zahlt";
      case "sponsor": return "Sponsor zahlt";
      case "self": return "Selbstzahler";
      default: return "Nicht festgelegt";
    }
  };

  const getStatusKey = (item: any): "offen" | "ausstehend" | "bestaetigt" => {
    if (!item.paymentType) return "offen";
    if (item.paymentStatus === "confirmed") return "bestaetigt";
    return "ausstehend";
  };

  const statusBadge = (item: any) => {
    const key = getStatusKey(item);
    if (key === "offen") {
      return <Badge variant="outline" className="text-muted-foreground">Offen</Badge>;
    }
    if (key === "bestaetigt") {
      return <Badge className="bg-green-600 text-white">Bestätigt</Badge>;
    }
    return <Badge variant="outline" className="text-amber-600 border-amber-600">Ausstehend</Badge>;
  };

  const filteredAndSorted = (overview || []).filter((item) => {
    if (statusFilter === "all") return true;
    return getStatusKey(item) === statusFilter;
  }).sort((a, b) => {
    if (sortBy === "status") {
      const order = { offen: 0, ausstehend: 1, bestaetigt: 2 };
      return order[getStatusKey(a)] - order[getStatusKey(b)];
    }
    return a.teamName.localeCompare(b.teamName);
  });

  // Detailansicht mit Kommentaren
  if (selectedTeam) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              Bestellübersicht
            </h2>
          </div>
        </div>
        <OrderCommentThread
          teamId={selectedTeam.teamId}
          teamName={selectedTeam.teamName}
          trainerName={selectedTeam.trainerName}
          onBack={() => setSelectedTeam(null)}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            Bestellübersicht
          </h2>
          <p className="text-sm text-muted-foreground">
            Übersicht aller Mannschaften mit Zahlungsstatus. Klicken Sie auf eine Zeile für Details und Kommunikation.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : !overview || overview.length === 0 ? (
        <div className="text-center py-10 bg-muted/30 rounded-xl border border-dashed">
          <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            Noch keine Mannschaften in Ihrer Abteilung
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Sobald Trainer Mannschaften anlegen, erscheint hier die Bestellübersicht.
          </p>
        </div>
      ) : (
        <div>
          {/* Filter & Sort Controls */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs text-muted-foreground">Filter:</span>
            {(["all", "offen", "ausstehend", "bestaetigt"] as const).map((f) => (
              <Button
                key={f}
                variant={statusFilter === f ? "default" : "outline"}
                size="sm"
                className="text-xs h-7"
                onClick={() => setStatusFilter(f)}
              >
                {f === "all" ? "Alle" : f === "offen" ? "Offen" : f === "ausstehend" ? "Ausstehend" : "Bestätigt"}
              </Button>
            ))}
            <span className="text-xs text-muted-foreground ml-4">Sortierung:</span>
            <Button
              variant={sortBy === "name" ? "default" : "outline"}
              size="sm"
              className="text-xs h-7"
              onClick={() => setSortBy("name")}
            >
              Name
            </Button>
            <Button
              variant={sortBy === "status" ? "default" : "outline"}
              size="sm"
              className="text-xs h-7"
              onClick={() => setSortBy("status")}
            >
              Status
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-3 px-2 font-medium">Mannschaft</th>
                  <th className="py-3 px-2 font-medium">Trainer</th>
                  <th className="py-3 px-2 font-medium">Spieler</th>
                  <th className="py-3 px-2 font-medium">Zahlungsmodell</th>
                  <th className="py-3 px-2 font-medium">Zahlung</th>
                  <th className="py-3 px-2 font-medium">Bestellstatus</th>
                  <th className="py-3 px-2 font-medium">Kommentare</th>
                  <th className="py-3 px-2 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSorted.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-muted-foreground">
                      Keine Mannschaften mit diesem Status gefunden.
                    </td>
                  </tr>
                ) : (
                  filteredAndSorted.map((item) => (
                    <tr
                      key={item.teamId}
                      className="border-b hover:bg-muted/30 cursor-pointer"
                      onClick={() =>
                        setSelectedTeam({
                          teamId: item.teamId,
                          teamName: item.teamName,
                          trainerName: item.trainerName,
                        })
                      }
                    >
                      <td className="py-3 px-2 font-medium">{item.teamName}</td>
                      <td className="py-3 px-2">{item.trainerName}</td>
                      <td className="py-3 px-2">{item.playerCount}</td>
                      <td className="py-3 px-2">{paymentTypeLabel(item.paymentType)}</td>
                      <td className="py-3 px-2">{statusBadge(item)}</td>
                      <td className="py-3 px-2">
                        <OrderStatusStepper
                          currentStatus={item.orderStatus || "offen"}
                          onChangeStatus={(newStatus) => {
                            updateStatusMutation.mutate({
                              teamId: item.teamId,
                              orgId,
                              departmentId: deptId,
                              status: newStatus,
                            });
                          }}
                          isLoading={updateStatusMutation.isPending}
                        />
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1.5">
                          {commentCounts && commentCounts[item.teamId] ? (
                            <Badge variant="outline" className="text-xs gap-1">
                              <MessageCircle className="w-3 h-3" />
                              {commentCounts[item.teamId]}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                          {unreadCounts && unreadCounts[item.teamId] && unreadCounts[item.teamId] > 0 && (
                            <Badge className="bg-blue-600 text-white text-[10px] px-1.5 py-0 h-4 animate-pulse">
                              {unreadCounts[item.teamId]} neu
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground text-xs">
                        {item.paymentType === "self" && item.playersPaid !== null && (
                          <span>{item.playersPaid}/{item.playersTotal} bezahlt</span>
                        )}
                        {item.paymentType === "sponsor" && item.sponsorName && (
                          <span>Sponsor: {item.sponsorName}</span>
                        )}
                        {item.paymentType === "club" && item.paymentStatus === "confirmed" && item.confirmedAt && (
                          <span>Bestätigt am {new Date(item.confirmedAt).toLocaleDateString("de-DE")}</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── Order Status Stepper ──────────────────────────────────────────────────
const ORDER_STEPS = [
  { key: "offen" as const, label: "Offen", icon: CircleDot, color: "text-gray-400" },
  { key: "bestellt" as const, label: "Bestellt", icon: Package, color: "text-blue-600" },
  { key: "in_produktion" as const, label: "In Produktion", icon: Factory, color: "text-amber-600" },
  { key: "geliefert" as const, label: "Geliefert", icon: Truck, color: "text-green-600" },
] as const;

function OrderStatusStepper({
  currentStatus,
  onChangeStatus,
  isLoading,
}: {
  currentStatus: "offen" | "bestellt" | "in_produktion" | "geliefert";
  onChangeStatus: (status: "offen" | "bestellt" | "in_produktion" | "geliefert") => void;
  isLoading: boolean;
}) {
  const currentIndex = ORDER_STEPS.findIndex((s) => s.key === currentStatus);
  const nextStep = currentIndex < ORDER_STEPS.length - 1 ? ORDER_STEPS[currentIndex + 1] : null;

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      {ORDER_STEPS.map((step, i) => {
        const Icon = step.icon;
        const isActive = i <= currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div key={step.key} className="flex items-center">
            <div
              className={`relative group ${isCurrent ? "ring-2 ring-offset-1 ring-blue-300 rounded-full" : ""}`}
              title={step.label}
            >
              <Icon
                className={`w-4 h-4 ${isActive ? step.color : "text-gray-200"} ${
                  isCurrent ? "scale-110" : ""
                } transition-all`}
              />
            </div>
            {i < ORDER_STEPS.length - 1 && (
              <div
                className={`w-2 h-0.5 mx-0.5 ${
                  i < currentIndex ? "bg-blue-400" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
      {nextStep && (
        <Button
          variant="ghost"
          size="sm"
          className="ml-1 h-6 px-2 text-[10px] gap-0.5"
          disabled={isLoading}
          onClick={(e) => {
            e.stopPropagation();
            onChangeStatus(nextStep.key);
          }}
        >
          {isLoading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <>
              <ChevronRight className="w-3 h-3" />
              {nextStep.label}
            </>
          )}
        </Button>
      )}
      {!nextStep && (
        <Badge className="ml-1 bg-green-600 text-white text-[10px] px-1.5 h-5">
          Abgeschlossen
        </Badge>
      )}
    </div>
  );
}

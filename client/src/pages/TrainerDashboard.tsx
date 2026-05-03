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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  Loader2,
  LogIn,
  Plus,
  Shield,
  Trash2,
  Users,
  UserPlus,
  Pencil,
  Upload,
  Shirt,
  ChevronRight,
  Download,
  CreditCard,
  Building2,
  HandCoins,
  CheckCircle2,
  Clock,
  Copy,
  Mail,
  Image,
  Star,
  StarOff,
  Info,
  MessageCircle,
  Share2,
  ExternalLink,
  Sparkles,
  Package,
  Factory,
  Truck,
  CircleDot,
  FolderOpen,
  Library,
  Lock,
  ClipboardCheck,
  Send,
} from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { Link, useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { PaymentSection } from "./PaymentSection";
import { OrderCommentThread } from "./OrderCommentThread";
import { useMemo } from "react";
import { KONFEKTIONSGROESSEN, getSpielklassen, TEAM_KATEGORIEN, type SportartCode } from "@shared/jerseyRules";
import { storageUrl } from "@/lib/utils";
import { SponsorLogoImage } from "@/components/SponsorLogoImage";
import MemberManagement from "@/components/MemberManagement";

// ─── Logo Section für selbstregistrierte Trainer ─────────────────────────────
function TrainerLogoSection({ orgId }: { orgId: number }) {
  const utils = trpc.useUtils();
  const { data: logos } = trpc.orgLogo.list.useQuery({ orgId });
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

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!logoFile || !logoName.trim()) return;
    // DPI-Prüfung: Vereinswappen wird bei 10x10cm gedruckt (nur Bilder)
    const isPdfLogo = logoFile.type === "application/pdf" || logoFile.name.toLowerCase().endsWith(".pdf");
    if (!isPdfLogo) {
      try {
        const { checkImageDpi } = await import("@/hooks/useDpiCheck");
        const result = await checkImageDpi(logoFile, 10, 10);
        if (result.status === "warning") {
          toast.warning(result.message, { duration: 8000 });
        } else if (result.status === "ok") {
          toast.success(result.message);
        }
      } catch { /* Bei Fehler fortfahren */ }
    }
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
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Image className="w-5 h-5 text-blue-600" />
            Vereinslogo
          </h2>
          <p className="text-sm text-muted-foreground">
            Laden Sie Ihr Vereinslogo hoch. Es wird automatisch im Konfigurator verwendet.
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
              <DialogDescription>Laden Sie eine neue Logo-Variante hoch.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Bezeichnung</Label>
                <Input
                  value={logoName}
                  onChange={(e) => setLogoName(e.target.value)}
                  placeholder="z.B. Farb-Logo, SW-Logo"
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
                    <img src={logoPreview} alt="Vorschau" className="max-h-32 mx-auto" />
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Klicken zum Auswählen (max. 5 MB)</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefaultLogoTrainer"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="isDefaultLogoTrainer">Als Standard-Logo setzen</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUpload(false)}>Abbrechen</Button>
              <Button
                onClick={handleUpload}
                disabled={!logoName.trim() || !logoFile || uploadLogo.isPending}
              >
                {uploadLogo.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Hochladen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {!logos || logos.length === 0 ? (
        <div className="text-center py-8 bg-muted/30 rounded-xl border border-dashed">
          <Image className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Noch keine Logos hochgeladen</p>
          <Button className="mt-4" size="sm" onClick={() => setShowUpload(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Erstes Logo hochladen
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {logos.map((logo) => (
            <Card key={logo.id} className="overflow-hidden">
              <div className="aspect-square bg-muted/30 flex items-center justify-center p-4 relative">
                <img src={storageUrl(logo.imageUrl)} alt={logo.name} className="max-w-full max-h-full object-contain" />
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
                        onClick={() => setDefaultLogo.mutate({ id: logo.id, orgId, isDefault: true })}
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
                        if (confirm(`Logo "${logo.name}" wirklich löschen?`))
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

// ─── Logo-Anzeige für eingeladene Trainer (read-only) ─────────────────────────
function InvitedTrainerLogoDisplay({ orgId }: { orgId: number }) {
  const { data: logos } = trpc.orgLogo.list.useQuery({ orgId });
  const defaultLogo = logos?.find((l) => l.isDefault) || logos?.[0];

  return (
    <div className="mb-8">
      <div className="mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Image className="w-5 h-5 text-blue-600" />
          Vereinslogo
        </h2>
        <p className="text-sm text-muted-foreground">
          Das Logo wird vom Spartenleiter verwaltet und automatisch im Konfigurator verwendet.
        </p>
      </div>
      {defaultLogo ? (
        <Card className="overflow-hidden max-w-xs">
          <div className="aspect-square bg-muted/30 flex items-center justify-center p-4 relative">
            <img src={storageUrl(defaultLogo.imageUrl)} alt={defaultLogo.name} className="max-w-full max-h-full object-contain" />
            <Badge className="absolute top-2 right-2 gap-1">
              <Star className="w-3 h-3" />
              Vereinslogo
            </Badge>
          </div>
          <CardContent className="pt-3">
            <p className="font-medium text-sm">{defaultLogo.name}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-200">Kein Logo hinterlegt</p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Ihr Spartenleiter hat noch kein Vereinslogo hochgeladen. Bitte kontaktieren Sie Ihren Spartenleiter.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Trainer Sponsor Section (nur Mannschaftssponsoren) ─────────────────────────────────────────────────────────────────────────────────
function TrainerSponsorSection({ orgId, deptId }: { orgId: number; deptId: number }) {
  const utils = trpc.useUtils();
  const { data: sponsors, isLoading } = trpc.sponsorTemplate.list.useQuery({ orgId });
  const { data: teams } = trpc.team.listByOrg.useQuery({ orgId });
  const { data: departments } = trpc.department.listByOrg.useQuery({ orgId });
  const [showCreate, setShowCreate] = useState(false);
  const [sponsorForm, setSponsorForm] = useState({
    name: "",
    category: "mannschaft" as string,
    contactFirstName: "",
    contactLastName: "",
    contactEmail: "",
    street: "",
    zip: "",
    city: "",
    vatId: "",
    teamId: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createSponsor = trpc.sponsorTemplate.create.useMutation({
    onSuccess: () => {
      utils.sponsorTemplate.list.invalidate({ orgId });
      setShowCreate(false);
      setSponsorForm({ name: "", category: "mannschaft", contactFirstName: "", contactLastName: "", contactEmail: "", street: "", zip: "", city: "", vatId: "", teamId: "" });
      setLogoFile(null);
      setLogoPreview(null);
      toast.success("Sponsor erstellt");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCreate = async () => {
    let logoBase64 = "";
    let mimeType = "";
    if (logoFile) {
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(logoFile);
      });
      logoBase64 = dataUrl.split(",")[1] || dataUrl;
      mimeType = logoFile.type;
    }
    createSponsor.mutate({
      orgId,
      name: sponsorForm.name,
      category: sponsorForm.category,
      logoBase64: logoBase64 || undefined,
      mimeType: mimeType || undefined,
      contactFirstName: sponsorForm.contactFirstName,
      contactLastName: sponsorForm.contactLastName,
      contactEmail: sponsorForm.contactEmail,
      street: sponsorForm.street,
      zip: sponsorForm.zip,
      city: sponsorForm.city,
      vatId: sponsorForm.vatId || undefined,
      teamId: sponsorForm.teamId ? parseInt(sponsorForm.teamId) : undefined,
      departmentId: deptId,
    });
  };

  // Nur Mannschaftssponsoren der eigenen Abteilung anzeigen
  const mySponsors = sponsors?.filter((s: any) => s.category === "mannschaft" && s.departmentId === deptId) || [];

  const canCreate = sponsorForm.name.trim() && sponsorForm.contactFirstName.trim() && sponsorForm.contactLastName.trim() && sponsorForm.contactEmail.trim() && sponsorForm.street.trim() && sponsorForm.zip.trim() && sponsorForm.city.trim() && sponsorForm.teamId;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <HandCoins className="w-5 h-5 text-green-600" />
            Mannschaftssponsoren
          </h2>
          <p className="text-sm text-muted-foreground">
            Verwalten Sie die Sponsoren Ihrer Mannschaften.
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Sponsor hinzufügen
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Neuen Mannschaftssponsor anlegen</DialogTitle>
              <DialogDescription>Erfassen Sie die Daten des Sponsors.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Firmenname *</Label>
                <Input value={sponsorForm.name} onChange={(e) => setSponsorForm(f => ({ ...f, name: e.target.value }))} placeholder="Firmenname" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Vorname Kontaktperson *</Label>
                  <Input value={sponsorForm.contactFirstName} onChange={(e) => setSponsorForm(f => ({ ...f, contactFirstName: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Nachname Kontaktperson *</Label>
                  <Input value={sponsorForm.contactLastName} onChange={(e) => setSponsorForm(f => ({ ...f, contactLastName: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>E-Mail *</Label>
                <Input type="email" value={sponsorForm.contactEmail} onChange={(e) => setSponsorForm(f => ({ ...f, contactEmail: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Straße *</Label>
                <Input value={sponsorForm.street} onChange={(e) => setSponsorForm(f => ({ ...f, street: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>PLZ *</Label>
                  <Input value={sponsorForm.zip} onChange={(e) => setSponsorForm(f => ({ ...f, zip: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Ort *</Label>
                  <Input value={sponsorForm.city} onChange={(e) => setSponsorForm(f => ({ ...f, city: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>USt-IdNr.</Label>
                <Input value={sponsorForm.vatId} onChange={(e) => setSponsorForm(f => ({ ...f, vatId: e.target.value }))} placeholder="DE123456789" />
              </div>
              <div className="space-y-2">
                <Label>Mannschaft *</Label>
                <Select value={sponsorForm.teamId} onValueChange={(v) => setSponsorForm(f => ({ ...f, teamId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Mannschaft wählen" /></SelectTrigger>
                  <SelectContent>
                    {teams?.filter((t: any) => t.departmentId === deptId).map((t: any) => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Logo (optional)</Label>
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml,application/pdf" onChange={handleLogoChange} className="hidden" />
                <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors" onClick={() => fileInputRef.current?.click()}>
                  {logoPreview ? (
                    <img src={logoPreview} alt="Vorschau" className="max-h-24 mx-auto" />
                  ) : (
                    <div>
                      <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">PNG, JPG, SVG oder PDF</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Abbrechen</Button>
              <Button onClick={handleCreate} disabled={!canCreate || createSponsor.isPending}>
                {createSponsor.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Erstellen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : mySponsors.length === 0 ? (
        <div className="text-center py-8 bg-muted/30 rounded-xl border border-dashed">
          <HandCoins className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Noch keine Mannschaftssponsoren</p>
          <Button className="mt-4" size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ersten Sponsor anlegen
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {mySponsors.map((sponsor: any) => (
            <Card key={sponsor.id} className="overflow-hidden">
              <div className="aspect-video bg-muted/30 flex items-center justify-center p-4">
                {sponsor.logoUrl ? (
                  <SponsorLogoImage src={storageUrl(sponsor.logoUrl)} alt={sponsor.name} className="max-w-full max-h-full object-contain" />
                ) : (
                  <HandCoins className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
              <CardContent className="pt-3">
                <p className="font-medium">{sponsor.name}</p>
                <p className="text-xs text-muted-foreground">{sponsor.contactEmail}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Team List (Trainer sieht seine Mannschaften) ─────────────────
function TeamList({ orgId, deptId }: { orgId: number; deptId: number }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: org } = trpc.org.getById.useQuery({ id: orgId });
  const { data: teams, isLoading } = trpc.team.listByDepartment.useQuery(
    { departmentId: deptId, orgId },
    { enabled: orgId > 0 && deptId > 0 }
  );

  // Prüfe ob Trainer selbstregistriert ist (Owner der Org)
  const isSelfRegistered = org && user ? org.ownerId === user.id : false;

  const [showCreate, setShowCreate] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamLeague, setTeamLeague] = useState("");
  const [teamCategory, setTeamCategory] = useState("");

  const createTeam = trpc.team.create.useMutation({
    onSuccess: (data) => {
      utils.team.listByDepartment.invalidate({ departmentId: deptId, orgId });
      utils.team.mine.invalidate();
      setShowCreate(false);
      setTeamName("");
      toast.success("Mannschaft erstellt");
      setLocation(`/trainer/${orgId}/${deptId}/team/${data.id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteTeam = trpc.team.delete.useMutation({
    onSuccess: () => {
      utils.team.listByDepartment.invalidate({ departmentId: deptId, orgId });
      utils.team.mine.invalidate();
      toast.success("Mannschaft gelöscht");
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-30">
        <div className="container flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold">Meine Mannschaften</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {org?.name || "Organisation"}
              </p>
            </div>
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Neue Mannschaft
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Mannschaft erstellen</DialogTitle>
                <DialogDescription>
                  Erstellen Sie eine neue Mannschaft für Ihre Abteilung.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Mannschaftsname</Label>
                  <Input
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="z.B. 1. Herren, U19"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kategorie</Label>
                  <Select value={teamCategory} onValueChange={setTeamCategory}>
                    <SelectTrigger><SelectValue placeholder="Kategorie wählen..." /></SelectTrigger>
                    <SelectContent>
                      {TEAM_KATEGORIEN.map((k) => (
                        <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Spielklasse</Label>
                  {org?.sport ? (
                    <Select value={teamLeague} onValueChange={setTeamLeague}>
                      <SelectTrigger><SelectValue placeholder="Spielklasse wählen..." /></SelectTrigger>
                      <SelectContent>
                        {(getSpielklassen(org.sport as SportartCode) || []).map((sk) => (
                          <SelectItem key={sk.value} value={sk.value}>{sk.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={teamLeague}
                      onChange={(e) => setTeamLeague(e.target.value)}
                      placeholder="z.B. Landesliga, Bezirksliga, Kreisliga"
                    />
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowCreate(false)}
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={() => {
                    createTeam.mutate({
                      orgId,
                      departmentId: deptId,
                      name: teamName,
                      league: teamLeague || undefined,
                      category: teamCategory || undefined,
                    });
                  }}
                  disabled={!teamName.trim() || createTeam.isPending}
                >
                  {createTeam.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Erstellen
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="container py-8">
        {/* Logo-Bereich: Selbstregistrierte Trainer können Logo hochladen, eingeladene sehen das Logo vom Spartenleiter */}
        {isSelfRegistered ? (
          <TrainerLogoSection orgId={orgId} />
        ) : (
          <InvitedTrainerLogoDisplay orgId={orgId} />
        )}

        {/* Sponsor-Bereich: Trainer kann Mannschaftssponsoren anlegen */}
        <TrainerSponsorSection orgId={orgId} deptId={deptId} />

        {/* Mannschaftsmitglieder (optional) */}
        <TrainerMemberSection orgId={orgId} deptId={deptId} teams={teams || []} />

        {!teams || teams.length === 0 ? (
          <div className="text-center py-16 bg-muted/30 rounded-xl border border-dashed">
            <Shirt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground mb-2">
              Noch keine Mannschaften
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Erstellen Sie eine Mannschaft, um Spieler hinzuzufügen und Trikots
              zu konfigurieren.
            </p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Mannschaft erstellen
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <Card
                key={team.id}
                className="group cursor-pointer hover:shadow-lg transition-all"
                onClick={() =>
                  setLocation(
                    `/trainer/${orgId}/${deptId}/team/${team.id}`
                  )
                }
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Shirt className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {team.name}
                        </CardTitle>
                        <CardDescription className="text-xs flex items-center gap-1 flex-wrap">
                          {team.category && <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {{herren:"Herren",damen:"Damen",jugend_m:"Jugend (m)",jugend_w:"Jugend (w)",mixed:"Mixed"}[team.category] || team.category}
                          </Badge>}
                          {team.league && <span className="text-muted-foreground">{team.league}</span>}
                          {!team.category && !team.league && "Mannschaft"}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            confirm(
                              `Mannschaft "${team.name}" wirklich löschen? Alle Spieler werden ebenfalls gelöscht.`
                            )
                          )
                            deleteTeam.mutate({ id: team.id, orgId });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Team Detail (Spielerliste + Konfiguration) ──────────────────────────────
function TeamDetail({
  orgId,
  deptId,
  teamId,
}: {
  orgId: number;
  deptId: number;
  teamId: number;
}) {
  const utils = trpc.useUtils();
  const [, setLocation] = useLocation();

  const { data: org } = trpc.org.getById.useQuery({ id: orgId });
  const { data: team, isLoading } = trpc.team.getById.useQuery(
    { id: teamId, orgId },
    { enabled: teamId > 0 && orgId > 0 }
  );

  // ─── Player CRUD ───
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [playerNumber, setPlayerNumber] = useState("");
  const [playerPosition, setPlayerPosition] = useState("");
  const [playerSize, setPlayerSize] = useState("");

  const [showImport, setShowImport] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [replaceExisting, setReplaceExisting] = useState(false);

  const [editingPlayer, setEditingPlayer] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editNumber, setEditNumber] = useState("");
  const [editPosition, setEditPosition] = useState("");
  const [editSize, setEditSize] = useState("");

  // Größen aus jerseyRules importiert (inkl. Kinder-/Jugendgrößen)

  // ─── Rename Team ───
  const [showRename, setShowRename] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");

  const renameTeam = trpc.team.update.useMutation({
    onSuccess: () => {
      utils.team.getById.invalidate({ id: teamId, orgId });
      utils.team.listByDepartment.invalidate({ departmentId: deptId, orgId });
      setShowRename(false);
      setNewTeamName("");
      toast.success("Mannschaft umbenannt");
    },
    onError: (e) => toast.error(e.message),
  });

  const createPlayer = trpc.player.create.useMutation({
    onSuccess: () => {
      utils.team.getById.invalidate({ id: teamId, orgId });
      setShowAddPlayer(false);
      setPlayerName("");
      setPlayerNumber("");
      setPlayerPosition("");
      setPlayerSize("");
      toast.success("Spieler hinzugefügt");
    },
    onError: (e) => toast.error(e.message),
  });

  const updatePlayer = trpc.player.update.useMutation({
    onSuccess: () => {
      utils.team.getById.invalidate({ id: teamId, orgId });
      setEditingPlayer(null);
      toast.success("Spieler aktualisiert");
    },
    onError: (e) => toast.error(e.message),
  });

  const deletePlayer = trpc.player.delete.useMutation({
    onSuccess: () => {
      utils.team.getById.invalidate({ id: teamId, orgId });
      toast.success("Spieler entfernt");
    },
    onError: (e) => toast.error(e.message),
  });

  const importPlayers = trpc.player.importCsv.useMutation({
    onSuccess: (data) => {
      utils.team.getById.invalidate({ id: teamId, orgId });
      setShowImport(false);
      setCsvText("");
      toast.success(`${data.count} Spieler importiert`);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleCsvImport = () => {
    const lines = csvText
      .trim()
      .split("\n")
      .filter((l) => l.trim());
    if (lines.length === 0) {
      toast.error("Keine Daten zum Importieren");
      return;
    }

    // Prüfe ob erste Zeile Header ist
    const firstLine = lines[0].toLowerCase();
    const hasHeader =
      firstLine.includes("name") ||
      firstLine.includes("nummer") ||
      firstLine.includes("position");
    const dataLines = hasHeader ? lines.slice(1) : lines;

    const players = dataLines.map((line) => {
      const parts = line.split(/[;,\t]/).map((p) => p.trim());
      return {
        name: parts[0] || "Unbekannt",
        number: parts[1] || undefined,
        position: parts[2] || undefined,
      };
    });

    if (players.length === 0) {
      toast.error("Keine gültigen Spieler gefunden");
      return;
    }

    importPlayers.mutate({
      teamId,
      orgId,
      players,
      replaceExisting,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Mannschaft nicht gefunden</p>
      </div>
    );
  }

  const players = team.players || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-30">
        <div className="container flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center gap-3">
            <Link href={`/trainer/${orgId}/${deptId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Shirt className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold">{team.name}</h1>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      setNewTeamName(team.name);
                      setShowRename(true);
                    }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {org?.name} &middot; {players.length} Spieler
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/konfigurator/690035?teamId=${teamId}`}>
              <Button size="sm" variant="outline">
                <Shirt className="w-4 h-4 mr-2" />
                Zum Konfigurator
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container py-6">
        {/* Rename Dialog */}
        <Dialog open={showRename} onOpenChange={setShowRename}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mannschaft umbenennen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Neuer Name</Label>
                <Input
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowRename(false)}
              >
                Abbrechen
              </Button>
              <Button
                onClick={() =>
                  renameTeam.mutate({
                    id: teamId,
                    orgId,
                    name: newTeamName,
                  })
                }
                disabled={!newTeamName.trim() || renameTeam.isPending}
              >
                Umbenennen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Action Bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">Spielerliste</h2>
            <p className="text-sm text-muted-foreground">
              {players.length} Spieler in dieser Mannschaft
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={showImport} onOpenChange={setShowImport}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  CSV-Import
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Spieler importieren (CSV)</DialogTitle>
                  <DialogDescription>
                    Fügen Sie Spielerdaten im CSV-Format ein. Spalten: Name,
                    Nummer, Position (getrennt durch Komma, Semikolon oder Tab).
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="rounded-lg bg-muted/50 p-3 text-xs font-mono text-muted-foreground">
                    <p className="font-medium text-foreground mb-1 font-sans text-sm">
                      Beispiel:
                    </p>
                    Name;Nummer;Position
                    <br />
                    Max Mustermann;7;Stürmer
                    <br />
                    Anna Schmidt;3;Verteidigung
                    <br />
                    Peter Meier;1;Torwart
                  </div>
                  <div className="space-y-2">
                    <Label>CSV-Daten</Label>
                    <textarea
                      className="w-full min-h-[120px] rounded-md border bg-background px-3 py-2 text-sm font-mono"
                      value={csvText}
                      onChange={(e) => setCsvText(e.target.value)}
                      placeholder="Name;Nummer;Position&#10;Max Mustermann;7;Stürmer"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="replace-existing"
                      checked={replaceExisting}
                      onChange={(e) => setReplaceExisting(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="replace-existing" className="text-sm">
                      Bestehende Spieler vorher löschen
                    </Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowImport(false)}
                  >
                    Abbrechen
                  </Button>
                  <Button
                    onClick={handleCsvImport}
                    disabled={!csvText.trim() || importPlayers.isPending}
                  >
                    {importPlayers.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Importieren
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showAddPlayer} onOpenChange={setShowAddPlayer}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Spieler hinzufügen
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Spieler hinzufügen</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>
                      Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Vor- und Nachname"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Trikotnummer</Label>
                      <Input
                        value={playerNumber}
                        onChange={(e) => setPlayerNumber(e.target.value)}
                        placeholder="z.B. 7"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Position</Label>
                      <Input
                        value={playerPosition}
                        onChange={(e) => setPlayerPosition(e.target.value)}
                        placeholder="z.B. Stürmer"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Größe</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                        value={playerSize}
                        onChange={(e) => setPlayerSize(e.target.value)}
                      >
                        <option value="">Wählen...</option>
                        {KONFEKTIONSGROESSEN.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddPlayer(false)}
                  >
                    Abbrechen
                  </Button>
                  <Button
                    onClick={() =>
                      createPlayer.mutate({
                        teamId,
                        orgId,
                        name: playerName,
                        number: playerNumber || undefined,
                        position: playerPosition || undefined,
                        size: playerSize || undefined,
                      })
                    }
                    disabled={!playerName.trim() || createPlayer.isPending}
                  >
                    {createPlayer.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Hinzufügen
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Player List */}
        {players.length === 0 ? (
          <div className="text-center py-16 bg-muted/30 rounded-xl border border-dashed">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground mb-2">
              Noch keine Spieler
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Fügen Sie Spieler manuell hinzu oder importieren Sie eine
              CSV-Datei.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowImport(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                CSV-Import
              </Button>
              <Button onClick={() => setShowAddPlayer(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Spieler hinzufügen
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="col-span-1">#</div>
              <div className="col-span-3">Name</div>
              <div className="col-span-2">Nummer</div>
              <div className="col-span-2">Position</div>
              <div className="col-span-2">Größe</div>
              <div className="col-span-2 text-right">Aktionen</div>
            </div>
            <Separator />
            {players.map((player, idx) => (
              <Card key={player.id}>
                <CardContent className="py-2 px-4">
                  {editingPlayer === player.id ? (
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-1 text-sm text-muted-foreground">
                        {idx + 1}
                      </div>
                      <div className="col-span-3">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          value={editNumber}
                          onChange={(e) => setEditNumber(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          value={editPosition}
                          onChange={(e) => setEditPosition(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <select
                          className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm"
                          value={editSize}
                          onChange={(e) => setEditSize(e.target.value)}
                        >
                          <option value="">--</option>
                          {KONFEKTIONSGROESSEN.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2 flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => setEditingPlayer(null)}
                        >
                          Abbrechen
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() =>
                            updatePlayer.mutate({
                              id: player.id,
                              teamId,
                              orgId,
                              name: editName || undefined,
                              number: editNumber || null,
                              position: editPosition || null,
                              size: editSize || null,
                            })
                          }
                          disabled={updatePlayer.isPending}
                        >
                          OK
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-1 text-sm text-muted-foreground">
                        {idx + 1}
                      </div>
                      <div className="col-span-3">
                        <p className="font-medium text-sm">{player.name}</p>
                      </div>
                      <div className="col-span-2">
                        {player.number ? (
                          <Badge variant="secondary" className="text-xs">
                            #{player.number}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            –
                          </span>
                        )}
                      </div>
                      <div className="col-span-2">
                        <span className="text-sm text-muted-foreground">
                          {player.position || "–"}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-sm text-muted-foreground">
                          {player.size || "–"}
                        </span>
                      </div>
                      <div className="col-span-2 flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            setEditingPlayer(player.id);
                            setEditName(player.name);
                            setEditNumber(player.number || "");
                            setEditPosition(player.position || "");
                            setEditSize(player.size || "");
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => {
                            if (
                              confirm(
                                `Spieler "${player.name}" wirklich entfernen?`
                              )
                            )
                              deletePlayer.mutate({
                                id: player.id,
                                teamId,
                                orgId,
                              });
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {/* Mockup-Galerie */}
        <Separator className="my-6" />
        <MockupGallerySection teamId={teamId} teamName={team.name} orgId={orgId} />

        {/* Kollektionen */}
        <Separator className="my-6" />
        <CollectionsSection orgId={orgId} departmentId={deptId} teamId={teamId} />

        {/* Bestellstatus */}
        <Separator className="my-6" />
        <OrderStatusSection teamId={teamId} orderStatus={(team as any).orderStatus || "offen"} />

        {/* Abrechnungs-Bereich */}
        <PaymentSection teamId={teamId} orgId={orgId} players={players} />
        {/* Kommunikation mit Spartenleiter */}
        <Separator className="my-6" />
        <TrainerCommentSection teamId={teamId} teamName={team.name} />
      </div>
    </div>
  );
}

//// ─── Kollektions-Sektion (Trainer) ──────────────────────────────────────────────────────────────────────────────
function CollectionsSection({ orgId, departmentId, teamId }: { orgId: number; departmentId: number; teamId: number }) {
  const utils = trpc.useUtils();
  const { data: collections, isLoading } = trpc.collection.list.useQuery(
    { orgId, departmentId },
    { enabled: orgId > 0 }
  );
  const { data: savedDesigns } = trpc.savedDesign.list.useQuery(
    { teamId },
    { enabled: teamId > 0 }
  );

  const [showCreate, setShowCreate] = useState(false);
  const [collName, setCollName] = useState("");
  const [collDesc, setCollDesc] = useState("");
  const [selectedDesignIds, setSelectedDesignIds] = useState<number[]>([]);

  const createColl = trpc.collection.create.useMutation({
    onSuccess: () => {
      utils.collection.list.invalidate({ orgId, departmentId });
      setShowCreate(false);
      setCollName("");
      setCollDesc("");
      setSelectedDesignIds([]);
      toast.success("Kollektion erstellt");
    },
    onError: (e) => toast.error(e.message),
  });

  const addItem = trpc.collection.addItem.useMutation({
    onSuccess: () => {
      utils.collection.list.invalidate({ orgId, departmentId });
      toast.success("Design zur Kollektion hinzugefügt");
    },
    onError: (e) => toast.error(e.message),
  });

  const removeItem = trpc.collection.removeItem.useMutation({
    onSuccess: () => {
      utils.collection.list.invalidate({ orgId, departmentId });
      toast.success("Design aus Kollektion entfernt");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteColl = trpc.collection.delete.useMutation({
    onSuccess: () => {
      utils.collection.list.invalidate({ orgId, departmentId });
      toast.success("Kollektion gelöscht");
    },
    onError: (e) => toast.error(e.message),
  });

  const mandatoryCollections = (collections || []).filter(
    (c: any) => c.scope === "org" && c.enforcement === "mandatory"
  );
  const optionalCollections = (collections || []).filter(
    (c: any) => !(c.scope === "org" && c.enforcement === "mandatory")
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Library className="w-5 h-5" />
            Kollektionen
          </h2>
          <p className="text-sm text-muted-foreground">
            Design-Zusammenstellungen für Ihre Mannschaft
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Kollektion erstellen
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Neue Kollektion</DialogTitle>
              <DialogDescription>
                Fassen Sie mehrere Designs zu einer Kollektion zusammen, die andere Trainer übernehmen können.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  placeholder="z.B. Saison 2025/26 Heimtrikot-Set"
                  value={collName}
                  onChange={(e) => setCollName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Beschreibung (optional)</Label>
                <Input
                  placeholder="Kurze Beschreibung der Kollektion"
                  value={collDesc}
                  onChange={(e) => setCollDesc(e.target.value)}
                />
              </div>
              {savedDesigns && savedDesigns.length > 0 && (
                <div className="space-y-2">
                  <Label>Designs auswählen</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {savedDesigns.map((d: any) => (
                      <button
                        key={d.id}
                        type="button"
                        className={`flex items-center gap-2 p-2 rounded-lg border text-left text-sm transition-colors ${
                          selectedDesignIds.includes(d.id)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => {
                          setSelectedDesignIds((prev) =>
                            prev.includes(d.id)
                              ? prev.filter((id) => id !== d.id)
                              : [...prev, d.id]
                          );
                        }}
                      >
                        {d.thumbnailUrl ? (
                          <img
                            src={storageUrl(d.thumbnailUrl)}
                            alt={d.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                            <Shirt className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <span className="truncate flex-1">{d.name}</span>
                        {selectedDesignIds.includes(d.id) && (
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={() =>
                  createColl.mutate({
                    name: collName,
                    description: collDesc || undefined,
                    orgId,
                    departmentId,
                    scope: "team",
                    savedDesignIds: selectedDesignIds.length > 0 ? selectedDesignIds : undefined,
                  })
                }
                disabled={!collName.trim() || createColl.isPending}
              >
                {createColl.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
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
      ) : !collections || collections.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>Noch keine Kollektionen vorhanden.</p>
            <p className="text-xs mt-1">Erstellen Sie eine Kollektion oder warten Sie auf Freigaben vom Spartenleiter.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {mandatoryCollections.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-destructive flex items-center gap-1.5 mb-2">
                <Lock className="w-4 h-4" />
                Pflicht-Kollektionen (Verein)
              </h3>
              {mandatoryCollections.map((coll: any) => (
                <CollectionCard key={coll.id} coll={coll} orgId={orgId} departmentId={departmentId} teamId={teamId} savedDesigns={savedDesigns || []} onAddItem={addItem} onRemoveItem={removeItem} onDelete={deleteColl} isMandatory />
              ))}
            </div>
          )}
          {optionalCollections.map((coll: any) => (
            <CollectionCard key={coll.id} coll={coll} orgId={orgId} departmentId={departmentId} teamId={teamId} savedDesigns={savedDesigns || []} onAddItem={addItem} onRemoveItem={removeItem} onDelete={deleteColl} />
          ))}
        </div>
      )}
    </div>
  );
}

function CollectionCard({ coll, orgId, departmentId, teamId, savedDesigns, onAddItem, onRemoveItem, onDelete, isMandatory }: {
  coll: any; orgId: number; departmentId: number; teamId: number; savedDesigns: any[]; onAddItem: any; onRemoveItem: any; onDelete: any; isMandatory?: boolean;
}) {
  const { user } = useAuth();
  const [showAddDesign, setShowAddDesign] = useState(false);
  const isOwner = coll.createdByUserId === user?.id;

  const scopeLabel = coll.scope === "org" ? "Verein" : coll.scope === "department" ? "Sparte" : "Team";
  const scopeColor = coll.scope === "org" ? "bg-purple-100 text-purple-700" : coll.scope === "department" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700";

  return (
    <Card className={isMandatory ? "border-destructive/30" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{coll.name}</CardTitle>
            <Badge variant="outline" className={`text-[10px] ${scopeColor}`}>{scopeLabel}</Badge>
            {isMandatory && (
              <Badge variant="destructive" className="text-[10px]">
                <Lock className="w-3 h-3 mr-1" /> Pflicht
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {isOwner && !isMandatory && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => { if (confirm(`Kollektion "${coll.name}" wirklich löschen?`)) onDelete.mutate({ id: coll.id }); }}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
        {coll.description && <CardDescription className="text-xs">{coll.description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {coll.items && coll.items.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {coll.items.map((item: any) => (
              <div key={item.id} className="relative group">
                <div className="aspect-square rounded-lg border bg-muted/30 overflow-hidden">
                  {item.design?.thumbnailUrl ? (
                    <img src={storageUrl(item.design.thumbnailUrl)} alt={item.design?.name || "Design"} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Shirt className="w-8 h-8 text-muted-foreground" /></div>
                  )}
                </div>
                <p className="text-xs mt-1 truncate">{item.design?.name || "Design"}</p>
                {isOwner && !isMandatory && (
                  <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 bg-background/80 hover:bg-background"
                    onClick={() => onRemoveItem.mutate({ itemId: item.id, collectionId: coll.id })}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Noch keine Designs in dieser Kollektion.</p>
        )}
        {isOwner && !isMandatory && (
          <div className="mt-3">
            <Dialog open={showAddDesign} onOpenChange={setShowAddDesign}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  <Plus className="w-4 h-4 mr-2" /> Design hinzufügen
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Design zur Kollektion hinzufügen</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto py-4">
                  {savedDesigns
                    .filter((d: any) => !coll.items?.some((item: any) => item.savedDesignId === d.id))
                    .map((d: any) => (
                      <button key={d.id} type="button" className="flex items-center gap-2 p-2 rounded-lg border border-border hover:border-primary/50 text-left text-sm"
                        onClick={() => { onAddItem.mutate({ collectionId: coll.id, savedDesignId: d.id }); setShowAddDesign(false); }}>
                        {d.thumbnailUrl ? (
                          <img src={storageUrl(d.thumbnailUrl)} alt={d.name} className="w-10 h-10 rounded object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center"><Shirt className="w-5 h-5 text-muted-foreground" /></div>
                        )}
                        <span className="truncate flex-1">{d.name}</span>
                      </button>
                    ))}
                  {savedDesigns.filter((d: any) => !coll.items?.some((item: any) => item.savedDesignId === d.id)).length === 0 && (
                    <p className="col-span-2 text-sm text-muted-foreground text-center py-4">Alle Designs sind bereits in dieser Kollektion.</p>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Bestellstatus-Anzeige (read-only für Trainer) ────────────────────────────────────────
const ORDER_STEPS_TRAINER = [
  { key: "offen" as const, label: "Offen", icon: CircleDot, color: "text-gray-400", bgColor: "bg-gray-100" },
  { key: "bestellt" as const, label: "Bestellt", icon: Package, color: "text-blue-600", bgColor: "bg-blue-50" },
  { key: "in_produktion" as const, label: "In Produktion", icon: Factory, color: "text-amber-600", bgColor: "bg-amber-50" },
  { key: "geliefert" as const, label: "Geliefert", icon: Truck, color: "text-green-600", bgColor: "bg-green-50" },
] as const;

function OrderStatusSection({ teamId, orderStatus }: { teamId: number; orderStatus: string }) {
  const currentIndex = ORDER_STEPS_TRAINER.findIndex((s) => s.key === orderStatus);
  const currentStep = ORDER_STEPS_TRAINER[currentIndex >= 0 ? currentIndex : 0];
  const CurrentIcon = currentStep.icon;

  return (
    <div>
      <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
        <Package className="w-5 h-5" />
        Bestellstatus
      </h3>
      <Card>
        <CardContent className="p-4">
          {/* Status-Stepper (read-only) */}
          <div className="flex items-center justify-between mb-4">
            {ORDER_STEPS_TRAINER.map((step, i) => {
              const Icon = step.icon;
              const isActive = i <= currentIndex;
              const isCurrent = i === currentIndex;
              return (
                <div key={step.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isCurrent ? `${step.bgColor} ring-2 ring-offset-1 ring-blue-300` : isActive ? step.bgColor : "bg-gray-100"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? step.color : "text-gray-300"}`} />
                    </div>
                    <span className={`text-[10px] ${isCurrent ? "font-semibold" : "text-muted-foreground"}`}>
                      {step.label}
                    </span>
                  </div>
                  {i < ORDER_STEPS_TRAINER.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 mt-[-16px] ${i < currentIndex ? "bg-blue-400" : "bg-gray-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
          {/* Status-Nachricht */}
          <div className={`rounded-lg p-3 ${currentStep.bgColor}`}>
            <div className="flex items-center gap-2">
              <CurrentIcon className={`w-4 h-4 ${currentStep.color}`} />
              <span className="text-sm font-medium">
                {orderStatus === "offen" && "Ihre Bestellung wurde noch nicht aufgegeben."}
                {orderStatus === "bestellt" && "Ihre Bestellung wurde aufgegeben und wird bearbeitet."}
                {orderStatus === "in_produktion" && "Ihre Trikots sind in Produktion!"}
                {orderStatus === "geliefert" && "Ihre Trikots wurden geliefert. Viel Spaß!"}
              </span>
            </div>
          </div>
          {orderStatus === "offen" && (
            <p className="text-xs text-muted-foreground mt-2">
              Der Spartenleiter wird die Bestellung aufgeben, sobald alle Konfigurationen und Zahlungen abgeschlossen sind.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────────────────────
export default function TrainerDashboard() {
  const params = useParams<{
    id?: string;
    deptId?: string;
    teamId?: string;
  }>();
  const orgId = parseInt(params.id || "0");
  const deptId = parseInt(params.deptId || "0");
  const teamId = params.teamId ? parseInt(params.teamId) : null;

  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Shield className="w-12 h-12 text-primary mx-auto mb-2" />
            <CardTitle>Anmeldung erforderlich</CardTitle>
            <CardDescription>
              Bitte melden Sie sich an, um Ihre Mannschaft zu verwalten.
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

  if (!orgId || !deptId) {
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

  if (teamId) {
    return <TeamDetail orgId={orgId} deptId={deptId} teamId={teamId} />;
  }

  return <TeamList orgId={orgId} deptId={deptId} />;
}

// ─── Mockup Gallery Section ─────────────────────────────────────────────────────
function MockupGallerySection({ teamId, teamName, orgId }: { teamId: number; teamName: string; orgId: number }) {
  const utils = trpc.useUtils();
  const { data: mockups, isLoading } = trpc.mockupGallery.listByTeam.useQuery({ teamId });
  const deleteMockup = trpc.mockupGallery.delete.useMutation({
    onSuccess: () => {
      utils.mockupGallery.listByTeam.invalidate({ teamId });
      toast.success("Mockup gelöscht");
    },
    onError: () => toast.error("Löschen fehlgeschlagen"),
  });

  // Sponsoren für Freigabe
  const { data: sponsors } = trpc.sponsorTemplate.list.useQuery({ orgId });
  const submitApproval = trpc.mockupApproval.submit.useMutation({
    onSuccess: (data) => {
      const reviewUrl = `${window.location.origin}/sponsor-review/${data.reviewToken}`;
      navigator.clipboard.writeText(reviewUrl).catch(() => {});
      toast.success(
        `Freigabe-Link erstellt${data.sponsorEmail ? " f\u00fcr " + data.sponsorEmail : ""}! Link in Zwischenablage kopiert.`,
        { duration: 6000 }
      );
    },
    onError: (err) => toast.error(err.message),
  });
  const [approvalMockupId, setApprovalMockupId] = useState<number | null>(null);

  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<number[]>([]);
  const [showCompareDialog, setShowCompareDialog] = useState(false);
  const [pdfExporting, setPdfExporting] = useState(false);

  const handleShare = (shareToken: string) => {
    const shareUrl = `${window.location.origin}/mockup/${shareToken}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Share-Link in Zwischenablage kopiert!");
  };

  const handleDownload = (imageUrl: string, title: string | null) => {
    const a = document.createElement("a");
    a.href = storageUrl(imageUrl) || imageUrl;
    a.download = `${(title || teamName).replace(/\s+/g, "_")}_Mockup.png`;
    a.target = "_blank";
    a.click();
  };

  const toggleCompareSelect = (mockupId: number) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(mockupId)) return prev.filter((id) => id !== mockupId);
      if (prev.length >= 2) return [prev[1], mockupId];
      return [...prev, mockupId];
    });
  };

  const handleOpenCompare = () => {
    if (selectedForCompare.length === 2) {
      setShowCompareDialog(true);
    } else {
      toast.error("Bitte genau 2 Mockups zum Vergleichen auswählen");
    }
  };

  const handlePdfExport = async () => {
    if (!mockups || mockups.length === 0) return;
    setPdfExporting(true);
    try {
      // Build a printable HTML document with all mockups
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error("Popup-Blocker verhindert den PDF-Export");
        setPdfExporting(false);
        return;
      }

      const mockupHtml = mockups.map((m) => `
        <div style="page-break-inside: avoid; margin-bottom: 40px; text-align: center;">
          <img src="${storageUrl(m.imageUrl) || m.imageUrl}" style="max-width: 100%; max-height: 500px; object-fit: contain; border: 1px solid #e5e7eb; border-radius: 8px;" crossorigin="anonymous" />
          <div style="margin-top: 12px;">
            <h3 style="margin: 0; font-size: 16px; font-weight: 600;">${m.title || "KI-Mockup"}</h3>
            <p style="margin: 4px 0 0; font-size: 12px; color: #6b7280;">${m.side === "front" ? "Vorderseite" : "Rückseite"} &bull; ${new Date(m.createdAt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}</p>
          </div>
        </div>
      `).join("");

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${teamName} - Mockup-Galerie</title>
          <style>
            @page { margin: 20mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
            .header h1 { margin: 0; font-size: 24px; color: #1f2937; }
            .header p { margin: 8px 0 0; font-size: 14px; color: #6b7280; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
            @media print { .grid { grid-template-columns: 1fr 1fr; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${teamName} - Mockup-Galerie</h1>
            <p>${mockups.length} Mockup${mockups.length !== 1 ? "s" : ""} &bull; Erstellt am ${new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}</p>
          </div>
          <div class="grid">
            ${mockupHtml}
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();

      // Wait for images to load then trigger print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          setPdfExporting(false);
        }, 500);
      };
      // Fallback timeout
      setTimeout(() => setPdfExporting(false), 5000);
    } catch (err) {
      toast.error("PDF-Export fehlgeschlagen");
      setPdfExporting(false);
    }
  };

  const compareItems = selectedForCompare
    .map((id) => mockups?.find((m) => m.id === id))
    .filter(Boolean);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <h2 className="text-xl font-bold">KI-Mockup Galerie</h2>
          {mockups && mockups.length > 0 && (
            <Badge variant="secondary" className="text-xs">{mockups.length}</Badge>
          )}
        </div>
        {mockups && mockups.length >= 2 && (
          <div className="flex gap-2">
            <Button
              variant={compareMode ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setCompareMode(!compareMode);
                setSelectedForCompare([]);
              }}
            >
              <Image className="w-4 h-4 mr-1" />
              {compareMode ? "Vergleich beenden" : "Vergleichen"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePdfExport}
              disabled={pdfExporting}
            >
              {pdfExporting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}
              PDF-Export
            </Button>
          </div>
        )}
      </div>

      {compareMode && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-blue-700">
            {selectedForCompare.length === 0
              ? "Wähle 2 Mockups zum Vergleichen aus"
              : selectedForCompare.length === 1
              ? "Noch 1 Mockup auswählen"
              : "2 Mockups ausgewählt"}
          </p>
          {selectedForCompare.length === 2 && (
            <Button size="sm" onClick={handleOpenCompare}>
              Vergleich öffnen
            </Button>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : !mockups || mockups.length === 0 ? (
        <div className="text-center py-8 bg-muted/30 rounded-xl border border-dashed">
          <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-1">Noch keine Mockups gespeichert</p>
          <p className="text-sm text-muted-foreground">
            Erstelle im Konfigurator ein KI-Mockup und speichere es hier.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockups.map((mockup) => (
            <Card
              key={mockup.id}
              className={`overflow-hidden group cursor-pointer transition-all ${
                compareMode && selectedForCompare.includes(mockup.id)
                  ? "ring-2 ring-blue-500 ring-offset-2"
                  : ""
              }`}
              onClick={compareMode ? () => toggleCompareSelect(mockup.id) : undefined}
            >
              <div className="relative aspect-square bg-muted">
                <img
                  src={storageUrl(mockup.imageUrl) || mockup.imageUrl}
                  alt={mockup.title || "KI-Mockup"}
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="text-[10px]">
                    {mockup.side === "front" ? "Vorderseite" : "Rückseite"}
                  </Badge>
                </div>
                {compareMode && selectedForCompare.includes(mockup.id) && (
                  <div className="absolute top-2 left-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {selectedForCompare.indexOf(mockup.id) + 1}
                    </div>
                  </div>
                )}
              </div>
              {!compareMode && (
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium truncate">
                        {mockup.title || "KI-Mockup"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(mockup.createdAt).toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleShare(mockup.shareToken!)}
                        title="Teilen"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleDownload(mockup.imageUrl, mockup.title)}
                        title="Herunterladen"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm("Mockup wirklich löschen?")) {
                            deleteMockup.mutate({ id: mockup.id });
                          }
                        }}
                        title="Löschen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      {sponsors && sponsors.length > 0 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-amber-600 hover:text-amber-700"
                          onClick={() => setApprovalMockupId(mockup.id)}
                          title="Zur Freigabe einreichen"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {/* Freigabe-Status */}
                  <MockupApprovalStatus mockupId={mockup.id} />
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Freigabe-Dialog */}
      <Dialog open={approvalMockupId !== null} onOpenChange={(open) => !open && setApprovalMockupId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-amber-600" />
              Zur Freigabe einreichen
            </DialogTitle>
            <DialogDescription>
              Wähle den Sponsor, der dieses Mockup freigeben soll.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {sponsors?.map((sponsor: any) => (
              <Button
                key={sponsor.id}
                variant="outline"
                className="w-full justify-start gap-3 h-auto py-3"
                disabled={submitApproval.isPending}
                onClick={async () => {
                  if (approvalMockupId) {
                    await submitApproval.mutateAsync({ mockupId: approvalMockupId, sponsorId: sponsor.id });
                    setApprovalMockupId(null);
                  }
                }}
              >
                {sponsor.logoUrl && (
                  <SponsorLogoImage src={storageUrl(sponsor.logoUrl) || sponsor.logoUrl} alt={sponsor.name} className="w-8 h-8 object-contain rounded" />
                )}
                <div className="text-left">
                  <p className="font-medium text-sm">{sponsor.name}</p>
                  {(sponsor as any).contactEmail && (
                    <p className="text-xs text-muted-foreground">{(sponsor as any).contactEmail}</p>
                  )}
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Compare Dialog */}
      <Dialog open={showCompareDialog} onOpenChange={setShowCompareDialog}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Mockup-Vergleich</DialogTitle>
            <DialogDescription>
              Vergleiche zwei Mockups nebeneinander
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-6 py-4">
            {compareItems.map((mockup, idx) => (
              <div key={mockup!.id} className="space-y-3">
                <div className="aspect-square bg-muted rounded-lg overflow-hidden border">
                  <img
                    src={storageUrl(mockup!.imageUrl) || mockup!.imageUrl}
                    alt={mockup!.title || "KI-Mockup"}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-center">
                  <p className="font-medium text-sm">{mockup!.title || "KI-Mockup"}</p>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-[10px]">
                      {mockup!.side === "front" ? "Vorderseite" : "Rückseite"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(mockup!.createdAt).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompareDialog(false)}>
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Mockup Approval Status Badge ─────────────────────────────────────────────────────────────
function MockupApprovalStatus({ mockupId }: { mockupId: number }) {
  const { data: approvals } = trpc.mockupApproval.statusForMockup.useQuery({ mockupId });
  
  if (!approvals || approvals.length === 0) return null;

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 border-amber-300",
    approved: "bg-green-100 text-green-800 border-green-300",
    rejected: "bg-red-100 text-red-800 border-red-300",
  };
  const statusLabels: Record<string, string> = {
    pending: "Ausstehend",
    approved: "Freigegeben",
    rejected: "Abgelehnt",
  };

  return (
    <div className="mt-2 space-y-1">
      {approvals.map((a: any) => (
        <div key={a.id} className="flex items-center gap-1.5">
          <Badge className={`text-[9px] px-1.5 py-0 ${statusColors[a.status] || ""}`}>
            {statusLabels[a.status] || a.status}
          </Badge>
          {a.reviewedBy && <span className="text-[10px] text-muted-foreground">von {a.reviewedBy}</span>}
          {a.reviewNote && <span className="text-[10px] text-muted-foreground italic">- {a.reviewNote}</span>}
        </div>
      ))}
    </div>
  );
}

// ─── Trainer Comment Section ───────────────────────────────────────────────────────────────────────
function TrainerCommentSection({ teamId, teamName }: { teamId: number; teamName: string }) { const [showThread, setShowThread] = useState(false);
  const teamIds = useMemo(() => [teamId], [teamId]);
  const { data: unreadCounts } = trpc.orderComment.getUnreadCounts.useQuery(
    { teamIds },
    { refetchInterval: 30000 }
  );
  const { data: commentCounts } = trpc.orderComment.countByTeams.useQuery(
    { teamIds },
    { enabled: teamIds.length > 0 }
  );

  const unreadCount = unreadCounts?.[teamId] || 0;
  const totalCount = commentCounts?.[teamId] || 0;

  if (showThread) {
    return (
      <div>
        <OrderCommentThread
          teamId={teamId}
          teamName={teamName}
          trainerName="Spartenleiter"
          onBack={() => setShowThread(false)}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold">Kommunikation</h2>
          {unreadCount > 0 && (
            <Badge className="bg-blue-600 text-white text-xs px-1.5 py-0 h-5 animate-pulse">
              {unreadCount} neu
            </Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowThread(true)}
          className="gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          {totalCount > 0 ? `${totalCount} Nachrichten` : "Nachricht schreiben"}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Kommunizieren Sie hier direkt mit dem Spartenleiter Ihrer Abteilung.
      </p>
      {unreadCount > 0 && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700 font-medium">
            Sie haben {unreadCount} ungelesene {unreadCount === 1 ? "Nachricht" : "Nachrichten"} vom Spartenleiter.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Trainer Member Section (Mannschaftsmitglieder, optional) ──────────────────
function TrainerMemberSection({ orgId, deptId, teams }: { orgId: number; deptId: number; teams: any[] }) {
  const { data: departments } = trpc.department.listByOrg.useQuery(
    { orgId },
    { enabled: orgId > 0 }
  );

  const deptTeams = teams.filter(t => t.departmentId === deptId);

  if (deptTeams.length === 0) return null;

  return (
    <div className="mt-6">
      <Separator className="mb-6" />
      <MemberManagement
        orgId={orgId}
        primaryColor={null}
        secondaryColor={null}
        userRole="trainer"
        departments={departments?.map(d => ({ id: d.id, name: d.name })) || []}
        teams={deptTeams.map(t => ({ id: t.id, name: t.name, departmentId: t.departmentId }))}
        filterDepartmentId={deptId}
      />
    </div>
  );
}

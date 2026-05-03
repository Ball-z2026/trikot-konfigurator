import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  Building2, Users, Image, Type, Plus, Trash2, Star, StarOff,
  ArrowLeft, Upload, Shield, UserPlus, Pencil, Shirt, LogIn,
  ChevronRight, Loader2, Megaphone, Library, FolderOpen, Lock, CheckCircle2,
  MapPin, Hash, Save, Phone, Mail, Globe, FileText, Calendar, User, Landmark, Palette
} from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { Link, useLocation, useParams } from "wouter";
import OrgOnboarding from "./OrgOnboarding";
import { toast } from "sonner";
import { storageUrl } from "@/lib/utils";

// ─── Org List (when no org selected) ─────────────────────────────────────────
function OrgList() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { data: orgs, isLoading } = trpc.org.list.useQuery(undefined, { enabled: isAuthenticated });
  const utils = trpc.useUtils();

  const [showCreate, setShowCreate] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgType, setNewOrgType] = useState<"verein" | "firma">("verein");
  const [newOrgState, setNewOrgState] = useState("");
  const [newOrgSport, setNewOrgSport] = useState("");

  const createOrg = trpc.org.create.useMutation({
    onSuccess: (data) => {
      utils.org.list.invalidate();
      setShowCreate(false);
      setNewOrgName("");
      toast.success("Organisation erstellt");
      setLocation(`/org/${data.id}`);
    },
    onError: (err) => toast.error(err.message),
  });

  if (loading || isLoading) {
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
            <CardDescription>Bitte melden Sie sich an, um Ihre Organisation zu verwalten.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button className="w-full"><LogIn className="w-4 h-4 mr-2" />Anmelden</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-30">
        <div className="container flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold">Meine Organisationen</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Vereine und Firmen verwalten</p>
            </div>
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-2" />Neue Organisation</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Organisation erstellen</DialogTitle>
                <DialogDescription>Erstellen Sie einen neuen Verein oder eine Firma.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    placeholder="z.B. FC Musterstadt"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Typ</Label>
                  <Select value={newOrgType} onValueChange={(v) => setNewOrgType(v as "verein" | "firma")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="verein">Verein</SelectItem>
                      <SelectItem value="firma">Firma</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Bundesland</Label>
                  <Select value={newOrgState} onValueChange={setNewOrgState}>
                    <SelectTrigger><SelectValue placeholder="Bundesland wählen..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bw">Baden-Württemberg</SelectItem>
                      <SelectItem value="by">Bayern</SelectItem>
                      <SelectItem value="be">Berlin</SelectItem>
                      <SelectItem value="bb">Brandenburg</SelectItem>
                      <SelectItem value="hb">Bremen</SelectItem>
                      <SelectItem value="hh">Hamburg</SelectItem>
                      <SelectItem value="he">Hessen</SelectItem>
                      <SelectItem value="mv">Mecklenburg-Vorpommern</SelectItem>
                      <SelectItem value="ni">Niedersachsen</SelectItem>
                      <SelectItem value="nw">Nordrhein-Westfalen</SelectItem>
                      <SelectItem value="rp">Rheinland-Pfalz</SelectItem>
                      <SelectItem value="sl">Saarland</SelectItem>
                      <SelectItem value="sn">Sachsen</SelectItem>
                      <SelectItem value="st">Sachsen-Anhalt</SelectItem>
                      <SelectItem value="sh">Schleswig-Holstein</SelectItem>
                      <SelectItem value="th">Thüringen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Hauptsportart</Label>
                  <Select value={newOrgSport} onValueChange={setNewOrgSport}>
                    <SelectTrigger><SelectValue placeholder="Sportart wählen..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fussball">Fußball</SelectItem>
                      <SelectItem value="handball">Handball</SelectItem>
                      <SelectItem value="volleyball">Volleyball</SelectItem>
                      <SelectItem value="basketball">Basketball</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Abbrechen</Button>
                <Button
                  onClick={() => createOrg.mutate({ name: newOrgName, type: newOrgType, state: newOrgState || undefined, sport: newOrgSport || undefined })}
                  disabled={!newOrgName.trim() || createOrg.isPending}
                >
                  {createOrg.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Erstellen
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="container py-8">
        {(!orgs || orgs.length === 0) ? (
          <div className="text-center py-16 bg-muted/30 rounded-xl border border-dashed">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground mb-2">Noch keine Organisation vorhanden</p>
            <p className="text-sm text-muted-foreground mb-6">Erstellen Sie einen Verein oder eine Firma, um loszulegen.</p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-2" />Organisation erstellen
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {orgs.map((org: any) => (
              <Card
                key={org.id}
                className="group cursor-pointer hover:shadow-lg transition-all overflow-hidden"
                onClick={() => setLocation(`/org/${org.id}`)}
              >
                {/* Vereinsfarben-Akzent oben */}
                {org.primaryColor && (
                  <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${org.primaryColor} 0%, ${org.secondaryColor || org.primaryColor} 100%)` }} />
                )}
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: org.primaryColor ? `${org.primaryColor}20` : undefined }}
                      >
                        <Building2 className="w-5 h-5" style={{ color: org.primaryColor || undefined }} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{org.jerseyName || org.name}</CardTitle>
                        <CardDescription>
                          <Badge variant="secondary" className="text-xs mt-1">
                            {org.type === "verein" ? "Verein" : "Firma"}
                          </Badge>
                          {!org.onboardingComplete && (
                            <Badge variant="outline" className="text-xs mt-1 ml-1 text-amber-600 border-amber-300">
                              Einrichtung ausstehend
                            </Badge>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
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

// ─── Org Detail Dashboard ────────────────────────────────────────────────────
function OrgDetail({ orgId }: { orgId: number }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: org, isLoading: orgLoading } = trpc.org.getById.useQuery({ id: orgId });
  const { data: departments } = trpc.department.listByOrg.useQuery({ orgId });
  const { data: members } = trpc.membership.listByOrg.useQuery({ orgId });
  const { data: logos } = trpc.orgLogo.list.useQuery({ orgId });
  const { data: sponsorTemplates } = trpc.sponsorTemplate.list.useQuery({ orgId });

  const isOwner = org?.userRole === "owner";
  const isDeptLead = org?.userRole === "department_lead";
  const isTrainer = org?.userRole === "trainer";
  const canManageLogos = isOwner || isDeptLead;

  // ─── Department CRUD ───
  const [showAddDept, setShowAddDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const createDept = trpc.department.create.useMutation({
    onSuccess: () => { utils.department.listByOrg.invalidate({ orgId }); setShowAddDept(false); setNewDeptName(""); toast.success("Abteilung erstellt"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteDept = trpc.department.delete.useMutation({
    onSuccess: () => { utils.department.listByOrg.invalidate({ orgId }); toast.success("Abteilung gelöscht"); },
    onError: (e) => toast.error(e.message),
  });

  // ─── Member CRUD ───
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberDeptId, setMemberDeptId] = useState<number | undefined>(undefined);
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState<{ email: string; password: string; name: string } | null>(null);
  const addDeptLead = trpc.membership.addDepartmentLead.useMutation({
    onSuccess: (data) => {
      utils.membership.listByOrg.invalidate({ orgId });
      if (data.generatedPassword) {
        // Zeige die generierten Zugangsdaten an
        setCredentials({
          email: data.userEmail || memberEmail,
          password: data.generatedPassword,
          name: data.userName || memberName,
        });
        setShowAddMember(false);
        setShowCredentials(true);
      } else {
        setShowAddMember(false);
        toast.success(`${data.userName || data.userEmail} als Spartenleiter eingeladen`);
      }
      setMemberName("");
      setMemberEmail("");
      setMemberDeptId(undefined);
    },
    onError: (e) => toast.error(e.message),
  });
  const removeMember = trpc.membership.remove.useMutation({
    onSuccess: () => { utils.membership.listByOrg.invalidate({ orgId }); toast.success("Mitglied entfernt"); },
    onError: (e) => toast.error(e.message),
  });

  // ─── Sponsor Templates ───
  const [showAddSponsor, setShowAddSponsor] = useState(false);
  const [sponsorName, setSponsorName] = useState("");
  const [sponsorCategory, setSponsorCategory] = useState("");
  const [sponsorFile, setSponsorFile] = useState<File | null>(null);
  const [sponsorPreview, setSponsorPreview] = useState<string | null>(null);
  const sponsorFileRef = useRef<HTMLInputElement>(null);

  const createSponsor = trpc.sponsorTemplate.create.useMutation({
    onSuccess: () => { utils.sponsorTemplate.list.invalidate({ orgId }); setShowAddSponsor(false); setSponsorName(""); setSponsorCategory(""); setSponsorFile(null); setSponsorPreview(null); toast.success("Sponsor-Vorlage erstellt"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteSponsorTpl = trpc.sponsorTemplate.delete.useMutation({
    onSuccess: () => { utils.sponsorTemplate.list.invalidate({ orgId }); toast.success("Sponsor-Vorlage gelöscht"); },
    onError: (e) => toast.error(e.message),
  });

  const handleSponsorFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Datei zu groß (max. 5 MB)"); return; }
    setSponsorFile(file);
    const reader = new FileReader();
    reader.onload = () => setSponsorPreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleUploadSponsor = useCallback(async () => {
    if (!sponsorFile || !sponsorName.trim()) return;
    // Überdrucken- und Transparenz-Prüfung
    try {
      const { checkUploadFile } = await import("@/hooks/useUploadChecks");
      const checkResult = await checkUploadFile(sponsorFile);
      for (const w of checkResult.warnings) {
        toast.warning(w.message, { duration: 10000 });
      }
    } catch { /* Bei Fehler fortfahren */ }
    // DPI-Prüfung: Sponsor-Logos werden typisch bei 26x10cm (Brust) gedruckt (nur Bilder)
    const isPdfSponsor = sponsorFile.type === "application/pdf" || sponsorFile.name.toLowerCase().endsWith(".pdf");
    if (!isPdfSponsor) try {
      const { checkImageDpi } = await import("@/hooks/useDpiCheck");
      const result = await checkImageDpi(sponsorFile, 26, 10);
      if (result.status === "warning") {
        toast.warning(result.message, { duration: 8000 });
      } else if (result.status === "ok") {
        toast.success(result.message);
      }
    } catch { /* Bei Fehler fortfahren */ }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      createSponsor.mutate({
        orgId,
        name: sponsorName,
        logoBase64: base64,
        mimeType: sponsorFile.type,
        category: sponsorCategory || undefined,
      });
    };
    reader.readAsDataURL(sponsorFile);
  }, [sponsorFile, sponsorName, sponsorCategory, orgId, createSponsor]);

  // ─── Logo Upload ───
  const [showUploadLogo, setShowUploadLogo] = useState(false);
  const [logoName, setLogoName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isDefaultLogo, setIsDefaultLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadLogo = trpc.orgLogo.upload.useMutation({
    onSuccess: () => { utils.orgLogo.list.invalidate({ orgId }); setShowUploadLogo(false); setLogoName(""); setLogoFile(null); setLogoPreview(null); toast.success("Logo hochgeladen"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteLogo = trpc.orgLogo.delete.useMutation({
    onSuccess: () => { utils.orgLogo.list.invalidate({ orgId }); toast.success("Logo gelöscht"); },
    onError: (e) => toast.error(e.message),
  });
  const setDefault = trpc.orgLogo.update.useMutation({
    onSuccess: () => { utils.orgLogo.list.invalidate({ orgId }); toast.success("Standard-Logo gesetzt"); },
    onError: (e) => toast.error(e.message),
  });

  const handleLogoFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Datei zu groß (max. 5 MB)"); return; }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleUploadLogo = useCallback(async () => {
    if (!logoFile || !logoName.trim()) return;
    // Überdrucken- und Transparenz-Prüfung
    try {
      const { checkUploadFile } = await import("@/hooks/useUploadChecks");
      const checkResult = await checkUploadFile(logoFile);
      for (const w of checkResult.warnings) {
        toast.warning(w.message, { duration: 10000 });
      }
    } catch { /* Bei Fehler fortfahren */ }
    // DPI-Prüfung: Vereinswappen wird bei 10x10cm gedruckt (nur Bilder)
    const isPdfLogo = logoFile.type === "application/pdf" || logoFile.name.toLowerCase().endsWith(".pdf");
    if (!isPdfLogo) try {
      const { checkImageDpi } = await import("@/hooks/useDpiCheck");
      const result = await checkImageDpi(logoFile, 10, 10);
      if (result.status === "warning") {
        toast.warning(result.message, { duration: 8000 });
      } else if (result.status === "ok") {
        toast.success(result.message);
      }
    } catch { /* Bei Fehler fortfahren */ }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadLogo.mutate({
        orgId,
        name: logoName,
        imageBase64: base64,
        mimeType: logoFile.type,
        isDefault: isDefaultLogo,
      });
    };
    reader.readAsDataURL(logoFile);
  }, [logoFile, logoName, isDefaultLogo, orgId, uploadLogo]);

  if (orgLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Organisation nicht gefunden</p>
      </div>
    );
  }

  // Onboarding-Check: Wenn nicht abgeschlossen und User ist Owner, zeige Onboarding-Wizard
  if (!org.onboardingComplete && org.userRole === "owner") {
    return (
      <OrgOnboarding
        orgId={orgId}
        orgName={org.name}
        onComplete={() => {
          utils.org.getById.invalidate({ id: orgId });
        }}
      />
    );
  }

  const roleLabel = (role: string) => {
    switch (role) {
      case "owner": return "Hauptverantwortlicher";
      case "department_lead": return "Spartenleiter";
      case "trainer": return "Trainer";
      default: return role;
    }
  };

  // Vereinslogo aus der Logo-Liste holen (Default-Logo)
  const defaultLogo = logos?.find((l: any) => l.isDefault) || logos?.[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Header - eingefärbt in Vereinsfarben */}
      <header
        className="border-b sticky top-0 z-30"
        style={{
          backgroundColor: org.primaryColor || undefined,
          borderColor: org.secondaryColor || undefined,
        }}
      >
        <div className="container flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center gap-3">
            <Link href="/org">
              <Button variant="ghost" size="icon" className={org.primaryColor ? "text-white hover:bg-white/20" : ""}><ArrowLeft className="w-5 h-5" /></Button>
            </Link>
            <div className="flex items-center gap-3">
              {defaultLogo ? (
                <img src={storageUrl(defaultLogo.imageUrl)} alt="Logo" className="w-10 h-10 rounded-lg object-contain bg-white/90 p-0.5" />
              ) : (
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: org.secondaryColor || 'rgba(0,0,0,0.1)' }}>
                  <Building2 className="w-5 h-5" style={{ color: org.primaryColor ? '#fff' : undefined }} />
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold" style={{ color: org.primaryColor ? '#fff' : undefined }}>{org.jerseyName || org.name}</h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    {org.type === "verein" ? "Verein" : "Firma"}
                  </Badge>
                  {org.state && <Badge variant="outline" className="text-xs">
                    {{bw:"BaWü",by:"Bayern",be:"Berlin",bb:"Brandenburg",hb:"Bremen",hh:"Hamburg",he:"Hessen",mv:"MV",ni:"Niedersachsen",nw:"NRW",rp:"RLP",sl:"Saarland",sn:"Sachsen",st:"Sachsen-Anhalt",sh:"SH",th:"Thüringen"}[org.state] || org.state}
                  </Badge>}
                  {org.sport && <Badge variant="outline" className="text-xs">
                    {{fussball:"Fußball",handball:"Handball",volleyball:"Volleyball",basketball:"Basketball"}[org.sport] || org.sport}
                  </Badge>}
                  {isOwner && <Badge className="text-xs">Hauptverantwortlicher</Badge>}
                </div>
              </div>
            </div>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm" className={org.primaryColor ? "border-white/40 text-white hover:bg-white/20" : ""}>
              <Shirt className="w-4 h-4 mr-2" />Konfigurator
            </Button>
          </Link>
        </div>
      </header>

      <div className="container py-6">
        <Tabs defaultValue={isOwner ? "stammdaten" : isDeptLead ? "departments" : "members"}>
          <TabsList className="mb-6 flex-wrap">
            {/* Owner sieht alle Tabs */}
            {isOwner && <TabsTrigger value="stammdaten" className="gap-2"><Building2 className="w-4 h-4" />Übersicht</TabsTrigger>}
            {isOwner && <TabsTrigger value="logos" className="gap-2"><Image className="w-4 h-4" />Logos</TabsTrigger>}
            {/* Owner + SL sehen Sponsoren */}
            {(isOwner || isDeptLead) && <TabsTrigger value="sponsors" className="gap-2"><Megaphone className="w-4 h-4" />Sponsoren</TabsTrigger>}
            {/* Owner + SL sehen Abteilungen */}
            {(isOwner || isDeptLead) && <TabsTrigger value="departments" className="gap-2"><Building2 className="w-4 h-4" />Abteilungen</TabsTrigger>}
            {/* Alle sehen Mitglieder (gefiltert nach Rolle im Backend) */}
            <TabsTrigger value="members" className="gap-2"><Users className="w-4 h-4" />Mitglieder</TabsTrigger>
            {/* Owner + SL sehen Kollektionen */}
            {(isOwner || isDeptLead) && <TabsTrigger value="collections" className="gap-2"><Library className="w-4 h-4" />Kollektionen</TabsTrigger>}
          </TabsList>

          {/* ─── Stammdaten Tab ─── */}
          <TabsContent value="stammdaten">
            <OrgStammdaten org={org} orgId={orgId} isOwner={isOwner} />
          </TabsContent>

          {/* ─── Logos Tab ─── */}
          <TabsContent value="logos">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Logo-Varianten</h2>
                <p className="text-sm text-muted-foreground">Laden Sie verschiedene Logo-Varianten hoch (Farb-Logo, SW-Logo, Mini-Logo etc.)</p>
              </div>
              {canManageLogos && (
                <Dialog open={showUploadLogo} onOpenChange={setShowUploadLogo}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Upload className="w-4 h-4 mr-2" />Logo hochladen</Button>
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
                          placeholder="z.B. Farb-Logo, SW-Logo, Mini-Logo"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Bilddatei</Label>
                        <input
                          ref={fileInputRef}
                          type="file"
accept=".pdf,image/png,image/jpeg,image/svg+xml,image/webp"
                           onChange={handleLogoFileChange}
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
               <p className="text-sm text-muted-foreground">Klicken zum Auswählen (PDF bevorzugt, max. 5 MB)</p>
                             </div>
                           )}

                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="isDefault"
                          checked={isDefaultLogo}
                          onChange={(e) => setIsDefaultLogo(e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="isDefault">Als Standard-Logo setzen</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowUploadLogo(false)}>Abbrechen</Button>
                      <Button
                        onClick={handleUploadLogo}
                        disabled={!logoName.trim() || !logoFile || uploadLogo.isPending}
                      >
                        {uploadLogo.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Hochladen
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {(!logos || logos.length === 0) ? (
              <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
                <Image className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Noch keine Logos hochgeladen</p>
                {canManageLogos && (
                  <Button className="mt-4" size="sm" onClick={() => setShowUploadLogo(true)}>
                    <Upload className="w-4 h-4 mr-2" />Erstes Logo hochladen
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {logos.map((logo) => (
                  <Card key={logo.id} className="overflow-hidden">
                    <div className="aspect-square bg-muted/30 flex items-center justify-center p-4 relative">
                      <img src={storageUrl(logo.imageUrl)} alt={logo.name} className="max-w-full max-h-full object-contain" />
                      {logo.isDefault && (
                        <Badge className="absolute top-2 right-2 gap-1">
                          <Star className="w-3 h-3" />Standard
                        </Badge>
                      )}
                    </div>
                    <CardContent className="pt-3">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{logo.name}</p>
                        {canManageLogos && (
                          <div className="flex items-center gap-1">
                            {!logo.isDefault && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setDefault.mutate({ id: logo.id, orgId, isDefault: true })}
                                title="Als Standard setzen"
                              >
                                <StarOff className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => { if (confirm("Logo wirklich löschen?")) deleteLogo.mutate({ id: logo.id, orgId }); }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ─── Sponsors Tab ─── */}
          <TabsContent value="sponsors">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Sponsor-Vorlagen</h2>
                <p className="text-sm text-muted-foreground">Hinterlegen Sie häufig verwendete Sponsoren-Logos, die Trainer per Klick einfügen können.</p>
              </div>
              {isOwner && (
                <Dialog open={showAddSponsor} onOpenChange={setShowAddSponsor}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="w-4 h-4 mr-2" />Sponsor hinzufügen</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Sponsor-Vorlage erstellen</DialogTitle>
                      <DialogDescription>Laden Sie ein Sponsor-Logo hoch, das Trainer in Sponsor-Zonen verwenden können.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Sponsor-Name</Label>
                        <Input
                          value={sponsorName}
                          onChange={(e) => setSponsorName(e.target.value)}
                          placeholder="z.B. Stadtwerke Musterstadt"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Kategorie (optional)</Label>
                        <Select value={sponsorCategory} onValueChange={setSponsorCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Kategorie wählen..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hauptsponsor">Hauptsponsor</SelectItem>
                            <SelectItem value="co-sponsor">Co-Sponsor</SelectItem>
                            <SelectItem value="ausruester">Ausrüster</SelectItem>
                            <SelectItem value="sonstige">Sonstige</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Logo-Datei</Label>
                        <input
                          ref={sponsorFileRef}
                          type="file"
accept=".pdf,image/png,image/jpeg,image/svg+xml,image/webp"
                           onChange={handleSponsorFileChange}
                          className="hidden"
                        />
                        <div
                          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                          onClick={() => sponsorFileRef.current?.click()}
                        >
                          {sponsorPreview ? (
                            <img src={sponsorPreview} alt="Vorschau" className="max-h-32 mx-auto" />
                          ) : (
                            <div>
                              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">Klicken zum Auswählen (PDF bevorzugt, max. 5 MB)</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddSponsor(false)}>Abbrechen</Button>
                      <Button
                        onClick={handleUploadSponsor}
                        disabled={!sponsorName.trim() || !sponsorFile || createSponsor.isPending}
                      >
                        {createSponsor.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Erstellen
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {(!sponsorTemplates || sponsorTemplates.length === 0) ? (
              <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
                <Megaphone className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Noch keine Sponsor-Vorlagen hinterlegt</p>
                <p className="text-xs text-muted-foreground mt-1">Sponsor-Logos können von Trainern direkt in Sponsor-Zonen eingefügt werden.</p>
                {isOwner && (
                  <Button className="mt-4" size="sm" onClick={() => setShowAddSponsor(true)}>
                    <Plus className="w-4 h-4 mr-2" />Ersten Sponsor hinzufügen
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sponsorTemplates.map((tpl) => (
                  <Card key={tpl.id} className="overflow-hidden">
                    <div className="aspect-video bg-muted/30 flex items-center justify-center p-4 relative">
                      <img src={storageUrl(tpl.logoUrl)} alt={tpl.name} className="max-w-full max-h-full object-contain" />
                      {tpl.category && (
                        <Badge variant="secondary" className="absolute top-2 right-2 text-xs">
                          {{hauptsponsor:"Hauptsponsor","co-sponsor":"Co-Sponsor",ausruester:"Ausrüster",sonstige:"Sonstige"}[tpl.category] || tpl.category}
                        </Badge>
                      )}
                    </div>
                    <CardContent className="pt-3">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{tpl.name}</p>
                        {isOwner && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => { if (confirm("Sponsor-Vorlage wirklich löschen?")) deleteSponsorTpl.mutate({ id: tpl.id, orgId }); }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ─── Departments Tab ─── */}
          <TabsContent value="departments">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Abteilungen / Sparten</h2>
                <p className="text-sm text-muted-foreground">Verwalten Sie die Abteilungen Ihrer Organisation</p>
              </div>
              {isOwner && (
                <Dialog open={showAddDept} onOpenChange={setShowAddDept}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="w-4 h-4 mr-2" />Neue Abteilung</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Abteilung erstellen</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={newDeptName}
                          onChange={(e) => setNewDeptName(e.target.value)}
                          placeholder="z.B. Fußball Herren, Handball Damen"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddDept(false)}>Abbrechen</Button>
                      <Button
                        onClick={() => createDept.mutate({ orgId, name: newDeptName })}
                        disabled={!newDeptName.trim() || createDept.isPending}
                      >
                        {createDept.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Erstellen
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {(!departments || departments.length === 0) ? (
              <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
                <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Noch keine Abteilungen vorhanden</p>
                {isOwner && (
                  <Button className="mt-4" size="sm" onClick={() => setShowAddDept(true)}>
                    <Plus className="w-4 h-4 mr-2" />Erste Abteilung erstellen
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {departments.map((dept) => {
                  const deptMembers = members?.filter(m => m.departmentId === dept.id) ?? [];
                  return (
                    <Card key={dept.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                              <Building2 className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-base">{dept.name}</CardTitle>
                              <CardDescription>{deptMembers.length} Mitglieder</CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Link href={`/org/${orgId}/dept/${dept.id}`}>
                              <Button variant="outline" size="sm">
                                <Type className="w-4 h-4 mr-2" />Schriften
                              </Button>
                            </Link>
                            {isOwner && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => { if (confirm(`Abteilung "${dept.name}" wirklich löschen?`)) deleteDept.mutate({ id: dept.id, orgId }); }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      {deptMembers.length > 0 && (
                        <CardContent className="pt-0">
                          <div className="flex flex-wrap gap-2 mt-2">
                            {deptMembers.map((m) => (
                              <Badge key={m.id} variant="outline" className="text-xs">
                                {m.userName || m.userEmail} – {roleLabel(m.role)}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ─── Members Tab ─── */}
          <TabsContent value="members">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Mitglieder</h2>
                <p className="text-sm text-muted-foreground">Verwalten Sie die Mitglieder Ihrer Organisation</p>
              </div>
              {isOwner && (
                <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
                  <DialogTrigger asChild>
                    <Button size="sm"><UserPlus className="w-4 h-4 mr-2" />Spartenleiter einladen</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Spartenleiter einladen</DialogTitle>
                      <DialogDescription>
                        Laden Sie einen Spartenleiter für eine Abteilung ein. Der Spartenleiter kann dann selbst Trainer für seine Abteilung einladen.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                        <p className="font-medium text-foreground mb-1">Einladungskette:</p>
                        <p>Sie (Hauptverantwortlicher) → Spartenleiter → Trainer</p>
                        <p className="mt-1">Der Spartenleiter erhält automatisch Zugangsdaten (E-Mail + Passwort) und kann sich damit anmelden.</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Name <span className="text-destructive">*</span></Label>
                        <Input
                          type="text"
                          value={memberName}
                          onChange={(e) => setMemberName(e.target.value)}
                          placeholder="Max Mustermann"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>E-Mail-Adresse <span className="text-destructive">*</span></Label>
                        <Input
                          type="email"
                          value={memberEmail}
                          onChange={(e) => setMemberEmail(e.target.value)}
                          placeholder="spartenleiter@beispiel.de"
                        />
                      </div>
                      {departments && departments.length > 0 && (
                        <div className="space-y-2">
                          <Label>Abteilung <span className="text-destructive">*</span></Label>
                          <Select
                            value={memberDeptId?.toString() || ""}
                            onValueChange={(v) => setMemberDeptId(parseInt(v))}
                          >
                            <SelectTrigger><SelectValue placeholder="Abteilung wählen..." /></SelectTrigger>
                            <SelectContent>
                              {departments.map((d) => (
                                <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddMember(false)}>Abbrechen</Button>
                      <Button
                        onClick={() => {
                          if (!memberDeptId) { toast.error("Bitte wählen Sie eine Abteilung"); return; }
                          addDeptLead.mutate({
                            orgId,
                            userName: memberName,
                            userEmail: memberEmail,
                            departmentId: memberDeptId,
                          });
                        }}
                        disabled={!memberName.trim() || !memberEmail.trim() || !memberDeptId || addDeptLead.isPending}
                      >
                        {addDeptLead.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Einladen
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {/* Zugangsdaten-Dialog nach erfolgreicher Einladung */}
              <Dialog open={showCredentials} onOpenChange={setShowCredentials}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Zugangsdaten erstellt</DialogTitle>
                    <DialogDescription>
                      Der Benutzer wurde erfolgreich eingeladen. Bitte teilen Sie die folgenden Zugangsdaten mit.
                    </DialogDescription>
                  </DialogHeader>
                  {credentials && (
                    <div className="space-y-4 py-4">
                      <div className="rounded-lg bg-green-50 border border-green-200 p-4 space-y-3">
                        <div>
                          <p className="text-sm font-medium text-green-800">Name</p>
                          <p className="text-sm text-green-700 font-mono">{credentials.name}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-800">E-Mail</p>
                          <p className="text-sm text-green-700 font-mono">{credentials.email}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-800">Passwort</p>
                          <p className="text-lg text-green-700 font-mono font-bold tracking-wider">{credentials.password}</p>
                        </div>
                      </div>
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                        <p className="font-medium">Wichtig:</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Notieren Sie das Passwort jetzt – es wird nicht erneut angezeigt.</li>
                          <li>Der Benutzer wird beim ersten Login aufgefordert, das Passwort zu ändern.</li>
                          <li>Login-Seite: <span className="font-mono">/login</span></li>
                        </ul>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `Zugangsdaten f\u00fcr den Textil-Konfigurator:\nName: ${credentials.name}\nE-Mail: ${credentials.email}\nPasswort: ${credentials.password}\nLogin: ${window.location.origin}/login`
                          );
                          toast.success("Zugangsdaten in die Zwischenablage kopiert");
                        }}
                      >
                        Zugangsdaten kopieren
                      </Button>
                    </div>
                  )}
                  <DialogFooter>
                    <Button onClick={() => { setShowCredentials(false); setCredentials(null); }}>Schlie\u00dfen</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {(!members || members.length === 0) ? (
              <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
                <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Noch keine Mitglieder</p>
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((m) => (
                  <Card key={m.id}>
                    <CardContent className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {(m.userName || m.userEmail || "?").charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{m.userName || m.userEmail}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant={m.role === "owner" ? "default" : "secondary"} className="text-xs">
                              {roleLabel(m.role)}
                            </Badge>
                            {m.departmentName && (
                              <span className="text-xs text-muted-foreground">{m.departmentName}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {isOwner && m.role !== "owner" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => { if (confirm("Mitglied wirklich entfernen?")) removeMember.mutate({ id: m.id, orgId }); }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ─── Kollektionen Tab ─── */}
          <TabsContent value="collections">
            <OrgCollectionsSection orgId={orgId} isOwner={isOwner} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ─── Kollektionen-Verwaltung (Owner) ──────────────────────────────────────────────────────
function OrgCollectionsSection({ orgId, isOwner }: { orgId: number; isOwner: boolean }) {
  const utils = trpc.useUtils();
  const { data: collections, isLoading } = trpc.collection.list.useQuery(
    { orgId },
    { enabled: orgId > 0 }
  );

  const [showCreate, setShowCreate] = useState(false);
  const [collName, setCollName] = useState("");
  const [collDesc, setCollDesc] = useState("");
  const [enforcement, setEnforcement] = useState<"optional" | "mandatory">("optional");

  const createColl = trpc.collection.create.useMutation({
    onSuccess: () => {
      utils.collection.list.invalidate({ orgId });
      setShowCreate(false);
      setCollName("");
      setCollDesc("");
      setEnforcement("optional");
      toast.success("Vereinskollektion erstellt");
    },
    onError: (e) => toast.error(e.message),
  });

  const setEnforcementMut = trpc.collection.setEnforcement.useMutation({
    onSuccess: () => {
      utils.collection.list.invalidate({ orgId });
      toast.success("Verbindlichkeit geändert");
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

  const allCollections = collections || [];
  const orgCollections = allCollections.filter((c: any) => c.scope === "org");
  const otherCollections = allCollections.filter((c: any) => c.scope !== "org");

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Library className="w-5 h-5" />
            Vereinskollektionen
          </h2>
          <p className="text-sm text-muted-foreground">
            Erstellen Sie Kollektionen für den gesamten Verein (optional oder Pflicht)
          </p>
        </div>
        {isOwner && (
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Vereinskollektion
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Vereinskollektion erstellen</DialogTitle>
                <DialogDescription>
                  Diese Kollektion gilt für den gesamten Verein. Sie können sie als optional oder als Pflicht markieren.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input placeholder="z.B. Vereinskollektion 2025/26" value={collName} onChange={(e) => setCollName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Beschreibung (optional)</Label>
                  <Input placeholder="Kurze Beschreibung" value={collDesc} onChange={(e) => setCollDesc(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Verbindlichkeit</Label>
                  <Select value={enforcement} onValueChange={(v) => setEnforcement(v as "optional" | "mandatory")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="optional">Optional (zur Auswahl)</SelectItem>
                      <SelectItem value="mandatory">Pflicht (für alle Mannschaften)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Abbrechen</Button>
                <Button
                  onClick={() => createColl.mutate({ name: collName, description: collDesc || undefined, orgId, scope: "org", enforcement })}
                  disabled={!collName.trim() || createColl.isPending}
                >
                  {createColl.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Erstellen
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : allCollections.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>Noch keine Kollektionen vorhanden.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Vereinskollektionen */}
          {orgCollections.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Vereinskollektionen</h3>
              <div className="space-y-3">
                {orgCollections.map((coll: any) => (
                  <Card key={coll.id} className={coll.enforcement === "mandatory" ? "border-destructive/30" : ""}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{coll.name}</span>
                          {coll.enforcement === "mandatory" ? (
                            <Badge variant="destructive" className="text-[10px]"><Lock className="w-3 h-3 mr-1" /> Pflicht</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] bg-green-100 text-green-700">Optional</Badge>
                          )}
                        </div>
                        {isOwner && (
                          <div className="flex items-center gap-2">
                            {/* Toggle Pflicht/Optional */}
                            <Button variant="outline" size="sm"
                              onClick={() => setEnforcementMut.mutate({
                                id: coll.id,
                                enforcement: coll.enforcement === "mandatory" ? "optional" : "mandatory"
                              })}>
                              {coll.enforcement === "mandatory" ? "Auf Optional setzen" : "Auf Pflicht setzen"}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                              onClick={() => { if (confirm(`"${coll.name}" löschen?`)) deleteColl.mutate({ id: coll.id }); }}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                      {coll.description && <p className="text-xs text-muted-foreground mt-1">{coll.description}</p>}
                      {coll.items && coll.items.length > 0 && (
                        <div className="flex gap-2 mt-3 overflow-x-auto">
                          {coll.items.slice(0, 8).map((item: any) => (
                            <div key={item.id} className="w-12 h-12 rounded border bg-muted/30 overflow-hidden shrink-0">
                              {item.design?.thumbnailUrl ? (
                                <img src={storageUrl(item.design.thumbnailUrl)} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><Shirt className="w-4 h-4 text-muted-foreground" /></div>
                              )}
                            </div>
                          ))}
                          {coll.items.length > 8 && (
                            <div className="w-12 h-12 rounded border bg-muted/30 flex items-center justify-center shrink-0">
                              <span className="text-xs text-muted-foreground">+{coll.items.length - 8}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Andere Kollektionen (Sparten/Teams) */}
          {otherCollections.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Übersicht: Sparten- & Team-Kollektionen</h3>
              <div className="space-y-2">
                {otherCollections.map((coll: any) => {
                  const scopeLabel = coll.scope === "department" ? "Sparte" : "Team";
                  const scopeColor = coll.scope === "department" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700";
                  return (
                    <Card key={coll.id}>
                      <CardContent className="py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{coll.name}</span>
                            <Badge variant="outline" className={`text-[10px] ${scopeColor}`}>{scopeLabel}</Badge>
                            <span className="text-xs text-muted-foreground">{coll.items?.length || 0} Designs</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── OrgStammdaten Komponente ──────────────────────────────────────────────────────────────────────
function OrgStammdaten({ org, orgId, isOwner }: { org: any; orgId: number; isOwner: boolean }) {
  const utils = trpc.useUtils();
  // Vereinsdaten
  const [officialName, setOfficialName] = useState(org.officialName || "");
  const [foundedYear, setFoundedYear] = useState<string>(org.foundedYear?.toString() || "");
  // Ansprechpartner
  const [contactFirstName, setContactFirstName] = useState(org.contactFirstName || "");
  const [contactLastName, setContactLastName] = useState(org.contactLastName || "");
  const [contactRole, setContactRole] = useState(org.contactRole || "");
  // Kontaktdaten
  const [phone, setPhone] = useState(org.phone || "");
  const [email, setEmail] = useState(org.email || "");
  const [website, setWebsite] = useState(org.website || "");
  const [fax, setFax] = useState(org.fax || "");
  // Adresse
  const [street, setStreet] = useState(org.street || "");
  const [zip, setZip] = useState(org.zip || "");
  const [city, setCity] = useState(org.city || "");
  const [country, setCountry] = useState(org.country || "Deutschland");
  // Rechtliches
  const [registerNumber, setRegisterNumber] = useState(org.registerNumber || "");
  const [taxId, setTaxId] = useState(org.taxId || "");
  // Vereinsfarben & Trikotname
  const [primaryColor, setPrimaryColor] = useState(org.primaryColor || "");
  const [secondaryColor, setSecondaryColor] = useState(org.secondaryColor || "");
  const [jerseyName, setJerseyName] = useState(org.jerseyName || "");
  // Hashtag
  const [hashtag, setHashtag] = useState(org.hashtag || "");
  const [saving, setSaving] = useState(false);

  const updateOrg = trpc.org.update.useMutation({
    onSuccess: () => {
      utils.org.getById.invalidate({ id: orgId });
      toast.success("Stammdaten gespeichert");
      setSaving(false);
    },
    onError: (e) => { toast.error(e.message); setSaving(false); },
  });

  const handleSave = () => {
    setSaving(true);
    const cleanHashtag = hashtag.trim() ? (hashtag.trim().startsWith("#") ? hashtag.trim() : `#${hashtag.trim()}`) : undefined;
    updateOrg.mutate({
      id: orgId,
      officialName: officialName || undefined,
      foundedYear: foundedYear ? parseInt(foundedYear) : undefined,
      contactFirstName: contactFirstName || undefined,
      contactLastName: contactLastName || undefined,
      contactRole: contactRole || undefined,
      phone: phone || undefined,
      email: email || undefined,
      website: website || undefined,
      fax: fax || undefined,
      street: street || undefined,
      zip: zip || undefined,
      city: city || undefined,
      country: country || undefined,
      registerNumber: registerNumber || undefined,
      taxId: taxId || undefined,
      hashtag: cleanHashtag,
      primaryColor: primaryColor || undefined,
      secondaryColor: secondaryColor || undefined,
      jerseyName: jerseyName || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Vereinsfarben & Trikotname */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Palette className="w-5 h-5" />Vereinsfarben & Trikotname</CardTitle>
          <CardDescription>Primär- und Sekundärfarbe sowie der Name auf dem Trikot.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Primärfarbe</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={primaryColor || "#003399"} onChange={(e) => setPrimaryColor(e.target.value)} className="w-10 h-10 rounded border cursor-pointer" disabled={!isOwner} />
                <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="font-mono w-28" maxLength={7} disabled={!isOwner} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Sekundärfarbe</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={secondaryColor || "#ffffff"} onChange={(e) => setSecondaryColor(e.target.value)} className="w-10 h-10 rounded border cursor-pointer" disabled={!isOwner} />
                <Input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="font-mono w-28" maxLength={7} disabled={!isOwner} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Vereinsname auf dem Trikot</Label>
              <Input value={jerseyName} onChange={(e) => setJerseyName(e.target.value)} placeholder="z.B. TSV Musterstadt" disabled={!isOwner} />
            </div>
          </div>
          {primaryColor && secondaryColor && (
            <div className="mt-2 p-4 rounded-lg" style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor} 60%, ${secondaryColor} 100%)` }}>
              <p className="text-white font-bold drop-shadow-md">{jerseyName || org.name}</p>
              <p className="text-white/70 text-xs">Vereinsfarben-Vorschau</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vereinsdaten */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Landmark className="w-5 h-5" />Vereinsdaten</CardTitle>
          <CardDescription>Offizielle Bezeichnung und Grunddaten des Vereins.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Offizielle Vereinsbezeichnung</Label>
              <Input value={officialName} onChange={(e) => setOfficialName(e.target.value)} placeholder="z.B. Turn- und Sportverein Musterstadt 1920 e.V." disabled={!isOwner} />
            </div>
            <div className="space-y-2">
              <Label>Kurzname</Label>
              <Input value={org.name} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Wird in der Vereins-Übersicht geändert.</p>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Gründungsjahr</Label>
              <Input type="number" value={foundedYear} onChange={(e) => setFoundedYear(e.target.value)} placeholder="z.B. 1920" min={1800} max={2100} disabled={!isOwner} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ansprechpartner */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="w-5 h-5" />Ansprechpartner</CardTitle>
          <CardDescription>Hauptansprechpartner des Vereins für Rückfragen.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Vorname</Label>
              <Input value={contactFirstName} onChange={(e) => setContactFirstName(e.target.value)} placeholder="Max" disabled={!isOwner} />
            </div>
            <div className="space-y-2">
              <Label>Nachname</Label>
              <Input value={contactLastName} onChange={(e) => setContactLastName(e.target.value)} placeholder="Mustermann" disabled={!isOwner} />
            </div>
            <div className="space-y-2">
              <Label>Funktion/Rolle</Label>
              <Input value={contactRole} onChange={(e) => setContactRole(e.target.value)} placeholder="z.B. 1. Vorsitzender" disabled={!isOwner} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kontaktdaten */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Phone className="w-5 h-5" />Kontaktdaten</CardTitle>
          <CardDescription>Erreichbarkeit des Vereins.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />Telefon</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="z.B. 0231 123456" disabled={!isOwner} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />Fax</Label>
              <Input value={fax} onChange={(e) => setFax(e.target.value)} placeholder="z.B. 0231 123457" disabled={!isOwner} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />E-Mail</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@tsv-musterstadt.de" disabled={!isOwner} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" />Website</Label>
              <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="www.tsv-musterstadt.de" disabled={!isOwner} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Adresse & Koordinaten */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5" />Adresse & Koordinaten</CardTitle>
          <CardDescription>Die Koordinaten werden automatisch aus der Adresse berechnet und können als Zone auf Produkten verwendet werden.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Straße & Hausnummer</Label>
              <Input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="z.B. Sportplatzstraße 1" disabled={!isOwner} />
            </div>
            <div className="space-y-2">
              <Label>PLZ</Label>
              <Input value={zip} onChange={(e) => setZip(e.target.value)} placeholder="z.B. 44135" disabled={!isOwner} />
            </div>
            <div className="space-y-2">
              <Label>Ort</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="z.B. Dortmund" disabled={!isOwner} />
            </div>
            <div className="space-y-2">
              <Label>Land</Label>
              <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Deutschland" disabled={!isOwner} />
            </div>
          </div>
          {(org.latitude && org.longitude) ? (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Koordinaten (automatisch ermittelt)</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Breitengrad:</span>{" "}
                  <span className="font-mono">{org.latitude.toFixed(6)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Längengrad:</span>{" "}
                  <span className="font-mono">{org.longitude.toFixed(6)}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Diese Koordinaten stehen als Zone-Typ im Produktdesigner zur Verfügung.</p>
            </div>
          ) : (
            <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <MapPin className="w-4 h-4 inline mr-1" />
                Geben Sie eine Adresse ein und speichern Sie, um die Koordinaten automatisch zu berechnen.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rechtliches */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" />Rechtliches</CardTitle>
          <CardDescription>Vereinsregister und steuerliche Angaben.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Vereinsregister-Nr.</Label>
              <Input value={registerNumber} onChange={(e) => setRegisterNumber(e.target.value)} placeholder="z.B. VR 12345" disabled={!isOwner} />
            </div>
            <div className="space-y-2">
              <Label>Steuernummer / USt-IdNr.</Label>
              <Input value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="z.B. DE123456789" disabled={!isOwner} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hashtag */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Hash className="w-5 h-5" />Vereins-Hashtag</CardTitle>
          <CardDescription>Der Hashtag kann als Zone auf Produkten platziert werden (z.B. auf der Rückseite eines Trikots).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <span className="text-2xl text-muted-foreground">#</span>
            <Input
              value={hashtag.replace(/^#/, "")}
              onChange={(e) => setHashtag(e.target.value.replace(/^#/, ""))}
              placeholder="z.B. TSVMusterstadt"
              className="max-w-sm font-mono text-lg"
              disabled={!isOwner}
            />
          </div>
          {hashtag && (
            <p className="mt-3 text-sm text-muted-foreground">
              Vorschau: <span className="font-mono font-bold text-foreground">#{hashtag.replace(/^#/, "")}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Speichern-Button */}
      {isOwner && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Stammdaten speichern
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Main Export ────────────────────────────────────────────────────────────────────────────────
export default function OrgDashboard() {
  const params = useParams<{ id?: string }>();
  const orgId = params.id ? parseInt(params.id) : null;
  if (!orgId) return <OrgList />;
  return <OrgDetail orgId={orgId} />;
}
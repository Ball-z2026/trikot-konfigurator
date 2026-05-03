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
  MapPin, Hash, Save, Phone, Mail, Globe, FileText, Calendar, User, Landmark, Palette, RefreshCw, Crop,
  ShieldCheck, CalendarDays
} from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import { Link, useLocation, useParams } from "wouter";
import OrgOnboarding from "./OrgOnboarding";
import { toast } from "sonner";
import { storageUrl } from "@/lib/utils";
import { PdfPreview } from "@/components/PdfPreview";
import { SponsorLogoImage } from "@/components/SponsorLogoImage";
import { LogoCropEditor } from "@/components/LogoCropEditor";

// ─── Org List (when no org selected) ─────────────────────────────────────────
function OrgList() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { data: orgs, isLoading, refetch: refetchOrgs, isFetching, dataUpdatedAt } = trpc.org.list.useQuery(undefined, { enabled: isAuthenticated });
  const utils = trpc.useUtils();

  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const prevDataRef = useRef<string>("");

  useEffect(() => {
    if (orgs) {
      const snapshot = JSON.stringify(orgs);
      if (prevDataRef.current && prevDataRef.current !== snapshot) {
        setLastUpdated(new Date());
      }
      prevDataRef.current = snapshot;
    }
  }, [orgs]);
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
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              Zuletzt aktualisiert: {lastUpdated.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { refetchOrgs(); }}
              disabled={isFetching}
              title="Status aktualisieren"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {orgs.map((org: any) => (
              <Card
                key={org.id}
                className="group cursor-pointer hover:shadow-xl transition-all overflow-hidden relative"
                onClick={() => setLocation(`/org/${org.id}`)}
              >
                {/* Vereinsfarben-Gradient oben */}
                <div
                  className="h-24 relative"
                  style={{
                    background: org.primaryColor
                      ? `linear-gradient(135deg, ${org.primaryColor} 0%, ${org.primaryColor}cc 60%, ${org.secondaryColor || org.primaryColor}60 100%)`
                      : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.7) 100%)',
                  }}
                >
                  {/* Wasserzeichen-Logo in der Karte */}
                  {org.defaultLogoUrl && (
                    <div className="absolute inset-0 flex items-center justify-end pr-4 overflow-hidden">
                      <img
                        src={storageUrl(org.defaultLogoUrl)}
                        alt=""
                        className="w-16 h-16 object-contain opacity-20"
                        style={{ filter: 'brightness(10)' }}
                      />
                    </div>
                  )}
                  {/* Logo-Badge */}
                  <div className="absolute -bottom-5 left-4">
                    {org.defaultLogoUrl ? (
                      <div className="w-12 h-12 rounded-xl bg-white p-1 shadow-md flex items-center justify-center ring-2 ring-white">
                        <img src={storageUrl(org.defaultLogoUrl)} alt="Logo" className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md ring-2 ring-white"
                        style={{ backgroundColor: org.primaryColor ? `${org.primaryColor}` : 'hsl(var(--primary))' }}
                      >
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>
                </div>
                <CardHeader className="pt-8 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold">{org.jerseyName || org.name}</CardTitle>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <Badge
                          className="text-[10px]"
                          style={org.primaryColor ? { backgroundColor: `${org.primaryColor}15`, color: org.primaryColor, border: `1px solid ${org.primaryColor}30` } : undefined}
                        >
                          {org.type === "verein" ? "Verein" : "Firma"}
                        </Badge>
                        {org.sport && <Badge variant="outline" className="text-[10px]">
                          {{fussball:"Fu\u00dfball",handball:"Handball",volleyball:"Volleyball",basketball:"Basketball"}[org.sport as string] || org.sport}
                        </Badge>}
                        {!org.onboardingComplete && (
                          <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 bg-amber-50">
                            Einrichtung ausstehend
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" style={{ color: org.primaryColor || undefined }} />
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
  const { data: allTeams } = trpc.team.listByOrg.useQuery({ orgId });

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
  const [sponsorForm, setSponsorForm] = useState({
    name: "", sponsorType: "hauptsponsor" as "hauptsponsor" | "spartensponsor" | "mannschaftssponsor",
    obligation: "nicht_verpflichtend" as "alle_produkte" | "nur_trikot" | "nicht_verpflichtend",
    departmentId: undefined as number | undefined, teamId: undefined as number | undefined,
    contactFirstName: "", contactLastName: "", contactEmail: "", contactPhone: "",
    street: "", zip: "", city: "", country: "Deutschland",
    vatId: "", billingDifferent: false, billingStreet: "", billingZip: "", billingCity: "", billingCountry: "Deutschland",
    sponsoringAmount: "",
  });
  const [sponsorFile, setSponsorFile] = useState<File | null>(null);
  const [sponsorPreview, setSponsorPreview] = useState<string | null>(null);
  const sponsorFileRef = useRef<HTMLInputElement>(null);

  const resetSponsorForm = useCallback(() => {
    setSponsorForm({
      name: "", sponsorType: "hauptsponsor", obligation: "nicht_verpflichtend",
      departmentId: undefined, teamId: undefined,
      contactFirstName: "", contactLastName: "", contactEmail: "", contactPhone: "",
      street: "", zip: "", city: "", country: "Deutschland",
      vatId: "", billingDifferent: false, billingStreet: "", billingZip: "", billingCity: "", billingCountry: "Deutschland",
      sponsoringAmount: "",
    });
    setSponsorFile(null);
    setSponsorPreview(null);
  }, []);

  const createSponsor = trpc.sponsorTemplate.create.useMutation({
    onSuccess: () => { utils.sponsorTemplate.list.invalidate({ orgId }); setShowAddSponsor(false); resetSponsorForm(); toast.success("Sponsor-Vorlage erstellt"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteSponsorTpl = trpc.sponsorTemplate.delete.useMutation({
    onSuccess: () => { utils.sponsorTemplate.list.invalidate({ orgId }); toast.success("Sponsor-Vorlage gelöscht"); },
    onError: (e) => toast.error(e.message),
  });

  // Logo-Crop-Editor State
  const [cropSponsor, setCropSponsor] = useState<{ id: number; name: string; logoUrl: string } | null>(null);
  const updateLogoMut = trpc.sponsorTemplate.updateLogo.useMutation({
    onSuccess: () => {
      utils.sponsorTemplate.list.invalidate({ orgId });
      setCropSponsor(null);
      toast.success("Logo zugeschnitten und gespeichert");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSponsorFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Datei zu groß (max. 5 MB)"); return; }
    setSponsorFile(file);
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (isPdf) {
      setSponsorPreview(null);
    } else {
      const reader = new FileReader();
      reader.onload = () => setSponsorPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const handleUploadSponsor = useCallback(async () => {
    if (!sponsorFile || !sponsorForm.name.trim()) return;
    // Pflichtfelder prüfen
    const missing: string[] = [];
    if (!sponsorForm.contactFirstName) missing.push("Vorname");
    if (!sponsorForm.contactLastName) missing.push("Nachname");
    if (!sponsorForm.contactEmail) missing.push("E-Mail");
    if (!sponsorForm.street) missing.push("Straße");
    if (!sponsorForm.zip) missing.push("PLZ");
    if (!sponsorForm.city) missing.push("Ort");
    if (missing.length > 0) {
      toast.error(`Bitte alle Pflichtfelder ausfüllen: ${missing.join(", ")}`);
      return;
    }
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
        name: sponsorForm.name,
        logoBase64: base64,
        mimeType: sponsorFile.type,
        sponsorType: sponsorForm.sponsorType,
        obligation: sponsorForm.obligation,
        departmentId: sponsorForm.sponsorType === "spartensponsor" ? sponsorForm.departmentId : undefined,
        teamId: sponsorForm.sponsorType === "mannschaftssponsor" ? sponsorForm.teamId : undefined,
        contactFirstName: sponsorForm.contactFirstName || undefined,
        contactLastName: sponsorForm.contactLastName || undefined,
        contactEmail: sponsorForm.contactEmail || undefined,
        contactPhone: sponsorForm.contactPhone || undefined,
        street: sponsorForm.street || undefined,
        zip: sponsorForm.zip || undefined,
        city: sponsorForm.city || undefined,
        country: sponsorForm.country || undefined,
        vatId: sponsorForm.vatId || undefined,
        billingDifferent: sponsorForm.billingDifferent,
        billingStreet: sponsorForm.billingDifferent ? (sponsorForm.billingStreet || undefined) : undefined,
        billingZip: sponsorForm.billingDifferent ? (sponsorForm.billingZip || undefined) : undefined,
        billingCity: sponsorForm.billingDifferent ? (sponsorForm.billingCity || undefined) : undefined,
        billingCountry: sponsorForm.billingDifferent ? (sponsorForm.billingCountry || undefined) : undefined,
        sponsoringAmount: sponsorForm.sponsoringAmount ? parseFloat(sponsorForm.sponsoringAmount) : undefined,
      });
    };
    reader.readAsDataURL(sponsorFile);
  }, [sponsorFile, sponsorForm, orgId, createSponsor]);

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

  // Onboarding-Check: Wenn nicht abgeschlossen, zeige Onboarding-Wizard für alle Rollen
  if (!org.onboardingComplete) {
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
    <div className="min-h-screen bg-background relative">
      {/* Wasserzeichen-Logo als Hintergrund über die komplette Seite */}
      {defaultLogo && (
        <div
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: `url(${storageUrl(defaultLogo.imageUrl)})`,
            backgroundRepeat: 'repeat',
            backgroundSize: '200px 200px',
            backgroundPosition: 'center center',
            opacity: 0.08,
            filter: 'grayscale(50%)',
          }}
        />
      )}

      {/* Header - eingefärbt in Vereinsfarben */}
      <header
        className="border-b sticky top-0 z-30 shadow-md"
        style={{
          background: org.primaryColor
            ? `linear-gradient(135deg, ${org.primaryColor} 0%, ${org.primaryColor}dd 60%, ${org.secondaryColor || org.primaryColor}40 100%)`
            : undefined,
          borderColor: org.secondaryColor || undefined,
        }}
      >
        <div className="container flex items-center justify-between h-20 sm:h-24">
          <div className="flex items-center gap-4">
            <Link href="/org">
              <Button variant="ghost" size="icon" className={org.primaryColor ? "text-white hover:bg-white/20" : ""}><ArrowLeft className="w-5 h-5" /></Button>
            </Link>
            <div className="flex items-center gap-4">
              {defaultLogo ? (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white/95 p-1.5 shadow-md flex items-center justify-center">
                  <img src={storageUrl(defaultLogo.imageUrl)} alt="Logo" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center" style={{ backgroundColor: org.secondaryColor || 'rgba(255,255,255,0.15)' }}>
                  <Building2 className="w-8 h-8" style={{ color: org.primaryColor ? '#fff' : undefined }} />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold tracking-tight" style={{ color: org.primaryColor ? '#fff' : undefined }}>{org.jerseyName || org.name}</h1>
                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                  <Badge
                    className="text-xs border-0"
                    style={org.primaryColor ? {
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: '#fff',
                    } : undefined}
                  >
                    {org.type === "verein" ? "Verein" : "Firma"}
                  </Badge>
                  {org.state && <Badge
                    variant="outline"
                    className="text-xs"
                    style={org.primaryColor ? {
                      borderColor: 'rgba(255,255,255,0.35)',
                      color: '#fff',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                    } : undefined}
                  >
                    {{bw:"BaWü",by:"Bayern",be:"Berlin",bb:"Brandenburg",hb:"Bremen",hh:"Hamburg",he:"Hessen",mv:"MV",ni:"Niedersachsen",nw:"NRW",rp:"RLP",sl:"Saarland",sn:"Sachsen",st:"Sachsen-Anhalt",sh:"SH",th:"Thüringen"}[org.state] || org.state}
                  </Badge>}
                  {org.sport && <Badge
                    variant="outline"
                    className="text-xs"
                    style={org.primaryColor ? {
                      borderColor: 'rgba(255,255,255,0.35)',
                      color: '#fff',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                    } : undefined}
                  >
                    {{fussball:"Fußball",handball:"Handball",volleyball:"Volleyball",basketball:"Basketball"}[org.sport] || org.sport}
                  </Badge>}
                  {isOwner && <Badge
                    className="text-xs"
                    style={org.primaryColor ? {
                      backgroundColor: org.secondaryColor || 'rgba(255,255,255,0.25)',
                      color: org.primaryColor,
                    } : undefined}
                  >Hauptverantwortlicher</Badge>}
                </div>
              </div>
            </div>
          </div>
          <Link href="/">
            <Button
              size="sm"
              className={org.primaryColor ? "shadow-sm font-semibold" : ""}
              style={org.primaryColor ? {
                backgroundColor: org.secondaryColor || '#fff',
                color: org.primaryColor,
                border: 'none',
              } : undefined}
            >
              <Shirt className="w-4 h-4 mr-2" />Konfigurator
            </Button>
          </Link>
        </div>
      </header>

      {/* Farbiger Akzentstreifen unter dem Header */}
      {org.primaryColor && org.secondaryColor && (
        <div className="h-1" style={{ background: `linear-gradient(90deg, ${org.primaryColor} 0%, ${org.secondaryColor} 50%, ${org.primaryColor} 100%)` }} />
      )}

      <div className="container py-6 relative z-10">
        <Tabs defaultValue={isOwner ? "stammdaten" : isDeptLead ? "departments" : "members"}>
          <TabsList
            className="mb-6 flex-wrap bg-muted/50 p-1 rounded-xl"
            style={org.primaryColor ? {
              '--tab-active-bg': org.primaryColor,
              '--tab-active-text': '#fff',
            } as React.CSSProperties : undefined}
          >
            {/* Owner sieht alle Tabs */}
            {isOwner && <TabsTrigger value="stammdaten" className="gap-2 data-[state=active]:shadow-sm" style={org.primaryColor ? { '--tw-shadow-color': org.primaryColor } as React.CSSProperties : undefined}><Building2 className="w-4 h-4" />Übersicht</TabsTrigger>}
            {isOwner && <TabsTrigger value="logos" className="gap-2 data-[state=active]:shadow-sm"><Image className="w-4 h-4" />Logos</TabsTrigger>}
            {/* Owner + SL sehen Sponsoren */}
            {(isOwner || isDeptLead) && <TabsTrigger value="sponsors" className="gap-2 data-[state=active]:shadow-sm"><Megaphone className="w-4 h-4" />Sponsoren</TabsTrigger>}
            {/* Owner + SL sehen Abteilungen */}
            {(isOwner || isDeptLead) && <TabsTrigger value="departments" className="gap-2 data-[state=active]:shadow-sm"><Building2 className="w-4 h-4" />Abteilungen</TabsTrigger>}
            {/* Alle sehen Mitglieder (gefiltert nach Rolle im Backend) */}
            <TabsTrigger value="members" className="gap-2 data-[state=active]:shadow-sm"><Users className="w-4 h-4" />Mitglieder</TabsTrigger>
            {/* Owner + SL sehen Kollektionen */}
            {(isOwner || isDeptLead) && <TabsTrigger value="collections" className="gap-2 data-[state=active]:shadow-sm"><Library className="w-4 h-4" />Kollektionen</TabsTrigger>}
            {isOwner && <TabsTrigger value="supplier" className="gap-2 data-[state=active]:shadow-sm"><ShieldCheck className="w-4 h-4" />Ausstatter</TabsTrigger>}
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
                    <Button size="sm" style={org.primaryColor ? { backgroundColor: org.primaryColor, color: '#fff' } : undefined}><Upload className="w-4 h-4 mr-2" />Logo hochladen</Button>
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
                <Dialog open={showAddSponsor} onOpenChange={(open) => { setShowAddSponsor(open); if (!open) resetSponsorForm(); }}>
                  <DialogTrigger asChild>
                    <Button size="sm" style={org.primaryColor ? { backgroundColor: org.primaryColor, color: '#fff' } : undefined}><Plus className="w-4 h-4 mr-2" />Sponsor hinzufügen</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Neuen Sponsor anlegen</DialogTitle>
                      <DialogDescription>Alle mit * markierten Felder sind Pflichtfelder für die Rechnungsstellung.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 mt-4">
                      {/* Grunddaten */}
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Grunddaten</h3>
                        <div className="space-y-3">
                          <div>
                            <Label>Firmenname / Sponsor-Name <span className="text-red-500">*</span></Label>
                            <Input value={sponsorForm.name} onChange={(e) => setSponsorForm(p => ({...p, name: e.target.value}))} placeholder="z.B. Stadtwerke Musterstadt" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label>Sponsor-Typ</Label>
                              <Select value={sponsorForm.sponsorType} onValueChange={(v: any) => setSponsorForm(p => ({...p, sponsorType: v}))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="hauptsponsor">Hauptsponsor</SelectItem>
                                  <SelectItem value="spartensponsor">Spartensponsor</SelectItem>
                                  <SelectItem value="mannschaftssponsor">Mannschaftssponsor</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Verpflichtung</Label>
                              <Select value={sponsorForm.obligation} onValueChange={(v: any) => setSponsorForm(p => ({...p, obligation: v}))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="alle_produkte">Alle Produkte</SelectItem>
                                  <SelectItem value="nur_trikot">Nur Trikots</SelectItem>
                                  <SelectItem value="nicht_verpflichtend">Nicht verpflichtend</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          {/* Sparten-Auswahl bei Spartensponsor */}
                          {sponsorForm.sponsorType === "spartensponsor" && (
                            <div>
                              <Label>Sparte / Abteilung <span className="text-red-500">*</span></Label>
                              <Select value={sponsorForm.departmentId?.toString() || ""} onValueChange={(v) => setSponsorForm(p => ({...p, departmentId: Number(v), teamId: undefined}))}>
                                <SelectTrigger><SelectValue placeholder="Sparte auswählen..." /></SelectTrigger>
                                <SelectContent>
                                  {departments?.map((dept) => (
                                    <SelectItem key={dept.id} value={dept.id.toString()}>{dept.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {(!departments || departments.length === 0) && (
                                <p className="text-xs text-muted-foreground mt-1">Keine Abteilungen vorhanden. Bitte legen Sie zuerst eine Abteilung an.</p>
                              )}
                            </div>
                          )}
                          {/* Mannschafts-Auswahl bei Mannschaftssponsor */}
                          {sponsorForm.sponsorType === "mannschaftssponsor" && (
                            <div className="space-y-3">
                              <div>
                                <Label>Sparte / Abteilung</Label>
                                <Select value={sponsorForm.departmentId?.toString() || ""} onValueChange={(v) => setSponsorForm(p => ({...p, departmentId: Number(v), teamId: undefined}))}>
                                  <SelectTrigger><SelectValue placeholder="Sparte auswählen (optional)..." /></SelectTrigger>
                                  <SelectContent>
                                    {departments?.map((dept) => (
                                      <SelectItem key={dept.id} value={dept.id.toString()}>{dept.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Mannschaft <span className="text-red-500">*</span></Label>
                                <Select value={sponsorForm.teamId?.toString() || ""} onValueChange={(v) => setSponsorForm(p => ({...p, teamId: Number(v)}))}>
                                  <SelectTrigger><SelectValue placeholder="Mannschaft auswählen..." /></SelectTrigger>
                                  <SelectContent>
                                    {(sponsorForm.departmentId
                                      ? allTeams?.filter(t => t.departmentId === sponsorForm.departmentId)
                                      : allTeams
                                    )?.map((team) => (
                                      <SelectItem key={team.id} value={team.id.toString()}>
                                        {team.name}{team.league ? ` (${team.league})` : ""}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {(!allTeams || allTeams.length === 0) && (
                                  <p className="text-xs text-muted-foreground mt-1">Keine Mannschaften vorhanden. Bitte legen Sie zuerst eine Mannschaft an.</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Logo-Upload */}
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Logo-Datei <span className="text-red-500">*</span></h3>
                        <input ref={sponsorFileRef} type="file" accept=".pdf,image/png,image/jpeg,image/svg+xml,image/webp" onChange={handleSponsorFileChange} className="hidden" />
                        <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors" onClick={() => sponsorFileRef.current?.click()}>
                          {sponsorPreview ? (
                            <img src={sponsorPreview} alt="Vorschau" className="max-h-32 mx-auto object-contain" />
                          ) : sponsorFile ? (
                            <div><FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">{sponsorFile.name}</p></div>
                          ) : (
                            <div><Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">Klicken zum Auswählen (PDF bevorzugt, max. 5 MB)</p></div>
                          )}
                        </div>
                      </div>
                      {/* Kontaktperson */}
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Kontaktperson</h3>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div><Label>Vorname <span className="text-red-500">*</span></Label><Input value={sponsorForm.contactFirstName} onChange={(e) => setSponsorForm(p => ({...p, contactFirstName: e.target.value}))} placeholder="Max" /></div>
                            <div><Label>Nachname <span className="text-red-500">*</span></Label><Input value={sponsorForm.contactLastName} onChange={(e) => setSponsorForm(p => ({...p, contactLastName: e.target.value}))} placeholder="Mustermann" /></div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div><Label>E-Mail <span className="text-red-500">*</span></Label><Input type="email" value={sponsorForm.contactEmail} onChange={(e) => setSponsorForm(p => ({...p, contactEmail: e.target.value}))} placeholder="max@firma.de" /></div>
                            <div><Label>Telefon</Label><Input value={sponsorForm.contactPhone} onChange={(e) => setSponsorForm(p => ({...p, contactPhone: e.target.value}))} placeholder="+49 123 456789" /></div>
                          </div>
                        </div>
                      </div>
                      {/* Firmenadresse */}
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Firmenadresse</h3>
                        <div className="space-y-3">
                          <div><Label>Straße & Hausnummer <span className="text-red-500">*</span></Label><Input value={sponsorForm.street} onChange={(e) => setSponsorForm(p => ({...p, street: e.target.value}))} placeholder="Musterstraße 1" /></div>
                          <div className="grid grid-cols-3 gap-3">
                            <div><Label>PLZ <span className="text-red-500">*</span></Label><Input value={sponsorForm.zip} onChange={(e) => setSponsorForm(p => ({...p, zip: e.target.value}))} placeholder="12345" /></div>
                            <div className="col-span-2"><Label>Ort <span className="text-red-500">*</span></Label><Input value={sponsorForm.city} onChange={(e) => setSponsorForm(p => ({...p, city: e.target.value}))} placeholder="Musterstadt" /></div>
                          </div>
                          <div><Label>Land</Label><Input value={sponsorForm.country} onChange={(e) => setSponsorForm(p => ({...p, country: e.target.value}))} /></div>
                        </div>
                      </div>
                      {/* Rechnungsdaten */}
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Rechnungsdaten</h3>
                        <div><Label>USt-IdNr.</Label><Input value={sponsorForm.vatId} onChange={(e) => setSponsorForm(p => ({...p, vatId: e.target.value}))} placeholder="DE123456789" /></div>
                      </div>
                      {/* Sponsoring-Summe (nur Owner) */}
                      {isOwner && (
                        <div className="border-t pt-4">
                          <Label className="flex items-center gap-1 mb-2 font-semibold">Sponsoring-Summe (intern, nur für Sie sichtbar)</Label>
                          <div className="flex items-center gap-2">
                            <Input type="number" min="0" step="0.01" value={sponsorForm.sponsoringAmount || ""} onChange={(e) => setSponsorForm(p => ({...p, sponsoringAmount: e.target.value}))} placeholder="z.B. 5000" className="max-w-[200px]" />
                            <span className="text-sm text-muted-foreground">EUR / Saison</span>
                          </div>
                        </div>
                      )}
                      {/* Erstellen-Button */}
                      <Button
                        onClick={handleUploadSponsor}
                        disabled={!sponsorForm.name.trim() || !sponsorFile || !sponsorForm.contactFirstName || !sponsorForm.contactLastName || !sponsorForm.contactEmail || !sponsorForm.street || !sponsorForm.zip || !sponsorForm.city || (sponsorForm.sponsorType === "spartensponsor" && !sponsorForm.departmentId) || (sponsorForm.sponsorType === "mannschaftssponsor" && !sponsorForm.teamId) || createSponsor.isPending}
                        className="w-full" size="lg"
                      >
                        {createSponsor.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        {createSponsor.isPending ? "Wird angelegt..." : "Sponsor anlegen"}
                      </Button>
                      {(!sponsorForm.name.trim() || !sponsorFile || !sponsorForm.contactFirstName || !sponsorForm.contactLastName || !sponsorForm.contactEmail || !sponsorForm.street || !sponsorForm.zip || !sponsorForm.city || (sponsorForm.sponsorType === "spartensponsor" && !sponsorForm.departmentId) || (sponsorForm.sponsorType === "mannschaftssponsor" && !sponsorForm.teamId)) && (
                        <p className="text-xs text-red-500 text-center">Bitte alle Pflichtfelder (*) ausfüllen</p>
                      )}
                    </div>
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
                      {(tpl.logoMimeType === 'application/pdf' || tpl.logoUrl?.toLowerCase().endsWith('.pdf')) ? (
                        <PdfPreview url={storageUrl(tpl.logoUrl)} width={200} height={140} />
                      ) : (
                        <SponsorLogoImage src={storageUrl(tpl.logoUrl)} alt={tpl.name} className="max-w-full max-h-full object-contain" />
                      )}
                      {tpl.category && (
                        <Badge variant="secondary" className="absolute top-2 right-2 text-xs">
                          {{hauptsponsor:"Hauptsponsor","co-sponsor":"Co-Sponsor",ausruester:"Ausrüster",sonstige:"Sonstige"}[tpl.category] || tpl.category}
                        </Badge>
                      )}
                    </div>
                    <CardContent className="pt-3">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{tpl.name}</p>
                        <div className="flex items-center gap-1">
                          {tpl.logoUrl && !(tpl.logoMimeType === 'application/pdf' || tpl.logoUrl?.toLowerCase().endsWith('.pdf')) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              title="Logo zuschneiden"
                              onClick={() => setCropSponsor({ id: tpl.id, name: tpl.name, logoUrl: storageUrl(tpl.logoUrl) })}
                            >
                              <Crop className="w-4 h-4" />
                            </Button>
                          )}
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
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Logo-Crop-Editor */}
            {cropSponsor && (
              <LogoCropEditor
                open={!!cropSponsor}
                onOpenChange={(open) => { if (!open) setCropSponsor(null); }}
                imageUrl={cropSponsor.logoUrl}
                sponsorName={cropSponsor.name}
                isSaving={updateLogoMut.isPending}
                onSave={async (blob) => {
                  const reader = new FileReader();
                  reader.onload = () => {
                    const base64 = (reader.result as string).split(",")[1];
                    updateLogoMut.mutate({
                      id: cropSponsor.id,
                      orgId,
                      logoBase64: base64,
                      mimeType: "image/png",
                    });
                  };
                  reader.readAsDataURL(blob);
                }}
              />
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
                    <Button size="sm" style={org.primaryColor ? { backgroundColor: org.primaryColor, color: '#fff' } : undefined}><Plus className="w-4 h-4 mr-2" />Neue Abteilung</Button>
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
                    <Button size="sm" style={org.primaryColor ? { backgroundColor: org.primaryColor, color: '#fff' } : undefined}><UserPlus className="w-4 h-4 mr-2" />Spartenleiter einladen</Button>
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
            <OrgCollectionsSection orgId={orgId} isOwner={isOwner} org={org} />
          </TabsContent>

          {/* ─── Ausstatter Tab ─── */}
          <TabsContent value="supplier">
            <SupplierSection org={org} orgId={orgId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ─── Kollektionen-Verwaltung (Owner) ──────────────────────────────────────────────────────
function OrgCollectionsSection({ orgId, isOwner, org }: { orgId: number; isOwner: boolean; org: any }) {
  const [, setLocation] = useLocation();
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
    onSuccess: (data) => {
      utils.collection.list.invalidate({ orgId });
      setShowCreate(false);
      setCollName("");
      setCollDesc("");
      setEnforcement("optional");
      toast.success("Vereinskollektion erstellt – Produktdesigner wird geöffnet");
      // Weiterleitung zum Produktdesigner
      setLocation("/designer/products");
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
              <Button size="sm" style={org?.primaryColor ? { backgroundColor: org.primaryColor, color: '#fff' } : undefined}>
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
  const [primaryColorCmyk, setPrimaryColorCmyk] = useState(org.primaryColorCmyk || "");
  const [secondaryColorCmyk, setSecondaryColorCmyk] = useState(org.secondaryColorCmyk || "");
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
      primaryColorCmyk: primaryColorCmyk || undefined,
      secondaryColorCmyk: secondaryColorCmyk || undefined,
      jerseyName: jerseyName || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Vereinsfarben & Trikotname */}
      <Card className="overflow-hidden" style={org.primaryColor ? { borderLeft: `4px solid ${org.primaryColor}` } : undefined}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Palette className="w-5 h-5" style={{ color: org.primaryColor || undefined }} />Vereinsfarben & Trikotname</CardTitle>
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
          {/* CMYK-Werte */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Primärfarbe CMYK (für Druck)</Label>
              <Input value={primaryColorCmyk} onChange={(e) => setPrimaryColorCmyk(e.target.value)} placeholder="z.B. C100 M80 Y0 K10" disabled={!isOwner} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Sekundärfarbe CMYK (für Druck)</Label>
              <Input value={secondaryColorCmyk} onChange={(e) => setSecondaryColorCmyk(e.target.value)} placeholder="z.B. C0 M0 Y0 K0" disabled={!isOwner} />
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
      <Card className="overflow-hidden" style={org.primaryColor ? { borderLeft: `4px solid ${org.primaryColor}` } : undefined}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Landmark className="w-5 h-5" style={{ color: org.primaryColor || undefined }} />Vereinsdaten</CardTitle>
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
      <Card className="overflow-hidden" style={org.primaryColor ? { borderLeft: `4px solid ${org.primaryColor}` } : undefined}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="w-5 h-5" style={{ color: org.primaryColor || undefined }} />Ansprechpartner</CardTitle>
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
      <Card className="overflow-hidden" style={org.primaryColor ? { borderLeft: `4px solid ${org.primaryColor}` } : undefined}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Phone className="w-5 h-5" style={{ color: org.primaryColor || undefined }} />Kontaktdaten</CardTitle>
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
      <Card className="overflow-hidden" style={org.primaryColor ? { borderLeft: `4px solid ${org.primaryColor}` } : undefined}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5" style={{ color: org.primaryColor || undefined }} />Adresse & Koordinaten</CardTitle>
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
      <Card className="overflow-hidden" style={org.primaryColor ? { borderLeft: `4px solid ${org.primaryColor}` } : undefined}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" style={{ color: org.primaryColor || undefined }} />Rechtliches</CardTitle>
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
      <Card className="overflow-hidden" style={org.primaryColor ? { borderLeft: `4px solid ${org.primaryColor}` } : undefined}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Hash className="w-5 h-5" style={{ color: org.primaryColor || undefined }} />Vereins-Hashtag</CardTitle>
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
          <Button
            onClick={handleSave}
            disabled={saving}
            size="lg"
            className="shadow-md font-semibold"
            style={org.primaryColor ? {
              backgroundColor: org.primaryColor,
              color: '#fff',
            } : undefined}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Stammdaten speichern
          </Button>
        </div>
      )}
    </div>
  );
}
// ─── Ausstatter-Verwaltung ───────────────────────────────────────────────────────────────────────────────────
const SPORT_BRANDS = [
  "Nike", "Adidas", "Puma", "Under Armour", "New Balance", "Hummel",
  "Erima", "Jako", "Uhlsport", "Kempa", "Mizuno", "Asics",
  "Macron", "Joma", "Kappa", "Lotto", "Diadora", "Umbro",
  "Craft", "Stanno", "Patrick", "Masita", "Derbystar", "Select",
  "Spalding", "Molten", "Mikasa", "Wilson",
  "Ball-z"
];

const SUPPLIER_SCOPES = [
  { value: "ganzer_verein", label: "Ganzer Verein (bindend für alle)" },
  { value: "nur_sparten", label: "Nur für Sparten" },
  { value: "nur_trikots", label: "Nur für Trikots" },
  { value: "alle_artikel", label: "Für alle Artikel" },
];

function SupplierSection({ org, orgId }: { org: any; orgId: number }) {
  const utils = trpc.useUtils();
  const [brand, setBrand] = useState(org.supplierBrand || "");
  const [scope, setScope] = useState(org.supplierScope || "");
  const [contractStart, setContractStart] = useState(
    org.supplierContractStart ? new Date(org.supplierContractStart).toISOString().split("T")[0] : ""
  );
  const [contractEnd, setContractEnd] = useState(
    org.supplierContractEnd ? new Date(org.supplierContractEnd).toISOString().split("T")[0] : ""
  );
  const [editing, setEditing] = useState(false);

  const updateMutation = trpc.org.update.useMutation({
    onSuccess: () => {
      toast.success("Ausstatter gespeichert");
      utils.org.getById.invalidate({ id: orgId });
      setEditing(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const removeMutation = trpc.org.update.useMutation({
    onSuccess: () => {
      toast.success("Ausstatter entfernt");
      utils.org.getById.invalidate({ id: orgId });
      setBrand("");
      setScope("");
      setContractStart("");
      setContractEnd("");
      setEditing(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSave = () => {
    updateMutation.mutate({
      id: orgId,
      supplierBrand: brand || null,
      supplierScope: (scope as any) || null,
      supplierContractStart: contractStart || null,
      supplierContractEnd: contractEnd || null,
    });
  };

  const handleRemove = () => {
    removeMutation.mutate({
      id: orgId,
      supplierBrand: null,
      supplierScope: null,
      supplierContractStart: null,
      supplierContractEnd: null,
    });
  };

  const hasSupplier = !!org.supplierBrand;
  const isContractActive = org.supplierContractEnd
    ? new Date(org.supplierContractEnd) > new Date()
    : !!org.supplierBrand;
  const daysRemaining = org.supplierContractEnd
    ? Math.ceil((new Date(org.supplierContractEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="space-y-6">
      {/* Aktueller Ausstatter */}
      {hasSupplier && !editing ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">{org.supplierBrand}</CardTitle>
                  <CardDescription>
                    {SUPPLIER_SCOPES.find(s => s.value === org.supplierScope)?.label || "Kein Bindungsbereich"}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isContractActive ? (
                  <Badge className="bg-green-100 text-green-800 border-green-200">Aktiv</Badge>
                ) : (
                  <Badge variant="destructive">Abgelaufen</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Vertragsbeginn</p>
                <p className="font-medium flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-muted-foreground" />
                  {org.supplierContractStart
                    ? new Date(org.supplierContractStart).toLocaleDateString("de-DE")
                    : "Nicht festgelegt"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Vertragsende</p>
                <p className="font-medium flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-muted-foreground" />
                  {org.supplierContractEnd
                    ? new Date(org.supplierContractEnd).toLocaleDateString("de-DE")
                    : "Unbefristet"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Verbleibend</p>
                <p className="font-medium">
                  {daysRemaining !== null
                    ? daysRemaining > 0
                      ? `${daysRemaining} Tage`
                      : "Abgelaufen"
                    : "Unbefristet"}
                </p>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="w-4 h-4 mr-2" />Bearbeiten
              </Button>
              <Button variant="destructive" size="sm" onClick={handleRemove} disabled={removeMutation.isPending}>
                {removeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Ausstatter entfernen
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Ausstatter bearbeiten / neu anlegen */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              {hasSupplier ? "Ausstatter bearbeiten" : "Ausstatter festlegen"}
            </CardTitle>
            <CardDescription>
              Wählen Sie den offiziellen Ausstatter für Ihren Verein und legen Sie den Bindungsbereich fest.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Markenauswahl */}
            <div className="space-y-2">
              <Label className="font-medium">Marke</Label>
              <Select value={brand} onValueChange={setBrand}>
                <SelectTrigger>
                  <SelectValue placeholder="Ausstatter wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {SPORT_BRANDS.map((b) => (
                    <SelectItem key={b} value={b}>
                      <span className={b === "Ball-z" ? "font-bold text-primary" : ""}>{b}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {brand === "Ball-z" && (
                <p className="text-sm text-primary font-medium mt-1">
                  ✨ Ball-z – Unsere Eigenmarke für höchste Qualität
                </p>
              )}
            </div>

            {/* Bindungsbereich */}
            <div className="space-y-2">
              <Label className="font-medium">Bindungsbereich</Label>
              <Select value={scope} onValueChange={setScope}>
                <SelectTrigger>
                  <SelectValue placeholder="Bindungsbereich wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {SUPPLIER_SCOPES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {scope === "ganzer_verein" && "Der Ausstatter ist für den gesamten Verein bindend. Alle Sparten und Artikel müssen von diesem Ausstatter bezogen werden."}
                {scope === "nur_sparten" && "Der Ausstatter ist nur für die Sparten/Abteilungen bindend. Einzelne Artikel können von anderen Herstellern stammen."}
                {scope === "nur_trikots" && "Der Ausstatter ist nur für Trikots bindend. Andere Artikel (Hoodies, Jacken etc.) können frei gewählt werden."}
                {scope === "alle_artikel" && "Der Ausstatter gilt für alle Artikel des Vereins (Trikots, Hoodies, Jacken, T-Shirts etc.)."}
              </p>
            </div>

            {/* Vertragslaufzeit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-medium">Vertragsbeginn</Label>
                <Input
                  type="date"
                  value={contractStart}
                  onChange={(e) => setContractStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Vertragsende</Label>
                <Input
                  type="date"
                  value={contractEnd}
                  onChange={(e) => setContractEnd(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Leer lassen für unbefristeten Vertrag</p>
              </div>
            </div>

            {/* Aktionen */}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={!brand || updateMutation.isPending}>
                {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Speichern
              </Button>
              {editing && (
                <Button variant="outline" onClick={() => {
                  setEditing(false);
                  setBrand(org.supplierBrand || "");
                  setScope(org.supplierScope || "");
                  setContractStart(org.supplierContractStart ? new Date(org.supplierContractStart).toISOString().split("T")[0] : "");
                  setContractEnd(org.supplierContractEnd ? new Date(org.supplierContractEnd).toISOString().split("T")[0] : "");
                }}>
                  Abbrechen
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info-Box */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-800 space-y-1">
              <p className="font-medium">Was bedeutet der Ausstatter-Vertrag?</p>
              <p>Der Ausstatter-Vertrag legt fest, von welcher Marke die Textilien des Vereins bezogen werden müssen. Je nach Bindungsbereich gilt dies für den gesamten Verein, einzelne Sparten oder nur bestimmte Artikeltypen.</p>
              <p>Im Konfigurator werden nur Produkte des festgelegten Ausstatter angezeigt, wenn ein Vertrag aktiv ist.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Export ───────────────────────────────────────────────────────────────────────────────────
export default function OrgDashboard() {
  const params = useParams<{ id?: string }>();
  const orgId = params.id ? parseInt(params.id) : null;
  if (!orgId) return <OrgList />;
  return <OrgDetail orgId={orgId} />;
}
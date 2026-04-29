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
  ChevronRight, Loader2
} from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { Link, useLocation, useParams } from "wouter";
import { toast } from "sonner";

// ─── Org List (when no org selected) ─────────────────────────────────────────
function OrgList() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { data: orgs, isLoading } = trpc.org.list.useQuery(undefined, { enabled: isAuthenticated });
  const utils = trpc.useUtils();

  const [showCreate, setShowCreate] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgType, setNewOrgType] = useState<"verein" | "firma">("verein");

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
            <a href={getLoginUrl()}>
              <Button className="w-full"><LogIn className="w-4 h-4 mr-2" />Anmelden</Button>
            </a>
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
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Abbrechen</Button>
                <Button
                  onClick={() => createOrg.mutate({ name: newOrgName, type: newOrgType })}
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
            {orgs.map((org) => (
              <Card
                key={org.id}
                className="group cursor-pointer hover:shadow-lg transition-all"
                onClick={() => setLocation(`/org/${org.id}`)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{org.name}</CardTitle>
                        <CardDescription>
                          <Badge variant="secondary" className="text-xs mt-1">
                            {org.type === "verein" ? "Verein" : "Firma"}
                          </Badge>
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

  const isOwner = org?.userRole === "owner";

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
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState<"department_lead" | "trainer">("trainer");
  const [memberDeptId, setMemberDeptId] = useState<number | undefined>(undefined);
  const addMember = trpc.membership.add.useMutation({
    onSuccess: () => { utils.membership.listByOrg.invalidate({ orgId }); setShowAddMember(false); setMemberEmail(""); toast.success("Mitglied hinzugefügt"); },
    onError: (e) => toast.error(e.message),
  });
  const removeMember = trpc.membership.remove.useMutation({
    onSuccess: () => { utils.membership.listByOrg.invalidate({ orgId }); toast.success("Mitglied entfernt"); },
    onError: (e) => toast.error(e.message),
  });

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

  const roleLabel = (role: string) => {
    switch (role) {
      case "owner": return "Hauptverantwortlicher";
      case "department_lead": return "Spartenleiter";
      case "trainer": return "Trainer";
      default: return role;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-30">
        <div className="container flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center gap-3">
            <Link href="/org">
              <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold">{org.name}</h1>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {org.type === "verein" ? "Verein" : "Firma"}
                  </Badge>
                  {isOwner && <Badge className="text-xs">Hauptverantwortlicher</Badge>}
                </div>
              </div>
            </div>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm">
              <Shirt className="w-4 h-4 mr-2" />Konfigurator
            </Button>
          </Link>
        </div>
      </header>

      <div className="container py-6">
        <Tabs defaultValue="logos">
          <TabsList className="mb-6">
            <TabsTrigger value="logos" className="gap-2"><Image className="w-4 h-4" />Logos</TabsTrigger>
            <TabsTrigger value="departments" className="gap-2"><Building2 className="w-4 h-4" />Abteilungen</TabsTrigger>
            <TabsTrigger value="members" className="gap-2"><Users className="w-4 h-4" />Mitglieder</TabsTrigger>
          </TabsList>

          {/* ─── Logos Tab ─── */}
          <TabsContent value="logos">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Logo-Varianten</h2>
                <p className="text-sm text-muted-foreground">Laden Sie verschiedene Logo-Varianten hoch (Farb-Logo, SW-Logo, Mini-Logo etc.)</p>
              </div>
              {isOwner && (
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
                          accept="image/png,image/jpeg,image/svg+xml,image/webp"
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
                              <p className="text-sm text-muted-foreground">Klicken zum Auswählen (max. 5 MB)</p>
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
                {isOwner && (
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
                      <img src={logo.imageUrl} alt={logo.name} className="max-w-full max-h-full object-contain" />
                      {logo.isDefault && (
                        <Badge className="absolute top-2 right-2 gap-1">
                          <Star className="w-3 h-3" />Standard
                        </Badge>
                      )}
                    </div>
                    <CardContent className="pt-3">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{logo.name}</p>
                        {isOwner && (
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
                    <Button size="sm"><UserPlus className="w-4 h-4 mr-2" />Mitglied hinzufügen</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Mitglied hinzufügen</DialogTitle>
                      <DialogDescription>Der Benutzer muss sich vorher registriert haben.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>E-Mail-Adresse</Label>
                        <Input
                          type="email"
                          value={memberEmail}
                          onChange={(e) => setMemberEmail(e.target.value)}
                          placeholder="benutzer@beispiel.de"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Rolle</Label>
                        <Select value={memberRole} onValueChange={(v) => setMemberRole(v as "department_lead" | "trainer")}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="department_lead">Spartenleiter</SelectItem>
                            <SelectItem value="trainer">Trainer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {departments && departments.length > 0 && (
                        <div className="space-y-2">
                          <Label>Abteilung (optional)</Label>
                          <Select
                            value={memberDeptId?.toString() || "none"}
                            onValueChange={(v) => setMemberDeptId(v === "none" ? undefined : parseInt(v))}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Keine Abteilung</SelectItem>
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
                        onClick={() => addMember.mutate({
                          orgId,
                          userEmail: memberEmail,
                          role: memberRole,
                          departmentId: memberDeptId,
                        })}
                        disabled={!memberEmail.trim() || addMember.isPending}
                      >
                        {addMember.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Hinzufügen
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
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
        </Tabs>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function OrgDashboard() {
  const params = useParams<{ id?: string }>();
  const orgId = params.id ? parseInt(params.id) : null;

  if (!orgId) return <OrgList />;
  return <OrgDetail orgId={orgId} />;
}

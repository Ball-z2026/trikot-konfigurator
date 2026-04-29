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
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  Building2,
  Loader2,
  LogIn,
  Plus,
  Shield,
  Star,
  StarOff,
  Trash2,
  Type,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";

/** Vordefinierte Google-Fonts-Auswahl für schnelle Freigabe */
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

function roleLabel(role: string) {
  switch (role) {
    case "owner":
      return "Hauptverantwortlicher";
    case "department_lead":
      return "Spartenleiter";
    case "trainer":
      return "Trainer";
    default:
      return role;
  }
}

export default function DeptFonts() {
  const params = useParams<{ id: string; deptId: string }>();
  const orgId = parseInt(params.id || "0");
  const deptId = parseInt(params.deptId || "0");

  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();

  // ─── Queries ───
  const { data: org, isLoading: orgLoading } = trpc.org.getById.useQuery(
    { id: orgId },
    { enabled: isAuthenticated && orgId > 0 }
  );
  const { data: dept, isLoading: deptLoading } =
    trpc.department.getById.useQuery(
      { id: deptId, orgId },
      { enabled: isAuthenticated && deptId > 0 && orgId > 0 }
    );
  const { data: fonts } = trpc.deptFont.list.useQuery(
    { departmentId: deptId, orgId },
    { enabled: isAuthenticated && deptId > 0 && orgId > 0 }
  );
  const { data: members } = trpc.membership.listByDepartment.useQuery(
    { departmentId: deptId, orgId },
    { enabled: isAuthenticated && deptId > 0 && orgId > 0 }
  );

  // Berechtigungsprüfung: Owner oder department_lead dieser Abteilung
  const isOwner = org?.userRole === "owner";
  const isDeptLead =
    org?.userRole === "department_lead"; // Vereinfacht – der Backend-Guard prüft genau
  const canManageFonts = isOwner || isDeptLead;

  // ─── Font CRUD ───
  const [showAddFont, setShowAddFont] = useState(false);
  const [fontFamily, setFontFamily] = useState("");
  const [fontUrl, setFontUrl] = useState("");
  const [isDefaultFont, setIsDefaultFont] = useState(false);
  const [useCustomFont, setUseCustomFont] = useState(false);

  const approveFont = trpc.deptFont.approve.useMutation({
    onSuccess: () => {
      utils.deptFont.list.invalidate({ departmentId: deptId, orgId });
      setShowAddFont(false);
      setFontFamily("");
      setFontUrl("");
      setIsDefaultFont(false);
      setUseCustomFont(false);
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

  // ─── Loading / Auth States ───
  if (authLoading || orgLoading || deptLoading) {
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
              Bitte melden Sie sich an, um die Abteilung zu verwalten.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a href={getLoginUrl()}>
              <Button className="w-full">
                <LogIn className="w-4 h-4 mr-2" />
                Anmelden
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!org || !dept) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">
          Abteilung oder Organisation nicht gefunden
        </p>
      </div>
    );
  }

  // ─── Font-Vorschau laden (Google Fonts) ───
  const loadFontPreview = (family: string) => {
    const linkId = `gf-preview-${family.replace(/\s+/g, "-")}`;
    if (document.getElementById(linkId)) return;
    const link = document.createElement("link");
    link.id = linkId;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}&display=swap`;
    document.head.appendChild(link);
  };

  // Lade alle freigegebenen Fonts
  fonts?.forEach((f) => loadFontPreview(f.fontFamily));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-30">
        <div className="container flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center gap-3">
            <Link href={`/org/${orgId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Type className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold">{dept.name}</h1>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {org.name}
                  </span>
                  {canManageFonts && (
                    <Badge className="text-xs">
                      {isOwner ? "Hauptverantwortlicher" : "Spartenleiter"}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-6">
        <Tabs defaultValue="fonts">
          <TabsList className="mb-6">
            <TabsTrigger value="fonts" className="gap-2">
              <Type className="w-4 h-4" />
              Schriftarten
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-2">
              <Users className="w-4 h-4" />
              Mitglieder
            </TabsTrigger>
          </TabsList>

          {/* ─── Fonts Tab ─── */}
          <TabsContent value="fonts">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Freigegebene Schriftarten</h2>
                <p className="text-sm text-muted-foreground">
                  Schriften, die in dieser Abteilung für Trikots verwendet werden
                  dürfen. Die Standard-Schrift wird automatisch in neuen
                  Konfigurationen vorausgewählt.
                </p>
              </div>
              {canManageFonts && (
                <Dialog open={showAddFont} onOpenChange={setShowAddFont}>
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
                        Wählen Sie eine Schriftart aus der Liste oder geben Sie
                        eine eigene an.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {/* Toggle: Vordefiniert vs. Custom */}
                      <div className="flex items-center gap-4">
                        <Button
                          variant={!useCustomFont ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setUseCustomFont(false);
                            setFontFamily("");
                            setFontUrl("");
                          }}
                        >
                          Aus Liste wählen
                        </Button>
                        <Button
                          variant={useCustomFont ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setUseCustomFont(true);
                            setFontFamily("");
                          }}
                        >
                          Eigene Schrift
                        </Button>
                      </div>

                      {!useCustomFont ? (
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
                                    style={{ fontFamily: `'${font}', sans-serif` }}
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
                          id="isDefaultFont"
                          checked={isDefaultFont}
                          onChange={(e) => setIsDefaultFont(e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="isDefaultFont">
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
                      <Button
                        variant="outline"
                        onClick={() => setShowAddFont(false)}
                      >
                        Abbrechen
                      </Button>
                      <Button
                        onClick={() =>
                          approveFont.mutate({
                            departmentId: deptId,
                            orgId,
                            fontFamily: fontFamily.trim(),
                            fontUrl: fontUrl.trim() || undefined,
                            isDefault: isDefaultFont,
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
              )}
            </div>

            {/* Font-Liste */}
            {!fonts || fonts.length === 0 ? (
              <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
                <Type className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  Noch keine Schriftarten freigegeben
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Geben Sie Schriften frei, die in dieser Abteilung für Trikots
                  verwendet werden dürfen.
                </p>
                {canManageFonts && (
                  <Button
                    className="mt-4"
                    size="sm"
                    onClick={() => setShowAddFont(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Erste Schrift freigeben
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {fonts.map((font) => (
                  <Card key={font.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">
                            {font.fontFamily}
                          </CardTitle>
                          {font.fontUrl && (
                            <CardDescription className="text-xs truncate max-w-[200px]">
                              {font.fontUrl}
                            </CardDescription>
                          )}
                        </div>
                        {font.isDefault && (
                          <Badge className="gap-1">
                            <Star className="w-3 h-3" />
                            Standard
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Font-Vorschau */}
                      <div className="border rounded-lg p-3 bg-muted/20 mb-3">
                        <p
                          className="text-xl"
                          style={{
                            fontFamily: `'${font.fontFamily}', sans-serif`,
                          }}
                        >
                          Muster Trikot 2026
                        </p>
                        <p
                          className="text-sm mt-1 text-muted-foreground"
                          style={{
                            fontFamily: `'${font.fontFamily}', sans-serif`,
                          }}
                        >
                          ABCDEFGHIJKLM 0123456789
                        </p>
                      </div>

                      {canManageFonts && (
                        <div className="flex items-center justify-end gap-1">
                          {!font.isDefault && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs"
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
                              <StarOff className="w-3.5 h-3.5 mr-1" />
                              Standard
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => {
                              if (
                                confirm(
                                  `Schriftart "${font.fontFamily}" wirklich entfernen?`
                                )
                              )
                                deleteFont.mutate({
                                  id: font.id,
                                  departmentId: deptId,
                                  orgId,
                                });
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ─── Members Tab ─── */}
          <TabsContent value="members">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Abteilungsmitglieder</h2>
                <p className="text-sm text-muted-foreground">
                  Mitglieder, die dieser Abteilung zugeordnet sind
                </p>
              </div>
            </div>

            {!members || members.length === 0 ? (
              <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
                <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  Noch keine Mitglieder in dieser Abteilung
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Mitglieder können vom Hauptverantwortlichen in der
                  Organisationsübersicht zugewiesen werden.
                </p>
                {isOwner && (
                  <Link href={`/org/${orgId}`}>
                    <Button className="mt-4" size="sm" variant="outline">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Zur Organisationsübersicht
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((m) => (
                  <Card key={m.id}>
                    <CardContent className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {(m.userName || m.userEmail || "?")
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {m.userName || m.userEmail}
                          </p>
                          <Badge
                            variant={
                              m.role === "owner" ? "default" : "secondary"
                            }
                            className="text-xs mt-0.5"
                          >
                            {roleLabel(m.role)}
                          </Badge>
                        </div>
                      </div>
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

import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2, Users, Package, Shield, ArrowLeft, Megaphone,
  Layers, UserCheck, ChevronRight, LayoutDashboard, ShoppingBag,
  Bug, CheckCircle2, AlertCircle, Trash2, Copy, Wrench, ExternalLink,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { storageUrl } from "@/lib/utils";
import { SponsorLogoImage } from "@/components/SponsorLogoImage";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function AdminDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect non-admin users
  if (!loading && (!isAuthenticated || user?.role !== "admin")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
            <CardTitle>Zugriff verweigert</CardTitle>
            <CardDescription>
              Dieses Dashboard ist nur für Administratoren zugänglich.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center gap-3">
            <Link href="/">
              <Button variant="outline">Zur Startseite</Button>
            </Link>
            {!isAuthenticated && (
              <Link href="/login">
                <Button>Anmelden</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return <DashboardContent />;
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | undefined; color: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            {value !== undefined ? (
              <p className="text-2xl font-bold">{value}</p>
            ) : (
              <Skeleton className="h-8 w-16" />
            )}
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardContent() {
  const { data: stats, isLoading: statsLoading } = trpc.adminDashboard.stats.useQuery();
  const { data: orgs } = trpc.adminDashboard.allOrgs.useQuery();
  const { data: products } = trpc.adminDashboard.allProducts.useQuery();
  const { data: users } = trpc.adminUsers.list.useQuery();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-primary" />
                Admin-Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">Gesamtübersicht aller Daten</p>
            </div>
          </div>
          <Badge variant="outline" className="text-primary border-primary">
            <Shield className="w-3 h-3 mr-1" />
            Administrator
          </Badge>
        </div>
      </header>

      <div className="container px-4 py-6 space-y-6">
        {/* Statistik-Karten */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Building2} label="Vereine" value={stats?.organizations} color="bg-blue-100 text-blue-600" />
          <StatCard icon={Users} label="Benutzer" value={stats?.users} color="bg-green-100 text-green-600" />
          <StatCard icon={Package} label="Produkte" value={stats?.products} color="bg-purple-100 text-purple-600" />
          <StatCard icon={Megaphone} label="Sponsoren" value={stats?.sponsors} color="bg-orange-100 text-orange-600" />
          <StatCard icon={Layers} label="Abteilungen" value={stats?.departments} color="bg-cyan-100 text-cyan-600" />
          <StatCard icon={ShoppingBag} label="Mannschaften" value={stats?.teams} color="bg-pink-100 text-pink-600" />
          <StatCard icon={UserCheck} label="Mitgliedschaften" value={stats?.memberships} color="bg-indigo-100 text-indigo-600" />
          <StatCard icon={Layers} label="Kollektionen" value={stats?.collections} color="bg-amber-100 text-amber-600" />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="orgs">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="orgs" className="gap-2">
              <Building2 className="w-4 h-4" />
              Vereine ({orgs?.length ?? "..."})
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              Benutzer ({users?.length ?? "..."})
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Package className="w-4 h-4" />
              Produkte ({products?.length ?? "..."})
            </TabsTrigger>
            <TabsTrigger value="feedback" className="gap-2">
              <Bug className="w-4 h-4" />
              Beta-Feedback
            </TabsTrigger>
          </TabsList>

          {/* Vereine Tab */}
          <TabsContent value="orgs" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Alle Vereine</CardTitle>
                    <CardDescription>Übersicht aller registrierten Organisationen</CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => setLocation("/verwaltung/org")}>
                    Zur Verwaltung
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!orgs ? (
                  <div className="space-y-2">
                    {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : orgs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Noch keine Vereine angelegt.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Logo</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Typ</TableHead>
                        <TableHead>Sportart</TableHead>
                        <TableHead>Bundesland</TableHead>
                        <TableHead>Einrichtung</TableHead>
                        <TableHead className="text-right">Aktion</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orgs.map((org) => (
                        <TableRow key={org.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setLocation(`/verwaltung/org/${org.id}`)}>
                          <TableCell>
                            <div className="w-10 h-10 bg-muted/30 rounded flex items-center justify-center">
                              {org.logoUrl ? (
                                <SponsorLogoImage src={storageUrl(org.logoUrl)} alt={org.name} className="w-8 h-8 object-contain" />
                              ) : (
                                <Building2 className="w-5 h-5 text-muted-foreground/40" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{org.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {org.type === "verein" ? "Verein" : org.type === "firma" ? "Firma" : org.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{org.sportType || "–"}</TableCell>
                          <TableCell>{org.state || "–"}</TableCell>
                          <TableCell>
                            {org.onboardingComplete ? (
                              <Badge className="bg-green-100 text-green-700">Abgeschlossen</Badge>
                            ) : (
                              <Badge variant="outline" className="text-orange-600 border-orange-300">Ausstehend</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Benutzer Tab */}
          <TabsContent value="users" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Alle Benutzer</CardTitle>
                    <CardDescription>Übersicht aller registrierten Benutzer und ihre Rollen</CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => setLocation("/verwaltung/admin/users")}>
                    Benutzerverwaltung
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!users ? (
                  <div className="space-y-2">
                    {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : users.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Noch keine Benutzer angelegt.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>E-Mail</TableHead>
                        <TableHead>System-Rolle</TableHead>
                        <TableHead>Vereins-Rollen</TableHead>
                        <TableHead>Erstellt</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u: any) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.name || "–"}</TableCell>
                          <TableCell>{u.email || "–"}</TableCell>
                          <TableCell>
                            <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                              {u.role === "admin" ? "Admin" : "Benutzer"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {u.memberships?.length > 0 ? u.memberships.map((m: any, i: number) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {m.orgName || "Verein"}: {
                                    m.role === "owner" ? "Inhaber" :
                                    m.role === "department_lead" ? "Spartenleiter" :
                                    m.role === "trainer" ? "Trainer" : m.role
                                  }
                                </Badge>
                              )) : (
                                <span className="text-muted-foreground text-xs">Keine</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString("de-DE") : "–"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Produkte Tab */}
          <TabsContent value="products" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Alle Produkte</CardTitle>
                    <CardDescription>Übersicht aller angelegten Produkte und Templates</CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => setLocation("/designer/products")}>
                    Zum Produktdesigner
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!products ? (
                  <div className="space-y-2">
                    {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : products.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Noch keine Produkte angelegt.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vorschau</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Kategorie</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aktion</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((p: any) => (
                        <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setLocation(`/designer/products/${p.id}`)}>
                          <TableCell>
                            <div className="w-10 h-10 bg-muted/30 rounded flex items-center justify-center">
                              {p.thumbnailUrl ? (
                                <img src={storageUrl(p.thumbnailUrl)} alt={p.name} className="w-8 h-8 object-contain" />
                              ) : (
                                <Package className="w-5 h-5 text-muted-foreground/40" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell>{p.category || "–"}</TableCell>
                          <TableCell>
                            {p.published ? (
                              <Badge className="bg-green-100 text-green-700">Veröffentlicht</Badge>
                            ) : (
                              <Badge variant="outline" className="text-yellow-600 border-yellow-300">Entwurf</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Beta-Feedback Tab */}
          <TabsContent value="feedback" className="mt-4">
            <BetaFeedbackPanel setLocation={setLocation} />
          </TabsContent>
        </Tabs>

        {/* Schnellzugriff */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Schnellzugriff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button variant="outline" className="h-auto py-3 flex-col gap-2" onClick={() => setLocation("/verwaltung/org")}>
                <Building2 className="w-5 h-5 text-blue-600" />
                <span className="text-xs">Vereinsverwaltung</span>
              </Button>
              <Button variant="outline" className="h-auto py-3 flex-col gap-2" onClick={() => setLocation("/designer/products")}>
                <Package className="w-5 h-5 text-purple-600" />
                <span className="text-xs">Produktdesigner</span>
              </Button>
              <Button variant="outline" className="h-auto py-3 flex-col gap-2" onClick={() => setLocation("/verwaltung/admin/users")}>
                <Users className="w-5 h-5 text-green-600" />
                <span className="text-xs">Benutzerverwaltung</span>
              </Button>
              <Button variant="outline" className="h-auto py-3 flex-col gap-2" onClick={() => setLocation("/verwaltung/sponsoren")}>
                <Megaphone className="w-5 h-5 text-orange-600" />
                <span className="text-xs">Sponsorenverwaltung</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Beta-Feedback Admin-Panel ───────────────────────────────────────────────

function BetaFeedbackPanel({ setLocation }: { setLocation: (path: string) => void }) {
  const [filterPage, setFilterPage] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: feedbacks, refetch } = trpc.betaFeedback.list.useQuery(
    {
      ...(filterPage !== "all" ? { page: filterPage } : {}),
      ...(filterStatus !== "all" ? { status: filterStatus as "open" | "resolved" | "still_present" | "in_progress" } : {}),
    }
  );

  const updateStatusMutation = trpc.betaFeedback.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Status aktualisiert");
    },
  });

  const deleteMutation = trpc.betaFeedback.delete.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Feedback gelöscht");
    },
  });

  // "An Manus senden" - kopiert formatiertes Problem in Zwischenablage
  const priorityLabels: Record<string, string> = { low: "Niedrig", medium: "Mittel", high: "Hoch", critical: "Kritisch" };
  const handleCopyForManus = (fb: any) => {
    const statusLabel = fb.status === "resolved" ? "Behoben" : fb.status === "still_present" ? "Weiter vorhanden" : fb.status === "in_progress" ? "In Bearbeitung" : "Offen";
    const text = `## Beta-Feedback: Problem auf Seite "${fb.page}"${fb.area ? ` (Bereich: ${fb.area})` : ""}

**Gemeldet von:** ${fb.userName || "Anonym"}
**Datum:** ${new Date(fb.createdAt).toLocaleString("de-DE")}
**Priorität:** ${priorityLabels[fb.priority] || "Mittel"}
**URL:** ${fb.currentUrl || "Nicht verfügbar"}
**Status:** ${statusLabel}

### Problembeschreibung:
${fb.message}
${fb.screenshotUrl ? `\n### Screenshot:\n${window.location.origin}${fb.screenshotUrl}` : ""}
${fb.adminNote ? `\n### Admin-Notiz:\n${fb.adminNote}` : ""}
${fb.verifyUrl ? `\n### Prüf-Link:\n${fb.verifyUrl}` : ""}

---
Bitte behebe dieses Problem auf der Seite "${fb.page}"${fb.area ? ` im Bereich "${fb.area}"` : ""}.`;

    navigator.clipboard.writeText(text).then(() => {
      toast.success("Problem-Details in Zwischenablage kopiert! Einfach bei Manus einfügen.");
    });
  };

  // Einzigartige Seiten für Filter
  const uniquePages = Array.from(new Set(feedbacks?.map(f => f.page) || []));

  const openCount = feedbacks?.filter(f => f.status === "open").length ?? 0;
  const inProgressCount = feedbacks?.filter(f => f.status === "in_progress").length ?? 0;
  const resolvedCount = feedbacks?.filter(f => f.status === "resolved").length ?? 0;
  const stillPresentCount = feedbacks?.filter(f => f.status === "still_present").length ?? 0;

  return (
    <div className="space-y-4">
      {/* Statistik-Karten */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-orange-600">{openCount}</div>
            <div className="text-xs text-muted-foreground">Offen</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{inProgressCount}</div>
            <div className="text-xs text-muted-foreground">In Bearbeitung</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-red-600">{stillPresentCount}</div>
            <div className="text-xs text-muted-foreground">Weiter vorhanden</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{resolvedCount}</div>
            <div className="text-xs text-muted-foreground">Behoben</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <Select value={filterPage} onValueChange={setFilterPage}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Alle Seiten" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Seiten</SelectItem>
            {uniquePages.map(p => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Alle Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            <SelectItem value="open">Offen</SelectItem>
            <SelectItem value="in_progress">In Bearbeitung</SelectItem>
            <SelectItem value="still_present">Weiter vorhanden</SelectItem>
            <SelectItem value="resolved">Behoben</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Zurück-Button wenn Detail-Ansicht aktiv */}
      {expandedId !== null && (
        <Button
          variant="outline"
          size="sm"
          className="mb-2"
          onClick={() => setExpandedId(null)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück zur Übersicht
        </Button>
      )}

      {/* Feedback-Liste */}
      {!feedbacks || feedbacks.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Bug className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Keine Feedbacks gefunden</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(expandedId !== null ? feedbacks.filter(f => f.id === expandedId) : feedbacks).map((fb) => (
            <Card
              key={fb.id}
              className={`${
                fb.status === "resolved"
                  ? "border-green-200 dark:border-green-800"
                  : fb.status === "still_present"
                  ? "border-red-200 dark:border-red-800"
                  : fb.status === "in_progress"
                  ? "border-blue-200 dark:border-blue-800"
                  : "border-orange-200 dark:border-orange-800"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-sm">{fb.userName || "Anonym"}</span>
                      <Badge variant="secondary" className="text-[10px]">{fb.page}</Badge>
                      {fb.area && <Badge variant="outline" className="text-[10px]">{fb.area}</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(fb.createdAt).toLocaleString("de-DE")}
                      {fb.currentUrl && (
                        <span className="ml-2 text-blue-600 cursor-pointer hover:underline" onClick={() => {
                          const url = new URL(fb.currentUrl!, window.location.origin);
                          setLocation(url.pathname);
                        }}>
                          → Zur Seite
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    {(fb as any).priority && (fb as any).priority !== "medium" && (
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          (fb as any).priority === "critical" ? "border-red-500 text-red-700 bg-red-50" :
                          (fb as any).priority === "high" ? "border-orange-400 text-orange-700 bg-orange-50" :
                          "border-gray-300 text-gray-600"
                        }`}
                      >
                        {(fb as any).priority === "critical" ? "Kritisch" : (fb as any).priority === "high" ? "Hoch" : "Niedrig"}
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={`${
                        fb.status === "resolved"
                          ? "border-green-400 text-green-700 bg-green-50"
                          : fb.status === "still_present"
                          ? "border-red-400 text-red-700 bg-red-50"
                          : fb.status === "in_progress"
                          ? "border-blue-400 text-blue-700 bg-blue-50"
                          : "border-orange-400 text-orange-700 bg-orange-50"
                      }`}
                    >
                      {fb.status === "resolved" ? "✓ Behoben" : fb.status === "still_present" ? "✗ Weiter vorhanden" : fb.status === "in_progress" ? "⚙ In Bearbeitung" : "● Offen"}
                    </Badge>
                  </div>
                </div>

                <p className="text-sm whitespace-pre-wrap mb-3">{fb.message}</p>

                {/* Test-Button - direkt zur gemeldeten Seite */}
                {fb.currentUrl && (
                  <div className="mb-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      className="h-8 text-xs"
                      onClick={() => window.open(fb.currentUrl!, "_blank")}
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                      Problem testen
                    </Button>
                    {expandedId !== fb.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => setExpandedId(fb.id)}
                      >
                        Details anzeigen
                      </Button>
                    )}
                  </div>
                )}

                {/* Screenshot */}
                {fb.screenshotUrl && (
                  <div className="mb-3">
                    <img
                      src={fb.screenshotUrl}
                      alt="Screenshot"
                      className="max-h-48 rounded border cursor-pointer hover:opacity-80 object-contain"
                      onClick={() => window.open(fb.screenshotUrl!, "_blank")}
                    />
                  </div>
                )}

                {fb.adminNote && (
                  <div className="text-xs bg-muted p-2 rounded mb-3">
                    <span className="font-semibold">Admin-Notiz:</span> {fb.adminNote}
                  </div>
                )}

                {/* Verifizierungs-Link */}
                {(fb as any).verifyUrl && (
                  <div className="text-xs bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-2 rounded mb-3 flex items-center gap-2">
                    <span className="font-semibold text-blue-700 dark:text-blue-300">Prüf-Link:</span>
                    <a
                      href={(fb as any).verifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate flex-1"
                    >
                      {(fb as any).verifyUrl}
                    </a>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0"
                      onClick={() => {
                        navigator.clipboard.writeText((fb as any).verifyUrl);
                        toast.success("Link kopiert!");
                      }}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                )}

                {/* Action-Buttons */}
                <div className="flex flex-wrap gap-2">
                  {fb.status !== "in_progress" && fb.status !== "resolved" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-blue-400 text-blue-700 hover:bg-blue-50"
                      onClick={() => {
                        const verifyUrl = fb.currentUrl || "";
                        updateStatusMutation.mutate({ id: fb.id, status: "in_progress", verifyUrl });
                      }}
                    >
                      <Wrench className="w-3 h-3 mr-1" />
                      Dran gearbeitet
                    </Button>
                  )}
                  {fb.status !== "resolved" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-green-400 text-green-700 hover:bg-green-50"
                      onClick={() => updateStatusMutation.mutate({ id: fb.id, status: "resolved" })}
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Problem behoben
                    </Button>
                  )}
                  {fb.status !== "still_present" && fb.status !== "resolved" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-red-400 text-red-700 hover:bg-red-50"
                      onClick={() => updateStatusMutation.mutate({ id: fb.id, status: "still_present" })}
                    >
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Weiter vorhanden
                    </Button>
                  )}
                  {(fb.status === "resolved" || fb.status === "in_progress") && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-orange-400 text-orange-700 hover:bg-orange-50"
                      onClick={() => updateStatusMutation.mutate({ id: fb.id, status: "open" })}
                    >
                      Wieder öffnen
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-purple-400 text-purple-700 hover:bg-purple-50"
                    onClick={() => handleCopyForManus(fb)}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    An Manus senden
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-red-500 hover:text-red-700 ml-auto"
                    onClick={() => {
                      if (confirm("Feedback wirklich löschen?")) {
                        deleteMutation.mutate({ id: fb.id });
                      }
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

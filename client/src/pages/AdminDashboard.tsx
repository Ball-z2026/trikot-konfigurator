import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
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
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { storageUrl } from "@/lib/utils";
import { SponsorLogoImage } from "@/components/SponsorLogoImage";

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
          <TabsList className="grid w-full grid-cols-3">
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

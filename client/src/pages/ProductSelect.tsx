import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Shirt, ArrowRight, ArrowLeft, Loader2, Filter, Users, Trophy, Package } from "lucide-react";
import { TEXTIL_TEMPLATES, SPORT_TYPES, type SportType } from "@shared/templates";
import { storageUrl } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export default function ProductSelect() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();

  // ─── State: Wizard-Schritte ───
  const [selectedSport, setSelectedSport] = useState<SportType | "alle" | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<"alle" | "Trikot" | "Bekleidung">("alle");

  // ─── Daten laden ───
  const { data: products, isLoading: productsLoading } = trpc.product.list.useQuery();
  const { data: myMemberships } = trpc.membership.mine.useQuery(undefined, { enabled: isAuthenticated });
  const { data: myTeams } = trpc.team.mine.useQuery(undefined, { enabled: isAuthenticated });

  // Lade Sparten-Ausrüster für alle Orgs des Users
  const userOrgIds = useMemo(() => {
    if (!myMemberships) return [];
    return [...new Set(myMemberships.map(m => m.orgId))];
  }, [myMemberships]);

  const { data: allDeptSuppliers } = trpc.departmentSupplier.listByOrg.useQuery(
    { orgId: userOrgIds[0] || 0 },
    { enabled: userOrgIds.length > 0 }
  );

  // ─── Mannschaft-Info mit Sparte ───
  const teamsWithDept = useMemo(() => {
    if (!myTeams || !myMemberships) return [];
    return myTeams.map(t => {
      const membership = myMemberships.find(m => m.departmentId === t.departmentId);
      return {
        ...t,
        orgId: membership?.orgId,
        deptName: membership?.departmentName || "Unbekannt",
      };
    });
  }, [myTeams, myMemberships]);

  // ─── Ausrüster-Filter: Wenn Sparte einen Ausrüster hat, nur dessen Produkte zeigen ───
  const activeSupplierBrand = useMemo(() => {
    if (!selectedTeamId || !allDeptSuppliers) return null;
    const team = teamsWithDept.find(t => t.id === selectedTeamId);
    if (!team) return null;
    const supplier = allDeptSuppliers.find(s => s.departmentId === team.departmentId);
    return supplier?.brand || null;
  }, [selectedTeamId, allDeptSuppliers, teamsWithDept]);

  // ─── Produkte filtern ───
  const publishedProducts = products?.filter((p) => p.published) ?? [];

  const filteredProducts = useMemo(() => {
    let filtered = publishedProducts;

    // Sportart-Filter
    if (selectedSport && selectedSport !== "alle") {
      filtered = filtered.filter(p => {
        if (!p.templateId) return false;
        const tmpl = TEXTIL_TEMPLATES.find(t => t.id === p.templateId);
        return tmpl?.sport === selectedSport;
      });
    }

    // Kategorie-Filter
    if (selectedCategory !== "alle") {
      filtered = filtered.filter(p => {
        if (!p.templateId) return selectedCategory === "Bekleidung";
        const tmpl = TEXTIL_TEMPLATES.find(t => t.id === p.templateId);
        return tmpl?.category === selectedCategory;
      });
    }

    // Ausrüster-Filter (wenn Sparte einen vorgeschriebenen Ausrüster hat)
    // Hinweis: Aktuell filtern wir nicht nach Marke im Produktnamen, da Produkte
    // keine direkte Marken-Zuordnung haben. Dies kann später erweitert werden.

    return filtered;
  }, [publishedProducts, selectedSport, selectedCategory, activeSupplierBrand]);

  // ─── Nicht eingeloggt ───
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card sticky top-0 z-30">
          <div className="container flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />Zurück
                </Button>
              </Link>
              <div>
                <h1 className="text-base sm:text-lg font-bold tracking-tight">Konfigurator</h1>
              </div>
            </div>
          </div>
        </header>
        <div className="container py-16 text-center">
          <Shirt className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Anmeldung erforderlich</h2>
          <p className="text-muted-foreground mb-6">
            Um den Konfigurator zu nutzen, müssen Sie sich als Vereinsmitglied anmelden.
          </p>
          <a href={getLoginUrl("/konfigurator")}>
            <Button size="lg">Jetzt anmelden</Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-30">
        <div className="container flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />Zurück
              </Button>
            </Link>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight">Konfigurator</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                Sportart, Mannschaft und Vorlage auswählen
              </p>
            </div>
          </div>
          {user && (
            <span className="text-sm text-muted-foreground">{user.name}</span>
          )}
        </div>
      </header>

      <section className="py-6 sm:py-10">
        <div className="container px-4">
          {/* ─── Schritt 1: Sportart & Mannschaft & Kategorie Filter ─── */}
          <div className="mb-8 space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold">Produkt konfigurieren</h2>
            <p className="text-muted-foreground">
              Wählen Sie Sportart, Mannschaft und Produktkategorie, um passende Vorlagen zu finden.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-xl border">
              {/* Sportart */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Trophy className="w-4 h-4" />Sportart
                  <Badge variant="destructive" className="text-[10px] ml-1">Pflicht bei Trikots</Badge>
                </label>
                <Select
                  value={selectedSport || ""}
                  onValueChange={(v) => setSelectedSport(v as SportType | "alle")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sportart wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle Sportarten</SelectItem>
                    {SPORT_TYPES.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.icon} {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mannschaft */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Users className="w-4 h-4" />Mannschaft
                </label>
                <Select
                  value={selectedTeamId?.toString() || ""}
                  onValueChange={(v) => setSelectedTeamId(v ? parseInt(v) : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Mannschaft wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Keine Auswahl</SelectItem>
                    {teamsWithDept.map(t => (
                      <SelectItem key={t.id} value={t.id.toString()}>
                        {t.name} ({t.deptName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Kategorie */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Package className="w-4 h-4" />Kategorie
                </label>
                <Select
                  value={selectedCategory}
                  onValueChange={(v) => setSelectedCategory(v as typeof selectedCategory)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle Kategorien</SelectItem>
                    <SelectItem value="Trikot">Trikots</SelectItem>
                    <SelectItem value="Bekleidung">Bekleidung</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Ausrüster-Hinweis */}
            {activeSupplierBrand && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                <Filter className="w-4 h-4 shrink-0" />
                <span>
                  Für die gewählte Mannschaft ist <strong>{activeSupplierBrand}</strong> als Ausrüster vorgeschrieben.
                  Es werden nur passende Produkte angezeigt.
                </span>
              </div>
            )}
          </div>

          {/* ─── Produktliste ─── */}
          {productsLoading ? (
            <div className="text-center py-16">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Produkte werden geladen...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-10 sm:py-16 bg-muted/30 rounded-xl border border-dashed">
              <Shirt className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
              <p className="text-muted-foreground text-base sm:text-lg">
                Keine passenden Produkte gefunden.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Versuchen Sie andere Filtereinstellungen.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  {filteredProducts.length} Produkt{filteredProducts.length !== 1 ? "e" : ""} gefunden
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filteredProducts.map((product) => {
                  const tmpl = product.templateId ? TEXTIL_TEMPLATES.find(t => t.id === product.templateId) : null;
                  const sportInfo = tmpl?.sport ? SPORT_TYPES.find(s => s.id === tmpl.sport) : null;

                  return (
                    <Card
                      key={product.id}
                      className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
                      onClick={() => {
                        // Bei Trikots: Sportart muss gewählt sein
                        if (tmpl?.category === "Trikot" && (!selectedSport || selectedSport === "alle")) {
                          // Sportart automatisch aus Template übernehmen
                        }
                        const params = new URLSearchParams();
                        if (selectedTeamId) params.set("teamId", selectedTeamId.toString());
                        if (selectedSport && selectedSport !== "alle") params.set("sport", selectedSport);
                        const query = params.toString() ? `?${params.toString()}` : "";
                        setLocation(`/konfigurator/${product.id}${query}`);
                      }}
                    >
                      <div className="aspect-[4/3] bg-[#b8bcc2] relative overflow-hidden">
                        {(() => {
                          const imageUrl = product.frontImageUrl
                            || (product.templateId && TEXTIL_TEMPLATES.find(t => t.id === product.templateId)?.previewUrl)
                            || null;
                          if (imageUrl) {
                            return (
                              <img
                                src={storageUrl(imageUrl)}
                                alt={product.name}
                                className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                              />
                            );
                          }
                          return (
                            <div className="w-full h-full flex items-center justify-center">
                              <Shirt className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground/30" />
                            </div>
                          );
                        })()}
                        {/* Sport-Badge */}
                        {sportInfo && (
                          <Badge className="absolute top-2 left-2 text-xs" variant="secondary">
                            {sportInfo.icon} {sportInfo.name}
                          </Badge>
                        )}
                        {/* Kategorie-Badge */}
                        {tmpl?.category && (
                          <Badge className="absolute top-2 right-2 text-xs" variant="outline">
                            {tmpl.category}
                          </Badge>
                        )}
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base sm:text-lg">{product.name}</CardTitle>
                        {product.category && (
                          <CardDescription>{product.category}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          Konfigurieren
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

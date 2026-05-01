import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Shirt, Shield, Settings, ArrowRight, LogIn, LogOut, Menu, Building2, Users } from "lucide-react";
import { TEXTIL_TEMPLATES } from "@shared/templates";
import { Link, useLocation } from "wouter";
import { useState } from "react";

/** Trainer-Schnelllink: Zeigt den Link zum Trainer-Dashboard wenn der User Trainer ist */
function TrainerQuickLink() {
  const { data: memberships } = trpc.membership.mine.useQuery();
  const trainerMembership = memberships?.find((m) => m.role === "trainer");
  if (!trainerMembership) return null;
  return (
    <Link href={`/trainer/${trainerMembership.orgId}/${trainerMembership.departmentId}`}>
      <Button variant="outline" size="sm">
        <Users className="w-4 h-4 mr-2" />
        Meine Mannschaft
      </Button>
    </Link>
  );
}

function TrainerQuickLinkMobile({ onClose }: { onClose: () => void }) {
  const { data: memberships } = trpc.membership.mine.useQuery();
  const trainerMembership = memberships?.find((m) => m.role === "trainer");
  if (!trainerMembership) return null;
  return (
    <Link href={`/trainer/${trainerMembership.orgId}/${trainerMembership.departmentId}`}>
      <Button variant="outline" size="sm" className="w-full justify-start" onClick={onClose}>
        <Users className="w-4 h-4 mr-2" />Meine Mannschaft
      </Button>
    </Link>
  );
}

export default function Home() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const isAdmin = user?.role === "admin";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: products } = trpc.product.list.useQuery();
  const publishedProducts = products?.filter((p) => p.published) ?? [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-30">
        <div className="container flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <Shirt className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight">Textil-Konfigurator</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Produkte individuell gestalten</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden sm:flex items-center gap-3">
            {isAuthenticated && (
              <>
                <Link href="/org">
                  <Button variant="outline" size="sm">
                    <Building2 className="w-4 h-4 mr-2" />
                    Organisation
                  </Button>
                </Link>
                <TrainerQuickLink />
              </>
            )}
            {isAdmin && (
              <Link href="/admin/products">
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              </Link>
            )}
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                  {user?.name || user?.email || "Angemeldet"}
                </span>
                <Button variant="ghost" size="sm" onClick={() => logout()}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Abmelden
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button size="sm">
                  <LogIn className="w-4 h-4 mr-2" />
                  Anmelden
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t bg-card px-4 py-3 space-y-2">
            {isAuthenticated && (
              <>
                <Link href="/org">
                  <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
                    <Building2 className="w-4 h-4 mr-2" />Organisation
                  </Button>
                </Link>
                <TrainerQuickLinkMobile onClose={() => setMobileMenuOpen(false)} />
              </>
            )}
            {isAdmin && (
              <Link href="/admin/products">
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
                  <Settings className="w-4 h-4 mr-2" />Admin
                </Button>
              </Link>
            )}
            {isAuthenticated ? (
              <>
                <p className="text-sm text-muted-foreground px-1">{user?.name || user?.email || "Angemeldet"}</p>
                <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => { logout(); setMobileMenuOpen(false); }}>
                  <LogOut className="w-4 h-4 mr-2" />Abmelden
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button size="sm" className="w-full justify-start">
                  <LogIn className="w-4 h-4 mr-2" />Anmelden
                </Button>
              </Link>
            )}
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="py-10 sm:py-16 md:py-24">
        <div className="container text-center px-4">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-4 sm:mb-6">
            <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Professionelle Textilgestaltung
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-3 sm:mb-4">
            Gestalte deine Textilien
          </h2>
          <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-10">
            Lade Logos hoch, platziere Spielernamen und erstelle individuelle Designs
            für Trikots, Hoodies, Jacken und mehr.
          </p>
        </div>
      </section>

      {/* Products Grid */}
      <section className="pb-12 sm:pb-20">
        <div className="container px-4">
          <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-8">Verfügbare Produkte</h3>
          {publishedProducts.length === 0 ? (
            <div className="text-center py-10 sm:py-16 bg-muted/30 rounded-xl border border-dashed">
              <Shirt className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
              <p className="text-muted-foreground text-base sm:text-lg">
                Noch keine Produkte verfügbar.
              </p>
              {isAdmin && (
                <Link href="/admin/products">
                  <Button className="mt-4">
                    <Settings className="w-4 h-4 mr-2" />
                    Produkte anlegen
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {publishedProducts.map((product) => (
                <Card
                  key={product.id}
                  className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
                  onClick={() => setLocation(`/konfigurator/${product.id}`)}
                >
                  <div className="aspect-[4/3] bg-muted/50 relative overflow-hidden">
                    {(() => {
                      // Versuche ein Vorschaubild zu finden: frontImageUrl > Template-previewUrl > generisches Icon
                      const imageUrl = product.frontImageUrl
                        || (product.templateId && TEXTIL_TEMPLATES.find(t => t.id === product.templateId)?.previewUrl)
                        || null;
                      if (imageUrl) {
                        return (
                          <img
                            src={imageUrl}
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
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

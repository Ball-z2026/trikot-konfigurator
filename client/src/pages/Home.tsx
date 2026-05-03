import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shirt, Building2, Palette, ArrowRight, LogIn, LogOut, Menu, Users, Shield, LayoutDashboard, PenTool } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";

export default function Home() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Verwaltung · Designer · Konfigurator</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden sm:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {user?.role === "admin" && (
                  <Link href="/admin">
                    <Button variant="outline" size="sm" className="gap-1">
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Button>
                  </Link>
                )}
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
            {isAuthenticated ? (
              <>
                <p className="text-sm text-muted-foreground px-1">{user?.name || user?.email || "Angemeldet"}</p>
                {user?.role === "admin" && (
                  <Link href="/admin">
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={() => setMobileMenuOpen(false)}>
                      <LayoutDashboard className="w-4 h-4" />Admin-Dashboard
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => { logout(); setMobileMenuOpen(false); }}>
                  <LogOut className="w-4 h-4 mr-2" />Abmelden
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button size="sm" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
                  <LogIn className="w-4 h-4 mr-2" />Anmelden
                </Button>
              </Link>
            )}
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="py-10 sm:py-16 md:py-20">
        <div className="container text-center px-4">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-3 sm:mb-4">
            Textil-Konfigurator
          </h2>
          <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-10">
            Verwalte Vereine und Mannschaften, gestalte Produkte und konfiguriere Textilien.
          </p>
          {!isAuthenticated && !loading && (
            <Link href="/login">
              <Button size="lg" variant="outline" className="gap-2">
                <Shield className="w-5 h-5" />
                Admin
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* 3 Module */}
      <section className="pb-12 sm:pb-20">
        <div className="container px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">

            {/* Modul 1: Verwaltung */}
            <Card
              className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/50"
              onClick={() => setLocation("/verwaltung/org")}
            >
              <CardHeader className="pb-4">
                <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                  <Building2 className="w-7 h-7 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Verwaltung</CardTitle>
                <CardDescription className="text-sm">
                  Vereine, Sparten, Mannschaften und Spieler verwalten
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                  <li>• Vereine anlegen und verwalten</li>
                  <li>• Sparten und Abteilungen</li>
                  <li>• Mannschaften und Spieler</li>
                  <li>• Logos und Schriften</li>
                </ul>
                <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  Zur Verwaltung
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Modul 2: Produktdesigner */}
            <Card
              className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/50"
              onClick={() => setLocation("/designer/products")}
            >
              <CardHeader className="pb-4">
                <div className="w-14 h-14 rounded-xl bg-orange-100 flex items-center justify-center mb-4">
                  <PenTool className="w-7 h-7 text-orange-600" />
                </div>
                <CardTitle className="text-xl">Produktdesigner</CardTitle>
                <CardDescription className="text-sm">
                  Produkte erstellen, Zonen definieren und Vorlagen verwalten
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                  <li>• Sportart wählen (Pflicht bei Trikots)</li>
                  <li>• Produkte erstellen und bearbeiten</li>
                  <li>• Zonen und Positionen definieren</li>
                  <li>• Bild-Analyse für Positionierung</li>
                </ul>
                <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  Zum Designer
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Modul 3: Konfigurator */}
            <Card
              className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/50"
              onClick={() => setLocation("/konfigurator")}
            >
              <CardHeader className="pb-4">
                <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
                  <Palette className="w-7 h-7 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Konfigurator</CardTitle>
                <CardDescription className="text-sm">
                  Fertige Produkte konfigurieren – Farben, Logos, Spieler
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                  <li>• Mannschaft und Spieler zuweisen</li>
                  <li>• Farben und Logos platzieren</li>
                  <li>• Nummern und Namen</li>
                  <li>• Export als PNG/ZIP</li>
                </ul>
                <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  Zum Konfigurator
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Modul 4: Mitglieder */}
            <Card
              className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/50"
              onClick={() => setLocation("/verwaltung/org")}
            >
              <CardHeader className="pb-4">
                <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center mb-4">
                  <Users className="w-7 h-7 text-green-600" />
                </div>
                <CardTitle className="text-xl">Mitglieder</CardTitle>
                <CardDescription className="text-sm">
                  Vereinsmitglieder verwalten und Mannschaften zuordnen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                  <li>• Mitglieder anlegen</li>
                  <li>• Excel-Import</li>
                  <li>• Sparten-Zuordnung</li>
                  <li>• Mannschafts-Zuordnung</li>
                </ul>
                <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  Zur Mitgliederverwaltung
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

          </div>
        </div>
      </section>
    </div>
  );
}

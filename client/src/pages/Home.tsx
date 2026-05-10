import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { Shirt, Building2, Palette, ArrowRight, LogIn, LogOut, Menu, Users, LayoutDashboard, Sparkles } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";

export default function Home() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useLanguage();

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
              <h1 className="text-base sm:text-lg font-bold tracking-tight">{t("app.title")}</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">{t("app.subtitle")}</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden sm:flex items-center gap-2">
            <LanguageSwitcher />
            {isAuthenticated && (
              <>
                <Link href="/verwaltung/org">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    <Users className="w-3.5 h-3.5" />
                    {t("nav.teams")}
                  </Button>
                </Link>
                <Link href="/designer/ki-design">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                    {t("nav.kiDesigner")}
                  </Button>
                </Link>
                <Link href="/konfigurator">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    <Palette className="w-3.5 h-3.5" />
                    {t("nav.configurator")}
                  </Button>
                </Link>
              </>
            )}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 ml-2 pl-2 border-l">
                {user?.role === "admin" && (
                  <Link href="/admin">
                    <Button variant="outline" size="sm" className="gap-1">
                      <LayoutDashboard className="w-4 h-4" />
                      {t("nav.dashboard")}
                    </Button>
                  </Link>
                )}
                <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                  {user?.name || user?.email || t("app.loggedIn")}
                </span>
                <Button variant="ghost" size="sm" onClick={() => logout()}>
                  <LogOut className="w-4 h-4 mr-2" />
                  {t("app.logout")}
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button size="sm">
                  <LogIn className="w-4 h-4 mr-2" />
                  {t("app.login")}
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-1 sm:hidden">
            <LanguageSwitcher />
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t bg-card px-4 py-3 space-y-2">
            {isAuthenticated ? (
              <>
                <p className="text-sm text-muted-foreground px-1">{user?.name || user?.email || t("app.loggedIn")}</p>
                <Link href="/verwaltung/org">
                  <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={() => setMobileMenuOpen(false)}>
                    <Users className="w-4 h-4" />{t("nav.teams")}
                  </Button>
                </Link>
                <Link href="/designer/ki-design">
                  <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={() => setMobileMenuOpen(false)}>
                    <Sparkles className="w-4 h-4" />{t("nav.kiDesigner")}
                  </Button>
                </Link>
                <Link href="/konfigurator">
                  <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={() => setMobileMenuOpen(false)}>
                    <Palette className="w-4 h-4" />{t("nav.configurator")}
                  </Button>
                </Link>
                {user?.role === "admin" && (
                  <Link href="/admin">
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={() => setMobileMenuOpen(false)}>
                      <LayoutDashboard className="w-4 h-4" />{t("nav.dashboard")}
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => { logout(); setMobileMenuOpen(false); }}>
                  <LogOut className="w-4 h-4 mr-2" />{t("app.logout")}
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button size="sm" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
                  <LogIn className="w-4 h-4 mr-2" />{t("app.login")}
                </Button>
              </Link>
            )}
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="py-8 sm:py-12">
        <div className="container text-center px-4">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-3 sm:mb-4">
            {t("app.title")}
          </h2>
          <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-4">
            {t("home.hero.desc", "Verwalte Vereine und Mannschaften, gestalte Produkte und konfiguriere Textilien.")}
          </p>
          {!isAuthenticated && !loading && (
            <Link href="/login">
              <Button size="lg" className="gap-2">
                <LogIn className="w-5 h-5" />
                {t("home.cta.login", "Jetzt anmelden")}
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* ═══ WORKFLOW-ANLEITUNG ═══ */}
      <section className="pb-8 sm:pb-12">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-lg sm:text-xl font-bold mb-6 text-center">{t("home.howItWorks")}</h3>
            
            <div className="space-y-4">
              {/* Schritt 1 */}
              <div className="flex gap-4 items-start p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow cursor-pointer" onClick={() => setLocation("/verwaltung/org")}>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <span className="text-blue-700 font-bold text-lg">1</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-base">{t("home.step1.title")}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("home.step1.longDesc", "Lege deinen Verein an mit Adresse, Vereinsfarben und Vereinswappen. Der Owner kann anschließend Mannschaftslisten erstellen.")}
                  </p>
                  <Button variant="link" size="sm" className="px-0 mt-1 text-blue-600">
                    {t("home.cta.management")} <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>

              {/* Schritt 2 */}
              <div className="flex gap-4 items-start p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow cursor-pointer" onClick={() => setLocation("/verwaltung/org")}>
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <span className="text-green-700 font-bold text-lg">2</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-base">{t("home.step2.roster", "Mannschaftsliste erstellen")}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("home.step2.rosterDesc", "Erstelle eine Mannschaftsliste mit Spielernamen und Nummern. Diese werden später im Konfigurator automatisch auf die Trikots übernommen.")}
                  </p>
                  <Button variant="link" size="sm" className="px-0 mt-1 text-green-600">
                    {t("home.step2.rosterCta", "Mannschaften verwalten")} <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>

              {/* Schritt 3 */}
              <div className="flex gap-4 items-start p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow cursor-pointer" onClick={() => setLocation("/designer/ki-design")}>
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                  <span className="text-orange-700 font-bold text-lg">3</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-base">{t("home.step2.title")}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("home.step3.longDesc", "Erstelle ein neues Trikot-Design mit dem KI-Designer. Wähle Farben, Muster, Sportart und lass die KI ein professionelles Design generieren. Speichere es als Vorlage.")}
                  </p>
                  <Button variant="link" size="sm" className="px-0 mt-1 text-orange-600">
                    {t("home.cta.designer")} <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>

              {/* Schritt 4 */}
              <div className="flex gap-4 items-start p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow cursor-pointer" onClick={() => setLocation("/konfigurator")}>
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                  <span className="text-purple-700 font-bold text-lg">4</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-base">{t("home.step3.title")}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("home.step4.longDesc", "Öffne das erstellte Produkt im Konfigurator und befülle es mit den Nummern und Namen aus der Mannschaftsliste. Exportiere als PNG oder ZIP.")}
                  </p>
                  <Button variant="link" size="sm" className="px-0 mt-1 text-purple-600">
                    {t("home.cta.configurator")} <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Module-Karten */}
      <section className="pb-12 sm:pb-20">
        <div className="container px-4">
          <h3 className="text-lg sm:text-xl font-bold mb-6 text-center">{t("home.modules.title")}</h3>
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
                <CardTitle className="text-xl">{t("home.module.management")}</CardTitle>
                <CardDescription className="text-sm">
                  {t("home.module.management.cardDesc", "Vereine, Sparten, Mannschaften und Spieler verwalten")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                  <li>• {t("home.module.management.detail1")}</li>
                  <li>• {t("home.step1.detail1")}</li>
                  <li>• {t("home.step1.detail3")}</li>
                  <li>• {t("home.step1.detail2")}</li>
                </ul>
                <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {t("home.cta.management")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Modul 2: KI-Designer */}
            <Card
              className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/50"
              onClick={() => setLocation("/designer/ki-design")}
            >
              <CardHeader className="pb-4">
                <div className="w-14 h-14 rounded-xl bg-orange-100 flex items-center justify-center mb-4">
                  <Sparkles className="w-7 h-7 text-orange-600" />
                </div>
                <CardTitle className="text-xl">{t("home.module.designer")}</CardTitle>
                <CardDescription className="text-sm">
                  {t("home.module.designer.cardDesc", "Trikot-Design per KI generieren und als Vorlage speichern")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                  <li>• {t("home.step2.detail1")}</li>
                  <li>• {t("home.step2.desc")}</li>
                  <li>• {t("home.step2.detail2")}</li>
                  <li>• {t("home.module.configurator.detail3")}</li>
                </ul>
                <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {t("home.cta.designer")}
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
                <CardTitle className="text-xl">{t("home.module.configurator")}</CardTitle>
                <CardDescription className="text-sm">
                  {t("home.module.configurator.cardDesc", "Fertige Produkte mit Nummern und Namen aus der Mannschaftsliste befüllen")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                  <li>• {t("home.step3.detail1")}</li>
                  <li>• {t("home.module.configurator.detail1")}</li>
                  <li>• {t("home.module.configurator.detail2")}</li>
                  <li>• {t("home.step3.detail3")}</li>
                </ul>
                <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {t("home.cta.configurator")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Modul 4: Mannschaften */}
            <Card
              className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/50"
              onClick={() => setLocation("/verwaltung/org")}
            >
              <CardHeader className="pb-4">
                <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center mb-4">
                  <Users className="w-7 h-7 text-green-600" />
                </div>
                <CardTitle className="text-xl">{t("nav.teams")}</CardTitle>
                <CardDescription className="text-sm">
                  {t("home.module.teams.cardDesc", "Mannschaftslisten mit Spielern und Nummern verwalten")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                  <li>• {t("home.module.management.detail2")}</li>
                  <li>• {t("home.step3.detail2")}</li>
                  <li>• {t("trainer.excelImport")}</li>
                  <li>• {t("home.step2.detail3")}</li>
                </ul>
                <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {t("home.step2.rosterCta", "Mannschaften verwalten")}
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

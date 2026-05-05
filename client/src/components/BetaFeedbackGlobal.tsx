import { useLocation } from "wouter";
import { BetaFeedbackWidget } from "./BetaFeedbackWidget";

/**
 * Globale Wrapper-Komponente die das BetaFeedbackWidget auf allen relevanten Seiten anzeigt.
 * Erkennt automatisch die aktuelle Seite anhand der URL.
 */
export function BetaFeedbackGlobal() {
  const [location] = useLocation();

  // Seiten-Mapping: URL-Muster → Seitenname + Bereich
  const pageMapping = getPageInfo(location);

  // Auf Login/Register/öffentlichen Seiten kein Widget anzeigen
  if (!pageMapping) return null;

  return <BetaFeedbackWidget page={pageMapping.page} area={pageMapping.area} />;
}

function getPageInfo(path: string): { page: string; area?: string } | null {
  // Auth-Seiten: kein Widget
  if (path === "/login" || path === "/register" || path.startsWith("/forgot") || path.startsWith("/reset")) {
    return null;
  }

  // Öffentliche Seiten ohne Widget
  if (path === "/" || path.startsWith("/mockup/") || path.startsWith("/sponsor-review/") || path.startsWith("/sponsor-form/")) {
    return null;
  }

  // Verwaltung
  if (path.startsWith("/verwaltung/org") || path === "/org" || path.startsWith("/org/")) {
    return { page: "Verwaltung", area: "Vereinsverwaltung" };
  }
  if (path.startsWith("/verwaltung/trainer") || path.startsWith("/trainer/")) {
    return { page: "Verwaltung", area: "Trainer-Dashboard" };
  }
  if (path.startsWith("/verwaltung/admin/users") || path === "/admin/users") {
    return { page: "Mitgliederverwaltung", area: "Benutzerverwaltung" };
  }
  if (path.startsWith("/verwaltung/sponsoren")) {
    return { page: "Verwaltung", area: "Sponsoren-Verwaltung" };
  }
  if (path.startsWith("/verwaltung")) {
    return { page: "Verwaltung" };
  }

  // Admin-Dashboard
  if (path === "/admin" || path === "/admin/dashboard") {
    return { page: "Admin-Dashboard" };
  }

  // Produktdesigner
  if (path.startsWith("/designer/products/")) {
    return { page: "Produktdesigner", area: "Produkt bearbeiten" };
  }
  if (path === "/designer/products") {
    return { page: "Produktdesigner", area: "Produktliste" };
  }

  // Konfigurator
  if (path.startsWith("/konfigurator/")) {
    return { page: "Konfigurator", area: "Produkt konfigurieren" };
  }
  if (path === "/konfigurator") {
    return { page: "Konfigurator", area: "Produktauswahl" };
  }

  // Abteilungs-Dashboard
  if (path.includes("/dept/")) {
    return { page: "Verwaltung", area: "Abteilungs-Dashboard" };
  }

  // Druckbogen
  if (path.startsWith("/druckbogen/")) {
    return { page: "Druckbogen" };
  }

  // Freigabe & Abstimmung
  if (path.startsWith("/freigabe/")) {
    return { page: "Freigabe" };
  }
  if (path.startsWith("/abstimmung/")) {
    return { page: "Abstimmung" };
  }

  // Fallback: Seite anzeigen aber generisch
  return { page: "Sonstige", area: path };
}

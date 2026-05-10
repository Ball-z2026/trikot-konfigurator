import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type Language = "de" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Get stored language or default to "de"
function getStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem("app-language");
    if (stored === "en" || stored === "de") return stored;
  } catch {}
  return "de";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getStoredLanguage);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("app-language", lang);
    } catch {}
  }, []);

  const t = useCallback(
    (key: string, fallback?: string) => {
      const dict = language === "en" ? en : de;
      return dict[key] ?? fallback ?? de[key] ?? key;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

// ─── German (default) ───
const de: Record<string, string> = {
  // General
  "app.title": "Textil-Konfigurator",
  "app.subtitle": "Verwaltung · Designer · Konfigurator",
  "app.loggedIn": "Angemeldet",
  "app.login": "Anmelden",
  "app.logout": "Abmelden",
  "app.register": "Registrieren",
  "app.back": "Zurück",
  "app.save": "Speichern",
  "app.cancel": "Abbrechen",
  "app.delete": "Löschen",
  "app.edit": "Bearbeiten",
  "app.create": "Erstellen",
  "app.search": "Suchen",
  "app.loading": "Laden...",
  "app.error": "Fehler",
  "app.success": "Erfolg",
  "app.confirm": "Bestätigen",
  "app.close": "Schließen",
  "app.yes": "Ja",
  "app.no": "Nein",
  "app.upload": "Hochladen",
  "app.download": "Herunterladen",
  "app.export": "Exportieren",
  "app.import": "Importieren",
  "app.preview": "Vorschau",
  "app.settings": "Einstellungen",
  "app.name": "Name",
  "app.email": "E-Mail",
  "app.password": "Passwort",
  "app.submit": "Absenden",
  "app.reset": "Zurücksetzen",
  "app.actions": "Aktionen",
  "app.status": "Status",
  "app.date": "Datum",
  "app.description": "Beschreibung",
  "app.details": "Details",
  "app.all": "Alle",
  "app.none": "Keine",
  "app.select": "Auswählen",
  "app.optional": "Optional",
  "app.required": "Erforderlich",

  // Navigation
  "nav.teams": "Mannschaften",
  "nav.kiDesigner": "KI-Designer",
  "nav.configurator": "Konfigurator",
  "nav.dashboard": "Dashboard",
  "nav.admin": "Admin",
  "nav.management": "Verwaltung",
  "nav.products": "Produkte",
  "nav.users": "Benutzer",
  "nav.sponsors": "Sponsoren",
  "nav.security": "Sicherheit",
  "nav.organization": "Organisation",

  // Home page
  "home.hero.title": "Textil-Konfigurator",
  "home.hero.subtitle": "Verwaltung · Designer · Konfigurator",
  "home.modules.title": "Module im Überblick",
  "home.howItWorks": "So funktioniert's – Schritt für Schritt",
  "home.step1.title": "Verein anlegen",
  "home.step1.desc": "Vereine anlegen und verwalten",
  "home.step1.detail1": "Sparten und Abteilungen",
  "home.step1.detail2": "Logos und Schriften",
  "home.step1.detail3": "Mannschaften und Spieler",
  "home.step2.title": "Produkt erstellen (KI-Designer)",
  "home.step2.desc": "Farben, Muster, Sponsoren",
  "home.step2.detail1": "Sportart wählen",
  "home.step2.detail2": "KI generiert das Design",
  "home.step2.detail3": "Für Konfigurator bereitstellen",
  "home.step3.title": "Konfigurator: Nummern & Namen zuweisen",
  "home.step3.desc": "Nummern und Namen",
  "home.step3.detail1": "Mannschaft und Spieler zuweisen",
  "home.step3.detail2": "Spieler + Nummern eintragen",
  "home.step3.detail3": "Export als PNG/ZIP",
  "home.module.management": "Verwaltung",
  "home.module.management.desc": "Vereine anlegen und verwalten",
  "home.module.management.detail1": "Vereine anlegen und verwalten",
  "home.module.management.detail2": "Mannschaften anlegen",
  "home.module.management.detail3": "Mannschaftsliste erstellen",
  "home.module.designer": "KI-Designer",
  "home.module.designer.desc": "Farben, Muster, Sponsoren",
  "home.module.configurator": "Konfigurator",
  "home.module.configurator.desc": "Nummern und Namen zuweisen",
  "home.module.configurator.detail1": "Farben und Logos platzieren",
  "home.module.configurator.detail2": "Nummern und Namen",
  "home.module.configurator.detail3": "Als Vorlage speichern",
  "home.cta.management": "Verwaltung öffnen",
  "home.cta.designer": "KI-Designer starten",
  "home.cta.configurator": "Konfigurator öffnen",
  "home.quickLinks": "Schnellzugriff",

  // Login
  "login.title": "Anmelden",
  "login.subtitle": "Melden Sie sich mit Ihren Zugangsdaten an",
  "login.email": "E-Mail-Adresse",
  "login.password": "Passwort",
  "login.forgotPassword": "Passwort vergessen?",
  "login.submit": "Anmelden",
  "login.noAccount": "Noch kein Konto?",
  "login.register": "Registrieren",
  "login.orLoginWith": "Oder anmelden mit",
  "login.manusLogin": "Mit Manus anmelden",
  "login.error": "Anmeldung fehlgeschlagen",
  "login.invalidCredentials": "Ungültige E-Mail oder Passwort",

  // Register
  "register.title": "Registrieren",
  "register.subtitle": "Erstellen Sie ein neues Konto",
  "register.name": "Name",
  "register.email": "E-Mail-Adresse",
  "register.password": "Passwort",
  "register.confirmPassword": "Passwort bestätigen",
  "register.submit": "Registrieren",
  "register.hasAccount": "Bereits ein Konto?",
  "register.login": "Anmelden",

  // Forgot Password
  "forgot.title": "Passwort vergessen",
  "forgot.subtitle": "Geben Sie Ihre E-Mail-Adresse ein",
  "forgot.submit": "Link senden",
  "forgot.backToLogin": "Zurück zur Anmeldung",

  // Organization
  "org.title": "Organisation",
  "org.createOrg": "Organisation erstellen",
  "org.name": "Organisationsname",
  "org.type": "Typ",
  "org.club": "Verein",
  "org.company": "Firma",
  "org.departments": "Abteilungen / Sparten",
  "org.createDept": "Abteilung erstellen",
  "org.members": "Mitglieder",
  "org.addMember": "Mitglied hinzufügen",
  "org.logos": "Logo-Varianten",
  "org.uploadLogo": "Logo hochladen",
  "org.setDefault": "Als Standard setzen",
  "org.inviteDeptLead": "Spartenleiter einladen",
  "org.role.owner": "Inhaber",
  "org.role.deptLead": "Spartenleiter",
  "org.role.trainer": "Trainer",
  "org.colors": "Vereinsfarben",
  "org.primaryColor": "Primärfarbe",
  "org.secondaryColor": "Sekundärfarbe",

  // Department
  "dept.title": "Abteilung",
  "dept.fonts": "Schriftarten",
  "dept.approveFont": "Schrift freigeben",
  "dept.inviteTrainer": "Trainer einladen",
  "dept.teams": "Mannschaften",

  // Trainer
  "trainer.title": "Trainer-Dashboard",
  "trainer.myTeams": "Meine Mannschaften",
  "trainer.createTeam": "Mannschaft erstellen",
  "trainer.teamName": "Mannschaftsname",
  "trainer.players": "Spieler",
  "trainer.addPlayer": "Spieler hinzufügen",
  "trainer.playerName": "Spielername",
  "trainer.playerNumber": "Rückennummer",
  "trainer.position": "Position",
  "trainer.importCsv": "CSV-Import",
  "trainer.exportCsv": "CSV-Export",
  "trainer.openConfigurator": "Konfigurator öffnen",
  "trainer.excelImport": "Excel-Import",

  // Products / Designer
  "products.title": "Produkte",
  "products.create": "Neues Produkt",
  "products.sport": "Sportart",
  "products.template": "Vorlage",
  "products.sublimation": "Sublimation",
  "products.dtf": "DTF",
  "products.published": "Veröffentlicht",
  "products.draft": "Entwurf",
  "products.parts": "Teile",
  "products.zones": "Zonen",
  "products.front": "Vorderteil",
  "products.back": "Rückteil",
  "products.sleeveLeft": "Ärmel Links",
  "products.sleeveRight": "Ärmel Rechts",
  "products.collar": "Kragen",
  "products.cuffLeft": "Bündchen Links",
  "products.cuffRight": "Bündchen Rechts",

  // KI Designer
  "ki.title": "KI-Designer",
  "ki.sublimation": "KI Designer für Sublimation Trikots",
  "ki.dtf": "KI-Analyse DTF",
  "ki.generate": "Design generieren",
  "ki.regenerate": "Neu generieren",
  "ki.generating": "KI generiert Design...",
  "ki.selectSport": "Sportart wählen",
  "ki.selectColors": "Farben wählen",
  "ki.pattern": "Muster",
  "ki.result": "Ergebnis",
  "ki.saveDesign": "Design speichern",
  "ki.applyToProduct": "Auf Produkt anwenden",

  // Configurator
  "config.title": "Konfigurator",
  "config.selectProduct": "Produkt auswählen",
  "config.overview": "Gesamtübersicht",
  "config.singlePart": "Einzelteile",
  "config.composite": "2D-Ansicht",
  "config.color": "Farbe",
  "config.colors": "Farben",
  "config.font": "Schrift",
  "config.fontSize": "Schriftgröße",
  "config.fontColor": "Schriftfarbe",
  "config.clubName": "Vereinsname",
  "config.playerName": "Spielername",
  "config.playerNumber": "Rückennummer",
  "config.sponsor": "Sponsor",
  "config.logo": "Logo / Wappen",
  "config.locked": "Gesperrt",
  "config.exportPng": "Als PNG exportieren",
  "config.exportZip": "Als ZIP exportieren",
  "config.exportAll": "Alle exportieren",
  "config.printSheet": "Druckbogen",

  // Sponsors
  "sponsor.title": "Sponsoren",
  "sponsor.manage": "Sponsoren verwalten",
  "sponsor.add": "Sponsor hinzufügen",
  "sponsor.name": "Sponsorname",
  "sponsor.logo": "Sponsor-Logo",
  "sponsor.position": "Position",
  "sponsor.review": "Sponsor prüfen",
  "sponsor.approve": "Freigeben",
  "sponsor.reject": "Ablehnen",

  // Admin
  "admin.title": "Admin-Dashboard",
  "admin.users": "Benutzerverwaltung",
  "admin.products": "Produktverwaltung",
  "admin.stats": "Statistiken",
  "admin.resetPassword": "Passwort zurücksetzen",
  "admin.deleteUser": "Benutzer löschen",
  "admin.createUser": "Benutzer erstellen",
  "admin.role": "Rolle",

  // Approval / Poll
  "approval.title": "Freigabe",
  "approval.approve": "Freigeben",
  "approval.reject": "Ablehnen",
  "approval.pending": "Ausstehend",
  "approval.approved": "Freigegeben",
  "approval.rejected": "Abgelehnt",
  "poll.title": "Abstimmung",
  "poll.vote": "Abstimmen",
  "poll.results": "Ergebnisse",

  // Payment
  "payment.title": "Zahlung",
  "payment.confirm": "Zahlung bestätigen",
  "payment.amount": "Betrag",
  "payment.method": "Zahlungsmethode",

  // Print Sheet
  "print.title": "Druckbogen-Export",
  "print.generate": "Druckbogen generieren",
  "print.generating": "Wird generiert...",
  "print.download": "Druckbogen herunterladen",
  "print.size": "Größe",
  "print.player": "Spieler",

  // 2FA
  "twoFactor.title": "Zwei-Faktor-Authentifizierung",
  "twoFactor.setup": "2FA einrichten",
  "twoFactor.enable": "Aktivieren",
  "twoFactor.disable": "Deaktivieren",
  "twoFactor.code": "Code eingeben",

  // Feedback
  "feedback.title": "Feedback",
  "feedback.send": "Feedback senden",
  "feedback.placeholder": "Ihr Feedback...",
  "feedback.thanks": "Vielen Dank für Ihr Feedback!",
  "feedback.beta": "Beta-Feedback",

  // Misc
  "misc.comingSoon": "Demnächst verfügbar",
  "misc.notFound": "Seite nicht gefunden",
  "misc.noData": "Keine Daten vorhanden",
  "misc.noResults": "Keine Ergebnisse",
  "misc.tryAgain": "Erneut versuchen",
  "misc.learnMore": "Mehr erfahren",
};

// ─── English ───
const en: Record<string, string> = {
  // General
  "app.title": "Textile Configurator",
  "app.subtitle": "Management · Designer · Configurator",
  "app.loggedIn": "Logged in",
  "app.login": "Log in",
  "app.logout": "Log out",
  "app.register": "Register",
  "app.back": "Back",
  "app.save": "Save",
  "app.cancel": "Cancel",
  "app.delete": "Delete",
  "app.edit": "Edit",
  "app.create": "Create",
  "app.search": "Search",
  "app.loading": "Loading...",
  "app.error": "Error",
  "app.success": "Success",
  "app.confirm": "Confirm",
  "app.close": "Close",
  "app.yes": "Yes",
  "app.no": "No",
  "app.upload": "Upload",
  "app.download": "Download",
  "app.export": "Export",
  "app.import": "Import",
  "app.preview": "Preview",
  "app.settings": "Settings",
  "app.name": "Name",
  "app.email": "Email",
  "app.password": "Password",
  "app.submit": "Submit",
  "app.reset": "Reset",
  "app.actions": "Actions",
  "app.status": "Status",
  "app.date": "Date",
  "app.description": "Description",
  "app.details": "Details",
  "app.all": "All",
  "app.none": "None",
  "app.select": "Select",
  "app.optional": "Optional",
  "app.required": "Required",

  // Navigation
  "nav.teams": "Teams",
  "nav.kiDesigner": "AI Designer",
  "nav.configurator": "Configurator",
  "nav.dashboard": "Dashboard",
  "nav.admin": "Admin",
  "nav.management": "Management",
  "nav.products": "Products",
  "nav.users": "Users",
  "nav.sponsors": "Sponsors",
  "nav.security": "Security",
  "nav.organization": "Organization",

  // Home page
  "home.hero.title": "Textile Configurator",
  "home.hero.subtitle": "Management · Designer · Configurator",
  "home.modules.title": "Modules Overview",
  "home.howItWorks": "How It Works – Step by Step",
  "home.step1.title": "Create Club",
  "home.step1.desc": "Create and manage clubs",
  "home.step1.detail1": "Divisions and departments",
  "home.step1.detail2": "Logos and fonts",
  "home.step1.detail3": "Teams and players",
  "home.step2.title": "Create Product (AI Designer)",
  "home.step2.desc": "Colors, patterns, sponsors",
  "home.step2.detail1": "Choose sport",
  "home.step2.detail2": "AI generates the design",
  "home.step2.detail3": "Provide for configurator",
  "home.step3.title": "Configurator: Assign Numbers & Names",
  "home.step3.desc": "Numbers and names",
  "home.step3.detail1": "Assign team and players",
  "home.step3.detail2": "Enter players + numbers",
  "home.step3.detail3": "Export as PNG/ZIP",
  "home.module.management": "Management",
  "home.module.management.desc": "Create and manage clubs",
  "home.module.management.detail1": "Create and manage clubs",
  "home.module.management.detail2": "Create teams",
  "home.module.management.detail3": "Create team roster",
  "home.module.designer": "AI Designer",
  "home.module.designer.desc": "Colors, patterns, sponsors",
  "home.module.configurator": "Configurator",
  "home.module.configurator.desc": "Assign numbers and names",
  "home.module.configurator.detail1": "Place colors and logos",
  "home.module.configurator.detail2": "Numbers and names",
  "home.module.configurator.detail3": "Save as template",
  "home.cta.management": "Open Management",
  "home.cta.designer": "Start AI Designer",
  "home.cta.configurator": "Open Configurator",
  "home.quickLinks": "Quick Access",

  // Login
  "login.title": "Log In",
  "login.subtitle": "Sign in with your credentials",
  "login.email": "Email address",
  "login.password": "Password",
  "login.forgotPassword": "Forgot password?",
  "login.submit": "Log In",
  "login.noAccount": "Don't have an account?",
  "login.register": "Register",
  "login.orLoginWith": "Or log in with",
  "login.manusLogin": "Log in with Manus",
  "login.error": "Login failed",
  "login.invalidCredentials": "Invalid email or password",
  "login.fillFields": "Please enter email and password",
  "login.enter2fa": "Please enter your 2FA code",
  "login.mustChangePassword": "Please change your password on first login",
  "login.success": "Successfully logged in",
  "login.enterBackupCode": "Please enter backup code",
  "login.enter6digit": "Please enter 6-digit code",
  "login.verifyFailed": "Verification failed",
  "login.passwordMinLength": "New password must be at least 6 characters",
  "login.passwordMismatch": "Passwords do not match",
  "login.changePasswordFailed": "Password change failed",
  "login.passwordChanged": "Password changed successfully",
  "login.enterBackupCodeDesc": "Enter one of your backup codes.",
  "login.enter6digitDesc": "Enter the 6-digit code from your authenticator app.",
  "login.backupCode": "Backup Code",
  "login.authCode": "Authentication Code",
  "login.verifying": "Verifying...",
  "login.verify": "Verify",
  "login.useAuthApp": "Use authenticator app",
  "login.useBackupCode": "Use backup code",
  "login.backToLogin": "Back to login",
  "login.changePassword": "Change Password",
  "login.changePasswordDesc": "Please choose a new password for your account. The password must be at least 6 characters long.",
  "login.newPassword": "New Password",
  "login.minChars": "At least 6 characters",
  "login.confirmNewPassword": "Confirm Password",
  "login.repeatPassword": "Repeat password",
  "login.changingPassword": "Changing...",
  "login.loginDesc": "Sign in to design your textiles.",
  "login.emailPlaceholder": "your@email.com",
  "login.passwordPlaceholder": "Your password",
  "login.loggingIn": "Logging in...",
  "login.or": "or",
  "login.googleLogin": "Sign in with Google",
  "login.registerNow": "Register now",
  "login.allUsersInfo": "All users (club managers, division leads, trainers) sign in with email and password.",
  "login.backToHome": "Back to home",
  "login.invalidCode": "Invalid code",

  // Register
  "register.title": "Register",
  "register.subtitle": "Create a new account",
  "register.name": "Name",
  "register.email": "Email address",
  "register.password": "Password",
  "register.confirmPassword": "Confirm password",
  "register.submit": "Register",
  "register.hasAccount": "Already have an account?",
  "register.login": "Log in",

  // Forgot Password
  "forgot.title": "Forgot Password",
  "forgot.subtitle": "Enter your email address",
  "forgot.submit": "Send link",
  "forgot.backToLogin": "Back to login",
  "forgot.enterEmail": "Please enter your email address",
  "forgot.requestFailed": "Request failed",
  "forgot.requestFailedRetry": "Request failed. Please try again.",
  "forgot.emailSent": "Email Sent",
  "forgot.emailSentDesc": "If an account with this email exists, a password reset link has been sent to your club manager.",
  "forgot.contactAdmin": "Please contact your club manager to receive the reset link. The link is valid for 1 hour.",
  "forgot.desc": "Enter your email address. Your club manager will receive a link to reset your password.",
  "forgot.sending": "Sending...",
  "forgot.requestLink": "Request Reset Link",

  // Organization
  "org.title": "Organization",
  "org.createOrg": "Create Organization",
  "org.name": "Organization Name",
  "org.type": "Type",
  "org.club": "Club",
  "org.company": "Company",
  "org.departments": "Departments / Divisions",
  "org.createDept": "Create Department",
  "org.members": "Members",
  "org.addMember": "Add Member",
  "org.logos": "Logo Variants",
  "org.uploadLogo": "Upload Logo",
  "org.setDefault": "Set as Default",
  "org.inviteDeptLead": "Invite Department Lead",
  "org.role.owner": "Owner",
  "org.role.deptLead": "Department Lead",
  "org.role.trainer": "Trainer",
  "org.colors": "Club Colors",
  "org.primaryColor": "Primary Color",
  "org.secondaryColor": "Secondary Color",

  // Department
  "dept.title": "Department",
  "dept.fonts": "Fonts",
  "dept.approveFont": "Approve Font",
  "dept.inviteTrainer": "Invite Trainer",
  "dept.teams": "Teams",

  // Trainer
  "trainer.title": "Trainer Dashboard",
  "trainer.myTeams": "My Teams",
  "trainer.createTeam": "Create Team",
  "trainer.teamName": "Team Name",
  "trainer.players": "Players",
  "trainer.addPlayer": "Add Player",
  "trainer.playerName": "Player Name",
  "trainer.playerNumber": "Jersey Number",
  "trainer.position": "Position",
  "trainer.importCsv": "CSV Import",
  "trainer.exportCsv": "CSV Export",
  "trainer.openConfigurator": "Open Configurator",
  "trainer.excelImport": "Excel Import",

  // Products / Designer
  "products.title": "Products",
  "products.create": "New Product",
  "products.sport": "Sport",
  "products.template": "Template",
  "products.sublimation": "Sublimation",
  "products.dtf": "DTF",
  "products.published": "Published",
  "products.draft": "Draft",
  "products.parts": "Parts",
  "products.zones": "Zones",
  "products.front": "Front Panel",
  "products.back": "Back Panel",
  "products.sleeveLeft": "Left Sleeve",
  "products.sleeveRight": "Right Sleeve",
  "products.collar": "Collar",
  "products.cuffLeft": "Left Cuff",
  "products.cuffRight": "Right Cuff",

  // KI Designer
  "ki.title": "AI Designer",
  "ki.sublimation": "AI Designer for Sublimation Jerseys",
  "ki.dtf": "AI Analysis DTF",
  "ki.generate": "Generate Design",
  "ki.regenerate": "Regenerate",
  "ki.generating": "AI is generating design...",
  "ki.selectSport": "Choose Sport",
  "ki.selectColors": "Choose Colors",
  "ki.pattern": "Pattern",
  "ki.result": "Result",
  "ki.saveDesign": "Save Design",
  "ki.applyToProduct": "Apply to Product",

  // Configurator
  "config.title": "Configurator",
  "config.selectProduct": "Select Product",
  "config.overview": "Overview",
  "config.singlePart": "Single Parts",
  "config.composite": "2D View",
  "config.color": "Color",
  "config.colors": "Colors",
  "config.font": "Font",
  "config.fontSize": "Font Size",
  "config.fontColor": "Font Color",
  "config.clubName": "Club Name",
  "config.playerName": "Player Name",
  "config.playerNumber": "Jersey Number",
  "config.sponsor": "Sponsor",
  "config.logo": "Logo / Crest",
  "config.locked": "Locked",
  "config.exportPng": "Export as PNG",
  "config.exportZip": "Export as ZIP",
  "config.exportAll": "Export All",
  "config.printSheet": "Print Sheet",

  // Sponsors
  "sponsor.title": "Sponsors",
  "sponsor.manage": "Manage Sponsors",
  "sponsor.add": "Add Sponsor",
  "sponsor.name": "Sponsor Name",
  "sponsor.logo": "Sponsor Logo",
  "sponsor.position": "Position",
  "sponsor.review": "Review Sponsor",
  "sponsor.approve": "Approve",
  "sponsor.reject": "Reject",

  // Admin
  "admin.title": "Admin Dashboard",
  "admin.users": "User Management",
  "admin.products": "Product Management",
  "admin.stats": "Statistics",
  "admin.resetPassword": "Reset Password",
  "admin.deleteUser": "Delete User",
  "admin.createUser": "Create User",
  "admin.role": "Role",

  // Approval / Poll
  "approval.title": "Approval",
  "approval.approve": "Approve",
  "approval.reject": "Reject",
  "approval.pending": "Pending",
  "approval.approved": "Approved",
  "approval.rejected": "Rejected",
  "poll.title": "Poll",
  "poll.vote": "Vote",
  "poll.results": "Results",

  // Payment
  "payment.title": "Payment",
  "payment.confirm": "Confirm Payment",
  "payment.amount": "Amount",
  "payment.method": "Payment Method",

  // Print Sheet
  "print.title": "Print Sheet Export",
  "print.generate": "Generate Print Sheet",
  "print.generating": "Generating...",
  "print.download": "Download Print Sheet",
  "print.size": "Size",
  "print.player": "Player",

  // 2FA
  "twoFactor.title": "Two-Factor Authentication",
  "twoFactor.setup": "Set up 2FA",
  "twoFactor.enable": "Enable",
  "twoFactor.disable": "Disable",
  "twoFactor.code": "Enter code",

  // Feedback
  "feedback.title": "Feedback",
  "feedback.send": "Send Feedback",
  "feedback.placeholder": "Your feedback...",
  "feedback.thanks": "Thank you for your feedback!",
  "feedback.beta": "Beta Feedback",

  // Home extended
  "home.hero.desc": "Manage clubs and teams, design products and configure textiles.",
  "home.cta.login": "Log in now",
  "home.step1.longDesc": "Create your club with address, club colors and crest. The owner can then create team rosters.",
  "home.step2.roster": "Create Team Roster",
  "home.step2.rosterDesc": "Create a team roster with player names and numbers. These will be automatically applied to the jerseys in the configurator.",
  "home.step2.rosterCta": "Manage Teams",
  "home.step3.longDesc": "Create a new jersey design with the AI Designer. Choose colors, patterns, sport and let the AI generate a professional design. Save it as a template.",
  "home.step4.longDesc": "Open the created product in the configurator and fill it with numbers and names from the team roster. Export as PNG or ZIP.",
  "home.module.management.cardDesc": "Manage clubs, divisions, teams and players",
  "home.module.designer.cardDesc": "Generate jersey design with AI and save as template",
  "home.module.configurator.cardDesc": "Fill finished products with numbers and names from team roster",
  "home.module.teams.cardDesc": "Manage team rosters with players and numbers",

  // Misc
  "misc.comingSoon": "Coming soon",
  "misc.notFound": "Page not found",
  "misc.noData": "No data available",
  "misc.noResults": "No results",
  "misc.tryAgain": "Try again",
  "misc.learnMore": "Learn more",

  // NotFound
  "notFound.desc": "Sorry, the page you are looking for doesn't exist. It may have been moved or deleted.",
  "notFound.goHome": "Go Home",
};

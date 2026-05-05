import { Toaster } from "@/components/ui/sonner";
import { BetaFeedbackGlobal } from "@/components/BetaFeedbackGlobal";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import AdminProducts from "./pages/AdminProducts";
import AdminProductEditor from "./pages/AdminProductEditor";
import CustomerConfigurator from "./pages/CustomerConfigurator";
import OrgDashboard from "./pages/OrgDashboard";
import DeptFonts from "./pages/DeptFonts";
import TrainerDashboard from "./pages/TrainerDashboard";
import Login from "./pages/Login";
import AdminUsers from "./pages/AdminUsers";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Register from "./pages/Register";
import DeptDashboard from "./pages/DeptDashboard";
import PaymentConfirm from "./pages/PaymentConfirm";
import MockupShare from "./pages/MockupShare";
import ProductSelect from "./pages/ProductSelect";
import SponsorManagement from "./pages/SponsorManagement";
import SponsorReview from "./pages/SponsorReview";
import SponsorForm from "./pages/SponsorForm";
import TwoFactorSetup from "./pages/TwoFactorSetup";
import AdminDashboard from "./pages/AdminDashboard";
import PrintSheetExport from "./pages/PrintSheetExport";
import ApprovalReview from "./pages/ApprovalReview";
import TeamPoll from "./pages/TeamPoll";

function Router() {
  return (
    <Switch>
      {/* Startseite */}
      <Route path="/" component={Home} />

      {/* Auth */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />

      {/* Admin-Dashboard */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/dashboard" component={AdminDashboard} />

      {/* ─── Modul 1: Verwaltung ─── */}
      <Route path="/verwaltung/org" component={OrgDashboard} />
      <Route path="/verwaltung/org/:id" component={OrgDashboard} />
      <Route path="/verwaltung/org/:id/dept/:deptId" component={DeptDashboard} />
      <Route path="/verwaltung/org/:id/dept/:deptId/fonts" component={DeptFonts} />
      <Route path="/verwaltung/trainer/:id/:deptId" component={TrainerDashboard} />
      <Route path="/verwaltung/trainer/:id/:deptId/team/:teamId" component={TrainerDashboard} />
      <Route path="/verwaltung/admin/users" component={AdminUsers} />
      <Route path="/verwaltung/sponsoren" component={SponsorManagement} />

      {/* ─── Modul 2: Produktdesigner (Produkte erstellen/bearbeiten) ─── */}
      <Route path="/designer/products" component={AdminProducts} />
      <Route path="/designer/products/:id" component={AdminProductEditor} />

      {/* ─── Modul 3: Konfigurator (fertige Produkte konfigurieren) ─── */}
      <Route path="/konfigurator" component={ProductSelect} />
      <Route path="/konfigurator/:id" component={CustomerConfigurator} />
      <Route path="/mockup/:token" component={MockupShare} />
      <Route path="/sponsor-review/:token" component={SponsorReview} />
      <Route path="/sponsor-form/:token" component={SponsorForm} />

      {/* Sicherheit */}
      <Route path="/verwaltung/sicherheit/2fa" component={TwoFactorSetup} />

      {/* Freigabe & Abstimmung */}
      <Route path="/freigabe/:orgId" component={ApprovalReview} />
      <Route path="/abstimmung/:pollId" component={TeamPoll} />

      {/* Druckbogen-Export */}
      <Route path="/druckbogen/:orgId/:designId/:teamId" component={PrintSheetExport} />

      {/* Zahlung */}
      <Route path="/payment/confirm/:token" component={PaymentConfirm} />

      {/* ─── Alte Routes (Rückwärtskompatibilität) ─── */}
      <Route path="/org" component={OrgDashboard} />
      <Route path="/org/:id" component={OrgDashboard} />
      <Route path="/dept-dashboard" component={DeptDashboard} />
      <Route path="/org/:id/dept/:deptId" component={DeptFonts} />
      <Route path="/trainer/:id/:deptId" component={TrainerDashboard} />
      <Route path="/trainer/:id/:deptId/team/:teamId" component={TrainerDashboard} />
      <Route path="/admin/products" component={ProductSelect} />
      <Route path="/admin/products/:id" component={AdminProductEditor} />
      <Route path="/admin/users" component={AdminUsers} />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster duration={2500} />
          <Router />
          <BetaFeedbackGlobal />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

import { Toaster } from "@/components/ui/sonner";
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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin/products" component={AdminProducts} />
      <Route path="/admin/products/:id" component={AdminProductEditor} />
      <Route path="/konfigurator/:id" component={CustomerConfigurator} />
      <Route path="/org" component={OrgDashboard} />
      <Route path="/org/:id" component={OrgDashboard} />
      <Route path="/org/:id/dept/:deptId" component={DeptFonts} />
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
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

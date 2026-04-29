import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { Shirt, Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Bitte E-Mail und Passwort eingeben");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/local-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Anmeldung fehlgeschlagen");
        return;
      }

      if (data.mustChangePassword) {
        setMustChangePassword(true);
        toast.info("Bitte ändern Sie Ihr Passwort bei der ersten Anmeldung");
        return;
      }

      toast.success("Erfolgreich angemeldet");
      // Intelligente Weiterleitung basierend auf Rolle
      // Lade Mitgliedschaften um die richtige Seite zu bestimmen
      try {
        const meRes = await fetch("/api/trpc/membership.mine", { credentials: "include" });
        const meData = await meRes.json();
        const memberships = meData?.result?.data;
        if (Array.isArray(memberships) && memberships.length > 0) {
          const first = memberships[0];
          if (first.role === "trainer") {
            window.location.href = `/trainer/${first.orgId}/${first.departmentId}`;
            return;
          }
          if (first.role === "department_lead") {
            window.location.href = `/org/${first.orgId}/dept/${first.departmentId}`;
            return;
          }
          if (first.role === "owner") {
            window.location.href = `/org/${first.orgId}`;
            return;
          }
        }
      } catch {
        // Fallback: Zur Startseite
      }
      window.location.href = "/";
    } catch (error) {
      toast.error("Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error("Neues Passwort muss mindestens 6 Zeichen lang sein");
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      toast.error("Passwörter stimmen nicht überein");
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: password, newPassword }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Passwort-Änderung fehlgeschlagen");
        return;
      }

      toast.success("Passwort erfolgreich geändert");
      // Intelligente Weiterleitung nach Passwort-Änderung
      try {
        const meRes = await fetch("/api/trpc/membership.mine", { credentials: "include" });
        const meData = await meRes.json();
        const memberships = meData?.result?.data;
        if (Array.isArray(memberships) && memberships.length > 0) {
          const first = memberships[0];
          if (first.role === "trainer") {
            window.location.href = `/trainer/${first.orgId}/${first.departmentId}`;
            return;
          }
          if (first.role === "department_lead") {
            window.location.href = `/org/${first.orgId}/dept/${first.departmentId}`;
            return;
          }
          if (first.role === "owner") {
            window.location.href = `/org/${first.orgId}`;
            return;
          }
        }
      } catch {
        // Fallback
      }
      window.location.href = "/";
    } catch (error) {
      toast.error("Passwort-Änderung fehlgeschlagen");
    } finally {
      setChangingPassword(false);
    }
  };

  // Password change form (shown after first login)
  if (mustChangePassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Lock className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl">Passwort ändern</CardTitle>
            <CardDescription>
              Bitte wählen Sie ein neues Passwort für Ihren Account.
              Das Passwort muss mindestens 6 Zeichen lang sein.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Neues Passwort</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mindestens 6 Zeichen"
                    className="pr-10"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPasswordConfirm">Passwort bestätigen</Label>
                <Input
                  id="newPasswordConfirm"
                  type={showPassword ? "text" : "password"}
                  value={newPasswordConfirm}
                  onChange={(e) => setNewPasswordConfirm(e.target.value)}
                  placeholder="Passwort wiederholen"
                />
              </div>
              <Button type="submit" className="w-full" disabled={changingPassword}>
                {changingPassword ? "Wird geändert..." : "Passwort ändern"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main login form
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <Shirt className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl">Textil-Konfigurator</CardTitle>
          <CardDescription>
            Melden Sie sich an, um Ihre Textilien zu gestalten.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Local login form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ihre@email.de"
                  className="pl-10"
                  autoFocus
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ihr Passwort"
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Wird angemeldet..." : "Anmelden"}
            </Button>
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Passwort vergessen?
            </button>
          </form>

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
              oder
            </span>
          </div>

          {/* OAuth login button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => { window.location.href = getLoginUrl(); }}
          >
            Als Vereinsverantwortlicher anmelden
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Spartenleiter und Trainer erhalten ihre Zugangsdaten vom Vereinsverantwortlichen.
          </p>

          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Startseite
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

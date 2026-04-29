import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, UserCheck, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

type RegistrationRole = "verein" | "sparte" | "trainer" | null;

export default function Register() {
  const [, navigate] = useLocation();
  const [selectedRole, setSelectedRole] = useState<RegistrationRole>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [deptName, setDeptName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!selectedRole || !name || !email || !password || !orgName) {
      toast.error("Bitte füllen Sie alle Pflichtfelder aus");
      return;
    }
    if (password.length < 6) {
      toast.error("Passwort muss mindestens 6 Zeichen lang sein");
      return;
    }
    if (selectedRole === "sparte" && !deptName) {
      toast.error("Bitte geben Sie einen Spartennamen ein");
      return;
    }
    if (selectedRole === "trainer" && (!deptName || !teamName)) {
      toast.error("Bitte geben Sie Sparten- und Mannschaftsnamen ein");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: selectedRole,
          name,
          email,
          password,
          orgName,
          deptName: deptName || undefined,
          teamName: teamName || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Registrierung fehlgeschlagen");
        return;
      }

      toast.success("Registrierung erfolgreich!");
      // Redirect based on role
      if (selectedRole === "verein") {
        navigate("/org");
      } else if (selectedRole === "sparte") {
        navigate("/org");
      } else if (selectedRole === "trainer") {
        navigate("/trainer");
      }
    } catch (error) {
      toast.error("Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.");
    } finally {
      setLoading(false);
    }
  };

  // Role selection view
  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Registrierung</h1>
            <p className="text-slate-400">Wählen Sie Ihre Rolle, um loszulegen</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Verein */}
            <Card
              className="cursor-pointer border-2 border-transparent hover:border-blue-500 transition-all bg-slate-800/50 text-white"
              onClick={() => setSelectedRole("verein")}
            >
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-3">
                  <Building2 className="w-8 h-8 text-blue-400" />
                </div>
                <CardTitle className="text-lg">Als Verein</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-400 text-center text-sm">
                  Vereinsverantwortlicher mit allen Berechtigungen: Logos hochladen, Spartenleiter und Trainer verwalten, alle Konfigurationen steuern.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Sparte */}
            <Card
              className="cursor-pointer border-2 border-transparent hover:border-emerald-500 transition-all bg-slate-800/50 text-white"
              onClick={() => setSelectedRole("sparte")}
            >
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
                  <Users className="w-8 h-8 text-emerald-400" />
                </div>
                <CardTitle className="text-lg">Als Sparte</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-400 text-center text-sm">
                  Spartenleiter mit Logo-Berechtigung: Logos hochladen, Schriftarten freigeben, Trainer einladen und verwalten.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Trainer */}
            <Card
              className="cursor-pointer border-2 border-transparent hover:border-amber-500 transition-all bg-slate-800/50 text-white"
              onClick={() => setSelectedRole("trainer")}
            >
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-3">
                  <UserCheck className="w-8 h-8 text-amber-400" />
                </div>
                <CardTitle className="text-lg">Als Trainer</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-400 text-center text-sm">
                  Trainer einer Mannschaft mit vollen Konfigurator-Berechtigungen: Spieler verwalten, Trikots konfigurieren und exportieren.
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-6">
            <p className="text-slate-400 text-sm">
              Bereits registriert?{" "}
              <Link href="/login" className="text-blue-400 hover:text-blue-300 underline">
                Zum Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Registration form
  const roleLabels = {
    verein: { title: "Als Verein registrieren", color: "blue", icon: Building2 },
    sparte: { title: "Als Spartenleiter registrieren", color: "emerald", icon: Users },
    trainer: { title: "Als Trainer registrieren", color: "amber", icon: UserCheck },
  };
  const roleInfo = roleLabels[selectedRole];
  const RoleIcon = roleInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800/50 border-slate-700 text-white">
        <CardHeader>
          <button
            onClick={() => setSelectedRole(null)}
            className="flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zur Rollenauswahl
          </button>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full bg-${roleInfo.color}-500/20 flex items-center justify-center`}>
              <RoleIcon className={`w-5 h-5 text-${roleInfo.color}-400`} />
            </div>
            <CardTitle className="text-xl">{roleInfo.title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Personal info */}
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Ihr Name *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Max Mustermann"
              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-300">E-Mail-Adresse *</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="max@verein.de"
              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Passwort * (mind. 6 Zeichen)</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Role-specific fields */}
          <div className="border-t border-slate-700 pt-4 space-y-3">
            <p className="text-sm font-medium text-slate-300">Vereins-/Organisationsdaten</p>
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Vereinsname *</label>
              <Input
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="z.B. TSV Musterstadt"
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>

            {(selectedRole === "sparte" || selectedRole === "trainer") && (
              <div className="space-y-2">
                <label className="text-sm text-slate-400">Spartenname *</label>
                <Input
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="z.B. Fußball, Handball"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
            )}

            {selectedRole === "trainer" && (
              <div className="space-y-2">
                <label className="text-sm text-slate-400">Mannschaftsname *</label>
                <Input
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="z.B. 1. Herren, A-Jugend"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
            )}
          </div>

          <Button
            onClick={handleRegister}
            disabled={loading}
            className="w-full mt-4"
          >
            {loading ? "Wird registriert..." : "Registrieren"}
          </Button>

          <p className="text-center text-slate-400 text-sm mt-3">
            Bereits registriert?{" "}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 underline">
              Zum Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle, AlertTriangle } from "lucide-react";

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const token = params.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      toast.error("Passwort muss mindestens 6 Zeichen lang sein");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwörter stimmen nicht überein");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Passwort-Reset fehlgeschlagen");
        return;
      }

      setSuccess(true);
    } catch (error) {
      toast.error("Passwort-Reset fehlgeschlagen. Bitte versuchen Sie es erneut.");
    } finally {
      setLoading(false);
    }
  };

  // No token provided
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl">Ungültiger Link</CardTitle>
            <CardDescription>
              Dieser Link zum Zurücksetzen des Passworts ist ungültig.
              Bitte fordern Sie einen neuen Link an.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/forgot-password")}
            >
              Neuen Link anfordern
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-green-100 text-green-600">
              <CheckCircle className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl">Passwort zurückgesetzt</CardTitle>
            <CardDescription className="text-base mt-2">
              Ihr Passwort wurde erfolgreich geändert.
              Sie können sich jetzt mit Ihrem neuen Passwort anmelden.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate("/login")}>
              Zum Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Reset form
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <Lock className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl">Neues Passwort setzen</CardTitle>
          <CardDescription>
            Wählen Sie ein neues Passwort für Ihren Account.
            Das Passwort muss mindestens 6 Zeichen lang sein.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Neues Passwort</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mindestens 6 Zeichen"
                  className="pl-10 pr-10"
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
              <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Passwort wiederholen"
                  className="pl-10"
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Wird zurückgesetzt..." : "Passwort zurücksetzen"}
            </Button>
          </form>
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-4"
            onClick={() => navigate("/login")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zum Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Bitte geben Sie Ihre E-Mail-Adresse ein");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, origin: window.location.origin }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Anfrage fehlgeschlagen");
        return;
      }

      setSent(true);
    } catch (error) {
      toast.error("Anfrage fehlgeschlagen. Bitte versuchen Sie es erneut.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-green-100 text-green-600">
              <CheckCircle className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl">E-Mail gesendet</CardTitle>
            <CardDescription className="text-base mt-2">
              Falls ein Account mit der E-Mail <strong>{email}</strong> existiert,
              wurde ein Link zum Zurücksetzen des Passworts an Ihren Vereinsverantwortlichen gesendet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Bitte wenden Sie sich an Ihren Vereinsverantwortlichen, um den Reset-Link zu erhalten.
              Der Link ist 1 Stunde gültig.
            </p>
            <Button
              variant="outline"
              className="w-full"
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <Mail className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl">Passwort vergessen</CardTitle>
          <CardDescription>
            Geben Sie Ihre E-Mail-Adresse ein. Ihr Vereinsverantwortlicher erhält
            einen Link zum Zurücksetzen Ihres Passworts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail-Adresse</Label>
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Wird gesendet..." : "Reset-Link anfordern"}
            </Button>
          </form>
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
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

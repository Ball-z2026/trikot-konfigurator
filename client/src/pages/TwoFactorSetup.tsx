import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ShieldCheck, ShieldOff, Copy, ArrowLeft, KeyRound, RefreshCw, AlertTriangle } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function TwoFactorSetup() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState<"status" | "setup" | "confirm" | "backup" | "disable">("status");
  const [confirmCode, setConfirmCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [regenerateCode, setRegenerateCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const statusQuery = trpc.twoFactor.status.useQuery(undefined, {
    enabled: !!user,
  });

  const setupMutation = trpc.twoFactor.setup.useMutation({
    onSuccess: () => {
      setStep("confirm");
    },
    onError: (err) => {
      toast.error(err.message || "2FA-Setup fehlgeschlagen");
    },
  });

  const confirmMutation = trpc.twoFactor.confirmSetup.useMutation({
    onSuccess: (data) => {
      setBackupCodes(data.backupCodes);
      setStep("backup");
      statusQuery.refetch();
      toast.success("Zwei-Faktor-Authentifizierung wurde aktiviert!");
    },
    onError: (err) => {
      toast.error(err.message || "Verifizierung fehlgeschlagen");
      setConfirmCode("");
    },
  });

  const disableMutation = trpc.twoFactor.disable.useMutation({
    onSuccess: () => {
      setStep("status");
      setDisableCode("");
      statusQuery.refetch();
      toast.success("Zwei-Faktor-Authentifizierung wurde deaktiviert");
    },
    onError: (err) => {
      toast.error(err.message || "Deaktivierung fehlgeschlagen");
      setDisableCode("");
    },
  });

  const regenerateMutation = trpc.twoFactor.regenerateBackupCodes.useMutation({
    onSuccess: (data) => {
      setBackupCodes(data.backupCodes);
      setStep("backup");
      setRegenerateCode("");
      toast.success("Neue Backup-Codes wurden generiert");
    },
    onError: (err) => {
      toast.error(err.message || "Generierung fehlgeschlagen");
      setRegenerateCode("");
    },
  });

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    toast.success("Backup-Codes in die Zwischenablage kopiert");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Laden...</div>
      </div>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  // Backup-Codes anzeigen
  if (step === "backup" && backupCodes.length > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <KeyRound className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl">Backup-Codes</CardTitle>
            <CardDescription>
              Speichern Sie diese Codes an einem sicheren Ort. Jeder Code kann nur einmal verwendet werden,
              falls Sie keinen Zugriff auf Ihre Authenticator-App haben.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted rounded-lg p-4">
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, i) => (
                  <div key={i} className="font-mono text-sm text-center py-1.5 bg-background rounded border">
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Diese Codes werden nur einmal angezeigt. Speichern Sie sie jetzt!
              </span>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={copyBackupCodes}>
                <Copy className="mr-2 h-4 w-4" />
                Codes kopieren
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setStep("status");
                  setBackupCodes([]);
                }}
              >
                Fertig
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 2FA-Setup: QR-Code anzeigen
  if (step === "confirm" && setupMutation.data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl">Authenticator einrichten</CardTitle>
            <CardDescription>
              Scannen Sie den QR-Code mit Ihrer Authenticator-App (z.B. Google Authenticator, Authy, 1Password).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* QR Code */}
            <div className="flex justify-center">
              <img
                src={setupMutation.data.qrCodeDataUrl}
                alt="2FA QR-Code"
                className="w-56 h-56 rounded-lg border"
              />
            </div>

            {/* Manual secret */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Manueller Schlüssel (falls QR-Code nicht funktioniert):</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-muted px-3 py-2 rounded font-mono break-all">
                  {setupMutation.data.secret}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(setupMutation.data!.secret);
                    toast.success("Schlüssel kopiert");
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator />

            {/* Verification code input */}
            <div className="space-y-3">
              <Label>Bestätigungscode eingeben</Label>
              <p className="text-sm text-muted-foreground">
                Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein, um die Einrichtung abzuschließen.
              </p>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={confirmCode}
                  onChange={(value) => {
                    setConfirmCode(value);
                    if (value.length === 6) {
                      confirmMutation.mutate({ token: value });
                    }
                  }}
                  autoFocus
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            <Button
              className="w-full"
              disabled={confirmCode.length !== 6 || confirmMutation.isPending}
              onClick={() => confirmMutation.mutate({ token: confirmCode })}
            >
              {confirmMutation.isPending ? "Wird verifiziert..." : "2FA aktivieren"}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                setStep("status");
                setConfirmCode("");
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Abbrechen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 2FA deaktivieren
  if (step === "disable") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <ShieldOff className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl">2FA deaktivieren</CardTitle>
            <CardDescription>
              Geben Sie Ihren aktuellen Authenticator-Code ein, um die Zwei-Faktor-Authentifizierung zu deaktivieren.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Das Deaktivieren der 2FA verringert die Sicherheit Ihres Kontos erheblich.
              </span>
            </div>

            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={disableCode}
                onChange={(value) => {
                  setDisableCode(value);
                  if (value.length === 6) {
                    disableMutation.mutate({ token: value });
                  }
                }}
                autoFocus
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              variant="destructive"
              className="w-full"
              disabled={disableCode.length !== 6 || disableMutation.isPending}
              onClick={() => disableMutation.mutate({ token: disableCode })}
            >
              {disableMutation.isPending ? "Wird deaktiviert..." : "2FA deaktivieren"}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                setStep("status");
                setDisableCode("");
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Abbrechen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Status-Übersicht
  const isEnabled = statusQuery.data?.enabled ?? false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl ${
            isEnabled ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"
          }`}>
            <ShieldCheck className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl">Zwei-Faktor-Authentifizierung</CardTitle>
          <CardDescription>
            Schützen Sie Ihr Konto mit einer zusätzlichen Sicherheitsebene.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">2FA-Status</p>
              <p className="text-sm text-muted-foreground">
                {isEnabled ? "Ihr Konto ist durch 2FA geschützt" : "2FA ist nicht aktiviert"}
              </p>
            </div>
            <Badge variant={isEnabled ? "default" : "secondary"} className={isEnabled ? "bg-emerald-600" : ""}>
              {isEnabled ? "Aktiv" : "Inaktiv"}
            </Badge>
          </div>

          {isEnabled ? (
            <>
              {/* Backup-Codes regenerieren */}
              <div className="space-y-3">
                <Label>Neue Backup-Codes generieren</Label>
                <p className="text-sm text-muted-foreground">
                  Geben Sie Ihren Authenticator-Code ein, um neue Backup-Codes zu erhalten. Die alten Codes werden ungültig.
                </p>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={regenerateCode}
                    onChange={(value) => {
                      setRegenerateCode(value);
                      if (value.length === 6) {
                        regenerateMutation.mutate({ token: value });
                      }
                    }}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={regenerateCode.length !== 6 || regenerateMutation.isPending}
                  onClick={() => regenerateMutation.mutate({ token: regenerateCode })}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {regenerateMutation.isPending ? "Wird generiert..." : "Neue Backup-Codes"}
                </Button>
              </div>

              <Separator />

              {/* 2FA deaktivieren */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50">
                    <ShieldOff className="mr-2 h-4 w-4" />
                    2FA deaktivieren
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>2FA wirklich deaktivieren?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Ohne Zwei-Faktor-Authentifizierung ist Ihr Konto nur durch Ihr Passwort geschützt.
                      Dies wird nicht empfohlen, besonders für Administrator-Konten.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => setStep("disable")}
                    >
                      Fortfahren
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Die Zwei-Faktor-Authentifizierung fügt eine zusätzliche Sicherheitsebene hinzu.
                Nach der Aktivierung benötigen Sie neben Ihrem Passwort auch einen zeitbasierten Code
                aus einer Authenticator-App.
              </p>
              <Button
                className="w-full"
                onClick={() => setupMutation.mutate()}
                disabled={setupMutation.isPending}
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                {setupMutation.isPending ? "Wird eingerichtet..." : "2FA jetzt aktivieren"}
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

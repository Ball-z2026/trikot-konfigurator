import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import {
  CreditCard,
  Building2,
  HandCoins,
  CheckCircle2,
  Clock,
  Copy,
  Mail,
  Loader2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Player {
  id: number;
  name: string;
  number?: string | null;
  position?: string | null;
}

interface PaymentSectionProps {
  teamId: number;
  orgId: number;
  players: Player[];
}

export function PaymentSection({ teamId, orgId, players }: PaymentSectionProps) {
  const utils = trpc.useUtils();
  const [showSponsorDialog, setShowSponsorDialog] = useState(false);
  const [confirmUrl, setConfirmUrl] = useState<string | null>(null);

  // Sponsor form state
  const [sponsorContactName, setSponsorContactName] = useState("");
  const [sponsorCompanyName, setSponsorCompanyName] = useState("");
  const [sponsorEmail, setSponsorEmail] = useState("");
  const [sponsorPhone, setSponsorPhone] = useState("");
  const [sponsorStreet, setSponsorStreet] = useState("");
  const [sponsorZip, setSponsorZip] = useState("");
  const [sponsorCity, setSponsorCity] = useState("");
  const [sponsorNotes, setSponsorNotes] = useState("");

  // Query payment data
  const { data: paymentData, isLoading } = trpc.payment.getByTeam.useQuery(
    { teamId, orgId },
    { enabled: teamId > 0 && orgId > 0 }
  );

  // Mutations
  const setClubPayment = trpc.payment.setClubPayment.useMutation({
    onSuccess: (data) => {
      utils.payment.getByTeam.invalidate({ teamId, orgId });
      setConfirmUrl(data.confirmUrl);
      toast.success("Zahlungsmodell 'Verein zahlt' gesetzt. Bestätigungslink wurde generiert.");
    },
    onError: (e) => toast.error(e.message),
  });

  const setSponsorPayment = trpc.payment.setSponsorPayment.useMutation({
    onSuccess: (data) => {
      utils.payment.getByTeam.invalidate({ teamId, orgId });
      setShowSponsorDialog(false);
      setConfirmUrl(data.confirmUrl);
      toast.success("Sponsor eingetragen. Bestätigungslink wurde generiert.");
      // Reset form
      setSponsorContactName("");
      setSponsorCompanyName("");
      setSponsorEmail("");
      setSponsorPhone("");
      setSponsorStreet("");
      setSponsorZip("");
      setSponsorCity("");
      setSponsorNotes("");
    },
    onError: (e) => toast.error(e.message),
  });

  const setSelfPayment = trpc.payment.setSelfPayment.useMutation({
    onSuccess: () => {
      utils.payment.getByTeam.invalidate({ teamId, orgId });
      toast.success("Zahlungsmodell 'Selbstzahler' aktiviert.");
    },
    onError: (e) => toast.error(e.message),
  });

  const setPlayerPaid = trpc.payment.setPlayerPaid.useMutation({
    onSuccess: () => {
      utils.payment.getByTeam.invalidate({ teamId, orgId });
    },
    onError: (e) => toast.error(e.message),
  });

  const payment = paymentData?.payment;
  const sponsor = paymentData?.sponsor;
  const playerPayments = paymentData?.playerPayments || [];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Link kopiert!");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Separator />
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Abrechnung
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Wählen Sie das Zahlungsmodell für diese Mannschaft
        </p>
      </div>

      {/* Payment Type Selection */}
      {!payment ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Verein zahlt */}
          <Card
            className="cursor-pointer hover:border-blue-500 transition-colors"
            onClick={() =>
              setClubPayment.mutate({
                teamId,
                orgId,
                origin: window.location.origin,
              })
            }
          >
            <CardHeader className="pb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-2">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <CardTitle className="text-base">Verein zahlt</CardTitle>
              <CardDescription className="text-xs">
                Der Verein übernimmt die Kosten. Bestätigung durch den Spartenleiter erforderlich.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Sponsor zahlt */}
          <Card
            className="cursor-pointer hover:border-green-500 transition-colors"
            onClick={() => setShowSponsorDialog(true)}
          >
            <CardHeader className="pb-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-2">
                <HandCoins className="w-5 h-5 text-green-600" />
              </div>
              <CardTitle className="text-base">Sponsor zahlt</CardTitle>
              <CardDescription className="text-xs">
                Ein Sponsor übernimmt die Kosten. Bestätigung durch den Sponsor per E-Mail.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Selbstzahler */}
          <Card
            className="cursor-pointer hover:border-orange-500 transition-colors"
            onClick={() => setSelfPayment.mutate({ teamId, orgId })}
          >
            <CardHeader className="pb-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center mb-2">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <CardTitle className="text-base">Selbstzahler</CardTitle>
              <CardDescription className="text-xs">
                Jeder Spieler/Trainer zahlt selbst. Bezahlt-Status pro Person markierbar.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      ) : (
        /* Active Payment Model Display */
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    payment.paymentType === "club"
                      ? "bg-blue-500/10"
                      : payment.paymentType === "sponsor"
                      ? "bg-green-500/10"
                      : "bg-orange-500/10"
                  }`}
                >
                  {payment.paymentType === "club" && (
                    <Building2 className="w-5 h-5 text-blue-600" />
                  )}
                  {payment.paymentType === "sponsor" && (
                    <HandCoins className="w-5 h-5 text-green-600" />
                  )}
                  {payment.paymentType === "self" && (
                    <Users className="w-5 h-5 text-orange-600" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-base">
                    {payment.paymentType === "club" && "Verein zahlt"}
                    {payment.paymentType === "sponsor" && "Sponsor zahlt"}
                    {payment.paymentType === "self" && "Selbstzahler"}
                  </CardTitle>
                  <CardDescription>
                    {payment.paymentType === "club" &&
                      "Kostenübernahme durch den Verein"}
                    {payment.paymentType === "sponsor" &&
                      `Sponsor: ${sponsor?.companyName || "–"}`}
                    {payment.paymentType === "self" &&
                      "Jeder zahlt selbst"}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={payment.status === "confirmed" ? "default" : "secondary"}
                  className={
                    payment.status === "confirmed"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }
                >
                  {payment.status === "confirmed" ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Bestätigt
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3 mr-1" />
                      Ausstehend
                    </>
                  )}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (
                      confirm(
                        "Zahlungsmodell zurücksetzen? Dies kann nicht rückgängig gemacht werden."
                      )
                    ) {
                      // Reset by setting a new payment type (we'll re-show the selection)
                      utils.payment.getByTeam.invalidate({ teamId, orgId });
                    }
                  }}
                >
                  Ändern
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Confirmation Link (if pending) */}
          {payment.status === "pending" && payment.confirmationToken && (
            <CardContent>
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium">Bestätigungslink:</p>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={`${window.location.origin}/payment/confirm/${payment.confirmationToken}`}
                    className="text-xs font-mono"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() =>
                      copyToClipboard(
                        `${window.location.origin}/payment/confirm/${payment.confirmationToken}`
                      )
                    }
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {payment.paymentType === "club"
                    ? "Senden Sie diesen Link an den Spartenleiter zur Bestätigung."
                    : "Senden Sie diesen Link an den Sponsor zur Bestätigung."}
                </p>
              </div>
            </CardContent>
          )}

          {/* Sponsor Details */}
          {payment.paymentType === "sponsor" && sponsor && (
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Firma:</span>{" "}
                  <span className="font-medium">{sponsor.companyName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Ansprechpartner:</span>{" "}
                  <span className="font-medium">{sponsor.contactName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">E-Mail:</span>{" "}
                  <span className="font-medium">{sponsor.email}</span>
                </div>
                {sponsor.phone && (
                  <div>
                    <span className="text-muted-foreground">Telefon:</span>{" "}
                    <span className="font-medium">{sponsor.phone}</span>
                  </div>
                )}
                {(sponsor.street || sponsor.zip || sponsor.city) && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Adresse:</span>{" "}
                    <span className="font-medium">
                      {[sponsor.street, `${sponsor.zip || ""} ${sponsor.city || ""}`.trim()]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                )}
                {sponsor.notes && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Notizen:</span>{" "}
                    <span className="font-medium">{sponsor.notes}</span>
                  </div>
                )}
              </div>
            </CardContent>
          )}

          {/* Self-Payment: Player Payment Status */}
          {payment.paymentType === "self" && (
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Bezahlt-Status pro Spieler/Trainer:</p>
                  <Badge variant="secondary">
                    {playerPayments.filter((pp) => pp.paid).length} / {players.length} bezahlt
                  </Badge>
                </div>
                <div className="space-y-2">
                  {players.map((player) => {
                    const pp = playerPayments.find((p) => p.playerId === player.id);
                    const isPaid = pp?.paid || false;
                    return (
                      <div
                        key={player.id}
                        className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-sm">{player.name}</span>
                          {player.number && (
                            <Badge variant="outline" className="text-xs">
                              #{player.number}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs ${isPaid ? "text-green-600" : "text-muted-foreground"}`}>
                            {isPaid ? "Bezahlt" : "Offen"}
                          </span>
                          <Switch
                            checked={isPaid}
                            onCheckedChange={(checked) =>
                              setPlayerPaid.mutate({
                                playerId: player.id,
                                teamId,
                                orgId,
                                paid: checked,
                              })
                            }
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Confirmation URL Dialog (shown after setting club/sponsor payment) */}
      {confirmUrl && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-green-600" />
                <p className="font-medium text-green-800">Bestätigungslink generiert</p>
              </div>
              <div className="flex items-center gap-2">
                <Input readOnly value={confirmUrl} className="text-xs font-mono" />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => copyToClipboard(confirmUrl)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Kopieren Sie den Link und senden Sie ihn per E-Mail oder WhatsApp an die
                zuständige Person. Nach Klick auf den Link wird die Zahlung bestätigt.
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmUrl(null)}
              >
                Schließen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sponsor Dialog */}
      <Dialog open={showSponsorDialog} onOpenChange={setShowSponsorDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Sponsor-Daten eingeben</DialogTitle>
            <DialogDescription>
              Geben Sie die Kontaktdaten des Sponsors ein. Ein Bestätigungslink wird generiert.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Firmenname *</Label>
                <Input
                  value={sponsorCompanyName}
                  onChange={(e) => setSponsorCompanyName(e.target.value)}
                  placeholder="Muster GmbH"
                />
              </div>
              <div className="space-y-2">
                <Label>Ansprechpartner *</Label>
                <Input
                  value={sponsorContactName}
                  onChange={(e) => setSponsorContactName(e.target.value)}
                  placeholder="Max Mustermann"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>E-Mail *</Label>
                <Input
                  type="email"
                  value={sponsorEmail}
                  onChange={(e) => setSponsorEmail(e.target.value)}
                  placeholder="sponsor@firma.de"
                />
              </div>
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input
                  value={sponsorPhone}
                  onChange={(e) => setSponsorPhone(e.target.value)}
                  placeholder="+49 123 456789"
                />
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Straße & Hausnummer</Label>
              <Input
                value={sponsorStreet}
                onChange={(e) => setSponsorStreet(e.target.value)}
                placeholder="Musterstraße 1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>PLZ</Label>
                <Input
                  value={sponsorZip}
                  onChange={(e) => setSponsorZip(e.target.value)}
                  placeholder="12345"
                />
              </div>
              <div className="space-y-2">
                <Label>Stadt</Label>
                <Input
                  value={sponsorCity}
                  onChange={(e) => setSponsorCity(e.target.value)}
                  placeholder="Musterstadt"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notizen</Label>
              <Input
                value={sponsorNotes}
                onChange={(e) => setSponsorNotes(e.target.value)}
                placeholder="Zusätzliche Informationen..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSponsorDialog(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={() =>
                setSponsorPayment.mutate({
                  teamId,
                  orgId,
                  origin: window.location.origin,
                  sponsor: {
                    contactName: sponsorContactName,
                    companyName: sponsorCompanyName,
                    email: sponsorEmail,
                    phone: sponsorPhone || undefined,
                    street: sponsorStreet || undefined,
                    zip: sponsorZip || undefined,
                    city: sponsorCity || undefined,
                    notes: sponsorNotes || undefined,
                  },
                })
              }
              disabled={
                !sponsorCompanyName || !sponsorContactName || !sponsorEmail || setSponsorPayment.isPending
              }
            >
              {setSponsorPayment.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <HandCoins className="w-4 h-4 mr-2" />
              )}
              Sponsor eintragen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

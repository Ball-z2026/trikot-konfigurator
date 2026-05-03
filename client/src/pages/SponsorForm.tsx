import { useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Upload, Building2, User, MapPin, FileText, CheckCircle } from "lucide-react";

export default function SponsorForm() {
  const [, params] = useRoute("/sponsor-form/:token");
  const token = params?.token || "";

  const { data: invitation, isLoading, error } = trpc.sponsorInvitation.getByToken.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  const completeMutation = trpc.sponsorInvitation.complete.useMutation({
    onSuccess: () => {
      setCompleted(true);
      toast.success("Vielen Dank! Ihre Daten wurden erfolgreich übermittelt.");
    },
    onError: (err) => {
      toast.error(err.message || "Fehler beim Speichern");
    },
  });

  const [completed, setCompleted] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    contactFirstName: "",
    contactLastName: "",
    contactEmail: "",
    contactPhone: "",
    street: "",
    zip: "",
    city: "",
    country: "Deutschland",
    vatId: "",
  });

  function updateForm(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    // Validierung
    const missing: string[] = [];
    if (!form.name) missing.push("Firmenname");
    if (!logoFile) missing.push("Logo");
    if (!form.contactFirstName) missing.push("Vorname");
    if (!form.contactLastName) missing.push("Nachname");
    if (!form.contactEmail) missing.push("E-Mail");
    if (!form.street) missing.push("Straße");
    if (!form.zip) missing.push("PLZ");
    if (!form.city) missing.push("Ort");
    if (missing.length > 0) {
      toast.error(`Bitte füllen Sie alle Pflichtfelder aus: ${missing.join(", ")}`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      completeMutation.mutate({
        token,
        name: form.name,
        logoBase64: base64,
        mimeType: logoFile!.type,
        contactFirstName: form.contactFirstName,
        contactLastName: form.contactLastName,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone || undefined,
        street: form.street,
        zip: form.zip,
        city: form.city,
        country: form.country,
        vatId: form.vatId || undefined,
      });
    };
    reader.readAsDataURL(logoFile!);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold mb-2">Einladung ungültig</h2>
            <p className="text-muted-foreground">{error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Vielen Dank!</h2>
            <p className="text-muted-foreground">
              Ihre Daten wurden erfolgreich an <strong>{invitation?.orgName}</strong> übermittelt.
              Sie können dieses Fenster jetzt schließen.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Sponsor-Daten erfassen</CardTitle>
            <CardDescription>
              <strong>{invitation?.orgName}</strong> hat Sie eingeladen, Ihre Sponsoring-Daten zu hinterlegen.
              Bitte füllen Sie alle Pflichtfelder (*) aus.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Firmenname */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Firmendaten
              </h3>
              <div>
                <Label>Firmenname <span className="text-red-500">*</span></Label>
                <Input value={form.name} onChange={(e) => updateForm("name", e.target.value)} placeholder="Muster GmbH" />
              </div>
            </div>

            <Separator />

            {/* Logo-Upload */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <Upload className="w-4 h-4" /> Firmenlogo <span className="text-red-500">*</span>
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Bitte laden Sie Ihr Firmenlogo hoch (PNG, JPG, SVG oder PDF). Für beste Druckqualität empfehlen wir mindestens 300 DPI.
              </p>
              <div className="flex items-center gap-4">
                <label className="flex-1 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors">
                  <input type="file" accept="image/*,.pdf,.svg" onChange={handleLogoChange} className="hidden" />
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo-Vorschau" className="max-h-24 mx-auto object-contain" />
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Klicken zum Hochladen</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <Separator />

            {/* Kontaktperson */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <User className="w-4 h-4" /> Kontaktperson
              </h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Vorname <span className="text-red-500">*</span></Label>
                    <Input value={form.contactFirstName} onChange={(e) => updateForm("contactFirstName", e.target.value)} placeholder="Max" />
                  </div>
                  <div>
                    <Label>Nachname <span className="text-red-500">*</span></Label>
                    <Input value={form.contactLastName} onChange={(e) => updateForm("contactLastName", e.target.value)} placeholder="Mustermann" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>E-Mail <span className="text-red-500">*</span></Label>
                    <Input type="email" value={form.contactEmail} onChange={(e) => updateForm("contactEmail", e.target.value)} placeholder="max@firma.de" />
                  </div>
                  <div>
                    <Label>Telefon</Label>
                    <Input value={form.contactPhone} onChange={(e) => updateForm("contactPhone", e.target.value)} placeholder="+49 123 456789" />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Firmenadresse */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Firmenadresse
              </h3>
              <div className="space-y-3">
                <div>
                  <Label>Straße und Hausnummer <span className="text-red-500">*</span></Label>
                  <Input value={form.street} onChange={(e) => updateForm("street", e.target.value)} placeholder="Musterstraße 1" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>PLZ <span className="text-red-500">*</span></Label>
                    <Input value={form.zip} onChange={(e) => updateForm("zip", e.target.value)} placeholder="12345" />
                  </div>
                  <div className="col-span-2">
                    <Label>Ort <span className="text-red-500">*</span></Label>
                    <Input value={form.city} onChange={(e) => updateForm("city", e.target.value)} placeholder="Musterstadt" />
                  </div>
                </div>
                <div>
                  <Label>Land</Label>
                  <Input value={form.country} onChange={(e) => updateForm("country", e.target.value)} />
                </div>
              </div>
            </div>

            <Separator />

            {/* Rechnungsdaten */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Rechnungsdaten
              </h3>
              <div>
                <Label>USt-IdNr.</Label>
                <Input value={form.vatId} onChange={(e) => updateForm("vatId", e.target.value)} placeholder="DE123456789" />
              </div>
            </div>

            <Separator />

            <Button
              onClick={handleSubmit}
              disabled={completeMutation.isPending}
              className="w-full"
              size="lg"
            >
              {completeMutation.isPending ? "Wird gespeichert..." : "Daten absenden"}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Mit dem Absenden bestätigen Sie, dass die angegebenen Daten korrekt sind.
              Ihre Daten werden ausschließlich für die Sponsoring-Verwaltung von {invitation?.orgName} verwendet.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

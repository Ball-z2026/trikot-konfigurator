import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { storageUrl } from "@/lib/utils";
import {
  Building2, Upload, Palette, Shirt, ChevronRight, ChevronLeft,
  Loader2, CheckCircle2, Image as ImageIcon
} from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";

interface OrgOnboardingProps {
  orgId: number;
  orgName: string;
  onComplete: () => void;
}

const STEPS = [
  { id: 1, title: "Vereinsfarben", icon: Palette, description: "Wählen Sie die Primär- und Sekundärfarbe Ihres Vereins." },
  { id: 2, title: "Vereinslogo", icon: ImageIcon, description: "Laden Sie das offizielle Vereinslogo hoch." },
  { id: 3, title: "Trikotname", icon: Shirt, description: "Wie soll der Vereinsname auf dem Trikot erscheinen?" },
];

export default function OrgOnboarding({ orgId, orgName, onComplete }: OrgOnboardingProps) {
  const utils = trpc.useUtils();
  const [step, setStep] = useState(1);

  // Step 1: Vereinsfarben
  const [primaryColor, setPrimaryColor] = useState("#003399");
  const [secondaryColor, setSecondaryColor] = useState("#ffffff");
  // CMYK-Werte (C, M, Y, K jeweils 0-100)
  const [primaryCmyk, setPrimaryCmyk] = useState({ c: 100, m: 67, y: 0, k: 40 });
  const [secondaryCmyk, setSecondaryCmyk] = useState({ c: 0, m: 0, y: 0, k: 0 });

  // Step 2: Logo-Upload
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUploaded, setLogoUploaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 3: Trikotname
  const [jerseyName, setJerseyName] = useState(orgName);

  const [saving, setSaving] = useState(false);

  const uploadLogo = trpc.orgLogo.upload.useMutation({
    onSuccess: () => {
      utils.orgLogo.list.invalidate({ orgId });
      setLogoUploaded(true);
      setLogoUploading(false);
      toast.success("Logo hochgeladen");
    },
    onError: (e) => {
      toast.error(e.message);
      setLogoUploading(false);
    },
  });

  const updateOrg = trpc.org.update.useMutation({
    onSuccess: () => {
      utils.org.getById.invalidate({ id: orgId });
      utils.org.list.invalidate();
      setSaving(false);
      toast.success("Vereinsdaten gespeichert!");
      onComplete();
    },
    onError: (e) => {
      toast.error(e.message);
      setSaving(false);
    },
  });

  const handleLogoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleLogoUpload = useCallback(() => {
    if (!logoFile) return;
    setLogoUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = (ev.target?.result as string).split(",")[1];
      uploadLogo.mutate({
        orgId,
        name: "Vereinslogo",
        imageBase64: base64,
        mimeType: logoFile.type || "image/png",
        isDefault: true,
      });
    };
    reader.readAsDataURL(logoFile);
  }, [logoFile, orgId, uploadLogo]);

  // HEX zu CMYK Konvertierung
  const hexToCmyk = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const k = 1 - Math.max(r, g, b);
    if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
    const c = Math.round(((1 - r - k) / (1 - k)) * 100);
    const m = Math.round(((1 - g - k) / (1 - k)) * 100);
    const y = Math.round(((1 - b - k) / (1 - k)) * 100);
    return { c, m, y, k: Math.round(k * 100) };
  };

  // Automatisch CMYK berechnen wenn HEX sich ändert
  const handlePrimaryColorChange = (hex: string) => {
    setPrimaryColor(hex);
    setPrimaryCmyk(hexToCmyk(hex));
  };
  const handleSecondaryColorChange = (hex: string) => {
    setSecondaryColor(hex);
    setSecondaryCmyk(hexToCmyk(hex));
  };

  const handleFinish = () => {
    setSaving(true);
    updateOrg.mutate({
      id: orgId,
      primaryColor,
      secondaryColor,
      primaryColorCmyk: JSON.stringify(primaryCmyk),
      secondaryColorCmyk: JSON.stringify(secondaryCmyk),
      jerseyName: jerseyName.trim() || orgName,
      onboardingComplete: true,
    });
  };

  const canProceed = () => {
    switch (step) {
      case 1: return primaryColor && secondaryColor;
      case 2: return logoUploaded;
      case 3: return jerseyName.trim().length > 0;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">{orgName} einrichten</h1>
          <p className="text-muted-foreground mt-1">
            Bitte füllen Sie die folgenden Pflichtdaten aus, bevor Sie fortfahren können.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step > s.id
                    ? "bg-green-500 text-white"
                    : step === s.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s.id ? <CheckCircle2 className="w-5 h-5" /> : s.id}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-12 h-0.5 mx-1 ${step > s.id ? "bg-green-500" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {(() => { const Icon = STEPS[step - 1].icon; return <Icon className="w-5 h-5" />; })()}
              {STEPS[step - 1].title}
            </CardTitle>
            <CardDescription>{STEPS[step - 1].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Vereinsfarben */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Primärfarbe</Label>
                    <p className="text-sm text-muted-foreground">Die Hauptfarbe Ihres Vereins (z.B. Trikotfarbe).</p>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => handlePrimaryColorChange(e.target.value)}
                        className="w-16 h-16 rounded-lg border-2 border-border cursor-pointer"
                      />
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1">HEX</Label>
                        <Input
                          value={primaryColor}
                          onChange={(e) => handlePrimaryColorChange(e.target.value)}
                          className="font-mono w-28"
                          maxLength={7}
                        />
                      </div>
                    </div>
                    <div className="mt-2">
                      <Label className="text-xs text-muted-foreground">CMYK (für Druck)</Label>
                      <div className="grid grid-cols-4 gap-2 mt-1">
                        <div>
                          <Label className="text-[10px]">C</Label>
                          <Input type="number" min={0} max={100} value={primaryCmyk.c} onChange={(e) => setPrimaryCmyk(p => ({...p, c: +e.target.value}))} className="h-8 text-xs" />
                        </div>
                        <div>
                          <Label className="text-[10px]">M</Label>
                          <Input type="number" min={0} max={100} value={primaryCmyk.m} onChange={(e) => setPrimaryCmyk(p => ({...p, m: +e.target.value}))} className="h-8 text-xs" />
                        </div>
                        <div>
                          <Label className="text-[10px]">Y</Label>
                          <Input type="number" min={0} max={100} value={primaryCmyk.y} onChange={(e) => setPrimaryCmyk(p => ({...p, y: +e.target.value}))} className="h-8 text-xs" />
                        </div>
                        <div>
                          <Label className="text-[10px]">K</Label>
                          <Input type="number" min={0} max={100} value={primaryCmyk.k} onChange={(e) => setPrimaryCmyk(p => ({...p, k: +e.target.value}))} className="h-8 text-xs" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Sekundärfarbe</Label>
                    <p className="text-sm text-muted-foreground">Die Zweitfarbe (z.B. für Akzente, Hosen).</p>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => handleSecondaryColorChange(e.target.value)}
                        className="w-16 h-16 rounded-lg border-2 border-border cursor-pointer"
                      />
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1">HEX</Label>
                        <Input
                          value={secondaryColor}
                          onChange={(e) => handleSecondaryColorChange(e.target.value)}
                          className="font-mono w-28"
                          maxLength={7}
                        />
                      </div>
                    </div>
                    <div className="mt-2">
                      <Label className="text-xs text-muted-foreground">CMYK (für Druck)</Label>
                      <div className="grid grid-cols-4 gap-2 mt-1">
                        <div>
                          <Label className="text-[10px]">C</Label>
                          <Input type="number" min={0} max={100} value={secondaryCmyk.c} onChange={(e) => setSecondaryCmyk(p => ({...p, c: +e.target.value}))} className="h-8 text-xs" />
                        </div>
                        <div>
                          <Label className="text-[10px]">M</Label>
                          <Input type="number" min={0} max={100} value={secondaryCmyk.m} onChange={(e) => setSecondaryCmyk(p => ({...p, m: +e.target.value}))} className="h-8 text-xs" />
                        </div>
                        <div>
                          <Label className="text-[10px]">Y</Label>
                          <Input type="number" min={0} max={100} value={secondaryCmyk.y} onChange={(e) => setSecondaryCmyk(p => ({...p, y: +e.target.value}))} className="h-8 text-xs" />
                        </div>
                        <div>
                          <Label className="text-[10px]">K</Label>
                          <Input type="number" min={0} max={100} value={secondaryCmyk.k} onChange={(e) => setSecondaryCmyk(p => ({...p, k: +e.target.value}))} className="h-8 text-xs" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vorschau */}
                <div className="mt-6 p-6 rounded-xl border" style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor} 60%, ${secondaryColor} 100%)` }}>
                  <p className="text-white font-bold text-lg drop-shadow-md">{orgName}</p>
                  <p className="text-white/80 text-sm drop-shadow-sm">Vereinsfarben-Vorschau</p>
                </div>
              </div>
            )}

            {/* Step 2: Logo-Upload */}
            {step === 2 && (
              <div className="space-y-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                  onChange={handleLogoSelect}
                />

                {logoPreview ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-40 h-40 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-white p-4">
                      <img src={logoPreview} alt="Logo-Vorschau" className="max-w-full max-h-full object-contain" />
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                        Anderes Bild wählen
                      </Button>
                      {!logoUploaded && (
                        <Button onClick={handleLogoUpload} disabled={logoUploading}>
                          {logoUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                          Hochladen
                        </Button>
                      )}
                    </div>
                    {logoUploaded && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-medium">Logo erfolgreich hochgeladen</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium">Vereinslogo hochladen</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      PNG, JPG, SVG oder WebP. Idealerweise mit transparentem Hintergrund.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Trikotname */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Vereinsname auf dem Trikot</Label>
                  <p className="text-sm text-muted-foreground">
                    Dieser Name wird auf der Rückseite des Trikots platziert. Er kann vom offiziellen Vereinsnamen abweichen.
                  </p>
                  <Input
                    value={jerseyName}
                    onChange={(e) => setJerseyName(e.target.value)}
                    placeholder="z.B. TSV Musterstadt"
                    className="text-lg"
                  />
                </div>

                {/* Vorschau */}
                <div className="mt-6 p-8 rounded-xl border text-center" style={{ backgroundColor: primaryColor }}>
                  <p className="text-white/60 text-xs uppercase tracking-widest mb-2">Rückseite Trikot</p>
                  <p className="text-white font-bold text-2xl drop-shadow-md">{jerseyName || orgName}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>

          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
            >
              Weiter
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              disabled={!canProceed() || saving}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Einrichtung abschließen
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

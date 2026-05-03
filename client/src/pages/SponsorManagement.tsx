import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Plus, Trash2, Upload, Building2, User, Mail, Phone, MapPin, FileText, ChevronDown, ChevronUp, Package, ShoppingBag, ClipboardCheck, Copy, Send } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { PdfPreview } from "@/components/PdfPreview";
import { storageUrl } from "@/lib/utils";
import { SponsorLogoImage } from "@/components/SponsorLogoImage";

type SponsorType = "hauptsponsor" | "spartensponsor" | "mannschaftssponsor";
type Obligation = "alle_produkte" | "nur_trikot" | "nicht_verpflichtend";

const SPONSOR_TYPE_LABELS: Record<SponsorType, string> = {
  hauptsponsor: "Hauptsponsor",
  spartensponsor: "Spartensponsor",
  mannschaftssponsor: "Mannschaftssponsor",
};

const OBLIGATION_LABELS: Record<Obligation, string> = {
  alle_produkte: "Verpflichtend für alle Produkte",
  nur_trikot: "Verpflichtend nur für Trikots",
  nicht_verpflichtend: "Nicht verpflichtend",
};

const SPONSOR_TYPE_COLORS: Record<SponsorType, string> = {
  hauptsponsor: "bg-blue-100 text-blue-800",
  spartensponsor: "bg-purple-100 text-purple-800",
  mannschaftssponsor: "bg-green-100 text-green-800",
};

interface SponsorForm {
  name: string;
  sponsorType: SponsorType;
  obligation: Obligation;
  departmentId?: number;
  teamId?: number;
  // Kontaktdaten
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  contactPhone: string;
  // Firmenadresse
  street: string;
  zip: string;
  city: string;
  country: string;
  // Rechnungsdaten
  vatId: string;
  billingDifferent: boolean;
  billingStreet: string;
  billingZip: string;
  billingCity: string;
  billingCountry: string;
  // Sponsoring-Summe (nur Owner)
  sponsoringAmount: string;
}

const EMPTY_FORM: SponsorForm = {
  name: "",
  sponsorType: "hauptsponsor",
  obligation: "nicht_verpflichtend",
  contactFirstName: "",
  contactLastName: "",
  contactEmail: "",
  contactPhone: "",
  street: "",
  zip: "",
  city: "",
  country: "Deutschland",
  vatId: "",
  billingDifferent: false,
  billingStreet: "",
  billingZip: "",
  billingCity: "",
  billingCountry: "Deutschland",
  sponsoringAmount: "",
};

/** Subkomponente: Produkt-Zuweisungen pro Sponsor */
function SponsorProductAssignment({ sponsorId, orgId, publishedProducts, syncProductsMutation }: {
  sponsorId: number;
  orgId: number;
  publishedProducts: any[];
  syncProductsMutation: any;
}) {
  const { data: assignedIds, refetch } = trpc.sponsorTemplate.assignedProducts.useQuery({ sponsorId });
  const [localIds, setLocalIds] = useState<number[]>([]);
  const [dirty, setDirty] = useState(false);

  // Synchronisiere lokale IDs mit Server-Daten
  React.useEffect(() => {
    if (assignedIds) {
      setLocalIds(assignedIds);
      setDirty(false);
    }
  }, [assignedIds]);

  const toggleProduct = (productId: number) => {
    setLocalIds(prev => {
      const next = prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId];
      setDirty(true);
      return next;
    });
  };

  const handleSave = async () => {
    await syncProductsMutation.mutateAsync({ sponsorId, orgId, productIds: localIds });
    refetch();
    setDirty(false);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Package className="w-3 h-3 text-muted-foreground" />
        <span className="font-medium text-xs">Freizugebende Produkte</span>
        {assignedIds && assignedIds.length > 0 && (
          <Badge variant="secondary" className="text-[9px] ml-auto">{assignedIds.length} zugewiesen</Badge>
        )}
      </div>
      {publishedProducts.length === 0 ? (
        <p className="text-xs text-muted-foreground italic ml-5">Keine veröffentlichten Produkte vorhanden</p>
      ) : (
        <div className="space-y-1.5 ml-5">
          {publishedProducts.map((product: any) => (
            <label key={product.id} className="flex items-center gap-2 cursor-pointer text-xs">
              <Checkbox
                checked={localIds.includes(product.id)}
                onCheckedChange={() => toggleProduct(product.id)}
              />
              <span>{product.name}</span>
              {product.category && <Badge variant="outline" className="text-[9px] px-1 py-0">{product.category}</Badge>}
            </label>
          ))}
          {dirty && (
            <Button size="sm" className="mt-2 h-7 text-xs" onClick={handleSave} disabled={syncProductsMutation.isPending}>
              {syncProductsMutation.isPending ? "Speichern..." : "Zuweisungen speichern"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/** Subkomponente: Offene Freigaben pro Sponsor */
function SponsorPendingApprovals({ sponsorId }: { sponsorId: number }) {
  const { data: pending } = trpc.mockupApproval.pendingBySponsor.useQuery({ sponsorId });

  if (!pending || pending.length === 0) return null;

  return (
    <div className="mt-3">
      <Separator className="mb-3" />
      <div className="flex items-center gap-2 mb-2">
        <ClipboardCheck className="w-3 h-3 text-amber-600" />
        <span className="font-medium text-xs">Offene Freigaben</span>
        <Badge variant="outline" className="text-[9px] ml-auto border-amber-300 text-amber-700">{pending.length} offen</Badge>
      </div>
      <div className="space-y-1 ml-5">
        {pending.map((approval: any) => (
          <div key={approval.id} className="flex items-center gap-2 text-xs">
            <Badge className="bg-amber-100 text-amber-800 text-[9px]">Ausstehend</Badge>
            <span>Mockup #{approval.mockupId}</span>
            <span className="text-muted-foreground">({new Date(approval.createdAt).toLocaleDateString("de-DE")})</span>
          </div>
        ))}
      </div>
    </div>
  );
}


export default function SponsorManagement() {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [form, setForm] = useState<SponsorForm>({ ...EMPTY_FORM });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Lade die erste Organisation des Users
  const { data: orgs } = trpc.org.list.useQuery();
  const org = orgs?.[0];
  const userRole = org?.userRole as string | undefined;
  const isOwner = userRole === "owner";
  const isDeptLead = userRole === "department_lead";
  const isTrainer = userRole === "trainer";
  // Trainer darf nur Mannschaftssponsoren erstellen
  const canCreateSponsor = isOwner || isDeptLead || isTrainer;

  // Trainer: sponsorType beim ersten Render auf mannschaftssponsor setzen
  useEffect(() => {
    if (isTrainer && form.sponsorType !== "mannschaftssponsor") {
      setForm((prev) => ({ ...prev, sponsorType: "mannschaftssponsor" }));
    }
  }, [isTrainer]);

  // Lade Sponsoren der Organisation
  const { data: sponsors, refetch } = trpc.sponsorTemplate.list.useQuery(
    { orgId: org?.id ?? 0 },
    { enabled: !!org }
  );

  // Lade alle veröffentlichten Produkte für Produkt-Zuweisung
  const { data: allProducts } = trpc.product.list.useQuery();
  const publishedProducts = allProducts?.filter((p: any) => p.published) ?? [];

  // Lade Abteilungen für Spartensponsor-Auswahl
  const { data: departments } = trpc.department.listByOrg.useQuery(
    { orgId: org?.id ?? 0 },
    { enabled: !!org }
  );

  // Lade Teams für Mannschaftssponsor-Auswahl (alle Teams des Trainers)
  const { data: teams } = trpc.team.mine.useQuery(
    undefined,
    { enabled: !!org && form.sponsorType === "mannschaftssponsor" }
  );

  // Trainer: teamId automatisch vorausfüllen wenn nur ein Team vorhanden
  useEffect(() => {
    if (isTrainer && teams && teams.length === 1 && !form.teamId) {
      setForm((prev) => ({ ...prev, teamId: teams[0].id }));
    }
  }, [isTrainer, teams]);

  // Produkt-Zuweisungs-Mutation
  const syncProductsMutation = trpc.sponsorTemplate.syncProducts.useMutation({
    onSuccess: () => toast.success("Produkt-Zuweisungen gespeichert"),
    onError: (err) => toast.error(err.message),
  });

  const createMutation = trpc.sponsorTemplate.create.useMutation({
    onSuccess: () => {
      toast.success("Sponsor erfolgreich angelegt");
      refetch();
      resetForm();
      setDialogOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.sponsorTemplate.delete.useMutation({
    onSuccess: () => {
      toast.success("Sponsor gelöscht");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  function resetForm() {
    setForm({
      ...EMPTY_FORM,
      // Trainer: immer Mannschaftssponsor
      sponsorType: isTrainer ? "mannschaftssponsor" : EMPTY_FORM.sponsorType,
    });
    setLogoFile(null);
    setLogoPreview(null);
  }

  function updateForm(key: keyof SponsorForm, value: string | number | boolean | undefined) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Datei zu groß (max. 5 MB)");
      return;
    }
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    setLogoFile(file);
    if (isPdf) {
      setLogoPreview(null); // PDF hat keine Bildvorschau
    } else {
      const reader = new FileReader();
      reader.onload = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  async function handleCreate() {
    if (!org || !form.name || !logoFile) {
      toast.error("Bitte mindestens Name und Logo angeben");
      return;
    }
    // Pflichtfelder für Rechnungsstellung prüfen
    const missingFields: string[] = [];
    if (!form.contactFirstName) missingFields.push("Vorname Kontaktperson");
    if (!form.contactLastName) missingFields.push("Nachname Kontaktperson");
    if (!form.contactEmail) missingFields.push("E-Mail Kontaktperson");
    if (!form.street) missingFields.push("Straße & Hausnummer");
    if (!form.zip) missingFields.push("PLZ");
    if (!form.city) missingFields.push("Ort");
    if (missingFields.length > 0) {
      toast.error(`Bitte alle Pflichtfelder ausfüllen: ${missingFields.join(", ")}`);
      return;
    }

    // Überdrucken- und Transparenz-Prüfung
    try {
      const { checkUploadFile } = await import("@/hooks/useUploadChecks");
      const checkResult = await checkUploadFile(logoFile);
      for (const w of checkResult.warnings) {
        toast.warning(w.message, { duration: 10000 });
      }
    } catch { /* Bei Fehler fortfahren */ }

    // DPI-Prüfung (nur für Bilder, nicht PDFs) - Sponsor-Logos typisch 26x10cm
    const isPdf = logoFile.type === "application/pdf" || logoFile.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      try {
        const { checkImageDpi } = await import("@/hooks/useDpiCheck");
        const result = await checkImageDpi(logoFile, 26, 10);
        if (result.status === "warning") {
          toast.warning(result.message, { duration: 8000 });
        } else if (result.status === "ok") {
          toast.success(result.message);
        }
      } catch { /* Bei Fehler fortfahren */ }
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      createMutation.mutate({
        orgId: org.id,
        name: form.name,
        logoBase64: base64,
        mimeType: logoFile.type,
        sponsorType: form.sponsorType,
        obligation: form.obligation,
        departmentId: form.sponsorType === "spartensponsor" ? form.departmentId : undefined,
        teamId: form.sponsorType === "mannschaftssponsor" ? form.teamId : undefined,
        contactFirstName: form.contactFirstName || undefined,
        contactLastName: form.contactLastName || undefined,
        contactEmail: form.contactEmail || undefined,
        contactPhone: form.contactPhone || undefined,
        street: form.street || undefined,
        zip: form.zip || undefined,
        city: form.city || undefined,
        country: form.country || undefined,
        vatId: form.vatId || undefined,
        billingDifferent: form.billingDifferent,
        billingStreet: form.billingDifferent ? (form.billingStreet || undefined) : undefined,
        billingZip: form.billingDifferent ? (form.billingZip || undefined) : undefined,
        billingCity: form.billingDifferent ? (form.billingCity || undefined) : undefined,
        billingCountry: form.billingDifferent ? (form.billingCountry || undefined) : undefined,
        sponsoringAmount: form.sponsoringAmount ? parseFloat(form.sponsoringAmount) : undefined,
      });
    };
    reader.readAsDataURL(logoFile);
  }

  if (!org) {
    return (
      <div className="min-h-screen bg-[#f0f1f3] p-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
            </Button>
          </Link>
          <p className="text-muted-foreground">Bitte zuerst einen Verein anlegen.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f1f3] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Sponsoren-Verwaltung</h1>
          </div>

          <div className="flex gap-2">
            {canCreateSponsor && !isTrainer && (
              <Button variant="outline" onClick={() => setInviteDialogOpen(true)}>
                <Mail className="w-4 h-4 mr-2" /> Sponsor einladen
              </Button>
            )}
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              {canCreateSponsor && (
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" /> Neuer Sponsor
                  </Button>
                </DialogTrigger>
              )}
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Neuen Sponsor anlegen</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 mt-4">

                {/* ─── Grunddaten ─── */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4" /> Grunddaten
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Label>Firmenname / Sponsor-Name *</Label>
                      <Input
                        value={form.name}
                        onChange={(e) => updateForm("name", e.target.value)}
                        placeholder="z.B. Stadtwerke Musterstadt"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Sponsor-Typ</Label>
                        {isTrainer ? (
                          <Input value="Mannschaftssponsor" disabled />
                        ) : (
                          <Select value={form.sponsorType} onValueChange={(v) => updateForm("sponsorType", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {isOwner && <SelectItem value="hauptsponsor">Hauptsponsor</SelectItem>}
                              {(isOwner || isDeptLead) && <SelectItem value="spartensponsor">Spartensponsor</SelectItem>}
                              <SelectItem value="mannschaftssponsor">Mannschaftssponsor</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      {(form.sponsorType === "hauptsponsor" || form.sponsorType === "spartensponsor") && (
                        <div>
                          <Label>Verpflichtung</Label>
                          <Select value={form.obligation} onValueChange={(v) => updateForm("obligation", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="alle_produkte">Alle Produkte</SelectItem>
                              <SelectItem value="nur_trikot">Nur Trikots</SelectItem>
                              <SelectItem value="nicht_verpflichtend">Nicht verpflichtend</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {/* Abteilung bei Spartensponsor */}
                    {form.sponsorType === "spartensponsor" && departments && departments.length > 0 && (
                      <div>
                        <Label>Sparte / Abteilung</Label>
                        <Select value={form.departmentId?.toString() || ""} onValueChange={(v) => updateForm("departmentId", Number(v))}>
                          <SelectTrigger><SelectValue placeholder="Sparte auswählen" /></SelectTrigger>
                          <SelectContent>
                            {departments.map((d) => (
                              <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Team bei Mannschaftssponsor */}
                    {form.sponsorType === "mannschaftssponsor" && teams && teams.length > 0 && (
                      <div>
                        <Label>Mannschaft</Label>
                        <Select value={form.teamId?.toString() || ""} onValueChange={(v) => updateForm("teamId", Number(v))}>
                          <SelectTrigger><SelectValue placeholder="Mannschaft auswählen" /></SelectTrigger>
                          <SelectContent>
                            {teams.map((t) => (
                              <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* ─── Kontaktperson ─── */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" /> Kontaktperson
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Vorname <span className="text-red-500">*</span></Label>
                        <Input value={form.contactFirstName} onChange={(e) => updateForm("contactFirstName", e.target.value)} placeholder="Max" required />
                      </div>
                      <div>
                        <Label>Nachname <span className="text-red-500">*</span></Label>
                        <Input value={form.contactLastName} onChange={(e) => updateForm("contactLastName", e.target.value)} placeholder="Mustermann" required />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="flex items-center gap-1"><Mail className="w-3 h-3" /> E-Mail <span className="text-red-500">*</span></Label>
                        <Input type="email" value={form.contactEmail} onChange={(e) => updateForm("contactEmail", e.target.value)} placeholder="max@firma.de" required />
                      </div>
                      <div>
                        <Label className="flex items-center gap-1"><Phone className="w-3 h-3" /> Telefon</Label>
                        <Input value={form.contactPhone} onChange={(e) => updateForm("contactPhone", e.target.value)} placeholder="+49 123 456789" />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* ─── Firmenadresse ─── */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Firmenadresse
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Label>Straße und Hausnummer <span className="text-red-500">*</span></Label>
                      <Input value={form.street} onChange={(e) => updateForm("street", e.target.value)} placeholder="Musterstraße 1" required />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label>PLZ <span className="text-red-500">*</span></Label>
                        <Input value={form.zip} onChange={(e) => updateForm("zip", e.target.value)} placeholder="12345" required />
                      </div>
                      <div className="col-span-2">
                        <Label>Ort <span className="text-red-500">*</span></Label>
                        <Input value={form.city} onChange={(e) => updateForm("city", e.target.value)} placeholder="Musterstadt" required />
                      </div>
                    </div>
                    <div>
                      <Label>Land</Label>
                      <Input value={form.country} onChange={(e) => updateForm("country", e.target.value)} />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* ─── Rechnungsdaten ─── */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Rechnungsdaten
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Label>USt-IdNr.</Label>
                      <Input value={form.vatId} onChange={(e) => updateForm("vatId", e.target.value)} placeholder="DE123456789" />
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="billingDifferent"
                        checked={form.billingDifferent}
                        onCheckedChange={(checked) => updateForm("billingDifferent", !!checked)}
                      />
                      <Label htmlFor="billingDifferent" className="text-sm cursor-pointer">
                        Abweichende Rechnungsadresse
                      </Label>
                    </div>

                    {form.billingDifferent && (
                      <div className="space-y-3 pl-6 border-l-2 border-blue-200">
                        <div>
                          <Label>Straße und Hausnummer</Label>
                          <Input value={form.billingStreet} onChange={(e) => updateForm("billingStreet", e.target.value)} placeholder="Rechnungsstraße 1" />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <Label>PLZ</Label>
                            <Input value={form.billingZip} onChange={(e) => updateForm("billingZip", e.target.value)} placeholder="12345" />
                          </div>
                          <div className="col-span-2">
                            <Label>Ort</Label>
                            <Input value={form.billingCity} onChange={(e) => updateForm("billingCity", e.target.value)} placeholder="Musterstadt" />
                          </div>
                        </div>
                        <div>
                          <Label>Land</Label>
                          <Input value={form.billingCountry} onChange={(e) => updateForm("billingCountry", e.target.value)} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* ─── Logo-Upload ─── */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Sponsor-Logo *
                  </h3>
                  {logoFile ? (
                    <div className="space-y-2">
                      <div className="relative w-32 h-32 border rounded bg-white p-2">
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo Vorschau" className="w-full h-full object-contain" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                            <FileText className="w-8 h-8 mb-1" />
                            <span className="text-xs">PDF</span>
                          </div>
                        )}
                        <button
                          onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >{"\u00d7"}</button>
                      </div>
                      <p className="text-xs text-muted-foreground">{logoFile.name} ({(logoFile.size / 1024).toFixed(0)} KB)</p>
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-blue-600 hover:underline">
                        <Upload className="w-3 h-3" /> Überschreiben
                        <input type="file" accept=".pdf,application/pdf,image/png,image/jpeg,image/svg+xml,image/webp" className="hidden" onChange={handleLogoChange} />
                      </label>
                    </div>
                  ) : (
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer border rounded px-3 py-2 hover:bg-gray-50">
                        <Upload className="w-4 h-4" />
                        <span className="text-sm">Logo hochladen (PDF, PNG, JPG, SVG)</span>
                        <input type="file" accept=".pdf,application/pdf,image/png,image/jpeg,image/svg+xml,image/webp" className="hidden" onChange={handleLogoChange} />
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">Ideal: PDF (Vektordatei) oder Bild mit mind. 300 DPI. Max. 5 MB.</p>
                    </div>
                  )}
                </div>

                {/* ─── Sponsoring-Summe (nur Owner) ─── */}
                {isOwner && (
                  <div className="border-t pt-4">
                    <Label className="flex items-center gap-1 mb-2 font-semibold">💰 Sponsoring-Summe (intern, nur für Sie sichtbar)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.sponsoringAmount || ""}
                        onChange={(e) => setForm({ ...form, sponsoringAmount: e.target.value })}
                        placeholder="z.B. 5000"
                        className="max-w-[200px]"
                      />
                      <span className="text-sm text-muted-foreground">€ / Saison</span>
                    </div>
                  </div>
                )}

                {/* ─── Erstellen-Button ─── */}
                <Button
                  onClick={handleCreate}
                  disabled={!form.name || !logoFile || !form.contactFirstName || !form.contactLastName || !form.contactEmail || !form.street || !form.zip || !form.city || createMutation.isPending}
                  className="w-full"
                  size="lg"
                >
                  {createMutation.isPending ? "Wird angelegt..." : "Sponsor anlegen"}
                </Button>
                {(!form.name || !logoFile || !form.contactFirstName || !form.contactLastName || !form.contactEmail || !form.street || !form.zip || !form.city) && (
                  <p className="text-xs text-red-500 text-center mt-1">Bitte alle Pflichtfelder (*) ausfüllen</p>
                )}
              </div>
            </DialogContent>
            </Dialog>
          </div>
        </div>
        {/* Einladungs-Dialog */}
        <InviteSponsorDialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen} orgId={org?.id} />
        {/* Sponsoren-Liste */}
        {!sponsors || sponsors.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Noch keine Sponsoren angelegt. Klicke auf "Neuer Sponsor" um einen hinzuzufügen.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sponsors.map((sponsor) => (
              <Card key={sponsor.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Hauptzeile */}
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => setExpandedId(expandedId === sponsor.id ? null : sponsor.id)}
                  >
                    {/* Logo */}
                    <div className="w-14 h-14 bg-white border rounded flex items-center justify-center flex-shrink-0">
                      {(sponsor.logoMimeType === 'application/pdf' || sponsor.logoUrl?.toLowerCase().endsWith('.pdf')) ? (
                        <PdfPreview url={storageUrl(sponsor.logoUrl) || sponsor.logoUrl} width={48} height={48} />
                      ) : (
                        <SponsorLogoImage src={storageUrl(sponsor.logoUrl) || sponsor.logoUrl} alt={sponsor.name} className="w-12 h-12 object-contain" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{sponsor.name}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge className={SPONSOR_TYPE_COLORS[sponsor.sponsorType as SponsorType] || "bg-gray-100 text-gray-800"}>
                          {SPONSOR_TYPE_LABELS[sponsor.sponsorType as SponsorType] || sponsor.sponsorType}
                        </Badge>
                        {sponsor.obligation !== "nicht_verpflichtend" && (
                          <Badge variant="outline" className="text-orange-700 border-orange-300">
                            {OBLIGATION_LABELS[sponsor.obligation as Obligation] || sponsor.obligation}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Aufklappen / Löschen */}
                    <div className="flex items-center gap-2">
                      {expandedId === sponsor.id ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Sponsor "${sponsor.name}" wirklich löschen?`)) {
                            deleteMutation.mutate({ id: sponsor.id, orgId: org.id });
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  {/* Aufgeklappte Details */}
                  {expandedId === sponsor.id && (
                    <div className="border-t px-4 py-3 bg-gray-50 text-sm space-y-2">
                      {(sponsor as any).contactFirstName && (
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <span>{(sponsor as any).contactFirstName} {(sponsor as any).contactLastName}</span>
                        </div>
                      )}
                      {(sponsor as any).contactEmail && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          <a href={`mailto:${(sponsor as any).contactEmail}`} className="text-blue-600 hover:underline">{(sponsor as any).contactEmail}</a>
                        </div>
                      )}
                      {(sponsor as any).contactPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          <span>{(sponsor as any).contactPhone}</span>
                        </div>
                      )}
                      {(sponsor as any).street && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          <span>{(sponsor as any).street}, {(sponsor as any).zip} {(sponsor as any).city}{(sponsor as any).country && (sponsor as any).country !== "Deutschland" ? `, ${(sponsor as any).country}` : ""}</span>
                        </div>
                      )}
                      {(sponsor as any).vatId && (
                        <div className="flex items-center gap-2">
                          <FileText className="w-3 h-3 text-muted-foreground" />
                          <span>USt-IdNr.: {(sponsor as any).vatId}</span>
                        </div>
                      )}
                      {!((sponsor as any).contactFirstName || (sponsor as any).contactEmail || (sponsor as any).street) && (
                        <p className="text-muted-foreground italic">Keine Kontaktdaten hinterlegt</p>
                      )}

                      {/* ─── Sponsoring-Summe (nur Owner) ─── */}
                      {isOwner && (sponsor as any).sponsoringAmount && (
                        <div className="flex items-center gap-2 mt-2 p-2 bg-green-50 rounded border border-green-200">
                          <span className="text-green-700 font-medium">💰 {Number((sponsor as any).sponsoringAmount).toLocaleString("de-DE", { minimumFractionDigits: 2 })} € / Saison</span>
                        </div>
                      )}

                      {/* ─── Produkt-Zuweisungen ─── */}
                      <Separator className="my-3" />
                      <SponsorProductAssignment
                        sponsorId={sponsor.id}
                        orgId={org.id}
                        publishedProducts={publishedProducts}
                        syncProductsMutation={syncProductsMutation}
                      />

                      {/* ─── Offene Freigaben ─── */}
                      <SponsorPendingApprovals sponsorId={sponsor.id} />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Dialog zum Einladen eines Sponsors per Link/E-Mail */
function InviteSponsorDialog({ open, onOpenChange, orgId }: { open: boolean; onOpenChange: (v: boolean) => void; orgId?: number }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const createInvitation = trpc.sponsorInvitation.create.useMutation({
    onSuccess: (data) => {
      const link = `${window.location.origin}/sponsor-form/${data.token}`;
      setGeneratedLink(link);
      toast.success("Einladung erstellt! Link wurde generiert.");
    },
    onError: (err) => {
      toast.error(err.message || "Fehler beim Erstellen der Einladung");
    },
  });

  function handleSend(sendEmail: boolean) {
    if (!orgId) return;
    if (!email) {
      toast.error("Bitte geben Sie eine E-Mail-Adresse ein");
      return;
    }
    createInvitation.mutate({
      orgId,
      sponsorEmail: email,
      sponsorName: name || undefined,
      sendEmail,
    });
  }

  function handleCopyLink() {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      toast.success("Link in die Zwischenablage kopiert!");
    }
  }

  function handleClose() {
    setEmail("");
    setName("");
    setGeneratedLink(null);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sponsor einladen</DialogTitle>
        </DialogHeader>
        {!generatedLink ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Senden Sie dem Sponsor einen Link, über den er seine Daten (Logo, Kontakt, Adresse) selbst einträgt.
            </p>
            <div>
              <Label>Firmenname (optional)</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Muster GmbH" />
            </div>
            <div>
              <Label>E-Mail des Sponsors <span className="text-red-500">*</span></Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sponsor@firma.de" />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleSend(true)} disabled={createInvitation.isPending} className="flex-1">
                <Send className="w-4 h-4 mr-2" /> E-Mail senden
              </Button>
              <Button variant="outline" onClick={() => handleSend(false)} disabled={createInvitation.isPending} className="flex-1">
                <Copy className="w-4 h-4 mr-2" /> Nur Link erstellen
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-medium text-green-800 mb-2">Einladungslink erstellt!</p>
              <div className="flex gap-2">
                <Input value={generatedLink} readOnly className="text-xs" />
                <Button size="sm" variant="outline" onClick={handleCopyLink}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-green-600 mt-2">Gültig für 30 Tage. Der Sponsor kann über diesen Link seine Daten selbst eintragen.</p>
            </div>
            <Button variant="outline" onClick={handleClose} className="w-full">
              Schließen
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

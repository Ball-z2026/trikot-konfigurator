import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import {
  Plus,
  Shirt,
  ArrowLeft,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  LayoutTemplate,
  FileText,
  ChevronRight,
  Layers,
  Stamp,
  UserCog,
  Sparkles,
} from "lucide-react";
import { TemplateUpload } from "@/components/TemplateUpload";
import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { TEXTIL_TEMPLATES, SPORT_TYPES, type SportType } from "@shared/templates";
import { storageUrl } from "@/lib/utils";

type CreateMode = "choose" | "sport" | "template" | "blank" | "ai-analyze";

export default function AdminProducts() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();


  const utils = trpc.useUtils();
  const { data: products, isLoading } = trpc.product.list.useQuery();

  const createProduct = trpc.product.create.useMutation({
    onSuccess: (data) => {
      utils.product.list.invalidate();
      setLocation(`/designer/products/${data.id}`);
      toast.success("Produkt erstellt");
      setDialogOpen(false);
      resetDialog();
    },
    onError: () => toast.error("Fehler beim Erstellen"),
  });

  const createFromTemplate = trpc.product.createFromTemplate.useMutation({
    onSuccess: (data) => {
      utils.product.list.invalidate();
      setLocation(`/designer/products/${data.id}`);
      toast.success("Produkt aus Vorlage erstellt – Teile und Zonen wurden automatisch angelegt!");
      setDialogOpen(false);
      resetDialog();
    },
    onError: () => toast.error("Fehler beim Erstellen aus Vorlage"),
  });

  const deleteProduct = trpc.product.delete.useMutation({
    onSuccess: () => {
      utils.product.list.invalidate();
      toast.success("Produkt gelöscht");
    },
    onError: () => toast.error("Fehler beim Löschen"),
  });

  const togglePublish = trpc.product.update.useMutation({
    onSuccess: () => {
      utils.product.list.invalidate();
      toast.success("Status aktualisiert");
    },
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [createMode, setCreateMode] = useState<CreateMode>("choose");
  const [selectedSport, setSelectedSport] = useState<SportType | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [showAiAnalyze, setShowAiAnalyze] = useState(false);

  // Org-IDs des Users für KI-Analyse
  const { data: myMemberships } = trpc.membership.mine.useQuery(undefined, { enabled: isAuthenticated });
  const userOrgIds = useMemo(() => {
    if (!myMemberships) return [];
    return [...new Set(myMemberships.map((m: any) => m.orgId))];
  }, [myMemberships]);

  const resetDialog = () => {
    setCreateMode("choose");
    setSelectedSport(null);
    setSelectedTemplateId(null);
    setNewName("");
    setNewCategory("");
  };

  const selectedTemplate = TEXTIL_TEMPLATES.find((t) => t.id === selectedTemplateId);

  // Filter templates by selected sport (exclude legacy templates from selection)
  // Bekleidung-Templates (freeZoneMode) werden für alle Sportarten angezeigt
  const filteredTemplates = selectedSport
    ? TEXTIL_TEMPLATES.filter((t) => 
        (t.sport === selectedSport || t.category === "Bekleidung") && !t.id.startsWith("trikot_")
      )
    : [];

  const handleCreateFromTemplate = () => {
    if (!selectedTemplate || !newName.trim()) return;
    createFromTemplate.mutate({
      name: newName.trim(),
      description: selectedTemplate.description,
      category: newCategory.trim() || selectedTemplate.category,
      templateId: selectedTemplate.id,
      freeZoneMode: selectedTemplate.freeZoneMode ?? false,
      parts: selectedTemplate.parts,
    });
  };

  const handleCreateBlank = () => {
    if (!newName.trim()) return;
    createProduct.mutate({
      name: newName.trim(),
      category: newCategory.trim() || undefined,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <Shirt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Anmeldung erforderlich</h2>
            <p className="text-muted-foreground mb-4">
              Bitte melde dich an, um auf den Produktdesigner zuzugreifen.
            </p>
            <Link href="/login">
              <Button>Anmelden</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container flex items-center justify-between h-14 px-3 sm:px-4 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link href="/">
              <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 sm:h-9 sm:w-9">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-sm sm:text-lg font-bold truncate">Produktverwaltung</h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <Link href="/verwaltung/admin/users">
              <Button variant="outline" size="sm" className="h-8 text-xs sm:text-sm">
                <UserCog className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Benutzer</span>
              </Button>
            </Link>
          </div>
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetDialog();
            }}
            modal={false}
          >
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 text-xs sm:text-sm">
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Neues Produkt</span>
                <span className="sm:hidden">Neu</span>
              </Button>
            </DialogTrigger>
            {/* Manuelles Overlay für modal={false} - verhindert iOS Touch-Freeze */}
            {dialogOpen && (
              <div
                className="fixed inset-0 z-40 bg-black/50 pointer-events-none"
              />
            )}
            <DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto z-50">
              <DialogHeader>
                <DialogTitle>
                  {createMode === "choose" && "Neues Produkt erstellen"}
                  {createMode === "sport" && "Sportart wählen"}
                  {createMode === "template" && !selectedTemplateId && "Druckverfahren wählen"}
                  {createMode === "template" && selectedTemplateId && "Produkt aus Vorlage"}
                  {createMode === "blank" && "Leeres Produkt erstellen"}
                  {createMode === "ai-analyze" && "Bild analysieren & Vorlage erstellen"}
                </DialogTitle>
              </DialogHeader>

              {/* Step 1: Choose mode */}
              {createMode === "choose" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  <button
                    className="group relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-all text-left"
                    onClick={() => setCreateMode("sport")}
                  >
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <LayoutTemplate className="w-7 h-7 text-primary" />
                    </div>
                    <div className="text-center">
                      <h3 className="font-semibold text-base">Aus Vorlage</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Wähle Sportart und Druckverfahren mit vordefinierten Teilen und Zonen
                      </p>
                    </div>
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>

                  <button
                    className="group relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-all text-left"
                    onClick={() => setCreateMode("blank")}
                  >
                    <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <FileText className="w-7 h-7 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <div className="text-center">
                      <h3 className="font-semibold text-base">Leeres Produkt</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Erstelle ein leeres Produkt und lade eigene Bilder hoch
                      </p>
                    </div>
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>

                  <button
                    className="group relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50 transition-all text-left sm:col-span-2"
                    onClick={() => setCreateMode("ai-analyze")}
                  >
                    <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                      <Sparkles className="w-7 h-7 text-purple-600" />
                    </div>
                    <div className="text-center">
                      <h3 className="font-semibold text-base">KI-Bild-Analyse</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Lade ein Trikot-Bild hoch – die KI erkennt automatisch Positionen, Farben und Stil
                      </p>
                    </div>
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-hover:text-purple-500 transition-colors" />
                  </button>
                </div>
              )}

              {/* KI-Analyse Modus */}
              {createMode === "ai-analyze" && (
                <div className="pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCreateMode("choose")}
                    className="mb-4"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Zurück
                  </Button>
                  <TemplateUpload
                    orgId={userOrgIds[0] || 0}
                    onSaved={() => {
                      setDialogOpen(false);
                      resetDialog();
                      utils.product.list.invalidate();
                    }}
                    onCancel={() => {
                      setCreateMode("choose");
                    }}
                  />
                </div>
              )}

              {/* Step 2: Sport type selection */}
              {createMode === "sport" && (
                <div className="space-y-4 pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCreateMode("choose")}
                    className="mb-2"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Zurück
                  </Button>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {SPORT_TYPES.map((sport) => (
                      <button
                        key={sport.id}
                        className="group flex flex-col items-center gap-3 p-5 rounded-xl border-2 hover:border-primary hover:bg-primary/5 transition-all"
                        onClick={() => {
                          setSelectedSport(sport.id);
                          setCreateMode("template");
                        }}
                      >
                        <span className="text-4xl">{sport.icon}</span>
                        <div className="text-center">
                          <h4 className="font-semibold text-sm">{sport.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {sport.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Template selection (filtered by sport) */}
              {createMode === "template" && !selectedTemplateId && (
                <div className="space-y-4 pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedSport(null);
                      setCreateMode("sport");
                    }}
                    className="mb-2"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Andere Sportart
                  </Button>

                  {selectedSport && (
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl">
                        {SPORT_TYPES.find((s) => s.id === selectedSport)?.icon}
                      </span>
                      <span className="font-semibold">
                        {SPORT_TYPES.find((s) => s.id === selectedSport)?.name}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredTemplates.map((template) => (
                      <button
                        key={template.id}
                        className="group flex flex-col overflow-hidden rounded-xl border-2 hover:border-primary transition-all"
                        onClick={() => {
                          setSelectedTemplateId(template.id);
                          setNewCategory(template.category);
                        }}
                      >
                        <div className="aspect-[4/3] bg-muted/30 overflow-hidden p-4 relative">
                          <img
                            src={storageUrl(template.previewUrl)}
                            alt={template.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                          />
                          <Badge
                            variant={template.printMethod === "sublimation" ? "default" : "secondary"}
                            className="absolute top-2 right-2"
                          >
                            {template.printMethod === "sublimation" ? (
                              <><Layers className="w-3 h-3 mr-1" />Sublimation</>
                            ) : (
                              <><Stamp className="w-3 h-3 mr-1" />DTF</>
                            )}
                          </Badge>
                        </div>
                        <div className="p-4 text-left">
                          <h4 className="font-semibold">{template.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {template.description}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {template.parts.map((part) => (
                              <Badge key={part.key} variant="secondary" className="text-xs">
                                {part.label}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Template selected – enter name */}
              {createMode === "template" && selectedTemplateId && selectedTemplate && (
                <div className="space-y-4 pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTemplateId(null)}
                    className="mb-2"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Anderes Druckverfahren
                  </Button>

                  <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                    <img
                      src={storageUrl(selectedTemplate.previewUrl)}
                      alt={selectedTemplate.name}
                      className="w-20 h-20 object-contain"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{selectedTemplate.name}</h4>
                        <Badge
                          variant={selectedTemplate.printMethod === "sublimation" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {selectedTemplate.printMethod === "sublimation" ? "Sublimation" : "DTF"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {selectedTemplate.parts.length} Teile,{" "}
                        {selectedTemplate.parts.reduce((sum, p) => sum + p.zones.length, 0)} vordefinierte Zonen
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="tpl-name">Produktname</Label>
                    <Input
                      id="tpl-name"
                      placeholder="z.B. Heimtrikot 2025/26"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div>
                    <Label htmlFor="tpl-category">Kategorie</Label>
                    <Input
                      id="tpl-category"
                      placeholder="z.B. Trikot"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full"
                    disabled={!newName.trim() || createFromTemplate.isPending}
                    onClick={handleCreateFromTemplate}
                  >
                    {createFromTemplate.isPending ? "Wird erstellt..." : "Produkt erstellen"}
                  </Button>
                </div>
              )}

              {/* Blank product mode */}
              {createMode === "blank" && (
                <div className="space-y-4 pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCreateMode("choose")}
                    className="mb-2"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Zurück
                  </Button>
                  <div>
                    <Label htmlFor="blank-name">Produktname</Label>
                    <Input
                      id="blank-name"
                      placeholder="z.B. Hoodie Basic"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div>
                    <Label htmlFor="blank-category">Kategorie (optional)</Label>
                    <Input
                      id="blank-category"
                      placeholder="z.B. Hoodie, Jacke, T-Shirt"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full"
                    disabled={!newName.trim() || createProduct.isPending}
                    onClick={handleCreateBlank}
                  >
                    {createProduct.isPending ? "Wird erstellt..." : "Leeres Produkt erstellen"}
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Product List */}
      <main className="container py-4 sm:py-6 px-3 sm:px-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : !products || products.length === 0 ? (
          <div className="text-center py-16">
            <Shirt className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Noch keine Produkte</h2>
            <p className="text-muted-foreground mb-6">
              Erstelle dein erstes Produkt, um loszulegen.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Neues Produkt
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {products.map((product: any) => (
              <Card
                key={product.id}
                className="group overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-[4/3] bg-[#b8bcc2] overflow-hidden relative">
                  {(() => {
                    const imageUrl = product.frontImageUrl
                      || (product.templateId && TEXTIL_TEMPLATES.find((t: any) => t.id === product.templateId)?.previewUrl)
                      || null;
                    if (imageUrl) {
                      return (
                        <img
                          src={storageUrl(imageUrl)}
                          alt={product.name}
                          className="w-full h-full object-contain p-4"
                        />
                      );
                    }
                    return (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="w-12 h-12 text-muted-foreground/30" />
                      </div>
                    );
                  })()}
                  <div className="absolute top-2 right-2 flex gap-1">
                    {product.published ? (
                      <Badge variant="default" className="text-xs">
                        <Eye className="w-3 h-3 mr-1" />
                        Aktiv
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        <EyeOff className="w-3 h-3 mr-1" />
                        Entwurf
                      </Badge>
                    )}
                  </div>
                </div>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-semibold truncate">{product.name}</h3>
                      {product.category && (
                        <p className="text-xs sm:text-sm text-muted-foreground">{product.category}</p>
                      )}
                    </div>
                    <div className="flex gap-0.5 sm:gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          togglePublish.mutate({
                            id: product.id,
                            published: !product.published,
                          })
                        }
                      >
                        {product.published ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setLocation(`/designer/products/${product.id}`)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm("Produkt wirklich löschen?")) {
                            deleteProduct.mutate({ id: product.id });
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

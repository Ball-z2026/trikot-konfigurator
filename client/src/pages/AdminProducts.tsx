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
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { TEXTIL_TEMPLATES } from "@shared/templates";

type CreateMode = "choose" | "template" | "blank";

export default function AdminProducts() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const isAdmin = user?.role === "admin";

  const utils = trpc.useUtils();
  const { data: products, isLoading } = trpc.product.list.useQuery();

  const createProduct = trpc.product.create.useMutation({
    onSuccess: (data) => {
      utils.product.list.invalidate();
      setLocation(`/admin/products/${data.id}`);
      toast.success("Produkt erstellt");
      setDialogOpen(false);
      resetDialog();
    },
    onError: () => toast.error("Fehler beim Erstellen"),
  });

  const createFromTemplate = trpc.product.createFromTemplate.useMutation({
    onSuccess: (data) => {
      utils.product.list.invalidate();
      setLocation(`/admin/products/${data.id}`);
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
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");

  const resetDialog = () => {
    setCreateMode("choose");
    setSelectedTemplateId(null);
    setNewName("");
    setNewCategory("");
  };

  const selectedTemplate = TEXTIL_TEMPLATES.find((t) => t.id === selectedTemplateId);

  const handleCreateFromTemplate = () => {
    if (!selectedTemplate || !newName.trim()) return;
    createFromTemplate.mutate({
      name: newName.trim(),
      description: selectedTemplate.description,
      category: newCategory.trim() || selectedTemplate.category,
      templateId: selectedTemplate.id,
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
              Bitte melde dich an, um auf den Admin-Bereich zuzugreifen.
            </p>
            <a href={getLoginUrl("/admin/products")}>
              <Button>Anmelden</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-bold mb-2">Kein Zugriff</h2>
            <p className="text-muted-foreground mb-4">
              Du benötigst Admin-Rechte für diesen Bereich.
            </p>
            <Link href="/">
              <Button variant="outline">Zurück zur Startseite</Button>
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
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-lg font-bold">Produktverwaltung</h1>
          </div>
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetDialog();
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Neues Produkt
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {createMode === "choose" && "Neues Produkt erstellen"}
                  {createMode === "template" && !selectedTemplateId && "Vorlage auswählen"}
                  {createMode === "template" && selectedTemplateId && "Produkt aus Vorlage"}
                  {createMode === "blank" && "Leeres Produkt erstellen"}
                </DialogTitle>
              </DialogHeader>

              {/* Step 1: Choose mode */}
              {createMode === "choose" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  <button
                    className="group relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-all text-left"
                    onClick={() => setCreateMode("template")}
                  >
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <LayoutTemplate className="w-7 h-7 text-primary" />
                    </div>
                    <div className="text-center">
                      <h3 className="font-semibold text-base">Aus Vorlage</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Wähle ein vordefiniertes Template mit Teilen und Platzierungszonen
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
                </div>
              )}

              {/* Step 2a: Template selection */}
              {createMode === "template" && !selectedTemplateId && (
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {TEXTIL_TEMPLATES.map((template) => (
                      <button
                        key={template.id}
                        className="group flex flex-col overflow-hidden rounded-xl border-2 hover:border-primary transition-all"
                        onClick={() => {
                          setSelectedTemplateId(template.id);
                          setNewCategory(template.category);
                        }}
                      >
                        <div className="aspect-[4/3] bg-muted/30 overflow-hidden p-4">
                          <img
                            src={template.previewUrl}
                            alt={template.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                          />
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

              {/* Step 2b: Template selected – enter name */}
              {createMode === "template" && selectedTemplateId && selectedTemplate && (
                <div className="space-y-4 pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTemplateId(null)}
                    className="mb-2"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Andere Vorlage
                  </Button>

                  <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                    <img
                      src={selectedTemplate.previewUrl}
                      alt={selectedTemplate.name}
                      className="w-20 h-20 object-contain"
                    />
                    <div>
                      <h4 className="font-semibold">{selectedTemplate.name}</h4>
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
                    {createFromTemplate.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    ) : (
                      <LayoutTemplate className="w-4 h-4 mr-2" />
                    )}
                    Aus Vorlage erstellen
                  </Button>
                </div>
              )}

              {/* Step 2c: Blank product */}
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
                      placeholder="z.B. Trikot Modell A"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div>
                    <Label htmlFor="blank-category">Kategorie</Label>
                    <Input
                      id="blank-category"
                      placeholder="z.B. Trikot, Hoodie, Jacke..."
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full"
                    disabled={!newName.trim() || createProduct.isPending}
                    onClick={handleCreateBlank}
                  >
                    {createProduct.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Leeres Produkt erstellen
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Product List */}
      <main className="container py-8">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : !products?.length ? (
          <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed">
            <Shirt className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Keine Produkte vorhanden</h3>
            <p className="text-muted-foreground mb-6">
              Erstelle dein erstes Produkt – wähle eine Vorlage oder starte von Null.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Erstes Produkt erstellen
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="group overflow-hidden">
                <div className="aspect-[4/3] bg-muted/30 relative overflow-hidden">
                  {product.frontImageUrl ? (
                    <img
                      src={product.frontImageUrl}
                      alt={product.name}
                      className="w-full h-full object-contain p-4"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Shirt className="w-16 h-16 text-muted-foreground/20" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex gap-1">
                    {(product as any).templateId && (
                      <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
                        <LayoutTemplate className="w-3 h-3 mr-1" />
                        Vorlage
                      </Badge>
                    )}
                    <Badge variant={product.published ? "default" : "secondary"}>
                      {product.published ? "Veröffentlicht" : "Entwurf"}
                    </Badge>
                  </div>
                </div>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                      {product.category && (
                        <p className="text-sm text-muted-foreground">{product.category}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setLocation(`/admin/products/${product.id}`)}
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1.5" />
                      Bearbeiten
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={() =>
                        togglePublish.mutate({
                          id: product.id,
                          published: !product.published,
                        })
                      }
                    >
                      {product.published ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => {
                        if (confirm("Produkt wirklich löschen?")) {
                          deleteProduct.mutate({ id: product.id });
                        }
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
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

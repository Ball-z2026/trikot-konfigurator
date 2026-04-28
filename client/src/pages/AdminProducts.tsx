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
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

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
    },
    onError: () => toast.error("Fehler beim Erstellen"),
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
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");

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
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Neues Produkt
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Neues Produkt erstellen</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="name">Produktname</Label>
                  <Input
                    id="name"
                    placeholder="z.B. Trikot Modell A"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Kategorie</Label>
                  <Input
                    id="category"
                    placeholder="z.B. Trikot, Hoodie, Jacke..."
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full"
                  disabled={!newName.trim()}
                  onClick={() =>
                    createProduct.mutate({
                      name: newName.trim(),
                      category: newCategory.trim() || undefined,
                    })
                  }
                >
                  Erstellen
                </Button>
              </div>
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
              Erstelle dein erstes Produkt, um loszulegen.
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
                  <div className="absolute top-3 right-3">
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

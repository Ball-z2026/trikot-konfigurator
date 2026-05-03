import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Shirt, ArrowRight, ArrowLeft } from "lucide-react";
import { TEXTIL_TEMPLATES } from "@shared/templates";
import { storageUrl } from "@/lib/utils";
import { Link, useLocation } from "wouter";

export default function ProductSelect() {
  const [, setLocation] = useLocation();
  const { data: products, isLoading } = trpc.product.list.useQuery();
  const publishedProducts = products?.filter((p) => p.published) ?? [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-30">
        <div className="container flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Zurück
              </Button>
            </Link>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight">Konfigurator</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Produkt auswählen</p>
            </div>
          </div>
        </div>
      </header>

      {/* Produktliste */}
      <section className="py-8 sm:py-12">
        <div className="container px-4">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-8">Produkt zum Konfigurieren auswählen</h2>

          {isLoading ? (
            <div className="text-center py-16">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground">Produkte werden geladen...</p>
            </div>
          ) : publishedProducts.length === 0 ? (
            <div className="text-center py-10 sm:py-16 bg-muted/30 rounded-xl border border-dashed">
              <Shirt className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
              <p className="text-muted-foreground text-base sm:text-lg">
                Noch keine Produkte verfügbar.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {publishedProducts.map((product) => (
                <Card
                  key={product.id}
                  className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
                  onClick={() => setLocation(`/konfigurator/${product.id}`)}
                >
                  <div className="aspect-[4/3] bg-[#b8bcc2] relative overflow-hidden">
                    {(() => {
                      const imageUrl = product.frontImageUrl
                        || (product.templateId && TEXTIL_TEMPLATES.find(t => t.id === product.templateId)?.previewUrl)
                        || null;
                      if (imageUrl) {
                        return (
                          <img
                            src={storageUrl(imageUrl)}
                            alt={product.name}
                            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                          />
                        );
                      }
                      return (
                        <div className="w-full h-full flex items-center justify-center">
                          <Shirt className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground/30" />
                        </div>
                      );
                    })()}
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base sm:text-lg">{product.name}</CardTitle>
                    {product.category && (
                      <CardDescription>{product.category}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      Konfigurieren
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

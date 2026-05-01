import { trpc } from "@/lib/trpc";
import { useParams } from "wouter";
import { Loader2, Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { storageUrl } from "@/lib/utils";

export default function MockupShare() {
  const { token } = useParams<{ token: string }>();
  const { data: mockup, isLoading, error } = trpc.mockupGallery.getByShareToken.useQuery(
    { token: token || "" },
    { enabled: !!token }
  );

  const handleDownload = () => {
    if (!mockup) return;
    const a = document.createElement("a");
    a.href = storageUrl(mockup.imageUrl) || mockup.imageUrl;
    a.download = `${(mockup.title || "KI-Mockup").replace(/\s+/g, "_")}.png`;
    a.target = "_blank";
    a.click();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-muted-foreground">Mockup wird geladen...</p>
        </div>
      </div>
    );
  }

  if (error || !mockup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Mockup nicht gefunden</h1>
          <p className="text-muted-foreground">
            Dieser Link ist ungültig oder das Mockup wurde gelöscht.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-500" />
            <div>
              <h1 className="text-xl font-bold">{mockup.title || "KI-Mockup"}</h1>
              <p className="text-sm text-muted-foreground">
                {mockup.side === "front" ? "Vorderseite" : "Rückseite"} &middot;{" "}
                {new Date(mockup.createdAt).toLocaleDateString("de-DE", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          <Button onClick={handleDownload} size="sm" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Herunterladen
          </Button>
        </div>

        {/* Mockup-Bild */}
        <div className="bg-muted rounded-xl overflow-hidden border">
          <img
            src={storageUrl(mockup.imageUrl) || mockup.imageUrl}
            alt={mockup.title || "KI-Mockup"}
            className="w-full h-auto object-contain"
          />
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Erstellt mit dem Trikot-Konfigurator
          </p>
        </div>
      </div>
    </div>
  );
}

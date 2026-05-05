import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, AlertCircle, Wrench, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

/**
 * FeedbackTestBar - Floating-Bar die erscheint wenn ein Admin ein Problem testet.
 * 
 * Workflow:
 * 1. Admin klickt "Problem testen" im Dashboard
 * 2. URL-Parameter ?feedbackTestId=123 wird gesetzt
 * 3. Diese Bar erscheint auf der Zielseite
 * 4. Admin kann "Behoben", "Nicht behoben" oder "Zurück" klicken
 * 5. Status wird in DB aktualisiert und Admin kehrt zum Dashboard zurück
 */
export function FeedbackTestBar() {
  const [location, setLocation] = useLocation();
  const [feedbackId, setFeedbackId] = useState<number | null>(null);
  const [showNote, setShowNote] = useState(false);
  const [devNote, setDevNote] = useState("");
  const utils = trpc.useUtils();

  const updateStatusMutation = trpc.betaFeedback.updateStatus.useMutation({
    onSuccess: () => {
      utils.betaFeedback.list.invalidate();
      toast.success("Status aktualisiert!");
      // Zurück zum Dashboard
      setLocation("/admin");
    },
    onError: () => toast.error("Fehler beim Aktualisieren"),
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const testId = params.get("feedbackTestId");
    if (testId) {
      setFeedbackId(Number(testId));
    } else {
      setFeedbackId(null);
    }
  }, [location]);

  if (!feedbackId) return null;

  const handleResolved = () => {
    updateStatusMutation.mutate({ 
      id: feedbackId, 
      status: "resolved",
      adminNote: devNote || undefined,
    });
  };

  const handleStillPresent = () => {
    updateStatusMutation.mutate({ 
      id: feedbackId, 
      status: "still_present",
      adminNote: devNote || undefined,
    });
  };

  const handleBack = () => {
    setLocation("/admin");
  };

  const handleDismiss = () => {
    // Entferne den Query-Parameter ohne Navigation
    const url = new URL(window.location.href);
    url.searchParams.delete("feedbackTestId");
    window.history.replaceState({}, "", url.pathname + url.search);
    setFeedbackId(null);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-slate-900 text-white shadow-2xl border-t border-slate-700">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col gap-2">
          {/* Hauptzeile */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium">
                Problem #{feedbackId} testen
              </span>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs bg-transparent border-slate-500 text-white hover:bg-slate-800"
                onClick={handleBack}
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                Zurück zum Dashboard
              </Button>
              
              <Button
                size="sm"
                className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
                onClick={handleResolved}
                disabled={updateStatusMutation.isPending}
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                Behoben
              </Button>
              
              <Button
                size="sm"
                className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white"
                onClick={handleStillPresent}
                disabled={updateStatusMutation.isPending}
              >
                <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                Nicht behoben
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800"
                onClick={handleDismiss}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Notiz-Bereich (optional aufklappbar) */}
          {!showNote ? (
            <button
              className="text-xs text-slate-400 hover:text-white text-left"
              onClick={() => setShowNote(true)}
            >
              + Entwickler-Notiz hinzufügen
            </button>
          ) : (
            <div className="flex gap-2 items-start">
              <Textarea
                value={devNote}
                onChange={(e) => setDevNote(e.target.value)}
                placeholder="Was wurde gemacht? Wo können Probleme entstehen?"
                className="h-16 text-xs bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 resize-none flex-1"
              />
              <Button
                size="sm"
                variant="ghost"
                className="text-slate-400 hover:text-white h-8"
                onClick={() => setShowNote(false)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

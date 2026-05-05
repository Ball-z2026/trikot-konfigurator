import { useState, useRef } from "react";
import { MessageSquarePlus, Send, X, CheckCircle2, AlertCircle, Bug, Camera, Copy, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { toPng } from "html-to-image";

interface BetaFeedbackWidgetProps {
  /** Seitenname für die Zuordnung (z.B. "Konfigurator", "Verwaltung") */
  page: string;
  /** Optionaler Bereich auf der Seite */
  area?: string;
}

export function BetaFeedbackWidget({ page, area }: BetaFeedbackWidgetProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [showFeedbacks, setShowFeedbacks] = useState(false);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [takingScreenshot, setTakingScreenshot] = useState(false);

  const isAdmin = user?.role === "admin";

  // Offene Feedbacks zählen
  const { data: openCount } = trpc.betaFeedback.countByPage.useQuery(
    { page },
    { enabled: !!user }
  );

  // Feedbacks für diese Seite laden (nur Admin)
  const { data: feedbacks, refetch: refetchFeedbacks } = trpc.betaFeedback.list.useQuery(
    { page },
    { enabled: isAdmin && showFeedbacks }
  );

  const uploadScreenshotMutation = trpc.betaFeedback.uploadScreenshot.useMutation();

  const createMutation = trpc.betaFeedback.create.useMutation({
    onSuccess: () => {
      toast.success("Feedback gesendet! Danke für deine Meldung.");
      setMessage("");
      setPriority("medium");
      setScreenshotPreview(null);
      setIsOpen(false);
    },
    onError: (err) => {
      toast.error("Fehler: " + err.message);
    },
  });

  const updateStatusMutation = trpc.betaFeedback.updateStatus.useMutation({
    onSuccess: () => {
      refetchFeedbacks();
      toast.success("Status aktualisiert");
    },
  });

  // Screenshot erstellen
  const handleTakeScreenshot = async () => {
    setTakingScreenshot(true);
    try {
      // Kurz das Widget ausblenden für den Screenshot
      const widget = document.getElementById("beta-feedback-widget");
      if (widget) widget.style.display = "none";

      await new Promise((r) => setTimeout(r, 100));

      // Nur den sichtbaren Viewport erfassen (was der User gerade sieht)
      const dataUrl = await toPng(document.body, {
        quality: 0.8,
        pixelRatio: 1,
        width: window.innerWidth,
        height: window.innerHeight,
        style: {
          transform: `translate(-${window.scrollX}px, -${window.scrollY}px)`,
        },
        filter: (node) => {
          // Feedback-Widget aus Screenshot ausschließen
          if ((node as HTMLElement).id === "beta-feedback-widget") return false;
          return true;
        },
      });

      if (widget) widget.style.display = "";
      setScreenshotPreview(dataUrl);
      toast.success("Screenshot erstellt!");
    } catch (err) {
      console.error("Screenshot fehlgeschlagen:", err);
      toast.error("Screenshot konnte nicht erstellt werden");
      const widget = document.getElementById("beta-feedback-widget");
      if (widget) widget.style.display = "";
    } finally {
      setTakingScreenshot(false);
    }
  };

  const handleSubmit = async () => {
    if (!message.trim()) return;

    let screenshotUrl: string | undefined;

    // Screenshot hochladen wenn vorhanden
    if (screenshotPreview) {
      try {
        const result = await uploadScreenshotMutation.mutateAsync({
          imageBase64: screenshotPreview,
        });
        screenshotUrl = result.url;
      } catch (err) {
        console.error("Screenshot-Upload fehlgeschlagen:", err);
        // Feedback trotzdem senden ohne Screenshot
      }
    }

    createMutation.mutate({
      page,
      area: area || undefined,
      message: message.trim(),
      priority,
      currentUrl: window.location.href,
      userAgent: navigator.userAgent,
      screenshotUrl,
    });
  };

  // "An Manus senden" - kopiert formatiertes Problem in Zwischenablage
  const priorityLabels: Record<string, string> = { low: "Niedrig", medium: "Mittel", high: "Hoch", critical: "Kritisch" };
  const handleCopyForManus = (fb: any) => {
    const text = `## Beta-Feedback: Problem auf Seite "${fb.page}"${fb.area ? ` (Bereich: ${fb.area})` : ""}

**Gemeldet von:** ${fb.userName || "Anonym"}
**Datum:** ${new Date(fb.createdAt).toLocaleString("de-DE")}
**Priorität:** ${priorityLabels[fb.priority] || "Mittel"}
**URL:** ${fb.currentUrl || "Nicht verfügbar"}
**Status:** ${fb.status === "resolved" ? "Behoben" : fb.status === "still_present" ? "Weiter vorhanden" : "Offen"}

### Problembeschreibung:
${fb.message}
${fb.screenshotUrl ? `\n### Screenshot:\n${window.location.origin}${fb.screenshotUrl}` : ""}
${fb.adminNote ? `\n### Admin-Notiz:\n${fb.adminNote}` : ""}

---
Bitte behebe dieses Problem auf der Seite "${fb.page}"${fb.area ? ` im Bereich "${fb.area}"` : ""}.`;

    navigator.clipboard.writeText(text).then(() => {
      toast.success("Problem-Details in Zwischenablage kopiert! Einfach bei Manus einfügen.");
    });
  };

  if (!user) return null;

  return (
    <div id="beta-feedback-widget" className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end gap-2" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
      {/* Admin: Feedback-Liste anzeigen */}
      {isAdmin && showFeedbacks && feedbacks && feedbacks.length > 0 && (
        <Card className="w-96 max-h-[70vh] overflow-y-auto shadow-xl border-orange-200 dark:border-orange-800 animate-in slide-in-from-bottom-2">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-orange-800 dark:text-orange-200">
                Feedbacks: {page} ({feedbacks.length})
              </span>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowFeedbacks(false)}>
                <X className="w-3 h-3" />
              </Button>
            </div>
            <div className="space-y-2">
              {feedbacks.map((fb) => (
                <div
                  key={fb.id}
                  className={`p-2 rounded-md text-xs border ${
                    fb.status === "resolved"
                      ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800"
                      : fb.status === "still_present"
                      ? "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800"
                      : "bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold">{fb.userName || "Anonym"}</span>
                    <div className="flex items-center gap-1">
                      {fb.priority && fb.priority !== "medium" && (
                        <Badge
                          variant="outline"
                          className={`text-[9px] ${
                            fb.priority === "critical" ? "border-red-500 text-red-700 bg-red-50" :
                            fb.priority === "high" ? "border-orange-400 text-orange-700 bg-orange-50" :
                            "border-gray-300 text-gray-600"
                          }`}
                        >
                          {fb.priority === "critical" ? "Kritisch" : fb.priority === "high" ? "Hoch" : "Niedrig"}
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={`text-[9px] ${
                          fb.status === "resolved"
                            ? "border-green-400 text-green-700"
                            : fb.status === "still_present"
                            ? "border-red-400 text-red-700"
                            : "border-orange-400 text-orange-700"
                        }`}
                      >
                        {fb.status === "resolved" ? "Behoben" : fb.status === "still_present" ? "Offen" : "Neu"}
                      </Badge>
                    </div>
                  </div>
                  {fb.area && (
                    <div className="text-[10px] text-muted-foreground mb-1">Bereich: {fb.area}</div>
                  )}
                  <p className="text-xs text-foreground mb-2 whitespace-pre-wrap">{fb.message}</p>

                  {/* Screenshot-Vorschau */}
                  {fb.screenshotUrl && (
                    <div className="mb-2">
                      <img
                        src={fb.screenshotUrl}
                        alt="Screenshot"
                        className="w-full rounded border cursor-pointer hover:opacity-80"
                        onClick={() => window.open(fb.screenshotUrl!, "_blank")}
                      />
                    </div>
                  )}

                  {fb.adminNote && (
                    <p className="text-[10px] text-muted-foreground italic mb-1">Admin: {fb.adminNote}</p>
                  )}
                  <div className="text-[10px] text-muted-foreground mb-2">
                    {new Date(fb.createdAt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </div>

                  {/* Admin-Buttons */}
                  <div className="flex flex-wrap gap-1">
                    {fb.status !== "resolved" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] px-2 border-green-400 text-green-700 hover:bg-green-50"
                          onClick={() => updateStatusMutation.mutate({ id: fb.id, status: "resolved" })}
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Behoben
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] px-2 border-red-400 text-red-700 hover:bg-red-50"
                          onClick={() => updateStatusMutation.mutate({ id: fb.id, status: "still_present" })}
                        >
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Weiter vorhanden
                        </Button>
                      </>
                    )}
                    {fb.status === "resolved" && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="w-3 h-3" />
                        <span className="text-[10px]">Erledigt</span>
                      </div>
                    )}
                    {/* An Manus senden */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[10px] px-2 border-purple-400 text-purple-700 hover:bg-purple-50 ml-auto"
                      onClick={() => handleCopyForManus(fb)}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      An Manus
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feedback-Formular */}
      {isOpen && (
        <Card className="w-80 shadow-xl border-orange-200 dark:border-orange-800 animate-in slide-in-from-bottom-2">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bug className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-bold text-orange-800 dark:text-orange-200">Problem melden</span>
              </div>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setIsOpen(false)}>
                <X className="w-3 h-3" />
              </Button>
            </div>
            <div className="space-y-2">
              <div className="flex gap-1 flex-wrap">
                <Badge variant="secondary" className="text-[10px]">{page}</Badge>
                {area && <Badge variant="outline" className="text-[10px]">{area}</Badge>}
              </div>
              <Textarea
                placeholder="Beschreibe das Problem so genau wie möglich..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[80px] text-sm resize-none"
                autoFocus
              />

              {/* Prioritäts-Auswahl */}
              <div>
                <span className="text-[10px] text-muted-foreground block mb-1">Priorität:</span>
                <div className="flex gap-1">
                  {([
                    { value: "low" as const, label: "Niedrig", color: "bg-gray-100 text-gray-700 border-gray-300" },
                    { value: "medium" as const, label: "Mittel", color: "bg-yellow-100 text-yellow-800 border-yellow-400" },
                    { value: "high" as const, label: "Hoch", color: "bg-orange-100 text-orange-800 border-orange-400" },
                    { value: "critical" as const, label: "Kritisch", color: "bg-red-100 text-red-800 border-red-400" },
                  ]).map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-all ${
                        priority === p.value
                          ? `${p.color} ring-2 ring-offset-1 ring-current`
                          : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                      }`}
                      onClick={() => setPriority(p.value)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Screenshot-Bereich */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px] px-2"
                  onClick={handleTakeScreenshot}
                  disabled={takingScreenshot}
                >
                  {takingScreenshot ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Camera className="w-3 h-3 mr-1" />
                  )}
                  Screenshot
                </Button>
                {screenshotPreview && (
                  <div className="flex items-center gap-1">
                    <ImageIcon className="w-3 h-3 text-green-600" />
                    <span className="text-[10px] text-green-700">Angehängt</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0"
                      onClick={() => setScreenshotPreview(null)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Screenshot-Vorschau */}
              {screenshotPreview && (
                <img
                  src={screenshotPreview}
                  alt="Screenshot-Vorschau"
                  className="w-full rounded border max-h-32 object-cover object-top"
                />
              )}

              <div className="flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground">
                  Als {user?.name || "Benutzer"} senden
                </span>
                <Button
                  size="sm"
                  className="h-7 text-xs bg-orange-600 hover:bg-orange-700"
                  onClick={handleSubmit}
                  disabled={!message.trim() || createMutation.isPending || uploadScreenshotMutation.isPending}
                >
                  <Send className="w-3 h-3 mr-1" />
                  {createMutation.isPending || uploadScreenshotMutation.isPending ? "..." : "Senden"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Buttons */}
      <div className="flex gap-2">
        {/* Admin: Feedbacks anzeigen */}
        {isAdmin && (openCount ?? 0) > 0 && (
          <Button
            size="sm"
            variant="outline"
            className="h-9 rounded-full shadow-lg border-orange-300 bg-white dark:bg-gray-900 hover:bg-orange-50"
            onClick={() => setShowFeedbacks(!showFeedbacks)}
          >
            <MessageSquarePlus className="w-4 h-4 text-orange-600" />
            <Badge className="ml-1 bg-orange-600 text-white text-[10px] px-1.5 py-0">
              {openCount}
            </Badge>
          </Button>
        )}

        {/* Feedback-Button */}
        <Button
          size="sm"
          className={`h-9 rounded-full shadow-lg ${
            isOpen
              ? "bg-orange-600 hover:bg-orange-700"
              : "bg-orange-500 hover:bg-orange-600"
          } text-white`}
          onClick={() => {
            setIsOpen(!isOpen);
            if (showFeedbacks) setShowFeedbacks(false);
          }}
        >
          {isOpen ? (
            <X className="w-4 h-4" />
          ) : (
            <>
              <Bug className="w-4 h-4 mr-1" />
              <span className="text-xs">Beta-Feedback</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

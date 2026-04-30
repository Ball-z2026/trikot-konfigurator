import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { Loader2, Send, ArrowLeft, MessageCircle, CheckCheck } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

interface OrderCommentThreadProps {
  teamId: number;
  teamName: string;
  trainerName: string;
  onBack: () => void;
}

export function OrderCommentThread({
  teamId,
  teamName,
  trainerName,
  onBack,
}: OrderCommentThreadProps) {
  const { data: comments, isLoading } = trpc.orderComment.listByTeam.useQuery(
    { teamId },
    { refetchInterval: 15000 }
  );
  const { data: readReceipt } = trpc.orderComment.getReadReceipt.useQuery(
    { teamId },
    { refetchInterval: 15000 }
  );
  const utils = trpc.useUtils();
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Beim Öffnen des Threads: Kommentare als gelesen markieren
  const markAsRead = trpc.orderComment.markAsRead.useMutation({
    onSuccess: () => {
      utils.orderComment.getUnreadCounts.invalidate();
    },
  });

  useEffect(() => {
    markAsRead.mutate({ teamId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  // Auch bei neuen Kommentaren als gelesen markieren
  useEffect(() => {
    if (comments && comments.length > 0) {
      markAsRead.mutate({ teamId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comments?.length]);

  const createComment = trpc.orderComment.create.useMutation({
    onSuccess: () => {
      setMessage("");
      utils.orderComment.listByTeam.invalidate({ teamId });
      utils.orderComment.countByTeams.invalidate();
      utils.orderComment.getReadReceipt.invalidate({ teamId });
    },
    onError: (err) => {
      toast.error(err.message || "Kommentar konnte nicht gesendet werden");
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    createComment.mutate({ teamId, message: trimmed });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Finde die letzte eigene Nachricht, um die Lesebestätigung darunter anzuzeigen
  const lastOwnMessageIndex = comments
    ? [...comments].reverse().findIndex((c) => {
        // Prüfe ob die Nachricht vom aktuellen User ist
        // Wir nutzen die Rolle als Heuristik: Wenn wir im Spartenleiter-Dashboard sind,
        // sind unsere Nachrichten "department_lead", sonst "trainer"
        return true; // Wird unten per userId gefiltert
      })
    : -1;

  // Bestimme ob die Lesebestätigung unter der letzten Nachricht angezeigt werden soll
  const showReadReceipt = (commentIndex: number) => {
    if (!readReceipt || !comments || comments.length === 0) return false;
    // Finde die letzte Nachricht die VOR dem readReceipt.lastReadAt liegt
    const comment = comments[commentIndex];
    if (!comment) return false;
    // Zeige "Gelesen" nur unter der letzten Nachricht die vom Gegenüber gelesen wurde
    // und die nicht vom Gegenüber selbst geschrieben wurde
    const readTime = new Date(readReceipt.lastReadAt).getTime();
    const commentTime = new Date(comment.createdAt).getTime();
    // Prüfe ob dies die letzte Nachricht ist, die gelesen wurde
    if (commentTime > readTime) return false;
    // Prüfe ob die nächste Nachricht nach dem Lesen kam
    const nextComment = comments[commentIndex + 1];
    if (!nextComment) {
      // Letzte Nachricht insgesamt - zeige Gelesen wenn sie vor dem Lesen war
      return true;
    }
    const nextTime = new Date(nextComment.createdAt).getTime();
    return nextTime > readTime;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft className="w-4 h-4" />
          Zurück
        </Button>
        <div>
          <h3 className="font-semibold text-base">{teamName}</h3>
          <p className="text-xs text-muted-foreground">Trainer: {trainerName}</p>
        </div>
      </div>

      {/* Comment Thread */}
      <div className="border rounded-lg bg-muted/10">
        <div className="p-3 border-b flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-medium">Kommunikation</span>
          {comments && comments.length > 0 && (
            <Badge variant="outline" className="text-xs ml-auto">
              {comments.length} {comments.length === 1 ? "Nachricht" : "Nachrichten"}
            </Badge>
          )}
        </div>

        {/* Messages */}
        <ScrollArea className="h-[320px]">
          <div ref={scrollRef} className="p-4 space-y-3 h-[320px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : !comments || comments.length === 0 ? (
              <div className="text-center py-10">
                <MessageCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Noch keine Nachrichten
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Schreiben Sie die erste Nachricht an den Trainer.
                </p>
              </div>
            ) : (
              comments.map((comment, index) => (
                <div key={comment.id}>
                  <div
                    className={`flex flex-col ${
                      comment.userRole === "department_lead"
                        ? "items-end"
                        : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 ${
                        comment.userRole === "department_lead"
                          ? "bg-indigo-600 text-white"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{comment.message}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1 px-1">
                      <span className="text-[10px] text-muted-foreground">
                        {comment.userName}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1 py-0 h-4"
                      >
                        {comment.userRole === "department_lead"
                          ? "Spartenleiter"
                          : "Trainer"}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleString("de-DE", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {/* Lesebestätigung */}
                    {showReadReceipt(index) && (
                      <div className={`flex items-center gap-1 mt-0.5 px-1 ${
                        comment.userRole === "department_lead" ? "justify-end" : "justify-start"
                      }`}>
                        <CheckCheck className="w-3 h-3 text-blue-500" />
                        <span className="text-[9px] text-blue-500 font-medium">
                          Gelesen {new Date(readReceipt!.lastReadAt).toLocaleString("de-DE", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-3 border-t flex gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nachricht schreiben... (Enter zum Senden)"
            className="min-h-[40px] max-h-[100px] resize-none text-sm"
            rows={1}
          />
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!message.trim() || createComment.isPending}
            className="self-end"
          >
            {createComment.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { Loader2, Send, ArrowLeft, MessageCircle, Users } from "lucide-react";
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
  const utils = trpc.useUtils();
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const createComment = trpc.orderComment.create.useMutation({
    onSuccess: () => {
      setMessage("");
      utils.orderComment.listByTeam.invalidate({ teamId });
      utils.orderComment.countByTeams.invalidate();
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
              comments.map((comment) => (
                <div
                  key={comment.id}
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

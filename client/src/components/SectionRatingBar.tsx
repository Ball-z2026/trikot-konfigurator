import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ThumbsDown, ThumbsUp, Star, Lock } from "lucide-react";
import { toast } from "sonner";

interface SectionRatingBarProps {
  sectionId: string;
  label?: string;
}

const RATING_CONFIG = {
  bad: {
    icon: ThumbsDown,
    label: "Funktioniert nicht",
    color: "bg-red-500",
    hoverColor: "hover:bg-red-600",
    textColor: "text-red-600",
    borderColor: "border-red-300",
    bgLight: "bg-red-50",
  },
  good: {
    icon: ThumbsUp,
    label: "Gut",
    color: "bg-yellow-500",
    hoverColor: "hover:bg-yellow-600",
    textColor: "text-yellow-600",
    borderColor: "border-yellow-300",
    bgLight: "bg-yellow-50",
  },
  excellent: {
    icon: Star,
    label: "Hervorragend",
    color: "bg-green-500",
    hoverColor: "hover:bg-green-600",
    textColor: "text-green-600",
    borderColor: "border-green-300",
    bgLight: "bg-green-50",
  },
} as const;

type RatingValue = keyof typeof RATING_CONFIG;

export function SectionRatingBar({ sectionId, label }: SectionRatingBarProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");

  const { data: rating, isLoading } = trpc.sectionRating.get.useQuery(
    { sectionId },
    { enabled: !!user }
  );
  const utils = trpc.useUtils();

  const upsertMutation = trpc.sectionRating.upsert.useMutation({
    onSuccess: (data) => {
      utils.sectionRating.get.invalidate({ sectionId });
      utils.sectionRating.list.invalidate();
      const config = RATING_CONFIG[data.rating as RatingValue];
      toast.success(`Bereich als "${config.label}" bewertet`);
      setShowComment(false);
      setComment("");
    },
    onError: () => toast.error("Fehler beim Speichern der Bewertung"),
  });

  const handleRate = (newRating: RatingValue) => {
    if (!isAdmin) return;
    // Wenn bereits bewertet und gleicher Wert → nichts tun
    if (rating?.rating === newRating) return;
    if (showComment) {
      upsertMutation.mutate({ sectionId, rating: newRating, comment: comment || undefined });
    } else {
      setShowComment(true);
      // Direkt speichern ohne Kommentar
      upsertMutation.mutate({ sectionId, rating: newRating });
    }
  };

  if (!user || isLoading) return null;

  const currentRating = rating?.rating as RatingValue | undefined;
  const isLocked = currentRating === "excellent" || currentRating === "good";

  return (
    <div className="flex items-center gap-2 py-1.5">
      {label && (
        <span className="text-xs text-muted-foreground mr-1">{label}</span>
      )}

      {/* Status-Anzeige wenn bereits bewertet */}
      {currentRating && (
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${RATING_CONFIG[currentRating].bgLight} ${RATING_CONFIG[currentRating].textColor} border ${RATING_CONFIG[currentRating].borderColor}`}>
          {(() => {
            const Icon = RATING_CONFIG[currentRating].icon;
            return <Icon className="w-3 h-3" />;
          })()}
          <span>{RATING_CONFIG[currentRating].label}</span>
          {isLocked && <Lock className="w-3 h-3 ml-0.5 opacity-60" />}
        </div>
      )}

      {/* Bewertungs-Buttons nur für Admin */}
      {isAdmin && (
        <div className="flex items-center gap-1 ml-auto">
          {(Object.entries(RATING_CONFIG) as [RatingValue, typeof RATING_CONFIG[RatingValue]][]).map(([key, config]) => {
            const Icon = config.icon;
            const isActive = currentRating === key;
            return (
              <button
                key={key}
                onClick={() => handleRate(key)}
                disabled={upsertMutation.isPending}
                className={`p-1.5 rounded-md transition-all ${
                  isActive
                    ? `${config.color} text-white shadow-sm`
                    : `text-muted-foreground hover:${config.textColor} hover:bg-muted`
                }`}
                title={config.label}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            );
          })}
        </div>
      )}

      {/* Kommentar nur anzeigen wenn vorhanden */}
      {rating?.comment && (
        <span className="text-xs text-muted-foreground italic ml-2 truncate max-w-[200px]" title={rating.comment}>
          {rating.comment}
        </span>
      )}
    </div>
  );
}

/**
 * Kompakte Version für Tab-Header
 */
export function SectionRatingDot({ sectionId }: { sectionId: string }) {
  const { user } = useAuth();
  const { data: rating } = trpc.sectionRating.get.useQuery(
    { sectionId },
    { enabled: !!user }
  );

  if (!rating) return null;

  const colors = {
    bad: "bg-red-500",
    good: "bg-yellow-500",
    excellent: "bg-green-500",
  };

  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ml-1.5 ${colors[rating.rating as RatingValue]}`}
      title={RATING_CONFIG[rating.rating as RatingValue]?.label}
    />
  );
}

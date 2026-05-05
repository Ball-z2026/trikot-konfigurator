import { useState } from "react";
import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Vote, CheckCircle2, BarChart3 } from "lucide-react";
import { toast } from "sonner";

export default function TeamPoll() {
  const { user } = useAuth();
  const [, params] = useRoute("/abstimmung/:pollId");
  const pollId = params?.pollId ? parseInt(params.pollId) : 0;
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const { data: poll, isLoading, refetch } = trpc.templatePoll.results.useQuery(
    { pollId },
    { enabled: !!pollId }
  );

  const { data: hasVoted } = trpc.templatePoll.hasVoted.useQuery(
    { pollId },
    { enabled: !!pollId && !!user }
  );

  const voteMutation = trpc.templatePoll.vote.useMutation({
    onSuccess: () => {
      toast.success("Stimme abgegeben!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleVote = () => {
    if (selectedOption === null) {
      toast.error("Bitte wähle eine Option aus");
      return;
    }
    voteMutation.mutate({ pollId, optionId: selectedOption });
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="container py-8 text-center">
        <p className="text-muted-foreground">Abstimmung nicht gefunden.</p>
      </div>
    );
  }

  const totalVotes = poll.totalVotes || 0;
  const isClosed = poll.poll?.status === "closed";
  const alreadyVoted = hasVoted === true;

  return (
    <div className="container py-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Zurück
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <Vote className="w-5 h-5" />
              {poll.poll?.title}
            </CardTitle>
            <Badge variant={isClosed ? "secondary" : "default"}>
              {isClosed ? "Beendet" : "Aktiv"}
            </Badge>
          </div>
          {poll.poll?.description && (
            <p className="text-muted-foreground text-sm mt-2">{poll.poll.description}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Optionen */}
          {poll.options?.map((option: any) => {
            const optionVotes = option.voteCount || 0;
            const percentage = totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0;
            const isSelected = selectedOption === option.id;
            const showResults = alreadyVoted || isClosed;

            return (
              <div
                key={option.id}
                className={`border rounded-lg p-4 transition-all cursor-pointer ${
                  isSelected ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-primary/50"
                } ${(alreadyVoted || isClosed) ? "cursor-default" : ""}`}
                onClick={() => {
                  if (!alreadyVoted && !isClosed) {
                    setSelectedOption(option.id);
                  }
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {!alreadyVoted && !isClosed && (
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    )}
                    {(alreadyVoted || isClosed) && option.voteCount > 0 && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                    <span className="font-medium">{option.label}</span>
                  </div>
                  {showResults && (
                    <span className="text-sm text-muted-foreground">
                      {option.voteCount} {option.voteCount === 1 ? "Stimme" : "Stimmen"} ({percentage}%)
                    </span>
                  )}
                </div>

                {/* Vorschau-Bild */}
                {option.imageUrl && (
                  <div className="mt-2 mb-3 bg-muted rounded p-2 flex justify-center">
                    <img 
                      src={option.imageUrl} 
                      alt={option.label} 
                      className="max-h-[200px] object-contain rounded"
                    />
                  </div>
                )}

                {showResults && (
                  <Progress value={percentage} className="h-2 mt-2" />
                )}
              </div>
            );
          })}

          {/* Abstimmen-Button */}
          {!alreadyVoted && !isClosed && (
            <Button
              onClick={handleVote}
              className="w-full mt-4"
              disabled={selectedOption === null || voteMutation.isPending}
            >
              <Vote className="w-4 h-4 mr-2" /> Abstimmen
            </Button>
          )}

          {/* Status-Hinweise */}
          {alreadyVoted && !isClosed && (
            <div className="text-center text-sm text-green-600 flex items-center justify-center gap-2 mt-4">
              <CheckCircle2 className="w-4 h-4" /> Du hast bereits abgestimmt
            </div>
          )}

          {isClosed && (
            <div className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2 mt-4">
              <BarChart3 className="w-4 h-4" /> Abstimmung beendet · {totalVotes} Stimmen insgesamt
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

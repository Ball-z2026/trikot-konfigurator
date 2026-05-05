import { useState } from "react";
import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, X, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function ApprovalReview() {
  const { user } = useAuth();
  const [, params] = useRoute("/freigabe/:orgId");
  const orgId = params?.orgId ? parseInt(params.orgId) : 0;
  const [comment, setComment] = useState("");

  const { data: pendingApprovals, isLoading, refetch } = trpc.templateApproval.pendingForMe.useQuery(
    { orgId },
    { enabled: !!orgId && !!user }
  );

  const decideMutation = trpc.templateApproval.decide.useMutation({
    onSuccess: () => {
      toast.success("Entscheidung gespeichert");
      refetch();
      setComment("");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleDecide = (approvalId: number, decision: "approved" | "rejected") => {
    decideMutation.mutate({ approvalId, decision, comment: comment || undefined });
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/verwaltung/org/${orgId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Zurück
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Freigabe-Anfragen</h1>
        {pendingApprovals && pendingApprovals.length > 0 && (
          <Badge variant="destructive">{pendingApprovals.length} offen</Badge>
        )}
      </div>

      {!pendingApprovals || pendingApprovals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Check className="w-12 h-12 mx-auto mb-3 text-green-500" />
            <p className="text-lg font-medium">Keine offenen Freigabe-Anfragen</p>
            <p className="text-sm mt-1">Alle Vorlagen sind bereits bearbeitet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingApprovals.map((approval: any) => (
            <Card key={approval.id} className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {approval.templateName || `Vorlage #${approval.templateId}`}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-amber-600">
                      <Clock className="w-3 h-3 mr-1" /> Ausstehend
                    </Badge>
                    <Badge variant="secondary">
                      {approval.approverRole === "department_lead" ? "Spartenleiter" : 
                       approval.approverRole === "owner" ? "Vereinsleitung" : "Sponsor"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Vorschau-Bild */}
                  <div className="bg-muted rounded-lg p-2 flex items-center justify-center min-h-[200px]">
                    {approval.templateImageUrl ? (
                      <img 
                        src={approval.templateImageUrl} 
                        alt="Vorlagen-Vorschau" 
                        className="max-h-[250px] object-contain rounded"
                      />
                    ) : (
                      <div className="text-muted-foreground text-sm">Keine Vorschau verfügbar</div>
                    )}
                  </div>

                  {/* Details + Aktionen */}
                  <div className="space-y-3">
                    <div className="text-sm space-y-1">
                      <p><span className="font-medium">Erstellt von:</span> {approval.createdByName || "Unbekannt"}</p>
                      <p><span className="font-medium">Datum:</span> {new Date(approval.createdAt).toLocaleDateString("de-DE")}</p>
                      {approval.templateDescription && (
                        <p><span className="font-medium">Beschreibung:</span> {approval.templateDescription}</p>
                      )}
                    </div>

                    <Textarea
                      placeholder="Kommentar (optional)..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="text-sm"
                      rows={3}
                    />

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleDecide(approval.id, "approved")}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        disabled={decideMutation.isPending}
                      >
                        <Check className="w-4 h-4 mr-1" /> Freigeben
                      </Button>
                      <Button
                        onClick={() => handleDecide(approval.id, "rejected")}
                        variant="destructive"
                        className="flex-1"
                        disabled={decideMutation.isPending}
                      >
                        <X className="w-4 h-4 mr-1" /> Ablehnen
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

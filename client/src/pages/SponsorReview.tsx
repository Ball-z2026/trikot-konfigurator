import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, XCircle, Loader2, ClipboardCheck, AlertTriangle, FileText } from "lucide-react";
import { useState } from "react";
import { useParams } from "wouter";
import PdfPreview from "@/components/PdfPreview";

function storageUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("/manus-storage/") || url.startsWith("http")) return url;
  return `/manus-storage/${url}`;
}

export default function SponsorReview() {
  const { token } = useParams<{ token: string }>();
  const [reviewNote, setReviewNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null);

  const { data, isLoading, error } = trpc.mockupApproval.getByToken.useQuery(
    { token: token || "" },
    { enabled: !!token }
  );

  const reviewMutation = trpc.mockupApproval.review.useMutation({
    onSuccess: (_, vars) => {
      setSubmitted(true);
      setDecision(vars.status);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold mb-2">Freigabe-Link ungültig</h2>
            <p className="text-muted-foreground text-sm">
              Dieser Freigabe-Link ist ungültig oder abgelaufen. Bitte kontaktieren Sie den Verein für einen neuen Link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Already reviewed or just submitted
  if (submitted || data.approval.status !== "pending") {
    const finalStatus = decision || data.approval.status;
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            {finalStatus === "approved" ? (
              <>
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-green-700 mb-2">Freigabe erteilt</h2>
                <p className="text-muted-foreground">
                  Vielen Dank! Das Mockup wurde erfolgreich freigegeben.
                </p>
              </>
            ) : (
              <>
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-red-700 mb-2">Freigabe abgelehnt</h2>
                <p className="text-muted-foreground">
                  Das Mockup wurde abgelehnt. Der Verein wird benachrichtigt.
                </p>
              </>
            )}
            {(data.approval.reviewNote || reviewNote) && (
              <div className="mt-4 p-3 bg-muted rounded-lg text-sm text-left">
                <p className="font-medium mb-1">Anmerkung:</p>
                <p>{data.approval.reviewNote || reviewNote}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center pt-8">
          <ClipboardCheck className="w-12 h-12 text-amber-600 mx-auto mb-3" />
          <h1 className="text-2xl font-bold">Mockup-Freigabe</h1>
          <p className="text-muted-foreground mt-1">
            Bitte prüfen Sie das folgende Mockup und erteilen oder verweigern Sie die Freigabe.
          </p>
        </div>

        {/* Sponsor Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Sponsor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {data.sponsor.logoUrl && (
                (data.sponsor.logoMimeType === 'application/pdf' || data.sponsor.logoUrl?.toLowerCase().endsWith('.pdf')) ? (
                  <div className="w-16 h-16 flex items-center justify-center rounded border p-1">
                    <PdfPreview url={storageUrl(data.sponsor.logoUrl)} width={56} height={56} />
                  </div>
                ) : (
                  <img
                    src={storageUrl(data.sponsor.logoUrl)}
                    alt={data.sponsor.name}
                    className="w-16 h-16 object-contain rounded border p-1"
                  />
                )
              )}
              <div>
                <p className="font-semibold text-lg">{data.sponsor.name}</p>
                <Badge variant="secondary" className="text-xs mt-1">
                  {data.sponsor.sponsorType === "hauptsponsor" ? "Hauptsponsor" :
                   data.sponsor.sponsorType === "spartensponsor" ? "Spartensponsor" :
                   "Mannschaftssponsor"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mockup Preview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Mockup</CardTitle>
            <CardDescription>
              {data.mockup.title || "KI-Mockup"} &bull;{" "}
              {data.mockup.side === "front" ? "Vorderseite" : "Rückseite"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg overflow-hidden border">
              <img
                src={storageUrl(data.mockup.imageUrl)}
                alt={data.mockup.title || "KI-Mockup"}
                className="w-full max-h-[500px] object-contain"
              />
            </div>
          </CardContent>
        </Card>

        {/* Review Form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Ihre Entscheidung</CardTitle>
            <CardDescription>
              Bitte prüfen Sie, ob Ihr Logo korrekt platziert und dargestellt ist.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Anmerkung (optional)</Label>
              <Textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="z.B. Logo bitte etwas größer, Farbe anpassen..."
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                disabled={reviewMutation.isPending}
                onClick={() => {
                  const name = prompt("Bitte geben Sie Ihren Namen ein:");
                  if (!name) return;
                  reviewMutation.mutate({
                    token: token || "",
                    status: "approved",
                    reviewedBy: name,
                    reviewNote: reviewNote || undefined,
                  });
                }}
              >
                {reviewMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                Freigabe erteilen
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={reviewMutation.isPending}
                onClick={() => {
                  const name = prompt("Bitte geben Sie Ihren Namen ein:");
                  if (!name) return;
                  reviewMutation.mutate({
                    token: token || "",
                    status: "rejected",
                    reviewedBy: name,
                    reviewNote: reviewNote || undefined,
                  });
                }}
              >
                {reviewMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2" />
                )}
                Ablehnen
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

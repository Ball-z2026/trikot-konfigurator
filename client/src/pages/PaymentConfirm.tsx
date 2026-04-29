import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "wouter";

export default function PaymentConfirm() {
  const params = useParams<{ token?: string }>();
  const token = params.token || "";
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [paymentType, setPaymentType] = useState<string>("");

  const confirmMutation = trpc.payment.confirm.useMutation({
    onSuccess: (data) => {
      setStatus("success");
      setPaymentType(data.paymentType);
    },
    onError: () => {
      setStatus("error");
    },
  });

  useEffect(() => {
    if (token) {
      confirmMutation.mutate({ token });
    } else {
      setStatus("error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          {status === "loading" && (
            <>
              <Loader2 className="w-12 h-12 animate-spin text-muted-foreground mx-auto mb-4" />
              <CardTitle>Bestätigung wird verarbeitet...</CardTitle>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-green-800">Zahlung bestätigt!</CardTitle>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <CardTitle className="text-red-800">Bestätigung fehlgeschlagen</CardTitle>
            </>
          )}
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === "success" && (
            <>
              <p className="text-muted-foreground">
                {paymentType === "club"
                  ? "Die Kostenübernahme durch den Verein wurde erfolgreich bestätigt."
                  : "Die Kostenübernahme durch den Sponsor wurde erfolgreich bestätigt."}
              </p>
              <p className="text-sm text-muted-foreground">
                Der Trainer wird über die Bestätigung informiert.
              </p>
            </>
          )}
          {status === "error" && (
            <>
              <p className="text-muted-foreground">
                Der Bestätigungslink ist ungültig oder wurde bereits verwendet.
              </p>
              <p className="text-sm text-muted-foreground">
                Bitte wenden Sie sich an den Trainer für einen neuen Link.
              </p>
            </>
          )}
          <Button variant="outline" onClick={() => (window.location.href = "/")}>
            Zur Startseite
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

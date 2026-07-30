import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * 3D-Trikot-Konfigurator (echtes 3D-Modell, zonengenaue Schnittteile, Druckdaten-Export).
 *
 * Der eigentliche Konfigurator ist ein eigenständiges Modul unter
 * /konfigurator/index.html und wird hier same-origin eingebettet. Diese Seite
 * verbindet ihn über die window.ballz-API mit der Vereinsverwaltung:
 *
 *  - Vereinsfarben  -> Startdesign (Zonenfarben)
 *  - Standard-Wappen -> clubCrest (fest auf der Herzseite, ORIGINAL, nicht abwählbar)
 *  - Standard-Schrift der Abteilung -> Trikotschrift
 *  - Koordinaten aus der Vereinsadresse -> Map Edition
 *  - Vereins-Sponsoren -> Sponsor-Slots (Brust, Rücken, Ärmel)
 *  - Straßenkarte (Backend Maps-API) -> Karten-Watermark
 */

/** ballz-API des eingebetteten Konfigurators (Auszug) */
type BallzApi = {
  setLogo: (slot: string, url: string) => void;
  toggleLogo: (slot: string, on: boolean) => void;
  setPlayer: (name: string, number: string | number) => void;
  setZone: (zone: string, patch: { color?: string; color2?: string; pattern?: string }) => void;
  setFont: (key: string) => void;
  setVenue: (coords: string, on?: boolean) => void;
  setMapStyle: (opts: { alpha?: number; dx?: number; dy?: number }) => void;
  setCrestWatermark: (on: boolean, alpha?: number) => void;
  getState: () => any;
};

/** Dezimalgrad -> "N 53°17'37"  ·  E 9°58'54"" (Format der Map Edition) */
function toDms(lat: number, lng: number): string {
  const dms = (v: number) => {
    const a = Math.abs(v);
    const d = Math.floor(a);
    const m = Math.floor((a - d) * 60);
    const s = Math.round(((a - d) * 60 - m) * 60);
    return `${d}°${m}'${s}"`;
  };
  return `${lat >= 0 ? "N" : "S"} ${dms(lat)}  ·  ${lng >= 0 ? "E" : "W"} ${dms(lng)}`;
}

/** Vereins-Schrift (Google-Font-Name) auf die Trikotschrift-Klassen des Viewers mappen */
function mapFont(fontFamily: string | null | undefined): string {
  if (!fontFamily) return "sport";
  const f = fontFamily.toLowerCase();
  if (/oswald|teko|saira|rajdhani|narrow|condensed/.test(f)) return "schmal";
  if (/bebas|anton|black ops|impact/.test(f)) return "block";
  if (/georgia|times|serif/.test(f)) return "klassisch";
  if (/rounded|comfortaa|baloo/.test(f)) return "rund";
  return "sport";
}

/** Bild-URL als Data-URL laden (umgeht CORS-Probleme bei Canvas-Texturen) */
async function urlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Logo-Download fehlgeschlagen (${res.status})`);
  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

export default function Konfigurator3D() {
  const { user } = useAuth();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const appliedRef = useRef(false);
  const [status, setStatus] = useState<"laden" | "verbunden" | "ohne-verein">("laden");

  // Vereinsdaten wie im KI-Design: Membership -> Org -> Wappen/Schrift/Sponsoren
  const { data: memberships } = trpc.membership.mine.useQuery(undefined, { enabled: !!user });
  const orgId = memberships?.[0]?.orgId || 0;
  const deptId = memberships?.[0]?.departmentId || 0;
  const { data: org } = trpc.org.getById.useQuery({ id: orgId }, { enabled: orgId > 0 });
  const { data: defaultLogo } = trpc.orgLogo.getDefault.useQuery({ orgId }, { enabled: orgId > 0 });
  const { data: defaultFont } = trpc.deptFont.getDefault.useQuery(
    { departmentId: deptId },
    { enabled: deptId > 0 },
  );
  const { data: sponsors } = trpc.sponsorTemplate.list.useQuery({ orgId }, { enabled: orgId > 0 });
  const generateStreetMap = trpc.mockup.generateStreetMap.useMutation();

  /** ballz-API im (same-origin) iframe abholen, sobald das 3D-Modell geladen ist */
  function getBallz(): BallzApi | null {
    const w = iframeRef.current?.contentWindow as any;
    return w && w.__READY__ === true && w.ballz ? (w.ballz as BallzApi) : null;
  }

  // Vereinsdaten in den Konfigurator schieben, sobald iframe UND Daten bereit sind
  useEffect(() => {
    if (appliedRef.current) return;
    if (!org) {
      if (user && memberships && memberships.length === 0) setStatus("ohne-verein");
      return;
    }
    let cancelled = false;
    const timer = setInterval(async () => {
      const ballz = getBallz();
      if (!ballz || cancelled) return;
      clearInterval(timer);
      appliedRef.current = true;

      try {
        // 1. Vereinsfarben als Startdesign (Hauptfarbe Körper, Zweitfarbe Kragen/Bündchen)
        if (org.primaryColor) {
          for (const z of ["front", "back", "sleeve_l", "sleeve_r"]) {
            ballz.setZone(z, { color: org.primaryColor, color2: org.secondaryColor || "#ffffff" });
          }
        }
        if (org.secondaryColor) {
          ballz.setZone("collar", { color: org.secondaryColor });
          ballz.setZone("cuff", { color: org.secondaryColor });
        }

        // 2. Vereinsname auf dem Trikot (jerseyName hat Vorrang vor dem offiziellen Namen)
        ballz.setPlayer(org.jerseyName || org.name || "", "");

        // 3. Wappen: IMMER das Original aus der Vereinsverwaltung, fest auf der Herzseite.
        //    Niemand außer dem Vereinsmanager kann es setzen oder ersetzen.
        if (defaultLogo?.imageUrl) {
          try {
            ballz.setLogo("clubCrest", await urlToDataUrl(defaultLogo.imageUrl));
          } catch {
            ballz.setLogo("clubCrest", defaultLogo.imageUrl); // Fallback: Viewer lädt mit CORS
          }
        }

        // 4. Standard-Schrift der Abteilung
        if (defaultFont?.fontFamily) ballz.setFont(mapFont(defaultFont.fontFamily));

        // 5. Koordinaten der Spielstätte (automatisch aus der Vereinsadresse berechnet)
        if (org.latitude != null && org.longitude != null) {
          ballz.setVenue(toDms(org.latitude, org.longitude), true);
        }

        // 6. Sponsoren aus der Vereinsverwaltung in die festen Slots
        const active = (sponsors || []).filter(
          (s: any) => s.obligation === "alle_produkte" || s.obligation === "nur_trikot",
        );
        const slots = ["mainSponsor", "backSponsor", "sleeveSponsorL", "sleeveSponsorR"];
        for (let i = 0; i < Math.min(active.length, slots.length); i++) {
          try {
            ballz.setLogo(slots[i], await urlToDataUrl(active[i].logoUrl));
          } catch {
            ballz.setLogo(slots[i], active[i].logoUrl);
          }
        }

        setStatus("verbunden");
      } catch (e) {
        console.error("Konfigurator3D: Vereinsdaten konnten nicht angewendet werden", e);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [org, defaultLogo, defaultFont, sponsors, user, memberships]);

  /** Echte Straßenkarte der Spielstätte generieren und als Karten-Watermark setzen */
  async function handleStreetMap() {
    const ballz = getBallz();
    if (!ballz) return;
    if (!org?.street || !org?.city) {
      toast.error("Keine Vereinsadresse hinterlegt. Bitte zuerst in der Verwaltung eintragen.");
      return;
    }
    const address = `${org.street}, ${org.zip || ""} ${org.city}, ${org.country || "Deutschland"}`;
    try {
      toast.info("Generiere Straßenkarte …");
      const result = await generateStreetMap.mutateAsync({ address });
      const w = iframeRef.current?.contentWindow as any;
      let src = result.url;
      try {
        src = await urlToDataUrl(result.url); // Data-URL vermeidet CORS-Tainting sicher
      } catch {
        /* Viewer lädt dann selbst mit crossOrigin */
      }
      w.__setMapImage(src);
      toast.success("Straßenkarte der Spielstätte gesetzt.");
    } catch (e: any) {
      toast.error("Straßenkarte fehlgeschlagen: " + (e?.message || "unbekannt"));
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center gap-3 border-b bg-background px-4 py-2">
        <h1 className="text-lg font-bold">
          3D-Konfigurator {org ? `· ${org.name}` : ""}
        </h1>
        <span className="text-xs text-muted-foreground">
          {status === "laden" && (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Vereinsdaten werden geladen …
            </span>
          )}
          {status === "verbunden" && "Vereinsdaten aktiv – Wappen, Farben, Schrift & Sponsoren übernommen"}
          {status === "ohne-verein" && "Kein Verein zugeordnet – Demo-Modus"}
        </span>
        <div className="ml-auto">
          <Button size="sm" variant="outline" onClick={handleStreetMap} disabled={!org}>
            <MapPin className="mr-1 h-4 w-4" /> Echte Straßenkarte laden
          </Button>
        </div>
      </div>
      <iframe
        ref={iframeRef}
        src="/konfigurator/index.html?partner=ballz"
        title="ball-z 3D-Trikot-Konfigurator"
        className="w-full flex-1 border-0"
        allow="fullscreen"
      />
    </div>
  );
}

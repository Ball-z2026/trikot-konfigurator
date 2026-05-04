import { useState, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft,
  FileDown,
  Printer,
  Users,
  User,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Download,
  FileText,
  Ruler,
} from "lucide-react";

function storageUrl(url: string) {
  if (!url) return "";
  if (url.startsWith("/manus-storage/")) return url;
  if (url.startsWith("http")) return url;
  return `/manus-storage/${url}`;
}

export default function PrintSheetExport() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [, params] = useRoute("/druckbogen/:orgId/:designId/:teamId");

  const orgId = Number(params?.orgId);
  const designId = Number(params?.designId);
  const teamId = Number(params?.teamId);

  const [selectedPlayers, setSelectedPlayers] = useState<Set<number>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [generatedResults, setGeneratedResults] = useState<any[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Daten laden
  const { data: org } = trpc.org.getById.useQuery({ id: orgId }, { enabled: !!orgId });
  const { data: design } = trpc.savedDesign.get.useQuery({ id: designId }, { enabled: !!designId });
  const { data: team } = trpc.team.getById.useQuery({ id: teamId, orgId }, { enabled: !!teamId && !!orgId });
  const { data: players = [] } = trpc.player.listByTeam.useQuery({ teamId, orgId }, { enabled: !!teamId && !!orgId });

  // Mutations
  const generateForPlayer = trpc.printSheet.generateForPlayer.useMutation();
  const generateForTeam = trpc.printSheet.generateForTeam.useMutation();

  // Spieler-Auswahl
  const togglePlayer = (playerId: number) => {
    setSelectedPlayers((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) {
        next.delete(playerId);
      } else {
        next.add(playerId);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedPlayers.size === players.length) {
      setSelectedPlayers(new Set());
    } else {
      setSelectedPlayers(new Set(players.map((p: any) => p.id)));
    }
  };

  // Druckbögen für ausgewählte Spieler generieren
  const handleGenerateSelected = async () => {
    if (selectedPlayers.size === 0) {
      toast.error("Bitte mindestens einen Spieler auswählen");
      return;
    }

    setGenerating(true);
    setGeneratedResults([]);
    setProgress({ current: 0, total: selectedPlayers.size });

    const results: any[] = [];
    let current = 0;

    for (const playerId of selectedPlayers) {
      try {
        const result = await generateForPlayer.mutateAsync({
          designId,
          playerId,
          orgId,
        });
        results.push(result);
      } catch (err: any) {
        const player = players.find((p: any) => p.id === playerId);
        results.push({
          player: { id: playerId, name: player?.name || "Unbekannt", number: player?.number, size: player?.size || "L" },
          sheets: [],
          error: err.message,
        });
      }
      current++;
      setProgress({ current, total: selectedPlayers.size });
    }

    setGeneratedResults(results);
    setGenerating(false);

    const successCount = results.filter((r) => r.sheets && r.sheets.length > 0).length;
    if (successCount > 0) {
      toast.success(`${successCount} von ${selectedPlayers.size} Spieler-Druckbögen erfolgreich generiert`);
    } else {
      toast.error("Keine Druckbögen konnten generiert werden");
    }
  };

  // Ganzes Team generieren
  const handleGenerateTeam = async () => {
    setGenerating(true);
    setGeneratedResults([]);
    setProgress({ current: 0, total: players.length });

    try {
      const result = await generateForTeam.mutateAsync({
        designId,
        teamId,
        orgId,
      });

      setGeneratedResults(result.results);
      setProgress({ current: result.totalPlayers, total: result.totalPlayers });
      toast.success(`${result.successCount} von ${result.totalPlayers} Druckbögen generiert`);
    } catch (err: any) {
      toast.error(err.message || "Fehler bei der Generierung");
    }

    setGenerating(false);
  };

  // Größen-Statistik
  const sizeStats = useMemo(() => {
    const stats: Record<string, number> = {};
    for (const player of players) {
      const size = (player as any).size || "L";
      stats[size] = (stats[size] || 0) + 1;
    }
    return stats;
  }, [players]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Bitte einloggen</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1 as any)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Printer className="w-5 h-5" />
                Druckbogen-Export
              </h1>
              <p className="text-sm text-muted-foreground">
                {org?.name} – {team?.name} – Design: {design?.name || `#${designId}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-6 space-y-6">
        {/* Übersicht */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{players.length}</p>
                  <p className="text-sm text-muted-foreground">Spieler im Team</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Ruler className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{Object.keys(sizeStats).length}</p>
                  <p className="text-sm text-muted-foreground">Verschiedene Größen</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {Object.entries(sizeStats).map(([size, count]) => (
                  <Badge key={size} variant="secondary" className="text-xs">
                    {size}: {count}x
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{players.length * 4}</p>
                  <p className="text-sm text-muted-foreground">Max. Druckbögen (4 pro Spieler)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Spieler-Auswahl */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Spieler auswählen</CardTitle>
                <CardDescription>
                  Wählen Sie die Spieler aus, für die Druckbögen generiert werden sollen.
                  Jeder Spieler erhält bis zu 4 Druckbögen (Vorderseite, Rückseite, Ärmel L/R).
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  {selectedPlayers.size === players.length ? "Keine auswählen" : "Alle auswählen"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {players.map((player: any) => (
                <div
                  key={player.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedPlayers.has(player.id) ? "bg-blue-50 border-blue-200" : "hover:bg-muted/50"
                  }`}
                  onClick={() => togglePlayer(player.id)}
                >
                  <Checkbox
                    checked={selectedPlayers.has(player.id)}
                    onCheckedChange={() => togglePlayer(player.id)}
                  />
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="font-mono text-lg font-bold w-10 text-center">
                      {player.number || "–"}
                    </span>
                    <span className="font-medium truncate">{player.name}</span>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {player.size || "L"}
                  </Badge>
                  {/* Generierungsstatus */}
                  {generatedResults.find((r) => r.player?.id === player.id) && (
                    <>
                      {generatedResults.find((r) => r.player?.id === player.id)?.sheets?.length > 0 ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Aktionen */}
        <div className="flex gap-3">
          <Button
            onClick={handleGenerateSelected}
            disabled={generating || selectedPlayers.size === 0}
            className="flex-1"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generiere... ({progress.current}/{progress.total})
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 mr-2" />
                Druckbögen für {selectedPlayers.size} Spieler generieren
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={handleGenerateTeam}
            disabled={generating || players.length === 0}
          >
            <Users className="w-4 h-4 mr-2" />
            Ganzes Team
          </Button>
        </div>

        {/* Ergebnisse */}
        {generatedResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Generierte Druckbögen
              </CardTitle>
              <CardDescription>
                {generatedResults.filter((r) => r.sheets?.length > 0).length} von {generatedResults.length} Spielern erfolgreich
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {generatedResults.map((result, idx) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <User className="w-5 h-5 text-muted-foreground" />
                      <span className="font-bold">
                        #{result.player?.number || "–"} {result.player?.name}
                      </span>
                      <Badge variant="outline">{result.player?.size}</Badge>
                      {result.sheets?.length > 0 ? (
                        <Badge className="bg-green-100 text-green-700">
                          {result.sheets.length} Bögen
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Fehler</Badge>
                      )}
                    </div>

                    {result.sheets?.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {result.sheets.map((sheet: any, sIdx: number) => (
                          <a
                            key={sIdx}
                            href={storageUrl(sheet.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 rounded border hover:bg-muted/50 transition-colors text-sm"
                          >
                            <FileText className="w-4 h-4 text-red-500 shrink-0" />
                            <span className="truncate">{sheet.partLabel}</span>
                            <Download className="w-3 h-3 ml-auto shrink-0" />
                          </a>
                        ))}
                      </div>
                    )}

                    {result.error && (
                      <p className="text-sm text-red-500 mt-1">{result.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

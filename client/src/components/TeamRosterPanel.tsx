/**
 * TeamRosterPanel – Mannschaftslisten-Verwaltung im Produktdesigner.
 * Ermöglicht: Mannschaft auswählen, Spieler anzeigen/bearbeiten, CSV-Import,
 * neue Spieler hinzufügen. Die Liste ist wiederverwendbar für alle Produkte.
 */
import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Plus,
  Upload,
  Trash2,
  Edit2,
  Save,
  X,
  FileSpreadsheet,
  UserPlus,
  Check,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// Verfügbare Konfektionsgrößen (Erwachsene + Kinder)
const SIZE_OPTIONS = [
  // Kindergrößen
  { value: "116", label: "116 (Kinder)" },
  { value: "128", label: "128 (Kinder)" },
  { value: "140", label: "140 (Kinder)" },
  { value: "152", label: "152 (Kinder)" },
  { value: "164", label: "164 (Kinder)" },
  { value: "176", label: "176 (Kinder)" },
  // Erwachsenengrößen
  { value: "XS", label: "XS" },
  { value: "S", label: "S" },
  { value: "M", label: "M" },
  { value: "L", label: "L" },
  { value: "XL", label: "XL" },
  { value: "XXL", label: "XXL" },
  { value: "3XL", label: "3XL" },
  { value: "4XL", label: "4XL" },
  { value: "5XL", label: "5XL" },
];

type Player = {
  id: number;
  name: string;
  number: string | null;
  position: string | null;
  size: string | null;
};

type Team = {
  id: number;
  name: string;
  orgId: number;
  departmentId: number;
  category: string | null;
  league: string | null;
};

interface TeamRosterPanelProps {
  /** Aktuell ausgewählte Team-ID (wird nach oben kommuniziert) */
  selectedTeamId: number | null;
  onTeamSelect: (teamId: number | null) => void;
  /** Org-ID des angemeldeten Benutzers */
  orgId: number | null;
}

export default function TeamRosterPanel({
  selectedTeamId,
  onTeamSelect,
  orgId,
}: TeamRosterPanelProps) {
  const utils = trpc.useUtils();

  // ─── Mannschaften laden ────────────────────────────────────────────
  const { data: teams, isLoading: teamsLoading } = trpc.team.listByOrg.useQuery(
    { orgId: orgId! },
    { enabled: !!orgId }
  );

  // ─── Spieler der ausgewählten Mannschaft laden ─────────────────────
  const { data: players, isLoading: playersLoading } = trpc.player.listByTeam.useQuery(
    { teamId: selectedTeamId!, orgId: orgId! },
    { enabled: !!selectedTeamId && !!orgId }
  );

  // ─── Mutations ─────────────────────────────────────────────────────
  const createPlayer = trpc.player.create.useMutation({
    onSuccess: () => {
      utils.player.listByTeam.invalidate({ teamId: selectedTeamId!, orgId: orgId! });
      toast.success("Spieler hinzugefügt");
    },
    onError: (err) => toast.error(err.message),
  });

  const updatePlayer = trpc.player.update.useMutation({
    onSuccess: () => {
      utils.player.listByTeam.invalidate({ teamId: selectedTeamId!, orgId: orgId! });
      toast.success("Spieler aktualisiert");
    },
    onError: (err) => toast.error(err.message),
  });

  const deletePlayer = trpc.player.delete.useMutation({
    onSuccess: () => {
      utils.player.listByTeam.invalidate({ teamId: selectedTeamId!, orgId: orgId! });
      toast.success("Spieler entfernt");
    },
    onError: (err) => toast.error(err.message),
  });

  const importCsv = trpc.player.importCsv.useMutation({
    onSuccess: (data) => {
      utils.player.listByTeam.invalidate({ teamId: selectedTeamId!, orgId: orgId! });
      toast.success(`${data.count} Spieler importiert`);
      setShowImportDialog(false);
    },
    onError: (err) => toast.error(err.message),
  });

  // ─── State ─────────────────────────────────────────────────────────
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);
  const [newPlayer, setNewPlayer] = useState({ name: "", number: "", position: "", size: "" });
  const [editPlayer, setEditPlayer] = useState({ name: "", number: "", position: "", size: "" });
  const [csvData, setCsvData] = useState<Array<{ name: string; number?: string; position?: string; size?: string }>>([]);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── CSV-Import Handler ────────────────────────────────────────────
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter((line) => line.trim());
      if (lines.length < 2) {
        toast.error("Die Datei enthält keine Daten (mindestens Kopfzeile + 1 Zeile erwartet)");
        return;
      }

      // Kopfzeile parsen
      const headers = lines[0].split(/[,;\t]/).map((h) => h.trim().toLowerCase());
      const nameIdx = headers.findIndex((h) => h.includes("name") || h.includes("spieler"));
      const numberIdx = headers.findIndex((h) => h.includes("nummer") || h.includes("number") || h.includes("nr") || h.includes("trikotnummer"));
      const positionIdx = headers.findIndex((h) => h.includes("position") || h.includes("pos"));
      const sizeIdx = headers.findIndex((h) => h.includes("größe") || h.includes("groesse") || h.includes("size") || h.includes("konfektionsgröße"));

      if (nameIdx === -1) {
        toast.error("Spalte 'Name' nicht gefunden. Erwartet: Name, Nummer, Position, Größe");
        return;
      }

      const parsed: Array<{ name: string; number?: string; position?: string; size?: string }> = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(/[,;\t]/).map((c) => c.trim());
        const name = cols[nameIdx];
        if (!name) continue;
        parsed.push({
          name,
          number: numberIdx >= 0 ? cols[numberIdx] || undefined : undefined,
          position: positionIdx >= 0 ? cols[positionIdx] || undefined : undefined,
          size: sizeIdx >= 0 ? cols[sizeIdx] || undefined : undefined,
        });
      }

      if (parsed.length === 0) {
        toast.error("Keine gültigen Spieler in der Datei gefunden");
        return;
      }

      setCsvData(parsed);
      setShowImportDialog(true);
    };
    reader.readAsText(file);
    // Input zurücksetzen
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleImportConfirm = useCallback(() => {
    if (!selectedTeamId || !orgId || csvData.length === 0) return;
    importCsv.mutate({
      teamId: selectedTeamId,
      orgId,
      players: csvData,
      replaceExisting,
    });
  }, [selectedTeamId, orgId, csvData, replaceExisting, importCsv]);

  const handleAddPlayer = useCallback(() => {
    if (!selectedTeamId || !orgId || !newPlayer.name.trim()) return;
    createPlayer.mutate({
      teamId: selectedTeamId,
      orgId,
      name: newPlayer.name.trim(),
      number: newPlayer.number || undefined,
      position: newPlayer.position || undefined,
      size: newPlayer.size || undefined,
    });
    setNewPlayer({ name: "", number: "", position: "", size: "" });
    setShowAddPlayer(false);
  }, [selectedTeamId, orgId, newPlayer, createPlayer]);

  const handleUpdatePlayer = useCallback((playerId: number) => {
    if (!selectedTeamId || !orgId) return;
    updatePlayer.mutate({
      id: playerId,
      teamId: selectedTeamId,
      orgId,
      name: editPlayer.name || undefined,
      number: editPlayer.number || null,
      position: editPlayer.position || null,
      size: editPlayer.size || null,
    });
    setEditingPlayerId(null);
  }, [selectedTeamId, orgId, editPlayer, updatePlayer]);

  const startEdit = (player: Player) => {
    setEditingPlayerId(player.id);
    setEditPlayer({
      name: player.name,
      number: player.number || "",
      position: player.position || "",
      size: player.size || "",
    });
  };

  // ─── Keine Org → Hinweis ──────────────────────────────────────────
  if (!orgId) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Users className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            Bitte melden Sie sich an und wählen Sie einen Verein aus,
            um Mannschaftslisten zu verwalten.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Mannschafts-Auswahl */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="w-4 h-4" />
            Mannschaft auswählen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {teamsLoading ? (
            <div className="text-xs text-muted-foreground">Lade Mannschaften...</div>
          ) : !teams || teams.length === 0 ? (
            <div className="text-xs text-muted-foreground">
              Keine Mannschaften vorhanden. Bitte legen Sie zuerst eine Mannschaft in der Verwaltung an.
            </div>
          ) : (
            <Select
              value={selectedTeamId ? String(selectedTeamId) : ""}
              onValueChange={(val) => onTeamSelect(val ? parseInt(val) : null)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Mannschaft wählen..." />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team: any) => (
                  <SelectItem key={team.id} value={String(team.id)}>
                    <div className="flex items-center gap-2">
                      <span>{team.name}</span>
                      {team.category && (
                        <Badge variant="outline" className="text-[10px] h-4">
                          {team.category}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* Spielerliste */}
      {selectedTeamId && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4" />
                Spielerliste
                {players && (
                  <Badge variant="secondary" className="text-[10px] h-4 ml-1">
                    {players.length} Spieler
                  </Badge>
                )}
              </CardTitle>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  title="CSV importieren"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  title="Spieler hinzufügen"
                  onClick={() => setShowAddPlayer(true)}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {playersLoading ? (
              <div className="text-xs text-muted-foreground py-4 text-center">Lade Spieler...</div>
            ) : !players || players.length === 0 ? (
              <div className="text-center py-6 space-y-3">
                <FileSpreadsheet className="w-8 h-8 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Noch keine Spieler vorhanden.</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Importieren Sie eine CSV-Datei oder fügen Sie Spieler manuell hinzu.
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-3 h-3 mr-1" />CSV importieren
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setShowAddPlayer(true)}>
                    <Plus className="w-3 h-3 mr-1" />Manuell
                  </Button>
                </div>
              </div>
            ) : (
              <ScrollArea className="max-h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[10px] h-7 w-8">#</TableHead>
                      <TableHead className="text-[10px] h-7">Name</TableHead>
                      <TableHead className="text-[10px] h-7 w-14">Nr.</TableHead>
                      <TableHead className="text-[10px] h-7 w-14">Größe</TableHead>
                      <TableHead className="text-[10px] h-7 w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {players.map((player: Player, idx: number) => (
                      <TableRow key={player.id} className="h-8">
                        {editingPlayerId === player.id ? (
                          <>
                            <TableCell className="text-[10px] py-1">{idx + 1}</TableCell>
                            <TableCell className="py-1">
                              <Input
                                className="h-6 text-[10px]"
                                value={editPlayer.name}
                                onChange={(e) => setEditPlayer({ ...editPlayer, name: e.target.value })}
                              />
                            </TableCell>
                            <TableCell className="py-1">
                              <Input
                                className="h-6 text-[10px] w-12"
                                value={editPlayer.number}
                                onChange={(e) => setEditPlayer({ ...editPlayer, number: e.target.value })}
                              />
                            </TableCell>
                            <TableCell className="py-1">
                              <Select
                                value={editPlayer.size || ""}
                                onValueChange={(val) => setEditPlayer({ ...editPlayer, size: val })}
                              >
                                <SelectTrigger className="h-6 text-[10px] w-14">
                                  <SelectValue placeholder="-" />
                                </SelectTrigger>
                                <SelectContent>
                                  {SIZE_OPTIONS.map((s) => (
                                    <SelectItem key={s.value} value={s.value} className="text-[10px]">
                                      {s.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="py-1">
                              <div className="flex gap-0.5">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-green-600"
                                  onClick={() => handleUpdatePlayer(player.id)}
                                >
                                  <Check className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  onClick={() => setEditingPlayerId(null)}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="text-[10px] py-1 text-muted-foreground">{idx + 1}</TableCell>
                            <TableCell className="text-[10px] py-1 font-medium">{player.name}</TableCell>
                            <TableCell className="text-[10px] py-1">
                              {player.number ? (
                                <Badge variant="outline" className="text-[10px] h-4 font-mono">
                                  {player.number}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">–</span>
                              )}
                            </TableCell>
                            <TableCell className="text-[10px] py-1">
                              {player.size || <span className="text-muted-foreground">–</span>}
                            </TableCell>
                            <TableCell className="py-1">
                              <div className="flex gap-0.5">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  onClick={() => startEdit(player)}
                                >
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-destructive"
                                  onClick={() => {
                                    if (confirm(`"${player.name}" wirklich entfernen?`)) {
                                      deletePlayer.mutate({ id: player.id, teamId: selectedTeamId, orgId: orgId! });
                                    }
                                  }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}

            {/* Neuen Spieler hinzufügen (Inline) */}
            {showAddPlayer && (
              <>
                <Separator className="my-2" />
                <div className="space-y-2">
                  <Label className="text-[10px] text-muted-foreground">Neuen Spieler hinzufügen</Label>
                  <div className="grid grid-cols-4 gap-1.5">
                    <Input
                      className="h-7 text-[10px] col-span-2"
                      placeholder="Name *"
                      value={newPlayer.name}
                      onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && handleAddPlayer()}
                    />
                    <Input
                      className="h-7 text-[10px]"
                      placeholder="Nr."
                      value={newPlayer.number}
                      onChange={(e) => setNewPlayer({ ...newPlayer, number: e.target.value })}
                    />
                    <Select
                      value={newPlayer.size || ""}
                      onValueChange={(val) => setNewPlayer({ ...newPlayer, size: val })}
                    >
                      <SelectTrigger className="h-7 text-[10px]">
                        <SelectValue placeholder="Größe" />
                      </SelectTrigger>
                      <SelectContent>
                        {SIZE_OPTIONS.map((s) => (
                          <SelectItem key={s.value} value={s.value} className="text-[10px]">
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      className="h-7 text-xs flex-1"
                      disabled={!newPlayer.name.trim() || createPlayer.isPending}
                      onClick={handleAddPlayer}
                    >
                      <Plus className="w-3 h-3 mr-1" />Hinzufügen
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => { setShowAddPlayer(false); setNewPlayer({ name: "", number: "", position: "", size: "" }); }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Größenstatistik */}
            {players && players.length > 0 && (
              <>
                <Separator className="my-2" />
                <div>
                  <Label className="text-[10px] text-muted-foreground mb-1 block">Größenverteilung</Label>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(
                      players.reduce((acc: Record<string, number>, p: Player) => {
                        const size = p.size || "Keine Angabe";
                        acc[size] = (acc[size] || 0) + 1;
                        return acc;
                      }, {})
                    )
                      .sort(([a], [b]) => {
                        const order = SIZE_OPTIONS.map((s) => s.value);
                        return order.indexOf(a) - order.indexOf(b);
                      })
                      .map(([size, count]) => (
                        <Badge key={size} variant="secondary" className="text-[10px] h-5">
                          {size}: {count as number}x
                        </Badge>
                      ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Hidden File Input für CSV */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.txt,.tsv"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* CSV-Import-Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              CSV-Import bestätigen
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              {csvData.length} Spieler erkannt. Bitte prüfen Sie die Daten:
            </p>
            <ScrollArea className="max-h-[250px] border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs h-7">Name</TableHead>
                    <TableHead className="text-xs h-7 w-14">Nr.</TableHead>
                    <TableHead className="text-xs h-7 w-20">Position</TableHead>
                    <TableHead className="text-xs h-7 w-14">Größe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvData.map((p, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-xs py-1">{p.name}</TableCell>
                      <TableCell className="text-xs py-1">{p.number || "–"}</TableCell>
                      <TableCell className="text-xs py-1">{p.position || "–"}</TableCell>
                      <TableCell className="text-xs py-1">{p.size || "–"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={replaceExisting}
                onChange={(e) => setReplaceExisting(e.target.checked)}
                className="rounded"
              />
              <span>Bestehende Spieler vorher löschen (ersetzen statt ergänzen)</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Abbrechen
            </Button>
            <Button
              disabled={importCsv.isPending}
              onClick={handleImportConfirm}
            >
              {importCsv.isPending ? "Importiere..." : `${csvData.length} Spieler importieren`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

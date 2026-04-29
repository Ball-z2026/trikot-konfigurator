import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  Loader2,
  LogIn,
  Plus,
  Shield,
  Trash2,
  Users,
  UserPlus,
  Pencil,
  Upload,
  Shirt,
  ChevronRight,
  Download,
} from "lucide-react";
import { useState, useRef } from "react";
import { Link, useLocation, useParams } from "wouter";
import { toast } from "sonner";

// ─── Team List (Trainer sieht seine Mannschaften) ─────────────────────────────
function TeamList({ orgId, deptId }: { orgId: number; deptId: number }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: org } = trpc.org.getById.useQuery({ id: orgId });
  const { data: teams, isLoading } = trpc.team.listByDepartment.useQuery(
    { departmentId: deptId, orgId },
    { enabled: orgId > 0 && deptId > 0 }
  );

  const [showCreate, setShowCreate] = useState(false);
  const [teamName, setTeamName] = useState("");

  const createTeam = trpc.team.create.useMutation({
    onSuccess: (data) => {
      utils.team.listByDepartment.invalidate({ departmentId: deptId, orgId });
      utils.team.mine.invalidate();
      setShowCreate(false);
      setTeamName("");
      toast.success("Mannschaft erstellt");
      setLocation(`/trainer/${orgId}/${deptId}/team/${data.id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteTeam = trpc.team.delete.useMutation({
    onSuccess: () => {
      utils.team.listByDepartment.invalidate({ departmentId: deptId, orgId });
      utils.team.mine.invalidate();
      toast.success("Mannschaft gelöscht");
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-30">
        <div className="container flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold">Meine Mannschaften</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {org?.name || "Organisation"}
              </p>
            </div>
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Neue Mannschaft
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Mannschaft erstellen</DialogTitle>
                <DialogDescription>
                  Erstellen Sie eine neue Mannschaft für Ihre Abteilung.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Mannschaftsname</Label>
                  <Input
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="z.B. U19 Herren, 1. Mannschaft"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowCreate(false)}
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={() =>
                    createTeam.mutate({
                      orgId,
                      departmentId: deptId,
                      name: teamName,
                    })
                  }
                  disabled={!teamName.trim() || createTeam.isPending}
                >
                  {createTeam.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Erstellen
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="container py-8">
        {!teams || teams.length === 0 ? (
          <div className="text-center py-16 bg-muted/30 rounded-xl border border-dashed">
            <Shirt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground mb-2">
              Noch keine Mannschaften
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Erstellen Sie eine Mannschaft, um Spieler hinzuzufügen und Trikots
              zu konfigurieren.
            </p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Mannschaft erstellen
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <Card
                key={team.id}
                className="group cursor-pointer hover:shadow-lg transition-all"
                onClick={() =>
                  setLocation(
                    `/trainer/${orgId}/${deptId}/team/${team.id}`
                  )
                }
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Shirt className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {team.name}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Mannschaft
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            confirm(
                              `Mannschaft "${team.name}" wirklich löschen? Alle Spieler werden ebenfalls gelöscht.`
                            )
                          )
                            deleteTeam.mutate({ id: team.id, orgId });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Team Detail (Spielerliste + Konfiguration) ──────────────────────────────
function TeamDetail({
  orgId,
  deptId,
  teamId,
}: {
  orgId: number;
  deptId: number;
  teamId: number;
}) {
  const utils = trpc.useUtils();
  const [, setLocation] = useLocation();

  const { data: org } = trpc.org.getById.useQuery({ id: orgId });
  const { data: team, isLoading } = trpc.team.getById.useQuery(
    { id: teamId, orgId },
    { enabled: teamId > 0 && orgId > 0 }
  );

  // ─── Player CRUD ───
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [playerNumber, setPlayerNumber] = useState("");
  const [playerPosition, setPlayerPosition] = useState("");

  const [showImport, setShowImport] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [replaceExisting, setReplaceExisting] = useState(false);

  const [editingPlayer, setEditingPlayer] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editNumber, setEditNumber] = useState("");
  const [editPosition, setEditPosition] = useState("");

  // ─── Rename Team ───
  const [showRename, setShowRename] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");

  const renameTeam = trpc.team.update.useMutation({
    onSuccess: () => {
      utils.team.getById.invalidate({ id: teamId, orgId });
      utils.team.listByDepartment.invalidate({ departmentId: deptId, orgId });
      setShowRename(false);
      setNewTeamName("");
      toast.success("Mannschaft umbenannt");
    },
    onError: (e) => toast.error(e.message),
  });

  const createPlayer = trpc.player.create.useMutation({
    onSuccess: () => {
      utils.team.getById.invalidate({ id: teamId, orgId });
      setShowAddPlayer(false);
      setPlayerName("");
      setPlayerNumber("");
      setPlayerPosition("");
      toast.success("Spieler hinzugefügt");
    },
    onError: (e) => toast.error(e.message),
  });

  const updatePlayer = trpc.player.update.useMutation({
    onSuccess: () => {
      utils.team.getById.invalidate({ id: teamId, orgId });
      setEditingPlayer(null);
      toast.success("Spieler aktualisiert");
    },
    onError: (e) => toast.error(e.message),
  });

  const deletePlayer = trpc.player.delete.useMutation({
    onSuccess: () => {
      utils.team.getById.invalidate({ id: teamId, orgId });
      toast.success("Spieler entfernt");
    },
    onError: (e) => toast.error(e.message),
  });

  const importPlayers = trpc.player.importCsv.useMutation({
    onSuccess: (data) => {
      utils.team.getById.invalidate({ id: teamId, orgId });
      setShowImport(false);
      setCsvText("");
      toast.success(`${data.count} Spieler importiert`);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleCsvImport = () => {
    const lines = csvText
      .trim()
      .split("\n")
      .filter((l) => l.trim());
    if (lines.length === 0) {
      toast.error("Keine Daten zum Importieren");
      return;
    }

    // Prüfe ob erste Zeile Header ist
    const firstLine = lines[0].toLowerCase();
    const hasHeader =
      firstLine.includes("name") ||
      firstLine.includes("nummer") ||
      firstLine.includes("position");
    const dataLines = hasHeader ? lines.slice(1) : lines;

    const players = dataLines.map((line) => {
      const parts = line.split(/[;,\t]/).map((p) => p.trim());
      return {
        name: parts[0] || "Unbekannt",
        number: parts[1] || undefined,
        position: parts[2] || undefined,
      };
    });

    if (players.length === 0) {
      toast.error("Keine gültigen Spieler gefunden");
      return;
    }

    importPlayers.mutate({
      teamId,
      orgId,
      players,
      replaceExisting,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Mannschaft nicht gefunden</p>
      </div>
    );
  }

  const players = team.players || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-30">
        <div className="container flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center gap-3">
            <Link href={`/trainer/${orgId}/${deptId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Shirt className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold">{team.name}</h1>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      setNewTeamName(team.name);
                      setShowRename(true);
                    }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {org?.name} &middot; {players.length} Spieler
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button size="sm" variant="outline">
                <Shirt className="w-4 h-4 mr-2" />
                Zum Konfigurator
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container py-6">
        {/* Rename Dialog */}
        <Dialog open={showRename} onOpenChange={setShowRename}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mannschaft umbenennen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Neuer Name</Label>
                <Input
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowRename(false)}
              >
                Abbrechen
              </Button>
              <Button
                onClick={() =>
                  renameTeam.mutate({
                    id: teamId,
                    orgId,
                    name: newTeamName,
                  })
                }
                disabled={!newTeamName.trim() || renameTeam.isPending}
              >
                Umbenennen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Action Bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">Spielerliste</h2>
            <p className="text-sm text-muted-foreground">
              {players.length} Spieler in dieser Mannschaft
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={showImport} onOpenChange={setShowImport}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  CSV-Import
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Spieler importieren (CSV)</DialogTitle>
                  <DialogDescription>
                    Fügen Sie Spielerdaten im CSV-Format ein. Spalten: Name,
                    Nummer, Position (getrennt durch Komma, Semikolon oder Tab).
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="rounded-lg bg-muted/50 p-3 text-xs font-mono text-muted-foreground">
                    <p className="font-medium text-foreground mb-1 font-sans text-sm">
                      Beispiel:
                    </p>
                    Name;Nummer;Position
                    <br />
                    Max Mustermann;7;Stürmer
                    <br />
                    Anna Schmidt;3;Verteidigung
                    <br />
                    Peter Meier;1;Torwart
                  </div>
                  <div className="space-y-2">
                    <Label>CSV-Daten</Label>
                    <textarea
                      className="w-full min-h-[120px] rounded-md border bg-background px-3 py-2 text-sm font-mono"
                      value={csvText}
                      onChange={(e) => setCsvText(e.target.value)}
                      placeholder="Name;Nummer;Position&#10;Max Mustermann;7;Stürmer"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="replace-existing"
                      checked={replaceExisting}
                      onChange={(e) => setReplaceExisting(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="replace-existing" className="text-sm">
                      Bestehende Spieler vorher löschen
                    </Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowImport(false)}
                  >
                    Abbrechen
                  </Button>
                  <Button
                    onClick={handleCsvImport}
                    disabled={!csvText.trim() || importPlayers.isPending}
                  >
                    {importPlayers.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Importieren
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showAddPlayer} onOpenChange={setShowAddPlayer}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Spieler hinzufügen
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Spieler hinzufügen</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>
                      Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Vor- und Nachname"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Trikotnummer</Label>
                      <Input
                        value={playerNumber}
                        onChange={(e) => setPlayerNumber(e.target.value)}
                        placeholder="z.B. 7"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Position</Label>
                      <Input
                        value={playerPosition}
                        onChange={(e) => setPlayerPosition(e.target.value)}
                        placeholder="z.B. Stürmer"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddPlayer(false)}
                  >
                    Abbrechen
                  </Button>
                  <Button
                    onClick={() =>
                      createPlayer.mutate({
                        teamId,
                        orgId,
                        name: playerName,
                        number: playerNumber || undefined,
                        position: playerPosition || undefined,
                      })
                    }
                    disabled={!playerName.trim() || createPlayer.isPending}
                  >
                    {createPlayer.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Hinzufügen
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Player List */}
        {players.length === 0 ? (
          <div className="text-center py-16 bg-muted/30 rounded-xl border border-dashed">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground mb-2">
              Noch keine Spieler
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Fügen Sie Spieler manuell hinzu oder importieren Sie eine
              CSV-Datei.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowImport(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                CSV-Import
              </Button>
              <Button onClick={() => setShowAddPlayer(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Spieler hinzufügen
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="col-span-1">#</div>
              <div className="col-span-4">Name</div>
              <div className="col-span-2">Nummer</div>
              <div className="col-span-3">Position</div>
              <div className="col-span-2 text-right">Aktionen</div>
            </div>
            <Separator />
            {players.map((player, idx) => (
              <Card key={player.id}>
                <CardContent className="py-2 px-4">
                  {editingPlayer === player.id ? (
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-1 text-sm text-muted-foreground">
                        {idx + 1}
                      </div>
                      <div className="col-span-4">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          value={editNumber}
                          onChange={(e) => setEditNumber(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          value={editPosition}
                          onChange={(e) => setEditPosition(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="col-span-2 flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => setEditingPlayer(null)}
                        >
                          Abbrechen
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() =>
                            updatePlayer.mutate({
                              id: player.id,
                              teamId,
                              orgId,
                              name: editName || undefined,
                              number: editNumber || null,
                              position: editPosition || null,
                            })
                          }
                          disabled={updatePlayer.isPending}
                        >
                          OK
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-1 text-sm text-muted-foreground">
                        {idx + 1}
                      </div>
                      <div className="col-span-4">
                        <p className="font-medium text-sm">{player.name}</p>
                      </div>
                      <div className="col-span-2">
                        {player.number ? (
                          <Badge variant="secondary" className="text-xs">
                            #{player.number}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            –
                          </span>
                        )}
                      </div>
                      <div className="col-span-3">
                        <span className="text-sm text-muted-foreground">
                          {player.position || "–"}
                        </span>
                      </div>
                      <div className="col-span-2 flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            setEditingPlayer(player.id);
                            setEditName(player.name);
                            setEditNumber(player.number || "");
                            setEditPosition(player.position || "");
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => {
                            if (
                              confirm(
                                `Spieler "${player.name}" wirklich entfernen?`
                              )
                            )
                              deletePlayer.mutate({
                                id: player.id,
                                teamId,
                                orgId,
                              });
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function TrainerDashboard() {
  const params = useParams<{
    id?: string;
    deptId?: string;
    teamId?: string;
  }>();
  const orgId = parseInt(params.id || "0");
  const deptId = parseInt(params.deptId || "0");
  const teamId = params.teamId ? parseInt(params.teamId) : null;

  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Shield className="w-12 h-12 text-primary mx-auto mb-2" />
            <CardTitle>Anmeldung erforderlich</CardTitle>
            <CardDescription>
              Bitte melden Sie sich an, um Ihre Mannschaft zu verwalten.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a href={getLoginUrl()}>
              <Button className="w-full">
                <LogIn className="w-4 h-4 mr-2" />
                Anmelden
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!orgId || !deptId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Ungültige URL</p>
      </div>
    );
  }

  if (teamId) {
    return <TeamDetail orgId={orgId} deptId={deptId} teamId={teamId} />;
  }

  return <TeamList orgId={orgId} deptId={deptId} />;
}

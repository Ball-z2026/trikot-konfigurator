import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Users,
  KeyRound,
  Trash2,
  Copy,
  Check,
  Shield,
  Search,
  Lock,
  Pencil,
  X,
} from "lucide-react";

type RoleBadge = {
  label: string;
  variant: "default" | "secondary" | "outline" | "destructive";
};

function getMembershipRoleBadge(role: string): RoleBadge {
  switch (role) {
    case "owner":
      return { label: "Hauptverantwortlicher", variant: "default" };
    case "department_lead":
      return { label: "Spartenleiter", variant: "secondary" };
    case "trainer":
      return { label: "Trainer", variant: "outline" };
    default:
      return { label: role, variant: "outline" };
  }
}

function getLoginMethodBadge(method: string | null): RoleBadge {
  if (method === "local") {
    return { label: "E-Mail + Passwort", variant: "secondary" };
  }
  return { label: "OAuth (Manus)", variant: "outline" };
}

/** Inline-editable text cell */
function EditableCell({
  value,
  onSave,
  type = "text",
  placeholder = "",
}: {
  value: string;
  onSave: (newValue: string) => void;
  type?: "text" | "email";
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (!trimmed) {
      toast.error("Feld darf nicht leer sein");
      setEditValue(value);
      setEditing(false);
      return;
    }
    if (type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Bitte geben Sie eine gültige E-Mail-Adresse ein");
      setEditValue(value);
      setEditing(false);
      return;
    }
    if (trimmed !== value) {
      onSave(trimmed);
    }
    setEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1 -my-1">
        <Input
          ref={inputRef}
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="h-7 text-sm min-w-[140px]"
          placeholder={placeholder}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onMouseDown={(e) => {
            e.preventDefault();
            handleCancel();
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <button
      className="group flex items-center gap-1.5 text-left hover:bg-muted/50 rounded px-1.5 py-0.5 -mx-1.5 -my-0.5 transition-colors cursor-pointer"
      onClick={() => {
        setEditValue(value);
        setEditing(true);
      }}
      title="Klicken zum Bearbeiten"
    >
      <span className={type === "email" ? "text-muted-foreground" : "font-medium"}>
        {value || "—"}
      </span>
      <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </button>
  );
}

export default function AdminUsers() {
  const { user, isAuthenticated, loading } = useAuth();
  const isAdmin = user?.role === "admin";

  const utils = trpc.useUtils();
  const { data: allUsers, isLoading } = trpc.adminUsers.list.useQuery(undefined, {
    enabled: isAdmin,
  });

  const createUser = trpc.adminUsers.create.useMutation({
    onSuccess: (data) => {
      utils.adminUsers.list.invalidate();
      setCreatedCredentials({ password: data.password });
      setCreateDialogOpen(false);
      toast.success("Benutzer erfolgreich angelegt");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateUser = trpc.adminUsers.update.useMutation({
    onSuccess: () => {
      utils.adminUsers.list.invalidate();
      toast.success("Benutzer aktualisiert");
    },
    onError: (err) => toast.error(err.message),
  });

  const resetPassword = trpc.adminUsers.resetPassword.useMutation({
    onSuccess: (data) => {
      utils.adminUsers.list.invalidate();
      setCreatedCredentials({ password: data.password });
      toast.success("Passwort zurückgesetzt");
    },
    onError: (err) => toast.error(err.message),
  });

  const setPasswordMut = trpc.adminUsers.setPassword.useMutation({
    onSuccess: (data) => {
      utils.adminUsers.list.invalidate();
      setCreatedCredentials({ password: data.password });
      toast.success("Passwort gesetzt – Benutzer kann sich jetzt lokal anmelden");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteUserMut = trpc.adminUsers.delete.useMutation({
    onSuccess: () => {
      utils.adminUsers.list.invalidate();
      toast.success("Benutzer gelöscht");
    },
    onError: (err) => toast.error(err.message),
  });

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [createdCredentials, setCreatedCredentials] = useState<{ password: string } | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleCreate = () => {
    if (!newName.trim() || !newEmail.trim()) {
      toast.error("Name und E-Mail sind erforderlich");
      return;
    }
    createUser.mutate({ name: newName.trim(), email: newEmail.trim() });
  };

  const handleCopyPassword = (pw: string) => {
    navigator.clipboard.writeText(pw);
    setCopiedPassword(true);
    toast.success("Passwort kopiert");
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const handleUpdateName = (userId: number, name: string) => {
    updateUser.mutate({ userId, name });
  };

  const handleUpdateEmail = (userId: number, email: string) => {
    updateUser.mutate({ userId, email });
  };

  const filteredUsers = allUsers?.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.memberships.some(
        (m) =>
          m.orgName?.toLowerCase().includes(q) ||
          m.departmentName?.toLowerCase().includes(q)
      )
    );
  });

  // Auth guards
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
            <p>Bitte melde dich an, um auf den Admin-Bereich zuzugreifen.</p>
            <Link href="/login">
              <Button>Anmelden</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <Shield className="mx-auto h-12 w-12 text-destructive" />
            <p>Du benötigst Admin-Rechte für diesen Bereich.</p>
            <Link href="/">
              <Button variant="outline">Zur Startseite</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link href="/admin/products">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <Users className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold">Benutzerverwaltung</h1>
            {allUsers && (
              <Badge variant="secondary">{allUsers.length} Benutzer</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Dialog
              open={createDialogOpen}
              onOpenChange={(open) => {
                setCreateDialogOpen(open);
                if (!open) {
                  setNewName("");
                  setNewEmail("");
                }
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Neuer Benutzer
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Neuen Benutzer anlegen</DialogTitle>
                  <DialogDescription>
                    Erstellen Sie einen neuen Benutzer mit E-Mail und automatisch generiertem Passwort.
                    Der Benutzer kann sich dann über die Login-Seite anmelden.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-name">Name</Label>
                    <Input
                      id="create-name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Max Mustermann"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-email">E-Mail</Label>
                    <Input
                      id="create-email"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="max@verein.de"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Abbrechen
                  </Button>
                  <Button onClick={handleCreate} disabled={createUser.isPending}>
                    {createUser.isPending ? "Wird angelegt..." : "Benutzer anlegen"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Credentials Dialog (shown after create or reset) */}
      <Dialog
        open={!!createdCredentials}
        onOpenChange={(open) => {
          if (!open) setCreatedCredentials(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zugangsdaten</DialogTitle>
            <DialogDescription>
              Bitte notieren Sie das Passwort und geben Sie es an den Benutzer weiter.
              Das Passwort wird nur einmal angezeigt.
            </DialogDescription>
          </DialogHeader>
          {createdCredentials && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Generiertes Passwort</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-3 py-2 rounded-md font-mono text-lg tracking-wider">
                    {createdCredentials.password}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopyPassword(createdCredentials.password)}
                  >
                    {copiedPassword ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Der Benutzer wird bei der ersten Anmeldung aufgefordert, ein neues Passwort zu wählen.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setCreatedCredentials(null)}>Schließen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main content */}
      <main className="container py-6">
        {/* Search */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Benutzer suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              <Pencil className="inline h-3 w-3 mr-1" />
              Klicken Sie auf Name oder E-Mail zum Bearbeiten
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : !filteredUsers || filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "Keine Benutzer gefunden." : "Noch keine Benutzer vorhanden."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>E-Mail</TableHead>
                    <TableHead>Login-Methode</TableHead>
                    <TableHead>Rolle(n)</TableHead>
                    <TableHead>Organisation / Sparte</TableHead>
                    <TableHead>Letzter Login</TableHead>
                    <TableHead>Erstellt</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => {
                    const loginBadge = getLoginMethodBadge(u.loginMethod);
                    const hasPassword = u.loginMethod === "local";
                    const isCurrentUser = u.id === user?.id;

                    return (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <EditableCell
                              value={u.name || ""}
                              onSave={(name) => handleUpdateName(u.id, name)}
                              placeholder="Name eingeben"
                            />
                            {u.role === "admin" && (
                              <Badge variant="destructive" className="text-xs shrink-0">
                                Admin
                              </Badge>
                            )}
                            {isCurrentUser && (
                              <Badge variant="outline" className="text-xs shrink-0">
                                Du
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <EditableCell
                            value={u.email || ""}
                            onSave={(email) => handleUpdateEmail(u.id, email)}
                            type="email"
                            placeholder="E-Mail eingeben"
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant={loginBadge.variant}>{loginBadge.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {u.memberships.length === 0 ? (
                              <span className="text-muted-foreground text-sm">Keine Zuordnung</span>
                            ) : (
                              u.memberships.map((m) => {
                                const badge = getMembershipRoleBadge(m.role);
                                return (
                                  <Badge key={m.id} variant={badge.variant} className="text-xs">
                                    {badge.label}
                                  </Badge>
                                );
                              })
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {u.memberships.length === 0 ? (
                              <span className="text-muted-foreground text-sm">—</span>
                            ) : (
                              u.memberships.map((m) => (
                                <div key={m.id} className="text-sm">
                                  <span className="font-medium">{m.orgName}</span>
                                  {m.departmentName && (
                                    <span className="text-muted-foreground">
                                      {" / "}
                                      {m.departmentName}
                                    </span>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {u.lastSignedIn
                            ? new Date(u.lastSignedIn).toLocaleDateString("de-DE", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {u.createdAt
                            ? new Date(u.createdAt).toLocaleDateString("de-DE", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Set password for OAuth users */}
                            {!hasPassword && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPasswordMut.mutate({ userId: u.id })}
                                disabled={setPasswordMut.isPending}
                                title="Lokales Passwort setzen"
                              >
                                <Lock className="h-3.5 w-3.5 mr-1" />
                                Passwort setzen
                              </Button>
                            )}

                            {/* Reset password for local users */}
                            {hasPassword && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => resetPassword.mutate({ userId: u.id })}
                                disabled={resetPassword.isPending}
                                title="Passwort zurücksetzen"
                              >
                                <KeyRound className="h-3.5 w-3.5 mr-1" />
                                Reset
                              </Button>
                            )}

                            {/* Delete user */}
                            {!isCurrentUser && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Benutzer löschen</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Möchten Sie den Benutzer <strong>{u.name || u.email}</strong> wirklich
                                      löschen? Alle Mitgliedschaften und Zuordnungen werden ebenfalls entfernt.
                                      Diese Aktion kann nicht rückgängig gemacht werden.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteUserMut.mutate({ userId: u.id })}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Löschen
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}

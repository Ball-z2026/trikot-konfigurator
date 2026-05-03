import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  UserPlus, Search, Filter, Users, Pencil, Trash2, Loader2,
  Phone, Mail, Hash, Calendar, FileText, Upload, Download,
  UserCheck, UserX, ChevronDown, ChevronUp
} from "lucide-react";

interface Department {
  id: number;
  name: string;
}

interface Team {
  id: number;
  name: string;
  departmentId?: number | null;
}

interface MemberManagementProps {
  orgId: number;
  /** Vereinsfarbe für konsistentes Design */
  primaryColor?: string | null;
  /** Sekundärfarbe */
  secondaryColor?: string | null;
  /** Rolle des aktuellen Benutzers */
  userRole: "owner" | "department_lead" | "trainer";
  /** Verfügbare Abteilungen (für Filter & Zuordnung) */
  departments: Department[];
  /** Verfügbare Mannschaften (für Filter & Zuordnung) */
  teams: Team[];
  /** Vorfilter auf eine bestimmte Abteilung (Spartenleiter) */
  filterDepartmentId?: number;
  /** Vorfilter auf eine bestimmte Mannschaft (Trainer) */
  filterTeamId?: number;
}

export default function MemberManagement({
  orgId,
  primaryColor,
  secondaryColor,
  userRole,
  departments,
  teams,
  filterDepartmentId,
  filterTeamId,
}: MemberManagementProps) {
  // ─── State ───
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"alle" | "aktiv" | "passiv">("alle");
  const [deptFilter, setDeptFilter] = useState<number | null>(filterDepartmentId || null);
  const [teamFilter, setTeamFilter] = useState<number | null>(filterTeamId || null);
  const [showAdd, setShowAdd] = useState(false);
  const [editMember, setEditMember] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Form state
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    status: "aktiv" as "aktiv" | "passiv",
    departmentId: filterDepartmentId || null as number | null,
    teamId: filterTeamId || null as number | null,
    memberNumber: "",
    birthDate: "",
    notes: "",
  });

  const resetForm = () => {
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      status: "aktiv",
      departmentId: filterDepartmentId || null,
      teamId: filterTeamId || null,
      memberNumber: "",
      birthDate: "",
      notes: "",
    });
  };

  // ─── Queries ───
  const { data: membersList, isLoading } = trpc.orgMember.list.useQuery({
    orgId,
    departmentId: filterDepartmentId,
    teamId: filterTeamId,
  });

  const utils = trpc.useUtils();

  // ─── Mutations ───
  const createMember = trpc.orgMember.create.useMutation({
    onSuccess: () => {
      toast.success("Mitglied hinzugefügt");
      utils.orgMember.list.invalidate({ orgId });
      setShowAdd(false);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMember = trpc.orgMember.update.useMutation({
    onSuccess: () => {
      toast.success("Mitglied aktualisiert");
      utils.orgMember.list.invalidate({ orgId });
      setEditMember(null);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMember = trpc.orgMember.delete.useMutation({
    onSuccess: () => {
      toast.success("Mitglied entfernt");
      utils.orgMember.list.invalidate({ orgId });
    },
    onError: (err) => toast.error(err.message),
  });

  // ─── Filtered members ───
  const filteredMembers = useMemo(() => {
    if (!membersList) return [];
    return membersList.filter((m: any) => {
      // Suchfilter
      if (search) {
        const q = search.toLowerCase();
        const match = [m.firstName, m.lastName, m.email, m.phone, m.memberNumber]
          .filter(Boolean)
          .some((v: string) => v.toLowerCase().includes(q));
        if (!match) return false;
      }
      // Statusfilter
      if (statusFilter !== "alle" && m.status !== statusFilter) return false;
      // Abteilungsfilter (nur wenn kein Vorfilter)
      if (!filterDepartmentId && deptFilter && m.departmentId !== deptFilter) return false;
      // Mannschaftsfilter
      if (!filterTeamId && teamFilter && m.teamId !== teamFilter) return false;
      return true;
    });
  }, [membersList, search, statusFilter, deptFilter, teamFilter, filterDepartmentId, filterTeamId]);

  const activeCount = membersList?.filter((m: any) => m.status === "aktiv").length || 0;
  const passiveCount = membersList?.filter((m: any) => m.status === "passiv").length || 0;

  // ─── Helpers ───
  const getDeptName = (deptId: number | null) => {
    if (!deptId) return null;
    return departments.find(d => d.id === deptId)?.name || null;
  };

  const getTeamName = (teamId: number | null) => {
    if (!teamId) return null;
    return teams.find(t => t.id === teamId)?.name || null;
  };

  const filteredTeams = useMemo(() => {
    if (form.departmentId) {
      return teams.filter(t => t.departmentId === form.departmentId);
    }
    return teams;
  }, [teams, form.departmentId]);

  const canCreate = userRole === "owner" || userRole === "department_lead" || userRole === "trainer";
  const canDelete = userRole === "owner" || userRole === "department_lead";

  const accentStyle = primaryColor ? { backgroundColor: primaryColor, color: '#fff' } : undefined;
  const accentBorder = primaryColor ? { borderColor: `${primaryColor}30` } : undefined;

  // ─── CSV/Excel Import ───
  const [showImport, setShowImport] = useState(false);
  const [importData, setImportData] = useState<Array<{ firstName: string; lastName: string; email?: string; phone?: string; status: "aktiv" | "passiv"; departmentId?: number | null; teamId?: number | null; memberNumber?: string }>>([]);
  const [importFileName, setImportFileName] = useState("");

  const bulkImport = trpc.orgMember.bulkImport.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.imported} Mitglieder importiert`);
      utils.orgMember.list.invalidate({ orgId });
      setShowImport(false);
      setImportData([]);
      setImportFileName("");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      // CSV parsen (Semikolon oder Komma als Trennzeichen)
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) {
        toast.error("Die Datei enthält keine Daten (mindestens Kopfzeile + 1 Zeile erwartet)");
        return;
      }

      // Trennzeichen erkennen
      const sep = lines[0].includes(";") ? ";" : ",";
      const headers = lines[0].split(sep).map(h => h.trim().toLowerCase().replace(/[\uFEFF]/g, ""));

      // Spalten-Mapping (flexibel)
      const colMap = {
        firstName: headers.findIndex(h => h.includes("vorname") || h === "firstname" || h === "first_name"),
        lastName: headers.findIndex(h => h.includes("nachname") || h.includes("name") && !h.includes("vor") || h === "lastname" || h === "last_name"),
        email: headers.findIndex(h => h.includes("mail") || h === "email" || h === "e-mail"),
        phone: headers.findIndex(h => h.includes("telefon") || h.includes("phone") || h.includes("tel")),
        status: headers.findIndex(h => h.includes("status")),
        memberNumber: headers.findIndex(h => h.includes("mitglied") || h.includes("nummer") || h.includes("member")),
      };

      if (colMap.firstName === -1 && colMap.lastName === -1) {
        toast.error("Spalten 'Vorname' und 'Nachname' nicht gefunden. Bitte prüfen Sie die Kopfzeile.");
        return;
      }

      const parsed: typeof importData = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(sep).map(c => c.trim());
        const firstName = colMap.firstName >= 0 ? cols[colMap.firstName] || "" : "";
        const lastName = colMap.lastName >= 0 ? cols[colMap.lastName] || "" : "";
        if (!firstName && !lastName) continue;

        const statusRaw = colMap.status >= 0 ? cols[colMap.status]?.toLowerCase() : "aktiv";
        const status = statusRaw === "passiv" ? "passiv" as const : "aktiv" as const;

        parsed.push({
          firstName: firstName || "Unbekannt",
          lastName: lastName || "Unbekannt",
          email: colMap.email >= 0 ? cols[colMap.email] || undefined : undefined,
          phone: colMap.phone >= 0 ? cols[colMap.phone] || undefined : undefined,
          status,
          memberNumber: colMap.memberNumber >= 0 ? cols[colMap.memberNumber] || undefined : undefined,
          departmentId: filterDepartmentId || null,
          teamId: filterTeamId || null,
        });
      }

      if (parsed.length === 0) {
        toast.error("Keine gültigen Einträge gefunden");
        return;
      }

      setImportData(parsed);
      setShowImport(true);
    };
    reader.readAsText(file, "utf-8");
    // Reset input
    e.target.value = "";
  };

  const handleImportConfirm = () => {
    if (importData.length === 0) return;
    bulkImport.mutate({ orgId, members: importData });
  };

  // ─── CSV Export ───
  const handleExport = () => {
    if (!filteredMembers.length) { toast.error("Keine Mitglieder zum Exportieren"); return; }
    const BOM = "\uFEFF";
    const header = "Vorname;Nachname;E-Mail;Telefon;Status;Sparte;Mannschaft;Mitgliedsnr.;Geburtsdatum;Notizen";
    const rows = filteredMembers.map((m: any) => [
      m.firstName, m.lastName, m.email || "", m.phone || "", m.status,
      getDeptName(m.departmentId) || "", getTeamName(m.teamId) || "",
      m.memberNumber || "", m.birthDate ? new Date(m.birthDate).toLocaleDateString("de-DE") : "",
      (m.notes || "").replace(/;/g, ","),
    ].join(";"));
    const csv = BOM + header + "\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mitglieder_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportiert");
  };

  // ─── Form Dialog ───
  const MemberFormDialog = ({ isEdit }: { isEdit: boolean }) => (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{isEdit ? "Mitglied bearbeiten" : "Neues Mitglied"}</DialogTitle>
        <DialogDescription>
          {isEdit ? "Aktualisieren Sie die Mitgliedsdaten." : "Fügen Sie ein neues Mitglied hinzu."}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Vorname <span className="text-destructive">*</span></Label>
            <Input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} placeholder="Max" />
          </div>
          <div className="space-y-1.5">
            <Label>Nachname <span className="text-destructive">*</span></Label>
            <Input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Mustermann" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label><Mail className="w-3.5 h-3.5 inline mr-1" />E-Mail</Label>
            <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="max@beispiel.de" />
          </div>
          <div className="space-y-1.5">
            <Label><Phone className="w-3.5 h-3.5 inline mr-1" />Telefon</Label>
            <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+49 170 1234567" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Status <span className="text-destructive">*</span></Label>
            <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as "aktiv" | "passiv" }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="aktiv">Aktiv</SelectItem>
                <SelectItem value="passiv">Passiv</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label><Hash className="w-3.5 h-3.5 inline mr-1" />Mitgliedsnr.</Label>
            <Input value={form.memberNumber} onChange={e => setForm(f => ({ ...f, memberNumber: e.target.value }))} placeholder="M-001" />
          </div>
        </div>
        {!filterDepartmentId && (
          <div className="space-y-1.5">
            <Label>Sparte {form.status === "aktiv" && <span className="text-destructive">*</span>}</Label>
            <Select
              value={form.departmentId?.toString() || "none"}
              onValueChange={v => {
                const deptId = v === "none" ? null : parseInt(v);
                setForm(f => ({ ...f, departmentId: deptId, teamId: null }));
              }}
            >
              <SelectTrigger><SelectValue placeholder="Sparte wählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Keine Sparte</SelectItem>
                {departments.map(d => (
                  <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-1.5">
          <Label>Mannschaft</Label>
          <Select
            value={form.teamId?.toString() || "none"}
            onValueChange={v => setForm(f => ({ ...f, teamId: v === "none" ? null : parseInt(v) }))}
          >
            <SelectTrigger><SelectValue placeholder="Mannschaft wählen..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Keine Mannschaft</SelectItem>
              {filteredTeams.map(t => (
                <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label><Calendar className="w-3.5 h-3.5 inline mr-1" />Geburtsdatum</Label>
          <Input type="date" value={form.birthDate} onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label><FileText className="w-3.5 h-3.5 inline mr-1" />Notizen</Label>
          <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optionale Notizen..." rows={2} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => { isEdit ? setEditMember(null) : setShowAdd(false); resetForm(); }}>Abbrechen</Button>
        <Button
          style={accentStyle}
          disabled={!form.firstName.trim() || !form.lastName.trim() || (createMember.isPending || updateMember.isPending)}
          onClick={() => {
            if (isEdit && editMember) {
              updateMember.mutate({
                id: editMember.id,
                orgId,
                ...form,
                email: form.email || "",
                phone: form.phone || "",
                memberNumber: form.memberNumber || "",
                birthDate: form.birthDate || "",
                notes: form.notes || "",
              });
            } else {
              createMember.mutate({
                orgId,
                ...form,
                email: form.email || "",
                phone: form.phone || "",
                memberNumber: form.memberNumber || "",
                birthDate: form.birthDate || "",
                notes: form.notes || "",
              });
            }
          }}
        >
          {(createMember.isPending || updateMember.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {isEdit ? "Speichern" : "Hinzufügen"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );

  // ─── Render ───
  return (
    <div className="space-y-4">
      {/* Header mit Statistik */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Vereinsmitglieder</h2>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-muted-foreground">{membersList?.length || 0} Mitglieder gesamt</span>
            <Badge variant="outline" className="text-xs gap-1" style={primaryColor ? { borderColor: `${primaryColor}40`, color: primaryColor } : undefined}>
              <UserCheck className="w-3 h-3" />{activeCount} aktiv
            </Badge>
            <Badge variant="outline" className="text-xs gap-1">
              <UserX className="w-3 h-3" />{passiveCount} passiv
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-1" />CSV
          </Button>
          {canCreate && canDelete && (
            <>
              <input
                type="file"
                accept=".csv,.txt,.xlsx,.xls"
                className="hidden"
                id="member-import-file"
                onChange={handleFileSelect}
              />
              <Button variant="outline" size="sm" onClick={() => document.getElementById('member-import-file')?.click()}>
                <Upload className="w-4 h-4 mr-1" />Import
              </Button>
            </>
          )}
          {canCreate && (
            <Dialog open={showAdd} onOpenChange={(open) => { setShowAdd(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button size="sm" style={accentStyle}>
                  <UserPlus className="w-4 h-4 mr-1" />Mitglied
                </Button>
              </DialogTrigger>
              <MemberFormDialog isEdit={false} />
            </Dialog>
          )}
        </div>

        {/* Import-Vorschau Dialog */}
        <Dialog open={showImport} onOpenChange={setShowImport}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>CSV-Import Vorschau</DialogTitle>
              <DialogDescription>
                {importFileName} – {importData.length} Mitglieder erkannt. Bitte prüfen Sie die Daten vor dem Import.
              </DialogDescription>
            </DialogHeader>
            <div className="border rounded-lg overflow-auto max-h-[400px]">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">#</th>
                    <th className="px-3 py-2 text-left font-medium">Vorname</th>
                    <th className="px-3 py-2 text-left font-medium">Nachname</th>
                    <th className="px-3 py-2 text-left font-medium">E-Mail</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {importData.slice(0, 50).map((m, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-1.5 text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-1.5">{m.firstName}</td>
                      <td className="px-3 py-1.5">{m.lastName}</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{m.email || "–"}</td>
                      <td className="px-3 py-1.5">
                        <Badge variant={m.status === "aktiv" ? "default" : "secondary"} className="text-xs">
                          {m.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {importData.length > 50 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  ... und {importData.length - 50} weitere Einträge
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowImport(false); setImportData([]); }}>Abbrechen</Button>
              <Button onClick={handleImportConfirm} disabled={bulkImport.isPending}>
                {bulkImport.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {importData.length} Mitglieder importieren
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter-Leiste */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Suchen nach Name, E-Mail, Telefon..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
          <SelectTrigger className="w-[130px]">
            <Filter className="w-3.5 h-3.5 mr-1" /><SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle</SelectItem>
            <SelectItem value="aktiv">Aktiv</SelectItem>
            <SelectItem value="passiv">Passiv</SelectItem>
          </SelectContent>
        </Select>
        {!filterDepartmentId && departments.length > 0 && (
          <Select value={deptFilter?.toString() || "alle"} onValueChange={v => { setDeptFilter(v === "alle" ? null : parseInt(v)); setTeamFilter(null); }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Alle Sparten" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alle">Alle Sparten</SelectItem>
              {departments.map(d => (
                <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Mitglieder-Liste */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed" style={accentBorder}>
          <Users className="w-10 h-10 mx-auto mb-3" style={primaryColor ? { color: `${primaryColor}60` } : { color: 'hsl(var(--muted-foreground))' }} />
          <p className="text-muted-foreground font-medium">
            {search || statusFilter !== "alle" ? "Keine Mitglieder gefunden" : "Noch keine Mitglieder"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {search || statusFilter !== "alle" ? "Passen Sie die Filter an" : "Fügen Sie das erste Mitglied hinzu"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredMembers.map((m: any) => {
            const isExpanded = expandedId === m.id;
            return (
              <Card key={m.id} className="overflow-hidden transition-shadow hover:shadow-sm" style={accentBorder}>
                <CardContent className="p-0">
                  {/* Hauptzeile */}
                  <div
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : m.id)}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold"
                      style={primaryColor
                        ? { backgroundColor: `${primaryColor}15`, color: primaryColor }
                        : { backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }
                      }
                    >
                      {m.firstName?.charAt(0)}{m.lastName?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{m.firstName} {m.lastName}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <Badge
                          variant={m.status === "aktiv" ? "default" : "secondary"}
                          className="text-xs"
                          style={m.status === "aktiv" && primaryColor ? { backgroundColor: primaryColor, color: '#fff' } : undefined}
                        >
                          {m.status === "aktiv" ? "Aktiv" : "Passiv"}
                        </Badge>
                        {getDeptName(m.departmentId) && (
                          <span className="text-xs text-muted-foreground">{getDeptName(m.departmentId)}</span>
                        )}
                        {getTeamName(m.teamId) && (
                          <span className="text-xs text-muted-foreground">• {getTeamName(m.teamId)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {(userRole === "owner" || userRole === "department_lead") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setForm({
                              firstName: m.firstName || "",
                              lastName: m.lastName || "",
                              email: m.email || "",
                              phone: m.phone || "",
                              status: m.status || "aktiv",
                              departmentId: m.departmentId || null,
                              teamId: m.teamId || null,
                              memberNumber: m.memberNumber || "",
                              birthDate: m.birthDate ? new Date(m.birthDate).toISOString().slice(0, 10) : "",
                              notes: m.notes || "",
                            });
                            setEditMember(m);
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`${m.firstName} ${m.lastName} wirklich entfernen?`)) {
                              deleteMember.mutate({ id: m.id, orgId });
                            }
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {/* Erweiterte Details */}
                  {isExpanded && (
                    <div className="px-4 pb-3 pt-1 border-t bg-muted/20">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                        {m.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <a href={`mailto:${m.email}`} className="text-primary hover:underline truncate">{m.email}</a>
                          </div>
                        )}
                        {m.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <a href={`tel:${m.phone}`} className="hover:underline">{m.phone}</a>
                          </div>
                        )}
                        {m.memberNumber && (
                          <div className="flex items-center gap-2">
                            <Hash className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span>{m.memberNumber}</span>
                          </div>
                        )}
                        {m.birthDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span>{new Date(m.birthDate).toLocaleDateString("de-DE")}</span>
                          </div>
                        )}
                        {m.notes && (
                          <div className="flex items-start gap-2 col-span-2 sm:col-span-3">
                            <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">{m.notes}</span>
                          </div>
                        )}
                        {!m.email && !m.phone && !m.memberNumber && !m.birthDate && !m.notes && (
                          <p className="text-muted-foreground col-span-3">Keine weiteren Details hinterlegt</p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editMember} onOpenChange={(open) => { if (!open) { setEditMember(null); resetForm(); } }}>
        <MemberFormDialog isEdit={true} />
      </Dialog>
    </div>
  );
}

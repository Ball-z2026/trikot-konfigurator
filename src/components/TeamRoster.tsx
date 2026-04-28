// ============================================================
// TeamRoster – Mannschaftslisten-Verwaltung
// CSV-Import, manuelle Eingabe, Spieler auswählen
// Design: Clean Sports Studio
// ============================================================

import { useRef } from 'react';
import Papa from 'papaparse';
import { Player } from '../types';
import { generateId } from '../utils/helpers';

interface Props {
  players: Player[];
  selectedPlayerId: string | null;
  onPlayersChange: (players: Player[]) => void;
  onSelectPlayer: (id: string | null) => void;
}

export default function TeamRoster({
  players,
  selectedPlayerId,
  onPlayersChange,
  onSelectPlayer,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const imported: Player[] = results.data.map((row: any) => ({
          id: generateId(),
          number: String(row.Nummer || row.nummer || row.Number || row.number || row['Nr'] || row['nr'] || ''),
          name: String(row.Name || row.name || row.Spieler || row.spieler || row.Player || row.player || ''),
          size: String(row.Größe || row.größe || row.Size || row.size || row['Gr.'] || ''),
        }));
        onPlayersChange([...players, ...imported.filter((p) => p.name.trim())]);
      },
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addPlayer = () => {
    onPlayersChange([
      ...players,
      { id: generateId(), number: '', name: '', size: '' },
    ]);
  };

  const updatePlayer = (id: string, field: keyof Player, value: string) => {
    onPlayersChange(
      players.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const removePlayer = (id: string) => {
    onPlayersChange(players.filter((p) => p.id !== id));
    if (selectedPlayerId === id) onSelectPlayer(null);
  };

  const clearAll = () => {
    onPlayersChange([]);
    onSelectPlayer(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#e2e5ea] shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#e2e5ea] bg-[#f8f9fa]">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#0f2b5b]">Mannschaftsliste</h3>
          <span className="text-xs font-semibold text-[#94a3b8] bg-[#e2e5ea] px-2.5 py-1 rounded-full">
            {players.length} Spieler
          </span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* CSV Import */}
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#0f2b5b] text-white text-sm font-semibold hover:bg-[#0a1f42] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            CSV importieren
          </button>
          <button
            onClick={addPlayer}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 border-[#0f2b5b] text-[#0f2b5b] text-sm font-semibold hover:bg-[#0f2b5b] hover:text-white transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Hinzufügen
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          onChange={handleCsvImport}
          className="hidden"
        />

        <p className="text-xs text-[#94a3b8]">
          CSV-Spalten: Name, Nummer, Größe (optional)
        </p>

        {/* Spielerliste */}
        {players.length > 0 && (
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {players.map((player, idx) => {
              const isSelected = selectedPlayerId === player.id;
              return (
                <div
                  key={player.id}
                  className={`
                    rounded-xl border-2 transition-all
                    ${isSelected
                      ? 'border-[#0f2b5b] bg-[#0f2b5b]/5 shadow-sm'
                      : 'border-[#e2e5ea] hover:border-[#94a3b8]'
                    }
                  `}
                >
                  {/* Klickbarer Auswahl-Bereich */}
                  <button
                    onClick={() => onSelectPlayer(isSelected ? null : player.id)}
                    className={`
                      w-full flex items-center gap-2 px-3 py-2 text-left rounded-t-xl transition-colors
                      ${isSelected ? 'bg-[#0f2b5b]/10' : 'hover:bg-[#f8f9fa]'}
                    `}
                  >
                    <span className="w-6 h-6 flex items-center justify-center rounded-md bg-[#f1f3f5] text-xs font-bold text-[#64748b]">
                      {idx + 1}
                    </span>
                    <span className={`text-sm font-semibold ${isSelected ? 'text-[#0f2b5b]' : 'text-[#3a3f4b]'}`}>
                      {player.name || 'Neuer Spieler'}
                    </span>
                    {player.number && (
                      <span className="ml-auto text-xs font-bold bg-[#0f2b5b] text-white px-2 py-0.5 rounded-md">
                        #{player.number}
                      </span>
                    )}
                    {isSelected && (
                      <span className="text-[10px] font-semibold text-[#00c853] uppercase tracking-wider">
                        Aktiv
                      </span>
                    )}
                  </button>

                  {/* Eingabefelder */}
                  <div className="flex items-center gap-2 px-3 pb-3 pt-1">
                    <input
                      type="text"
                      value={player.number}
                      onChange={(e) => updatePlayer(player.id, 'number', e.target.value)}
                      placeholder="Nr."
                      className="w-14 px-2 py-1.5 rounded-md border border-[#e2e5ea] text-sm text-center font-bold focus:outline-none focus:border-[#0f2b5b] bg-white"
                    />
                    <input
                      type="text"
                      value={player.name}
                      onChange={(e) => updatePlayer(player.id, 'name', e.target.value)}
                      placeholder="Spielername"
                      className="flex-1 px-3 py-1.5 rounded-md border border-[#e2e5ea] text-sm font-medium focus:outline-none focus:border-[#0f2b5b] bg-white"
                    />
                    <input
                      type="text"
                      value={player.size || ''}
                      onChange={(e) => updatePlayer(player.id, 'size', e.target.value)}
                      placeholder="Gr."
                      className="w-14 px-2 py-1.5 rounded-md border border-[#e2e5ea] text-sm text-center focus:outline-none focus:border-[#0f2b5b] bg-white"
                    />
                    <button
                      onClick={() => removePlayer(player.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#e53935]/10 text-[#94a3b8] hover:text-[#e53935] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {players.length > 0 && (
          <button
            onClick={clearAll}
            className="w-full py-2 text-xs font-semibold text-[#e53935] hover:bg-[#e53935]/5 rounded-lg transition-colors"
          >
            Alle Spieler entfernen
          </button>
        )}

        {players.length === 0 && (
          <div className="text-center py-8 text-[#94a3b8]">
            <svg className="w-10 h-10 mx-auto mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            <p className="text-sm">Noch keine Spieler hinzugefügt</p>
            <p className="text-xs mt-1">CSV importieren oder manuell hinzufügen</p>
          </div>
        )}
      </div>
    </div>
  );
}

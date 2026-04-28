// ============================================================
// App – Textil-Konfigurator Hauptkomponente
// Design: Clean Sports Studio (Scandinavian Minimalism + Sports)
// Layout: Asymmetrisch – 60% Canvas links, 40% Panel rechts
// Primär: #0f2b5b | Akzent: #00c853 | Danger: #e53935
// ============================================================

import { useState, useCallback } from 'react';
import {
  TextilType,
  ViewSide,
  UploadedAsset,
  TextPlacement,
  Player,
  PlacementZone,
} from './types';
import { getTemplate } from './data/templates';
import { generateId } from './utils/helpers';
import TextilSelector from './components/TextilSelector';
import TextilCanvas from './components/TextilCanvas';
import ZoneEditor from './components/ZoneEditor';
import TeamRoster from './components/TeamRoster';
import ExportPanel from './components/ExportPanel';
import { toPng } from 'html-to-image';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

type SidebarTab = 'zones' | 'team' | 'export';

export default function App() {
  // State
  const [selectedTextil, setSelectedTextil] = useState<TextilType>('trikot');
  const [currentSide, setCurrentSide] = useState<ViewSide>('front');
  const [uploads, setUploads] = useState<UploadedAsset[]>([]);
  const [textPlacements, setTextPlacements] = useState<TextPlacement[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('zones');
  const [mobilePanel, setMobilePanel] = useState(false);
  const [exportStatus, setExportStatus] = useState<string>('');

  const template = getTemplate(selectedTextil)!;
  const activeZone = template.zones.find((z) => z.id === activeZoneId);

  // Wenn ein Spieler ausgewählt ist, dessen Daten in die Text-Zonen setzen
  const getEffectiveTextPlacements = useCallback((): TextPlacement[] => {
    const result = [...textPlacements];

    if (!selectedPlayerId) return result;
    const player = players.find((p) => p.id === selectedPlayerId);
    if (!player) return result;

    const nameZones = template.zones.filter(
      (z) => z.id.includes('name') && z.type === 'text'
    );
    const numberZones = template.zones.filter(
      (z) => z.id.includes('number') && z.type === 'text'
    );

    nameZones.forEach((zone) => {
      const idx = result.findIndex((t) => t.zoneId === zone.id);
      const placement: TextPlacement = {
        zoneId: zone.id,
        text: player.name.toUpperCase(),
        fontSize: idx >= 0 ? result[idx].fontSize : 22,
        fontFamily: idx >= 0 ? result[idx].fontFamily : 'Bebas Neue',
        color: idx >= 0 ? result[idx].color : '#000000',
        fontWeight: idx >= 0 ? result[idx].fontWeight : 'bold',
        letterSpacing: idx >= 0 ? result[idx].letterSpacing : 3,
      };
      if (idx >= 0) result[idx] = placement;
      else result.push(placement);
    });

    numberZones.forEach((zone) => {
      const idx = result.findIndex((t) => t.zoneId === zone.id);
      const placement: TextPlacement = {
        zoneId: zone.id,
        text: player.number,
        fontSize: idx >= 0 ? result[idx].fontSize : 72,
        fontFamily: idx >= 0 ? result[idx].fontFamily : 'Bebas Neue',
        color: idx >= 0 ? result[idx].color : '#000000',
        fontWeight: idx >= 0 ? result[idx].fontWeight : 'bold',
        letterSpacing: idx >= 0 ? result[idx].letterSpacing : 0,
      };
      if (idx >= 0) result[idx] = placement;
      else result.push(placement);
    });

    return result;
  }, [selectedPlayerId, players, textPlacements, template]);

  // Helpers für Spieler-basierte Platzierungen
  const getPlayerTextPlacements = useCallback(
    (player: Player): TextPlacement[] => {
      const result = [...textPlacements];
      const nameZones = template.zones.filter(
        (z) => z.id.includes('name') && z.type === 'text'
      );
      const numberZones = template.zones.filter(
        (z) => z.id.includes('number') && z.type === 'text'
      );

      nameZones.forEach((zone) => {
        const idx = result.findIndex((t) => t.zoneId === zone.id);
        const placement: TextPlacement = {
          zoneId: zone.id,
          text: player.name.toUpperCase(),
          fontSize: idx >= 0 ? result[idx].fontSize : 22,
          fontFamily: idx >= 0 ? result[idx].fontFamily : 'Bebas Neue',
          color: idx >= 0 ? result[idx].color : '#000000',
          fontWeight: idx >= 0 ? result[idx].fontWeight : 'bold',
          letterSpacing: idx >= 0 ? result[idx].letterSpacing : 3,
        };
        if (idx >= 0) result[idx] = placement;
        else result.push(placement);
      });

      numberZones.forEach((zone) => {
        const idx = result.findIndex((t) => t.zoneId === zone.id);
        const placement: TextPlacement = {
          zoneId: zone.id,
          text: player.number,
          fontSize: idx >= 0 ? result[idx].fontSize : 72,
          fontFamily: idx >= 0 ? result[idx].fontFamily : 'Bebas Neue',
          color: idx >= 0 ? result[idx].color : '#000000',
          fontWeight: idx >= 0 ? result[idx].fontWeight : 'bold',
          letterSpacing: idx >= 0 ? result[idx].letterSpacing : 0,
        };
        if (idx >= 0) result[idx] = placement;
        else result.push(placement);
      });

      return result;
    },
    [textPlacements, template]
  );

  // Handlers
  const handleTextilChange = (type: TextilType) => {
    setSelectedTextil(type);
    setActiveZoneId(null);
    setCurrentSide('front');
  };

  const handleUpload = (asset: UploadedAsset) => {
    setUploads((prev) => {
      const filtered = prev.filter((u) => u.zoneId !== asset.zoneId);
      return [...filtered, asset];
    });
  };

  const handleRemoveUpload = (zoneId: string) => {
    setUploads((prev) => prev.filter((u) => u.zoneId !== zoneId));
  };

  const handleTextChange = (placement: TextPlacement) => {
    setTextPlacements((prev) => {
      const filtered = prev.filter((t) => t.zoneId !== placement.zoneId);
      return [...filtered, placement];
    });
  };

  const handleZoneClick = (zone: PlacementZone) => {
    setActiveZoneId(zone.id);
    setSidebarTab('zones');
    setMobilePanel(true);
  };

  const handleSelectPlayer = (id: string | null) => {
    setSelectedPlayerId(id);
    if (id) {
      // Automatisch zur Rückseite wechseln wenn Spieler ausgewählt
      setCurrentSide('back');
    }
  };

  // Export functions
  const exportCanvasElement = (): HTMLElement | null => {
    const el = document.querySelector('[data-export-canvas]');
    return el as HTMLElement | null;
  };

  const handleExportSingle = async () => {
    const el = exportCanvasElement();
    if (!el) return;
    try {
      setExportStatus('Exportiere...');
      const dataUrl = await toPng(el, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      const playerName = selectedPlayerId
        ? players.find((p) => p.id === selectedPlayerId)?.name || 'spieler'
        : 'design';
      const safeName = playerName.replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_');
      saveAs(dataUrl, `${template.name}_${currentSide}_${safeName}.png`);
      setExportStatus('Export erfolgreich!');
    } catch (err) {
      console.error('Export failed:', err);
      setExportStatus('Export fehlgeschlagen');
    }
    setTimeout(() => setExportStatus(''), 2000);
  };

  const handleExportAll = async () => {
    if (players.length === 0) return;
    const el = exportCanvasElement();
    if (!el) return;

    const zip = new JSZip();
    const originalPlayer = selectedPlayerId;
    const originalSide = currentSide;

    setExportStatus(`Exportiere 0/${players.length} Spieler...`);

    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      setSelectedPlayerId(player.id);
      setExportStatus(`Exportiere ${i + 1}/${players.length}: ${player.name}...`);

      for (const side of ['front', 'back'] as ViewSide[]) {
        setCurrentSide(side);
        await new Promise((r) => setTimeout(r, 400));

        try {
          const dataUrl = await toPng(el, {
            cacheBust: true,
            pixelRatio: 2,
            backgroundColor: '#ffffff',
          });
          const response = await fetch(dataUrl);
          const blob = await response.blob();
          const safeName = player.name.replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_');
          zip.file(`${player.number}_${safeName}_${side}.png`, blob);
        } catch (err) {
          console.error(`Export failed for ${player.name}:`, err);
        }
      }
    }

    setSelectedPlayerId(originalPlayer);
    setCurrentSide(originalSide);

    setExportStatus('ZIP wird erstellt...');
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${template.name}_Mannschaft.zip`);
    setExportStatus('Export erfolgreich!');
    setTimeout(() => setExportStatus(''), 2000);
  };

  const handleExportPdf = async () => {
    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${template.name} – Mannschaftsliste</title>
    <style>
      body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a1a2e; max-width: 800px; margin: 0 auto; }
      h1 { color: #0f2b5b; border-bottom: 3px solid #0f2b5b; padding-bottom: 12px; font-size: 28px; }
      .meta { color: #94a3b8; font-size: 13px; margin-bottom: 24px; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th { background: #0f2b5b; color: white; padding: 14px 18px; text-align: left; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; }
      td { padding: 12px 18px; border-bottom: 1px solid #e2e5ea; font-size: 14px; }
      tr:nth-child(even) { background: #f8f9fa; }
      tr:hover { background: #eef1f5; }
      .number { font-weight: 700; font-size: 18px; color: #0f2b5b; }
      .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e5ea; color: #94a3b8; font-size: 11px; }
    </style></head><body>
    <h1>${template.name} – Mannschaftsliste</h1>
    <p class="meta">Textilart: ${template.name} | Spieler: ${players.length} | Erstellt am: ${new Date().toLocaleDateString('de-DE')}</p>
    <table>
      <thead><tr><th>Nr.</th><th>Name</th><th>Größe</th></tr></thead>
      <tbody>`;

    players.forEach((p) => {
      html += `<tr><td class="number">${p.number}</td><td>${p.name}</td><td>${p.size || '–'}</td></tr>`;
    });

    html += `</tbody></table>
    <div class="footer">Erstellt mit dem Textil-Konfigurator</div>
    </body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    saveAs(blob, `${template.name}_Mannschaftsliste.html`);
  };

  const effectiveTextPlacements = getEffectiveTextPlacements();
  const hasContent = uploads.length > 0 || textPlacements.some((t) => t.text.trim()) || selectedPlayerId !== null;

  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      {/* Header */}
      <header className="bg-white border-b border-[#e2e5ea] sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0f2b5b] flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#0f2b5b] leading-tight" style={{ fontFamily: 'Oswald, sans-serif' }}>
                  Textil-Konfigurator
                </h1>
                <p className="text-[10px] text-[#94a3b8] font-semibold tracking-[0.2em]">DESIGN &middot; PERSONALISIEREN &middot; EXPORTIEREN</p>
              </div>
            </div>

            {/* Export Status */}
            {exportStatus && (
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0f2b5b]/5 text-[#0f2b5b] text-sm font-medium animate-pulse-subtle">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {exportStatus}
              </div>
            )}

            {/* Mobile Toggle */}
            <button
              onClick={() => setMobilePanel(!mobilePanel)}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-[#f1f3f5] text-[#3a3f4b]"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Textil-Auswahl */}
      <div className="bg-white border-b border-[#e2e5ea]">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <TextilSelector selected={selectedTextil} onSelect={handleTextilChange} />
        </div>
      </div>

      {/* Hauptbereich */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Canvas – 60% */}
          <div className="lg:w-[60%]">
            <TextilCanvas
              template={template}
              side={currentSide}
              onSideChange={setCurrentSide}
              uploads={uploads}
              textPlacements={effectiveTextPlacements}
              onUpload={handleUpload}
              onZoneClick={handleZoneClick}
              activeZoneId={activeZoneId}
            />

            {/* Ausgewählter Spieler Info */}
            {selectedPlayerId && (
              <div className="mt-4 flex items-center gap-3 px-5 py-3 bg-[#0f2b5b]/5 rounded-xl border border-[#0f2b5b]/10">
                <div className="w-10 h-10 rounded-lg bg-[#0f2b5b] flex items-center justify-center text-white font-bold text-lg" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  {players.find((p) => p.id === selectedPlayerId)?.number || '?'}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0f2b5b]">
                    {players.find((p) => p.id === selectedPlayerId)?.name || 'Unbekannt'}
                  </p>
                  <p className="text-xs text-[#64748b]">Spieler ausgewählt – Name und Nummer werden automatisch platziert</p>
                </div>
                <button
                  onClick={() => setSelectedPlayerId(null)}
                  className="ml-auto text-xs font-semibold text-[#e53935] hover:bg-[#e53935]/5 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Abwählen
                </button>
              </div>
            )}
          </div>

          {/* Sidebar – 40% */}
          <div
            className={`
              lg:w-[40%] space-y-5
              ${mobilePanel ? 'block' : 'hidden lg:block'}
            `}
          >
            {/* Tab Navigation */}
            <div className="flex bg-white rounded-xl border border-[#e2e5ea] p-1 gap-1">
              {([
                { id: 'zones' as SidebarTab, label: 'Zonen', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
                { id: 'team' as SidebarTab, label: 'Mannschaft', icon: 'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z' },
                { id: 'export' as SidebarTab, label: 'Export', icon: 'M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3' },
              ]).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSidebarTab(tab.id)}
                  className={`
                    flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all
                    ${sidebarTab === tab.id
                      ? 'bg-[#0f2b5b] text-white shadow-sm'
                      : 'text-[#64748b] hover:text-[#0f2b5b] hover:bg-[#f8f9fa]'
                    }
                  `}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                  </svg>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {sidebarTab === 'zones' && (
              <div className="space-y-4">
                {activeZone ? (
                  <ZoneEditor
                    zone={activeZone}
                    upload={uploads.find((u) => u.zoneId === activeZone.id)}
                    textPlacement={effectiveTextPlacements.find(
                      (t) => t.zoneId === activeZone.id
                    )}
                    onUpload={handleUpload}
                    onRemoveUpload={handleRemoveUpload}
                    onTextChange={handleTextChange}
                    onClose={() => setActiveZoneId(null)}
                  />
                ) : (
                  <div className="bg-white rounded-2xl border border-[#e2e5ea] p-8 text-center">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#f1f3f5] flex items-center justify-center">
                      <svg className="w-7 h-7 text-[#94a3b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-[#3a3f4b]">
                      Klicke auf eine Zone im Textil
                    </p>
                    <p className="text-xs text-[#94a3b8] mt-1">
                      Um Bilder hochzuladen oder Text einzugeben
                    </p>

                    {/* Zonen-Übersicht */}
                    <div className="mt-6 space-y-2 text-left">
                      <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-3">
                        Verfügbare Zonen ({currentSide === 'front' ? 'Vorderseite' : 'Rückseite'})
                      </p>
                      {template.zones
                        .filter((z) => z.side === currentSide)
                        .map((zone) => {
                          const hasUpload = uploads.some((u) => u.zoneId === zone.id);
                          const hasText = effectiveTextPlacements.some(
                            (t) => t.zoneId === zone.id && t.text.trim()
                          );
                          const filled = hasUpload || hasText;
                          return (
                            <button
                              key={zone.id}
                              onClick={() => handleZoneClick(zone)}
                              className={`
                                w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left
                                ${filled
                                  ? 'border-[#00c853]/30 bg-[#00c853]/5'
                                  : 'border-[#e2e5ea] hover:border-[#0f2b5b]/30 hover:bg-[#f8f9fa]'
                                }
                              `}
                            >
                              <div
                                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                                  filled ? 'bg-[#00c853]' : 'bg-[#cbd5e1]'
                                }`}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-[#3a3f4b] truncate">
                                  {zone.label}
                                </p>
                                <p className="text-xs text-[#94a3b8] truncate">
                                  {zone.description}
                                </p>
                              </div>
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#94a3b8] bg-[#f1f3f5] px-2 py-1 rounded-md flex-shrink-0">
                                {zone.type === 'image' ? 'Bild' : zone.type === 'text' ? 'Text' : 'Beides'}
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {sidebarTab === 'team' && (
              <TeamRoster
                players={players}
                selectedPlayerId={selectedPlayerId}
                onPlayersChange={setPlayers}
                onSelectPlayer={handleSelectPlayer}
              />
            )}

            {sidebarTab === 'export' && (
              <ExportPanel
                hasContent={hasContent}
                playerCount={players.length}
                onExportSingle={handleExportSingle}
                onExportAll={handleExportAll}
                onExportPdf={handleExportPdf}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

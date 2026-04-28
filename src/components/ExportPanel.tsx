// ============================================================
// ExportPanel – Export als PNG, Batch-Export für alle Spieler
// Design: Clean Sports Studio
// ============================================================

import { useState } from 'react';

interface Props {
  hasContent: boolean;
  playerCount: number;
  onExportSingle: () => void;
  onExportAll: () => void;
  onExportPdf: () => void;
}

export default function ExportPanel({
  hasContent,
  playerCount,
  onExportSingle,
  onExportAll,
  onExportPdf,
}: Props) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (fn: () => void) => {
    setExporting(true);
    try {
      await fn();
    } finally {
      setTimeout(() => setExporting(false), 1000);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#e2e5ea] shadow-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-[#e2e5ea] bg-[#f8f9fa]">
        <h3 className="text-base font-bold text-[#0f2b5b]">Export</h3>
        <p className="text-xs text-[#94a3b8] mt-0.5">Designs als Bilder herunterladen</p>
      </div>

      <div className="p-5 space-y-4">
        {/* Einzelexport */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Einzelexport</p>
          <button
            onClick={() => handleExport(onExportSingle)}
            disabled={exporting}
            className={`
              w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-semibold transition-all
              ${!exporting
                ? 'bg-[#00c853] text-white hover:bg-[#00b048] shadow-md shadow-[#00c853]/20 active:scale-[0.98]'
                : 'bg-[#e2e5ea] text-[#94a3b8] cursor-not-allowed'
              }
            `}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            {exporting ? 'Wird exportiert...' : 'Aktuelle Ansicht als PNG'}
          </button>
          <p className="text-[11px] text-[#94a3b8]">
            Exportiert die aktuelle Textilansicht mit allen platzierten Elementen
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-[#e2e5ea]" />

        {/* Batch-Export */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Mannschaft-Export</p>

          {playerCount > 0 ? (
            <div className="space-y-3">
              <button
                onClick={() => handleExport(onExportAll)}
                disabled={exporting}
                className={`
                  w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-semibold transition-all
                  ${!exporting
                    ? 'bg-[#0f2b5b] text-white hover:bg-[#0a1f42] shadow-md shadow-[#0f2b5b]/20 active:scale-[0.98]'
                    : 'bg-[#e2e5ea] text-[#94a3b8] cursor-not-allowed'
                  }
                `}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
                {exporting
                  ? 'Wird generiert...'
                  : `Alle ${playerCount} Spieler als ZIP`
                }
              </button>
              <p className="text-[11px] text-[#94a3b8]">
                Generiert Vorder- und Rückseite für jeden Spieler mit personalisiertem Namen und Nummer
              </p>

              <button
                onClick={() => handleExport(onExportPdf)}
                disabled={exporting}
                className={`
                  w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-semibold border-2 transition-all
                  ${!exporting
                    ? 'border-[#0f2b5b] text-[#0f2b5b] hover:bg-[#0f2b5b] hover:text-white active:scale-[0.98]'
                    : 'border-[#e2e5ea] text-[#94a3b8] cursor-not-allowed'
                  }
                `}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                Übersichtsliste exportieren
              </button>
            </div>
          ) : (
            <div className="text-center py-6 px-4 bg-[#f8f9fa] rounded-xl border border-dashed border-[#e2e5ea]">
              <svg className="w-8 h-8 mx-auto mb-2 text-[#cbd5e1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
              <p className="text-sm font-medium text-[#64748b]">Keine Spieler vorhanden</p>
              <p className="text-xs text-[#94a3b8] mt-1">
                Füge Spieler im Tab "Mannschaft" hinzu, um den Batch-Export zu nutzen
              </p>
            </div>
          )}
        </div>

        {/* Info-Box */}
        <div className="flex items-start gap-3 p-3 bg-[#f0f7ff] rounded-xl border border-[#d0e3ff]">
          <svg className="w-4 h-4 text-[#1e88e5] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          <div>
            <p className="text-xs font-semibold text-[#1e88e5]">Tipp</p>
            <p className="text-[11px] text-[#3a6ea5] mt-0.5">
              Beim Batch-Export werden für jeden Spieler automatisch Vorder- und Rückseite mit dem jeweiligen Namen und der Nummer generiert.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TextilCanvas – Visueller Editor mit Textil-Bild und Platzierungszonen
// Design: Clean Sports Studio – heller Hintergrund, farbige Zone-Badges
// ============================================================

import { useRef, useCallback, useState } from 'react';
import { TextilTemplate, ViewSide, UploadedAsset, TextPlacement, PlacementZone } from '../types';
import { readFileAsDataUrl, generateId } from '../utils/helpers';

interface Props {
  template: TextilTemplate;
  side: ViewSide;
  onSideChange: (side: ViewSide) => void;
  uploads: UploadedAsset[];
  textPlacements: TextPlacement[];
  onUpload: (asset: UploadedAsset) => void;
  onZoneClick: (zone: PlacementZone) => void;
  activeZoneId: string | null;
}

export default function TextilCanvas({
  template,
  side,
  onSideChange,
  uploads,
  textPlacements,
  onUpload,
  onZoneClick,
  activeZoneId,
}: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragOverZone, setDragOverZone] = useState<string | null>(null);

  const currentZones = template.zones.filter((z) => z.side === side);
  const image = side === 'front' ? template.frontImage : template.backImage;

  const handleDrop = useCallback(
    async (e: React.DragEvent, zone: PlacementZone) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverZone(null);
      const files = e.dataTransfer.files;
      if (files.length === 0) return;
      const file = files[0];
      if (!file.type.startsWith('image/')) return;
      const dataUrl = await readFileAsDataUrl(file);
      onUpload({
        id: generateId(),
        zoneId: zone.id,
        file,
        dataUrl,
        fileName: file.name,
        scale: 1,
        offsetX: 0,
        offsetY: 0,
      });
    },
    [onUpload]
  );

  const handleDragOver = (e: React.DragEvent, zoneId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverZone(zoneId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverZone(null);
  };

  const getZoneColor = (zone: PlacementZone) => {
    const hasUpload = uploads.some((u) => u.zoneId === zone.id);
    const hasText = textPlacements.some((t) => t.zoneId === zone.id && t.text.trim());
    const isActive = activeZoneId === zone.id;
    const isDragOver = dragOverZone === zone.id;

    if (isDragOver) return { border: '#1e88e5', bg: 'rgba(30,136,229,0.15)', text: '#1e88e5' };
    if (isActive) return { border: '#0f2b5b', bg: 'rgba(15,43,91,0.12)', text: '#0f2b5b' };
    if (hasUpload || hasText) return { border: '#00c853', bg: 'rgba(0,200,83,0.08)', text: '#00c853' };
    return { border: '#94a3b8', bg: 'rgba(148,163,184,0.06)', text: '#64748b' };
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Vorder-/Rückseite Toggle */}
      <div className="flex bg-[#f1f3f5] rounded-lg p-1 gap-1">
        {(['front', 'back'] as ViewSide[]).map((s) => (
          <button
            key={s}
            onClick={() => onSideChange(s)}
            className={`
              px-5 py-2 rounded-md text-sm font-semibold transition-all duration-200
              ${side === s
                ? 'bg-white text-[#0f2b5b] shadow-sm'
                : 'text-[#64748b] hover:text-[#0f2b5b]'
              }
            `}
          >
            {s === 'front' ? 'Vorderseite' : 'Rückseite'}
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="relative bg-white rounded-2xl shadow-sm border border-[#e2e5ea] overflow-hidden"
        style={{ width: '100%', maxWidth: 480, aspectRatio: '3/4' }}
      >
        {/* Textil-Bild */}
        <img
          src={image}
          alt={template.name}
          className="w-full h-full object-contain select-none pointer-events-none"
          draggable={false}
          crossOrigin="anonymous"
        />

        {/* Platzierungszonen */}
        {currentZones.map((zone) => {
          const colors = getZoneColor(zone);
          const upload = uploads.find((u) => u.zoneId === zone.id);
          const textPlacement = textPlacements.find((t) => t.zoneId === zone.id);
          const isActive = activeZoneId === zone.id;

          return (
            <div
              key={zone.id}
              className="absolute cursor-pointer group"
              style={{
                left: `${zone.x}%`,
                top: `${zone.y}%`,
                width: `${zone.width}%`,
                height: `${zone.height}%`,
                border: `2px dashed ${colors.border}`,
                backgroundColor: colors.bg,
                borderRadius: 8,
                transition: 'border-color 0.2s, background-color 0.2s, box-shadow 0.2s',
                boxShadow: isActive ? '0 0 0 3px rgba(15,43,91,0.15)' : 'none',
              }}
              onClick={() => onZoneClick(zone)}
              onDrop={(e) => handleDrop(e, zone)}
              onDragOver={(e) => handleDragOver(e, zone.id)}
              onDragLeave={handleDragLeave}
            >
              {/* Uploaded Image */}
              {upload && (
                <img
                  src={upload.dataUrl}
                  alt={upload.fileName}
                  className="absolute inset-0 w-full h-full object-contain p-1"
                  style={{
                    transform: `scale(${upload.scale}) translate(${upload.offsetX}px, ${upload.offsetY}px)`,
                  }}
                  draggable={false}
                />
              )}

              {/* Text Placement */}
              {textPlacement && textPlacement.text.trim() && (
                <div
                  className="absolute inset-0 flex items-center justify-center p-1 overflow-hidden"
                  style={{
                    fontSize: `${textPlacement.fontSize}px`,
                    fontFamily: textPlacement.fontFamily,
                    color: textPlacement.color,
                    fontWeight: textPlacement.fontWeight,
                    letterSpacing: `${textPlacement.letterSpacing}px`,
                    lineHeight: 1.1,
                  }}
                >
                  <span className="text-center break-words w-full">{textPlacement.text}</span>
                </div>
              )}

              {/* Zone Label (nur wenn leer) */}
              {!upload && !(textPlacement && textPlacement.text.trim()) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 opacity-50 group-hover:opacity-90 transition-opacity">
                  <svg className="w-5 h-5" style={{ color: colors.text }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    {zone.type === 'text' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    )}
                  </svg>
                  <span
                    className="text-[10px] font-semibold tracking-wide text-center leading-tight px-1"
                    style={{ color: colors.text }}
                  >
                    {zone.label}
                  </span>
                </div>
              )}

              {/* Aktive Zone Indikator */}
              {isActive && (
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#0f2b5b] border-2 border-white shadow-sm" />
              )}
            </div>
          );
        })}
      </div>

      {/* Hinweis */}
      <p className="text-xs text-[#94a3b8] text-center max-w-sm">
        Klicke auf eine Zone oder ziehe eine Bilddatei direkt auf die gewünschte Stelle
      </p>
    </div>
  );
}

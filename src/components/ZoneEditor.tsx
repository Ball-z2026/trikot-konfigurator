// ============================================================
// ZoneEditor – Seitenpanel zum Bearbeiten einer Platzierungszone
// Upload-Bereich, Text-Eingabe, Schriftart, Farbe, Größe
// Design: Clean Sports Studio – Tabs, klare Sektionen
// ============================================================

import { useRef, useState } from 'react';
import { PlacementZone, UploadedAsset, TextPlacement } from '../types';
import { readFileAsDataUrl, generateId, formatFileSize } from '../utils/helpers';
import { defaultFonts, defaultColors } from '../data/templates';

interface Props {
  zone: PlacementZone;
  upload: UploadedAsset | undefined;
  textPlacement: TextPlacement | undefined;
  onUpload: (asset: UploadedAsset) => void;
  onRemoveUpload: (zoneId: string) => void;
  onTextChange: (placement: TextPlacement) => void;
  onClose: () => void;
}

export default function ZoneEditor({
  zone,
  upload,
  textPlacement,
  onUpload,
  onRemoveUpload,
  onTextChange,
  onClose,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'image' | 'text'>(
    zone.type === 'text' ? 'text' : 'image'
  );

  const currentText: TextPlacement = textPlacement || {
    zoneId: zone.id,
    text: '',
    fontSize: 24,
    fontFamily: 'Arial',
    color: '#000000',
    fontWeight: 'bold',
    letterSpacing: 1,
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
  };

  const handleScaleChange = (scale: number) => {
    if (!upload) return;
    onUpload({ ...upload, scale });
  };

  const updateText = (partial: Partial<TextPlacement>) => {
    onTextChange({ ...currentText, ...partial });
  };

  const showImageTab = zone.type === 'image' || zone.type === 'both';
  const showTextTab = zone.type === 'text' || zone.type === 'both';

  return (
    <div className="bg-white rounded-2xl border border-[#e2e5ea] shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#e2e5ea] bg-[#f8f9fa]">
        <div>
          <h3 className="text-base font-bold text-[#0f2b5b]">{zone.label}</h3>
          <p className="text-xs text-[#64748b] mt-0.5">{zone.description}</p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#e2e5ea] transition-colors text-[#64748b]"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      {zone.type === 'both' && (
        <div className="flex border-b border-[#e2e5ea]">
          {showImageTab && (
            <button
              onClick={() => setActiveTab('image')}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'image'
                  ? 'text-[#0f2b5b] border-b-2 border-[#0f2b5b]'
                  : 'text-[#94a3b8] hover:text-[#64748b]'
              }`}
            >
              Bild hochladen
            </button>
          )}
          {showTextTab && (
            <button
              onClick={() => setActiveTab('text')}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'text'
                  ? 'text-[#0f2b5b] border-b-2 border-[#0f2b5b]'
                  : 'text-[#94a3b8] hover:text-[#64748b]'
              }`}
            >
              Text eingeben
            </button>
          )}
        </div>
      )}

      <div className="p-5 space-y-5">
        {/* IMAGE TAB */}
        {((showImageTab && activeTab === 'image') || zone.type === 'image') && (
          <div className="space-y-4">
            {upload ? (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden bg-[#f8f9fa] border border-[#e2e5ea] aspect-video flex items-center justify-center">
                  <img
                    src={upload.dataUrl}
                    alt={upload.fileName}
                    className="max-w-full max-h-full object-contain"
                    style={{ transform: `scale(${upload.scale})` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-[#64748b]">
                  <span className="truncate max-w-[60%]">{upload.fileName}</span>
                  {upload.file && <span>{formatFileSize(upload.file.size)}</span>}
                </div>

                {/* Skalierung */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#3a3f4b] uppercase tracking-wider">
                    Skalierung: {Math.round(upload.scale * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.2"
                    max="3"
                    step="0.05"
                    value={upload.scale}
                    onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
                    className="w-full accent-[#0f2b5b]"
                  />
                </div>

                <button
                  onClick={() => onRemoveUpload(zone.id)}
                  className="w-full py-2.5 rounded-lg border-2 border-[#e53935] text-[#e53935] text-sm font-semibold hover:bg-[#e53935] hover:text-white transition-all"
                >
                  Bild entfernen
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#cbd5e1] rounded-xl p-8 text-center cursor-pointer hover:border-[#0f2b5b] hover:bg-[#f8f9fa] transition-all group"
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#f1f3f5] flex items-center justify-center group-hover:bg-[#0f2b5b]/10 transition-colors">
                  <svg className="w-6 h-6 text-[#94a3b8] group-hover:text-[#0f2b5b] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-[#3a3f4b]">
                  Klicken oder Datei hierher ziehen
                </p>
                <p className="text-xs text-[#94a3b8] mt-1">
                  PNG, JPG, SVG, WebP
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* TEXT TAB */}
        {((showTextTab && activeTab === 'text') || zone.type === 'text') && (
          <div className="space-y-4">
            {/* Text-Eingabe */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#3a3f4b] uppercase tracking-wider">
                Text
              </label>
              <input
                type="text"
                value={currentText.text}
                onChange={(e) => updateText({ text: e.target.value })}
                placeholder={zone.label === 'Nummer (Rücken)' ? 'z.B. 10' : 'z.B. MÜLLER'}
                className="w-full px-4 py-3 rounded-lg border border-[#e2e5ea] bg-white text-[#1a1a2e] text-sm font-medium focus:outline-none focus:border-[#0f2b5b] focus:ring-2 focus:ring-[#0f2b5b]/10 transition-all"
              />
            </div>

            {/* Schriftart */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#3a3f4b] uppercase tracking-wider">
                Schriftart
              </label>
              <select
                value={currentText.fontFamily}
                onChange={(e) => updateText({ fontFamily: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-[#e2e5ea] bg-white text-sm focus:outline-none focus:border-[#0f2b5b] transition-all"
              >
                {defaultFonts.map((f) => (
                  <option key={f} value={f} style={{ fontFamily: f }}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            {/* Schriftgröße */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#3a3f4b] uppercase tracking-wider">
                Schriftgröße: {currentText.fontSize}px
              </label>
              <input
                type="range"
                min="8"
                max="120"
                step="1"
                value={currentText.fontSize}
                onChange={(e) => updateText({ fontSize: parseInt(e.target.value) })}
                className="w-full accent-[#0f2b5b]"
              />
            </div>

            {/* Schriftstärke */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#3a3f4b] uppercase tracking-wider">
                Schriftstärke
              </label>
              <div className="flex gap-2">
                {[
                  { label: 'Normal', value: 'normal' },
                  { label: 'Fett', value: 'bold' },
                  { label: 'Extra Fett', value: '900' },
                ].map((w) => (
                  <button
                    key={w.value}
                    onClick={() => updateText({ fontWeight: w.value })}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                      currentText.fontWeight === w.value
                        ? 'bg-[#0f2b5b] text-white'
                        : 'bg-[#f1f3f5] text-[#64748b] hover:bg-[#e2e5ea]'
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Buchstabenabstand */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#3a3f4b] uppercase tracking-wider">
                Buchstabenabstand: {currentText.letterSpacing}px
              </label>
              <input
                type="range"
                min="0"
                max="20"
                step="0.5"
                value={currentText.letterSpacing}
                onChange={(e) => updateText({ letterSpacing: parseFloat(e.target.value) })}
                className="w-full accent-[#0f2b5b]"
              />
            </div>

            {/* Farbe */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#3a3f4b] uppercase tracking-wider">
                Textfarbe
              </label>
              <div className="flex flex-wrap gap-2">
                {defaultColors.map((c) => (
                  <button
                    key={c}
                    onClick={() => updateText({ color: c })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      currentText.color === c
                        ? 'border-[#0f2b5b] scale-110 shadow-md'
                        : 'border-[#e2e5ea] hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <label className="w-8 h-8 rounded-full border-2 border-[#e2e5ea] overflow-hidden cursor-pointer relative hover:scale-105 transition-all">
                  <input
                    type="color"
                    value={currentText.color}
                    onChange={(e) => updateText({ color: e.target.value })}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="w-full h-full bg-gradient-to-br from-red-400 via-green-400 to-blue-400" />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

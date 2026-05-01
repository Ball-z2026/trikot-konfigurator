import { useState, useCallback, useEffect, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Palette } from "lucide-react";
import {
  type CMYK,
  hexToCmyk,
  cmykToHex,
  formatCmyk,
  PRINT_COLORS,
} from "@/lib/cmyk";

interface CmykColorPickerProps {
  /** Aktueller HEX-Farbwert */
  value: string;
  /** Callback bei Farbänderung (gibt HEX zurück für Rendering) */
  onChange: (hex: string) => void;
  /** Optionaler Label-Text */
  label?: string;
  /** Kompakte Darstellung (nur Button, kein Label) */
  compact?: boolean;
  /** Deaktiviert */
  disabled?: boolean;
}

/**
 * CMYK-Farbwähler für den Textildruck.
 * Zeigt 4 Slider (C, M, Y, K) mit Vorschau und CMYK-Wert-Anzeige.
 * Intern wird in HEX konvertiert für das Canvas-Rendering.
 */
export function CmykColorPicker({
  value,
  onChange,
  label = "Textfarbe",
  compact = false,
  disabled = false,
}: CmykColorPickerProps) {
  const [cmyk, setCmyk] = useState<CMYK>(() => hexToCmyk(value || "#ffffff"));
  const [open, setOpen] = useState(false);

  // Sync bei externem value-Wechsel
  useEffect(() => {
    if (value) {
      const newCmyk = hexToCmyk(value);
      setCmyk(newCmyk);
    }
  }, [value]);

  const previewHex = useMemo(() => cmykToHex(cmyk.c, cmyk.m, cmyk.y, cmyk.k), [cmyk]);

  const handleSliderChange = useCallback(
    (channel: keyof CMYK, val: number) => {
      const newCmyk = { ...cmyk, [channel]: val };
      setCmyk(newCmyk);
      const hex = cmykToHex(newCmyk.c, newCmyk.m, newCmyk.y, newCmyk.k);
      onChange(hex);
    },
    [cmyk, onChange]
  );

  const handleInputChange = useCallback(
    (channel: keyof CMYK, rawVal: string) => {
      const val = Math.max(0, Math.min(100, parseInt(rawVal) || 0));
      handleSliderChange(channel, val);
    },
    [handleSliderChange]
  );

  const handlePresetClick = useCallback(
    (preset: (typeof PRINT_COLORS)[number]) => {
      setCmyk(preset.cmyk);
      onChange(preset.hex);
    },
    [onChange]
  );

  const sliderConfig: { key: keyof CMYK; label: string; color: string; trackClass: string }[] = [
    { key: "c", label: "C", color: "#00bcd4", trackClass: "bg-cyan-500" },
    { key: "m", label: "M", color: "#e91e63", trackClass: "bg-pink-500" },
    { key: "y", label: "Y", color: "#ffc107", trackClass: "bg-yellow-500" },
    { key: "k", label: "K", color: "#212121", trackClass: "bg-gray-800" },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={(e) => e.stopPropagation()}
        >
          {!compact && (
            <>
              <Palette className="w-3.5 h-3.5 text-muted-foreground" />
              <Label className="text-xs text-muted-foreground cursor-pointer">{label}</Label>
            </>
          )}
          <div
            className="w-7 h-7 rounded border-2 border-border shadow-sm transition-all hover:scale-110"
            style={{ backgroundColor: previewHex }}
          />
          <span className="text-[10px] text-muted-foreground font-mono">
            {formatCmyk(cmyk)}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 p-3"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-3">
          {/* Vorschau */}
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg border shadow-inner"
              style={{ backgroundColor: previewHex }}
            />
            <div className="flex-1">
              <p className="text-xs font-medium">CMYK-Farbwert</p>
              <p className="text-[11px] font-mono text-muted-foreground">
                {formatCmyk(cmyk)}
              </p>
              <p className="text-[10px] font-mono text-muted-foreground/60">
                HEX: {previewHex}
              </p>
            </div>
          </div>

          {/* CMYK Slider */}
          <div className="space-y-2">
            {sliderConfig.map(({ key, label: channelLabel, color }) => (
              <div key={key} className="flex items-center gap-2">
                <span
                  className="w-4 text-center text-[11px] font-bold"
                  style={{ color }}
                >
                  {channelLabel}
                </span>
                <div className="flex-1">
                  <Slider
                    value={[cmyk[key]]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={([val]) => handleSliderChange(key, val)}
                    className="cursor-pointer"
                  />
                </div>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={cmyk[key]}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  className="w-14 h-6 text-[11px] text-center px-1"
                />
              </div>
            ))}
          </div>

          {/* Vordefinierte Druckfarben */}
          <div className="space-y-1.5">
            <p className="text-[10px] text-muted-foreground font-medium">Druckfarben-Vorlagen</p>
            <div className="flex flex-wrap gap-1">
              {PRINT_COLORS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  className={`w-6 h-6 rounded border transition-all hover:scale-125 ${
                    previewHex.toLowerCase() === preset.hex.toLowerCase()
                      ? "border-primary ring-1 ring-primary/50 scale-110"
                      : "border-border"
                  }`}
                  style={{ backgroundColor: preset.hex }}
                  title={`${preset.name} (${formatCmyk(preset.cmyk)})`}
                  onClick={() => handlePresetClick(preset)}
                />
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Inline CMYK-Farbwähler (ohne Popover, direkt sichtbar)
 * Für die Farbpaletten-Definition im Admin-Bereich
 */
export function CmykColorPickerInline({
  value,
  onChange,
}: {
  value: string;
  onChange: (hex: string) => void;
}) {
  const [cmyk, setCmyk] = useState<CMYK>(() => hexToCmyk(value || "#ffffff"));

  useEffect(() => {
    if (value) {
      setCmyk(hexToCmyk(value));
    }
  }, [value]);

  const previewHex = useMemo(() => cmykToHex(cmyk.c, cmyk.m, cmyk.y, cmyk.k), [cmyk]);

  const handleChange = useCallback(
    (channel: keyof CMYK, val: number) => {
      const newCmyk = { ...cmyk, [channel]: val };
      setCmyk(newCmyk);
      onChange(cmykToHex(newCmyk.c, newCmyk.m, newCmyk.y, newCmyk.k));
    },
    [cmyk, onChange]
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded border shadow-inner"
          style={{ backgroundColor: previewHex }}
        />
        <span className="text-xs font-mono text-muted-foreground">{formatCmyk(cmyk)}</span>
      </div>
      {(["c", "m", "y", "k"] as const).map((ch) => {
        const colors = { c: "#00bcd4", m: "#e91e63", y: "#ffc107", k: "#212121" };
        const labels = { c: "C", m: "M", y: "Y", k: "K" };
        return (
          <div key={ch} className="flex items-center gap-2">
            <span className="w-3 text-[10px] font-bold" style={{ color: colors[ch] }}>
              {labels[ch]}
            </span>
            <Slider
              value={[cmyk[ch]]}
              min={0}
              max={100}
              step={1}
              onValueChange={([val]) => handleChange(ch, val)}
              className="flex-1 cursor-pointer"
            />
            <span className="w-8 text-[10px] text-right font-mono">{cmyk[ch]}%</span>
          </div>
        );
      })}
    </div>
  );
}

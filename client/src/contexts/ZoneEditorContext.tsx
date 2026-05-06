import { createContext, useContext, useState, useCallback, useRef } from "react";

export interface Zone {
  id: string;
  name: string;
  purpose: string;
  x: number; // Prozent
  y: number; // Prozent
  width: number; // Prozent
  height: number; // Prozent
  side?: "front" | "back";
  textStyle?: "arc" | "straight";
  arcDegree?: number;
  fontColor?: string;
  outlineColor?: string;
  outlineWidth?: number;
  fontStyle?: "block" | "serif" | "sans" | "script" | "outline" | "shadow";
  fontFamily?: string;
  fontWeight?: "normal" | "bold";
  fontSize?: number;
  rotation?: number; // Grad (0-360)
}

interface ZoneEditorData {
  zones: Zone[];
  selectedProductId: number | null;
  selectedPartId: number | null;
  orgId: number;
  sport?: string;
  category?: string;
  snapshot: Zone[]; // Snapshot beim Öffnen für Verwerfen
  templateImageUrl?: string; // URL des freigestellten/weißen Trikot-Bildes
  jerseyColor?: string; // Gewählte Trikotfarbe
}

interface ZoneEditorContextType {
  /** Daten die vom TemplateUpload gesetzt werden bevor zum Editor navigiert wird */
  editorData: ZoneEditorData | null;
  /** Setzt die Editor-Daten (aufgerufen vor Navigation zum Editor) */
  openEditor: (data: ZoneEditorData) => void;
  /** Callback: Zonen wurden gespeichert (aufgerufen vom Editor) */
  onSave: (zones: Zone[]) => void;
  /** Callback: Zonen wurden verworfen (aufgerufen vom Editor) */
  onDiscard: () => void;
  /** Registriert den Save-Callback (aufgerufen von TemplateUpload) */
  registerSaveCallback: (cb: (zones: Zone[]) => void) => void;
  /** Registriert den Discard-Callback (aufgerufen von TemplateUpload) */
  registerDiscardCallback: (cb: () => void) => void;
  /** Setzt editorData zurück nach Navigation zurück */
  clearEditor: () => void;
}

const ZoneEditorContext = createContext<ZoneEditorContextType | undefined>(undefined);

export function ZoneEditorProvider({ children }: { children: React.ReactNode }) {
  const [editorData, setEditorData] = useState<ZoneEditorData | null>(null);
  const saveCallbackRef = useRef<((zones: Zone[]) => void) | null>(null);
  const discardCallbackRef = useRef<(() => void) | null>(null);

  const openEditor = useCallback((data: ZoneEditorData) => {
    setEditorData(data);
  }, []);

  const onSave = useCallback((zones: Zone[]) => {
    saveCallbackRef.current?.(zones);
    setEditorData(null);
  }, []);

  const onDiscard = useCallback(() => {
    discardCallbackRef.current?.();
    setEditorData(null);
  }, []);

  const registerSaveCallback = useCallback((cb: (zones: Zone[]) => void) => {
    saveCallbackRef.current = cb;
  }, []);

  const registerDiscardCallback = useCallback((cb: () => void) => {
    discardCallbackRef.current = cb;
  }, []);

  const clearEditor = useCallback(() => {
    setEditorData(null);
  }, []);

  return (
    <ZoneEditorContext.Provider
      value={{
        editorData,
        openEditor,
        onSave,
        onDiscard,
        registerSaveCallback,
        registerDiscardCallback,
        clearEditor,
      }}
    >
      {children}
    </ZoneEditorContext.Provider>
  );
}

export function useZoneEditor() {
  const context = useContext(ZoneEditorContext);
  if (!context) {
    throw new Error("useZoneEditor must be used within ZoneEditorProvider");
  }
  return context;
}

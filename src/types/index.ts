// ============================================================
// Textil-Konfigurator – Type Definitions
// Design: Clean Sports Studio (Scandinavian Minimalism + Sports)
// ============================================================

export type TextilType = 'trikot' | 'hoodie' | 'jacket' | 'tshirt' | 'polo';
export type ViewSide = 'front' | 'back';

export interface PlacementZone {
  id: string;
  label: string;
  description: string;
  x: number;       // percentage from left (0-100)
  y: number;       // percentage from top (0-100)
  width: number;   // percentage width
  height: number;  // percentage height
  type: 'image' | 'text' | 'both';
  side: ViewSide;
  maxFileSize?: number; // in MB
  acceptedFormats?: string[];
}

export interface TextilTemplate {
  id: TextilType;
  name: string;
  description: string;
  icon: string;
  frontImage: string;
  backImage: string;
  zones: PlacementZone[];
}

export interface UploadedAsset {
  id: string;
  zoneId: string;
  file?: File;
  dataUrl: string;
  fileName: string;
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface Player {
  id: string;
  number: string;
  name: string;
  size?: string;
}

export interface TextPlacement {
  zoneId: string;
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  fontWeight: string;
  letterSpacing: number;
}

export interface KonfiguratorState {
  selectedTextil: TextilType;
  currentSide: ViewSide;
  uploads: UploadedAsset[];
  textPlacements: TextPlacement[];
  players: Player[];
  selectedPlayerId: string | null;
  textilColor: string;
}

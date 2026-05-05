/**
 * Grid Overlay Module
 * Zeichnet ein beschriftetes Raster (A-J horizontal, 1-10 vertikal) auf ein Bild.
 * Die KI kann dann exakt angeben, in welchen Zellen sich ein Element befindet.
 */
import sharp from "sharp";

const GRID_COLS = 10; // A-J
const GRID_ROWS = 10; // 1-10

/**
 * Erzeugt ein SVG-Overlay mit Rasterlinien und Beschriftungen
 */
function createGridSvg(width: number, height: number): string {
  const cellW = width / GRID_COLS;
  const cellH = height / GRID_ROWS;
  const colLabels = "ABCDEFGHIJ";
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`;
  
  // Semi-transparent grid lines
  for (let i = 1; i < GRID_COLS; i++) {
    const x = Math.round(i * cellW);
    svg += `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="rgba(255,0,0,0.5)" stroke-width="1"/>`;
  }
  for (let i = 1; i < GRID_ROWS; i++) {
    const y = Math.round(i * cellH);
    svg += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="rgba(255,0,0,0.5)" stroke-width="1"/>`;
  }
  
  // Cell labels (e.g., A1, B2, etc.) in top-left corner of each cell
  const fontSize = Math.max(10, Math.min(16, Math.round(cellW / 4)));
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const label = `${colLabels[col]}${row + 1}`;
      const x = Math.round(col * cellW + 2);
      const y = Math.round(row * cellH + fontSize + 1);
      // Background rect for readability
      svg += `<rect x="${x}" y="${y - fontSize}" width="${fontSize * 1.8}" height="${fontSize + 2}" fill="rgba(255,255,255,0.7)"/>`;
      svg += `<text x="${x + 1}" y="${y - 1}" font-family="Arial" font-size="${fontSize}" fill="red" font-weight="bold">${label}</text>`;
    }
  }
  
  svg += `</svg>`;
  return svg;
}

/**
 * Erzeugt ein Bild mit Grid-Overlay und gibt es als Base64-Data-URL zurück
 */
export async function createGridOverlayImage(imageBuffer: Buffer): Promise<{
  gridImageBase64: string;
  imageWidth: number;
  imageHeight: number;
  cellWidth: number;
  cellHeight: number;
}> {
  const metadata = await sharp(imageBuffer).metadata();
  const width = metadata.width || 800;
  const height = metadata.height || 1000;
  
  const gridSvg = createGridSvg(width, height);
  const gridBuffer = Buffer.from(gridSvg);
  
  const composited = await sharp(imageBuffer)
    .resize(width, height)
    .composite([{ input: gridBuffer, top: 0, left: 0 }])
    .png()
    .toBuffer();
  
  const base64 = composited.toString("base64");
  
  return {
    gridImageBase64: `data:image/png;base64,${base64}`,
    imageWidth: width,
    imageHeight: height,
    cellWidth: width / GRID_COLS,
    cellHeight: height / GRID_ROWS,
  };
}

/**
 * Konvertiert Grid-Zellen-Referenzen (z.B. "B2-D4") in Prozent-Koordinaten
 * B2-D4 bedeutet: Von Spalte B, Zeile 2 bis Spalte D, Zeile 4
 */
export function gridCellsToPercent(startCell: string, endCell: string): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const colLabels = "ABCDEFGHIJ";
  
  const startCol = colLabels.indexOf(startCell[0].toUpperCase());
  const startRow = parseInt(startCell.slice(1)) - 1;
  const endCol = colLabels.indexOf(endCell[0].toUpperCase());
  const endRow = parseInt(endCell.slice(1)) - 1;
  
  if (startCol < 0 || endCol < 0 || startRow < 0 || endRow < 0) {
    return { x: 0, y: 0, width: 10, height: 10 };
  }
  
  const x = (startCol / GRID_COLS) * 100;
  const y = (startRow / GRID_ROWS) * 100;
  const width = ((endCol - startCol + 1) / GRID_COLS) * 100;
  const height = ((endRow - startRow + 1) / GRID_ROWS) * 100;
  
  return {
    x: Math.round(x * 10) / 10,
    y: Math.round(y * 10) / 10,
    width: Math.round(width * 10) / 10,
    height: Math.round(height * 10) / 10,
  };
}

/**
 * Konvertiert eine feinere Position innerhalb einer Zelle
 * z.B. "Mitte von B2" = B-Spalte Mitte + Zeile 2 Mitte
 */
export function gridPositionToPercent(col: string, row: number, offsetX: number = 0, offsetY: number = 0): {
  x: number;
  y: number;
} {
  const colLabels = "ABCDEFGHIJ";
  const colIdx = colLabels.indexOf(col.toUpperCase());
  
  const cellPercent = 100 / GRID_COLS; // 10% per cell
  const x = colIdx * cellPercent + offsetX;
  const y = (row - 1) * cellPercent + offsetY;
  
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
}

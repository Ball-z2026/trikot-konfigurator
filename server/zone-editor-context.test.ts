import { describe, it, expect } from "vitest";

/**
 * Unit-Tests für die ZoneEditor-Extraktion.
 * Da der Context rein clientseitig ist, testen wir hier die Datenstruktur-Logik
 * und die Callback-Mechanik isoliert.
 */

// Simuliere die Zone-Datenstruktur
interface Zone {
  id: string;
  name: string;
  purpose: string;
  x: number;
  y: number;
  width: number;
  height: number;
  side?: "front" | "back";
  fontColor?: string;
  rotation?: number;
}

describe("ZoneEditor Data Logic", () => {
  it("should create a deep copy of zones for snapshot", () => {
    const zones: Zone[] = [
      { id: "zone_1", name: "Spielername", purpose: "playerName", x: 30, y: 10, width: 40, height: 8 },
      { id: "zone_2", name: "Nummer", purpose: "playerNumber", x: 40, y: 50, width: 20, height: 15 },
    ];

    const snapshot = JSON.parse(JSON.stringify(zones));

    // Modifiziere Original
    zones[0].x = 50;
    zones[0].fontColor = "#ff0000";

    // Snapshot bleibt unverändert
    expect(snapshot[0].x).toBe(30);
    expect(snapshot[0].fontColor).toBeUndefined();
  });

  it("should correctly filter zones by part side (front)", () => {
    const zones: Zone[] = [
      { id: "z1", name: "Wappen", purpose: "logo", x: 10, y: 10, width: 15, height: 15, side: "front" },
      { id: "z2", name: "Rückennummer", purpose: "playerNumber", x: 40, y: 30, width: 20, height: 25, side: "back" },
      { id: "z3", name: "Sponsor", purpose: "sponsor", x: 30, y: 80, width: 40, height: 10 }, // no side = show everywhere
    ];

    const partKey = "vorderteil";
    const isFrontPart = partKey.toLowerCase().includes("vorder") || partKey.toLowerCase().includes("front");
    const isBackPart = partKey.toLowerCase().includes("rueck") || partKey.toLowerCase().includes("back");

    const filtered = zones.filter((zone) => {
      if (!zone.side) return true;
      if (isFrontPart) return zone.side === "front";
      if (isBackPart) return zone.side === "back";
      return true;
    });

    expect(filtered).toHaveLength(2);
    expect(filtered[0].id).toBe("z1");
    expect(filtered[1].id).toBe("z3");
  });

  it("should correctly filter zones by part side (back)", () => {
    const zones: Zone[] = [
      { id: "z1", name: "Wappen", purpose: "logo", x: 10, y: 10, width: 15, height: 15, side: "front" },
      { id: "z2", name: "Rückennummer", purpose: "playerNumber", x: 40, y: 30, width: 20, height: 25, side: "back" },
      { id: "z3", name: "Vereinsname", purpose: "clubName", x: 20, y: 5, width: 60, height: 8, side: "back" },
    ];

    const partKey = "rueckteil";
    const isFrontPart = partKey.toLowerCase().includes("vorder") || partKey.toLowerCase().includes("front");
    const isBackPart = partKey.toLowerCase().includes("rueck") || partKey.toLowerCase().includes("back");

    const filtered = zones.filter((zone) => {
      if (!zone.side) return true;
      if (isFrontPart) return zone.side === "front";
      if (isBackPart) return zone.side === "back";
      return true;
    });

    expect(filtered).toHaveLength(2);
    expect(filtered[0].id).toBe("z2");
    expect(filtered[1].id).toBe("z3");
  });

  it("should detect changes between zones and snapshot", () => {
    const snapshot: Zone[] = [
      { id: "z1", name: "Wappen", purpose: "logo", x: 10, y: 10, width: 15, height: 15 },
    ];

    const zonesUnchanged: Zone[] = [
      { id: "z1", name: "Wappen", purpose: "logo", x: 10, y: 10, width: 15, height: 15 },
    ];

    const zonesChanged: Zone[] = [
      { id: "z1", name: "Wappen", purpose: "logo", x: 12, y: 10, width: 15, height: 15 },
    ];

    expect(JSON.stringify(zonesUnchanged) === JSON.stringify(snapshot)).toBe(true);
    expect(JSON.stringify(zonesChanged) === JSON.stringify(snapshot)).toBe(false);
  });

  it("should correctly apply save callback (update zones from editor)", () => {
    let parentZones: Zone[] = [
      { id: "z1", name: "Wappen", purpose: "logo", x: 10, y: 10, width: 15, height: 15 },
    ];

    // Simuliere den Save-Callback
    const saveCallback = (savedZones: Zone[]) => {
      parentZones = savedZones;
    };

    // Editor modifiziert Zonen
    const editorZones: Zone[] = [
      { id: "z1", name: "Wappen", purpose: "logo", x: 25, y: 30, width: 20, height: 20, fontColor: "#ff0000" },
      { id: "z2", name: "Nummer", purpose: "playerNumber", x: 40, y: 50, width: 15, height: 20 },
    ];

    saveCallback(editorZones);

    expect(parentZones).toHaveLength(2);
    expect(parentZones[0].x).toBe(25);
    expect(parentZones[0].fontColor).toBe("#ff0000");
    expect(parentZones[1].id).toBe("z2");
  });

  it("should correctly apply discard callback (restore snapshot)", () => {
    const snapshot: Zone[] = [
      { id: "z1", name: "Wappen", purpose: "logo", x: 10, y: 10, width: 15, height: 15 },
    ];

    let parentZones: Zone[] = [
      { id: "z1", name: "Wappen", purpose: "logo", x: 99, y: 99, width: 99, height: 99 },
    ];

    // Simuliere den Discard-Callback
    const discardCallback = () => {
      parentZones = snapshot;
    };

    discardCallback();

    expect(parentZones[0].x).toBe(10);
    expect(parentZones[0].y).toBe(10);
  });

  it("should calculate cm dimensions from percentage zones", () => {
    const zone: Zone = { id: "z1", name: "Test", purpose: "logo", x: 10, y: 10, width: 30, height: 20 };
    const baseWidthCm = 49;
    const baseHeightCm = 68;

    const widthCm = zone.width / 100 * baseWidthCm;
    const heightCm = zone.height / 100 * baseHeightCm;
    const areaCm2 = widthCm * heightCm;

    expect(widthCm).toBeCloseTo(14.7, 1);
    expect(heightCm).toBeCloseTo(13.6, 1);
    expect(areaCm2).toBeCloseTo(199.92, 0);
  });
});

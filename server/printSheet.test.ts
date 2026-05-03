import { describe, expect, it } from "vitest";
import {
  fillZonesForPlayer,
  validatePrintZonesForSize,
  type PrintZone,
  type PlayerPrintData,
} from "./printSheet";
import {
  getSizeDimensions,
  getAvailableSizes,
  getScaleFactors,
  getZoneDimensionsForSize,
  genderFromTeamCategory,
  type SizeCode,
  type SportCode,
  type GenderCode,
} from "../shared/sizeCharts";

// ═══════════════════════════════════════════════════════════════════
// 1. Maßtabellen (sizeCharts)
// ═══════════════════════════════════════════════════════════════════

describe("sizeCharts", () => {
  describe("getSizeDimensions", () => {
    it("gibt korrekte Maße für Fußball Herren L zurück", () => {
      const dims = getSizeDimensions("fussball", "L", "herren");
      expect(dims).toBeDefined();
      expect(dims!.body.widthCm).toBeGreaterThan(40);
      expect(dims!.body.widthCm).toBeLessThan(70);
      expect(dims!.body.heightCm).toBeGreaterThan(60);
      expect(dims!.body.heightCm).toBeLessThan(85);
      // Ärmel sollten existieren
      expect(dims!.sleeve).toBeDefined();
      expect(dims!.sleeve!.widthCm).toBeGreaterThan(10);
      expect(dims!.sleeve!.heightCm).toBeGreaterThan(15);
    });

    it("gibt korrekte Maße für Fußball Herren S zurück (kleiner als L)", () => {
      const dimsS = getSizeDimensions("fussball", "S", "herren");
      const dimsL = getSizeDimensions("fussball", "L", "herren");
      expect(dimsS).toBeDefined();
      expect(dimsL).toBeDefined();
      expect(dimsS!.body.widthCm).toBeLessThan(dimsL!.body.widthCm);
    });

    it("gibt korrekte Maße für Fußball Herren 3XL zurück (größer als L)", () => {
      const dims3XL = getSizeDimensions("fussball", "3XL", "herren");
      const dimsL = getSizeDimensions("fussball", "L", "herren");
      expect(dims3XL).toBeDefined();
      expect(dimsL).toBeDefined();
      expect(dims3XL!.body.widthCm).toBeGreaterThan(dimsL!.body.widthCm);
    });

    it("gibt undefined für unbekannte Größe zurück", () => {
      const dims = getSizeDimensions("fussball", "6XL" as SizeCode, "herren");
      expect(dims).toBeUndefined();
    });

    it("gibt Maße für Basketball zurück", () => {
      const dims = getSizeDimensions("basketball", "L", "herren");
      expect(dims).toBeDefined();
      expect(dims!.body.widthCm).toBeGreaterThan(40);
    });

    it("gibt Maße für Damen zurück (schmaler als Herren)", () => {
      const dimsDamen = getSizeDimensions("fussball", "L", "damen");
      const dimsHerren = getSizeDimensions("fussball", "L", "herren");
      expect(dimsDamen).toBeDefined();
      expect(dimsHerren).toBeDefined();
      expect(dimsDamen!.body.widthCm).toBeLessThanOrEqual(dimsHerren!.body.widthCm);
    });
  });

  describe("getAvailableSizes", () => {
    it("gibt verfügbare Größen für Fußball Herren zurück", () => {
      const sizes = getAvailableSizes("fussball", "herren");
      expect(sizes).toBeDefined();
      expect(sizes.length).toBeGreaterThan(3);
      // Sollte mindestens S, M, L, XL enthalten
      expect(sizes).toContain("S");
      expect(sizes).toContain("M");
      expect(sizes).toContain("L");
      expect(sizes).toContain("XL");
    });

    it("gibt verfügbare Größen für alle Sportarten zurück", () => {
      const sports: SportCode[] = ["fussball", "handball", "volleyball", "basketball"];
      for (const sport of sports) {
        const sizes = getAvailableSizes(sport, "herren");
        expect(sizes.length).toBeGreaterThan(0);
      }
    });
  });

  describe("getScaleFactors", () => {
    it("gibt Skalierungsfaktoren für S relativ zu L zurück", () => {
      const factors = getScaleFactors("fussball", "S", "herren");
      expect(factors).toBeDefined();
      if (factors) {
        expect(factors.bodyWidthScale).toBeLessThan(1);
        expect(factors.bodyHeightScale).toBeLessThanOrEqual(1);
      }
    });

    it("gibt Skalierungsfaktoren für 3XL relativ zu L zurück", () => {
      const factors = getScaleFactors("fussball", "3XL", "herren");
      expect(factors).toBeDefined();
      if (factors) {
        expect(factors.bodyWidthScale).toBeGreaterThan(1);
      }
    });

    it("gibt Faktor ~1.0 für L zurück", () => {
      const factors = getScaleFactors("fussball", "L", "herren");
      expect(factors).toBeDefined();
      if (factors) {
        expect(factors.bodyWidthScale).toBeCloseTo(1.0, 1);
        expect(factors.bodyHeightScale).toBeCloseTo(1.0, 1);
      }
    });
  });

  describe("genderFromTeamCategory", () => {
    it("erkennt Herren-Kategorien", () => {
      expect(genderFromTeamCategory("herren")).toBe("herren");
    });

    it("erkennt Damen-Kategorien", () => {
      // Funktion prüft exakt "damen" (lowercase)
      expect(genderFromTeamCategory("damen")).toBe("damen");
    });

    it("erkennt Jugend-Kategorien als Kinder", () => {
      // Funktion prüft includes("jugend")
      expect(genderFromTeamCategory("jugend")).toBe("kinder");
      expect(genderFromTeamCategory("a-jugend")).toBe("kinder");
      expect(genderFromTeamCategory("b-jugend")).toBe("kinder");
    });

    it("gibt herren als Default zurück", () => {
      expect(genderFromTeamCategory("unknown")).toBe("herren");
      expect(genderFromTeamCategory("Herren")).toBe("herren"); // Großschreibung → default
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// 2. Druckbogen-Hilfsfunktionen
// ═══════════════════════════════════════════════════════════════════

describe("fillZonesForPlayer", () => {
  const baseZones: PrintZone[] = [
    {
      purpose: "playerName",
      content: "",
      posXPercent: 10,
      posYPercent: 10,
      widthPercent: 80,
      heightPercent: 5,
    },
    {
      purpose: "playerNumber",
      content: "",
      posXPercent: 30,
      posYPercent: 30,
      widthPercent: 40,
      heightPercent: 30,
    },
    {
      purpose: "clubName",
      content: "",
      posXPercent: 10,
      posYPercent: 85,
      widthPercent: 80,
      heightPercent: 5,
    },
    {
      purpose: "playerInitials",
      content: "",
      posXPercent: 5,
      posYPercent: 5,
      widthPercent: 10,
      heightPercent: 5,
    },
    {
      purpose: "logo",
      content: "logo.png",
      posXPercent: 5,
      posYPercent: 5,
      widthPercent: 15,
      heightPercent: 10,
      isImage: true,
      imageUrl: "/manus-storage/logo.png",
    },
  ];

  const player: PlayerPrintData = {
    playerId: 1,
    playerName: "Max Mustermann",
    playerNumber: "10",
    size: "L",
    initials: "MM",
  };

  it("füllt Spielername korrekt ein", () => {
    const filled = fillZonesForPlayer(baseZones, player, "FC Musterstadt");
    const nameZone = filled.find((z) => z.purpose === "playerName");
    expect(nameZone?.content).toBe("Max Mustermann");
  });

  it("füllt Spielernummer korrekt ein", () => {
    const filled = fillZonesForPlayer(baseZones, player, "FC Musterstadt");
    const numberZone = filled.find((z) => z.purpose === "playerNumber");
    expect(numberZone?.content).toBe("10");
  });

  it("füllt Vereinsname korrekt ein", () => {
    const filled = fillZonesForPlayer(baseZones, player, "FC Musterstadt");
    const clubZone = filled.find((z) => z.purpose === "clubName");
    expect(clubZone?.content).toBe("FC Musterstadt");
  });

  it("füllt Initialen korrekt ein", () => {
    const filled = fillZonesForPlayer(baseZones, player, "FC Musterstadt");
    const initZone = filled.find((z) => z.purpose === "playerInitials");
    expect(initZone?.content).toBe("MM");
  });

  it("lässt Logo-Zonen unverändert", () => {
    const filled = fillZonesForPlayer(baseZones, player, "FC Musterstadt");
    const logoZone = filled.find((z) => z.purpose === "logo");
    expect(logoZone?.content).toBe("logo.png");
    expect(logoZone?.imageUrl).toBe("/manus-storage/logo.png");
  });

  it("verändert keine Positionen", () => {
    const filled = fillZonesForPlayer(baseZones, player, "FC Musterstadt");
    for (let i = 0; i < baseZones.length; i++) {
      expect(filled[i].posXPercent).toBe(baseZones[i].posXPercent);
      expect(filled[i].posYPercent).toBe(baseZones[i].posYPercent);
      expect(filled[i].widthPercent).toBe(baseZones[i].widthPercent);
      expect(filled[i].heightPercent).toBe(baseZones[i].heightPercent);
    }
  });

  it("gibt die gleiche Anzahl Zonen zurück", () => {
    const filled = fillZonesForPlayer(baseZones, player, "FC Musterstadt");
    expect(filled.length).toBe(baseZones.length);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 3. Verbandsregeln-Validierung für Druckbögen
// ═══════════════════════════════════════════════════════════════════

describe("validatePrintZonesForSize", () => {
  it("gibt keine Warnungen für korrekt dimensionierte Zonen", () => {
    // Rückennummer 30% der Höhe bei ~72cm Höhe = ~21.6cm → über 20cm Minimum
    const zones: PrintZone[] = [
      {
        purpose: "playerNumber",
        content: "10",
        posXPercent: 30,
        posYPercent: 30,
        widthPercent: 40,
        heightPercent: 30,
      },
    ];
    const warnings = validatePrintZonesForSize(
      zones,
      "rueckteil",
      "fussball",
      "L",
      "herren"
    );
    expect(warnings.length).toBe(0);
  });

  it("warnt bei zu kleiner Rückennummer (Fußball)", () => {
    // Rückennummer 10% der Höhe bei ~72cm = ~7.2cm → unter 20cm Minimum
    const zones: PrintZone[] = [
      {
        purpose: "playerNumber",
        content: "10",
        posXPercent: 30,
        posYPercent: 30,
        widthPercent: 40,
        heightPercent: 10,
      },
    ];
    const warnings = validatePrintZonesForSize(
      zones,
      "rueckteil",
      "fussball",
      "L",
      "herren"
    );
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0].warning).toContain("Rückennummer zu klein");
  });

  it("warnt bei zu kleiner Brustnummer (Fußball)", () => {
    // Brustnummer 5% der Höhe bei ~72cm = ~3.6cm → unter 10cm Minimum
    const zones: PrintZone[] = [
      {
        purpose: "playerNumber",
        content: "10",
        posXPercent: 10,
        posYPercent: 10,
        widthPercent: 15,
        heightPercent: 5,
      },
    ];
    const warnings = validatePrintZonesForSize(
      zones,
      "vorderteil",
      "fussball",
      "L",
      "herren"
    );
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0].warning).toContain("Brustnummer zu klein");
  });

  it("warnt bei zu kleinem Spielernamen", () => {
    // Spielername 1% der Höhe bei ~72cm = ~0.72cm → unter 2.5cm Minimum
    const zones: PrintZone[] = [
      {
        purpose: "playerName",
        content: "Mustermann",
        posXPercent: 10,
        posYPercent: 10,
        widthPercent: 80,
        heightPercent: 1,
      },
    ];
    const warnings = validatePrintZonesForSize(
      zones,
      "rueckteil",
      "fussball",
      "L",
      "herren"
    );
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0].warning).toContain("Spielername zu klein");
  });

  it("warnt bei zu kleinem Vereinsnamen", () => {
    // Vereinsname 1% der Höhe bei ~72cm = ~0.72cm → unter 2cm Minimum
    const zones: PrintZone[] = [
      {
        purpose: "clubName",
        content: "FC Musterstadt",
        posXPercent: 10,
        posYPercent: 85,
        widthPercent: 80,
        heightPercent: 1,
      },
    ];
    const warnings = validatePrintZonesForSize(
      zones,
      "rueckteil",
      "fussball",
      "L",
      "herren"
    );
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0].warning).toContain("Vereinsname zu klein");
  });

  it("prüft Volleyball-Mindestgrößen (15cm Rücken statt 20cm)", () => {
    // Rückennummer 22% der Höhe bei ~72cm = ~15.84cm → über 15cm Minimum für Volleyball
    const zones: PrintZone[] = [
      {
        purpose: "playerNumber",
        content: "7",
        posXPercent: 30,
        posYPercent: 30,
        widthPercent: 40,
        heightPercent: 22,
      },
    ];
    const warnings = validatePrintZonesForSize(
      zones,
      "rueckteil",
      "volleyball",
      "L",
      "herren"
    );
    expect(warnings.length).toBe(0);
  });

  it("gibt leere Warnungen für unbekannte Größe zurück", () => {
    const zones: PrintZone[] = [
      {
        purpose: "playerNumber",
        content: "10",
        posXPercent: 30,
        posYPercent: 30,
        widthPercent: 40,
        heightPercent: 5,
      },
    ];
    const warnings = validatePrintZonesForSize(
      zones,
      "rueckteil",
      "fussball",
      "6XL" as SizeCode,
      "herren"
    );
    expect(warnings.length).toBe(0); // Keine Validierung möglich
  });
});

// ═══════════════════════════════════════════════════════════════════
// 4. Größenabhängige Zonen-Berechnung
// ═══════════════════════════════════════════════════════════════════

describe("getZoneDimensionsForSize", () => {
  it("berechnet Zonen-Dimensionen für verschiedene Größen", () => {
    // Signatur: getZoneDimensionsForSize(widthPercent, heightPercent, partKey, sport, size, gender)
    const dimsL = getZoneDimensionsForSize(40, 30, "rueckteil", "fussball", "L", "herren");
    const dimsS = getZoneDimensionsForSize(40, 30, "rueckteil", "fussball", "S", "herren");

    expect(dimsL).toBeDefined();
    expect(dimsS).toBeDefined();

    if (dimsL && dimsS) {
      // S sollte kleinere absolute Maße haben als L
      expect(dimsS.widthCm).toBeLessThan(dimsL.widthCm);
      expect(dimsS.heightCm).toBeLessThanOrEqual(dimsL.heightCm);
    }
  });

  it("gibt undefined für unbekannte Größe zurück", () => {
    const result = getZoneDimensionsForSize(40, 30, "rueckteil", "fussball", "6XL" as SizeCode, "herren");
    expect(result).toBeUndefined();
  });

  it("berechnet korrekte cm-Werte für Ärmel", () => {
    const dims = getZoneDimensionsForSize(50, 50, "aermel_links", "fussball", "L", "herren");
    expect(dims).toBeDefined();
    if (dims) {
      // 50% der Ärmelbreite/-höhe
      expect(dims.widthCm).toBeGreaterThan(5);
      expect(dims.heightCm).toBeGreaterThan(5);
    }
  });
});

/**
 * Vordefinierte Textil-Templates die bei der Produkterstellung ausgewählt werden können.
 * Jedes Template definiert die Teile (Parts) und deren vordefinierte Platzierungszonen.
 *
 * Varianten:
 * - Sublimation: Alle Teile konfigurierbar (Vorderteil, Rückteil, Ärmel, Kragen, Bündchen)
 * - DTF (Direct-to-Film): Nur Vorderteil, Rückteil, Ärmel Links, Ärmel Rechts
 */

export interface TemplateZone {
  label: string;
  type: "image" | "text" | "both";
  purpose: "logo" | "clubLogo" | "playerName" | "playerNumber" | "playerInitials" | "clubName" | "custom";
  posX: number;
  posY: number;
  width: number;
  height: number;
  widthCm?: number;
  heightCm?: number;
  sortOrder: number;
}

export interface TemplatePart {
  key: string;
  label: string;
  imageUrl: string;
  sortOrder: number;
  /** Reale Breite des Parts in cm (Größe L, flach liegend) - für exakte cm-Umrechnung */
  realWidthCm: number;
  /** Reale Höhe des Parts in cm (Größe L, flach liegend) - für exakte cm-Umrechnung */
  realHeightCm: number;
  zones: TemplateZone[];
}

export type SportType = "fussball" | "handball" | "volleyball" | "basketball";

export interface SportTypeInfo {
  id: SportType;
  name: string;
  description: string;
  icon: string; // Emoji als einfaches Icon
}

export const SPORT_TYPES: SportTypeInfo[] = [
  {
    id: "fussball",
    name: "Fußball",
    description: "Fußballtrikots mit klassischem Schnitt",
    icon: "\u26BD",
  },
  {
    id: "handball",
    name: "Handball",
    description: "Handballtrikots mit engem Schnitt und kurzen Ärmeln",
    icon: "\u{1F93E}",
  },
  {
    id: "volleyball",
    name: "Volleyball",
    description: "Volleyballtrikots – leicht und atmungsaktiv",
    icon: "\u{1F3D0}",
  },
  {
    id: "basketball",
    name: "Basketball",
    description: "Basketballtrikots – ärmellos mit weitem Schnitt",
    icon: "\u{1F3C0}",
  },
];

export interface TextilTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  /** Sportart */
  sport: SportType;
  /** Druckverfahren */
  printMethod: "sublimation" | "dtf";
  /** Vorschaubild für die Auswahl */
  previewUrl: string;
  /**
   * Freie Zonen-Logik: Trainer kann eigene Zonen erstellen, verschieben, löschen.
   * Bei Trikots = false (feste Zonen vom Admin), bei Bekleidung = true.
   */
  freeZoneMode?: boolean;
  parts: TemplatePart[];
}

// ===== Gemeinsame Teile-Definitionen =====

const VORDERTEIL: TemplatePart = {
  key: "vorderteil",
  label: "Vorderteil",
  imageUrl: "/manus-storage/trikot_vorderteil_62bbbce9.png",
  sortOrder: 1,
  realWidthCm: 49,
  realHeightCm: 68,
  zones: [
    {
      label: "Vereinswappen",
      type: "image",
      purpose: "clubLogo",
      posX: 60,
      posY: 24,
      width: 18,
      height: 7,
      widthCm: 10,
      heightCm: 10,
      sortOrder: 1,
    },
    {
      label: "Brustnummer",
      type: "text",
      purpose: "playerNumber",
      posX: 25,
      posY: 25,
      width: 16,
      height: 10,
      widthCm: 12,
      heightCm: 15,
      sortOrder: 2,
    },
    {
      label: "Brust Sponsor",
      type: "both",
      purpose: "custom",
      posX: 20,
      posY: 45,
      width: 60,
      height: 10,
      widthCm: 26,
      heightCm: 10,
      sortOrder: 3,
    },
    {
      label: "Bauch Sponsor",
      type: "both",
      purpose: "custom",
      posX: 25,
      posY: 70,
      width: 50,
      height: 8,
      widthCm: 20,
      heightCm: 8,
      sortOrder: 4,
    },
  ],
};

const RUECKTEIL: TemplatePart = {
  key: "rueckteil",
  label: "Rückteil",
  imageUrl: "/manus-storage/trikot_rueckteil_5ffeb08a.png",
  sortOrder: 2,
  realWidthCm: 49,
  realHeightCm: 68,
  zones: [
    {
      label: "Vereinsname",
      type: "text",
      purpose: "clubName",
      posX: 20,
      posY: 10,
      width: 58,
      height: 14,
      widthCm: 25,
      heightCm: 10,
      sortOrder: 1,
    },
    {
      label: "Spielername",
      type: "text",
      purpose: "playerName",
      posX: 15,
      posY: 65,
      width: 70,
      height: 8,
      widthCm: 30,
      heightCm: 5,
      sortOrder: 2,
    },
    {
      label: "Spielernummer",
      type: "text",
      purpose: "playerNumber",
      posX: 33,
      posY: 29,
      width: 30,
      height: 30,
      widthCm: 20,
      heightCm: 25,
      sortOrder: 3,
    },
    {
      label: "Rücken Sponsor",
      type: "both",
      purpose: "custom",
      posX: 20,
      posY: 82,
      width: 60,
      height: 8,
      widthCm: 25,
      heightCm: 8,
      sortOrder: 4,
    },
  ],
};

const AERMEL_LINKS: TemplatePart = {
  key: "aermel_links",
  label: "Ärmel Links",
  imageUrl: "/manus-storage/trikot_aermel_1_1bcab551.png",
  sortOrder: 3,
  realWidthCm: 28.5,
  realHeightCm: 24,
  zones: [
    {
      label: "Ärmel Logo Links",
      type: "image",
      purpose: "logo",
      posX: 20,
      posY: 20,
      width: 60,
      height: 30,
      widthCm: 7,
      heightCm: 7,
      sortOrder: 1,
    },
  ],
};

const AERMEL_RECHTS: TemplatePart = {
  key: "aermel_rechts",
  label: "Ärmel Rechts",
  imageUrl: "/manus-storage/trikot_aermel_2_a499c4d3.png",
  sortOrder: 4,
  realWidthCm: 28.5,
  realHeightCm: 24,
  zones: [
    {
      label: "Ärmel Logo Rechts",
      type: "image",
      purpose: "logo",
      posX: 20,
      posY: 20,
      width: 60,
      height: 30,
      widthCm: 7,
      heightCm: 7,
      sortOrder: 1,
    },
  ],
};

const KRAGEN: TemplatePart = {
  key: "kragen",
  label: "Kragen",
  imageUrl: "/manus-storage/trikot_kragen_0bd5b194.png",
  sortOrder: 5,
  realWidthCm: 40,
  realHeightCm: 8,
  zones: [
    {
      label: "Kragen Text",
      type: "text",
      purpose: "custom",
      posX: 20,
      posY: 15,
      width: 60,
      height: 70,
      sortOrder: 1,
    },
  ],
};

const BUENDCHEN_LINKS: TemplatePart = {
  key: "buendchen_links",
  label: "Bündchen Links",
  imageUrl: "/manus-storage/trikot_buendchen_1_0e0583dd.png",
  sortOrder: 6,
  realWidthCm: 12,
  realHeightCm: 8,
  zones: [],
};

const BUENDCHEN_RECHTS: TemplatePart = {
  key: "buendchen_rechts",
  label: "Bündchen Rechts",
  imageUrl: "/manus-storage/trikot_buendchen_2_5cdec8b0.png",
  sortOrder: 7,
  realWidthCm: 12,
  realHeightCm: 8,
  zones: [],
};

// ===== Templates =====

export const TEXTIL_TEMPLATES: TextilTemplate[] = [
  // ===== Fußball =====
  {
    id: "fussball_sublimation",
    name: "Fußballtrikot – Sublimation",
    description:
      "Sublimations-Fußballtrikot: Alle Teile sind vollflächig bedruckbar. Vorderteil, Rückteil, Ärmel, Kragen und Bündchen können individuell gestaltet werden.",
    category: "Trikot",
    sport: "fussball",
    printMethod: "sublimation",
    previewUrl: "/manus-storage/fussballtrikot_4ce9a56b.png",
    parts: [
      { ...VORDERTEIL, imageUrl: "/manus-storage/fussball_front_8452f3c3.png" },
      { ...RUECKTEIL, imageUrl: "/manus-storage/fussball_back_d24ca9df.png" },
      { ...AERMEL_LINKS, imageUrl: "/manus-storage/fussball_aermel_links_832ef2a4.png" },
      { ...AERMEL_RECHTS, imageUrl: "/manus-storage/fussball_aermel_rechts_3bdb550b.png" },
      KRAGEN,
      BUENDCHEN_LINKS,
      BUENDCHEN_RECHTS,
    ],
  },
  {
    id: "fussball_dtf",
    name: "Fußballtrikot – DTF",
    description:
      "DTF-Fußballtrikot (Direct-to-Film): Bedruckung auf Vorderteil und Rückteil.",
    category: "Trikot",
    sport: "fussball",
    printMethod: "dtf",
    previewUrl: "/manus-storage/fussball_front_8452f3c3.png",
    parts: [
      { ...VORDERTEIL, imageUrl: "/manus-storage/fussball_front_8452f3c3.png" },
      { ...RUECKTEIL, imageUrl: "/manus-storage/fussball_back_d24ca9df.png" },
      { ...AERMEL_LINKS, imageUrl: "/manus-storage/fussball_aermel_links_832ef2a4.png" },
      { ...AERMEL_RECHTS, imageUrl: "/manus-storage/fussball_aermel_rechts_3bdb550b.png" },
    ],
  },
  // ===== Handball =====
  {
    id: "handball_sublimation",
    name: "Handballtrikot – Sublimation",
    description:
      "Sublimations-Handballtrikot: Enger Schnitt, alle Teile vollflächig bedruckbar.",
    category: "Trikot",
    sport: "handball",
    printMethod: "sublimation",
    previewUrl: "/manus-storage/handballtrikot_9b890907.png",
    parts: [
      { ...VORDERTEIL, imageUrl: "/manus-storage/handball_front_ee897f3c.png" },
      { ...RUECKTEIL, imageUrl: "/manus-storage/handball_back_3d1d47cb.png" },
      { ...AERMEL_LINKS, imageUrl: "/manus-storage/handball_aermel_links_b61658a7.png" },
      { ...AERMEL_RECHTS, imageUrl: "/manus-storage/handball_aermel_rechts_44c4a141.png" },
      KRAGEN,
      BUENDCHEN_LINKS,
      BUENDCHEN_RECHTS,
    ],
  },
  {
    id: "handball_dtf",
    name: "Handballtrikot – DTF",
    description:
      "DTF-Handballtrikot: Bedruckung auf Vorderteil und Rückteil.",
    category: "Trikot",
    sport: "handball",
    printMethod: "dtf",
    previewUrl: "/manus-storage/handball_front_ee897f3c.png",
    parts: [
      { ...VORDERTEIL, imageUrl: "/manus-storage/handball_front_ee897f3c.png" },
      { ...RUECKTEIL, imageUrl: "/manus-storage/handball_back_3d1d47cb.png" },
      { ...AERMEL_LINKS, imageUrl: "/manus-storage/handball_aermel_links_b61658a7.png" },
      { ...AERMEL_RECHTS, imageUrl: "/manus-storage/handball_aermel_rechts_44c4a141.png" },
    ],
  },
  // ===== Volleyball =====
  {
    id: "volleyball_sublimation",
    name: "Volleyballtrikot – Sublimation",
    description:
      "Sublimations-Volleyballtrikot: Leichter Stoff, alle Teile vollflächig bedruckbar.",
    category: "Trikot",
    sport: "volleyball",
    printMethod: "sublimation",
    previewUrl: "/manus-storage/volleyballtrikot_e57cb4f2.png",
    parts: [
      { ...VORDERTEIL, imageUrl: "/manus-storage/volleyball_front_4aa3a7dd.png" },
      { ...RUECKTEIL, imageUrl: "/manus-storage/volleyball_back_d241fc6b.png" },
      { ...AERMEL_LINKS, imageUrl: "/manus-storage/volleyball_aermel_links_e55abf17.png" },
      { ...AERMEL_RECHTS, imageUrl: "/manus-storage/volleyball_aermel_rechts_57e9a5db.png" },
      KRAGEN,
      BUENDCHEN_LINKS,
      BUENDCHEN_RECHTS,
    ],
  },
  {
    id: "volleyball_dtf",
    name: "Volleyballtrikot – DTF",
    description:
      "DTF-Volleyballtrikot: Bedruckung auf Vorderteil und Rückteil.",
    category: "Trikot",
    sport: "volleyball",
    printMethod: "dtf",
    previewUrl: "/manus-storage/volleyball_front_4aa3a7dd.png",
    parts: [
      { ...VORDERTEIL, imageUrl: "/manus-storage/volleyball_front_4aa3a7dd.png" },
      { ...RUECKTEIL, imageUrl: "/manus-storage/volleyball_back_d241fc6b.png" },
      { ...AERMEL_LINKS, imageUrl: "/manus-storage/volleyball_aermel_links_e55abf17.png" },
      { ...AERMEL_RECHTS, imageUrl: "/manus-storage/volleyball_aermel_rechts_57e9a5db.png" },
    ],
  },
  // ===== Basketball =====
  {
    id: "basketball_sublimation",
    name: "Basketballtrikot – Sublimation",
    description:
      "Sublimations-Basketballtrikot: Ärmelloser Schnitt, Vorderteil und Rückteil vollflächig bedruckbar.",
    category: "Trikot",
    sport: "basketball",
    printMethod: "sublimation",
    previewUrl: "/manus-storage/basketballtrikot_a83cd60a.png",
    parts: [
      { ...VORDERTEIL, imageUrl: "/manus-storage/basketball_front_81321f1e.png" },
      { ...RUECKTEIL, imageUrl: "/manus-storage/basketball_back_a2067eb9.png" },
    ],
  },
  {
    id: "basketball_dtf",
    name: "Basketballtrikot – DTF",
    description:
      "DTF-Basketballtrikot: Ärmellos, Bedruckung auf Vorderteil und Rückteil.",
    category: "Trikot",
    sport: "basketball",
    printMethod: "dtf",
    previewUrl: "/manus-storage/basketball_front_81321f1e.png",
    parts: [
      { ...VORDERTEIL, imageUrl: "/manus-storage/basketball_front_81321f1e.png" },
      { ...RUECKTEIL, imageUrl: "/manus-storage/basketball_back_a2067eb9.png" },
    ],
  },
  // ===== Bekleidung (freeZoneMode) =====
  // Bei diesen Produkten definiert der Trainer die Zonen selbst.
  // Nur das Vereinswappen ist vorbelegt und nicht löschbar.
  {
    id: "trainingshose",
    name: "Trainingshose",
    description:
      "Trainingshose mit freier Zonen-Platzierung. Vereinswappen vorbelegt, alle anderen Elemente frei positionierbar.",
    category: "Bekleidung",
    sport: "fussball",
    printMethod: "dtf",
    freeZoneMode: true,
    previewUrl: "/manus-storage/trainingshose_3f4fdf1f.png",
    parts: [
      {
        key: "vorderteil",
        label: "Vorderseite",
        imageUrl: "/manus-storage/trainingshose_front_67bb15f1.png",
        sortOrder: 1,
        realWidthCm: 32,
        realHeightCm: 100,
        zones: [
          {
            label: "Vereinswappen",
            type: "image",
            purpose: "clubLogo",
            posX: 55,
            posY: 8,
            width: 20,
            height: 10,
            widthCm: 6,
            heightCm: 6,
            sortOrder: 1,
          },
        ],
      },
      {
        key: "rueckteil",
        label: "Rückseite",
        imageUrl: "/manus-storage/trainingshose_back_e09d8296.png",
        sortOrder: 2,
        realWidthCm: 32,
        realHeightCm: 100,
        zones: [],
      },
    ],
  },
  {
    id: "aufwaermshirt",
    name: "Aufwärmshirt",
    description:
      "Langarm-Aufwärmshirt mit freier Zonen-Platzierung. Vereinswappen vorbelegt.",
    category: "Bekleidung",
    sport: "fussball",
    printMethod: "dtf",
    freeZoneMode: true,
    previewUrl: "/manus-storage/aufwaermshirt_f151206a.png",
    parts: [
      {
        key: "vorderteil",
        label: "Vorderseite",
        imageUrl: "/manus-storage/aufwaermshirt_front_460fc9f7.png",
        sortOrder: 1,
        realWidthCm: 52,
        realHeightCm: 70,
        zones: [
          {
            label: "Vereinswappen",
            type: "image",
            purpose: "clubLogo",
            posX: 55,
            posY: 15,
            width: 15,
            height: 10,
            widthCm: 8,
            heightCm: 8,
            sortOrder: 1,
          },
        ],
      },
      {
        key: "rueckteil",
        label: "Rückseite",
        imageUrl: "/manus-storage/aufwaermshirt_back_1669174b.png",
        sortOrder: 2,
        realWidthCm: 52,
        realHeightCm: 70,
        zones: [],
      },
    ],
  },
  {
    id: "zipjacke",
    name: "Zip-Jacke",
    description:
      "Jacke mit durchgehendem Reißverschluss und freier Zonen-Platzierung. Vereinswappen vorbelegt.",
    category: "Bekleidung",
    sport: "fussball",
    printMethod: "dtf",
    freeZoneMode: true,
    previewUrl: "/manus-storage/zipjacke_2f4f8631.png",
    parts: [
      {
        key: "vorderteil",
        label: "Vorderseite",
        imageUrl: "/manus-storage/zipjacke_front_4ece2783.png",
        sortOrder: 1,
        realWidthCm: 56,
        realHeightCm: 70,
        zones: [
          {
            label: "Vereinswappen",
            type: "image",
            purpose: "clubLogo",
            posX: 55,
            posY: 15,
            width: 15,
            height: 10,
            widthCm: 8,
            heightCm: 8,
            sortOrder: 1,
          },
        ],
      },
      {
        key: "rueckteil",
        label: "Rückseite",
        imageUrl: "/manus-storage/zipjacke_back_1abd7d90.png",
        sortOrder: 2,
        realWidthCm: 56,
        realHeightCm: 70,
        zones: [],
      },
    ],
  },
  {
    id: "halfzipper",
    name: "Half-Zipper",
    description:
      "Oberteil mit halbem Reißverschluss und freier Zonen-Platzierung. Vereinswappen vorbelegt.",
    category: "Bekleidung",
    sport: "fussball",
    printMethod: "dtf",
    freeZoneMode: true,
    previewUrl: "/manus-storage/halfzipper_71ba3b19.png",
    parts: [
      {
        key: "vorderteil",
        label: "Vorderseite",
        imageUrl: "/manus-storage/halfzipper_front_60a4f99e.png",
        sortOrder: 1,
        realWidthCm: 54,
        realHeightCm: 70,
        zones: [
          {
            label: "Vereinswappen",
            type: "image",
            purpose: "clubLogo",
            posX: 55,
            posY: 15,
            width: 15,
            height: 10,
            widthCm: 8,
            heightCm: 8,
            sortOrder: 1,
          },
        ],
      },
      {
        key: "rueckteil",
        label: "Rückseite",
        imageUrl: "/manus-storage/halfzipper_back_40fe9c68.png",
        sortOrder: 2,
        realWidthCm: 54,
        realHeightCm: 70,
        zones: [],
      },
    ],
  },
  {
    id: "warmejacke",
    name: "Warme Jacke",
    description:
      "Gefütterte Winterjacke mit Kapuze und freier Zonen-Platzierung. Vereinswappen vorbelegt.",
    category: "Bekleidung",
    sport: "fussball",
    printMethod: "dtf",
    freeZoneMode: true,
    previewUrl: "/manus-storage/warmejacke_509d120a.png",
    parts: [
      {
        key: "vorderteil",
        label: "Vorderseite",
        imageUrl: "/manus-storage/warmejacke_front_de4c6399.png",
        sortOrder: 1,
        realWidthCm: 58,
        realHeightCm: 75,
        zones: [
          {
            label: "Vereinswappen",
            type: "image",
            purpose: "clubLogo",
            posX: 55,
            posY: 18,
            width: 14,
            height: 9,
            widthCm: 8,
            heightCm: 8,
            sortOrder: 1,
          },
        ],
      },
      {
        key: "rueckteil",
        label: "Rückseite",
        imageUrl: "/manus-storage/warmejacke_back_b1c0bba2.png",
        sortOrder: 2,
        realWidthCm: 58,
        realHeightCm: 75,
        zones: [],
      },
    ],
  },
  // ===== Legacy (für bestehende Produkte) =====
  {
    id: "trikot_sublimation",
    name: "Trikot – Sublimation (Legacy)",
    description:
      "Sublimationstrikot: Alle Teile sind vollflächig bedruckbar.",
    category: "Trikot",
    sport: "fussball",
    printMethod: "sublimation",
    previewUrl: "/manus-storage/fussballtrikot_4ce9a56b.png",
    parts: [
      VORDERTEIL,
      RUECKTEIL,
      AERMEL_LINKS,
      AERMEL_RECHTS,
      KRAGEN,
      BUENDCHEN_LINKS,
      BUENDCHEN_RECHTS,
    ],
  },
  {
    id: "trikot_dtf",
    name: "Trikot – DTF (Legacy)",
    description:
      "DTF-Trikot: Bedruckung auf Vorderteil, Rückteil und Ärmel.",
    category: "Trikot",
    sport: "fussball",
    printMethod: "dtf",
    previewUrl: "/manus-storage/fussballtrikot_4ce9a56b.png",
    parts: [VORDERTEIL, RUECKTEIL, AERMEL_LINKS, AERMEL_RECHTS],
  },
];

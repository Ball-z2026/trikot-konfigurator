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
  imageUrl: "/manus-storage/trikot_vorderteil_58c100c1.png",
  sortOrder: 1,
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
  imageUrl: "/manus-storage/trikot_rueckteil_4f149411.png",
  sortOrder: 2,
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
  imageUrl: "/manus-storage/trikot_aermel_panel_1_ecb40de3.png",
  sortOrder: 3,
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
  imageUrl: "/manus-storage/trikot_aermel_panel_2_03dd3553.png",
  sortOrder: 4,
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
  imageUrl: "/manus-storage/trikot_kragen_db24b3df.png",
  sortOrder: 5,
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
  imageUrl: "/manus-storage/trikot_buendchen_1_6da9054f.png",
  sortOrder: 6,
  zones: [],
};

const BUENDCHEN_RECHTS: TemplatePart = {
  key: "buendchen_rechts",
  label: "Bündchen Rechts",
  imageUrl: "/manus-storage/trikot_buendchen_2_f87a5d72.png",
  sortOrder: 7,
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
    previewUrl: "/manus-storage/trikot_vorderteil_58c100c1.png",
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
    id: "fussball_dtf",
    name: "Fußballtrikot – DTF",
    description:
      "DTF-Fußballtrikot (Direct-to-Film): Bedruckung auf Vorderteil, Rückteil und Ärmel. Kragen und Bündchen sind nicht konfigurierbar.",
    category: "Trikot",
    sport: "fussball",
    printMethod: "dtf",
    previewUrl: "/manus-storage/trikot_vorderteil_58c100c1.png",
    parts: [VORDERTEIL, RUECKTEIL, AERMEL_LINKS, AERMEL_RECHTS],
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
    previewUrl: "/manus-storage/trikot_vorderteil_58c100c1.png",
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
    id: "handball_dtf",
    name: "Handballtrikot – DTF",
    description:
      "DTF-Handballtrikot: Bedruckung auf Vorderteil, Rückteil und Ärmel.",
    category: "Trikot",
    sport: "handball",
    printMethod: "dtf",
    previewUrl: "/manus-storage/trikot_vorderteil_58c100c1.png",
    parts: [VORDERTEIL, RUECKTEIL, AERMEL_LINKS, AERMEL_RECHTS],
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
    previewUrl: "/manus-storage/trikot_vorderteil_58c100c1.png",
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
    id: "volleyball_dtf",
    name: "Volleyballtrikot – DTF",
    description:
      "DTF-Volleyballtrikot: Bedruckung auf Vorderteil, Rückteil und Ärmel.",
    category: "Trikot",
    sport: "volleyball",
    printMethod: "dtf",
    previewUrl: "/manus-storage/trikot_vorderteil_58c100c1.png",
    parts: [VORDERTEIL, RUECKTEIL, AERMEL_LINKS, AERMEL_RECHTS],
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
    previewUrl: "/manus-storage/trikot_vorderteil_58c100c1.png",
    parts: [VORDERTEIL, RUECKTEIL],
  },
  {
    id: "basketball_dtf",
    name: "Basketballtrikot – DTF",
    description:
      "DTF-Basketballtrikot: Ärmellos, Bedruckung auf Vorderteil und Rückteil.",
    category: "Trikot",
    sport: "basketball",
    printMethod: "dtf",
    previewUrl: "/manus-storage/trikot_vorderteil_58c100c1.png",
    parts: [VORDERTEIL, RUECKTEIL],
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
    previewUrl: "/manus-storage/trainingshose_front_e7906657.svg",
    parts: [
      {
        key: "vorderteil",
        label: "Vorderseite",
        imageUrl: "/manus-storage/trainingshose_front_e7906657.svg",
        sortOrder: 1,
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
        imageUrl: "/manus-storage/trainingshose_back_efd89dfa.svg",
        sortOrder: 2,
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
    previewUrl: "/manus-storage/aufwaermshirt_front_ae95cc7f.svg",
    parts: [
      {
        key: "vorderteil",
        label: "Vorderseite",
        imageUrl: "/manus-storage/aufwaermshirt_front_ae95cc7f.svg",
        sortOrder: 1,
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
        imageUrl: "/manus-storage/aufwaermshirt_back_ce952a93.svg",
        sortOrder: 2,
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
    previewUrl: "/manus-storage/zipjacke_front_21c5a323.svg",
    parts: [
      {
        key: "vorderteil",
        label: "Vorderseite",
        imageUrl: "/manus-storage/zipjacke_front_21c5a323.svg",
        sortOrder: 1,
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
        imageUrl: "/manus-storage/zipjacke_back_8fd59235.svg",
        sortOrder: 2,
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
    previewUrl: "/manus-storage/halfzipper_front_a4f66ee1.svg",
    parts: [
      {
        key: "vorderteil",
        label: "Vorderseite",
        imageUrl: "/manus-storage/halfzipper_front_a4f66ee1.svg",
        sortOrder: 1,
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
        imageUrl: "/manus-storage/halfzipper_back_bb8bc0d7.svg",
        sortOrder: 2,
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
    previewUrl: "/manus-storage/warmejacke_front_88ce747a.svg",
    parts: [
      {
        key: "vorderteil",
        label: "Vorderseite",
        imageUrl: "/manus-storage/warmejacke_front_88ce747a.svg",
        sortOrder: 1,
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
        imageUrl: "/manus-storage/warmejacke_back_344fce0a.svg",
        sortOrder: 2,
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
    previewUrl: "/manus-storage/trikot_vorderteil_58c100c1.png",
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
    previewUrl: "/manus-storage/trikot_vorderteil_58c100c1.png",
    parts: [VORDERTEIL, RUECKTEIL, AERMEL_LINKS, AERMEL_RECHTS],
  },
];

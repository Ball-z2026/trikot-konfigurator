// ============================================================
// Textil-Templates mit vordefinierten Platzierungszonen
// Jede Zone hat prozentuale Koordinaten relativ zum Textil-Bild
// ============================================================

import { TextilTemplate } from '../types';

const ASSET_BASE = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663478683564/3uAVwxvCFYUTTcHvTxGuX2';

export const textilTemplates: TextilTemplate[] = [
  {
    id: 'trikot',
    name: 'Trikot',
    description: 'Sport-Trikot mit V-Ausschnitt',
    icon: '⚽',
    frontImage: `${ASSET_BASE}/trikot-front-T9qG5jn5PSvjgUtrQBSkFQ.webp`,
    backImage: `${ASSET_BASE}/trikot-front-T9qG5jn5PSvjgUtrQBSkFQ.webp`,
    zones: [
      {
        id: 'trikot-front-chest-center',
        label: 'Brust Mitte',
        description: 'Vereinslogo / Hauptsponsor',
        x: 30, y: 30, width: 40, height: 20,
        type: 'both', side: 'front',
        acceptedFormats: ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'],
      },
      {
        id: 'trikot-front-chest-left',
        label: 'Brust Links',
        description: 'Vereinswappen',
        x: 18, y: 25, width: 15, height: 12,
        type: 'image', side: 'front',
      },
      {
        id: 'trikot-front-chest-right',
        label: 'Brust Rechts',
        description: 'Ligalogo / Sponsor',
        x: 67, y: 25, width: 15, height: 12,
        type: 'image', side: 'front',
      },
      {
        id: 'trikot-front-belly',
        label: 'Bauch',
        description: 'Sponsor / Werbung',
        x: 25, y: 55, width: 50, height: 15,
        type: 'both', side: 'front',
      },
      {
        id: 'trikot-front-sleeve-left',
        label: 'Ärmel Links',
        description: 'Ärmel-Sponsor',
        x: 5, y: 28, width: 14, height: 10,
        type: 'image', side: 'front',
      },
      {
        id: 'trikot-front-sleeve-right',
        label: 'Ärmel Rechts',
        description: 'Ärmel-Sponsor',
        x: 81, y: 28, width: 14, height: 10,
        type: 'image', side: 'front',
      },
      {
        id: 'trikot-back-name',
        label: 'Name (Rücken)',
        description: 'Spielername',
        x: 20, y: 25, width: 60, height: 10,
        type: 'text', side: 'back',
      },
      {
        id: 'trikot-back-number',
        label: 'Nummer (Rücken)',
        description: 'Rückennummer',
        x: 30, y: 38, width: 40, height: 25,
        type: 'text', side: 'back',
      },
      {
        id: 'trikot-back-lower',
        label: 'Rücken Unten',
        description: 'Sponsor / Logo',
        x: 25, y: 68, width: 50, height: 12,
        type: 'both', side: 'back',
      },
    ],
  },
  {
    id: 'hoodie',
    name: 'Hoodie',
    description: 'Kapuzenpullover',
    icon: '🧥',
    frontImage: `${ASSET_BASE}/hoodie-front-mf65Y2hEGkBZKDYZVU5JHJ.webp`,
    backImage: `${ASSET_BASE}/hoodie-front-mf65Y2hEGkBZKDYZVU5JHJ.webp`,
    zones: [
      {
        id: 'hoodie-front-chest-center',
        label: 'Brust Mitte',
        description: 'Logo / Grafik',
        x: 28, y: 35, width: 44, height: 18,
        type: 'both', side: 'front',
      },
      {
        id: 'hoodie-front-chest-left',
        label: 'Brust Links',
        description: 'Kleines Logo / Wappen',
        x: 22, y: 30, width: 14, height: 10,
        type: 'image', side: 'front',
      },
      {
        id: 'hoodie-front-pocket',
        label: 'Känguru-Tasche',
        description: 'Taschendruck',
        x: 22, y: 60, width: 56, height: 14,
        type: 'both', side: 'front',
      },
      {
        id: 'hoodie-back-upper',
        label: 'Rücken Oben',
        description: 'Name / Schriftzug',
        x: 15, y: 25, width: 70, height: 12,
        type: 'text', side: 'back',
      },
      {
        id: 'hoodie-back-center',
        label: 'Rücken Mitte',
        description: 'Großes Logo / Grafik',
        x: 20, y: 38, width: 60, height: 30,
        type: 'both', side: 'back',
      },
    ],
  },
  {
    id: 'jacket',
    name: 'Jacke',
    description: 'Sportjacke mit Reißverschluss',
    icon: '🧤',
    frontImage: `${ASSET_BASE}/jacket-front-J2dMd9n3PUG9uK5pkLkYed.webp`,
    backImage: `${ASSET_BASE}/jacket-front-J2dMd9n3PUG9uK5pkLkYed.webp`,
    zones: [
      {
        id: 'jacket-front-chest-left',
        label: 'Brust Links',
        description: 'Vereinswappen / Logo',
        x: 18, y: 22, width: 16, height: 12,
        type: 'image', side: 'front',
      },
      {
        id: 'jacket-front-chest-right',
        label: 'Brust Rechts',
        description: 'Sponsor / Logo',
        x: 66, y: 22, width: 16, height: 12,
        type: 'image', side: 'front',
      },
      {
        id: 'jacket-front-belly',
        label: 'Bauch',
        description: 'Sponsor / Werbung',
        x: 22, y: 50, width: 56, height: 14,
        type: 'both', side: 'front',
      },
      {
        id: 'jacket-back-name',
        label: 'Name (Rücken)',
        description: 'Spielername / Vereinsname',
        x: 18, y: 20, width: 64, height: 10,
        type: 'text', side: 'back',
      },
      {
        id: 'jacket-back-center',
        label: 'Rücken Mitte',
        description: 'Großes Logo / Grafik',
        x: 22, y: 35, width: 56, height: 30,
        type: 'both', side: 'back',
      },
    ],
  },
  {
    id: 'tshirt',
    name: 'T-Shirt',
    description: 'Rundhals T-Shirt',
    icon: '👕',
    frontImage: `${ASSET_BASE}/tshirt-front-b7Y22WmJbCpnwmNL6cQaGV.webp`,
    backImage: `${ASSET_BASE}/tshirt-front-b7Y22WmJbCpnwmNL6cQaGV.webp`,
    zones: [
      {
        id: 'tshirt-front-chest-center',
        label: 'Brust Mitte',
        description: 'Hauptmotiv / Logo',
        x: 25, y: 28, width: 50, height: 25,
        type: 'both', side: 'front',
      },
      {
        id: 'tshirt-front-chest-left',
        label: 'Brust Links',
        description: 'Kleines Logo',
        x: 18, y: 22, width: 15, height: 12,
        type: 'image', side: 'front',
      },
      {
        id: 'tshirt-front-belly',
        label: 'Bauch',
        description: 'Text / Grafik',
        x: 22, y: 58, width: 56, height: 15,
        type: 'both', side: 'front',
      },
      {
        id: 'tshirt-back-name',
        label: 'Name (Rücken)',
        description: 'Spielername',
        x: 18, y: 22, width: 64, height: 10,
        type: 'text', side: 'back',
      },
      {
        id: 'tshirt-back-number',
        label: 'Nummer (Rücken)',
        description: 'Rückennummer',
        x: 30, y: 35, width: 40, height: 25,
        type: 'text', side: 'back',
      },
      {
        id: 'tshirt-back-lower',
        label: 'Rücken Unten',
        description: 'Sponsor / Logo',
        x: 22, y: 65, width: 56, height: 12,
        type: 'both', side: 'back',
      },
    ],
  },
  {
    id: 'polo',
    name: 'Poloshirt',
    description: 'Poloshirt mit Kragen',
    icon: '👔',
    frontImage: `${ASSET_BASE}/polo-front-K469Bthm28KX25SA8awyNS.webp`,
    backImage: `${ASSET_BASE}/polo-front-K469Bthm28KX25SA8awyNS.webp`,
    zones: [
      {
        id: 'polo-front-chest-left',
        label: 'Brust Links',
        description: 'Vereinswappen / Logo',
        x: 18, y: 25, width: 15, height: 12,
        type: 'image', side: 'front',
      },
      {
        id: 'polo-front-chest-right',
        label: 'Brust Rechts',
        description: 'Sponsor / Logo',
        x: 67, y: 25, width: 15, height: 12,
        type: 'image', side: 'front',
      },
      {
        id: 'polo-front-belly',
        label: 'Bauch',
        description: 'Sponsor / Werbung',
        x: 22, y: 55, width: 56, height: 14,
        type: 'both', side: 'front',
      },
      {
        id: 'polo-back-name',
        label: 'Name (Rücken)',
        description: 'Spielername / Vereinsname',
        x: 18, y: 22, width: 64, height: 10,
        type: 'text', side: 'back',
      },
      {
        id: 'polo-back-center',
        label: 'Rücken Mitte',
        description: 'Logo / Grafik',
        x: 25, y: 38, width: 50, height: 25,
        type: 'both', side: 'back',
      },
    ],
  },
];

export const getTemplate = (id: string): TextilTemplate | undefined =>
  textilTemplates.find((t) => t.id === id);

export const defaultFonts = [
  'Arial',
  'Bebas Neue',
  'Impact',
  'Oswald',
  'Roboto Condensed',
  'Anton',
  'Montserrat',
  'DM Sans',
];

export const defaultColors = [
  '#ffffff', '#000000', '#0f2b5b', '#e53935',
  '#00c853', '#ff9800', '#9c27b0', '#607d8b',
  '#ffd700', '#1e88e5',
];

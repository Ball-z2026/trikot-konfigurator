// Master-Prompt V1 (kiezfashion Meisterwerk) — bleibt AUSSCHLIESSLICH auf dem Server.
// Quelle: Drive "KIEZFASHION – MEISTERWERK MASTER-PROMPT V1", Abschnitte 1, 2, 4.

const MEISTERWERK_STYLE = `Editorial fine-art print, painted in an expressive fusion style that combines three principles simultaneously and densely, never sparsely:
(1) swirling, expressive impasto brushstrokes with strong complementary contrasts (blue/orange, yellow/violet) and visible paint texture;
(2) subtle early-cubist fragmentation of the architecture — geometric color facets, hinted multi-perspective, reduced planes — while the landmark stays clearly recognizable and architecturally correct;
(3) ornamental gold-square patterning, decorative borders and warm gold accents used as frame and as sky replacement.
Bright, luminous, high-key palette ("Hell" standard): warm glowing light, no dark muddy areas.`;

const COMPOSITION = `Fixed composition:
- Main subject: ONE landmark in the foreground, painted expressively, occupying most of the canvas, recognizable and architecturally correct.
- If background landmarks are named: hint them discreetly as small silhouettes.
- City name as typography: large, gold, slightly hand-lettered expressive serif letters, arched like a vintage postcard, painted INTO the artwork (not a pasted label).
- A small coordinates line at the bottom edge in the same gold.
- If a river is named: a fine gold outline of the river course woven into the background.
- Ornamental gold border around the artwork edge.
- Vintage canvas texture, slightly rounded corners.
- A small organic hand-painted signature "2222" in the lower right corner, blended into the brushwork.`;

const DTF_RULES = `Technical requirements for DTF textile printing:
- Bold, clearly separated color fields; no gradients fading into nothing; every transition ends on a defined surface.
- No pure white areas inside the motif.
- Brushstrokes coarse and visible, not microscopically fine.
- Gold rendered as warm yellow-ochre, never metallic yellow.
- Fully isolated artwork on a transparent background with clean alpha edges; gold ornaments must not fray.
- All text must be readable at A4 print size.`;

// Streetart-Linie = "BALLZ CITY-LINIE – Master-Prompt V1" + Stil-DNA aus den Köln-Referenzen (Juli 2026)
const STREETART_STYLE = `Graffiti street-art collage print design, isolated on transparent background.
Layers: (1) bold hand-painted dry-brush lettering of the city name — dry brush strokes with rough edges, slightly tilted;
(2) big painterly color blocks behind the lettering as rough brush swipes in blue, red and yellow;
(3) a finely drawn ink illustration of the motif, line-art with crosshatching, integrated into the collage with paint drips running down from it;
(4) halftone dot rasters, paint splatter and spray specks;
(5) small hand-drawn doodles as accents: a spiral and a small smiley — no crown, no heraldic elements.
No photorealism, no gradients, coarse textures, flat print-ready colors, clean alpha edges, suitable for DTF textile printing.`;

const STREETART_LIGHT = 'LIGHT version for dark textiles: white lettering, bright blue/red/yellow blocks, black ink illustration, no dark fill areas.';
const STREETART_DARK = 'DARK version for light textiles: black lettering, blue/red/yellow blocks, black ink illustration, no white fill areas.';

function pickBackgroundLandmarks(city, main) {
  const same = city.landmarks.filter(l => l.id !== main.id && l.zone === main.zone);
  const pool = same.length >= 2 ? same : city.landmarks.filter(l => l.id !== main.id);
  return pool.slice(0, 2);
}

function forbidden(city, main) {
  const lines = [...(city.traps || [])];
  // Wasser nur, wenn das Hauptmotiv am Wasser steht
  const waterZones = ['elbe', 'main', 'havel', 'nordufer', 'suedufer', 'alster', 'water'];
  if (!main || !waterZones.includes(main.zone) && !main.water) lines.push('No water, no river and no reflections in the foreground');
  lines.push('No official coat of arms, no club logos, no brand logos, no people, no cars');
  lines.push('Do not spell the city name differently than specified. Do not write any other words than the ones specified.');
  return lines;
}

export function buildPrompt({ city, landmark, style, line, variant = 'light' }) {
  const isVillage = !landmark || city.tier === 'village';
  const bg = isVillage ? [] : pickBackgroundLandmarks(city, landmark);
  const negatives = forbidden(city, landmark);
  if (isVillage) negatives.push('no city skyline, no invented church tower or castle');
  const extra = line || city.dialect_line || city.region_line;
  const dialect = extra ? `An additional small calligraphic line reads exactly: "${extra}", placed below the city name.` : '';
  const subject = isVillage
    ? `Subject: ${city.village_character}. A small ${city.state || 'German'} village scene, no specific landmark.`
    : `Subject: ${landmark.name}, ${city.display}. ${bg.length ? 'Background silhouettes: ' + bg.map(b => b.name).join(' and ') + '.' : ''} ${city.river ? 'River outline: ' + city.river + '.' : ''}`;

  if (style === 'streetart') {
    const motif = isVillage ? city.village_character : `${landmark.name}, ${city.display}`;
    const code = city.area_code ? `a code element "${city.area_code}" in a small stamped stencil box` : null;
    const slogan = extra ? `a second brush line "${extra}" in loose handwritten brush script` : null;
    return [
      STREETART_STYLE,
      variant === 'dark' ? STREETART_DARK : STREETART_LIGHT,
      `Motif illustration: ${motif}.`,
      `Text elements, exactly and nothing else: "${city.name}" (dominant)${slogan ? ', ' + slogan : ''}${code ? ', ' + code : ''}. A small hand-painted signature "2222" in the lower right corner.`,
      'Portrait backprint composition. No people, no cars, no logos, no coat of arms, no crown, no other words.',
      'Never: ' + negatives.join('; ') + '.'
    ].join('\n\n');
  }

  return [
    MEISTERWERK_STYLE,
    subject,
    `Color palette: ${city.palette}. No coat of arms.`,
    COMPOSITION,
    `The city name reads exactly "${city.name}". The coordinates line reads exactly "${city.coords}".`,
    dialect,
    DTF_RULES,
    'Never: ' + negatives.join('; ') + '.'
  ].filter(Boolean).join('\n\n');
}

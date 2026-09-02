// Freitext-Ort → Faktenkarte. Ersetzt die Handarbeit, die Markus bisher mit Claude macht.
// Quellen: Nominatim (Geokoordinaten, Bundesland), Wikipedia DE (Zusammenfassung), dann LLM baut die Karte.

const UA = 'kiezfashion-design-api/1.0 (kontakt@kiezfashion.de)';

async function geocode(place) {
  const u = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&extratags=1&limit=5&countrycodes=de,at,ch&q=${encodeURIComponent(place)}`;
  const r = await fetch(u, { headers: { 'user-agent': UA, 'accept-language': 'de' } });
  const list = await r.json();
  // Bevorzugt Ortschaften/Gemeinden, keine Straßen
  const ok = list.filter(x => ['city', 'town', 'village', 'hamlet', 'municipality', 'suburb', 'borough', 'quarter', 'neighbourhood', 'administrative'].includes(x.addresstype || x.type));
  return (ok[0] || list[0]) || null;
}

async function wikipedia(title) {
  const r = await fetch(`https://de.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, { headers: { 'user-agent': UA } });
  if (!r.ok) return null;
  const j = await r.json();
  if (j.type === 'disambiguation') return null;
  return j.extract || null;
}

async function wikipediaSearch(q) {
  const r = await fetch(`https://de.wikipedia.org/w/api.php?action=query&list=search&format=json&srlimit=3&srsearch=${encodeURIComponent(q)}`, { headers: { 'user-agent': UA } });
  const j = await r.json();
  return j.query?.search?.map(s => s.title) || [];
}

async function wikidataAreaCode(qid) {
  if (!qid) return null;
  try {
    const r = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`, { headers: { 'user-agent': UA } });
    const j = await r.json();
    const claims = j.entities?.[qid]?.claims || {};
    const v = claims.P473?.[0]?.mainsnak?.datavalue?.value; // local dialing code
    return v ? String(v).replace(/^\+49[ -]?/, '0').replace(/\s+/g, '') : null;
  } catch { return null; }
}

function fmtCoords(lat, lon) {
  const f = (v, p, n) => `${Math.abs(v).toFixed(4)} ${v >= 0 ? p : n}`;
  return `${f(+lat, 'N', 'S')}, ${f(+lon, 'E', 'W')}`;
}

export async function research(openai, place, model) {
  const geo = await geocode(place);
  if (!geo) return { error: 'not_found' };
  const a = geo.address || {};
  const name = a.village || a.hamlet || a.town || a.city || a.municipality || a.suburb || a.borough || geo.name || place;
  const state = a.state || '';
  const county = a.county || '';
  const coords = fmtCoords(geo.lat, geo.lon);
  const areaCode = await wikidataAreaCode(geo.extratags?.wikidata);

  let extract = await wikipedia(name);
  if (!extract) {
    const titles = await wikipediaSearch(`${name} ${county || state}`);
    for (const t of titles) { extract = await wikipedia(t); if (extract) break; }
  }
  const sightsExtract = (await Promise.all((await wikipediaSearch(`${name} Sehenswürdigkeiten Kirche Wahrzeichen`)).slice(0, 2).map(wikipedia))).filter(Boolean).join('\n');

  const sys = `Du bist Rechercheur für ein Kunstdruck-Label. Erstelle eine Faktenkarte als JSON für den Ort. Nur belegbare Fakten aus den gelieferten Quellen oder allgemein bekanntes Wissen; im Zweifel weglassen. Antworte NUR mit JSON:
{
 "display": "Ortsname wie im Sprachgebrauch",
 "name": "ORTSNAME IN GROSSBUCHSTABEN (max. 14 Zeichen, sonst kurze Form, z.B. FRANKFURT)",
 "region_line": "kurze Regionsbezeichnung für eine Zusatzzeile, z.B. Nordheide, Rheinland, Allgäu, Ostsee",
 "river": "Fluss oder See direkt am Ort, sonst null",
 "tier": "landmark" | "village",
 "landmarks": [ {"name":"englische Beschreibung für einen Bildprompt, architektonisch präzise","de":"deutscher Name","water":true|false} ],
 "village_character": "englische Beschreibung der typischen Bauweise und Landschaft (Region, Dachform, Material, Vegetation), nur wenn tier=village",
 "palette": "3 Farben auf Englisch, passend zur Region",
 "traps": ["geografische Fallen, die der Bildgenerator vermeiden muss"],
 "dialect_line": "kurzer Gruß oder Spruch im echten lokalen Dialekt (Platt, Berlinerisch, Kölsch, Bairisch ...), Schreibweise verifiziert, max. 4 Wörter, sonst null",
 "area_code": "Telefonvorwahl des Ortes mit führender 0, sonst null"
}
tier=landmark nur, wenn mindestens EIN überregional erkennbares Bauwerk existiert. Sonst tier=village. Niemals Wappen, Vereinslogos, Personen.`;

  const res = await openai.chat.completions.create({
    model, temperature: 0.2,
    messages: [{ role: 'system', content: sys }, { role: 'user', content: `Ort: ${name}\nLandkreis: ${county}\nBundesland: ${state}\nKoordinaten: ${coords}\n\nWikipedia:\n${extract || '(kein Artikel)'}\n\nWeitere Quellen:\n${sightsExtract || '(keine)'}` }]
  });
  let card;
  try { card = JSON.parse(res.choices[0].message.content.replace(/```json|```/g, '').trim()); }
  catch { return { error: 'card_unparsable' }; }
  card.id = name.toLowerCase().replace(/[^a-z0-9äöüß]+/g, '_');
  card.coords = coords;
  if (areaCode) card.area_code = areaCode;
  card.state = state;
  card.landmarks = (card.landmarks || []).map((l, i) => ({ id: `lm${i + 1}`, zone: l.water ? 'water' : 'land', ...l }));
  return card;
}

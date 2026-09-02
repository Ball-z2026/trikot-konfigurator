import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import OpenAI from 'openai';
import { customAlphabet } from 'nanoid';
import { buildPrompt } from './lib/prompt.js';
import { research } from './lib/research.js';
import { verifyProxy, verifyTurnstile, checkLimits, cleanLine, textQA, whiteCheck, makePreview, signPreview } from './lib/guards.js';

const env = {
  PORT: 3100, LIMIT_PER_SESSION: 3, LIMIT_PER_IP_DAY: 10, LIMIT_GLOBAL_DAY: 300, MAX_PARALLEL_JOBS: 3,
  IMAGE_MODEL: 'gpt-image-1', IMAGE_SIZE: '1024x1536', IMAGE_QUALITY: 'medium', QA_MODEL: 'gpt-4o-mini',
  PUBLIC_BASE_URL: 'http://localhost:3100', PREVIEW_TTL_DAYS: 7, ...process.env
};
if (!env.OPENAI_API_KEY) { console.error('OPENAI_API_KEY fehlt'); process.exit(1); }
const SIGN_SECRET = env.SHOPIFY_APP_SECRET || crypto.randomBytes(16).toString('hex');

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
const data = JSON.parse(await fs.readFile(new URL('./data/cities.json', import.meta.url)));
const cityById = Object.fromEntries(data.cities.map(c => [c.id, c]));
// kuratierte Städte = bevorzugt; alles andere wird recherchiert und 30 Tage gecacht
const cardCache = new Map();
const norm = s => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
async function resolvePlace(place) {
  const key = norm(place);
  const curated = data.cities.find(c => c.id === key || norm(c.display) === key || norm(c.name) === key);
  if (curated) return { ...curated, tier: 'landmark' };
  const hit = cardCache.get(key);
  if (hit && Date.now() - hit.at < 30 * 86400e3) return hit.card;
  const card = await research(openai, place, env.QA_MODEL);
  if (card.error) return null;
  cardCache.set(key, { at: Date.now(), card });
  await fs.writeFile(path.join(STORE, 'cards', `${card.id}.json`), JSON.stringify(card, null, 2));
  return card;
}
const STORE = path.resolve('storage');
for (const d of ['masters', 'previews', 'jobs', 'claimed', 'cards']) await fs.mkdir(path.join(STORE, d), { recursive: true });
const newId = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 4);

// ---------- Jobs / Queue ----------
const jobs = new Map();
const queue = [];
let running = 0;
function enqueue(job) { queue.push(job); pump(); }
async function pump() {
  while (running < +env.MAX_PARALLEL_JOBS && queue.length) {
    const job = queue.shift(); running++;
    runJob(job).catch(e => { job.status = 'error'; job.error = String(e.message || e); })
      .finally(() => { running--; pump(); });
  }
}

async function generateOnce(prompt) {
  const r = await openai.images.generate({
    model: env.IMAGE_MODEL, prompt, size: env.IMAGE_SIZE, quality: env.IMAGE_QUALITY,
    background: 'transparent', output_format: 'png', n: 1
  });
  return Buffer.from(r.data[0].b64_json, 'base64');
}

async function runJob(job) {
  job.status = 'running';
  const { city, landmark, style, line, variant } = job.input;
  const prompt = buildPrompt({ city, landmark, style, line, variant });
  job.promptHash = crypto.createHash('sha1').update(prompt).digest('hex').slice(0, 10);

  let png, qa, attempt = 0;
  while (attempt < 2) {
    attempt++;
    png = await generateOnce(prompt);
    qa = await textQA(openai, png, { cityName: city.name, coords: style === 'streetart' ? (city.area_code || null) : city.coords, line: line || city.dialect_line || city.region_line, model: env.QA_MODEL });
    const white = await whiteCheck(png);
    if (white > 0.02) qa = { pass: false, reason: `pure white ${(white * 100).toFixed(1)}%` };
    job.qa.push({ attempt, ...qa });
    if (qa.pass) break;
  }
  if (!qa.pass) { job.status = 'qa_failed'; return; }

  const designId = `KF-${city.id.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)}-${(landmark ? landmark.id : 'DORF').toUpperCase().slice(0, 8)}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${newId()}`;
  await fs.writeFile(path.join(STORE, 'masters', `${designId}_PRINT_MASTER.png`), png);
  await fs.writeFile(path.join(STORE, 'previews', `${designId}.png`), await makePreview(png));
  const exp = Date.now() + +env.PREVIEW_TTL_DAYS * 86400e3;
  const sig = signPreview(designId, exp, SIGN_SECRET);
  job.designId = designId;
  job.preview = `${env.PUBLIC_BASE_URL}/api/kiez/preview/${designId}.png?exp=${exp}&sig=${sig}`;
  job.expires = new Date(exp).toISOString();
  job.status = 'done';
  await fs.writeFile(path.join(STORE, 'jobs', `${designId}.json`), JSON.stringify({ ...job, input: { city: city.id, landmark: landmark?.id || null, style, line }, card: city, prompt }, null, 2));
}

// ---------- App ----------
const app = express();
app.set('trust proxy', true);
app.use(express.json({ limit: '64kb' }));
app.use('/test', express.static('public'));

const proxyGuard = (req, res, next) => verifyProxy(req.query, env.SHOPIFY_APP_SECRET) ? next() : res.status(403).json({ error: 'bad signature' });

app.get('/api/kiez/cities', proxyGuard, (req, res) => {
  res.json({
    styles: data.styles, garments: data.garments,
    cities: data.cities.map(c => ({ id: c.id, name: c.display, landmarks: c.landmarks.map(l => ({ id: l.id, name: l.de })) }))
  });
});

// Freitext-Ort → Faktenkarte (Kunde sieht Ortsname, Region, ggf. Motivwahl)
app.get('/api/kiez/resolve', proxyGuard, async (req, res) => {
  const card = await resolvePlace(req.query.place);
  if (!card) return res.status(404).json({ error: 'place_not_found' });
  res.json({ id: card.id, name: card.display, region: card.region_line, tier: card.tier, landmarks: (card.landmarks || []).map(l => ({ id: l.id, name: l.de })) });
});

app.post('/api/kiez/generate', proxyGuard, async (req, res) => {
  const { place, landmark: lid, style, garment, line, session, turnstile, variant } = req.body || {};
  if (!place || !data.styles[style] || !data.garments.includes(garment) || !session)
    return res.status(400).json({ error: 'invalid input' });
  const city = await resolvePlace(place);
  if (!city) return res.status(404).json({ error: 'place_not_found' });
  const landmark = city.tier === 'village' ? null : (city.landmarks.find(l => l.id === lid) || city.landmarks[0]);
  if (city.tier !== 'village' && !landmark) return res.status(400).json({ error: 'invalid landmark' });
  const cleaned = cleanLine(line);
  if (cleaned === null) return res.status(400).json({ error: 'line not allowed' });
  const ip = req.ip;
  if (!(await verifyTurnstile(turnstile, ip, env.TURNSTILE_SECRET))) return res.status(403).json({ error: 'turnstile' });
  const limited = checkLimits({ session, ip }, env);
  if (limited) return res.status(429).json({ error: 'limit', scope: limited });

  const jobId = 'kf_' + crypto.randomBytes(8).toString('hex');
  const job = { jobId, status: 'queued', qa: [], created: new Date().toISOString(), input: { city, landmark, style, garment, line: cleaned, variant: variant === 'dark' ? 'dark' : 'light' } };
  jobs.set(jobId, job);
  enqueue(job);
  res.json({ jobId, eta: 45 + queue.length * 40 });
});

app.get('/api/kiez/job/:id', proxyGuard, (req, res) => {
  const j = jobs.get(req.params.id);
  if (!j) return res.status(404).json({ error: 'unknown job' });
  res.json({ status: j.status, designId: j.designId, preview: j.preview, expires: j.expires, error: j.error, qa: j.status === 'qa_failed' ? j.qa.at(-1)?.reason : undefined });
});

app.get('/api/kiez/preview/:file', async (req, res) => {
  const designId = req.params.file.replace(/\.png$/, '');
  const { exp, sig } = req.query;
  if (!exp || +exp < Date.now() || signPreview(designId, exp, SIGN_SECRET) !== sig) return res.status(403).end();
  try { res.type('png').send(await fs.readFile(path.join(STORE, 'previews', `${designId}.png`))); }
  catch { res.status(404).end(); }
});

app.post('/api/kiez/claim', proxyGuard, async (req, res) => {
  const { designId, session } = req.body || {};
  try {
    await fs.access(path.join(STORE, 'masters', `${designId}_PRINT_MASTER.png`));
    await fs.writeFile(path.join(STORE, 'claimed', `${designId}.json`), JSON.stringify({ designId, session, at: new Date().toISOString() }));
    res.json({ ok: true });
  } catch { res.status(404).json({ error: 'unknown design' }); }
});

// Shopify orders/paid → Design als bezahlt markieren (Ableitungen folgen in Stufe 2)
app.post('/webhook/shopify/orders_paid', express.raw({ type: '*/*' }), async (req, res) => {
  if (env.SHOPIFY_APP_SECRET) {
    const h = crypto.createHmac('sha256', env.SHOPIFY_APP_SECRET).update(req.body).digest('base64');
    if (h !== req.get('X-Shopify-Hmac-Sha256')) return res.status(401).end();
  }
  const order = JSON.parse(req.body);
  const ids = (order.line_items || []).flatMap(li => (li.properties || []).filter(p => p.name === '_design_id').map(p => p.value));
  for (const id of ids) await fs.writeFile(path.join(STORE, 'claimed', `${id}.paid.json`), JSON.stringify({ order: order.name, at: new Date().toISOString() }));
  console.log('orders/paid', order.name, ids);
  res.status(200).end();
});

// Aufräumen: nicht reservierte Entwürfe nach TTL löschen
setInterval(async () => {
  const ttl = +env.PREVIEW_TTL_DAYS * 86400e3;
  for (const f of await fs.readdir(path.join(STORE, 'previews'))) {
    const id = f.replace('.png', '');
    const p = path.join(STORE, 'previews', f);
    const st = await fs.stat(p);
    const claimed = await fs.access(path.join(STORE, 'claimed', `${id}.json`)).then(() => true, () => false);
    if (!claimed && Date.now() - st.mtimeMs > ttl) {
      await fs.rm(p, { force: true });
      await fs.rm(path.join(STORE, 'masters', `${id}_PRINT_MASTER.png`), { force: true });
    }
  }
}, 6 * 3600e3);

app.listen(+env.PORT, () => console.log(`kiez-design-api auf :${env.PORT} — Test-UI: /test/`));

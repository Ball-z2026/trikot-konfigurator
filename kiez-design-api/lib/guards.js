import crypto from 'node:crypto';
import sharp from 'sharp';

// ---------- Shopify App Proxy Signatur ----------
export function verifyProxy(query, secret) {
  if (!secret) return true; // Test-Modus
  const { signature, ...rest } = query;
  if (!signature) return false;
  const msg = Object.keys(rest).sort().map(k => `${k}=${[].concat(rest[k]).join(',')}`).join('');
  const calc = crypto.createHmac('sha256', secret).update(msg).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(calc), Buffer.from(signature));
}

// ---------- Turnstile ----------
export async function verifyTurnstile(token, ip, secret) {
  if (!secret) return true;
  if (!token) return false;
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token, remoteip: ip })
  });
  const j = await r.json();
  return !!j.success;
}

// ---------- Rate Limits (im Speicher, Tages-Reset) ----------
const counters = { session: new Map(), ip: new Map(), global: { day: '', n: 0 } };
const today = () => new Date().toISOString().slice(0, 10);
function bump(map, key) {
  const d = today();
  const cur = map.get(key);
  const n = cur && cur.day === d ? cur.n + 1 : 1;
  map.set(key, { day: d, n });
  return n;
}
export function checkLimits({ session, ip }, env) {
  if (counters.global.day !== today()) counters.global = { day: today(), n: 0 };
  if (counters.global.n >= +env.LIMIT_GLOBAL_DAY) return 'global';
  const s = counters.session.get(session);
  if (s && s.day === today() && s.n >= +env.LIMIT_PER_SESSION) return 'session';
  const i = counters.ip.get(ip);
  if (i && i.day === today() && i.n >= +env.LIMIT_PER_IP_DAY) return 'ip';
  bump(counters.session, session); bump(counters.ip, ip); counters.global.n++;
  return null;
}

// ---------- Dialekt-Zeile ----------
const BLOCKLIST = /(nazi|hitler|afd|nsdap|hakenkreuz|fick|hure|nike|adidas|bvb|fc bayern|hsv|st\. ?pauli fc)/i;
export function cleanLine(line) {
  if (!line) return '';
  const t = String(line).trim().slice(0, 40);
  if (!/^[\p{L}\p{N} .,!?'’\-–]*$/u.test(t)) return null;
  if (BLOCKLIST.test(t)) return null;
  return t;
}

// ---------- Text-QA über Vision ----------
export async function textQA(openai, pngBuffer, { cityName, coords, line, model }) {
  const want = [cityName, coords, line].filter(Boolean);
  const res = await openai.chat.completions.create({
    model,
    temperature: 0,
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: `Read ALL text visible in this artwork. Then answer ONLY with JSON: {"texts":[...],"pass":true|false,"reason":"..."}. pass is true only if the following strings appear exactly (case-insensitive, accents may be simplified): ${JSON.stringify(want)} and no other misspelled words are present.` },
        { type: 'image_url', image_url: { url: 'data:image/png;base64,' + pngBuffer.toString('base64') } }
      ]
    }]
  });
  const raw = res.choices[0].message.content.replace(/```json|```/g, '').trim();
  try { return JSON.parse(raw); } catch { return { pass: false, reason: 'QA unparsable', texts: [] }; }
}

// ---------- Alpha-Check: reines Weiß ----------
export async function whiteCheck(pngBuffer) {
  const { data, info } = await sharp(pngBuffer).raw().toBuffer({ resolveWithObject: true });
  let white = 0, total = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    const a = info.channels === 4 ? data[i + 3] : 255;
    if (a < 10) continue;
    total++;
    if (data[i] > 250 && data[i + 1] > 250 && data[i + 2] > 250) white++;
  }
  return total ? white / total : 0;
}

// ---------- Vorschau mit Wasserzeichen ----------
export async function makePreview(pngBuffer) {
  const base = sharp(pngBuffer).resize({ width: 800 });
  const { width = 800, height = 1200 } = await base.metadata();
  const svg = Buffer.from(`<svg width="${width}" height="${height}">
    <style>text{font-family:Arial,Helvetica,sans-serif;font-weight:700;fill:#fff;fill-opacity:.35}</style>
    <text x="50%" y="50%" font-size="46" text-anchor="middle" transform="rotate(-30 ${width / 2} ${height / 2})">kiezfashion.de · VORSCHAU</text>
    <text x="50%" y="62%" font-size="46" text-anchor="middle" transform="rotate(-30 ${width / 2} ${height / 2})">kiezfashion.de · VORSCHAU</text>
  </svg>`);
  return base.flatten({ background: '#1a1a1a' }).composite([{ input: svg }]).png().toBuffer();
}

// ---------- Signierte Vorschau-URL ----------
export function signPreview(designId, exp, secret) {
  return crypto.createHmac('sha256', secret).update(`${designId}:${exp}`).digest('hex').slice(0, 24);
}

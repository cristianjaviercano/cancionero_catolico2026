// Lecturas del día desde el lector público de Evangelizo (evangeliodeldia.org).
// El servicio solo responde fechas a menos de 30 días de hoy y permite CORS.
// Texto bíblico: "Libro del Pueblo de Dios". Se guarda en caché local por fecha.

const BASE = 'https://feed.evangelizo.org/v2/reader.php';
const CACHE_PREFIX = 'vt-lecturas-';
const CACHE_MAX = 45;
export const EVANGELIZO_WINDOW_DAYS = 30;

export interface Reading {
  id: 'FR' | 'PS' | 'SR' | 'GSP';
  label: string;
  reference: string;
  text: string;
}

export interface DailyReadings {
  iso: string;
  dayTitle: string;
  readings: Reading[];
  saints: string[];
  attribution: string;
}

export class ReadingsOutOfRangeError extends Error {
  constructor() {
    super(`Evangelizo solo publica lecturas a menos de ${EVANGELIZO_WINDOW_DAYS} días de hoy.`);
  }
}

const LABELS: Record<Reading['id'], string> = {
  FR: 'Primera lectura',
  PS: 'Salmo responsorial',
  SR: 'Segunda lectura',
  GSP: 'Evangelio',
};

const FOOTER = /(Extraído de la Biblia[^\n]*|Para recibir cada mañana[^\n]*)/gi;

function htmlToText(html: string): string {
  // El feed trae "<br />" seguido de salto de línea: se cuenta como uno solo
  const withBreaks = html.replace(/<br\s*\/?>[ \t]*\r?\n?/gi, '\n');
  const doc = new DOMParser().parseFromString(`<body>${withBreaks}</body>`, 'text/html');
  return (doc.body.textContent ?? '')
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function daysFromToday(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  const target = Date.UTC(y, m - 1, d);
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target - today) / 86400000);
}

export function isWithinEvangelizoWindow(iso: string): boolean {
  return Math.abs(daysFromToday(iso)) < EVANGELIZO_WINDOW_DAYS;
}

async function part(iso: string, params: string): Promise<string> {
  const date = iso.replace(/-/g, '');
  const res = await fetch(`${BASE}?date=${date}&lang=SP&${params}`);
  if (!res.ok) throw new Error(`Evangelizo respondió ${res.status}`);
  const body = await res.text();
  if (/^\s*<!DOCTYPE/i.test(body)) throw new ReadingsOutOfRangeError();
  return body;
}

function readCache(iso: string): DailyReadings | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + iso);
    return raw ? (JSON.parse(raw) as DailyReadings) : null;
  } catch {
    return null;
  }
}

function writeCache(data: DailyReadings) {
  try {
    localStorage.setItem(CACHE_PREFIX + data.iso, JSON.stringify(data));
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX)).sort();
    for (const k of keys.slice(0, Math.max(0, keys.length - CACHE_MAX))) localStorage.removeItem(k);
  } catch {
    // Sin espacio o almacenamiento bloqueado: la lectura sigue funcionando en línea
  }
}

export function getCachedReadings(iso: string): DailyReadings | null {
  return readCache(iso);
}

export async function fetchDailyReadings(iso: string): Promise<DailyReadings> {
  const cached = readCache(iso);
  if (cached) return cached;
  if (!isWithinEvangelizoWindow(iso)) throw new ReadingsOutOfRangeError();

  const ids: Reading['id'][] = ['FR', 'PS', 'SR', 'GSP'];
  const [titleHtml, saintsHtml, ...pairs] = await Promise.all([
    part(iso, 'type=liturgic_t'),
    part(iso, 'type=saint'),
    ...ids.flatMap(id => [part(iso, `type=reading_lt&content=${id}`), part(iso, `type=reading&content=${id}`)]),
  ]);

  let attribution = '';
  const readings: Reading[] = [];
  ids.forEach((id, i) => {
    const reference = htmlToText(pairs[i * 2]);
    let text = htmlToText(pairs[i * 2 + 1]);
    const footer = text.match(FOOTER);
    if (footer && !attribution) attribution = footer[0].trim();
    text = text.replace(FOOTER, '').trim();
    if (reference && text) readings.push({ id, label: LABELS[id], reference, text });
  });

  const saintsDoc = new DOMParser().parseFromString(saintsHtml, 'text/html');
  const saints = Array.from(saintsDoc.querySelectorAll('a'))
    .map(a => (a.textContent ?? '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const data: DailyReadings = {
    iso,
    dayTitle: htmlToText(titleHtml),
    readings,
    saints,
    attribution: attribution || 'Extraído de la Biblia: Libro del Pueblo de Dios.',
  };
  writeCache(data);
  return data;
}

// Números de salmo de una referencia como "Salmo 33(32),1-2.4-5"
export function psalmNumbers(reference: string): number[] {
  const m = reference.match(/Salmo\s+(\d+)(?:\s*\((\d+)\))?/i);
  if (!m) return [];
  return [Number(m[1]), ...(m[2] ? [Number(m[2])] : [])];
}

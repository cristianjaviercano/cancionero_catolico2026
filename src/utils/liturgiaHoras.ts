// Liturgia de las Horas desde liturgiadelashoras.github.io (páginas por fecha, CORS abierto).
// El HTML de origen (ISO-8859-1) se reconstruye con una lista blanca de etiquetas sin atributos.

const BASE = 'https://liturgiadelashoras.github.io/sync';
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const CACHE_PREFIX = 'vt-horas-';
const CACHE_MAX = 40;

export type HourId = 'oficio' | 'laudes' | 'tercia' | 'sexta' | 'nona' | 'visperas' | 'completas';

export const HOURS: { id: HourId; name: string; when: string }[] = [
  { id: 'oficio', name: 'Oficio de lectura', when: 'A cualquier hora del día' },
  { id: 'laudes', name: 'Laudes', when: 'Oración de la mañana' },
  { id: 'tercia', name: 'Tercia', when: 'Media mañana' },
  { id: 'sexta', name: 'Sexta', when: 'Mediodía' },
  { id: 'nona', name: 'Nona', when: 'Media tarde' },
  { id: 'visperas', name: 'Vísperas', when: 'Oración de la tarde' },
  { id: 'completas', name: 'Completas', when: 'Antes del descanso nocturno' },
];

export function suggestedHour(date = new Date()): HourId {
  const h = date.getHours();
  if (h < 9) return 'laudes';
  if (h < 11) return 'tercia';
  if (h < 14) return 'sexta';
  if (h < 17) return 'nona';
  if (h < 20) return 'visperas';
  return 'completas';
}

export function hourUrl(iso: string, hour: HourId): string {
  const [y, m, d] = iso.split('-');
  return `${BASE}/${y}/${MONTHS[Number(m) - 1]}/${d}/${hour}.htm`;
}

export class HourNotPublishedError extends Error {
  constructor() {
    super('Esta fecha todavía no está publicada en la fuente.');
  }
}

const BLOCK = new Set(['P', 'DIV', 'CENTER', 'BLOCKQUOTE']);
const KEEP: Record<string, string> = { B: 'strong', STRONG: 'strong', I: 'em', EM: 'em', U: 'u', BR: 'br' };

function isRubricColor(color: string | null): boolean {
  if (!color) return false;
  const c = color.trim().toLowerCase();
  return c === 'red' || c === '#ff0000' || c === '#cc0000' || c === '#c00' || c === '#f00' || c === '#990000';
}

function rebuild(source: Node, target: HTMLElement) {
  source.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      target.appendChild(document.createTextNode(node.textContent ?? ''));
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as Element;
    const tag = el.tagName.toUpperCase();
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'IMG' || tag === 'IFRAME' || tag === 'FORM' || tag === 'INPUT' || tag === 'BUTTON') return;
    // Enlaces de navegación entre horas de la página de origen (Of, La, Tr...)
    if (tag === 'A' && /\.htm$/i.test(el.getAttribute('href') ?? '')) return;
    if (KEEP[tag]) {
      const out = document.createElement(KEEP[tag]);
      target.appendChild(out);
      if (tag !== 'BR') rebuild(el, out);
      return;
    }
    if (tag === 'FONT' || tag === 'SPAN') {
      const out = document.createElement('span');
      if (isRubricColor(el.getAttribute('color'))) out.className = 'vt-office-rubric';
      target.appendChild(out);
      rebuild(el, out);
      return;
    }
    if (BLOCK.has(tag)) {
      const out = document.createElement('div');
      target.appendChild(out);
      rebuild(el, out);
      return;
    }
    // Cualquier otra etiqueta (enlaces, tablas...) conserva solo su texto
    rebuild(el, target);
  });
}

function readCache(key: string): string | null {
  try { return localStorage.getItem(CACHE_PREFIX + key); } catch { return null; }
}

function writeCache(key: string, html: string) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, html);
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX)).sort();
    for (const k of keys.slice(0, Math.max(0, keys.length - CACHE_MAX))) localStorage.removeItem(k);
  } catch {
    // Sin espacio: se sigue mostrando en línea
  }
}

// Devuelve HTML seguro (solo etiquetas de la lista blanca y la clase de rúbrica)
export async function fetchHour(iso: string, hour: HourId): Promise<string> {
  const key = `${iso}-${hour}`;
  const cached = readCache(key);
  if (cached) return cached;

  const res = await fetch(hourUrl(iso, hour));
  if (res.status === 404) throw new HourNotPublishedError();
  if (!res.ok) throw new Error(`La fuente respondió ${res.status}`);
  const buffer = await res.arrayBuffer();
  const raw = new TextDecoder('iso-8859-1').decode(buffer);
  const doc = new DOMParser().parseFromString(raw, 'text/html');
  const body = doc.getElementById('cuerpo') ?? doc.body;
  const container = document.createElement('div');
  rebuild(body, container);
  const html = container.innerHTML.replace(/(<br>\s*){3,}/g, '<br><br>');
  writeCache(key, html);
  return html;
}

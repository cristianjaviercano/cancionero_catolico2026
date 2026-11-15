// Motor de acompañamiento: Yamaha PSR-E383 (Smart Chord / Multi Finger), guitarra (capo,
// rasgueos, arpegios y tablatura) y perfiles rítmicos por tipo de canto y tiempo litúrgico.
// Los datos viven en src/data/acompanamiento/ (ver su README.md).

import estilosData from '../data/acompanamiento/psr_e383_estilos.json';
import vocesData from '../data/acompanamiento/psr_e383_voces.json';
import smartData from '../data/acompanamiento/psr_e383_smart_chord.json';
import ritmosData from '../data/acompanamiento/ritmos_guitarra.json';
import perfilesData from '../data/acompanamiento/perfiles_ritmicos.json';
import sugerenciasData from '../data/acompanamiento/sugerencias_por_tipo.json';
import cantosParametros from '../data/acompanamiento/cantos_parametros.json';
import guitarChords from '../data/guitarChords.json';
import { NOTES, getChordKeyBase, detectSongKey, normalizeChordToAmerican, parseSongContent, transposeChord } from './musicTheory';
import type { SeasonId } from './liturgicalCalendar';

export interface Estilo { numero: number; nombre: string; categoria: string; soloConAcmp: boolean }
export interface Voz { numero: number; nombre: string; familia: string; uso: string }
export interface Patron { id: string; nombre: string; compas: string; subdivision: number; pasos: string[]; nivel: string; uso: string }
export interface Perfil {
  id: string;
  nombre: string;
  compas: string;
  bpm: number[];
  bpmSugerido: number;
  caracter: string;
  momentos: string[];
  teclado: { estilos: { numero: number; motivo: string }[]; voces: number[]; dual: number | null; consejo: string };
  guitarra: { rasgueos: string[]; arpegios: string[] };
  piano: { izquierda: string; derecha: string };
}
export interface SongParams {
  perfil?: string;
  compas?: string;
  bpm?: number;
  estilo?: number;
  rasgueo?: string;
  capo?: number;
  notas?: string;
}

export const ESTILOS: Estilo[] = estilosData.estilos;
export const VOCES: Voz[] = vocesData.voces;
export const VOCES_COMO_SELECCIONAR: string = vocesData.comoSeleccionar;
export const RASGUEOS: Patron[] = ritmosData.rasgueos;
export const ARPEGIOS: Patron[] = ritmosData.arpegios;
export const LEYENDA_GUITARRA: Record<string, string> = ritmosData.leyenda;
export const PERFILES: Perfil[] = perfilesData.perfiles as Perfil[];
export const SECCIONES_ESTILO: Record<string, string> = perfilesData.secciones;
export const SMART_CHORD_USO: string = smartData.comoUsar;
export const MULTI_FINGER: Record<string, string> = smartData.multiFinger;
const SMART = smartData.armaduras as Record<string, { mayor: string; menor: string; pantalla: string; acordes: string[] }>;
const PARAMETROS_FIJOS = cantosParametros as Record<string, SongParams>;

export const estiloPorNumero = (n: number) => ESTILOS.find(e => e.numero === n);
export const vozPorNumero = (n: number) => VOCES.find(v => v.numero === n);
export const patronPorId = (id: string) => [...RASGUEOS, ...ARPEGIOS].find(p => p.id === id);
export const perfilPorId = (id: string) => PERFILES.find(p => p.id === id);

export function parametrosFijos(songId: string | undefined): SongParams | undefined {
  return songId ? PARAMETROS_FIJOS[songId] : undefined;
}

// ── Acordes del canto ──

export function songChordSequence(content: string, transpose: number): string[] {
  const seq: string[] = [];
  for (const line of parseSongContent(content)) {
    for (const word of line) {
      for (const seg of word.segments) {
        if (!seg.chord) continue;
        const norm = normalizeChordToAmerican(seg.chord.trim());
        if (!/^[A-G]/.test(norm)) continue;
        const chord = transpose ? transposeChord(norm, transpose) : norm;
        if (seq[seq.length - 1] !== chord) seq.push(chord);
      }
    }
  }
  return seq;
}

export function uniqueChords(seq: string[]): string[] {
  return Array.from(new Set(seq));
}

export interface SongKey { root: string; minor: boolean; name: string }

export function songKey(content: string, transpose: number, explicitKey?: string): SongKey | null {
  const base = explicitKey ? getChordKeyBase(explicitKey) : detectSongKey(content);
  if (!base) return null;
  const shifted = transpose ? getChordKeyBase(transposeChord(base, transpose)) : base;
  const minor = shifted.endsWith('m');
  const root = minor ? shifted.slice(0, -1) : shifted;
  if (!NOTES.includes(root)) return null;
  return { root, minor, name: `${root}${minor ? 'm' : ''}` };
}

// ── Calidad de un acorde ──

type Quality = 'M' | 'm' | '7' | 'm7' | 'M7' | 'dim' | 'dim7' | 'm7b5' | '5' | 'aug' | 'sus' | 'm6' | '6' | 'otro';

const FLATS: Record<string, string> = { Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#', Cb: 'B', Fb: 'E' };

function splitChord(chord: string): { root: string; suffix: string } {
  const main = chord.split('/')[0];
  const m = main.match(/^([A-G])([#b]?)(.*)$/);
  if (!m) return { root: '', suffix: '' };
  let root = m[1] + m[2];
  if (FLATS[root]) root = FLATS[root];
  return { root, suffix: m[3] };
}

function quality(suffix: string): Quality {
  const s = suffix.trim();
  if (s === '' || s === 'maj' || s === 'M') return 'M';
  if (s === '1+5' || s === '5') return '5';
  if (s.startsWith('m7b5') || s === 'ø') return 'm7b5';
  if (s.startsWith('dim7')) return 'dim7';
  if (s.startsWith('dim')) return 'dim';
  if (s.startsWith('maj7') || s.startsWith('M7')) return 'M7';
  if (s.startsWith('m7') || s.startsWith('min7')) return 'm7';
  if (s.startsWith('m6')) return 'm6';
  if (s.startsWith('m') && !s.startsWith('maj')) return 'm';
  if (s.startsWith('7') || s.startsWith('9') || s.startsWith('13')) return '7';
  if (s.startsWith('6')) return '6';
  if (s.startsWith('aug') || s.startsWith('+')) return 'aug';
  if (s.startsWith('sus')) return 'sus';
  if (s.startsWith('add')) return 'M';
  return 'otro';
}

const BASE_TRIAD: Partial<Record<Quality, Quality>> = { '7': 'M', M7: 'M', '6': 'M', sus: 'M', m7: 'm', m6: 'm' };

export type MatchLevel = 'exacto' | 'aproximado' | 'distinto';

function compare(wanted: Quality, produced: Quality): MatchLevel {
  if (wanted === produced) return 'exacto';
  // La quinta sola (1+5) sirve por un acorde mayor o menor, no por uno de séptima
  if (produced === '5' && (wanted === 'M' || wanted === 'm')) return 'aproximado';
  if (BASE_TRIAD[wanted] && BASE_TRIAD[wanted] === produced) return 'aproximado';
  if (BASE_TRIAD[produced] && BASE_TRIAD[produced] === wanted) return 'aproximado';
  return 'distinto';
}

// ── PSR-E383: Smart Chord ──

const STYLE_KEY_BY_MAJOR_INDEX = ['SP0', 'FL5', 'SP2', 'FL3', 'SP4', 'FL1', 'SP6', 'SP1', 'FL4', 'SP3', 'FL2', 'SP5'];

export function styleKeyFor(key: SongKey): { code: string; pantalla: string; mayor: string; menor: string } {
  const idx = NOTES.indexOf(key.root);
  const majorIdx = key.minor ? (idx + 3) % 12 : idx;
  const code = STYLE_KEY_BY_MAJOR_INDEX[majorIdx];
  return { code, ...SMART[code] };
}

export interface SmartChordRow { chord: string; tecla: string; produce: string; nivel: MatchLevel }

export function smartChordPlan(chords: string[], styleKeyCode: string): { rows: SmartChordRow[]; recomendado: 'Smart Chord' | 'Multi Finger' } {
  const table = SMART[styleKeyCode].acordes;
  const rows = chords.map(chord => {
    const { root, suffix } = splitChord(chord);
    const idx = NOTES.indexOf(root);
    if (idx < 0) return { chord, tecla: '?', produce: '?', nivel: 'distinto' as MatchLevel };
    const produced = table[idx];
    const p = splitChord(produced);
    return { chord, tecla: root, produce: produced, nivel: compare(quality(suffix), quality(p.suffix)) };
  });
  const recomendado = rows.every(r => r.nivel !== 'distinto') ? 'Smart Chord' : 'Multi Finger';
  return { rows, recomendado };
}

// ── PSR-E383: Multi Finger (atajos del manual) ──

const BLACK = new Set([1, 3, 6, 8, 10]);

function nearestLeft(idx: number, wantBlack: boolean): string {
  for (let i = 1; i <= 3; i++) {
    const j = (idx - i + 12) % 12;
    if (BLACK.has(j) === wantBlack) return NOTES[j];
  }
  return NOTES[(idx + 11) % 12];
}

export function multiFingerKeys(chord: string): { teclas: string[]; regla: string } {
  const { root, suffix } = splitChord(chord);
  const idx = NOTES.indexOf(root);
  const q = quality(suffix);
  if (idx < 0) return { teclas: [], regla: '' };
  if (q === 'M') return { teclas: [root], regla: MULTI_FINGER.mayor };
  if (q === 'm') return { teclas: [nearestLeft(idx, true), root], regla: MULTI_FINGER.menor };
  if (q === '7') return { teclas: [nearestLeft(idx, false), root], regla: MULTI_FINGER.septima };
  if (q === 'm7') return { teclas: [nearestLeft(idx, false), nearestLeft(idx, true), root], regla: MULTI_FINGER.menorSeptima };
  return { teclas: chordTones(chord), regla: MULTI_FINGER.otros };
}

const INTERVALS: Record<Quality, number[]> = {
  M: [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], m7: [0, 3, 7, 10], M7: [0, 4, 7, 11],
  dim: [0, 3, 6], dim7: [0, 3, 6, 9], m7b5: [0, 3, 6, 10], '5': [0, 7], aug: [0, 4, 8],
  sus: [0, 5, 7], m6: [0, 3, 7, 9], '6': [0, 4, 7, 9], otro: [0, 4, 7],
};

export function chordTones(chord: string): string[] {
  const { root, suffix } = splitChord(chord);
  const idx = NOTES.indexOf(root);
  if (idx < 0) return [];
  const q = suffix.startsWith('sus2') ? null : quality(suffix);
  const ints = q ? INTERVALS[q] : [0, 2, 7];
  return ints.map(i => NOTES[(idx + i) % 12]);
}

// ── Guitarra: capo ──

const OPEN_SHAPES = new Set([
  'C', 'D', 'E', 'G', 'A', 'Am', 'Dm', 'Em', 'A7', 'B7', 'C7', 'D7', 'E7', 'G7', 'Am7', 'Dm7', 'Em7',
  'Cmaj7', 'Fmaj7', 'Dsus4', 'Asus4', 'Esus4', 'Dsus2', 'Asus2', 'Cadd9', 'E5', 'A5', 'D5',
]);

function shapeCost(chord: string): number {
  const main = chord.split('/')[0];
  if (OPEN_SHAPES.has(main)) return 0;
  if (main === 'F' || main === 'Bm' || main === 'Fmaj7') return 1;
  return 2;
}

export interface CapoOption { capo: number; formas: string[]; costo: number }

export function capoOptions(chords: string[]): CapoOption[] {
  const options: CapoOption[] = [];
  for (let capo = 0; capo <= 7; capo++) {
    const formas = chords.map(c => transposeChord(c, -capo));
    // Cada traste de capo cuesta un poco: sin capo se prefiere si las formas son parecidas
    const costo = formas.reduce((sum, f) => sum + shapeCost(f), 0) + capo * 0.3;
    options.push({ capo, formas, costo });
  }
  return options.sort((a, b) => a.costo - b.costo).slice(0, 3);
}

// ── Perfiles sugeridos ──

export function perfilesSugeridos(tipo: string | undefined, season: SeasonId | null): { perfiles: Perfil[]; aviso: string | null } {
  const porTipo = sugerenciasData.porTipo as Record<string, string[]>;
  const ids = porTipo[tipo ?? ''] ?? porTipo.default;
  const regla = season ? (sugerenciasData.porTiempo as Record<string, { evitar: string[]; aviso: string }>)[season] : undefined;
  let lista = ids.map(perfilPorId).filter((p): p is Perfil => !!p);
  if (regla) {
    const filtrada = lista.filter(p => !regla.evitar.includes(p.id));
    lista = filtrada.length ? filtrada : [perfilPorId('himno_organo')!];
  }
  const resto = PERFILES.filter(p => !lista.includes(p));
  return { perfiles: [...lista, ...resto], aviso: regla?.aviso ?? null };
}

// ── Guitarra: tablatura del patrón ──

interface Voicing { frets: number[]; baseFret: number }

function voicingFor(chord: string): Voicing | null {
  const table = guitarChords as Record<string, Voicing[]>;
  const main = chord.split('/')[0];
  const { root, suffix } = splitChord(main);
  const candidates = [chord, main, root + suffix, root + (quality(suffix) === 'm' || quality(suffix) === 'm7' ? 'm' : '')];
  for (const c of candidates) {
    const v = table[c]?.[0];
    if (v) return v;
  }
  return null;
}

function absoluteFrets(v: Voicing): number[] {
  return v.frets.map(f => (f <= 0 ? f : f + v.baseFret - 1));
}

const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e'];

export interface TabResult { lines: string[]; faltantes: string[] }

// Una línea de tablatura por cuerda (de la 1.ª a la 6.ª); un compás por acorde.
export function patternTab(chords: string[], pattern: Patron, maxBars = 4): TabResult {
  const bars = chords.slice(0, maxBars);
  const rows = STRING_NAMES.map(() => [] as string[]);
  const header: string[] = [];
  const faltantes: string[] = [];
  const col = 3;
  for (const chord of bars) {
    const v = voicingFor(chord);
    if (!v) { faltantes.push(chord); continue; }
    const frets = absoluteFrets(v);
    const bass = frets.findIndex(f => f >= 0);
    const alt = bass + 1 < 3 && frets[bass + 1] >= 0 ? bass + 1 : bass;
    const target: Record<string, number> = { p: bass, p2: alt, i: 3, m: 4, a: 5 };
    header.push(chord.padEnd(pattern.pasos.length * col + 1, ' '));
    pattern.pasos.forEach(step => {
      let s = target[step];
      if (s !== undefined && frets[s] < 0) s = frets.findIndex((f, i) => i > s && f >= 0);
      rows.forEach((row, i) => {
        row.push((i === s && s >= 0 ? String(frets[i]) : '').padEnd(col, '-'));
      });
    });
    rows.forEach(row => row.push('|'));
  }
  const lines = [
    '  ' + header.join(''),
    ...rows.map((row, i) => `${STRING_NAMES[i]}|${row.join('')}`).reverse(),
  ];
  return { lines, faltantes };
}

export function strumCounts(pattern: Patron): string[] {
  const beats = pattern.pasos.length / pattern.subdivision;
  const labels: string[] = [];
  for (let b = 1; b <= beats; b++) {
    if (pattern.subdivision === 2) labels.push(String(b), 'y');
    else if (pattern.subdivision === 3) labels.push(String((b - 1) * 3 + 1), String((b - 1) * 3 + 2), String((b - 1) * 3 + 3));
    else labels.push(String(b));
  }
  return labels;
}

export function guitarMidi(chord: string): number[] {
  const v = voicingFor(chord);
  if (!v) return [];
  const open = [40, 45, 50, 55, 59, 64];
  return absoluteFrets(v).map((f, i) => (f >= 0 ? open[i] + f : -1));
}

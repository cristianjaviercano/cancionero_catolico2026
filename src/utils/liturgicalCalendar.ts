// Calendario litúrgico romano (rito ordinario) con los traslados de Colombia.
// Normas: "Normas universales sobre el año litúrgico y el calendario" (1969) y
// su Tabla de los días litúrgicos según el orden de precedencia.
// Colombia: Epifanía, Ascensión y Corpus Christi se celebran en domingo;
// Nuestra Señora de Chiquinquirá (patrona principal de la nación) es solemnidad.
// Los propios de Colombia marcados con `verificar` deben confirmarse con el
// Directorio Litúrgico de la Conferencia Episcopal de Colombia.

export type LiturgicalColor = 'verde' | 'morado' | 'blanco' | 'rojo' | 'rosa' | 'negro';
export type SeasonId = 'adviento' | 'navidad' | 'ordinario' | 'cuaresma' | 'triduo' | 'pascua';
export type RankLabel = 'Solemnidad' | 'Fiesta' | 'Memoria' | 'Memoria libre' | 'Domingo' | 'Feria' | 'Conmemoración';

export interface Celebration {
  name: string;
  rankLabel: RankLabel;
  // Orden de precedencia de la Tabla de los días litúrgicos (1 = mayor)
  precedence: number;
  color: LiturgicalColor;
  scope: 'universal' | 'colombia';
  verificar?: boolean;
}

export interface LiturgicalDay {
  iso: string;
  season: SeasonId;
  seasonName: string;
  week: number | null;
  temporalName: string;
  title: string;
  rankLabel: RankLabel;
  color: LiturgicalColor;
  celebration: Celebration | null;
  optional: Celebration[];
  sundayCycle: 'A' | 'B' | 'C';
  weekdayCycle: 'I' | 'II';
  psalterWeek: 1 | 2 | 3 | 4 | null;
  isSunday: boolean;
  liturgicalYear: number;
}

export const COLOR_HEX: Record<LiturgicalColor, string> = {
  verde: '#15803d',
  morado: '#6b21a8',
  blanco: '#d4a017',
  rojo: '#b91c1c',
  rosa: '#db2777',
  negro: '#1c1917',
};

export const COLOR_NAME: Record<LiturgicalColor, string> = {
  verde: 'Verde',
  morado: 'Morado',
  blanco: 'Blanco',
  rojo: 'Rojo',
  rosa: 'Rosa',
  negro: 'Negro',
};

export const SEASON_NAME: Record<SeasonId, string> = {
  adviento: 'Tiempo de Adviento',
  navidad: 'Tiempo de Navidad',
  ordinario: 'Tiempo Ordinario',
  cuaresma: 'Tiempo de Cuaresma',
  triduo: 'Triduo Pascual',
  pascua: 'Tiempo de Pascua',
};

const DAY_MS = 86400000;
const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// Las fechas se manejan como milisegundos UTC a medianoche para evitar saltos de horario.
function utc(y: number, m: number, d: number): number {
  return Date.UTC(y, m, d);
}
function dow(t: number): number {
  return new Date(t).getUTCDay();
}
function ymd(t: number): { y: number; m: number; d: number } {
  const dt = new Date(t);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth(), d: dt.getUTCDate() };
}
export function toIso(t: number): string {
  return new Date(t).toISOString().slice(0, 10);
}
export function dateToUtc(date: Date): number {
  return utc(date.getFullYear(), date.getMonth(), date.getDate());
}
export function isoToDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function roman(n: number): string {
  const map: [number, string][] = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let out = '';
  let rest = n;
  for (const [v, s] of map) {
    while (rest >= v) { out += s; rest -= v; }
  }
  return out;
}

// Algoritmo gregoriano anónimo (Meeus/Jones/Butcher)
export function easter(y: number): number {
  const a = y % 19;
  const b = Math.floor(y / 100);
  const c = y % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return utc(y, month - 1, day);
}

export interface YearAnchors {
  year: number;
  epiphany: number;
  baptism: number;
  ashWednesday: number;
  palmSunday: number;
  holyThursday: number;
  goodFriday: number;
  holySaturday: number;
  easter: number;
  ascension: number;
  pentecost: number;
  trinity: number;
  corpusChristi: number;
  sacredHeart: number;
  immaculateHeart: number;
  maryMotherChurch: number;
  christKing: number;
  advent1: number;
  christmas: number;
  holyFamily: number;
}

const anchorCache = new Map<number, YearAnchors>();

export function getYearAnchors(y: number): YearAnchors {
  const cached = anchorCache.get(y);
  if (cached) return cached;
  const e = easter(y);
  // Epifanía en Colombia: domingo entre el 2 y el 8 de enero
  const jan2 = utc(y, 0, 2);
  const epiphany = jan2 + ((7 - dow(jan2)) % 7) * DAY_MS;
  // Bautismo: domingo siguiente; si la Epifanía cae el 7 u 8, el lunes siguiente
  const epiDay = ymd(epiphany).d;
  const baptism = epiDay >= 7 ? epiphany + DAY_MS : epiphany + 7 * DAY_MS;
  const christmas = utc(y, 11, 25);
  const advent1 = christmas - ((dow(christmas) || 7) + 21) * DAY_MS;
  const pentecost = e + 49 * DAY_MS;
  // Sagrada Familia: domingo dentro de la octava; si Navidad es domingo, el 30 de diciembre
  const holyFamily = dow(christmas) === 0 ? utc(y, 11, 30) : christmas + (7 - dow(christmas)) * DAY_MS;
  const anchors: YearAnchors = {
    year: y,
    epiphany,
    baptism,
    ashWednesday: e - 46 * DAY_MS,
    palmSunday: e - 7 * DAY_MS,
    holyThursday: e - 3 * DAY_MS,
    goodFriday: e - 2 * DAY_MS,
    holySaturday: e - DAY_MS,
    easter: e,
    ascension: e + 42 * DAY_MS, // Colombia: VII domingo de Pascua
    pentecost,
    trinity: pentecost + 7 * DAY_MS,
    corpusChristi: pentecost + 14 * DAY_MS, // Colombia: domingo después de la Trinidad
    sacredHeart: pentecost + 19 * DAY_MS,
    immaculateHeart: pentecost + 20 * DAY_MS,
    maryMotherChurch: pentecost + DAY_MS,
    christKing: advent1 - 7 * DAY_MS,
    advent1,
    christmas,
    holyFamily,
  };
  anchorCache.set(y, anchors);
  return anchors;
}

// ── Santoral fijo (calendario general + propios de Colombia) ──
type Fixed = [month: number, day: number, name: string, kind: 'S' | 'FL' | 'F' | 'M' | 'ML', color: LiturgicalColor, scope?: 'colombia', verificar?: boolean];

// S = solemnidad, FL = fiesta del Señor, F = fiesta, M = memoria obligatoria, ML = memoria libre
const FIXED: Fixed[] = [
  [1, 1, 'Santa María, Madre de Dios', 'S', 'blanco'],
  [1, 2, 'Santos Basilio Magno y Gregorio Nacianceno, obispos y doctores', 'M', 'blanco'],
  [1, 3, 'Santísimo Nombre de Jesús', 'ML', 'blanco'],
  [1, 17, 'San Antonio, abad', 'M', 'blanco'],
  [1, 20, 'San Sebastián, mártir', 'ML', 'rojo'],
  [1, 21, 'Santa Inés, virgen y mártir', 'M', 'rojo'],
  [1, 24, 'San Francisco de Sales, obispo y doctor', 'M', 'blanco'],
  [1, 25, 'Conversión de San Pablo, apóstol', 'F', 'blanco'],
  [1, 26, 'Santos Timoteo y Tito, obispos', 'M', 'blanco'],
  [1, 28, 'Santo Tomás de Aquino, presbítero y doctor', 'M', 'blanco'],
  [1, 31, 'San Juan Bosco, presbítero', 'M', 'blanco'],
  [2, 2, 'Presentación del Señor', 'FL', 'blanco'],
  [2, 3, 'San Blas, obispo y mártir', 'ML', 'rojo'],
  [2, 5, 'Santa Águeda, virgen y mártir', 'M', 'rojo'],
  [2, 6, 'Santos Pablo Miki y compañeros, mártires', 'M', 'rojo'],
  [2, 8, 'Santa Josefina Bakhita, virgen', 'ML', 'blanco'],
  [2, 10, 'Santa Escolástica, virgen', 'M', 'blanco'],
  [2, 11, 'Nuestra Señora de Lourdes', 'ML', 'blanco'],
  [2, 14, 'Santos Cirilo, monje, y Metodio, obispo', 'M', 'blanco'],
  [2, 22, 'Cátedra de San Pedro, apóstol', 'F', 'blanco'],
  [2, 23, 'San Policarpo, obispo y mártir', 'M', 'rojo'],
  [3, 7, 'Santas Perpetua y Felicidad, mártires', 'M', 'rojo'],
  [3, 19, 'San José, esposo de la Virgen María', 'S', 'blanco'],
  [3, 25, 'Anunciación del Señor', 'S', 'blanco'],
  [4, 7, 'San Juan Bautista de La Salle, presbítero', 'M', 'blanco'],
  [4, 25, 'San Marcos, evangelista', 'F', 'rojo'],
  [4, 29, 'Santa Catalina de Siena, virgen y doctora', 'M', 'blanco'],
  [5, 1, 'San José Obrero', 'ML', 'blanco'],
  [5, 2, 'San Atanasio, obispo y doctor', 'M', 'blanco'],
  [5, 3, 'Santos Felipe y Santiago, apóstoles', 'F', 'rojo'],
  [5, 13, 'Nuestra Señora de Fátima', 'ML', 'blanco'],
  [5, 14, 'San Matías, apóstol', 'F', 'rojo'],
  [5, 26, 'San Felipe Neri, presbítero', 'M', 'blanco'],
  [5, 31, 'Visitación de la Virgen María', 'F', 'blanco'],
  [6, 1, 'San Justino, mártir', 'M', 'rojo'],
  [6, 3, 'Santos Carlos Lwanga y compañeros, mártires', 'M', 'rojo'],
  [6, 5, 'San Bonifacio, obispo y mártir', 'M', 'rojo'],
  [6, 11, 'San Bernabé, apóstol', 'M', 'rojo'],
  [6, 13, 'San Antonio de Padua, presbítero y doctor', 'M', 'blanco'],
  [6, 21, 'San Luis Gonzaga, religioso', 'M', 'blanco'],
  [6, 24, 'Natividad de San Juan Bautista', 'S', 'blanco'],
  [6, 28, 'San Ireneo, obispo, mártir y doctor', 'M', 'rojo'],
  [6, 29, 'Santos Pedro y Pablo, apóstoles', 'S', 'rojo'],
  [7, 3, 'Santo Tomás, apóstol', 'F', 'rojo'],
  [7, 9, 'Nuestra Señora del Rosario de Chiquinquirá, Patrona de Colombia', 'S', 'blanco', 'colombia'],
  [7, 11, 'San Benito, abad', 'M', 'blanco'],
  [7, 15, 'San Buenaventura, obispo y doctor', 'M', 'blanco'],
  [7, 16, 'Nuestra Señora del Carmen', 'ML', 'blanco'],
  [7, 22, 'Santa María Magdalena', 'F', 'blanco'],
  [7, 25, 'Santiago, apóstol', 'F', 'rojo'],
  [7, 26, 'Santos Joaquín y Ana, padres de la Virgen María', 'M', 'blanco'],
  [7, 29, 'Santos Marta, María y Lázaro', 'M', 'blanco'],
  [7, 31, 'San Ignacio de Loyola, presbítero', 'M', 'blanco'],
  [8, 1, 'San Alfonso María de Ligorio, obispo y doctor', 'M', 'blanco'],
  [8, 4, 'San Juan María Vianney, presbítero', 'M', 'blanco'],
  [8, 6, 'Transfiguración del Señor', 'FL', 'blanco'],
  [8, 8, 'Santo Domingo de Guzmán, presbítero', 'M', 'blanco'],
  [8, 10, 'San Lorenzo, diácono y mártir', 'F', 'rojo'],
  [8, 11, 'Santa Clara, virgen', 'M', 'blanco'],
  [8, 14, 'San Maximiliano María Kolbe, presbítero y mártir', 'M', 'rojo'],
  [8, 15, 'Asunción de la Virgen María', 'S', 'blanco'],
  [8, 20, 'San Bernardo, abad y doctor', 'M', 'blanco'],
  [8, 21, 'San Pío X, papa', 'M', 'blanco'],
  [8, 22, 'Santa María Virgen, Reina', 'M', 'blanco'],
  [8, 24, 'San Bartolomé, apóstol', 'F', 'rojo'],
  [8, 27, 'Santa Mónica', 'M', 'blanco'],
  [8, 28, 'San Agustín, obispo y doctor', 'M', 'blanco'],
  [8, 29, 'Martirio de San Juan Bautista', 'M', 'rojo'],
  [9, 3, 'San Gregorio Magno, papa y doctor', 'M', 'blanco'],
  [9, 8, 'Natividad de la Virgen María', 'F', 'blanco'],
  [9, 9, 'San Pedro Claver, presbítero', 'M', 'blanco', 'colombia', true],
  [9, 13, 'San Juan Crisóstomo, obispo y doctor', 'M', 'blanco'],
  [9, 14, 'Exaltación de la Santa Cruz', 'FL', 'rojo'],
  [9, 15, 'Nuestra Señora de los Dolores', 'M', 'blanco'],
  [9, 16, 'Santos Cornelio, papa, y Cipriano, obispo, mártires', 'M', 'rojo'],
  [9, 20, 'Santos Andrés Kim Taegon, Pablo Chong Hasang y compañeros, mártires', 'M', 'rojo'],
  [9, 21, 'San Mateo, apóstol y evangelista', 'F', 'rojo'],
  [9, 23, 'San Pío de Pietrelcina, presbítero', 'M', 'blanco'],
  [9, 27, 'San Vicente de Paúl, presbítero', 'M', 'blanco'],
  [9, 29, 'Santos Arcángeles Miguel, Gabriel y Rafael', 'F', 'blanco'],
  [9, 30, 'San Jerónimo, presbítero y doctor', 'M', 'blanco'],
  [10, 1, 'Santa Teresa del Niño Jesús, virgen y doctora', 'M', 'blanco'],
  [10, 2, 'Santos Ángeles Custodios', 'M', 'blanco'],
  [10, 4, 'San Francisco de Asís', 'M', 'blanco'],
  [10, 7, 'Nuestra Señora del Rosario', 'M', 'blanco'],
  [10, 15, 'Santa Teresa de Jesús, virgen y doctora', 'M', 'blanco'],
  [10, 17, 'San Ignacio de Antioquía, obispo y mártir', 'M', 'rojo'],
  [10, 18, 'San Lucas, evangelista', 'F', 'rojo'],
  [10, 21, 'Santa Laura Montoya, virgen', 'M', 'blanco', 'colombia', true],
  [10, 22, 'San Juan Pablo II, papa', 'ML', 'blanco'],
  [10, 28, 'Santos Simón y Judas, apóstoles', 'F', 'rojo'],
  [11, 1, 'Todos los Santos', 'S', 'blanco'],
  [11, 4, 'San Carlos Borromeo, obispo', 'M', 'blanco'],
  [11, 9, 'Dedicación de la Basílica de Letrán', 'FL', 'blanco'],
  [11, 10, 'San León Magno, papa y doctor', 'M', 'blanco'],
  [11, 11, 'San Martín de Tours, obispo', 'M', 'blanco'],
  [11, 12, 'San Josafat, obispo y mártir', 'M', 'rojo'],
  [11, 17, 'Santa Isabel de Hungría, religiosa', 'M', 'blanco'],
  [11, 21, 'Presentación de la Virgen María', 'M', 'blanco'],
  [11, 22, 'Santa Cecilia, virgen y mártir (patrona de los músicos)', 'M', 'rojo'],
  [11, 24, 'Santos Andrés Dung-Lac y compañeros, mártires', 'M', 'rojo'],
  [11, 30, 'San Andrés, apóstol', 'F', 'rojo'],
  [12, 3, 'San Francisco Javier, presbítero', 'M', 'blanco'],
  [12, 7, 'San Ambrosio, obispo y doctor', 'M', 'blanco'],
  [12, 8, 'Inmaculada Concepción de la Virgen María', 'S', 'blanco'],
  [12, 12, 'Nuestra Señora de Guadalupe, Patrona de América', 'F', 'blanco'],
  [12, 13, 'Santa Lucía, virgen y mártir', 'M', 'rojo'],
  [12, 14, 'San Juan de la Cruz, presbítero y doctor', 'M', 'blanco'],
  [12, 26, 'San Esteban, protomártir', 'F', 'rojo'],
  [12, 27, 'San Juan, apóstol y evangelista', 'F', 'blanco'],
  [12, 28, 'Santos Inocentes, mártires', 'F', 'rojo'],
];

function kindToCelebration(name: string, kind: Fixed[3], color: LiturgicalColor, scope: 'universal' | 'colombia', verificar?: boolean): Celebration {
  // Precedencia según la Tabla de los días litúrgicos
  const map: Record<Fixed[3], { precedence: number; rankLabel: RankLabel }> = {
    S: { precedence: scope === 'colombia' ? 4 : 3, rankLabel: 'Solemnidad' },
    FL: { precedence: 5, rankLabel: 'Fiesta' },
    F: { precedence: scope === 'colombia' ? 8 : 7, rankLabel: 'Fiesta' },
    M: { precedence: scope === 'colombia' ? 11 : 10, rankLabel: 'Memoria' },
    ML: { precedence: 12, rankLabel: 'Memoria libre' },
  };
  return { name, color, scope, verificar, ...map[kind] };
}

interface Temporal {
  season: SeasonId;
  week: number | null;
  name: string;
  precedence: number;
  rankLabel: RankLabel;
  color: LiturgicalColor;
  psalterWeek: 1 | 2 | 3 | 4 | null;
  // Celebraciones móviles que forman parte del propio del tiempo
  feast?: Celebration;
}

function psalter(week: number): 1 | 2 | 3 | 4 {
  return ((((week - 1) % 4) + 4) % 4 + 1) as 1 | 2 | 3 | 4;
}

function weekdayName(t: number): string {
  return WEEKDAYS[dow(t)];
}

function temporalFor(t: number): Temporal {
  const { y } = ymd(t);
  const A = getYearAnchors(y);
  const isSun = dow(t) === 0;
  const lordFeast = (name: string, precedence: number, color: LiturgicalColor, rankLabel: RankLabel = 'Solemnidad'): Celebration =>
    ({ name, precedence, color, rankLabel, scope: 'universal' });

  // ── Adviento ──
  if (t >= A.advent1 && t < A.christmas) {
    const week = Math.floor((t - A.advent1) / (7 * DAY_MS)) + 1;
    const { d } = ymd(t);
    const privileged = d >= 17;
    if (isSun) {
      return {
        season: 'adviento', week,
        name: `${roman(week)} Domingo de Adviento${week === 3 ? ' (Gaudete)' : ''}`,
        precedence: 2, rankLabel: 'Domingo', color: week === 3 ? 'rosa' : 'morado', psalterWeek: psalter(week),
      };
    }
    return {
      season: 'adviento', week,
      name: privileged
        ? `${weekdayName(t)} ${d} de diciembre (feria privilegiada de Adviento)`
        : `${weekdayName(t)} de la ${roman(week)} semana de Adviento`,
      precedence: privileged ? 9 : 13, rankLabel: 'Feria', color: 'morado', psalterWeek: psalter(week),
    };
  }

  // ── Navidad (fin de año) ──
  if (t >= A.christmas) {
    if (t === A.christmas) {
      return { season: 'navidad', week: null, name: 'Natividad del Señor', precedence: 2, rankLabel: 'Solemnidad', color: 'blanco', psalterWeek: null,
        feast: lordFeast('Natividad del Señor', 2, 'blanco') };
    }
    const psalterWeek = t >= A.holyFamily ? 1 : null;
    if (t === A.holyFamily) {
      return { season: 'navidad', week: null, name: 'Sagrada Familia de Jesús, María y José', precedence: 5, rankLabel: 'Fiesta', color: 'blanco', psalterWeek,
        feast: lordFeast('Sagrada Familia de Jesús, María y José', 5, 'blanco', 'Fiesta') };
    }
    const octaveDay = Math.round((t - A.christmas) / DAY_MS) + 1;
    return { season: 'navidad', week: null, name: `${weekdayName(t)}, día ${roman(octaveDay)} de la Octava de Navidad`, precedence: 9, rankLabel: 'Feria', color: 'blanco', psalterWeek };
  }

  // ── Navidad (inicio de año) ──
  if (t <= A.baptism) {
    if (t === A.epiphany) {
      return { season: 'navidad', week: null, name: 'Epifanía del Señor', precedence: 2, rankLabel: 'Solemnidad', color: 'blanco', psalterWeek: 2,
        feast: lordFeast('Epifanía del Señor', 2, 'blanco') };
    }
    if (t === A.baptism) {
      return { season: 'navidad', week: null, name: 'Bautismo del Señor', precedence: 5, rankLabel: 'Fiesta', color: 'blanco', psalterWeek: 1,
        feast: lordFeast('Bautismo del Señor', 5, 'blanco', 'Fiesta') };
    }
    const prevHolyFamily = getYearAnchors(y - 1).holyFamily;
    const weeksSince = Math.floor((t - prevHolyFamily) / (7 * DAY_MS));
    return {
      season: 'navidad', week: null,
      name: t < A.epiphany ? `${weekdayName(t)} del Tiempo de Navidad (antes de Epifanía)` : `${weekdayName(t)} del Tiempo de Navidad (después de Epifanía)`,
      precedence: 13, rankLabel: 'Feria', color: 'blanco', psalterWeek: psalter(weeksSince + 1),
    };
  }

  // ── Tiempo Ordinario (primera parte) ──
  if (t < A.ashWednesday) {
    const ref = dow(A.baptism) === 0 ? A.baptism : A.baptism - DAY_MS;
    const week = Math.floor((t - ref) / (7 * DAY_MS)) + 1;
    return isSun
      ? { season: 'ordinario', week, name: `${roman(week)} Domingo del Tiempo Ordinario`, precedence: 6, rankLabel: 'Domingo', color: 'verde', psalterWeek: psalter(week) }
      : { season: 'ordinario', week, name: `${weekdayName(t)} de la ${roman(week)} semana del Tiempo Ordinario`, precedence: 13, rankLabel: 'Feria', color: 'verde', psalterWeek: psalter(week) };
  }

  // ── Cuaresma ──
  if (t < A.holyThursday) {
    const lent1 = A.ashWednesday + 4 * DAY_MS;
    if (t === A.ashWednesday) {
      return { season: 'cuaresma', week: 0, name: 'Miércoles de Ceniza', precedence: 2, rankLabel: 'Feria', color: 'morado', psalterWeek: 4 };
    }
    if (t < lent1) {
      return { season: 'cuaresma', week: 0, name: `${weekdayName(t)} después de Ceniza`, precedence: 9, rankLabel: 'Feria', color: 'morado', psalterWeek: 4 };
    }
    const week = Math.floor((t - lent1) / (7 * DAY_MS)) + 1;
    if (t === A.palmSunday) {
      return { season: 'cuaresma', week: 6, name: 'Domingo de Ramos en la Pasión del Señor', precedence: 2, rankLabel: 'Domingo', color: 'rojo', psalterWeek: 2 };
    }
    if (t > A.palmSunday) {
      return { season: 'cuaresma', week: 6, name: `${weekdayName(t)} Santo`, precedence: 2, rankLabel: 'Feria', color: 'morado', psalterWeek: 2 };
    }
    if (isSun) {
      return { season: 'cuaresma', week, name: `${roman(week)} Domingo de Cuaresma${week === 4 ? ' (Laetare)' : ''}`, precedence: 2, rankLabel: 'Domingo', color: week === 4 ? 'rosa' : 'morado', psalterWeek: psalter(week) };
    }
    return { season: 'cuaresma', week, name: `${weekdayName(t)} de la ${roman(week)} semana de Cuaresma`, precedence: 9, rankLabel: 'Feria', color: 'morado', psalterWeek: psalter(week) };
  }

  // ── Triduo Pascual ──
  if (t < A.easter) {
    const names: Record<number, [string, LiturgicalColor]> = {
      [A.holyThursday]: ['Jueves Santo (Misa vespertina de la Cena del Señor)', 'blanco'],
      [A.goodFriday]: ['Viernes Santo de la Pasión del Señor', 'rojo'],
      [A.holySaturday]: ['Sábado Santo · Vigilia Pascual en la noche santa', 'blanco'],
    };
    const [name, color] = names[t];
    return { season: 'triduo', week: null, name, precedence: 1, rankLabel: 'Solemnidad', color, psalterWeek: null };
  }

  // ── Pascua ──
  if (t <= A.pentecost) {
    const week = Math.floor((t - A.easter) / (7 * DAY_MS)) + 1;
    const pw = psalter(week);
    if (t === A.easter) {
      return { season: 'pascua', week: 1, name: 'Domingo de Pascua de la Resurrección del Señor', precedence: 1, rankLabel: 'Solemnidad', color: 'blanco', psalterWeek: 1 };
    }
    if (t === A.pentecost) {
      return { season: 'pascua', week: 8, name: 'Domingo de Pentecostés', precedence: 2, rankLabel: 'Solemnidad', color: 'rojo', psalterWeek: null,
        feast: lordFeast('Domingo de Pentecostés', 2, 'rojo') };
    }
    if (t === A.ascension) {
      return { season: 'pascua', week: 7, name: 'Ascensión del Señor', precedence: 2, rankLabel: 'Solemnidad', color: 'blanco', psalterWeek: pw,
        feast: lordFeast('Ascensión del Señor', 2, 'blanco') };
    }
    if (week === 1) {
      return { season: 'pascua', week: 1, name: `${weekdayName(t)} de la Octava de Pascua`, precedence: 2, rankLabel: 'Solemnidad', color: 'blanco', psalterWeek: 1 };
    }
    if (isSun) {
      return { season: 'pascua', week, name: `${roman(week)} Domingo de Pascua${week === 2 ? ' (de la Divina Misericordia)' : ''}`, precedence: 2, rankLabel: 'Domingo', color: 'blanco', psalterWeek: pw };
    }
    return { season: 'pascua', week, name: `${weekdayName(t)} de la ${roman(week)} semana de Pascua`, precedence: 13, rankLabel: 'Feria', color: 'blanco', psalterWeek: pw };
  }

  // ── Tiempo Ordinario (segunda parte): se cuenta hacia atrás desde Cristo Rey (semana 34) ──
  const sundayOnOrBefore = t - dow(t) * DAY_MS;
  const week = 34 - Math.round((A.christKing - sundayOnOrBefore) / (7 * DAY_MS));
  const base: Temporal = isSun
    ? { season: 'ordinario', week, name: `${roman(week)} Domingo del Tiempo Ordinario`, precedence: 6, rankLabel: 'Domingo', color: 'verde', psalterWeek: psalter(week) }
    : { season: 'ordinario', week, name: `${weekdayName(t)} de la ${roman(week)} semana del Tiempo Ordinario`, precedence: 13, rankLabel: 'Feria', color: 'verde', psalterWeek: psalter(week) };
  if (t === A.trinity) base.feast = lordFeast('Santísima Trinidad', 3, 'blanco');
  if (t === A.corpusChristi) base.feast = lordFeast('Santísimo Cuerpo y Sangre de Cristo', 3, 'blanco');
  if (t === A.sacredHeart) base.feast = lordFeast('Sagrado Corazón de Jesús', 3, 'blanco');
  if (t === A.christKing) base.feast = lordFeast('Nuestro Señor Jesucristo, Rey del Universo', 3, 'blanco');
  if (t === A.maryMotherChurch) base.feast = { name: 'Bienaventurada Virgen María, Madre de la Iglesia', precedence: 10, rankLabel: 'Memoria', color: 'blanco', scope: 'universal' };
  if (t === A.immaculateHeart) base.feast = { name: 'Inmaculado Corazón de la Virgen María', precedence: 10, rankLabel: 'Memoria', color: 'blanco', scope: 'universal' };
  return base;
}

// Santoral del año con los traslados de las solemnidades impedidas
const sanctoralCache = new Map<number, Map<number, Celebration[]>>();

function sanctoralFor(y: number): Map<number, Celebration[]> {
  const cached = sanctoralCache.get(y);
  if (cached) return cached;
  const A = getYearAnchors(y);
  const out = new Map<number, Celebration[]>();
  const push = (t: number, c: Celebration) => {
    const list = out.get(t) ?? [];
    list.push(c);
    out.set(t, list);
  };
  for (const [m, d, name, kind, color, scope, verificar] of FIXED) {
    let t = utc(y, m - 1, d);
    const c = kindToCelebration(name, kind, color, scope ?? 'universal', verificar);
    if (kind === 'S') {
      const temporal = temporalFor(t);
      if (temporal.precedence <= 2) {
        const inHolyWeek = t >= A.palmSunday && t <= A.easter + 7 * DAY_MS;
        if (m === 3 && d === 19 && inHolyWeek) t = A.palmSunday - DAY_MS;
        else if (m === 3 && d === 25 && inHolyWeek) t = A.easter + 8 * DAY_MS;
        else t = t + DAY_MS;
      }
    }
    push(t, c);
  }
  // Fieles difuntos: precede a los domingos del Tiempo Ordinario
  push(utc(y, 10, 2), { name: 'Conmemoración de todos los fieles difuntos', precedence: 3, rankLabel: 'Conmemoración', color: 'morado', scope: 'universal' });
  sanctoralCache.set(y, out);
  return out;
}

export function getLiturgicalDay(date: Date | string): LiturgicalDay {
  const t = typeof date === 'string' ? dateToUtc(isoToDate(date)) : dateToUtc(date);
  const { y } = ymd(t);
  const temporal = temporalFor(t);
  const A = getYearAnchors(y);

  const isSunday = dow(t) === 0;
  // Si el propio del tiempo trae una celebración (Trinidad, Corpus...), ésa es la base del día
  const basePrecedence = temporal.feast ? temporal.feast.precedence : temporal.precedence;

  // Días en que las memorias quedan como conmemoración o se omiten
  const memorialsBecomeCommemoration = !isSunday && temporal.precedence <= 9;
  const isEasterOctave = temporal.season === 'pascua' && temporal.week === 1;

  let winner: Celebration | null = temporal.feast ?? null;
  const optional: Celebration[] = [];
  const sanctoral = [...(sanctoralFor(y).get(t) ?? [])].sort((a, b) => a.precedence - b.precedence);
  for (const c of sanctoral) {
    const isMemorial = c.precedence >= 10;
    if (isMemorial && (isEasterOctave || isSunday)) continue;
    if (isMemorial && memorialsBecomeCommemoration) {
      optional.push({ ...c, rankLabel: 'Conmemoración' });
      continue;
    }
    if (c.precedence !== 12 && c.precedence < basePrecedence && (!winner || c.precedence < winner.precedence)) {
      if (winner && winner !== temporal.feast) optional.push(winner);
      winner = c;
      continue;
    }
    optional.push(c);
  }
  // Dos memorias obligatorias que coinciden quedan ambas como libres,
  // salvo María Madre de la Iglesia, que prevalece (decreto de 2018)
  const prevails = winner?.name.startsWith('Bienaventurada Virgen María, Madre de la Iglesia');
  if (winner && winner.precedence >= 10 && !prevails) {
    const rival = optional.find(c => c.precedence >= 10 && c.precedence <= 11);
    if (rival) {
      optional.unshift({ ...winner, rankLabel: 'Memoria libre' });
      rival.rankLabel = 'Memoria libre';
      winner = null;
    }
  }
  // Una celebración del propio del tiempo idéntica al nombre del día no se repite como título
  if (winner && winner === temporal.feast && winner.name === temporal.name) winner = null;

  const litYear = t >= A.advent1 ? y + 1 : y;
  const cycleIndex = litYear % 3;
  const sundayCycle = cycleIndex === 1 ? 'A' : cycleIndex === 2 ? 'B' : 'C';

  return {
    iso: toIso(t),
    season: temporal.season,
    seasonName: SEASON_NAME[temporal.season],
    week: temporal.week,
    temporalName: temporal.name,
    title: winner ? winner.name : temporal.name,
    rankLabel: winner ? winner.rankLabel : temporal.rankLabel,
    color: winner ? winner.color : temporal.color,
    celebration: winner,
    optional,
    sundayCycle,
    weekdayCycle: litYear % 2 === 1 ? 'I' : 'II',
    psalterWeek: temporal.psalterWeek,
    isSunday,
    liturgicalYear: litYear,
  };
}

export function getMonthDays(year: number, month: number): LiturgicalDay[] {
  const days: LiturgicalDay[] = [];
  const total = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  for (let d = 1; d <= total; d++) {
    days.push(getLiturgicalDay(toIso(utc(year, month, d))));
  }
  return days;
}

export interface KeyDate {
  iso: string;
  name: string;
  color: LiturgicalColor;
}

// Fechas principales del año civil para el resumen del calendario
export function getKeyDates(year: number): KeyDate[] {
  const A = getYearAnchors(year);
  const list: [number, string, LiturgicalColor][] = [
    [utc(year, 0, 1), 'Santa María, Madre de Dios', 'blanco'],
    [A.epiphany, 'Epifanía del Señor', 'blanco'],
    [A.baptism, 'Bautismo del Señor', 'blanco'],
    [A.ashWednesday, 'Miércoles de Ceniza', 'morado'],
    [A.palmSunday, 'Domingo de Ramos', 'rojo'],
    [A.holyThursday, 'Jueves Santo', 'blanco'],
    [A.goodFriday, 'Viernes Santo', 'rojo'],
    [A.easter, 'Domingo de Pascua', 'blanco'],
    [A.ascension, 'Ascensión del Señor', 'blanco'],
    [A.pentecost, 'Pentecostés', 'rojo'],
    [A.trinity, 'Santísima Trinidad', 'blanco'],
    [A.corpusChristi, 'Corpus Christi', 'blanco'],
    [A.sacredHeart, 'Sagrado Corazón de Jesús', 'blanco'],
    [A.christKing, 'Cristo Rey del Universo', 'blanco'],
    [A.advent1, 'I Domingo de Adviento', 'morado'],
    [A.christmas, 'Natividad del Señor', 'blanco'],
  ];
  for (const [mm, dd, name, kind, color] of FIXED) {
    if (kind !== 'S' || (mm === 1 && dd === 1)) continue;
    const day = getLiturgicalDay(toIso(utc(year, mm - 1, dd)));
    // Si la solemnidad fue trasladada, buscar su nueva fecha
    let t = utc(year, mm - 1, dd);
    if (day.title !== name) {
      for (const [tt, cs] of sanctoralFor(year)) {
        if (cs.some(c => c.name === name)) { t = tt; break; }
      }
    }
    list.push([t, name, color]);
  }
  return list
    .sort((a, b) => a[0] - b[0])
    .map(([t, name, color]) => ({ iso: toIso(t), name, color }));
}

export function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const t = utc(y, m - 1, d);
  return `${weekdayName(t)}, ${d} de ${MONTHS[m - 1]} de ${y}`;
}

export function shiftIso(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return toIso(utc(y, m - 1, d) + days * DAY_MS);
}

export function todayIso(): string {
  return toIso(dateToUtc(new Date()));
}

// Misterios del Rosario según el día (Rosarium Virginis Mariae, 38)
export type MysteryKey = 'gozosos' | 'luminosos' | 'dolorosos' | 'gloriosos';
export function mysteriesForDay(iso: string): MysteryKey {
  const [y, m, d] = iso.split('-').map(Number);
  const day = dow(utc(y, m - 1, d));
  if (day === 1 || day === 6) return 'gozosos';
  if (day === 2 || day === 5) return 'dolorosos';
  if (day === 4) return 'luminosos';
  return 'gloriosos';
}

// Fechas de las celebraciones guardadas.
// El ID de una celebración es su fecha (2026-11-15). Si ya hay otra ese día: 2026-11-15_2, _3…
// Las guardadas antes de este cambio tienen como ID el nombre que se escribió ("16 agosto",
// "Septiembre 6.2"); para ubicarlas en el calendario se lee la fecha de ese nombre o de sus datos.

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const MONTH_PATTERN = `(${MONTHS.join('|')}|setiembre)`;
// "16 de agosto", "26julio", "1ro de agosto", "23 de e agosto"
const DAY_THEN_MONTH = new RegExp(`(\\d{1,2})(?:ro|er|º|°)?\\s*(?:de\\s+)?(?:e\\s+)?${MONTH_PATTERN}`);
// "Septiembre 6", "Septiembre 6.2" (pero no "Agosto 2026")
const MONTH_THEN_DAY = new RegExp(`${MONTH_PATTERN}\\s+(\\d{1,2})(?!\\d)`);

interface SavedMassLike {
  metadata?: { dateIso?: string; date?: string; name?: string; title?: string };
}

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function buildIso(year: number, monthIndex: number, day: number): string | null {
  const date = new Date(year, monthIndex, day);
  if (date.getFullYear() !== year || date.getMonth() !== monthIndex || date.getDate() !== day) return null;
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function monthIndexOf(name: string): number {
  return name === 'setiembre' ? 8 : MONTHS.indexOf(name);
}

function yearIn(text: string): number | null {
  const match = text.match(/\b(20\d{2})\b/);
  return match ? Number(match[1]) : null;
}

/** Lee una fecha escrita en español ("Domingo, 16 de Agosto de 2026", "26julio", "Septiembre 6"). */
export function parseSpanishDate(text: string | undefined | null, fallbackYear?: number): string | null {
  if (!text) return null;
  const clean = normalize(text);
  let day: number;
  let monthIndex: number;
  const dayFirst = clean.match(DAY_THEN_MONTH);
  if (dayFirst) {
    day = Number(dayFirst[1]);
    monthIndex = monthIndexOf(dayFirst[2]);
  } else {
    const monthFirst = clean.match(MONTH_THEN_DAY);
    if (!monthFirst) return null;
    day = Number(monthFirst[2]);
    monthIndex = monthIndexOf(monthFirst[1]);
  }
  const year = yearIn(clean) ?? fallbackYear;
  if (!year) return null;
  return buildIso(year, monthIndex, day);
}

/** ¿El ID ya es una fecha (2026-11-15 o 2026-11-15_2)? */
export function isDateId(id: string): boolean {
  return /^\d{4}-\d{2}-\d{2}(_\d+)?$/.test(id);
}

/** Fecha de una celebración guardada, o null si no se puede saber. */
export function getMassDateIso(id: string, data: unknown): string | null {
  if (isDateId(id)) return id.slice(0, 10);
  const metadata = (data as SavedMassLike | null)?.metadata;
  if (metadata?.dateIso && /^\d{4}-\d{2}-\d{2}$/.test(metadata.dateIso)) return metadata.dateIso;
  // En las antiguas manda el nombre ("Eucaristía 12 julio"): la fecha de los datos a veces es la del día en que se preparó
  const savedDate = parseSpanishDate(metadata?.date);
  const fallbackYear = savedDate ? Number(savedDate.slice(0, 4)) : (yearIn(metadata?.date ?? '') ?? new Date().getFullYear());
  return parseSpanishDate(id, fallbackYear) ?? savedDate;
}

/** Nombre para mostrar en la lista. */
export function getMassName(id: string, data: unknown): string {
  const metadata = (data as SavedMassLike | null)?.metadata;
  if (metadata?.name?.trim()) return metadata.name.trim();
  if (!isDateId(id)) return id;
  return metadata?.title?.trim() || 'Celebración';
}

/** Primer ID libre para una fecha: 2026-11-15, luego 2026-11-15_2, _3… */
export function nextFreeDateId(dateIso: string, existingIds: string[]): string {
  if (!existingIds.includes(dateIso)) return dateIso;
  let n = 2;
  while (existingIds.includes(`${dateIso}_${n}`)) n++;
  return `${dateIso}_${n}`;
}

export function isoToLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

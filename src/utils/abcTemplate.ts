// Plantilla de partitura ABC para un canto del repertorio.

const ABC_KEY: Record<string, string> = { 'A#': 'Bb', 'D#': 'Eb', 'G#': 'Ab', 'C#': 'Db', 'A#m': 'Bbm', 'D#m': 'Ebm' };
const BAR_REST: Record<string, string> = { '4/4': 'z8', '3/4': 'z6', '2/4': 'z4', '6/8': 'z6' };

// Esqueleto de partitura: encabezado y un compás de silencio con el cifrado de cada acorde.
// La melodía la escribe el músico reemplazando los silencios por notas.
export function abcSkeleton(title: string, keyName: string, compas: string, bpm: number, chords: string[]): string {
  const key = ABC_KEY[keyName] ?? keyName;
  const tempo = compas === '6/8' ? `3/8=${bpm}` : `1/4=${bpm}`;
  const rest = BAR_REST[compas] ?? 'z8';
  const bars = chords.slice(0, 8).map(c => `"${c}"${rest}`);
  const lines: string[] = [];
  for (let i = 0; i < bars.length; i += 4) lines.push(bars.slice(i, i + 4).join(' | ') + ' |');
  return [`X:1`, `T:${title}`, `M:${compas}`, `L:1/8`, `Q:${tempo}`, `K:${key}`, ...lines].join('\n');
}

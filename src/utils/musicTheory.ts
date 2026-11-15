import guitarChords from '../data/guitarChords.json';

export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Map of flat notes to their sharp equivalents to simplify processing
const FLAT_TO_SHARP: Record<string, string> = {
  'Db': 'C#',
  'Eb': 'D#',
  'Gb': 'F#',
  'Ab': 'G#',
  'Bb': 'A#',
};

// Extracts the root note and the rest of the chord (e.g., "C#m7" -> "C#", "m7")
export function parseChord(chord: string): { root: string; suffix: string } {
  let root = chord.charAt(0);
  if (chord.length > 1 && (chord.charAt(1) === '#' || chord.charAt(1) === 'b')) {
    root += chord.charAt(1);
  }
  const suffix = chord.substring(root.length);
  
  // Convert flat to sharp if needed
  if (FLAT_TO_SHARP[root]) {
    root = FLAT_TO_SHARP[root];
  }
  
  return { root, suffix };
}

const AMERICAN_TO_LATIN: Record<string, string> = {
  'C': 'Do',
  'C#': 'Do#',
  'Db': 'Reb',
  'D': 'Re',
  'D#': 'Re#',
  'Eb': 'Mib',
  'E': 'Mi',
  'F': 'Fa',
  'F#': 'Fa#',
  'Gb': 'Solb',
  'G': 'Sol',
  'G#': 'Sol#',
  'Ab': 'Lab',
  'A': 'La',
  'A#': 'La#',
  'Bb': 'Sib',
  'B': 'Si'
};

export function latinToAmericanRoot(latinRoot: string): string {
  let base = latinRoot;
  let accidental = '';
  
  if (latinRoot.endsWith('#') || latinRoot.endsWith('b')) {
    base = latinRoot.slice(0, -1);
    accidental = latinRoot.slice(-1);
  }
  
  const baseLower = base.toLowerCase();
  let americanBase: string;
  if (baseLower === 'do') americanBase = 'C';
  else if (baseLower === 're') americanBase = 'D';
  else if (baseLower === 'mi') americanBase = 'E';
  else if (baseLower === 'fa') americanBase = 'F';
  else if (baseLower === 'sol') americanBase = 'G';
  else if (baseLower === 'la') americanBase = 'A';
  else if (baseLower === 'si') americanBase = 'B';
  else return latinRoot;
  
  return americanBase + accidental;
}

export function normalizeChordToAmerican(chord: string): string {
  if (!chord) return '';
  if (chord.includes('/')) {
    const [main, bass] = chord.split('/');
    return `${normalizeChordToAmerican(main)}/${normalizeChordToAmerican(bass)}`;
  }
  
  let root = '';
  let suffix = '';
  let isLatin = false;

  const latinMatch = chord.match(/^(do|re|mi|fa|sol|la|si)(#|b)?/i);
  if (latinMatch) {
    root = latinMatch[0];
    suffix = chord.substring(root.length);
    isLatin = true;
  } else {
    const americanMatch = chord.match(/^(c|d|e|f|g|a|b)(#|b)?/i);
    if (americanMatch) {
      root = americanMatch[0];
      suffix = chord.substring(root.length);
    } else {
      return chord;
    }
  }

  // Normalizar sufijos para tonos menores ("-", "M" -> "m")
  if (suffix.startsWith('-')) {
    suffix = 'm' + suffix.substring(1);
  } else if (suffix.startsWith('M') && !suffix.toLowerCase().startsWith('maj')) {
    suffix = 'm' + suffix.substring(1);
  }
  
  if (isLatin) {
    return latinToAmericanRoot(root) + suffix;
  } else {
    const base = root.charAt(0).toUpperCase();
    const acc = root.length > 1 ? root.charAt(1) : '';
    return base + acc + suffix;
  }
}

const NON_CHORD_TAGS = new Set([
  'INTRO', 'CORO', 'ESTRIBILLO', 'ESTROFA', 'PUENTE', 'X4', 'LLENA',
  '-', '–', '(', ')', '%', 'N.C.', 'NC'
]);

export function isValidChordToken(chord: string): boolean {
  if (!chord) return false;
  const clean = chord.trim().replace(/^[\(\[\{\s,]+|[\)\]\}\s,]+$/g, '');
  if (!clean) return false;
  if (NON_CHORD_TAGS.has(clean.toUpperCase())) return false;
  
  const chordRegex = /^(?:do|re|mi|fa|sol|la|si|c|d|e|f|g|a|b)(?:#|b)?(?:m|min|maj|maj7|dim|aug|sus2|sus4|2|4|5|6|7|9|11|13|add9|m7|m7b5|-|M)?(?:\/(?:do|re|mi|fa|sol|la|si|c|d|e|f|g|a|b)(?:#|b)?)?$/i;
  return chordRegex.test(clean);
}


export function formatChord(chord: string, notation: 'american' | 'latin'): string {
  if (!chord) return '';
  if (chord.includes('/')) {
    const [main, bass] = chord.split('/');
    return `${formatChord(main, notation)}/${formatChord(bass, notation)}`;
  }
  
  const normalized = normalizeChordToAmerican(chord);
  if (notation === 'american') {
    return normalized;
  }
  
  const { root, suffix } = parseChord(normalized);
  const latinRoot = AMERICAN_TO_LATIN[root] || root;
  return latinRoot + suffix;
}

export function transposeChord(chord: string, semitones: number): string {
  if (!chord) return '';
  
  // Handle bass notes like G/B -> A/C#
  if (chord.includes('/')) {
    const [main, bass] = chord.split('/');
    return `${transposeChord(main, semitones)}/${transposeChord(bass, semitones)}`;
  }

  const americanChord = normalizeChordToAmerican(chord);
  const { root, suffix } = parseChord(americanChord);
  const currentIndex = NOTES.indexOf(root);
  
  if (currentIndex === -1) {
    return chord; // Return original if not recognized (e.g., N.C.)
  }

  // Calculate new index with wrap-around
  let newIndex = (currentIndex + semitones) % 12;
  if (newIndex < 0) newIndex += 12;

  return `${NOTES[newIndex]}${suffix}`;
}

/**
 * Transposes all [chord] brackets inside a song text string by the specified semitones.
 * Preserves Latin or American notation style of each chord.
 */
export function transposeSongContent(content: string, semitones: number): string {
  if (!content || semitones === 0) return content;
  
  return content.replace(/\[(.*?)\]/g, (_match, chord) => {
    const isLatin = /^(do|re|mi|fa|sol|la|si)/i.test(chord.trim());
    const transposed = transposeChord(chord.trim(), semitones);
    const formatted = isLatin ? formatChord(transposed, 'latin') : transposed;
    return `[${formatted}]`;
  });
}

export interface SongSegment {
  lyric: string;
  chord?: string;
}

export interface SongWord {
  segments: SongSegment[];
}

export type SongLine = SongWord[];

/**
 * Parses a song string with embedded chords into lines of words containing segments.
 * Keeps spaces as separate tokens to maintain exact placement and prevent line-wrap syllable breaks.
 */
export function parseSongContent(content: string): SongLine[] {
  if (!content) return [];
  const lines = content.split('\n');
  
  return lines.map(line => {
    const chords: { index: number; chord: string }[] = [];
    const regex = /\[(.*?)\]/g;
    let plainText = '';
    let lastIndex = 0;
    let match;
    
    // Find all chords and map their indices in plain text
    while ((match = regex.exec(line)) !== null) {
      plainText += line.substring(lastIndex, match.index);
      chords.push({
        index: plainText.length,
        chord: match[1]
      });
      lastIndex = regex.lastIndex;
    }
    plainText += line.substring(lastIndex);
    
    // Fallback if line is empty
    if (plainText.length === 0 && chords.length === 0) {
      return [{ segments: [{ lyric: '' }] }];
    }
    
    // Split plainText into tokens, keeping whitespace matches
    const tokens = plainText.split(/(\s+)/);
    const songWords: SongWord[] = [];
    let currentPlainIndex = 0;
    
    tokens.forEach(token => {
      if (!token) return;
      const tokenLength = token.length;
      const tokenStart = currentPlainIndex;
      const tokenEnd = currentPlainIndex + tokenLength;
      
      // Filter chords that lie inside this token
      const tokenChords = chords.filter(c => c.index >= tokenStart && c.index < tokenEnd);
      
      if (tokenChords.length === 0) {
        songWords.push({
          segments: [{ lyric: token }]
        });
      } else {
        const segments: SongSegment[] = [];
        let lastTokenIndex = 0;
        
        tokenChords.sort((a, b) => a.index - b.index);
        
        tokenChords.forEach(c => {
          const relIndex = c.index - tokenStart;
          if (relIndex > lastTokenIndex) {
            if (segments.length > 0) {
              segments[segments.length - 1].lyric = token.substring(lastTokenIndex, relIndex);
            } else {
              segments.push({ lyric: token.substring(lastTokenIndex, relIndex) });
            }
          }
          segments.push({ chord: c.chord, lyric: '' });
          lastTokenIndex = relIndex;
        });
        
        if (lastTokenIndex < tokenLength) {
          if (segments.length > 0) {
            segments[segments.length - 1].lyric = token.substring(lastTokenIndex);
          } else {
            segments.push({ lyric: token.substring(lastTokenIndex) });
          }
        }
        
        songWords.push({ segments });
      }
      
      currentPlainIndex += tokenLength;
    });
    
    // Append any trailing chords mapped to the end of the line
    const endChords = chords.filter(c => c.index >= plainText.length);
    if (endChords.length > 0) {
      const lastWord = songWords[songWords.length - 1];
      if (lastWord) {
        endChords.forEach(c => {
          lastWord.segments.push({ chord: c.chord, lyric: '' });
        });
      } else {
        songWords.push({
          segments: endChords.map(c => ({ chord: c.chord, lyric: '' }))
        });
      }
    }
    
    return songWords;
  });
}


// Lógica de traducción de texto clásico (acordes arriba, letra abajo) a formato interno
function isChordLine(line: string): boolean {
  if (!line.trim()) return false;
  const words = line.trim().split(/\s+/);
  const chordRegex = /^(DO|RE|MI|FA|SOL|LA|SI|C|D|E|F|G|A|B)(#|b)?(m|M|-)?(maj7|maj|dim|aug|sus4|sus2|2|4|5|6|7|9|11|13)?(\/(DO|RE|MI|FA|SOL|LA|SI|C|D|E|F|G|A|B)(#|b)?)?$/i;
  for (const word of words) {
    if (!chordRegex.test(word) && !['(', ')', '/', '|', '-', '%'].includes(word)) {
      return false;
    }
  }
  return true;
}

export function translateRawToInternal(rawText: string): string {
  const lines = rawText.replace(/\xad/g, '').split('\n');
  const output: string[] = [];
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i].replace(/\r/g, '');
    if (isChordLine(line) && i + 1 < lines.length && !isChordLine(lines[i+1]) && lines[i+1].trim()) {
      const chordLine = line.trimEnd();
      let lyricLine = lines[i+1].replace(/\r/g, '').trimEnd();
      
      const chords: {pos: number, chord: string}[] = [];
      const regex = /\S+/g;
      let match;
      while ((match = regex.exec(chordLine)) !== null) {
        chords.push({ pos: match.index, chord: match[0] });
      }
      
      if (lyricLine.length < chordLine.length) {
        lyricLine = lyricLine.padEnd(chordLine.length, ' ');
      }
      
      for (let j = chords.length - 1; j >= 0; j--) {
        const { pos, chord } = chords[j];
        if (pos >= lyricLine.length) {
          lyricLine += `[${chord}]`;
        } else {
          lyricLine = lyricLine.slice(0, pos) + `[${chord}]` + lyricLine.slice(pos);
        }
      }
      
      output.push(lyricLine.trim());
      i += 2;
    } else {
      if (isChordLine(line)) {
        const regex = /\S+/g;
        const chords: string[] = [];
        let match;
        while ((match = regex.exec(line)) !== null) {
          chords.push(`[${match[0]}]`);
        }
        if (chords.length > 0) {
          output.push(chords.join(' '));
        } else {
          output.push(line.trim());
        }
      } else {
        output.push(line.trim());
      }
      i += 1;
    }
  }
  return output.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function getChordKeyBase(chord: string): string {
  if (!chord) return '';
  const normalized = normalizeChordToAmerican(chord);
  const clean = normalized.split('/')[0];
  let root = clean.charAt(0);
  if (clean.length > 1 && (clean.charAt(1) === '#' || clean.charAt(1) === 'b')) {
    root += clean.charAt(1);
  }
  const suffix = clean.substring(root.length);
  const isMinor = suffix.startsWith('m') && !suffix.startsWith('maj');
  return root + (isMinor ? 'm' : '');
}

export function detectSongKey(content: string): string {
  if (!content) return '';
  const lines = parseSongContent(content);
  const chords: string[] = [];
  lines.forEach(line => {
    line.forEach(word => {
      word.segments.forEach(segment => {
        if (segment.chord) {
          chords.push(segment.chord);
        }
      });
    });
  });

  if (chords.length === 0) return '';

  const firstChord = chords[0];
  const lastChord = chords[chords.length - 1];

  const keyFirst = getChordKeyBase(firstChord);
  const keyLast = getChordKeyBase(lastChord);

  if (keyFirst === keyLast) {
    return keyLast;
  }

  return keyLast;
}

const CHORD_INTERVALS: Record<string, number[]> = {
  "": [0, 4, 7],
  "m": [0, 3, 7],
  "7": [0, 4, 7, 10],
  "m7": [0, 3, 7, 10],
  "maj7": [0, 4, 7, 11],
  "M7": [0, 4, 7, 11],
  "maj": [0, 4, 7],
  "M": [0, 4, 7],
  "dim": [0, 3, 6],
  "dim7": [0, 3, 6, 9],
  "aug": [0, 4, 8],
  "+": [0, 4, 8],
  "sus": [0, 5, 7],
  "sus4": [0, 5, 7],
  "sus2": [0, 2, 7],
  "7sus4": [0, 5, 7, 10],
  "7sus": [0, 5, 7, 10],
  "6": [0, 4, 7, 9],
  "m6": [0, 3, 7, 9],
  "9": [0, 4, 7, 10, 14],
  "m9": [0, 3, 7, 10, 14],
  "maj9": [0, 4, 7, 11, 14],
  "add9": [0, 4, 7, 14],
  "madd9": [0, 3, 7, 14],
  "5": [0, 7]
};

export function getChordNotes(chordName: string): { notes: string[]; root: string; bass: string } {
  const american = normalizeChordToAmerican(chordName);
  if (!american) return { notes: [], root: '', bass: '' };
  
  const [mainChord, bass = ''] = american.split('/');
  const { root, suffix } = parseChord(mainChord);
  
  const rootIndex = NOTES.indexOf(root);
  if (rootIndex === -1) {
    return { notes: [], root, bass };
  }
  
  let intervals = CHORD_INTERVALS[""]; // Default major
  const sortedKeys = Object.keys(CHORD_INTERVALS).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (key && suffix.startsWith(key)) {
      intervals = CHORD_INTERVALS[key];
      break;
    }
  }
  
  const notesSet = new Set<string>();
  intervals.forEach(interval => {
    const noteIndex = (rootIndex + interval) % 12;
    notesSet.add(NOTES[noteIndex]);
  });
  
  let cleanBass = bass;
  if (cleanBass) {
    if (FLAT_TO_SHARP[cleanBass]) {
      cleanBass = FLAT_TO_SHARP[cleanBass];
    }
  }
  
  return { notes: Array.from(notesSet), root, bass: cleanBass };
}

export function getChordMidi(chord: string, instrument: 'guitar' | 'piano'): number[] {
  const norm = normalizeChordToAmerican(chord);
  const main = norm.split('/')[0];
  const { root, suffix } = parseChord(main);
  
  if (instrument === 'guitar') {
    let positions = (guitarChords as Record<string, { midi: number[] }[]>)[norm];
    if (!positions) positions = (guitarChords as Record<string, { midi: number[] }[]>)[main];
    if (!positions) {
      const simple = root + (suffix.startsWith('m') && !suffix.startsWith('maj') ? 'm' : '');
      positions = (guitarChords as Record<string, { midi: number[] }[]>)[simple];
    }
    if (positions && positions[0] && positions[0].midi) {
      return positions[0].midi;
    }
  }
  
  const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const rootIndex = CHROMATIC.indexOf(root);
  if (rootIndex === -1) return [];
  
  const CHORD_INTERVALS: Record<string, number[]> = {
    "": [0, 4, 7], "m": [0, 3, 7], "7": [0, 4, 7, 10], "m7": [0, 3, 7, 10],
    "maj7": [0, 4, 7, 11], "M7": [0, 4, 7, 11], "maj": [0, 4, 7], "M": [0, 4, 7],
    "dim": [0, 3, 6], "dim7": [0, 3, 6, 9], "aug": [0, 4, 8], "+": [0, 4, 8],
    "sus": [0, 5, 7], "sus4": [0, 5, 7], "sus2": [0, 2, 7], "7sus4": [0, 5, 7, 10],
    "7sus": [0, 5, 7, 10], "6": [0, 4, 7, 9], "m6": [0, 3, 7, 9],
    "9": [0, 4, 7, 10, 14], "m9": [0, 3, 7, 10, 14], "maj9": [0, 4, 7, 11, 14],
    "add9": [0, 4, 7, 14], "madd9": [0, 3, 7, 14], "5": [0, 7]
  };
  
  let intervals = [0, 4, 7];
  const sortedKeys = Object.keys(CHORD_INTERVALS).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (key && suffix.startsWith(key)) {
      intervals = CHORD_INTERVALS[key];
      break;
    }
  }
  
  const bassIndex = norm.split('/')[1] ? CHROMATIC.indexOf(normalizeChordToAmerican(norm.split('/')[1])) : -1;
  let chordShift = 0;
  if (bassIndex !== -1 && bassIndex >= rootIndex) {
    chordShift = 12;
  }
  
  const midiNotes: number[] = [];
  intervals.forEach(interval => {
    midiNotes.push(60 + rootIndex + interval + chordShift);
  });
  if (bassIndex !== -1) {
    midiNotes.push(60 + bassIndex);
  }
  return midiNotes;
}



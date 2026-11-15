const fs = require('fs');
const path = require('path');

// Ensure directories exist
const publicDir = path.join(__dirname, '..', 'public', 'acordes');
const guitarDir = path.join(publicDir, 'guitarra');
const pianoDir = path.join(publicDir, 'teclado');

fs.mkdirSync(guitarDir, { recursive: true });
fs.mkdirSync(pianoDir, { recursive: true });

// Core Notes Definition
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Suffix types we support
const SUFFIXES = [
  { name: '', type: 'major' },
  { name: 'm', type: 'minor' },
  { name: '7', type: '7th' },
  { name: 'm7', type: 'm7' },
  { name: 'maj7', type: 'maj7' },
  { name: 'sus4', type: 'sus4' },
  { name: 'sus2', type: 'sus2' }
];

// Base Chord Shapes for Guitar (Root at E or A shape, at fret 0)
const BASE_GUITAR_SHAPES = {
  // Major
  'E_major': { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0], barres: [] },
  'A_major': { frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0], barres: [] },
  // Minor
  'E_minor': { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0], barres: [] },
  'A_minor': { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0], barres: [] },
  // 7th
  'E_7th': { frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0], barres: [] },
  'A_7th': { frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0], barres: [] },
  // m7
  'E_m7': { frets: [0, 2, 0, 0, 0, 0], fingers: [0, 2, 0, 0, 0, 0], barres: [] },
  'A_m7': { frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0], barres: [] },
  // maj7
  'E_maj7': { frets: [0, 2, 1, 1, 0, 0], fingers: [0, 2, 3, 4, 0, 0], barres: [1] },
  'A_maj7': { frets: [-1, 0, 2, 1, 2, 0], fingers: [0, 0, 2, 1, 3, 0], barres: [] },
  // sus4
  'E_sus4': { frets: [0, 2, 2, 2, 0, 0], fingers: [0, 2, 3, 4, 0, 0], barres: [] },
  'A_sus4': { frets: [-1, 0, 2, 2, 3, 0], fingers: [0, 0, 1, 2, 3, 0], barres: [] },
  // sus2
  'E_sus2': { frets: [0, 2, 4, 4, 0, 0], fingers: [0, 1, 3, 4, 0, 0], barres: [] },
  'A_sus2': { frets: [-1, 0, 2, 2, 0, 0], fingers: [0, 0, 2, 3, 0, 0], barres: [] }
};

// Custom open chord overrides for traditional fingerings
const GUITAR_OVERRIDES = {
  // C Major
  'C': { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0], barres: [], baseFret: 1 },
  // D Major
  'D': { frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2], barres: [], baseFret: 1 },
  // G Major
  'G': { frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3], barres: [], baseFret: 1 },
  // D minor
  'Dm': { frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1], barres: [], baseFret: 1 },
  // C7
  'C7': { frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0], barres: [], baseFret: 1 },
  // D7
  'D7': { frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3], barres: [], baseFret: 1 },
  // G7
  'G7': { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1], barres: [], baseFret: 1 },
  // Dm7
  'Dm7': { frets: [-1, -1, 0, 2, 1, 1], fingers: [0, 0, 0, 2, 1, 1], barres: [1], baseFret: 1 },
  // Cmaj7
  'Cmaj7': { frets: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0], barres: [], baseFret: 1 },
  // Dmaj7
  'Dmaj7': { frets: [-1, -1, 0, 2, 2, 2], fingers: [0, 0, 0, 1, 1, 1], barres: [2], baseFret: 1 },
  // Gmaj7
  'Gmaj7': { frets: [3, 2, 0, 0, 0, 2], fingers: [2, 1, 0, 0, 0, 3], barres: [], baseFret: 1 },
  // Dsus4
  'Dsus4': { frets: [-1, -1, 0, 2, 3, 3], fingers: [0, 0, 0, 1, 3, 4], barres: [], baseFret: 1 },
  // Dsus2
  'Dsus2': { frets: [-1, -1, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 2, 0], barres: [], baseFret: 1 }
};

// Piano interval mappings (offsets from root note)
const PIANO_INTERVALS = {
  'major': [0, 4, 7],
  'minor': [0, 3, 7],
  '7th': [0, 4, 7, 10],
  'm7': [0, 3, 7, 10],
  'maj7': [0, 4, 7, 11],
  'sus4': [0, 5, 7],
  'sus2': [0, 2, 7]
};

// Helper: Get root note offset
function getRootOffset(root) {
  return NOTES.indexOf(root);
}

// Transpose a guitar shape
function getGuitarChord(root, type) {
  const chordName = root + (type === 'major' ? '' : type === 'minor' ? 'm' : type);
  
  // Check overrides first
  if (GUITAR_OVERRIDES[chordName]) {
    return GUITAR_OVERRIDES[chordName];
  }

  // Determine transposition mapping
  const rootIndex = NOTES.indexOf(root);
  let baseShapeName = 'E_' + type;
  let offset = 0;

  const isAShape = [0, 1, 2, 3, 10, 11].includes(rootIndex);
  
  if (isAShape) {
    baseShapeName = 'A_' + type;
    offset = (rootIndex - 9 + 12) % 12;
  } else {
    baseShapeName = 'E_' + type;
    offset = (rootIndex - 4 + 12) % 12;
  }

  const baseShape = BASE_GUITAR_SHAPES[baseShapeName];
  if (!baseShape) {
    return BASE_GUITAR_SHAPES['E_major'];
  }

  const frets = baseShape.frets.map(f => (f === -1 || f === 0) ? (f === 0 && offset > 0 ? offset : f) : f + offset);
  const fingers = [...baseShape.fingers];
  const barres = offset > 0 ? [offset] : [];
  const baseFret = offset > 0 ? offset : 1;

  if (offset > 0) {
    if (isAShape) {
      fingers[1] = 1;
      fingers[5] = 1;
    } else {
      fingers[0] = 1;
      fingers[5] = 1;
    }
  }

  return { frets, fingers, barres, baseFret };
}

// Generate Guitar SVG XML
function generateGuitarSVG(name, chord) {
  const { frets, fingers, barres, baseFret } = chord;
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 140" width="120" height="140">
  <rect width="120" height="140" fill="#1e293b" rx="8"/>
  <text x="60" y="24" font-family="system-ui, sans-serif" font-weight="bold" font-size="14" fill="#ffffff" text-anchor="middle">${name}</text>
  
  <!-- Fretboard lines -->
  <line x1="30" y1="40" x2="90" y2="40" stroke="#64748b" stroke-width="${baseFret === 1 ? 4 : 1}" />
  <line x1="30" y1="60" x2="90" y2="60" stroke="#475569" stroke-width="1" />
  <line x1="30" y1="80" x2="90" y2="80" stroke="#475569" stroke-width="1" />
  <line x1="30" y1="100" x2="90" y2="100" stroke="#475569" stroke-width="1" />
  <line x1="30" y1="120" x2="90" y2="120" stroke="#475569" stroke-width="1" />
  
  <!-- Strings -->
  <line x1="30" y1="40" x2="30" y2="120" stroke="#64748b" stroke-width="1" />
  <line x1="42" y1="40" x2="42" y2="120" stroke="#64748b" stroke-width="1" />
  <line x1="54" y1="40" x2="54" y2="120" stroke="#64748b" stroke-width="1" />
  <line x1="66" y1="40" x2="66" y2="120" stroke="#64748b" stroke-width="1" />
  <line x1="78" y1="40" x2="78" y2="120" stroke="#64748b" stroke-width="1" />
  <line x1="90" y1="40" x2="90" y2="120" stroke="#64748b" stroke-width="1" />
  `;

  if (baseFret > 1) {
    svg += `  <text x="16" y="55" font-family="system-ui, sans-serif" font-weight="bold" font-size="10" fill="#94a3b8" text-anchor="middle">${baseFret}fr</text>\n`;
  }

  for (let s = 0; s < 6; s++) {
    const x = 30 + s * 12;
    if (frets[s] === -1) {
      svg += `  <path d="M${x-3} 32 L${x+3} 38 M${x+3} 32 L${x-3} 38" stroke="#ef4444" stroke-width="1.5" />\n`;
    } else if (frets[s] === 0) {
      svg += `  <circle cx="${x}" cy="35" r="3" fill="none" stroke="#22c55e" stroke-width="1.5" />\n`;
    }
  }

  if (barres && barres.length > 0) {
    barres.forEach(barreFret => {
      const relFret = barreFret - baseFret + 1;
      const y = 40 + (relFret - 0.5) * 20;
      
      let startIdx = frets.findIndex(f => f === barreFret);
      let endIdx = 5;
      if (startIdx === -1) startIdx = 0;
      
      const xStart = 30 + startIdx * 12;
      const xEnd = 30 + endIdx * 12;
      
      svg += `  <rect x="${xStart - 4}" y="${y - 4}" width="${xEnd - xStart + 8}" height="8" rx="4" fill="#ef4444" opacity="0.8"/>\n`;
    });
  }

  for (let s = 0; s < 6; s++) {
    const fret = frets[s];
    if (fret > 0) {
      const relFret = fret - baseFret + 1;
      const x = 30 + s * 12;
      const y = 40 + (relFret - 0.5) * 20;
      const finger = fingers[s];

      svg += `  <circle cx="${x}" cy="${y}" r="6" fill="#ef4444" />\n`;
      if (finger > 0) {
        svg += `  <text x="${x}" y="${y+3.5}" font-family="system-ui, sans-serif" font-weight="bold" font-size="9" fill="#ffffff" text-anchor="middle">${finger}</text>\n`;
      }
    }
  }

  svg += `</svg>`;
  return svg;
}

// Generate Piano SVG XML
function generatePianoSVG(name, root, type) {
  const intervals = PIANO_INTERVALS[type] || [0, 4, 7];
  const rootOffset = getRootOffset(root);
  
  const rawNotes = intervals.map(interval => rootOffset + interval);
  
  let notes = [...rawNotes];
  const maxNote = Math.max(...notes);
  if (maxNote > 24) {
    notes = notes.map(n => n - 12);
  }
  const minNote = Math.min(...notes);
  if (minNote < 0) {
    notes = notes.map(n => n + 12);
  }

  const WHITE_KEYS = [
    { semitone: 0, label: 'C4' },
    { semitone: 2, label: 'D4' },
    { semitone: 4, label: 'E4' },
    { semitone: 5, label: 'F4' },
    { semitone: 7, label: 'G4' },
    { semitone: 9, label: 'A4' },
    { semitone: 11, label: 'B4' },
    { semitone: 12, label: 'C5' },
    { semitone: 14, label: 'D5' },
    { semitone: 16, label: 'E5' },
    { semitone: 17, label: 'F5' },
    { semitone: 19, label: 'G5' },
    { semitone: 21, label: 'A5' },
    { semitone: 23, label: 'B5' },
    { semitone: 24, label: 'C6' }
  ];

  const BLACK_KEYS = [
    { semitone: 1, leftWhiteKey: 0 },
    { semitone: 3, leftWhiteKey: 1 },
    { semitone: 6, leftWhiteKey: 3 },
    { semitone: 8, leftWhiteKey: 4 },
    { semitone: 10, leftWhiteKey: 5 },
    { semitone: 13, leftWhiteKey: 7 },
    { semitone: 15, leftWhiteKey: 8 },
    { semitone: 18, leftWhiteKey: 10 },
    { semitone: 20, leftWhiteKey: 11 },
    { semitone: 22, leftWhiteKey: 12 }
  ];

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 100" width="170" height="100">
  <rect width="170" height="100" fill="#1e293b" rx="8"/>
  <text x="85" y="24" font-family="system-ui, sans-serif" font-weight="bold" font-size="14" fill="#ffffff" text-anchor="middle">${name}</text>
  
  <!-- Keyboard Wrapper -->
  <g transform="translate(10, 32)">
  `;

  WHITE_KEYS.forEach((key, i) => {
    const isActive = notes.includes(key.semitone);
    const x = i * 10;
    svg += `    <rect x="${x}" y="0" width="10" height="50" fill="${isActive ? '#ef4444' : '#ffffff'}" stroke="#334155" stroke-width="1" rx="1" />\n`;
  });

  BLACK_KEYS.forEach(key => {
    const isActive = notes.includes(key.semitone);
    const x = (key.leftWhiteKey + 1) * 10 - 3;
    svg += `    <rect x="${x}" y="0" width="6" height="32" fill="${isActive ? '#f87171' : '#0f172a'}" stroke="#1e293b" stroke-width="0.5" rx="0.5" />\n`;
  });

  svg += `  </g>
</svg>`;
  return svg;
}

let totalGenerated = 0;

NOTES.forEach(root => {
  SUFFIXES.forEach(suffix => {
    const chordName = root + suffix.name;
    const normalizedName = chordName.replace('#', 'sharp');

    // 1. Guitar
    const guitarChord = getGuitarChord(root, suffix.type);
    const guitarSVG = generateGuitarSVG(chordName, guitarChord);
    fs.writeFileSync(path.join(guitarDir, `${normalizedName}.svg`), guitarSVG);

    // 2. Piano
    const pianoSVG = generatePianoSVG(chordName, root, suffix.type);
    fs.writeFileSync(path.join(pianoDir, `${normalizedName}.svg`), pianoSVG);

    totalGenerated++;
  });
});

const FLATS_MAPPING = {
  'Db': 'C#',
  'Eb': 'D#',
  'Gb': 'F#',
  'Ab': 'G#',
  'Bb': 'A#'
};

Object.entries(FLATS_MAPPING).forEach(([flat, sharp]) => {
  SUFFIXES.forEach(suffix => {
    const flatName = flat + suffix.name;
    const sharpName = sharp + suffix.name;
    
    const flatFilename = flatName.replace('#', 'sharp');
    const sharpFilename = sharpName.replace('#', 'sharp');

    fs.copyFileSync(
      path.join(guitarDir, `${sharpFilename}.svg`),
      path.join(guitarDir, `${flatFilename}.svg`)
    );
    
    fs.copyFileSync(
      path.join(pianoDir, `${sharpFilename}.svg`),
      path.join(pianoDir, `${flatFilename}.svg`)
    );
    
    totalGenerated++;
  });
});

console.log(`¡Éxito! Generados ${totalGenerated} diagramas de acordes vectoriales.`);

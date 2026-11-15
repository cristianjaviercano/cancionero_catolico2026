const fs = require('fs');
const path = require('path');

const SONGS_JSON_PATH = path.resolve(__dirname, '../src/data/songs.json');
const BACKUP_JSON_PATH = path.resolve(__dirname, '../src/data/songs.backup.json');
const CANCIONES_NUEVAS_DIR = path.resolve(__dirname, '../../cancioneros_liturgicos/canciones_nuevas');

const CHORD_REGEX = /^(?:DO|RE|MI|FA|SOL|LA|SI|[CDEFGAB])(#|b)?(m|maj|min|dim|aug|sus[24]?|[0-9]+)?(\/[A-G]|\/(?:DO|RE|MI|FA|SOL|LA|SI))?$/i;

function isChordToken(token) {
  const clean = token.replace(/[\(\)\[\],.:;]/g, '').trim();
  if (!clean) return false;
  return CHORD_REGEX.test(clean);
}

function isChordLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (/^(CORO|INTRO|ESTRIBILLO|ESTROFA|PUENTE|FINAL|SOLO):?/i.test(trimmed)) return false;
  if (/^A\.\s+/i.test(trimmed) || /^S\.\s+/i.test(trimmed)) return false;

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length === 0) return false;

  let chordCount = 0;
  for (const w of words) {
    if (isChordToken(w)) chordCount++;
  }

  return (chordCount / words.length) >= 0.6;
}

function getChordsWithPositions(line) {
  const chords = [];
  const regex = /\S+/g;
  let match;
  while ((match = regex.exec(line)) !== null) {
    if (isChordToken(match[0])) {
      chords.push({
        chord: match[0].replace(/[\(\)\[\],]/g, ''),
        index: match.index
      });
    }
  }
  return chords;
}

function mergeChordsAndLyrics(chordLine, lyricLine) {
  const chords = getChordsWithPositions(chordLine);
  if (chords.length === 0) return lyricLine;

  const sorted = [...chords].sort((a, b) => b.index - a.index);
  let result = lyricLine;

  for (const c of sorted) {
    let pos = Math.min(c.index, result.length);
    
    // Snap to word start if within 3 characters
    if (pos > 0 && pos < result.length && result[pos] !== ' ' && result[pos - 1] !== ' ') {
      let wordStart = pos;
      while (wordStart > 0 && result[wordStart - 1] !== ' ') {
        wordStart--;
      }
      if (pos - wordStart <= 3) {
        pos = wordStart;
      }
    }

    result = result.slice(0, pos) + `[${c.chord}]` + result.slice(pos);
  }

  return result;
}

function convertRawToSongContent(rawText) {
  let text = rawText.replace(/```[a-z]*\n?/gi, '').trim();
  const lines = text.split(/\r?\n/);
  const outputLines = [];

  for (let i = 0; i < lines.length; i++) {
    const current = lines[i];

    if (isChordLine(current)) {
      let nextLine = lines[i + 1];
      if (nextLine !== undefined && nextLine.trim().length > 0 && !isChordLine(nextLine)) {
        outputLines.push(mergeChordsAndLyrics(current, nextLine));
        i++;
      } else {
        const chords = getChordsWithPositions(current);
        outputLines.push(chords.map(c => `[${c.chord}]`).join(' '));
      }
    } else {
      outputLines.push(current);
    }
  }

  return outputLines.join('\n');
}

function detectKey(content) {
  const match = content.match(/\[([A-G][#b]?[m]?|(?:DO|RE|MI|FA|SOL|LA|SI)[#b]?[m]?)\]/i);
  return match ? match[1] : undefined;
}

function inferType(title, content) {
  const combined = (title + ' ' + content).toLowerCase();
  if (combined.includes('cena del cordero') || combined.includes('pan vivo') || combined.includes('cuerpo') || combined.includes('comunión')) {
    return 'Comunión';
  }
  if (combined.includes('edificar la iglesia') || combined.includes('juntos vamos') || combined.includes('alegría') || combined.includes('vamos con gozo')) {
    return 'Entrada';
  }
  if (combined.includes('oveja') || combined.includes('pastor') || combined.includes('cinco panes') || combined.includes('mendigo')) {
    return 'Ofertorio';
  }
  if (combined.includes('paz') || combined.includes('cordero')) {
    return 'Paz';
  }
  if (combined.includes('santo') || combined.includes('dios trino')) {
    return 'Santo';
  }
  if (combined.includes('maría') || combined.includes('virgen')) {
    return 'María';
  }
  return 'Alabanza';
}

function normalize(str) {
  return str.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, '');
}

function formatTitleFromFilename(fileName) {
  const base = fileName.replace(/\.md$/i, '').replace(/_/g, ' ');
  // Capitalize words
  return base.replace(/\b[a-záéíóúñ]/gi, char => char.toUpperCase());
}

// Execution
const isDryRun = process.argv.includes('--dry-run');

console.log('🎶 Procesando canciones nuevas para el repertorio...\n');

if (!fs.existsSync(CANCIONES_NUEVAS_DIR)) {
  console.error('❌ Directorio de canciones nuevas no encontrado:', CANCIONES_NUEVAS_DIR);
  process.exit(1);
}

const existingSongs = JSON.parse(fs.readFileSync(SONGS_JSON_PATH, 'utf8'));
const existingTitles = new Set(existingSongs.map(s => normalize(s.title)));

let maxId = existingSongs.reduce((max, s) => {
  const num = parseInt(s.id, 10);
  return !isNaN(num) && num > max ? num : max;
}, 0);

const files = fs.readdirSync(CANCIONES_NUEVAS_DIR).filter(f => f.endsWith('.md'));
const newSongsToAdd = [];

for (const file of files) {
  const filePath = path.join(CANCIONES_NUEVAS_DIR, file);
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) continue;

  const defaultTitle = formatTitleFromFilename(file);
  const normalizedTitle = normalize(defaultTitle);

  if (existingTitles.has(normalizedTitle)) {
    console.log(`⏩ Omitiendo "${defaultTitle}" (ya existe en songs.json)`);
    continue;
  }

  const content = convertRawToSongContent(raw);
  const detectedKey = detectKey(content);
  const type = inferType(defaultTitle, content);

  const songId = 'cn-' + path.basename(file, '.md').toLowerCase().replace(/[^a-z0-9_]/g, '_');
  const songObj = {
    id: songId,
    title: defaultTitle,
    type: type,
    content: content,
    author: "Música Católica",
    key: detectedKey
  };

  newSongsToAdd.push(songObj);
  console.log(`✨ Preparada: [ID ${songObj.id}] "${songObj.title}" | Categoría: ${songObj.type} | Tono: ${songObj.key || 'N/D'}`);
}

console.log(`\n📊 Total de canciones existentes: ${existingSongs.length}`);
console.log(`➕ Nuevas canciones listas para agregar: ${newSongsToAdd.length}`);

if (newSongsToAdd.length === 0) {
  console.log('\n✅ El repertorio ya está completamente actualizado con la carpeta canciones_nuevas.');
  process.exit(0);
}

if (isDryRun) {
  console.log('\n🔍 Modo --dry-run: No se aplicaron cambios a songs.json.');
} else {
  // Backup existing songs
  fs.writeFileSync(BACKUP_JSON_PATH, JSON.stringify(existingSongs, null, 2), 'utf8');
  console.log(`💾 Respaldo de seguridad creado en: ${path.relative(process.cwd(), BACKUP_JSON_PATH)}`);

  const updatedSongs = [...existingSongs, ...newSongsToAdd];
  fs.writeFileSync(SONGS_JSON_PATH, JSON.stringify(updatedSongs, null, 2), 'utf8');
  console.log(`🚀 songs.json actualizado con éxito. Nuevo total de canciones: ${updatedSongs.length}`);
}

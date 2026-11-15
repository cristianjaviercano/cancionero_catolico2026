const fs = require('fs');
const path = require('path');

const CHORD_REGEX = /^(?:DO|RE|MI|FA|SOL|LA|SI|[CDEFGAB])(#|b)?(m|maj|min|dim|aug|sus[24]?|[0-9]+)?(\/[A-G]|\/(?:DO|RE|MI|FA|SOL|LA|SI))?$/i;

function isChordToken(token) {
  const clean = token.replace(/[\(\)\[\],.:;]/g, '').trim();
  if (!clean) return false;
  return CHORD_REGEX.test(clean);
}

function isChordLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  // Ignore section headers like CORO:, INTRO:, ESTRIBILLO:
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

  // Sort descending by position so insertions do not shift indices of earlier chords
  const sorted = [...chords].sort((a, b) => b.index - a.index);
  let result = lyricLine;

  for (const c of sorted) {
    let pos = Math.min(c.index, result.length);
    
    // If inserting in the middle of a word, try snapping to the start of the word if close
    if (pos > 0 && pos < result.length && result[pos] !== ' ' && result[pos - 1] !== ' ') {
      // Find start of current word
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
  // Strip markdown code block
  let text = rawText.replace(/```[a-z]*\n?/gi, '').trim();
  const lines = text.split(/\r?\n/);
  const outputLines = [];

  for (let i = 0; i < lines.length; i++) {
    const current = lines[i];

    if (isChordLine(current)) {
      // Lookahead: is next line a lyric line?
      let nextLine = lines[i + 1];
      if (nextLine !== undefined && nextLine.trim().length > 0 && !isChordLine(nextLine)) {
        outputLines.push(mergeChordsAndLyrics(current, nextLine));
        i++; // skip next line as it is consumed
      } else {
        // Standalone chord line (like intro or instrumental)
        const chords = getChordsWithPositions(current);
        outputLines.push(chords.map(c => `[${c.chord}]`).join(' '));
      }
    } else {
      outputLines.push(current);
    }
  }

  return outputLines.join('\n');
}

// Test with 100_ovejas and a_la_cena_del_cordero
const testFiles = ['100_ovejas.md', 'a_edificar_la_iglesia.md', 'a_la_cena_del_cordero.md'];
const dir = path.resolve(__dirname, '../../cancioneros_liturgicos/canciones_nuevas');

testFiles.forEach(f => {
  const filePath = path.join(dir, f);
  if (fs.existsSync(filePath)) {
    const raw = fs.readFileSync(filePath, 'utf8');
    console.log('==============================');
    console.log('FILE:', f);
    console.log('==============================');
    console.log(convertRawToSongContent(raw));
  }
});

import React, { useState, useEffect } from 'react';
import { normalizeChordToAmerican, formatChord, parseChord, getChordNotes } from '../utils/musicTheory';
import guitarChords from '../data/guitarChords.json';

interface ChordDiagramProps {
  chordName: string;
  notation?: 'american' | 'latin';
  instrument?: 'guitar' | 'piano' | 'guitarra' | 'teclado';
  width?: number;
}

export function ChordDiagram({ 
  chordName, 
  notation = 'american', 
  instrument = 'guitar', 
  width = 90 
}: ChordDiagramProps) {
  const [positionIndex, setPositionIndex] = useState(0);

  // Reset variant index when chord name or instrument changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPositionIndex(0);
  }, [chordName, instrument]);

  const displayName = formatChord(chordName, notation);
  const isPiano = instrument === 'piano' || instrument === 'teclado';
  const containerWidth = isPiano ? width * 1.7 : width;

  // 1. Process Guitar Chord
  const normalized = normalizeChordToAmerican(chordName);
  const mainPart = normalized.split('/')[0];
  const { root, suffix } = parseChord(mainPart);
  const baseChord = root + suffix;

  // Lookup positions with fallback
  let positions = (guitarChords as Record<string, any[]>)[normalized];
  if (!positions) {
    positions = (guitarChords as Record<string, any[]>)[baseChord];
  }
  if (!positions) {
    // Try simplified base (major or minor)
    const isMinor = suffix.startsWith('m') && !suffix.startsWith('maj');
    const simpleChord = root + (isMinor ? 'm' : '');
    positions = (guitarChords as Record<string, any[]>)[simpleChord];
  }

  // Render Guitar SVG
  const renderGuitarSVG = (pos: { frets: number[]; fingers: number[]; baseFret: number; barres: number[] }) => {
    const { frets, fingers, baseFret, barres } = pos;
    const stringsCount = 6;
    const fretsCount = 4;
    
    const getX = (sIndex: number) => 15 + sIndex * 14;
    const getY = (relFret: number) => 25 + (relFret - 0.5) * 20;
    
    const elements: React.ReactNode[] = [];
    
    // Draw fret lines (horizontal)
    for (let f = 0; f <= fretsCount; f++) {
      const y = 25 + f * 20;
      const isNut = baseFret === 1 && f === 0;
      elements.push(
        <line 
          key={`fret-${f}`}
          x1={15} 
          y1={y} 
          x2={85} 
          y2={y} 
          stroke="#475569" 
          strokeWidth={isNut ? 4.5 : 1}
        />
      );
    }
    
    // Draw string lines (vertical)
    for (let s = 0; s < stringsCount; s++) {
      const x = getX(s);
      elements.push(
        <line 
          key={`string-${s}`}
          x1={x} 
          y1={25} 
          x2={x} 
          y2={105} 
          stroke="#475569" 
          strokeWidth={1.75 - (s * 0.2)} // Thicker strings on left
        />
      );
    }
    
    // Draw base fret label
    if (baseFret > 1) {
      elements.push(
        <text 
          key="base-fret"
          x={5} 
          y={38} 
          fontSize="9.5" 
          fontWeight="bold" 
          fill="#dc2626" 
          textAnchor="middle"
          fontFamily="monospace"
        >
          {baseFret}
        </text>
      );
    }
    
    // Draw string markers (muted / open) above nut
    frets.forEach((fret, s) => {
      const x = getX(s);
      if (fret === -1) {
        elements.push(
          <text 
            key={`muted-${s}`}
            x={x} 
            y={15} 
            fontSize="12" 
            fontWeight="bold" 
            fill="#ef4444" 
            textAnchor="middle"
            fontFamily="monospace"
          >
            ×
          </text>
        );
      } else if (fret === 0) {
        elements.push(
          <circle 
            key={`open-${s}`}
            cx={x} 
            cy={11} 
            r={3} 
            stroke="#10b981" 
            strokeWidth="1.5" 
            fill="none" 
          />
        );
      }
    });
    
    // Draw barres
    barres.forEach((barreFret, idx) => {
      let firstStr = -1;
      let lastStr = -1;
      for (let s = 0; s < stringsCount; s++) {
        if (frets[s] === barreFret) {
          if (firstStr === -1) firstStr = s;
          lastStr = s;
        }
      }
      
      if (firstStr !== -1 && lastStr !== -1 && firstStr < lastStr) {
        const y = 25 + (barreFret - 0.5) * 20;
        const x1 = getX(firstStr);
        elements.push(
          <rect 
            key={`barre-${idx}`}
            x={x1 - 5} 
            y={y - 5.5} 
            width={(lastStr - firstStr) * 14 + 10} 
            height={11} 
            rx={5.5}
            fill="#dc2626"
            opacity="0.85"
          />
        );
      }
    });
    
    // Draw finger press circles
    frets.forEach((fret, s) => {
      if (fret > 0) {
        const x = getX(s);
        const y = getY(fret);
        const finger = fingers[s];
        
        elements.push(
          <g key={`finger-${s}`}>
            <circle 
              cx={x} 
              cy={y} 
              r={6} 
              fill="#dc2626"
              stroke="#ffffff"
              strokeWidth={1.2}
            />
            {finger > 0 && (
              <text 
                x={x} 
                y={y + 3} 
                fontSize="8" 
                fontWeight="extrabold" 
                fill="#ffffff" 
                textAnchor="middle"
                fontFamily="sans-serif"
              >
                {finger}
              </text>
            )}
          </g>
        );
      }
    });
    
    return (
      <svg viewBox="0 0 100 115" className="w-full h-auto select-none">
        {elements}
      </svg>
    );
  };

  // Render Piano SVG
  const renderPianoSVG = () => {
    const { notes, root: pRoot, bass: pBass } = getChordNotes(chordName);
    const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    const rootIndex = CHROMATIC.indexOf(pRoot);
    const bassIndex = pBass ? CHROMATIC.indexOf(pBass) : -1;
    
    const activePitches: { pitch: number; role: 'root' | 'chord' | 'bass' }[] = [];
    
    if (rootIndex !== -1) {
      // Sort keys by length descending to match longest suffix first
      let intervals = [0, 4, 7]; // Default major
      const sortedKeys = Object.keys(CHORD_INTERVALS_PIANO).sort((a, b) => b.length - a.length);
      for (const key of sortedKeys) {
        if (key && suffix.startsWith(key)) {
          intervals = CHORD_INTERVALS_PIANO[key];
          break;
        }
      }
      
      let chordShift = 0;
      if (bassIndex !== -1 && bassIndex >= rootIndex) {
        chordShift = 12; // Shift chord notes up to keep bass as lowest pitch
      }
      
      intervals.forEach((interval, idx) => {
        const pitch = rootIndex + interval + chordShift;
        if (pitch < 24) {
          activePitches.push({
            pitch,
            role: idx === 0 ? 'root' : 'chord'
          });
        }
      });
      
      if (bassIndex !== -1) {
        activePitches.push({
          pitch: bassIndex,
          role: 'bass'
        });
      }
    }
    
    const getPitchActiveRole = (pitch: number) => {
      const found = activePitches.find(ap => ap.pitch === pitch);
      return found ? found.role : null;
    };
    
    const whiteKeys: React.ReactNode[] = [];
    const blackKeys: React.ReactNode[] = [];
    
    // Draw white keys (14 total, C4 to B5)
    for (let j = 0; j < 14; j++) {
      const octave = Math.floor(j / 7);
      const keyInOctave = j % 7;
      const pitchMap = [0, 2, 4, 5, 7, 9, 11];
      const pitch = pitchMap[keyInOctave] + octave * 12;
      
      const role = getPitchActiveRole(pitch);
      let fill = '#ffffff';
      if (role === 'root') fill = '#dc2626';
      else if (role === 'chord') fill = '#f87171';
      else if (role === 'bass') fill = '#3b82f6';
      
      const x = 1 + j * 12;
      whiteKeys.push(
        <g key={`white-${j}`}>
          <rect 
            x={x} 
            y={2} 
            width={12} 
            height={45} 
            fill={fill} 
            stroke="#cbd5e1" 
            strokeWidth={1}
            rx={1.5}
          />
          {role && (
            <circle 
              cx={x + 6} 
              cy={38} 
              r={2} 
              fill={role === 'root' || role === 'bass' ? '#ffffff' : '#b91c1c'} 
            />
          )}
        </g>
      );
    }
    
    // Draw black keys (placed between appropriate white keys)
    for (let j = 0; j < 14; j++) {
      const octave = Math.floor(j / 7);
      const keyInOctave = j % 7;
      
      if ([0, 1, 3, 4, 5].includes(keyInOctave)) {
        const pitchMap = { 0: 1, 1: 3, 3: 6, 4: 8, 5: 10 };
        const noteInOctave = (pitchMap as Record<number, number>)[keyInOctave];
        const pitch = noteInOctave + octave * 12;
        
        const role = getPitchActiveRole(pitch);
        let fill = '#1e293b';
        if (role === 'root') fill = '#b91c1c';
        else if (role === 'chord') fill = '#ef4444';
        else if (role === 'bass') fill = '#1d4ed8';
        
        const x = 1 + j * 12 + 12 - 3.5;
        blackKeys.push(
          <g key={`black-${j}`}>
            <rect 
              x={x} 
              y={2} 
              width={7} 
              height={28} 
              fill={fill} 
              stroke="#0f172a" 
              strokeWidth={0.5}
              rx={1}
            />
            {role && (
              <circle 
                cx={x + 3.5} 
                cy={22} 
                r={1.2} 
                fill="#ffffff" 
              />
            )}
          </g>
        );
      }
    }
    
    return (
      <div className="flex flex-col items-center w-full">
        <svg viewBox="0 0 170 50" className="w-full h-auto select-none">
          {whiteKeys}
          {blackKeys}
        </svg>
        {notes.length > 0 && (
          <span className="text-[10px] text-stone-500 font-mono mt-1.5 uppercase tracking-wide text-center">
            Notas: {notes.join(' • ')} {pBass && <span className="text-blue-500 font-bold">(Bajo: {pBass})</span>}
          </span>
        )}
      </div>
    );
  };

  // Fallback if guitar positions are missing and we are in guitar mode
  const hasGuitarPositions = positions && positions.length > 0;

  if (!isPiano && !hasGuitarPositions) {
    return (
      <div 
        className="flex flex-col items-center justify-center bg-stone-100 rounded-xl border border-stone-200 p-2 shadow-sm text-center"
        style={{ width: containerWidth, height: width * 1.1 }}
      >
        <span className="font-bold text-stone-700 text-xs font-mono">{displayName}</span>
        <span className="text-[9px] text-stone-400 mt-1 uppercase tracking-wide">Sin diag.</span>
      </div>
    );
  }

  const activePosition = hasGuitarPositions ? positions[positionIndex] : null;

  return (
    <div className="flex flex-col items-center bg-stone-50 p-2.5 rounded-xl border border-stone-200 shadow-sm transition-shadow hover:shadow-md">
      <span className="font-bold text-stone-800 mb-1.5 text-xs font-mono uppercase tracking-wider">{displayName}</span>
      <div style={{ width: containerWidth }} className="flex justify-center">
        {isPiano ? renderPianoSVG() : activePosition && renderGuitarSVG(activePosition)}
      </div>
      
      {/* Guitar position switcher dots */}
      {!isPiano && positions && positions.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {positions.map((_: unknown, idx: number) => (
            <button
              key={idx}
              onClick={() => setPositionIndex(idx)}
              className={`w-1.5 h-1.5 rounded-full transition-all border-none p-0 cursor-pointer ${
                positionIndex === idx 
                  ? 'bg-red-500 scale-125' 
                  : 'bg-stone-300 hover:bg-stone-400'
              }`}
              title={`Posición ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Local helper piano intervals
const CHORD_INTERVALS_PIANO: Record<string, number[]> = {
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

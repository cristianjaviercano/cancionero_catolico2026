import React, { useMemo, useState } from 'react';
import { Music, AlertTriangle } from 'lucide-react';
import { ChordDiagram } from './ChordDiagram';
import { parseSongContent, formatChord, normalizeChordToAmerican, parseChord, isValidChordToken } from '../utils/musicTheory';
import guitarChords from '../data/guitarChords.json';

interface Song {
  id: string;
  title: string;
  type: string;
  content: string;
}

interface ChordGlossaryProps {
  songs: Song[];
  chordNotation: 'american' | 'latin';
}

export function ChordGlossary({ songs, chordNotation }: ChordGlossaryProps) {
  const [glossaryInstrument, setGlossaryInstrument] = useState<'guitar' | 'piano'>('guitar');
  const [viewFilter, setViewFilter] = useState<'all' | 'top12'>('all');

  // Extract all unique valid chords from all songs and count how many songs use each chord
  const { uniqueChords, chordSongCounts, top12Chords } = useMemo(() => {
    const chordsSet = new Set<string>();
    const counts: Record<string, number> = {};

    songs.forEach(song => {
      const songChords = new Set<string>();
      const lines = parseSongContent(song.content);
      lines.forEach(line => {
        line.forEach(word => {
          word.segments.forEach(segment => {
            if (segment.chord) {
              const tokens = segment.chord.split(/[\s,]+/);
              tokens.forEach(tok => {
                const clean = tok.trim().replace(/^[\(\[\{\s,]+|[\)\]\}\s,]+$/g, '');
                if (clean && isValidChordToken(clean)) {
                  const norm = normalizeChordToAmerican(clean);
                  chordsSet.add(norm);
                  songChords.add(norm);
                }
              });
            }
          });
        });
      });
      songChords.forEach(c => {
        counts[c] = (counts[c] || 0) + 1;
      });
    });
    
    // Sort in chromatic order (C, C#, D, D#, E, F, F#, G, G#, A, A#, B)
    const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    const sortedChromatic = Array.from(chordsSet).sort((a, b) => {
      const { root: rootA } = parseChord(a);
      const { root: rootB } = parseChord(b);
      const idxA = CHROMATIC.indexOf(rootA);
      const idxB = CHROMATIC.indexOf(rootB);
      if (idxA !== idxB) {
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
      }
      return a.length - b.length || a.localeCompare(b);
    });

    const sortedByFreq = Array.from(chordsSet)
      .sort((a, b) => (counts[b] || 0) - (counts[a] || 0))
      .slice(0, 12);

    return {
      uniqueChords: sortedChromatic,
      chordSongCounts: counts,
      top12Chords: sortedByFreq
    };
  }, [songs]);


  // Check if a guitar diagram configuration exists for this chord
  const hasGuitarDiagram = (chord: string) => {
    const norm = normalizeChordToAmerican(chord);
    const main = norm.split('/')[0];
    const { root, suffix } = parseChord(main);
    const simple = root + (suffix.startsWith('m') && !suffix.startsWith('maj') ? 'm' : '');
    return !!((guitarChords as Record<string, unknown>)[norm] || (guitarChords as Record<string, unknown>)[main] || (guitarChords as Record<string, unknown>)[simple]);
  };

  const totalFound = uniqueChords.filter(hasGuitarDiagram).length;

  return (
    <div className="card animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-8 gap-4">
        <div>
          <p className="misal-eyebrow"><span className="misal-eyebrow-icon" aria-hidden="true"><Music /></span>Harmonia Sacra</p>
          <h1 className="misal-title">Glosario de Acordes</h1>
          <p className="misal-desc">
            Este glosario escanea todas las {songs.length} canciones del repertorio y extrae los acordes utilizados.
            Actualmente tenemos gráficos para {totalFound} de los {uniqueChords.length} acordes detectados en guitarra (los teclados se calculan dinámicamente).
          </p>
        </div>

        {/* Instrument & Filter Switcher */}
        <div className="flex flex-wrap gap-2 items-center shrink-0 self-start">
          <div className="flex bg-stone-100 p-1 rounded-lg border border-stone-200 text-xs font-semibold">
            <button
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer border-none ${viewFilter === 'top12' ? 'bg-white text-red-600 shadow-sm font-bold' : 'bg-transparent text-stone-500 hover:text-stone-800'}`}
              onClick={() => setViewFilter('top12')}
            >
              ★ Los 12 Más Usados
            </button>
            <button
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer border-none ${viewFilter === 'all' ? 'bg-white text-red-600 shadow-sm font-bold' : 'bg-transparent text-stone-500 hover:text-stone-800'}`}
              onClick={() => setViewFilter('all')}
            >
              Todos ({uniqueChords.length})
            </button>
          </div>

          <div className="flex bg-stone-100 p-1 rounded-lg border border-stone-200 text-xs font-semibold">
            <button 
              className={`px-3.5 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 border-none ${glossaryInstrument === 'guitar' ? 'bg-white text-red-600 shadow-sm' : 'bg-transparent text-stone-500 hover:text-stone-800'}`}
              onClick={() => setGlossaryInstrument('guitar')}
            >
              <span>🎸</span> Guitarra
            </button>
            <button 
              className={`px-3.5 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 border-none ${glossaryInstrument === 'piano' ? 'bg-white text-red-600 shadow-sm' : 'bg-transparent text-stone-500 hover:text-stone-800'}`}
              onClick={() => setGlossaryInstrument('piano')}
            >
              <span>🎹</span> Teclado
            </button>
          </div>
        </div>
      </div>

      {/* Guía rápida de carácter armónico (Bono 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs">
          <span className="font-extrabold text-red-600 uppercase tracking-wider">Mayor (DO / SOL)</span>
          <p className="text-stone-600 m-0 mt-0.5">Sonido alegre y luminoso. Ideal para Entrada, Gloria y Aleluya.</p>
        </div>
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs">
          <span className="font-extrabold text-red-600 uppercase tracking-wider">Menor (lam / mim)</span>
          <p className="text-stone-600 m-0 mt-0.5">Sonido íntimo, de recogimiento y oración. Frecuente en Perdón y Cuaresma.</p>
        </div>
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs">
          <span className="font-extrabold text-red-600 uppercase tracking-wider">Séptima (RE7 / SI7)</span>
          <p className="text-stone-600 m-0 mt-0.5">Crea una tensión armónica que pide resolver al acorde siguiente.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {(viewFilter === 'top12' ? top12Chords : uniqueChords).map((chord, idx) => {
          const isPiano = glossaryInstrument === 'piano';
          const hasDiagram = isPiano || hasGuitarDiagram(chord);
          const count = chordSongCounts[chord] || 0;
          
          return (
            <div key={chord} className="flex flex-col items-center bg-stone-50 p-4 rounded-xl border border-stone-200 shadow-sm transition-transform hover:scale-[1.03] relative">
              {viewFilter === 'top12' && (
                <span className="absolute top-2.5 left-2.5 text-[10px] font-black text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                  #{idx + 1}
                </span>
              )}
              {hasDiagram ? (
                <div className="w-full flex justify-center">
                  <ChordDiagram 
                    chordName={chord} 
                    notation={chordNotation} 
                    instrument={glossaryInstrument} 
                    width={isPiano ? 70 : 80} 
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-between w-full h-full min-h-[140px]">
                  <h3 className="text-xs font-bold font-mono text-stone-600 mb-1.5 uppercase tracking-wider">{formatChord(chord, chordNotation)}</h3>
                  <div className="w-[80px] h-[95px] bg-stone-150 rounded-lg flex flex-col items-center justify-center text-stone-400 text-center p-2 border border-stone-300 border-dashed">
                    <AlertTriangle size={20} className="mb-1 opacity-50" />
                    <span className="text-[9px] leading-tight">No disponible</span>
                  </div>
                </div>
              )}
              <span className="mt-2 text-[10px] font-semibold text-stone-500 bg-white border border-stone-200 px-2 py-0.5 rounded-full">
                en {count} {count === 1 ? 'canto' : 'cantos'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

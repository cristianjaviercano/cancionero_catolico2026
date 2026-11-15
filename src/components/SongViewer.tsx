import React, { useState, useMemo, useEffect, useRef, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { parseSongContent, transposeChord, formatChord, getChordMidi, getChordNotes, transposeSongContent, detectSongKey } from '../utils/musicTheory';
import { 
  Minus, Plus, Music, Edit3, Type, FileText, Play, Pause, X, Settings2, 
  ChevronDown, Printer, Share2, Copy, Check, QrCode, Sparkles, BookOpen, Save 
} from 'lucide-react';
import { ChordDiagram } from './ChordDiagram';
import { ChordPopover } from './ChordPopover';
import { auth } from '../firebase';
import { useSongs } from '../hooks/useSongs';
import { globalAudio } from '../utils/audioEngine';

const AccompanimentPanel = lazy(() =>
  import('./acompanamiento/AccompanimentPanel').then(m => ({ default: m.AccompanimentPanel }))
);

interface SongViewerProps {
  id?: string;
  title: string;
  artist?: string;
  content: string;
  type?: string;
  onEdit?: () => void;
  onPlay?: () => void;
  notation?: 'american' | 'latin';
  isPublic?: boolean;
  userId?: string;
  userDisplayName?: string;
  author?: string;
  key?: string;
  // React no entrega la prop `key` al componente; el tono llega por songKey
  songKey?: string;
  externalLink?: string;
  transpose?: number;
  onTransposeChange?: (t: number) => void;
  fontSize?: number;
  onFontSizeChange?: (size: number) => void;
  hidePracticeStudio?: boolean;
  sheetMusic?: string;
}

const MEDITATION_QUOTES = [
  "El que canta ora dos veces. — San Agustín",
  "La nota más importante para Dios es el silencio.",
  "Canten al Señor un cántico nuevo, canten al Señor toda la tierra. — Salmo 95",
  "Cantar es propio del que ama. — San Agustín",
  "La música es la copa que contiene el vino del silencio. — Robert Fripp",
  "Donde las palabras fallan, la música habla. — Hans Christian Andersen"
];

// Tonos para la letra. El color exacto de cada uno está en index.css ([data-lyric-tone]),
// con una versión para fondo claro y otra para Vigilia.
const LYRIC_TONES = [
  { id: 'auto', label: 'Automático' },
  { id: 'azul', label: 'Azul' },
  { id: 'verde', label: 'Verde' },
  { id: 'morado', label: 'Morado' },
  { id: 'dorado', label: 'Dorado' },
  { id: 'gris', label: 'Gris suave' },
] as const;
type LyricTone = typeof LYRIC_TONES[number]['id'];

export function SongViewer({ 
  id,
  title, 
  artist, 
  content, 
  type, 
  onEdit, 
  onPlay,
  notation = 'american',
  isPublic,
  userId,
  userDisplayName,
  author,
  songKey: key,
  externalLink,
  transpose: controlledTranspose,
  onTransposeChange,
  fontSize: controlledFontSize,
  onFontSizeChange,
  hidePracticeStudio = false,
  sheetMusic
}: SongViewerProps) {
  const [internalTranspose, setInternalTranspose] = useState(0);
  const transpose = controlledTranspose !== undefined ? controlledTranspose : internalTranspose;
  
  const [columns, setColumns] = useState<1 | 2>(1);

  const [diagramInstrument, setDiagramInstrument] = useState<'guitar' | 'piano' | 'none'>('guitar');
  // Bottom-sheet state
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isAccompOpen, setIsAccompOpen] = useState(false);
  // Mobile options panel state
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  // ── Print & Share Modal States ──
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printTarget, setPrintTarget] = useState<'musician' | 'congregation'>('musician');
  const [printLayout, setPrintLayout] = useState<'portrait-1' | 'portrait-2' | 'portrait-3' | 'landscape-2'>('portrait-2');
  const [printChords, setPrintChords] = useState<'none' | 'guitar' | 'piano'>('none');
  const [printTitle, setPrintTitle] = useState(title);
  const [printSubtitle, setPrintSubtitle] = useState(type || '');
  const [printAuthor, setPrintAuthor] = useState(author || artist || '');
  const [printKey, setPrintKey] = useState(key || '');
  const [printGroup, setPrintGroup] = useState('');
  const [printDate, setPrintDate] = useState('');
  const [printQuote, setPrintQuote] = useState('');
  const [copiedLyrics, setCopiedLyrics] = useState(false);
  const [copiedChords, setCopiedChords] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Font size state persisted in localStorage
  const [internalFontSize, setInternalFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('songViewerFontSize');
    return saved ? parseInt(saved, 10) : 18;
  });
  const fontSize = controlledFontSize !== undefined ? controlledFontSize : internalFontSize;

  useEffect(() => {
    setPrintTitle(title);
    setPrintSubtitle(type || '');
    setPrintAuthor(author || artist || '');
    setPrintKey(key || '');
  }, [title, type, author, artist, key]);

  // Color de la letra: preferencia del músico, guardada en este dispositivo
  const [lyricTone, setLyricTone] = useState<LyricTone>(() => {
    const saved = localStorage.getItem('songViewerLyricTone');
    return LYRIC_TONES.some(t => t.id === saved) ? (saved as LyricTone) : 'auto';
  });
  const [isToneMenuOpen, setIsToneMenuOpen] = useState(false);
  const toneMenuRef = useRef<HTMLDivElement>(null);

  const handleLyricToneChange = (tone: LyricTone) => {
    setLyricTone(tone);
    localStorage.setItem('songViewerLyricTone', tone);
    setIsToneMenuOpen(false);
  };

  // Cerrar el desplegable de color al tocar fuera o con Escape
  useEffect(() => {
    if (!isToneMenuOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (toneMenuRef.current && !toneMenuRef.current.contains(e.target as Node)) {
        setIsToneMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsToneMenuOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isToneMenuOpen]);

  const handleFontSizeChange = (newSize: number) => {
    if (onFontSizeChange) {
      onFontSizeChange(newSize);
    } else {
      setInternalFontSize(newSize);
      localStorage.setItem('songViewerFontSize', newSize.toString());
    }
  };

  // Parse song content into lines of segments
  const lines = useMemo(() => parseSongContent(content), [content]);

  const handleTransposeUp = () => {
    if (onTransposeChange) {
      onTransposeChange(transpose + 1);
    } else {
      setInternalTranspose(t => t + 1);
    }
  };
  const handleTransposeDown = () => {
    if (onTransposeChange) {
      onTransposeChange(transpose - 1);
    } else {
      setInternalTranspose(t => t - 1);
    }
  };
  const handleReset = () => {
    if (onTransposeChange) {
      onTransposeChange(0);
    } else {
      setInternalTranspose(0);
    }
  };

  const [isPlayingBeat, setIsPlayingBeat] = useState(false);
  const [bpm, setBpm] = useState(80);
  const [beatType, setBeatType] = useState<'none' | 'balada' | 'vals' | 'pop'>('none');
  const [currentBeatCount, setCurrentBeatCount] = useState(1);
  const [maxBeatCount, setMaxBeatCount] = useState(4);

  // Stop background audio on cleanup
  useEffect(() => {
    return () => {
      globalAudio.stop();
    };
  }, []);

  const handleBeatTypeChange = (type: 'none' | 'balada' | 'vals' | 'pop') => {
    setBeatType(type);
    const max = type === 'vals' ? 3 : 4;
    setMaxBeatCount(max);
    if (isPlayingBeat) {
      globalAudio.setBeatType(type);
    }
  };

  const handleBpmChange = (newBpm: number) => {
    setBpm(newBpm);
    if (isPlayingBeat) {
      globalAudio.setBpm(newBpm);
    }
  };

  const togglePlayBeat = () => {
    if (isPlayingBeat) {
      globalAudio.stop();
      setIsPlayingBeat(false);
      setCurrentBeatCount(1);
    } else {
      setIsPlayingBeat(true);
      globalAudio.start(beatType, bpm, (step, total) => {
        setCurrentBeatCount(step);
        setMaxBeatCount(total);
      });
    }
  };

  const playChordAudio = (chord: string) => {
    const isPianoMode = diagramInstrument === 'piano';
    const midi = getChordMidi(chord, isPianoMode ? 'piano' : 'guitar');
    globalAudio.playChord(midi, isPianoMode ? 'pad' : 'pluck');
  };

  const uniqueChords = useMemo(() => {
    const chords = new Set<string>();
    lines.forEach(line => {
      line.forEach(word => {
        word.segments.forEach(segment => {
          if (segment.chord) {
            const actualChord = transpose !== 0 ? transposeChord(segment.chord, transpose) : segment.chord;
            chords.add(actualChord);
          }
        });
      });
    });
    return Array.from(chords);
  }, [lines, transpose]);

  const currentUser = auth.currentUser;
  const isEditable = !userId || (currentUser && userId === currentUser.uid);

  const hasStudio = !hidePracticeStudio && uniqueChords.length > 0;

  const { saveSong } = useSongs();
  // Chord Popover (nube flotante) state
  const [activeChordPopover, setActiveChordPopover] = useState<{ chord: string; rect: DOMRect } | null>(null);
  const [savedKeyToast, setSavedKeyToast] = useState(false);

  // Autoscroll States for SongViewer
  const [isViewerScrollActive, setIsViewerScrollActive] = useState(false);
  const [viewerScrollSpeed, setViewerScrollSpeed] = useState<number>(() => {
    const saved = localStorage.getItem('songViewerScrollSpeed');
    return saved ? parseFloat(saved) : 1.0;
  });

  const handleSaveTransposedKey = async () => {
    if (!id || transpose === 0) return;
    const newContent = transposeSongContent(content, transpose);
    const currentKey = key || detectSongKey(content) || '';
    const newKey = currentKey ? transposeChord(currentKey, transpose) : '';
    
    if (window.confirm(`¿Deseas guardar permanentemente este tono (${transpose > 0 ? '+' : ''}${transpose} semitonos) en la canción? Así todo el coro verá los acordes que ensayaron.`)) {
      await saveSong({
        id,
        title,
        type: type || 'Entrada',
        content: newContent,
        author,
        key: newKey || undefined,
        externalLink,
        isPublic,
        userId,
        userDisplayName,
        sheetMusic
      });
      handleReset();
      setSavedKeyToast(true);
      setTimeout(() => setSavedKeyToast(false), 4000);
    }
  };

  // Autoscroll loop for individual SongViewer
  useEffect(() => {
    if (!isViewerScrollActive) return;

    let lastTime = performance.now();
    let frameId: number;
    const baseSpeed = 0.025 * viewerScrollSpeed;

    const scrollLoop = (now: number) => {
      const delta = now - lastTime;
      lastTime = now;
      window.scrollBy({ top: baseSpeed * delta, behavior: 'auto' });
      frameId = requestAnimationFrame(scrollLoop);
    };

    frameId = requestAnimationFrame(scrollLoop);
    return () => cancelAnimationFrame(frameId);
  }, [isViewerScrollActive, viewerScrollSpeed]);

  const playChordSound = (chordName: string) => {
    try {
      const { notes } = getChordNotes(chordName);
      if (!notes || notes.length === 0) return;
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      
      const baseFreqs: Record<string, number> = {
        'C': 261.63, 'C#': 277.18, 'Db': 277.18, 'D': 293.66, 'D#': 311.13, 'Eb': 311.13,
        'E': 329.63, 'F': 349.23, 'F#': 369.99, 'Gb': 369.99, 'G': 392.00, 'G#': 415.30,
        'Ab': 415.30, 'A': 440.00, 'A#': 466.16, 'Bb': 466.16, 'B': 493.88
      };

      notes.forEach((n: string, idx: number) => {
        const freq = baseFreqs[n] || 440;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + (idx * 0.08));
        osc.stop(ctx.currentTime + 1.4);
      });
    } catch (e) {
      console.error("Audio Context error:", e);
    }
  };

  // Trigger browser print
  const handlePrintSong = () => {
    const songPdfName = (printTitle.trim() || title || 'Cancion').replace(/[\s/\\:]+/g, '_');
    const originalTitle = document.title;
    document.title = songPdfName;
    setTimeout(() => {
      window.print();
      document.title = originalTitle;
    }, 100);
  };

  // Plain text lyrics generator (without chords)
  const plainLyricsText = useMemo(() => {
    return lines.map(line => {
      return line.map(word => word.segments.map(s => s.lyric || '').join('')).join('');
    }).join('\n');
  }, [lines]);

  // Formatted chords & lyrics generator for sharing
  const formattedChordsText = useMemo(() => {
    return lines.map(line => {
      return line.map(word => {
        return word.segments.map(seg => {
          const chordStr = seg.chord ? `[${formatChord(transpose !== 0 ? transposeChord(seg.chord, transpose) : seg.chord, notation)}]` : '';
          return chordStr + (seg.lyric || '');
        }).join('');
      }).join('');
    }).join('\n');
  }, [lines, transpose, notation]);

  return (
    <div className="card" style={{ overflow: 'hidden', position: 'relative' }}>
      {/* ── Header: Title + action buttons ── */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1 flex-wrap">
            {id && (
              <span className="song-num-badge">
                #{String(id).padStart(3, '0')}
              </span>
            )}
            <h1 className="m-0 text-xl md:text-2xl" style={{ lineHeight: 1.3 }}>{title}</h1>
            {type && <span className="badge">{type}</span>}
            {userId && (
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${isPublic ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm' : 'bg-amber-50 text-amber-600 border border-amber-200 shadow-sm'}`}>
                {isPublic ? 'Público' : 'Privado'}
              </span>
            )}
          </div>
          {artist && <p className="text-secondary text-sm">{artist}</p>}
          {author && <p className="text-stone-500 text-sm font-medium">Autor: {author}</p>}
          {key && (
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mt-0.5">
              🎵 Tono original: <span className="text-red-500">{key}</span>
            </p>
          )}
        </div>

        {/* Action icons row */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Print & Share Button */}
          <button 
            className="btn btn-icon bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 shadow-sm transition-all"
            onClick={() => setShowPrintModal(true)}
            title="Imprimir / Guardar PDF / Compartir"
          >
            <Printer size={17} />
          </button>

          <button 
            className="btn btn-icon bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 shadow-sm transition-all"
            onClick={() => setShowPrintModal(true)}
            title="Compartir canción"
          >
            <Share2 size={17} />
          </button>

          {externalLink && (
            <a 
              href={externalLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-icon bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 shadow-sm transition-all"
              title="Ver Demostración (Video/Audio)"
            >
              🎵
            </a>
          )}
          {sheetMusic && id && (
            <Link
              to={`/partituras/${id}`}
              className="btn btn-icon bg-stone-800 hover:bg-stone-900 border border-stone-700 text-white shadow-sm transition-all"
              title="Ver Partitura (PDF)"
            >
              <FileText size={16} />
            </Link>
          )}
          {onEdit && isEditable && (
            <button className="btn btn-icon text-stone-500 hover:text-red-500 hover:bg-red-50" onClick={onEdit} title="Editar Canción">
              <Edit3 size={18} />
            </button>
          )}
          {onPlay && (
            <button className="btn btn-icon text-stone-500 hover:text-emerald-500 hover:bg-emerald-50" onClick={onPlay} title="Tocar en Modo Ejecución">
              <Play size={18} />
            </button>
          )}
        </div>
      </div>

      {/* ── Compact Toolbar ── */}
      <div 
        className="flex flex-wrap items-center gap-2 mb-6 pb-5"
        style={{ borderBottom: '1px solid #e7e5e4' }}
      >
        {/* ⚙ Options button (mobile only) */}
        <button
          className={`btn flex items-center gap-1.5 sm:hidden shadow-sm ${isOptionsOpen ? 'bg-stone-800 text-white border border-stone-700' : 'bg-stone-50 text-stone-700 border border-stone-200 hover:bg-stone-100'}`}
          onClick={() => setIsOptionsOpen(!isOptionsOpen)}
        >
          <Settings2 size={16} />
          <span className="font-semibold text-sm">Opciones</span>
          <ChevronDown size={14} style={{ transform: isOptionsOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
        </button>

        {/* Controls — always visible on sm+, shown in dropdown on mobile */}
        <div className={`${isOptionsOpen ? 'flex' : 'hidden'} sm:flex flex-wrap items-center gap-2 w-full sm:w-auto`}>
          {/* Transpose */}
          <div className="flex items-center gap-1.5 bg-stone-50 px-2 py-1.5 rounded-lg border border-stone-200 shadow-sm">
            <button className="btn btn-icon" style={{ padding: '4px' }} onClick={handleTransposeDown} title="Bajar">
              <Minus size={15} />
            </button>
            <div className="flex flex-col items-center min-w-[3.5rem]">
              <span className="text-[9px] font-bold text-stone-400 uppercase">Transponer</span>
              <span className="font-mono font-bold text-stone-800 text-sm">
                {transpose > 0 ? `+${transpose}` : transpose}
              </span>
            </div>
            <button className="btn btn-icon" style={{ padding: '4px' }} onClick={handleTransposeUp} title="Subir">
              <Plus size={15} />
            </button>
            {transpose !== 0 && (
              <div className="flex items-center gap-1">
                <button className="btn text-xs px-2 py-0.5 ml-0.5" onClick={handleReset} style={{ fontSize: '10px' }}>
                  Reset
                </button>
                {id && (
                  <button 
                    className="btn bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs px-2 py-0.5 font-semibold rounded-md flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                    onClick={handleSaveTransposedKey}
                    title="Guardar permanentemente este tono en la canción para todo el equipo"
                  >
                    <Save size={12} className="text-amber-600" />
                    <span>Guardar Tono</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Font size */}
          <div className="flex items-center gap-1.5 bg-stone-50 px-2 py-1.5 rounded-lg border border-stone-200 shadow-sm">
            <button className="btn btn-icon" style={{ padding: '4px' }} onClick={() => handleFontSizeChange(Math.max(12, fontSize - 2))} title="Reducir letra">
              <Minus size={15} />
            </button>
            <div className="flex flex-col items-center min-w-[2.5rem]">
              <span className="text-[9px] font-bold text-stone-400 uppercase flex items-center gap-0.5">
                <Type size={9} /> Letra
              </span>
              <span className="font-bold text-stone-800 text-sm">{fontSize}px</span>
            </div>
            <button className="btn btn-icon" style={{ padding: '4px' }} onClick={() => handleFontSizeChange(Math.min(36, fontSize + 2))} title="Aumentar letra">
              <Plus size={15} />
            </button>

            {/* Color de la letra */}
            <div className="relative pl-1.5 border-l border-stone-200" ref={toneMenuRef}>
              <button
                type="button"
                className="btn btn-icon flex items-center gap-1"
                style={{ padding: '4px 6px', borderRadius: '8px' }}
                onClick={() => setIsToneMenuOpen(open => !open)}
                title="Color de la letra"
                aria-label="Color de la letra"
                aria-haspopup="menu"
                aria-expanded={isToneMenuOpen}
              >
                <span className="lyric-swatch" data-lyric-tone={lyricTone === 'auto' ? undefined : lyricTone} />
                <ChevronDown size={12} style={{ transform: isToneMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
              </button>
              {isToneMenuOpen && (
                <div
                  role="menu"
                  aria-label="Color de la letra"
                  className="absolute left-0 top-full mt-2 z-30 w-44 bg-white border border-stone-200 rounded-lg shadow-lg p-1"
                >
                  <p className="text-[9px] font-bold text-stone-400 uppercase px-2 pt-1 pb-0.5 m-0">Color de la letra</p>
                  {LYRIC_TONES.map(tone => (
                    <button
                      key={tone.id}
                      type="button"
                      role="menuitemradio"
                      aria-checked={lyricTone === tone.id}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-stone-700 hover:bg-stone-100 cursor-pointer text-left"
                      onClick={() => handleLyricToneChange(tone.id)}
                    >
                      <span className="lyric-swatch" data-lyric-tone={tone.id === 'auto' ? undefined : tone.id} />
                      <span className="flex-1">{tone.label}</span>
                      {lyricTone === tone.id && <Check size={14} className="text-red-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Columns */}
          <div className="flex items-center gap-1 bg-stone-50 px-1.5 py-1 rounded-lg border border-stone-200 shadow-sm">
            <button 
              className={`px-2.5 py-1 text-xs font-bold rounded transition-colors ${columns === 1 ? 'bg-white text-red-600 shadow-sm border border-stone-200' : 'text-stone-500 hover:text-stone-800'}`}
              onClick={() => setColumns(1)}
            >1 Col</button>
            <button 
              className={`px-2.5 py-1 text-xs font-bold rounded transition-colors ${columns === 2 ? 'bg-white text-red-600 shadow-sm border border-stone-200' : 'text-stone-500 hover:text-stone-800'}`}
              onClick={() => setColumns(2)}
            >2 Col</button>
          </div>

          {/* Autoscroll Controls */}
          <div className="flex items-center gap-1 bg-stone-50 px-2 py-1 rounded-lg border border-stone-200 shadow-sm text-xs">
            <button
              onClick={() => setIsViewerScrollActive(prev => !prev)}
              className={`flex items-center gap-1 px-2 py-1 rounded font-bold transition-colors cursor-pointer ${
                isViewerScrollActive 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-stone-200/80 text-stone-600 hover:bg-stone-200'
              }`}
              title={isViewerScrollActive ? "Pausar Scroll" : "Iniciar Scroll Automático"}
            >
              {isViewerScrollActive ? <Pause size={12} /> : <Play size={12} />}
              <span>Scroll</span>
            </button>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setViewerScrollSpeed(s => Math.max(0.25, Number((s - 0.25).toFixed(2))))}
                className="p-1 text-stone-500 hover:text-stone-800 rounded cursor-pointer"
                title="Más lento"
              >
                <Minus size={11} />
              </button>
              <span className="font-mono text-[11px] font-bold text-stone-700 min-w-[28px] text-center">
                {viewerScrollSpeed}x
              </span>
              <button
                onClick={() => setViewerScrollSpeed(s => Math.min(3.0, Number((s + 0.25).toFixed(2))))}
                className="p-1 text-stone-500 hover:text-stone-800 rounded cursor-pointer"
                title="Más rápido"
              >
                <Plus size={11} />
              </button>
            </div>
          </div>

          {/* Direct Print Button in Toolbar */}
          <button 
            className="btn flex items-center gap-1.5 bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all"
            onClick={() => setShowPrintModal(true)}
            title="Imprimir / Exportar PDF / Compartir"
          >
            <Printer size={14} className="text-red-500" />
            <span>Imprimir / Compartir</span>
          </button>
        </div>

        {/* Acompañamiento: teclado PSR-E383, guitarra, piano y partitura */}
        {uniqueChords.length > 0 && (
          <button
            className={`btn flex items-center gap-2 shadow-sm transition-colors flex-shrink-0 ${hasStudio ? '' : 'ml-auto'} bg-stone-50 text-stone-700 border border-stone-200 hover:bg-stone-100`}
            onClick={() => setIsAccompOpen(true)}
            title="Ritmo, estilo del teclado, rasgueo, tablatura y partitura"
          >
            <Sparkles size={16} className="text-red-500" />
            <span className="font-semibold text-sm">Acompañar</span>
          </button>
        )}

        {/* Estudio Musical button — always visible */}
        {hasStudio && (
          <button 
            className={`btn flex items-center gap-2 shadow-sm transition-colors ml-auto flex-shrink-0 ${
              isStudioOpen ? 'bg-red-600 text-white border border-red-700 shadow-red-200' : 'bg-stone-50 text-stone-700 border border-stone-200 hover:bg-stone-100'
            }`}
            onClick={() => setIsStudioOpen(!isStudioOpen)}
            title="Abrir Estudio Musical"
          >
            <Music size={16} />
            <span className="font-semibold text-sm">
              {isStudioOpen ? 'Cerrar Estudio' : 'Estudio Musical'}
            </span>
            {isPlayingBeat && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        )}
      </div>

      {/* ── Saved Key Toast ── */}
      {savedKeyToast && (
        <div className="mb-4 bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Check size={16} className="text-emerald-600" />
            <span>¡Tono guardado y actualizado con éxito en la canción para todo el equipo!</span>
          </div>
          <button onClick={() => setSavedKeyToast(false)} className="text-emerald-700 hover:text-emerald-900 font-bold cursor-pointer">✕</button>
        </div>
      )}

      {/* ── Song Content ── */}
      <div 
        className="song-content font-sans bg-white rounded-xl overflow-x-auto"
        data-lyric-tone={lyricTone === 'auto' ? undefined : lyricTone}
        style={{ columnCount: columns, columnGap: '3rem' }}
      >
        {lines.map((line, lineIndex) => (
          <div key={lineIndex} className="song-line">
            {line.length === 0 ? (
              <br />
            ) : (
              line.map((word, wordIndex) => (
                <span key={wordIndex} className="song-word">
                  {word.segments.map((segment, segmentIndex) => (
                    <span key={segmentIndex} className="song-segment">
                      {segment.chord ? (
                        <span 
                          className="chord cursor-pointer hover:underline transition-opacity hover:opacity-80"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (segment.chord) {
                              const activeName = transpose !== 0 ? transposeChord(segment.chord, transpose) : segment.chord;
                              const rect = e.currentTarget.getBoundingClientRect();
                              setActiveChordPopover({ chord: activeName, rect });
                              playChordSound(activeName);
                            }
                          }}
                          style={{ 
                            fontSize: `${fontSize - 2}px`, 
                            height: `${fontSize - 2}px`,
                            lineHeight: `${fontSize - 2}px`
                          }}
                          title="Haz clic para ver gráfico y escuchar acorde"
                        >
                          {formatChord(transpose !== 0 ? transposeChord(segment.chord, transpose) : segment.chord, notation)}
                        </span>
                      ) : (
                        <span 
                          className="chord-placeholder"
                          style={{ 
                            fontSize: `${fontSize - 2}px`, 
                            height: `${fontSize - 2}px`,
                            lineHeight: `${fontSize - 2}px`
                          }}
                        >
                          &nbsp;
                        </span>
                      )}
                      <span 
                        className="lyric"
                        style={{ fontSize: `${fontSize}px` }}
                      >
                        {segment.lyric || '\u00A0'}
                      </span>
                    </span>
                  ))}
                </span>
              ))
            )}
            {line.length === 1 && line[0].segments.length === 1 && line[0].segments[0].lyric.trim() === '' && !line[0].segments[0].chord && <br />}
          </div>
        ))}
      </div>

      {/* ── MODAL DE IMPRESIÓN Y COMPARTIR CANCIÓN (INDIVIDUAL) ── */}
      {showPrintModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowPrintModal(false)}
        >
          <div 
            className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 animate-in zoom-in-95 duration-150 text-stone-800"
            onClick={e => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="flex justify-between items-center pb-3 mb-5 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                  <Printer size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-stone-900 m-0">Imprimir y Compartir Canción</h3>
                  <p className="text-xs text-stone-500 m-0">Genera hojas de música profesionales o folletos de letra para la asamblea.</p>
                </div>
              </div>
              <button 
                className="btn btn-icon text-stone-400 hover:text-stone-700" 
                onClick={() => setShowPrintModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Opciones de Impresión */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase">Destinatario de la Hoja</label>
                <select
                  className="bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-red-500 cursor-pointer font-medium"
                  value={printTarget}
                  onChange={e => setPrintTarget(e.target.value as 'musician' | 'congregation')}
                >
                  <option value="musician">🎸 Para Músicos / Coro (Con Acordes)</option>
                  <option value="congregation">👥 Para la Asamblea / Fieles (Solo Letra)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase">Distribución de Columnas</label>
                <select
                  className="bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-red-500 cursor-pointer font-medium"
                  value={printLayout}
                  onChange={e => setPrintLayout(e.target.value as 'portrait-1' | 'portrait-2' | 'portrait-3' | 'landscape-2')}
                >
                  <option value="portrait-2">📄 2 Columnas (Ahorro de papel / 1 Hoja)</option>
                  <option value="portrait-1">📄 1 Columna (Vertical estándar)</option>
                  <option value="portrait-3">📄 3 Columnas (Compacto)</option>
                  <option value="landscape-2">📖 Horizontal Díptico (2 Columnas)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase">
                  {printTarget === 'congregation' ? 'Diagramas (Desactivados en solo letra)' : 'Diagramas de Acordes al Pie'}
                </label>
                <select
                  className="bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-red-500 cursor-pointer font-medium disabled:opacity-50"
                  value={printTarget === 'congregation' ? 'none' : printChords}
                  onChange={e => setPrintChords(e.target.value as 'none' | 'guitar' | 'piano')}
                  disabled={printTarget === 'congregation'}
                >
                  <option value="none">No incluir diagramas</option>
                  <option value="guitar">🎸 Diagramas de Guitarra</option>
                  <option value="piano">🎹 Diagramas de Teclado</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase">Tonalidad a Imprimir</label>
                <input 
                  type="text" 
                  className="bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-red-500"
                  value={printKey}
                  onChange={e => setPrintKey(e.target.value)}
                  placeholder="Ej: Re Mayor / D (Transp: +1)"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase">Autor / Compositor</label>
                <input 
                  type="text" 
                  className="bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-red-500"
                  value={printAuthor}
                  onChange={e => setPrintAuthor(e.target.value)}
                  placeholder="Ej: Cesáreo Gabaráin"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase">Parroquia / Coro / Fecha (Opcional)</label>
                <input 
                  type="text" 
                  className="bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-red-500"
                  value={printGroup}
                  onChange={e => setPrintGroup(e.target.value)}
                  placeholder="Ej: Coro San Juan Bautista"
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-stone-600 uppercase flex justify-between items-center">
                  <span>Frase de Meditación (Pie de página)</span>
                  <select
                    className="bg-transparent text-xs text-red-500 border-none outline-none font-semibold cursor-pointer max-w-[140px] truncate"
                    onChange={e => {
                      if (e.target.value) setPrintQuote(e.target.value);
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>Sugerir frase...</option>
                    {MEDITATION_QUOTES.map((q, idx) => (
                      <option key={idx} value={q}>{q}</option>
                    ))}
                  </select>
                </label>
                <input 
                  type="text" 
                  className="bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-red-500"
                  value={printQuote}
                  onChange={e => setPrintQuote(e.target.value)}
                  placeholder="Ej: El que canta ora dos veces. — San Agustín"
                />
              </div>
            </div>

            {/* Botón Principal de Impresión */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div>
                <h4 className="font-bold text-sm text-red-900 m-0">¿Listo para imprimir o guardar como PDF?</h4>
                <p className="text-xs text-red-700 m-0">
                  {printTarget === 'musician' 
                    ? `Se imprimirá con acordes en formato ${printLayout.includes('2') ? '2 Columnas' : '1 Columna'}.`
                    : `Se imprimirá solo la letra limpia para la asamblea.`
                  }
                </p>
              </div>
              <button 
                type="button"
                className="btn btn-primary font-bold px-5 py-2.5 shadow-md flex items-center gap-2 whitespace-nowrap"
                onClick={handlePrintSong}
              >
                <Printer size={18} /> Imprimir / PDF
              </button>
            </div>

            {/* ── SECCIÓN COMPARTIR POR WHATSAPP, PORTAPAPELES Y QR ── */}
            <h4 className="font-bold text-xs text-stone-500 uppercase tracking-wider mb-3">
              📱 Opciones Rápidas de Compartir con el Coro
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              {/* Compartir por WhatsApp */}
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `✨ *${title}* ${type ? `(${type})` : ''}\n` +
                  (key || printKey ? `🎵 Tono: ${printKey || key}\n\n` : '\n') +
                  (printTarget === 'congregation' ? plainLyricsText : formattedChordsText) +
                  `\n\n📖 Cancionero Digital: ${window.location.href}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 text-xs flex items-center justify-center gap-1.5 rounded-lg shadow-sm"
              >
                <span>💬</span> WhatsApp
              </a>

              {/* Copiar Solo Letra */}
              <button
                type="button"
                className="btn bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-2 px-3 text-xs flex items-center justify-center gap-1.5 rounded-lg border border-stone-200"
                onClick={() => {
                  navigator.clipboard.writeText(plainLyricsText);
                  setCopiedLyrics(true);
                  setTimeout(() => setCopiedLyrics(false), 2000);
                }}
              >
                {copiedLyrics ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                {copiedLyrics ? '¡Copiado!' : 'Copiar Solo Letra'}
              </button>

              {/* Copiar con Acordes */}
              <button
                type="button"
                className="btn bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-2 px-3 text-xs flex items-center justify-center gap-1.5 rounded-lg border border-stone-200"
                onClick={() => {
                  navigator.clipboard.writeText(formattedChordsText);
                  setCopiedChords(true);
                  setTimeout(() => setCopiedChords(false), 2000);
                }}
              >
                {copiedChords ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                {copiedChords ? '¡Copiado!' : 'Copiar con Acordes'}
              </button>
            </div>

            {/* Código QR Compartir */}
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 flex items-center gap-4">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(window.location.href)}`} 
                alt="Código QR de la Canción" 
                className="w-16 h-16 rounded-lg border border-stone-300 bg-white p-1"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-stone-800 m-0">Código QR del Canto</p>
                <p className="text-[11px] text-stone-500 m-0 mb-1.5">Permite a otros músicos escanear y abrir esta canción en su pantalla.</p>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={window.location.href} 
                    className="bg-white border border-stone-200 rounded px-2 py-1 text-[11px] text-stone-600 font-mono flex-1 truncate"
                  />
                  <button 
                    type="button" 
                    className="btn btn-primary text-xs px-2.5 py-1"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                  >
                    {copiedLink ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- ZONA DE IMPRESIÓN (OCULTA EN PANTALLA) -------------------- */}
      <div className={`hidden print:block absolute top-0 left-0 w-full bg-white text-black z-[9999] p-0 m-0 font-sans print-target-${printTarget} print-layout-${printLayout}`}>
        {/* Cabecera de Impresión */}
        {printTarget === 'congregation' ? (
          <div className="print-header print-header-compact border-b border-stone-400 pb-1.5 mb-3 flex justify-between items-center flex-wrap gap-2 text-stone-900 font-sans">
            <h1 className="print-header-title text-base font-serif font-bold uppercase tracking-wide m-0">
              {printTitle.trim() || title}
            </h1>
            <div className="print-header-info-compact text-[10px] text-stone-500 font-medium">
              {type && <span>{type}</span>}
              {printAuthor && <span> • {printAuthor}</span>}
              {printGroup && <span> • {printGroup}</span>}
            </div>
          </div>
        ) : (
          <div className="print-header text-center mb-6 pb-4 border-b-2 border-stone-800">
            <div className="inline-block uppercase tracking-wider text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded mb-2">
              {type || 'Canto Litúrgico'}
            </div>
            <h1 className="print-header-title text-3xl font-serif font-bold uppercase tracking-wide text-stone-900 mb-2">
              {printTitle.trim() || title}
            </h1>
            <div className="print-header-info grid grid-cols-3 text-xs text-stone-600 gap-2 font-medium">
              <div>
                <span className="font-bold text-stone-800 uppercase block text-[9px] tracking-wider text-stone-400 mb-0.5">Tono</span>
                {printKey || key || 'N/A'} {transpose !== 0 ? `(Transp: ${transpose > 0 ? `+${transpose}` : transpose})` : ''}
              </div>
              <div>
                <span className="font-bold text-stone-800 uppercase block text-[9px] tracking-wider text-stone-400 mb-0.5">Autor / Compositor</span>
                {printAuthor || 'Tradicional'}
              </div>
              <div>
                <span className="font-bold text-stone-800 uppercase block text-[9px] tracking-wider text-stone-400 mb-0.5">Ministerio de Música</span>
                {printGroup || 'Coro Parroquial'}
              </div>
            </div>
          </div>
        )}

        {/* Contenido de la Canción Impresa */}
        <div className="print-songs-container">
          <div className="song-block mb-6 break-inside-avoid">
            <div className="font-sans text-sm leading-snug song-lyrics-container">
              {printTarget === 'congregation' ? (
                lines.map((line, lineIndex) => {
                  const lineText = line.map(w => w.segments.map(s => s.lyric || '').join('')).join('');
                  return lineText.trim() === '' ? (
                    <div key={lineIndex} className="song-line-empty">&nbsp;</div>
                  ) : (
                    <div key={lineIndex} className="song-line-plain">
                      {lineText}
                    </div>
                  );
                })
              ) : (
                lines.map((line, lineIndex) => (
                  <div key={lineIndex} className="song-line flex flex-wrap min-h-[1.2rem]">
                    {line.length === 0 ? (
                      <div className="song-line-empty">&nbsp;</div>
                    ) : (
                      line.map((word, wordIndex) => (
                        <div key={wordIndex} className="song-word">
                          {word.segments.map((segment, segmentIndex) => (
                            <div key={segmentIndex} className="song-segment">
                              {segment.chord ? (
                                <span className="chord text-red-600 font-bold">
                                  {formatChord(transpose !== 0 ? transposeChord(segment.chord, transpose) : segment.chord, notation)}
                                </span>
                              ) : (
                                <span className="chord-placeholder">&nbsp;</span>
                              )}
                              <span className="lyric whitespace-pre">{segment.lyric || '\u00A0'}</span>
                            </div>
                          ))}
                        </div>
                      ))
                    )}
                    {line.length === 1 && line[0].segments.length === 1 && line[0].segments[0].lyric.trim() === '' && !line[0].segments[0].chord && <div className="song-line-empty">&nbsp;</div>}
                  </div>
                ))
              )}
            </div>

            {/* Diagramas de Acordes Impresos al Pie */}
            {printTarget !== 'congregation' && printChords !== 'none' && uniqueChords.length > 0 && (
              <div className="mt-6 pt-3 border-t border-stone-200 flex flex-wrap gap-2.5 break-inside-avoid print-chords-container">
                {uniqueChords.map(c => (
                  <ChordDiagram 
                    key={c} 
                    chordName={c} 
                    notation={notation} 
                    instrument={printChords} 
                    width={55} 
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pie de Página con Frase de Meditación */}
        {printQuote.trim() && (
          <div className="mt-8 pt-3 border-t border-stone-300 text-center text-xs text-stone-500 italic break-inside-avoid">
            "{printQuote.trim()}"
          </div>
        )}
      </div>

      {/* ── Nube Flotante e Interactiva de Acorde (Popover) ── */}
      {activeChordPopover && (
        <ChordPopover 
          chordName={activeChordPopover.chord}
          notation={notation}
          targetRect={activeChordPopover.rect}
          onClose={() => setActiveChordPopover(null)}
          onPlaySound={playChordSound}
        />
      )}

      {/* ── Studio Modal ── */}
      {isAccompOpen && (
        <Suspense fallback={null}>
          <AccompanimentPanel
            songId={id}
            title={title}
            type={type}
            content={content}
            transpose={transpose}
            songKey={key}
            notation={notation}
            onClose={() => setIsAccompOpen(false)}
          />
        </Suspense>
      )}

      {isStudioOpen && hasStudio && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 print:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }}
          onClick={() => setIsStudioOpen(false)}
        >
          <div 
            className="bg-white rounded-t-2xl sm:rounded-2xl border border-stone-200 shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-5 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-3 mb-4 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Music size={18} className="text-red-500" />
                <h3 className="font-bold text-base text-stone-800 m-0">Estudio Musical y Acordes</h3>
              </div>
              <button className="btn btn-icon text-stone-400 hover:text-stone-700" onClick={() => setIsStudioOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Metronome / Rhythm Generator */}
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 mb-5">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-stone-500 uppercase">Metrónomo y Base Rítmica</span>
                <span className="font-mono text-xs font-bold text-stone-700">{bpm} BPM</span>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <button 
                  className={`btn font-bold text-xs py-2 px-4 rounded-lg flex items-center gap-2 shadow-sm ${
                    isPlayingBeat ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                  onClick={togglePlayBeat}
                >
                  {isPlayingBeat ? '⏹ Detener' : '▶ Reproducir Base'}
                </button>

                <div className="flex gap-1 flex-1">
                  {(['none', 'balada', 'vals', 'pop'] as const).map(type => (
                    <button
                      key={type}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-md border transition-all ${
                        beatType === type ? 'bg-white text-red-600 border-red-300 shadow-xs' : 'bg-stone-100 text-stone-600 border-transparent hover:bg-stone-200'
                      }`}
                      onClick={() => handleBeatTypeChange(type)}
                    >
                      {type === 'none' ? 'Click' : type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tempo Slider */}
              <input 
                type="range" 
                min="40" 
                max="180" 
                value={bpm} 
                onChange={e => handleBpmChange(parseInt(e.target.value, 10))}
                className="w-full accent-red-500 cursor-pointer"
              />

              {/* Beat visualizer indicator */}
              {isPlayingBeat && (
                <div className="flex justify-center gap-2 mt-3">
                  {Array.from({ length: maxBeatCount }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-3 h-3 rounded-full transition-all duration-75 ${
                        currentBeatCount === i + 1 ? 'bg-red-500 scale-125 shadow-sm' : 'bg-stone-300'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Chord Diagram Instrument Switcher */}
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-stone-500 uppercase">Diagramas de la Canción</span>
              <div className="flex bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-xs font-semibold">
                <button 
                  className={`px-2.5 py-1 rounded transition-all ${diagramInstrument === 'guitar' ? 'bg-white text-red-600 shadow-xs' : 'text-stone-500'}`}
                  onClick={() => setDiagramInstrument('guitar')}
                >🎸 Guitarra</button>
                <button 
                  className={`px-2.5 py-1 rounded transition-all ${diagramInstrument === 'piano' ? 'bg-white text-red-600 shadow-xs' : 'text-stone-500'}`}
                  onClick={() => setDiagramInstrument('piano')}
                >🎹 Teclado</button>
              </div>
            </div>

            {/* List of song chord diagrams */}
            <div className="flex flex-wrap gap-3 justify-center">
              {uniqueChords.map(c => (
                <div 
                  key={c} 
                  className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 flex flex-col items-center cursor-pointer hover:border-red-300 hover:bg-red-50/40 transition-all shadow-xs"
                  onClick={() => playChordSound(c)}
                  title="Haz clic para escuchar el acorde"
                >
                  <ChordDiagram 
                    chordName={c} 
                    notation={notation} 
                    instrument={diagramInstrument === 'none' ? 'guitar' : diagramInstrument} 
                    width={85} 
                  />
                  <span className="text-[11px] font-bold text-stone-600 mt-1 flex items-center gap-1">
                    <span>🔊</span> {formatChord(c, notation)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

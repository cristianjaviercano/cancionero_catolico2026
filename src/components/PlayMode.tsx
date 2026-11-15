import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, ListMusic, X, CheckCircle2, Play, Square, Plus, Minus, Volume2, VolumeX, SkipForward, Music, Sliders, ChevronUp, ChevronDown, ArrowLeft, Radio } from 'lucide-react';
import { SongViewer } from './SongViewer';
import { globalAudio } from '../utils/audioEngine';
import { ChordDiagram } from './ChordDiagram';
import { parseSongContent, transposeChord, formatChord, getChordMidi } from '../utils/musicTheory';
import type { LiveSessionData } from '../hooks/useLiveSession';

interface Song {
  id: string;
  title: string;
  type: string;
  content: string;
  partAssigned?: string;
  isPublic?: boolean;
  userId?: string;
  userDisplayName?: string;
  author?: string;
  key?: string;
  externalLink?: string;
  sheetMusic?: string;
  transpose?: number;
}

interface PlayModeProps {
  playlist: Song[];
  onExit: () => void;
  chordNotation: 'american' | 'latin';
  liveSession?: {
    sessionCode: string | null;
    sessionData: LiveSessionData | null;
    isHost: boolean;
    onOpenLiveModal: () => void;
    onUpdateLiveState: (patch: Partial<{
      currentIndex: number;
      currentSongId: string | null;
      transpose: number;
      bpm: number;
      compas: string;
      beatType: string;
      isScrolling: boolean;
      scrollSpeed: number;
    }>) => void;
  };
}

interface SongState {
  transpose: number;
  fontSize: number;
  bpm: number;
  beatType: 'none' | 'balada' | 'vals' | 'pop';
}

export function PlayMode({ playlist: propPlaylist, onExit, chordNotation, liveSession }: PlayModeProps) {
  const playlist = (liveSession?.sessionData?.playlist?.length ? liveSession.sessionData.playlist : propPlaylist) || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [localCapo, setLocalCapo] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isArrangerOpen, setIsArrangerOpen] = useState(false);
  const [isChordsDrawerOpen, setIsChordsDrawerOpen] = useState(false);

  const [isScrollActive, setIsScrollActive] = useState(true);
  const [scrollSpeedMultiplier, setScrollSpeedMultiplier] = useState<number>(() => {
    const saved = localStorage.getItem('playModeScrollSpeed');
    return saved ? parseFloat(saved) : 1.0;
  });
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);

  // Save preferred scroll speed
  useEffect(() => {
    localStorage.setItem('playModeScrollSpeed', scrollSpeedMultiplier.toString());
  }, [scrollSpeedMultiplier]);

  // Per-song state persistence: holds transpose, fontSize, bpm, beatType per song id
  const [songStates, setSongStates] = useState<Record<string, SongState>>({});

  const currentSong = playlist[currentIndex];
  
  // Current active song values, defaulting to standard if not initialized
  const currentSongState = currentSong ? (songStates[currentSong.id] || { 
    transpose: currentSong.transpose || 0, 
    fontSize: 18, 
    bpm: 80, 
    beatType: 'none' 
  }) : { transpose: 0, fontSize: 18, bpm: 80, beatType: 'none' };

  // Arranger Beat Panel States
  const [bpm, setBpm] = useState(80);
  const [beatType, setBeatType] = useState<'none' | 'balada' | 'vals' | 'pop'>('none');
  const [playState, setPlayState] = useState<'silent' | 'intro' | 'body' | 'outro' | 'final_hit'>('silent');
  const [pendingOutro, setPendingOutro] = useState(false);
  const [isMetronomeActive, setIsMetronomeActive] = useState(true);
  const [currentBeatCount, setCurrentBeatCount] = useState(1);
  const [maxBeatCount, setMaxBeatCount] = useState(4);
  const [timeSignature, setTimeSignature] = useState<'4/4' | '3/4' | '6/8' | '2/4'>('4/4');

  // Soundboard Instrument State (Guitar vs Piano)
  const [instrument, setInstrument] = useState<'guitar' | 'piano'>('guitar');

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === playlist.length - 1;

  // Initialize songStates when playlist loads
  useEffect(() => {
    if (playlist && playlist.length > 0) {
      const initialStates: Record<string, SongState> = {};
      playlist.forEach(song => {
        initialStates[song.id] = {
          transpose: song.transpose || 0,
          fontSize: 18,
          bpm: 80,
          beatType: 'none'
        };
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSongStates(initialStates);
      
      // Load first song states
      const first = playlist[0];
      if (first) {
        setBpm(80);
        setBeatType('none');
      }
    }
  }, [playlist]);

  // Keep screen awake during PlayMode (Screen Wake Lock API)
  useEffect(() => {
    let wakeLock: { release: () => Promise<void> } | null = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && (navigator as unknown as { wakeLock: { request: (t: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock) {
          wakeLock = await (navigator as unknown as { wakeLock: { request: (t: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock.request('screen');
        }
      } catch {
        // Ignore if browser blocks wakeLock
      }
    };
    void requestWakeLock();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void requestWakeLock();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (wakeLock) void wakeLock.release();
    };
  }, []);

  // Synchronize Follower state when Host updates LiveSessionData
  useEffect(() => {
    const data = liveSession?.sessionData;
    if (!data || liveSession?.isHost) return;
    if (typeof data.currentIndex === 'number' && data.currentIndex !== currentIndex && data.currentIndex < playlist.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentIndex(data.currentIndex);
    }
    const targetSong = playlist[data.currentIndex ?? currentIndex];
    if (targetSong && typeof data.transpose === 'number') {
      setSongStates(prev => ({
        ...prev,
        [targetSong.id]: {
          ...(prev[targetSong.id] || { fontSize: 18, bpm: data.bpm || 80, beatType: 'none' }),
          transpose: data.transpose
        }
      }));
    }
    if (typeof data.bpm === 'number' && data.bpm !== bpm) {
      setBpm(data.bpm);
    }
    if (typeof data.isScrolling === 'boolean' && data.isScrolling !== isScrollActive) {
      setIsScrollActive(data.isScrolling);
    }
  }, [liveSession?.sessionData, liveSession?.isHost, playlist, currentIndex, bpm, isScrollActive]);

  // Sync metronome loop
  useEffect(() => {
    if (isMetronomeActive) {
      globalAudio.setTimeSignature(timeSignature);
      globalAudio.startMetronome(beatType, bpm, (quarter, count, state) => {
        setCurrentBeatCount(quarter);
        setMaxBeatCount(count);
        setPlayState((state || 'silent') as 'silent' | 'intro' | 'body' | 'outro' | 'final_hit');
        setPendingOutro(globalAudio.pendingOutro);
      });
    } else {
      globalAudio.stop();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPlayState('silent');
    }

    return () => {
      globalAudio.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMetronomeActive, beatType, timeSignature]);

  // Local silent visual metronome timer to run when playState is silent
  useEffect(() => {
    if (isMetronomeActive && playState === 'silent') {
      const intervalMs = (60 / bpm) * 1000;
      
      const intervalId = setInterval(() => {
        setCurrentBeatCount(prev => {
          let max = 4;
          if (timeSignature === '3/4') max = 3;
          else if (timeSignature === '2/4') max = 2;
          else if (timeSignature === '6/8') max = 6;
          
          // Ensure maxBeatCount is in sync
          setMaxBeatCount(max);
          const next = prev + 1;
          return next > max ? 1 : next;
        });
      }, intervalMs);
      
      return () => clearInterval(intervalId);
    }
  }, [isMetronomeActive, playState, bpm, timeSignature]);

  // Sync timeSignature changes with audio engine
  useEffect(() => {
    globalAudio.setTimeSignature(timeSignature);
  }, [timeSignature]);

  // Sync BPM changes with audio engine
  useEffect(() => {
    globalAudio.setBpm(bpm);
  }, [bpm]);

  // Reset scroll container position when current song changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    scrollPositionRef.current = 0;
  }, [currentIndex]);

  // Autoscroll Loop — runs whenever isScrollActive is ON, independent of metronome
  useEffect(() => {
    if (!isScrollActive) {
      return;
    }

    let lastTime = performance.now();
    let frameId: number;

    const scrollSpeed = 0.025 * scrollSpeedMultiplier; // Pixels per millisecond (approx 25px/sec * multiplier)

    const scroll = (now: number) => {
      const delta = now - lastTime;
      lastTime = now;

      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        if (container.scrollHeight > container.clientHeight) {
          scrollPositionRef.current += scrollSpeed * delta;
          
          const maxScroll = container.scrollHeight - container.clientHeight;
          if (scrollPositionRef.current >= maxScroll) {
            container.scrollTop = maxScroll;
            return;
          }

          container.scrollTop = Math.floor(scrollPositionRef.current);
        }
      }

      frameId = requestAnimationFrame(scroll);
    };

    frameId = requestAnimationFrame(scroll);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [isScrollActive, scrollSpeedMultiplier]);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const currentScrollTop = scrollContainerRef.current.scrollTop;
      const diff = Math.abs(currentScrollTop - scrollPositionRef.current);
      if (diff > 2) {
        scrollPositionRef.current = currentScrollTop;
      }
    }
  };

  // Parse current song unique chords for arranger triggers
  const currentSongLines = useMemo(() => {
    return currentSong ? parseSongContent(currentSong.content) : [];
  }, [currentSong]);

  const uniqueChords = useMemo(() => {
    const chords = new Set<string>();
    currentSongLines.forEach(line => {
      line.forEach(word => {
        word.segments.forEach(segment => {
          if (segment.chord) {
            chords.add(segment.chord);
          }
        });
      });
    });
    return Array.from(chords);
  }, [currentSongLines]);

  // Play soundboard chord audio
  const playChordAudio = (chord: string) => {
    const isPianoMode = instrument === 'piano';
    const transposed = currentSongState.transpose !== 0 
      ? transposeChord(chord, currentSongState.transpose) 
      : chord;
    const midi = getChordMidi(transposed, isPianoMode ? 'piano' : 'guitar');
    globalAudio.playChord(midi, isPianoMode ? 'pad' : 'pluck');
  };

  // Handle switching songs (loads prepared transposition, size, and beat)
  const handleSelectSong = (index: number) => {
    setCurrentIndex(index);
    setIsSidebarOpen(false);

    const targetSong = playlist[index];
    if (targetSong) {
      const targetState = songStates[targetSong.id] || { 
        transpose: targetSong.transpose || 0, 
        fontSize: 18, 
        bpm: 80, 
        beatType: 'none' 
      };
      
      setBpm(targetState.bpm);
      setBeatType(targetState.beatType);
      
      globalAudio.setBpm(targetState.bpm);
      globalAudio.setBeatType(targetState.beatType);
      
      globalAudio.stopBeat();
      setPlayState('silent');
      setPendingOutro(false);

      if (liveSession?.isHost && liveSession.sessionCode) {
        liveSession.onUpdateLiveState({
          currentIndex: index,
          currentSongId: targetSong.id,
          transpose: targetState.transpose,
          bpm: targetState.bpm
        });
      }
    }
  };

  const handleNext = () => {
    if (!isLast) handleSelectSong(currentIndex + 1);
  };

  const handlePrev = () => {
    if (!isFirst) handleSelectSong(currentIndex - 1);
  };

  // State setters that persist to songStates map
  const handleTransposeChange = (newTranspose: number) => {
    if (!currentSong) return;
    setSongStates(prev => ({
      ...prev,
      [currentSong.id]: {
        ...(prev[currentSong.id] || { fontSize: 18, bpm: 80, beatType: 'none' }),
        transpose: newTranspose
      }
    }));
    if (liveSession?.isHost && liveSession.sessionCode) {
      liveSession.onUpdateLiveState({ transpose: newTranspose });
    }
  };

  const handleFontSizeChange = (newFontSize: number) => {
    if (!currentSong) return;
    setSongStates(prev => ({
      ...prev,
      [currentSong.id]: {
        ...(prev[currentSong.id] || { transpose: 0, bpm: 80, beatType: 'none' }),
        fontSize: newFontSize
      }
    }));
  };

  const handleBpmChange = (newBpm: number) => {
    const clampedBpm = Math.min(180, Math.max(60, newBpm));
    setBpm(clampedBpm);
    if (currentSong) {
      setSongStates(prev => ({
        ...prev,
        [currentSong.id]: {
          ...(prev[currentSong.id] || { transpose: 0, fontSize: 18, beatType: 'none' }),
          bpm: clampedBpm
        }
      }));
    }
  };

  const handleBeatTypeChange = (type: 'none' | 'balada' | 'vals' | 'pop') => {
    setBeatType(type);
    
    // Automatically set default time signature based on beatType
    let sig: '4/4' | '3/4' | '6/8' | '2/4' = '4/4';
    if (type === 'vals') {
      sig = '3/4';
    }
    setTimeSignature(sig);
    
    const max = sig === '3/4' ? 3 : 4;
    setMaxBeatCount(max);
    
    if (currentSong) {
      setSongStates(prev => ({
        ...prev,
        [currentSong.id]: {
          ...(prev[currentSong.id] || { transpose: 0, fontSize: 18, bpm: 80 }),
          beatType: type
        }
      }));
    }
  };

  const handleTimeSignatureChange = (sig: '4/4' | '3/4' | '6/8' | '2/4') => {
    setTimeSignature(sig);
    let max = 4;
    if (sig === '3/4') max = 3;
    else if (sig === '2/4') max = 2;
    else if (sig === '6/8') max = 6;
    setMaxBeatCount(max);
    setCurrentBeatCount(1);
  };

  // Keyboard Arranger Playback Handlers
  const handleStartBeat = () => {
    if (!isMetronomeActive) {
      setIsMetronomeActive(true);
    }
    globalAudio.startBeat();
    setPlayState('intro');
    setPendingOutro(false);
  };

  const handleTriggerOutro = () => {
    globalAudio.triggerOutro();
    setPendingOutro(true);
  };

  const handleStopBeat = () => {
    globalAudio.stopBeat();
    setPlayState('silent');
    setPendingOutro(false);
  };

  const handleToggleMetronome = () => {
    setIsMetronomeActive(prev => !prev);
  };

  // Close sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen]);

  if (!playlist || playlist.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center p-4">
        <h2 className="text-2xl text-stone-400 mb-4">No hay cantos en la celebración</h2>
        <button className="btn btn-primary" onClick={onExit}>Volver al armador</button>
      </div>
    );
  }

  const getPlayStateLabel = () => {
    if (playState === 'intro') return 'INTRODUCCIÓN';
    if (playState === 'body') return pendingOutro ? 'ESPERANDO SALIDA' : 'RITMO EN REPRODUCCIÓN';
    if (playState === 'outro') return 'REBOTE DE SALIDA';
    if (playState === 'final_hit') return 'REMATE FINAL';
    return 'METRÓNOMO EN SILENCIO';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden text-slate-100 font-sans">
      
      {/* Stage Top Bar */}
      <div className="h-16 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-4 shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          {/* Back to builder button */}
          <button 
            className="btn btn-icon bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            onClick={onExit}
            aria-label="Volver a la Eucaristía"
            title="Volver al armador de la Eucaristía"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-bold text-base sm:text-lg text-slate-100 truncate max-w-[200px] sm:max-w-xs leading-tight">
              Modo Acompañamiento
            </h1>
            <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider">
              {currentSong?.partAssigned} • {currentIndex + 1} de {playlist.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {liveSession && (
            <button
              type="button"
              onClick={liveSession.onOpenLiveModal}
              className={`btn transition-colors flex items-center gap-1.5 border px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                liveSession.sessionCode
                  ? 'bg-red-950/60 hover:bg-red-900/60 text-red-300 border-red-700/70'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="Sincronización en vivo con el coro"
            >
              <Radio size={14} className={liveSession.sessionCode ? 'text-red-400 animate-pulse' : 'text-slate-400'} />
              <span className="hidden sm:inline">
                {liveSession.sessionCode
                  ? liveSession.isHost
                    ? `En Vivo: ${liveSession.sessionCode}`
                    : `Siguiendo: ${liveSession.sessionCode}`
                  : 'Coro en Vivo'}
              </span>
            </button>
          )}

          {/* Selector de Cejilla/Capo Personal para guitarristas en vivo */}
          <label
            className="hidden sm:flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-300"
            title="Si pones cejilla (Capo) en tu guitarra, ajusta el traste aquí para ver tus posturas relativas al tono real del director"
          >
            <span className="text-slate-400 font-semibold">Capo:</span>
            <select
              value={localCapo}
              onChange={(e) => setLocalCapo(Number(e.target.value))}
              className="bg-transparent text-amber-400 font-bold focus:outline-none cursor-pointer"
            >
              {[0, 1, 2, 3, 4, 5, 6, 7].map((c) => (
                <option key={c} value={c} className="bg-slate-900 text-slate-100">
                  {c === 0 ? 'Sin' : `${c}°`}
                </option>
              ))}
            </select>
          </label>

          <button 
            onClick={() => {
              const next = !isScrollActive;
              setIsScrollActive(next);
              if (liveSession?.isHost && liveSession.sessionCode) {
                liveSession.onUpdateLiveState({ isScrolling: next });
              }
            }}
            className={`btn transition-colors flex items-center gap-2 border px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer
              ${isScrollActive 
                ? 'bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-400 border-emerald-900/60' 
                : 'bg-slate-800 hover:bg-slate-750 text-slate-400 border-slate-700'}`}
          >
            <div className={`w-2 h-2 rounded-full ${isScrollActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            Scroll On/Off
          </button>

          {/* Speed Stepper */}
          <div className="flex items-center gap-0.5 bg-slate-900 border border-slate-700 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setScrollSpeedMultiplier(s => Math.max(0.25, Number((s - 0.25).toFixed(2))))}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded cursor-pointer transition-colors"
              title="Disminuir velocidad de scroll"
            >
              <Minus size={13} />
            </button>
            <span className="font-mono text-emerald-400 font-bold px-1 min-w-[32px] text-center text-[11px]">
              {scrollSpeedMultiplier}x
            </span>
            <button
              onClick={() => setScrollSpeedMultiplier(s => Math.min(3.0, Number((s + 0.25).toFixed(2))))}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded cursor-pointer transition-colors"
              title="Aumentar velocidad de scroll"
            >
              <Plus size={13} />
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-500 uppercase font-semibold">Estado:</span>
            <span className={`font-bold uppercase tracking-wider ${playState !== 'silent' ? 'text-emerald-400' : 'text-slate-400'}`}>
              {getPlayStateLabel()}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative flex overflow-hidden">
        
        {/* Scrollable Song sheet page */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 relative">
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 md:p-8"
          >
            <div className="max-w-4xl mx-auto">
              <div className="mb-4 inline-flex items-center gap-2 bg-red-950/30 text-red-400 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-widest border border-red-900/40">
                <CheckCircle2 size={16} /> 
                {currentSong?.partAssigned}
              </div>
              
              {currentSong && (
                <SongViewer 
                  id={currentSong.id}
                  title={currentSong.title} 
                  type={currentSong.type} 
                  content={currentSong.content} 
                  notation={chordNotation} 
                  isPublic={currentSong.isPublic}
                  userId={currentSong.userId}
                  userDisplayName={currentSong.userDisplayName}
                  author={currentSong.author}
                  key={currentSong.key}
                  songKey={currentSong.key}
                  externalLink={currentSong.externalLink}
                  transpose={currentSongState.transpose - localCapo}
                  onTransposeChange={(t) => handleTransposeChange(t + localCapo)}
                  fontSize={currentSongState.fontSize}
                  onFontSizeChange={handleFontSizeChange}
                  hidePracticeStudio={true} // Hides the studio from sheet page
                  sheetMusic={currentSong.sheetMusic}
                />
              )}
            </div>
          </div>
        </div>

        {/* Liturgia Sidebar Drawer */}
        {isSidebarOpen && (
          <div 
            className="absolute inset-0 bg-black/70 z-30 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        
        <div 
          className={`absolute top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-slate-900 border-r border-slate-800 shadow-2xl z-40 flex flex-col transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="p-4 border-b border-slate-800 bg-slate-950 sticky top-0 flex justify-between items-center shrink-0">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <ListMusic size={20} className="text-red-500" /> Celebración
            </h2>
            <button className="text-slate-400 hover:text-slate-100 p-2 rounded-lg hover:bg-slate-800 transition-colors" onClick={() => setIsSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>
          
          <div className="p-4 flex flex-col gap-2 overflow-y-auto flex-1">
            {playlist.map((item, index) => {
              const isCurrent = index === currentIndex;
              const isPast = index < currentIndex;
              return (
                <button
                  key={`${item.id}-${index}`}
                  onClick={() => handleSelectSong(index)}
                  className={`text-left p-3 rounded-lg border transition-all flex flex-col relative overflow-hidden group
                    ${isCurrent 
                      ? 'bg-red-500/10 border-red-500 text-slate-100 shadow-[0_0_15px_rgba(239,68,68,0.15)] ring-1 ring-red-500/50 scale-[1.02]' 
                      : isPast
                        ? 'bg-slate-800/40 border-slate-850 text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                        : 'bg-slate-800/80 border-slate-850 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                    }
                  `}
                >
                  {isCurrent && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
                  )}
                  
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isCurrent ? 'text-red-500' : isPast ? 'text-slate-500' : 'text-slate-400'}`}>
                      {item.partAssigned}
                    </span>
                    {isCurrent && <span className="text-[9px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/30 font-bold uppercase animate-pulse">Tocando</span>}
                    {isPast && <CheckCircle2 size={14} className="text-slate-500" />}
                  </div>
                  <span className="font-semibold truncate text-sm">{item.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chords Sidebar Drawer (Right Side) */}
        
        <div 
          className={`absolute top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-slate-900 border-l border-slate-800 shadow-2xl z-40 flex flex-col transition-transform duration-300 ease-in-out ${isChordsDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="p-4 border-b border-slate-800 bg-slate-950 sticky top-0 flex justify-between items-center shrink-0">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Music size={20} className="text-red-500" /> Acordes del Canto
            </h2>
            <button className="text-slate-400 hover:text-slate-100 p-2 rounded-lg hover:bg-slate-800 transition-colors" onClick={() => setIsChordsDrawerOpen(false)}>
              <X size={20} />
            </button>
          </div>
          
          <div className="p-4 border-b border-slate-800 bg-slate-900 flex justify-between items-center shrink-0">
            <span className="text-xs font-bold text-slate-500 uppercase">Instrumento</span>
            <div className="flex bg-slate-950/80 p-0.5 rounded border border-slate-800 text-[10px] font-semibold">
              <button 
                className={`px-3 py-1 rounded transition-all cursor-pointer border-none ${instrument === 'guitar' ? 'bg-red-600 text-white font-bold' : 'text-slate-400 hover:text-slate-205'}`}
                onClick={() => setInstrument('guitar')}
                style={{ backgroundColor: instrument === 'guitar' ? '#dc2626' : 'transparent', color: instrument === 'guitar' ? '#ffffff' : undefined }}
              >
                🎸 Guit.
              </button>
              <button 
                className={`px-3 py-1 rounded transition-all cursor-pointer border-none ${instrument === 'piano' ? 'bg-red-650 text-white font-bold' : 'text-slate-400 hover:text-slate-205'}`}
                onClick={() => setInstrument('piano')}
                style={{ backgroundColor: instrument === 'piano' ? '#dc2626' : 'transparent', color: instrument === 'piano' ? '#ffffff' : undefined }}
              >
                🎹 Tecl.
              </button>
            </div>
          </div>
          
          <div className="p-4 flex flex-col gap-5 overflow-y-auto flex-1 bg-slate-900">
            {uniqueChords.length === 0 ? (
              <div className="text-slate-500 text-xs py-8 text-center bg-slate-950/20 rounded-xl border border-dashed border-slate-800/50">
                Esta canción no contiene acordes registrados.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {uniqueChords.map(chord => {
                  const displayName = formatChord(chord, chordNotation);
                  const transposed = currentSongState.transpose !== 0 
                    ? transposeChord(chord, currentSongState.transpose) 
                    : chord;
                  return (
                    <div 
                      key={chord} 
                      onClick={() => playChordAudio(chord)}
                      className="bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-red-500 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-all shadow-md group relative overflow-hidden active:scale-95 duration-150"
                      style={{ backgroundColor: '#090d16' }}
                      title="Hacer clic para escuchar el acorde"
                    >
                      <span className="text-xs font-mono font-bold text-red-400 mb-2">{displayName}</span>
                      
                      <div className="bg-white p-1 rounded-lg border border-slate-800/30">
                        <ChordDiagram 
                          chordName={transposed} 
                          notation={chordNotation} 
                          instrument={instrument} 
                          width={75} 
                        />
                      </div>
                      
                      <span className="text-[8px] text-slate-500 font-sans tracking-wide mt-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        🔊 Escuchar
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* -------------------- ARRANGER DASHBOARD & CONTROLS -------------------- */}
      <div className="shrink-0 flex flex-col play-dashboard border-t border-slate-800 bg-slate-900 px-4 py-3 md:px-6">
        
        {/* Collapsible Panel 1: Arranger Beat Deck */}
        <div 
          style={{
            maxHeight: isArrangerOpen ? '200px' : '0px',
            opacity: isArrangerOpen ? 1 : 0,
            marginBottom: isArrangerOpen ? '0.75rem' : '0px',
            paddingBottom: isArrangerOpen ? '0.75rem' : '0px',
            borderBottom: isArrangerOpen ? '1px solid #1e293b' : 'none',
            overflow: 'hidden',
            transition: 'all 300ms ease-in-out',
            pointerEvents: isArrangerOpen ? 'auto' : 'none'
          }}
        >
          <div className="flex flex-wrap gap-6 items-stretch justify-between">
            
            {/* Section A: Metronome & Tempo Control */}
            <div className="flex-initial flex flex-col justify-between gap-2.5">
              
              {/* Metronome Pulse Indicator */}
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Metrónomo Silencioso</span>
                <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-1 rounded-lg border border-slate-800 shadow-inner w-fit">
                  <button 
                    className={`p-1 rounded transition-colors ${isMetronomeActive ? 'text-white hover:text-white/80' : 'text-slate-650 hover:text-slate-500'}`}
                    onClick={handleToggleMetronome}
                    title={isMetronomeActive ? "Silenciar Metrónomo" : "Activar Metrónomo"}
                  >
                    {isMetronomeActive ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  </button>
                  <div className="flex gap-1.5 ml-1">
                    {Array.from({ length: maxBeatCount }).map((_, index) => {
                      const beatNumber = index + 1;
                      const isActive = currentBeatCount === beatNumber;
                      return (
                        <div 
                          key={index} 
                          className={`w-3 h-3 rounded-full transition-all duration-75 ${
                            isActive && isMetronomeActive
                              ? 'bg-white border border-white shadow-[0_0_10px_#ffffff] scale-120'
                              : 'bg-transparent border border-white/20'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Tempo BPM Adjuster */}
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Tempo (BPM)</span>
                <div className="flex items-center gap-2 bg-slate-950/60 p-1 rounded-lg border border-slate-800 w-fit">
                  <button 
                    className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
                    onClick={() => handleBpmChange(bpm - 2)}
                    title="Reducir tempo -2 BPM"
                  >
                    <Minus size={12} />
                  </button>
                  <input 
                    type="range"
                    min="60"
                    max="180"
                    value={bpm}
                    onChange={(e) => handleBpmChange(parseInt(e.target.value))}
                    className="w-14 sm:w-16 accent-red-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="font-mono text-xs font-bold text-slate-200 min-w-[2.2rem] text-center">
                    {bpm} <span className="text-[8px] text-slate-500">BPM</span>
                  </span>
                  <button 
                    className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
                    onClick={() => handleBpmChange(bpm + 2)}
                    title="Aumentar tempo +2 BPM"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>

              {/* Time Signature / Metric Selector */}
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Métrica (Compás)</span>
                <select 
                  value={timeSignature}
                  onChange={(e) => handleTimeSignatureChange(e.target.value as '4/4' | '3/4' | '6/8' | '2/4')}
                  className="bg-slate-950/60 text-slate-200 border border-slate-800 rounded-lg p-1 text-xs font-semibold focus:outline-none focus:border-red-500 w-fit cursor-pointer"
                  style={{ minWidth: '110px' }}
                >
                  <option value="4/4">4/4 Estándar</option>
                  <option value="3/4">3/4 Vals / Sol.</option>
                  <option value="6/8">6/8 Dinam. / Folk</option>
                  <option value="2/4">2/4 Marcha / Ráp.</option>
                </select>
              </div>

            </div>

            {/* Section C: Arranger Controls (Intro/Outro/Stop & Rhythm Beats) */}
            <div className="flex-initial flex flex-col gap-2.5 justify-between">
              
              {/* Top row: Arranger Buttons */}
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Acompañamiento</span>
                <div className="flex gap-2">
                  <button 
                    onClick={handleStartBeat}
                    disabled={beatType === 'none'}
                    className={`arranger-btn btn-intro-play ${playState !== 'silent' ? 'active' : ''}`}
                    style={{
                      width: '56px',
                      height: '48px',
                      padding: '0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      justifyContent: 'center',
                      alignItems: 'center',
                      fontSize: '10px'
                    }}
                    title="Intro + Iniciar"
                  >
                    <Play size={12} fill="currentColor" className="shrink-0" />
                    <span className="text-[9px] font-bold tracking-tight">{playState === 'intro' ? 'Intro...' : 'Intro'}</span>
                  </button>

                  <button 
                    onClick={handleTriggerOutro}
                    disabled={playState !== 'body' || pendingOutro}
                    className={`arranger-btn btn-outro ${playState === 'outro' ? 'active' : ''} ${pendingOutro ? 'animate-pulse bg-amber-600/60' : ''}`}
                    style={{
                      width: '56px',
                      height: '48px',
                      padding: '0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      justifyContent: 'center',
                      alignItems: 'center',
                      fontSize: '10px'
                    }}
                    title="Salida"
                  >
                    <SkipForward size={12} className="shrink-0" />
                    <span className="text-[9px] font-bold tracking-tight">{pendingOutro ? 'Esp...' : 'Salida'}</span>
                  </button>

                  <button 
                    onClick={handleStopBeat}
                    disabled={playState === 'silent'}
                    className="arranger-btn btn-stop"
                    style={{
                      width: '56px',
                      height: '48px',
                      padding: '0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      justifyContent: 'center',
                      alignItems: 'center',
                      fontSize: '10px'
                    }}
                    title="Parar"
                  >
                    <Square size={12} fill="currentColor" className="shrink-0" />
                    <span className="text-[9px] font-bold tracking-tight">Parar</span>
                  </button>
                </div>
              </div>

              {/* Bottom row: Rhythm Beats selector */}
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Base de Percusión (Beats)</span>
                <div className="flex bg-slate-950/40 p-0.5 rounded-lg border border-slate-850 gap-1 w-fit">
                  {(['none', 'balada', 'vals', 'pop'] as const).map(type => (
                    <button 
                      key={type}
                      className={`text-[9px] font-semibold rounded transition-colors text-center cursor-pointer border-none capitalize`}
                      onClick={() => handleBeatTypeChange(type)}
                      style={{
                        backgroundColor: beatType === type ? '#dc2626' : 'transparent',
                        color: beatType === type ? '#ffffff' : '#94a3b8',
                        fontWeight: beatType === type ? 'bold' : 'normal',
                        width: '42px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {type === 'none' ? 'Mute' : type}
                    </button>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Panel 2: Compact Song Navigation Bar */}
        <div className="flex justify-between items-center gap-2 h-14">
          <button 
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-bold transition-all shadow-lg border ${isFirst ? 'bg-slate-800/40 text-slate-650 border-slate-800/30 cursor-not-allowed' : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-750 hover:text-slate-100'}`}
            onClick={handlePrev}
            disabled={isFirst}
          >
            <ChevronLeft size={18} /> <span className="hidden sm:inline">Anterior</span>
          </button>

          {/* Quick Play/Stop shortcut for backing beats */}
          {beatType !== 'none' && (
            <button 
              onClick={playState === 'silent' ? handleStartBeat : handleStopBeat}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer border-none shadow-md ${
                playState !== 'silent' 
                  ? 'bg-red-600 text-white hover:bg-red-500 shadow-red-650/20' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-650/20'
              }`}
              title={playState !== 'silent' ? "Detener Ritmo" : "Iniciar Ritmo"}
              style={{ backgroundColor: playState !== 'silent' ? '#dc2626' : '#059669' }}
            >
              {playState !== 'silent' ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
            </button>
          )}

          <button 
            onClick={() => { setIsSidebarOpen(!isSidebarOpen); setIsChordsDrawerOpen(false); }}
            className={`px-3 py-3 rounded-xl flex items-center gap-1 text-xs font-bold uppercase transition-colors shrink-0 cursor-pointer border
              ${isSidebarOpen 
                ? 'bg-red-600 border-red-500 text-white shadow-md' 
                : 'bg-slate-800 text-slate-350 border-slate-700 hover:bg-slate-750 hover:text-slate-100'}`}
            title="Lista de Cantos"
            style={{ backgroundColor: isSidebarOpen ? '#dc2626' : undefined, borderColor: isSidebarOpen ? '#ef4444' : undefined }}
          >
            <ListMusic size={14} /> <span className="hidden md:inline">Cantos</span>
          </button>

          {/* Toggle button to expand/collapse Chords Drawer */}
          <button 
            onClick={() => { setIsChordsDrawerOpen(!isChordsDrawerOpen); setIsSidebarOpen(false); }}
            className={`px-3 py-3 border rounded-xl flex items-center gap-1 text-xs font-bold uppercase transition-all shrink-0 cursor-pointer
              ${isChordsDrawerOpen 
                ? 'bg-red-600 border-red-500 text-white shadow-md' 
                : 'bg-slate-800 hover:bg-slate-750 text-slate-350 border-slate-700 hover:text-slate-100'}`}
            title="Ver diagramas de acordes de guitarra o piano"
            style={{ backgroundColor: isChordsDrawerOpen ? '#dc2626' : undefined, borderColor: isChordsDrawerOpen ? '#ef4444' : undefined }}
          >
            <Music size={14} />
            <span className="hidden sm:inline">Acordes</span>
            {isChordsDrawerOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>

          {/* Toggle button to expand/collapse Metronome/Beats Panel */}
          <button 
            onClick={() => setIsArrangerOpen(!isArrangerOpen)}
            className={`px-3 py-3 border rounded-xl flex items-center gap-1 text-xs font-bold uppercase transition-all shrink-0 cursor-pointer
              ${isArrangerOpen 
                ? 'bg-red-600 border-red-500 text-white shadow-md' 
                : 'bg-slate-800 hover:bg-slate-750 text-slate-350 border-slate-700 hover:text-slate-100'}`}
            title="Ajustes de acompañamiento y ritmo"
            style={{ backgroundColor: isArrangerOpen ? '#dc2626' : undefined, borderColor: isArrangerOpen ? '#ef4444' : undefined }}
          >
            <Sliders size={14} />
            <span className="hidden sm:inline">Ritmo</span>
            {isArrangerOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>

          <button 
            className={`flex-grow-[1.2] flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-bold transition-all shadow-lg border ${isLast ? 'bg-slate-800/40 text-slate-650 border-slate-800/30 cursor-not-allowed' : 'bg-red-600 text-white border-red-500 hover:bg-red-500'}`}
            onClick={handleNext}
            disabled={isLast}
            style={{ backgroundColor: isLast ? undefined : '#dc2626', borderColor: isLast ? undefined : '#ef4444' }}
          >
            <span className="hidden sm:inline">Sig.</span> <ChevronRight size={18} />
          </button>
        </div>

      </div>

    </div>
  );
}

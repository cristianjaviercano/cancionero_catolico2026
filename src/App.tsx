import React, { useState, useEffect, lazy, Suspense, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { SongList } from './components/SongList';
import { Home as HomeView } from './components/Home';
import { Menu, Moon, Sun, Radio } from 'lucide-react';
import { COLOR_HEX, getLiturgicalDay, roman, todayIso } from './utils/liturgicalCalendar';
import { useSongs } from './hooks/useSongs';
import type { Song } from './hooks/useSongs';
import { AuthButton } from './components/AuthButton';
import { useLiveSession } from './hooks/useLiveSession';
import { LiveSessionModal } from './components/LiveSessionModal';

import { Sidebar } from './components/Sidebar';

// Pantallas que se cargan al abrirlas (el inicio y el repertorio van en el archivo principal)
const MassBuilder = lazy(() => import('./components/MassBuilder').then(m => ({ default: m.MassBuilder })));
const PlayMode = lazy(() => import('./components/PlayMode').then(m => ({ default: m.PlayMode })));
const PartesEucaristia = lazy(() => import('./components/PartesEucaristia').then(m => ({ default: m.PartesEucaristia })));
const ChordGlossary = lazy(() => import('./components/ChordGlossary').then(m => ({ default: m.ChordGlossary })));
const SongEditor = lazy(() => import('./components/SongEditor').then(m => ({ default: m.SongEditor })));
const Tuner = lazy(() => import('./components/Tuner').then(m => ({ default: m.Tuner })));
const Secciones = lazy(() => import('./components/Secciones').then(m => ({ default: m.Secciones })));
const Oracion = lazy(() => import('./components/Oracion').then(m => ({ default: m.Oracion })));
const Tutorial = lazy(() => import('./components/Tutorial').then(m => ({ default: m.Tutorial })));
const ScholaCantorum = lazy(() => import('./components/ScholaCantorum').then(m => ({ default: m.ScholaCantorum })));
const SheetMusicGallery = lazy(() => import('./components/SheetMusicGallery').then(m => ({ default: m.SheetMusicGallery })));
const SheetMusicViewer = lazy(() => import('./components/SheetMusicViewer').then(m => ({ default: m.SheetMusicViewer })));

// Secciones de liturgia y devoción: se cargan al abrirlas
const LecturasDelDia = lazy(() => import('./components/liturgia/LecturasDelDia').then(m => ({ default: m.LecturasDelDia })));
const CalendarioLiturgico = lazy(() => import('./components/liturgia/CalendarioLiturgico').then(m => ({ default: m.CalendarioLiturgico })));
const LiturgiaHoras = lazy(() => import('./components/liturgia/LiturgiaHoras').then(m => ({ default: m.LiturgiaHoras })));
const RosarioMariano = lazy(() => import('./components/devocion/RosarioMariano').then(m => ({ default: m.RosarioMariano })));
const SanJoseDevocion = lazy(() => import('./components/devocion/SanJoseDevocion').then(m => ({ default: m.SanJoseDevocion })));

function SectionFallback() {
  return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando…</div>;
}

// App Layout with Navigation
interface LayoutProps {
  children: React.ReactNode;
  setSongToEdit: (song: Song | null) => void;
  chordNotation: 'american' | 'latin';
  toggleChordNotation: () => void;
  sessionCode: string | null;
  isHost: boolean;
  onOpenLiveModal: () => void;
}

function Layout({ children, setSongToEdit, chordNotation, toggleChordNotation, sessionCode, isHost, onOpenLiveModal }: LayoutProps) {
  const location = useLocation();
  const isPlayMode = location.pathname === '/play';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const liturgicalDay = useMemo(() => getLiturgicalDay(todayIso()), []);
  const liturgicalBadge = liturgicalDay.celebration
    ? liturgicalDay.title
    : `${liturgicalDay.seasonName}${liturgicalDay.week ? ` • Hebdomada ${roman(liturgicalDay.week)}` : ''}`;

  const [isStageMode, setIsStageMode] = useState<boolean>(() => {
    return localStorage.getItem('stageMode') === 'true';
  });

  useEffect(() => {
    document.body.classList.toggle('stage-mode', isStageMode);
    localStorage.setItem('stageMode', isStageMode ? 'true' : 'false');
  }, [isStageMode]);

  if (isPlayMode) return <>{children}</>;

  return (
    <div style={{ minHeight: '100vh' }}>
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        setSongToEdit={setSongToEdit}
      />
      
      {/* Top Navbar — offset by sidebar width on desktop */}
      <header
        className="print:hidden"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          borderBottom: 'none',
          backgroundColor: 'color-mix(in srgb, var(--bg-color) 92%, transparent)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 2px 12px -2px rgba(24, 24, 27, 0.03)',
          marginBottom: '1.5rem',
        }}
      >
        <div className="app-layout-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            {/* Mobile menu toggle */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              style={{ display: 'flex', padding: '0.375rem', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '0.5rem' }}
              aria-label="Abrir menú"
              className="sm:hidden"
            >
              <Menu size={22} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', color: 'var(--accent-color)', textDecoration: 'none' }}>
                <img src="/cruz-templaria.svg" width="28" height="28" alt="VOX TEMPLI" className="shrink-0" style={{ filter: 'drop-shadow(0 2px 6px rgba(185, 28, 28, 0.28))' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="font-sacred text-base tracking-widest font-extrabold text-stone-900" style={{ letterSpacing: '0.08em', lineHeight: 1.1 }}>VOX TEMPLI</span>
                  <span className="text-[10px] text-stone-400 font-sans tracking-wide uppercase font-semibold hidden sm:inline">Códice Litúrgico</span>
                </div>
              </Link>
              {/* Badge Tiempo Litúrgico Dinámico — Zero Outlines */}
              <Link to="/calendario" title={liturgicalDay.title} className="hidden md:flex items-center gap-1.5 bg-red-50 text-red-800 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase" style={{ textDecoration: 'none', maxWidth: '22rem' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: COLOR_HEX[liturgicalDay.color], width: 6, height: 6, flexShrink: 0 }}></span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{liturgicalBadge}</span>
              </Link>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <button
              onClick={onOpenLiveModal}
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.45rem 0.75rem',
                borderRadius: '0.625rem',
                border: sessionCode ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid rgba(239, 68, 68, 0.25)',
                backgroundColor: sessionCode ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.08)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                transition: 'all 0.15s',
                color: sessionCode ? '#047857' : 'var(--accent-color)'
              }}
              title="Ensamble en Vivo (Sincronizar pantallas del coro)"
              className="print:hidden"
            >
              <Radio size={15} className={sessionCode ? 'animate-pulse text-emerald-600' : 'text-red-600'} />
              <span className="hidden sm:inline">
                {sessionCode ? `${isHost ? 'Dirigiendo' : 'En Vivo'}: ${sessionCode}` : 'Coro en Vivo'}
              </span>
            </button>
            <button 
              onClick={() => setIsStageMode(!isStageMode)}
              style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.45rem 0.75rem', borderRadius: '0.625rem', border: 'none', backgroundColor: 'var(--surface-highlight)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', transition: 'all 0.15s', color: 'var(--text-primary)' }}
              title="Modo Escenario / Oscuro"
              className="print:hidden"
            >
              {isStageMode ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-stone-600" />}
              <span className="hidden sm:inline">{isStageMode ? 'Vigilia' : 'Alabastro'}</span>
            </button>
            <button 
              onClick={toggleChordNotation}
              style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.45rem 0.85rem', borderRadius: '0.625rem', border: 'none', backgroundColor: 'var(--surface-highlight)', cursor: 'pointer', transition: 'all 0.15s', color: 'var(--text-primary)' }}
              title="Cambiar cifrado"
              className="print:hidden"
            >
              Cifrado: <span style={{ color: 'var(--accent-color)', fontWeight: 700 }}>{chordNotation === 'american' ? 'Am' : 'Lat'}</span>
            </button>
            <AuthButton />
          </div>
        </div>
      </header>


      {/* Main Content — offset responsive */}
      <main className="app-layout-main">
        {children}
      </main>
    </div>
  );
}


function MainApp({ 
  songToEdit, 
  setSongToEdit, 
  chordNotation,
  liveSession,
  onOpenLiveModalWithPlaylist
}: { 
  songToEdit: Song | null, 
  setSongToEdit: (song: Song | null) => void, 
  chordNotation: 'american' | 'latin',
  liveSession: ReturnType<typeof useLiveSession>,
  onOpenLiveModalWithPlaylist: (playlist: Song[], massTitle?: string) => void
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { songs, saveSong, deleteSong } = useSongs();
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [activePlaylist, setActivePlaylist] = useState<Song[]>(() => {
    const saved = localStorage.getItem('activePlayPlaylist');
    return saved ? JSON.parse(saved) : [];
  });

  // Auto-join session when opening a ?live=VTxxxx URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const liveCode = params.get('live');
    if (!liveCode) return;
    const cleanCode = liveCode.trim().toUpperCase();
    if (cleanCode && cleanCode !== liveSession.sessionCode) {
      liveSession.joinLiveSession(cleanCode).then((data) => {
        if (data && data.playlist && data.playlist.length > 0) {
          setActivePlaylist(data.playlist);
          localStorage.setItem('activePlayPlaylist', JSON.stringify(data.playlist));
          navigate('/play', { replace: true });
        }
      });
    }
  }, [location.search, liveSession, navigate]);

  // Enlaces internos (lecturas, rosario) abren un canto concreto del repertorio
  const requestedSongId = (location.state as { songId?: string } | null)?.songId;
  useEffect(() => {
    if (location.pathname !== '/repertorio' || !requestedSongId) return;
    const song = songs.find(s => s.id === requestedSongId);
    if (!song) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedSong(song);
    navigate('/repertorio', { replace: true, state: null });
  }, [location.pathname, requestedSongId, songs, navigate]);

  const handlePlayMass = (playlist: Song[]) => {
    setActivePlaylist(playlist);
    localStorage.setItem('activePlayPlaylist', JSON.stringify(playlist));
    if (liveSession.isHost && liveSession.sessionCode) {
      liveSession.updateLiveState({
        playlist,
        currentIndex: 0,
        currentSongId: playlist[0]?.id || null,
        transpose: playlist[0]?.transpose || 0
      });
    }
    navigate('/play');
  };

  return (
    <Suspense fallback={<SectionFallback />}>
    <Routes>
      <Route path="/" element={<HomeView />} />
      <Route path="/repertorio" element={
        <div className="animate-in fade-in duration-300">
          <SongList 
            songs={songs} 
            selectedSong={selectedSong}
            onSelectSong={setSelectedSong}
            onEditSong={(song) => {
              setSongToEdit(song);
              navigate('/editor', { state: { from: location.pathname } });
            }}
            onPlaySong={(song) => {
              handlePlayMass([{ ...song, partAssigned: 'Individual' }]);
            }}
            onBroadcastSong={(song) => {
              const singlePlaylist = [{ ...song, partAssigned: 'Individual' }];
              setActivePlaylist(singlePlaylist);
              localStorage.setItem('activePlayPlaylist', JSON.stringify(singlePlaylist));
              onOpenLiveModalWithPlaylist(singlePlaylist, `Canto: ${song.title}`);
            }}
            onCreateSong={() => {
              setSongToEdit(null);
              navigate('/editor', { state: { from: location.pathname } });
            }}
            chordNotation={chordNotation}
          />
        </div>
      } />
      <Route path="/build" element={
        <div className="animate-in fade-in duration-300">
          <MassBuilder 
            songs={songs} 
            onPlayMass={handlePlayMass}
            onBroadcastMass={(playlist, massTitle) => {
              setActivePlaylist(playlist);
              localStorage.setItem('activePlayPlaylist', JSON.stringify(playlist));
              onOpenLiveModalWithPlaylist(playlist, massTitle);
            }}
            onCreateSong={() => {
              setSongToEdit(null);
              navigate('/editor', { state: { from: location.pathname } });
            }}
            onEditSong={(song) => {
              setSongToEdit(song);
              navigate('/editor', { state: { from: location.pathname } });
            }}
            onDeleteSong={deleteSong}
            chordNotation={chordNotation}
          />
        </div>
      } />
      <Route path="/play" element={
        <PlayMode 
          playlist={activePlaylist} 
          onExit={() => {
            localStorage.removeItem('activePlayPlaylist');
            setActivePlaylist([]);
            navigate('/build');
          }} 
          chordNotation={chordNotation}
          liveSession={{
            sessionCode: liveSession.sessionCode,
            sessionData: liveSession.sessionData,
            isHost: liveSession.isHost,
            onOpenLiveModal: () => onOpenLiveModalWithPlaylist(activePlaylist),
            onUpdateLiveState: liveSession.updateLiveState
          }}
        />
      } />
      <Route path="/schola" element={<Suspense fallback={<SectionFallback />}><ScholaCantorum songs={songs} /></Suspense>} />
      <Route path="/lecturas" element={<Suspense fallback={<SectionFallback />}><LecturasDelDia songs={songs} /></Suspense>} />
      <Route path="/liturgia" element={<Suspense fallback={<SectionFallback />}><LiturgiaHoras /></Suspense>} />
      <Route path="/partes-eucaristia" element={<div className="animate-in fade-in slide-in-from-bottom-4 duration-300"><PartesEucaristia /></div>} />
      <Route path="/calendario" element={<Suspense fallback={<SectionFallback />}><CalendarioLiturgico /></Suspense>} />
      <Route path="/sanjose" element={<Suspense fallback={<SectionFallback />}><SanJoseDevocion songs={songs} chordNotation={chordNotation} /></Suspense>} />
      <Route path="/rosario" element={<Suspense fallback={<SectionFallback />}><RosarioMariano songs={songs} chordNotation={chordNotation} /></Suspense>} />
      <Route path="/oracion" element={<div className="animate-in fade-in slide-in-from-bottom-4 duration-300"><Oracion /></div>} />
      <Route path="/acordes" element={
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          <ChordGlossary songs={songs} chordNotation={chordNotation} />
        </div>
      } />
      <Route path="/afinador" element={
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          <Tuner />
        </div>
      } />
      <Route path="/partituras" element={
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <SheetMusicGallery />
        </div>
      } />
      <Route path="/partituras/:id" element={
        <div className="animate-in fade-in slide-in-from-right-4 duration-350">
          <SheetMusicViewer chordNotation={chordNotation} />
        </div>
      } />
      <Route path="/secciones" element={
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Secciones />
        </div>
      } />
      <Route path="/tutorial" element={
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Tutorial />
        </div>
      } />
      <Route path="/editor" element={
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <SongEditor 
            initialSong={songToEdit}
            chordNotation={chordNotation}
            onSave={(song) => {
              saveSong(song);
              const target = location.state?.from || '/repertorio';
              navigate(target);
              if (target === '/repertorio') {
                setSelectedSong(song);
              }
              setSongToEdit(null);
            }} 
            onCancel={() => {
              const target = location.state?.from || '/repertorio';
              navigate(target);
              setSongToEdit(null);
            }} 
          />
        </div>
      } />
    </Routes>
    </Suspense>
  );
}

function AppShell({
  songToEdit,
  setSongToEdit,
  chordNotation,
  toggleChordNotation
}: {
  songToEdit: Song | null;
  setSongToEdit: (song: Song | null) => void;
  chordNotation: 'american' | 'latin';
  toggleChordNotation: () => void;
}) {
  const navigate = useNavigate();
  const liveSession = useLiveSession();
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
  const [modalPlaylist, setModalPlaylist] = useState<Song[]>(() => {
    const saved = localStorage.getItem('activePlayPlaylist');
    return saved ? JSON.parse(saved) : [];
  });
  const [modalMassTitle, setModalMassTitle] = useState('Celebración Eucarística');

  const handleOpenLiveModalWithPlaylist = (playlist?: Song[], massTitle?: string) => {
    if (playlist && playlist.length > 0) {
      setModalPlaylist(playlist);
    } else {
      const saved = localStorage.getItem('activePlayPlaylist');
      if (saved) {
        try {
          setModalPlaylist(JSON.parse(saved));
        } catch {
          // ignore
        }
      }
    }
    if (massTitle) {
      setModalMassTitle(massTitle);
    }
    setIsLiveModalOpen(true);
  };

  return (
    <Layout 
      setSongToEdit={setSongToEdit} 
      chordNotation={chordNotation} 
      toggleChordNotation={toggleChordNotation}
      sessionCode={liveSession.sessionCode}
      isHost={liveSession.isHost}
      onOpenLiveModal={() => handleOpenLiveModalWithPlaylist()}
    >
      <MainApp 
        songToEdit={songToEdit} 
        setSongToEdit={setSongToEdit} 
        chordNotation={chordNotation}
        liveSession={liveSession}
        onOpenLiveModalWithPlaylist={handleOpenLiveModalWithPlaylist}
      />
      <LiveSessionModal
        isOpen={isLiveModalOpen}
        onClose={() => setIsLiveModalOpen(false)}
        sessionCode={liveSession.sessionCode}
        sessionData={liveSession.sessionData}
        isHost={liveSession.isHost}
        isLoading={liveSession.isLoading}
        error={liveSession.error}
        defaultPlaylist={modalPlaylist}
        defaultMassTitle={modalMassTitle}
        onStartSession={liveSession.startLiveSession}
        onJoinSession={liveSession.joinLiveSession}
        onLeaveOrEnd={liveSession.leaveOrEndSession}
        onGoToPlayMode={(playlist) => {
          localStorage.setItem('activePlayPlaylist', JSON.stringify(playlist));
          navigate('/play');
        }}
      />
    </Layout>
  );
}

function App() {
  const [songToEdit, setSongToEdit] = useState<Song | null>(null);
  const [chordNotation, setChordNotation] = useState<'american' | 'latin'>(() => {
    const saved = localStorage.getItem('chordNotation');
    return (saved === 'latin' || saved === 'american') ? saved : 'american';
  });

  const toggleChordNotation = () => {
    const next = chordNotation === 'american' ? 'latin' : 'american';
    setChordNotation(next);
    localStorage.setItem('chordNotation', next);
  };

  return (
    <BrowserRouter>
      <AppShell
        songToEdit={songToEdit}
        setSongToEdit={setSongToEdit}
        chordNotation={chordNotation}
        toggleChordNotation={toggleChordNotation}
      />
    </BrowserRouter>
  );
}

export default App;

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, X, Play, Save, FolderOpen, CheckSquare, Square, GripVertical, Printer, Edit3, Trash2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Check, HelpCircle, ListMusic, Share2, QrCode, Copy, Radio } from 'lucide-react';
import { parseSongContent, formatChord, detectSongKey, transposeChord } from '../utils/musicTheory';
import { SongViewer } from './SongViewer';
import { ChordDiagram } from './ChordDiagram';
import { SectionLayout } from './SectionLayout';
import { LiturgicalCalendarPicker, formatLiturgicalDate } from './LiturgicalCalendarPicker';
import { SavedMassesCalendar } from './SavedMassesCalendar';
import { getLiturgicalDay, todayIso } from '../utils/liturgicalCalendar';
import { parseSpanishDate, isDateId, getMassDateIso, getMassName, nextFreeDateId, isoToLocalDate } from '../utils/massDates';
import { auth, db, googleProvider } from '../firebase';
import { onAuthStateChanged, signInWithPopup } from 'firebase/auth';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { DoorOpen, Heart, Sun, BookOpen, Sparkles, Gift, Bell, Flame, Wine, Music, Search, Users, Shield, Globe, Lock, Minus, CloudOff, LogIn, AlertCircle, RefreshCw } from 'lucide-react';


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

const DEFAULT_MASS_PARTS = [
  'Entrada',
  'Piedad',
  'Gloria',
  'Salmo',
  'Aleluya',
  'Ofertorio',
  'Santo',
  'Cordero',
  'Comunión',
  'Salida'
];

const MASS_TEMPLATES = [
  { id: 'dominical', name: 'Misa Dominical Ordinaria', parts: ['Entrada', 'Piedad', 'Gloria', 'Salmo', 'Aleluya', 'Ofertorio', 'Santo', 'Cordero', 'Comunión', 'Salida'] },
  { id: 'difuntos', name: 'Misa de Difuntos (Réquiem)', parts: ['Entrada', 'Piedad', 'Salmo', 'Aleluya', 'Ofertorio', 'Santo', 'Cordero', 'Comunión', 'Despedida/Salida'] },
  { id: 'matrimonio', name: 'Misa de Matrimonio', parts: ['Entrada Nupcial', 'Piedad', 'Gloria', 'Aleluya', 'Ofertorio', 'Santo', 'Cordero', 'Comunión', 'Salida'] },
  { id: 'comunion', name: 'Primera Comunión', parts: ['Entrada', 'Piedad', 'Gloria', 'Aleluya', 'Ofertorio', 'Santo', 'Cordero', 'Comunión', 'Acción de Gracias', 'Salida'] },
  { id: 'sanacion', name: 'Misa de Sanación (Carismática)', parts: ['Alabanza/Entrada', 'Piedad', 'Aleluya', 'Ofertorio', 'Santo', 'Cordero', 'Adoración/Comunión', 'Salida/Alabanza'] }
];

interface LiturgicalSeasonInfo {
  id: string;
  name: string;
  colorName: string;
  defaultQuote: string;
}

const LITURGICAL_SEASONS: LiturgicalSeasonInfo[] = [
  {
    id: 'ordinario',
    name: 'Tiempo Ordinario',
    colorName: 'Verde',
    defaultQuote: '«Canten al Señor un cántico nuevo, cante al Señor toda la tierra.» — Salmo 95'
  },
  {
    id: 'adviento',
    name: 'Tiempo de Adviento',
    colorName: 'Morado',
    defaultQuote: '«Una voz clama en el desierto: Preparad el camino del Señor.» — Isaías 40, 3'
  },
  {
    id: 'navidad',
    name: 'Tiempo de Navidad y Epifanía',
    colorName: 'Blanco',
    defaultQuote: '«Gloria a Dios en las alturas y en la tierra paz a los hombres de buena voluntad.» — Lucas 2, 14'
  },
  {
    id: 'cuaresma',
    name: 'Tiempo de Cuaresma',
    colorName: 'Morado',
    defaultQuote: '«Misericordia, Dios mío, por tu bondad; por tu inmensa compasión borra mi culpa.» — Salmo 50'
  },
  {
    id: 'semana-santa',
    name: 'Semana Santa y Triduo Pascual',
    colorName: 'Rojo',
    defaultQuote: '«Nadie tiene mayor amor que este: dar la vida por sus amigos.» — Juan 15, 13'
  },
  {
    id: 'pascua',
    name: 'Tiempo Pascual (Pascua de Resurrección)',
    colorName: 'Blanco',
    defaultQuote: '«¡Este es el día que hizo el Señor; alegrémonos y regocijémonos en él!» — Salmo 117'
  },
  {
    id: 'pentecostes',
    name: 'Solemnidad de Pentecostés',
    colorName: 'Rojo',
    defaultQuote: '«Envía tu Espíritu, Señor, y renueva la faz de la tierra.» — Salmo 103'
  },
  {
    id: 'solemnidad',
    name: 'Fiestas y Solemnidades del Señor',
    colorName: 'Blanco',
    defaultQuote: '«El que canta, ora dos veces en la presencia divina.» — San Agustín'
  },
  {
    id: 'mariana',
    name: 'Fiestas de la Santísima Virgen María',
    colorName: 'Blanco / Azul',
    defaultQuote: '«Proclama mi alma la grandeza del Señor, se alegra mi espíritu en Dios mi Salvador.» — Lucas 1, 46-47'
  },
  {
    id: 'difuntos',
    name: 'Misa de Difuntos (Réquiem)',
    colorName: 'Morado / Negro',
    defaultQuote: '«Yo soy la resurrección y la vida; el que cree en mí, vivirá para siempre.» — Juan 11, 25'
  }
];

const MEDITATION_QUOTES = [
  "«Canten al Señor un cántico nuevo, cante al Señor toda la tierra.» — Salmo 95",
  "«El que canta, ora dos veces en la presencia divina.» — San Agustín",
  "«La nota más importante para Dios es el silencio sagrado.»",
  "«Cantar es propio del que ama con espíritu puro.» — San Agustín",
  "«Donde las palabras humanas fallan, la salmodia sacra habla.»"
];

// Firestore no admite "/" en el ID de un documento (una fecha como 16/08/2026 rompía el guardado):
// se usa la barra de división ∕, que se ve igual en la lista de celebraciones.
function massDocId(name: string): string {
  const id = name.trim().replace(/\//g, '\u2215');
  return id === '.' || id === '..' ? `${id}_` : id;
}

// ID de la copia publicada en la comunidad (misma fórmula de siempre: usuario + ID de la celebración)
function publicMassDocId(uid: string, massId: string): string {
  return `${uid}_${massId.replace(/\s+/g, '_')}`;
}

interface MassPart {
  id: string;
  name: string;
  isIncluded: boolean;
  song: Song | null;
  transpose?: number;
}

function getPartIcon(name: string) {
  const clean = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (clean.includes('entrada')) return <DoorOpen size={16} className="text-red-500 shrink-0" />;
  if (clean.includes('piedad')) return <Heart size={16} className="text-red-500 shrink-0" fill="#ef4444" />;
  if (clean.includes('gloria')) return <Sun size={16} className="text-amber-500 shrink-0" fill="#f59e0b" />;
  if (clean.includes('salmo')) return <BookOpen size={16} className="text-emerald-500 shrink-0" />;
  if (clean.includes('aleluya')) return <Sparkles size={16} className="text-yellow-500 shrink-0" fill="#eab308" />;
  if (clean.includes('ofertorio')) return <Gift size={16} className="text-indigo-500 shrink-0" />;
  if (clean.includes('santo')) return <Bell size={16} className="text-amber-600 shrink-0" fill="#d97706" />;
  if (clean.includes('cordero')) return <Flame size={16} className="text-red-600 shrink-0" fill="#dc2626" />;
  if (clean.includes('comunion')) return <Wine size={16} className="text-rose-500 shrink-0" />;
  if (clean.includes('salida') || clean.includes('despedida')) return <DoorOpen size={16} className="text-stone-500 shrink-0" />;
  return <Music size={16} className="text-stone-400 shrink-0" />;
}

interface MassBuilderProps {
  songs: Song[];
  onPlayMass: (playlist: Song[]) => void;
  onBroadcastMass?: (playlist: Song[], massTitle?: string) => void;
  onCreateSong?: () => void;
  onEditSong?: (song: Song) => void;
  onDeleteSong?: (id: string) => void;
  chordNotation: 'american' | 'latin';
}

export function MassBuilder({ songs, onPlayMass, onBroadcastMass, onCreateSong, onEditSong, onDeleteSong, chordNotation }: MassBuilderProps) {
  const [imgError, setImgError] = useState(false);
  const getDraft = () => {
    const saved = localStorage.getItem('massBuilderDraft');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  };
  const draft = getDraft();

  const [expandedParts, setExpandedParts] = useState<string[]>([]);

  // Playlist state is now an array of parts
  const [playlist, setPlaylist] = useState<MassPart[]>(() =>
    draft?.playlist || DEFAULT_MASS_PARTS.map((part, idx) => ({
      id: `default-part-${idx}`,
      name: part,
      isIncluded: true,
      song: null
    }))
  );
  
  const [selectingForId, setSelectingForId] = useState<string | null>(null);
  const [previewSong, setPreviewSong] = useState<Song | null>(null);
  const [saveName, setSaveName] = useState(draft?.saveName || '');
  // ID de la celebración guardada que está abierta (null = borrador nuevo o plantilla)
  const [loadedId, setLoadedId] = useState<string | null>(draft?.loadedId || null);

  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const [savedMasses, setSavedMasses] = useState<Record<string, MassPart[]>>({});
  const [publicMasses, setPublicMasses] = useState<Record<string, unknown>>({});
  const [showSaved, setShowSaved] = useState(false);
  const [activeSavedTab, setActiveSavedTab] = useState<'my-masses' | 'community'>('my-masses');
  const [newPartName, setNewPartName] = useState('');
  const [showAddPart, setShowAddPart] = useState(false);
  const [songSearchTerm, setSongSearchTerm] = useState('');

  // Estados de configuración de presentación de PDF
  const [printTitle, setPrintTitle] = useState(draft?.printTitle || '');
  const [printDate, setPrintDate] = useState(() => {
    if (draft?.printDate) return draft.printDate;
    const today = new Date();
    return today.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  });
  const [printReason, setPrintReason] = useState(draft?.printReason || '');
  const [printGroup, setPrintGroup] = useState(draft?.printGroup || '');
  const [printLayout, setPrintLayout] = useState<'portrait-1' | 'portrait-2' | 'portrait-3' | 'landscape-2' | 'landscape-3'>(draft?.printLayout || 'portrait-2');
  const [printTarget, setPrintTarget] = useState<'musician' | 'congregation'>(draft?.printTarget || 'musician');
  const [printQuote, setPrintQuote] = useState(draft?.printQuote || 'El que canta ora dos veces. — San Agustín');
  const [printChords, setPrintChords] = useState<'none' | 'guitar' | 'piano'>(draft?.printChords || 'none');

  // Autoguardado
  useEffect(() => {
    const draftData = {
      playlist,
      saveName,
      loadedId,
      printTitle,
      printDate,
      printReason,
      printGroup,
      printLayout,
      printTarget,
      printQuote,
      printChords
    };
    localStorage.setItem('massBuilderDraft', JSON.stringify(draftData));
  }, [playlist, saveName, loadedId, printTitle, printDate, printReason, printGroup, printLayout, printTarget, printQuote, printChords]);

  const handleClearDraft = () => {
    if (!window.confirm('¿Estás seguro de querer limpiar todo el borrador actual y empezar de cero?')) return;
    setPlaylist(DEFAULT_MASS_PARTS.map((part, idx) => ({
      id: `default-part-${idx}`,
      name: part,
      isIncluded: true,
      song: null
    })));
    setSaveName('');
    setLoadedId(null);
    setPrintTitle('');
    setPrintReason('');
    setPrintGroup('');
    setPrintLayout('portrait-2');
    setPrintTarget('musician');
    setPrintChords('none');
    localStorage.removeItem('massBuilderDraft');
  };

  // Drag and drop state
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState<string | null>(null);

  const [user, setUser] = useState(auth.currentUser);
  const [isMigrating, setIsMigrating] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribeAuth();
  }, []);

  const handleQuickLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error al iniciar sesión con Google:', error);
      alert('No se pudo iniciar sesión con Google. Por favor, intenta de nuevo.');
    }
  };

  // Load saved masses on mount or when user changes
  useEffect(() => {
    if (user) {
      // 1. Migración automática de cualquier misa guardada en local mientras no había sesión
      const localSaved = localStorage.getItem('savedMasses');
      if (localSaved) {
        try {
          const parsed = JSON.parse(localSaved);
          const massKeys = Object.keys(parsed);
          if (massKeys.length > 0) {
            setIsMigrating(true);
            Promise.all(
              massKeys.map(async (name) => {
                const data = parsed[name];
                if (data) {
                  await setDoc(doc(db, 'users', user.uid, 'savedMasses', massDocId(name)), data, { merge: true });
                }
              })
            ).then(() => {
              localStorage.removeItem('savedMasses');
              setIsMigrating(false);
            }).catch((err) => {
              console.error('[Vox Templi] Error migrando celebraciones locales a Firestore:', err);
              setIsMigrating(false);
            });
          }
        } catch (e) {
          console.error('[Vox Templi] Error al parsear savedMasses local:', e);
        }
      }

      // 2. Sincronizar en tiempo real desde Firestore
      const userMassesCol = collection(db, 'users', user.uid, 'savedMasses');
      const unsubscribeSnapshot = onSnapshot(userMassesCol, (snapshot) => {
        const firestoreMasses: any = {};
        snapshot.forEach((doc) => {
          firestoreMasses[doc.id] = doc.data();
        });
        setSavedMasses(firestoreMasses);
      }, (error) => {
        console.error("Error al escuchar misas de Firestore:", error);
      });

      return () => unsubscribeSnapshot();
    } else {
      // Cargar localmente si no está autenticado
      const saved = localStorage.getItem('savedMasses');
      if (saved) {
        try {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setSavedMasses(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse saved masses', e);
        }
      } else {
        setSavedMasses({});
      }
    }
  }, [user]);

  // Load public masses
  useEffect(() => {
    const publicMassesCol = collection(db, 'publicMasses');
    const q = query(publicMassesCol, orderBy('createdAt', 'desc'));
    const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
      const publicMassesData: Record<string, unknown> = {};
      snapshot.forEach((doc) => {
        publicMassesData[doc.id] = doc.data();
      });
      setPublicMasses(publicMassesData);
    }, (error) => {
      console.error("Error al escuchar misas públicas de Firestore:", error);
    });

    return () => unsubscribeSnapshot();
  }, []);

  const handleSelectSong = (song: Song) => {
    if (selectingForId) {
      setPlaylist(prev => prev.map(p => 
        p.id === selectingForId ? { ...p, song } : p
      ));
      setSelectingForId(null);
      setPreviewSong(null);
      setSongSearchTerm('');
    }
  };

  const togglePartIncluded = (id: string) => {
    setPlaylist(prev => prev.map(p => 
      p.id === id ? { ...p, isIncluded: !p.isIncluded } : p
    ));
  };

  const removeSongFromPart = (id: string) => {
    setPlaylist(prev => prev.map(p => 
      p.id === id ? { ...p, song: null } : p
    ));
  };

  const addNewPart = () => {
    if (!newPartName.trim()) return;
    setPlaylist(prev => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        name: newPartName.trim(),
        isIncluded: true,
        song: null
      }
    ]);
    setNewPartName('');
    setShowAddPart(false);
  };

  const removePart = (id: string) => {
    setPlaylist(prev => prev.filter(p => p.id !== id));
  };

  const getPlaylistArray = (): Song[] => {
    return playlist
      .filter(p => p.isIncluded && p.song && p.song.id)
      .map(p => ({ 
        ...p.song!, 
        partAssigned: p.name,
        transpose: p.transpose || 0 
      }));
  };

  const isReadyToPlay = getPlaylistArray().length > 0;

  // La fecha de la celebración sale del campo "Fecha Litúrgica"; es el ID con el que se guarda
  const massDateIso = parseSpanishDate(printDate) ?? todayIso();

  const handleSave = async () => {
    if (!isReadyToPlay) return;
    const dateIso = massDateIso;
    const massName = saveName.trim() || printTitle.trim() || getLiturgicalDay(dateIso).title;
    const dateLabel = formatLiturgicalDate(isoToLocalDate(dateIso));
    const sameName = (id: string) => getMassName(id, savedMasses[id]).trim().toLowerCase() === massName.toLowerCase();

    // ¿Ya hay una celebración con ese nombre en esa fecha? Se reemplaza; si no, se crea con el siguiente ID libre del día
    const existingId = Object.keys(savedMasses).find(id => isDateId(id) && id.slice(0, 10) === dateIso && sameName(id));
    if (existingId && existingId !== loadedId) {
      const confirmOverwrite = window.confirm(`Ya existe "${massName}" el ${dateLabel}. ¿Deseas reemplazarla con los cambios actuales?`);
      if (!confirmOverwrite) return;
    }
    const targetId = existingId ?? nextFreeDateId(dateIso, Object.keys(savedMasses));

    // Una celebración antigua (su ID era el nombre) pasa al ID por fecha al volver a guardarla
    const legacyId = loadedId && loadedId !== targetId && !isDateId(loadedId) && savedMasses[loadedId]
      && getMassDateIso(loadedId, savedMasses[loadedId]) === dateIso && sameName(loadedId)
      ? loadedId
      : null;
    const previous = (savedMasses[existingId ?? legacyId ?? ''] ?? null) as { isPublic?: boolean } | null;
    const keepPublic = !!user && !!previous?.isPublic;

    // Guardar la lista de reproducción junto con los metadatos de presentación
    const newMassData = {
      playlist,
      metadata: {
        name: massName,
        dateIso,
        title: printTitle || massName,
        date: printDate,
        reason: printReason,
        group: printGroup,
        columns: printLayout === 'portrait-1' ? '1' : '2', // Guardar como columns para retrocompatibilidad
        printLayout,
        printTarget,
        quote: printQuote,
        printChords
      },
      ...(keepPublic ? { isPublic: true } : {})
    };

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'savedMasses', targetId), newMassData);
        if (keepPublic) {
          // Si ya estaba publicada, la copia de la comunidad se actualiza con los cambios
          await setDoc(doc(db, 'publicMasses', publicMassDocId(user.uid, targetId)), {
            ...newMassData,
            userId: user.uid,
            authorName: user.displayName || user.email || 'Músico Anónimo',
            createdAt: serverTimestamp()
          });
        }
        if (legacyId) {
          await deleteDoc(doc(db, 'users', user.uid, 'savedMasses', legacyId));
          await deleteDoc(doc(db, 'publicMasses', publicMassDocId(user.uid, legacyId))).catch(() => {});
        }
        setLoadedId(targetId);
        alert(`¡Celebración guardada en la nube!\n\n${dateLabel}\nID: ${targetId}`);
      } catch (error) {
        console.error("Error al guardar celebración en Firestore:", error);
        alert("Error al guardar en la nube. Inténtalo de nuevo.");
      }
    } else {
      const newSavedMasses = { ...savedMasses, [targetId]: newMassData as unknown as MassPart[] };
      if (legacyId) delete newSavedMasses[legacyId];
      setSavedMasses(newSavedMasses);
      localStorage.setItem('savedMasses', JSON.stringify(newSavedMasses));
      setLoadedId(targetId);
      const shouldLogin = window.confirm(
        `¡Celebración guardada en este equipo!\n${dateLabel} · ID: ${targetId}\n\n` +
        '⚠️ ATENCIÓN: Como no has iniciado sesión con Google, esta celebración se guardó únicamente en este navegador y NO aparecerá en tus otros dispositivos (iPad, celular).\n\n' +
        '¿Deseas iniciar sesión con Google ahora para sincronizarla en la nube?'
      );
      if (shouldLogin) {
        try {
          await signInWithPopup(auth, googleProvider);
        } catch (e) {
          console.error('Error al iniciar sesión:', e);
        }
      }
    }
  };

  const handlePrint = () => {
    const pdfName = saveName.trim() || 'Guia_Eucaristia';
    const originalTitle = document.title;
    document.title = pdfName;
    setTimeout(() => {
      window.print();
      document.title = originalTitle;
    }, 100);
  };

  const handleLoad = (name: string, overrideData?: any) => {
    const data = overrideData || savedMasses[name];
    // Una misa de la comunidad se abre como plantilla: no queda ligada a ninguna guardada
    const isOwnSaved = !overrideData;
    if (Array.isArray(data)) {
      // Retrocompatibilidad con el formato antiguo (solo arreglo de partes)
      setPlaylist(data);
      setPrintTitle(name);
      setPrintReason('');
      setPrintGroup('');
      setPrintLayout('portrait-2');
    } else if (data) {
      // Formato estructurado nuevo
      const saved = data as any;
      setPlaylist((saved.playlist as MassPart[]) || []);
      setPrintTitle(saved.metadata?.title || name);
      setPrintDate(saved.metadata?.date || '');
      setPrintReason(saved.metadata?.reason || '');
      setPrintGroup(saved.metadata?.group || '');
      
      // Retrocompatibilidad para printLayout
      const loadedLayout = saved.metadata?.printLayout || 
                            (saved.metadata?.columns === '1' ? 'portrait-1' : 'portrait-2');
      setPrintLayout(loadedLayout);
      
      // Retrocompatibilidad para printTarget
      setPrintTarget(saved.metadata?.printTarget || 'musician');

      setPrintQuote(saved.metadata?.quote || '');
      setPrintChords(saved.metadata?.printChords || 'none');
    }
    if (isOwnSaved) {
      // La fecha del calendario manda: si los datos traían otra (o ninguna), se corrige el campo de fecha
      const dateIso = getMassDateIso(name, data);
      const savedDate = Array.isArray(data) ? undefined : (data as { metadata?: { date?: string } } | null)?.metadata?.date;
      if (dateIso && parseSpanishDate(savedDate) !== dateIso) {
        setPrintDate(formatLiturgicalDate(isoToLocalDate(dateIso)));
      }
      setSaveName(getMassName(name, data));
      setLoadedId(name);
    } else {
      setSaveName(name);
      setLoadedId(null);
    }
    setShowSaved(false);
  };

  // Desde el calendario de guardadas: volver al armador con esa fecha puesta
  const handleNewForDate = (dateIso: string) => {
    setPrintDate(formatLiturgicalDate(isoToLocalDate(dateIso)));
    setLoadedId(null);
    setShowSaved(false);
  };

  const deleteSavedMass = async (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const label = isDateId(name) ? `${getMassName(name, savedMasses[name])} (${name})` : name;
    if (!window.confirm(`¿Estás seguro de eliminar la celebración "${label}"?`)) return;
    if (loadedId === name) setLoadedId(null);
    
    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'savedMasses', name));
        // Remove from public as well if it existed
        const publicMassId = publicMassDocId(user.uid, name);
        await deleteDoc(doc(db, 'publicMasses', publicMassId)).catch(() => {});
      } catch (error) {
        console.error("Error deleting from Firestore", error);
      }
    } else {
      const newSaved = { ...savedMasses };
      delete newSaved[name];
      setSavedMasses(newSaved);
      localStorage.setItem('savedMasses', JSON.stringify(newSaved));
    }
  };

  const togglePublicStatus = async (massName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      alert("Debes iniciar sesión para publicar en la comunidad.");
      return;
    }
    const currentData = savedMasses[massName] as any;
    if (!currentData) return;
    
    const isCurrentlyPublic = !!currentData.isPublic;
    const publicMassId = publicMassDocId(user.uid, massName);
    
    try {
      if (isCurrentlyPublic) {
        // Despublicar
        await deleteDoc(doc(db, 'publicMasses', publicMassId));
        const updatedData = { ...currentData, isPublic: false };
        await setDoc(doc(db, 'users', user.uid, 'savedMasses', massName), updatedData);
      } else {
        // Publicar
        const publicData = {
          ...currentData,
          userId: user.uid,
          authorName: user.displayName || user.email || 'Músico Anónimo',
          isPublic: true,
          createdAt: serverTimestamp()
        };
        await setDoc(doc(db, 'publicMasses', publicMassId), publicData);
        
        const updatedData = { ...currentData, isPublic: true };
        await setDoc(doc(db, 'users', user.uid, 'savedMasses', massName), updatedData);
      }
    } catch (error) {
      console.error("Error toggling public status:", error);
      alert("Hubo un error al cambiar el estado público.");
    }
  };

  const loadTemplate = (templateId: string) => {
    setSaveName('');
    setLoadedId(null);
    setPrintTitle('');
    setPrintReason('');
    setPrintGroup('');
    setPrintLayout('portrait-2');
    setPrintTarget('musician');
    setPrintChords('none');
    
    if (templateId === 'custom') {
      setPlaylist(DEFAULT_MASS_PARTS.map(part => ({
        id: Math.random().toString(36).substr(2, 9),
        name: part,
        isIncluded: true,
        song: null
      })));
    } else {
      const t = MASS_TEMPLATES.find(t => t.id === templateId);
      if (t) {
        setPlaylist(t.parts.map(part => ({
          id: Math.random().toString(36).substr(2, 9),
          name: part,
          isIncluded: true,
          song: null
        })));
      }
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number, id: string) => {
    dragItem.current = position;
    setIsDragging(id);
    // Needed for Firefox
    e.dataTransfer.effectAllowed = 'move';
    // Firefox requires some data to be set
    e.dataTransfer.setData('text/html', ''); 
    
    // Slight delay to make the original item look ghosted but drag image stays normal
    setTimeout(() => {
      if (e.target instanceof HTMLElement) {
        e.target.style.opacity = '0.5';
      }
    }, 0);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    e.preventDefault();
    dragOverItem.current = position;
    
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
      // Reorder items immediately for a smooth experience
      const newList = [...playlist];
      const draggedItemContent = newList[dragItem.current];
      newList.splice(dragItem.current, 1);
      newList.splice(dragOverItem.current, 0, draggedItemContent);
      dragItem.current = dragOverItem.current; // update dragged position
      setPlaylist(newList);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragging(null);
    dragItem.current = null;
    dragOverItem.current = null;
    if (e.target instanceof HTMLElement) {
      e.target.style.opacity = '1';
    }
  };

  // View: Selecting a song for a part
  return (
    <SectionLayout
      title="Ordo Missae — Diseña tu Eucaristía"
      description="Arma la estructura canónica de la Santa Misa paso a paso, organiza tus cantos y genera códices en PDF."
      badge="Ordo Missae"
      icon={<ListMusic size={24} className="text-blue-600" />}
      imageSrc="/imagenes/disena_eucaristia.webp"
      colorTheme="blue"
      hideBanner={!!selectingForId || showSaved}
    >
      {(() => {
        if (selectingForId) {
    const partName = playlist.find(p => p.id === selectingForId)?.name || '';
    const suggestedSongs = songs.filter(s => s.type.toLowerCase().includes(partName.toLowerCase()) || partName.toLowerCase().includes(s.type.toLowerCase()));
    const otherSongs = songs.filter(s => !(s.type.toLowerCase().includes(partName.toLowerCase()) || partName.toLowerCase().includes(s.type.toLowerCase())));
    
    const normalizeStr = (str: string) => 
      str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    const searchTermNormalized = normalizeStr(songSearchTerm);
    
    const filteredSuggested = suggestedSongs.filter(s => 
      normalizeStr(s.title).includes(searchTermNormalized)
    );
    const filteredOther = otherSongs.filter(s => 
      normalizeStr(s.title).includes(searchTermNormalized)
    );
    const browseSongs = [...filteredSuggested, ...filteredOther];

    if (previewSong) {
      const idx = browseSongs.findIndex(s => s.id === previewSong.id);
      return (
        <div className="card animate-in fade-in duration-200">
          <div className="flex justify-between items-center mb-6 gap-2 flex-wrap">
            <button className="btn flex items-center gap-1.5" onClick={() => setPreviewSong(null)}>
              <ChevronLeft size={18} /> Volver a la lista
            </button>
            
            <div className="flex items-center gap-2">
              <button 
                className="btn flex items-center gap-1.5" 
                disabled={idx <= 0}
                onClick={() => setPreviewSong(browseSongs[idx - 1])}
                title="Canto anterior"
              >
                <ChevronLeft size={18} /> Anterior
              </button>
              <span className="flex items-center px-2 text-stone-500 text-sm font-medium">
                {idx + 1} de {browseSongs.length}
              </span>
              <button 
                className="btn flex items-center gap-1.5" 
                disabled={idx === -1 || idx >= browseSongs.length - 1}
                onClick={() => setPreviewSong(browseSongs[idx + 1])}
                title="Canto siguiente"
              >
                Siguiente <ChevronRight size={18} />
              </button>
            </div>
            
            <button 
              className="btn btn-primary flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-lg transition-all shadow-md shadow-emerald-100 hover:shadow-emerald-200" 
              onClick={() => handleSelectSong(previewSong)}
            >
              <Check size={18} /> Aceptar / Seleccionar
            </button>
          </div>
          
          <div className="border border-stone-200 rounded-xl p-4 bg-stone-50">
            <SongViewer 
              id={previewSong.id}
              title={previewSong.title}
              content={previewSong.content}
              type={previewSong.type}
              sheetMusic={previewSong.sheetMusic}
              hidePracticeStudio={true}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="card animate-in fade-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="m-0">Seleccionar canto para: <span className="text-red-500">{partName}</span></h2>
          <button className="btn" onClick={() => { setSelectingForId(null); setPreviewSong(null); setSongSearchTerm(''); }}>
            <X size={18} /> Cancelar
          </button>
        </div>

        {/* Buscador de Canciones */}
        <div className="mb-6 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2.5 pl-10 pr-4 text-stone-800 focus:outline-none focus:border-red-400 shadow-sm text-sm"
            placeholder="Buscar cantos por nombre..."
            value={songSearchTerm}
            onChange={(e) => setSongSearchTerm(e.target.value)}
          />
        </div>
        
        {filteredSuggested.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm text-stone-500 mb-3 uppercase tracking-wider">Sugeridos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredSuggested.map(song => (
                <div 
                  key={song.id} 
                  className="bg-white p-3 rounded-lg hover:bg-stone-100 border border-stone-200 transition-colors flex justify-between items-center group cursor-pointer"
                  onClick={() => setPreviewSong(song)}
                >
                  <div className="truncate pr-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="song-num-badge">#{String(song.id).padStart(3, '0')}</span>
                      <span className="font-medium text-stone-800 truncate">{song.title}</span>
                      {(() => {
                        const displayKey = song.key || (detectSongKey(song.content) ? formatChord(detectSongKey(song.content)!, chordNotation) : '');
                        if (!displayKey) return null;
                        return (
                          <span className="text-[9px] font-bold font-mono px-1 py-0.5 rounded bg-stone-100 text-red-600 border border-stone-200 shadow-sm whitespace-nowrap">
                            {displayKey}
                          </span>
                        );
                      })()}
                      {song.userId && song.isPublic && (
                        <span className="text-[9px] font-semibold px-1 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm whitespace-nowrap">
                          Pub
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-stone-400 font-medium">{song.type}</div>
                  </div>
                  <button 
                    className="btn btn-sm bg-red-50 text-red-600 hover:bg-red-500 hover:text-white px-2.5 py-1 text-xs font-bold rounded transition-colors shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectSong(song);
                    }}
                  >
                    Seleccionar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {filteredOther.length > 0 && (
          <div>
            <h3 className="text-sm text-stone-500 mb-3 uppercase tracking-wider">Todos los cantos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredOther.map(song => (
                <div 
                  key={song.id} 
                  className="bg-white p-3 rounded-lg hover:bg-stone-100 border border-stone-200 transition-colors flex justify-between items-center group cursor-pointer"
                  onClick={() => setPreviewSong(song)}
                >
                  <div className="truncate pr-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="song-num-badge">#{String(song.id).padStart(3, '0')}</span>
                      <span className="font-medium text-stone-800 truncate">{song.title}</span>
                      {(() => {
                        const displayKey = song.key || (detectSongKey(song.content) ? formatChord(detectSongKey(song.content)!, chordNotation) : '');
                        if (!displayKey) return null;
                        return (
                          <span className="text-[9px] font-bold font-mono px-1 py-0.5 rounded bg-stone-100 text-red-600 border border-stone-200 shadow-sm whitespace-nowrap">
                            {displayKey}
                          </span>
                        );
                      })()}
                      {song.userId && song.isPublic && (
                        <span className="text-[9px] font-semibold px-1 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm whitespace-nowrap">
                          Pub
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-stone-400 font-medium">{song.type}</div>
                  </div>
                  <button 
                    className="btn btn-sm bg-red-50 text-red-600 hover:bg-red-500 hover:text-white px-2.5 py-1 text-xs font-bold rounded transition-colors shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectSong(song);
                    }}
                  >
                    Seleccionar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {filteredSuggested.length === 0 && filteredOther.length === 0 && (
          <div className="text-center py-10 text-stone-500 bg-stone-50 rounded-xl border border-dashed border-stone-200">
            No se encontraron cantos que coincidan con la búsqueda.
          </div>
        )}
      </div>
    );
  }

  // View: Saved Masses
  if (showSaved) {
    const publicKeys = Object.keys(publicMasses);
    return (
      <div className="card animate-in fade-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2>Celebraciones Guardadas</h2>
          <button className="btn" onClick={() => setShowSaved(false)}>
            <X size={18} /> Cerrar
          </button>
        </div>

        <div className="flex gap-4 border-b border-stone-200 mb-4 pb-2">
          <button
            className={`font-semibold ${activeSavedTab === 'my-masses' ? 'text-red-600 border-b-2 border-red-600' : 'text-stone-500'}`}
            onClick={() => setActiveSavedTab('my-masses')}
          >
            Mis Eucaristías
          </button>
          <button
            className={`font-semibold flex items-center gap-1 ${activeSavedTab === 'community' ? 'text-red-600 border-b-2 border-red-600' : 'text-stone-500'}`}
            onClick={() => setActiveSavedTab('community')}
          >
            <Users size={16} /> Comunidad
          </button>
        </div>

        {!user && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-600 shrink-0" />
              <span>Estás viendo únicamente las celebraciones guardadas en este navegador. Para acceder a todas tus celebraciones sincronizadas en la nube, inicia sesión con Google.</span>
            </div>
            <button
              onClick={handleQuickLogin}
              className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn size={13} /> Iniciar Sesión
            </button>
          </div>
        )}

        {activeSavedTab === 'my-masses' ? (
          <SavedMassesCalendar
            masses={savedMasses}
            canPublish={!!user}
            onLoad={(id) => handleLoad(id)}
            onDelete={deleteSavedMass}
            onTogglePublic={togglePublicStatus}
            onNewForDate={handleNewForDate}
          />
        ) : (
          publicKeys.length === 0 ? (
            <div className="text-stone-500 text-center py-8">No hay misas públicas en la comunidad todavía.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {publicKeys.map(key => {
                const pMass: any = publicMasses[key];
                return (
                  <div key={key} className="bg-white p-4 rounded-lg flex justify-between items-center cursor-pointer hover:bg-stone-100 border border-stone-200" onClick={() => handleLoad(pMass.metadata?.title || key, pMass)}>
                    <div>
                      <div className="font-semibold text-lg">{pMass.metadata?.title || 'Misa Pública'}</div>
                      <div className="text-xs text-stone-500 flex items-center gap-1 mt-1">
                        <Shield size={12} /> Por: {pMass.authorName || 'Músico Anónimo'}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="btn btn-sm bg-red-50 text-red-600 font-semibold" onClick={(e) => { e.stopPropagation(); handleLoad(pMass.metadata?.title || key, pMass); }}>
                        Cargar Plantilla
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    );
  }

  // View: Main Builder
  return (
    <div>
      <div className="print:hidden">
        {!user && (
          <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-950 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100/80 text-amber-700 rounded-xl shrink-0">
                <CloudOff size={20} />
              </div>
              <div>
                <p className="font-bold text-xs uppercase tracking-wider text-amber-800 m-0">Modo Local (Sin sincronización en la nube)</p>
                <p className="text-xs text-amber-700/90 m-0 mt-0.5">
                  Estás trabajando de forma local. Para que tus celebraciones se sincronicen automáticamente en todos tus dispositivos (iPad, celular, otros equipos), inicia sesión con tu cuenta de Google.
                </p>
              </div>
            </div>
            <button
              onClick={handleQuickLogin}
              className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <LogIn size={14} />
              <span>Iniciar Sesión</span>
            </button>
          </div>
        )}

        {isMigrating && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-center gap-2 animate-pulse">
            <RefreshCw size={15} className="animate-spin text-blue-600" />
            <span>Sincronizando tus celebraciones locales con tu cuenta de Google en la nube...</span>
          </div>
        )}

        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="m-0 font-sacred text-lg font-bold text-stone-800">Ordo Missae — Estructura Canónica</h2>
                <Link 
                  to="/tutorial?tab=build" 
                  className="text-stone-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-stone-100 flex items-center justify-center"
                  title="¿Cómo armar la Misa?"
                >
                  <HelpCircle size={17} />
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-500 font-semibold uppercase tracking-wider">Plantilla base:</span>
                <select 
                  className="bg-white rounded-xl px-3 py-1.5 text-xs focus:outline-none text-stone-700 font-semibold cursor-pointer shadow-sm"
                  style={{ border: 'none' }}
                  onChange={(e) => loadTemplate(e.target.value)}
                >
                  <option value="custom">Estándar (Personalizada)</option>
                  {MASS_TEMPLATES.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Liturgical Actions Toolbar — Zero Contour Lines & Elevated Grouping */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Primary Sacred Action */}
              <button 
                className="btn btn-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5 shadow-md"
                disabled={!isReadyToPlay}
                onClick={() => onPlayMass(getPlaylistArray())}
              >
                <Play size={16} fill="currentColor" /> Tocar Eucaristía
              </button>

              {onBroadcastMass && (
                <button
                  type="button"
                  className="btn bg-stone-900 hover:bg-stone-800 text-white px-3.5 py-2 text-xs font-bold shadow-md flex items-center gap-1.5"
                  disabled={!isReadyToPlay}
                  onClick={() => onBroadcastMass(getPlaylistArray(), printTitle || saveName || 'Eucaristía en Vivo')}
                  title="Crear una sesión temporal en vivo para que todo el coro vea los cantos y cambios de tono sincronizados"
                >
                  <Radio size={15} className="text-red-400 animate-pulse" /> En Vivo (Coro)
                </button>
              )}

              {/* Export Actions */}
              <button 
                className="btn bg-white hover:bg-stone-100 text-stone-800 px-3.5 py-2 text-xs font-bold shadow-sm flex items-center gap-1.5"
                disabled={!isReadyToPlay}
                onClick={handlePrint}
                title="Generar o Imprimir PDF"
              >
                <Printer size={16} className="text-red-600" /> PDF
              </button>

              <button 
                className="btn bg-white hover:bg-stone-100 text-stone-800 px-3.5 py-2 text-xs font-bold shadow-sm flex items-center gap-1.5"
                disabled={!isReadyToPlay}
                onClick={() => setShowShareModal(true)}
                title="Compartir Eucaristía (QR y Enlace)"
              >
                <Share2 size={16} className="text-red-600" /> Compartir
              </button>

              {/* Save / Load / Clear */}
              <div className="flex bg-white rounded-xl overflow-hidden shadow-sm flex-1 md:flex-initial" style={{ border: 'none' }}>
                <input 
                  type="text" 
                  placeholder="Nombre (opcional)" 
                  aria-label="Nombre de la celebración (opcional)" 
                  className="bg-transparent px-3 py-2 text-xs text-stone-800 focus:outline-none w-full md:w-40 border-none"
                  value={saveName}
                  onChange={e => setSaveName(e.target.value)}
                />
                <button 
                  className="px-3 py-2 flex items-center whitespace-nowrap shrink-0 bg-stone-50 hover:bg-red-50 text-stone-600 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer"
                  disabled={!isReadyToPlay}
                  onClick={handleSave}
                  title={isReadyToPlay ? `Guardar con la fecha ${massDateIso} (se cambia en "Fecha Litúrgica")` : 'Asigna al menos un canto para guardar'}
                  aria-label="Guardar celebración"
                >
                  <span className="font-mono text-[10px] font-bold mr-1.5">{massDateIso}</span>
                  <Save size={16} />
                </button>
              </div>

              <button className="btn bg-white hover:bg-stone-100 text-stone-700 px-3 py-2 text-xs shadow-sm" onClick={() => setShowSaved(true)} title="Cargar Misa Guardada">
                <FolderOpen size={16} /> Cargar
              </button>

              <button className="btn bg-white hover:bg-red-50 text-red-500 px-3 py-2 text-xs shadow-sm" onClick={handleClearDraft} title="Nueva Celebración">
                <Trash2 size={16} /> Nueva
              </button>
            </div>
          </div>
        </div>

      {/* Modal Compartir por QR y WhatsApp */}
      {showShareModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }}
          onClick={() => setShowShareModal(false)}
        >
          <div 
            className="bg-white rounded-2xl p-6 border border-stone-200 shadow-2xl max-w-sm w-full flex flex-col items-center animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center w-full mb-4 pb-2 border-b border-stone-100">
              <h3 className="font-bold text-lg text-stone-800 m-0 flex items-center gap-2">
                <Share2 size={20} className="text-red-500" /> Compartir Eucaristía
              </h3>
              <button 
                className="btn btn-icon text-stone-400 hover:text-stone-700" 
                onClick={() => setShowShareModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-stone-500 text-center mb-4">
              Escanea el código QR desde tu teléfono o copia el enlace para compartir la lista de cantos de la Misa con el coro.
            </p>

            {/* Código QR */}
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 mb-4 flex justify-center items-center shadow-inner">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(window.location.href)}`} 
                alt="Código QR de la Misa" 
                className="w-44 h-44 rounded-lg"
              />
            </div>

            {/* Enlace de copia */}
            <div className="flex w-full gap-2 mb-4">
              <input 
                type="text" 
                readOnly 
                value={window.location.href}
                className="bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-700 w-full font-mono truncate focus:outline-none"
              />
              <button 
                className="btn btn-primary text-xs px-3 py-2 flex items-center gap-1 font-bold shrink-0"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
              >
                {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                {copiedLink ? '¡Copiado!' : 'Copiar'}
              </button>
            </div>

            {/* Botón WhatsApp */}
            <a 
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent('✨ Lista de Cantos para la Misa: ' + (printTitle || saveName || 'Eucaristía') + '\n\n' + window.location.href)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 flex items-center justify-center gap-2 rounded-lg text-sm shadow-md"
            >
              <span>📱</span> Compartir por WhatsApp
            </a>
          </div>
        </div>
      )}


      {/* Panel de Configuración de Presentación PDF — Zero Contour Lines */}
      <div 
        className="card mb-6 bg-white p-6 shadow-sm rounded-2xl print:hidden"
        style={{ border: 'none', boxShadow: 'var(--shadow-sm)' }}
      >
        <h3 className="text-stone-800 font-bold mb-4 text-sm uppercase tracking-wider font-sacred flex items-center gap-2 pb-2">
          <span className="w-2 h-2 rounded-full bg-red-600"></span>
          Datos de la Celebración (para el Códice y PDF)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {/* Título de la Misa */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-stone-500 uppercase">Título de la Misa</label>
            <input 
              type="text"
              placeholder="Ej: Misa Dominical"
              className="bg-stone-50 rounded-xl px-3.5 py-2.5 text-sm text-stone-800 focus:outline-none shadow-sm"
              style={{ border: 'none' }}
              value={printTitle}
              onChange={e => setPrintTitle(e.target.value)}
            />
          </div>

          {/* Fecha — Calendario Canónico Interactivo */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-stone-500 uppercase">Fecha Litúrgica</label>
            <LiturgicalCalendarPicker 
              value={printDate} 
              onChange={(formattedDate) => setPrintDate(formattedDate)} 
            />
          </div>

          {/* Tiempo Litúrgico — Menú Desplegable Canónico */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-stone-500 uppercase flex items-center justify-between">
              <span>Tiempo Litúrgico</span>
              <span className="text-[10px] text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-full">Ciclo Canónico</span>
            </label>
            <select 
              className="bg-stone-50 rounded-xl px-3.5 py-2.5 text-sm text-stone-800 focus:outline-none cursor-pointer shadow-sm font-medium"
              style={{ border: 'none' }}
              value={printReason}
              onChange={(e) => {
                const selectedSeason = e.target.value;
                setPrintReason(selectedSeason);
                const matched = LITURGICAL_SEASONS.find(s => s.name === selectedSeason);
                if (matched) {
                  setPrintQuote(matched.defaultQuote);
                  // Rúbrica litúrgica (Bono 3 y Bono 5): en Adviento y Cuaresma se omite el Gloria
                  if (matched.id === 'adviento' || matched.id === 'cuaresma') {
                    setPlaylist(prev => prev.map(p =>
                      p.name.toLowerCase().includes('gloria') ? { ...p, isIncluded: false } : p
                    ));
                  }
                }
              }}
            >
              <option value="">Seleccionar Tiempo Litúrgico...</option>
              {LITURGICAL_SEASONS.map(s => (
                <option key={s.id} value={s.name}>
                  {s.name} ({s.colorName})
                </option>
              ))}
            </select>
          </div>

          {/* Grupo Musical / Coro */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-stone-500 uppercase">Ministerio Coral / Coro</label>
            <input 
              type="text"
              placeholder="Ej: Coro San Juan Bautista"
              className="bg-stone-50 rounded-xl px-3.5 py-2.5 text-sm text-stone-800 focus:outline-none shadow-sm"
              style={{ border: 'none' }}
              value={printGroup}
              onChange={e => setPrintGroup(e.target.value)}
            />
          </div>

          {/* Distribución de Página */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-stone-500 uppercase">Distribución de Página</label>
            <select
              className="bg-stone-50 rounded-xl px-3.5 py-2.5 text-sm text-stone-800 focus:outline-none cursor-pointer shadow-sm"
              style={{ border: 'none' }}
              value={printLayout}
              onChange={e => setPrintLayout(e.target.value as 'portrait-1' | 'portrait-2' | 'portrait-3' | 'landscape-2' | 'landscape-3')}
            >
              <option value="portrait-2">📄 Vertical (2 Columnas - Ahorro)</option>
              <option value="portrait-3">📄 Vertical (3 Columnas - Ahorro Máximo)</option>
              <option value="portrait-1">📄 Vertical (1 Columna)</option>
              <option value="landscape-2">📖 Horizontal Díptico (2 Columnas)</option>
              <option value="landscape-3">📖 Horizontal Tríptico (3 Columnas)</option>
            </select>
          </div>

          {/* Destinatario del PDF */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-stone-500 uppercase">Destinatario del PDF</label>
            <select
              className="bg-stone-50 rounded-xl px-3.5 py-2.5 text-sm text-stone-800 focus:outline-none cursor-pointer shadow-sm"
              style={{ border: 'none' }}
              value={printTarget}
              onChange={e => setPrintTarget(e.target.value as 'musician' | 'congregation')}
            >
              <option value="musician">🎸 Para el Equipo de Música (Con Acordes)</option>
              <option value="congregation">👥 Para el Pueblo / Fieles (Solo Letra)</option>
            </select>
          </div>

          {/* Diagramas de Acordes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-stone-500 uppercase">
              {printTarget === 'congregation' ? 'Diagramas (Desactivados)' : 'Imprimir Diagramas'}
            </label>
            <select
              className="bg-stone-50 rounded-xl px-3.5 py-2.5 text-sm text-stone-800 focus:outline-none cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ border: 'none' }}
              value={printTarget === 'congregation' ? 'none' : printChords}
              onChange={e => setPrintChords(e.target.value as 'none' | 'guitar' | 'piano')}
              disabled={printTarget === 'congregation'}
            >
              <option value="none">No imprimir diagramas</option>
              <option value="guitar">🎸 Diagramas de Guitarra</option>
              <option value="piano">🎹 Diagramas de Teclado</option>
            </select>
          </div>

          {/* Frase de Meditación — Automática y Personalizable */}
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-xs font-bold text-stone-500 uppercase flex justify-between items-center">
              <span>Frase de Meditación (Automática al seleccionar tiempo)</span>
              <span className="text-[10px] text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-full">Pie de Página</span>
            </label>
            <input 
              type="text"
              placeholder="Frase de meditación para el pie de página..."
              className="bg-stone-50 rounded-xl px-3.5 py-2.5 text-sm text-stone-800 focus:outline-none shadow-sm italic"
              style={{ border: 'none' }}
              value={printQuote}
              onChange={e => setPrintQuote(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        {playlist.map((part, index) => {
          const isDragTarget = isDragging === part.id;
          
          return (
            <div 
              key={part.id} 
              className={`card py-3.5 px-4 flex flex-col sm:flex-row sm:justify-between sm:items-center border gap-3 sm:gap-0 transition-all duration-200 rounded-xl
                ${!part.song && part.isIncluded ? 'border-2 border-dashed border-stone-300 hover:border-red-300 bg-stone-50/60' : ''}
                ${part.song && part.isIncluded ? 'bg-white border-stone-200 shadow-sm' : ''}
                ${!part.isIncluded ? 'bg-stone-50/80 border-stone-200 opacity-60' : ''}
                ${isDragTarget ? 'ring-2 ring-red-500 border-red-500 z-10 scale-[1.01]' : ''}
              `}
              draggable
              onDragStart={(e) => handleDragStart(e, index, part.id)}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              
              <div className="flex items-center gap-3 w-full sm:w-1/3">
                <div className="cursor-move text-stone-400 hover:text-stone-600 touch-none" title="Arrastrar para mover">
                  <GripVertical size={20} />
                </div>
                <button 
                  onClick={() => togglePartIncluded(part.id)}
                  className="text-stone-500 hover:text-red-500 focus:outline-none"
                  title={part.isIncluded ? "Desactivar esta parte" : "Activar esta parte"}
                >
                  {part.isIncluded ? <CheckSquare size={20} className="text-red-500" /> : <Square size={20} />}
                </button>
                <div className="flex items-center gap-2">
                  {getPartIcon(part.name)}
                  <div className={`font-bold ${part.isIncluded ? 'text-stone-800' : 'text-stone-400 line-through'}`}>{index + 1}. {part.name}</div>
                </div>
              </div>

              <div className="w-full sm:w-2/3 flex justify-end">
                {part.song ? (
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex items-center gap-3 w-full justify-between sm:justify-end">
                      <div className="flex items-center gap-2 truncate">
                        <span className="song-num-badge">#{String(part.song.id).padStart(3, '0')}</span>
                        <span className={`truncate font-bold ${part.isIncluded ? 'text-red-600' : 'text-stone-400'}`}>{part.song.title}</span>
                        {(() => {
                          const displayKey = part.song.key || (detectSongKey(part.song.content) ? formatChord(detectSongKey(part.song.content)!, chordNotation) : '');
                          const currentTranspose = part.transpose || 0;
                          return (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {displayKey && (
                                <span className="text-[11px] font-chord px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/80 shadow-xs whitespace-nowrap">
                                  Tono: {displayKey}
                                </span>
                              )}
                              
                              {/* Transpose Stepper for this specific mass part */}
                              <div className="flex items-center bg-stone-100 border border-stone-200 rounded px-1.5 py-0.5 text-xs gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPlaylist(prev => prev.map(p => p.id === part.id ? { ...p, transpose: (p.transpose || 0) - 1 } : p));
                                  }}
                                  className="text-stone-500 hover:text-stone-800 p-0.5 cursor-pointer"
                                  title="Bajar medio tono"
                                >
                                  <Minus size={11} />
                                </button>
                                <span className="font-mono text-[10px] font-bold text-stone-700 min-w-[20px] text-center">
                                  {currentTranspose > 0 ? `+${currentTranspose}` : currentTranspose}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPlaylist(prev => prev.map(p => p.id === part.id ? { ...p, transpose: (p.transpose || 0) + 1 } : p));
                                  }}
                                  className="text-stone-500 hover:text-stone-800 p-0.5 cursor-pointer"
                                  title="Subir medio tono"
                                >
                                  <Plus size={11} />
                                </button>
                              </div>

                              {currentTranspose !== 0 && displayKey && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 whitespace-nowrap">
                                  Suena: {formatChord(transposeChord(displayKey, currentTranspose), chordNotation)}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                      <button className="text-stone-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors" onClick={() => removeSongFromPart(part.id)} title="Remover de la Misa">
                        <X size={16} />
                      </button>
                    </div>
                    <div className="flex items-center gap-1 justify-end">
                      <button 
                        className={`btn btn-icon text-stone-400 hover:text-red-500 p-1.5 transition-colors ${expandedParts.includes(part.id) ? 'bg-stone-100 text-red-500' : ''}`}
                        onClick={() => setExpandedParts(prev => prev.includes(part.id) ? prev.filter(id => id !== part.id) : [...prev, part.id])}
                        title="Ver letra"
                      >
                        {expandedParts.includes(part.id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      <button className="btn btn-icon text-stone-400 hover:text-red-500 p-1.5" onClick={() => onCreateSong?.()} title="Crear nueva canción"><Plus size={14} /></button>
                      {(() => {
                        const currentUser = auth.currentUser;
                        const isSongEditable = !part.song.userId || (currentUser && part.song.userId === currentUser.uid);
                        if (!isSongEditable) return null;
                        return (
                          <>
                            <button className="btn btn-icon text-stone-400 hover:text-red-500 p-1.5" onClick={() => onEditSong?.(part.song!)} title="Editar esta canción"><Edit3 size={14} /></button>
                            <button className="btn btn-icon text-stone-400 hover:text-red-500 p-1.5" onClick={() => {
                              if (window.confirm('¿Seguro que deseas eliminar esta canción de tu base de datos?')) {
                                onDeleteSong?.(part.song!.id);
                                removeSongFromPart(part.id);
                              }
                            }} title="Eliminar del sistema"><Trash2 size={14} /></button>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 w-full sm:w-auto items-center">
                    <span className="text-xs text-stone-400 italic hidden sm:inline">Sin canto asignado</span>
                    <button 
                      className="btn text-xs py-1.5 px-3 bg-white hover:bg-red-50 text-red-600 border border-stone-200 hover:border-red-300 font-bold shadow-xs w-full sm:w-auto disabled:opacity-50 transition-all flex items-center gap-1 justify-center" 
                      onClick={() => setSelectingForId(part.id)}
                      disabled={!part.isIncluded}
                    >
                      <Plus size={14} /> Seleccionar Canto
                    </button>
                    {!DEFAULT_MASS_PARTS.includes(part.name) && (
                      <button 
                        className="btn btn-icon bg-stone-50/50 text-stone-400 hover:bg-red-500 hover:text-stone-800" 
                        onClick={() => removePart(part.id)}
                        title="Eliminar esta parte extra"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {part.song && expandedParts.includes(part.id) && (
                <div className="w-full mt-3 pt-3 border-t border-stone-200">
                  <SongViewer 
                    id={part.song.id}
                    title={part.song.title}
                    content={part.song.content}
                    hidePracticeStudio={true}
                    notation={chordNotation}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showAddPart ? (
        <div className="flex flex-wrap gap-2 items-center bg-white p-3 rounded-lg border border-stone-200 animate-in fade-in duration-200">
          <input 
            type="text" 
            placeholder="Nombre de la nueva parte (ej. Secuencia)..." 
            className="bg-stone-50 px-3 py-2 text-sm text-stone-800 focus:outline-none rounded-lg flex-1 min-w-[200px] border border-stone-200 focus:border-red-500"
            value={newPartName}
            onChange={e => setNewPartName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addNewPart()}
            autoFocus
          />
          <button className="btn btn-primary" onClick={addNewPart}>Agregar</button>
          <button className="btn btn-icon bg-stone-100" onClick={() => setShowAddPart(false)}><X size={18}/></button>
        </div>
      ) : (
        <button className="btn text-stone-500 border border-dashed border-stone-200 hover:border-red-400 hover:text-red-500 hover:bg-red-50 w-full py-4 bg-transparent transition-all" onClick={() => setShowAddPart(true)}>
          <Plus size={18} /> Añadir otro momento a la celebración
        </button>
      )}
      </div>

      {/* -------------------- ZONA DE IMPRESIÓN (OCULTA EN PANTALLA) -------------------- */}
      {isReadyToPlay && (
        <div className={`hidden print:block absolute top-0 left-0 w-full bg-white text-black z-[9999] p-0 m-0 font-sans print-target-${printTarget} print-layout-${printLayout}`}>
          
          {/* Cabecera Dinámica (Compacta para el pueblo, Profesional para músicos) */}
          {printTarget === 'congregation' ? (
            <div className="print-header print-header-compact border-b border-stone-400 pb-1.5 mb-3 flex justify-between items-center flex-wrap gap-2 text-stone-900 font-sans">
              <h1 className="print-header-title text-base font-serif font-bold uppercase tracking-wide m-0">
                {printTitle.trim() || saveName.trim() || "GUÍA DE CANTOS"}
              </h1>
              <div className="print-header-info-compact text-[10px] text-stone-500 font-medium">
                {printDate && <span>{printDate}</span>}
                {printReason && <span> • {printReason}</span>}
                {printGroup && <span> • {printGroup}</span>}
              </div>
            </div>
          ) : (
            <div className="print-header text-center mb-6 pb-4 border-b-2 border-stone-800">
              <h1 className="print-header-title text-3xl font-serif font-bold uppercase tracking-wide text-stone-900 mb-4">
                {printTitle.trim() || saveName.trim() || "GUÍA DE CANTOS - EUCARISTÍA"}
              </h1>
              <div className="print-header-info grid grid-cols-3 text-xs text-stone-600 gap-2 font-medium">
                <div>
                  <span className="font-bold text-stone-800 uppercase block text-[9px] tracking-wider text-stone-400 mb-0.5">Fecha</span>
                  {printDate || 'N/A'}
                </div>
                <div>
                  <span className="font-bold text-stone-800 uppercase block text-[9px] tracking-wider text-stone-400 mb-0.5">Celebración / Motivo</span>
                  {printReason || 'Ordinaria'}
                </div>
                <div>
                  <span className="font-bold text-stone-800 uppercase block text-[9px] tracking-wider text-stone-400 mb-0.5">Ministerio de Música</span>
                  {printGroup || 'N/A'}
                </div>
              </div>
            </div>
          )}
          
          {/* Contenido según distribución */}
          <div className="print-songs-container">
            {playlist.filter(p => p.isIncluded && p.song).map((part, idx) => {
              const lines = parseSongContent(part.song!.content);
              return (
                <div key={`${part.id}-${idx}`} className="song-block mb-8 break-inside-avoid">
                  <div className="print-part-badge bg-red-50 border border-red-200 text-red-800 font-bold px-3 py-1 mb-2 rounded shadow-sm text-xs inline-flex items-center gap-1.5 uppercase tracking-wider">
                    {getPartIcon(part.name)}
                    {part.name}
                  </div>
                  <h2 className="print-song-title text-xl font-bold text-stone-900 mb-3 leading-tight">{part.song!.title}</h2>
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
                                        {formatChord(segment.chord, chordNotation)}
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
                  {printTarget !== 'congregation' && printChords !== 'none' && (
                    (() => {
                      const songChords = new Set<string>();
                      lines.forEach(l => l.forEach(w => w.segments.forEach(seg => { if (seg.chord) songChords.add(seg.chord); })));
                      const uniqueSongChords = Array.from(songChords);
                      if (uniqueSongChords.length === 0) return null;
                      return (
                        <div className="mt-4 pt-2 border-t border-stone-200 flex flex-wrap gap-2 break-inside-avoid print-chords-container">
                          {uniqueSongChords.map(c => (
                            <ChordDiagram 
                              key={c} 
                              chordName={c} 
                              notation={chordNotation} 
                              instrument={printChords} 
                              width={55} 
                            />
                          ))}
                        </div>
                      );
                    })()
                  )}
                </div>
              );
            })}
          </div>

          {/* Pie de Página de Meditación */}
          {printQuote.trim() && (
            <div className="mt-12 pt-4 border-t border-stone-300 text-center text-xs text-stone-500 italic break-inside-avoid">
              "{printQuote.trim()}"
            </div>
          )}
        </div>
      )}
    </div>
        );
      })()}
    </SectionLayout>
  );
}

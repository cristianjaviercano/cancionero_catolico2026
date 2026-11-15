import React, { useState, useMemo } from 'react';
import { 
  Search, Music, ChevronDown, ChevronRight, ChevronLeft, ChevronsUp, ChevronsDown, 
  FileText, Book, Folder, FolderOpen, Plus, Sparkles, Radio 
} from 'lucide-react';
import { SongViewer } from './SongViewer';
import { detectSongKey, formatChord, parseSongContent, normalizeChordToAmerican } from '../utils/musicTheory';
import { SectionLayout } from './SectionLayout';

const BARRE_CHORDS_SET = new Set(['F', 'Fm', 'F7', 'Bm', 'B', 'B7', 'Bb', 'Bbm', 'F#', 'F#m', 'F#7', 'C#', 'C#m', 'C#7', 'G#', 'G#m', 'Ab', 'Abm', 'Eb', 'Ebm', 'Gm', 'Cm']);

function isSongBeginnerFriendly(content: string): boolean {
  const chords = new Set<string>();
  const lines = parseSongContent(content);
  for (const line of lines) {
    for (const word of line) {
      for (const seg of word.segments) {
        if (seg.chord) {
          const norm = normalizeChordToAmerican(seg.chord.trim().split('/')[0]);
          if (norm) chords.add(norm);
        }
      }
    }
  }
  if (chords.size === 0 || chords.size > 4) return false;
  for (const c of chords) {
    if (BARRE_CHORDS_SET.has(c)) return false;
  }
  return true;
}

interface Song {
  id: string;
  title: string;
  type: string;
  content: string;
  isPublic?: boolean;
  userId?: string;
  userDisplayName?: string;
  author?: string;
  key?: string;
  externalLink?: string;
  sheetMusic?: string;
}

interface SongListProps {
  songs: Song[];
  selectedSong: Song | null;
  onSelectSong: (song: Song | null) => void;
  onEditSong?: (song: Song) => void;
  onPlaySong?: (song: Song) => void;
  onBroadcastSong?: (song: Song) => void;
  onCreateSong?: () => void;
  chordNotation: 'american' | 'latin';
}

// Liturgical Folder Categories for Canonical Organization
interface FolderCategory {
  id: string;
  name: string;
  latinName: string;
  description: string;
  types: string[];
}

const LITURGICAL_FOLDERS: FolderCategory[] = [
  {
    id: 'ritos-iniciales',
    name: 'Ritos Iniciales',
    latinName: 'Ritus Initiales',
    description: 'Cantos de reunión, procesión, alabanza y petición de perdón',
    types: ['Entrada', 'Piedad', 'Gloria']
  },
  {
    id: 'liturgia-palabra',
    name: 'Liturgia de la Palabra',
    latinName: 'Liturgia Verbi',
    description: 'Salmos responsoriales y aclamaciones al Santo Evangelio',
    types: ['Salmo', 'Aleluya']
  },
  {
    id: 'liturgia-eucaristica',
    name: 'Liturgia Eucarística',
    latinName: 'Liturgia Eucharistica',
    description: 'Presentación de dones, cántico de los ángeles y fracción del pan',
    types: ['Ofertorio', 'Santo', 'Paz', 'Cordero']
  },
  {
    id: 'comunion-adoracion',
    name: 'Comunión & Adoración',
    latinName: 'Communio et Adoratio',
    description: 'Banquete sagrado, silencio místico y adoración al Santísimo',
    types: ['Comunión', 'Meditación', 'Adoración', 'Adoración Eucarística', 'Eucaristía']
  },
  {
    id: 'rito-conclusion',
    name: 'Rito de Conclusión & Misión',
    latinName: 'Ritus Conclusionis',
    description: 'Bendición final, envío misionero y marcha del pueblo de Dios',
    types: ['Salida', 'Misiones', 'Iglesia']
  },
  {
    id: 'tiempos-liturgicos',
    name: 'Tiempos Litúrgicos & Ciclos',
    latinName: 'Tempora Sacra',
    description: 'Himnos de Adviento, Navidad, Cuaresma, Pascua y Pentecostés',
    types: ['Adviento', 'Navidad', 'Cuaresma', 'Pascua', 'Pascua Joven', 'Pentecostés']
  },
  {
    id: 'devociones',
    name: 'Devociones, Santos & Espíritu',
    latinName: 'Sancti et Devotiones',
    description: 'Cantos marianos, devoción a San José y dones del Espíritu Santo',
    types: ['María', 'San José', 'Espíritu Santo']
  },
  {
    id: 'ministerio-animacion',
    name: 'Pastoral, Niños & Animación',
    latinName: 'Cantus Populares',
    description: 'Alabanza comunitaria, catequesis infantil y repertorio general',
    types: ['Alabanza', 'Animación', 'Niños', 'Varias']
  }
];

export function SongList({ songs, selectedSong, onSelectSong, onEditSong, onPlaySong, onBroadcastSong, onCreateSong, chordNotation }: SongListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [sortOrder, setSortOrder] = useState<'A-Z' | 'Z-A' | 'NUMBER'>('NUMBER');
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [onlyWithSheets, setOnlyWithSheets] = useState(false);
  const [onlyEasyChords, setOnlyEasyChords] = useState(false);

  // Obtener los tipos únicos y ordenarlos alfabéticamente
  const types = useMemo(() => Array.from(new Set(songs.map(s => s.type))).sort(), [songs]);

  // Filtrado de canciones con soporte para búsqueda por número canónico, título o contenido
  const filteredSongs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const isNumSearch = term.startsWith('#') || (!isNaN(Number(term)) && term !== '');
    const cleanNum = term.replace(/^#/, '');

    return songs
      .filter(song => {
        const matchesNumber = isNumSearch && (
          song.id === cleanNum || 
          song.id.padStart(3, '0') === cleanNum.padStart(3, '0')
        );
        const matchesText = term === '' || 
          song.title.toLowerCase().includes(term) ||
          song.content.toLowerCase().includes(term) ||
          song.type.toLowerCase().includes(term) ||
          (song.author && song.author.toLowerCase().includes(term));

        const matchesSearch = matchesNumber || matchesText;
        const matchesType = filterType ? song.type === filterType : true;
        const matchesSheets = onlyWithSheets ? !!song.sheetMusic : true;
        const matchesEasy = onlyEasyChords ? isSongBeginnerFriendly(song.content) : true;
        return matchesSearch && matchesType && matchesSheets && matchesEasy;
      })
      .sort((a, b) => {
        if (sortOrder === 'NUMBER') {
          return (parseInt(a.id, 10) || 0) - (parseInt(b.id, 10) || 0);
        }
        if (sortOrder === 'A-Z') return a.title.localeCompare(b.title);
        return b.title.localeCompare(a.title);
      });
  }, [songs, searchTerm, filterType, onlyWithSheets, onlyEasyChords, sortOrder]);

  // Manejo de carpetas colapsadas
  const toggleFolder = (folderId: string) => {
    setCollapsedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setCollapsedFolders(new Set());
  };

  const collapseAll = () => {
    setCollapsedFolders(new Set(LITURGICAL_FOLDERS.map(f => f.id).concat(['otros-cantos'])));
  };

  return (
    <SectionLayout
      title="Sefer Shirim — Repertorio Canónico"
      description="Códice completo de cantos, salmos y aclamaciones. Transposición acústica en tiempo real, cifrado y partituras."
      icon={<Book size={24} className="text-red-600" />}
      badge="Códice Litúrgico"
      imageSrc="/imagenes/repertorio_portada.webp"
      colorTheme="red"
      hideBanner={!!selectedSong}
    >
      {selectedSong ? (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex justify-between items-center mb-6 gap-2 flex-wrap">
            <button className="btn" onClick={() => onSelectSong(null)}>
              <ChevronLeft size={18} /> Volver al Árbol de Cantos
            </button>
            
            <div className="flex items-center gap-2 flex-wrap">
              {onBroadcastSong && (
                <button
                  type="button"
                  onClick={() => onBroadcastSong(selectedSong)}
                  className="btn bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5 text-xs font-bold shadow-sm"
                  title="Sincronizar este canto en vivo con el resto del coro"
                >
                  <Radio size={15} /> Transmitir en Vivo
                </button>
              )}
              <button 
                className="btn flex items-center gap-1.5" 
                disabled={filteredSongs.findIndex(s => s.id === selectedSong.id) <= 0}
                onClick={() => onSelectSong((filteredSongs.findIndex(s => s.id === selectedSong.id) !== -1 ? filteredSongs : songs)[filteredSongs.findIndex(s => s.id === selectedSong.id) - 1])}
                title="Canto anterior"
              >
                <ChevronLeft size={18} /> Anterior
              </button>
              <span className="flex items-center px-2 text-stone-500 text-sm font-medium bg-white/80 rounded-md">
                {filteredSongs.findIndex(s => s.id === selectedSong.id) + 1} de {(filteredSongs.findIndex(s => s.id === selectedSong.id) !== -1 ? filteredSongs : songs).length}
              </span>
              <button 
                className="btn flex items-center gap-1.5" 
                disabled={filteredSongs.findIndex(s => s.id === selectedSong.id) === -1 || filteredSongs.findIndex(s => s.id === selectedSong.id) >= (filteredSongs.findIndex(s => s.id === selectedSong.id) !== -1 ? filteredSongs : songs).length - 1}
                onClick={() => onSelectSong((filteredSongs.findIndex(s => s.id === selectedSong.id) !== -1 ? filteredSongs : songs)[filteredSongs.findIndex(s => s.id === selectedSong.id) + 1])}
                title="Canto siguiente"
              >
                Siguiente <ChevronRight size={18} />
              </button>
            </div>
          </div>
          
          <SongViewer 
            id={selectedSong.id}
            title={selectedSong.title}
            content={selectedSong.content}
            type={selectedSong.type}
            onEdit={onEditSong ? () => onEditSong(selectedSong) : undefined} 
            onPlay={onPlaySong ? () => onPlaySong(selectedSong) : undefined}
            notation={chordNotation}
            isPublic={selectedSong.isPublic}
            userId={selectedSong.userId}
            userDisplayName={selectedSong.userDisplayName}
            author={selectedSong.author}
            key={selectedSong.key}
            songKey={selectedSong.key}
            externalLink={selectedSong.externalLink}
            sheetMusic={selectedSong.sheetMusic}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Controles de Búsqueda, Filtros y Creación */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <Search size={18} />
              </div>
              <input
                type="text"
                className="w-full bg-white rounded-xl py-2.5 pl-10 pr-4 text-stone-800 text-sm focus:outline-none shadow-sm transition-all"
                style={{ border: 'none', boxShadow: 'var(--shadow-sm)' }}
                placeholder="Buscar por título, estrofa o número (#001)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-2 items-center">
              <button
                type="button"
                onClick={() => setOnlyEasyChords(!onlyEasyChords)}
                className={`btn px-3 py-2 text-xs flex items-center gap-1.5 font-bold transition-all ${
                  onlyEasyChords 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm' 
                    : 'bg-white text-stone-700 shadow-sm'
                }`}
                title="Mostrar cantos fáciles (máximo 4 acordes y sin cejilla)"
              >
                <Sparkles size={15} className={onlyEasyChords ? 'text-emerald-600' : 'text-stone-400'} />
                <span>Sin Cejilla (≤4 Acordes)</span>
              </button>

              <button
                type="button"
                onClick={() => setOnlyWithSheets(!onlyWithSheets)}
                className={`btn px-3 py-2 text-xs flex items-center gap-1.5 font-bold transition-all ${
                  onlyWithSheets 
                    ? 'bg-red-50 text-red-600 shadow-sm' 
                    : 'bg-white text-stone-700 shadow-sm'
                }`}
                title="Mostrar solo cantos con partitura"
              >
                <FileText size={15} className={onlyWithSheets ? 'text-red-500' : 'text-stone-400'} />
                <span>Partituras</span>
              </button>

              <select
                className="bg-white rounded-xl py-2 px-3 text-stone-800 text-xs focus:outline-none cursor-pointer shadow-sm"
                style={{ border: 'none' }}
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">Todos los Tipos</option>
                {types.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              <select
                className="bg-white rounded-xl py-2 px-3 text-stone-800 text-xs focus:outline-none cursor-pointer shadow-sm"
                style={{ border: 'none' }}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'NUMBER' | 'A-Z' | 'Z-A')}
              >
                <option value="NUMBER">Por Número (#)</option>
                <option value="A-Z">A - Z (Título)</option>
                <option value="Z-A">Z - A (Título)</option>
              </select>

              {onCreateSong && (
                <button 
                  className="btn btn-primary text-xs py-2 px-3.5 whitespace-nowrap"
                  onClick={onCreateSong}
                >
                  <Plus size={15} /> Nuevo Canto
                </button>
              )}
            </div>
          </div>

          {/* Barra de Estado y Botones de Expansión del Árbol */}
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {filteredSongs.length} {filteredSongs.length === 1 ? 'Canto Catalogado' : 'Cantos Catalogados'}
            </span>
            <div className="flex items-center gap-3">
              <button 
                onClick={expandAll}
                className="flex items-center gap-1 text-xs font-semibold text-stone-600 hover:text-red-600 transition-colors focus:outline-none bg-transparent"
              >
                <ChevronsDown size={14} /> Expandir Árbol
              </button>
              <button 
                onClick={collapseAll}
                className="flex items-center gap-1 text-xs font-semibold text-stone-600 hover:text-red-600 transition-colors focus:outline-none bg-transparent"
              >
                <ChevronsUp size={14} /> Contraer Árbol
              </button>
            </div>
          </div>

          {/* ── Árbol de Carpetas Litúrgicas Desplegables ── */}
          <div className="flex flex-col gap-3">
            {LITURGICAL_FOLDERS.map(folder => {
              // Canciones que pertenecen a este grupo litúrgico
              const folderSongs = filteredSongs.filter(s => folder.types.includes(s.type));
              if (folderSongs.length === 0) return null;

              // Si hay búsqueda activa, auto-expandir
              const isSearchActive = searchTerm.trim().length > 0;
              const isCollapsed = !isSearchActive && collapsedFolders.has(folder.id);

              return (
                <div 
                  key={folder.id} 
                  className="rounded-2xl bg-white overflow-hidden transition-all shadow-sm"
                  style={{ border: 'none' }}
                >
                  {/* Encabezado de la Carpeta */}
                  <button
                    className="w-full flex items-center justify-between p-4 bg-white hover:bg-stone-50/80 transition-colors text-left focus:outline-none"
                    onClick={() => toggleFolder(folder.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                        {isCollapsed ? <Folder size={18} /> : <FolderOpen size={18} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-red-600 uppercase tracking-wider font-sacred">
                            {folder.latinName}
                          </span>
                          <span className="text-[11px] font-semibold text-stone-400">
                            • {folderSongs.length} {folderSongs.length === 1 ? 'canto' : 'cantos'}
                          </span>
                        </div>
                        <h2 className="font-bold text-stone-800 text-sm m-0">
                          {folder.name}
                        </h2>
                      </div>
                    </div>
                    <div className="text-stone-400 p-1">
                      {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </button>

                  {/* Contenido desplegable: Lista de canciones de la carpeta */}
                  {!isCollapsed && (
                    <div className="p-3 pt-0 flex flex-col gap-2">
                      {folderSongs.map(song => (
                        <div
                          key={song.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-stone-50/60 hover:bg-red-50/40 cursor-pointer transition-all group"
                          onClick={() => onSelectSong(song)}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* Número Canónico de Canción */}
                            <span className="song-num-badge">
                              #{String(song.id).padStart(3, '0')}
                            </span>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="m-0 text-sm font-bold text-stone-800 group-hover:text-red-600 transition-colors truncate">
                                  {song.title}
                                </h3>

                                {(() => {
                                  const displayKey = song.key || (detectSongKey(song.content) ? formatChord(detectSongKey(song.content)!, chordNotation) : '');
                                  if (!displayKey) return null;
                                  return (
                                    <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-white text-stone-600 shadow-sm shrink-0">
                                      {displayKey}
                                    </span>
                                  );
                                })()}

                                {song.sheetMusic && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-800 text-white shadow-sm shrink-0 flex items-center gap-1">
                                    <FileText size={10} /> Partitura
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 shrink-0 ml-2">
                            {song.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Carpeta para canciones con categorías no mapeadas en los grupos estándar */}
            {(() => {
              const mappedTypes = new Set(LITURGICAL_FOLDERS.flatMap(f => f.types));
              const extraSongs = filteredSongs.filter(s => !mappedTypes.has(s.type));
              if (extraSongs.length === 0) return null;

              const isSearchActive = searchTerm.trim().length > 0;
              const isCollapsed = !isSearchActive && collapsedFolders.has('otros-cantos');

              return (
                <div 
                  className="rounded-2xl bg-white overflow-hidden transition-all shadow-sm"
                  style={{ border: 'none' }}
                >
                  <button
                    className="w-full flex items-center justify-between p-4 bg-white hover:bg-stone-50/80 transition-colors text-left focus:outline-none"
                    onClick={() => toggleFolder('otros-cantos')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                        {isCollapsed ? <Folder size={18} /> : <FolderOpen size={18} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-red-600 uppercase tracking-wider font-sacred">
                            Cantus Varii
                          </span>
                          <span className="text-[11px] font-semibold text-stone-400">
                            • {extraSongs.length} cantos
                          </span>
                        </div>
                        <h2 className="font-bold text-stone-800 text-sm m-0">
                          Otros Cantos Litúrgicos
                        </h2>
                      </div>
                    </div>
                    <div className="text-stone-400 p-1">
                      {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </button>

                  {!isCollapsed && (
                    <div className="p-3 pt-0 flex flex-col gap-2">
                      {extraSongs.map(song => (
                        <div
                          key={song.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-stone-50/60 hover:bg-red-50/40 cursor-pointer transition-all group"
                          onClick={() => onSelectSong(song)}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="song-num-badge">
                              #{String(song.id).padStart(3, '0')}
                            </span>
                            <div className="flex-1 min-w-0">
                              <h3 className="m-0 text-sm font-bold text-stone-800 group-hover:text-red-600 transition-colors truncate">
                                {song.title}
                              </h3>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 shrink-0 ml-2">
                            {song.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {filteredSongs.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl p-6 shadow-sm">
                <Book size={32} className="mx-auto text-stone-300 mb-2" />
                <h3 className="text-sm font-bold text-stone-700 m-0">No se encontraron cantos</h3>
                <p className="text-xs text-stone-400 mt-1">Prueba buscando con otro término o número de canción (#001).</p>
              </div>
            )}
          </div>
        </div>
      )}
    </SectionLayout>
  );
}


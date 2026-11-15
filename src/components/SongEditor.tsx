import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Save, ChevronLeft, Wand2, Info, Eye, Edit3, Sparkles, 
  Copy, Check, FileText, Music, Type, Plus, Minus, ArrowRight, 
  RotateCcw, Maximize2, Minimize2, SplitSquareVertical, 
  BookOpen, Trash2, Key, HelpCircle, Columns, Layers
} from 'lucide-react';
import { 
  translateRawToInternal, 
  parseSongContent, 
  transposeChord, 
  formatChord, 
  detectSongKey, 
  normalizeChordToAmerican 
} from '../utils/musicTheory';
import type { Song } from '../hooks/useSongs';
import { auth } from '../firebase';

interface SongEditorProps {
  initialSong?: Song | null;
  onSave: (song: Song) => void;
  onCancel: () => void;
  chordNotation?: 'american' | 'latin';
}

const COMMON_CHORDS_LATIN = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si'];
const COMMON_CHORDS_AMERICAN = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const CHORD_SUFFIXES = ['m', '7', 'm7', 'maj7', 'sus4', 'dim', '#', 'b'];

export function SongEditor({ initialSong, onSave, onCancel, chordNotation = 'latin' }: SongEditorProps) {
  const [title, setTitle] = useState(initialSong?.title || '');
  const [type, setType] = useState(initialSong?.type || 'Entrada');
  const [content, setContent] = useState(initialSong?.content || '');
  const [isPublic, setIsPublic] = useState(initialSong?.isPublic || false);
  const [author, setAuthor] = useState(initialSong?.author || '');
  const [key, setKey] = useState(initialSong?.key || '');
  const [externalLink, setExternalLink] = useState(initialSong?.externalLink || '');

  // Editor configuration states
  const [editorTab, setEditorTab] = useState<'split' | 'editorOnly' | 'converter'>('split');
  const [editorFontSize, setEditorFontSize] = useState<number>(15);
  const [wordWrap, setWordWrap] = useState<boolean>(false);
  const [quickNotation, setQuickNotation] = useState<'latin' | 'american'>(chordNotation);

  // Live preview interactive states
  const [previewTranspose, setPreviewTranspose] = useState<number>(0);
  const [previewNotation, setPreviewNotation] = useState<'american' | 'latin'>(chordNotation);
  const [previewFontSize, setPreviewFontSize] = useState<number>(17);
  const [previewColumns, setPreviewColumns] = useState<1 | 2>(1);

  // Classic Converter Tab States
  const [rawInput, setRawInput] = useState('');
  const [convertedPreview, setConvertedPreview] = useState('');
  const [hasCopiedConverted, setHasCopiedConverted] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const user = auth.currentUser;
  const isBaseSong = !!(initialSong && (!initialSong.userId || !initialSong.id.startsWith('custom_')));

  useEffect(() => {
    setTitle(initialSong?.title || '');
    setType(initialSong?.type || 'Entrada');
    setContent(initialSong?.content || '');
    setIsPublic(isBaseSong ? false : (initialSong?.isPublic || false));
    setAuthor(initialSong?.author || '');
    setKey(initialSong?.key || '');
    setExternalLink(initialSong?.externalLink || '');
  }, [initialSong, isBaseSong]);

  // Translate in-place
  const handleTranslateInPlace = () => {
    if (!content.trim()) return;
    const translated = translateRawToInternal(content);
    setContent(translated);
  };

  // Convert raw in the dedicated converter tab
  const handleConvertRawTab = () => {
    if (!rawInput.trim()) return;
    const translated = translateRawToInternal(rawInput);
    setConvertedPreview(translated);
  };

  const handleApplyConverted = () => {
    if (!convertedPreview.trim()) return;
    setContent(convertedPreview);
    setEditorTab('split');
  };

  // Insert Chord at cursor position
  const insertChordAtCursor = (chordName: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setContent(prev => prev + `[${chordName}]`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const tag = `[${chordName}]`;
    const newContent = content.substring(0, start) + tag + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 15);
  };

  // Parse lines for live preview
  const previewLines = useMemo(() => parseSongContent(content), [content]);

  // Detect chords and key
  const detectedKey = useMemo(() => detectSongKey(content), [content]);
  const uniqueChords = useMemo(() => {
    const chords = new Set<string>();
    previewLines.forEach(line => {
      line.forEach(word => {
        word.segments.forEach(segment => {
          if (segment.chord) {
            chords.add(segment.chord);
          }
        });
      });
    });
    return Array.from(chords);
  }, [previewLines]);

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return;
    
    const finalIsPublic = isBaseSong ? false : (user ? isPublic : false);

    const newSong: Song = {
      // Conserva los campos que el editor no muestra (partitura, etc.)
      ...initialSong,
      id: initialSong?.id || `custom_${Date.now()}`,
      title: title.trim(),
      type: type.trim(),
      content: content.trim(),
      isPublic: finalIsPublic,
      userId: initialSong?.userId || (user ? user.uid : undefined),
      userDisplayName: initialSong?.userDisplayName || (user ? (user.displayName || user.email || 'Usuario') : undefined),
      author: author.trim() || undefined,
      key: key.trim() || (detectedKey ? detectedKey : undefined),
      externalLink: externalLink.trim() || undefined
    };
    
    onSave(newSong);
  };

  return (
    <div className="w-full max-w-7xl mx-auto animate-in fade-in duration-300 pb-16">
      {/* ── Top Bar & Actions ── */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 pb-4 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <button 
            className="btn btn-icon bg-stone-100 hover:bg-stone-200 text-stone-700 shadow-sm" 
            onClick={onCancel}
            title="Volver"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="m-0 text-xl md:text-2xl text-stone-900 font-headline font-bold">
              {initialSong ? `Editar: ${initialSong.title}` : 'Crear Nueva Canción'}
            </h1>
            <p className="text-xs text-stone-500 m-0">
              Formato de acordes en línea: <code className="bg-stone-100 px-1.5 py-0.5 rounded text-red-600 font-bold font-mono">[Do]Palabra</code> o traduce texto clásico directamente.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn bg-stone-100 text-stone-600 hover:bg-stone-200 text-sm font-semibold" onClick={onCancel}>
            Cancelar
          </button>
          <button 
            className="btn btn-primary text-sm font-bold shadow-md flex items-center gap-2"
            onClick={handleSave}
            disabled={!title.trim() || !content.trim()}
          >
            <Save size={18} /> Guardar Canción
          </button>
        </div>
      </div>

      {/* ── Song Metadata Grid ── */}
      <div className="card mb-6 bg-white border border-stone-200 p-5 shadow-sm rounded-2xl">
        <h3 className="text-stone-800 font-bold mb-3 text-sm flex items-center gap-2">
          <BookOpen size={16} className="text-red-500" /> Información General de la Canción
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="text-xs font-bold text-stone-600 uppercase tracking-wide">
              Título de la Canción <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              className="bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-stone-900 font-semibold focus:outline-none focus:border-red-500 focus:bg-white transition-all shadow-sm"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ej: Pescador de Hombres"
            />
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-stone-600 uppercase tracking-wide">
              Tipo / Momento Litúrgico <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              className="bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-stone-800 focus:outline-none focus:border-red-500 focus:bg-white transition-all shadow-sm"
              value={type}
              onChange={e => setType(e.target.value)}
              placeholder="Ej: Entrada, Comunión..."
              list="editor-types-list"
            />
            <datalist id="editor-types-list">
              <option value="Entrada" />
              <option value="Piedad" />
              <option value="Gloria" />
              <option value="Salmo" />
              <option value="Aleluya" />
              <option value="Ofertorio" />
              <option value="Santo" />
              <option value="Cordero" />
              <option value="Comunión" />
              <option value="Salida" />
              <option value="María" />
              <option value="Espíritu Santo" />
              <option value="Adoración" />
            </datalist>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-stone-600 uppercase tracking-wide flex justify-between items-center">
              <span>Tono Original</span>
              {detectedKey && !key && (
                <button 
                  type="button"
                  className="text-[10px] text-red-600 font-bold hover:underline cursor-pointer"
                  onClick={() => setKey(detectedKey)}
                  title="Usar tono detectado automáticamente"
                >
                  Usar {detectedKey}
                </button>
              )}
            </label>
            <input 
              type="text" 
              className="bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-stone-800 focus:outline-none focus:border-red-500 focus:bg-white transition-all shadow-sm"
              value={key}
              onChange={e => setKey(e.target.value)}
              placeholder={detectedKey ? `Detectado: ${detectedKey}` : "Ej: Re m, Sol, G"}
            />
          </div>

          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="text-xs font-bold text-stone-600 uppercase tracking-wide">Autor / Compositor (Opcional)</label>
            <input 
              type="text" 
              className="bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-stone-800 text-sm focus:outline-none focus:border-red-500 focus:bg-white transition-all shadow-sm"
              value={author}
              onChange={e => setAuthor(e.target.value)}
              placeholder="Ej: Cesáreo Gabaráin, Kiko Argüello, Tradicional"
            />
          </div>

          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="text-xs font-bold text-stone-600 uppercase tracking-wide">Enlace Multimedia (YouTube / Spotify / Web)</label>
            <input 
              type="text" 
              className="bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-stone-800 text-sm focus:outline-none focus:border-red-500 focus:bg-white transition-all shadow-sm"
              value={externalLink}
              onChange={e => setExternalLink(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-3 bg-stone-50 p-3.5 rounded-xl border border-stone-200 mt-4">
            <input 
              type="checkbox" 
              id="editorIsPublicCheckbox" 
              className={`w-4 h-4 rounded text-red-600 focus:ring-red-500 border-stone-300 accent-red-600 shrink-0 ${isBaseSong ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              checked={isPublic}
              onChange={e => setIsPublic(e.target.checked)}
              disabled={isBaseSong}
            />
            <div className="flex flex-col">
              <label htmlFor="editorIsPublicCheckbox" className={`text-xs font-bold ${isBaseSong ? 'text-stone-400 cursor-not-allowed' : 'text-stone-700 cursor-pointer'}`}>
                Compartir en la biblioteca pública de la comunidad
              </label>
              <p className="text-[11px] text-stone-500 m-0">
                {isBaseSong 
                  ? "Esta es una canción base del sistema. Tus modificaciones se guardarán como una copia personal en tu perfil."
                  : "Si lo activas, todos los miembros del cancionero podrán ver este canto. Si está desactivado, permanecerá privado en tu perfil."
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Mode Switcher Tabs ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex bg-stone-200/80 p-1 rounded-xl border border-stone-300 text-xs font-bold gap-1 shadow-inner">
          <button
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${editorTab === 'split' ? 'bg-white text-stone-900 shadow-sm border border-stone-200' : 'text-stone-600 hover:text-stone-900'}`}
            onClick={() => setEditorTab('split')}
          >
            <SplitSquareVertical size={16} className="text-red-500" />
            <span>Editor + Vista Previa Lado a Lado</span>
          </button>
          <button
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${editorTab === 'converter' ? 'bg-white text-stone-900 shadow-sm border border-stone-200' : 'text-stone-600 hover:text-stone-900'}`}
            onClick={() => setEditorTab('converter')}
          >
            <Wand2 size={16} className="text-amber-500" />
            <span>⚡ Asistente de Conversión Clásico</span>
          </button>
          <button
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${editorTab === 'editorOnly' ? 'bg-white text-stone-900 shadow-sm border border-stone-200' : 'text-stone-600 hover:text-stone-900'}`}
            onClick={() => setEditorTab('editorOnly')}
          >
            <Maximize2 size={16} className="text-stone-600" />
            <span>Solo Editor (Ancho Completo)</span>
          </button>
        </div>

        {/* Quick Chord Insertion Bar Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-stone-500 hidden sm:inline">Botones Rápidos:</span>
          <div className="flex bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-xs font-semibold">
            <button 
              className={`px-2 py-1 rounded transition-all ${quickNotation === 'latin' ? 'bg-white text-red-600 shadow-xs font-bold' : 'text-stone-500'}`}
              onClick={() => setQuickNotation('latin')}
            >Do Re Mi</button>
            <button 
              className={`px-2 py-1 rounded transition-all ${quickNotation === 'american' ? 'bg-white text-red-600 shadow-xs font-bold' : 'text-stone-500'}`}
              onClick={() => setQuickNotation('american')}
            >C D E</button>
          </div>
        </div>
      </div>

      {/* ── Quick Chord Insertion Bar ── */}
      <div className="bg-white border border-stone-200 rounded-xl p-3 mb-4 shadow-sm flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-bold text-stone-400 uppercase mr-1 flex items-center gap-1">
          <Key size={13} /> Insertar:
        </span>
        {(quickNotation === 'latin' ? COMMON_CHORDS_LATIN : COMMON_CHORDS_AMERICAN).map(chord => (
          <button
            key={chord}
            type="button"
            className="px-2.5 py-1 text-xs font-mono font-bold bg-stone-50 hover:bg-red-50 hover:text-red-600 hover:border-red-300 text-stone-800 border border-stone-200 rounded-md transition-colors shadow-xs"
            onClick={() => insertChordAtCursor(chord)}
          >
            [{chord}]
          </button>
        ))}
        <span className="text-stone-300 mx-1">|</span>
        {CHORD_SUFFIXES.map(suffix => (
          <button
            key={suffix}
            type="button"
            className="px-2 py-1 text-xs font-mono font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 rounded-md transition-colors"
            onClick={() => {
              const textarea = textareaRef.current;
              if (!textarea) return;
              const start = textarea.selectionStart;
              const end = textarea.selectionEnd;
              const newContent = content.substring(0, start) + suffix + content.substring(end);
              setContent(newContent);
              setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + suffix.length, start + suffix.length);
              }, 10);
            }}
          >
            {suffix}
          </button>
        ))}
        <button
          type="button"
          className="ml-auto text-xs px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-md border border-red-200 font-semibold flex items-center gap-1 transition-all"
          onClick={handleTranslateInPlace}
          title="Traduce acordes colocados en la línea superior al formato [Acorde]Letra"
        >
          <Wand2 size={13} /> Traducir Texto Actual
        </button>
      </div>

      {/* ── MODE 1: DEDICATED CONVERTER TAB ── */}
      {editorTab === 'converter' && (
        <div className="card bg-white border border-stone-200 p-6 rounded-2xl shadow-sm animate-in fade-in duration-200 mb-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-stone-100">
            <Wand2 size={20} className="text-amber-500" />
            <div>
              <h2 className="text-base font-bold text-stone-800 m-0">Asistente de Conversión de Formato Clásico</h2>
              <p className="text-xs text-stone-500 m-0">
                Pega la letra con acordes arriba tal como la encuentras en internet (LaCuerda, AcordesWeb, etc.). El sistema colocará los corchetes en cada sílaba automáticamente.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Raw Box */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-stone-600 uppercase">1. Pega aquí el texto con acordes arriba:</label>
                <button 
                  type="button" 
                  className="text-xs text-stone-400 hover:text-stone-700"
                  onClick={() => setRawInput('')}
                >
                  Limpiar
                </button>
              </div>
              <textarea 
                className="w-full h-96 p-4 bg-stone-50 border border-stone-200 rounded-xl font-mono text-sm leading-relaxed text-stone-800 focus:outline-none focus:border-amber-400 focus:bg-white transition-all shadow-inner resize-y whitespace-pre overflow-x-auto"
                value={rawInput}
                onChange={e => setRawInput(e.target.value)}
                placeholder={`Do              Sol\nJuntos como hermanos,\nFa              Do\nmiembros de una Iglesia...`}
              />
              <button 
                type="button"
                className="btn bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 shadow-md flex items-center justify-center gap-2 rounded-xl transition-all"
                onClick={handleConvertRawTab}
                disabled={!rawInput.trim()}
              >
                <Sparkles size={18} /> Convertir al Formato de la App
              </button>
            </div>

            {/* Output Converted Box */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-stone-600 uppercase">2. Resultado Convertido [Acorde]Letra:</label>
                {convertedPreview && (
                  <button 
                    type="button"
                    className="text-xs text-stone-500 hover:text-red-600 flex items-center gap-1"
                    onClick={() => {
                      navigator.clipboard.writeText(convertedPreview);
                      setHasCopiedConverted(true);
                      setTimeout(() => setHasCopiedConverted(false), 2000);
                    }}
                  >
                    {hasCopiedConverted ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    {hasCopiedConverted ? '¡Copiado!' : 'Copiar'}
                  </button>
                )}
              </div>
              <textarea 
                readOnly
                className="w-full h-96 p-4 bg-emerald-50/40 border border-emerald-200 rounded-xl font-mono text-sm leading-relaxed text-stone-800 focus:outline-none shadow-inner resize-y whitespace-pre overflow-x-auto"
                value={convertedPreview}
                placeholder="El resultado convertido aparecerá aquí..."
              />
              <button 
                type="button"
                className="btn btn-primary font-bold py-2.5 shadow-md flex items-center justify-center gap-2 rounded-xl transition-all disabled:opacity-50"
                onClick={handleApplyConverted}
                disabled={!convertedPreview.trim()}
              >
                <Check size={18} /> Cargar en el Editor Principal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODE 2 & 3: SPLIT VIEW & FULL-WIDTH EDITOR ── */}
      {editorTab !== 'converter' && (
        <div className={`grid grid-cols-1 ${editorTab === 'split' ? 'lg:grid-cols-2' : 'grid-cols-1'} gap-6 items-start`}>
          {/* ── LEFT COLUMN: WIDE CODE EDITOR ── */}
          <div className="card bg-white border border-stone-200 p-5 rounded-2xl shadow-sm flex flex-col gap-3">
            {/* Toolbar above textarea */}
            <div className="flex flex-wrap justify-between items-center gap-2 pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-700 flex items-center gap-1">
                  <Edit3 size={15} className="text-red-500" /> Editor de Letra y Acordes
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Font size controller */}
                <div className="flex items-center gap-1 bg-stone-100 px-2 py-0.5 rounded-lg border border-stone-200 text-xs">
                  <button 
                    type="button" 
                    className="text-stone-500 hover:text-stone-900"
                    onClick={() => setEditorFontSize(f => Math.max(12, f - 1))}
                    title="Reducir fuente editor"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="font-mono text-stone-700 font-bold px-1">{editorFontSize}px</span>
                  <button 
                    type="button" 
                    className="text-stone-500 hover:text-stone-900"
                    onClick={() => setEditorFontSize(f => Math.min(24, f + 1))}
                    title="Aumentar fuente editor"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                {/* Word Wrap Toggle */}
                <button
                  type="button"
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${
                    wordWrap ? 'bg-stone-800 text-white border-stone-700' : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                  onClick={() => setWordWrap(!wordWrap)}
                  title="Activa o desactiva el ajuste automático de línea para evitar que los acordes se desalineen"
                >
                  {wordWrap ? 'Ajuste: ON' : 'Ajuste: OFF (Scroll)'}
                </button>
              </div>
            </div>

            {/* Instruction Tip */}
            <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200 text-xs text-stone-600 flex items-start gap-2">
              <Info size={15} className="text-red-400 shrink-0 mt-0.5" />
              <span>
                Coloca los acordes entre corchetes justo antes de la sílaba correspondiente. Ej: <code className="text-red-600 font-bold">[Do]Juntos [Sol]como [Lam]hermanos</code>.
              </span>
            </div>

            {/* Main Textarea */}
            <div className="relative w-full">
              <textarea 
                ref={textareaRef}
                className={`w-full min-h-[600px] h-[70vh] bg-white border border-stone-200 rounded-xl p-4 text-stone-900 font-mono focus:outline-none focus:border-red-400 shadow-inner resize-y ${
                  wordWrap ? 'whitespace-pre-wrap' : 'whitespace-pre overflow-x-auto'
                }`}
                style={{ fontSize: `${editorFontSize}px`, lineHeight: 1.6 }}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="[C]Juntos como her[Am]manos,\n[F]miembros de una I[G]glesia,\n[C]vamos cami[Am]nando\n[F]al encuen[G]tro del Se[C]ñor."
                spellCheck={false}
              />
            </div>

            {/* Stats Bar */}
            <div className="flex flex-wrap justify-between items-center text-[11px] text-stone-500 pt-2 border-t border-stone-100">
              <div className="flex items-center gap-3">
                <span>Líneas: <strong>{content.split('\n').length}</strong></span>
                <span>Caracteres: <strong>{content.length}</strong></span>
                <span>Acordes: <strong>{uniqueChords.length} ({uniqueChords.join(', ') || 'Ninguno'})</strong></span>
              </div>
              {detectedKey && (
                <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  Tono sugerido: {detectedKey}
                </span>
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN: LIVE INTERACTIVE PREVIEW ── */}
          {editorTab === 'split' && (
            <div className="card bg-white border border-stone-200 p-5 rounded-2xl shadow-sm flex flex-col gap-3 sticky top-24">
              {/* Preview Header & Controls */}
              <div className="flex flex-wrap justify-between items-center gap-2 pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <Eye size={16} className="text-emerald-600" />
                  <span className="text-xs font-bold text-stone-800 uppercase tracking-wide">
                    Vista Previa en Vivo
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Transpose test */}
                  <div className="flex items-center gap-1 bg-stone-50 px-1.5 py-0.5 rounded-lg border border-stone-200 text-xs">
                    <button 
                      type="button"
                      className="text-stone-500 hover:text-stone-900 p-1"
                      onClick={() => setPreviewTranspose(t => t - 1)}
                      title="Probar tono más bajo"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="font-mono text-stone-800 font-bold px-1">
                      {previewTranspose > 0 ? `+${previewTranspose}` : previewTranspose}
                    </span>
                    <button 
                      type="button"
                      className="text-stone-500 hover:text-stone-900 p-1"
                      onClick={() => setPreviewTranspose(t => t + 1)}
                      title="Probar tono más alto"
                    >
                      <Plus size={13} />
                    </button>
                    {previewTranspose !== 0 && (
                      <button 
                        type="button" 
                        className="text-[10px] text-red-500 font-bold ml-1 hover:underline"
                        onClick={() => setPreviewTranspose(0)}
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  {/* Notation toggle */}
                  <button
                    type="button"
                    className="px-2 py-1 text-xs font-bold bg-stone-50 border border-stone-200 rounded-lg text-stone-700 hover:bg-stone-100"
                    onClick={() => setPreviewNotation(n => n === 'american' ? 'latin' : 'american')}
                    title="Alternar cifrado Americano / Latino"
                  >
                    {previewNotation === 'american' ? 'Am' : 'Lat'}
                  </button>

                  {/* Columns toggle */}
                  <div className="flex bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-xs font-bold">
                    <button 
                      type="button"
                      className={`px-2 py-0.5 rounded ${previewColumns === 1 ? 'bg-white text-red-600 shadow-xs' : 'text-stone-500'}`}
                      onClick={() => setPreviewColumns(1)}
                    >1 Col</button>
                    <button 
                      type="button"
                      className={`px-2 py-0.5 rounded ${previewColumns === 2 ? 'bg-white text-red-600 shadow-xs' : 'text-stone-500'}`}
                      onClick={() => setPreviewColumns(2)}
                    >2 Col</button>
                  </div>
                </div>
              </div>

              {/* Title & Preview Header Card */}
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-stone-900 m-0">{title || 'Título de la Canción'}</h2>
                  {type && <span className="badge text-[10px] py-0.5">{type}</span>}
                </div>
                {author && <p className="text-xs text-stone-500 m-0 mt-0.5">Autor: {author}</p>}
                {(key || detectedKey) && (
                  <p className="text-[11px] font-bold text-stone-400 uppercase mt-1 m-0">
                    🎵 Tonalidad: <span className="text-red-500">{key || detectedKey}</span>
                  </p>
                )}
              </div>

              {/* Parsed Song Live Content Container */}
              <div 
                className="song-content font-sans bg-white border border-stone-100 rounded-xl p-4 min-h-[500px] max-h-[70vh] overflow-y-auto overflow-x-auto shadow-inner"
                style={{ columnCount: previewColumns, columnGap: '2rem' }}
              >
                {previewLines.length === 0 || (previewLines.length === 1 && previewLines[0].length === 0) ? (
                  <div className="text-center py-20 text-stone-400 italic text-sm">
                    Escribe la letra a la izquierda para ver el resultado en vivo aquí...
                  </div>
                ) : (
                  previewLines.map((line, lineIndex) => (
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
                                    className="chord"
                                    style={{ 
                                      fontSize: `${previewFontSize - 3}px`, 
                                      height: `${previewFontSize - 3}px`,
                                      lineHeight: `${previewFontSize - 3}px`
                                    }}
                                  >
                                    {formatChord(previewTranspose !== 0 ? transposeChord(segment.chord, previewTranspose) : segment.chord, previewNotation)}
                                  </span>
                                ) : (
                                  <span 
                                    className="chord-placeholder"
                                    style={{ 
                                      fontSize: `${previewFontSize - 3}px`, 
                                      height: `${previewFontSize - 3}px`,
                                      lineHeight: `${previewFontSize - 3}px`
                                    }}
                                  >
                                    &nbsp;
                                  </span>
                                )}
                                <span 
                                  className="lyric"
                                  style={{ fontSize: `${previewFontSize}px` }}
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
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Bottom Save & Cancel Row ── */}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-stone-200">
        <button className="btn bg-stone-100 text-stone-600 hover:bg-stone-200 text-sm font-semibold" onClick={onCancel}>
          Cancelar
        </button>
        <button 
          className="btn btn-primary text-sm font-bold shadow-md flex items-center gap-2"
          onClick={handleSave}
          disabled={!title.trim() || !content.trim()}
        >
          <Save size={18} /> Guardar Canción
        </button>
      </div>
    </div>
  );
}

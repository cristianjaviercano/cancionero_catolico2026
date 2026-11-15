import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSongs } from '../hooks/useSongs';
import { SongViewer } from './SongViewer';
import { ArrowLeft, FileText, Music, Info } from 'lucide-react';

interface SheetMusicViewerProps {
  chordNotation: 'american' | 'latin';
}

export function SheetMusicViewer({ chordNotation }: SheetMusicViewerProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { songs } = useSongs();
  const [activeTab, setActiveTab] = useState<'sheet' | 'chords'>('sheet');

  const song = songs.find(s => s.id === id);

  if (!song) {
    return (
      <div className="card text-center py-12">
        <p className="text-stone-500 mb-4">No se encontró la canción especificada.</p>
        <Link to="/repertorio" className="btn btn-primary">
          Volver al Repertorio
        </Link>
      </div>
    );
  }

  if (!song.sheetMusic) {
    return (
      <div className="card text-center py-12">
        <p className="text-stone-500 mb-4">Esta canción no tiene una partitura asociada.</p>
        <Link to="/repertorio" className="btn btn-primary">
          Volver al Repertorio
        </Link>
      </div>
    );
  }

  const sheetUrls = song.sheetMusic.split(',');
  const isPdf = sheetUrls[0].toLowerCase().endsWith('.pdf');

  return (
    <div className="animate-in fade-in duration-300">
      {/* Header Navigation */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <button onClick={() => navigate(-1)} className="btn flex items-center gap-1.5 cursor-pointer">
          <ArrowLeft size={18} /> Volver
        </button>
        
        <div className="flex bg-stone-200/80 p-1 rounded-lg border border-stone-300 text-sm font-semibold shadow-inner">
          <button
            onClick={() => setActiveTab('sheet')}
            className={`px-4 py-2 rounded-md transition-all cursor-pointer flex items-center gap-1.5 border-none ${
              activeTab === 'sheet' ? 'bg-white text-red-650 shadow-sm font-bold' : 'text-stone-500 hover:text-stone-800'
            }`}
            style={{
              backgroundColor: activeTab === 'sheet' ? '#ffffff' : 'transparent',
              color: activeTab === 'sheet' ? '#dc2626' : undefined
            }}
          >
            <FileText size={16} />
            <span>🎼 Partitura</span>
          </button>
          <button
            onClick={() => setActiveTab('chords')}
            className={`px-4 py-2 rounded-md transition-all cursor-pointer flex items-center gap-1.5 border-none ${
              activeTab === 'chords' ? 'bg-white text-red-650 shadow-sm font-bold' : 'text-stone-500 hover:text-stone-800'
            }`}
            style={{
              backgroundColor: activeTab === 'chords' ? '#ffffff' : 'transparent',
              color: activeTab === 'chords' ? '#dc2626' : undefined
            }}
          >
            <Music size={16} />
            <span>🎸 Letra y Acordes</span>
          </button>
        </div>
      </div>

      {/* Song info summary card */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="m-0 text-xl md:text-2xl text-stone-850">{song.title}</h1>
          <p className="text-xs text-stone-400 font-bold uppercase tracking-wider mt-1">{song.type}</p>
        </div>
        {song.key && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-red-50 border border-red-100 text-red-600 shadow-sm">
            Tono Original: <span className="font-mono font-bold">{song.key}</span>
          </span>
        )}
      </div>

      {/* Tab contents */}
      {activeTab === 'sheet' ? (
        <div className="flex flex-col gap-6">
          {/* Credits box */}
          <div className="bg-stone-100 p-5 rounded-xl border border-stone-200 text-sm text-stone-600 font-sans shadow-sm flex items-start gap-3">
            <Info size={24} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-stone-800 mb-1">Créditos del Cancionero de Partituras</h4>
              <p className="leading-relaxed">
                Esta partitura forma parte de la compilación litúrgica y musical realizada por la <strong>Diócesis de Málaga (España)</strong>.
                Agradecemos el esfuerzo de transcripción y ordenación de sus autores al poner este material a disposición de coros y parroquias.
              </p>
            </div>
          </div>

          {/* Sheet View */}
          <div className="bg-white p-1 rounded-xl border border-stone-200 shadow-sm overflow-hidden min-h-[800px] h-[90vh]">
            {isPdf ? (
              <iframe
                src={`${sheetUrls[0]}#toolbar=1&navpanes=0&view=Fit`}
                className="w-full h-full border-none"
                title={`Partitura de ${song.title}`}
              />
            ) : (
              <div className="flex flex-col gap-6 items-center p-6 w-full h-full overflow-y-auto bg-stone-50">
                {sheetUrls.map((url, idx) => (
                  <div key={idx} className="flex flex-col items-center w-full max-w-3xl">
                    <span className="text-xs text-stone-400 font-bold mb-2">Página {idx + 1} de {sheetUrls.length}</span>
                    <img
                      src={url.trim()}
                      alt={`Página ${idx + 1} de la partitura de ${song.title}`}
                      className="w-full h-auto rounded-lg shadow-md border border-stone-200"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="border border-stone-200 rounded-xl bg-white p-1">
          <SongViewer
            id={song.id}
            title={song.title}
            content={song.content}
            type={song.type}
            isPublic={song.isPublic}
            userId={song.userId}
            author={song.author}
            key={song.key}
            songKey={song.key}
            externalLink={song.externalLink}
            notation={chordNotation}
            sheetMusic={undefined} // Hides the ver partitura button inside chords tab
          />
        </div>
      )}
    </div>
  );
}

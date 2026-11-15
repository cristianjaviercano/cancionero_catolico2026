import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSongs } from '../hooks/useSongs';
import { Search, ArrowLeft, FileText, Info } from 'lucide-react';

export function SheetMusicGallery() {
  const { songs } = useSongs();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const songsWithSheets = songs.filter(s => !!s.sheetMusic);

  const filtered = songsWithSheets.filter(s =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.type && s.type.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="animate-in fade-in duration-350">
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl mb-1 text-stone-850 flex items-center gap-2">
            <FileText className="text-red-500" size={26} /> Galería de Partituras
          </h1>
          <p className="text-stone-500 text-sm">Explora todas las canciones del repertorio con partitura musical.</p>
        </div>
        <Link to="/repertorio" className="btn flex items-center gap-1.5">
          <ArrowLeft size={18} /> Volver al Repertorio
        </Link>
      </div>

      {/* Credits banner */}
      <div className="bg-stone-100 p-5 rounded-xl border border-stone-200 text-sm text-stone-600 font-sans shadow-sm mb-6 flex items-start gap-3">
        <Info size={24} className="text-red-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-stone-800 mb-1">Créditos del Cancionero Musical</h4>
          <p className="leading-relaxed">
            Las partituras integradas en este cancionero han sido organizadas y digitalizadas por la <strong>Diócesis de Málaga (España)</strong>.
            Agradecemos a los autores de este magnífico trabajo su dedicación y servicio musical para el enriquecimiento de las celebraciones.
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
          <Search size={18} />
        </div>
        <input
          type="text"
          className="w-full bg-white border border-stone-200 rounded-lg py-2.5 pl-10 pr-4 text-stone-800 focus:outline-none focus:border-red-400 shadow-sm"
          placeholder="Buscar partitura..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Song List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(song => (
          <div 
            key={song.id}
            onClick={() => navigate(`/partituras/${song.id}`)}
            className="flex items-center justify-between p-4 bg-white hover:bg-stone-50 border border-stone-200 hover:border-red-200 rounded-lg cursor-pointer transition-colors shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="bg-red-50 p-2.5 rounded-full text-red-500 shrink-0">
                <FileText size={18} />
              </div>
              <div>
                <h3 className="m-0 text-base font-semibold text-stone-800 text-left">{song.title}</h3>
                <span className="text-xs text-stone-400 font-bold uppercase tracking-wider">{song.type}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 bg-stone-50 rounded-lg border border-stone-200 text-stone-500">
          No se encontraron partituras que coincidan con la búsqueda.
        </div>
      )}
    </div>
  );
}

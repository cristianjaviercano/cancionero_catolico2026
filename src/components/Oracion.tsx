import React, { useState, useRef } from 'react';
import { Play, Pause, ExternalLink, Heart, Disc } from 'lucide-react';
import { SacredBanner } from './SacredBanner';

interface SunoSong {
  id: string;
  title: string;
  tags: string;
  audio_url: string;
  image_url: string;
}

const SUNO_PLAYLIST: SunoSong[] = [
  {
    "id": "365a7f3f-0204-473d-b128-d840e7b7f3eb",
    "title": "Enséñame a amar",
    "tags": "Piano, Sax, clarinet, melancholic",
    "audio_url": "https://cdn1.suno.ai/365a7f3f-0204-473d-b128-d840e7b7f3eb.mp3",
    "image_url": "https://cdn2.suno.ai/image_365a7f3f-0204-473d-b128-d840e7b7f3eb.jpeg"
  },
  {
    "id": "0f126519-8e62-4d56-969b-53d8bcf249bf",
    "title": "Junto a ti.",
    "tags": "Love, Guitar",
    "audio_url": "https://cdn1.suno.ai/0f126519-8e62-4d56-969b-53d8bcf249bf.mp3",
    "image_url": "https://cdn2.suno.ai/image_0f126519-8e62-4d56-969b-53d8bcf249bf.jpeg"
  },
  {
    "id": "4050f26b-8c41-4c90-95b2-2f8e7d35cf12",
    "title": "Solo te amaré a ti",
    "tags": "Acoustic Guitar, Slow male vocals",
    "audio_url": "https://cdn1.suno.ai/4050f26b-8c41-4c90-95b2-2f8e7d35cf12.mp3",
    "image_url": "https://cdn2.suno.ai/image_4050f26b-8c41-4c90-95b2-2f8e7d35cf12.jpeg"
  },
  {
    "id": "a28e1fb9-2626-43b5-a70e-1c3a092cb0d0",
    "title": "yo te alabare a ti",
    "tags": "piano, gospel",
    "audio_url": "https://cdn1.suno.ai/a28e1fb9-2626-43b5-a70e-1c3a092cb0d0.mp3",
    "image_url": "https://cdn2.suno.ai/image_a28e1fb9-2626-43b5-a70e-1c3a092cb0d0.jpeg"
  },
  {
    "id": "41d4b9d7-0f66-47fc-84b1-ee0389ca89f4",
    "title": "Fuiste tú.",
    "tags": "piano, clarinet, triste y hermosa, línea de bajo suave",
    "audio_url": "https://cdn1.suno.ai/41d4b9d7-0f66-47fc-84b1-ee0389ca89f4.mp3",
    "image_url": "https://cdn2.suno.ai/image_41d4b9d7-0f66-47fc-84b1-ee0389ca89f4.jpeg"
  },
  {
    "id": "90c9228a-6b52-4fa7-acf5-331a1a371c26",
    "title": "Un siervo Agradecido",
    "tags": "piano, acoustic guitar, solo de piano, Male voice",
    "audio_url": "https://cdn1.suno.ai/90c9228a-6b52-4fa7-acf5-331a1a371c26.mp3",
    "image_url": "https://cdn2.suno.ai/image_90c9228a-6b52-4fa7-acf5-331a1a371c26.jpeg"
  },
  {
    "id": "a74df18f-1fc4-455b-8cdc-c1f0d41a0454",
    "title": "EL manto del Custodio (Versión 1)",
    "tags": "piano, acoustic guitar, solo de piano, Male voice",
    "audio_url": "https://cdn1.suno.ai/a74df18f-1fc4-455b-8cdc-c1f0d41a0454.mp3",
    "image_url": "https://cdn2.suno.ai/image_a74df18f-1fc4-455b-8cdc-c1f0d41a0454.jpeg"
  },
  {
    "id": "035f3626-edee-4c53-b232-31d5870de2cf",
    "title": "EL manto del Custodio (Versión 2)",
    "tags": "piano, acoustic guitar, solo de piano, Male voice",
    "audio_url": "https://cdn1.suno.ai/035f3626-edee-4c53-b232-31d5870de2cf.mp3",
    "image_url": "https://cdn2.suno.ai/image_035f3626-edee-4c53-b232-31d5870de2cf.jpeg"
  },
  {
    "id": "7b274825-a7d7-49d1-a814-942bae6de439",
    "title": "A la sombra del altisimo",
    "tags": "piano, acoustic guitar, solo de piano, Male voice",
    "audio_url": "https://cdn1.suno.ai/7b274825-a7d7-49d1-a814-942bae6de439.mp3",
    "image_url": "https://cdn2.suno.ai/image_7b274825-a7d7-49d1-a814-942bae6de439.jpeg"
  },
  {
    "id": "7e7b730c-6ef5-4205-983d-84c8d7175afc",
    "title": "Como un Cirio en el Altar",
    "tags": "Contemporary Christian, Piano Ballad, Worship, Strings",
    "audio_url": "https://cdn1.suno.ai/7e7b730c-6ef5-4205-983d-84c8d7175afc.mp3",
    "image_url": "https://cdn2.suno.ai/image_7e7b730c-6ef5-4205-983d-84c8d7175afc.jpeg"
  },
  {
    "id": "36ee2a61-9236-482e-b9e2-9d16602bc2db",
    "title": "Por Amor Entrego la Vida",
    "tags": "Spanish devotional ballad, nylon arpeggios, gospel piano, intimate",
    "audio_url": "https://cdn1.suno.ai/36ee2a61-9236-482e-b9e2-9d16602bc2db.mp3",
    "image_url": "https://cdn2.suno.ai/image_36ee2a61-9236-482e-b9e2-9d16602bc2db.jpeg"
  }
];

export function Oracion() {
  const [currentSong, setCurrentSong] = useState<SunoSong | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlaySong = (song: SunoSong) => {
    if (currentSong?.id === song.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
    } else {
      setCurrentSong(song);
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.src = song.audio_url;
        audioRef.current.play();
      }
    }
  };

  const togglePlayPause = () => {
    if (!currentSong && SUNO_PLAYLIST.length > 0) {
      handlePlaySong(SUNO_PLAYLIST[0]);
      return;
    }
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      audioRef.current?.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleNext = () => {
    if (!currentSong) return;
    const idx = SUNO_PLAYLIST.findIndex(s => s.id === currentSong.id);
    if (idx !== -1 && idx < SUNO_PLAYLIST.length - 1) {
      handlePlaySong(SUNO_PLAYLIST[idx + 1]);
    } else {
      // Loop to beginning
      handlePlaySong(SUNO_PLAYLIST[0]);
    }
  };

  const handlePrev = () => {
    if (!currentSong) return;
    const idx = SUNO_PLAYLIST.findIndex(s => s.id === currentSong.id);
    if (idx !== -1 && idx > 0) {
      handlePlaySong(SUNO_PLAYLIST[idx - 1]);
    } else {
      // Loop to end
      handlePlaySong(SUNO_PLAYLIST[SUNO_PLAYLIST.length - 1]);
    }
  };

  return (
    <div className="flex flex-col gap-6 py-6 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-3xl mx-auto pb-32">
      {/* Encabezado estilo Misal */}
      <SacredBanner
        badge="Oratio Cordis"
        icon={<Heart size={15} />}
        title="Canciones para Orar"
        subtitle="Una colección especial de cantos e himnos devocionales para momentos de intimidad, adoración y paz."
      />

      {/* Intro a la Playlist */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-red-50 text-red-600 p-2.5 rounded-lg">
            <Heart size={20} className="fill-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-stone-800">Playlist Oficial de Suno</h3>
            <p className="text-xs text-stone-500">Música de oración creada por @crcjm11</p>
          </div>
        </div>
        <a 
          href="https://suno.com/playlist/85fb4b22-d87e-4603-bfd1-c6e0bd68f138" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="btn btn-sm bg-stone-800 hover:bg-stone-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
        >
          Ver en Suno <ExternalLink size={14} />
        </a>
      </div>

      {/* Lista de Canciones */}
      <div className="flex flex-col gap-2.5">
        {SUNO_PLAYLIST.map((song, index) => {
          const isCurrent = currentSong?.id === song.id;
          return (
            <div 
              key={song.id} 
              className={`p-3 bg-white border rounded-xl flex items-center justify-between gap-4 transition-all hover:shadow-sm hover:border-red-100 ${
                isCurrent ? 'border-red-200 bg-red-50/20 shadow-sm ring-1 ring-red-500/20' : 'border-stone-200'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                {/* Portada / Icono */}
                <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-stone-100 bg-stone-50 shadow-sm">
                  <img src={song.image_url} alt={song.title} className="w-full h-full object-cover" />
                  {isCurrent && isPlaying && (
                    <div className="absolute inset-0 bg-stone-950/40 flex items-center justify-center">
                      <Disc className="text-white animate-spin duration-1000" size={20} />
                    </div>
                  )}
                </div>

                {/* Texto */}
                <div className="min-w-0">
                  <h4 className={`font-bold text-base truncate m-0 ${isCurrent ? 'text-red-600' : 'text-stone-800'}`}>
                    {index + 1}. {song.title}
                  </h4>
                  <p className="text-xs text-stone-400 font-medium truncate mt-0.5">{song.tags || "Devocional"}</p>
                </div>
              </div>

              {/* Controles de fila */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handlePlaySong(song)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    isCurrent && isPlaying 
                      ? 'bg-red-500 text-white shadow-md shadow-red-100 hover:bg-red-600' 
                      : 'bg-stone-50 hover:bg-red-50 text-stone-600 hover:text-red-600 border border-stone-200'
                  }`}
                  title={isCurrent && isPlaying ? "Pausar" : "Reproducir"}
                >
                  {isCurrent && isPlaying ? <Pause size={18} fill="white" /> : <Play size={18} className="ml-0.5" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tag de audio HTML5 oculto */}
      <audio 
        ref={audioRef} 
        onTimeUpdate={handleTimeUpdate} 
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleNext}
      />

      {/* Reproductor Flotante en la parte inferior */}
      {currentSong && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 py-3.5 px-4 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] z-40 animate-in fade-in slide-in-from-bottom-6 duration-300 print:hidden">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-6">
            
            {/* Detalles de la pista */}
            <div className="flex items-center gap-3 w-full sm:w-1/3 min-w-0">
              <img src={currentSong.image_url} alt={currentSong.title} className="w-12 h-12 rounded-lg object-cover shadow-sm shrink-0 border border-stone-100" />
              <div className="min-w-0">
                <h5 className="font-bold text-stone-800 text-sm truncate m-0">{currentSong.title}</h5>
                <p className="text-xs text-stone-400 truncate m-0 mt-0.5">@crcjm11 • Suno AI</p>
              </div>
            </div>

            {/* Controles y barra de progreso */}
            <div className="flex flex-col items-center gap-1.5 w-full sm:w-1/2">
              <div className="flex items-center gap-4">
                <button onClick={handlePrev} className="text-stone-400 hover:text-stone-700 transition-colors p-1" title="Anterior">
                  <Play size={16} className="transform rotate-180" />
                </button>
                <button 
                  onClick={togglePlayPause} 
                  className="w-9 h-9 rounded-full bg-stone-800 text-white flex items-center justify-center hover:bg-stone-700 transition-colors shadow-sm"
                  title={isPlaying ? "Pausar" : "Reproducir"}
                >
                  {isPlaying ? <Pause size={16} fill="white" /> : <Play size={16} className="ml-0.5" />}
                </button>
                <button onClick={handleNext} className="text-stone-400 hover:text-stone-700 transition-colors p-1" title="Siguiente">
                  <Play size={16} />
                </button>
              </div>

              {/* Barra de progreso */}
              <div className="flex items-center gap-2 w-full text-[10px] font-semibold text-stone-400">
                <span>{formatTime(currentTime)}</span>
                <input 
                  type="range" 
                  min="0" 
                  max={duration || 100} 
                  value={currentTime} 
                  onChange={handleSeek}
                  className="flex-grow h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-red-500 focus:outline-none"
                />
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Botón Suno e info */}
            <div className="hidden sm:flex items-center justify-end gap-3 w-full sm:w-1/3">
              <a 
                href={`https://suno.com/song/${currentSong.id}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-stone-500 hover:text-stone-800 text-xs font-semibold flex items-center gap-1 transition-colors border border-stone-200 rounded-lg px-2.5 py-1.5 bg-stone-50"
              >
                Abrir Tema <ExternalLink size={12} />
              </a>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

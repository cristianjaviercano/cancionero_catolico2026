import React from 'react';
import { Link } from 'react-router-dom';
import { useTuner } from '../hooks/useTuner';
import { Mic, MicOff, HelpCircle, Radio } from 'lucide-react';
import { SectionLayout } from './SectionLayout';

export function Tuner() {
  const [imgError, setImgError] = React.useState(false);
  const { note, cents, frequency, isActive, startTuner, stopTuner } = useTuner();

  // Limitar los cents entre -50 y 50 para el indicador visual
  const visualCents = Math.max(-50, Math.min(50, cents));
  const rotation = (visualCents / 50) * 45; // rotación de -45 a 45 grados

  let statusColor = 'text-stone-500';
  let message = 'Toca una cuerda...';
  
  if (isActive && note !== '-') {
    if (Math.abs(cents) < 5) {
      statusColor = 'text-green-500';
      message = '¡Afinado!';
    } else if (cents < 0) {
      statusColor = 'text-red-500';
      message = 'Muy grave, tensa la cuerda';
    } else {
      statusColor = 'text-red-500';
      message = 'Muy aguda, afloja la cuerda';
    }
  }

  return (
    <SectionLayout
      title="Afinador de Guitarra"
      description="Afina tu instrumento con alta precisión usando el micrófono de tu dispositivo. Visualización en tiempo real."
      icon={<Radio size={32} className="text-white" />}
      imageSrc="/imagenes/afinador_portada.webp"
      colorTheme="emerald"
    >
      <div className="flex flex-col items-center justify-center p-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-stone-200/80 animate-in fade-in max-w-md mx-auto overflow-hidden">
        <div className="flex items-center gap-2 mb-8">
        <h2 className="text-2xl font-bold text-stone-800 m-0">Afinador de Guitarra</h2>
        <Link 
          to="/tutorial?tab=tuner" 
          className="text-stone-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-stone-50 flex items-center justify-center"
          title="Guía de Afinación"
        >
          <HelpCircle size={18} />
        </Link>
      </div>
      
      <div className="relative w-full max-w-[280px] h-40 mb-4 overflow-hidden flex flex-col items-center">
        <svg viewBox="0 0 200 100" className="w-full h-full overflow-visible">
          {/* Fondo del arco */}
          <path d="M 10 90 A 80 80 0 0 1 190 90" fill="none" stroke="#e5e7eb" strokeWidth="8" strokeLinecap="round" />
          
          {/* Zona roja izquierda (Grave) */}
          <path d="M 10 90 A 80 80 0 0 1 45 40" fill="none" stroke="#fca5a5" strokeWidth="8" strokeLinecap="round" />
          
          {/* Zona roja derecha (Aguda) */}
          <path d="M 155 40 A 80 80 0 0 1 190 90" fill="none" stroke="#fca5a5" strokeWidth="8" strokeLinecap="round" />
          
          {/* Zona verde central (Afinado) */}
          <path d="M 85 18 A 80 80 0 0 1 115 18" fill="none" stroke="#22c55e" strokeWidth="8" strokeLinecap="round" />
          
          {/* Aguja dinámica */}
          {isActive && note !== '-' && (
            <g style={{ transform: `rotate(${rotation}deg)`, transformOrigin: '100px 90px', transition: 'transform 0.1s ease-out' }}>
              <line x1="100" y1="90" x2="100" y2="20" stroke="#292524" strokeWidth="4" strokeLinecap="round" />
              <circle cx="100" cy="90" r="8" fill="#292524" />
              <circle cx="100" cy="90" r="3" fill="#ffffff" />
            </g>
          )}
          
          {/* Centro en reposo */}
          {(!isActive || note === '-') && (
            <g>
              <line x1="100" y1="90" x2="100" y2="20" stroke="#a8a29e" strokeWidth="4" strokeLinecap="round" strokeDasharray="4 4" />
              <circle cx="100" cy="90" r="8" fill="#a8a29e" />
            </g>
          )}
        </svg>
      </div>

      <div className="text-center mb-8 h-24">
        <div className={`text-6xl font-bold mb-2 ${statusColor} transition-colors`}>
          {note}
        </div>
        {isActive && note !== '-' && (
          <div className="flex flex-col items-center">
            <span className={`text-sm font-bold ${statusColor}`}>{message}</span>
            <span className="text-xs font-medium text-stone-400 mt-1">{cents > 0 ? '+' : ''}{cents} cents ({frequency.toFixed(1)} Hz)</span>
          </div>
        )}
        {isActive && note === '-' && (
          <span className="text-sm font-bold text-stone-400">Escuchando...</span>
        )}
        {!isActive && (
          <span className="text-sm font-bold text-stone-400">El afinador está apagado</span>
        )}
      </div>

      <button
        onClick={isActive ? stopTuner : startTuner}
        className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all shadow-sm ${
          isActive 
            ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' 
            : 'bg-stone-800 text-white hover:bg-stone-700'
        }`}
      >
        {isActive ? (
          <>
            <MicOff size={20} /> Detener Afinador
          </>
        ) : (
          <>
            <Mic size={20} /> Encender Afinador
          </>
        )}
      </button>
      </div>
    </SectionLayout>
  );
}

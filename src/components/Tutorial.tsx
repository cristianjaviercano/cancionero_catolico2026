import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  BookOpen, 
  Music, 
  Plus, 
  Minus, 
  RotateCcw, 
  Play, 
  ListMusic, 
  Mic, 
  Info,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Smartphone,
  Music4
} from 'lucide-react';
import { transposeChord, formatChord, parseSongContent } from '../utils/musicTheory';

export function Tutorial() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'quickstart';
  
  // States for Simulator
  const [simTranspose, setSimTranspose] = useState(0);
  const [simNotation, setSimNotation] = useState<'american' | 'latin'>('american');
  
  const simSongContent = `[G]Alabaré, [G]alabaré, alaba[Em]ré a mi Se[Am]ñor.
[D7]Alabaré, alaba[Am]ré, alaba[D7]ré a mi Se[G]ñor.

[G]Todos cantaban con gozo, todos cantaban al Se[D7]ñor.
Mil querubines a[Am]laban [D7]siempre al cread[G]or.`;

  const simParsedLines = parseSongContent(simSongContent);

  const handleSetActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  return (
    <div className="flex flex-col gap-8 py-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Title Header */}
      <div className="text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-250 pb-6">
        <div>
          <div className="flex items-center justify-center md:justify-start gap-2 text-red-500 font-bold mb-1.5">
            <Sparkles size={20} className="animate-pulse" />
            <span className="text-xs uppercase tracking-wider font-bold">Centro de Aprendizaje</span>
          </div>
          <h1 className="text-3xl font-extrabold text-stone-800 m-0">
            Guía de Uso & Tutoriales
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Aprende a dominar todas las herramientas del cancionero para tu ministerio musical.
          </p>
        </div>
        
        {/* Navigation back to index */}
        <Link to="/" className="btn btn-primary self-center md:self-auto py-2.5 px-5 shadow-sm text-sm">
          Ir al Inicio
        </Link>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto gap-1.5 p-1.5 bg-stone-100 rounded-xl border border-stone-200 shadow-inner print:hidden">
        {[
          { id: 'quickstart', label: 'Inicio Rápido', icon: BookOpen },
          { id: 'cifrado', label: 'Cifrado & Tonos', icon: Music },
          { id: 'build', label: 'Armar Celebración', icon: ListMusic },
          { id: 'tuner', label: 'Afinador', icon: Mic },
          { id: 'play', label: 'Modo Reproducción', icon: Play }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleSetActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap border-none ${
                isActive 
                  ? 'bg-white text-red-600 shadow-sm font-bold scale-[1.02]' 
                  : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50/50'
              }`}
              style={{
                backgroundColor: isActive ? '#ffffff' : 'transparent',
                color: isActive ? '#dc2626' : undefined
              }}
            >
              <Icon size={18} className={isActive ? 'text-red-500' : 'text-stone-400'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 md:p-8 min-h-[400px]">
        
        {/* 1. QUICKSTART TAB */}
        {activeTab === 'quickstart' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-xl font-bold text-stone-800 mb-2 flex items-center gap-2">
                <BookOpen className="text-red-500" size={22} /> Estructura de la Aplicación
              </h2>
              <p className="text-stone-500 text-sm">
                Esta plataforma está diseñada para facilitar la animación musical de las celebraciones litúrgicas. Aquí tienes un mapa rápido de sus funciones principales.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div 
                className="bg-stone-50 p-5 rounded-xl border border-stone-200 cursor-pointer hover:border-red-200 hover:shadow-sm transition-all"
                onClick={() => handleSetActiveTab('cifrado')}
              >
                <div className="bg-red-50 text-red-500 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
                  <Music size={20} />
                </div>
                <h3 className="font-bold text-stone-850 mb-1 flex items-center justify-between">
                  Repertorio & Acordes <ChevronRight size={16} className="text-stone-400" />
                </h3>
                <p className="text-xs text-stone-500">
                  Busca cantos, cambia el tono de los acordes en un clic, alterna cifrados y exporta a PDF.
                </p>
              </div>

              <div 
                className="bg-stone-50 p-5 rounded-xl border border-stone-200 cursor-pointer hover:border-blue-200 hover:shadow-sm transition-all"
                onClick={() => handleSetActiveTab('build')}
              >
                <div className="bg-blue-50 text-blue-500 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
                  <ListMusic size={20} />
                </div>
                <h3 className="font-bold text-stone-850 mb-1 flex items-center justify-between">
                  Diseñador de Celebraciones <ChevronRight size={16} className="text-stone-400" />
                </h3>
                <p className="text-xs text-stone-500">
                  Organiza cantos para la misa dominical, solemnidades o retiros paso a paso de forma coherente.
                </p>
              </div>

              <div 
                className="bg-stone-50 p-5 rounded-xl border border-stone-200 cursor-pointer hover:border-emerald-200 hover:shadow-sm transition-all"
                onClick={() => handleSetActiveTab('tuner')}
              >
                <div className="bg-emerald-50 text-emerald-500 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
                  <Mic size={20} />
                </div>
                <h3 className="font-bold text-stone-850 mb-1 flex items-center justify-between">
                  Afinador en Tiempo Real <ChevronRight size={16} className="text-stone-400" />
                </h3>
                <p className="text-xs text-stone-500">
                  Usa el micrófono para afinar tu guitarra u otros instrumentos antes de empezar a cantar.
                </p>
              </div>

              <div 
                className="bg-stone-50 p-5 rounded-xl border border-stone-200 cursor-pointer hover:border-purple-200 hover:shadow-sm transition-all"
                onClick={() => handleSetActiveTab('play')}
              >
                <div className="bg-purple-50 text-purple-500 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
                  <Play size={20} />
                </div>
                <h3 className="font-bold text-stone-850 mb-1 flex items-center justify-between">
                  Modo Reproducción en Vivo <ChevronRight size={16} className="text-stone-400" />
                </h3>
                <p className="text-xs text-stone-500">
                  Modo sin distracciones durante la liturgia, con autodesplazamiento de letra y batería acústica.
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4 flex gap-3 items-start">
              <Info className="text-amber-500 shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-bold text-amber-900 text-sm mb-0.5">Consejo del Ministerio</h4>
                <p className="text-xs text-amber-800">
                  Puedes registrarte de forma gratuita con Google o Correo para guardar tus propias canciones privadas, editar las existentes y armar listas personalizadas que se sincronizan en tu celular y tableta.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. CHORDS & TRANSPOSITION TAB */}
        {activeTab === 'cifrado' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-xl font-bold text-stone-800 mb-2 flex items-center gap-2">
                <Music className="text-red-500" size={22} /> Cifrado de Acordes y Transposición
              </h2>
              <p className="text-stone-500 text-sm">
                Aprende cómo cambiar el tono de una canción para adaptarla al rango vocal de tu ministerio o de la asamblea.
              </p>
            </div>

            {/* Explanatory notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="space-y-4">
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                  <h3 className="font-bold text-stone-800 text-sm mb-2">Tipos de Cifrado</h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Nuestra aplicación admite dos formatos de notación. Puedes alternarlos en la barra superior en cualquier momento:
                  </p>
                  <table className="w-full text-xs mt-3 border-collapse">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-400 font-bold">
                        <th className="text-left py-1">Americano</th>
                        <th className="text-left py-1">Latino</th>
                      </tr>
                    </thead>
                    <tbody className="text-stone-700 font-medium">
                      <tr><td className="py-1">C, D, E, F, G, A, B</td><td className="py-1">Do, Re, Mi, Fa, Sol, La, Si</td></tr>
                      <tr><td className="py-1">C# / Db</td><td className="py-1">Do# / Reb</td></tr>
                      <tr><td className="py-1">Am, G7, Fmaj7</td><td className="py-1">Lam, Sol7, Famaj7</td></tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                  <h3 className="font-bold text-stone-800 text-sm mb-2">¿Cómo funciona la Transposición?</h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    La transposición se calcula en <strong>semitonos</strong> (un traste en la guitarra o una tecla contigua en el piano). 
                    Al presionar <span className="font-bold text-red-600">+1</span>, todos los acordes suben medio tono. 
                    Al presionar <span className="font-bold text-red-600">-1</span>, todos bajan medio tono.
                  </p>
                </div>
              </div>

              {/* SIMULATOR */}
              <div className="bg-stone-900 text-stone-100 p-5 rounded-xl border border-stone-950 flex flex-col gap-4 shadow-md">
                <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                    <span className="text-xs font-bold uppercase tracking-wider text-red-400">Simulador de Tono</span>
                  </div>
                  
                  {/* Selector de Cifrado */}
                  <button
                    onClick={() => setSimNotation(n => n === 'american' ? 'latin' : 'american')}
                    className="text-[10px] font-bold bg-stone-800 hover:bg-stone-750 text-stone-300 px-2 py-1 rounded border border-stone-700 transition-colors cursor-pointer"
                  >
                    Notación: <span className="text-red-400 uppercase">{simNotation === 'american' ? 'Am' : 'Lat'}</span>
                  </button>
                </div>

                {/* Simulated Viewer */}
                <div className="bg-white text-stone-800 p-4 rounded-lg border border-stone-200 overflow-x-auto font-sans min-h-[140px]">
                  {simParsedLines.map((line, lineIdx) => (
                    <div key={lineIdx} className="song-line" style={{ marginBottom: '0.4rem' }}>
                      {line.map((word, wordIdx) => (
                        <span key={wordIdx} className="song-word">
                          {word.segments.map((segment, segmentIdx) => (
                            <span key={segmentIdx} className="song-segment">
                              {segment.chord ? (
                                <span className="chord text-xs font-bold text-red-600 font-mono block h-4">
                                  {formatChord(simTranspose !== 0 ? transposeChord(segment.chord, simTranspose) : segment.chord, simNotation)}
                                </span>
                              ) : (
                                <span className="chord-placeholder text-xs block h-4">&nbsp;</span>
                              )}
                              <span className="lyric text-sm block">
                                {segment.lyric || '\u00A0'}
                              </span>
                            </span>
                          ))}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Transpose Simulator Controls */}
                <div className="flex items-center justify-between gap-3 mt-1 bg-stone-950 p-2.5 rounded-lg border border-stone-800">
                  <button 
                    onClick={() => setSimTranspose(t => t - 1)}
                    className="btn btn-icon bg-stone-800 hover:bg-stone-700 text-stone-300 w-8 h-8 rounded-full border border-stone-700 cursor-pointer p-0"
                    title="Bajar medio tono"
                  >
                    <Minus size={14} />
                  </button>
                  
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] font-bold text-stone-500 uppercase">Ajuste Tono</span>
                    <span className="font-mono font-bold text-red-400 text-sm">
                      {simTranspose > 0 ? `+${simTranspose}` : simTranspose} semitonos
                    </span>
                  </div>

                  <button 
                    onClick={() => setSimTranspose(t => t + 1)}
                    className="btn btn-icon bg-stone-800 hover:bg-stone-700 text-stone-300 w-8 h-8 rounded-full border border-stone-700 cursor-pointer p-0"
                    title="Subir medio tono"
                  >
                    <Plus size={14} />
                  </button>
                  
                  {simTranspose !== 0 && (
                    <button 
                      onClick={() => setSimTranspose(0)}
                      className="text-xs bg-red-950/40 text-red-400 hover:bg-red-900/40 px-2 py-1 rounded border border-red-900/60 cursor-pointer transition-colors"
                    >
                      <RotateCcw size={12} className="inline mr-1" /> Reset
                    </button>
                  )}
                </div>
                
                <p className="text-[10px] text-stone-400 text-center italic">
                  Prueba presionando los botones + / - arriba y observa cómo los acordes cambian dinámicamente.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 3. LITURGICAL MASS BUILDER TAB */}
        {activeTab === 'build' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-xl font-bold text-stone-800 mb-2 flex items-center gap-2">
                <ListMusic className="text-red-500" size={22} /> Armado de la Celebración Litúrgica
              </h2>
              <p className="text-stone-500 text-sm">
                La Eucaristía tiene un orden litúrgico riguroso. Nuestra herramienta te ayuda a armar el repertorio perfecto sin olvidar ningún momento de la misa.
              </p>
            </div>

            {/* Liturgical Flow Chart */}
            <div className="bg-stone-50 p-6 rounded-xl border border-stone-200">
              <h3 className="font-bold text-stone-800 text-sm mb-4">Secuencia Litúrgica Recomendada</h3>
              
              <div className="relative border-l border-red-200 pl-6 ml-3 space-y-6">
                <div className="relative">
                  <span className="absolute -left-9 top-0.5 bg-red-100 text-red-600 rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">1</span>
                  <h4 className="font-bold text-stone-800 text-sm">Ritos Iniciales</h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    <strong>Canto de Entrada</strong> (alegre, de convocación) y <strong>Señor Ten Piedad</strong>. Dependiendo del tiempo litúrgico, se canta el <strong>Gloria</strong> (se omite en Adviento y Cuaresma).
                  </p>
                </div>

                <div className="relative">
                  <span className="absolute -left-9 top-0.5 bg-red-100 text-red-600 rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">2</span>
                  <h4 className="font-bold text-stone-800 text-sm">Liturgia de la Palabra</h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    <strong>Salmo Responsorial</strong> (preferiblemente cantado) y el <strong>Aleluya / Aclamación</strong> antes del Evangelio (en Cuaresma se canta "Honor y Gloria a Ti" en vez de Aleluya).
                  </p>
                </div>

                <div className="relative">
                  <span className="absolute -left-9 top-0.5 bg-red-100 text-red-600 rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">3</span>
                  <h4 className="font-bold text-stone-800 text-sm">Liturgia Eucarística</h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    <strong>Canto de Ofertorio</strong> (presentación del pan y el vino), el prefacio cantando el <strong>Santo</strong>, y el <strong>Cordero de Dios</strong> que acompaña la fracción del pan.
                  </p>
                </div>

                <div className="relative">
                  <span className="absolute -left-9 top-0.5 bg-red-100 text-red-600 rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">4</span>
                  <h4 className="font-bold text-stone-800 text-sm">Comunión y Salida</h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    <strong>Canto de Comunión</strong> (íntimo, de unión en Cristo), opcionalmente un <strong>Canto de Meditación / Acción de gracias</strong>, y el <strong>Canto de Salida</strong> (misión, devoción a la Virgen María).
                  </p>
                </div>
              </div>
            </div>

            {/* Step by Step Mass Builder instructions */}
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
              <h3 className="font-bold text-stone-800 text-sm mb-3">¿Cómo usar la herramienta "Armar Celebración"?</h3>
              <ul className="space-y-3.5 text-xs text-stone-600">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>Ve a la sección <strong>Armar Celebración</strong> en el menú superior o de inicio.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>Haz clic en <strong>"Seleccionar Canto"</strong> en el espacio del rito litúrgico que desees añadir (ej. Entrada, Ofertorio). Se abrirá un panel lateral con tus cantos.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>Filtra los cantos por su categoría litúrgica para asegurarte de que encajen teológicamente con ese momento de la misa.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>Una vez completes tu repertorio, haz clic en <strong>"Iniciar Celebración"</strong> para pasar al <strong>Modo Reproducción</strong>.</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* 4. GUITAR TUNER TAB */}
        {activeTab === 'tuner' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-xl font-bold text-stone-800 mb-2 flex items-center gap-2">
                <Mic className="text-red-500" size={22} /> Afinación de Instrumentos
              </h2>
              <p className="text-stone-500 text-sm">
                Mantener tu guitarra afinada es vital para guiar la asamblea. Aquí te explicamos cómo usar el afinador integrado.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Reference notes and tuning gauge explanation */}
              <div className="space-y-4">
                <div className="bg-stone-50 p-5 rounded-xl border border-stone-200">
                  <h3 className="font-bold text-stone-800 text-sm mb-2">Las Notas de la Guitarra (Afinación Estándar)</h3>
                  <p className="text-xs text-stone-600 mb-3">
                    La afinación estándar de las cuerdas de la guitarra, desde la más gruesa (6ª) hasta la más delgada (1ª) es:
                  </p>
                  <div className="flex gap-2 justify-center font-mono font-bold text-sm">
                    {['E (Mi)', 'A (La)', 'D (Re)', 'G (Sol)', 'B (Si)', 'E (Mi)'].map((note, idx) => (
                      <div key={idx} className="flex flex-col items-center bg-white p-2 rounded-lg border border-stone-200 min-w-[50px] shadow-sm">
                        <span className="text-red-600">{note.split(' ')[0]}</span>
                        <span className="text-[10px] text-stone-400 font-sans mt-0.5">{note.split(' ')[1]}</span>
                        <span className="text-[9px] text-stone-300 font-sans">{6 - idx}ª</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-stone-50 p-5 rounded-xl border border-stone-200">
                  <h3 className="font-bold text-stone-800 text-sm mb-3">Cómo interpretar la aguja</h3>
                  <ul className="space-y-2.5 text-xs text-stone-600">
                    <li className="flex items-start gap-2">
                      <span className="w-3.5 h-3.5 rounded-full bg-red-500 shrink-0 mt-0.5"></span>
                      <span><strong>Aguja a la izquierda (Cents &lt; 0):</strong> La nota es muy grave o baja (flat). Debes <strong>tensar</strong> la cuerda girando la clavija correspondiente.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-3.5 h-3.5 rounded-full bg-red-500 shrink-0 mt-0.5"></span>
                      <span><strong>Aguja a la derecha (Cents &gt; 0):</strong> La nota es muy aguda o alta (sharp). Debes <strong>aflojar</strong> la cuerda girando la clavija en sentido inverso.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shrink-0 mt-0.5"></span>
                      <span><strong>Aguja en el centro verde (Cents entre -5 y +5):</strong> La cuerda está correctamente afinada. El indicador se iluminará de color <strong>verde</strong>.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Troubleshooting microphone */}
              <div className="bg-white border border-stone-200 p-5 rounded-xl shadow-sm flex flex-col gap-4">
                <h3 className="font-bold text-stone-850 text-sm border-b border-stone-200 pb-2 mb-1 flex items-center gap-1.5">
                  <Info size={16} className="text-red-500" /> Solución de problemas comunes
                </h3>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-stone-800 text-xs mb-1">1. Permitir acceso al micrófono</h4>
                    <p className="text-xs text-stone-500 leading-relaxed">
                      La primera vez que uses el afinador, el navegador web te solicitará acceso al micrófono. Debes seleccionar <strong>"Permitir"</strong>. Si lo bloqueaste por error, haz clic en el icono de candado o micrófono al lado de la barra de dirección URL del navegador y restablece los permisos.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-stone-800 text-xs mb-1">2. Interferencia de Ruido</h4>
                    <p className="text-xs text-stone-500 leading-relaxed">
                      El afinador funciona analizando las frecuencias de sonido en tiempo real. Trata de afinar en un lugar silencioso. El ruido de fondo, la gente hablando o el eco de la iglesia pueden confundir al algoritmo de detección.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-stone-800 text-xs mb-1">3. Toques limpios y pausados</h4>
                    <p className="text-xs text-stone-500 leading-relaxed">
                      Toca la cuerda una sola vez y deja que resuene de forma limpia. Tocar la cuerda repetidamente y de forma muy rápida satura el micrófono e impide la detección correcta del tono de la cuerda.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. PLAY MODE TAB */}
        {activeTab === 'play' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-xl font-bold text-stone-800 mb-2 flex items-center gap-2">
                <Play className="text-red-500" size={22} /> Modo Reproducción y Autodesplazamiento
              </h2>
              <p className="text-stone-500 text-sm">
                Cuando estés cantando en el altar, necesitas tener las manos ocupadas solo en el instrumento. El Modo Reproducción automatiza la vista de acordes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Features lists */}
              <div className="bg-stone-50 p-5 rounded-xl border border-stone-200 space-y-4">
                <h3 className="font-bold text-stone-800 text-sm">Características Principales</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Smartphone className="text-red-500 mt-0.5 shrink-0" size={16} />
                    <div>
                      <h4 className="font-bold text-stone-800 text-xs">Diseño sin Distracciones</h4>
                      <p className="text-xs text-stone-500">Oculta cabeceras y menús innecesarios para maximizar el tamaño de la letra de la canción.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Smartphone className="text-red-500 mt-0.5 shrink-0" size={16} />
                    <div>
                      <h4 className="font-bold text-stone-800 text-xs">Desplazamiento Automático</h4>
                      <p className="text-xs text-stone-500">Desplazamiento vertical fluido de la letra. Puedes ajustar la velocidad en píxeles por segundo o pausar el desplazamiento con un botón.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Smartphone className="text-red-500 mt-0.5 shrink-0" size={16} />
                    <div>
                      <h4 className="font-bold text-stone-800 text-xs">Control con Gestos</h4>
                      <p className="text-xs text-stone-500">En tabletas o celulares, desliza el dedo a la izquierda o derecha para cambiar rápidamente a la siguiente canción de la liturgia.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Arranger and rhythm triggers */}
              <div className="bg-white border border-stone-200 p-5 rounded-xl shadow-sm space-y-4">
                <h3 className="font-bold text-stone-850 text-sm border-b border-stone-200 pb-2 flex items-center gap-1.5">
                  <Music4 size={18} className="text-red-500" /> Acompañamiento Rítmico y Estudio
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Si estás practicando o si tu ministerio carece de percusionista, puedes usar el <strong>Estudio de Acompañamiento</strong> integrado en las canciones:
                </p>
                <ul className="list-disc pl-5 text-xs text-stone-500 space-y-2">
                  <li><strong>Rhythm Beats:</strong> Elige entre ritmos de Vals (3/4), Balada (4/4) o Pop (4/4) de fondo.</li>
                  <li><strong>Tempo (BPM):</strong> Modifica la velocidad del beat para que se ajuste perfectamente al ritmo de tu ministerio.</li>
                  <li><strong>Botonera de Acordes:</strong> Toca los botones de acordes individuales para escuchar las notas armonizadas que componen dicho acorde, ideal para afinar el oído o aprender la entonación.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Award, Calendar, CheckCircle2, Clock, Flame, Guitar, ListChecks,
  Music, Play, RotateCcw, Sparkles, Square, Star, Users, Mic
} from 'lucide-react';
import { SectionLayout } from './SectionLayout';
import { strumPlayer } from '../utils/strumPlayer';
import { RASGUEOS, ARPEGIOS, type Patron } from '../utils/accompaniment';
import type { Song } from '../hooks/useSongs';

interface ScholaCantorumProps {
  songs: Song[];
}

interface DayTask {
  day: number;
  week: number;
  title: string;
  task: string;
  chords?: string[];
  suggestedSongTitle?: string;
}

const RETO_30_DIAS: DayTask[] = [
  // Semana 1: Los primeros acordes
  { day: 1, week: 1, title: 'Postura y afinación', task: 'Toca cada cuerda al aire y nómbrala: MI LA RE SOL SI MI. Verifica con el Afinador.', chords: ['E', 'A', 'D', 'G', 'B'] },
  { day: 2, week: 1, title: 'Tu primer acorde: DO (C)', task: 'Aprende DO mayor. Toca 4 bajadas lentas, suelta la mano y vuelve a armarlo. Repite 20 veces.', chords: ['C'] },
  { day: 3, week: 1, title: 'Acorde SOL (G) y transición', task: 'Aprende SOL mayor. Alterna DO y SOL contando hasta 4 tiempos en cada uno.', chords: ['C', 'G'] },
  { day: 4, week: 1, title: 'El color menor: lam (Am)', task: 'Aprende La menor (sonido íntimo de recogimiento). Alterna lam y DO sin perder el pulso.', chords: ['Am', 'C'] },
  { day: 5, week: 1, title: 'Acordes RE (D) y mim (Em)', task: 'Practica la postura de RE mayor (desde la 4ª cuerda) y Mi menor.', chords: ['D', 'Em'] },
  { day: 6, week: 1, title: 'Gran repaso de la Semana 1', task: 'Encadena DO → SOL → lam → mim → RE, haciendo 4 bajadas tranquilas en cada uno.', chords: ['C', 'G', 'Am', 'Em', 'D'] },
  { day: 7, week: 1, title: 'Descanso activo y oído litúrgico', task: 'Escucha o revisa 3 cantos del repertorio e identifica qué acordes utilizan.' },
  // Semana 2: Cambios de acordes
  { day: 8, week: 2, title: 'Cambio a ciegas DO → SOL', task: 'Cambia entre DO y SOL sin mirar el mástil durante 1 minuto continuo.', chords: ['C', 'G'] },
  { day: 9, week: 2, title: 'Cambio en bloque SOL → RE', task: 'Practica el paso de SOL a RE intentando mover todos los dedos al mismo tiempo.', chords: ['G', 'D'] },
  { day: 10, week: 2, title: 'Cadencia menor lam → mim → DO', task: 'Domina esta progresión suave muy frecuente en cantos de meditación y perdón.', chords: ['Am', 'Em', 'C'] },
  { day: 11, week: 2, title: 'FA simplificado y LA mayor', task: 'Aprende FA simplificado (4 cuerdas sin cejilla completa) y LA mayor.', chords: ['F', 'A'] },
  { day: 12, week: 2, title: 'El Juego del Minuto', task: 'Activa el temporizador y cuenta cuántos cambios limpios DO ↔ SOL logras en 60 segundos.', chords: ['C', 'G'] },
  { day: 13, week: 2, title: 'Tu primer canto completo', task: 'Toca tu primer canto fácil de 2 acordes marcando solo las bajadas del pulso.', chords: ['G', 'Dm'], suggestedSongTitle: 'Alzad las Manos' },
  { day: 14, week: 2, title: 'Cantar y acompañar', task: 'Repite el canto de ayer incorporando tu voz suavemente sin detener la mano derecha.', chords: ['G', 'Dm'], suggestedSongTitle: 'Alzad las Manos' },
  // Semana 3: Ritmo
  { day: 15, week: 3, title: 'Balada básica con un acorde', task: 'Practica el patrón de Balada básica (↓ · ↓ ↑ · ↑ ↓ ↑) manteniendo la muñeca suelta.', chords: ['G'] },
  { day: 16, week: 3, title: 'Balada cambiando DO y SOL', task: 'Une el patrón de Balada básica con el cambio entre DO y SOL a 70 BPM.', chords: ['C', 'G'] },
  { day: 17, week: 3, title: 'Marcha de entrada', task: 'Practica el rasgueo firme de Marcha de Entrada acentuando el tiempo 1 con RE y SOL.', chords: ['D', 'G'] },
  { day: 18, week: 3, title: 'Segundo canto con Balada', task: 'Aplica el rasgueo de balada a un canto de 3 acordes.', chords: ['G', 'C', 'F'], suggestedSongTitle: '(cántico Isaías 12) Canto de Victoria' },
  { day: 19, week: 3, title: 'Ritmo de Vals (3/4)', task: 'Cuenta 1-2-3: toca el bajo con el pulgar en el 1 y rasguea hacia abajo en el 2 y 3.', chords: ['G', 'D'] },
  { day: 20, week: 3, title: 'Tercer canto completo', task: 'Ejecuta de principio a fin un salmo o canto de alabanza de 3 acordes.', chords: ['G', 'C', 'D'], suggestedSongTitle: '(s. 29) Rendid a Yahvé' },
  { day: 21, week: 3, title: 'Autoevaluación auditiva', task: 'Grábate con el celular tocando uno de los cantos aprendidos y escucha tu regularidad rítmica.' },
  // Semana 4: Cantos completos
  { day: 22, week: 4, title: 'Canto de Entrada completo', task: 'Toca un canto de Entrada completo manteniendo el ánimo y el tempo estable.', suggestedSongTitle: 'Gracias Señor' },
  { day: 23, week: 4, title: 'Comunión con Arpegio Lento', task: 'Practica el arpegio p-i-m-a-m-i-p-i en un canto de Comunión o meditación.', suggestedSongTitle: 'Alabaré' },
  { day: 24, week: 4, title: 'Canto a la Virgen en Vals', task: 'Acompaña un canto mariano en compás de 3/4 cuidando la dulzura del volumen.', suggestedSongTitle: 'Gracias María' },
  { day: 25, week: 4, title: 'Diseña tu primera Misa', task: 'Ve a Ordo Missae (Armar Celebración) y selecciona los cantos de una misa completa con acordes que domines.' },
  { day: 26, week: 4, title: 'Ensayo general de la Misa', task: 'Pasa todos los cantos de tu celebración en orden, practicando las entradas y los finales.' },
  { day: 27, week: 4, title: 'Compartir el don', task: 'Toca un par de cantos para tu familia, comunidad o grupo de oración.' },
  { day: 28, week: 4, title: 'Perfeccionamiento de transiciones', task: 'Repasa los cambios de acordes que más te hayan costado durante el mes.' },
  { day: 29, week: 4, title: 'Dominio sin mirar', task: 'Toca tus 3 cantos favoritos mirando únicamente la letra o a la asamblea.' },
  { day: 30, week: 4, title: 'Consagración del Ministerio', task: '¡Meta alcanzada! Revisa tu progreso y genera tu Certificado del Reto de 30 Días.' }
];

const CANTOS_MAS_FACILES = [
  { title: 'Alzad las Manos', chords: ['G', 'Dm'] },
  { title: '(cántico Isaías 12) Canto de Victoria', chords: ['G', 'C', 'F'] },
  { title: '(s. 29) Rendid a Yahvé', chords: ['G', 'C', 'D'] },
  { title: '(s. 50) Crea en Mí (a)', chords: ['C', 'G', 'D'] },
  { title: 'Aleluya “solo Tú Tienes”', chords: ['D', 'A', 'G'] },
  { title: 'Cristo Yo te Adoro', chords: ['Em', 'D', 'G'] },
  { title: 'Gloria Cantan', chords: ['D', 'A', 'G'] },
  { title: 'Gracias María', chords: ['C', 'G', 'D'] },
  { title: 'Margaritas', chords: ['D', 'C', 'G'] },
  { title: 'Preparad', chords: ['G', 'C', 'D'] },
  { title: 'Señora Doña María', chords: ['A', 'E', 'D'] },
  { title: '(s. 88) la Misericordia del Señor (a)', chords: ['Dm', 'A', 'C', 'F'] },
  { title: 'Canción del Misionero', chords: ['G', 'D', 'Em', 'C'] },
  { title: 'Con Amor', chords: ['G', 'Dm', 'F', 'C'] },
  { title: 'Cordero, Danos Paz', chords: ['C', 'Am', 'F', 'G'] },
  { title: 'Emaús', chords: ['D', 'Am', 'C', 'G'] },
  { title: 'Gracias Señor', chords: ['G', 'Em', 'C', 'D'] },
  { title: 'Magníficat', chords: ['C', 'A', 'D', 'Em'] },
  { title: 'Perdón Señor, Sálvame', chords: ['Em', 'C', 'D', 'G'] },
  { title: 'Pueblo Mío, Respóndeme', chords: ['Am', 'C', 'Dm', 'E'] },
  { title: 'Renace la Vida y el Corazón', chords: ['C', 'G', 'Am', 'F'] },
  { title: 'Santo “sal y Luz”', chords: ['C', 'G', 'F', 'D'] },
  { title: 'Señor, Ten Piedad de Nosotros', chords: ['Em', 'D', 'C', 'G'] },
  { title: 'Y (s. 17) Todo mi Amor es Para Ti', chords: ['D', 'A', 'G', 'E'] }
];

const PATRONES_MISA = [
  {
    id: 'balada',
    name: '1. Balada básica',
    compas: '4/4',
    momentos: 'Comunión, Ofrendas, cantos de meditación',
    consejo: 'El rasgueo más usado en la misa. Suave, sin golpear fuerte. Si te cuesta, empieza solo con las bajadas.',
    practica: ['Bendito Seas', 'Después de Preparar', 'Negra es la Uva', 'Alabaré'],
    chords: ['C', 'Am', 'F', 'G']
  },
  {
    id: 'marcha',
    name: '2. Marcha de entrada',
    compas: '4/4',
    momentos: 'Entrada, Salida, Aleluya, Gloria festivo',
    consejo: 'Firme y con ánimo, para que la asamblea se sume a cantar. Marca bien el tiempo 1.',
    practica: ['Gracias Señor', 'Haz Cantar tu Vida', 'Hosanna Hey', 'Hoy Llegamos a Casa'],
    chords: ['G', 'Em', 'C', 'D']
  },
  {
    id: 'vals',
    name: '3. Vals litúrgico',
    compas: '3/4',
    momentos: 'Cantos marianos, Navidad, algunos Salmos',
    consejo: 'Se cuenta 1-2-3. En el 1 tocas solo la cuerda grave del acorde (B = bajo) y en el 2 y 3 rasgueas.',
    practica: ['Como María', 'Gracias María', 'Madre de los Jóvenes', 'Magníficat'],
    chords: ['G', 'D', 'C', 'G']
  },
  {
    id: '6x8',
    name: '4. Seis por ocho',
    compas: '6/8',
    momentos: 'Santo, Aleluya, cantos alegres',
    consejo: 'Dos grupos de tres: 1-2-3 4-5-6. Acentúa el 1 y el 4.',
    practica: ['Aleluya', 'Aleluya “es el Señor”', 'Aleluya “solo Tú Tienes”', 'Aleluya “vivo Estás”'],
    chords: ['D', 'A', 'G', 'A']
  },
  {
    id: 'apagado',
    name: '5. Rasgueo con apagado',
    compas: '4/4',
    momentos: 'Entrada y cantos juveniles',
    consejo: '✕ = apoyas la palma sobre las cuerdas para cortar el sonido. Da un efecto rítmico de percusión.',
    practica: ['Gracias Señor', 'Haz Cantar tu Vida', 'Hosanna Hey', 'Hoy Llegamos a Casa'],
    chords: ['G', 'C', 'D', 'G']
  },
  {
    id: 'arpegio_4',
    name: '6. Arpegio lento',
    compas: '4/4',
    momentos: 'Comunión, Cuaresma, momentos de silencio',
    consejo: 'Sin púa, cuerda por cuerda: p = pulgar (bajo), i = índice (3ª), m = medio (2ª), a = anular (1ª).',
    practica: ['Alabaré', 'Canción del Misionero', 'Emaús', 'Pueblo Mío, Respóndeme'],
    chords: ['Am', 'Dm', 'G', 'C']
  }
];

const PLAN_SEMANAL = [
  { day: 'Lunes', task: 'Balada básica con DO y SOL, 10 minutos.' },
  { day: 'Martes', task: 'Balada básica cambiando DO - lam - FA - SOL.' },
  { day: 'Miércoles', task: 'Marcha de entrada. Toca un canto de Entrada completo.' },
  { day: 'Jueves', task: 'Vals con SOL y RE. Canta mientras tocas.' },
  { day: 'Viernes', task: 'Arpegio lento con lam y mim, muy despacio.' },
  { day: 'Sábado', task: 'Seis por ocho y el apagado. Graba un audio y escúchate.' },
  { day: 'Domingo', task: 'Elige un canto de cada momento de la misa y tócalos seguidos.' }
];

const CHECKLIST_MISA = [
  { id: 'pre1', group: 'Una semana antes', label: 'Leer las lecturas del domingo (Verbum Domini)' },
  { id: 'pre2', group: 'Una semana antes', label: 'Elegir los cantos en Ordo Missae respetando el tiempo litúrgico' },
  { id: 'pre3', group: 'Una semana antes', label: 'Compartir al grupo la lista de cantos y tonos definidos' },
  { id: 'pre4', group: 'Una semana antes', label: 'Confirmar quién proclama el Salmo desde el ambón' },
  { id: 'dia1', group: 'El día de la misa', label: 'Llegar al menos 30 minutos antes de la celebración' },
  { id: 'dia2', group: 'El día de la misa', label: 'Probar micrófonos, cables y equilibrio de volumen' },
  { id: 'dia3', group: 'El día de la misa', label: 'Afinar todos los instrumentos con el mismo afinador (Diapason)' },
  { id: 'dia4', group: 'El día de la misa', label: 'Iniciar la Sesión en Vivo para sincronizar las pantallas del coro' },
  { id: 'dur1', group: 'Durante la celebración', label: 'Estar atentos a las señales del sacerdote celebrante' },
  { id: 'dur2', group: 'Durante la celebración', label: 'Guardar silencio instrumental durante las lecturas y la homilía' },
  { id: 'dur3', group: 'Durante la celebración', label: 'Cuidar el recogimiento y volumen suave en la Consagración y Comunión' },
  { id: 'dur4', group: 'Durante la celebración', label: 'Respetar el silencio sagrado después de la Comunión' },
  { id: 'post1', group: 'Después de la misa', label: 'Ordenar cables, atriles e instrumentos en el templo' },
  { id: 'post2', group: 'Después de la misa', label: 'Anotar qué salió bien y qué cantos reforzar en el próximo ensayo' },
  { id: 'post3', group: 'Después de la misa', label: 'Agradecer al grupo y encomendar la semana en oración' }
];

interface DayProgress {
  completed: boolean;
  minutes: number;
  stars: number;
}

export function ScholaCantorum({ songs }: ScholaCantorumProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'reto' | 'ritmos' | 'ministerio' | 'faciles'>('reto');

  // 30-day challenge progress
  const [progress, setProgress] = useState<Record<number, DayProgress>>(() => {
    try {
      const saved = localStorage.getItem('vt_schola_reto30');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Weekly plan checkboxes
  const [weeklyDone, setWeeklyDone] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('vt_schola_weekly');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Ministry checklist
  const [checklistDone, setChecklistDone] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('vt_schola_checklist');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [studentName, setStudentName] = useState(() => localStorage.getItem('vt_director_name') || '');

  // 15-minute practice timer
  const [timerSeconds, setTimerSeconds] = useState(15 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Strumming audio player state
  const [playingPatternId, setPlayingPatternId] = useState<string | null>(null);
  const [practiceBpm, setPracticeBpm] = useState(75);
  const [activeStep, setActiveStep] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem('vt_schola_reto30', JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    localStorage.setItem('vt_schola_weekly', JSON.stringify(weeklyDone));
  }, [weeklyDone]);

  useEffect(() => {
    localStorage.setItem('vt_schola_checklist', JSON.stringify(checklistDone));
  }, [checklistDone]);

  useEffect(() => {
    if (!isTimerRunning) return;
    const id = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isTimerRunning]);

  useEffect(() => () => strumPlayer.stop(), []);

  const allPatterns: Patron[] = useMemo(() => [...RASGUEOS, ...ARPEGIOS], []);

  const togglePlayPattern = (id: string, chords: string[]) => {
    if (playingPatternId === id) {
      strumPlayer.stop();
      setPlayingPatternId(null);
      setActiveStep(null);
      return;
    }
    const found = allPatterns.find((p) => p.id === id) || RASGUEOS[0];
    strumPlayer.stop();
    setPlayingPatternId(id);
    setActiveStep(0);
    strumPlayer.start(chords, found, practiceBpm, (_bar, step) => {
      setActiveStep(step);
    });
  };

  const toggleDayComplete = (day: number) => {
    setProgress((prev) => {
      const current = prev[day] || { completed: false, minutes: 15, stars: 5 };
      return {
        ...prev,
        [day]: { ...current, completed: !current.completed }
      };
    });
  };

  const setDayStars = (day: number, stars: number) => {
    setProgress((prev) => {
      const current = prev[day] || { completed: true, minutes: 15, stars };
      return {
        ...prev,
        [day]: { ...current, completed: true, stars }
      };
    });
  };

  const openSongByTitle = (title: string) => {
    const norm = (s: string) =>
      s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
    const target = norm(title);
    const match =
      songs.find((s) => norm(s.title) === target) ||
      songs.find((s) => norm(s.title).includes(target) || target.includes(norm(s.title)));
    if (match) {
      navigate('/repertorio', { state: { songId: match.id } });
    } else {
      navigate('/repertorio');
    }
  };

  const completedDaysCount = Object.values(progress).filter((p) => p.completed).length;
  const progressPercent = Math.round((completedDaysCount / 30) * 100);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <SectionLayout
      title="Schola Cantorum — Escuela & Ministerio"
      description="Entrenamiento progresivo de 30 días, laboratorio interactivo de rasgueos para la Misa, repertorio inicial sin cejilla y guía pastoral del coro."
      icon={<Award size={26} className="text-red-600" />}
      badge="Formación Musical Litúrgica"
      colorTheme="red"
    >
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        {/* Top Summary & Practice Timer Bar */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-extrabold text-sm shrink-0 border border-red-100">
              {completedDaysCount}/30
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-stone-900 text-base m-0">
                  Progreso del Reto de 30 Días
                </h2>
                <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                  {progressPercent}%
                </span>
              </div>
              <p className="text-xs text-stone-500 m-0 mt-0.5">
                Constancia de 15 minutos diarios para acompañar dignamente la Eucaristía.
              </p>
            </div>
          </div>

          {/* 15-min Practice Timer */}
          <div className="flex items-center gap-2.5 bg-stone-50 border border-stone-200 px-3.5 py-2 rounded-xl self-stretch md:self-auto justify-between">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-red-500" />
              <div>
                <div className="text-[10px] font-bold uppercase text-stone-400 leading-none">
                  Temporizador Diario
                </div>
                <div className="font-mono font-extrabold text-base text-stone-800">
                  {formatTimer(timerSeconds)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="btn btn-primary py-1.5 px-3 text-xs font-bold flex items-center gap-1"
              >
                {isTimerRunning ? <Square size={12} /> : <Play size={12} />}
                {isTimerRunning ? 'Pausar' : 'Iniciar 15m'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsTimerRunning(false);
                  setTimerSeconds(15 * 60);
                }}
                className="p-1.5 rounded-lg bg-white border border-stone-200 text-stone-500 hover:text-stone-800 cursor-pointer"
                title="Reiniciar 15 minutos"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto gap-1.5 p-1.5 bg-stone-100 rounded-xl border border-stone-200">
          {[
            { id: 'reto', label: 'Reto de 30 Días', icon: Calendar },
            { id: 'ritmos', label: 'Ritmos y Rasgueos de Misa', icon: Guitar },
            { id: 'faciles', label: 'Los 24 Cantos Más Fáciles', icon: Sparkles },
            { id: 'ministerio', label: 'Guía del Ministerio & Checklist', icon: Users }
          ].map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap border-none ${
                  active
                    ? 'bg-white text-red-600 shadow-sm'
                    : 'bg-transparent text-stone-600 hover:text-stone-900'
                }`}
              >
                <Icon size={16} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: RETO DE 30 DÍAS */}
        {activeTab === 'reto' && (
          <div className="flex flex-col gap-6">
            {[1, 2, 3, 4].map((weekNum) => {
              const weekTitles: Record<number, string> = {
                1: 'Semana 1 • Los primeros acordes',
                2: 'Semana 2 • Cambios fluidos de acordes',
                3: 'Semana 3 • El ritmo en la mano derecha',
                4: 'Semana 4 • Cantos completos y tu primera Misa'
              };
              const days = RETO_30_DIAS.filter((d) => d.week === weekNum);
              return (
                <div key={weekNum} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                  <h3 className="font-bold text-stone-900 text-base m-0 mb-4 flex items-center gap-2">
                    <Flame size={18} className="text-red-500" />
                    {weekTitles[weekNum]}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {days.map((d) => {
                      const st = progress[d.day] || { completed: false, minutes: 15, stars: 0 };
                      return (
                        <div
                          key={d.day}
                          className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                            st.completed
                              ? 'bg-emerald-50/50 border-emerald-200'
                              : 'bg-stone-50/70 border-stone-200 hover:border-red-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5">
                              <button
                                type="button"
                                onClick={() => toggleDayComplete(d.day)}
                                className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer border transition-colors shrink-0 ${
                                  st.completed
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'bg-white border-stone-300 text-transparent hover:border-red-400'
                                }`}
                                title="Marcar día completado"
                              >
                                <CheckCircle2 size={14} />
                              </button>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-stone-200/80 text-stone-700">
                                    Día {d.day}
                                  </span>
                                  <h4 className="font-bold text-stone-900 text-sm m-0">{d.title}</h4>
                                </div>
                                <p className="text-xs text-stone-600 m-0 mt-1 leading-relaxed">{d.task}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-stone-200/60 flex-wrap gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {d.chords?.map((c) => (
                                <Link
                                  key={c}
                                  to="/acordes"
                                  className="text-[11px] font-mono font-bold bg-white border border-stone-200 text-red-600 px-2 py-0.5 rounded hover:bg-red-50 no-underline"
                                >
                                  {c}
                                </Link>
                              ))}
                              {d.suggestedSongTitle && (
                                <button
                                  type="button"
                                  onClick={() => openSongByTitle(d.suggestedSongTitle!)}
                                  className="text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-0.5 rounded-full cursor-pointer border-none flex items-center gap-1"
                                >
                                  <Music size={11} /> {d.suggestedSongTitle}
                                </button>
                              )}
                            </div>

                            {/* 1-5 Star self-rating */}
                            <div className="flex items-center gap-0.5" title="Evalúa cómo te salió hoy (1 a 5 estrellas)">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setDayStars(d.day, star)}
                                  className="p-0.5 bg-transparent border-none cursor-pointer text-amber-400 hover:scale-110 transition-transform"
                                >
                                  <Star
                                    size={13}
                                    fill={st.stars >= star ? '#f59e0b' : 'none'}
                                    className={st.stars >= star ? 'text-amber-500' : 'text-stone-300'}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Certificado del Reto de 30 Días */}
            <div className="bg-gradient-to-br from-amber-50 via-white to-stone-50 rounded-2xl border-2 border-amber-300/80 p-6 text-center shadow-sm">
              <Award size={40} className="text-amber-500 mx-auto mb-2" />
              <div className="text-xs font-extrabold uppercase tracking-widest text-amber-700">
                Reconocimiento de Perseverancia Litúrgica
              </div>
              <h3 className="text-2xl font-black text-stone-900 mt-1 mb-2">
                Certificado del Reto de 30 Días
              </h3>
              <p className="text-xs text-stone-600 max-w-md mx-auto mb-4">
                Por su constancia durante 30 días aprendiendo a acompañar con la guitarra los cantos de la celebración eucarística ({completedDaysCount}/30 días registrados).
              </p>
              <div className="max-w-xs mx-auto mb-3">
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => {
                    setStudentName(e.target.value);
                    localStorage.setItem('vt_director_name', e.target.value);
                  }}
                  placeholder="Escribe tu nombre para el certificado..."
                  className="w-full text-center font-bold text-stone-900 border-b-2 border-amber-400 bg-transparent py-1.5 px-3 focus:outline-none text-sm"
                />
              </div>
              <div className="text-[11px] text-stone-400 font-semibold">
                VOX TEMPLI • Códice Litúrgico • {new Date().toLocaleDateString('es-ES')}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: RITMOS Y RASGUEOS DE LA MISA */}
        {activeTab === 'ritmos' && (
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-stone-900 text-base m-0">
                  Laboratorio de los 6 Patrones para la Misa
                </h3>
                <p className="text-xs text-stone-500 m-0 mt-1">
                  Escucha cada rasgueo en tiempo real y abre directamente los cantos sugeridos del repertorio para practicarlo.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 px-3 py-2 rounded-xl">
                <span className="text-xs font-bold text-stone-600">Velocidad:</span>
                <input
                  type="range"
                  min={55}
                  max={130}
                  value={practiceBpm}
                  onChange={(e) => setPracticeBpm(Number(e.target.value))}
                  className="w-24 accent-red-600 cursor-pointer"
                />
                <span className="font-mono text-xs font-bold text-red-600 min-w-[52px]">
                  {practiceBpm} BPM
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PATRONES_MISA.map((pat) => {
                const fullPatron = allPatterns.find((p) => p.id === pat.id) || RASGUEOS[0];
                const isPlaying = playingPatternId === pat.id;
                const arrowMap: Record<string, string> = {
                  D: '↓',
                  U: '↑',
                  B: 'B',
                  X: '✕',
                  '-': '·',
                  p: 'p',
                  i: 'i',
                  m: 'm',
                  a: 'a'
                };
                return (
                  <div
                    key={pat.id}
                    className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="font-bold text-stone-900 text-base m-0">{pat.name}</h4>
                        <span className="text-xs font-mono font-bold bg-stone-900 text-white px-2.5 py-0.5 rounded-full">
                          {pat.compas}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-red-600 m-0 mb-2">
                        Úsalo en: {pat.momentos}
                      </p>

                      {/* Visual Step Boxes */}
                      <div className="grid grid-cols-8 gap-1.5 my-3 bg-stone-50 p-3 rounded-xl border border-stone-200">
                        {fullPatron.pasos.map((step, idx) => {
                          const active = isPlaying && activeStep === idx;
                          return (
                            <div
                              key={idx}
                              className={`flex flex-col items-center justify-center py-2 rounded-lg border text-sm font-black transition-all ${
                                active
                                  ? 'bg-red-600 text-white border-red-600 scale-105 shadow-sm'
                                  : 'bg-white text-stone-800 border-stone-200'
                              }`}
                            >
                              <span>{arrowMap[step] || step}</span>
                              <span
                                className={`text-[9px] font-normal mt-0.5 ${
                                  active ? 'text-red-100' : 'text-stone-400'
                                }`}
                              >
                                {pat.compas === '6/8'
                                  ? idx + 1
                                  : idx % 2 === 0
                                    ? idx / 2 + 1
                                    : 'y'}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <p className="text-xs text-stone-600 m-0 leading-relaxed">{pat.consejo}</p>
                    </div>

                    <div className="flex flex-col gap-2.5 pt-3 border-t border-stone-100">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-stone-500 uppercase">
                          Cantos para practicar:
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePlayPattern(pat.id, pat.chords)}
                          className={`btn py-1.5 px-3 text-xs font-bold flex items-center gap-1.5 ${
                            isPlaying ? 'btn-primary' : 'bg-stone-100 text-stone-800 hover:bg-stone-200'
                          }`}
                        >
                          {isPlaying ? <Square size={13} /> : <Play size={13} />}
                          {isPlaying ? 'Detener audio' : 'Escuchar patrón'}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {pat.practica.map((songTitle) => (
                          <button
                            key={songTitle}
                            type="button"
                            onClick={() => openSongByTitle(songTitle)}
                            className="text-xs bg-red-50 hover:bg-red-100 text-red-700 font-semibold px-2.5 py-1 rounded-lg cursor-pointer border-none transition-colors"
                          >
                            {songTitle} →
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Plan de Práctica de Una Semana */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
              <h3 className="font-bold text-stone-900 text-base m-0 mb-3">
                Plan de Práctica Rítmica de Una Semana
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {PLAN_SEMANAL.map((item) => {
                  const done = !!weeklyDone[item.day];
                  return (
                    <button
                      key={item.day}
                      type="button"
                      onClick={() => setWeeklyDone((p) => ({ ...p, [item.day]: !done }))}
                      className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                        done
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-stone-50 border-stone-200 text-stone-800 hover:border-red-200'
                      }`}
                    >
                      <CheckCircle2
                        size={16}
                        className={`mt-0.5 shrink-0 ${done ? 'text-emerald-600' : 'text-stone-300'}`}
                      />
                      <div>
                        <div className="text-xs font-extrabold text-red-600">{item.day}</div>
                        <div className="text-xs text-stone-600 mt-0.5">{item.task}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LOS 24 CANTOS MÁS FÁCILES */}
        {activeTab === 'faciles' && (
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="font-bold text-stone-900 text-base m-0">
                Los 24 Cantos Más Fáciles del Cancionero (Sin Cejilla y ≤ 4 Acordes)
              </h3>
              <p className="text-xs text-stone-500 m-0 mt-1">
                Ideales para quienes inician en el ministerio o para armar una misa rápida y participativa. Haz clic en cualquiera para abrirlo con sus acordes y ritmos.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {CANTOS_MAS_FACILES.map((item, idx) => (
                <div
                  key={item.title}
                  onClick={() => openSongByTitle(item.title)}
                  className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/60 hover:bg-white hover:border-red-300 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-stone-900 text-sm leading-snug">
                      {idx + 1}. {item.title}
                    </span>
                    <span className="text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full shrink-0">
                      {item.chords.length} acordes
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {item.chords.map((c) => (
                      <span
                        key={c}
                        className="text-[11px] font-mono font-bold bg-white border border-stone-200 text-red-600 px-2 py-0.5 rounded"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: GUÍA DEL MINISTERIO Y CHECKLIST */}
        {activeTab === 'ministerio' && (
          <div className="flex flex-col gap-6">
            {/* Las 3 preguntas de oro y roles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                <h3 className="font-bold text-stone-900 text-base m-0 mb-3 flex items-center gap-2">
                  <Sparkles size={18} className="text-red-500" />
                  3 Preguntas Antes de Elegir un Canto
                </h3>
                <div className="flex flex-col gap-3">
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                    <div className="font-bold text-xs text-stone-900">1. ¿Corresponde al momento ritual?</div>
                    <p className="text-xs text-stone-600 m-0 mt-0.5">
                      Un canto de Comunión no sirve de Entrada aunque sea muy hermoso. Cada rito tiene su función litúrgica propia.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                    <div className="font-bold text-xs text-stone-900">2. ¿Corresponde al tiempo litúrgico?</div>
                    <p className="text-xs text-stone-600 m-0 mt-0.5">
                      Adviento y Cuaresma piden sobriedad (sin Gloria; en Cuaresma sin Aleluya). Pascua y Navidad piden solemnidad y júbilo.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                    <div className="font-bold text-xs text-stone-900">3. ¿La asamblea lo puede cantar?</div>
                    <p className="text-xs text-stone-600 m-0 mt-0.5">
                      El coro no da un concierto: ayuda a que el pueblo rece cantando. Prefiere melodías cantables y no cambies todos los cantos cada domingo.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                <h3 className="font-bold text-stone-900 text-base m-0 mb-3 flex items-center gap-2">
                  <Clock size={18} className="text-red-500" />
                  Estructura de un Ensayo Efectivo de 60 Minutos
                </h3>
                <div className="flex flex-col gap-2.5">
                  {[
                    { min: '00–05 min', title: 'Oración breve y Evangelio', desc: 'Recuerden para Quién cantan y lean juntos el Evangelio del domingo.' },
                    { min: '05–15 min', title: 'Afinar y calentar la voz', desc: 'Afinar todas las guitarras con el mismo afinador, respiración y un canto conocido.' },
                    { min: '15–40 min', title: 'Cantos nuevos (máximo 1 o 2)', desc: 'Primero aprender la melodía, después las voces y finalmente los instrumentos.' },
                    { min: '40–55 min', title: 'Pasar la Misa completa en orden', desc: 'Practicar quién da cada entrada, en qué tono queda cada canto y cómo termina.' },
                    { min: '55–60 min', title: 'Acuerdos del ministerio', desc: 'Hora de llegada (30 min antes), responsables y lista final en Ordo Missae.' }
                  ].map((step) => (
                    <div key={step.min} className="flex items-start gap-3 p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                      <span className="font-mono font-extrabold text-[11px] bg-red-600 text-white px-2 py-1 rounded-lg shrink-0">
                        {step.min}
                      </span>
                      <div>
                        <div className="font-bold text-xs text-stone-900">{step.title}</div>
                        <div className="text-[11px] text-stone-600">{step.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Checklist interactivo antes, durante y después de la misa */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                <div>
                  <h3 className="font-bold text-stone-900 text-base m-0 flex items-center gap-2">
                    <ListChecks size={18} className="text-red-500" />
                    Lista de Verificación Antes, Durante y Después de Cada Misa
                  </h3>
                  <p className="text-xs text-stone-500 m-0 mt-0.5">
                    Marca cada punto con tu ministerio para asegurar una celebración cuidada y sin imprevistos técnicos.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link to="/afinador" className="btn bg-stone-100 text-stone-700 text-xs py-1.5 px-3 flex items-center gap-1 no-underline">
                    <Mic size={13} /> Abrir Afinador
                  </Link>
                  <button
                    type="button"
                    onClick={() => setChecklistDone({})}
                    className="btn bg-stone-100 text-stone-600 hover:text-red-600 text-xs py-1.5 px-3 flex items-center gap-1"
                  >
                    <RotateCcw size={13} /> Reiniciar Lista
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['Una semana antes', 'El día de la misa', 'Durante la celebración', 'Después de la misa'].map((group) => (
                  <div key={group} className="bg-stone-50 rounded-xl p-3.5 border border-stone-200">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-red-600 m-0 mb-2.5">
                      {group}
                    </h4>
                    <div className="flex flex-col gap-2">
                      {CHECKLIST_MISA.filter((i) => i.group === group).map((item) => {
                        const checked = !!checklistDone[item.id];
                        return (
                          <label
                            key={item.id}
                            className="flex items-start gap-2.5 cursor-pointer text-xs text-stone-700 select-none"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setChecklistDone((prev) => ({ ...prev, [item.id]: !checked }))
                              }
                              className="mt-0.5 accent-red-600 rounded cursor-pointer"
                            />
                            <span className={checked ? 'line-through text-stone-400' : 'font-medium'}>
                              {item.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </SectionLayout>
  );
}


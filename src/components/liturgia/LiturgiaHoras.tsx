import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Minus, Plus, RefreshCw, WifiOff, ExternalLink, Info } from 'lucide-react';
import { getLiturgicalDay, todayIso, type SeasonId } from '../../utils/liturgicalCalendar';
import { fetchHour, hourUrl, HourNotPublishedError, HOURS, suggestedHour, type HourId } from '../../utils/liturgiaHoras';
import { LiturgicalDayBanner, DateNav } from './LiturgicalDayBanner';
import '../../styles/liturgia.css';

type LoadState =
  | { key: string; status: 'ok'; html: string }
  | { key: string; status: 'error'; message: string; notPublished: boolean };

// Estructura de cada hora (Ordenación general de la Liturgia de las Horas)
const STRUCTURE: Record<HourId, string[]> = {
  oficio: ['Invocación inicial (o Invitatorio si es la primera oración del día)', 'Himno', 'Tres salmos con sus antífonas', 'Versículo', 'Primera lectura (bíblica) y responsorio', 'Segunda lectura (Padres o santos) y responsorio', 'Te Deum en domingos y fiestas', 'Oración y conclusión'],
  laudes: ['Invocación inicial o Invitatorio', 'Himno', 'Salmo, cántico del Antiguo Testamento y salmo de alabanza', 'Lectura breve y responsorio breve', 'Cántico evangélico: Benedictus', 'Preces', 'Padrenuestro', 'Oración y bendición'],
  tercia: ['Invocación inicial', 'Himno', 'Tres salmos con antífona', 'Lectura breve y versículo', 'Oración y aclamación final'],
  sexta: ['Invocación inicial', 'Himno', 'Tres salmos con antífona', 'Lectura breve y versículo', 'Oración y aclamación final'],
  nona: ['Invocación inicial', 'Himno', 'Tres salmos con antífona', 'Lectura breve y versículo', 'Oración y aclamación final'],
  visperas: ['Invocación inicial', 'Himno', 'Dos salmos y un cántico del Nuevo Testamento', 'Lectura breve y responsorio breve', 'Cántico evangélico: Magníficat', 'Preces', 'Padrenuestro', 'Oración y bendición'],
  completas: ['Invocación inicial', 'Examen de conciencia', 'Himno', 'Salmodia', 'Lectura breve y responsorio', 'Cántico evangélico: Nunc dimittis', 'Oración y bendición', 'Antífona final a la Virgen'],
};

// Antífona mariana de Completas según el tiempo (para elegir el canto del coro)
function marianAntiphon(season: SeasonId, iso: string): string {
  const md = iso.slice(5);
  if (season === 'pascua') return 'Regina caeli (Reina del cielo, alégrate)';
  if (season === 'adviento' || season === 'navidad' || md <= '02-01') return 'Alma Redemptoris Mater';
  // Desde la Presentación del Señor hasta la Semana Santa
  if (season === 'cuaresma' || season === 'triduo' || (season === 'ordinario' && md <= '03-10')) return 'Ave Regina caelorum';
  return 'Salve Regina (Dios te salve, Reina y Madre)';
}

export function LiturgiaHoras() {
  const [params] = useSearchParams();
  const [iso, setIso] = useState(() => params.get('fecha') || todayIso());
  const [hour, setHour] = useState<HourId>(() => suggestedHour());
  const [state, setState] = useState<LoadState | null>(null);
  const [retry, setRetry] = useState(0);
  const [showGuide, setShowGuide] = useState(false);
  const [scale, setScale] = useState(() => {
    try { return Number(localStorage.getItem('vt-horas-escala')) || 1; } catch { return 1; }
  });
  const day = useMemo(() => getLiturgicalDay(iso), [iso]);
  const key = `${iso}-${hour}`;

  useEffect(() => {
    let cancelled = false;
    fetchHour(iso, hour)
      .then(html => { if (!cancelled) setState({ key, status: 'ok', html }); })
      .catch((err: unknown) => {
        if (cancelled) return;
        const notPublished = err instanceof HourNotPublishedError;
        const message = notPublished
          ? 'La fuente todavía no ha publicado esta fecha (suele publicar mes a mes).'
          : navigator.onLine
            ? 'No se pudo traer el texto. Inténtalo de nuevo.'
            : 'Sin conexión. Las horas que ya abriste quedan guardadas en este dispositivo.';
        setState({ key, status: 'error', message, notPublished });
      });
    return () => { cancelled = true; };
  }, [iso, hour, key, retry]);

  useEffect(() => {
    try { localStorage.setItem('vt-horas-escala', String(scale)); } catch { /* sin almacenamiento */ }
  }, [scale]);

  const current = state && state.key === key ? state : null;
  const hourInfo = HOURS.find(h => h.id === hour)!;

  return (
    <div className="vt-page animate-in fade-in duration-300">
      <header className="vt-hero">
        <div>
          <p className="vt-eyebrow">Officium Divinum</p>
          <h1 className="vt-title">Liturgia de las Horas</h1>
          <p className="vt-sub">La oración de la Iglesia para santificar el día, con la semana del salterio calculada para cada fecha.</p>
        </div>
        <DateNav iso={iso} onChange={setIso} />
      </header>

      <LiturgicalDayBanner day={day} />

      <div className="vt-seg" role="group" aria-label="Hora" style={{ marginBottom: '1rem' }}>
        {HOURS.map(h => (
          <button key={h.id} type="button" aria-pressed={h.id === hour} onClick={() => setHour(h.id)}>
            {h.name}
          </button>
        ))}
      </div>

      <div className="vt-grid vt-grid-main">
        <article className="vt-card">
          <div className="vt-row-between" style={{ marginBottom: '0.75rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem' }}>{hourInfo.name}</h2>
              <span className="vt-xs vt-muted">{hourInfo.when}</span>
            </div>
            <div className="vt-row">
              <button type="button" className="vt-btn vt-btn-sm" onClick={() => setScale(s => Math.max(0.8, +(s - 0.1).toFixed(1)))} aria-label="Reducir texto"><Minus size={14} /></button>
              <span className="vt-mono vt-small">{Math.round(scale * 100)}%</span>
              <button type="button" className="vt-btn vt-btn-sm" onClick={() => setScale(s => Math.min(1.8, +(s + 0.1).toFixed(1)))} aria-label="Aumentar texto"><Plus size={14} /></button>
            </div>
          </div>

          {!current && <p className="vt-muted">Cargando…</p>}

          {current?.status === 'error' && (
            <div className="vt-notice vt-notice-warn">
              <div className="vt-row" style={{ marginBottom: '0.4rem' }}>
                <WifiOff size={16} />
                <strong>{current.message}</strong>
              </div>
              <div className="vt-row">
                {!current.notPublished && (
                  <button type="button" className="vt-btn vt-btn-sm" onClick={() => setRetry(r => r + 1)}><RefreshCw size={14} /> Reintentar</button>
                )}
                <a className="vt-btn vt-btn-sm" href="https://www.ibreviary.com/m2/breviario.php?lang=es" target="_blank" rel="noopener noreferrer">
                  Abrir iBreviary <ExternalLink size={13} />
                </a>
              </div>
            </div>
          )}

          {current?.status === 'ok' && (
            // El HTML fue reconstruido en fetchHour solo con etiquetas permitidas y sin atributos
            <div className="vt-office" style={{ fontSize: `${1.02 * scale}rem` }} dangerouslySetInnerHTML={{ __html: current.html }} />
          )}

          <p className="vt-attrib">
            Texto de <a href={hourUrl(iso, hour)} target="_blank" rel="noopener noreferrer">liturgiadelashoras.github.io</a>.
            Lo que abres queda guardado en este dispositivo para rezar sin conexión.
          </p>
        </article>

        <aside>
          <section className="vt-card">
            <button type="button" className="vt-btn vt-btn-sm vt-btn-ghost" onClick={() => setShowGuide(v => !v)} aria-expanded={showGuide} style={{ padding: 0 }}>
              <Info size={15} /> Estructura de {hourInfo.name}
            </button>
            {showGuide && (
              <ol className="vt-small vt-ol" style={{ margin: '0.6rem 0 0', paddingLeft: '1.2rem', lineHeight: 1.6 }}>
                {STRUCTURE[hour].map(s => <li key={s}>{s}</li>)}
              </ol>
            )}
          </section>

          <section className="vt-card">
            <h3 className="vt-card-title">Para el coro</h3>
            <ul className="vt-list vt-small">
              <li><strong>Semana del salterio:</strong> {day.psalterWeek ? ['I', 'II', 'III', 'IV'][day.psalterWeek - 1] : 'propia del día'}</li>
              <li><strong>Antífona final de Completas:</strong> {marianAntiphon(day.season, iso)}</li>
              <li><strong>Cánticos evangélicos:</strong> Benedictus en Laudes, Magníficat en Vísperas y Nunc dimittis en Completas.</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

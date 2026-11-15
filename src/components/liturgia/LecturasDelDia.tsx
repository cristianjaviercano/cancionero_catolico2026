import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen, Minus, Plus, RefreshCw, WifiOff, Music, ExternalLink } from 'lucide-react';
import type { Song } from '../../hooks/useSongs';
import { getLiturgicalDay, todayIso, type SeasonId } from '../../utils/liturgicalCalendar';
import {
  fetchDailyReadings,
  isWithinEvangelizoWindow,
  psalmNumbers,
  ReadingsOutOfRangeError,
  type DailyReadings,
} from '../../utils/evangelizo';
import { LiturgicalDayBanner, DateNav } from './LiturgicalDayBanner';
import '../../styles/liturgia.css';

interface LecturasProps {
  songs: Song[];
}

type LoadState =
  | { iso: string; status: 'ok'; data: DailyReadings }
  | { iso: string; status: 'error'; message: string; outOfRange: boolean };

// Tipos de canto del repertorio que corresponden a cada tiempo litúrgico
const SEASON_SONG_TYPES: Record<SeasonId, string[]> = {
  adviento: ['Adviento'],
  navidad: ['Navidad'],
  cuaresma: ['Cuaresma'],
  triduo: ['Cuaresma', 'Pascua'],
  pascua: ['Pascua', 'Pentecostés', 'Espíritu Santo'],
  ordinario: [],
};

export function LecturasDelDia({ songs }: LecturasProps) {
  const [params] = useSearchParams();
  const [iso, setIso] = useState(() => params.get('fecha') || todayIso());
  const [state, setState] = useState<LoadState | null>(null);
  const [retry, setRetry] = useState(0);
  const [fontScale, setFontScale] = useState(() => {
    try { return Number(localStorage.getItem('vt-lecturas-escala')) || 1; } catch { return 1; }
  });
  const day = useMemo(() => getLiturgicalDay(iso), [iso]);

  useEffect(() => {
    let cancelled = false;
    fetchDailyReadings(iso)
      .then(data => { if (!cancelled) setState({ iso, status: 'ok', data }); })
      .catch((err: unknown) => {
        if (cancelled) return;
        const outOfRange = err instanceof ReadingsOutOfRangeError;
        const message = outOfRange
          ? 'Evangelizo solo publica las lecturas de los próximos y últimos 30 días.'
          : navigator.onLine
            ? 'No se pudieron traer las lecturas. Inténtalo de nuevo en un momento.'
            : 'Sin conexión. Las lecturas que ya abriste quedan guardadas en este dispositivo.';
        setState({ iso, status: 'error', message, outOfRange });
      });
    return () => { cancelled = true; };
  }, [iso, retry]);

  useEffect(() => {
    try { localStorage.setItem('vt-lecturas-escala', String(fontScale)); } catch { /* sin almacenamiento */ }
  }, [fontScale]);

  const current = state && state.iso === iso ? state : null;
  const data = current?.status === 'ok' ? current.data : null;

  const psalm = data?.readings.find(r => r.id === 'PS');
  const psalmSongs = useMemo(() => {
    const nums = psalm ? psalmNumbers(psalm.reference) : [];
    if (nums.length === 0) return [];
    return songs.filter(s => {
      const m = s.title.match(/salmo\s*(\d+)/i);
      return m ? nums.includes(Number(m[1])) : false;
    });
  }, [psalm, songs]);

  const seasonSongs = useMemo(() => {
    const types = SEASON_SONG_TYPES[day.season];
    return songs.filter(s => types.includes(s.type)).slice(0, 12);
  }, [day.season, songs]);

  return (
    <div className="vt-page animate-in fade-in duration-300">
      <header className="vt-hero">
        <div>
          <p className="vt-eyebrow">Liturgia de la Palabra</p>
          <h1 className="vt-title">Lecturas del Día</h1>
          <p className="vt-sub">Primera lectura, salmo, segunda lectura y evangelio de la misa, con los cantos del repertorio que acompañan el día.</p>
        </div>
        <DateNav iso={iso} onChange={setIso} />
      </header>

      <LiturgicalDayBanner
        day={day}
        extra={data && data.dayTitle && data.dayTitle !== day.title ? (
          <p className="vt-xs vt-muted" style={{ margin: '0.5rem 0 0' }}>Según Evangelizo: {data.dayTitle}</p>
        ) : null}
      />

      <div className="vt-grid vt-grid-main">
        <div>
          <div className="vt-row-between" style={{ marginBottom: '0.75rem' }}>
            <span className="vt-xs vt-muted" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tamaño del texto</span>
            <div className="vt-row">
              <button type="button" className="vt-btn vt-btn-sm" onClick={() => setFontScale(s => Math.max(0.8, +(s - 0.1).toFixed(1)))} aria-label="Reducir texto"><Minus size={14} /></button>
              <span className="vt-mono vt-small">{Math.round(fontScale * 100)}%</span>
              <button type="button" className="vt-btn vt-btn-sm" onClick={() => setFontScale(s => Math.min(1.8, +(s + 0.1).toFixed(1)))} aria-label="Aumentar texto"><Plus size={14} /></button>
            </div>
          </div>

          {!current && (
            <div className="vt-card vt-muted">Cargando lecturas…</div>
          )}

          {current?.status === 'error' && (
            <div className="vt-card">
              <div className="vt-row" style={{ marginBottom: '0.5rem' }}>
                <WifiOff size={18} className="text-red-500" />
                <strong>{current.message}</strong>
              </div>
              {!current.outOfRange && (
                <button type="button" className="vt-btn vt-btn-sm" onClick={() => setRetry(r => r + 1)}>
                  <RefreshCw size={14} /> Reintentar
                </button>
              )}
              {current.outOfRange && !isWithinEvangelizoWindow(iso) && (
                <p className="vt-small vt-muted" style={{ marginBottom: 0 }}>
                  Para preparar fechas más lejanas usa el leccionario impreso o{' '}
                  <a href={`https://www.ewtn.com/es/catolicismo/lecturas/${iso}`} target="_blank" rel="noopener noreferrer">las lecturas de EWTN</a>.
                </p>
              )}
            </div>
          )}

          {data?.readings.map(r => (
            <article key={r.id} className="vt-card">
              <h3 className="vt-card-title"><BookOpen size={15} /> {r.label}</h3>
              <p className="vt-reading-ref">{r.reference}</p>
              <p className="vt-reading" style={{ fontSize: `${1.05 * fontScale}rem` }}>{r.text}</p>
            </article>
          ))}

          {data && (
            <p className="vt-attrib">
              {data.attribution} Textos del lector público de{' '}
              <a href="https://evangeliodeldia.org/SP/gospel" target="_blank" rel="noopener noreferrer">evangeliodeldia.org <ExternalLink size={11} style={{ display: 'inline' }} /></a>.
              Las lecturas que abres quedan guardadas en este dispositivo para leerlas sin conexión.
            </p>
          )}
        </div>

        <aside>
          <section className="vt-card">
            <h3 className="vt-card-title"><Music size={15} /> Salmo para cantar</h3>
            {psalm ? (
              <>
                <p className="vt-small" style={{ marginTop: 0 }}>{psalm.reference}</p>
                {psalmSongs.length > 0 ? (
                  <ul className="vt-list">
                    {psalmSongs.map(s => (
                      <li key={s.id}>
                        <Link className="vt-list-btn" to="/repertorio" state={{ songId: s.id }}>
                          <span>{s.title}</span>
                          <span className="vt-chip">#{s.id}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="vt-small vt-muted" style={{ marginBottom: 0 }}>
                    No hay en el repertorio un canto con este número de salmo. Se puede cantar la antífona con un tono salmódico o agregarlo desde el editor.
                  </p>
                )}
              </>
            ) : (
              <p className="vt-small vt-muted" style={{ margin: 0 }}>Aparece cuando cargan las lecturas.</p>
            )}
          </section>

          {seasonSongs.length > 0 && (
            <section className="vt-card">
              <h3 className="vt-card-title"><Music size={15} /> Cantos del {day.seasonName.toLowerCase()}</h3>
              <ul className="vt-list">
                {seasonSongs.map(s => (
                  <li key={s.id}>
                    <Link className="vt-list-btn" to="/repertorio" state={{ songId: s.id }}>
                      <span>{s.title}</span>
                      <span className="vt-chip">{s.type}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {data && data.saints.length > 0 && (
            <section className="vt-card">
              <h3 className="vt-card-title">Santoral</h3>
              <ul className="vt-list">
                {data.saints.slice(0, 8).map(name => (
                  <li key={name} className="vt-small">{name}</li>
                ))}
              </ul>
            </section>
          )}

          <Link to="/build" className="vt-btn vt-btn-primary vt-btn-block">Armar la misa de este día</Link>
        </aside>
      </div>
    </div>
  );
}

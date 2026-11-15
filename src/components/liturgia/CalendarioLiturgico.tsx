import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, BookOpen, Clock, ListMusic } from 'lucide-react';
import {
  COLOR_HEX,
  getKeyDates,
  getLiturgicalDay,
  getMonthDays,
  todayIso,
} from '../../utils/liturgicalCalendar';
import { LiturgicalDayBanner } from './LiturgicalDayBanner';
import '../../styles/liturgia.css';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const WEEK_HEAD = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function CalendarioLiturgico() {
  const today = todayIso();
  const [selected, setSelected] = useState(today);
  const [view, setView] = useState(() => {
    const [y, m] = today.split('-').map(Number);
    return { year: y, month: m - 1 };
  });

  const days = useMemo(() => getMonthDays(view.year, view.month), [view]);
  const offset = new Date(view.year, view.month, 1).getDay();
  const selectedDay = useMemo(() => getLiturgicalDay(selected), [selected]);
  const keyDates = useMemo(() => getKeyDates(view.year), [view.year]);
  const upcoming = keyDates.filter(k => k.iso >= today).slice(0, 6);

  const move = (delta: number) => {
    setView(v => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  return (
    <div className="vt-page animate-in fade-in duration-300">
      <header className="vt-hero">
        <div>
          <p className="vt-eyebrow">Tempora Sacra</p>
          <h1 className="vt-title">Calendario Litúrgico</h1>
          <p className="vt-sub">
            Tiempo, color, semana, ciclo y celebración de cada día según el calendario romano con los traslados de Colombia
            (Epifanía, Ascensión y Corpus Christi en domingo).
          </p>
        </div>
      </header>

      <div className="vt-grid vt-grid-main">
        <section className="vt-card" aria-label={`${MONTHS[view.month]} ${view.year}`}>
          <div className="vt-row-between" style={{ marginBottom: '0.75rem' }}>
            <button type="button" className="vt-btn vt-btn-sm" onClick={() => move(-1)} aria-label="Mes anterior"><ChevronLeft size={16} /></button>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{MONTHS[view.month]} {view.year}</h2>
            <button type="button" className="vt-btn vt-btn-sm" onClick={() => move(1)} aria-label="Mes siguiente"><ChevronRight size={16} /></button>
          </div>
          <div className="vt-cal-head" aria-hidden="true">
            {WEEK_HEAD.map(d => <span key={d}>{d}</span>)}
          </div>
          <div className="vt-cal-grid" style={{ marginTop: '0.3rem' }}>
            {Array.from({ length: offset }).map((_, i) => <span key={`pad-${i}`} />)}
            {days.map(d => {
              const num = Number(d.iso.slice(8));
              const highlight = d.celebration || d.isSunday;
              return (
                <button
                  key={d.iso}
                  type="button"
                  className="vt-cal-cell"
                  aria-pressed={d.iso === selected}
                  aria-current={d.iso === today ? 'date' : undefined}
                  onClick={() => setSelected(d.iso)}
                  title={d.title}
                >
                  <span className="vt-cal-num" style={{ color: d.isSunday ? 'var(--accent-color)' : undefined }}>{num}</span>
                  {highlight && <span className="vt-cal-name">{d.celebration ? d.celebration.name : d.title}</span>}
                  <span className="vt-cal-bar" style={{ background: COLOR_HEX[d.color] }} />
                </button>
              );
            })}
          </div>
        </section>

        <aside>
          <LiturgicalDayBanner day={selectedDay} />
          <div className="vt-stack" style={{ marginBottom: '1rem' }}>
            <Link to={`/lecturas?fecha=${selected}`} className="vt-btn"><BookOpen size={15} /> Lecturas del día</Link>
            <Link to={`/liturgia?fecha=${selected}`} className="vt-btn"><Clock size={15} /> Liturgia de las Horas</Link>
            <Link to="/build" className="vt-btn vt-btn-primary"><ListMusic size={15} /> Armar la misa</Link>
          </div>

          <section className="vt-card">
            <h3 className="vt-card-title">Próximas fechas clave</h3>
            <ul className="vt-list">
              {upcoming.map(k => (
                <li key={k.iso + k.name}>
                  <button type="button" className="vt-list-btn" onClick={() => {
                    const [y, m] = k.iso.split('-').map(Number);
                    setView({ year: y, month: m - 1 });
                    setSelected(k.iso);
                  }}>
                    <span className="vt-row" style={{ gap: '0.45rem' }}>
                      <span className="vt-dot" style={{ background: COLOR_HEX[k.color] }} />
                      <span className="vt-small">{k.name}</span>
                    </span>
                    <span className="vt-chip vt-mono">{k.iso.slice(8)}/{k.iso.slice(5, 7)}</span>
                  </button>
                </li>
              ))}
              {upcoming.length === 0 && <li className="vt-small vt-muted">No quedan fechas clave en {view.year}. Avanza al año siguiente.</li>}
            </ul>
          </section>

          <p className="vt-attrib">
            Calculado en la app: tiempo litúrgico y semana del salterio verificados contra el calendario romano general
            (2025–2028). Los propios de Colombia marcados para confirmar deben revisarse en el Directorio Litúrgico de la CEC.
          </p>
        </aside>
      </div>
    </div>
  );
}

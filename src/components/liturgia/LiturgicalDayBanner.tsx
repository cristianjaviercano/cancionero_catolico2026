import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import {
  COLOR_HEX,
  COLOR_NAME,
  formatLongDate,
  shiftIso,
  todayIso,
  type LiturgicalDay,
} from '../../utils/liturgicalCalendar';
import '../../styles/liturgia.css';

interface BannerProps {
  day: LiturgicalDay;
  extra?: ReactNode;
}

export function LiturgicalDayBanner({ day, extra }: BannerProps) {
  const style = { '--vt-day-color': COLOR_HEX[day.color] } as CSSProperties;
  return (
    <section className="vt-day-banner" style={style} aria-label="Día litúrgico">
      <div className="vt-row vt-xs vt-muted" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        <span>{formatLongDate(day.iso)}</span>
      </div>
      <h2 className="vt-day-title">{day.title}</h2>
      {day.celebration && day.title !== day.temporalName && (
        <p className="vt-small vt-muted" style={{ margin: '0 0 0.5rem' }}>{day.temporalName}</p>
      )}
      <div className="vt-row">
        <span className="vt-chip">
          <span className="vt-dot" style={{ background: COLOR_HEX[day.color] }} />
          {COLOR_NAME[day.color]}
        </span>
        <span className="vt-chip">{day.rankLabel}</span>
        <span className="vt-chip">{day.seasonName}</span>
        <span className="vt-chip" title="Ciclo dominical y ciclo ferial del leccionario">
          Ciclo {day.sundayCycle} · Año {day.weekdayCycle}
        </span>
        {day.psalterWeek && <span className="vt-chip">Salterio: semana {['I', 'II', 'III', 'IV'][day.psalterWeek - 1]}</span>}
        {day.celebration?.verificar && (
          <span className="vt-chip vt-chip-warn" title="Propio de Colombia: confirmar con el Directorio Litúrgico de la Conferencia Episcopal">
            Confirmar con el Directorio de la CEC
          </span>
        )}
      </div>
      {day.optional.length > 0 && (
        <p className="vt-xs vt-muted" style={{ margin: '0.6rem 0 0' }}>
          También: {day.optional.map(o => `${o.name} (${o.rankLabel.toLowerCase()})`).join(' · ')}
        </p>
      )}
      {extra}
    </section>
  );
}

interface DateNavProps {
  iso: string;
  onChange: (iso: string) => void;
}

export function DateNav({ iso, onChange }: DateNavProps) {
  const isToday = iso === todayIso();
  return (
    <div className="vt-row" role="group" aria-label="Cambiar fecha">
      <button type="button" className="vt-btn vt-btn-sm" onClick={() => onChange(shiftIso(iso, -1))} aria-label="Día anterior">
        <ChevronLeft size={16} />
      </button>
      <label className="vt-row vt-btn vt-btn-sm" style={{ cursor: 'pointer' }}>
        <CalendarDays size={15} />
        <input
          type="date"
          value={iso}
          onChange={e => e.target.value && onChange(e.target.value)}
          className="vt-input"
          style={{ padding: '0.1rem 0.3rem', background: 'transparent', fontSize: '0.8rem' }}
          aria-label="Fecha"
        />
      </label>
      <button type="button" className="vt-btn vt-btn-sm" onClick={() => onChange(shiftIso(iso, 1))} aria-label="Día siguiente">
        <ChevronRight size={16} />
      </button>
      {!isToday && (
        <button type="button" className="vt-btn vt-btn-sm vt-btn-primary" onClick={() => onChange(todayIso())}>
          Hoy
        </button>
      )}
    </div>
  );
}

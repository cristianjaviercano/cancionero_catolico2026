import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Flame, Music, Trash2, X } from 'lucide-react';
import type { Song } from '../../hooks/useSongs';
import { devotionStats, type DevotionEntry, type DevotionKind } from '../../hooks/useDevotionLog';
import type { Litany } from '../../data/devociones/letanias';
import { SongViewer } from '../SongViewer';
import { formatLongDate } from '../../utils/liturgicalCalendar';
import '../../styles/liturgia.css';

export function PrayerBlock({ title, text, note }: { title: string; text: string; note?: string }) {
  return (
    <div className="vt-stack" style={{ gap: '0.35rem' }}>
      <h4 className="vt-card-title" style={{ margin: 0 }}>{title}</h4>
      <p className="vt-prayer">{text}</p>
      {note && <p className="vt-xs vt-muted" style={{ margin: 0 }}>{note}</p>}
    </div>
  );
}

export function LitanyView({ litany }: { litany: Litany }) {
  return (
    <div className="vt-stack">
      {litany.nota && <p className="vt-xs vt-muted" style={{ margin: 0 }}>{litany.nota}</p>}
      {litany.bloques.map((b, i) => (
        <div key={i} className="vt-litany">
          {b.invocaciones.map((inv, j) => (
            <div key={j} style={{ display: 'contents' }}>
              <span>{inv}</span>
              <span className="vt-litany-r">{b.respuesta}</span>
            </div>
          ))}
        </div>
      ))}
      <p className="vt-prayer" style={{ marginTop: '0.5rem' }}>
        <strong>V.</strong> {litany.versiculo[0]}{'\n'}<strong>R.</strong> {litany.versiculo[1]}
      </p>
      <p className="vt-prayer"><strong>Oremos.</strong> {litany.oracion}</p>
    </div>
  );
}

const LEVELS = (count: number) => (count < 0 ? 'future' : count === 0 ? '0' : count === 1 ? '1' : count === 2 ? '2' : '3');

export function DevotionTracker({ entries, kind, onRemove, isLoggedIn }: {
  entries: DevotionEntry[];
  kind: DevotionKind;
  onRemove: (id: string) => void;
  isLoggedIn: boolean;
}) {
  const stats = devotionStats(entries, kind);
  const recent = entries.filter(e => e.kind === kind).slice(0, 12);
  return (
    <div className="vt-stack">
      <div className="vt-grid vt-grid-3" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        <div className="vt-stat"><strong>{stats.racha}</strong><span>Días seguidos</span></div>
        <div className="vt-stat"><strong>{stats.mejorRacha}</strong><span>Mejor racha</span></div>
        <div className="vt-stat"><strong>{stats.esteMes}</strong><span>Este mes</span></div>
        <div className="vt-stat"><strong>{stats.total}</strong><span>En total</span></div>
      </div>

      <div>
        <div className="vt-cal-head" aria-hidden="true" style={{ marginBottom: 3 }}>
          {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => <span key={i}>{d}</span>)}
        </div>
        <div className={`vt-heat${kind === 'sanjose' ? ' is-jose' : ''}`} role="img" aria-label="Días con oración en las últimas cinco semanas">
          {stats.dias.map(d => (
            <span key={d.iso} data-level={LEVELS(d.count)} title={`${d.iso}: ${Math.max(0, d.count)}`} style={d.count < 0 ? { opacity: 0.35 } : undefined} />
          ))}
        </div>
      </div>

      {stats.porDetalle.length > 0 && (
        <div className="vt-row">
          {stats.porDetalle.slice(0, 6).map(([k, v]) => <span key={k} className="vt-chip">{k}: {v}</span>)}
        </div>
      )}

      {stats.intenciones.length > 0 && (
        <div>
          <h4 className="vt-card-title" style={{ marginBottom: '0.4rem' }}><Flame size={14} /> Intenciones recientes</h4>
          <ul className="vt-list vt-small">
            {stats.intenciones.map(e => <li key={e.id}>{e.intencion} <span className="vt-xs vt-muted">· {e.fecha}</span></li>)}
          </ul>
        </div>
      )}

      {recent.length > 0 ? (
        <details>
          <summary className="vt-small" style={{ cursor: 'pointer', fontWeight: 700 }}>Historial ({recent.length} recientes)</summary>
          <ul className="vt-list" style={{ marginTop: '0.5rem' }}>
            {recent.map(e => (
              <li key={e.id} className="vt-row-between vt-small">
                <span>{formatLongDate(e.fecha)} · {e.detalle}{e.minutos ? ` · ${e.minutos} min` : ''}{e.completo ? '' : ' (parcial)'}</span>
                <button type="button" className="vt-btn vt-btn-sm vt-btn-ghost" onClick={() => onRemove(e.id)} aria-label="Borrar registro"><Trash2 size={13} /></button>
              </li>
            ))}
          </ul>
        </details>
      ) : (
        <p className="vt-small vt-muted" style={{ margin: 0 }}>Aún no hay registros. Al terminar, marca lo rezado y aparecerá aquí.</p>
      )}
      <p className="vt-xs vt-muted" style={{ margin: 0 }}>
        {isLoggedIn ? 'Se guarda en tu cuenta y se ve en todos tus dispositivos.' : 'Se guarda en este dispositivo. Inicia sesión para verlo en todos tus dispositivos.'}
      </p>
    </div>
  );
}

export function SongSuggestions({ songs, notation, emptyText }: { songs: Song[]; notation: 'american' | 'latin'; emptyText: string }) {
  const [open, setOpen] = useState<Song | null>(null);
  return (
    <>
      {songs.length === 0 ? (
        <p className="vt-small vt-muted" style={{ margin: 0 }}>{emptyText}</p>
      ) : (
        <ul className="vt-list">
          {songs.map(s => (
            <li key={s.id}>
              <button type="button" className="vt-list-btn" onClick={() => setOpen(s)}>
                <span className="vt-small"><Music size={13} style={{ display: 'inline', marginRight: 6 }} />{s.title}</span>
                <span className="vt-chip">{s.type}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && createPortal(
        <div className="vt-modal-backdrop" onClick={() => setOpen(null)} role="presentation">
          <div className="vt-modal" role="dialog" aria-modal="true" aria-label={open.title} onClick={e => e.stopPropagation()}>
            <div className="vt-modal-head">
              <strong>{open.title}</strong>
              <button type="button" className="vt-btn vt-btn-sm" onClick={() => setOpen(null)} aria-label="Cerrar"><X size={16} /></button>
            </div>
            <SongViewer
              id={open.id}
              title={open.title}
              type={open.type}
              content={open.content}
              notation={notation}
              songKey={open.key}
              author={open.author}
              sheetMusic={open.sheetMusic}
              hidePracticeStudio
            />
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

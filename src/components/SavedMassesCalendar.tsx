import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { COLOR_HEX, getLiturgicalDay, getMonthDays, todayIso } from '../utils/liturgicalCalendar';
import { getMassDateIso, getMassName, isDateId, isoToLocalDate } from '../utils/massDates';
import { formatLiturgicalDate } from './LiturgicalCalendarPicker';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const WEEK_HEAD = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];
const WEEKDAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

interface SavedMassesCalendarProps {
  masses: Record<string, unknown>;
  canPublish: boolean;
  onLoad: (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onTogglePublic: (id: string, e: React.MouseEvent) => void;
  onNewForDate: (dateIso: string) => void;
}

interface MassEntry {
  id: string;
  name: string;
  dateIso: string | null;
  isPublic: boolean;
  songCount: number;
}

function countSongs(data: unknown): number {
  const parts = Array.isArray(data) ? data : (data as { playlist?: unknown[] } | null)?.playlist;
  if (!Array.isArray(parts)) return 0;
  return parts.filter(p => (p as { isIncluded?: boolean; song?: unknown }).song && (p as { isIncluded?: boolean }).isIncluded !== false).length;
}

/** Celebraciones guardadas, organizadas por fecha: calendario del mes + lista agrupada por mes. */
export function SavedMassesCalendar({ masses, canPublish, onLoad, onDelete, onTogglePublic, onNewForDate }: SavedMassesCalendarProps) {
  const today = todayIso();

  const entries = useMemo<MassEntry[]>(() => {
    return Object.keys(masses)
      .map(id => ({
        id,
        name: getMassName(id, masses[id]),
        dateIso: getMassDateIso(id, masses[id]),
        isPublic: !!(masses[id] as { isPublic?: boolean } | null)?.isPublic,
        songCount: countSongs(masses[id]),
      }))
      // Más recientes primero; las que no tienen fecha, al final
      .sort((a, b) => (b.dateIso ?? '').localeCompare(a.dateIso ?? '') || a.id.localeCompare(b.id));
  }, [masses]);

  const byDay = useMemo(() => {
    const map = new Map<string, MassEntry[]>();
    entries.forEach(entry => {
      if (!entry.dateIso) return;
      map.set(entry.dateIso, [...(map.get(entry.dateIso) ?? []), entry]);
    });
    return map;
  }, [entries]);

  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState(() => {
    const [y, m] = today.split('-').map(Number);
    return { year: y, month: m - 1 };
  });

  const days = useMemo(() => getMonthDays(view.year, view.month), [view]);
  const offset = new Date(view.year, view.month, 1).getDay();

  const moveMonth = (delta: number) => {
    setView(v => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const goToMonth = (monthKey: string) => {
    const [y, m] = monthKey.split('-').map(Number);
    setView({ year: y, month: m - 1 });
  };

  // Grupos por mes para la lista completa
  const groups = useMemo(() => {
    const list: { key: string; label: string; items: MassEntry[] }[] = [];
    entries.forEach(entry => {
      const key = entry.dateIso ? entry.dateIso.slice(0, 7) : 'sin-fecha';
      let group = list.find(g => g.key === key);
      if (!group) {
        const label = entry.dateIso ? `${MONTHS[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}` : 'Sin fecha';
        group = { key, label, items: [] };
        list.push(group);
      }
      group.items.push(entry);
    });
    return list;
  }, [entries]);

  const renderRow = (entry: MassEntry) => {
    const date = entry.dateIso ? isoToLocalDate(entry.dateIso) : null;
    return (
      <div
        key={entry.id}
        role="button"
        tabIndex={0}
        className="bg-white p-3 rounded-lg flex items-center gap-3 cursor-pointer hover:bg-stone-100 border border-stone-200"
        onClick={() => onLoad(entry.id)}
        onKeyDown={e => { if (e.key === 'Enter') onLoad(entry.id); }}
        title="Abrir esta celebración"
      >
        <div className="shrink-0 w-12 text-center bg-stone-50 border border-stone-200 rounded-lg py-1">
          {date ? (
            <>
              <div className="text-[10px] font-bold uppercase text-red-600 leading-tight">{WEEKDAY_SHORT[date.getDay()]}</div>
              <div className="text-lg font-bold text-stone-800 leading-tight">{date.getDate()}</div>
            </>
          ) : (
            <div className="text-lg font-bold text-stone-400 leading-tight">—</div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-stone-800 truncate">{entry.name}</span>
            {entry.isPublic && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                Pública
              </span>
            )}
          </div>
          <div className="text-xs text-stone-500 mt-0.5">
            {isDateId(entry.id) && <span className="font-mono">ID {entry.id} · </span>}
            {entry.songCount} {entry.songCount === 1 ? 'canto' : 'cantos'}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {canPublish && (
            <label
              className="flex items-center gap-1.5 text-xs cursor-pointer bg-white border border-stone-200 px-2 py-1.5 rounded shadow-sm"
              onClick={e => e.stopPropagation()}
            >
              <span className="text-stone-500 font-medium hidden sm:inline">Publicar</span>
              <div className="relative inline-block w-8 h-4">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={entry.isPublic}
                  aria-label={`Publicar ${entry.name} en la comunidad`}
                  onChange={e => onTogglePublic(entry.id, e as unknown as React.MouseEvent)}
                />
                <div className="w-8 h-4 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
              </div>
            </label>
          )}
          <button
            className="btn btn-icon bg-stone-50 text-stone-500 hover:text-red-400"
            onClick={e => onDelete(entry.id, e)}
            title="Eliminar guardado"
            aria-label={`Eliminar ${entry.name}`}
          >
            <X size={18} />
          </button>
        </div>
      </div>
    );
  };

  const selectedEntries = selected ? (byDay.get(selected) ?? []) : [];
  const selectedDay = selected ? getLiturgicalDay(selected) : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-5 items-start">
      {/* ── Calendario del mes ── */}
      <section className="bg-white border border-stone-200 rounded-xl p-3" aria-label={`${MONTHS[view.month]} ${view.year}`}>
        <div className="flex items-center justify-between mb-2">
          <button type="button" className="btn btn-icon" style={{ padding: '6px' }} onClick={() => moveMonth(-1)} aria-label="Mes anterior">
            <ChevronLeft size={16} />
          </button>
          <div className="font-sacred font-bold text-sm text-stone-800">{MONTHS[view.month]} {view.year}</div>
          <button type="button" className="btn btn-icon" style={{ padding: '6px' }} onClick={() => moveMonth(1)} aria-label="Mes siguiente">
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-1" aria-hidden="true">
          {WEEK_HEAD.map((name, i) => (
            <span key={name} className={`text-[11px] font-bold ${i === 0 ? 'text-red-600' : 'text-stone-400'}`}>{name}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: offset }).map((_, i) => <span key={`pad-${i}`} />)}
          {days.map(day => {
            const num = Number(day.iso.slice(8));
            const count = byDay.get(day.iso)?.length ?? 0;
            const isSelected = day.iso === selected;
            return (
              <button
                key={day.iso}
                type="button"
                onClick={() => setSelected(isSelected ? null : day.iso)}
                aria-pressed={isSelected}
                aria-current={day.iso === today ? 'date' : undefined}
                title={count > 0 ? `${day.title} — ${count} ${count === 1 ? 'celebración guardada' : 'celebraciones guardadas'}` : day.title}
                className={`saved-cal-cell ${count > 0 ? 'has-mass' : ''} ${isSelected ? 'is-selected' : ''} ${day.iso === today ? 'is-today' : ''}`}
              >
                <span className={day.isSunday && count === 0 ? 'text-red-600' : undefined}>{num}</span>
                {count > 1 && <span className="saved-cal-count">{count}</span>}
                <span className="saved-cal-bar" style={{ background: COLOR_HEX[day.color] }} />
              </button>
            );
          })}
        </div>

        <p className="text-[11px] text-stone-500 mt-3 mb-0 flex items-center gap-1.5">
          <span className="saved-cal-legend" /> Día con celebración guardada. La línea es el color litúrgico.
        </p>
      </section>

      {/* ── Lista ── */}
      <div className="min-w-0">
        {selected && selectedDay ? (
          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <div className="font-semibold text-stone-800">{formatLiturgicalDate(isoToLocalDate(selected))}</div>
                <div className="text-xs text-stone-500">{selectedDay.title}</div>
              </div>
              <button type="button" className="btn text-xs px-2.5 py-1.5 shrink-0" onClick={() => setSelected(null)}>
                Ver todas
              </button>
            </div>
            {selectedEntries.length === 0 ? (
              <div className="text-stone-500 text-sm text-center py-6 bg-stone-50 border border-stone-200 rounded-lg">
                No hay celebraciones guardadas este día.
              </div>
            ) : (
              <div className="flex flex-col gap-2">{selectedEntries.map(renderRow)}</div>
            )}
            <button
              type="button"
              className="btn btn-primary mt-3 text-sm"
              onClick={() => onNewForDate(selected)}
              title="Vuelve al armador con esta fecha puesta"
            >
              <Plus size={16} /> Armar celebración para este día
            </button>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-stone-500 text-center py-8">
            No hay celebraciones guardadas. Toca un día del calendario para armar la primera.
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {groups.map(group => (
              <section key={group.key}>
                <div className="flex items-center justify-between mb-2">
                  {group.key === 'sin-fecha' ? (
                    <h3 className="text-sm text-stone-500 uppercase tracking-wider m-0">{group.label}</h3>
                  ) : (
                    <button
                      type="button"
                      className="text-sm font-bold text-stone-500 uppercase tracking-wider hover:text-red-600 cursor-pointer"
                      onClick={() => goToMonth(group.key)}
                      title="Ver este mes en el calendario"
                    >
                      {group.label}
                    </button>
                  )}
                  <span className="text-xs text-stone-400">{group.items.length}</span>
                </div>
                <div className="flex flex-col gap-2">{group.items.map(renderRow)}</div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { ArrowRight, Check, ExternalLink, Music, BarChart3, CalendarDays } from 'lucide-react';
import type { Song } from '../../hooks/useSongs';
import { useDevotionLog } from '../../hooks/useDevotionLog';
import { formatLongDate, getKeyDates, shiftIso, todayIso } from '../../utils/liturgicalCalendar';
import { SAN_JOSE_MYSTERIES, PREGUNTAS_SAN_JOSE } from '../../data/devociones/misterios';
import { AVE_MARIA, GLORIA, PADRE_NUESTRO, SENAL_CRUZ } from '../../data/devociones/oracionesBase';
import { LETANIAS_SAN_JOSE } from '../../data/devociones/letanias';
import { NOVENA_TEMAS, ORACIONES_SAN_JOSE, PATRIS_CORDE_URL } from '../../data/devociones/sanJose';
import { DevotionTracker, LitanyView, PrayerBlock, SongSuggestions } from './DevotionParts';
import '../../styles/liturgia.css';

interface SanJoseProps {
  songs: Song[];
  chordNotation?: 'american' | 'latin';
}

type Tab = 'hoy' | 'dolores' | 'novena' | 'oraciones';
const FEAST_NAME = 'San José, esposo de la Virgen María';

function daysBetween(a: string, b: string): number {
  const [y1, m1, d1] = a.split('-').map(Number);
  const [y2, m2, d2] = b.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}

function nextFeast(today: string): string {
  const year = Number(today.slice(0, 4));
  for (const y of [year, year + 1]) {
    const iso = getKeyDates(y).find(k => k.name === FEAST_NAME)?.iso;
    if (iso && iso >= today) return iso;
  }
  return `${year + 1}-03-19`;
}

// Los siete domingos anteriores a la solemnidad
function sevenSundays(feast: string): string[] {
  const out: string[] = [];
  let cursor = shiftIso(feast, -1);
  while (out.length < 7) {
    const [y, m, d] = cursor.split('-').map(Number);
    if (new Date(y, m - 1, d).getDay() === 0) out.unshift(cursor);
    cursor = shiftIso(cursor, -1);
  }
  return out;
}

export function SanJoseDevocion({ songs, chordNotation = 'latin' }: SanJoseProps) {
  const today = todayIso();
  const [tab, setTab] = useState<Tab>('hoy');
  const [step, setStep] = useState(0);
  const [side, setSide] = useState<'cantos' | 'seguimiento'>('cantos');
  const { entries, add, remove, isLoggedIn } = useDevotionLog();

  const feast = useMemo(() => nextFeast(today), [today]);
  const daysLeft = daysBetween(today, feast);
  const sundays = useMemo(() => sevenSundays(feast), [feast]);
  const feastYear = feast.slice(0, 4);
  const novenaStart = `${feastYear}-03-10`;
  const [ty, tm, td] = today.split('-').map(Number);
  const weekday = new Date(ty, tm - 1, td).getDay();

  const done = (detalle: string) => entries.some(e => e.kind === 'sanjose' && e.detalle === detalle && e.completo);
  const log = (detalle: string) => add({ kind: 'sanjose', fecha: today, detalle, completo: true });

  const joseSongs = useMemo(
    () => songs.filter(s => s.type === 'San José' || /\bsan jos[eé]\b/i.test(s.title) || /\bsan jos[eé]\b/i.test(s.content)).slice(0, 12),
    [songs],
  );

  const mystery = SAN_JOSE_MYSTERIES[step];

  return (
    <div className="vt-page animate-in fade-in duration-300">
      <header className="vt-hero">
        <div>
          <p className="vt-eyebrow" style={{ color: '#b45309' }}>Vir Fidelis · Ite ad Ioseph</p>
          <h1 className="vt-title">Rincón de San José</h1>
          <p className="vt-sub">Siete domingos, dolores y gozos, novena, oraciones y cantos al custodio de la Sagrada Familia.</p>
        </div>
        <span className="vt-chip" style={{ background: 'rgba(217,119,6,0.12)', color: '#b45309' }}>
          <CalendarDays size={13} /> {daysLeft === 0 ? 'Hoy es su solemnidad' : `Faltan ${daysLeft} días para su solemnidad`}
        </span>
      </header>

      <div className="vt-seg" role="group" aria-label="Devoción" style={{ marginBottom: '1rem' }}>
        {([['hoy', 'Siete domingos'], ['dolores', 'Dolores y gozos'], ['novena', 'Novena'], ['oraciones', 'Oraciones y letanías']] as [Tab, string][]).map(([id, label]) => (
          <button key={id} type="button" aria-pressed={tab === id} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      <div className="vt-grid vt-grid-main">
        <main>
          {tab === 'hoy' && (
            <section className="vt-card">
              <h3 className="vt-card-title">Los siete domingos antes del {formatLongDate(feast).toLowerCase()}</h3>
              {(weekday === 3 || tm === 3) && (
                <p className="vt-notice" style={{ marginTop: 0 }}>
                  {weekday === 3 && 'Hoy es miércoles, día que la tradición dedica a San José. '}
                  {tm === 3 && 'Marzo es el mes de San José.'}
                </p>
              )}
              <ul className="vt-list">
                {sundays.map((iso, i) => {
                  const detalle = `Domingo ${i + 1} de 7 (${feastYear})`;
                  const isDone = done(detalle);
                  return (
                    <li key={iso} className="vt-card" style={{ margin: 0, background: 'var(--surface-highlight)' }}>
                      <div className="vt-row-between">
                        <strong className="vt-small">{i + 1}.º domingo · {formatLongDate(iso)}</strong>
                        {isDone ? (
                          <span className="vt-chip vt-chip-ok"><Check size={12} /> Hecho</span>
                        ) : (
                          <button type="button" className="vt-btn vt-btn-sm" disabled={iso > today} onClick={() => void log(detalle)}>
                            {iso > today ? 'Aún no' : 'Marcar como hecho'}
                          </button>
                        )}
                      </div>
                      <p className="vt-small" style={{ margin: '0.35rem 0 0.2rem' }}>{SAN_JOSE_MYSTERIES[i].title}</p>
                      <p className="vt-xs vt-muted" style={{ margin: 0 }}>{SAN_JOSE_MYSTERIES[i].scripture} · Fruto: {SAN_JOSE_MYSTERIES[i].fruit}</p>
                    </li>
                  );
                })}
              </ul>
              <p className="vt-xs vt-muted" style={{ marginBottom: 0 }}>Cada domingo se medita un dolor y gozo de San José y se rezan un Padrenuestro, un Avemaría y un Gloria.</p>
            </section>
          )}

          {tab === 'dolores' && (
            <section className="vt-card">
              <nav className="vt-scroll-x" aria-label="Dolores y gozos" style={{ marginBottom: '0.75rem' }}>
                {SAN_JOSE_MYSTERIES.map((m, i) => (
                  <button key={m.number} type="button" className={`vt-step-pill${i < step ? ' is-done' : ''}`} aria-current={i === step ? 'step' : undefined} onClick={() => setStep(i)}>
                    {i + 1}.º
                  </button>
                ))}
              </nav>
              <p className="vt-eyebrow" style={{ color: '#b45309' }}>{step + 1}.º dolor y gozo · {mystery.scripture}</p>
              <h2 style={{ margin: '0 0 0.4rem', fontFamily: 'Cormorant Garamond, Georgia, serif' }}>{mystery.title}</h2>
              <p className="vt-prayer" style={{ fontStyle: 'italic' }}>{mystery.meditation}</p>
              <p className="vt-notice" style={{ margin: '0.75rem 0' }}><strong>Para la vida:</strong> {PREGUNTAS_SAN_JOSE[step]} <span className="vt-muted">Fruto: {mystery.fruit}.</span></p>
              <div className="vt-stack" style={{ gap: '0.8rem' }}>
                <PrayerBlock title="Padrenuestro" text={PADRE_NUESTRO} />
                <PrayerBlock title="Avemaría" text={AVE_MARIA} />
                <PrayerBlock title="Gloria" text={GLORIA} />
              </div>
              {step < SAN_JOSE_MYSTERIES.length - 1 ? (
                <button type="button" className="rosary-advance-btn rosary-advance-btn-jose" style={{ marginTop: '1rem' }} onClick={() => setStep(s => s + 1)}>
                  <span>Siguiente dolor y gozo</span><ArrowRight size={18} />
                </button>
              ) : (
                <button type="button" className="rosary-advance-btn rosary-advance-btn-jose" style={{ marginTop: '1rem' }} onClick={() => { void log('Siete dolores y gozos'); setStep(0); setSide('seguimiento'); }}>
                  <span>Terminé los siete dolores y gozos</span><Check size={18} />
                </button>
              )}
            </section>
          )}

          {tab === 'novena' && (
            <section className="vt-card">
              <h3 className="vt-card-title">Novena del {formatLongDate(novenaStart).toLowerCase()} al 18 de marzo</h3>
              <p className="vt-small vt-muted" style={{ marginTop: 0 }}>
                Cada día: señal de la cruz, la oración "A ti, bienaventurado San José", el rasgo del día con su petición, un Padrenuestro, un Avemaría y un Gloria. Se puede cerrar con las letanías.
              </p>
              <ul className="vt-list">
                {NOVENA_TEMAS.map((d, i) => {
                  const iso = shiftIso(novenaStart, i);
                  const detalle = `Novena día ${i + 1} (${feastYear})`;
                  return (
                    <li key={iso} className="vt-row-between" style={{ background: 'var(--surface-highlight)', padding: '0.6rem 0.75rem', borderRadius: 10 }}>
                      <span className="vt-small">
                        <strong>Día {i + 1}</strong> · {iso.slice(8)}/03 · {d.tema}
                        <span className="vt-xs vt-muted" style={{ display: 'block' }}>{d.peticion}</span>
                      </span>
                      {done(detalle) ? (
                        <span className="vt-chip vt-chip-ok"><Check size={12} /> Hecho</span>
                      ) : (
                        <button type="button" className="vt-btn vt-btn-sm" disabled={iso > today} onClick={() => void log(detalle)}>{iso > today ? 'Aún no' : 'Rezado'}</button>
                      )}
                    </li>
                  );
                })}
              </ul>
              <div style={{ marginTop: '1rem' }} className="vt-stack">
                <PrayerBlock title="Señal de la cruz" text={SENAL_CRUZ} />
                <PrayerBlock title={ORACIONES_SAN_JOSE[0].titulo} text={ORACIONES_SAN_JOSE[0].texto} note={ORACIONES_SAN_JOSE[0].origen} />
              </div>
            </section>
          )}

          {tab === 'oraciones' && (
            <section className="vt-card vt-stack" style={{ gap: '1.1rem' }}>
              {ORACIONES_SAN_JOSE.map(o => <PrayerBlock key={o.id} title={o.titulo} text={o.texto} note={o.origen} />)}
              <div>
                <h4 className="vt-card-title">Corona de San José</h4>
                <ul className="vt-small vt-ul" style={{ lineHeight: 1.7, paddingLeft: '1.1rem', margin: 0 }}>
                  <li><strong>Cuenta grande:</strong> "San José, custodio de los Sagrados Corazones de Jesús y María, inflama mi corazón para que en él solo reine mi Dios."</li>
                  <li><strong>Cuentas pequeñas (10):</strong> "San José, padre adoptivo de Jesucristo y verdadero esposo de la Virgen María, ruega por nosotros y por los agonizantes de este día (o de esta noche)."</li>
                  <li><strong>Al final de cada misterio:</strong> "Jesús, María y José, les doy el corazón y el alma mía."</li>
                </ul>
              </div>
              <div>
                <h4 className="vt-card-title">{LETANIAS_SAN_JOSE.titulo}</h4>
                <LitanyView litany={LETANIAS_SAN_JOSE} />
              </div>
              <a className="vt-btn" href={PATRIS_CORDE_URL} target="_blank" rel="noopener noreferrer">
                Carta Patris corde y oración del papa Francisco (vatican.va) <ExternalLink size={13} />
              </a>
            </section>
          )}
        </main>

        <aside>
          <div className="vt-seg" role="group" aria-label="Panel lateral" style={{ marginBottom: '0.75rem' }}>
            <button type="button" aria-pressed={side === 'cantos'} onClick={() => setSide('cantos')}><Music size={13} style={{ display: 'inline', marginRight: 4 }} />Cantos</button>
            <button type="button" aria-pressed={side === 'seguimiento'} onClick={() => setSide('seguimiento')}><BarChart3 size={13} style={{ display: 'inline', marginRight: 4 }} />Seguimiento</button>
          </div>
          {side === 'cantos' ? (
            <section className="vt-card">
              <h3 className="vt-card-title"><Music size={14} /> Cantos a San José</h3>
              <SongSuggestions songs={joseSongs} notation={chordNotation} emptyText="No hay cantos a San José en el repertorio. Puedes agregarlos desde el editor con el tipo 'San José'." />
            </section>
          ) : (
            <section className="vt-card">
              <h3 className="vt-card-title"><BarChart3 size={14} /> Mi devoción a San José</h3>
              <DevotionTracker entries={entries} kind="sanjose" onRemove={id => void remove(id)} isLoggedIn={isLoggedIn} />
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

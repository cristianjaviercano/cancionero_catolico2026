import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, Music, BarChart3, BookOpen } from 'lucide-react';
import type { Song } from '../../hooks/useSongs';
import { useDevotionLog } from '../../hooks/useDevotionLog';
import { getLiturgicalDay, mysteriesForDay, todayIso, COLOR_HEX } from '../../utils/liturgicalCalendar';
import { MARIAN_MYSTERIES, PREGUNTAS, TIPOS_CANTO, type MysteryKey } from '../../data/devociones/misterios';
import { AVE_MARIA, CREDO, GLORIA, JACULATORIA_MARIANA, OH_JESUS_MIO, ORACION_FINAL_ROSARIO, PADRE_NUESTRO, SALVE, SENAL_CRUZ } from '../../data/devociones/oracionesBase';
import { LETANIAS_LAURETANAS } from '../../data/devociones/letanias';
import { DevotionTracker, LitanyView, PrayerBlock, SongSuggestions } from './DevotionParts';
import '../../styles/liturgia.css';

interface RosarioProps {
  songs: Song[];
  chordNotation?: 'american' | 'latin';
}

type Phase = 'inicio' | 'misterio' | 'final' | 'hecho';
const KEYS: MysteryKey[] = ['gozosos', 'luminosos', 'dolorosos', 'gloriosos'];
const ORDINAL = ['Primer', 'Segundo', 'Tercer', 'Cuarto', 'Quinto'];
// 0 = Padrenuestro, 1–10 = Avemarías, 11 = Gloria y jaculatorias
const LAST_BEAD = 11;

export function RosarioMariano({ songs, chordNotation = 'latin' }: RosarioProps) {
  const today = todayIso();
  const day = useMemo(() => getLiturgicalDay(today), [today]);
  const todayKey = mysteriesForDay(today);
  const [key, setKey] = useState<MysteryKey>(todayKey);
  const [phase, setPhase] = useState<Phase>('inicio');
  const [index, setIndex] = useState(0);
  const [bead, setBead] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [intencion, setIntencion] = useState('');
  const [tab, setTab] = useState<'cantos' | 'seguimiento'>('cantos');
  const { entries, add, remove, isLoggedIn } = useDevotionLog();

  const set = MARIAN_MYSTERIES[key];
  const mystery = set.list[index];
  const mysterySongs = useMemo(() => {
    const types = TIPOS_CANTO[key];
    return songs
      .filter(s => types.includes(s.type))
      .sort((a, b) => Number(b.type === 'María') - Number(a.type === 'María'))
      .slice(0, 10);
  }, [songs, key]);

  const reset = (nextKey = key) => {
    setKey(nextKey);
    setPhase('inicio');
    setIndex(0);
    setBead(0);
    setStartedAt(null);
  };

  const advance = () => {
    if (phase === 'inicio') {
      setPhase('misterio');
      setStartedAt(s => s ?? Date.now());
      return;
    }
    if (phase !== 'misterio') return;
    if (bead < LAST_BEAD) { setBead(b => b + 1); return; }
    if (index < 4) { setIndex(i => i + 1); setBead(0); return; }
    setPhase('final');
  };

  // Barra espaciadora, flecha derecha o pedal Bluetooth avanzan una cuenta
  useEffect(() => {
    if (phase !== 'misterio') return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === ' ' || e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const finish = async (completo: boolean) => {
    const minutos = startedAt ? Math.max(1, Math.round((Date.now() - startedAt) / 60000)) : undefined;
    await add({ kind: 'rosario', fecha: today, detalle: set.name, completo, minutos, intencion: intencion.trim() || undefined });
    setPhase('hecho');
    setTab('seguimiento');
  };

  const prayerForBead = () => {
    if (bead === 0) return { title: 'Padrenuestro', text: PADRE_NUESTRO };
    if (bead <= 10) return { title: `Avemaría ${bead} de 10`, text: AVE_MARIA };
    return { title: 'Gloria y jaculatorias', text: `${GLORIA}\n\n${OH_JESUS_MIO}\n\n${JACULATORIA_MARIANA}` };
  };

  return (
    <div className="vt-page animate-in fade-in duration-300">
      <header className="vt-hero">
        <div>
          <p className="vt-eyebrow">Corona Sanctorum</p>
          <h1 className="vt-title">Santo Rosario</h1>
          <p className="vt-sub">Rezo guiado con meditación, cantos para cada misterio y seguimiento de tu oración.</p>
        </div>
        <span className="vt-chip">
          <span className="vt-dot" style={{ background: COLOR_HEX[day.color] }} />
          Hoy corresponden los {MARIAN_MYSTERIES[todayKey].name.toLowerCase()}
        </span>
      </header>

      <div className="vt-seg" role="group" aria-label="Misterios" style={{ marginBottom: '0.75rem' }}>
        {KEYS.map(k => (
          <button key={k} type="button" aria-pressed={k === key} onClick={() => reset(k)}>
            {MARIAN_MYSTERIES[k].name.replace('Misterios ', '')}
            <span className="vt-xs" style={{ display: 'block', fontWeight: 500 }}>{MARIAN_MYSTERIES[k].days}</span>
          </button>
        ))}
      </div>

      <nav className="vt-scroll-x" aria-label="Partes del Rosario" style={{ marginBottom: '1rem' }}>
        <button type="button" className={`vt-step-pill${phase !== 'inicio' ? ' is-done' : ''}`} aria-current={phase === 'inicio' ? 'step' : undefined} onClick={() => setPhase('inicio')}>Inicio</button>
        {set.list.map((m, i) => (
          <button
            key={m.number}
            type="button"
            className={`vt-step-pill${(phase === 'misterio' && i < index) || phase === 'final' || phase === 'hecho' ? ' is-done' : ''}`}
            aria-current={phase === 'misterio' && i === index ? 'step' : undefined}
            onClick={() => { setPhase('misterio'); setIndex(i); setBead(0); setStartedAt(s => s ?? Date.now()); }}
          >
            {i + 1}.º {m.title.split(' ').slice(0, 3).join(' ')}…
          </button>
        ))}
        <button type="button" className="vt-step-pill" aria-current={phase === 'final' ? 'step' : undefined} onClick={() => setPhase('final')}>Salve y letanías</button>
      </nav>

      <div className="vt-grid vt-grid-main">
        <main>
          {phase === 'inicio' && (
            <section className="vt-card vt-stack" style={{ gap: '1rem' }}>
              <PrayerBlock title="Señal de la cruz" text={SENAL_CRUZ} />
              <PrayerBlock title="Credo" text={CREDO} />
              <PrayerBlock title="Padrenuestro" text={PADRE_NUESTRO} />
              <PrayerBlock title="Tres Avemarías" text={AVE_MARIA} note="Se rezan tres: por el aumento de la fe, de la esperanza y de la caridad." />
              <PrayerBlock title="Gloria" text={GLORIA} />
              <label className="vt-stack" style={{ gap: '0.3rem' }}>
                <span className="vt-label">Intención (opcional)</span>
                <input className="vt-input" value={intencion} onChange={e => setIntencion(e.target.value)} placeholder="Por la salud de mi mamá, por el coro…" maxLength={140} />
              </label>
              <button type="button" className="rosary-advance-btn rosary-advance-btn-marian" onClick={advance}>
                <span>Empezar el {ORDINAL[0].toLowerCase()} misterio</span><ArrowRight size={18} />
              </button>
            </section>
          )}

          {phase === 'misterio' && (
            <section className="vt-card">
              <p className="vt-eyebrow" style={{ color: '#2563eb' }}>{ORDINAL[index]} misterio {set.name.replace('Misterios ', '').toLowerCase().replace(/s$/, '')} · {mystery.scripture}</p>
              <h2 style={{ margin: '0 0 0.4rem', fontFamily: 'Cormorant Garamond, Georgia, serif' }}>{mystery.title}</h2>
              <p className="vt-small vt-muted" style={{ margin: '0 0 0.75rem' }}>Fruto del misterio: <strong>{mystery.fruit}</strong></p>
              <p className="vt-prayer" style={{ fontStyle: 'italic' }}>{mystery.meditation}</p>
              <p className="vt-notice" style={{ margin: '0.75rem 0 1rem' }}><strong>Para la vida:</strong> {PREGUNTAS[key][index]}</p>

              <div className="rosary-card-inner">
                <div className="rosary-track-wrapper">
                  <div className="rosary-cord" />
                  <button type="button" onClick={() => setBead(0)} className={`rosary-bead rosary-bead-ourfather ${bead === 0 ? 'is-active' : 'is-completed'}`} title="Padrenuestro">✝</button>
                  {Array.from({ length: 10 }).map((_, i) => {
                    const n = i + 1;
                    const state = bead === n ? 'is-active' : bead > n ? 'is-completed' : 'rosary-bead-idle';
                    return (
                      <button key={n} type="button" onClick={() => setBead(n)} className={`rosary-bead rosary-bead-marian ${state}`} title={`Avemaría ${n}`}>
                        {bead > n ? '✓' : n}
                      </button>
                    );
                  })}
                  <button type="button" onClick={() => setBead(LAST_BEAD)} className={`rosary-bead rosary-bead-ourfather ${bead === LAST_BEAD ? 'is-active' : 'rosary-bead-idle'}`} title="Gloria">G</button>
                </div>
                <div className="rosary-prayer-card">
                  <PrayerBlock {...prayerForBead()} />
                </div>
                <button type="button" onClick={advance} className="rosary-advance-btn rosary-advance-btn-marian">
                  <span>
                    {bead < LAST_BEAD ? `Siguiente (${bead + 1} de ${LAST_BEAD})` : index < 4 ? `Pasar al ${ORDINAL[index + 1].toLowerCase()} misterio` : 'Ir a la Salve y las letanías'}
                  </span>
                  <ArrowRight size={18} />
                </button>
                <p className="vt-xs vt-muted vt-center" style={{ margin: '0.5rem 0 0' }}>También avanzas con la barra espaciadora, la flecha → o un pedal Bluetooth.</p>
              </div>
            </section>
          )}

          {phase === 'final' && (
            <section className="vt-card vt-stack" style={{ gap: '1.1rem' }}>
              <PrayerBlock title="Salve" text={SALVE} />
              <div>
                <h4 className="vt-card-title">{LETANIAS_LAURETANAS.titulo}</h4>
                <LitanyView litany={LETANIAS_LAURETANAS} />
              </div>
              <PrayerBlock title="Oración final" text={ORACION_FINAL_ROSARIO} />
              <div className="vt-row">
                <button type="button" className="vt-btn vt-btn-primary" onClick={() => finish(true)}><Check size={16} /> Terminé el Rosario</button>
                <button type="button" className="vt-btn" onClick={() => finish(false)}>Guardar como rezado en parte</button>
              </div>
            </section>
          )}

          {phase === 'hecho' && (
            <section className="vt-card vt-center">
              <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>Rosario registrado</h2>
              <p className="vt-muted">{set.name} · {intencion ? `Intención: ${intencion}` : 'Sin intención escrita'}</p>
              <button type="button" className="vt-btn" onClick={() => { reset(); setIntencion(''); }}>Rezar otro</button>
            </section>
          )}
        </main>

        <aside>
          <div className="vt-seg" role="group" aria-label="Panel lateral" style={{ marginBottom: '0.75rem' }}>
            <button type="button" aria-pressed={tab === 'cantos'} onClick={() => setTab('cantos')}><Music size={13} style={{ display: 'inline', marginRight: 4 }} />Cantos</button>
            <button type="button" aria-pressed={tab === 'seguimiento'} onClick={() => setTab('seguimiento')}><BarChart3 size={13} style={{ display: 'inline', marginRight: 4 }} />Seguimiento</button>
          </div>
          {tab === 'cantos' ? (
            <section className="vt-card">
              <h3 className="vt-card-title"><BookOpen size={14} /> Para cantar entre misterios</h3>
              <p className="vt-xs vt-muted" style={{ marginTop: 0 }}>Cantos del repertorio afines a los {set.name.toLowerCase()}. Ábrelos para ver acordes y el botón Acompañar.</p>
              <SongSuggestions songs={mysterySongs} notation={chordNotation} emptyText="No hay cantos con estos tipos en el repertorio." />
            </section>
          ) : (
            <section className="vt-card">
              <h3 className="vt-card-title"><BarChart3 size={14} /> Mi Rosario</h3>
              <DevotionTracker entries={entries} kind="rosario" onRemove={id => void remove(id)} isLoggedIn={isLoggedIn} />
              {phase !== 'hecho' && (
                <button type="button" className="vt-btn vt-btn-sm vt-btn-block" style={{ marginTop: '0.75rem' }} onClick={() => finish(true)}>
                  Ya lo recé hoy (registrar sin guía)
                </button>
              )}
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

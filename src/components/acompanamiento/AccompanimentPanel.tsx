import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Play, Square, Save, Keyboard, Guitar, Piano, FileMusic, RotateCcw, Info } from 'lucide-react';
import { ChordDiagram } from '../ChordDiagram';
import { AbcScore } from './AbcScore';
import { abcSkeleton } from '../../utils/abcTemplate';
import { useSongParams } from '../../hooks/useSongParams';
import { formatChord, transposeChord } from '../../utils/musicTheory';
import { getLiturgicalDay, todayIso } from '../../utils/liturgicalCalendar';
import { strumPlayer } from '../../utils/strumPlayer';
import {
  ARPEGIOS, LEYENDA_GUITARRA, RASGUEOS, SECCIONES_ESTILO, SMART_CHORD_USO, VOCES_COMO_SELECCIONAR,
  capoOptions, chordTones, estiloPorNumero, multiFingerKeys, patronPorId, patternTab, perfilPorId,
  perfilesSugeridos, smartChordPlan, songChordSequence, songKey, strumCounts, styleKeyFor, uniqueChords, vozPorNumero,
  type MatchLevel, type Patron, type SongParams,
} from '../../utils/accompaniment';
import '../../styles/liturgia.css';

interface AccompanimentPanelProps {
  songId?: string;
  title: string;
  type?: string;
  content: string;
  transpose: number;
  songKey?: string;
  notation: 'american' | 'latin';
  onClose: () => void;
}

type Tab = 'teclado' | 'guitarra' | 'piano' | 'partitura';

const NIVEL_CHIP: Record<MatchLevel, string> = { exacto: 'vt-chip vt-chip-ok', aproximado: 'vt-chip vt-chip-warn', distinto: 'vt-chip vt-chip-accent' };
const NIVEL_TEXTO: Record<MatchLevel, string> = { exacto: 'igual', aproximado: 'parecido', distinto: 'no sirve' };
const ARROW: Record<string, string> = { D: '↓', U: '↑', B: 'B', X: '✕', '-': '·', p: 'p', p2: 'p', i: 'i', m: 'm', a: 'a' };

export function AccompanimentPanel({ songId, title, type, content, transpose, songKey: explicitKey, notation, onClose }: AccompanimentPanelProps) {
  const { params, source, save, clear, isLoggedIn } = useSongParams(songId);
  const [tab, setTab] = useState<Tab>('teclado');
  const [draft, setDraft] = useState<SongParams & { abc?: string }>({});
  const [arpegioId, setArpegioId] = useState<string | null>(null);
  const [now, setNow] = useState<{ bar: number; step: number } | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const season = useMemo(() => getLiturgicalDay(todayIso()).season, []);
  const sequence = useMemo(() => songChordSequence(content, transpose), [content, transpose]);
  const chords = useMemo(() => uniqueChords(sequence), [sequence]);
  const key = useMemo(() => songKey(content, transpose, explicitKey), [content, transpose, explicitKey]);
  const { perfiles, aviso } = useMemo(() => perfilesSugeridos(type, season), [type, season]);

  const perfil = perfilPorId(draft.perfil ?? params.perfil ?? perfiles[0].id) ?? perfiles[0];
  const compas = draft.compas ?? params.compas ?? perfil.compas;
  const bpm = draft.bpm ?? params.bpm ?? perfil.bpmSugerido;
  const estiloNum = draft.estilo ?? params.estilo ?? perfil.teclado.estilos[0]?.numero;
  const capo = draft.capo ?? params.capo ?? 0;
  const rasgueosCompas = RASGUEOS.filter(r => r.compas === compas);
  const rasgueoId = draft.rasgueo ?? params.rasgueo ?? perfil.guitarra.rasgueos.find(id => patronPorId(id)?.compas === compas) ?? rasgueosCompas[0]?.id ?? 'negras';
  const rasgueo = patronPorId(rasgueoId) ?? RASGUEOS[0];
  const arpegiosCompas = ARPEGIOS.filter(a => a.compas === compas);
  const arpegio = patronPorId(arpegioId ?? '') ?? arpegiosCompas.find(a => perfil.guitarra.arpegios.includes(a.id)) ?? arpegiosCompas[0] ?? null;
  const abc = draft.abc ?? params.abc ?? '';

  const styleKey = key ? styleKeyFor(key) : null;
  const plan = useMemo(() => (styleKey ? smartChordPlan(chords, styleKey.code) : null), [chords, styleKey]);
  const capos = useMemo(() => capoOptions(chords), [chords]);
  const shapes = chords.map(c => transposeChord(c, -capo));
  const shapeSequence = sequence.map(c => transposeChord(c, -capo));
  const tabResult = arpegio ? patternTab(shapeSequence, arpegio, 4) : null;
  const fmt = (c: string) => formatChord(c, notation);

  useEffect(() => () => strumPlayer.stop(), []);

  const set = (patch: Partial<SongParams & { abc?: string }>) => setDraft(d => ({ ...d, ...patch }));

  const choosePerfil = (id: string) => {
    const p = perfilPorId(id);
    if (!p) return;
    strumPlayer.stop();
    setNow(null);
    setDraft(d => ({ ...d, perfil: id, compas: p.compas, bpm: p.bpmSugerido, estilo: p.teclado.estilos[0]?.numero, rasgueo: undefined }));
  };

  const togglePattern = (pattern: Patron) => {
    if (now) {
      strumPlayer.stop();
      setNow(null);
      return;
    }
    strumPlayer.start(shapeSequence.slice(0, 8), pattern, bpm, (bar, step) => setNow({ bar, step }));
    setNow({ bar: 0, step: 0 });
  };

  const handleSave = async () => {
    const next = { ...params, perfil: perfil.id, compas, bpm, estilo: estiloNum, rasgueo: rasgueo.id, capo, abc: abc.trim() || undefined };
    try {
      await save(next);
      setDraft({});
      setSavedMsg(isLoggedIn ? 'Guardado en tu cuenta' : 'Guardado en este dispositivo');
    } catch {
      setSavedMsg('No se pudo guardar en la nube');
    }
    setTimeout(() => setSavedMsg(null), 3500);
  };

  const estilo = estiloNum ? estiloPorNumero(estiloNum) : undefined;
  const vozPrincipal = vozPorNumero(perfil.teclado.voces[0]);
  const vozDual = perfil.teclado.dual ? vozPorNumero(perfil.teclado.dual) : undefined;

  // Portal al body: el panel queda por encima del encabezado y del menú lateral
  return createPortal(
    <div className="vt-modal-backdrop" onClick={onClose} role="presentation">
      <div className="vt-modal" role="dialog" aria-modal="true" aria-label={`Acompañamiento de ${title}`} onClick={e => e.stopPropagation()}>
        <div className="vt-modal-head">
          <div>
            <p className="vt-eyebrow" style={{ margin: 0 }}>Acompañamiento</p>
            <h2 style={{ margin: 0, fontSize: '1.15rem' }}>{title}</h2>
          </div>
          <button type="button" className="vt-btn vt-btn-sm" onClick={onClose} aria-label="Cerrar"><X size={16} /></button>
        </div>

        {/* ── Resumen y perfil ── */}
        <section className="vt-card">
          <div className="vt-row" style={{ marginBottom: '0.6rem' }}>
            <span className="vt-chip vt-chip-accent">Tono: {key ? fmt(key.name) : 'sin detectar'}</span>
            <span className="vt-chip">Compás {compas}</span>
            <span className="vt-chip">{bpm} BPM</span>
            <span className="vt-chip">{chords.length} acordes</span>
            {source === 'usuario' && <span className="vt-chip vt-chip-ok">Parámetros guardados</span>}
            {source === 'repertorio' && <span className="vt-chip vt-chip-ok">Parámetros del repertorio</span>}
            {!source && <span className="vt-chip">Sugerido por el tipo de canto{type ? ` (${type})` : ''}</span>}
          </div>
          <label className="vt-label">Perfil rítmico</label>
          <div className="vt-scroll-x" style={{ marginBottom: '0.6rem' }}>
            {perfiles.map((p, i) => (
              <button key={p.id} type="button" className="vt-step-pill" aria-current={p.id === perfil.id ? 'step' : undefined} onClick={() => choosePerfil(p.id)} title={p.caracter}>
                {i < 3 ? '★ ' : ''}{p.nombre} · {p.compas}
              </button>
            ))}
          </div>
          <p className="vt-small vt-muted" style={{ margin: '0 0 0.6rem' }}>{perfil.caracter} Momentos: {perfil.momentos.join(', ')}.</p>
          <div className="vt-row">
            <label className="vt-row vt-small">Compás
              <select className="vt-select" value={compas} onChange={e => set({ compas: e.target.value, rasgueo: undefined })}>
                {['4/4', '3/4', '6/8', '2/4'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="vt-row vt-small">BPM
              <input className="vt-input" type="number" min={40} max={200} value={bpm} onChange={e => set({ bpm: Number(e.target.value) || perfil.bpmSugerido })} style={{ width: '5rem' }} />
            </label>
            <span className="vt-xs vt-muted">Rango del perfil: {perfil.bpm[0]}–{perfil.bpm[1]}</span>
            <span style={{ flex: 1 }} />
            {source === 'usuario' && (
              <button type="button" className="vt-btn vt-btn-sm vt-btn-ghost" onClick={() => { void clear(); setDraft({}); }}><RotateCcw size={14} /> Volver a la sugerencia</button>
            )}
            <button type="button" className="vt-btn vt-btn-sm vt-btn-primary" onClick={handleSave} disabled={!songId}><Save size={14} /> Guardar para este canto</button>
            {savedMsg && <span className="vt-chip vt-chip-ok">{savedMsg}</span>}
          </div>
          {aviso && <p className="vt-notice vt-notice-warn" style={{ margin: '0.75rem 0 0' }}>{aviso}</p>}
        </section>

        <div className="vt-seg" role="group" aria-label="Instrumento" style={{ marginBottom: '1rem' }}>
          <button type="button" aria-pressed={tab === 'teclado'} onClick={() => setTab('teclado')}><Keyboard size={14} style={{ display: 'inline', marginRight: 4 }} />Teclado PSR-E383</button>
          <button type="button" aria-pressed={tab === 'guitarra'} onClick={() => setTab('guitarra')}><Guitar size={14} style={{ display: 'inline', marginRight: 4 }} />Guitarra</button>
          <button type="button" aria-pressed={tab === 'piano'} onClick={() => setTab('piano')}><Piano size={14} style={{ display: 'inline', marginRight: 4 }} />Piano</button>
          <button type="button" aria-pressed={tab === 'partitura'} onClick={() => setTab('partitura')}><FileMusic size={14} style={{ display: 'inline', marginRight: 4 }} />Partitura y tablatura</button>
        </div>

        {/* ── Teclado ── */}
        {tab === 'teclado' && (
          <div className="vt-grid vt-grid-main">
            <section className="vt-card">
              <h3 className="vt-card-title">Paso a paso en el PSR-E383</h3>
              <ol className="vt-step-list">
                <li>
                  <span>
                    Pulsa <span className="vt-kbd">[SONG]/[STYLE]</span> hasta ver el ícono STYLE. Con <span className="vt-kbd">[SHIFT]+[FUNCTION]</span> activas la entrada numérica y escribes el estilo{' '}
                    <strong>{estilo ? `${String(estilo.numero).padStart(3, '0')} ${estilo.nombre}` : '—'}</strong>.
                    {estilo?.soloConAcmp && <span className="vt-xs vt-muted"> Este estilo no trae batería: solo suena con ACMP encendido y tocando acordes.</span>}
                  </span>
                </li>
                <li>
                  <span>
                    Voz principal: <strong>{vozPrincipal ? `${String(vozPrincipal.numero).padStart(3, '0')} ${vozPrincipal.nombre}` : '—'}</strong>
                    {vozDual && <> · con <span className="vt-kbd">[DUAL]</span> suma <strong>{String(vozDual.numero).padStart(3, '0')} {vozDual.nombre}</strong></>}.
                  </span>
                </li>
                <li><span>Tempo: <span className="vt-kbd">[TEMPO/TAP]</span> y escribe <strong>{bpm}</strong> con los botones numéricos (o toca [TEMPO/TAP] al pulso del canto).</span></li>
                <li>
                  <span>
                    Digitación: <span className="vt-kbd">[FINGERING TYPE]</span> → <strong>{plan?.recomendado ?? 'Multi Finger'}</strong>.
                    {plan?.recomendado === 'Smart Chord' && styleKey && (
                      <> Luego <span className="vt-kbd">[STYLE KEY]</span> → <strong>{styleKey.pantalla}</strong> ({fmt(styleKey.mayor)} mayor / {fmt(styleKey.menor)}).</>
                    )}
                    {plan?.recomendado === 'Multi Finger' && <> Algunos acordes del canto no salen con Smart Chord en esta armadura.</>}
                  </span>
                </li>
                <li><span><span className="vt-kbd">[ACMP ON/OFF]</span> encendido, <span className="vt-kbd">[SYNC START]</span>, <span className="vt-kbd">[MAIN/AUTO FILL]</span> en Main A e <span className="vt-kbd">[INTRO/ENDING/rit.]</span>. Toca el primer acorde con la izquierda, a la izquierda de Fa#2 (tecla 54), y arranca la introducción.</span></li>
                <li><span>{SECCIONES_ESTILO.coro} Para terminar: {SECCIONES_ESTILO.final}</span></li>
                <li><span>Guarda todo con <span className="vt-kbd">[SHIFT]+[REGIST MEMORY]</span> y un botón del 1 al 0 para recuperarlo en la misa.</span></li>
              </ol>
              <p className="vt-notice" style={{ marginBottom: 0 }}><Info size={14} style={{ display: 'inline' }} /> {perfil.teclado.consejo}</p>
            </section>

            <aside>
              <section className="vt-card">
                <h3 className="vt-card-title">Estilos para este perfil</h3>
                <ul className="vt-list">
                  {perfil.teclado.estilos.map(e => {
                    const info = estiloPorNumero(e.numero);
                    return (
                      <li key={e.numero}>
                        <button type="button" className="vt-list-btn" onClick={() => set({ estilo: e.numero })} aria-pressed={e.numero === estiloNum}
                          style={e.numero === estiloNum ? { outline: '2px solid var(--accent-color)' } : undefined}>
                          <span>
                            <strong className="vt-mono">{String(e.numero).padStart(3, '0')}</strong> {info?.nombre}
                            <span className="vt-xs vt-muted" style={{ display: 'block' }}>{e.motivo}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <p className="vt-xs vt-muted" style={{ marginBottom: 0 }}>{VOCES_COMO_SELECCIONAR}</p>
              </section>
            </aside>

            <section className="vt-card" style={{ gridColumn: '1 / -1' }}>
              <h3 className="vt-card-title">Qué tecla tocar para cada acorde</h3>
              {plan && styleKey ? (
                <div className="vt-table-wrap">
                  <table className="vt-table">
                    <thead>
                      <tr><th>Acorde</th><th>Smart Chord ({styleKey.code})</th><th>Multi Finger (atajo del manual)</th></tr>
                    </thead>
                    <tbody>
                      {plan.rows.map(r => {
                        const mf = multiFingerKeys(r.chord);
                        return (
                          <tr key={r.chord}>
                            <td><strong className="vt-mono">{fmt(r.chord)}</strong></td>
                            <td>
                              tecla <span className="vt-kbd">{fmt(r.tecla)}</span> → {fmt(r.produce.replace('1+5', ''))}{r.produce.includes('1+5') ? ' (sin tercera)' : ''}{' '}
                              <span className={NIVEL_CHIP[r.nivel]}>{NIVEL_TEXTO[r.nivel]}</span>
                            </td>
                            <td><span className="vt-mono">{mf.teclas.map(fmt).join(' + ')}</span> <span className="vt-xs vt-muted">{mf.regla}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="vt-muted vt-small">No se detectó el tono del canto. Escribe el tono en el editor para calcular la Style Key.</p>
              )}
              <p className="vt-xs vt-muted" style={{ marginBottom: 0 }}>{SMART_CHORD_USO}</p>
            </section>
          </div>
        )}

        {/* ── Guitarra ── */}
        {tab === 'guitarra' && (
          <div className="vt-stack">
            <section className="vt-card">
              <h3 className="vt-card-title">Capo</h3>
              <div className="vt-row">
                {[...new Set([0, ...capos.map(c => c.capo)])].map(c => (
                  <button key={c} type="button" className="vt-step-pill" aria-current={c === capo ? 'step' : undefined} onClick={() => { strumPlayer.stop(); setNow(null); set({ capo: c }); }}>
                    {c === 0 ? 'Sin capo' : `Capo ${c}`}{capos[0]?.capo === c ? ' ★' : ''}
                  </button>
                ))}
              </div>
              <p className="vt-small vt-muted" style={{ margin: '0.5rem 0 0' }}>
                {capo === 0 ? 'Formas: ' : `Con capo en el traste ${capo} tocas las formas: `}
                <strong>{shapes.map(fmt).join('  ')}</strong>. La estrella marca las formas más fáciles (acordes abiertos y menos cejillas).
              </p>
            </section>

            <section className="vt-card">
              <div className="vt-row-between" style={{ marginBottom: '0.6rem' }}>
                <h3 className="vt-card-title" style={{ margin: 0 }}>Rasgueo</h3>
                <div className="vt-row">
                  <select className="vt-select" value={rasgueo.id} onChange={e => { strumPlayer.stop(); setNow(null); set({ rasgueo: e.target.value }); }}>
                    {RASGUEOS.map(r => <option key={r.id} value={r.id}>{r.nombre} ({r.compas})</option>)}
                  </select>
                  <button type="button" className="vt-btn vt-btn-sm vt-btn-primary" onClick={() => togglePattern(rasgueo)}>
                    {now ? <><Square size={14} /> Detener</> : <><Play size={14} /> Escuchar a {bpm} BPM</>}
                  </button>
                </div>
              </div>
              {rasgueo.compas !== compas && <p className="vt-notice vt-notice-warn vt-small">Este rasgueo es de {rasgueo.compas} y el canto está en {compas}.</p>}
              <PatternGrid pattern={rasgueo} activeStep={now?.step ?? null} />
              {now && <p className="vt-small" style={{ margin: '0.5rem 0 0' }}>Acorde: <strong>{fmt(shapeSequence[now.bar] ?? '')}</strong></p>}
              <p className="vt-xs vt-muted" style={{ marginBottom: 0 }}>{rasgueo.uso}. {Object.entries(LEYENDA_GUITARRA).filter(([k]) => rasgueo.pasos.includes(k) && k !== '-').map(([k, v]) => `${ARROW[k]} = ${v.toLowerCase()}`).join(' · ')}.</p>
            </section>

            <section className="vt-card">
              <div className="vt-row-between" style={{ marginBottom: '0.6rem' }}>
                <h3 className="vt-card-title" style={{ margin: 0 }}>Arpegio y tablatura</h3>
                {arpegiosCompas.length > 0 && (
                  <div className="vt-row">
                    <select className="vt-select" value={arpegio?.id} onChange={e => setArpegioId(e.target.value)}>
                      {arpegiosCompas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                    </select>
                    {arpegio && (
                      <button type="button" className="vt-btn vt-btn-sm" onClick={() => togglePattern(arpegio)}>
                        {now ? <><Square size={14} /> Detener</> : <><Play size={14} /> Escuchar</>}
                      </button>
                    )}
                  </div>
                )}
              </div>
              {arpegio && tabResult ? (
                <>
                  <PatternGrid pattern={arpegio} activeStep={null} />
                  <pre className="vt-tab" style={{ marginTop: '0.6rem' }}>{tabResult.lines.join('\n')}</pre>
                  <p className="vt-xs vt-muted" style={{ marginBottom: 0 }}>
                    Primeros acordes del canto, un compás cada uno. p = pulgar en el bajo, i/m/a = índice, medio y anular en las cuerdas 3, 2 y 1.
                    {tabResult.faltantes.length > 0 && ` Sin digitación en la base de acordes: ${tabResult.faltantes.map(fmt).join(', ')}.`}
                  </p>
                </>
              ) : (
                <p className="vt-small vt-muted">No hay arpegio cargado para {compas}.</p>
              )}
            </section>

            <section className="vt-card">
              <h3 className="vt-card-title">Acordes {capo ? `(formas con capo ${capo})` : ''}</h3>
              <div className="vt-row" style={{ justifyContent: 'center' }}>
                {shapes.map(c => (
                  <div key={c} className="vt-center">
                    <ChordDiagram chordName={c} notation={notation} instrument="guitar" width={80} />
                    <div className="vt-xs" style={{ fontWeight: 700 }}>{fmt(c)}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ── Piano ── */}
        {tab === 'piano' && (
          <div className="vt-stack">
            <section className="vt-card">
              <h3 className="vt-card-title">Patrón para {perfil.nombre.toLowerCase()} ({compas})</h3>
              <ul className="vt-list vt-small">
                <li><strong>Mano izquierda:</strong> {perfil.piano.izquierda}</li>
                <li><strong>Mano derecha:</strong> {perfil.piano.derecha}</li>
              </ul>
            </section>
            <section className="vt-card">
              <h3 className="vt-card-title">Notas de cada acorde</h3>
              <div className="vt-table-wrap">
                <table className="vt-table">
                  <thead><tr><th>Acorde</th><th>Notas</th><th>Bajo (mano izquierda)</th></tr></thead>
                  <tbody>
                    {chords.map(c => {
                      const tones = chordTones(c);
                      const bass = c.includes('/') ? c.split('/')[1] : tones[0];
                      return (
                        <tr key={c}>
                          <td><strong className="vt-mono">{fmt(c)}</strong></td>
                          <td className="vt-mono">{tones.map(fmt).join(' – ')}</td>
                          <td className="vt-mono">{bass ? fmt(bass) : ''}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
            <section className="vt-card">
              <div className="vt-row" style={{ justifyContent: 'center' }}>
                {chords.map(c => (
                  <div key={c} className="vt-center">
                    <ChordDiagram chordName={c} notation={notation} instrument="piano" width={110} />
                    <div className="vt-xs" style={{ fontWeight: 700 }}>{fmt(c)}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ── Partitura ── */}
        {tab === 'partitura' && (
          <div className="vt-stack">
            <section className="vt-card">
              <h3 className="vt-card-title">Melodía en notación ABC</h3>
              <p className="vt-small vt-muted" style={{ marginTop: 0 }}>
                Escribe la melodía como texto y la app dibuja la partitura con su tablatura de guitarra. El esqueleto trae el encabezado y un compás de
                silencio por acorde: reemplaza cada <span className="vt-kbd">z</span> por las notas.
              </p>
              <div className="vt-row" style={{ marginBottom: '0.5rem' }}>
                <button type="button" className="vt-btn vt-btn-sm" onClick={() => set({ abc: abcSkeleton(title, key?.name ?? 'C', compas, bpm, sequence) })}>
                  {abc ? 'Reemplazar por esqueleto' : 'Crear esqueleto con los acordes'}
                </button>
              </div>
              <textarea className="vt-textarea" rows={8} value={abc} onChange={e => set({ abc: e.target.value })} placeholder={'X:1\nT:Título\nM:4/4\nL:1/8\nK:D\n"D"A2 FA d2 cB | "A"A4 z4 |'} spellCheck={false} />
              <details className="vt-xs vt-muted" style={{ marginTop: '0.5rem' }}>
                <summary style={{ cursor: 'pointer' }}>Guía rápida de ABC</summary>
                <ul className="vt-ul" style={{ lineHeight: 1.7, paddingLeft: '1.1rem' }}>
                  <li><span className="vt-kbd">C D E F G A B</span> octava central, <span className="vt-kbd">c d e</span> la octava de arriba, <span className="vt-kbd">C, D,</span> la de abajo.</li>
                  <li>Duración con L:1/8: <span className="vt-kbd">A</span> corchea, <span className="vt-kbd">A2</span> negra, <span className="vt-kbd">A4</span> blanca, <span className="vt-kbd">A3</span> negra con puntillo, <span className="vt-kbd">A/</span> semicorchea.</li>
                  <li><span className="vt-kbd">^F</span> sostenido, <span className="vt-kbd">_B</span> bemol, <span className="vt-kbd">z</span> silencio, <span className="vt-kbd">|</span> barra de compás, <span className="vt-kbd">"G"</span> acorde encima.</li>
                </ul>
              </details>
            </section>
            {abc.trim() ? (
              <section className="vt-card">
                <AbcScore abc={abc} showGuitarTab capo={capo} />
                <p className="vt-xs vt-muted" style={{ marginBottom: 0 }}>Guarda con "Guardar para este canto" para conservar la melodía.</p>
              </section>
            ) : (
              <p className="vt-small vt-muted">Las partituras escaneadas (PDF o imagen) siguen en Codex Notarum. Aquí se escriben melodías nuevas.</p>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

function PatternGrid({ pattern, activeStep }: { pattern: Patron; activeStep: number | null }) {
  const counts = strumCounts(pattern);
  return (
    <div className="vt-strum" role="img" aria-label={`Patrón ${pattern.nombre}: ${pattern.pasos.join(' ')}`}>
      {pattern.pasos.map((s, i) => (
        <div key={i} className={`vt-strum-step${i % pattern.subdivision === 0 ? ' is-beat' : ''}${activeStep === i ? ' is-now' : ''}`}>
          <span className="vt-strum-arrow">{ARROW[s] ?? s}</span>
          <span className="vt-strum-count">{counts[i]}</span>
        </div>
      ))}
    </div>
  );
}

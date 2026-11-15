import { useEffect, useRef, useState } from 'react';
import { Play, Square } from 'lucide-react';
import type { MidiBuffer, TuneObject } from 'abcjs';
import '../../styles/liturgia.css';

type AbcModule = typeof import('abcjs');

let abcPromise: Promise<AbcModule> | null = null;
function loadAbc(): Promise<AbcModule> {
  // abcjs se carga solo cuando se abre una partitura
  abcPromise ??= import('abcjs').then(m => ((m as unknown as { default?: AbcModule }).default ?? m));
  return abcPromise;
}

interface AbcScoreProps {
  abc: string;
  showGuitarTab: boolean;
  capo?: number;
}

export function AbcScore({ abc, showGuitarTab, capo = 0 }: AbcScoreProps) {
  const target = useRef<HTMLDivElement>(null);
  const tuneRef = useRef<TuneObject | null>(null);
  const synthRef = useRef<MidiBuffer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadAbc()
      .then(abcjs => {
        if (cancelled || !target.current) return;
        const tunes = abcjs.renderAbc(target.current, abc, {
          responsive: 'resize',
          add_classes: true,
          paddingtop: 8,
          paddingbottom: 8,
          tablature: showGuitarTab ? [{ instrument: 'guitar', label: capo ? `Guitarra (capo ${capo})` : 'Guitarra', capo }] : undefined,
        });
        tuneRef.current = tunes[0] ?? null;
        const warnings = tunes[0]?.warnings ?? [];
        setError(warnings.length ? `Revisa la notación: ${warnings[0].replace(/<[^>]+>/g, '')}` : null);
      })
      .catch(() => { if (!cancelled) setError('No se pudo cargar el visor de partituras.'); });
    return () => {
      cancelled = true;
      synthRef.current?.stop();
    };
  }, [abc, showGuitarTab, capo]);

  const togglePlay = async () => {
    if (playing) {
      synthRef.current?.stop();
      setPlaying(false);
      return;
    }
    const abcjs = await loadAbc();
    if (!tuneRef.current || !abcjs.synth.supportsAudio()) {
      setError('Este navegador no puede reproducir audio.');
      return;
    }
    try {
      const synth = new abcjs.synth.CreateSynth();
      await synth.init({ visualObj: tuneRef.current });
      await synth.prime();
      synthRef.current = synth;
      synth.start();
      setPlaying(true);
    } catch {
      setError('No se pudo reproducir. La reproducción descarga los sonidos de internet la primera vez.');
    }
  };

  return (
    <div className="vt-stack">
      <div className="vt-row">
        <button type="button" className="vt-btn vt-btn-sm" onClick={togglePlay}>
          {playing ? <><Square size={14} /> Detener</> : <><Play size={14} /> Escuchar melodía</>}
        </button>
        {error && <span className="vt-chip vt-chip-warn">{error}</span>}
      </div>
      <div ref={target} className="vt-abc" />
    </div>
  );
}

// Reproduce un patrón de rasgueo o arpegio sobre una progresión de acordes (un compás por acorde).
// Sonido sintético sencillo, pensado para escuchar el ritmo, no para reemplazar la guitarra.

import { guitarMidi, type Patron } from './accompaniment';

type StepCallback = (bar: number, step: number) => void;

const PICK_STRING: Record<string, number> = { i: 3, m: 4, a: 5 };

export class StrumPlayer {
  private ctx: AudioContext | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private running = false;

  private context(): AudioContext {
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private tone(midi: number, at: number, length: number, gainValue: number) {
    const ctx = this.context();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440 * Math.pow(2, (midi - 69) / 12), at);
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(gainValue, at + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, at + length);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(at);
    osc.stop(at + length + 0.05);
  }

  private mute(at: number) {
    const ctx = this.context();
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.03), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    gain.gain.value = 0.25;
    src.buffer = buffer;
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start(at);
  }

  private playStep(step: string, midi: number[], at: number, stepSeconds: number) {
    const sounding = midi.map((m, i) => ({ m, i })).filter(x => x.m > 0);
    if (sounding.length === 0) return;
    const bass = sounding[0];
    const length = Math.max(0.35, stepSeconds * 1.8);
    if (step === 'D') sounding.forEach((x, k) => this.tone(x.m, at + k * 0.012, length, 0.11));
    else if (step === 'U') sounding.filter(x => x.i >= 2).reverse().forEach((x, k) => this.tone(x.m, at + k * 0.012, length * 0.8, 0.08));
    else if (step === 'B' || step === 'p') this.tone(bass.m, at, length * 1.2, 0.16);
    else if (step === 'p2') this.tone((sounding[1] ?? bass).m, at, length * 1.2, 0.14);
    else if (step === 'X') this.mute(at);
    else if (PICK_STRING[step] !== undefined) {
      const target = sounding.find(x => x.i === PICK_STRING[step]) ?? sounding[sounding.length - 1];
      this.tone(target.m, at, length * 1.4, 0.13);
    }
  }

  start(chords: string[], pattern: Patron, bpm: number, onStep?: StepCallback) {
    this.stop();
    if (chords.length === 0) return;
    this.running = true;
    const ctx = this.context();
    const stepSeconds = 60 / bpm / pattern.subdivision;
    const midis = chords.map(guitarMidi);
    let bar = 0;
    let step = 0;
    let next = ctx.currentTime + 0.1;

    const tick = () => {
      if (!this.running) return;
      // Programa con antelación lo que cabe en la próxima ventana de 120 ms
      while (next < ctx.currentTime + 0.12) {
        this.playStep(pattern.pasos[step], midis[bar], next, stepSeconds);
        const b = bar;
        const s = step;
        const delay = Math.max(0, (next - ctx.currentTime) * 1000);
        setTimeout(() => this.running && onStep?.(b, s), delay);
        next += stepSeconds;
        step++;
        if (step >= pattern.pasos.length) {
          step = 0;
          bar = (bar + 1) % chords.length;
        }
      }
      this.timer = setTimeout(tick, 25);
    };
    tick();
  }

  stop() {
    this.running = false;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }
}

export const strumPlayer = new StrumPlayer();

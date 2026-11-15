export class AudioEngine {
  private ctx: AudioContext | null = null;
  private isRunning = false;
  private bpm = 80;
  private beatType: 'none' | 'balada' | 'vals' | 'pop' = 'none';
  private timerId: ReturnType<typeof setInterval> | null = null;
  private nextNoteTime = 0.0;
  private beatIndex = 0;
  private onBeatCallback: (step: number, count: number, playState?: string) => void = () => {};

  public playState: 'silent' | 'intro' | 'body' | 'outro' | 'final_hit' = 'silent';
  public pendingOutro = false;
  public timeSignature: '4/4' | '3/4' | '6/8' | '2/4' = '4/4';

  constructor() {}

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getIsRunning() {
    return this.isRunning;
  }

  public getBpm() {
    return this.bpm;
  }

  public getBeatType() {
    return this.beatType;
  }

  public start(
    beatType: 'none' | 'balada' | 'vals' | 'pop',
    bpm: number,
    onBeat: (step: number, count: number, playState?: string) => void
  ) {
    this.init();
    this.beatType = beatType;
    this.bpm = bpm;
    this.onBeatCallback = onBeat;

    if (this.isRunning) {
      this.playState = 'body';
      this.beatIndex = 0;
      return;
    }
    this.isRunning = true;
    this.playState = 'body';
    this.pendingOutro = false;
    this.nextNoteTime = this.ctx!.currentTime + 0.05;
    this.beatIndex = 0;

    // Run scheduler loop every 25ms
    this.timerId = setInterval(() => this.scheduler(), 25);
  }

  public startMetronome(
    beatType: 'none' | 'balada' | 'vals' | 'pop',
    bpm: number,
    onBeat: (step: number, count: number, playState?: string) => void
  ) {
    this.init();
    this.beatType = beatType;
    this.bpm = bpm;
    this.onBeatCallback = onBeat;

    if (this.isRunning) return;
    this.isRunning = true;
    this.playState = 'silent';
    this.pendingOutro = false;
    this.nextNoteTime = this.ctx!.currentTime + 0.05;
    this.beatIndex = 0;

    // Run scheduler loop every 25ms
    this.timerId = setInterval(() => this.scheduler(), 25);
  }

  public startBeat() {
    this.init();
    this.playState = 'intro';
    this.beatIndex = 0;
    this.pendingOutro = false;
  }

  public triggerOutro() {
    if (this.playState === 'body') {
      this.pendingOutro = true;
    }
  }

  public stopBeat() {
    this.playState = 'silent';
    this.pendingOutro = false;
  }

  public stop() {
    this.isRunning = false;
    this.playState = 'silent';
    this.pendingOutro = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  public setBpm(bpm: number) {
    this.bpm = bpm;
  }

  public setBeatType(beatType: 'none' | 'balada' | 'vals' | 'pop') {
    this.beatType = beatType;
  }

  public setTimeSignature(sig: '4/4' | '3/4' | '6/8' | '2/4') {
    this.timeSignature = sig;
  }

  private scheduler() {
    if (!this.ctx) return;
    // 100ms lookahead
    while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
      this.schedulePlay(this.beatIndex, this.nextNoteTime);
      this.advanceNote();
    }
  }

  private advanceNote() {
    const secondsPerBeat = 60.0 / this.bpm;
    // eighth note steps
    const stepDuration = secondsPerBeat / 2;
    this.nextNoteTime += stepDuration;

    let stepsInMeasure = 8;
    if (this.timeSignature === '3/4') stepsInMeasure = 6;
    else if (this.timeSignature === '2/4') stepsInMeasure = 4;
    else if (this.timeSignature === '6/8') stepsInMeasure = 6;

    const nextBeatIndex = (this.beatIndex + 1) % stepsInMeasure;

    if (nextBeatIndex === 0) {
      // Transition state machine at the end of the measure
      if (this.playState === 'intro') {
        this.playState = 'body';
      } else if (this.playState === 'outro') {
        this.playState = 'final_hit';
      } else if (this.playState === 'final_hit') {
        this.playState = 'silent';
      } else if (this.pendingOutro) {
        this.playState = 'outro';
        this.pendingOutro = false;
      }
    }
    this.beatIndex = nextBeatIndex;
  }

  private schedulePlay(step: number, time: number) {
    if (!this.ctx) return;

    const delay = (time - this.ctx.currentTime) * 1000;
    
    let count = 4;
    let isFirstOfQuarter = step % 2 === 0;
    let currentQuarter = Math.floor(step / 2) + 1;

    if (this.timeSignature === '3/4') {
      count = 3;
      isFirstOfQuarter = step % 2 === 0;
      currentQuarter = Math.floor(step / 2) + 1;
    } else if (this.timeSignature === '2/4') {
      count = 2;
      isFirstOfQuarter = step % 2 === 0;
      currentQuarter = Math.floor(step / 2) + 1;
    } else if (this.timeSignature === '6/8') {
      count = 6;
      isFirstOfQuarter = true; // Every step is a beat in 6/8
      currentQuarter = step + 1;
    }

    if (isFirstOfQuarter) {
      setTimeout(() => {
        if (this.isRunning) {
          this.onBeatCallback(currentQuarter, count, this.playState);
        }
      }, Math.max(0, delay));
    }

    if (this.playState === 'silent' || this.beatType === 'none') return;

    // Handle final hit crash ending
    if (this.playState === 'final_hit') {
      if (step === 0) {
        this.playKick(time, 0.9);
        this.playSnare(time, 0.4);
        this.playHihat(time, 0.3); // Crash cymbal
      }
      return;
    }

    // Handle drummer outro fill
    if (this.playState === 'outro') {
      if (this.timeSignature === '4/4') {
        if (step === 0) { this.playKick(time, 0.7); this.playHihat(time, 0.1); }
        if (step === 1) this.playSnare(time, 0.15);
        if (step === 2) this.playSnare(time, 0.18);
        if (step === 3) this.playSnare(time, 0.22);
        if (step === 4) { this.playKick(time, 0.8); this.playSnare(time, 0.25); }
        if (step === 5) this.playSnare(time, 0.28);
        if (step === 6) this.playSnare(time, 0.35);
        if (step === 7) { this.playSnare(time, 0.4); this.playHihat(time, 0.15); }
      } else if (this.timeSignature === '3/4' || this.timeSignature === '6/8') {
        if (step === 0) { this.playKick(time, 0.7); this.playHihat(time, 0.1); }
        if (step === 1) this.playSnare(time, 0.15);
        if (step === 2) this.playSnare(time, 0.22);
        if (step === 3) { this.playKick(time, 0.8); this.playSnare(time, 0.28); }
        if (step === 4) this.playSnare(time, 0.35);
        if (step === 5) { this.playSnare(time, 0.4); this.playHihat(time, 0.15); }
      } else if (this.timeSignature === '2/4') {
        if (step === 0) { this.playKick(time, 0.7); this.playHihat(time, 0.1); }
        if (step === 1) this.playSnare(time, 0.2);
        if (step === 2) this.playSnare(time, 0.3);
        if (step === 3) { this.playSnare(time, 0.4); this.playHihat(time, 0.15); }
      }
      return;
    }

    // Custom 6/8 rhythm pattern
    if (this.timeSignature === '6/8') {
      if (this.playState === 'intro') {
        // Count-in for 6/8
        this.playHihat(time, 0.15);
        if (step === 0) this.playKick(time, 0.7);
        if (step === 3) this.playSnare(time, 0.25);
      } else if (this.playState === 'body') {
        // Huapango/Folk 6/8 pattern
        if (step === 0) {
          this.playKick(time, 0.85);
          this.playHihat(time, 0.15);
        } else if (step === 1) {
          this.playHihat(time, 0.10);
        } else if (step === 2) {
          this.playSnare(time, 0.3);
          this.playHihat(time, 0.12);
        } else if (step === 3) {
          this.playKick(time, 0.7);
          this.playHihat(time, 0.15);
        } else if (step === 4) {
          this.playHihat(time, 0.10);
        } else if (step === 5) {
          this.playSnare(time, 0.35);
          this.playHihat(time, 0.12);
        }
      }
      return;
    }

    // Standard patterns for 4/4 and 3/4
    if (this.beatType === 'balada') {
      if (this.playState === 'intro') {
        if (step === 0) this.playHihat(time, 0.15);
        if (step === 2) this.playHihat(time, 0.15);
        if (step === 4) { this.playHihat(time, 0.15); this.playKick(time); }
        if (step === 6) { this.playHihat(time, 0.15); this.playSnare(time); }
        if (step === 7) this.playSnare(time);
      } else if (this.playState === 'body') {
        if (step === 0 || step === 4) this.playKick(time);
        if (step === 2 || step === 6) this.playSnare(time);
        this.playHihat(time, 0.08);
      }
    } else if (this.beatType === 'vals') {
      if (this.playState === 'intro') {
        if (step === 0) this.playHihat(time, 0.15);
        if (step === 2) this.playHihat(time, 0.15);
        if (step === 4) { this.playHihat(time, 0.15); this.playSnare(time); }
      } else if (this.playState === 'body') {
        if (step === 0) this.playKick(time);
        if (step === 2 || step === 4) this.playSnare(time);
        if (step === 0 || step === 2 || step === 4) this.playHihat(time, 0.12);
      }
    } else if (this.beatType === 'pop') {
      if (this.playState === 'intro') {
        if (step === 0) this.playHihat(time, 0.15);
        if (step === 2) this.playHihat(time, 0.15);
        if (step === 4) { this.playHihat(time, 0.15); this.playKick(time); }
        if (step === 6) { this.playHihat(time, 0.15); this.playSnare(time); }
        if (step === 7) this.playSnare(time);
      } else if (this.playState === 'body') {
        if (step === 0 || step === 3 || step === 4) this.playKick(time);
        if (step === 2 || step === 6) this.playSnare(time);
        this.playHihat(time, 0.15);
      }
    }
  }

  private playKick(time: number, volume = 0.8) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.frequency.setValueAtTime(110, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.1);

    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.11);

    osc.start(time);
    osc.stop(time + 0.13);
  }

  private playSnare(time: number, volume = 0.35) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000;

    const gain = this.ctx.createGain();

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);

    noise.start(time);
    noise.stop(time + 0.11);
  }

  private playHihat(time: number, volume = 0.15) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.025;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7500;

    const gain = this.ctx.createGain();

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);

    noise.start(time);
    noise.stop(time + 0.025);
  }

  public playChord(midiNotes: number[], type: 'pluck' | 'pad') {
    this.init();
    if (!this.ctx || midiNotes.length === 0) return;

    const now = this.ctx.currentTime;

    midiNotes.forEach((midi, idx) => {
      if (midi <= 0) return;
      const freq = 440 * Math.pow(2, (midi - 69) / 12);

      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      if (type === 'pluck') {
        const pluckTime = now + idx * 0.03;
        gain.gain.setValueAtTime(0, now);
        gain.gain.setValueAtTime(0.3, pluckTime);
        gain.gain.exponentialRampToValueAtTime(0.001, pluckTime + 1.0);

        osc.start(pluckTime);
        osc.stop(pluckTime + 1.1);
      } else {
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

        osc.start(now);
        osc.stop(now + 1.9);
      }
    });
  }
}

export const globalAudio = new AudioEngine();

import { useState, useEffect, useRef } from 'react';
import { YIN } from 'pitchfinder';

export interface TunerState {
  note: string;
  cents: number;
  frequency: number;
  isActive: boolean;
}

const NOTE_STRINGS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function getNoteFromFrequency(frequency: number) {
  const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
  return Math.round(noteNum) + 69;
}

function getFrequencyFromNote(note: number) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

function getNoteString(note: number) {
  return NOTE_STRINGS[note % 12];
}

export function useTuner() {
  const [state, setState] = useState<TunerState>({
    note: '-',
    cents: 0,
    frequency: 0,
    isActive: false,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>(0);

  const startTuner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      
      const analyzer = audioCtx.createAnalyser();
      analyzer.fftSize = 2048;
      analyzerRef.current = analyzer;
      
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyzer);
      
      const detectPitch = YIN({ sampleRate: audioCtx.sampleRate });
      const buffer = new Float32Array(analyzer.fftSize);

      const tick = () => {
        analyzer.getFloatTimeDomainData(buffer);
        const pitch = detectPitch(buffer);

        if (pitch && pitch > 50 && pitch < 2000) { // filtrar ruidos extremos
          const noteObj = getNoteFromFrequency(pitch);
          const targetFreq = getFrequencyFromNote(noteObj);
          const cents = Math.floor(1200 * Math.log2(pitch / targetFreq));
          const noteStr = getNoteString(noteObj);
          
          setState({
            note: noteStr,
            cents: cents,
            frequency: pitch,
            isActive: true,
          });
        }
        
        animationRef.current = requestAnimationFrame(tick);
      };
      
      tick();
      setState(prev => ({ ...prev, isActive: true }));
    } catch (err) {
      console.error("Error al acceder al micrófono:", err);
      alert("No se pudo acceder al micrófono. Por favor revisa los permisos del navegador.");
    }
  };

  const stopTuner = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setState({ note: '-', cents: 0, frequency: 0, isActive: false });
  };

  useEffect(() => {
    return () => {
      stopTuner();
    };
  }, []);

  return { ...state, startTuner, stopTuner };
}

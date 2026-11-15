import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { shiftIso, todayIso } from '../utils/liturgicalCalendar';

export type DevotionKind = 'rosario' | 'sanjose';

export interface DevotionEntry {
  id: string;
  kind: DevotionKind;
  fecha: string;
  detalle: string;
  completo: boolean;
  minutos?: number;
  intencion?: string;
  creado: number;
}

const LOCAL_KEY = 'vt-devociones';

function readLocal(): DevotionEntry[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeLocal(entries: DevotionEntry[]) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(entries));
  } catch {
    // Almacenamiento bloqueado
  }
}

export function useDevotionLog() {
  const [user, setUser] = useState(auth.currentUser);
  const [cloud, setCloud] = useState<{ uid: string; entries: DevotionEntry[] } | null>(null);
  const [local, setLocal] = useState<DevotionEntry[]>(readLocal);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    if (!user) return;
    const col = collection(db, 'users', user.uid, 'devociones');
    // Lo rezado sin sesión se sube a la cuenta al iniciar sesión
    const pending = readLocal();
    if (pending.length) {
      Promise.all(pending.map(e => setDoc(doc(col, e.id), e)))
        .then(() => { writeLocal([]); setLocal([]); })
        .catch(err => console.error('[VOX TEMPLI] No se pudo subir el seguimiento local:', err));
    }
    return onSnapshot(col, snap => {
      setCloud({ uid: user.uid, entries: snap.docs.map(d => d.data() as DevotionEntry) });
    }, err => console.error('[VOX TEMPLI] No se pudo leer el seguimiento:', err));
  }, [user]);

  const cloudEntries = user && cloud?.uid === user.uid ? cloud.entries : [];
  const byId = new Map<string, DevotionEntry>();
  [...local, ...cloudEntries].forEach(e => byId.set(e.id, e));
  const entries = [...byId.values()].sort((a, b) => b.creado - a.creado);

  const add = async (entry: Omit<DevotionEntry, 'id' | 'creado'>) => {
    const full: DevotionEntry = JSON.parse(JSON.stringify({ ...entry, id: `d_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, creado: Date.now() }));
    if (user) {
      await setDoc(doc(db, 'users', user.uid, 'devociones', full.id), full);
    } else {
      const next = [full, ...readLocal()];
      writeLocal(next);
      setLocal(next);
    }
    return full;
  };

  const remove = async (id: string) => {
    const next = readLocal().filter(e => e.id !== id);
    writeLocal(next);
    setLocal(next);
    if (user) await deleteDoc(doc(db, 'users', user.uid, 'devociones', id));
  };

  return { entries, add, remove, isLoggedIn: !!user };
}

export interface DevotionStats {
  total: number;
  esteMes: number;
  racha: number;
  mejorRacha: number;
  dias: { iso: string; count: number }[];
  porDetalle: [string, number][];
  intenciones: DevotionEntry[];
}

export function devotionStats(all: DevotionEntry[], kind: DevotionKind, weeks = 5): DevotionStats {
  const entries = all.filter(e => e.kind === kind && e.completo);
  const today = todayIso();
  const perDay = new Map<string, number>();
  entries.forEach(e => perDay.set(e.fecha, (perDay.get(e.fecha) ?? 0) + 1));

  let racha = 0;
  let cursor = perDay.has(today) ? today : shiftIso(today, -1);
  while (perDay.has(cursor)) { racha++; cursor = shiftIso(cursor, -1); }

  let mejorRacha = 0;
  let actual = 0;
  let prev: string | null = null;
  for (const iso of [...perDay.keys()].sort()) {
    actual = prev && shiftIso(prev, 1) === iso ? actual + 1 : 1;
    mejorRacha = Math.max(mejorRacha, actual);
    prev = iso;
  }

  // Cuadrícula de semanas completas (domingo a sábado) que termina en la semana actual
  const [y, m, d] = today.split('-').map(Number);
  const weekday = new Date(y, m - 1, d).getDay();
  const start = shiftIso(today, -(weeks * 7 - 1) + (6 - weekday));
  const dias = Array.from({ length: weeks * 7 }, (_, i) => {
    const iso = shiftIso(start, i);
    return { iso, count: iso > today ? -1 : perDay.get(iso) ?? 0 };
  });

  const porDetalleMap = new Map<string, number>();
  entries.forEach(e => porDetalleMap.set(e.detalle, (porDetalleMap.get(e.detalle) ?? 0) + 1));

  return {
    total: entries.length,
    esteMes: entries.filter(e => e.fecha.slice(0, 7) === today.slice(0, 7)).length,
    racha,
    mejorRacha,
    dias,
    porDetalle: [...porDetalleMap.entries()].sort((a, b) => b[1] - a[1]),
    intenciones: entries.filter(e => e.intencion).slice(0, 8),
  };
}

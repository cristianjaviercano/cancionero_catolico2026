import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { parametrosFijos, type SongParams } from '../utils/accompaniment';

// Parámetros de acompañamiento por canto. Prioridad: los del usuario (nube o este
// dispositivo) y luego los fijos de src/data/acompanamiento/cantos_parametros.json.

const LOCAL_KEY = 'vt-song-params';

export interface SongParamsWithAbc extends SongParams {
  abc?: string;
}

function readLocal(): Record<string, SongParamsWithAbc> {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeLocal(songId: string, params: SongParamsWithAbc | null) {
  try {
    const all = readLocal();
    if (params) all[songId] = params;
    else delete all[songId];
    localStorage.setItem(LOCAL_KEY, JSON.stringify(all));
  } catch {
    // Almacenamiento bloqueado
  }
}

// Todos los parámetros guardados en este dispositivo, listos para pegar en cantos_parametros.json
export function exportLocalParams(): string {
  return JSON.stringify(readLocal(), null, 1);
}

export function useSongParams(songId: string | undefined) {
  const [user, setUser] = useState(auth.currentUser);
  const [cloud, setCloud] = useState<{ id: string; params: SongParamsWithAbc | null } | null>(null);
  const [localVersion, setLocalVersion] = useState(0);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    if (!user || !songId) return;
    const ref = doc(db, 'users', user.uid, 'songParams', songId);
    return onSnapshot(ref, snap => {
      setCloud({ id: songId, params: snap.exists() ? (snap.data() as SongParamsWithAbc) : null });
    }, err => console.error('[VOX TEMPLI] No se pudieron leer los parámetros del canto:', err));
  }, [user, songId]);

  const local = songId ? readLocal()[songId] : undefined;
  void localVersion;
  const cloudParams = cloud && cloud.id === songId ? cloud.params : null;
  const userParams = (user ? cloudParams : null) ?? local ?? null;
  const fixed = parametrosFijos(songId);
  const params: SongParamsWithAbc = { ...fixed, ...userParams };
  const source: 'usuario' | 'repertorio' | null = userParams ? 'usuario' : fixed ? 'repertorio' : null;

  const save = async (next: SongParamsWithAbc) => {
    if (!songId) return;
    const clean = JSON.parse(JSON.stringify(next)) as SongParamsWithAbc;
    writeLocal(songId, clean);
    setLocalVersion(v => v + 1);
    if (user) await setDoc(doc(db, 'users', user.uid, 'songParams', songId), clean);
  };

  const clear = async () => {
    if (!songId) return;
    writeLocal(songId, null);
    setLocalVersion(v => v + 1);
    if (user) await deleteDoc(doc(db, 'users', user.uid, 'songParams', songId));
  };

  return { params, source, save, clear, isLoggedIn: !!user };
}

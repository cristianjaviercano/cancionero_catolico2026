import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import type { Song } from './useSongs';

export interface LiveSessionData {
  code: string;
  hostId: string;
  hostName: string;
  hostUid: string | null;
  status: 'active' | 'ended';
  massTitle: string | null;
  playlist: Song[];
  currentIndex: number;
  currentSongId: string | null;
  transpose: number;
  bpm: number | null;
  compas: string | null;
  beatType: string | null;
  isScrolling: boolean;
  scrollSpeed: number | null;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  partNotes: Record<string, string> | null;
}

const HOST_ID_STORAGE_KEY = 'vt_live_host_id';
const ACTIVE_SESSION_STORAGE_KEY = 'vt_active_live_session';

export function getOrCreateHostId(): string {
  let hostId = localStorage.getItem(HOST_ID_STORAGE_KEY);
  if (!hostId || hostId.length < 12) {
    const randomPart = Array.from({ length: 20 }, () =>
      Math.floor(Math.random() * 36).toString(36)
    ).join('');
    hostId = `host_${Date.now()}_${randomPart}`;
    localStorage.setItem(HOST_ID_STORAGE_KEY, hostId);
  }
  return hostId;
}

export function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `VT${suffix}`;
}

function sanitizePlaylistForFirestore(playlist: Song[]): Song[] {
  return playlist.slice(0, 50).map((s) => ({
    id: String(s.id || 'custom_temp'),
    title: String(s.title || 'Canto'),
    type: String(s.type || 'Entrada'),
    content: String(s.content || ''),
    ...(s.partAssigned ? { partAssigned: String(s.partAssigned) } : {}),
    ...(s.author ? { author: String(s.author) } : {}),
    ...(s.key ? { key: String(s.key) } : {}),
    ...(typeof s.transpose === 'number' ? { transpose: Math.round(s.transpose) } : {})
  }));
}

export function useLiveSession() {
  const [sessionCode, setSessionCode] = useState<string | null>(() => {
    const saved = sessionStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
    return saved ? saved.toUpperCase() : null;
  });
  const [sessionData, setSessionData] = useState<LiveSessionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latestDataRef = useRef<LiveSessionData | null>(null);

  const myHostId = getOrCreateHostId();
  const isHost = !!(
    sessionData &&
    (sessionData.hostId === myHostId ||
      (auth.currentUser && sessionData.hostUid && sessionData.hostUid === auth.currentUser.uid))
  );

  // Listen to active session in real time via Firestore onSnapshot
  useEffect(() => {
    if (!sessionCode) {
      latestDataRef.current = null;
      sessionStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
      return;
    }

    const cleanCode = sessionCode.trim().toUpperCase();
    sessionStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, cleanCode);
    const sessionRef = doc(db, 'liveSessions', cleanCode);

    const unsubscribe = onSnapshot(
      sessionRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setError('La sesión en vivo no existe o ha finalizado.');
          setSessionData(null);
          latestDataRef.current = null;
          return;
        }
        const data = snapshot.data() as LiveSessionData;
        latestDataRef.current = data;
        setSessionData(data);
        setError(null);
      },
      (err) => {
        console.error('[Vox Templi Live] Error escuchando sesión:', err);
        setError('Error de conexión con la sesión en vivo.');
      }
    );

    return () => unsubscribe();
  }, [sessionCode]);

  // Create a new Live Session as Host/Director
  const startLiveSession = useCallback(
    async (params: {
      playlist: Song[];
      massTitle?: string;
      hostName?: string;
      currentIndex?: number;
      transpose?: number;
      bpm?: number;
      compas?: string;
      beatType?: string;
      partNotes?: Record<string, string>;
    }): Promise<string | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const code = generateSessionCode();
        const now = Date.now();
        const currentUser = auth.currentUser;
        const safePlaylist = sanitizePlaylistForFirestore(params.playlist);
        const idx = Math.max(0, Math.min(safePlaylist.length - 1, Math.round(params.currentIndex || 0)));
        const firstSong = safePlaylist[idx];

        const payload: LiveSessionData = {
          code,
          hostId: myHostId,
          hostName: (
            params.hostName?.trim() ||
            currentUser?.displayName ||
            'Director de Coro'
          ).slice(0, 80),
          hostUid: currentUser ? currentUser.uid : null,
          status: 'active',
          massTitle: params.massTitle ? params.massTitle.slice(0, 150) : 'Celebración en Vivo',
          playlist: safePlaylist,
          currentIndex: idx,
          currentSongId: firstSong ? String(firstSong.id).slice(0, 120) : null,
          transpose: Math.max(-12, Math.min(12, Math.round(params.transpose ?? firstSong?.transpose ?? 0))),
          bpm: params.bpm ? Math.max(20, Math.min(300, Math.round(params.bpm))) : 80,
          compas: params.compas ? String(params.compas).slice(0, 20) : '4/4',
          beatType: params.beatType ? String(params.beatType).slice(0, 40) : 'none',
          isScrolling: false,
          scrollSpeed: 1.0,
          createdAt: now,
          updatedAt: now,
          expiresAt: now + 6 * 3600 * 1000,
          partNotes: params.partNotes || null
        };

        await setDoc(doc(db, 'liveSessions', code), payload);
        latestDataRef.current = payload;
        setSessionData(payload);
        setSessionCode(code);
        return code;
      } catch (err) {
        console.error('[Vox Templi Live] No se pudo iniciar sesión en vivo:', err);
        setError('No se pudo crear la sesión en vivo. Verifica tu conexión.');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [myHostId]
  );

  // Join an existing session by code
  const joinLiveSession = useCallback(async (inputCode: string): Promise<LiveSessionData | null> => {
    const clean = inputCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (clean.length < 4 || clean.length > 10) {
      setError('El código debe tener entre 4 y 10 caracteres (ej. VT4829).');
      return null;
    }
    setIsLoading(true);
    setError(null);
    try {
      const snap = await getDoc(doc(db, 'liveSessions', clean));
      if (!snap.exists()) {
        setError(`No se encontró ninguna sesión activa con el código ${clean}.`);
        return null;
      }
      const data = snap.data() as LiveSessionData;
      if (data.status === 'ended') {
        setError(`La sesión ${clean} ya ha finalizado.`);
        return null;
      }
      latestDataRef.current = data;
      setSessionData(data);
      setSessionCode(clean);
      return data;
    } catch (err) {
      console.error('[Vox Templi Live] Error al unirse a la sesión:', err);
      setError('No se pudo conectar con la sesión. Revisa tu conexión a internet.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Host updates live session state (song index, transpose, bpm, scroll, playlist, etc.)
  const updateLiveState = useCallback(
    async (
      patch: Partial<{
        currentIndex: number;
        currentSongId: string | null;
        transpose: number;
        bpm: number;
        compas: string;
        beatType: string;
        isScrolling: boolean;
        scrollSpeed: number;
        playlist: Song[];
        massTitle: string;
        status: 'active' | 'ended';
        partNotes: Record<string, string> | null;
      }>
    ) => {
      const current = latestDataRef.current;
      if (!current || !sessionCode) return;
      // Only allow host to push updates
      const currentUser = auth.currentUser;
      const canEdit =
        current.hostId === myHostId ||
        (currentUser && current.hostUid && current.hostUid === currentUser.uid);
      if (!canEdit) return;

      const nextPlaylist = patch.playlist
        ? sanitizePlaylistForFirestore(patch.playlist)
        : current.playlist;
      const nextIndex =
        typeof patch.currentIndex === 'number'
          ? Math.max(0, Math.min(100, Math.round(patch.currentIndex)))
          : current.currentIndex;
      const activeSong = nextPlaylist[nextIndex];

      const updated: LiveSessionData = {
        code: current.code,
        hostId: current.hostId,
        hostName: current.hostName,
        hostUid: current.hostUid ?? null,
        status: patch.status ?? current.status,
        massTitle:
          patch.massTitle !== undefined
            ? patch.massTitle.slice(0, 150)
            : current.massTitle ?? null,
        playlist: nextPlaylist,
        currentIndex: nextIndex,
        currentSongId:
          patch.currentSongId !== undefined
            ? patch.currentSongId
            : activeSong
              ? String(activeSong.id).slice(0, 120)
              : current.currentSongId,
        transpose:
          typeof patch.transpose === 'number'
            ? Math.max(-12, Math.min(12, Math.round(patch.transpose)))
            : current.transpose,
        bpm:
          typeof patch.bpm === 'number'
            ? Math.max(20, Math.min(300, Math.round(patch.bpm)))
            : current.bpm,
        compas: patch.compas !== undefined ? String(patch.compas).slice(0, 20) : current.compas,
        beatType:
          patch.beatType !== undefined ? String(patch.beatType).slice(0, 40) : current.beatType,
        isScrolling:
          typeof patch.isScrolling === 'boolean' ? patch.isScrolling : current.isScrolling,
        scrollSpeed:
          typeof patch.scrollSpeed === 'number'
            ? Math.max(0, Math.min(20, Number(patch.scrollSpeed.toFixed(2))))
            : current.scrollSpeed,
        createdAt: current.createdAt,
        updatedAt: Date.now(),
        expiresAt: current.expiresAt,
        partNotes: patch.partNotes !== undefined ? patch.partNotes : current.partNotes ?? null
      };

      latestDataRef.current = updated;
      setSessionData(updated);
      try {
        await setDoc(doc(db, 'liveSessions', current.code), updated);
      } catch (err) {
        console.error('[Vox Templi Live] Error actualizando estado en vivo:', err);
      }
    },
    [sessionCode, myHostId]
  );

  const leaveOrEndSession = useCallback(
    async (endForAll = false) => {
      if (endForAll && isHost && latestDataRef.current) {
        await updateLiveState({ status: 'ended' });
      }
      sessionStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
      latestDataRef.current = null;
      setSessionData(null);
      setSessionCode(null);
      setError(null);
    },
    [isHost, updateLiveState]
  );

  return {
    sessionCode,
    sessionData,
    isHost,
    isLoading,
    error,
    setError,
    startLiveSession,
    joinLiveSession,
    updateLiveState,
    leaveOrEndSession
  };
}

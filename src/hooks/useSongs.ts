import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { notifyError } from '../utils/feedback';

export interface Song {
  id: string;
  title: string;
  type: string;
  content: string;
  partAssigned?: string;
  isPublic?: boolean;
  userId?: string;
  userDisplayName?: string;
  author?: string;
  key?: string;
  externalLink?: string;
  sheetMusic?: string;
  transpose?: number;
}

let loadedBaseSongs: Song[] | null = null;
let baseSongsPromise: Promise<Song[]> | null = null;

function loadBaseSongs(): Promise<Song[]> {
  baseSongsPromise ??= import('../data/songs.json').then(m => {
    loadedBaseSongs = m.default as Song[];
    return loadedBaseSongs;
  });
  return baseSongsPromise;
}

export function useSongs() {
  const [baseSongs, setBaseSongs] = useState<Song[]>(() => loadedBaseSongs ?? []);
  const [publicSongs, setPublicSongs] = useState<Song[]>([]);
  const [userSongs, setUserSongs] = useState<Song[]>([]);
  const [localSongs, setLocalSongs] = useState<Song[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribeAuth();
  }, []);

  // Repertorio base: archivo aparte que se descarga una sola vez y no depende de Firestore,
  // así el repertorio aparece aunque no haya señal
  useEffect(() => {
    if (loadedBaseSongs) return;
    let alive = true;
    loadBaseSongs().then(list => { if (alive) setBaseSongs(list); });
    return () => { alive = false; };
  }, []);

  // Escuchar canciones públicas globales
  useEffect(() => {
    const publicSongsCol = collection(db, 'publicSongs');
    const unsubscribePublic = onSnapshot(publicSongsCol, (snapshot) => {
      const pubSongs: Song[] = [];
      snapshot.forEach((doc) => {
        // El id del documento manda y solo se aceptan cantos creados en el editor (custom_...):
        // así una publicación no puede tapar un canto de la base
        if (!doc.id.startsWith('custom_')) return;
        pubSongs.push({ ...(doc.data() as Song), id: doc.id });
      });
      setPublicSongs(pubSongs);
    }, (error) => {
      console.error("Error al escuchar canciones públicas:", error);
      setPublicSongs([]);
    });

    return () => unsubscribePublic();
  }, []);

  // Escuchar canciones del usuario o locales
  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalSongs([]);
      const userSongsCol = collection(db, 'users', user.uid, 'customSongs');
      const unsubscribeUser = onSnapshot(userSongsCol, (snapshot) => {
        const uSongs: Song[] = [];
        snapshot.forEach((doc) => {
          uSongs.push(doc.data() as Song);
        });
        setUserSongs(uSongs);
      }, (error) => {
        console.error("Error al escuchar canciones de Firestore:", error);
      });
      return () => unsubscribeUser();
    } else {
      setUserSongs([]);
      const custom = localStorage.getItem('customSongs');
      const customSongs: Song[] = custom ? JSON.parse(custom) : [];
      setLocalSongs(customSongs);
    }
  }, [user]);

  // Combinar todas las listas de forma reactiva
  useEffect(() => {
    const mergedMap = new Map<string, Song>();
    
    // 1. Canciones base y públicas globales
    baseSongs.forEach(s => mergedMap.set(s.id, s));
    publicSongs.forEach(s => mergedMap.set(s.id, s));
    
    // 2. Canciones locales (si no está autenticado)
    if (!user) {
      localSongs.forEach(s => mergedMap.set(s.id, s));
    } else {
      // 3. Canciones privadas/personalizadas del usuario (si está autenticado)
      userSongs.forEach(s => mergedMap.set(s.id, s));
    }
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSongs(Array.from(mergedMap.values()));
  }, [baseSongs, publicSongs, userSongs, localSongs, user]);

  const saveSong = async (song: Song) => {
    if (user) {
      try {
        const songData = {
          ...song,
          userId: user.uid,
          userDisplayName: user.displayName || user.email || 'Usuario'
        };

        // Sanitize object for Firestore (removes undefined fields)
        const cleanSongData = JSON.parse(JSON.stringify(songData));

        // Guardar en la colección del usuario
        await setDoc(doc(db, 'users', user.uid, 'customSongs', song.id), cleanSongData);

        // Si es pública, guardar en colección global. Si no, borrarla de allí
        if (song.isPublic) {
          await setDoc(doc(db, 'publicSongs', song.id), cleanSongData);
        } else {
          try {
            await deleteDoc(doc(db, 'publicSongs', song.id));
          } catch (deleteError) {
            console.warn("No se pudo eliminar de publicSongs (tal vez no existía o no tienes permisos):", deleteError);
          }
        }
      } catch (error) {
        console.error("Error al guardar canción en Firestore:", error);
        notifyError("No se pudo guardar el canto en la nube. Inténtalo de nuevo.");
      }
    } else {
      const custom = localStorage.getItem('customSongs');
      const customSongs: Song[] = custom ? JSON.parse(custom) : [];
      
      const existingIdx = customSongs.findIndex(s => s.id === song.id);
      if (existingIdx >= 0) {
        customSongs[existingIdx] = song;
      } else {
        customSongs.push(song);
      }
      
      localStorage.setItem('customSongs', JSON.stringify(customSongs));
      setLocalSongs(customSongs);
    }
  };

  const deleteSong = async (id: string) => {
    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'customSongs', id));
        await deleteDoc(doc(db, 'publicSongs', id));
      } catch (error) {
        console.error("Error al eliminar canción en Firestore:", error);
        notifyError("No se pudo eliminar el canto de la nube. Inténtalo de nuevo.");
      }
    } else {
      const custom = localStorage.getItem('customSongs');
      const customSongs: Song[] = custom ? JSON.parse(custom) : [];
      
      const filtered = customSongs.filter(s => s.id !== id);
      localStorage.setItem('customSongs', JSON.stringify(filtered));
      setLocalSongs(filtered);
    }
  };

  return { songs, saveSong, deleteSong };
}


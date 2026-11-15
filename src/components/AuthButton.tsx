import React, { useState, useEffect, useRef } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth';
import { notifyError } from '../utils/feedback';
import { LogIn, LogOut, User as UserIcon, Loader2 } from 'lucide-react';
import { auth, googleProvider } from '../firebase';

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error al iniciar sesión con Google:', error);
      notifyError('No se pudo iniciar sesión con Google. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    setLoading(true);
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-2 text-stone-400">
        <Loader2 className="animate-spin" size={20} />
      </div>
    );
  }

  if (!user) {
    return (
      <button
        onClick={handleLogin}
        className="flex items-center gap-2 bg-white hover:bg-stone-50 text-stone-700 hover:text-red-500 font-bold px-3 py-1.5 rounded-lg border border-stone-200 hover:border-red-200 transition-all text-sm shadow-sm cursor-pointer"
        title="Iniciar Sesión con Google para sincronizar tus cantos y misas"
      >
        <LogIn size={16} className="text-red-500" />
        <span className="hidden sm:inline">Iniciar Sesión</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 p-1 rounded-full border border-stone-200 hover:border-red-300 focus:outline-none transition-all shadow-sm bg-white overflow-hidden cursor-pointer"
        aria-label="Menú de usuario"
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'Usuario'}
            className="w-8 h-8 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
            <UserIcon size={18} />
          </div>
        )}
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl z-50 border border-stone-100 overflow-hidden transform origin-top-right transition-all animate-in fade-in zoom-in-95 duration-200 print:hidden">
          <div className="px-4 py-3 border-b border-stone-50 bg-stone-50/50 flex flex-col gap-0.5">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Sesión Activa</p>
            <p className="font-semibold text-stone-800 text-sm truncate">{user.displayName}</p>
            <p className="text-xs text-stone-500 truncate">{user.email}</p>
          </div>

          <div className="p-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-stone-600 hover:text-red-600 hover:bg-red-50 rounded-lg text-left text-sm font-medium transition-colors cursor-pointer"
            >
              <LogOut size={16} className="text-red-400 group-hover:text-red-600" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

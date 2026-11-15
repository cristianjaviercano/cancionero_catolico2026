import React, { useState } from 'react';
import { Radio, Users, QrCode, Copy, Check, X, Play, LogOut, Sparkles, Music } from 'lucide-react';
import type { LiveSessionData } from '../hooks/useLiveSession';
import type { Song } from '../hooks/useSongs';

interface LiveSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionCode: string | null;
  sessionData: LiveSessionData | null;
  isHost: boolean;
  isLoading: boolean;
  error: string | null;
  defaultPlaylist?: Song[];
  defaultMassTitle?: string;
  onStartSession: (params: {
    playlist: Song[];
    massTitle?: string;
    hostName?: string;
  }) => Promise<string | null>;
  onJoinSession: (code: string) => Promise<LiveSessionData | null>;
  onLeaveOrEnd: (endForAll?: boolean) => Promise<void>;
  onGoToPlayMode: (playlist: Song[]) => void;
}

export function LiveSessionModal({
  isOpen,
  onClose,
  sessionCode,
  sessionData,
  isHost,
  isLoading,
  error,
  defaultPlaylist = [],
  defaultMassTitle = 'Celebración Eucarística',
  onStartSession,
  onJoinSession,
  onLeaveOrEnd,
  onGoToPlayMode
}: LiveSessionModalProps) {
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [hostNameInput, setHostNameInput] = useState(() => localStorage.getItem('vt_director_name') || '');
  const [massTitleInput, setMassTitleInput] = useState(defaultMassTitle);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [activeTab, setActiveTab] = useState<'join' | 'host'>(
    defaultPlaylist.length > 0 ? 'host' : 'join'
  );

  if (!isOpen) return null;

  const shareUrl = sessionCode
    ? `${window.location.origin}/play?live=${encodeURIComponent(sessionCode)}`
    : '';

  const handleCopyCode = () => {
    if (!sessionCode) return;
    navigator.clipboard.writeText(sessionCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyUrl = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    const data = await onJoinSession(joinCodeInput);
    if (data && data.playlist && data.playlist.length > 0) {
      onGoToPlayMode(data.playlist);
      onClose();
    }
  };

  const handleHostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (defaultPlaylist.length === 0) return;
    if (hostNameInput.trim()) {
      localStorage.setItem('vt_director_name', hostNameInput.trim());
    }
    const createdCode = await onStartSession({
      playlist: defaultPlaylist,
      massTitle: massTitleInput.trim() || defaultMassTitle,
      hostName: hostNameInput.trim() || undefined
    });
    if (createdCode) {
      onGoToPlayMode(defaultPlaylist);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-md w-full overflow-hidden text-stone-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-stone-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <Radio size={20} className={sessionCode ? 'animate-pulse text-red-400' : ''} />
            </div>
            <div>
              <h2 className="font-bold text-base m-0 leading-tight text-white">
                 Ensamble Litúrgico en Vivo
              </h2>
              <p className="text-[11px] text-stone-400 m-0">
                Sincronización en tiempo real para el ministerio de música
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer bg-transparent border-none"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {sessionCode && sessionData ? (
            <div className="flex flex-col gap-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full mb-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    {isHost ? 'Transmitiendo (Director)' : 'Conectado al Director'}
                  </span>
                  <h3 className="font-bold text-stone-900 text-sm m-0">
                    {sessionData.massTitle || 'Celebración en Vivo'}
                  </h3>
                  <p className="text-xs text-stone-600 m-0 mt-0.5">
                    Dirige: <strong>{sessionData.hostName}</strong> • {sessionData.playlist.length} cantos
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-stone-400">Código</div>
                  <div className="font-mono font-black text-xl text-red-600 tracking-wider">
                    {sessionCode}
                  </div>
                </div>
              </div>

              {/* QR & Share Link */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex flex-col items-center text-center gap-3">
                <div className="bg-white p-2.5 rounded-xl border border-stone-200 shadow-sm">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shareUrl)}`}
                    alt={`QR Sesión ${sessionCode}`}
                    width={130}
                    height={130}
                    className="rounded"
                  />
                </div>
                <p className="text-xs text-stone-500 m-0 max-w-xs">
                  Los demás músicos pueden escanear este QR o ingresar el código{' '}
                  <strong className="text-stone-800 font-mono">{sessionCode}</strong> para que sus pantallas cambien de canto y tono automáticamente contigo.
                </p>

                <div className="flex gap-2 w-full">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="flex-1 btn bg-white border border-stone-200 hover:border-red-300 text-stone-700 text-xs py-2 flex items-center justify-center gap-1.5"
                  >
                    {copiedCode ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    {copiedCode ? 'Código copiado' : `Copiar ${sessionCode}`}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="flex-1 btn bg-white border border-stone-200 hover:border-red-300 text-stone-700 text-xs py-2 flex items-center justify-center gap-1.5"
                  >
                    {copiedUrl ? <Check size={14} className="text-emerald-600" /> : <QrCode size={14} />}
                    {copiedUrl ? 'Enlace copiado' : 'Copiar enlace'}
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onGoToPlayMode(sessionData.playlist);
                    onClose();
                  }}
                  className="flex-1 btn btn-primary py-2.5 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Play size={15} /> Ir al Modo Escenario Sincronizado
                </button>
                <button
                  type="button"
                  onClick={() => onLeaveOrEnd(isHost)}
                  className="btn bg-stone-100 hover:bg-red-50 text-stone-700 hover:text-red-600 py-2.5 px-3 text-xs font-bold flex items-center gap-1"
                  title={isHost ? 'Finalizar transmisión para todos' : 'Desconectarse de la sesión'}
                >
                  <LogOut size={15} />
                  {isHost ? 'Finalizar' : 'Salir'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Selector Tabs */}
              <div className="grid grid-cols-2 gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('join')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border-none ${
                    activeTab === 'join'
                      ? 'bg-white text-red-600 shadow-sm'
                      : 'bg-transparent text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <Users size={15} /> Unirme al Coro
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('host')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border-none ${
                    activeTab === 'host'
                      ? 'bg-white text-red-600 shadow-sm'
                      : 'bg-transparent text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <Radio size={15} /> Dirigir en Vivo
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-xs font-medium">
                  {error}
                </div>
              )}

              {activeTab === 'join' ? (
                <form onSubmit={handleJoinSubmit} className="flex flex-col gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Código de la Sesión del Director
                    </label>
                    <input
                      type="text"
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                      placeholder="Ej: VT4829"
                      maxLength={10}
                      className="w-full px-4 py-3 rounded-xl border border-stone-300 font-mono text-lg font-bold tracking-widest uppercase text-center text-stone-900 focus:outline-none focus:border-red-500"
                      autoFocus
                    />
                    <p className="text-[11px] text-stone-500 mt-1.5 m-0">
                      Al conectarte, tu pantalla mostrará automáticamente la misa o canto que elija el director, incluyendo sus cambios de tono en vivo.
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || joinCodeInput.trim().length < 4}
                    className="btn btn-primary py-3 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Users size={16} />
                    {isLoading ? 'Conectando...' : 'Conectar y Sincronizar Pantalla'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleHostSubmit} className="flex flex-col gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Tu Nombre (Director / Salmista)
                    </label>
                    <input
                      type="text"
                      value={hostNameInput}
                      onChange={(e) => setHostNameInput(e.target.value)}
                      placeholder="Ej: Cristian (Guitarra Base)"
                      maxLength={60}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Título de la Celebración
                    </label>
                    <input
                      type="text"
                      value={massTitleInput}
                      onChange={(e) => setMassTitleInput(e.target.value)}
                      placeholder="Ej: Misa Dominical 12:00 pm"
                      maxLength={100}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 flex items-center gap-2.5">
                    <Music size={18} className="text-red-500 shrink-0" />
                    <div className="text-xs text-stone-600">
                      {defaultPlaylist.length > 0 ? (
                        <>
                          Se transmitirán <strong>{defaultPlaylist.length} cantos</strong> listos para tocar en orden litúrgico.
                        </>
                      ) : (
                        <>
                          Primero selecciona un canto en el Repertorio o arma tu celebración en{' '}
                          <strong>Ordo Missae</strong> para iniciar la transmisión.
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || defaultPlaylist.length === 0}
                    className="btn btn-primary py-3 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Sparkles size={16} />
                    {isLoading ? 'Creando sala...' : 'Iniciar Transmisión en Vivo'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


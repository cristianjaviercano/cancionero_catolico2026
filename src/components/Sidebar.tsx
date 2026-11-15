import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home as HomeIcon, Book, ListMusic, Calendar, BookOpen, 
  Plus, Mic, FolderOpen, Music, HelpCircle, Compass, FileText, X, Sparkles, Flame, Shield, ScrollText, Award
} from 'lucide-react';
import type { Song } from '../hooks/useSongs';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  setSongToEdit: (song: Song | null) => void;
}

// Icon-only nav item with tooltip
function NavIcon({ to, icon: Icon, label, onClose }: { to: string; icon: React.ElementType; label: string; onClose: () => void }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <Link
      to={to}
      onClick={onClose}
      title={label}
      className="nav-icon-item"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '2.75rem',
        height: '2.75rem',
        borderRadius: '0.625rem',
        position: 'relative',
        transition: 'background-color 0.15s',
        backgroundColor: isActive ? 'rgba(220,38,38,0.15)' : 'transparent',
        color: isActive ? '#f87171' : '#6b7280',
        textDecoration: 'none',
      }}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
    >
      <Icon size={20} />
      {/* Active dot */}
      {isActive && (
        <span style={{
          position: 'absolute',
          bottom: '4px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '4px',
          height: '4px',
          borderRadius: '50%',
          backgroundColor: '#dc2626',
        }} />
      )}
      {/* Tooltip */}
      {showTooltip && (
        <span style={{
          position: 'absolute',
          left: 'calc(100% + 12px)',
          top: '50%',
          transform: 'translateY(-50%)',
          backgroundColor: '#1c1917',
          color: '#f5f5f4',
          fontSize: '0.75rem',
          fontWeight: 600,
          padding: '0.375rem 0.625rem',
          borderRadius: '0.375rem',
          whiteSpace: 'nowrap',
          zIndex: 100,
          pointerEvents: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          border: '1px solid #292524',
        }}>
          {label}
        </span>
      )}
    </Link>
  );
}

export function Sidebar({ isOpen, onClose, setSongToEdit }: SidebarProps) {
  const location = useLocation();

  const handleCreateSong = () => {
    setSongToEdit(null);
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 print:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
          onClick={onClose}
        />
      )}

      {/* ── Desktop: icon-only rail (hidden on mobile, visible on desktop >= 768px) ── */}
      <nav
        className="desktop-nav-rail print:hidden"
        aria-label="Navegación sagrada"
      >
        {/* Logo Templar Cross */}
        <Link
          to="/"
          onClick={onClose}
          style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="VOX TEMPLI - Atrium"
        >
          <img src="/cruz-templaria.svg" width="32" height="32" alt="VOX TEMPLI" style={{ filter: 'drop-shadow(0 2px 8px rgba(185, 28, 28, 0.35))' }} />
        </Link>

        {/* Main nav — Nomenclatura Sagrada */}
        <NavIcon to="/" icon={HomeIcon} label="Atrium (Inicio)" onClose={onClose} />
        <NavIcon to="/repertorio" icon={Book} label="Sefer Shirim (Repertorio)" onClose={onClose} />
        <NavIcon to="/build" icon={ListMusic} label="Ordo Missae (Celebraciones)" onClose={onClose} />
        
        <div style={{ width: '32px', height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)', margin: '0.625rem 0' }} />
        
        <NavIcon to="/lecturas" icon={ScrollText} label="Verbum Domini (Lecturas del Día)" onClose={onClose} />
        <NavIcon to="/rosario" icon={Sparkles} label="Corona Sanctorum (Rosario)" onClose={onClose} />
        <NavIcon to="/liturgia" icon={BookOpen} label="Officium Divinum (Horas)" onClose={onClose} />
        <NavIcon to="/partes-eucaristia" icon={Compass} label="Mysterium Fidei (Eucaristía)" onClose={onClose} />
        <NavIcon to="/calendario" icon={Calendar} label="Tempora Sacra (Calendario)" onClose={onClose} />
        
        <div style={{ width: '32px', height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)', margin: '0.625rem 0' }} />
        
        <NavIcon to="/acordes" icon={Music} label="Harmonia Sacra (Acordes)" onClose={onClose} />
        <NavIcon to="/schola" icon={Award} label="Schola Cantorum (Reto 30 Días y Ministerio)" onClose={onClose} />
        <NavIcon to="/afinador" icon={Mic} label="Diapason (Afinador)" onClose={onClose} />
        <NavIcon to="/partituras" icon={FileText} label="Codex Notarum (Partituras)" onClose={onClose} />
        <NavIcon to="/oracion" icon={Flame} label="Oratio Cordis (Oración)" onClose={onClose} />
        <NavIcon to="/sanjose" icon={Shield} label="Vir Fidelis (San José)" onClose={onClose} />
        <NavIcon to="/secciones" icon={FolderOpen} label="Secciones Extra" onClose={onClose} />

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        <NavIcon to="/tutorial" icon={HelpCircle} label="Vade Mecum (Guía y Ayuda)" onClose={onClose} />

        {/* Add song button */}
        <Link
          to="/editor"
          onClick={handleCreateSong}
          title="Novo Cantus (Nueva Canción)"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '2.75rem',
            height: '2.75rem',
            borderRadius: '0.75rem',
            backgroundColor: '#dc2626',
            color: 'white',
            marginTop: '0.5rem',
            marginBottom: '0.25rem',
            boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)',
            transition: 'all 0.15s ease',
            textDecoration: 'none',
          }}
        >
          <Plus size={20} />
        </Link>
      </nav>

      {/* ── Mobile: full drawer (slides in from left) ── */}
      <div
        className="print:hidden"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '290px',
          backgroundColor: '#12141a',
          zIndex: 50,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.32,0.72,0,1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '4px 0 25px rgba(0,0,0,0.5)',
        }}
      >
        {/* Mobile header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: 'none', backgroundColor: 'rgba(255,255,255,0.03)' }}>
          <Link to="/" onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', color: '#dc2626', textDecoration: 'none' }}>
            <img src="/cruz-templaria.svg" width="24" height="24" alt="VOX TEMPLI" style={{ filter: 'drop-shadow(0 2px 6px rgba(185, 28, 28, 0.3))' }} />
            <span className="font-sacred text-base tracking-widest font-extrabold text-stone-100">VOX TEMPLI</span>
          </Link>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem', display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        {/* Mobile nav items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
          {[
            { to: '/', icon: HomeIcon, title: 'ATRIUM', subtitle: 'Inicio y Portal' },
            { to: '/repertorio', icon: Book, title: 'SEFER SHIRIM', subtitle: 'Repertorio General' },
            { to: '/build', icon: ListMusic, title: 'ORDO MISSAE', subtitle: 'Armar Celebración' },
          ].map(({ to, icon: Icon, title, subtitle }) => {
            const isActive = location.pathname === to;
            return (
              <Link key={to} to={to} onClick={onClose} style={{
                display: 'flex', alignItems: 'center', gap: '0.85rem',
                padding: '0.75rem 1rem', borderRadius: '0.75rem', marginBottom: '0.25rem',
                backgroundColor: isActive ? 'rgba(220,38,38,0.18)' : 'transparent',
                color: isActive ? '#f87171' : '#cbd5e1',
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}>
                <Icon size={18} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.8125rem', letterSpacing: '0.05em' }}>{title}</span>
                  <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>{subtitle}</span>
                </div>
              </Link>
            );
          })}

          <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.06)', margin: '0.75rem 0' }} />
          <p style={{ fontSize: '0.625rem', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 1rem', marginBottom: '0.5rem' }}>Sacramental & Horas</p>

          {[
            { to: '/lecturas', icon: ScrollText, title: 'VERBUM DOMINI', subtitle: 'Lecturas del Día' },
            { to: '/rosario', icon: Sparkles, title: 'CORONA SANCTORUM', subtitle: 'Santo Rosario & Decenario' },
            { to: '/liturgia', icon: BookOpen, title: 'OFFICIUM DIVINUM', subtitle: 'Liturgia de las Horas' },
            { to: '/partes-eucaristia', icon: Compass, title: 'MYSTERIUM FIDEI', subtitle: 'Partes de la Eucaristía' },
            { to: '/calendario', icon: Calendar, title: 'TEMPORA SACRA', subtitle: 'Calendario Litúrgico' },
          ].map(({ to, icon: Icon, title, subtitle }) => {
            const isActive = location.pathname === to;
            return (
              <Link key={to} to={to} onClick={onClose} style={{
                display: 'flex', alignItems: 'center', gap: '0.85rem',
                padding: '0.625rem 1rem', borderRadius: '0.75rem', marginBottom: '0.25rem',
                backgroundColor: isActive ? 'rgba(220,38,38,0.18)' : 'transparent',
                color: isActive ? '#f87171' : '#cbd5e1',
                textDecoration: 'none',
              }}>
                <Icon size={16} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.8125rem', letterSpacing: '0.05em' }}>{title}</span>
                  <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>{subtitle}</span>
                </div>
              </Link>
            );
          })}

          <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.06)', margin: '0.75rem 0' }} />
          <p style={{ fontSize: '0.625rem', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 1rem', marginBottom: '0.5rem' }}>Ministerio & Acordes</p>

          {[
            { to: '/acordes', icon: Music, title: 'HARMONIA SACRA', subtitle: 'Glosario de Acordes' },
            { to: '/schola', icon: Award, title: 'SCHOLA CANTORUM', subtitle: 'Reto 30 Días, Ritmos & Ministerio' },
            { to: '/afinador', icon: Mic, title: 'DIAPASON', subtitle: 'Afinador de Frecuencia' },
            { to: '/partituras', icon: FileText, title: 'CODEX NOTARUM', subtitle: 'Partituras de Málaga' },
            { to: '/oracion', icon: Flame, title: 'ORATIO CORDIS', subtitle: 'Canciones para Orar' },
            { to: '/sanjose', icon: Shield, title: 'VIR FIDELIS', subtitle: 'Rincón de San José' },
            { to: '/secciones', icon: FolderOpen, title: 'RECURSOS', subtitle: 'Secciones Pastorales' },
            { to: '/tutorial', icon: HelpCircle, title: 'VADE MECUM', subtitle: 'Guía y Tutorial' },
          ].map(({ to, icon: Icon, title, subtitle }) => {
            const isActive = location.pathname === to;
            return (
              <Link key={to} to={to} onClick={onClose} style={{
                display: 'flex', alignItems: 'center', gap: '0.85rem',
                padding: '0.625rem 1rem', borderRadius: '0.75rem', marginBottom: '0.25rem',
                backgroundColor: isActive ? 'rgba(220,38,38,0.18)' : 'transparent',
                color: isActive ? '#f87171' : '#cbd5e1',
                textDecoration: 'none',
              }}>
                <Icon size={16} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.8125rem', letterSpacing: '0.05em' }}>{title}</span>
                  <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>{subtitle}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Mobile footer */}
        <div style={{ padding: '1.25rem', borderTop: 'none', backgroundColor: 'rgba(255,255,255,0.02)' }}>
          <Link to="/editor" onClick={handleCreateSong} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            width: '100%', padding: '0.85rem 1rem', backgroundColor: '#dc2626',
            color: 'white', borderRadius: '0.75rem', fontWeight: 700, fontSize: '0.875rem',
            textDecoration: 'none', boxShadow: '0 4px 16px rgba(220,38,38,0.4)',
          }}>
            <Plus size={18} /> Novo Cantus (Nuevo)
          </Link>
        </div>
      </div>
    </>
  );
}

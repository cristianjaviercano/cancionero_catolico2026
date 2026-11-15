import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home as HomeIcon, Book, ListMusic, Calendar, BookOpen, 
  Plus, Mic, FolderOpen, Music, HelpCircle, Compass, FileText, X, Heart, ScrollText, Award
} from 'lucide-react';
import type { Song } from '../hooks/useSongs';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  setSongToEdit: (song: Song | null) => void;
}

interface NavItem {
  to: string;
  icon: React.ElementType;
  /** Nombre en español: es lo que se lee primero */
  title: string;
  /** Nombre en latín o aclaración, en pequeño */
  subtitle: string;
  /** Otras rutas que también marcan esta entrada como activa */
  also?: string[];
}

// Una sola lista para el riel de escritorio y el cajón del celular
const NAV_GROUPS: { label: string | null; items: NavItem[] }[] = [
  {
    label: null,
    items: [
      { to: '/', icon: HomeIcon, title: 'Inicio', subtitle: 'Atrium' },
      { to: '/repertorio', icon: Book, title: 'Repertorio', subtitle: 'Sefer Shirim' },
      { to: '/build', icon: ListMusic, title: 'Armar Eucaristía', subtitle: 'Ordo Missae' },
    ],
  },
  {
    label: 'Liturgia y oración',
    items: [
      { to: '/lecturas', icon: ScrollText, title: 'Lecturas del día', subtitle: 'Verbum Domini' },
      { to: '/liturgia', icon: BookOpen, title: 'Liturgia de las Horas', subtitle: 'Officium Divinum' },
      { to: '/calendario', icon: Calendar, title: 'Calendario litúrgico', subtitle: 'Tempora Sacra' },
      { to: '/partes-eucaristia', icon: Compass, title: 'Partes de la Eucaristía', subtitle: 'Mysterium Fidei' },
      { to: '/devociones', icon: Heart, title: 'Devociones', subtitle: 'Rosario, San José y oración', also: ['/rosario', '/sanjose', '/oracion'] },
    ],
  },
  {
    label: 'Música y coro',
    items: [
      { to: '/acordes', icon: Music, title: 'Acordes', subtitle: 'Harmonia Sacra' },
      { to: '/afinador', icon: Mic, title: 'Afinador', subtitle: 'Diapason' },
      { to: '/partituras', icon: FileText, title: 'Partituras', subtitle: 'Codex Notarum' },
      { to: '/schola', icon: Award, title: 'Formación del coro', subtitle: 'Schola Cantorum' },
    ],
  },
];

const NAV_FOOTER: NavItem[] = [
  { to: '/secciones', icon: FolderOpen, title: 'Todas las secciones', subtitle: 'Recursos' },
  { to: '/tutorial', icon: HelpCircle, title: 'Guía y ayuda', subtitle: 'Vade Mecum' },
];

function isItemActive(pathname: string, item: NavItem): boolean {
  return pathname === item.to || !!item.also?.includes(pathname);
}

// Icon-only nav item with tooltip
function NavIcon({ item, onClose }: { item: NavItem; onClose: () => void }) {
  const { to, icon: Icon } = item;
  const label = `${item.title} · ${item.subtitle}`;
  const location = useLocation();
  const isActive = isItemActive(location.pathname, item);
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
        aria-label="Menú principal"
      >
        {/* Logo Templar Cross */}
        <Link
          to="/"
          onClick={onClose}
          style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="VOX TEMPLI · Inicio"
        >
          <img src="/cruz-templaria.svg" width="32" height="32" alt="VOX TEMPLI" style={{ filter: 'drop-shadow(0 2px 8px rgba(185, 28, 28, 0.35))' }} />
        </Link>

        {/* Menú principal: el nombre en español va primero */}
        {NAV_GROUPS.map((group, groupIndex) => (
          <React.Fragment key={group.label ?? 'principal'}>
            {groupIndex > 0 && (
              <div style={{ width: '32px', height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)', margin: '0.625rem 0' }} />
            )}
            {group.items.map(item => <NavIcon key={item.to} item={item} onClose={onClose} />)}
          </React.Fragment>
        ))}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {NAV_FOOTER.map(item => <NavIcon key={item.to} item={item} onClose={onClose} />)}

        {/* Add song button */}
        <Link
          to="/editor"
          onClick={handleCreateSong}
          title="Nuevo canto"
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
          {[...NAV_GROUPS, { label: 'Más', items: NAV_FOOTER }].map((group, groupIndex) => (
            <React.Fragment key={group.label ?? 'principal'}>
              {groupIndex > 0 && (
                <>
                  <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.06)', margin: '0.75rem 0' }} />
                  <p style={{ fontSize: '0.625rem', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 1rem', marginBottom: '0.5rem' }}>{group.label}</p>
                </>
              )}
              {group.items.map(item => {
                const { to, icon: Icon, title, subtitle } = item;
                const isActive = isItemActive(location.pathname, item);
                return (
                  <Link key={to} to={to} onClick={onClose} aria-current={isActive ? 'page' : undefined} style={{
                    display: 'flex', alignItems: 'center', gap: '0.85rem',
                    padding: groupIndex === 0 ? '0.75rem 1rem' : '0.625rem 1rem', borderRadius: '0.75rem', marginBottom: '0.25rem',
                    backgroundColor: isActive ? 'rgba(220,38,38,0.18)' : 'transparent',
                    color: isActive ? '#f87171' : '#cbd5e1',
                    textDecoration: 'none',
                    transition: 'all 0.15s',
                  }}>
                    <Icon size={groupIndex === 0 ? 18 : 16} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{title}</span>
                      <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>{subtitle}</span>
                    </div>
                  </Link>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        {/* Mobile footer */}
        <div style={{ padding: '1.25rem', borderTop: 'none', backgroundColor: 'rgba(255,255,255,0.02)' }}>
          <Link to="/editor" onClick={handleCreateSong} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            width: '100%', padding: '0.85rem 1rem', backgroundColor: '#dc2626',
            color: 'white', borderRadius: '0.75rem', fontWeight: 700, fontSize: '0.875rem',
            textDecoration: 'none', boxShadow: '0 4px 16px rgba(220,38,38,0.4)',
          }}>
            <Plus size={18} /> Nuevo canto
          </Link>
        </div>
      </div>
    </>
  );
}

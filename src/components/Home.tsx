import React from 'react';
import { Link } from 'react-router-dom';
import { Book, ListMusic, Mic, ArrowRight, Sparkles, Music, Calendar, Layers, Scroll, ScrollText, BookOpen, Shield } from 'lucide-react';
import { getLiturgicalDay, roman, todayIso } from '../utils/liturgicalCalendar';

// Tiempo litúrgico de hoy (antes estaba fijo en "Hebdomada XXIV")
function liturgicalBadge(): string {
  const day = getLiturgicalDay(todayIso());
  if (day.celebration) return day.title;
  return `${day.seasonName}${day.week ? ` • Hebdomada ${roman(day.week)}` : ''}`;
}

export function Home() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', padding: '1rem 0 3rem', maxWidth: '720px', margin: '0 auto' }}>

      {/* Hero — Sacred Minimalist Typography with Zero Contour Lines */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.625rem' }}>
          <span style={{ 
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.3rem 0.75rem',
            borderRadius: '9999px',
            backgroundColor: 'color-mix(in srgb, var(--accent-color) 12%, transparent)',
            color: 'var(--accent-color)',
            fontSize: '0.7rem',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="#dc2626">
              <path d="M10.5 2h3l-.8 6.2 4.8-4.8 2.1 2.1-4.8 4.8 6.2-.8v3l-6.2-.8 4.8 4.8-2.1 2.1-4.8-4.8.8 6.2h-3l.8-6.2-4.8 4.8-2.1-2.1 4.8-4.8-6.2.8v-3l6.2.8-4.8-4.8 2.1-2.1 4.8 4.8z" />
            </svg>
            {liturgicalBadge()}
          </span>
        </div>

        <div>
          <h1 className="font-sacred" style={{ 
            fontSize: 'clamp(1.85rem, 6vw, 2.5rem)', 
            fontWeight: 800, 
            letterSpacing: '-0.02em', 
            color: 'var(--text-primary)', 
            lineHeight: 1.1,
            margin: '0.25rem 0 0.5rem' 
          }}>
            VOX <span style={{ color: 'var(--accent-color)' }}>TEMPLI</span>
          </h1>
          <p style={{ 
            fontFamily: 'Cormorant Garamond, serif', 
            fontStyle: 'italic', 
            fontSize: '1.05rem', 
            color: 'var(--text-secondary)', 
            margin: 0 
          }}>
            Códice Litúrgico del Salmista
          </p>
        </div>

        <p style={{ 
          fontSize: '0.9rem', 
          color: 'var(--text-secondary)', 
          lineHeight: 1.6, 
          maxWidth: '38rem',
          margin: 0
        }}>
          Plataforma sagrada para la dirección musical, salmodia canónica y adoración litúrgica. Transposición inmediata, acústica pura y orden sacramental.
        </p>
      </div>

      {/* Four Core Pillars — 2 Column Grid with Soft Ambient Occlusion and ZERO Contour Lines */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>

        {/* Pillar 1: SEFER SHIRIM */}
        <Link to="/repertorio" className="banner banner-red">
          <div className="banner-watermark rotate-right">
            <Book size={140} />
          </div>
          <div className="banner-content">
            <div>
              <div className="banner-icon-box" style={{ backgroundColor: 'color-mix(in srgb, var(--accent-color) 9%, transparent)', color: 'var(--accent-color)' }}>
                <Book size={20} />
              </div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-color)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Sefer Shirim
              </div>
              <h2 className="banner-title" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
                Repertorio Sacro
              </h2>
              <p className="banner-desc" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Códice de himnos, salmos y aclamaciones con acordes dinámicos, transposición y partituras canónicas.
              </p>
            </div>
            <div className="banner-link" style={{ color: 'var(--accent-color)', fontWeight: 700 }}>
              Explorar Repertorio <ArrowRight size={14} />
            </div>
          </div>
        </Link>

        {/* Pillar 2: ORDO MISSAE */}
        <Link to="/build" className="banner banner-blue">
          <div className="banner-watermark rotate-left">
            <ListMusic size={140} />
          </div>
          <div className="banner-content">
            <div>
              <div className="banner-icon-box" style={{ backgroundColor: 'color-mix(in srgb, var(--accent-color) 9%, transparent)', color: 'var(--accent-color)' }}>
                <ListMusic size={20} />
              </div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-color)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Ordo Missae
              </div>
              <h2 className="banner-title" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
                Constructor Litúrgico
              </h2>
              <p className="banner-desc" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Estructura canónica de la Eucaristía paso a paso: asignación coral de cantos y exportación en PDF.
              </p>
            </div>
            <div className="banner-link" style={{ color: 'var(--accent-color)', fontWeight: 700 }}>
              Construir Celebración <ArrowRight size={14} />
            </div>
          </div>
        </Link>

        {/* Pillar 3: DIAPASON */}
        <Link to="/afinador" className="banner banner-emerald">
          <div className="banner-watermark rotate-right">
            <Mic size={140} />
          </div>
          <div className="banner-content">
            <div>
              <div className="banner-icon-box" style={{ backgroundColor: 'color-mix(in srgb, var(--accent-color) 9%, transparent)', color: 'var(--accent-color)' }}>
                <Mic size={20} />
              </div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-color)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Diapason
              </div>
              <h2 className="banner-title" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
                Afinador Sacro
              </h2>
              <p className="banner-desc" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Detección cromática de frecuencia fundamental en tiempo real mediante micrófono para voces e instrumentos.
              </p>
            </div>
            <div className="banner-link" style={{ color: 'var(--accent-color)', fontWeight: 700 }}>
              Activar Diapasón <ArrowRight size={14} />
            </div>
          </div>
        </Link>

        {/* Pillar 4: CORONA SANCTORUM */}
        <Link to="/rosario" className="banner banner-purple">
          <div className="banner-watermark rotate-left">
            <Sparkles size={140} />
          </div>
          <div className="banner-content">
            <div>
              <div className="banner-icon-box" style={{ backgroundColor: 'color-mix(in srgb, var(--accent-color) 9%, transparent)', color: 'var(--accent-color)' }}>
                <Sparkles size={20} />
              </div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-color)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Corona Sanctorum
              </div>
              <h2 className="banner-title" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
                Santo Rosario
              </h2>
              <p className="banner-desc" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Decenario litúrgico interactivo mariano y de San José con misterios meditados y repertorio coral asignado.
              </p>
            </div>
            <div className="banner-link" style={{ color: 'var(--accent-color)', fontWeight: 700 }}>
              Rezar y Salmodiar <ArrowRight size={14} />
            </div>
          </div>
        </Link>
      </div>

      {/* Recessed Sacred Quick Navigation Island — Zero Contour Lines */}
      <div style={{ 
        backgroundColor: 'var(--surface-color)', 
        borderRadius: '1.25rem', 
        padding: '1.5rem', 
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-color)' }}></span>
            <span className="font-sacred" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Códices & Herramientas Adicionales
            </span>
          </div>
          <Link to="/secciones" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-color)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            Todas las Secciones <ArrowRight size={12} />
          </Link>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <Link to="/partes-eucaristia" style={{ 
            backgroundColor: 'var(--surface-highlight)', 
            color: 'var(--text-primary)', 
            padding: '0.5rem 0.875rem', 
            borderRadius: '0.625rem', 
            fontSize: '0.75rem', 
            fontWeight: 700, 
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'background-color 0.15s ease'
          }}>
            <Layers size={14} style={{ color: 'var(--accent-color)' }} />
            Partes de la Misa <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>• Mysterium Fidei</span>
          </Link>

          <Link to="/calendario" style={{ 
            backgroundColor: 'var(--surface-highlight)', 
            color: 'var(--text-primary)', 
            padding: '0.5rem 0.875rem', 
            borderRadius: '0.625rem', 
            fontSize: '0.75rem', 
            fontWeight: 700, 
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'background-color 0.15s ease'
          }}>
            <Calendar size={14} style={{ color: 'var(--accent-color)' }} />
            Calendario <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>• Tempora Sacra</span>
          </Link>

          <Link to="/lecturas" style={{ 
            backgroundColor: 'var(--surface-highlight)', 
            color: 'var(--text-primary)', 
            padding: '0.5rem 0.875rem', 
            borderRadius: '0.625rem', 
            fontSize: '0.75rem', 
            fontWeight: 700, 
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'background-color 0.15s ease'
          }}>
            <ScrollText size={14} style={{ color: 'var(--accent-color)' }} />
            Lecturas <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>• Verbum Domini</span>
          </Link>

          <Link to="/liturgia" style={{ 
            backgroundColor: 'var(--surface-highlight)', 
            color: 'var(--text-primary)', 
            padding: '0.5rem 0.875rem', 
            borderRadius: '0.625rem', 
            fontSize: '0.75rem', 
            fontWeight: 700, 
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'background-color 0.15s ease'
          }}>
            <BookOpen size={14} style={{ color: 'var(--accent-color)' }} />
            Liturgia de las Horas <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>• Officium Divinum</span>
          </Link>

          <Link to="/sanjose" style={{ 
            backgroundColor: 'var(--surface-highlight)', 
            color: 'var(--text-primary)', 
            padding: '0.5rem 0.875rem', 
            borderRadius: '0.625rem', 
            fontSize: '0.75rem', 
            fontWeight: 700, 
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'background-color 0.15s ease'
          }}>
            <Shield size={14} style={{ color: 'var(--accent-color)' }} />
            San José <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>• Vir Fidelis</span>
          </Link>

          <Link to="/acordes" style={{ 
            backgroundColor: 'var(--surface-highlight)', 
            color: 'var(--text-primary)', 
            padding: '0.5rem 0.875rem', 
            borderRadius: '0.625rem', 
            fontSize: '0.75rem', 
            fontWeight: 700, 
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'background-color 0.15s ease'
          }}>
            <Music size={14} style={{ color: 'var(--accent-color)' }} />
            Acordes <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>• Harmonia Sacra</span>
          </Link>

          <Link to="/partituras" style={{ 
            backgroundColor: 'var(--surface-highlight)', 
            color: 'var(--text-primary)', 
            padding: '0.5rem 0.875rem', 
            borderRadius: '0.625rem', 
            fontSize: '0.75rem', 
            fontWeight: 700, 
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'background-color 0.15s ease'
          }}>
            <Scroll size={14} style={{ color: 'var(--accent-color)' }} />
            Partituras <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>• Codex Notarum</span>
          </Link>
        </div>
      </div>

      {/* Atrium Cognitionis — Minimal Dark Card with Diffuse Shadow */}
      <div className="tutorial-banner">
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-color)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
            Atrium Cognitionis
          </div>
          <h2 className="tutorial-title font-sacred">
            <Sparkles size={16} style={{ color: 'var(--accent-color)' }} />
            Guía del Salmista y Maestro de Coro
          </h2>
          <p className="tutorial-desc">
            Aprende a transponer tonos en tiempo real, calibrar el afinador, estructurar eucaristías y activar el atril inteligente con autodesplazamiento continuo.
          </p>
        </div>
        <Link to="/tutorial" className="tutorial-btn font-sacred" style={{ letterSpacing: '0.04em' }}>
          Abrir Guía <ArrowRight size={14} />
        </Link>
      </div>

    </div>
  );
}


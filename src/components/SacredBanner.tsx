import React from 'react';

interface SacredBannerProps {
  // Se conserva por compatibilidad; el estilo Misal no usa foto de fondo
  imageSrc?: string;
  title: string;
  subtitle?: string;
  badge?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

// Encabezado de página estilo Misal: nombre latino en rojo rúbrica, título, descripción y filete dorado
export function SacredBanner({ title, subtitle, badge, icon, children }: SacredBannerProps) {
  return (
    <header className="misal-header print:hidden">
      <div className="misal-header-row">
        <div style={{ minWidth: 0, flex: 1 }}>
          {(badge || icon) && (
            <p className="misal-eyebrow">
              {icon && <span className="misal-eyebrow-icon" aria-hidden="true">{icon}</span>}
              {badge}
            </p>
          )}
          <h1 className="misal-title">{title}</h1>
          {subtitle && <p className="misal-desc">{subtitle}</p>}
        </div>
        {children && <div className="misal-header-actions">{children}</div>}
      </div>
      <div className="misal-rule" aria-hidden="true">✠</div>
    </header>
  );
}

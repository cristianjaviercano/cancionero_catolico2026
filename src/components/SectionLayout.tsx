import React from 'react';
import { SacredBanner } from './SacredBanner';

interface SectionLayoutProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
  imageSrc?: string;
  badge?: string;
  children: React.ReactNode;
  // Se conserva por compatibilidad: el estilo Misal usa un solo color de acento
  colorTheme?: 'red' | 'blue' | 'emerald' | 'purple' | 'stone';
  hideBanner?: boolean;
}

export function SectionLayout({ 
  title, 
  description, 
  icon, 
  imageSrc,
  badge,
  children,
  hideBanner = false,
}: SectionLayoutProps) {
  return (
    <div className="animate-in fade-in duration-200">
      {/* Encabezado estilo Misal, igual en todas las secciones */}
      {!hideBanner && (
        <SacredBanner
          imageSrc={imageSrc}
          title={title}
          subtitle={description}
          badge={badge}
          icon={icon}
        />
      )}

      {/* Content */}
      {children}
    </div>
  );
}

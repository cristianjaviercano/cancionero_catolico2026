import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Flame, Heart, Shield, Sparkles } from 'lucide-react';
import { SectionLayout } from './SectionLayout';

const DEVOCIONES: { to: string; icon: React.ElementType; title: string; latin: string; description: string }[] = [
  { to: '/rosario', icon: Sparkles, title: 'Santo Rosario', latin: 'Corona Sanctorum', description: 'Misterios del día, decenario y cantos para acompañar el rezo.' },
  { to: '/sanjose', icon: Shield, title: 'San José', latin: 'Vir Fidelis', description: 'Oraciones, letanías y cantos al custodio de la Sagrada Familia.' },
  { to: '/oracion', icon: Flame, title: 'Canciones para orar', latin: 'Oratio Cordis', description: 'Música contemplativa para la adoración y la oración personal.' },
];

/** Entrada única del menú para las devociones (Rosario, San José y oración). */
export function Devociones() {
  return (
    <SectionLayout
      title="Devociones"
      description="Rosario, San José y cantos para orar, en un solo lugar."
      icon={<Heart size={28} className="text-red-600" />}
      imageSrc="/imagenes/secciones_adicionales.webp"
      colorTheme="red"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto pt-2">
        {DEVOCIONES.map(({ to, icon: Icon, title, latin, description }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col gap-3 p-5 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all group border border-stone-200"
            style={{ textDecoration: 'none' }}
          >
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <Icon size={22} />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base m-0">{title}</h3>
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mt-0.5">{latin}</div>
              <p className="text-xs text-stone-500 m-0 mt-2">{description}</p>
            </div>
            <div className="text-red-600 font-bold text-xs flex items-center gap-1 mt-auto">
              Abrir <ArrowRight size={14} />
            </div>
          </Link>
        ))}
      </div>
    </SectionLayout>
  );
}

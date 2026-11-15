import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Calendar, Music, Compass, FolderOpen, Sparkles, Flame, Shield, FileText, ArrowRight, Award } from 'lucide-react';
import { SectionLayout } from './SectionLayout';

export function Secciones() {
  return (
    <SectionLayout
      title="Códices & Recursos Adicionales"
      description="Compendio litúrgico del salmista: ritos eucarísticos, horas canónicas, devociones, acústica y partituras sagradas."
      icon={<FolderOpen size={28} className="text-red-600" />}
      imageSrc="/imagenes/secciones_adicionales.webp"
      colorTheme="red"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto pt-2">
        {/* Schola Cantorum */}
        <Link 
          to="/schola" 
          className="sm:col-span-2 flex items-center justify-between p-5 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all group text-decoration-none border border-red-100"
          style={{ textDecoration: 'none' }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <Award size={22} />
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-red-600 mb-0.5">
                Schola Cantorum • Nuevo
              </div>
              <h3 className="font-bold text-stone-900 text-base m-0 flex items-center gap-2">
                Reto de 30 Días, Ritmos de Misa y Guía del Ministerio
              </h3>
              <p className="text-xs text-stone-500 m-0 mt-1">
                Entrenamiento progresivo de guitarra, laboratorio de 6 rasgueos, los 24 cantos sin cejilla y checklist pre-misa.
              </p>
            </div>
          </div>
          <div className="text-red-600 font-bold text-xs flex items-center gap-1 shrink-0 ml-2">
            Entrenar <ArrowRight size={14} />
          </div>
        </Link>

        {/* Corona Sanctorum */}
        <Link 
          to="/rosario" 
          className="sm:col-span-2 flex items-center justify-between p-5 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all group text-decoration-none"
          style={{ textDecoration: 'none' }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <Sparkles size={22} />
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-red-600 mb-0.5">
                Corona Sanctorum
              </div>
              <h3 className="font-bold text-stone-900 text-base m-0 flex items-center gap-2">
                Santo Rosario Decenario (Mariano y San José)
              </h3>
              <p className="text-xs text-stone-500 m-0 mt-1">
                Contador litúrgico de Ave Marías, misterios meditados y repertorio coral de adoración.
              </p>
            </div>
          </div>
          <div className="text-red-600 font-bold text-xs flex items-center gap-1 shrink-0 ml-2">
            Rezar <ArrowRight size={14} />
          </div>
        </Link>

        {/* Mysterium Fidei */}
        <Link 
          to="/partes-eucaristia" 
          className="flex items-center justify-between p-5 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all group text-decoration-none"
          style={{ textDecoration: 'none' }}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <Compass size={20} />
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-red-600 mb-0.5">
                Mysterium Fidei
              </div>
              <h3 className="font-bold text-stone-800 text-sm m-0">Partes de la Eucaristía</h3>
              <p className="text-xs text-stone-500 m-0 mt-0.5">Guía canónica de cantos y rúbricas</p>
            </div>
          </div>
          <ArrowRight size={14} className="text-stone-400 group-hover:text-red-600 transition-colors shrink-0" />
        </Link>

        {/* Harmonia Sacra */}
        <Link 
          to="/acordes" 
          className="flex items-center justify-between p-5 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all group text-decoration-none"
          style={{ textDecoration: 'none' }}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <Music size={20} />
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-red-600 mb-0.5">
                Harmonia Sacra
              </div>
              <h3 className="font-bold text-stone-800 text-sm m-0">Glosario de Acordes</h3>
              <p className="text-xs text-stone-500 m-0 mt-0.5">Visualizador de posiciones y tonos</p>
            </div>
          </div>
          <ArrowRight size={14} className="text-stone-400 group-hover:text-red-600 transition-colors shrink-0" />
        </Link>
        
        {/* Tempora Sacra */}
        <Link 
          to="/calendario" 
          className="flex items-center justify-between p-5 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all group text-decoration-none"
          style={{ textDecoration: 'none' }}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <Calendar size={20} />
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-red-600 mb-0.5">
                Tempora Sacra
              </div>
              <h3 className="font-bold text-stone-800 text-sm m-0">Calendario Litúrgico</h3>
              <p className="text-xs text-stone-500 m-0 mt-0.5">Tiempos canónicos y solemnidades</p>
            </div>
          </div>
          <ArrowRight size={14} className="text-stone-400 group-hover:text-red-600 transition-colors shrink-0" />
        </Link>

        {/* Officium Divinum */}
        <Link 
          to="/liturgia" 
          className="flex items-center justify-between p-5 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all group text-decoration-none"
          style={{ textDecoration: 'none' }}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <BookOpen size={20} />
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-red-600 mb-0.5">
                Officium Divinum
              </div>
              <h3 className="font-bold text-stone-800 text-sm m-0">Liturgia de las Horas</h3>
              <p className="text-xs text-stone-500 m-0 mt-0.5">Salmodia y cánticos para el rezo</p>
            </div>
          </div>
          <ArrowRight size={14} className="text-stone-400 group-hover:text-red-600 transition-colors shrink-0" />
        </Link>

        {/* Vir Fidelis */}
        <Link 
          to="/sanjose" 
          className="flex items-center justify-between p-5 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all group text-decoration-none"
          style={{ textDecoration: 'none' }}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <Shield size={20} />
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-red-600 mb-0.5">
                Vir Fidelis
              </div>
              <h3 className="font-bold text-stone-800 text-sm m-0">Cantos a San José</h3>
              <p className="text-xs text-stone-500 m-0 mt-0.5">Devoción custodia y paternidad</p>
            </div>
          </div>
          <ArrowRight size={14} className="text-stone-400 group-hover:text-red-600 transition-colors shrink-0" />
        </Link>

        {/* Oratio Cordis */}
        <Link 
          to="/oracion" 
          className="flex items-center justify-between p-5 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all group text-decoration-none"
          style={{ textDecoration: 'none' }}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <Flame size={20} />
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-red-600 mb-0.5">
                Oratio Cordis
              </div>
              <h3 className="font-bold text-stone-800 text-sm m-0">Canciones para Orar</h3>
              <p className="text-xs text-stone-500 m-0 mt-0.5">Música contemplativa y adoración</p>
            </div>
          </div>
          <ArrowRight size={14} className="text-stone-400 group-hover:text-red-600 transition-colors shrink-0" />
        </Link>

        {/* Codex Notarum */}
        <Link 
          to="/partituras" 
          className="flex items-center justify-between p-5 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all group text-decoration-none"
          style={{ textDecoration: 'none' }}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <FileText size={20} />
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-red-600 mb-0.5">
                Codex Notarum
              </div>
              <h3 className="font-bold text-stone-800 text-sm m-0">Partituras Litúrgicas</h3>
              <p className="text-xs text-stone-500 m-0 mt-0.5">Colección y galería de partituras</p>
            </div>
          </div>
          <ArrowRight size={14} className="text-stone-400 group-hover:text-red-600 transition-colors shrink-0" />
        </Link>
      </div>
    </SectionLayout>
  );
}

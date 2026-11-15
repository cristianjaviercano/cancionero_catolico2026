import React, { useState, useEffect, useRef } from 'react';
import { ChordDiagram } from './ChordDiagram';
import { formatChord } from '../utils/musicTheory';
import { Volume2, X } from 'lucide-react';

interface ChordPopoverProps {
  chordName: string;
  notation?: 'american' | 'latin';
  targetRect: DOMRect | null;
  onClose: () => void;
  onPlaySound?: (chord: string) => void;
  defaultInstrument?: 'guitar' | 'piano';
}

export function ChordPopover({
  chordName,
  notation = 'latin',
  targetRect,
  onClose,
  onPlaySound,
  defaultInstrument = 'guitar'
}: ChordPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [instrument, setInstrument] = useState<'guitar' | 'piano'>(() => {
    const saved = localStorage.getItem('preferredChordInstrument');
    return (saved === 'piano' || saved === 'guitar') ? saved : defaultInstrument;
  });

  const handleInstrumentChange = (inst: 'guitar' | 'piano') => {
    setInstrument(inst);
    localStorage.setItem('preferredChordInstrument', inst);
  };

  // Close on outside click or Esc key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Attach with capture or timeout to avoid immediate close from triggering click
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }, 20);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!targetRect) return null;

  // Calculate coordinates
  const popoverWidth = instrument === 'piano' ? 240 : 170;
  const popoverHeight = instrument === 'piano' ? 220 : 250;
  
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Center horizontally on target
  const targetCenterX = targetRect.left + targetRect.width / 2;
  let left = targetCenterX - popoverWidth / 2;
  // Clamp within viewport
  left = Math.max(12, Math.min(left, viewportWidth - popoverWidth - 12));

  // Determine if popover goes above or below
  const spaceAbove = targetRect.top;
  const spaceBelow = viewportHeight - targetRect.bottom;
  const placeAbove = spaceAbove >= popoverHeight + 16 || spaceAbove > spaceBelow;

  const top = placeAbove
    ? Math.max(12, targetRect.top - popoverHeight - 10)
    : Math.min(viewportHeight - popoverHeight - 12, targetRect.bottom + 10);

  // Calculate arrow horizontal offset
  const arrowLeft = Math.max(16, Math.min(targetCenterX - left, popoverWidth - 16));

  return (
    <div 
      className="fixed z-50 animate-in fade-in zoom-in-95 duration-150 print:hidden select-none"
      style={{ top: `${top}px`, left: `${left}px`, width: `${popoverWidth}px` }}
      ref={popoverRef}
      onClick={e => e.stopPropagation()}
    >
      {/* Floating Cloud Card */}
      <div className="relative bg-white/95 backdrop-blur-md rounded-2xl border border-stone-200/90 shadow-2xl p-3 text-stone-800 flex flex-col items-center ring-1 ring-black/5">
        
        {/* Header: Title & Instruments */}
        <div className="flex justify-between items-center w-full mb-2 pb-1.5 border-b border-stone-100">
          <span className="font-bold text-sm text-red-600 font-mono tracking-wide">
            {formatChord(chordName, notation)}
          </span>

          <div className="flex bg-stone-100 p-0.5 rounded-lg text-[10px] font-semibold">
            <button
              type="button"
              className={`px-1.5 py-0.5 rounded transition-colors ${instrument === 'guitar' ? 'bg-white text-red-600 shadow-xs font-bold' : 'text-stone-500 hover:text-stone-700'}`}
              onClick={() => handleInstrumentChange('guitar')}
              title="Posturas de Guitarra"
            >
              🎸
            </button>
            <button
              type="button"
              className={`px-1.5 py-0.5 rounded transition-colors ${instrument === 'piano' ? 'bg-white text-red-600 shadow-xs font-bold' : 'text-stone-500 hover:text-stone-700'}`}
              onClick={() => handleInstrumentChange('piano')}
              title="Teclas de Piano"
            >
              🎹
            </button>
          </div>

          <button
            type="button"
            className="text-stone-400 hover:text-stone-700 p-0.5 rounded-md hover:bg-stone-100 transition-colors ml-1"
            onClick={onClose}
            aria-label="Cerrar nube"
          >
            <X size={14} />
          </button>
        </div>

        {/* Diagram Area */}
        <div className="my-1 flex justify-center w-full overflow-hidden">
          <ChordDiagram 
            chordName={chordName}
            notation={notation}
            instrument={instrument}
            width={instrument === 'piano' ? 120 : 85}
          />
        </div>

        {/* Listen Audio Button */}
        {onPlaySound && (
          <button
            type="button"
            onClick={() => onPlaySound(chordName)}
            className="mt-2 w-full flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold border border-red-200 transition-colors active:scale-95"
            title="Escuchar sonido del acorde"
          >
            <Volume2 size={13} />
            <span>Escuchar</span>
          </button>
        )}

        {/* Arrow pointer */}
        <div 
          className={`absolute w-3 h-3 bg-white/95 border-stone-200/90 rotate-45 ${
            placeAbove 
              ? 'bottom-[-7px] border-r border-b' 
              : 'top-[-7px] border-l border-t'
          }`}
          style={{ left: `${arrowLeft}px`, transform: 'translateX(-50%) rotate(45deg)' }}
        />
      </div>
    </div>
  );
}

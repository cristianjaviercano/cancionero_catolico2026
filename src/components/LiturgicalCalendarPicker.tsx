import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface LiturgicalCalendarPickerProps {
  value: string;
  onChange: (formattedDate: string, date: Date) => void;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAY_NAMES = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];
const FULL_DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function formatLiturgicalDate(d: Date): string {
  const dayName = FULL_DAY_NAMES[d.getDay()];
  const dayNum = d.getDate();
  const monthName = MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();
  return `${dayName}, ${dayNum} de ${monthName} de ${year}`;
}

export function LiturgicalCalendarPicker({ value, onChange }: LiturgicalCalendarPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => new Date());
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  // Days calculation
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const today = new Date();

  const prevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const selectDay = (day: number) => {
    const selected = new Date(currentYear, currentMonth, day);
    onChange(formatLiturgicalDate(selected), selected);
    setIsOpen(false);
  };

  const selectToday = () => {
    onChange(formatLiturgicalDate(today), today);
    setViewDate(new Date());
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={popoverRef}>
      {/* Interactive Display Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-stone-50 hover:bg-stone-100/80 rounded-xl px-3.5 py-2.5 text-left text-sm text-stone-800 focus:outline-none flex items-center justify-between transition-colors shadow-sm cursor-pointer"
        style={{ border: 'none' }}
      >
        <span className={value ? 'font-semibold text-stone-800' : 'text-stone-400'}>
          {value || 'Seleccionar fecha litúrgica...'}
        </span>
        <CalendarIcon size={16} className="text-red-600 shrink-0 ml-2" />
      </button>

      {/* Calendar Popover */}
      {isOpen && (
        <div
          className="absolute left-0 top-full mt-2 z-50 bg-white rounded-2xl p-4 shadow-xl animate-in fade-in zoom-in-95 duration-150"
          style={{
            width: '290px',
            border: 'none',
            boxShadow: '0 10px 30px -4px rgba(24, 24, 27, 0.12), 0 4px 12px -2px rgba(24, 24, 27, 0.04)'
          }}
        >
          {/* Header with Month/Year and navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-500 hover:text-red-600 hover:bg-stone-100 transition-colors focus:outline-none"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="font-sacred font-bold text-sm text-stone-800">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </div>
            <button
              type="button"
              onClick={nextMonth}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-500 hover:text-red-600 hover:bg-stone-100 transition-colors focus:outline-none"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {DAY_NAMES.map((name, i) => (
              <span
                key={name}
                className={`text-[11px] font-bold ${i === 0 ? 'text-red-600' : 'text-stone-400'}`}
              >
                {name}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Empty slots for days before 1st */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="h-8 w-8" />
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday =
                today.getDate() === day &&
                today.getMonth() === currentMonth &&
                today.getFullYear() === currentYear;
              
              const dayOfWeek = (firstDayOfMonth + i) % 7;
              const isSunday = dayOfWeek === 0;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  className={`h-8 w-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer focus:outline-none ${
                    isToday
                      ? 'bg-red-600 text-white shadow-sm hover:bg-red-700'
                      : isSunday
                      ? 'text-red-600 hover:bg-red-50 font-bold'
                      : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Quick Select Today Footer */}
          <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between">
            <button
              type="button"
              onClick={selectToday}
              className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors focus:outline-none"
            >
              Seleccionar Hoy
            </button>
            <span className="text-[10px] text-stone-400 font-medium">
              Calendario Canónico
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

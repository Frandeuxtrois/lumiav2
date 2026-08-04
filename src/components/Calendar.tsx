import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isBefore, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

interface CalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  refreshTrigger?: number;
}

export const Calendar: React.FC<CalendarProps> = ({ selectedDate, onDateSelect, refreshTrigger }) => {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [dateStatus, setDateStatus] = React.useState<Record<string, 'available' | 'full'>>({});

  const today = startOfToday();

  React.useEffect(() => {
    const from = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const to = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    supabase
      .from('appointments')
      .select('date, status')
      .gte('date', from)
      .lte('date', to)
      .then(({ data }) => {
        if (!data) return;
        const grouped: Record<string, { total: number; available: number }> = {};
        data.forEach(({ date, status }) => {
          if (!grouped[date]) grouped[date] = { total: 0, available: 0 };
          grouped[date].total++;
          if (status === 'available') grouped[date].available++;
        });
        const result: Record<string, 'available' | 'full'> = {};
        Object.entries(grouped).forEach(([date, { available }]) => {
          result[date] = available > 0 ? 'available' : 'full';
        });
        setDateStatus(result);
      });
  }, [currentMonth, refreshTrigger]);

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <span className="font-medium text-sm capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </span>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-1 rounded bg-elevated hover:bg-elevated transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button onClick={nextMonth} className="p-1 rounded bg-elevated hover:bg-elevated transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted mb-2">
        {['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO'].map(d => <span key={d}>{d}</span>)}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {days.map((day, idx) => {
          const isSelected = isSameDay(day, selectedDate);
          const isPast = isBefore(day, today);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, today);
          const status = dateStatus[format(day, 'yyyy-MM-dd')];

          // Dos estados visibles: hay lugar o no lo hay. "Completo" y "sin turnos
          // cargados" son lo mismo para quien reserva, y separarlos solo confundia.
          const dayClass = (() => {
            if (isSelected) return 'bg-primary text-on-accent font-bold ring-2 ring-primary ring-offset-1';
            if (isPast || !isCurrentMonth) return 'text-muted cursor-not-allowed';
            if (status === 'available') return 'bg-primary/10 text-primary font-semibold hover:bg-primary/20';
            return 'text-muted cursor-not-allowed';
          })();

          return (
            <button
              key={day.toString()}
              onClick={() => !isPast && status === 'available' && onDateSelect(day)}
              disabled={isPast || status !== 'available'}
              className={cn('py-2 text-sm rounded-awd transition-all relative', dayClass)}
              style={idx === 0 ? { gridColumnStart: (day.getDay() === 0 ? 7 : day.getDay()) } : {}}
            >
              {format(day, 'd')}
              {isToday && !isSelected && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-4 mt-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-primary/20 border border-primary/40" />
          <span className="text-xs text-muted">Con turnos disponibles</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-elevated border border-line" />
          <span className="text-xs text-muted">Sin disponibilidad</span>
        </div>
      </div>
    </div>
  );
};

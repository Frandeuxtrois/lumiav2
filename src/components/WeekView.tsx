import React from 'react';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Appointment, AppointmentStatus } from '../types';
import { formatTime, cn } from '../lib/utils';
import { CheckCircle, Trash2 } from 'lucide-react';

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  available: 'bg-green-50 text-green-700 border-green-100',
  booked: 'bg-blue-50 text-blue-700 border-blue-100',
  completed: 'bg-slate-100 text-slate-400 border-slate-100',
  cancelled: 'bg-red-50 text-red-400 border-red-100',
};

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  available: 'Libre',
  booked: 'Reservado',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

interface Props {
  appointments: Appointment[];
  loading: boolean;
  onStatusChange: (id: string, status: AppointmentStatus) => void;
  onDelete: (id: string, status: string) => void;
}

export const WeekView: React.FC<Props> = ({ appointments, loading, onStatusChange, onDelete }) => {
  const [weekStart, setWeekStart] = React.useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekLabel = `${format(days[0], "d 'de' MMM", { locale: es })} — ${format(days[6], "d 'de' MMM yyyy", { locale: es })}`;

  const aptsForDay = (day: Date) =>
    appointments.filter(a => a.date === format(day, 'yyyy-MM-dd'))
      .sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div>
      {/* Week navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setWeekStart(subWeeks(weekStart, 1))} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold text-slate-700 capitalize">{weekLabel}</span>
        <button onClick={() => setWeekStart(addWeeks(weekStart, 1))} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-7 gap-2">
          {days.map(d => (
            <div key={d.toString()} className="h-40 bg-slate-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {days.map(day => {
            const apts = aptsForDay(day);
            const today = isToday(day);

            return (
              <div key={day.toString()} className={cn(
                'rounded-xl border p-3 min-h-32 flex flex-col gap-2',
                today ? 'border-primary/40 bg-primary/5' : 'border-border-gray bg-white'
              )}>
                <div className="text-center mb-1">
                  <p className={cn('text-[10px] font-bold uppercase tracking-wider', today ? 'text-primary' : 'text-slate-400')}>
                    {format(day, 'EEE', { locale: es })}
                  </p>
                  <p className={cn('text-lg font-bold', today ? 'text-primary' : 'text-slate-700')}>
                    {format(day, 'd')}
                  </p>
                </div>

                {apts.length === 0 ? (
                  <p className="text-[10px] text-slate-300 text-center mt-2">Sin turnos</p>
                ) : (
                  apts.map(apt => (
                    <div key={apt.id} className={cn('border rounded-lg p-1.5 text-[10px]', STATUS_STYLES[apt.status])}>
                      <div className="font-bold mb-0.5">{formatTime(apt.time)}</div>
                      <div className="font-medium truncate">{apt.status === 'available' ? 'Libre' : apt.name}</div>
                      <div className="text-[9px] uppercase tracking-wide opacity-70 mt-0.5">{STATUS_LABELS[apt.status]}</div>
                      <div className="flex gap-1 mt-1">
                        {apt.status === 'booked' && (
                          <button onClick={() => onStatusChange(apt.id, 'completed')} className="hover:opacity-70" title="Completar">
                            <CheckCircle size={11} />
                          </button>
                        )}
                        <button onClick={() => onDelete(apt.id, apt.status)} className="hover:opacity-70 ml-auto" title="Eliminar">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

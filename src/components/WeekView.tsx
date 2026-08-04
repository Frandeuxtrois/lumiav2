import React from 'react';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Ban, RotateCcw } from 'lucide-react';
import { Appointment, AppointmentStatus } from '../types';
import { formatTime, cn } from '../lib/utils';
import { CheckCircle, Trash2 } from 'lucide-react';
import { STATUS_META } from '../lib/statusMeta';

interface Props {
  appointments: Appointment[];
  loading: boolean;
  onStatusChange: (id: string, status: AppointmentStatus) => void;
  onDelete: (id: string, status: string) => void;
  onBlockDays: (dates: string[]) => void;
  onUnblockDays: (dates: string[]) => void;
  working: boolean;
}

export const WeekView: React.FC<Props> = ({
  appointments, loading, onStatusChange, onDelete, onBlockDays, onUnblockDays, working,
}) => {
  const [weekStart, setWeekStart] = React.useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekKeys = days.map(d => format(d, 'yyyy-MM-dd'));
  const weekLabel = `${format(days[0], "d 'de' MMM", { locale: es })} — ${format(days[6], "d 'de' MMM yyyy", { locale: es })}`;

  const aptsForDay = (day: Date) =>
    appointments.filter(a => a.date === format(day, 'yyyy-MM-dd'))
      .sort((a, b) => a.time.localeCompare(b.time));

  const enLaSemana = appointments.filter(a => weekKeys.includes(a.date));
  const libresEnSemana = enLaSemana.filter(a => a.status === 'available').length;
  const bloqueadosEnSemana = enLaSemana.filter(a => a.status === 'blocked').length;
  const reservadosEnSemana = enLaSemana.filter(a => a.status === 'booked').length;

  return (
    <div>
      {/* Week navigation */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <button onClick={() => setWeekStart(subWeeks(weekStart, 1))} className="p-1.5 rounded-awd bg-elevated hover:bg-elevated transition-colors">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold text-ink capitalize">{weekLabel}</span>
        <button onClick={() => setWeekStart(addWeeks(weekStart, 1))} className="p-1.5 rounded-awd bg-elevated hover:bg-elevated transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>

      {(libresEnSemana > 0 || bloqueadosEnSemana > 0) && (
        <div className="flex flex-wrap items-center gap-3 mb-4 px-3 py-2 rounded-awd border border-line bg-elevated">
          <span className="text-xs text-muted">
            Vacaciones o cierre: sacá toda la semana de circulación de una.
          </span>
          {reservadosEnSemana > 0 && (
            <span className="text-[11px] text-warning">
              {reservadosEnSemana} turno(s) ya reservado(s) — no se tocan
            </span>
          )}
          <div className="flex gap-2 ml-auto">
            {libresEnSemana > 0 && (
              <button
                onClick={() => onBlockDays(weekKeys)}
                disabled={working}
                className="px-3 py-1.5 rounded-awd border border-line text-xs font-bold uppercase tracking-wider hover:border-muted flex items-center gap-1.5 transition-colors disabled:opacity-50"
                title={`Bloquear los ${libresEnSemana} horarios libres de esta semana`}
              >
                <Ban size={13} /> Bloquear semana
              </button>
            )}
            {bloqueadosEnSemana > 0 && (
              <button
                onClick={() => onUnblockDays(weekKeys)}
                disabled={working}
                className="px-3 py-1.5 rounded-awd border border-accent text-accent text-xs font-bold uppercase tracking-wider hover:bg-accent/10 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                title={`Devolver a disponibles los ${bloqueadosEnSemana} horarios bloqueados de esta semana`}
              >
                <RotateCcw size={13} /> Abrir semana
              </button>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-7 gap-2">
          {days.map(d => (
            <div key={d.toString()} className="h-40 bg-elevated animate-pulse rounded-awd" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {days.map(day => {
            const apts = aptsForDay(day);
            const today = isToday(day);

            return (
              <div key={day.toString()} className={cn(
                'rounded-awd border p-3 min-h-32 flex flex-col gap-2',
                today ? 'border-primary/40 bg-primary/5' : 'border-line bg-surface'
              )}>
                <div className="text-center mb-1">
                  <p className={cn('text-[10px] font-bold uppercase tracking-wider', today ? 'text-primary' : 'text-muted')}>
                    {format(day, 'EEE', { locale: es })}
                  </p>
                  <p className={cn('text-lg font-bold', today ? 'text-primary' : 'text-ink')}>
                    {format(day, 'd')}
                  </p>
                </div>

                {apts.length === 0 ? (
                  <p className="text-[10px] text-muted text-center mt-2">Sin turnos</p>
                ) : (
                  apts.map(apt => {
                    const meta = STATUS_META[apt.status];
                    return (
                    <div key={apt.id} className={cn('border rounded-awd p-1.5 text-[10px]', meta.chip)}>
                      <div className="font-bold mb-0.5">{formatTime(apt.time)}</div>
                      <div className="font-medium truncate">{apt.status === 'available' ? 'Libre' : apt.name}</div>
                      <div className="flex items-center gap-1 text-[9px] uppercase tracking-wide opacity-80 mt-0.5">
                        <meta.Icon size={9} className="shrink-0" />
                        <span className={cn(apt.status === 'cancelled' && 'line-through')}>{meta.label}</span>
                      </div>
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
                    );
                  })
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

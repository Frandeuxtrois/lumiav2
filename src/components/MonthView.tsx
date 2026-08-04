import React from 'react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth,
  addMonths, subMonths, isBefore, startOfToday, startOfWeek, endOfWeek,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Ban, RotateCcw, X } from 'lucide-react';
import { Appointment } from '../types';
import { cn } from '../lib/utils';

interface Props {
  appointments: Appointment[];
  loading: boolean;
  onBlockDays: (dates: string[]) => void;
  onUnblockDays: (dates: string[]) => void;
  onOpenDay: (date: string) => void;
  working: boolean;
}

interface DaySummary {
  libres: number;
  reservados: number;
  bloqueados: number;
  total: number;
}

const GRID_COLS = 'grid grid-cols-[1.75rem_repeat(7,minmax(0,1fr))] gap-1.5';

export const MonthView: React.FC<Props> = ({
  appointments, loading, onBlockDays, onUnblockDays, onOpenDay, working,
}) => {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [selected, setSelected] = React.useState<string[]>([]);
  const [lastClicked, setLastClicked] = React.useState<string | null>(null);

  const today = startOfToday();

  // La grilla arranca el lunes de la primera semana y termina el domingo de la
  // ultima: asi cada fila es una semana entera y se puede seleccionar completa.
  const weeks = React.useMemo(() => {
    const dias = eachDayOfInterval({
      start: startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }),
      end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 }),
    });
    const filas: Date[][] = [];
    for (let i = 0; i < dias.length; i += 7) filas.push(dias.slice(i, i + 7));
    return filas;
  }, [currentMonth]);

  const summaries = React.useMemo(() => {
    const map: Record<string, DaySummary> = {};
    appointments.forEach(a => {
      if (!map[a.date]) map[a.date] = { libres: 0, reservados: 0, bloqueados: 0, total: 0 };
      map[a.date].total++;
      if (a.status === 'available') map[a.date].libres++;
      else if (a.status === 'booked') map[a.date].reservados++;
      else if (a.status === 'blocked') map[a.date].bloqueados++;
    });
    return map;
  }, [appointments]);

  const toggleDay = (key: string, shiftKey: boolean) => {
    // Shift + clic selecciona el rango completo desde el ultimo clic, como en una planilla.
    if (shiftKey && lastClicked) {
      const all = weeks.flat().map(d => format(d, 'yyyy-MM-dd'));
      const from = all.indexOf(lastClicked);
      const to = all.indexOf(key);
      if (from !== -1 && to !== -1) {
        const rango = all.slice(Math.min(from, to), Math.max(from, to) + 1);
        setSelected(prev => Array.from(new Set([...prev, ...rango])));
        return;
      }
    }
    setSelected(prev => (prev.includes(key) ? prev.filter(d => d !== key) : [...prev, key]));
    setLastClicked(key);
  };

  // Una semana puede empezar o terminar en el mes vecino: se selecciona igual.
  // Unas vacaciones no se cortan porque justo cambie el mes.
  const toggleWeek = (week: Date[]) => {
    const keys = week.map(d => format(d, 'yyyy-MM-dd'));
    const completa = keys.every(k => selected.includes(k));
    setSelected(prev => (completa
      ? prev.filter(k => !keys.includes(k))
      : Array.from(new Set([...prev, ...keys]))));
    setLastClicked(keys[keys.length - 1]);
  };

  const seleccionTieneBloqueados = selected.some(d => (summaries[d]?.bloqueados ?? 0) > 0);
  const seleccionTieneLibres = selected.some(d => (summaries[d]?.libres ?? 0) > 0);
  const reservadosEnSeleccion = selected.reduce((acc, d) => acc + (summaries[d]?.reservados ?? 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 rounded-awd border border-line hover:border-accent hover:text-accent transition-colors">
          <ChevronLeft size={16} />
        </button>
        <span className="font-display font-bold capitalize">{format(currentMonth, 'MMMM yyyy', { locale: es })}</span>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 rounded-awd border border-line hover:border-accent hover:text-accent transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className={cn(GRID_COLS, 'text-center text-[10px] label text-muted mb-2')}>
        <span />
        {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map(d => <span key={d}>{d}</span>)}
      </div>

      {loading ? (
        <div className="space-y-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={GRID_COLS}>
              {Array.from({ length: 8 }).map((_, j) => <div key={j} className="h-20 bg-elevated animate-pulse rounded-awd" />)}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-1.5">
          {weeks.map((week, wi) => {
            const weekKeys = week.map(d => format(d, 'yyyy-MM-dd'));
            const weekSelected = weekKeys.every(k => selected.includes(k));
            const desde = format(week[0], "d 'de' MMM", { locale: es });

            return (
              <div key={wi} className={GRID_COLS}>
                <button
                  onClick={() => toggleWeek(week)}
                  aria-pressed={weekSelected}
                  title={weekSelected ? `Quitar la semana del ${desde}` : `Seleccionar la semana del ${desde}`}
                  className={cn(
                    'h-20 rounded-awd border text-[9px] font-bold uppercase tracking-wider flex items-center justify-center transition-all duration-300',
                    weekSelected
                      ? 'border-accent bg-accent/15 text-accent ring-1 ring-accent'
                      : 'border-line text-muted hover:border-accent hover:text-accent',
                  )}
                >
                  <span className="[writing-mode:vertical-rl] rotate-180">Semana</span>
                </button>

                {week.map(day => {
                  const key = format(day, 'yyyy-MM-dd');
                  const s = summaries[key];
                  const isSel = selected.includes(key);
                  const isPast = isBefore(day, today);
                  const fueraDelMes = !isSameMonth(day, currentMonth);
                  const bloqueado = !!s && s.bloqueados > 0 && s.libres === 0;

                  return (
                    <button
                      key={key}
                      onClick={e => toggleDay(key, e.shiftKey)}
                      onDoubleClick={() => onOpenDay(key)}
                      title="Clic para seleccionar · Shift+clic para un rango · Doble clic para abrir el día"
                      className={cn(
                        'h-20 p-1.5 rounded-awd border text-left flex flex-col transition-all duration-300',
                        isSel && 'border-accent bg-accent/15 ring-1 ring-accent',
                        !isSel && bloqueado && 'border-muted/40 border-dashed bg-elevated',
                        !isSel && !bloqueado && 'border-line bg-surface hover:border-accent',
                        !isSel && (isPast || fueraDelMes) && 'opacity-45',
                      )}
                    >
                      <span className={cn(
                        'text-sm font-bold',
                        isSameDay(day, today) && 'text-accent',
                        fueraDelMes && !isSameDay(day, today) && 'text-muted',
                      )}>
                        {format(day, 'd')}
                      </span>

                      {!s ? (
                        <span className="text-[9px] text-muted mt-auto">—</span>
                      ) : bloqueado ? (
                        <span className="text-[9px] text-muted mt-auto flex items-center gap-0.5">
                          <Ban size={8} /> Bloqueado
                        </span>
                      ) : (
                        <span className="text-[9px] text-muted mt-auto leading-tight">
                          <span className="text-accent font-semibold">{s.libres}</span> libres
                          {s.reservados > 0 && <><br /><span className="text-info font-semibold">{s.reservados}</span> res.</>}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {selected.length > 0 && (
        <div className="mt-4 glass rounded-awd p-3 flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold">
            {selected.length} {selected.length === 1 ? 'día seleccionado' : 'días seleccionados'}
          </span>

          {reservadosEnSeleccion > 0 && (
            <span className="text-[11px] text-warning">
              {reservadosEnSeleccion} turno(s) ya reservado(s) — no se tocan
            </span>
          )}

          <div className="flex gap-2 ml-auto">
            {seleccionTieneLibres && (
              <button
                onClick={() => { onBlockDays(selected); setSelected([]); }}
                disabled={working}
                className="px-3 py-1.5 rounded-awd border border-line text-xs font-bold uppercase tracking-wider hover:border-muted flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Ban size={13} /> Bloquear
              </button>
            )}
            {seleccionTieneBloqueados && (
              <button
                onClick={() => { onUnblockDays(selected); setSelected([]); }}
                disabled={working}
                className="px-3 py-1.5 rounded-awd border border-accent text-accent text-xs font-bold uppercase tracking-wider hover:bg-accent/10 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RotateCcw size={13} /> Abrir
              </button>
            )}
            <button onClick={() => setSelected([])} className="px-2 py-1.5 text-muted hover:text-ink transition-colors" title="Limpiar selección">
              <X size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

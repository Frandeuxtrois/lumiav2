import React from 'react';
import {
  format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  differenceInCalendarDays,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Ban, RotateCcw, AlertTriangle } from 'lucide-react';
import { appointmentService } from '../services/api';
import { Appointment } from '../types';
import { cn } from '../lib/utils';

interface Props {
  appointments: Appointment[];
  desdeInicial: string;
  onClose: () => void;
  onDone: (mensaje: string | null) => void;
}

const fmt = (d: Date) => format(d, 'yyyy-MM-dd');

const atajos = (base: Date) => [
  { label: 'Día', from: fmt(base), to: fmt(base) },
  { label: 'Semana', from: fmt(startOfWeek(base, { weekStartsOn: 1 })), to: fmt(endOfWeek(base, { weekStartsOn: 1 })) },
  { label: 'Mes', from: fmt(startOfMonth(base)), to: fmt(endOfMonth(base)) },
];

export const BlockRangeModal: React.FC<Props> = ({ appointments, desdeInicial, onClose, onDone }) => {
  const [from, setFrom] = React.useState(desdeInicial);
  const [to, setTo] = React.useState(desdeInicial);
  const [working, setWorking] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const base = React.useMemo(() => parseISO(desdeInicial), [desdeInicial]);
  const rangoValido = !!from && !!to && from <= to;

  // El panel ya tiene todos los turnos cargados, asi que el resumen no pega otra
  // consulta: cuenta sobre lo que hay en pantalla.
  const resumen = React.useMemo(() => {
    if (!rangoValido) return null;
    const dentro = appointments.filter(a => a.date >= from && a.date <= to);
    return {
      dias: differenceInCalendarDays(parseISO(to), parseISO(from)) + 1,
      libres: dentro.filter(a => a.status === 'available').length,
      bloqueados: dentro.filter(a => a.status === 'blocked').length,
      reservados: dentro.filter(a => a.status === 'booked').length,
    };
  }, [appointments, from, to, rangoValido]);

  const ejecutar = async (bloquear: boolean) => {
    if (!rangoValido) return;
    setWorking(true);
    setError(null);
    try {
      const afectados = bloquear
        ? await appointmentService.blockRange(from, to)
        : await appointmentService.unblockRange(from, to);

      if (afectados === 0) {
        setError(bloquear
          ? 'No había horarios libres para bloquear en ese período.'
          : 'No había horarios bloqueados para abrir en ese período.');
        setWorking(false);
        return;
      }

      onDone(`${afectados} horario(s) ${bloquear ? 'bloqueado(s)' : 'abierto(s)'}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el bloqueo.');
      setWorking(false);
    }
  };

  const etiquetaRango = rangoValido
    ? from === to
      ? format(parseISO(from), "EEEE d 'de' MMMM", { locale: es })
      : `${format(parseISO(from), "d 'de' MMM", { locale: es })} — ${format(parseISO(to), "d 'de' MMM 'de' yyyy", { locale: es })}`
    : null;

  return (
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-surface rounded-awd p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold">Bloquear período</h3>
          <button onClick={onClose} className="text-muted hover:text-ink text-xl leading-none">×</button>
        </div>
        <p className="text-xs text-muted mb-5">
          Vacaciones, feriados largos o cualquier tramo que no atendés. Elegí desde cuándo hasta cuándo.
        </p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {atajos(base).map(a => {
            const activo = from === a.from && to === a.to;
            return (
              <button
                key={a.label}
                onClick={() => { setFrom(a.from); setTo(a.to); setError(null); }}
                className={cn(
                  'px-2.5 py-1 rounded-awd border text-[11px] font-semibold capitalize transition-colors',
                  activo ? 'border-accent bg-accent/10 text-accent' : 'border-line text-muted hover:border-accent hover:text-accent',
                )}
              >
                {a.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Desde</span>
            <input
              type="date"
              value={from}
              onChange={e => { setFrom(e.target.value); setError(null); }}
              className="mt-1 w-full px-3 py-2 border border-line rounded-awd text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Hasta</span>
            <input
              type="date"
              value={to}
              min={from}
              onChange={e => { setTo(e.target.value); setError(null); }}
              className="mt-1 w-full px-3 py-2 border border-line rounded-awd text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
        </div>

        {!rangoValido ? (
          <p className="text-xs text-warning mb-4">La fecha de fin tiene que ser igual o posterior a la de inicio.</p>
        ) : (
          <div className="bg-elevated rounded-awd p-3 mb-4 text-sm">
            <p className="font-semibold text-ink capitalize mb-1">{etiquetaRango}</p>
            <p className="text-xs text-muted">
              {resumen!.dias} {resumen!.dias === 1 ? 'día' : 'días'} ·{' '}
              <span className="text-accent font-semibold">{resumen!.libres}</span> libres ·{' '}
              <span className="font-semibold">{resumen!.bloqueados}</span> ya bloqueados
            </p>
            {resumen!.reservados > 0 && (
              <p className="mt-2 flex items-start gap-1.5 text-xs text-warning">
                <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                <span>
                  Hay {resumen!.reservados} turno(s) reservado(s) en este período. No se tocan: cancelalos uno por uno
                  para que el cliente reciba el aviso.
                </span>
              </p>
            )}
          </div>
        )}

        {error && (
          <p className="text-xs text-warning mb-4">{error}</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => ejecutar(true)}
            disabled={working || !rangoValido || resumen!.libres === 0}
            className="flex-1 px-4 py-2.5 rounded-awd bg-accent text-on-accent text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:hover:bg-accent"
          >
            <Ban size={14} /> Bloquear
          </button>
          <button
            onClick={() => ejecutar(false)}
            disabled={working || !rangoValido || resumen!.bloqueados === 0}
            className="flex-1 px-4 py-2.5 rounded-awd border border-accent text-accent text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-accent/10 transition-colors disabled:opacity-40"
          >
            <RotateCcw size={14} /> Abrir
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { format, addDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { X, Clock, CalendarDays, CalendarRange, CheckCircle2 } from 'lucide-react';
import { appointmentService } from '../services/api';
import { cn } from '../lib/utils';

type Mode = 'individual' | 'rango' | 'periodo';

const DURATIONS = [
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
  { label: '90 min', value: 90 },
];

const WEEKDAYS = [
  { label: 'Lu', value: 1 },
  { label: 'Ma', value: 2 },
  { label: 'Mi', value: 3 },
  { label: 'Ju', value: 4 },
  { label: 'Vi', value: 5 },
  { label: 'Sá', value: 6 },
  { label: 'Do', value: 0 },
];

const today = format(new Date(), 'yyyy-MM-dd');

function generateTimesForRange(start: string, end: string, duration: number): string[] {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const endMin = eh * 60 + em;
  const times: string[] = [];
  let cur = sh * 60 + sm;
  while (cur + duration <= endMin) {
    times.push(`${String(Math.floor(cur / 60)).padStart(2, '0')}:${String(cur % 60).padStart(2, '0')}`);
    cur += duration;
  }
  return times;
}

function generateDatesInRange(from: string, to: string, weekdays: number[]): string[] {
  if (!from || !to || from > to || weekdays.length === 0) return [];
  const dates: string[] = [];
  let cur = parseISO(from);
  const end = parseISO(to);
  while (cur <= end) {
    if (weekdays.includes(cur.getDay())) dates.push(format(cur, 'yyyy-MM-dd'));
    cur = addDays(cur, 1);
  }
  return dates;
}

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateSlotsModal: React.FC<Props> = ({ onClose, onSuccess }) => {
  const [mode, setMode] = React.useState<Mode>('individual');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [done, setDone] = React.useState(false);
  const [createdCount, setCreatedCount] = React.useState(0);

  // Modo individual
  const [indDate, setIndDate] = React.useState(today);
  const [indTime, setIndTime] = React.useState('09:00');

  // Modo rango
  const [rangoDate, setRangoDate] = React.useState(today);
  const [rangoStart, setRangoStart] = React.useState('09:00');
  const [rangoEnd, setRangoEnd] = React.useState('13:00');
  const [rangoDuration, setRangoDuration] = React.useState(60);

  // Modo periodo
  const [periodoFrom, setPeriodoFrom] = React.useState(today);
  const [periodoTo, setPeriodoTo] = React.useState('');
  const [periodoStart, setPeriodoStart] = React.useState('09:00');
  const [periodoEnd, setPeriodoEnd] = React.useState('13:00');
  const [periodoDuration, setPeriodoDuration] = React.useState(60);
  const [periodoWeekdays, setPeriodoWeekdays] = React.useState<number[]>([1, 2, 3, 4, 5]);

  const toggleWeekday = (day: number) => {
    setPeriodoWeekdays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  // Preview calculations
  const rangoTimes = React.useMemo(
    () => generateTimesForRange(rangoStart, rangoEnd, rangoDuration),
    [rangoStart, rangoEnd, rangoDuration]
  );

  const periodoDates = React.useMemo(
    () => generateDatesInRange(periodoFrom, periodoTo, periodoWeekdays),
    [periodoFrom, periodoTo, periodoWeekdays]
  );

  const periodoTimes = React.useMemo(
    () => generateTimesForRange(periodoStart, periodoEnd, periodoDuration),
    [periodoStart, periodoEnd, periodoDuration]
  );

  const periodoTotal = periodoDates.length * periodoTimes.length;

  const buildSlots = (): { date: string; time: string }[] => {
    if (mode === 'individual') return [{ date: indDate, time: indTime }];
    if (mode === 'rango') return rangoTimes.map(t => ({ date: rangoDate, time: t }));
    return periodoDates.flatMap(d => periodoTimes.map(t => ({ date: d, time: t })));
  };

  const handleSubmit = async () => {
    const slots = buildSlots();
    if (slots.length === 0) {
      setError('No se generó ningún slot. Verificá los datos ingresados.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const results = await Promise.allSettled(slots.map(s => appointmentService.createSlot(s)));
      const created = results.filter(r => r.status === 'fulfilled').length;
      const duplicates = results.filter(r => r.status === 'rejected' && (r.reason as Error).message === 'DUPLICATE').length;
      const failed = results.filter(r => r.status === 'rejected' && (r.reason as Error).message !== 'DUPLICATE').length;

      if (created === 0 && duplicates > 0) {
        setError(`Todos los horarios ya existían (${duplicates} duplicados).`);
        return;
      }
      if (failed > 0) {
        setError(`${failed} horario(s) no se pudieron crear por un error inesperado.`);
      }

      setCreatedCount(created);
      if (duplicates > 0) setError(`${duplicates} horario(s) ya existían y fueron omitidos.`);
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} />
        </div>
        <h3 className="text-xl font-bold mb-1">
          {createdCount === 1 ? '1 horario creado' : `${createdCount} horarios creados`}
        </h3>
        <p className="text-muted text-sm mb-6">Ya aparecen disponibles para los clientes.</p>
        <button
          onClick={onSuccess}
          className="px-6 py-2.5 bg-primary text-on-accent rounded-awd text-sm font-semibold hover:bg-primary-hover transition-colors"
        >
          Listo
        </button>
      </div>
    );
  }

  const MODES = [
    { id: 'individual', label: 'Individual', icon: Clock },
    { id: 'rango', label: 'Rango', icon: CalendarDays },
    { id: 'periodo', label: 'Período', icon: CalendarRange },
  ] as const;

  const labelClass = 'block text-xs font-bold uppercase tracking-wider text-muted mb-1.5';
  const inputClass = 'w-full px-3 py-2 border border-line rounded-awd text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none';

  return (
    <div>
      {/* Mode tabs */}
      <div className="flex gap-2 mb-6 bg-elevated p-1 rounded-awd">
        {MODES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setMode(id); setError(''); }}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-awd text-sm font-semibold transition-all',
              mode === id
                ? 'bg-surface text-ink shadow-sm'
                : 'text-muted hover:text-ink'
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Modo individual */}
      {mode === 'individual' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Fecha</label>
              <input type="date" value={indDate} min={today} onChange={e => setIndDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Hora</label>
              <input type="time" value={indTime} onChange={e => setIndTime(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div className="bg-elevated rounded-awd p-3 text-sm text-muted">
            Se va a crear <strong>1 horario</strong> el {indDate ? format(parseISO(indDate), "d 'de' MMMM", { locale: es }) : '—'} a las {indTime} hs.
          </div>
        </div>
      )}

      {/* Modo rango */}
      {mode === 'rango' && (
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Fecha</label>
            <input type="date" value={rangoDate} min={today} onChange={e => setRangoDate(e.target.value)} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Desde</label>
              <input type="time" value={rangoStart} onChange={e => setRangoStart(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Hasta</label>
              <input type="time" value={rangoEnd} onChange={e => setRangoEnd(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Duración de cada turno</label>
            <div className="flex gap-2">
              {DURATIONS.map(d => (
                <button
                  key={d.value}
                  onClick={() => setRangoDuration(d.value)}
                  className={cn(
                    'flex-1 py-2 rounded-awd text-xs font-bold border transition-all',
                    rangoDuration === d.value
                      ? 'bg-primary text-on-accent border-primary'
                      : 'border-line text-muted hover:border-primary/40'
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-elevated rounded-awd p-3">
            {rangoTimes.length === 0 ? (
              <p className="text-sm text-muted">El rango no genera horarios. Verificá las horas.</p>
            ) : (
              <>
                <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">
                  {rangoTimes.length} horario{rangoTimes.length > 1 ? 's' : ''} a crear
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {rangoTimes.map(t => (
                    <span key={t} className="px-2 py-1 bg-primary/10 text-primary text-xs font-mono rounded-awd">{t}</span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modo periodo */}
      {mode === 'periodo' && (
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Días de la semana</label>
            <div className="flex gap-1.5">
              {WEEKDAYS.map(d => (
                <button
                  key={d.value}
                  onClick={() => toggleWeekday(d.value)}
                  className={cn(
                    'flex-1 py-2 rounded-awd text-xs font-bold border transition-all',
                    periodoWeekdays.includes(d.value)
                      ? 'bg-primary text-on-accent border-primary'
                      : 'border-line text-muted hover:border-primary/40'
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Desde el día</label>
              <input type="date" value={periodoFrom} min={today} onChange={e => setPeriodoFrom(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Hasta el día</label>
              <input type="date" value={periodoTo} min={periodoFrom} onChange={e => setPeriodoTo(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Horario desde</label>
              <input type="time" value={periodoStart} onChange={e => setPeriodoStart(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Horario hasta</label>
              <input type="time" value={periodoEnd} onChange={e => setPeriodoEnd(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Duración de cada turno</label>
            <div className="flex gap-2">
              {DURATIONS.map(d => (
                <button
                  key={d.value}
                  onClick={() => setPeriodoDuration(d.value)}
                  className={cn(
                    'flex-1 py-2 rounded-awd text-xs font-bold border transition-all',
                    periodoDuration === d.value
                      ? 'bg-primary text-on-accent border-primary'
                      : 'border-line text-muted hover:border-primary/40'
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-elevated rounded-awd p-3">
            {periodoTotal === 0 ? (
              <p className="text-sm text-muted">
                {periodoWeekdays.length === 0 ? 'Seleccioná al menos un día.' : 'El rango no genera horarios. Verificá los datos.'}
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-bold text-muted uppercase tracking-wider">
                  {periodoTotal} horario{periodoTotal > 1 ? 's' : ''} en {periodoDates.length} día{periodoDates.length > 1 ? 's' : ''}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {periodoTimes.map(t => (
                    <span key={t} className="px-2 py-1 bg-primary/10 text-primary text-xs font-mono rounded-awd">{t}</span>
                  ))}
                </div>
                <p className="text-xs text-muted">
                  {periodoFrom && periodoTo
                    ? `Del ${format(parseISO(periodoFrom), "d 'de' MMM", { locale: es })} al ${format(parseISO(periodoTo), "d 'de' MMM", { locale: es })}`
                    : ''}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-danger bg-danger/10 px-4 py-2 rounded-awd mt-3">{error}</p>}

      <div className="flex gap-2 mt-5">
        <button
          onClick={onClose}
          className="px-4 py-2.5 border border-line rounded-awd text-sm hover:bg-elevated transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 py-2.5 bg-primary text-on-accent rounded-awd text-sm font-semibold hover:bg-primary-hover disabled:bg-line transition-colors"
        >
          {loading ? 'Creando...' : mode === 'individual' ? 'Crear horario' : 'Crear horarios'}
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase, supabaseReady } from '../lib/supabase';
import { format, parseISO, differenceInHours } from 'date-fns';
import { es } from 'date-fns/locale';
import { Appointment } from '../types';
import { CheckCircle2, XCircle, AlertTriangle, Loader2, CalendarClock, ChevronLeft } from 'lucide-react';
import { appointmentService, emailService, StaleWriteError, SlotTakenError } from '../services/api';
import { formatTime, cn } from '../lib/utils';

const CANCEL_HOURS_LIMIT = 48;

export const CancelAppointment: React.FC = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');

  const [appointment, setAppointment] = React.useState<Appointment | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [cancelling, setCancelling] = React.useState(false);
  const [status, setStatus] = React.useState<'idle' | 'success' | 'rescheduled' | 'error' | 'too-late' | 'not-found'>('idle');
  const [errorMsg, setErrorMsg] = React.useState('');
  const [emailWarning, setEmailWarning] = React.useState<string | null>(null);

  const [modo, setModo] = React.useState<'menu' | 'reprogramar'>('menu');
  const [nuevaFecha, setNuevaFecha] = React.useState(format(new Date(), 'yyyy-MM-dd'));
  const [slotsLibres, setSlotsLibres] = React.useState<Appointment[]>([]);
  const [slotElegido, setSlotElegido] = React.useState<string | null>(null);
  const [buscandoSlots, setBuscandoSlots] = React.useState(false);
  const [reprogramado, setReprogramado] = React.useState<{ date: string; time: string } | null>(null);

  React.useEffect(() => {
    if (modo !== 'reprogramar') return;
    setBuscandoSlots(true);
    setSlotElegido(null);
    appointmentService
      .getAvailableSlots(nuevaFecha)
      .then(slots => setSlotsLibres(slots.filter(s => s.status === 'available')))
      .catch(() => setSlotsLibres([]))
      .finally(() => setBuscandoSlots(false));
  }, [modo, nuevaFecha]);

  const handleReprogramar = async () => {
    if (!appointment || !slotElegido) return;
    if (!canCancel()) { setStatus('too-late'); return; }

    const destino = slotsLibres.find(s => s.id === slotElegido);
    setCancelling(true);
    try {
      await appointmentService.rescheduleAppointment(appointment.id, slotElegido);
      if (destino) setReprogramado({ date: destino.date, time: destino.time });
      setStatus('rescheduled');
    } catch (err) {
      if (err instanceof SlotTakenError) {
        setErrorMsg('Ese horario acaba de ser tomado. Tu turno original sigue en pie: elegí otro.');
        setSlotElegido(null);
        setBuscandoSlots(true);
        const slots = await appointmentService.getAvailableSlots(nuevaFecha).catch(() => []);
        setSlotsLibres(slots.filter(s => s.status === 'available'));
        setBuscandoSlots(false);
      } else {
        setErrorMsg(err instanceof Error ? err.message : 'No se pudo reprogramar.');
        setStatus('error');
      }
    } finally {
      setCancelling(false);
    }
  };

  React.useEffect(() => {
    if (!id) { setStatus('not-found'); setLoading(false); return; }
    if (!supabaseReady) { setStatus('not-found'); setLoading(false); return; }

    supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .eq('status', 'booked')
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setStatus('not-found');
        } else {
          setAppointment(data as Appointment);
        }
        setLoading(false);
      });
  }, [id]);

  const canCancel = () => {
    if (!appointment) return false;
    const appointmentDateTime = parseISO(`${appointment.date}T${appointment.time}`);
    const hoursUntil = differenceInHours(appointmentDateTime, new Date());
    return hoursUntil >= CANCEL_HOURS_LIMIT;
  };

  const handleCancel = async () => {
    if (!appointment) return;
    if (!canCancel()) { setStatus('too-late'); return; }

    setCancelling(true);
    try {
      await appointmentService.cancelBookedSlot(appointment.id);

      const mail = await emailService.sendCancellation({
        name: appointment.name!,
        email: appointment.email!,
        date: appointment.date,
        time: appointment.time,
        appointmentId: appointment.id,
        cancelledBy: 'client',
      });
      if (!mail.ok) setEmailWarning(mail.message ?? 'No se pudo notificar por email.');
      setStatus('success');
    } catch (err) {
      setErrorMsg(
        err instanceof StaleWriteError
          ? 'Este turno ya no figura como reservado. Puede que ya lo hayas cancelado.'
          : err instanceof Error ? err.message : 'Ocurrió un error inesperado.'
      );
      setStatus('error');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center text-muted">
        <Loader2 className="animate-spin mx-auto mb-4" size={32} />
        <p>Cargando turno...</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="max-w-md mx-auto mt-12 bg-surface rounded-awd border border-line shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={32} />
        </div>
        <h2 className="text-2xl font-bold mb-2">Turno cancelado</h2>
        <p className="text-muted">Tu turno fue cancelado correctamente. El horario quedó disponible nuevamente.</p>
        {emailWarning && (
          <div className="flex items-start gap-3 text-left bg-warning/10 border border-warning/30 rounded-awd p-4 mt-6">
            <AlertTriangle size={20} className="text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-ink">No pudimos enviar el aviso por email.</p>
              <p className="text-xs text-muted mt-1">La cancelación sí quedó registrada. Detalle técnico: {emailWarning}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (status === 'rescheduled') {
    return (
      <div className="max-w-md mx-auto mt-12 bg-surface rounded-awd border border-line shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto mb-6">
          <CalendarClock size={32} />
        </div>
        <h2 className="text-2xl font-bold mb-2">Turno reprogramado</h2>
        <p className="text-muted mb-6">Tu turno quedó cambiado. El horario anterior volvió a estar disponible.</p>
        {reprogramado && (
          <div className="bg-elevated rounded-awd p-4 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Nueva fecha</span>
              <span className="font-medium capitalize">
                {format(parseISO(reprogramado.date), "EEEE d 'de' MMMM", { locale: es })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Nueva hora</span>
              <span className="font-medium">{formatTime(reprogramado.time)}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (status === 'too-late') {
    return (
      <div className="max-w-md mx-auto mt-12 bg-surface rounded-awd border border-line shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-warning/10 text-warning rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-2xl font-bold mb-2">No es posible cancelar</h2>
        <p className="text-muted">Solo se puede cancelar con al menos <strong>48 horas de anticipación</strong>. Para cancelar fuera de ese plazo, contactá directamente al consultorio.</p>
      </div>
    );
  }

  if (status === 'not-found' || !appointment) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-surface rounded-awd border border-line shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle size={32} />
        </div>
        <h2 className="text-2xl font-bold mb-2">Turno no encontrado</h2>
        <p className="text-muted">El link de cancelación no es válido o el turno ya fue cancelado.</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="max-w-md mx-auto mt-12 bg-surface rounded-awd border border-line shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle size={32} />
        </div>
        <h2 className="text-2xl font-bold mb-2">Error al cancelar</h2>
        <p className="text-muted">{errorMsg || 'Ocurrió un error inesperado. Intentá de nuevo.'}</p>
      </div>
    );
  }

  const appointmentDate = parseISO(`${appointment.date}T${appointment.time}`);
  const hoursLeft = differenceInHours(appointmentDate, new Date());
  const canCancelNow = hoursLeft >= CANCEL_HOURS_LIMIT;

  return (
    <div className="max-w-md mx-auto mt-12 bg-surface rounded-awd border border-line shadow-sm p-8">
      <h2 className="text-2xl font-bold mb-1">{modo === 'menu' ? 'Tu turno' : 'Elegí el nuevo horario'}</h2>
      <p className="text-muted text-sm mb-6">
        {modo === 'menu' ? 'Podés reprogramarlo o cancelarlo.' : 'Cuando confirmes, el horario anterior queda libre.'}
      </p>

      <div className="bg-elevated rounded-awd p-4 mb-6 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted">Cliente</span>
          <span className="font-medium">{appointment.name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted">Fecha</span>
          <span className="font-medium capitalize">{format(appointmentDate, "EEEE d 'de' MMMM", { locale: es })}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted">Hora</span>
          <span className="font-medium">{format(appointmentDate, 'HH:mm')}</span>
        </div>
      </div>

      {!canCancelNow && (
        <div className="flex items-start gap-3 bg-warning/10 text-warning rounded-awd p-4 mb-6 text-sm">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <p>Quedan menos de 48 horas para el turno. Ya no es posible cancelarlo desde aquí.</p>
        </div>
      )}

      {errorMsg && modo === 'reprogramar' && (
        <div className="flex items-start gap-3 bg-warning/10 border border-warning/30 rounded-awd p-4 mb-6 text-sm">
          <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" />
          <p className="text-ink">{errorMsg}</p>
        </div>
      )}

      {modo === 'menu' ? (
        <div className="space-y-3">
          <button
            onClick={() => { setModo('reprogramar'); setErrorMsg(''); }}
            disabled={!canCancelNow}
            className="w-full py-3 flex items-center justify-center gap-2 bg-accent text-white rounded-awd font-semibold hover:bg-accent-hover disabled:bg-line disabled:text-muted disabled:cursor-not-allowed transition-colors duration-300"
          >
            <CalendarClock size={17} /> Reprogramar turno
          </button>

          {/* Destructivo: contorno + icono. El relleno queda para las acciones que avanzan. */}
          <button
            onClick={handleCancel}
            disabled={!canCancelNow || cancelling}
            className="w-full py-3 flex items-center justify-center gap-2 bg-transparent border border-danger text-danger rounded-awd font-semibold hover:bg-danger/10 disabled:border-line disabled:text-muted disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors duration-300"
          >
            <XCircle size={17} />
            {cancelling ? 'Cancelando...' : 'Cancelar turno'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] label text-muted mb-1.5">Nueva fecha</label>
            <input
              type="date"
              value={nuevaFecha}
              min={format(new Date(), 'yyyy-MM-dd')}
              onChange={e => setNuevaFecha(e.target.value)}
              className="w-full px-4 py-2.5 border border-line rounded-awd text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>

          <div>
            <label className="block text-[10px] label text-muted mb-2">Horarios disponibles</label>
            {buscandoSlots ? (
              <p className="text-sm text-muted py-4 text-center">Buscando...</p>
            ) : slotsLibres.length === 0 ? (
              <p className="text-sm text-muted py-4 text-center border border-dashed border-line rounded-awd">
                No hay horarios libres ese día.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {slotsLibres.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSlotElegido(s.id)}
                    className={cn(
                      'py-2 px-2 border rounded-awd text-sm transition-all duration-300',
                      slotElegido === s.id
                        ? 'border-accent bg-accent/10 text-accent font-semibold'
                        : 'border-line bg-surface text-ink hover:border-accent hover:text-accent'
                    )}
                  >
                    {formatTime(s.time)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => { setModo('menu'); setErrorMsg(''); }}
              className="px-4 py-2.5 border border-line rounded-awd text-sm flex items-center gap-1 hover:bg-elevated transition-colors"
            >
              <ChevronLeft size={16} /> Atrás
            </button>
            <button
              onClick={handleReprogramar}
              disabled={!slotElegido || cancelling}
              className="flex-1 py-2.5 bg-accent text-white rounded-awd text-sm font-semibold hover:bg-accent-hover disabled:bg-line disabled:text-muted disabled:cursor-not-allowed transition-colors duration-300"
            >
              {cancelling ? 'Reprogramando...' : 'Confirmar cambio'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase, supabaseReady } from '../lib/supabase';
import { format, parseISO, differenceInHours } from 'date-fns';
import { es } from 'date-fns/locale';
import { Appointment } from '../types';
import { CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { emailService } from '../services/api';

const CANCEL_HOURS_LIMIT = 48;

export const CancelAppointment: React.FC = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');

  const [appointment, setAppointment] = React.useState<Appointment | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [cancelling, setCancelling] = React.useState(false);
  const [status, setStatus] = React.useState<'idle' | 'success' | 'error' | 'too-late' | 'not-found'>('idle');
  const [errorMsg, setErrorMsg] = React.useState('');

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
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'available', name: null, email: null, phone: null, notes: null })
      .eq('id', appointment.id)
      .eq('status', 'booked');

    if (error) {
      setErrorMsg(error.message);
      setStatus('error');
    } else {
      await emailService.sendCancellation({
        name: appointment.name!,
        email: appointment.email!,
        date: appointment.date,
        time: appointment.time,
        appointmentId: appointment.id,
        cancelledBy: 'patient',
      });
      setStatus('success');
    }
    setCancelling(false);
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center text-slate-400">
        <Loader2 className="animate-spin mx-auto mb-4" size={32} />
        <p>Cargando turno...</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="max-w-md mx-auto mt-12 bg-white rounded-2xl border border-border-gray shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={32} />
        </div>
        <h2 className="text-2xl font-bold mb-2">Turno cancelado</h2>
        <p className="text-slate-500">Tu turno fue cancelado correctamente. El horario quedó disponible nuevamente.</p>
      </div>
    );
  }

  if (status === 'too-late') {
    return (
      <div className="max-w-md mx-auto mt-12 bg-white rounded-2xl border border-border-gray shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-2xl font-bold mb-2">No es posible cancelar</h2>
        <p className="text-slate-500">Solo se puede cancelar con al menos <strong>48 horas de anticipación</strong>. Para cancelar fuera de ese plazo, contactá directamente al consultorio.</p>
      </div>
    );
  }

  if (status === 'not-found' || !appointment) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-white rounded-2xl border border-border-gray shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle size={32} />
        </div>
        <h2 className="text-2xl font-bold mb-2">Turno no encontrado</h2>
        <p className="text-slate-500">El link de cancelación no es válido o el turno ya fue cancelado.</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="max-w-md mx-auto mt-12 bg-white rounded-2xl border border-border-gray shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle size={32} />
        </div>
        <h2 className="text-2xl font-bold mb-2">Error al cancelar</h2>
        <p className="text-slate-500">{errorMsg || 'Ocurrió un error inesperado. Intentá de nuevo.'}</p>
      </div>
    );
  }

  const appointmentDate = parseISO(`${appointment.date}T${appointment.time}`);
  const hoursLeft = differenceInHours(appointmentDate, new Date());
  const canCancelNow = hoursLeft >= CANCEL_HOURS_LIMIT;

  return (
    <div className="max-w-md mx-auto mt-12 bg-white rounded-2xl border border-border-gray shadow-sm p-8">
      <h2 className="text-2xl font-bold mb-1">Cancelar turno</h2>
      <p className="text-slate-500 text-sm mb-6">Revisá los datos antes de confirmar.</p>

      <div className="bg-slate-50 rounded-xl p-4 mb-6 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Paciente</span>
          <span className="font-medium">{appointment.name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Fecha</span>
          <span className="font-medium capitalize">{format(appointmentDate, "EEEE d 'de' MMMM", { locale: es })}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Hora</span>
          <span className="font-medium">{format(appointmentDate, 'HH:mm')}</span>
        </div>
      </div>

      {!canCancelNow && (
        <div className="flex items-start gap-3 bg-amber-50 text-amber-700 rounded-xl p-4 mb-6 text-sm">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <p>Quedan menos de 48 horas para el turno. Ya no es posible cancelarlo desde aquí.</p>
        </div>
      )}

      <button
        onClick={handleCancel}
        disabled={!canCancelNow || cancelling}
        className="w-full py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all"
      >
        {cancelling ? 'Cancelando...' : 'Confirmar cancelación'}
      </button>
    </div>
  );
};

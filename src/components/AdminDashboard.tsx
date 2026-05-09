import React from 'react';
import { appointmentService } from '../services/api';
import { Appointment, AppointmentStatus } from '../types';
import { formatTime, formatDate, cn } from '../lib/utils';
import { Plus, Calendar as CalendarIcon, CheckCircle, Trash2, Mail, Lock, Image } from 'lucide-react';
import { format } from 'date-fns';
import { GmailSetup } from './GmailSetup';
import { ChangePassword } from './ChangePassword';
import { CreateSlotsModal } from './CreateSlotsModal';
import { PhotoUpload } from './PhotoUpload';
import { ConfirmModal } from './ConfirmModal';
import { WeekView } from './WeekView';

export const AdminDashboard: React.FC = () => {
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filterDate, setFilterDate] = React.useState(format(new Date(), 'yyyy-MM-dd'));
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [showGmailSetup, setShowGmailSetup] = React.useState(false);
  const [showChangePassword, setShowChangePassword] = React.useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState<{ id: string; status: string } | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [view, setView] = React.useState<'day' | 'week'>('day');

  const loadAppointments = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await appointmentService.getAllAppointments();
      setAppointments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    try {
      await appointmentService.updateAppointmentStatus(id, status);
      loadAppointments();
    } catch {
      setErrorMsg('No se pudo actualizar el estado. Intentá de nuevo.');
    }
  };

  const handleDelete = (id: string, status: string) => {
    setConfirmDelete({ id, status });
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    try {
      await appointmentService.deleteAppointment(confirmDelete.id);
      loadAppointments();
    } catch {
      setErrorMsg('No se pudo eliminar el horario. Intentá de nuevo.');
    } finally {
      setConfirmDelete(null);
    }
  };


  const stats = {
    total: appointments.filter(a => a.date === filterDate).length,
    booked: appointments.filter(a => a.date === filterDate && a.status === 'booked').length,
    available: appointments.filter(a => a.date === filterDate && a.status === 'available').length,
  };

  return (
    <div className="grid grid-cols-12 gap-8">
      {/* Header */}
      <div className="col-span-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-border-gray shadow-sm">
        <div>
          <h2 className="text-xl font-bold">Panel de Control</h2>
          <p className="text-sm text-slate-500">Gestión de turnos y disponibilidad.</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {/* Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-lg">
            {(['day', 'week'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
                  view === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {v === 'day' ? 'Día' : 'Semana'}
              </button>
            ))}
          </div>
          {view === 'day' && (
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-slate-900 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-800 transition-colors"
          >
            <Plus size={14} /> Nuevo Horario
          </button>
        </div>
      </div>

      {/* Main content */}
      {view === 'week' ? (
        <div className="col-span-12 bg-white rounded-2xl shadow-sm border border-border-gray p-6">
          <WeekView
            appointments={appointments}
            loading={loading}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
          />
        </div>
      ) : (
      <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl shadow-sm border border-border-gray overflow-hidden">
        <div className="px-6 py-4 border-b border-border-gray bg-slate-50">
          <h3 className="font-semibold text-sm">Consultas para {formatDate(filterDate)}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-3">Paciente</th>
                <th className="px-6 py-3">Hora</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">Cargando...</td></tr>
              ) : appointments.filter(a => a.date === filterDate).length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">No hay turnos creados para este día.</td></tr>
              ) : (
                appointments.filter(a => a.date === filterDate).map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4">
                      {apt.status === 'available' ? (
                        <span className="text-slate-300 italic text-sm">Libre</span>
                      ) : (
                        <div>
                          <div className="font-medium text-slate-900">{apt.name}</div>
                          <div className="text-[10px] text-slate-400">{apt.email} • {apt.phone || 'Sin tel'}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-600">{formatTime(apt.time)}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded text-[9px] font-bold uppercase",
                        apt.status === 'available' && "bg-green-50 text-green-600",
                        apt.status === 'booked' && "bg-blue-50 text-blue-600",
                        apt.status === 'completed' && "bg-slate-100 text-slate-400",
                        apt.status === 'cancelled' && "bg-red-50 text-red-600",
                      )}>
                        {{ available: 'Disponible', booked: 'Reservado', completed: 'Completado', cancelled: 'Cancelado' }[apt.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        {apt.status === 'booked' && (
                          <button onClick={() => handleStatusChange(apt.id, 'completed')} className="p-1.5 text-slate-400 hover:text-green-600" title="Completar"><CheckCircle size={16}/></button>
                        )}
                        <button onClick={() => handleDelete(apt.id, apt.status)} className="p-1.5 text-slate-400 hover:text-red-600" title="Eliminar"><Trash2 size={16}/></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Stats Summary & Quick Filter */}
      {view !== 'week' && <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
        <div className="bg-primary p-6 rounded-2xl border border-white text-white shadow-lg shadow-green-900/10">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-80">Resumen del día</p>
          <div className="flex items-end justify-between">
            <p className="text-4xl font-bold">{stats.total}</p>
            <CalendarIcon className="opacity-20" size={48} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-white/10 p-2 rounded-lg">
              <p className="text-[9px] uppercase font-bold opacity-70">Reservados</p>
              <p className="text-lg font-bold">{stats.booked}</p>
            </div>
            <div className="bg-white/10 p-2 rounded-lg">
              <p className="text-[9px] uppercase font-bold opacity-70">Disponibles</p>
              <p className="text-lg font-bold">{stats.available}</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowPhotoUpload(true)}
          className="w-full flex items-center gap-3 bg-white p-4 rounded-2xl border border-border-gray hover:border-primary/40 hover:bg-primary/5 transition-colors group"
        >
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <Image size={18} />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-800">Foto de Perfil</p>
            <p className="text-xs text-slate-400">Subir foto de perfil</p>
          </div>
        </button>

        <button
          onClick={() => setShowGmailSetup(true)}
          className="w-full flex items-center gap-3 bg-white p-4 rounded-2xl border border-border-gray hover:border-primary/40 hover:bg-primary/5 transition-colors group"
        >
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <Mail size={18} />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-800">Configurar Email</p>
            <p className="text-xs text-slate-400">Conectar Gmail para enviar confirmaciones</p>
          </div>
        </button>

        <button
          onClick={() => setShowChangePassword(true)}
          className="w-full flex items-center gap-3 bg-white p-4 rounded-2xl border border-border-gray hover:border-primary/40 hover:bg-primary/5 transition-colors group"
        >
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <Lock size={18} />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-800">Cambiar Contraseña</p>
            <p className="text-xs text-slate-400">Actualizar la contraseña de acceso</p>
          </div>
        </button>

        <div className="bg-white p-6 rounded-2xl border border-border-gray">
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Ayuda de Estados</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-slate-600">Disponible: listo para reservar.</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-slate-600">Reservado: turno tomado por un paciente.</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-slate-400"></div>
              <span className="text-slate-600">Completado: sesión finalizada.</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-red-400"></div>
              <span className="text-slate-600">Cancelado: turno cancelado por el paciente.</span>
            </div>
          </div>
        </div>
      </div>}

      {/* Error toast */}
      {errorMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] bg-red-500 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg flex items-center gap-3">
          {errorMsg}
          <button onClick={() => setErrorMsg(null)} className="text-white/70 hover:text-white text-lg leading-none">×</button>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <ConfirmModal
          title={confirmDelete.status === 'booked' ? 'Turno reservado' : 'Eliminar horario'}
          message={confirmDelete.status === 'booked'
            ? '¿Querés eliminar este turno de todas formas?'
            : '¿Seguro querés eliminar este horario?'}
          warning={confirmDelete.status === 'booked'
            ? 'El paciente NO recibirá ninguna notificación de la cancelación.'
            : undefined}
          confirmLabel="Eliminar"
          onConfirm={executeDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* Photo Upload Modal */}
      {showPhotoUpload && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Foto de Perfil</h3>
              <button onClick={() => setShowPhotoUpload(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>
            <PhotoUpload onComplete={() => setShowPhotoUpload(false)} />
          </div>
        </div>
      )}

      {/* Gmail Setup Modal */}
      {showGmailSetup && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Configurar Email</h3>
              <button onClick={() => setShowGmailSetup(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>
            <GmailSetup onComplete={() => setShowGmailSetup(false)} />
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Cambiar Contraseña</h3>
              <button onClick={() => setShowChangePassword(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>
            <ChangePassword onComplete={() => setShowChangePassword(false)} />
          </div>
        </div>
      )}

      {/* Create Slots Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Nuevo Horario</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>
            <CreateSlotsModal
              onClose={() => setShowAddModal(false)}
              onSuccess={() => { setShowAddModal(false); loadAppointments(); }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

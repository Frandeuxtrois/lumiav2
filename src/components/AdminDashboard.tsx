import React from 'react';
import { appointmentService, emailService } from '../services/api';
import { Appointment, AppointmentStatus } from '../types';
import { formatTime, formatDate, cn } from '../lib/utils';
import { Plus, Calendar as CalendarIcon, CheckCircle, Trash2, Mail, Lock, Image, BookOpen, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { GmailSetup } from './GmailSetup';
import { ChangePassword } from './ChangePassword';
import { CreateSlotsModal } from './CreateSlotsModal';
import { PhotoUpload } from './PhotoUpload';
import { ConfirmModal } from './ConfirmModal';
import { WeekView } from './WeekView';
import { Manual } from './Manual';

export const AdminDashboard: React.FC = () => {
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filterDate, setFilterDate] = React.useState(format(new Date(), 'yyyy-MM-dd'));
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [showGmailSetup, setShowGmailSetup] = React.useState(false);
  const [showChangePassword, setShowChangePassword] = React.useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState<{ id: string; status: string; name?: string; email?: string; date?: string; time?: string } | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [view, setView] = React.useState<'day' | 'week'>('day');
  const [showManual, setShowManual] = React.useState(false);

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
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo actualizar el estado. Intentá de nuevo.');
      loadAppointments();
    }
  };

  const handleDelete = (id: string, status: string) => {
    const apt = appointments.find(a => a.id === id);
    setConfirmDelete({
      id, status,
      name: apt?.name ?? undefined,
      email: apt?.email ?? undefined,
      date: apt?.date,
      time: apt?.time,
    });
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    try {
      await appointmentService.deleteAppointment(confirmDelete.id);
      if (confirmDelete.status === 'booked' && confirmDelete.email && confirmDelete.name) {
        const mail = await emailService.sendCancellation({
          name: confirmDelete.name,
          email: confirmDelete.email,
          date: confirmDelete.date!,
          time: confirmDelete.time!,
          appointmentId: confirmDelete.id,
          cancelledBy: 'owner',
        });
        if (!mail.ok) {
          setErrorMsg(`El turno se eliminó, pero no se pudo avisar a ${confirmDelete.name} por email: ${mail.message}`);
        }
      }
      loadAppointments();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo eliminar el horario. Intentá de nuevo.');
      loadAppointments();
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
      <div className="col-span-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface p-6 rounded-awd border border-line shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold">Panel de Control</h2>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted border border-line rounded px-1.5 py-0.5">Turnos AWD</span>
          </div>
          <p className="text-sm text-muted">Gestión de turnos y disponibilidad.</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {/* Tabs */}
          <div className="flex bg-elevated p-1 rounded-awd">
            {(['day', 'week'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  'px-3 py-1.5 rounded-awd text-xs font-semibold transition-all',
                  view === v ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'
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
              className="px-3 py-2 border border-line rounded-awd text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-ink text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-awd flex items-center gap-2 hover:bg-accent transition-colors"
          >
            <Plus size={14} /> Nuevo Horario
          </button>
        </div>
      </div>

      {/* Main content */}
      {view === 'week' ? (
        <div className="col-span-12 bg-surface rounded-awd shadow-sm border border-line p-6">
          <WeekView
            appointments={appointments}
            loading={loading}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
          />
        </div>
      ) : (
      <div className="col-span-12 lg:col-span-8 bg-surface rounded-awd shadow-sm border border-line overflow-hidden">
        <div className="px-6 py-4 border-b border-line bg-elevated">
          <h3 className="font-semibold text-sm">Turnos para {formatDate(filterDate)}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-elevated/50 text-[10px] font-bold text-muted uppercase tracking-widest">
                <th className="px-6 py-3">Cliente</th>
                <th className="px-6 py-3">Hora</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-muted">Cargando...</td></tr>
              ) : appointments.filter(a => a.date === filterDate).length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-muted">No hay turnos creados para este día.</td></tr>
              ) : (
                appointments.filter(a => a.date === filterDate).map((apt) => (
                  <tr key={apt.id} className="hover:bg-elevated/30 transition-colors">
                    <td className="px-6 py-4">
                      {apt.status === 'available' ? (
                        <span className="text-muted italic text-sm">Libre</span>
                      ) : (
                        <div>
                          <div className="font-medium text-ink">{apt.name}</div>
                          <div className="text-[10px] text-muted">{apt.email} • {apt.phone || 'Sin tel'}</div>
                          {apt.notes && (
                            <div className="mt-1.5 flex items-start gap-1.5 text-[11px] text-ink bg-warning/10 border-l-2 border-warning rounded-r-awd px-2 py-1 max-w-xs">
                              <MessageSquare size={11} className="text-warning shrink-0 mt-0.5" />
                              <span>{apt.notes}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-muted">{formatTime(apt.time)}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded text-[9px] font-bold uppercase",
                        apt.status === 'available' && "bg-accent/10 text-accent",
                        apt.status === 'booked' && "bg-info/10 text-info",
                        apt.status === 'completed' && "bg-elevated text-muted",
                        apt.status === 'cancelled' && "bg-danger/10 text-danger",
                      )}>
                        {{ available: 'Disponible', booked: 'Reservado', completed: 'Completado', cancelled: 'Cancelado' }[apt.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        {apt.status === 'booked' && (
                          <button onClick={() => handleStatusChange(apt.id, 'completed')} className="p-1.5 text-muted hover:text-accent" title="Completar"><CheckCircle size={16}/></button>
                        )}
                        <button onClick={() => handleDelete(apt.id, apt.status)} className="p-1.5 text-muted hover:text-danger" title="Eliminar"><Trash2 size={16}/></button>
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
        <div className="bg-primary p-6 rounded-awd border border-white text-white shadow-lg shadow-awd">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-80">Resumen del día</p>
          <div className="flex items-end justify-between">
            <p className="text-4xl font-bold">{stats.total}</p>
            <CalendarIcon className="opacity-20" size={48} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-surface/10 p-2 rounded-awd">
              <p className="text-[9px] uppercase font-bold opacity-70">Reservados</p>
              <p className="text-lg font-bold">{stats.booked}</p>
            </div>
            <div className="bg-surface/10 p-2 rounded-awd">
              <p className="text-[9px] uppercase font-bold opacity-70">Disponibles</p>
              <p className="text-lg font-bold">{stats.available}</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowManual(true)}
          className="w-full flex items-center gap-3 bg-surface p-4 rounded-awd border border-line hover:border-primary/40 hover:bg-primary/5 transition-colors group"
        >
          <div className="w-9 h-9 rounded-awd bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <BookOpen size={18} />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-ink">Manual de Uso</p>
            <p className="text-xs text-muted">Guía completa del sistema</p>
          </div>
        </button>

        <button
          onClick={() => setShowPhotoUpload(true)}
          className="w-full flex items-center gap-3 bg-surface p-4 rounded-awd border border-line hover:border-primary/40 hover:bg-primary/5 transition-colors group"
        >
          <div className="w-9 h-9 rounded-awd bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <Image size={18} />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-ink">Foto de Perfil</p>
            <p className="text-xs text-muted">Subir foto de perfil</p>
          </div>
        </button>

        <button
          onClick={() => setShowGmailSetup(true)}
          className="w-full flex items-center gap-3 bg-surface p-4 rounded-awd border border-line hover:border-primary/40 hover:bg-primary/5 transition-colors group"
        >
          <div className="w-9 h-9 rounded-awd bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <Mail size={18} />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-ink">Configurar Email</p>
            <p className="text-xs text-muted">Conectar Gmail para enviar confirmaciones</p>
          </div>
        </button>

        <button
          onClick={() => setShowChangePassword(true)}
          className="w-full flex items-center gap-3 bg-surface p-4 rounded-awd border border-line hover:border-primary/40 hover:bg-primary/5 transition-colors group"
        >
          <div className="w-9 h-9 rounded-awd bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <Lock size={18} />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-ink">Cambiar Contraseña</p>
            <p className="text-xs text-muted">Actualizar la contraseña de acceso</p>
          </div>
        </button>

        <div className="bg-surface p-6 rounded-awd border border-line">
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted mb-4">Ayuda de Estados</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-accent/100"></div>
              <span className="text-muted">Disponible: listo para reservar.</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-info/100"></div>
              <span className="text-muted">Reservado: turno tomado por un cliente.</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-muted"></div>
              <span className="text-muted">Completado: turno finalizado.</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-danger"></div>
              <span className="text-muted">Cancelado: turno cancelado por el cliente.</span>
            </div>
          </div>
        </div>
      </div>}

      {/* Manual */}
      {showManual && <Manual onClose={() => setShowManual(false)} />}

      {/* Error toast */}
      {errorMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] bg-danger text-white text-sm font-medium px-5 py-3 rounded-awd shadow-lg flex items-center gap-3">
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
            ? 'Se le enviará un email de cancelación al cliente automáticamente.'
            : undefined}
          confirmLabel="Eliminar"
          onConfirm={executeDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* Photo Upload Modal */}
      {showPhotoUpload && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-surface rounded-awd p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Foto de Perfil</h3>
              <button onClick={() => setShowPhotoUpload(false)} className="text-muted hover:text-muted text-xl leading-none">×</button>
            </div>
            <PhotoUpload onComplete={() => setShowPhotoUpload(false)} />
          </div>
        </div>
      )}

      {/* Gmail Setup Modal */}
      {showGmailSetup && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-surface rounded-awd p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Configurar Email</h3>
              <button onClick={() => setShowGmailSetup(false)} className="text-muted hover:text-muted text-xl leading-none">×</button>
            </div>
            <GmailSetup onComplete={() => setShowGmailSetup(false)} />
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-surface rounded-awd p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Cambiar Contraseña</h3>
              <button onClick={() => setShowChangePassword(false)} className="text-muted hover:text-muted text-xl leading-none">×</button>
            </div>
            <ChangePassword onComplete={() => setShowChangePassword(false)} />
          </div>
        </div>
      )}

      {/* Create Slots Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-surface rounded-awd p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Nuevo Horario</h3>
              <button onClick={() => setShowAddModal(false)} className="text-muted hover:text-muted text-xl leading-none">×</button>
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

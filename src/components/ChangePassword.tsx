import React from 'react';
import { Lock, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Props {
  onComplete: () => void;
}

export const ChangePassword: React.FC<Props> = ({ onComplete }) => {
  const [current, setCurrent] = React.useState('');
  const [next, setNext] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [done, setDone] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirm) {
      setError('Las contraseñas nuevas no coinciden.');
      return;
    }
    if (next.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: (await supabase.auth.getUser()).data.user?.email ?? '',
        password: current,
      });
      if (signInError) throw new Error('La contraseña actual es incorrecta.');

      const { error: updateError } = await supabase.auth.updateUser({ password: next });
      if (updateError) throw updateError;

      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={32} />
        </div>
        <h3 className="text-xl font-bold mb-2">¡Contraseña actualizada!</h3>
        <p className="text-muted text-sm mb-6">La próxima vez que inicies sesión usá la nueva contraseña.</p>
        <button
          onClick={onComplete}
          className="px-6 py-3 bg-primary text-on-accent rounded-awd font-medium hover:bg-primary-hover transition-colors"
        >
          Volver al panel
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-primary/10 text-primary rounded-awd flex items-center justify-center mx-auto mb-4">
          <Lock size={28} />
        </div>
        <h3 className="text-xl font-bold text-ink mb-1">Cambiar contraseña</h3>
        <p className="text-muted text-sm">Ingresá tu contraseña actual y la nueva.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">Contraseña actual</label>
          <input
            type="password"
            required
            value={current}
            onChange={e => setCurrent(e.target.value)}
            className="w-full px-4 py-2.5 border border-line rounded-awd focus:ring-2 focus:ring-primary/20 focus:outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">Nueva contraseña</label>
          <input
            type="password"
            required
            value={next}
            onChange={e => setNext(e.target.value)}
            className="w-full px-4 py-2.5 border border-line rounded-awd focus:ring-2 focus:ring-primary/20 focus:outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">Confirmar nueva contraseña</label>
          <input
            type="password"
            required
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className="w-full px-4 py-2.5 border border-line rounded-awd focus:ring-2 focus:ring-primary/20 focus:outline-none text-sm"
          />
        </div>

        {error && <p className="text-sm text-danger bg-danger/10 px-4 py-2 rounded-awd">{error}</p>}

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onComplete}
            className="px-4 py-2.5 border border-line rounded-awd text-sm hover:bg-elevated transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 bg-primary text-on-accent rounded-awd text-sm font-semibold hover:bg-primary-hover disabled:bg-line transition-colors"
          >
            {loading ? 'Guardando...' : 'Cambiar contraseña'}
          </button>
        </div>
      </form>
    </div>
  );
};

import React from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export const Auth: React.FC = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/admin');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-surface rounded-awd shadow-sm border border-line p-8">
      <h2 className="text-2xl font-bold mb-2">Acceso Admin</h2>
      <p className="text-sm text-muted mb-6">Ingresa tus credenciales para administrar el sistema.</p>
      
      <form onSubmit={handleLogin} className="space-y-4">
        {error && (
          <div className="p-3 bg-danger/10 text-danger text-sm rounded-awd border border-danger/25">
            {error}
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-line rounded-awd focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">Contraseña</label>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-line rounded-awd focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <button
          disabled={loading}
          className="w-full bg-primary text-white font-medium py-3 rounded-awd shadow-lg shadow-awd hover:bg-primary-hover disabled:bg-line transition-all mt-4"
        >
          {loading ? 'Iniciando sesión...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
};

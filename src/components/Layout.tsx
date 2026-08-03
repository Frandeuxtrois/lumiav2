import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { useBusinessName } from '../lib/useBusinessName';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
}

const useClock = () => {
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  const dia = now.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
  const hora = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  return `${dia} · ${hora}`;
};

export const Layout: React.FC<LayoutProps> = ({ children, user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const clock = useClock();
  const businessName = useBusinessName();

  // La atribucion al proveedor no va en las pantallas internas del negocio.
  const isPublicPage = !['/admin', '/login'].includes(location.pathname);

  React.useEffect(() => {
    document.title = businessName;
  }, [businessName]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="h-16 bg-white border-b border-border-gray px-4 md:px-8 flex items-center justify-between sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-3 decoration-none">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full"></div>
          </div>
          <span className="text-xl font-medium tracking-tight text-primary hidden sm:block">{businessName}</span>
        </Link>
        <div className="flex items-center gap-4 md:gap-6">
          <span className="text-xs font-mono text-slate-400 hidden md:inline">{clock}</span>
          {user ? (
            <div className="flex items-center gap-4">
              <Link to="/admin" className="text-sm font-medium text-slate-600 hover:text-primary">Panel Admin</Link>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Salir
              </button>
            </div>
          ) : (
            <Link 
              to="/login"
              className="px-4 py-2 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Admin Login
            </Link>
          )}
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
        {children}
      </main>

      <footer className="h-12 bg-white border-t border-border-gray flex items-center px-4 md:px-8 text-[11px] text-slate-400 justify-between">
        {isPublicPage ? (
          <span>
            Sistema de turnos por{' '}
            <a
              href="https://argentinawebdesign.com.ar"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-primary underline underline-offset-2 transition-colors"
            >
              Argentina Web Design
            </a>
          </span>
        ) : (
          <span className="uppercase tracking-[2px]">Turnos AWD</span>
        )}
      </footer>
    </div>
  );
};

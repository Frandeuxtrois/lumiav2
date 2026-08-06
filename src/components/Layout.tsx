import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { useBusinessName } from '../lib/usePublicProfile';
import { useTheme } from '../lib/useTheme';
import { cn } from '../lib/utils';

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

const useScrolled = (threshold = 8) => {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
};

export const Layout: React.FC<LayoutProps> = ({ children, user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const clock = useClock();
  const businessName = useBusinessName();
  const { theme, toggleTheme } = useTheme();
  const scrolled = useScrolled();

  // La atribucion al proveedor no va en las pantallas internas del negocio.
  const isPublicPage = !['/admin', '/login'].includes(location.pathname);

  React.useEffect(() => {
    document.title = businessName;
  }, [businessName]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const ghostButton =
    'px-4 py-2 text-sm font-medium border border-line rounded-awd hover:border-accent hover:text-accent transition-colors duration-300';

  return (
    <div className="min-h-screen flex flex-col">
      <nav
        className={cn(
          'h-16 px-4 md:px-8 flex items-center justify-between sticky top-0 z-50 transition-all duration-300',
          scrolled ? 'glass shadow-awd' : 'bg-canvas border-b border-line'
        )}
      >
        <Link to="/" className="flex items-center gap-3 decoration-none">
          <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-canvas rounded-full"></div>
          </div>
          <span className="text-xl font-display font-bold tracking-tight text-ink hidden sm:block">
            {businessName}
          </span>
        </Link>

        <div className="flex items-center gap-3 md:gap-5">
          <span className="text-xs text-muted hidden md:inline">{clock}</span>

          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            title={theme === 'dark' ? 'Tema claro' : 'Tema oscuro'}
            className="w-9 h-9 rounded-full border border-line flex items-center justify-center text-muted hover:text-accent hover:border-accent transition-colors duration-300"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/admin" className="text-sm font-medium text-muted hover:text-accent transition-colors">
                Panel Admin
              </Link>
              <button onClick={handleLogout} className={ghostButton}>
                Salir
              </button>
            </div>
          ) : (
            <Link to="/login" className={ghostButton}>
              Admin Login
            </Link>
          )}
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">{children}</main>

      <footer className="h-12 border-t border-line flex items-center px-4 md:px-8 text-[11px] text-muted justify-between">
        {isPublicPage ? (
          <span>
            Sistema de turnos por{' '}
            <a
              href="https://argentinawebdesign.com.ar"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink hover:text-accent underline underline-offset-2 transition-colors duration-300"
            >
              Argentina Web Design
            </a>
          </span>
        ) : (
          <span className="label text-[10px]">Turnos AWD</span>
        )}
      </footer>
    </div>
  );
};

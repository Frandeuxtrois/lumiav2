import React from 'react';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'awd-theme';

// Default dark, como manda el sistema AWD. El script inline de index.html ya
// aplico la clase antes del primer paint: esto solo mantiene React en sincronia.
const readStoredTheme = (): Theme => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
};

export const useTheme = () => {
  const [theme, setTheme] = React.useState<Theme>(readStoredTheme);

  React.useEffect(() => {
    document.body.classList.toggle('dark-mode', theme === 'dark');
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // navegacion privada: el tema no persiste, pero la sesion funciona igual
    }
  }, [theme]);

  return {
    theme,
    toggleTheme: () => setTheme(t => (t === 'dark' ? 'light' : 'dark')),
  };
};

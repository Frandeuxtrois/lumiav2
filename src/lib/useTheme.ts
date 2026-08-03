import React from 'react';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'awd-theme';

// Default light mientras dure la migracion de colores hardcodeados; el sistema
// AWD es dark-first y vuelve a serlo cuando terminen las fases 2 y 3.
// El script inline de index.html ya aplico la clase antes del primer paint:
// esto solo mantiene React en sincronia con lo que ya esta puesto.
const readStoredTheme = (): Theme => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
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

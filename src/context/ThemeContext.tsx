import React, { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from 'react';
import { DEFAULT_THEME_ID, THEME_PRESETS, getThemePreset, isThemeId, themeVariables } from '../lib/themes';
import type { ThemePreset } from '../lib/themes';
import { useAuth } from './AuthContext';
import { useDentalFlow } from './DentalFlowContext';
import type { ThemeId } from '../types';

interface ThemeContextValue {
  themeId: ThemeId;
  preset: ThemePreset;
  presets: ThemePreset[];
  setTheme: (id: ThemeId) => void;
  /** El súper administrador no tiene cuenta de cliente: guarda su tema local. */
  canPersistToAccount: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Cache local del último tema aplicado. Evita el parpadeo al recargar y da un
 * tema al súper administrador, que no está asociado a ninguna cuenta.
 */
const THEME_KEY = 'dentalflow.theme.v1';

const readCachedTheme = (): ThemeId | undefined => {
  if (typeof window === 'undefined') return undefined;
  const value = window.localStorage.getItem(THEME_KEY);
  return isThemeId(value ?? undefined) ? (value as ThemeId) : undefined;
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { currentUser } = useAuth();
  const { getClientById, updateClientAccount } = useDentalFlow();

  const [localThemeId, setLocalThemeId] = useState<ThemeId>(() => readCachedTheme() ?? DEFAULT_THEME_ID);

  const client = getClientById(currentUser?.clientId);
  const clientId = client?.id;
  // El tema de la cuenta manda; el local cubre al súper administrador y a la
  // pantalla de login, donde todavía no hay cliente.
  const preset = getThemePreset(client?.theme ?? localThemeId);

  useLayoutEffect(() => {
    const root = document.documentElement;
    Object.entries(themeVariables(preset)).forEach(([name, value]) => {
      root.style.setProperty(name, value);
    });
    window.localStorage.setItem(THEME_KEY, preset.id);
  }, [preset]);

  const setTheme = useCallback((id: ThemeId) => {
    setLocalThemeId(id);
    if (clientId) updateClientAccount(clientId, { theme: id });
  }, [clientId, updateClientAccount]);

  const value = useMemo<ThemeContextValue>(() => ({
    themeId: preset.id,
    preset,
    presets: THEME_PRESETS,
    setTheme,
    canPersistToAccount: Boolean(clientId),
  }), [preset, setTheme, clientId]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider');
  }

  return context;
};

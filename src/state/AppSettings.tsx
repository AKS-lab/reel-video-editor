import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark';
export type ColorBlindMode = 'off' | 'protanopia' | 'deuteranopia' | 'tritanopia';

export type AppSettings = {
  theme: ThemeMode;
  colorBlind: ColorBlindMode;
  highContrast: boolean;
  notificationsEnabled: boolean;
  language: string;
};

const STORAGE_KEY = 'reelcreator-settings';

const defaultSettings: AppSettings = {
  theme: 'dark',
  colorBlind: 'off',
  highContrast: false,
  notificationsEnabled: true,
  language: typeof navigator !== 'undefined' ? navigator.language.split('-')[0]! : 'en',
};

type Ctx = {
  settings: AppSettings;
  setSettings: (p: Partial<AppSettings>) => void;
  toggleTheme: () => void;
};

const AppSettingsContext = createContext<Ctx | null>(null);

function load(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
}

export function AppSettingsProvider({ children }: { children: ReactNode }): JSX.Element {
  const [settings, setState] = useState<AppSettings>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* quota */
    }
  }, [settings]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = settings.theme;
    root.dataset.colorblind = settings.colorBlind;
    root.dataset.contrast = settings.highContrast ? 'high' : 'normal';
  }, [settings.theme, settings.colorBlind, settings.highContrast]);

  const setSettings = useCallback((p: Partial<AppSettings>) => {
    setState((s) => ({ ...s, ...p }));
  }, []);

  const toggleTheme = useCallback(() => {
    setState((s) => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' }));
  }, []);

  const value = useMemo(() => ({ settings, setSettings, toggleTheme }), [settings, setSettings, toggleTheme]);

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}

export function useAppSettings(): Ctx {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) throw new Error('AppSettingsProvider missing');
  return ctx;
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

/**
 * Версия для слабовидящих.
 * Настройки хранятся в localStorage (браузер помнит их и после перезагрузки)
 * и применяются атрибутами на <html>: data-a11y-font, data-a11y-scheme и т.д.
 * Сами стили для этих атрибутов — в styles/index.css.
 */

export type A11ySettings = {
  font: 'normal' | 'large' | 'xlarge';
  scheme: 'default' | 'bw' | 'wb' | 'blue';
  images: 'on' | 'off';
  spacing: 'normal' | 'wide';
};

const DEFAULTS: A11ySettings = { font: 'normal', scheme: 'default', images: 'on', spacing: 'normal' };
const STORAGE_KEY = 'itcube-a11y';

// localStorage может быть недоступен (приватный режим) — тогда просто работаем без сохранения
function load(): A11ySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

function save(settings: A11ySettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ничего страшного: настройки просто не запомнятся
  }
}

type ContextValue = {
  settings: A11ySettings;
  // true — включена хотя бы одна настройка, отличная от обычной
  active: boolean;
  panelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
  update: <K extends keyof A11ySettings>(key: K, value: A11ySettings[K]) => void;
  reset: () => void;
};

const AccessibilityContext = createContext<ContextValue | null>(null);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<A11ySettings>(load);
  const active = (Object.keys(DEFAULTS) as (keyof A11ySettings)[]).some((key) => settings[key] !== DEFAULTS[key]);
  // Панель настроек открыта, если версия уже включена (например, с прошлого визита)
  const [panelOpen, setPanelOpen] = useState(active);

  // Применяем настройки к <html>: обычные значения не ставим вовсе
  useEffect(() => {
    const root = document.documentElement;
    (Object.keys(DEFAULTS) as (keyof A11ySettings)[]).forEach((key) => {
      const attr = `data-a11y-${key}`;
      if (settings[key] === DEFAULTS[key]) root.removeAttribute(attr);
      else root.setAttribute(attr, settings[key]);
    });
    save(settings);
  }, [settings]);

  const update = useCallback<ContextValue['update']>((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const reset = useCallback(() => {
    setSettings(DEFAULTS);
    setPanelOpen(false);
  }, []);

  const value = useMemo(() => ({ settings, active, panelOpen, setPanelOpen, update, reset }), [settings, active, panelOpen, update, reset]);
  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) throw new Error('useAccessibility нужно использовать внутри AccessibilityProvider');
  return context;
}

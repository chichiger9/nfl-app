import { useCallback, useEffect, useState } from 'react';

export type ThemeChoice = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const KEY = 'nfl.theme';
const MEDIA = '(prefers-color-scheme: light)';

function isChoice(v: unknown): v is ThemeChoice {
  return v === 'light' || v === 'dark' || v === 'system';
}

function readSystem(): ResolvedTheme {
  // Server-side / non-browser fallback: stay on dark, which matches the
  // `:root` defaults and the inline pre-hydration script's null-storage path.
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark';
  return window.matchMedia(MEDIA).matches ? 'light' : 'dark';
}

/**
 * Theme controller.
 *
 * - `theme` is the user's *intent* (light / dark / system).
 * - `resolved` is what's actually painted right now (light or dark).
 *   When `theme === 'system'`, `resolved` follows the OS via media query.
 *
 * The DOM `<html data-theme>` attribute is the single source of truth that
 * the CSS reads. We re-apply it on every change so explicit toggles win
 * over the pre-hydration script's value.
 *
 * Pairs with the inline init script in `_app.tsx` to avoid SSR flash.
 */
export function useTheme() {
  // Default state is "system" so SSR and first client render agree —
  // localStorage hydration happens in the mount effect below.
  const [theme, setThemeState] = useState<ThemeChoice>('system');
  const [system, setSystem] = useState<ResolvedTheme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (isChoice(raw)) setThemeState(raw);
    } catch {
      /* ignore: private mode / disabled storage */
    }

    setSystem(readSystem());
    setMounted(true);

    const mql = window.matchMedia(MEDIA);
    const onSystemChange = (e: MediaQueryListEvent) => {
      setSystem(e.matches ? 'light' : 'dark');
    };
    // Cross-tab sync — if another tab flips the choice, follow it here.
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY) return;
      if (e.newValue === null) {
        setThemeState('system');
      } else if (isChoice(e.newValue)) {
        setThemeState(e.newValue);
      }
    };

    // Safari < 14 used the deprecated addListener API.
    if (mql.addEventListener) {
      mql.addEventListener('change', onSystemChange);
    } else {
      mql.addListener(onSystemChange);
    }
    window.addEventListener('storage', onStorage);

    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener('change', onSystemChange);
      } else {
        mql.removeListener(onSystemChange);
      }
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const resolved: ResolvedTheme = theme === 'system' ? system : theme;

  // Re-assert `data-theme` whenever the resolved value changes. The inline
  // script set it once before hydration; this keeps it correct after
  // explicit toggles or OS-level system changes.
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute('data-theme', resolved);
  }, [resolved, mounted]);

  const persist = useCallback((next: ThemeChoice) => {
    try {
      window.localStorage.setItem(KEY, next);
    } catch {
      /* ignore quota / disabled storage */
    }
  }, []);

  const setTheme = useCallback(
    (next: ThemeChoice) => {
      setThemeState(next);
      persist(next);
    },
    [persist],
  );

  // System -> Light -> Dark -> System. Matches the icon order in the toggle.
  const cycle = useCallback(() => {
    setThemeState((curr) => {
      const next: ThemeChoice =
        curr === 'system' ? 'light' : curr === 'light' ? 'dark' : 'system';
      persist(next);
      return next;
    });
  }, [persist]);

  return { theme, resolved, system, mounted, setTheme, cycle };
}

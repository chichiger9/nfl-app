import { useCallback, useEffect, useState } from 'react';

const KEY = 'nfl.favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount; SSR-safe.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setFavorites(new Set(parsed.filter((v) => typeof v === 'string')));
        }
      }
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(Array.from(favorites)));
    } catch {
      /* ignore quota errors */
    }
  }, [favorites, hydrated]);

  const toggle = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const has = useCallback((id: string) => favorites.has(id), [favorites]);

  return { favorites, toggle, has, hydrated };
}

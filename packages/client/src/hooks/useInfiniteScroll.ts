import { useCallback, useEffect, useRef, useState } from 'react';

export interface InfiniteScrollPage<T> {
  data: T[];
  total: number;
}

export interface UseInfiniteScrollOptions<T> {
  /**
   * Fetcher for a single 1-indexed page. Receives an `AbortSignal` so callers
   * that thread it into `fetch` get free cancellation when filters change.
   */
  fetchPage: (page: number, signal: AbortSignal) => Promise<InfiniteScrollPage<T>>;
  /**
   * Identity-compared dependency list. When any dep changes the hook discards
   * accumulated results and restarts from page 1. Mirrors the dep list of a
   * normal data-fetching `useEffect`.
   */
  deps: ReadonlyArray<unknown>;
  /**
   * When false, the hook clears state and refuses to fetch (e.g. waiting for
   * client-side hydration, or "Show favorites only" with an empty set).
   */
  enabled?: boolean;
  /**
   * `IntersectionObserver` rootMargin. The default of 320px pre-fetches the
   * next page before the sentinel actually crosses into view, so the user
   * rarely sees a loading state at all on a steady scroll.
   */
  rootMargin?: string;
}

export interface UseInfiniteScrollResult<T> {
  items: T[];
  total: number | null;
  /** Number of pages successfully loaded so far (0 before the first response). */
  page: number;
  hasMore: boolean;
  /** True whenever any fetch is in flight (initial or subsequent). */
  isLoading: boolean;
  /** True only while page 1 is loading and nothing has been displayed yet. */
  isInitialLoading: boolean;
  error: string | null;
  /** Attach to a sentinel element rendered below the list. */
  sentinelRef: (node: HTMLElement | null) => void;
  /** Re-attempts the most recent (failed) page without resetting older rows. */
  retry: () => void;
}

interface StateSnapshot {
  page: number;
  total: number | null;
  itemsLength: number;
  error: string | null;
  enabled: boolean;
}

export function useInfiniteScroll<T>(
  options: UseInfiniteScrollOptions<T>,
): UseInfiniteScrollResult<T> {
  const { fetchPage, deps, enabled = true, rootMargin = '320px' } = options;

  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentinelNode, setSentinelNode] = useState<HTMLElement | null>(null);

  // Latch — short-circuits new requests while one is in flight.
  const inFlightRef = useRef(false);
  // Monotonic counter that invalidates promises from prior dep generations.
  const generationRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  // Hold the latest `fetchPage` reference so a new closure on every render
  // doesn't blow away the reset-on-deps semantics.
  const fetchPageRef = useRef(fetchPage);
  fetchPageRef.current = fetchPage;

  // Mirror of the latest reactive state for the IntersectionObserver callback,
  // which closes over a single moment in time when first registered.
  const stateRef = useRef<StateSnapshot>({
    page: 0,
    total: null,
    itemsLength: 0,
    error: null,
    enabled,
  });
  stateRef.current = {
    page,
    total,
    itemsLength: items.length,
    error,
    enabled,
  };

  const performLoad = useCallback((nextPage: number) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setIsLoading(true);
    setError(null);

    const generation = generationRef.current;
    const controller = new AbortController();
    abortRef.current = controller;

    void fetchPageRef
      .current(nextPage, controller.signal)
      .then((res) => {
        if (generation !== generationRef.current) return;
        setItems((prev) => (nextPage === 1 ? res.data : prev.concat(res.data)));
        setTotal(res.total);
        setPage(nextPage);
      })
      .catch((e: unknown) => {
        if (generation !== generationRef.current) return;
        if ((e as { name?: string } | null)?.name === 'AbortError') return;
        const message = e instanceof Error ? e.message : 'Failed to load';
        setError(message);
      })
      .finally(() => {
        if (generation !== generationRef.current) return;
        inFlightRef.current = false;
        setIsLoading(false);
        if (abortRef.current === controller) abortRef.current = null;
      });
  }, []);

  // Reset accumulator + restart at page 1 whenever the caller's deps change.
  useEffect(() => {
    generationRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
    inFlightRef.current = false;

    setItems([]);
    setTotal(null);
    setPage(0);
    setError(null);
    setIsLoading(false);

    if (!enabled) return;
    performLoad(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled]);

  // Observe the sentinel. We deliberately re-create the observer after each
  // successful page so that if newly-rendered rows didn't push the sentinel
  // out of the viewport, the next page is fetched immediately without
  // requiring the user to scroll further.
  useEffect(() => {
    if (!sentinelNode) return;
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        const s = stateRef.current;
        if (!s.enabled) return;
        if (s.page === 0) return; // initial load is owned by the reset effect
        if (s.error) return; // wait for explicit retry
        if (inFlightRef.current) return;
        if (s.total !== null && s.itemsLength >= s.total) return;
        performLoad(s.page + 1);
      },
      { rootMargin },
    );
    observer.observe(sentinelNode);

    return () => observer.disconnect();
  }, [sentinelNode, page, performLoad, rootMargin]);

  // Final cleanup — ditch any in-flight request when the component unmounts.
  useEffect(
    () => () => {
      abortRef.current?.abort();
      abortRef.current = null;
    },
    [],
  );

  const retry = useCallback(() => {
    if (inFlightRef.current) return;
    setError(null);
    performLoad(stateRef.current.page + 1);
  }, [performLoad]);

  const sentinelRef = useCallback((node: HTMLElement | null) => {
    setSentinelNode(node);
  }, []);

  return {
    items,
    total,
    page,
    hasMore: total === null || items.length < total,
    isLoading,
    isInitialLoading: isLoading && page === 0,
    error,
    sentinelRef,
    retry,
  };
}

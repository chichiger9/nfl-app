import { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import {
  ArrowsClockwise,
  CheckCircle,
  MagnifyingGlass,
  Warning,
} from '@phosphor-icons/react';
import type {
  Player,
  PlayersMeta,
  PlayersResponse,
  SortDir,
  SortField,
} from '@shared/types';
import { fetchMeta, fetchPlayers } from '../lib/api';
import { useDebounce } from '../hooks/useDebounce';
import { useFavorites } from '../hooks/useFavorites';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { SearchBar } from '../components/SearchBar';
import { Filters } from '../components/Filters';
import { PlayersTable } from '../components/PlayersTable';
import { PlayerDetailModal } from '../components/PlayerDetailModal';

const PAGE_SIZE = 25;

const SORT_LABELS: Record<SortField, string> = {
  last_name: 'Last name',
  position: 'Position',
  status: 'Status',
  team: 'Team',
};

export default function Home() {
  const [meta, setMeta] = useState<PlayersMeta | null>(null);
  const [metaError, setMetaError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const [position, setPosition] = useState('');
  const [team, setTeam] = useState('');
  const [status, setStatus] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const [sort, setSort] = useState<SortField | ''>('last_name');
  const [dir, setDir] = useState<SortDir>('asc');

  const [selected, setSelected] = useState<Player | null>(null);

  const { has: isFavorite, toggle: toggleFavorite, favorites, hydrated } = useFavorites();

  const hasFilters =
    Boolean(debouncedSearch) ||
    Boolean(position) ||
    Boolean(team) ||
    Boolean(status) ||
    favoritesOnly;

  useEffect(() => {
    fetchMeta()
      .then(setMeta)
      .catch((e: Error) => setMetaError(e.message));
  }, []);

  const idsParam = useMemo(() => {
    if (!favoritesOnly) return undefined;
    return Array.from(favorites).join(',');
  }, [favoritesOnly, favorites]);

  // Skip the network entirely while we're either waiting for favorites to
  // hydrate or the user has flipped on "Show Favorites Only" with an empty
  // set. Both states must clear accumulated rows — `enabled` flipping is
  // part of the hook's reset trigger.
  const noFavoritesEdge = favoritesOnly && hydrated && favorites.size === 0;
  const fetchEnabled = !((favoritesOnly && !hydrated) || noFavoritesEdge);

  const fetchPlayersPage = useCallback(
    (pageNumber: number) =>
      fetchPlayers({
        page: pageNumber,
        limit: PAGE_SIZE,
        q: debouncedSearch || undefined,
        position: position || undefined,
        team: team || undefined,
        status: status || undefined,
        sort: sort || undefined,
        dir,
        ids: idsParam,
      }).then(
        (res: PlayersResponse) => ({ data: res.data, total: res.total }),
      ),
    [debouncedSearch, position, team, status, sort, dir, idsParam],
  );

  const {
    items: players,
    total: rawTotal,
    page: loadedPages,
    hasMore,
    isLoading,
    isInitialLoading,
    error,
    sentinelRef,
    retry,
  } = useInfiniteScroll<Player>({
    fetchPage: fetchPlayersPage,
    deps: [
      debouncedSearch,
      position,
      team,
      status,
      sort,
      dir,
      favoritesOnly,
      idsParam,
      hydrated,
    ],
    enabled: fetchEnabled,
  });

  const total = noFavoritesEdge ? 0 : rawTotal;
  const isHydrating = favoritesOnly && !hydrated;

  const showSkeleton = isInitialLoading || isHydrating;
  const showInitialError = !showSkeleton && loadedPages === 0 && error !== null;
  const showResults = !showSkeleton && !showInitialError && players.length > 0;
  const showEmpty =
    !showSkeleton && !showInitialError && players.length === 0 && total === 0;
  const showLoadingMore = showResults && hasMore && isLoading;
  const showNextPageError = showResults && error !== null;
  const showEndOfList =
    showResults && !hasMore && total !== null && total > 0 && !error;

  const onSort = useCallback(
    (field: SortField) => {
      if (sort === field) {
        setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSort(field);
        setDir('asc');
      }
    },
    [sort],
  );

  const onFiltersChange = useCallback(
    (next: Partial<{ position: string; team: string; status: string; favoritesOnly: boolean }>) => {
      if (next.position !== undefined) setPosition(next.position);
      if (next.team !== undefined) setTeam(next.team);
      if (next.status !== undefined) setStatus(next.status);
      if (next.favoritesOnly !== undefined) setFavoritesOnly(next.favoritesOnly);
    },
    [],
  );

  const onReset = useCallback(() => {
    setPosition('');
    setTeam('');
    setStatus('');
    setFavoritesOnly(false);
    setSearch('');
    setSort('last_name');
    setDir('asc');
  }, []);

  return (
    <>
      <Head>
        <title>NFL Players · Roster Index</title>
        <meta
          name="description"
          content="A clean, fast index of NFL players powered by the Sleeper API."
        />
        <meta name="theme-color" content="#0b0c0e" />
      </Head>

      <main className="relative z-10 mx-auto max-w-[1280px] px-4 pb-24 pt-10 md:px-8 md:pt-16">
        {/* Asymmetric hero — title left, live status right */}
        <header className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-2">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-400">
              Roster Index · 2026 Season
            </p>
            <h1 className="text-4xl font-semibold leading-[1.05] tracking-tightest text-ink-50 md:text-[56px]">
              Every player.
              <br className="hidden md:block" />
              <span className="text-ink-300"> One source of truth.</span>
            </h1>
            <p className="max-w-[58ch] pt-1 text-[15px] leading-relaxed text-ink-300">
              Search, filter, and bookmark players across the league. Data
              streams from the{' '}
              <a
                href="https://docs.sleeper.com/"
                target="_blank"
                rel="noreferrer"
                className="text-ink-100 underline decoration-ink-600 underline-offset-4 transition-colors hover:text-signal-fg hover:decoration-signal"
              >
                Sleeper API
              </a>
              .
            </p>
          </div>

          <LiveBadge
            total={total ?? null}
            label={hasFilters ? 'matching' : 'indexed'}
          />
        </header>

        {/* Toolbar — search + filters separated by negative space, no card */}
        <section className="mt-10 space-y-4">
          <SearchBar value={search} onChange={setSearch} />
          <Filters
            meta={meta}
            position={position}
            team={team}
            status={status}
            favoritesOnly={favoritesOnly}
            onChange={onFiltersChange}
            onReset={onReset}
          />
        </section>

        {metaError && (
          <ErrorBanner
            message={`Couldn't load filter options: ${metaError}`}
            onRetry={undefined}
          />
        )}

        {/* Results meta line — anti-card, divider only */}
        <div className="mt-10 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-ink-800 pb-3">
          <div className="flex items-baseline gap-3 font-mono text-[12px] tracking-wide text-ink-300">
            {showSkeleton ? (
              <span className="skeleton h-3 w-32 rounded" />
            ) : players.length > 0 && total !== null && total > 0 ? (
              <>
                <span className="text-ink-50">
                  1<span className="text-ink-500">–</span>
                  {players.length.toLocaleString()}
                </span>
                <span className="text-ink-500">of</span>
                <span className="text-ink-200">
                  {total.toLocaleString()}
                </span>
              </>
            ) : total === 0 ? (
              <span className="text-ink-400">No matching players</span>
            ) : (
              <span className="text-ink-400">—</span>
            )}
          </div>
          {sort && (
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-400">
              Sorted by{' '}
              <span className="text-ink-200">{SORT_LABELS[sort]}</span>{' '}
              <span className="text-ink-500">
                {dir === 'asc' ? '· ascending' : '· descending'}
              </span>
            </div>
          )}
        </div>

        {/* Results body */}
        <section className="mt-2">
          {showSkeleton && (
            <PlayersTable
              players={[]}
              sort={sort}
              dir={dir}
              onSort={onSort}
              onSelect={() => {}}
              isFavorite={() => false}
              onToggleFavorite={() => {}}
              loading
            />
          )}

          {showResults && (
            <PlayersTable
              players={players}
              sort={sort}
              dir={dir}
              onSort={onSort}
              onSelect={setSelected}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
            />
          )}

          {showEmpty && <EmptyState hasFilters={hasFilters} onReset={onReset} />}

          {showInitialError && (
            <InitialErrorState message={error} onRetry={retry} />
          )}
        </section>

        {/* Sentinel + scroll feedback — only mounted while there's more to load. */}
        {showResults && hasMore && !error && (
          <div ref={sentinelRef} aria-hidden="true" className="infinite-sentinel" />
        )}

        {showLoadingMore && (
          <div
            role="status"
            aria-live="polite"
            className="mt-6 flex items-center justify-center gap-3 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-400"
          >
            <span className="infinite-spinner" aria-hidden="true" />
            <span>
              Loading <span className="text-ink-200">{PAGE_SIZE}</span> more
            </span>
          </div>
        )}

        {showNextPageError && (
          <NextPageError
            message={error}
            nextPage={loadedPages + 1}
            onRetry={retry}
          />
        )}

        {showEndOfList && (
          <div
            role="status"
            className="mt-8 flex items-center justify-center gap-4 border-t border-ink-800 pt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-500"
          >
            <span className="h-px w-10 bg-ink-700" />
            <span className="inline-flex items-center gap-2">
              <CheckCircle size={12} weight="bold" className="text-signal" />
              End of roster · {total!.toLocaleString()} indexed
            </span>
            <span className="h-px w-10 bg-ink-700" />
          </div>
        )}
      </main>

      {selected && (
        <PlayerDetailModal
          playerId={selected.player_id}
          initialName={
            selected.full_name ||
            [selected.first_name, selected.last_name].filter(Boolean).join(' ') ||
            'Player'
          }
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

function LiveBadge({ total, label }: { total: number | null; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-full border border-ink-800 bg-ink-900/40 px-3.5 py-2 text-[12px] text-ink-200 md:self-end">
      <span className="relative inline-flex h-2 w-2 shrink-0">
        <span className="absolute inset-0 animate-breathe rounded-full bg-signal opacity-60" />
        <span className="relative inline-block h-2 w-2 rounded-full bg-signal" />
      </span>
      <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-300">
        Live
      </span>
      <span className="h-3 w-px bg-ink-700" />
      <span className="font-mono tabular-nums text-ink-100">
        {total === null ? '—' : total.toLocaleString()}
      </span>
      <span className="text-ink-400">{label}</span>
    </div>
  );
}

function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="mt-6 flex items-center justify-between gap-4 rounded-lg border border-rouge/40 bg-rouge/[0.06] px-4 py-3 text-sm text-rouge">
      <span className="inline-flex items-center gap-2">
        <Warning size={15} weight="bold" />
        {message}
      </span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="tactile rounded-md border border-rouge/40 px-3 py-1 text-[12px] text-rouge hover:bg-rouge/10"
        >
          Retry
        </button>
      )}
    </div>
  );
}

function NextPageError({
  message,
  nextPage,
  onRetry,
}: {
  message: string;
  nextPage: number;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rouge/30 bg-rouge/[0.05] px-4 py-3 text-sm text-rouge"
    >
      <span className="inline-flex items-center gap-2">
        <Warning size={14} weight="bold" />
        Couldn't load page {nextPage}
        <span className="text-rouge/70">· {message}</span>
      </span>
      <button
        type="button"
        onClick={onRetry}
        className="tactile inline-flex items-center gap-1.5 rounded-md border border-rouge/40 px-3 py-1 text-[12px] text-rouge hover:bg-rouge/10"
      >
        <ArrowsClockwise size={12} weight="bold" />
        Retry
      </button>
    </div>
  );
}

function InitialErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="mt-10 grid place-items-center px-4 py-16 text-center"
    >
      <div className="grid h-12 w-12 place-items-center rounded-2xl border border-rouge/30 bg-rouge/[0.05] text-rouge">
        <Warning size={20} weight="regular" />
      </div>
      <p className="mt-5 text-[14.5px] font-medium text-ink-100">
        Couldn't load the roster.
      </p>
      <p className="mt-1 max-w-[44ch] text-[13px] leading-relaxed text-ink-400">
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="tactile mt-5 inline-flex items-center gap-2 rounded-lg border border-rouge/30 bg-rouge/[0.06] px-4 py-2 text-sm text-rouge hover:border-rouge/50 hover:bg-rouge/10"
      >
        <ArrowsClockwise size={13} weight="bold" />
        Retry
      </button>
    </div>
  );
}

function EmptyState({
  hasFilters,
  onReset,
}: {
  hasFilters: boolean;
  onReset: () => void;
}) {
  return (
    <div className="mt-10 grid place-items-center px-4 py-20 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl border border-ink-700 bg-ink-900/60 text-ink-300">
        <MagnifyingGlass size={22} weight="regular" />
      </div>
      <p className="mt-5 text-[15px] font-medium text-ink-100">
        No players match your filters.
      </p>
      <p className="mt-1.5 max-w-[42ch] text-[13.5px] leading-relaxed text-ink-400">
        Try a broader search, switch the position filter, or clear all filters
        to see the full roster.
      </p>
      {hasFilters && (
        <button
          type="button"
          onClick={onReset}
          className="tactile mt-5 inline-flex items-center gap-2 rounded-lg border border-signal-line bg-signal-bg px-4 py-2 text-sm font-medium text-signal-fg hover:border-signal"
        >
          <ArrowsClockwise size={13} weight="bold" />
          Clear filters
        </button>
      )}
    </div>
  );
}

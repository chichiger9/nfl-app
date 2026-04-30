import { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import {
  ArrowLeft,
  ArrowRight,
  ArrowsClockwise,
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
  const [page, setPage] = useState(1);

  const [response, setResponse] = useState<PlayersResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [selected, setSelected] = useState<Player | null>(null);

  const { has: isFavorite, toggle: toggleFavorite, favorites, hydrated } = useFavorites();

  const hasFilters =
    Boolean(debouncedSearch) ||
    Boolean(position) ||
    Boolean(team) ||
    Boolean(status) ||
    favoritesOnly;

  // Reset to page 1 whenever filters/search change.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, position, team, status, favoritesOnly, sort, dir]);

  // Fetch meta once.
  useEffect(() => {
    fetchMeta()
      .then(setMeta)
      .catch((e: Error) => setMetaError(e.message));
  }, []);

  const idsParam = useMemo(() => {
    if (!favoritesOnly) return undefined;
    return Array.from(favorites).join(',');
  }, [favoritesOnly, favorites]);

  // Fetch players whenever query changes.
  useEffect(() => {
    if (favoritesOnly && !hydrated) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    if (favoritesOnly && favorites.size === 0) {
      setResponse({ data: [], total: 0, page: 1, limit: PAGE_SIZE });
      setLoading(false);
      return;
    }

    fetchPlayers({
      page,
      limit: PAGE_SIZE,
      q: debouncedSearch || undefined,
      position: position || undefined,
      team: team || undefined,
      status: status || undefined,
      sort: sort || undefined,
      dir,
      ids: idsParam,
    })
      .then((res) => {
        if (!cancelled) setResponse(res);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    debouncedSearch,
    position,
    team,
    status,
    sort,
    dir,
    page,
    favoritesOnly,
    favorites,
    idsParam,
    hydrated,
    reloadKey,
  ]);

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

  const totalPages = response ? Math.max(1, Math.ceil(response.total / PAGE_SIZE)) : 1;
  const players = response?.data ?? [];
  const showSkeleton = loading && !response;
  const showResults = response && response.total > 0 && !showSkeleton;
  const showEmpty = response && response.total === 0 && !showSkeleton && !error;

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
            total={response?.total ?? null}
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

        {error && (
          <ErrorBanner
            message={`Error loading players: ${error}`}
            onRetry={() => setReloadKey((k) => k + 1)}
          />
        )}

        {/* Results meta line — anti-card, divider only */}
        <div className="mt-10 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-ink-800 pb-3">
          <div className="flex items-baseline gap-3 font-mono text-[12px] tracking-wide text-ink-300">
            {showSkeleton ? (
              <span className="skeleton h-3 w-32 rounded" />
            ) : response && response.total > 0 ? (
              <>
                <span className="text-ink-50">
                  {(page - 1) * PAGE_SIZE + 1}
                  <span className="text-ink-500">–</span>
                  {Math.min(page * PAGE_SIZE, response.total)}
                </span>
                <span className="text-ink-500">of</span>
                <span className="text-ink-200">
                  {response.total.toLocaleString()}
                </span>
                {loading && (
                  <span className="ml-2 inline-flex items-center gap-1 text-ink-400">
                    <ArrowsClockwise
                      size={11}
                      weight="bold"
                      className="animate-spin"
                      style={{ animationDuration: '1.4s' }}
                    />
                    Updating
                  </span>
                )}
              </>
            ) : (
              <span className="text-ink-400">No matching players</span>
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

          {showEmpty && (
            <EmptyState hasFilters={hasFilters} onReset={onReset} />
          )}
        </section>

        {showResults && totalPages > 1 && (
          <nav
            aria-label="Pagination"
            className="mt-10 flex items-center justify-between gap-3 border-t border-ink-800 pt-6"
          >
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="tactile inline-flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-900/60 px-4 py-2 text-sm text-ink-100 hover:border-ink-600 hover:bg-ink-900 disabled:cursor-not-allowed disabled:border-ink-800 disabled:bg-transparent disabled:text-ink-500"
            >
              <ArrowLeft size={14} weight="bold" />
              Previous
            </button>
            <div className="font-mono text-[12px] uppercase tracking-[0.16em] text-ink-400">
              Page <span className="text-ink-50">{page}</span>
              <span className="mx-2 text-ink-600">/</span>
              <span className="text-ink-200">{totalPages.toLocaleString()}</span>
            </div>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="tactile inline-flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-900/60 px-4 py-2 text-sm text-ink-100 hover:border-ink-600 hover:bg-ink-900 disabled:cursor-not-allowed disabled:border-ink-800 disabled:bg-transparent disabled:text-ink-500"
            >
              Next
              <ArrowRight size={14} weight="bold" />
            </button>
          </nav>
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

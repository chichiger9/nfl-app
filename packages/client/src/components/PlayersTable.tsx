import { CaretDown, CaretUp, Star } from '@phosphor-icons/react';
import type { Player, SortDir, SortField } from '@shared/types';

interface Props {
  players: Player[];
  sort: SortField | '';
  dir: SortDir;
  onSort: (field: SortField) => void;
  onSelect: (player: Player) => void;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
  loading?: boolean;
}

interface Column {
  key: SortField | 'first_name';
  label: string;
  sortable: boolean;
  className?: string;
}

const COLUMNS: Column[] = [
  { key: 'first_name', label: 'First', sortable: false, className: 'w-[18%]' },
  { key: 'last_name', label: 'Last', sortable: true, className: 'w-[20%]' },
  { key: 'position', label: 'Pos', sortable: true, className: 'w-[12%]' },
  { key: 'status', label: 'Status', sortable: true, className: 'w-[24%]' },
  { key: 'team', label: 'Team', sortable: true, className: 'w-[14%]' },
];

const ACTIVE_STATUSES = new Set(['Active']);
const INJURED_STATUSES = new Set([
  'Injured Reserve',
  'Physically Unable to Perform',
  'Non Football Injury',
  'Suspended',
  'PUP',
  'IR',
]);

function statusTone(status: string | null) {
  if (!status) return 'idle';
  if (ACTIVE_STATUSES.has(status)) return 'active';
  if (INJURED_STATUSES.has(status)) return 'injured';
  return 'idle';
}

function StatusDot({ tone }: { tone: 'active' | 'injured' | 'idle' }) {
  const color =
    tone === 'active'
      ? 'bg-signal'
      : tone === 'injured'
        ? 'bg-rouge'
        : 'bg-ink-500';
  const ring =
    tone === 'active'
      ? 'before:bg-signal'
      : tone === 'injured'
        ? 'before:bg-rouge'
        : 'before:bg-ink-500';

  return (
    <span
      className={`relative inline-block h-1.5 w-1.5 shrink-0 rounded-full ${color} before:absolute before:inset-0 before:rounded-full ${ring} ${
        tone === 'active' ? 'before:animate-breathe before:opacity-60' : ''
      }`}
    />
  );
}

function PositionChip({ value }: { value: string | null }) {
  if (!value) return <span className="text-ink-400">—</span>;
  return (
    <span className="inline-flex h-[22px] items-center rounded-md border border-ink-700 bg-ink-900/80 px-2 font-mono text-[11px] uppercase tracking-wide text-ink-100">
      {value}
    </span>
  );
}

export function PlayersTable({
  players,
  sort,
  dir,
  onSort,
  onSelect,
  isFavorite,
  onToggleFavorite,
  loading,
}: Props) {
  return (
    <div className="-mx-2 overflow-x-auto md:mx-0">
      <table className="w-full min-w-[720px] border-separate border-spacing-0 px-2 md:px-0">
        <thead>
          <tr className="text-left text-[11px] font-medium uppercase tracking-[0.14em] text-ink-400">
            <th
              scope="col"
              className="sticky top-0 z-10 w-[44px] border-b border-ink-800 bg-ink-950 py-3 pl-3"
            >
              <span className="sr-only">Favorite</span>
            </th>
            {COLUMNS.map((c) => {
              const isActive = c.sortable && sort === c.key;
              return (
                <th
                  key={c.key}
                  scope="col"
                  className={`sticky top-0 z-10 border-b border-ink-800 bg-ink-950 py-3 pr-4 ${c.className ?? ''}`}
                >
                  {c.sortable ? (
                    <button
                      type="button"
                      onClick={() => onSort(c.key as SortField)}
                      className={`tactile inline-flex items-center gap-1 transition-colors hover:text-ink-100 ${
                        isActive ? 'text-signal-fg' : ''
                      }`}
                    >
                      {c.label}
                      <span className="grid h-3 w-3 place-items-center text-[10px]">
                        {isActive ? (
                          dir === 'asc' ? (
                            <CaretUp size={10} weight="bold" />
                          ) : (
                            <CaretDown size={10} weight="bold" />
                          )
                        ) : (
                          <CaretUp size={10} weight="bold" className="opacity-25" />
                        )}
                      </span>
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="cascade">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <tr
                  key={`s-${i}`}
                  className="border-b border-ink-800/60"
                  style={{ ['--idx' as string]: String(i) }}
                >
                  <td className="py-3.5 pl-3">
                    <span className="skeleton block h-4 w-4 rounded-full" />
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className="skeleton block h-3.5 w-24 rounded" />
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className="skeleton block h-3.5 w-32 rounded" />
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className="skeleton block h-[22px] w-12 rounded-md" />
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className="skeleton block h-3.5 w-28 rounded" />
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className="skeleton block h-3.5 w-10 rounded" />
                  </td>
                </tr>
              ))
            : players.map((p, i) => {
                const fav = isFavorite(p.player_id);
                const tone = statusTone(p.status);
                return (
                  <tr
                    key={p.player_id}
                    onClick={() => onSelect(p)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelect(p);
                      }
                    }}
                    style={{ ['--idx' as string]: String(i) }}
                    className="group cursor-pointer border-b border-ink-800/60 text-[14px] text-ink-100 outline-none transition-colors duration-150 ease-spring hover:bg-ink-900/60 focus-visible:bg-ink-900/60"
                  >
                    <td className="relative py-3.5 pl-3 align-middle">
                      <span className="absolute left-0 top-1/2 h-7 w-[2px] -translate-y-1/2 scale-y-0 rounded-r bg-signal transition-transform duration-200 ease-spring group-hover:scale-y-100 group-focus-visible:scale-y-100" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(p.player_id);
                        }}
                        aria-label={fav ? 'Remove favorite' : 'Add favorite'}
                        aria-pressed={fav}
                        className={`tactile grid h-7 w-7 place-items-center rounded-md transition-colors ${
                          fav
                            ? 'text-signal-fg'
                            : 'text-ink-500 hover:bg-ink-700 hover:text-ink-100'
                        }`}
                      >
                        <Star
                          size={15}
                          weight={fav ? 'fill' : 'regular'}
                        />
                      </button>
                    </td>
                    <td className="py-3.5 pr-4 text-ink-200">
                      {p.first_name ?? <span className="text-ink-400">—</span>}
                    </td>
                    <td className="py-3.5 pr-4 font-medium text-ink-50">
                      {p.last_name ?? <span className="text-ink-400">—</span>}
                    </td>
                    <td className="py-3.5 pr-4">
                      <PositionChip value={p.position ?? null} />
                    </td>
                    <td className="py-3.5 pr-4">
                      {p.status ? (
                        <span className="inline-flex items-center gap-2 text-ink-200">
                          <StatusDot tone={tone} />
                          <span className="truncate">{p.status}</span>
                        </span>
                      ) : (
                        <span className="text-ink-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 pr-4 font-mono text-[13px] tracking-wide text-ink-100">
                      {p.team ?? <span className="text-ink-400">—</span>}
                    </td>
                  </tr>
                );
              })}
        </tbody>
      </table>
    </div>
  );
}

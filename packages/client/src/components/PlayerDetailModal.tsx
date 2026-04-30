import { useEffect, useMemo, useState } from 'react';
import { X } from '@phosphor-icons/react';
import type { Player } from '@shared/types';
import { fetchPlayerById } from '../lib/api';

interface Props {
  playerId: string;
  initialName: string;
  onClose: () => void;
}

const SECTIONS: { title: string; keys: string[] }[] = [
  {
    title: 'Identity',
    keys: [
      'first_name',
      'last_name',
      'full_name',
      'hashtag',
      'age',
      'birth_date',
      'birth_country',
      'birth_state',
      'birth_city',
    ],
  },
  {
    title: 'Career',
    keys: [
      'team',
      'position',
      'fantasy_positions',
      'depth_chart_position',
      'depth_chart_order',
      'number',
      'years_exp',
      'sport',
      'status',
      'active',
    ],
  },
  {
    title: 'Health',
    keys: [
      'injury_status',
      'injury_body_part',
      'injury_start_date',
      'injury_notes',
      'practice_participation',
      'practice_description',
    ],
  },
  { title: 'Physical', keys: ['height', 'weight'] },
  { title: 'Education', keys: ['college', 'high_school'] },
  {
    title: 'External IDs',
    keys: [
      'player_id',
      'espn_id',
      'yahoo_id',
      'sportradar_id',
      'gsis_id',
      'fantasy_data_id',
      'rotoworld_id',
      'rotowire_id',
      'stats_id',
      'swish_id',
      'opta_id',
      'oddsjam_id',
      'pandascore_id',
    ],
  },
];

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (Array.isArray(v)) return v.length === 0 ? '—' : v.join(', ');
  if (typeof v === 'object') {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  const s = String(v);
  return s === '' ? '—' : s;
}

function humanizeKey(key: string) {
  return key
    .replace(/_/g, ' ')
    .replace(/\bid\b/gi, 'ID')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '–';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function PlayerDetailModal({ playerId, initialName, onClose }: Props) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPlayerById(playerId)
      .then((p) => {
        if (!cancelled) setPlayer(p);
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
  }, [playerId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Lock body scroll while open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const sections = useMemo(() => {
    if (!player) return [];
    const claimed = new Set<string>();
    SECTIONS.forEach((s) => s.keys.forEach((k) => claimed.add(k)));

    const filled = SECTIONS.map((s) => ({
      title: s.title,
      entries: s.keys
        .filter((k) => k in player && player[k] !== null && player[k] !== '')
        .map((k) => [k, player[k]] as const),
    })).filter((s) => s.entries.length > 0);

    const otherEntries = Object.entries(player)
      .filter(
        ([k, v]) =>
          !claimed.has(k) && v !== null && v !== '' && v !== undefined,
      )
      .sort(([a], [b]) => a.localeCompare(b));

    if (otherEntries.length > 0) {
      filled.push({ title: 'Other', entries: otherEntries });
    }
    return filled;
  }, [player]);

  const displayName = player?.full_name || initialName;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/70 px-4 py-8 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Details for ${displayName}`}
        onClick={(e) => e.stopPropagation()}
        className="glass animate-modal-in flex max-h-[86dvh] w-full max-w-[640px] flex-col overflow-hidden rounded-2xl"
      >
        <header className="flex items-start gap-4 border-b border-white/5 p-6">
          <div
            aria-hidden="true"
            className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-ink-700 bg-ink-900 font-mono text-sm font-medium tracking-wider text-ink-200"
          >
            {initialsFor(displayName)}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-2xl font-semibold leading-tight tracking-tight text-ink-50">
              {displayName}
            </h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-300">
              {player?.position && (
                <span className="inline-flex h-[20px] items-center rounded-md border border-ink-700 bg-ink-900/80 px-1.5 font-mono text-[10.5px] uppercase tracking-wide text-ink-100">
                  {player.position}
                </span>
              )}
              {player?.team && (
                <span className="font-mono tracking-wide text-ink-100">
                  {player.team}
                </span>
              )}
              {player?.status && (
                <span className="text-ink-400">{player.status}</span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="tactile grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-300 hover:bg-ink-800 hover:text-ink-100"
          >
            <X size={16} weight="bold" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading && <ModalSkeleton />}

          {error && !loading && (
            <div className="rounded-lg border border-rouge/40 bg-rouge/5 px-4 py-3 text-sm text-rouge">
              {error}
            </div>
          )}

          {!loading && !error && sections.length === 0 && (
            <p className="py-6 text-center text-sm text-ink-400">
              No additional details available.
            </p>
          )}

          {!loading && !error && sections.length > 0 && (
            <div className="cascade space-y-7">
              {sections.map((s, i) => (
                <section
                  key={s.title}
                  style={{ ['--idx' as string]: String(i) }}
                  className="space-y-3"
                >
                  <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                    {s.title}
                  </h3>
                  <dl className="divide-y divide-ink-800/70 border-t border-ink-800/70">
                    {s.entries.map(([k, v]) => (
                      <div
                        key={k}
                        className="grid grid-cols-[140px_1fr] gap-4 py-2.5 text-[13.5px] sm:grid-cols-[180px_1fr]"
                      >
                        <dt className="text-ink-400">{humanizeKey(k)}</dt>
                        <dd className="break-words text-ink-100">
                          {formatValue(v)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ModalSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <span className="skeleton block h-3 w-20 rounded" />
          {Array.from({ length: 3 }).map((__, j) => (
            <div
              key={j}
              className="grid grid-cols-[140px_1fr] gap-4 py-2 sm:grid-cols-[180px_1fr]"
            >
              <span className="skeleton block h-3 w-24 rounded" />
              <span className="skeleton block h-3 w-3/4 rounded" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

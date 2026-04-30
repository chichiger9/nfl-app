import { CaretDown, ArrowCounterClockwise, BookmarkSimple } from '@phosphor-icons/react';
import type { PlayersMeta } from '@shared/types';

interface Props {
  meta: PlayersMeta | null;
  position: string;
  team: string;
  status: string;
  favoritesOnly: boolean;
  onChange: (
    next: Partial<{
      position: string;
      team: string;
      status: string;
      favoritesOnly: boolean;
    }>,
  ) => void;
  onReset: () => void;
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[] | undefined;
  disabled?: boolean;
}

function SelectField({ label, value, onChange, options, disabled }: SelectFieldProps) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-400">
        {label}
      </span>
      <div className="group relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="tactile w-full cursor-pointer rounded-lg border border-ink-700 bg-ink-900/60 py-2.5 pl-3.5 pr-9 text-sm text-ink-50 outline-none hover:border-ink-600 focus:border-signal disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">All {label.toLowerCase()}</option>
          {options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <CaretDown
          size={12}
          weight="bold"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 transition-colors group-hover:text-ink-100"
        />
      </div>
    </label>
  );
}

export function Filters({
  meta,
  position,
  team,
  status,
  favoritesOnly,
  onChange,
  onReset,
}: Props) {
  const hasFilters =
    Boolean(position) || Boolean(team) || Boolean(status) || favoritesOnly;

  return (
    <div className="flex flex-col gap-3 md:grid md:grid-cols-[1fr_1fr_1fr_auto_auto] md:items-end md:gap-4">
      <SelectField
        label="Position"
        value={position}
        onChange={(v) => onChange({ position: v })}
        options={meta?.positions}
        disabled={!meta}
      />
      <SelectField
        label="Team"
        value={team}
        onChange={(v) => onChange({ team: v })}
        options={meta?.teams}
        disabled={!meta}
      />
      <SelectField
        label="Status"
        value={status}
        onChange={(v) => onChange({ status: v })}
        options={meta?.statuses}
        disabled={!meta}
      />

      <div className="grid grid-cols-2 gap-3 md:contents">
        <button
          type="button"
          role="switch"
          aria-checked={favoritesOnly}
          onClick={() => onChange({ favoritesOnly: !favoritesOnly })}
          className={`tactile inline-flex h-[42px] items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium ${
            favoritesOnly
              ? 'border-signal-line bg-signal-bg text-signal-fg'
              : 'border-ink-700 bg-ink-900/60 text-ink-200 hover:border-ink-600'
          }`}
        >
          <BookmarkSimple
            size={15}
            weight={favoritesOnly ? 'fill' : 'regular'}
          />
          Favorites
        </button>

        <button
          type="button"
          onClick={onReset}
          disabled={!hasFilters}
          className="tactile inline-flex h-[42px] items-center justify-center gap-2 rounded-lg px-3 text-sm text-ink-300 hover:bg-ink-800 hover:text-ink-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowCounterClockwise size={14} weight="bold" />
          Reset
        </button>
      </div>
    </div>
  );
}

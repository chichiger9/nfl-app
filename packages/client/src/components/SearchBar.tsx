import { MagnifyingGlass, X } from '@phosphor-icons/react';

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function SearchBar({ value, onChange }: Props) {
  return (
    <div className="group relative w-full">
      <MagnifyingGlass
        size={18}
        weight="regular"
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-300 transition-colors group-focus-within:text-signal"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by name, e.g. Jefferson, Mahomes, Kelce"
        aria-label="Search players"
        className="w-full rounded-xl border border-ink-700 bg-ink-900/60 py-3.5 pl-12 pr-12 text-[15px] text-ink-50 placeholder:text-ink-400 outline-none transition-colors duration-200 ease-spring hover:border-ink-600 focus:border-signal focus:bg-ink-900"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="tactile absolute right-3 top-1/2 -translate-y-1/2 grid h-7 w-7 place-items-center rounded-md text-ink-300 hover:bg-ink-700 hover:text-ink-100"
        >
          <X size={14} weight="bold" />
        </button>
      )}
    </div>
  );
}

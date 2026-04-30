import { Monitor, Moon, Sun } from '@phosphor-icons/react';
import { useTheme, type ThemeChoice } from '../hooks/useTheme';

interface Meta {
  Icon: typeof Sun;
  label: string;
  next: string;
}

// System -> Light -> Dark -> System. Order intentionally matches the cycle
// in `useTheme` so the announced "next" action is always truthful.
const META: Record<ThemeChoice, Meta> = {
  system: { Icon: Monitor, label: 'Auto', next: 'Switch to light theme' },
  light: { Icon: Sun, label: 'Light', next: 'Switch to dark theme' },
  dark: { Icon: Moon, label: 'Dark', next: 'Switch to system theme' },
};

/**
 * Small icon button that cycles theme on click. Sized + skinned to sit
 * cleanly next to the `LiveBadge` in the page header.
 */
export function ThemeToggle() {
  const { theme, cycle } = useTheme();
  const meta = META[theme];
  const { Icon } = meta;

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Theme: ${meta.label}. ${meta.next}.`}
      title={`Theme: ${meta.label}`}
      className="tactile relative grid h-9 w-9 shrink-0 place-items-center rounded-full border border-ink-800 bg-ink-900/40 text-ink-200 transition-colors hover:border-ink-700 hover:bg-ink-900/70 hover:text-ink-50"
    >
      <Icon size={14} weight="bold" />
      <span className="sr-only">Current theme: {meta.label}</span>
    </button>
  );
}

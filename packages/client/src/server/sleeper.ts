import type { Player } from '@shared/types';

const SLEEPER_URL = 'https://api.sleeper.app/v1/players/nfl';

export async function fetchAllPlayers(): Promise<Player[]> {
  const res = await fetch(SLEEPER_URL);
  if (!res.ok) {
    throw new Error(`Sleeper API responded with ${res.status} ${res.statusText}`);
  }
  const json = (await res.json()) as Record<string, Record<string, unknown>>;
  const players: Player[] = [];
  for (const [id, raw] of Object.entries(json)) {
    if (!raw || typeof raw !== 'object') continue;
    const last = (raw as { last_name?: unknown }).last_name;
    // Sleeper returns ~12k records; many lack a usable name. Drop those for the
    // table view but still expose them via /:id if anyone asks.
    if (typeof last !== 'string' || last.trim() === '') continue;
    players.push({
      ...(raw as Record<string, unknown>),
      player_id: id,
      first_name: stringOrNull((raw as { first_name?: unknown }).first_name),
      last_name: last,
      full_name: stringOrNull((raw as { full_name?: unknown }).full_name),
      position: stringOrNull((raw as { position?: unknown }).position),
      team: stringOrNull((raw as { team?: unknown }).team),
      status: stringOrNull((raw as { status?: unknown }).status),
    });
  }
  return players;
}

function stringOrNull(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const trimmed = v.trim();
  return trimmed === '' ? null : trimmed;
}

import type {
  Player,
  PlayersMeta,
  PlayersQuery,
  PlayersResponse,
} from '@shared/types';

function buildQuery(query: PlayersQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, String(value));
  }
  const s = params.toString();
  return s ? `?${s}` : '';
}

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Request failed (${res.status}) ${text}`);
  }
  return (await res.json()) as T;
}

export async function fetchPlayers(query: PlayersQuery): Promise<PlayersResponse> {
  const res = await fetch(`/api/players${buildQuery(query)}`);
  return jsonOrThrow<PlayersResponse>(res);
}

export async function fetchMeta(): Promise<PlayersMeta> {
  const res = await fetch(`/api/players/meta`);
  return jsonOrThrow<PlayersMeta>(res);
}

export async function fetchPlayerById(id: string): Promise<Player> {
  const res = await fetch(`/api/players/${encodeURIComponent(id)}`);
  return jsonOrThrow<Player>(res);
}

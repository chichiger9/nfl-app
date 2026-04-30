import type {
  Player,
  PlayersQuery,
  PlayersResponse,
  SortDir,
  SortField,
} from '@shared/types';

const SORTABLE: SortField[] = ['last_name', 'position', 'status', 'team'];

export function searchPlayers(players: Player[], q: string | undefined): Player[] {
  if (!q) return players;
  const needle = q.trim().toLowerCase();
  if (!needle) return players;
  return players.filter((p) => {
    const fields = [p.first_name, p.last_name, p.full_name];
    return fields.some(
      (f) => typeof f === 'string' && f.toLowerCase().includes(needle),
    );
  });
}

export function filterPlayers(
  players: Player[],
  filters: { position?: string; team?: string; status?: string; ids?: string[] },
): Player[] {
  return players.filter((p) => {
    if (filters.position && p.position !== filters.position) return false;
    if (filters.team && p.team !== filters.team) return false;
    if (filters.status && p.status !== filters.status) return false;
    if (filters.ids && !filters.ids.includes(p.player_id)) return false;
    return true;
  });
}

export function sortPlayers(
  players: Player[],
  sort: SortField | undefined,
  dir: SortDir = 'asc',
): Player[] {
  if (!sort || !SORTABLE.includes(sort)) return players;
  const mult = dir === 'desc' ? -1 : 1;
  // Slice so we don't mutate input.
  return players.slice().sort((a, b) => {
    const av = a[sort];
    const bv = b[sort];
    // Nulls always sort last regardless of direction.
    const aNull = av == null || av === '';
    const bNull = bv == null || bv === '';
    if (aNull && bNull) return 0;
    if (aNull) return 1;
    if (bNull) return -1;
    return String(av).localeCompare(String(bv)) * mult;
  });
}

export function paginatePlayers(
  players: Player[],
  page: number,
  limit: number,
): Player[] {
  const start = (page - 1) * limit;
  return players.slice(start, start + limit);
}

export function queryPlayers(
  players: Player[],
  query: PlayersQuery,
): PlayersResponse {
  const page = Math.max(1, Math.floor(query.page ?? 1));
  const limit = Math.min(200, Math.max(1, Math.floor(query.limit ?? 25)));
  const ids =
    typeof query.ids === 'string' && query.ids.trim() !== ''
      ? query.ids.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

  let result = players;
  result = searchPlayers(result, query.q);
  result = filterPlayers(result, {
    position: query.position,
    team: query.team,
    status: query.status,
    ids,
  });
  result = sortPlayers(result, query.sort, query.dir);
  const total = result.length;
  const data = paginatePlayers(result, page, limit);
  return { data, total, page, limit };
}

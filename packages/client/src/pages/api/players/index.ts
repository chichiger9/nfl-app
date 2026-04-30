import type { NextApiRequest, NextApiResponse } from 'next';
import type {
  PlayersQuery,
  PlayersResponse,
  SortDir,
  SortField,
} from '@shared/types';
import { getPlayers } from '../../../server/cache';
import { queryPlayers } from '../../../server/filter';

const SORT_FIELDS: SortField[] = ['last_name', 'position', 'status', 'team'];
const SORT_DIRS: SortDir[] = ['asc', 'desc'];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PlayersResponse | { error: string }>,
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  try {
    const players = await getPlayers();
    const query = parseQuery(req);
    res.status(200).json(queryPlayers(players, query));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    res.status(500).json({ error: message });
  }
}

function parseQuery(req: NextApiRequest): PlayersQuery {
  const q = req.query;
  return {
    page: toInt(q.page),
    limit: toInt(q.limit),
    q: toStr(q.q),
    position: toStr(q.position),
    team: toStr(q.team),
    status: toStr(q.status),
    sort: SORT_FIELDS.includes(q.sort as SortField)
      ? (q.sort as SortField)
      : undefined,
    dir: SORT_DIRS.includes(q.dir as SortDir) ? (q.dir as SortDir) : undefined,
    ids: toStr(q.ids),
  };
}

function toInt(v: unknown): number | undefined {
  if (typeof v !== 'string') return undefined;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
}

function toStr(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  return t === '' ? undefined : t;
}

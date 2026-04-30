import { Router, type Request, type Response, type NextFunction } from 'express';
import type {
  PlayersMeta,
  PlayersQuery,
  SortDir,
  SortField,
} from '@shared/types';
import { getPlayers } from '../cache';
import { queryPlayers } from '../filter';

const SORT_FIELDS: SortField[] = ['last_name', 'position', 'status', 'team'];
const SORT_DIRS: SortDir[] = ['asc', 'desc'];

export const playersRouter = Router();

playersRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const players = await getPlayers();
    const query = parseQuery(req);
    res.json(queryPlayers(players, query));
  } catch (err) {
    next(err);
  }
});

playersRouter.get('/meta', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const players = await getPlayers();
    const positions = new Set<string>();
    const teams = new Set<string>();
    const statuses = new Set<string>();
    for (const p of players) {
      if (p.position) positions.add(p.position);
      if (p.team) teams.add(p.team);
      if (p.status) statuses.add(p.status);
    }
    const meta: PlayersMeta = {
      positions: [...positions].sort(),
      teams: [...teams].sort(),
      statuses: [...statuses].sort(),
    };
    res.json(meta);
  } catch (err) {
    next(err);
  }
});

playersRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const players = await getPlayers();
    const player = players.find((p) => p.player_id === req.params.id);
    if (!player) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }
    res.json(player);
  } catch (err) {
    next(err);
  }
});

function parseQuery(req: Request): PlayersQuery {
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

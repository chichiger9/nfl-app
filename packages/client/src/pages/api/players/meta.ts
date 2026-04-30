import type { NextApiRequest, NextApiResponse } from 'next';
import type { PlayersMeta } from '@shared/types';
import { getPlayers } from '../../../server/cache';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PlayersMeta | { error: string }>,
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
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
      positions: Array.from(positions).sort(),
      teams: Array.from(teams).sort(),
      statuses: Array.from(statuses).sort(),
    };
    res.status(200).json(meta);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    res.status(500).json({ error: message });
  }
}

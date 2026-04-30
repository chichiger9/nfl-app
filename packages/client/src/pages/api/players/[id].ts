import type { NextApiRequest, NextApiResponse } from 'next';
import type { Player } from '@shared/types';
import { getPlayers } from '../../../server/cache';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Player | { error: string }>,
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  try {
    const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
    if (typeof id !== 'string' || id === '') {
      res.status(400).json({ error: 'Missing player id' });
      return;
    }
    const players = await getPlayers();
    const player = players.find((p) => p.player_id === id);
    if (!player) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }
    res.status(200).json(player);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    res.status(500).json({ error: message });
  }
}

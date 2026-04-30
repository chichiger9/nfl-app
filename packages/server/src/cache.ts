import type { Player } from '@shared/types';
import { fetchAllPlayers } from './sleeper';

const TTL_MS = 24 * 60 * 60 * 1000;

interface CacheEntry {
  data: Player[];
  fetchedAt: number;
}

let entry: CacheEntry | null = null;
let inFlight: Promise<Player[]> | null = null;

export async function getPlayers(): Promise<Player[]> {
  const now = Date.now();
  if (entry && now - entry.fetchedAt < TTL_MS) {
    return entry.data;
  }
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const data = await fetchAllPlayers();
      entry = { data, fetchedAt: Date.now() };
      return data;
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

// Test-only helper.
export function __resetCache() {
  entry = null;
  inFlight = null;
}

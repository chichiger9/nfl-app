import { describe, expect, it } from 'vitest';
import type { Player } from '@shared/types';
import { queryPlayers } from '../filter';

const fixture: Player[] = [
  {
    player_id: '1',
    first_name: 'Patrick',
    last_name: 'Mahomes',
    full_name: 'Patrick Mahomes',
    position: 'QB',
    team: 'KC',
    status: 'Active',
  },
  {
    player_id: '2',
    first_name: 'Travis',
    last_name: 'Kelce',
    full_name: 'Travis Kelce',
    position: 'TE',
    team: 'KC',
    status: 'Active',
  },
  {
    player_id: '3',
    first_name: 'Aaron',
    last_name: 'Rodgers',
    full_name: 'Aaron Rodgers',
    position: 'QB',
    team: 'NYJ',
    status: 'Injured Reserve',
  },
  {
    player_id: '4',
    first_name: 'Justin',
    last_name: 'Jefferson',
    full_name: 'Justin Jefferson',
    position: 'WR',
    team: 'MIN',
    status: 'Active',
  },
  {
    player_id: '5',
    first_name: 'Tyreek',
    last_name: 'Hill',
    full_name: 'Tyreek Hill',
    position: 'WR',
    team: 'MIA',
    status: 'Active',
  },
  {
    player_id: '6',
    first_name: null,
    last_name: 'Zoidberg',
    full_name: null,
    position: null,
    team: null,
    status: null,
  },
];

describe('queryPlayers', () => {
  it('returns paginated players with correct total when no filters applied', () => {
    const res = queryPlayers(fixture, { page: 1, limit: 3 });
    expect(res.total).toBe(6);
    expect(res.data).toHaveLength(3);
    expect(res.page).toBe(1);
    expect(res.limit).toBe(3);
  });

  it('searches case-insensitively across first/last/full name', () => {
    const res = queryPlayers(fixture, { q: 'JEFF' });
    expect(res.total).toBe(1);
    expect(res.data[0]?.last_name).toBe('Jefferson');
  });

  it('filters by position, team, and status independently', () => {
    expect(queryPlayers(fixture, { position: 'QB' }).total).toBe(2);
    expect(queryPlayers(fixture, { team: 'KC' }).total).toBe(2);
    expect(queryPlayers(fixture, { status: 'Active' }).total).toBe(4);
  });

  it('combines filters (AND semantics)', () => {
    const res = queryPlayers(fixture, { position: 'QB', team: 'KC' });
    expect(res.total).toBe(1);
    expect(res.data[0]?.player_id).toBe('1');
  });

  it('sorts by last_name ascending and descending, with nulls last in both directions', () => {
    const asc = queryPlayers(fixture, { sort: 'last_name', dir: 'asc', limit: 10 });
    expect(asc.data.map((p) => p.last_name)).toEqual([
      'Hill',
      'Jefferson',
      'Kelce',
      'Mahomes',
      'Rodgers',
      'Zoidberg',
    ]);

    const desc = queryPlayers(fixture, { sort: 'last_name', dir: 'desc', limit: 10 });
    expect(desc.data.map((p) => p.last_name)).toEqual([
      'Zoidberg',
      'Rodgers',
      'Mahomes',
      'Kelce',
      'Jefferson',
      'Hill',
    ]);
  });

  it('paginates correctly when sorted', () => {
    const page1 = queryPlayers(fixture, { sort: 'last_name', page: 1, limit: 2 });
    const page2 = queryPlayers(fixture, { sort: 'last_name', page: 2, limit: 2 });
    expect(page1.data.map((p) => p.last_name)).toEqual(['Hill', 'Jefferson']);
    expect(page2.data.map((p) => p.last_name)).toEqual(['Kelce', 'Mahomes']);
    expect(page1.total).toBe(6);
    expect(page2.total).toBe(6);
  });

  it('clamps limit to [1, 200] and page to >= 1', () => {
    const big = queryPlayers(fixture, { page: -5, limit: 9999 });
    expect(big.page).toBe(1);
    expect(big.limit).toBe(200);

    const small = queryPlayers(fixture, { limit: 0 });
    expect(small.limit).toBe(1);
  });

  it('filters by ids when provided', () => {
    const res = queryPlayers(fixture, { ids: '1,4,9' });
    expect(res.total).toBe(2);
    expect(res.data.map((p) => p.player_id).sort()).toEqual(['1', '4']);
  });

  it('returns empty result when ids is set but matches nothing', () => {
    const res = queryPlayers(fixture, { ids: 'nonexistent' });
    expect(res.total).toBe(0);
    expect(res.data).toHaveLength(0);
  });
});

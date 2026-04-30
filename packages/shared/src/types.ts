export interface Player {
  player_id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  position: string | null;
  team: string | null;
  status: string | null;
  [key: string]: unknown;
}

export type SortField = 'last_name' | 'position' | 'status' | 'team';
export type SortDir = 'asc' | 'desc';

export interface PlayersQuery {
  page?: number;
  limit?: number;
  q?: string;
  position?: string;
  team?: string;
  status?: string;
  sort?: SortField;
  dir?: SortDir;
  ids?: string;
}

export interface PlayersResponse {
  data: Player[];
  total: number;
  page: number;
  limit: number;
}

export interface PlayersMeta {
  positions: string[];
  teams: string[];
  statuses: string[];
}

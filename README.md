# NFL Players App

A small full-stack web app that surfaces NFL player data from the
[Sleeper API](https://api.sleeper.app/v1/players/nfl). Built on top of the
`bh__mono-repo-starter` monorepo (Yarn workspaces, Express, Next.js).

## Quick start

```bash
# Node 22.x and Yarn 1.x required.
yarn install

# Build the shared types package once so the workspace symlink resolves.
yarn workspace @shared/types build

# Run the backend (port 3001) and frontend (port 3000) together:
yarn dev:all

# ...or run them in separate terminals:
yarn workspace @server/api dev
yarn workspace @client/web dev
```

Open http://localhost:3000.

The app ships two equivalent backends:

- **Next.js API routes** under [packages/client/src/pages/api/players/](packages/client/src/pages/api/players/) — same-origin, used in production on Netlify and the default for `yarn workspace @client/web dev`.
- **Express server** in [packages/server](packages/server) — the original implementation, retained for reference and because the unit tests live there. Running `yarn dev:all` boots both.

## Deploy on Netlify

The whole app deploys to Netlify with no external backend service. Link:

https://nfl-app-chichiger.netlify.app/

### Cold-start cache caveat

The 24h in-memory cache lives inside a single serverless function instance. Cold starts trigger a fresh fetch from Sleeper, but warm invocations reuse the cached data within their lifetime. Sleeper recommends fetching at most once per day; with low-to-moderate traffic this is well under that bar. For higher-volume workloads I'd switch to Netlify Blobs or an external KV.

### Tests

```bash
yarn workspace @server/api test
```

Runs the Vitest unit tests against the pure `queryPlayers` function (search,
filter, sort, pagination, ids filter, page/limit clamping).

### Type-check / lint

```bash
yarn type-check
yarn lint
```


### Backend cache + Sleeper quirks

The Sleeper endpoint returns ~12,000 records in a single object keyed by
`player_id` (not an array). On first request the server fetches once,
converts the object to an array, drops entries that don't have a
`last_name` (Sleeper has plenty of fragmentary entries with no usable name
for a table view), and stores the result for 24h. Concurrent first
requests share a single in-flight promise so we don't hammer Sleeper.

`/api/players/meta` derives the dropdown values (`positions`, `teams`,
`statuses`) from the cached dataset rather than hardcoding them, so
unexpected values like `IDP` flags or `OAK` (legacy) show up automatically.

`/api/players/:id` returns the full unfiltered player object so the detail
modal can display every metadata field; the table response only ships
back the columns it needs (well, plus the rest — Sleeper records aren't
huge, ~600B each, so I didn't bother projecting fields. With more time I'd
project to keep the page payload small).

## Major decisions and alternatives considered

| Decision | Alternatives | Why |
| --- | --- | --- |
| In-memory cache, 24h TTL | Redis, file cache | Spec says cache, doesn't say persist. Process-local is simplest for a single-server app and can be swapped later. |
| Server-side filter/sort/paginate over the cached array | Client-side once data loads | Spec mandates server-side. Also keeps the page payload tiny. |
| Pure `queryPlayers` separated from the route | Inline logic | Pure function is trivially unit-testable. |
| Favorites in `localStorage` | Server-side via Postgres/SQLite/Supabase | Spec allows local. Saves significant time. The cost is no cross-device sync. |
| Next.js API routes for production, Express kept for tests | Single Express service deployed separately | Netlify-only deploy with no external service; cold starts are infrequent and the 24h TTL still applies per warm instance. |
| Plain CSS in `globals.css` | Tailwind, MUI, CSS modules | Tailwind needs config + scanning setup; MUI is a chunky dep; CSS modules add overhead. Plain CSS is the fastest route to a presentable UI in 2 hours. |
| Vitest | Jest | Vitest is zero-config with TS path aliases via `vitest.config.ts`. |
| Drop entries without `last_name` from `/api/players` | Keep them and show "—" everywhere | The table is materially noisier with thousands of nameless records. They're still reachable via `/:id` if needed. |
| Sort puts nulls last regardless of direction | Treat null as smallest/largest | Either choice is opinionated; nulls-last is the friendlier default for users. |

## What I'd do with one more hour

1. Add client tests with React Testing Library + Vitest, focusing on the
   debounce and the favorites toggle round-trip.
2. Add a route-level integration test with `supertest` to catch URL/query
   parsing regressions.
3. Add a tiny `/api/players/summary?by=team` endpoint and a "Group by team"
   tab — the in-memory cache already has everything needed.
4. Prefetch `/api/players/meta` in `getServerSideProps` so the filter
   dropdowns are populated on first paint.
5. Add structured logging (pino) and a request-id middleware on the server.
6. Wire client tests against the Next API routes (currently the Express
   route file has the tests; the Next handlers are uncovered).

## What I used AI for

- **Used AI for:** Technical implementation was entirely done by AI, but technical decisions (such as what packages to use, how to interpret the API data, where to host, etc.) were all done by me.
- **Didn't use AI for:** Technical decisions, setting up Netlify deployment and hosting, initial API investigation.
- **Where AI tried to mislead me:** suggested using `node-fetch` (not
  needed in Node 22), suggested `supertest` for the unit test (heavier
  than necessary for testing pure logic), and offered to dump all
  ~12k Sleeper records to the client (rejected — server-side filtering
  is part of the spec).
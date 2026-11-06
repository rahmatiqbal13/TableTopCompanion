# TableTop Companion (web)

Next.js 16 app, bilingual (`/id`, `/en`), Postgres on Supabase, deployable to Vercel.

- **Recommend** `/[lang]/recommend`: constraints, priorities, favourites, shareable URL, “Show the math”
- **Games** `/[lang]/games` and a hub page per game (stats, your review, videos, related posts, similar games)
- **Content** `/[lang]/reviews`, `/videos`, `/news`, `/guides`: written by you in the admin, Markdown, YouTube embeds
- **Admin** `/admin`: posts, games, criteria, genres
- `sitemap.xml` with language alternates, `robots.txt`

Visitors are sent to their language by a saved choice, then their browser language, then Indonesian.

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # engine, i18n, importer and database tests
npm run lint
```

Without a database the site runs **read-only** on the bundled data (`src/data/`): every page works,
but the admin cannot save. To edit locally, point `.env.local` at a Supabase project:

1. Create a free project at <https://supabase.com> (region: Singapore is closest to Indonesia).
2. **Connect** → copy the **Transaction pooler** URI (port 6543) and put the database password in it.
3. Create `web/.env.local` (see `.env.example`):
   ```
   DATABASE_URL=postgresql://postgres.xxxx:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ADMIN_PASSWORD=pick-something
   SESSION_SECRET=output-of-openssl-rand-base64-32
   ```
4. `npm run db:setup` (creates tables, enables Row Level Security, adds the 140 games and a welcome post), then `npm run dev`.

Troubleshooting:
- `npm error enoent … package.json`: run commands inside the `web` folder (`cd web`).
- `CONNECT_TIMEOUT … :6543`: some networks block port 6543. Locally, use the **Session pooler**
  instead (same address, port **5432**). Vercel can keep using 6543.
- Special characters in the database password (`@ # / ? [ ]`) must be URL-encoded (`@` → `%40`),
  and the `[ ]` around `[YOUR-PASSWORD]` must be removed.

## Deploy to Vercel

1. Import the repo in Vercel and set **Root Directory** to `web`.
2. Database: either add `DATABASE_URL` (same Supabase pooler URI as above) under Environment Variables,
   or connect **Supabase** from the Vercel Marketplace, which sets `POSTGRES_URL` / `POSTGRES_URL_NON_POOLING` (both are read).
   **Storage → Blob** adds `BLOB_READ_WRITE_TOKEN` for image uploads (optional).
3. Add `ADMIN_PASSWORD` and `SESSION_SECRET` (`openssl rand -base64 32`) as environment variables.
4. If you already ran `npm run db:setup` against the same Supabase project locally, the tables are ready.
   Otherwise run it once with that project's URL in `.env.local`.
5. Deploy. Without a database the site still works, read-only, on `src/data/`.

Supabase note: the tables live in the `public` schema, which Supabase also exposes through its REST API.
Migration `0002_enable_rls.sql` turns on Row Level Security with no policies, which closes that API;
the app connects directly as the owner and is unaffected. Keep it that way unless you add policies on purpose.

## Writing content

`/admin/posts` → **New post**. Each post has a type (news, review, video, guide), a status (draft/published),
text in Bahasa Indonesia and/or English (a missing language falls back to the other with a note),
an optional YouTube link (required for videos), an editor's score for reviews, and linked games, which makes
the post appear on those games' pages. A YouTube link on its own line in the body becomes an embedded player.

## More game data (BoardGameGeek)

BGG's XML API needs a registered application token (`BGG_API_TOKEN`), see
<https://boardgamegeek.com/using_the_xml_api>. Their terms allow non-commercial use with attribution.

```bash
npm run bgg:import -- --match                                 # link the legacy games to BGG and enrich them
npm run bgg:import -- --ranks boardgames_ranks.csv --top 500  # add the top 500 (CSV from BGG data dumps)
npm run bgg:import -- --ids 13,822,174430                     # add specific games
npm run db:setup -- --reseed                                  # push src/data/seed.json into Postgres
```

## Project layout

```
src/
  app/[lang]/           public pages (home, recommend, games, news, reviews, videos, guides, method)
  app/admin/            admin pages and server actions (every action checks the session)
  components/           UI; recommender.tsx and content-pages.tsx are the big ones
  i18n/                 en.ts, id.ts dictionaries (same shape, enforced by type and test)
  lib/topsis.ts         pure TOPSIS engine (benefit / cost / target criteria)
  lib/recommend.ts      hybrid pipeline: constraints → derived criteria → TOPSIS → MMR → reasons
  lib/similarity.ts     IDF-weighted tag cosine + numeric profile similarity
  lib/data.ts           cached loaders ('use cache', tags "catalog" and "posts")
  lib/db/               Drizzle schema, Postgres client (postgres.js), seeding
  data/                 seed.json (games), posts.json (welcome post)
  proxy.ts              language redirect
scripts/                SQL dump converter, DB setup, BGG importer (+ tests)
drizzle/                SQL migrations (`npm run db:generate` after editing the schema)
```

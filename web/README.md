# TableTop Companion (web)

Next.js 16 app, bilingual (`/id`, `/en`), Postgres on Supabase, deployable to Vercel.

- **Recommend** `/[lang]/recommend`: constraints, priorities, favourites, shareable URL, “Show the math”
- **Games** `/[lang]/games` and a hub page per game (stats, your review, videos, related posts, similar games)
- **Content** `/[lang]/reviews`, `/videos`, `/news`, `/guides`: written by you in the admin, Markdown, YouTube and TikTok embeds
- **Play near you** `/[lang]/local`: cafés, communities and Indonesian-made games, managed in `/admin/local`
- **Admin** `/admin`: posts, near-you listings, games, criteria, genres
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

## Accounts (phase 2)

Visitors browse and use the recommender without an account. Signing in (Google, or an emailed link,
no passwords) lets them rate games 1–10, mark Played / Own / Wishlist, see "My games", and get
recommendations from their favourites. Ratings from non-blocked users form the **community rating**,
which the recommender blends with BGG's (see `bayesianRatings` in `src/lib/recommend.ts`).

Setup, once:
1. Supabase → Project Settings → API: copy **Project URL** and the **anon / publishable key** into
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (locally in `.env.local`, and in Vercel).
2. Supabase → Authentication → URL Configuration: **Site URL** = your production URL; add
   **Redirect URLs** `http://localhost:3000/**` and `https://<your-domain>/**`.
3. Google sign-in: create an OAuth client (Web application) in Google Cloud Console with the
   redirect URI `https://<project-ref>.supabase.co/auth/v1/callback`, then paste its Client ID and
   Secret into Supabase → Authentication → Providers → Google.
4. Email links: Supabase's built-in mailer is for testing only (a few emails per hour, to your team's
   addresses). For real users, add custom SMTP (e.g. Resend) under Authentication → Emails → SMTP.
5. Set `ADMIN_EMAILS=you@example.com` so your account becomes admin on first sign-in.

Roles (Admin → Users): **user**, **editor** (posts only) and **admin** (everything). Blocking a user
stops them rating and removes their ratings from the community score. The shared `ADMIN_PASSWORD`
still works as a backup way into `/admin`.

## Managing data in Supabase

All data lives in Supabase (`games`, `genres`, `criteria`, `posts`, `profiles`, `user_games`, `feedback`).
You can edit it in the site's `/admin` or directly in **Supabase → Table Editor**. Notes for the Table Editor:
- `games.values` holds the criteria as JSON, e.g. `{"rating": 7.1, "complexity": 1.2, "playTime": 15, "minAge": 8, "minPlayers": 2}`.
- `best_players`, `rec_players`, `mechanics`, `categories` are JSON arrays, e.g. `[3, 4]` or `["Set Collection"]`.
- To make someone admin: `profiles` → their row → `role` = `admin` (they must have signed in once), or use `ADMIN_EMAILS`.

The site caches data, so make Supabase tell it about changes, once:
**Supabase → Database → Webhooks → Create** for each of `games`, `genres`, `criteria`, `posts`, `profiles`:
events Insert/Update/Delete, type HTTP Request, method POST,
URL `https://<your-domain>/api/revalidate`, header `x-revalidate-secret: <REVALIDATE_SECRET>`.
Without webhooks, press **↻ Refresh site data** in `/admin` after editing (or wait up to an hour).

## Writing content

`/admin/posts` → **New post**. Each post has a type (news, review, video, guide), a status (draft/published),
text in Bahasa Indonesia and/or English (a missing language falls back to the other with a note),
an optional YouTube or TikTok link (required for videos), and linked games, which makes the post appear on those
games' pages. A video link on its own line in the body becomes an embedded player.

- **Videos** are Long or Short. Shorts go in the "60 seconds" rail. TikToks and YouTube Shorts links preselect Short.
  Duration is typed by hand (`6:12`). TikTok has no stable public thumbnail, so give TikTok posts a cover image.
- **Reviews** also take a score, sub-scores (easy to teach, interaction, replay), how the copy was obtained, and
  "Great for" / "Skip if" per language. Without sub-scores the score sheet shows the game's own numbers.

`/admin/local` → **New listing** adds a café, community or Indonesian-made game to "Play near you". The home page
only shows that section once something is published.

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
  app/admin/            admin pages and server actions (every action checks the role)
  app/auth/callback/    finishes Google / email sign-in
  lib/supabase/         Supabase Auth clients (browser, server) and config
  lib/account.ts        profiles, roles, ADMIN_EMAILS
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

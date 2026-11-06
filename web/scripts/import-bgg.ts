// Enrich and extend src/data/seed.json from the BoardGameGeek XML API2.
//
// BGG requires a registered application token:
//   https://boardgamegeek.com/using_the_xml_api  ->  BGG_API_TOKEN in .env.local
//
//   npm run bgg:import -- --match                 match legacy games to BGG ids
//   npm run bgg:import -- --ids 13,822,174430     add specific games
//   npm run bgg:import -- --ranks boardgames_ranks.csv --top 500
//                                                 add the top N from BGG's ranks CSV
//                                                 (download it while logged in at
//                                                  https://boardgamegeek.com/data_dumps/bg_ranks)
// Every run also refreshes all games that already have a bggId.
// Afterwards: `npm run db:setup -- --reseed` to push the data into Postgres.
import { readFileSync, writeFileSync } from "node:fs";
import { genreFor, parseSearch, parseThings, type BggThing } from "./bgg";
import type { Game, Genre } from "../src/lib/types";

const TOKEN = process.env.BGG_API_TOKEN;
const API = "https://boardgamegeek.com/xmlapi2";
const SEED = new URL("../src/data/seed.json", import.meta.url);
const DELAY_MS = 5000;

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const opt = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

if (!TOKEN) {
  console.error("BGG_API_TOKEN is not set. Register an application at https://boardgamegeek.com/using_the_xml_api");
  process.exit(1);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let last = 0;
async function get(path: string): Promise<string> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const wait = last + DELAY_MS - Date.now();
    if (wait > 0) await sleep(wait);
    last = Date.now();
    const res = await fetch(`${API}${path}`, {
      headers: { Authorization: `Bearer ${TOKEN}`, "User-Agent": "TableTopCompanion-importer" },
    });
    if (res.status === 200) return res.text();
    if (res.status === 202 || res.status === 429 || res.status >= 500) {
      const backoff = DELAY_MS * 2 ** attempt;
      console.warn(`  ${res.status} from BGG, retrying in ${backoff / 1000}s`);
      await sleep(backoff);
      continue;
    }
    throw new Error(`BGG ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  throw new Error(`BGG kept refusing ${path}`);
}

const data: { genres: Genre[]; criteria: unknown[]; games: Game[] } = JSON.parse(readFileSync(SEED, "utf8"));
const byBgg = new Map(data.games.filter((g) => g.bggId).map((g) => [g.bggId!, g]));

// 1. Match legacy games by exact name (year as tie-breaker).
if (flag("match")) {
  const unmatched = data.games.filter((g) => !g.bggId);
  console.log(`Matching ${unmatched.length} games by name...`);
  for (const g of unmatched) {
    const hits = parseSearch(await get(`/search?type=boardgame&exact=1&query=${encodeURIComponent(g.name)}`));
    const hit = hits.find((h) => h.year === g.year) ?? (hits.length === 1 ? hits[0] : undefined);
    if (hit && !byBgg.has(hit.bggId)) {
      g.bggId = hit.bggId;
      byBgg.set(hit.bggId, g);
      console.log(`  ✓ ${g.name} -> ${hit.bggId}`);
    } else {
      console.log(`  ? ${g.name}: ${hits.length} hits, set bggId by hand in the admin`);
    }
  }
}

// 2. Collect ids to add.
const wanted = new Set<number>();
for (const id of (opt("ids") ?? "").split(",").map(Number).filter(Boolean)) wanted.add(id);
const ranksFile = opt("ranks");
if (ranksFile) {
  const [header, ...lines] = readFileSync(ranksFile, "utf8").trim().split(/\r?\n/);
  const cols = header.split(",");
  const idCol = cols.indexOf("id"), rankCol = cols.indexOf("rank"), expCol = cols.indexOf("is_expansion");
  const top = Number(opt("top") ?? 300);
  // Names may contain commas; id is the first column and rank/is_expansion are read from the end.
  const rows = lines.map((l) => {
    const parts = l.split(",");
    const tail = parts.length - cols.length;
    return { id: Number(parts[idCol]), rank: Number(parts[rankCol + tail]), expansion: parts[expCol + tail] === "1" };
  });
  rows.filter((r) => r.rank > 0 && !r.expansion).sort((a, b) => a.rank - b.rank).slice(0, top).forEach((r) => wanted.add(r.id));
}

// 3. Fetch details in batches of 20 (the API maximum).
const ids = [...new Set([...byBgg.keys(), ...wanted])];
console.log(`Fetching ${ids.length} games from BGG...`);
const things: BggThing[] = [];
for (let i = 0; i < ids.length; i += 20) {
  const batch = ids.slice(i, i + 20);
  things.push(...parseThings(await get(`/thing?stats=1&id=${batch.join(",")}`)));
  console.log(`  ${Math.min(i + 20, ids.length)}/${ids.length}`);
}

// 4. Merge.
const genreId = (categories: string[], fallback: number | null) => {
  const name = genreFor(categories);
  if (name) {
    const found = data.genres.find((g) => g.name === name);
    if (found) return found.id;
  }
  if (fallback !== null) return fallback;
  let other = data.genres.find((g) => g.name === "Other");
  if (!other) {
    other = { id: Math.max(...data.genres.map((g) => g.id)) + 1, name: "Other" };
    data.genres.push(other);
  }
  return other.id;
};

let nextId = Math.max(...data.games.map((g) => g.id)) + 1;
let added = 0, updated = 0, skipped = 0;
for (const t of things) {
  const values = { minPlayers: t.minPlayers, rating: t.rating, complexity: t.complexity, playTime: t.playTime, minAge: t.minAge };
  const existing = byBgg.get(t.bggId);
  const clean = Object.fromEntries(Object.entries(values).filter(([, v]) => v !== null)) as Record<string, number>;
  const enrichment = {
    bggId: t.bggId, maxPlayers: t.maxPlayers, bestPlayers: t.bestPlayers, recPlayers: t.recPlayers,
    votes: t.votes, bggRank: t.bggRank, categories: t.categories, mechanics: t.mechanics,
    description: t.description, imageUrl: t.imageUrl,
    linkUrl: `https://boardgamegeek.com/boardgame/${t.bggId}`,
  };
  if (existing) {
    // Legacy curated values win only where BGG has nothing.
    Object.assign(existing, enrichment, { values: { ...existing.values, ...clean } });
    updated++;
  } else {
    if (Object.keys(clean).length < 5 || t.year === null) { skipped++; continue; }
    data.games.push({ id: nextId++, name: t.name, year: t.year, genreId: genreId(t.categories, null), values: clean, ...enrichment });
    added++;
  }
}

writeFileSync(SEED, JSON.stringify(data, null, 1));
console.log(`Done: ${updated} updated, ${added} added, ${skipped} skipped (missing stats). Next: npm run db:setup -- --reseed`);

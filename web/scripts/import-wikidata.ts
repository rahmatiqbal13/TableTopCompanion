// Fill gaps in the catalogue from Wikidata and Wikipedia while BGG API access is pending.
//
//   npm run wiki:import                 dry run: shows what would change, writes nothing
//   npm run wiki:import -- --write      update src/data/seed.json
//   npm run wiki:import -- --write --db also update the games in the database
//
// Games are matched by name (with year as a tie-breaker). Only empty fields are
// filled, so nothing typed in the admin is ever overwritten:
//   bggId + BGG link, picture, max players, description (Wikipedia intro),
//   and any missing min players / minimum age / play time.
// Pictures come from the game's English Wikipedia article (usually the box),
// else from Wikimedia Commons. Descriptions keep a "Wikipedia: <url>" line so
// the game page can credit them (CC BY-SA 4.0).
import { readFileSync, writeFileSync } from "node:fs";
import type { Game } from "../src/lib/types";

const UA = "TableTopCompanion-importer/1.0 (board game catalogue)";
const SEED = new URL("../src/data/seed.json", import.meta.url);
const write = process.argv.includes("--write");
const toDb = process.argv.includes("--db");

type Wiki = {
  item: string; bggId: number | null; names: string[]; year: number | null;
  minPlayers: number | null; maxPlayers: number | null; minAge: number | null; playTime: number | null;
  commons: string | null; enwiki: string | null; dewiki: string | null; frwiki: string | null;
};
type Found = { picture: string | null; extract: string | null; url: string | null };

const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim();
/** Name as written, without "The", and without an edition in brackets. */
const variants = (name: string) => {
  const out = new Set<string>();
  for (const v of [name, name.replace(/\s*\(.*?\)\s*/g, " ")]) {
    const n = norm(v);
    if (n) { out.add(n); out.add(n.replace(/^the /, "")); }
  }
  return [...out];
};
/** "Dead of Winter: The Long Night" -> "dead of winter": only trusted with the exact same year. */
const withoutSubtitle = (name: string) => {
  const head = name.split(/:\s| – | - /)[0];
  return head === name ? [] : variants(head);
};

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { ...init, headers: { "User-Agent": UA, Accept: "application/json", ...init?.headers } });
    if (res.ok) return res.json() as Promise<T>;
    if (attempt < 4 && (res.status === 429 || res.status >= 500)) { await new Promise((r) => setTimeout(r, 2000 * 2 ** attempt)); continue; }
    throw new Error(`${res.status} from ${new URL(url).host}: ${(await res.text()).slice(0, 200)}`);
  }
}

// 1. Every board/card game on Wikidata, plus everything with a BGG id.
const QUERY = `
SELECT ?item ?bgg ?label (GROUP_CONCAT(DISTINCT ?alt; separator="|") AS ?alts) (SAMPLE(?date) AS ?d)
  (SAMPLE(?minP) AS ?min) (SAMPLE(?maxP) AS ?max) (SAMPLE(?age) AS ?a) (SAMPLE(?dur) AS ?du) (SAMPLE(?unit) AS ?u)
  (SAMPLE(?img) AS ?image) (SAMPLE(?article) AS ?wiki) (SAMPLE(?deArticle) AS ?de) (SAMPLE(?frArticle) AS ?fr)
WHERE {
  { ?item wdt:P2339 [] } UNION { VALUES ?t { wd:Q131436 wd:Q142714 wd:Q1272194 } ?item wdt:P31 ?t }
  ?item rdfs:label ?label FILTER(LANG(?label) = "en")
  OPTIONAL { ?item wdt:P2339 ?bgg }
  OPTIONAL { ?item skos:altLabel ?alt FILTER(LANG(?alt) IN ("en", "de", "fr")) }
  OPTIONAL { ?item wdt:P577|wdt:P571 ?date }
  OPTIONAL { ?item wdt:P1872 ?minP }
  OPTIONAL { ?item wdt:P1873 ?maxP }
  OPTIONAL { ?item wdt:P2899 ?age }
  OPTIONAL { ?item p:P2047/psv:P2047 [ wikibase:quantityAmount ?dur; wikibase:quantityUnit ?unit ] }
  OPTIONAL { ?item wdt:P18 ?img }
  OPTIONAL { ?article schema:about ?item; schema:isPartOf <https://en.wikipedia.org/> }
  OPTIONAL { ?deArticle schema:about ?item; schema:isPartOf <https://de.wikipedia.org/> }
  OPTIONAL { ?frArticle schema:about ?item; schema:isPartOf <https://fr.wikipedia.org/> }
}
GROUP BY ?item ?bgg ?label`;

console.log("Fetching games from Wikidata...");
type Binding = Record<string, { value: string } | undefined>;
const sparql = await json<{ results: { bindings: Binding[] } }>("https://query.wikidata.org/sparql", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/sparql-results+json" },
  body: new URLSearchParams({ query: QUERY }),
});
const num = (b: Binding, k: string) => (b[k] ? Number(b[k]!.value) : null);
const title = (v: { value: string } | undefined) => (v ? decodeURIComponent(v.value.split("/wiki/")[1]).replace(/_/g, " ") : null);
const MINUTES: Record<string, number> = { Q7727: 1, Q25235: 60, Q11574: 1 / 60 };
const wiki: Wiki[] = sparql.results.bindings.map((b) => {
  const unit = b.u?.value.split("/").pop() ?? "";
  const dur = num(b, "du");
  return {
    item: b.item!.value.split("/").pop()!,
    bggId: num(b, "bgg"),
    names: [b.label!.value, ...(b.alts?.value ? b.alts.value.split("|") : [])],
    year: b.d ? Number(b.d.value.slice(0, 4)) || null : null,
    minPlayers: num(b, "min"), maxPlayers: num(b, "max"), minAge: num(b, "a"),
    // Unitless or unknown units are read as minutes, the usual case on Wikidata.
    playTime: dur === null ? null : Math.round(dur * (MINUTES[unit] ?? 1)),
    commons: b.image ? `https://commons.wikimedia.org/wiki/Special:FilePath/${b.image.value.split("FilePath/")[1]}?width=640` : null,
    enwiki: title(b.wiki), dewiki: title(b.de), frwiki: title(b.fr),
  };
});
console.log(`  ${wiki.length} entries`);

const byName = new Map<string, Wiki[]>();
/** Primary-name keys; an alternative name alone is only trusted when the year confirms it. */
const primary = new Map(wiki.map((w) => [w, new Set(variants(w.names[0]))]));
for (const w of wiki) for (const n of new Set(w.names.flatMap(variants))) (byName.get(n) ?? byName.set(n, []).get(n)!).push(w);
const byBgg = new Map(wiki.filter((w) => w.bggId).map((w) => [w.bggId!, w]));

/** Exact name first; the year decides between namesakes and rules out a different game. */
function match(g: Game): Wiki | null {
  if (g.bggId && byBgg.has(g.bggId)) return byBgg.get(g.bggId)!;
  const score = (w: Wiki) => (w.year === g.year ? 4 : w.year ? 2 : 0) + (w.enwiki ? 1 : 0) + (w.bggId ? 1 : 0);
  const pick = (names: string[], ok: (w: Wiki) => boolean) => {
    const hits = [...new Set(names.flatMap((n) => byName.get(n) ?? []))].filter(ok);
    return hits.sort((a, b) => score(b) - score(a))[0] ?? null;
  };
  const names = variants(g.name);
  return pick(names, (w) => w.year === null ? names.some((n) => primary.get(w)!.has(n)) : Math.abs(w.year - g.year) <= 2)
    ?? pick(withoutSubtitle(g.name), (w) => w.year === g.year);
}

// 2. Wikipedia: lead image (usually the box) and the intro paragraph.
async function wikipedia(lang: string, titles: string[]): Promise<Map<string, Found>> {
  const out = new Map<string, Found>();
  for (let i = 0; i < titles.length; i += 20) {
    const batch = titles.slice(i, i + 20);
    const q = new URLSearchParams({
      action: "query", format: "json", formatversion: "2", redirects: "1", titles: batch.join("|"),
      prop: "pageimages|extracts|info", inprop: "url", piprop: "thumbnail", pithumbsize: "640", pilicense: process.argv.includes("--free-only") ? "free" : "any",
      exintro: "1", explaintext: "1", exlimit: "20",
    });
    type Page = { title: string; missing?: boolean; fullurl?: string; extract?: string; thumbnail?: { source: string } };
    const r = await json<{ query: { pages: Page[]; redirects?: { from: string; to: string }[]; normalized?: { from: string; to: string }[] } }>(`https://${lang}.wikipedia.org/w/api.php?${q}`);
    const alias = new Map([...(r.query.normalized ?? []), ...(r.query.redirects ?? [])].map((x) => [x.to, x.from]));
    for (const p of r.query.pages) {
      if (p.missing) continue;
      const extract = p.extract?.split("\n").filter((l) => l.trim()).slice(0, 3).join("\n\n").trim() || null;
      const found = { picture: p.thumbnail?.source.split("?")[0] ?? null, extract, url: p.fullurl ?? null };
      let key: string | undefined = p.title;
      while (key) { out.set(key, found); key = alias.get(key); }
    }
  }
  return out;
}

// 3. Plan the changes, filling only what is empty.
function plan(games: Game[]) {
  const changes: { game: Game; patch: Partial<Game> }[] = [];
  for (const g of games) {
    const w = match(g);
    if (!w) continue;
    const page = w.enwiki ? pages.en.get(w.enwiki) : undefined;
    const patch: Partial<Game> = {};
    if (!g.bggId && w.bggId && !games.some((o) => o.bggId === w.bggId)) patch.bggId = w.bggId;
    const bgg = g.bggId ?? patch.bggId;
    if (!g.linkUrl && bgg) patch.linkUrl = `https://boardgamegeek.com/boardgame/${bgg}`;
    const picture = page?.picture ?? (w.dewiki && pages.de.get(w.dewiki)?.picture) ?? (w.frwiki && pages.fr.get(w.frwiki)?.picture) ?? w.commons;
    if (!g.imageUrl && picture) patch.imageUrl = picture;
    if (!g.maxPlayers && w.maxPlayers) patch.maxPlayers = w.maxPlayers;
    if (!g.description && page?.extract && page.url) patch.description = `${page.extract}\n\nWikipedia: ${page.url}`;
    const values = { ...g.values };
    let filled = false;
    for (const [k, v] of [["minPlayers", w.minPlayers], ["minAge", w.minAge], ["playTime", w.playTime]] as const) {
      if (values[k] == null && v) { values[k] = v; filled = true; }
    }
    if (filled) patch.values = values;
    if (Object.keys(patch).length) changes.push({ game: g, patch });
  }
  return changes;
}

const seed: { games: Game[] } & Record<string, unknown> = JSON.parse(readFileSync(SEED, "utf8"));
let dbGames: Game[] = [];
let sqlClient: import("postgres").Sql | null = null;
if (toDb) {
  const url = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) { console.error("--db needs DATABASE_URL in .env.local"); process.exit(1); }
  const postgres = (await import("postgres")).default;
  const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
  sqlClient = postgres(url, { prepare: false, max: 1, ssl: local ? false : "require", onnotice: () => {} });
  dbGames = (await sqlClient`select id, bgg_id, name, year, image_url, link_url, values, max_players, description from games`).map((r) => ({
    id: r.id, bggId: r.bgg_id, name: r.name, year: r.year, imageUrl: r.image_url, linkUrl: r.link_url,
    values: r.values, maxPlayers: r.max_players, description: r.description,
  }) as Game);
}

const matched = [...seed.games, ...dbGames].map(match).filter((w): w is Wiki => w !== null);
const titlesFor = (k: "enwiki" | "dewiki" | "frwiki", only: (w: Wiki) => boolean = () => true) =>
  [...new Set(matched.filter(only).map((w) => w[k]).filter((t): t is string => Boolean(t)))];
const en = titlesFor("enwiki");
console.log(`Reading ${en.length} English Wikipedia articles...`);
const pages = { en: await wikipedia("en", en), de: new Map<string, Found>(), fr: new Map<string, Found>() };
// Other languages only for pictures the English article lacks.
const noPicture = (w: Wiki) => !(w.enwiki && pages.en.get(w.enwiki)?.picture);
pages.de = await wikipedia("de", titlesFor("dewiki", noPicture));
pages.fr = await wikipedia("fr", titlesFor("frwiki", (w) => noPicture(w) && !(w.dewiki && pages.de.get(w.dewiki)?.picture)));

const report = (label: string, games: Game[], changes: ReturnType<typeof plan>) => {
  const n = (k: keyof Game) => changes.filter((c) => k in c.patch).length;
  const matched = games.filter((g) => match(g)).length;
  console.log(`\n${label}: ${matched}/${games.length} matched · ${changes.length} to update`);
  console.log(`  pictures +${n("imageUrl")} · BGG ids +${n("bggId")} · descriptions +${n("description")} · max players +${n("maxPlayers")} · stats +${n("values")}`);
  const unmatched = games.filter((g) => !match(g)).map((g) => g.name);
  if (unmatched.length) console.log(`  not on Wikidata (${unmatched.length}): ${unmatched.slice(0, 25).join(", ")}${unmatched.length > 25 ? ", …" : ""}`);
};

const seedChanges = plan(seed.games);
report("seed.json", seed.games, seedChanges);
if (write) {
  for (const { game, patch } of seedChanges) Object.assign(game, patch);
  writeFileSync(SEED, JSON.stringify(seed, null, 1));
  console.log("  ✓ written");
}

if (sqlClient) {
  const dbChanges = plan(dbGames);
  report("database", dbGames, dbChanges);
  if (write) {
    for (const { game, patch } of dbChanges) {
      // Re-check emptiness in SQL so an admin edit made meanwhile still wins.
      await sqlClient`update games set
        bgg_id = coalesce(bgg_id, ${patch.bggId ?? null}),
        link_url = coalesce(link_url, ${patch.linkUrl ?? null}),
        image_url = coalesce(image_url, ${patch.imageUrl ?? null}),
        max_players = coalesce(max_players, ${patch.maxPlayers ?? null}),
        description = coalesce(description, ${patch.description ?? null}),
        values = ${patch.values ? sqlClient.json(patch.values as never) : sqlClient`values`},
        updated_at = now()
        where id = ${game.id}`;
    }
    console.log("  ✓ written (the site shows it after the catalogue cache clears: redeploy, or edit any game in admin)");
  }
  await sqlClient.end();
}
if (!write) console.log("\nDry run. Add --write (and --db for the database) to apply.");
if (process.argv.includes("--list")) {
  for (const g of seed.games) {
    const w = match(g);
    if (w) console.log(`${g.name} (${g.year}) -> ${w.names[0]} (${w.year ?? "?"}) ${w.item}`);
  }
}

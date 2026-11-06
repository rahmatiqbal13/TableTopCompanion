// Parsing helpers for the BoardGameGeek XML API2 (https://boardgamegeek.com/using_the_xml_api).
import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  htmlEntities: true,
  // isArray also sees attribute names (e.g. <poll name="...">), so skip those.
  isArray: (name, _jPath, _isLeaf, isAttribute) =>
    !isAttribute && ["item", "name", "link", "poll", "results", "result", "rank"].includes(name),
});

export interface BggThing {
  bggId: number;
  name: string;
  year: number | null;
  minPlayers: number | null;
  maxPlayers: number | null;
  playTime: number | null;
  minAge: number | null;
  rating: number | null;
  complexity: number | null;
  votes: number | null;
  bggRank: number | null;
  bestPlayers: number[];
  recPlayers: number[];
  categories: string[];
  mechanics: string[];
  imageUrl: string | null;
  description: string | null;
}

export interface BggSearchHit {
  bggId: number;
  name: string;
  year: number | null;
}

type Attr = { value?: string };
const num = (a: Attr | undefined) => {
  const v = Number(a?.value);
  return a?.value !== undefined && a.value !== "" && Number.isFinite(v) ? v : null;
};
const positive = (v: number | null) => (v !== null && v > 0 ? v : null);

export function parseSearch(xml: string): BggSearchHit[] {
  const items = parser.parse(xml)?.items?.item ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return items.map((it: any) => ({
    bggId: Number(it.id),
    name: it.name?.[0]?.value ?? "",
    year: num(it.yearpublished),
  }));
}

export function parseThings(xml: string): BggThing[] {
  const items = parser.parse(xml)?.items?.item ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return items.filter((it: any) => it.type === "boardgame").map((it: any): BggThing => {
    const links: { type: string; value: string }[] = it.link ?? [];
    const ratings = it.statistics?.ratings ?? {};
    const rank = (ratings.ranks?.rank ?? []).find((r: { name: string }) => r.name === "boardgame");
    const { best, rec } = playerPoll(it.poll ?? []);
    const desc = typeof it.description === "string" ? it.description.trim() : "";
    return {
      bggId: Number(it.id),
      name: (it.name ?? []).find((n: { type: string }) => n.type === "primary")?.value ?? it.name?.[0]?.value ?? "",
      year: positive(num(it.yearpublished)),
      minPlayers: positive(num(it.minplayers)),
      maxPlayers: positive(num(it.maxplayers)),
      playTime: positive(num(it.playingtime)),
      minAge: positive(num(it.minage)),
      rating: positive(num(ratings.average)),
      complexity: positive(num(ratings.averageweight)),
      votes: num(ratings.usersrated),
      bggRank: rank ? positive(num(rank)) : null,
      bestPlayers: best,
      recPlayers: rec,
      categories: links.filter((l) => l.type === "boardgamecategory").map((l) => l.value),
      mechanics: links.filter((l) => l.type === "boardgamemechanic").map((l) => l.value),
      imageUrl: typeof it.image === "string" ? it.image.trim() : null,
      description: desc ? desc.slice(0, 2000) : null,
    };
  });
}

/**
 * "Best" = Best has the most votes; "Recommended" = Best + Recommended beat
 * Not Recommended. Counts with fewer than 3 votes, or "N+" buckets, are ignored.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function playerPoll(polls: any[]): { best: number[]; rec: number[] } {
  const poll = polls.find((p) => p.name === "suggested_numplayers");
  const best: number[] = [], rec: number[] = [];
  for (const r of poll?.results ?? []) {
    const n = Number(r.numplayers);
    if (!Number.isInteger(n)) continue;
    const votes = Object.fromEntries((r.result ?? []).map((x: { value: string; numvotes: string }) => [x.value, Number(x.numvotes)]));
    const b = votes["Best"] ?? 0, ok = votes["Recommended"] ?? 0, no = votes["Not Recommended"] ?? 0;
    if (b + ok + no < 3) continue;
    if (b >= ok && b >= no) best.push(n);
    if (b + ok > no) rec.push(n);
  }
  return { best, rec };
}

/** Maps BGG categories to the legacy genre names. Returns null when nothing matches. */
export const GENRE_BY_CATEGORY: [string, string][] = [
  ["Wargame", "War Game"],
  ["Medical", "Medical Game"],
  ["Video Game Theme", "Videogame Theme"],
  ["Children's Game", "Children's Game"],
  ["Bluffing", "Bluffing Game"],
  ["Abstract Strategy", "Abstract Strategy Game"],
  ["Card Game", "Card Game"],
];
export function genreFor(categories: string[]): string | null {
  for (const [cat, genre] of GENRE_BY_CATEGORY) if (categories.includes(cat)) return genre;
  return null;
}

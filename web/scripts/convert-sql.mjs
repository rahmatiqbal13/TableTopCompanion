// One-off converter: legacy MySQL dump (../legacy/db/bg_topsis.sql) -> src/data/seed.json
// Usage: node scripts/convert-sql.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(resolve(here, "../../legacy/db/bg_topsis.sql"), "utf8");

/** Returns the tuples of the INSERT INTO `table` statement as arrays of values. */
function rows(table) {
  const start = sql.indexOf(`INSERT INTO \`${table}\``);
  if (start < 0) throw new Error(`No INSERT for ${table}`);
  const body = sql.slice(sql.indexOf("VALUES", start) + 6, sql.indexOf(";\n", start));
  const out = [];
  let row = null, cur = "", inStr = false;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (inStr) {
      if (c === "\\") { const n = body[++i]; cur += n === "r" || n === "n" ? "" : n; }
      else if (c === "'") inStr = false;
      else cur += c;
    } else if (c === "'") inStr = true;
    else if (c === "(") { row = []; cur = ""; }
    else if (c === "," && row) { row.push(cur.trim()); cur = ""; }
    else if (c === ")") { row.push(cur.trim()); out.push(row); row = null; }
    else if (row) cur += c;
  }
  return out;
}

// Legacy criteria -> new metadata. Types follow the legacy admin defaults.
const criteriaMeta = {
  1: { key: "minPlayers", name: "Minimum players", unit: "players", hint: "Fewer = easier to get to the table" },
  2: { key: "rating", name: "Average rating", unit: "/ 10", hint: "BoardGameGeek community rating" },
  3: { key: "complexity", name: "Complexity", unit: "/ 5", hint: "BGG weight: 1 = light, 5 = heavy" },
  4: { key: "playTime", name: "Play time", unit: "min", hint: "Typical session length" },
  5: { key: "minAge", name: "Recommended age", unit: "+", hint: "Publisher's minimum age" },
};

const genres = rows("tab_genre").map(([id, name]) => ({ id: +id, name }));
const criteria = rows("tab_kriteria").map(([id, , bobot, tipe], i) => ({
  id: +id,
  ...criteriaMeta[id],
  defaultWeight: +bobot,
  type: tipe === "max" ? "benefit" : "cost",
  sort: i,
}));
const values = rows("tab_topsis");
// The dump was latin1, so non-ASCII characters became "?". Restore known names.
const nameFixes = {
  "Shusi Go!": "Sushi Go!",
  "Kory?": "Koryŏ",
  "Labyrinth: The War on Terror, 2001 ? ?": "Labyrinth: The War on Terror, 2001 – ?",
  "Conflict of Heroes: Awakening the Bear! ? Russia 1": "Conflict of Heroes: Awakening the Bear! – Russia 1941-1942",
  "Conflict of Heroes: Storms of Steel! ? Kursk 1943": "Conflict of Heroes: Storms of Steel! – Kursk 1943",
  "Codex: Card-Time Strategy ? Deluxe Set": "Codex: Card-Time Strategy – Deluxe Set",
};

// Legacy cf.geekdo-images.com/images/picN.jpg links now return 403, so they are
// dropped; the UI renders generated cover art instead. Admins can set new URLs.
const deadImage = /^https?:\/\/cf\.geekdo-images\.com\/images\//;

const games = rows("tab_alternatif").map(([id, name, year, genreId, img, link]) => {
  const v = {};
  for (const [gid, cid, val] of values) if (gid === id) v[criteriaMeta[cid].key] = +val;
  const image = img.trim();
  return {
    id: +id, bggId: null, name: nameFixes[name] ?? name, year: +year, genreId: +genreId,
    imageUrl: image && !deadImage.test(image) ? image : null,
    linkUrl: link.trim() || null, values: v,
    maxPlayers: null, bestPlayers: [], recPlayers: [], votes: null, bggRank: null,
    categories: [], mechanics: [], description: null,
  };
});

for (const g of games) {
  const missing = criteria.filter((c) => g.values[c.key] === undefined);
  if (missing.length) console.warn(`! ${g.name} missing ${missing.map((m) => m.key)}`);
}

const out = resolve(here, "../src/data/seed.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ genres, criteria, games }, null, 1));
console.log(`Wrote ${games.length} games, ${criteria.length} criteria, ${genres.length} genres`);

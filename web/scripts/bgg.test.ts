import { expect, it } from "vitest";
import { genreFor, parseSearch, parseThings } from "./bgg";

const THING = `<?xml version="1.0" encoding="utf-8"?>
<items termsofuse="https://boardgamegeek.com/xmlapi/termsofuse">
 <item type="boardgame" id="192291">
  <thumbnail>https://cf.geekdo-images.com/t.jpg</thumbnail>
  <image>https://cf.geekdo-images.com/full.jpg</image>
  <name type="primary" sortindex="1" value="Sushi Go Party!" />
  <name type="alternate" sortindex="1" value="Sushi Go Party! (alt)" />
  <description>Pass the cards&#10;&#10;and &quot;eat&quot; well.</description>
  <yearpublished value="2016" />
  <minplayers value="2" /><maxplayers value="8" />
  <poll name="suggested_numplayers" title="User Suggested Number of Players" totalvotes="100">
   <results numplayers="2"><result value="Best" numvotes="1" /><result value="Recommended" numvotes="5" /><result value="Not Recommended" numvotes="20" /></results>
   <results numplayers="4"><result value="Best" numvotes="40" /><result value="Recommended" numvotes="20" /><result value="Not Recommended" numvotes="1" /></results>
   <results numplayers="5"><result value="Best" numvotes="30" /><result value="Recommended" numvotes="35" /><result value="Not Recommended" numvotes="2" /></results>
   <results numplayers="8+"><result value="Best" numvotes="0" /><result value="Recommended" numvotes="1" /><result value="Not Recommended" numvotes="9" /></results>
  </poll>
  <playingtime value="20" /><minplaytime value="20" /><maxplaytime value="20" />
  <minage value="8" />
  <link type="boardgamecategory" id="1002" value="Card Game" />
  <link type="boardgamemechanic" id="2041" value="Open Drafting" />
  <link type="boardgamemechanic" id="2004" value="Set Collection" />
  <statistics page="1"><ratings>
   <usersrated value="40000" /><average value="7.43" /><bayesaverage value="7.2" />
   <ranks><rank type="subtype" id="1" name="boardgame" friendlyname="Board Game Rank" value="250" bayesaverage="7.2" />
          <rank type="family" id="5499" name="familygames" friendlyname="Family Game Rank" value="40" bayesaverage="7.2" /></ranks>
   <averageweight value="1.33" />
  </ratings></statistics>
 </item>
 <item type="boardgameexpansion" id="1"><name type="primary" value="Expansion" /></item>
</items>`;

it("parses a BGG thing", () => {
  const [t, ...rest] = parseThings(THING);
  expect(rest).toHaveLength(0); // expansions skipped
  expect(t).toMatchObject({
    bggId: 192291, name: "Sushi Go Party!", year: 2016, minPlayers: 2, maxPlayers: 8, playTime: 20, minAge: 8,
    rating: 7.43, complexity: 1.33, votes: 40000, bggRank: 250,
    bestPlayers: [4], recPlayers: [4, 5], categories: ["Card Game"], mechanics: ["Open Drafting", "Set Collection"],
    imageUrl: "https://cf.geekdo-images.com/full.jpg",
  });
  expect(t.description).toBe('Pass the cards\n\nand "eat" well.');
});

it("treats 'Not Ranked' as no rank", () => {
  const [t] = parseThings(THING.replace('value="250"', 'value="Not Ranked"'));
  expect(t.bggRank).toBeNull();
});

it("parses search results", () => {
  const hits = parseSearch(`<items total="1"><item type="boardgame" id="133473"><name type="primary" value="Sushi Go!"/><yearpublished value="2013"/></item></items>`);
  expect(hits).toEqual([{ bggId: 133473, name: "Sushi Go!", year: 2013 }]);
});

it("maps categories to legacy genres", () => {
  expect(genreFor(["Card Game", "Wargame"])).toBe("War Game");
  expect(genreFor(["Economic"])).toBeNull();
});

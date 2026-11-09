import { describe, expect, it } from "vitest";
import { formatDuration, isTikTokShortLink, parseDuration, parseTikTokId, parseVideoLink, postThumb } from "../video";

const ID = "7234567890123456789";

describe("TikTok links", () => {
  it.each([
    [`https://www.tiktok.com/@boardgamer/video/${ID}`, ID],
    [`https://www.tiktok.com/@boardgamer/video/${ID}?is_from_webapp=1`, ID],
    [`https://m.tiktok.com/v/video/${ID}/`, ID],
    [`https://www.tiktok.com/embed/v2/${ID}`, ID],
    [`https://www.tiktok.com/player/v1/${ID}`, ID],
    [`https://evil.com/@x/video/${ID}`, null],
    [`https://tiktok.com.evil.com/@x/video/${ID}`, null],
    [`javascript:alert(1)//tiktok.com/video/${ID}`, null],
    ["https://www.tiktok.com/@boardgamer", null],
    ["", null],
  ])("%s -> %s", (input, expected) => {
    expect(parseTikTokId(input)).toBe(expected);
  });

  it("recognises app share links, which need resolving", () => {
    expect(isTikTokShortLink("https://vm.tiktok.com/ZMabc123/")).toBe(true);
    expect(isTikTokShortLink("https://vt.tiktok.com/ZSabc123/")).toBe(true);
    expect(isTikTokShortLink("https://www.tiktok.com/t/ZTabc123/")).toBe(true);
    expect(isTikTokShortLink(`https://www.tiktok.com/@x/video/${ID}`)).toBe(false);
    expect(isTikTokShortLink("https://vm.tiktok.com.evil.com/abc")).toBe(false);
  });
});

it("tells the platforms apart", () => {
  expect(parseVideoLink("https://youtu.be/dQw4w9WgXcQ")).toEqual({ platform: "youtube", id: "dQw4w9WgXcQ" });
  expect(parseVideoLink(`https://www.tiktok.com/@x/video/${ID}`)).toEqual({ platform: "tiktok", id: ID });
  expect(parseVideoLink("https://vimeo.com/123")).toBeNull();
});

it("prefers the cover, then the YouTube thumbnail; TikTok has none of its own", () => {
  expect(postThumb({ coverUrl: "https://x/y.jpg", youtubeId: "dQw4w9WgXcQ", tiktokId: null })).toBe("https://x/y.jpg");
  expect(postThumb({ coverUrl: null, youtubeId: "dQw4w9WgXcQ", tiktokId: null })).toContain("dQw4w9WgXcQ");
  expect(postThumb({ coverUrl: null, youtubeId: null, tiktokId: ID })).toBeNull();
});

describe("durations", () => {
  it.each([["6:12", 372], ["0:45", 45], ["1:02:03", 3723], ["90", 90], ["abc", null], ["6:99", null], ["", null]])("%s -> %s", (input, expected) => {
    expect(parseDuration(input)).toBe(expected);
  });
  it.each([[372, "6:12"], [45, "0:45"], [3723, "1:02:03"]])("%s -> %s", (input, expected) => {
    expect(formatDuration(input)).toBe(expected);
  });
});

import { expect, it } from "vitest";
import { parseYouTubeId } from "../youtube";

it.each([
  ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
  ["https://youtu.be/dQw4w9WgXcQ?t=42", "dQw4w9WgXcQ"],
  ["https://www.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
  ["https://www.youtube.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
  ["https://m.youtube.com/watch?v=dQw4w9WgXcQ&list=x", "dQw4w9WgXcQ"],
  ["dQw4w9WgXcQ", "dQw4w9WgXcQ"],
  ["https://vimeo.com/123", null],
  ["https://evil.com/watch?v=dQw4w9WgXcQ", null],
  ["not a url", null],
  ["", null],
])("%s -> %s", (input, expected) => {
  expect(parseYouTubeId(input)).toBe(expected);
});

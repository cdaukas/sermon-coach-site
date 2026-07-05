import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { plainTextFromSupadataContent } from "./supadata";
import { isValidYoutubeUrl, extractYoutubeVideoId } from "./youtube-url";

describe("youtube url validation", () => {
  it("accepts watch, youtu.be, and live URLs", () => {
    assert.equal(
      isValidYoutubeUrl("https://www.youtube.com/watch?v=SVe7s1P05i4"),
      true,
    );
    assert.equal(isValidYoutubeUrl("https://youtu.be/SVe7s1P05i4"), true);
    assert.equal(
      isValidYoutubeUrl("https://www.youtube.com/live/OrCi6CMutus"),
      true,
    );
  });

  it("rejects non-YouTube URLs and watch URLs without v=", () => {
    assert.equal(isValidYoutubeUrl("https://vimeo.com/123"), false);
    assert.equal(isValidYoutubeUrl("https://www.youtube.com/watch"), false);
    assert.equal(isValidYoutubeUrl(""), false);
  });

  it("extracts video ids", () => {
    assert.equal(
      extractYoutubeVideoId("https://www.youtube.com/watch?v=NPJfTJj_40w"),
      "NPJfTJj_40w",
    );
    assert.equal(
      extractYoutubeVideoId("https://youtu.be/NPJfTJj_40w"),
      "NPJfTJj_40w",
    );
    assert.equal(
      extractYoutubeVideoId("https://www.youtube.com/live/OrCi6CMutus"),
      "OrCi6CMutus",
    );
  });
});

describe("supadata plain text extraction", () => {
  it("joins chunk arrays into plain text", () => {
    const text = plainTextFromSupadataContent([
      { text: "Hello" },
      { text: "world" },
    ]);
    assert.equal(text, "Hello world");
  });
});

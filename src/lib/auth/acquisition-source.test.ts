import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ACQUISITION_DETAIL_MAX_LENGTH,
  ACQUISITION_SOURCES,
  ACQUISITION_SOURCES_WITH_DETAIL,
  ACQUISITION_SOURCE_OPTIONS,
  acquisitionDetailLabel,
  acquisitionSourceAcceptsDetail,
} from "./acquisition-source";

describe("acquisitionSourceAcceptsDetail", () => {
  it("accepts detail for the three sources that imply a person sent them", () => {
    assert.equal(acquisitionSourceAcceptsDetail("pastor_friend"), true);
    assert.equal(acquisitionSourceAcceptsDetail("gtn"), true);
    assert.equal(acquisitionSourceAcceptsDetail("other"), true);
  });

  it("rejects detail for the impersonal channels", () => {
    assert.equal(acquisitionSourceAcceptsDetail("chris_email"), false);
    assert.equal(acquisitionSourceAcceptsDetail("newsletter_blog"), false);
    assert.equal(acquisitionSourceAcceptsDetail("search"), false);
    assert.equal(acquisitionSourceAcceptsDetail("social"), false);
  });

  it("treats no selection as accepting nothing", () => {
    assert.equal(acquisitionSourceAcceptsDetail(null), false);
  });
});

describe("acquisitionDetailLabel", () => {
  it("gives each detail source its own label", () => {
    assert.equal(
      acquisitionDetailLabel("pastor_friend"),
      "Who was it? I'd like to thank them.",
    );
    assert.equal(acquisitionDetailLabel("gtn"), "Who at GTN pointed you here?");
    assert.equal(acquisitionDetailLabel("other"), "Tell me more.");
  });

  it("returns null where no field is shown", () => {
    assert.equal(acquisitionDetailLabel("search"), null);
    assert.equal(acquisitionDetailLabel(null), null);
  });
});

describe("option table", () => {
  it("covers every source exactly once", () => {
    const keys = ACQUISITION_SOURCE_OPTIONS.map((option) => option.key);
    assert.deepEqual([...keys].sort(), [...ACQUISITION_SOURCES].sort());
    assert.equal(new Set(keys).size, keys.length);
  });

  it("carries a detail label for exactly the detail-accepting sources", () => {
    const labelled = ACQUISITION_SOURCE_OPTIONS.filter(
      (option) => acquisitionDetailLabel(option.key) !== null,
    ).map((option) => option.key);

    assert.deepEqual(
      [...labelled].sort(),
      [...ACQUISITION_SOURCES_WITH_DETAIL].sort(),
    );
  });

  it("keeps the detail set inside the known sources", () => {
    for (const source of ACQUISITION_SOURCES_WITH_DETAIL) {
      assert.ok(
        (ACQUISITION_SOURCES as ReadonlyArray<string>).includes(source),
        `${source} is not a known acquisition source`,
      );
    }
  });
});

describe("ACQUISITION_DETAIL_MAX_LENGTH", () => {
  it("fits a name and a church without inviting a paragraph", () => {
    assert.equal(ACQUISITION_DETAIL_MAX_LENGTH, 120);
    assert.ok(
      "Pastor Mike at Grace Community in Tulsa".length <
        ACQUISITION_DETAIL_MAX_LENGTH,
    );
  });
});

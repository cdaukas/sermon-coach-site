import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isHeavyDottedGmail,
  isValidNewsletterEmail,
  normalizeNewsletterEmail,
} from "./newsletter";

describe("normalizeNewsletterEmail (SQL normalize_email parity)", () => {
  it("strips Gmail dots and plus-tags, maps googlemail → gmail", () => {
    assert.equal(
      normalizeNewsletterEmail("R.Pe.Ytavi+foo@googlemail.com"),
      "rpeytavi@gmail.com",
    );
    assert.equal(
      normalizeNewsletterEmail("r.pe.ytavi@gmail.com"),
      "rpeytavi@gmail.com",
    );
    assert.equal(
      normalizeNewsletterEmail("rpeyt.avi@gmail.com"),
      "rpeytavi@gmail.com",
    );
  });

  it("collapses two dotted variants to one canonical address", () => {
    const a = normalizeNewsletterEmail("r.pe.ytavi@gmail.com");
    const b = normalizeNewsletterEmail("rpeyt.avi@gmail.com");
    assert.equal(a, b);
    assert.equal(a, "rpeytavi@gmail.com");
  });

  it("keeps normal Gmail with few dots by collapsing them to canonical form", () => {
    assert.equal(
      normalizeNewsletterEmail("john.smith@gmail.com"),
      "johnsmith@gmail.com",
    );
    assert.equal(isValidNewsletterEmail("john.smith@gmail.com"), true);
  });

  it("non-gmail: strips plus-tag, keeps dots", () => {
    assert.equal(
      normalizeNewsletterEmail("Pastor.Jones+news@Church.Org"),
      "pastor.jones@church.org",
    );
  });
});

describe("isHeavyDottedGmail", () => {
  it("rejects Gmail local parts with 4+ dots (pre-normalization)", () => {
    assert.equal(isHeavyDottedGmail("e.h.ol.te.r.m.a.nn.1@gmail.com"), true);
    assert.equal(isHeavyDottedGmail("a.b.c.d.e@googlemail.com"), true);
    assert.equal(isHeavyDottedGmail("j.dga.lbr.a.1@gmail.com"), true);
  });

  it("allows normal Gmail (0–3 dots) and non-Gmail", () => {
    assert.equal(isHeavyDottedGmail("john.smith@gmail.com"), false);
    assert.equal(isHeavyDottedGmail("john.s.mith@gmail.com"), false);
    assert.equal(isHeavyDottedGmail("a.b.c@gmail.com"), false);
    assert.equal(isHeavyDottedGmail("pastor.jones@church.org"), false);
    assert.equal(isHeavyDottedGmail("a.b.c.d.e@yahoo.com"), false);
  });
});

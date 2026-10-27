import { test } from "node:test";
import assert from "node:assert/strict";
import { fitPosts, linkedinText, shouldRepurpose, toXPosts } from "../src/logic.js";

const published = (overrides = {}) => ({
  status: "published",
  platforms: {
    linkedin: { enabled: true, posts: [{ text: "Hello LinkedIn" }] },
    x: { enabled: false },
  },
  ...overrides,
});

test("repurposes a LinkedIn-only published draft", () => {
  assert.equal(shouldRepurpose(published()), true);
});

test("skips drafts that are not published", () => {
  assert.equal(shouldRepurpose(published({ status: "scheduled" })), false);
});

test("skips drafts already posted to X from Typefully", () => {
  const d = published();
  d.platforms.x.enabled = true;
  assert.equal(shouldRepurpose(d), false);
});

test("skips drafts without LinkedIn", () => {
  const d = published();
  d.platforms.linkedin.enabled = false;
  assert.equal(shouldRepurpose(d), false);
});

test("skips empty LinkedIn text", () => {
  const d = published();
  d.platforms.linkedin.posts = [{ text: "  " }];
  assert.equal(shouldRepurpose(d), false);
  assert.equal(linkedinText(d), "");
});

test("toXPosts splits threads on --- lines and accepts arrays", () => {
  assert.deepEqual(toXPosts("one\n---\ntwo\n\n --- \nthree"), ["one", "two", "three"]);
  assert.deepEqual(toXPosts(["a", " ", "b "]), ["a", "b"]);
  assert.deepEqual(toXPosts(undefined), []);
});

test("fitPosts leaves short posts alone", () => {
  assert.deepEqual(fitPosts(["short", "also short"]), ["short", "also short"]);
});

test("fitPosts splits long posts at paragraphs, then sentences, then words", () => {
  const para = "A".repeat(150);
  assert.deepEqual(fitPosts([`${para}\n\n${para}`]), [para, para]);

  const sentence = `${"word ".repeat(30).trim()}.`; // 150 chars
  const out = fitPosts([`${sentence} ${sentence} ${sentence}`]);
  assert.ok(out.every((p) => p.length <= 280));
  assert.equal(out.join(" "), `${sentence} ${sentence} ${sentence}`);

  const words = "lorem ".repeat(100).trim();
  assert.ok(fitPosts([words]).every((p) => p.length <= 280));
});

test("fitPosts hard-cuts unbreakable text", () => {
  const out = fitPosts(["x".repeat(600)]);
  assert.deepEqual(out.map((p) => p.length), [280, 280, 40]);
});

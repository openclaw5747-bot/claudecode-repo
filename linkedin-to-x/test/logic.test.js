import { test } from "node:test";
import assert from "node:assert/strict";
import { linkedinText, shouldRepurpose, toXPosts } from "../src/logic.js";

const published = (overrides = {}) => ({
  status: "published",
  tags: [],
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

test("skips drafts already posted to X", () => {
  const d = published();
  d.platforms.x.enabled = true;
  assert.equal(shouldRepurpose(d), false);
});

test("skips drafts without LinkedIn", () => {
  const d = published();
  d.platforms.linkedin.enabled = false;
  assert.equal(shouldRepurpose(d), false);
});

test("skips drafts this worker created", () => {
  assert.equal(shouldRepurpose(published({ tags: ["auto-repurposed"] })), false);
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

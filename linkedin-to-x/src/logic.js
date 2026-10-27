// Pure helpers: no network, no env. Unit-tested in test/logic.test.js.

export const DEFAULT_TAG = "auto-repurposed";

// Text of a draft's LinkedIn post(s), joined into one string.
export function linkedinText(draft) {
  const posts = draft?.platforms?.linkedin?.posts ?? [];
  return posts
    .map((p) => (p?.text ?? "").trim())
    .filter(Boolean)
    .join("\n\n");
}

// Repurpose only drafts that went out on LinkedIn, weren't already sent to X,
// and weren't created by this worker.
export function shouldRepurpose(draft, tag = DEFAULT_TAG) {
  if (!draft || draft.status !== "published") return false;
  if (!draft.platforms?.linkedin?.enabled) return false;
  if (draft.platforms?.x?.enabled) return false;
  if ((draft.tags ?? []).includes(tag)) return false;
  return linkedinText(draft).length > 0;
}

// Normalise repurposer output into X posts. Accepts an array of strings, or one
// string where thread posts are separated by a line containing only "---".
export function toXPosts(output) {
  const parts = Array.isArray(output) ? output : String(output ?? "").split(/\n\s*---\s*\n/);
  return parts.map((t) => String(t).trim()).filter(Boolean);
}

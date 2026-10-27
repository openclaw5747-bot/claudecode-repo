// Pure helpers: no network, no env. Unit-tested in test/logic.test.js.

export const X_MAX_CHARS = 280;

// Text of a draft's LinkedIn post(s), joined into one string.
export function linkedinText(draft) {
  const posts = draft?.platforms?.linkedin?.posts ?? [];
  return posts
    .map((p) => (p?.text ?? "").trim())
    .filter(Boolean)
    .join("\n\n");
}

// Repurpose only drafts that went out on LinkedIn and weren't also sent to X
// from Typefully.
export function shouldRepurpose(draft) {
  if (!draft || draft.status !== "published") return false;
  if (!draft.platforms?.linkedin?.enabled) return false;
  if (draft.platforms?.x?.enabled) return false;
  return linkedinText(draft).length > 0;
}

// Normalise repurposer output into X posts. Accepts an array of strings, or one
// string where thread posts are separated by a line containing only "---".
export function toXPosts(output) {
  const parts = Array.isArray(output) ? output : String(output ?? "").split(/\n\s*---\s*\n/);
  return parts.map((t) => String(t).trim()).filter(Boolean);
}

// Make every post fit X's limit by splitting long ones into thread parts,
// breaking at paragraphs, then sentences, then words.
export function fitPosts(posts, max = X_MAX_CHARS) {
  return posts.flatMap((p) => split(p, max));
}

function split(text, max) {
  if (text.length <= max) return [text];
  const breaks = [
    [/\n\s*\n/, "\n\n"], // paragraphs
    [/(?<=[.!?])\s+/, " "], // sentences
    [/\s+/, " "], // words
  ];
  for (const [pattern, glue] of breaks) {
    const pieces = text.split(pattern).filter(Boolean);
    if (pieces.length < 2) continue;
    const out = [];
    let cur = "";
    for (const piece of pieces) {
      const joined = cur ? `${cur}${glue}${piece}` : piece;
      if (joined.length <= max) cur = joined;
      else {
        if (cur) out.push(cur);
        cur = piece;
      }
    }
    if (cur) out.push(cur);
    return out.flatMap((p) => split(p, max));
  }
  // A single unbreakable run (e.g. a huge URL): hard cut.
  return [text.slice(0, max), ...split(text.slice(max), max)].filter(Boolean);
}

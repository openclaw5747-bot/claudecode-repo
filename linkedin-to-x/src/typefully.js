// Minimal Typefully API v2 client. Docs: https://typefully.com/docs/api

const BASE = "https://api.typefully.com/v2";

async function call(env, path, init = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.TYPEFULLY_API_KEY}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`Typefully ${init.method ?? "GET"} ${path} → ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

export function getDraft(env, socialSetId, draftId) {
  return call(env, `/social-sets/${socialSetId}/drafts/${draftId}`);
}

// Creates an X draft. publishAt: "next-free-slot" | "now" | ISO datetime | null (draft only).
export function createXDraft(env, socialSetId, posts, { publishAt, tags = [], title, note } = {}) {
  const body = {
    platforms: { x: { enabled: true, posts: posts.map((text) => ({ text })) } },
    tags,
  };
  if (publishAt) body.publish_at = publishAt;
  if (title) body.draft_title = title;
  if (note) body.scratchpad_text = note;
  return call(env, `/social-sets/${socialSetId}/drafts`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

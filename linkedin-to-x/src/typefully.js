// Minimal Typefully API v2 client (read-only). Docs: https://typefully.com/docs/api

const BASE = "https://api.typefully.com/v2";

export async function getDraft(env, socialSetId, draftId) {
  const path = `/social-sets/${socialSetId}/drafts/${draftId}`;
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${env.TYPEFULLY_API_KEY}` },
  });
  if (!res.ok) throw new Error(`Typefully GET ${path} → ${res.status}: ${await res.text()}`);
  return res.json();
}

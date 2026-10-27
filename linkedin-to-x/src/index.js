// Cloudflare Worker: Typefully "draft.published" webhook → repurpose the LinkedIn
// post → queue it on X via Typefully.

import { DEFAULT_TAG, linkedinText, shouldRepurpose } from "./logic.js";
import { createXDraft, getDraft } from "./typefully.js";
import { repurpose } from "./repurpose.js";

const DONE_TTL = 60 * 60 * 24 * 90; // remember handled drafts for 90 days

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/health") return new Response("ok");
    if (request.method !== "POST" || !secretMatches(url.pathname, env.WEBHOOK_SECRET)) {
      return new Response("Not found", { status: 404 });
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return new Response("Bad JSON", { status: 400 });
    }
    if (payload?.event !== "draft.published" || !payload.data?.id) {
      return new Response("ignored");
    }

    ctx.waitUntil(
      handlePublished(payload.data, env).catch((err) => console.error("repurpose failed", err)),
    );
    return new Response("accepted", { status: 202 });
  },
};

async function handlePublished(event, env) {
  const draftId = String(event.id);
  const socialSetId = String(event.social_set_id);
  if (env.SOCIAL_SET_ID && socialSetId !== String(env.SOCIAL_SET_ID)) return;

  const key = `done:${draftId}`;
  if (await env.STATE.get(key)) return; // Typefully retry or duplicate event
  await env.STATE.put(key, "pending", { expirationTtl: DONE_TTL });

  // Re-read the draft from the API rather than trusting the webhook body.
  const draft = await getDraft(env, socialSetId, draftId);
  const tag = env.TAG || DEFAULT_TAG;
  if (!shouldRepurpose(draft, tag)) return;

  const source = linkedinText(draft);
  const sourceNote = `Repurposed from LinkedIn: ${draft.linkedin_published_url ?? draftId}`;
  const tags = env.TAG === "" ? [] : [tag];

  let created;
  try {
    const posts = await repurpose(source, env);
    created = await createXDraft(env, socialSetId, posts, {
      publishAt: env.PUBLISH_AT ?? "next-free-slot", // "" → save as draft only
      tags,
      note: sourceNote,
    });
  } catch (err) {
    // Leave an unscheduled draft with the original text so nothing is lost.
    created = await createXDraft(env, socialSetId, [source], {
      tags,
      note: `${sourceNote}\nAuto-repurpose failed, edit before posting: ${err.message}`,
    });
    console.error("repurposer failed, saved fallback draft", err);
  }
  await env.STATE.put(key, String(created?.id ?? "created"), { expirationTtl: DONE_TTL });
}

// The webhook URL is /typefully/<WEBHOOK_SECRET>; compare in constant time.
function secretMatches(pathname, secret) {
  if (!secret) return false;
  const a = new TextEncoder().encode(pathname);
  const b = new TextEncoder().encode(`/typefully/${secret}`);
  return a.byteLength === b.byteLength && crypto.subtle.timingSafeEqual(a, b);
}

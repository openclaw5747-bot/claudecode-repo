// Cloudflare Worker: Typefully "draft.published" webhook → repurpose the LinkedIn
// post → add it to the X queue in Buffer.

import { X_MAX_CHARS, fitPosts, linkedinText, shouldRepurpose } from "./logic.js";
import { getDraft } from "./typefully.js";
import { queueXPost } from "./buffer.js";
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
      handlePublished(payload.data, env).catch((err) => console.error("handling failed", err)),
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
  if (!shouldRepurpose(draft)) return;

  const source = linkedinText(draft);
  const max = Number(env.X_MAX_CHARS) || X_MAX_CHARS;

  let post;
  try {
    const { posts, via } = await repurpose(source, env);
    post = await queueXPost(env, fitPosts(posts, max));
    console.log(`queued ${draftId} on X via ${via}`, post);
  } catch (err) {
    // Every repurposer failed: leave the original text as a Buffer draft to edit.
    console.error(`repurposing ${draftId} failed, saving original as draft`, err);
    post = await queueXPost(env, fitPosts([source], max), { draft: true });
  }
  await env.STATE.put(key, String(post?.id ?? "done"), { expirationTtl: DONE_TTL });
}

// The webhook URL is /typefully/<WEBHOOK_SECRET>; compare in constant time.
function secretMatches(pathname, secret) {
  if (!secret) return false;
  const a = new TextEncoder().encode(pathname);
  const b = new TextEncoder().encode(`/typefully/${secret}`);
  return a.byteLength === b.byteLength && crypto.subtle.timingSafeEqual(a, b);
}

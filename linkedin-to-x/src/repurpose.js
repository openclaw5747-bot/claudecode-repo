// Sends LinkedIn text to the third-party repurposing service and returns X posts.
//
// This is the only file that knows about the repurposing service. The generic
// "http" adapter below POSTs { text } and reads the result from a JSON field;
// replace or extend it once the service's real API shape is known.

import { toXPosts } from "./logic.js";

const adapters = {
  async http(text, env) {
    const res = await fetch(env.REPURPOSER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(env.REPURPOSER_API_KEY && { Authorization: `Bearer ${env.REPURPOSER_API_KEY}` }),
      },
      body: JSON.stringify({ text, target: "x" }),
    });
    if (!res.ok) throw new Error(`Repurposer → ${res.status}: ${await res.text()}`);
    const json = await res.json();
    return json[env.REPURPOSER_RESPONSE_FIELD || "text"];
  },
};

export async function repurpose(text, env) {
  const adapter = adapters[env.REPURPOSER || "http"];
  if (!adapter) throw new Error(`Unknown REPURPOSER "${env.REPURPOSER}"`);
  const posts = toXPosts(await adapter(text, env));
  if (posts.length === 0) throw new Error("Repurposer returned no text");
  return posts;
}

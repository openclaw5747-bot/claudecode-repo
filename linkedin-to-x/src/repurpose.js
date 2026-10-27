// Turns LinkedIn text into X posts. Repurposers listed in REPURPOSERS are tried
// in order; the first that returns text wins.
//
//   workersai     Cloudflare Workers AI (free daily allowance), the backup.
//   creatorbuddy  Creator Buddy via headless browser — not wired up yet; needs a
//                 logged-in look at its Content Composer page to write the steps.

import { toXPosts } from "./logic.js";

const PROMPT = `You repurpose LinkedIn posts for X (Twitter).
Rewrite the post below in the same voice and first person, for X:
- Lead with a strong hook. Cut LinkedIn filler ("I'm excited to share", "Thoughts?", hashtags, emoji bullets).
- Keep the core insight, numbers and specifics. Do not invent facts.
- If it fits in 280 characters, write one post. Otherwise write a thread of 2-6 posts,
  each under 270 characters, separated by a line containing only ---
Reply with the post text only: no preamble, no numbering, no quotes.`;

const repurposers = {
  async workersai(text, env) {
    const out = await env.AI.run(env.AI_MODEL || "@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        { role: "system", content: PROMPT },
        { role: "user", content: text },
      ],
      max_tokens: 1024,
    });
    return out?.response;
  },
};

export async function repurpose(text, env) {
  const names = (env.REPURPOSERS || "workersai").split(",").map((s) => s.trim()).filter(Boolean);
  const errors = [];
  for (const name of names) {
    const fn = repurposers[name];
    if (!fn) {
      errors.push(`${name}: not available`);
      continue;
    }
    try {
      const posts = toXPosts(await fn(text, env));
      if (posts.length) return { posts, via: name };
      errors.push(`${name}: returned no text`);
    } catch (err) {
      errors.push(`${name}: ${err.message}`);
    }
  }
  throw new Error(`All repurposers failed — ${errors.join("; ")}`);
}

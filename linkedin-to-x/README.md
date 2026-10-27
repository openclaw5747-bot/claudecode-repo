# LinkedIn → X auto-repurposer

When you publish a LinkedIn post through Typefully, this Cloudflare Worker takes
the text, rewrites it for X, and adds it to your X queue in Buffer. X posts go
through Buffer's free plan so they don't use Typefully's 10 posts/month.

```
Typefully "draft.published" webhook
  → POST https://hooks.<your-domain>/typefully/<WEBHOOK_SECRET>
  → re-fetch the draft from the Typefully API
  → skip unless: published, LinkedIn on, X off in Typefully
  → repurposers, in order (REPURPOSERS): creatorbuddy (planned) → workersai
  → split anything over 280 chars into a thread
  → Buffer: add to the X channel's queue (next slot in your posting schedule)
```

- **No duplicates:** each LinkedIn draft id is remembered in KV for 90 days, so
  webhook retries and repeat events are no-ops.
- **Nothing lost:** if Buffer won't queue the post (e.g. free-plan queue full) it
  is saved as a Buffer draft; if every repurposer fails, the original LinkedIn
  text is saved as a Buffer draft for you to edit.
- **Not handled yet:** images and video aren't copied over (text only).

## Setup (one time, ~15 minutes)

Requires free Cloudflare, Typefully and Buffer accounts, with your domain's DNS
on Cloudflare.

1. **Buffer:** connect your X account, set its posting schedule (e.g. the morning
   after each LinkedIn day), and create an API key (Settings → API).
2. **Install and log in:**
   ```bash
   cd linkedin-to-x
   npm install
   npx wrangler login
   npx wrangler kv namespace create STATE      # paste the id into wrangler.toml
   ```
3. **Find your Buffer X channel id** and put it in `BUFFER_CHANNEL_ID` in `wrangler.toml`:
   ```bash
   BUFFER_API_KEY=... npm run buffer:channels
   ```
4. **Secrets** (stored encrypted by Cloudflare, never in the repo):
   ```bash
   npx wrangler secret put TYPEFULLY_API_KEY    # Typefully → Settings → API
   npx wrangler secret put BUFFER_API_KEY
   npx wrangler secret put WEBHOOK_SECRET       # any long random string: openssl rand -hex 24
   ```
5. In `wrangler.toml`, uncomment `routes` and set your subdomain
   (e.g. `hooks.yourdomain.com`). Then `npm run deploy` and check
   `https://hooks.yourdomain.com/health` says `ok`.
6. In Typefully → Settings → Webhooks, add
   `https://hooks.yourdomain.com/typefully/<WEBHOOK_SECRET>` for `draft.published`.
7. Publish a LinkedIn post from Typefully and check your Buffer queue
   (`npx wrangler tail` shows live logs).

## Options (`wrangler.toml` → `[vars]`)

| Var | Default | Meaning |
|---|---|---|
| `BUFFER_CHANNEL_ID` | — | Your X channel in Buffer (required) |
| `BUFFER_MODE` | `addToQueue` | Or `shareNow` / `shareNext` |
| `REPURPOSERS` | `workersai` | Comma-separated, tried in order |
| `AI_MODEL` | `@cf/meta/llama-3.1-8b-instruct` | Workers AI model |
| `X_MAX_CHARS` | `280` | Raise if your X account has Premium long posts |
| `SOCIAL_SET_ID` | unset | Only act on this Typefully account |

## Free-tier budget at 2 LinkedIn posts/week

| Service | Limit | Use |
|---|---|---|
| Typefully | 10 posts/month | ~9 (LinkedIn only) |
| Buffer API | 1,000 requests/30 days per channel | ~10–20 |
| Workers AI | free daily allowance | ~2 short rewrites/week |

## Tests

```bash
npm test
```

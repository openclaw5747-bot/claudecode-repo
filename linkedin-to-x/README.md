# LinkedIn → X auto-repurposer

When you publish a LinkedIn post through Typefully, this Cloudflare Worker takes
the text, runs it through a repurposing service, and queues the X version in
Typefully's next free slot.

```
Typefully "draft.published" webhook
  → POST https://hooks.<your-domain>/typefully/<WEBHOOK_SECRET>
  → re-fetch the draft from the Typefully API
  → skip unless: published, LinkedIn on, X off, not tagged "auto-repurposed"
  → repurposing service → X post (or thread, split on "---" lines)
  → new Typefully X draft, tagged "auto-repurposed", publish_at "next-free-slot"
```

- **No loops:** created drafts are X-only and tagged, and each LinkedIn draft
  id is remembered in KV, so retries and duplicate events are no-ops.
- **Nothing lost:** if the repurposer fails, an unscheduled X draft with the
  original text and the error is left in Typefully for you to edit.
- **Not handled yet:** images and video aren't copied over (text only).

## Setup (one time, ~10 minutes)

Requires a free Cloudflare account, with your domain's DNS on Cloudflare.

```bash
cd linkedin-to-x
npm install
npx wrangler login
npx wrangler kv namespace create STATE      # paste the id into wrangler.toml
npx wrangler secret put TYPEFULLY_API_KEY    # Typefully → Settings → API
npx wrangler secret put WEBHOOK_SECRET       # any long random string, e.g. `openssl rand -hex 24`
npx wrangler secret put REPURPOSER_API_KEY   # if the repurposing service needs one
```

1. In `wrangler.toml`, uncomment `routes` and set your subdomain
   (e.g. `hooks.yourdomain.com`), and set `REPURPOSER_URL`.
2. `npm run deploy`, then check `https://hooks.yourdomain.com/health` says `ok`.
3. In Typefully → Settings → Webhooks, add
   `https://hooks.yourdomain.com/typefully/<WEBHOOK_SECRET>` for the
   `draft.published` event.
4. Publish a LinkedIn post from Typefully and watch for the X draft in your queue
   (`npx wrangler tail` shows live logs).

## Options (`wrangler.toml` → `[vars]`)

| Var | Default | Meaning |
|---|---|---|
| `PUBLISH_AT` | `next-free-slot` | `now`, an ISO datetime, or `""` to only save drafts |
| `TAG` | `auto-repurposed` | Tag on created drafts (create it in Typefully first if required) |
| `SOCIAL_SET_ID` | unset | Only act on this Typefully account |
| `REPURPOSER` | `http` | Adapter in `src/repurpose.js` |

## Tests

```bash
npm test
```

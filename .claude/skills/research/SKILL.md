---
name: research
description: Research mode. Spins out parallel research agents across Google/the web, YouTube, Reddit, news, academic papers, forums and official sources, then synthesizes a concise, fully sourced report. Use when the user says "research <topic>", "/research <topic>", "look into", "what does the internet say about", or asks for a sourced report on a topic.
argument-hint: <topic or question> [--deep] [--save]
---

# Research mode

The user wants a concise, sourced report on: **$ARGUMENTS**

If no topic was given, ask for one and stop.

Flags (optional, anywhere in the arguments):
- `--deep` — use 7 lanes and 2 agents for the web lane (more thorough, more tokens).
- `--save` — also write the report to `research/<YYYY-MM-DD>-<topic-slug>.md`.

## Step 1 — Plan (do this yourself, briefly)

1. Restate the topic as one clear research question.
2. Break it into 3–5 sub-questions the report must answer.
3. Pick the source lanes. Default set (5 agents):
   - **web** (Google / general web)
   - **youtube**
   - **reddit**
   - **news** (recent coverage)
   - **academic** if the topic is scientific/technical/medical, otherwise
     **forums / social** (Hacker News, Stack Exchange, X, Substack, niche forums)

   With `--deep`, use all of: web (x2, split by sub-question), youtube, reddit, news,
   academic, forums / social, official.

Tell the user in one line what you're researching and which lanes you're launching.

## Step 2 — Fan out (parallel)

Launch every lane in a **single message** with multiple `Agent` tool calls so they run
concurrently. Use `subagent_type: "source-researcher"` (fall back to
`general-purpose` if it is unavailable). Give each agent a self-contained prompt:

```
TOPIC: <research question>
SOURCE LANE: <lane>
SUB-QUESTIONS:
1. ...
2. ...
TODAY: <today's date>
Follow your lane instructions and return findings in your required output format.
```

Run them in the foreground of this turn (wait for all results) — the report depends
on them. Do not run duplicate searches yourself while they work.

## Step 3 — Verify

- Cross-check: a claim backed by 2+ independent lanes is "well supported"; a claim from
  a single source is "reported"; anecdotes from Reddit/YouTube/forums are labeled as
  community sentiment, not fact.
- If a central claim rests on one weak source, or lanes contradict each other on
  something important, do a quick targeted `WebSearch`/`WebFetch` yourself to settle it.
- Drop anything without a real URL. Never invent sources.

## Step 4 — Write the report

Keep it concise: aim for 400–700 words (up to ~1,200 with `--deep`). Use this structure:

```markdown
# <Topic>
*Researched <date> · <N> sources across <lanes>*

## TL;DR
3–5 bullets with the answer a busy reader needs. Each bullet cites [n].

## Key findings
Short paragraphs or bullets, grouped by sub-question, each claim cited [n].

## What people are saying
Community sentiment from Reddit, YouTube, forums — consensus vs. dissent, cited [n].

## Points of disagreement / uncertainty
Where sources conflict or evidence is thin.

## Bottom line
2–3 sentences: the practical takeaway.

## Sources
1. [Title](url) — Publisher/Channel/Subreddit, date · lane
2. ...
```

Citation rules: number sources in order of first use; every factual sentence carries at
least one [n]; list sources in plain numbered order; include the lane tag (web, youtube, reddit, news, academic, forums, official) so the user can see
the spread.

## Step 5 — Deliver

- Print the full report in chat.
- If `--save` was given, write it to `research/<YYYY-MM-DD>-<topic-slug>.md` and
  mention the path.
- Offer one line of follow-ups (e.g. "go deeper on X", "compare with Y").

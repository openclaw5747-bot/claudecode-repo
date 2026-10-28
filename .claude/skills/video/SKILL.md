---
name: video
description: Video mode. Takes almost any video link (YouTube, TED, Vimeo, X/Twitter, TikTok, Instagram, Loom, podcasts, direct .mp4/.mp3, or an uploaded file), gets a transcript (captions first, local Whisper fallback), then summarises it, turns it into notes, answers questions about it, or applies its learnings to the user's project. Use when the user pastes a video/audio URL or says "/video", "transcribe this", "summarise this video", "what does this video say", or "apply what this video teaches".
argument-hint: <url-or-file> [summary|notes|learn|ask "<question>"|transcript] [--save] [--lang xx]
---

# Video mode

Input: **$ARGUMENTS**

If no URL or file path was given, ask for one and stop.

## Parse the request

- **Source**: the first URL or file path in the arguments. If the user uploaded a
  file, use its path.
- **Mode** (default `summary`; also infer it from plain-English wording):
  - `summary` — what it says, in brief.
  - `notes` — detailed structured study notes.
  - `learn` — extract the lessons and **apply them** (see below).
  - `ask "<question>"` — answer the question from the video only.
  - `transcript` — just give the cleaned transcript file.
- `--save` — keep the outputs in the repo under `videos/` (otherwise use the scratchpad).
- `--lang xx` — preferred caption/transcription language.

Tell the user in one line what you are fetching.

## Step 1 — Transcribe

Install dependencies (fast no-op once installed):

```bash
pip install -q -r tools/video/requirements.txt 2>&1 | grep -v "running pip as the 'root'" || true
```

Then run the transcriber. Without `--save`, pass `--out <scratchpad>/video-<slug>`;
with `--save`, omit `--out` (it defaults to `videos/<date>-<title>`):

```bash
python3 tools/video/transcribe.py "<url-or-path>" [--out DIR] [--lang xx]
```

It tries published captions, then (YouTube) the transcript API, then downloads
the audio and runs faster-whisper locally. Whisper on CPU takes roughly a third to
half of the video's length with the default `small` model; for videos over ~45 minutes, pass
`--model base` (faster, a bit less accurate) and run it in the background, and tell
the user it will take a few minutes.

The last stdout line is the output directory, containing `transcript.md`
(metadata, chapters, timestamped paragraphs), `transcript.txt` and `meta.json`.

**If it fails** (exit code 2), the site blocked this machine or needs a login.
YouTube in particular blocks most cloud servers. Tell the user plainly and offer:
1. Upload the video or audio file here, then run the tool on its path.
2. Provide a `cookies.txt` exported from their browser (for example with the "Get
   cookies.txt LOCALLY" extension) and run again with `--cookies <path>` or
   `VIDEO_COOKIES=<path>`. Remind them that the file holds their login session,
   so they should keep it out of git.
3. Run this skill from Claude Code on their own computer, where their home IP usually isn't blocked.
4. Paste the transcript (YouTube: "..." → "Show transcript").
Do not pretend to know the video's contents from its title.

## Step 2 — Read the transcript

Read `transcript.md` in full. For long transcripts, more than about 15k words, read
it in chunks and keep running notes. Watch for speaker changes, caption errors (fix
obvious ones from context), and the chapter list.

## Step 3 — Produce the output

Cite timestamps like `[12:34]` for key claims so the user can jump to them. Stick to
what the video says. Label your own opinions or corrections separately, and flag
any claims that look dubious, sponsored, or out of date.

### summary
- **TL;DR** — 2–3 sentences.
- **Key points** — 5–10 bullets with timestamps.
- **Notable quotes / numbers** — only if they matter. Keep quotes short.
- **Worth watching?** — one line, and which section to watch if only one.

### notes
Title, source line, then sections that follow the video's structure (use the chapters
if present). Include definitions, steps, examples and any resources mentioned (tools,
books, links), followed by a short "Key takeaways" list.

### learn — apply the learnings
1. Extract the **actionable lessons**: concrete practices, techniques, rules of
   thumb, and mistakes to avoid, each with a timestamp.
2. Work out what the user wants to apply them *to*: the current repo, a project
   they named, or their life or work in general. If it is genuinely unclear, ask once.
3. **Apply them**:
   - *To this codebase*: review the relevant code against the lessons and list
     concrete changes (file:line → the lesson behind it). Make the changes when the
     user asked you to implement them, otherwise propose them and offer to.
   - *To a skill or workflow*: write it up as a checklist, a playbook, or a new
     `.claude/skills/<name>/SKILL.md` if the user wants Claude to keep using it.
   - *Personal or business*: a prioritised action plan (this week / this month)
     with the lesson behind each step.
4. Note where the advice doesn't fit the user's situation, and why.

### ask
Answer the question directly using the transcript, with timestamps. If the video
doesn't cover it, say so.

### transcript
Point the user to `transcript.md` (send it with SendUserFile when that tool is
available) and give a 3-bullet gist.

## Step 4 — Save (only with --save)

Write the output to `<out-dir>/<mode>.md` next to the transcript, and tell the user
the paths. Don't commit unless asked.

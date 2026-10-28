# claudecode-repo

## Research mode

Ask Claude Code to research any topic and it fans out parallel agents across
Google/the web, YouTube, Reddit, news, academic papers and forums, then returns a
concise report with numbered sources.

```
/research is creatine safe for teenagers
/research best self-hosted password managers --deep
/research state of solid-state EV batteries --save
```

- `--deep` — more lanes (adds official sources, a second web agent), longer report.
- `--save` — also writes the report to `research/<date>-<topic>.md`.

You can also just say "research X" and Claude will pick up the skill.

Files:
- `.claude/skills/research/SKILL.md` — the orchestrator (plan → parallel agents → verify → report).
- `.claude/agents/source-researcher.md` — the per-source research subagent.

## Video mode

Send Claude almost any video link and it transcribes the video, then summarises it,
takes notes, answers questions, or applies what the video teaches.

```
/video https://www.ted.com/talks/some_talk
/video https://youtu.be/abc123 notes --save
/video https://example.com/talk.mp4 learn        # apply the lessons to this repo / your plan
/video <link> ask "what tools did they recommend?"
```

You can also just paste a link and say "summarise this".

How the transcript is fetched (cheapest first): published captions → YouTube
transcript API → download audio and transcribe locally with faster-whisper. That
covers YouTube, TED, X, TikTok, podcasts, direct media files, uploaded files and the
other ~1,800 sites yt-dlp supports.

**YouTube from cloud sessions:** YouTube blocks most cloud servers ("confirm you're
not a bot"). Upload the file, pass a browser-exported `cookies.txt`
(`--cookies` or `VIDEO_COOKIES`, git-ignored), or run Claude Code locally.

Files:
- `.claude/skills/video/SKILL.md` — the workflow (transcribe → read → summary/notes/learn/ask).
- `tools/video/transcribe.py` — standalone transcriber (`python3 tools/video/transcribe.py URL`).
- `tools/video/requirements.txt` — `pip install -r` these first.

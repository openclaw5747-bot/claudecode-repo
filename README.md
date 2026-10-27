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

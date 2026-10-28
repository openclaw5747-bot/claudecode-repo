#!/usr/bin/env python3
"""Fetch a transcript for (almost) any video URL.

Strategy, cheapest first:
  1. Published captions via yt-dlp (manual subs, then auto-generated).
  2. YouTube only: youtube-transcript-api.
  3. Download the audio (yt-dlp, or ffmpeg for direct media links) and run
     faster-whisper locally.

Writes <out>/transcript.md, <out>/transcript.txt and <out>/meta.json, and
prints the out directory on the last line of stdout.

Usage:
  python3 tools/video/transcribe.py URL [--out DIR] [--model small]
         [--lang en] [--cookies cookies.txt] [--force-whisper]

Cookies (Netscape format) help with sites that block cloud IPs or need a
login (YouTube "confirm you're not a bot", Vimeo, Instagram...). Pass
--cookies or set VIDEO_COOKIES=/path/to/cookies.txt.
"""
import argparse
import glob
import json
import os
import re
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from urllib.parse import parse_qs, urlparse

MEDIA_EXTS = {".mp4", ".mov", ".m4a", ".mp3", ".wav", ".webm", ".mkv", ".ogg", ".flac", ".aac", ".m4v"}


def log(msg):
    print(f"[transcribe] {msg}", file=sys.stderr, flush=True)


def slugify(text, limit=60):
    text = re.sub(r"[^\w\s-]", "", text.lower()).strip()
    return re.sub(r"[\s_-]+", "-", text)[:limit].strip("-") or "video"


def youtube_id(url):
    u = urlparse(url)
    host = u.netloc.lower().removeprefix("www.").removeprefix("m.")
    if host == "youtu.be":
        return u.path.lstrip("/").split("/")[0] or None
    if host.endswith("youtube.com"):
        if u.path == "/watch":
            return parse_qs(u.query).get("v", [None])[0]
        m = re.match(r"^/(shorts|embed|live|v)/([\w-]{6,})", u.path)
        if m:
            return m.group(2)
    return None


def fmt_ts(seconds):
    seconds = int(seconds)
    h, rem = divmod(seconds, 3600)
    m, s = divmod(rem, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m:02d}:{s:02d}"


def ytdlp_base(cookies):
    cmd = [sys.executable, "-m", "yt_dlp", "--no-playlist", "--no-warnings", "--quiet"]
    if cookies:
        cmd += ["--cookies", cookies]
    return cmd


def run(cmd, timeout=900):
    return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)


# --- step 0: metadata -------------------------------------------------------

def fetch_meta(url, cookies):
    try:
        p = run(ytdlp_base(cookies) + ["--dump-single-json", "--skip-download", url], timeout=120)
    except subprocess.TimeoutExpired:
        return {}, "metadata timed out"
    if p.returncode != 0:
        return {}, (p.stderr.strip().splitlines() or ["yt-dlp failed"])[-1]
    try:
        info = json.loads(p.stdout)
    except json.JSONDecodeError:
        return {}, "unparseable metadata"
    keep = ["id", "title", "uploader", "channel", "upload_date", "duration", "webpage_url",
            "description", "extractor", "language"]
    meta = {k: info.get(k) for k in keep if info.get(k) is not None}
    meta["chapters"] = [{"start": c.get("start_time", 0), "title": c.get("title")}
                        for c in (info.get("chapters") or [])]
    meta["_subs"] = sorted((info.get("subtitles") or {}).keys())
    meta["_auto_subs"] = sorted((info.get("automatic_captions") or {}).keys())
    return meta, None


# --- step 1: published captions --------------------------------------------

VTT_TS = re.compile(r"(\d+):(\d\d):(\d\d)[.,](\d+)\s+-->")


def parse_vtt(path):
    """Return [(start_seconds, text)], de-duplicating rolling auto-captions."""
    segs, cur_start, buf, last_line = [], None, [], None
    for raw in Path(path).read_text(encoding="utf-8", errors="ignore").splitlines():
        line = raw.strip()
        m = VTT_TS.match(line)
        if m:
            if cur_start is not None and buf:
                segs.append((cur_start, " ".join(buf)))
            h, mi, s, _ = m.groups()
            cur_start, buf = int(h) * 3600 + int(mi) * 60 + int(s), []
            continue
        if not line or line.startswith(("WEBVTT", "Kind:", "Language:", "NOTE", "STYLE")) or line.isdigit():
            continue
        line = re.sub(r"<[^>]+>", "", line).strip()
        line = re.sub(r"&nbsp;", " ", line)
        if not line or line == last_line:
            continue
        buf.append(line)
        last_line = line
    if cur_start is not None and buf:
        segs.append((cur_start, " ".join(buf)))
    return segs


def pick_lang(available, langs):
    """First match for the preferred languages (exact, then prefix), else None."""
    for lang in langs:
        for cand in (lang, f"{lang}-orig", f"{lang}-US", f"{lang}-GB"):
            if cand in available:
                return cand
        for a in available:
            if a.split("-")[0] == lang:
                return a
    return None


def captions_via_ytdlp(url, meta, lang, cookies, work):
    langs = [l for l in dict.fromkeys([lang, (meta.get("language") or "").split("-")[0], "en"]) if l]
    for kind, flag, available in (("manual", "--write-subs", meta.get("_subs", [])),
                                  ("auto", "--write-auto-subs", meta.get("_auto_subs", []))):
        available = [a for a in available if a != "live_chat"]
        chosen = pick_lang(available, langs) or (available[0] if kind == "manual" and not lang and len(available) == 1 else None)
        if not chosen:
            continue
        log(f"downloading {kind} captions ({chosen})")
        p = run(ytdlp_base(cookies) + ["--skip-download", flag, "--sub-langs", chosen,
                                        "--sub-format", "vtt/best", "--convert-subs", "vtt",
                                        "-o", str(Path(work) / "subs.%(ext)s"), url], timeout=180)
        files = glob.glob(str(Path(work) / "subs*.vtt"))
        if p.returncode == 0 and files:
            segs = parse_vtt(files[0])
            if segs:
                return segs, f"captions:{kind}:{chosen}"
    return None, None


# --- step 2: youtube-transcript-api ----------------------------------------

def captions_via_yta(video_id, lang):
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
    except ImportError:
        return None, None
    try:
        api = YouTubeTranscriptApi()
        langs = [lang] if lang else ["en"]
        try:
            t = api.fetch(video_id, languages=langs)
        except Exception:
            t = next(iter(api.list(video_id))).fetch()
        segs = [(s.start, s.text.replace("\n", " ")) for s in t.snippets]
        return (segs, f"captions:youtube-transcript-api:{t.language_code}") if segs else (None, None)
    except Exception as e:
        log(f"youtube-transcript-api failed: {type(e).__name__}")
        return None, None


# --- step 3: audio + whisper ------------------------------------------------

def download_audio(url, cookies, work):
    out = Path(work) / "audio.mp3"
    if Path(urlparse(url).path).suffix.lower() in MEDIA_EXTS or os.path.exists(url):
        log("extracting audio with ffmpeg")
        p = run(["ffmpeg", "-y", "-loglevel", "error", "-i", url, "-vn", "-ac", "1", "-ar", "16000",
                 "-b:a", "48k", str(out)], timeout=1800)
        if p.returncode == 0 and out.exists():
            return out, None
    log("downloading audio with yt-dlp")
    p = run(ytdlp_base(cookies) + ["-f", "bestaudio/best", "-x", "--audio-format", "mp3",
                                    "--audio-quality", "5", "-o", str(Path(work) / "audio.%(ext)s"), url],
            timeout=3600)
    if p.returncode == 0 and out.exists():
        return out, None
    return None, (p.stderr.strip().splitlines() or ["audio download failed"])[-1]


def load_pcm(audio):
    """Decode to 16 kHz mono float32 with ffmpeg (avoids PyAV version clashes)."""
    import numpy as np
    p = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(audio), "-f", "f32le",
                        "-ac", "1", "-ar", "16000", "-"], capture_output=True, timeout=1800)
    if p.returncode != 0:
        raise RuntimeError(p.stderr.decode(errors="ignore")[-300:])
    return np.frombuffer(p.stdout, dtype=np.float32)


def detect_lang(model, pcm, sr=16000):
    """Vote over 30s windows at 20/50/80% of the audio. Whisper's default looks
    only at the start, which is often applause or music, and guessed the wrong
    language on a TED talk."""
    votes = {}
    for frac in (0.2, 0.5, 0.8):
        start = int(len(pcm) * frac)
        chunk = pcm[start:start + 30 * sr]
        if len(chunk) < 5 * sr:
            chunk = pcm[:30 * sr]
        code, prob, _ = model.detect_language(chunk)
        votes[code] = votes.get(code, 0) + prob
    lang = max(votes, key=votes.get)
    log(f"detected language: {lang}")
    return lang


def whisper(audio, model_name, lang):
    from faster_whisper import WhisperModel
    log(f"transcribing with faster-whisper '{model_name}' (CPU) - this can take a while")
    model = WhisperModel(model_name, device="cpu", compute_type="int8",
                         cpu_threads=os.cpu_count() or 4)
    pcm = load_pcm(audio)
    if not lang:
        lang = detect_lang(model, pcm)
    segments, info = model.transcribe(pcm, language=lang, vad_filter=True, beam_size=1)
    segs, last_report = [], time.time()
    for s in segments:
        segs.append((s.start, s.text.strip()))
        if time.time() - last_report > 30:
            log(f"  ...{fmt_ts(s.end)} / {fmt_ts(info.duration)}")
            last_report = time.time()
    return segs, f"whisper:{model_name}:{info.language}"


# --- frames (for on-screen text / visuals) ----------------------------------

def extract_frames(url, cookies, work, out, duration, max_frames=16):
    """Save evenly spaced JPEG frames to <out>/frames so Claude can read on-screen
    text and see the visuals. Reels and Shorts often carry their message there."""
    src = url if (os.path.exists(url) or Path(urlparse(url).path).suffix.lower() in MEDIA_EXTS) else None
    if not src:
        log("downloading video for frames")
        p = run(ytdlp_base(cookies) + ["-f", "bv*[height<=720]+ba/b[height<=720]/bv*+ba/b",
                                        "--merge-output-format", "mp4",
                                        "-o", str(Path(work) / "video.%(ext)s"), url], timeout=1800)
        files = glob.glob(str(Path(work) / "video.*"))
        if p.returncode != 0 or not files:
            log("could not download video for frames")
            return 0
        src = files[0]
    if not duration:
        p = run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src], timeout=60)
        try:
            duration = float(p.stdout.strip())
        except ValueError:
            duration = 60
    step = max(duration / max_frames, 1.5)
    fdir = out / "frames"
    fdir.mkdir(parents=True, exist_ok=True)
    for f in fdir.glob("*.jpg"):
        f.unlink()
    p = run(["ffmpeg", "-loglevel", "error", "-y", "-i", src, "-vf", f"fps=1/{step:.3f},scale=720:-2",
             "-q:v", "4", "-frames:v", str(max_frames), str(fdir / "f%03d.jpg")], timeout=900)
    frames = sorted(fdir.glob("*.jpg"))
    for i, f in enumerate(frames):  # name frames by timestamp
        f.rename(fdir / f"frame_{fmt_ts(i * step).replace(':', '-')}.jpg")
    log(f"saved {len(frames)} frames to {fdir}")
    return len(frames)


# --- output -----------------------------------------------------------------

def paragraphs(segs, every=60):
    """Group segments into ~every-second paragraphs, each with a timestamp."""
    paras, start, buf = [], None, []
    for t, text in segs:
        if start is None:
            start = t
        buf.append(text)
        if t - start >= every and re.search(r"[.!?]$", text) or t - start >= every * 1.5:
            paras.append((start, " ".join(buf)))
            start, buf = None, []
    if buf:
        paras.append((start, " ".join(buf)))
    return [(s, re.sub(r"\s+", " ", p).strip()) for s, p in paras]


def write_outputs(out, url, meta, segs, source, n_frames=0):
    out.mkdir(parents=True, exist_ok=True)
    title = meta.get("title") or url
    paras = paragraphs(segs)
    words = sum(len(p.split()) for _, p in paras)
    head = [f"# {title}", "", f"- URL: {meta.get('webpage_url') or url}"]
    for key, label in (("channel", "Channel"), ("uploader", "Uploader"), ("upload_date", "Uploaded")):
        if meta.get(key):
            head.append(f"- {label}: {meta[key]}")
            if key == "channel":
                break
    if meta.get("duration"):
        head.append(f"- Duration: {fmt_ts(meta['duration'])}")
    head += [f"- Transcript source: {source}", f"- Words: {words}"]
    if n_frames:
        head.append(f"- Frames: {n_frames} stills in frames/ (read them for on-screen text and visuals)")
    head.append("")
    if meta.get("description"):
        head += ["## Description", "", meta["description"].strip(), ""]
    if meta.get("chapters"):
        head += ["## Chapters", ""] + [f"- [{fmt_ts(c['start'])}] {c['title']}" for c in meta["chapters"]] + [""]
    head += ["## Transcript", ""]
    body = [f"[{fmt_ts(s)}] {p}\n" for s, p in paras] or ["(No speech detected: music-only or silent. See frames/ and the description.)\n"]
    (out / "transcript.md").write_text("\n".join(head) + "\n" + "\n".join(body), encoding="utf-8")
    (out / "transcript.txt").write_text("\n\n".join(p for _, p in paras) + "\n", encoding="utf-8")
    clean = {k: v for k, v in meta.items() if not k.startswith("_")}
    clean.update(url=url, transcript_source=source, words=words, frames=n_frames)
    (out / "meta.json").write_text(json.dumps(clean, indent=2, ensure_ascii=False), encoding="utf-8")
    return words


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("url")
    ap.add_argument("--out", help="output directory (default: videos/<date>-<title-slug>)")
    ap.add_argument("--model", default=os.environ.get("WHISPER_MODEL", "small"),
                    help="faster-whisper model: tiny|base|small|medium|large-v3 (default small)")
    ap.add_argument("--lang", default=os.environ.get("VIDEO_LANG"),
                    help="language code, e.g. en (default: $VIDEO_LANG, the site's label, else detect)")
    ap.add_argument("--cookies", default=os.environ.get("VIDEO_COOKIES"))
    ap.add_argument("--force-whisper", action="store_true", help="skip captions, always transcribe audio")
    ap.add_argument("--frames", choices=["auto", "yes", "no"], default="auto",
                    help="save stills for on-screen text (auto: videos <= 3 min, or no speech found)")
    args = ap.parse_args()

    if args.cookies and not os.path.exists(args.cookies):
        log(f"cookies file not found: {args.cookies} (ignoring)")
        args.cookies = None

    meta, meta_err = fetch_meta(args.url, args.cookies)
    if meta_err:
        log(f"metadata unavailable: {meta_err}")
    vid = youtube_id(args.url)

    with tempfile.TemporaryDirectory() as work:
        segs = source = None
        if not args.force_whisper:
            if meta:
                segs, source = captions_via_ytdlp(args.url, meta, args.lang, args.cookies, work)
            if not segs and vid:
                segs, source = captions_via_yta(vid, args.lang)
        if not segs:
            audio, err = download_audio(args.url, args.cookies, work)
            if not audio:
                log(f"FAILED: could not get captions or audio. Last error: {err}")
                if vid or "cookies" in (err or "").lower() or "sign in" in (err or "").lower():
                    log("This site is blocking this machine or needs a login. Fixes: pass a cookies.txt "
                        "(--cookies / VIDEO_COOKIES), run locally instead of in the cloud, or upload the "
                        "video/audio file and pass its path.")
                sys.exit(2)
            site_lang = (meta.get("language") or "").split("-")[0] or None
            segs, source = whisper(audio, args.model, args.lang or site_lang)

        if args.out:
            out = Path(args.out)
        else:
            slug = slugify(meta.get("title") or vid or urlparse(args.url).path)
            out = Path("videos") / f"{time.strftime('%Y-%m-%d')}-{slug}"
        duration = meta.get("duration")
        want_frames = args.frames == "yes" or (args.frames == "auto" and (not segs or (duration or 0) <= 180))
        n_frames = extract_frames(args.url, args.cookies, work, out, duration) if want_frames else 0

    if not segs and not n_frames:
        log("FAILED: no speech found and no frames could be saved")
        sys.exit(3)
    words = write_outputs(out, args.url, meta, segs or [], source, n_frames)
    log(f"done: {words} words via {source}")
    print(out)


if __name__ == "__main__":
    main()

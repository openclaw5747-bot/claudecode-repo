# Shortlist

A job search companion for the UK that runs on your own computer. Inspired by
[Dossier](https://github.com/AienTech/dossier), it is rebuilt around how hiring works in the UK.

- **Start from your CV.** Upload your CV (PDF, Word or text) and add your LinkedIn address, and the AI fills in your profile for you to check before saving. What you've already typed is kept, and new jobs and qualifications are added. The LinkedIn address is saved and printed on your CVs.
- **Find UK jobs.** Searches [Reed](https://www.reed.co.uk/developers/jobseeker) and [Adzuna](https://developer.adzuna.com/) at once, by town, city or postcode and distance in miles. It shows pay in £ (a year, a day or an hour) and flags IR35, security clearance, DBS checks, driving licences, hybrid and remote work. For NHS Jobs, Civil Service Jobs, LinkedIn or any careers page, paste the advert.
- **Visa sponsor check.** Checks every employer against the Home Office [register of licensed sponsors](https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers), downloaded from GOV.UK and refreshed daily. It matches trading names too (the register lists "Roofoods Ltd t/a Deliveroo"). One switch hides employers that can't sponsor you, or that say they won't.
- **See how you match.** Reads the advert against your profile: each requirement (essential or desirable), whether you meet it, the evidence, and the UK points to check.
- **Tailored British CV, cover letter and email.** Two pages in British English, with no photo, date of birth or marital status. It has a personal statement, key skills, employment history and "References available on request". The letter follows UK convention: "Dear Hiring Manager … Yours faithfully", or "Dear Ms Patel … Yours sincerely". Pick a tone, ask for changes, edit by hand, or undo. Print to PDF on A4.
- **Never invents experience.** Job titles, employers, dates and qualifications come straight from your profile; the AI only writes the wording. Skills not in your profile are removed, and any figure (40%, £2m, a team of 10) not found in your profile is flagged before you send. If an advert asks for something you don't have, it's listed as a gap, not claimed.
- **Track every application** on a board, from Saved through Drafting, Applied, Interview and Offer to Rejected, with notes and history.
- **Your contact details stay in your browser.** Your email, phone number and postcode are kept in your browser only. They are never saved on the server, in backups, or sent to the AI. They're added to your CV, letter and email when you open them, so on another computer you type them in again. When you upload a CV, its email, phone number and home address are taken out before the AI reads it. The CV file itself isn't kept.
- **Your data stays with you.** Everything else is one JSON file on your disk (never committed to git), with export and import. Use Claude, or a local model through [Ollama](https://ollama.com) so nothing leaves your machine.

## Run it

You need Node.js 20 or later.

```bash
cd shortlist
npm install
cp .env.example .env   # then fill in what you use
npm start              # http://127.0.0.1:3000
```

Set up in `.env`:

| What | Variables |
| --- | --- |
| An AI model (needed to match and write) | `ANTHROPIC_API_KEY` for Claude, **or** `AI_PROVIDER=ollama` plus `OLLAMA_MODEL` (and `OLLAMA_URL` if not local) |
| Job boards (optional; both free) | `REED_API_KEY`; `ADZUNA_APP_ID` and `ADZUNA_APP_KEY` |
| A password (needed if anyone else can reach it) | `SHORTLIST_PASSWORD` |
| Where it listens | `HOST` (default `127.0.0.1`), `PORT` (default `3000`), `SHORTLIST_DATA` (default `./data`) |

Then fill in **Profile**, or upload your CV there to fill it in for you. The more real detail you give (results, numbers, tools), the better the documents. After that, find a job or paste an advert, match it, and write your documents.

Using Claude sends your profile (without your contact details) and the advert to Anthropic's API. Using Ollama keeps everything on your machine; a model of about 14B parameters or more follows the format reliably.

## Tests

```bash
npm test
```

## How it fits together

| File | What it does |
| --- | --- |
| `server.js` | HTTP server, JSON API, sign-in, printable pages |
| `lib/sources.js` | Reed and Adzuna clients, merged and de-duplicated |
| `lib/sponsors.js` | Downloads, parses and searches the sponsor register |
| `lib/salary.js` | £ formatting, day and hourly rates, UK flags in advert text |
| `lib/ai.js` | Prompts and schemas; Claude or Ollama |
| `lib/privacy.js` | Which details stay in the browser, and taking them out of uploaded CVs |
| `lib/cv-import.js` | Reads uploaded CVs (PDF, Word, text) and merges what the AI found into the profile |
| `lib/documents.js` | Builds the CV, letter and email from your profile, checks what the AI wrote, renders A4 pages |
| `lib/store.js` | The JSON file, written safely |
| `public/` | The web app (no build step) |

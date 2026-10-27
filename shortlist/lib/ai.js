// The AI writes in two steps: it reads a posting against your profile (analyse), then drafts the
// CV, cover letter and email (tailor). Both answers are JSON checked against a schema, and the CV is
// assembled from your profile in documents.js, so the model never supplies job titles, employers,
// dates or qualifications.
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';

export const AnalysisSchema = z.object({
  title: z.string().describe('The job title as the posting gives it'),
  employer: z.string().describe('The hiring company; if a recruitment agency posted it for an unnamed client, the agency name followed by " (agency)"'),
  location: z.string(),
  salary: z.string().describe('Pay as the posting states it, in £, or an empty string'),
  contactName: z.string().describe('The named person to address the letter to, or an empty string'),
  contactEmail: z.string().describe('The address the posting says to apply to, or an empty string'),
  summary: z.string().describe('Two sentences: what the role is and what matters most to the employer'),
  requirements: z.array(z.object({
    requirement: z.string(),
    essential: z.boolean().describe('true if essential/required, false if desirable/nice to have'),
    status: z.enum(['met', 'partial', 'gap']),
    evidence: z.string().describe('What in the profile shows it, quoted closely; empty for a gap'),
  })),
  score: z.number().describe('0 to 100: how well the profile fits, weighting essential requirements most'),
  ukNotes: z.array(z.string()).describe('UK-specific points: visa sponsorship, right to work, IR35, security clearance, DBS, driving licence, on-site days, closing date'),
});

export const TailoredSchema = z.object({
  personalStatement: z.string().describe('3 to 4 sentences, first person without "I" at the start of every sentence, aimed at this role'),
  keySkills: z.array(z.string()).describe('6 to 10 skills, each copied exactly from the profile skills list, most relevant first'),
  experience: z.array(z.object({
    id: z.string().describe('The id of an experience entry in the profile'),
    bullets: z.array(z.string()).describe('3 to 5 achievement bullets for this role, most relevant to the posting first'),
  })),
  projectIds: z.array(z.string()).describe('Ids of profile projects worth including, most relevant first; may be empty'),
  coverLetter: z.object({
    paragraphs: z.array(z.string()).describe('3 to 4 paragraphs: why this role and employer, the strongest evidence, a confident close. No greeting or sign-off.'),
  }),
  email: z.object({
    subject: z.string(),
    body: z.string().describe('A short email to send with the CV and cover letter attached. No sign-off name; it is added.'),
  }),
  gaps: z.array(z.string()).describe('Requirements the profile does not show and that the documents therefore do not claim'),
});

const month = () => z.string().describe('YYYY-MM, or YYYY if only the year is given; empty if not given (for an end date, empty means it is current)');

export const ImportedProfileSchema = z.object({
  name: z.string(),
  town: z.string().describe('Town or city only, never a street address'),
  linkedin: z.string(), website: z.string(),
  headline: z.string().describe('Their current or target job title, e.g. "Junior Software Engineer"'),
  statement: z.string().describe('Their own summary or personal statement, close to their words; empty if there is none'),
  skills: z.array(z.string()).describe('Skills, tools and technologies, one per item, as they wrote them'),
  languages: z.array(z.string()).describe('Spoken languages with level, e.g. "Polish (native)"'),
  drivingLicence: z.boolean().describe('true only if they say they hold a driving licence'),
  noticePeriod: z.string(), clearance: z.string().describe('Security clearance they hold, e.g. "SC", or empty'),
  experience: z.array(z.object({
    title: z.string(), employer: z.string(), location: z.string(), start: month(), end: month(),
    achievements: z.array(z.string()).describe('What they did and achieved in this role, one per item, close to their words'),
  })).describe('Jobs, placements, internships and volunteering, most recent first'),
  education: z.array(z.object({
    qualification: z.string().describe('e.g. "BSc (Hons) Computer Science", "A levels", "GCSEs"'),
    institution: z.string(), grade: z.string().describe('e.g. "2:1", "AAB", "9 GCSEs grades 9–6"; empty if not given'),
    start: month(), end: month(), details: z.string(),
  })),
  certifications: z.array(z.object({ name: z.string(), issuer: z.string(), year: z.string() })),
  projects: z.array(z.object({ name: z.string(), url: z.string(), description: z.string() })),
});

const IMPORT_PROMPT = `This is the candidate's own CV. Read it into profile fields.

Copy what is there; don't improve, summarise away or add to it. Leave a field empty (or a list empty) when the documents don't say. Contact details have been removed and marked as such; that's expected. Leave out date of birth, age, marital status, nationality, photos and street addresses.`;

const RULES = `You help a job seeker in the United Kingdom apply for jobs.

Write in British English (organise, programme, licence as a noun, CV not resume, "per annum"), with UK conventions:
- A UK CV has no photo, date of birth, age, marital status or nationality. Do not mention them.
- Keep it to two A4 pages: tight bullets that start with a strong past-tense verb and show results.
- Cover letters are concise and specific to the employer: under 400 words.

Use only facts in the candidate's profile. Never invent an employer, job title, date, qualification, grade, skill, number, percentage, team size or result. If the posting asks for something the profile doesn't show, list it as a gap and leave it out of the documents; don't hint that the candidate has it. You may rephrase and reorder what is in the profile, and draw clear connections between it and the posting.`;

const TONES = {
  professional: 'Tone: professional and warm.',
  confident: 'Tone: confident and direct, with no hedging.',
  enthusiastic: 'Tone: enthusiastic about this employer and role, still professional.',
  concise: 'Tone: brief and plain; every sentence earns its place.',
};

function profileForPrompt(profile) {
  const { name, town, rightToWork, noticePeriod, drivingLicence, clearance, headline, statement, skills, languages, experience, education, certifications, projects } = profile;
  return JSON.stringify({ name, town, rightToWork, noticePeriod, drivingLicence, clearance, headline, statement, skills, languages, experience, education, certifications, projects }, null, 1);
}

function analysePrompt(profile, posting) {
  return `<profile>\n${profileForPrompt(profile)}\n</profile>\n\n<posting>\n${posting}\n</posting>\n\nRead the posting against the profile. List each requirement the posting states, mark whether the profile meets it, and give the evidence.`;
}

function tailorPrompt(profile, posting, analysis, tone, instruction) {
  return `<profile>\n${profileForPrompt(profile)}\n</profile>\n\n<posting>\n${posting}\n</posting>\n\n<analysis>\n${JSON.stringify(analysis)}\n</analysis>\n\n${TONES[tone] || TONES.professional}\n${instruction ? `\nThe candidate asks: ${instruction}\n` : ''}\nWrite a tailored CV (personal statement, key skills, bullets for each relevant experience entry by id), a cover letter and a covering email for this application.`;
}

class AnthropicProvider {
  constructor({ apiKey, model }) {
    this.client = new Anthropic({ apiKey });
    this.model = model || 'claude-opus-5-5';
    this.label = `Claude (${this.model})`;
  }

  async json(schema, prompt, { documents = [] } = {}) {
    const content = withTextDocuments(prompt, documents);
    const res = await this.client.beta.messages.parse({
      model: this.model,
      max_tokens: 16000,
      // If a safety classifier declines, the API retries on its recommended fallback model.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { format: betaZodOutputFormat(schema), effort: 'medium' },
      system: RULES,
      messages: [{ role: 'user', content }],
    });
    if (res.stop_reason === 'refusal') throw new Error('The model declined this request.');
    if (res.stop_reason === 'max_tokens') throw new Error('The answer was cut off; try a shorter document.');
    if (!res.parsed_output) throw new Error('The model returned something that is not the expected JSON.');
    return res.parsed_output;
  }
}

// A local model through Ollama: nothing about you leaves your machine.
class OllamaProvider {
  constructor({ url, model, fetchImpl = fetch }) {
    this.url = (url || 'http://127.0.0.1:11434').replace(/\/$/, '');
    this.model = model;
    this.fetch = fetchImpl;
    this.label = `Ollama (${model})`;
  }

  async json(schema, prompt, { documents = [] } = {}) {
    prompt = withTextDocuments(prompt, documents);
    const res = await this.fetch(`${this.url}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        stream: false,
        format: z.toJSONSchema(schema),
        options: { num_ctx: 16384 },
        messages: [{ role: 'system', content: RULES }, { role: 'user', content: `${prompt}\n\nAnswer with JSON only.` }],
      }),
    }).catch((err) => { throw new Error(`Couldn't reach Ollama at ${this.url}: ${err.message}`); });
    if (!res.ok) throw new Error(`Ollama answered ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const content = (await res.json()).message?.content || '';
    let parsed;
    try { parsed = JSON.parse(content); } catch { throw new Error('The local model did not return valid JSON. A larger model may do better.'); }
    const checked = schema.safeParse(parsed);
    if (!checked.success) throw new Error(`The local model's answer didn't match what was asked for (${checked.error.issues[0]?.path.join('.')}). A larger model may do better.`);
    return checked.data;
  }
}

function withTextDocuments(prompt, documents) {
  if (!documents.length) return prompt;
  return `${documents.map((d) => `<document name="${d.name.replace(/"/g, '')}">\n${d.text}\n</document>`).join('\n\n')}\n\n${prompt}`;
}

export function createProvider(env) {
  const kind = (env.AI_PROVIDER || (env.ANTHROPIC_API_KEY ? 'anthropic' : 'ollama')).toLowerCase();
  if (kind === 'ollama') return env.OLLAMA_MODEL ? new OllamaProvider({ url: env.OLLAMA_URL, model: env.OLLAMA_MODEL }) : null;
  if (kind === 'anthropic') return env.ANTHROPIC_API_KEY ? new AnthropicProvider({ apiKey: env.ANTHROPIC_API_KEY, model: env.ANTHROPIC_MODEL }) : null;
  return null;
}

export const analyse = (provider, profile, posting) => provider.json(AnalysisSchema, analysePrompt(profile, posting));
export const tailor = (provider, profile, posting, analysis, { tone, instruction } = {}) =>
  provider.json(TailoredSchema, tailorPrompt(profile, posting, analysis, tone, instruction));
export const importProfile = (provider, documents, linkedin) =>
  provider.json(ImportedProfileSchema, `${IMPORT_PROMPT}${linkedin ? `\n\nTheir LinkedIn address is ${linkedin}.` : ''}`, { documents });

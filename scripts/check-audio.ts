/**
 * Checks generated audio by transcribing every clip with OpenAI
 * speech-to-text and comparing the transcript with the expected phrase.
 * Flags clips that are garbled, truncated, or in the wrong language.
 *
 *   npm run audio:check                     # every generated clip
 *   npm run audio:check -- --langs th,vi    # a subset
 *   npm run audio:check -- --only basics.   # phrase ids starting with this
 *   npm run audio:check -- --delete         # also delete flagged clips, so
 *                                           # `npm run audio` regenerates them
 *   npm run audio:check -- --flagged        # only clips flagged (or unchecked) in the last report
 *   npm run audio:check -- --rescore        # re-score the last report, no API calls
 *
 * Needs OPENAI_API_KEY. Costs about $0.003 per minute of audio (gpt-4o-mini-transcribe;
 * flagged clips are re-checked with gpt-4o-transcribe).
 * Flagged clips are listed with their transcript so a person can judge them:
 * a transcript can legitimately differ in script (e.g. kanji vs. kana) or use
 * digits for numbers. A full report is written to assets/audio/check-report.json.
 */
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { LANGUAGES } from '../src/data/languages.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const AUDIO_DIR = join(root, 'assets/audio');
const MANIFEST = join(AUDIO_DIR, 'manifest.json');
const REPORT = join(AUDIO_DIR, 'check-report.json');
const MODEL = 'gpt-4o-mini-transcribe';
/** Flagged clips get a second opinion from the stronger model before being reported. */
const SECOND_OPINION_MODEL = 'gpt-4o-transcribe';
/**
 * Context hints for the transcriber, never the expected text itself (that
 * would bias the result). Each language's own "I speak a little <language>"
 * sentence tells the model which language and script to expect.
 */
const PROMPT_PHRASE = 'conversation.speak_a_little';
const EXTRA_PROMPTS: Record<string, string> = {
  zh: '以下是简体中文普通话的句子。',
};
/** Below this similarity (0–1) a clip is flagged for review. */
const THRESHOLD = 0.75;
/** Serbian Cyrillic → Croatian Latin (letter for letter). */
const SERBIAN_CYRILLIC: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', ђ: 'đ', е: 'e', ж: 'ž', з: 'z', и: 'i', ј: 'j', к: 'k', л: 'l',
  љ: 'lj', м: 'm', н: 'n', њ: 'nj', о: 'o', п: 'p', р: 'r', с: 's', т: 't', ћ: 'ć', у: 'u', ф: 'f',
  х: 'h', ц: 'c', ч: 'č', џ: 'dž', ш: 'š',
};

const args = process.argv.slice(2);
const option = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const onlyLangs = option('langs')?.split(',').map((s) => s.trim());
const onlyPrefix = option('only');
const deleteFlagged = args.includes('--delete');
const rescore = args.includes('--rescore');
const onlyFlagged = args.includes('--flagged');

if (existsSync(join(root, '.env'))) process.loadEnvFile(join(root, '.env'));
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey && !args.includes('--rescore')) fail('OPENAI_API_KEY is not set (see .env.example).');
if (!existsSync(MANIFEST)) fail('No generated audio yet. Run npm run audio first.');

type Manifest = Record<string, { voice: string; files: Record<string, { file: string }> }>;
interface Entry { t: string; r?: string; ft?: string; fr?: string }
interface Result { lang: string; key: string; file: string; expected: string; roman?: string; heard: string; score: number }
type Job = Omit<Result, 'heard' | 'score'> & { prompt?: string };

const manifest: Manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
const lastScores = new Map<string, number>(
  existsSync(REPORT) ? (JSON.parse(readFileSync(REPORT, 'utf8')) as Result[]).map((r) => [r.file, r.score]) : [],
);
const jobs: Job[] = [];

for (const lang of LANGUAGES) {
  if (onlyLangs && !onlyLangs.includes(lang.code)) continue;
  const files = manifest[lang.code]?.files;
  if (!files) continue;
  const translations: Record<string, Entry> = JSON.parse(
    readFileSync(join(root, 'src/data/translations', `${lang.code}.json`), 'utf8'),
  );
  for (const [key, { file }] of Object.entries(files)) {
    if (onlyPrefix && !key.startsWith(onlyPrefix)) continue;
    const female = key.endsWith('.female');
    const entry = translations[female ? key.slice(0, -'.female'.length) : key];
    if (!entry || !existsSync(join(AUDIO_DIR, file))) continue;
    if (onlyFlagged && (lastScores.get(file) ?? 0) >= THRESHOLD) continue;
    const hint = key.startsWith(PROMPT_PHRASE) ? undefined : translations[PROMPT_PHRASE]?.t;
    jobs.push({
      lang: lang.code,
      key,
      file,
      expected: (female ? entry.ft : entry.t) ?? entry.t,
      roman: (female ? entry.fr : entry.r) ?? entry.r,
      prompt: [EXTRA_PROMPTS[lang.code], hint].filter(Boolean).join(' ') || undefined,
    });
  }
}

const results: Result[] = [];
if (rescore) {
  // Re-score previous transcripts against current translations.
  const previous: Result[] = JSON.parse(readFileSync(REPORT, 'utf8'));
  const heardByFile = new Map(previous.map((r) => [r.file, r.heard]));
  for (const job of jobs) {
    const heard = heardByFile.get(job.file);
    const { prompt: _, ...rest } = job;
    if (heard !== undefined) results.push({ ...rest, heard, score: score(job, heard) });
  }
} else {
  console.log(`Transcribing ${jobs.length} clip(s) with ${MODEL}…`);
}
let done = 0;
await runPool(rescore ? [] : jobs, 6, async (job) => {
  try {
    const path = join(AUDIO_DIR, job.file);
    let heard = await transcribe(path, job.lang, MODEL, job.prompt);
    let s = score(job, heard);
    if (s < THRESHOLD) {
      const second = await transcribe(path, job.lang, SECOND_OPINION_MODEL, job.prompt);
      const s2 = score(job, second);
      if (s2 > s) [heard, s] = [second, s2];
    }
    const { prompt: _, ...rest } = job;
    results.push({ ...rest, heard, score: s });
  } catch (e) {
    const { prompt: _, ...rest } = job;
    results.push({ ...rest, heard: `ERROR: ${(e as Error).message}`, score: 0 });
  }
  if (++done % 50 === 0 || done === jobs.length) process.stdout.write(`  ${done}/${jobs.length}\r`);
});
if (!rescore) process.stdout.write('\n');

// Merge into the existing report: this run's results replace older ones for the
// same clip, and clips that no longer exist are dropped.
const existingFiles = new Set(Object.values(manifest).flatMap((l) => Object.values(l.files).map((f) => f.file)));
const checkedFiles = new Set(results.map((r) => r.file));
const previousReport: Result[] = existsSync(REPORT) ? JSON.parse(readFileSync(REPORT, 'utf8')) : [];
const merged = [...previousReport.filter((r) => !checkedFiles.has(r.file) && existingFiles.has(r.file)), ...results];
merged.sort((a, b) => a.lang.localeCompare(b.lang) || a.key.localeCompare(b.key));
writeFileSync(REPORT, JSON.stringify(merged, null, 2) + '\n');
results.sort((a, b) => a.lang.localeCompare(b.lang) || a.key.localeCompare(b.key));

const flagged = results.filter((r) => r.score < THRESHOLD);
for (const r of flagged) {
  const expected = r.roman ? `${r.expected}  (${r.roman})` : r.expected;
  console.log(`  ${r.lang} ${r.key}  (${r.score.toFixed(2)})\n      expected: ${expected}\n      heard:    ${r.heard}`);
  if (deleteFlagged) rmSync(join(AUDIO_DIR, r.file), { force: true });
}
console.log(
  `\n${results.length - flagged.length}/${results.length} clips match; ${flagged.length} flagged for review` +
    (deleteFlagged && flagged.length ? ' (deleted — run npm run audio to regenerate)' : '') +
    `.\nFull report: ${REPORT}`,
);

// ---------------------------------------------------------------- helpers

async function transcribe(path: string, language: string, model: string, prompt?: string): Promise<string> {
  for (let attempt = 0; ; attempt++) {
    const form = new FormData();
    form.append('file', new Blob([readFileSync(path)], { type: 'audio/mpeg' }), 'clip.mp3');
    form.append('model', model);
    form.append('language', language);
    if (prompt) form.append('prompt', prompt);
    form.append('response_format', 'json');
    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}` },
      body: form,
    });
    if (res.ok) return ((await res.json()) as { text: string }).text.trim();
    if ((res.status !== 429 && res.status < 500) || attempt >= 6) {
      throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    }
    const retryAfter = Number(res.headers.get('retry-after'));
    await new Promise((r) => setTimeout(r, retryAfter > 0 ? retryAfter * 1000 : 1000 * 2 ** attempt));
  }
}

/**
 * Letters and digits only, lowercased, compatibility-normalized. Arabic vowel
 * marks are optional in writing, so they are dropped; other scripts keep their
 * marks (Thai and Devanagari vowels are combining marks).
 */
function normalize(s: string) {
  return s
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0670]/g, '')
    .replace(/[^\p{L}\p{N}\p{M}]/gu, '');
}

/** For comparing Latin transliterations: also drop accents, apostrophes and hyphens. */
function foldLatin(s: string) {
  return normalize(s.normalize('NFD').replace(/\p{M}/gu, ''));
}

function isMostlyLatin(s: string) {
  const letters = [...s].filter((ch) => /\p{L}/u.test(ch));
  return letters.length > 0 && letters.filter((ch) => /\p{Script=Latin}/u.test(ch)).length / letters.length > 0.8;
}

/**
 * Similarity 0–1 between what the clip should say and what was heard.
 * Speech-to-text often writes short non-Latin clips in Latin letters even when
 * the pronunciation is right, so a Latin transcript is compared against the
 * phrase's romanization instead.
 */
function score(job: { lang: string; key: string; expected: string; roman?: string }, heard: string): number {
  // Croatian and Serbian are mutually intelligible; transcripts sometimes come
  // back in Serbian Cyrillic, which maps letter-for-letter onto Croatian Latin.
  if (job.lang === 'hr') heard = cyrillicToLatin(heard);
  const h = normalize(heard);
  // Numbers are often transcribed as digits: "5" for "cinco".
  const number = /^numbers\.(\d+)/.exec(job.key)?.[1];
  if (number && h.replace(/[.,\s]/g, '') === number) return 1;
  const native = similarity(normalize(job.expected), h);
  if (job.roman && isMostlyLatin(heard) && !isMostlyLatin(job.expected)) {
    return Math.max(native, similarity(foldLatin(job.roman), foldLatin(heard)));
  }
  return native;
}


function cyrillicToLatin(s: string) {
  return [...s.toLowerCase()].map((ch) => SERBIAN_CYRILLIC[ch] ?? ch).join('');
}

/** 1 − normalized Levenshtein distance over code points. */
function similarity(x: string, y: string): number {
  const a = [...x];
  const b = [...y];
  if (!a.length || !b.length) return a.length === b.length ? 1 : 0;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return 1 - prev[b.length] / Math.max(a.length, b.length);
}

async function runPool<T>(items: T[], size: number, worker: (item: T) => Promise<void>) {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (next < items.length) await worker(items[next++]);
    }),
  );
}

function fail(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

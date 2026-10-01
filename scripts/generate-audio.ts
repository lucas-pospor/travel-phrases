/**
 * Pre-generates phrase audio with a cloud text-to-speech service and rewrites
 * src/audio/audio-index.ts so the app bundles the files.
 *
 *   npm run audio -- --dry-run              # count characters, no API calls, no key needed
 *   npm run audio                           # all languages
 *   npm run audio -- --langs ja,ko          # a subset of languages
 *   npm run audio -- --only basics.         # only phrase ids starting with this
 *   npm run audio -- --gender male          # male voice (default: female)
 *   npm run audio -- --force                # regenerate even if unchanged
 *   npm run audio -- --provider google      # force a provider
 *
 * Providers (keys go in .env at the project root, see .env.example):
 *   openai — OPENAI_API_KEY, model gpt-4o-mini-tts. Used when its key is set.
 *   google — GOOGLE_TTS_API_KEY, Google Cloud Text-to-Speech.
 *
 * Incremental: a phrase is re-synthesized only when its text, voice or
 * settings change (tracked in assets/audio/manifest.json). Files for phrases
 * that no longer exist are deleted. If ffmpeg is installed, clips are trimmed
 * of leading/trailing silence and re-encoded to small mono MP3s.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { LANGUAGES, type Language } from '../src/data/languages.ts';
import { PHRASES } from '../src/data/phrases.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const AUDIO_DIR = join(root, 'assets/audio');
const MANIFEST = join(AUDIO_DIR, 'manifest.json');
const INDEX_FILE = join(root, 'src/audio/audio-index.ts');

// ---------------------------------------------------------------- arguments

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const option = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const dryRun = flag('dry-run');
const force = flag('force');
const gender = (option('gender') ?? 'female') as Gender;
const concurrency = Number(option('concurrency') ?? 4);
const onlyPrefix = option('only');
const onlyLangs = option('langs')?.split(',').map((s) => s.trim());
const langs = onlyLangs ? LANGUAGES.filter((l) => onlyLangs.includes(l.code)) : LANGUAGES;

if (gender !== 'female' && gender !== 'male') fail('--gender must be "female" or "male"');
if (onlyLangs && langs.length !== onlyLangs.length) fail(`Unknown language in --langs ${onlyLangs.join(',')}`);

if (existsSync(join(root, '.env'))) process.loadEnvFile(join(root, '.env'));

type Gender = 'female' | 'male';

interface Provider {
  /** Stable identity of the voice used for a language (stored in the manifest, part of the cache key). */
  voiceFor(lang: Language): Promise<string>;
  /** Any other per-language setting that changes the output (part of the cache key). */
  settingsFor(lang: Language): string;
  synthesize(text: string, lang: Language, voice: string): Promise<Buffer>;
}

const providerName = option('provider') ?? (process.env.OPENAI_API_KEY ? 'openai' : 'google');
const provider: Provider =
  providerName === 'openai'
    ? openAiProvider(process.env.OPENAI_API_KEY)
    : providerName === 'google'
      ? googleProvider(process.env.GOOGLE_TTS_API_KEY)
      : fail(`--provider must be "openai" or "google"`);

// ---------------------------------------------------------------- post-processing

const hasFfmpeg = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status === 0;
/**
 * Trim silence at both ends (keeping a short tail so endings aren't clipped)
 * and re-encode to mono 48 kbps MP3, which is plenty for speech.
 */
const FFMPEG_FILTER =
  'silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.08,' +
  'areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.15,areverse';
const FFMPEG_ARGS = ['-af', FFMPEG_FILTER, '-ac', '1', '-ar', '24000', '-b:a', '48k'];
const POSTPROCESS_ID = hasFfmpeg ? `ffmpeg ${FFMPEG_ARGS.join(' ')}` : 'raw';

function postprocess(file: string) {
  if (!hasFfmpeg) return;
  const tmp = `${file}.tmp.mp3`;
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', file, ...FFMPEG_ARGS, tmp]);
  renameSync(tmp, file);
}

/**
 * For very short inputs the TTS model occasionally returns (near-)silence,
 * which trims down to an empty file. A real clip is at least ~0.3 s; at
 * 48 kbps that is well over this size.
 */
const MIN_CLIP_BYTES = 1500;
const isPlausibleClip = (file: string) => existsSync(file) && statSync(file).size >= MIN_CLIP_BYTES;
const SYNTH_ATTEMPTS = 3;

// ---------------------------------------------------------------- types

interface Entry { t: string; ft?: string }
interface Job { key: string; text: string; file: string }
interface ManifestFile { file: string; hash: string }
type Manifest = Record<string, { voice: string; files: Record<string, ManifestFile> }>;

// ---------------------------------------------------------------- main

const manifest: Manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
let totalChars = 0;
let totalJobs = 0;
let failures = 0;

console.log(`Provider: ${providerName}${dryRun ? ' (dry run)' : ''}${hasFfmpeg ? '' : ' — ffmpeg not found, clips stay unprocessed'}`);

for (const lang of langs) {
  const translations: Record<string, Entry> = JSON.parse(
    readFileSync(join(root, 'src/data/translations', `${lang.code}.json`), 'utf8'),
  );
  const voice = await provider.voiceFor(lang);
  const settings = provider.settingsFor(lang);
  const previous = manifest[lang.code]?.files ?? {};
  const files: Record<string, ManifestFile> = {};
  const jobs: Job[] = [];

  for (const phrase of PHRASES) {
    const entry = translations[phrase.id];
    if (!entry) fail(`${lang.code}: missing translation for ${phrase.id} — run npm run validate`);
    const [category, slug] = [phrase.category, phrase.id.slice(phrase.category.length + 1)];
    const variants: [string, string, string][] = [[phrase.id, entry.t, `${slug}.mp3`]];
    if (entry.ft) variants.push([`${phrase.id}.female`, entry.ft, `${slug}.female.mp3`]);

    for (const [key, text, name] of variants) {
      // Outside the --only filter, keep whatever was there before.
      if (onlyPrefix && !phrase.id.startsWith(onlyPrefix)) {
        if (previous[key]) files[key] = previous[key];
        continue;
      }
      const file = `${lang.code}/${category}/${name}`;
      const hash = sha1([voice, settings, POSTPROCESS_ID, text].join('\n'));
      files[key] = { file, hash };
      const upToDate = previous[key]?.hash === hash && isPlausibleClip(join(AUDIO_DIR, file));
      if (force || !upToDate) jobs.push({ key, text, file });
    }
  }

  // Delete audio for phrases (or female variants) that no longer exist.
  if (!dryRun) {
    for (const [key, prev] of Object.entries(previous)) {
      if (!files[key] && existsSync(join(AUDIO_DIR, prev.file))) rmSync(join(AUDIO_DIR, prev.file));
    }
  }

  const chars = jobs.reduce((n, j) => n + [...j.text].length, 0);
  totalChars += chars;
  totalJobs += jobs.length;
  console.log(`${lang.code.padEnd(3)} ${voice.padEnd(32)} ${String(jobs.length).padStart(4)} to generate, ${chars} chars`);

  if (dryRun) continue;

  let done = 0;
  await runPool(jobs, concurrency, async (job) => {
    try {
      const out = join(AUDIO_DIR, job.file);
      mkdirSync(dirname(out), { recursive: true });
      for (let attempt = 1; ; attempt++) {
        writeFileSync(out, await provider.synthesize(job.text, lang, voice));
        postprocess(out);
        if (isPlausibleClip(out)) break;
        if (attempt === SYNTH_ATTEMPTS) {
          rmSync(out, { force: true });
          throw new Error(`no speech in the audio after ${SYNTH_ATTEMPTS} attempts`);
        }
      }
    } catch (e) {
      failures++;
      delete files[job.key];
      console.error(`    ✗ ${job.key}: ${(e as Error).message}`);
    }
    done++;
    if (done % 25 === 0 || done === jobs.length) process.stdout.write(`    ${done}/${jobs.length}\r`);
  });
  if (jobs.length) process.stdout.write('\n');

  manifest[lang.code] = { voice, files };
  // Save after each language so an interrupted run keeps its progress.
  mkdirSync(AUDIO_DIR, { recursive: true });
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
}

console.log(`\n${totalJobs} file(s), ${totalChars} characters${dryRun ? ' (dry run — nothing generated)' : ''}.`);

if (!dryRun) {
  writeIndex(manifest);
  console.log(`Wrote ${relative(root, INDEX_FILE)}.`);
  if (failures) fail(`${failures} phrase(s) failed; re-run to retry them.`);
}

// ---------------------------------------------------------------- OpenAI

function openAiProvider(apiKey: string | undefined): Provider {
  if (!dryRun && !apiKey) fail('OPENAI_API_KEY is not set. Put it in .env (see .env.example) or use --dry-run.');
  const MODEL = 'gpt-4o-mini-tts';
  // OpenAI recommends marin and cedar for best quality.
  const VOICE: Record<Gender, string> = { female: 'marin', male: 'cedar' };

  /** Which accent to ask for. The voices are tuned for English, so this matters. */
  const ACCENTS: Record<string, string> = {
    ar: 'Modern Standard Arabic (fusha), as spoken by a news presenter',
    zh: 'standard Mandarin Chinese (Putonghua) from mainland China',
    hr: 'standard Croatian from Zagreb',
    cs: 'standard Czech from Prague',
    nl: 'standard Dutch from the Netherlands',
    fr: 'standard French from Paris, France',
    de: 'standard German (Hochdeutsch) from Germany',
    el: 'standard modern Greek from Athens',
    hi: 'standard Hindi from Delhi, India',
    id: 'standard Indonesian (Bahasa Indonesia) from Jakarta',
    it: 'standard Italian from Italy',
    ja: 'standard Japanese from Tokyo',
    ko: 'standard Korean from Seoul',
    pl: 'standard Polish from Warsaw',
    pt: 'Brazilian Portuguese from São Paulo, Brazil',
    ru: 'standard Russian from Moscow',
    es: 'Castilian Spanish from Madrid, Spain',
    th: 'standard Central Thai from Bangkok',
    tr: 'standard Turkish from Istanbul',
    vi: 'standard Northern Vietnamese from Hanoi',
  };
  const TONAL = new Set(['zh', 'th', 'vi']);

  const instructionsFor = (lang: Language) =>
    [
      `You are a native speaker of ${ACCENTS[lang.code] ?? lang.name}.`,
      `The text is in ${lang.name}. Pronounce it exactly as a native speaker from that region would, with authentic pronunciation${TONAL.has(lang.code) ? ', correct tones' : ''} and natural intonation, and no foreign or English accent.`,
      'Read only the given text, word for word. Do not translate, explain, or add anything.',
      'Speak clearly at a calm, natural pace, in a friendly tone, as if helping a traveler.',
    ].join(' ');

  return {
    async voiceFor() {
      return `openai/${MODEL}/${VOICE[gender]}`;
    },
    settingsFor: instructionsFor,
    async synthesize(text, lang) {
      const res = await withRetry(() =>
        fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
          body: JSON.stringify({
            model: MODEL,
            voice: VOICE[gender],
            input: text,
            instructions: instructionsFor(lang),
            response_format: 'mp3',
          }),
        }),
      );
      return Buffer.from(await res.arrayBuffer());
    },
  };
}

// ---------------------------------------------------------------- Google

function googleProvider(apiKey: string | undefined): Provider {
  if (!dryRun && !apiKey) fail('GOOGLE_TTS_API_KEY is not set. Put it in .env (see .env.example) or use --dry-run.');
  const API = 'https://texttospeech.googleapis.com/v1';
  /** Pin a specific voice for a language here if the automatic pick sounds wrong. */
  const VOICE_OVERRIDES: Record<string, string> = {
    // es: 'es-ES-Chirp3-HD-Kore',
  };
  /** Best tier first. Chirp 3 HD is the only tier that covers Croatian. */
  const TIER_ORDER = ['Chirp3-HD', 'Chirp-HD', 'Neural2', 'Wavenet', 'Standard'];
  /** Chirp 3 HD voice names are shared across locales; prefer the same ones everywhere. */
  const PREFERRED_NAMES: Record<Gender, string[]> = { female: ['Kore', 'Aoede', 'Leda'], male: ['Charon', 'Puck', 'Orus'] };
  const SSML_GENDER = gender.toUpperCase();

  const call = async <T>(path: string, init?: RequestInit): Promise<T> => {
    const res = await withRetry(() =>
      fetch(`${API}${path}`, {
        ...init,
        headers: { 'x-goog-api-key': apiKey!, 'content-type': 'application/json', ...init?.headers },
      }),
    );
    return (await res.json()) as T;
  };

  return {
    async voiceFor(lang) {
      if (VOICE_OVERRIDES[lang.code]) return VOICE_OVERRIDES[lang.code];
      if (dryRun) return manifest[lang.code]?.voice ?? '(chosen at run time)';
      const { voices = [] } = await call<{ voices?: { name: string; languageCodes: string[]; ssmlGender: string }[] }>(
        `/voices?languageCode=${lang.googleTtsLocale}`,
      );
      const candidates = voices.filter((v) => v.languageCodes.includes(lang.googleTtsLocale));
      if (!candidates.length) fail(`${lang.code}: Google has no voice for ${lang.googleTtsLocale}`);
      const tier = (name: string) => {
        const i = TIER_ORDER.findIndex((t) => name.includes(`-${t}-`));
        return i < 0 ? TIER_ORDER.length : i;
      };
      const preferred = (name: string) => {
        const i = PREFERRED_NAMES[gender].findIndex((n) => name.endsWith(`-${n}`));
        return i < 0 ? PREFERRED_NAMES[gender].length : i;
      };
      candidates.sort(
        (a, b) =>
          tier(a.name) - tier(b.name) ||
          Number(b.ssmlGender === SSML_GENDER) - Number(a.ssmlGender === SSML_GENDER) ||
          preferred(a.name) - preferred(b.name) ||
          a.name.localeCompare(b.name),
      );
      return candidates[0].name;
    },
    settingsFor: () => 'MP3',
    async synthesize(text, lang, voice) {
      const { audioContent } = await call<{ audioContent: string }>('/text:synthesize', {
        method: 'POST',
        body: JSON.stringify({
          input: { text },
          voice: { languageCode: lang.googleTtsLocale, name: voice },
          audioConfig: { audioEncoding: 'MP3' },
        }),
      });
      return Buffer.from(audioContent, 'base64');
    },
  };
}

// ---------------------------------------------------------------- helpers

function fail(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

function sha1(s: string) {
  return createHash('sha1').update(s).digest('hex');
}

/** Retries rate limits and server errors with backoff, honouring Retry-After. */
async function withRetry(request: () => Promise<Response>): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const res = await request();
    if (res.ok) return res;
    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt >= 6) {
      const body = await res.text();
      throw new Error(`HTTP ${res.status}: ${body.slice(0, 300)}`);
    }
    const retryAfter = Number(res.headers.get('retry-after'));
    await new Promise((r) => setTimeout(r, retryAfter > 0 ? retryAfter * 1000 : 1000 * 2 ** attempt));
  }
}

async function runPool<T>(items: T[], size: number, worker: (item: T) => Promise<void>) {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (next < items.length) await worker(items[next++]);
    }),
  );
}

function writeIndex(m: Manifest) {
  const sources = [
    ...new Set(Object.values(m).map((l) => (l.voice.startsWith('openai/') ? 'OpenAI' : 'Google Cloud'))),
  ].sort();
  const lines = [
    '// AUTO-GENERATED by scripts/generate-audio.ts — do not edit by hand.',
    '',
    '/** Which service synthesized the bundled audio (shown in the app as an AI-voice disclosure). */',
    `export const AUDIO_SOURCE: string | null = ${sources.length ? JSON.stringify(`${sources.join(' and ')} text-to-speech`) : 'null'};`,
    '',
    '/** Language code → audio key ("<phrase id>" or "<phrase id>.female") → bundled asset. */',
    'export const AUDIO: Record<string, Record<string, number>> = {',
  ];
  for (const code of Object.keys(m).sort()) {
    const entries = Object.entries(m[code].files).filter(([, f]) => existsSync(join(AUDIO_DIR, f.file)));
    if (!entries.length) continue;
    lines.push(`  ${code}: {`);
    for (const [key, f] of entries) {
      lines.push(`    ${JSON.stringify(key)}: require('../../assets/audio/${f.file}'),`);
    }
    lines.push('  },');
  }
  lines.push('};', '');
  writeFileSync(INDEX_FILE, lines.join('\n'));
}

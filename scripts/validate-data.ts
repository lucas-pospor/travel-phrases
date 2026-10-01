/**
 * Validates every translation file against the master phrase list.
 *
 *   node scripts/validate-data.ts          # all languages
 *   node scripts/validate-data.ts ja ko    # only these
 *
 * Translation entry format (src/data/translations/<code>.json):
 *   "<phrase id>": {
 *     "t":  text as a native speaker writes it (what gets spoken),
 *     "r":  romanization — required for non-Latin scripts, omitted otherwise,
 *     "ft": variant used when the SPEAKER is female (only if it differs),
 *     "fr": romanization of "ft" (required when "ft" is set in a romanized language),
 *     "n":  optional short usage note in English
 *   }
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { LANGUAGES } from '../src/data/languages.ts';
import { PHRASES } from '../src/data/phrases.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ALLOWED_KEYS = new Set(['t', 'r', 'ft', 'fr', 'n']);
const ids = new Set(PHRASES.map((p) => p.id));

const only = process.argv.slice(2);
const langs = only.length ? LANGUAGES.filter((l) => only.includes(l.code)) : LANGUAGES;
if (only.length && langs.length !== only.length) {
  console.error(`Unknown language code in: ${only.join(', ')}`);
  process.exit(2);
}

let problems = 0;
const report = (lang: string, msg: string) => {
  problems++;
  console.error(`  [${lang}] ${msg}`);
};

const nonEmpty = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const hasNonLatinLetter = (s: string) => /[^\u0000-ɏ\s\d\p{P}\p{S}]/u.test(s);

for (const lang of langs) {
  const file = join(root, 'src/data/translations', `${lang.code}.json`);
  if (!existsSync(file)) {
    report(lang.code, `missing file ${file}`);
    continue;
  }
  let data: Record<string, Record<string, unknown>>;
  try {
    data = JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    report(lang.code, `invalid JSON: ${(e as Error).message}`);
    continue;
  }

  for (const id of ids) if (!(id in data)) report(lang.code, `missing phrase ${id}`);

  for (const [id, entry] of Object.entries(data)) {
    if (!ids.has(id)) {
      report(lang.code, `unknown phrase id ${id}`);
      continue;
    }
    if (typeof entry !== 'object' || entry === null) {
      report(lang.code, `${id}: entry must be an object`);
      continue;
    }
    for (const key of Object.keys(entry)) {
      if (!ALLOWED_KEYS.has(key)) report(lang.code, `${id}: unexpected key "${key}"`);
    }
    for (const key of ['t', 'r', 'ft', 'fr', 'n']) {
      if (key in entry && !nonEmpty(entry[key])) report(lang.code, `${id}: "${key}" must be a non-empty string`);
    }
    const { t, r, ft, fr } = entry as Record<string, string | undefined>;
    if (!nonEmpty(t)) continue;

    for (const [key, text] of [['t', t], ['ft', ft]] as const) {
      if (!text) continue;
      if (text.includes('{LANG}')) report(lang.code, `${id}: "${key}" still contains {LANG}`);
      if (/[/|]/.test(text)) report(lang.code, `${id}: "${key}" contains "/" or "|" — give one form; use "ft" for the female-speaker form`);
      if (id.startsWith('numbers.') && /\d/.test(text)) report(lang.code, `${id}: "${key}" should be the number written as a word, without digits`);
      if (lang.romanized && !hasNonLatinLetter(text)) report(lang.code, `${id}: "${key}" has no native-script characters`);
    }
    if (ft !== undefined && ft === t) report(lang.code, `${id}: "ft" is identical to "t" — omit it`);

    if (lang.romanized) {
      if (!nonEmpty(r)) report(lang.code, `${id}: romanization "r" is required`);
      if (ft !== undefined && !nonEmpty(fr)) report(lang.code, `${id}: "fr" is required alongside "ft"`);
    } else {
      if (r !== undefined) report(lang.code, `${id}: "r" is only for non-Latin scripts`);
      if (fr !== undefined) report(lang.code, `${id}: "fr" is only for non-Latin scripts`);
    }
    if (fr !== undefined && ft === undefined) report(lang.code, `${id}: "fr" without "ft"`);
  }
}

if (problems) {
  console.error(`\n✗ ${problems} problem(s) found.`);
  process.exit(1);
}
console.log(`✓ ${langs.length} language(s) × ${ids.size} phrases valid.`);

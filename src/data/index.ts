import { LANGUAGES, type Language } from './languages';
import { CATEGORIES, PHRASES, type Category, type CategoryId, type Phrase } from './phrases';

import ar from './translations/ar.json';
import cs from './translations/cs.json';
import de from './translations/de.json';
import el from './translations/el.json';
import es from './translations/es.json';
import fr from './translations/fr.json';
import hi from './translations/hi.json';
import hr from './translations/hr.json';
import id from './translations/id.json';
import it from './translations/it.json';
import ja from './translations/ja.json';
import ko from './translations/ko.json';
import nl from './translations/nl.json';
import pl from './translations/pl.json';
import pt from './translations/pt.json';
import ru from './translations/ru.json';
import th from './translations/th.json';
import tr from './translations/tr.json';
import vi from './translations/vi.json';
import zh from './translations/zh.json';

export { CATEGORIES, LANGUAGES, PHRASES };
export type { Category, CategoryId, Language, Phrase };

/** One translation, as stored on disk (see scripts/validate-data.ts). */
export interface TranslationEntry {
  t: string;
  r?: string;
  ft?: string;
  fr?: string;
  n?: string;
}

export type Speaker = 'male' | 'female';

const TRANSLATIONS: Record<string, Record<string, TranslationEntry>> = {
  ar, cs, de, el, es, fr, hi, hr, id, it, ja, ko, nl, pl, pt, ru, th, tr, vi, zh,
};

/** A phrase in a specific language, resolved for the user's speaker form. */
export interface LocalPhrase {
  /** Unique across languages: "<lang>:<phrase id>". */
  uid: string;
  phrase: Phrase;
  lang: Language;
  text: string;
  roman?: string;
  usageNote?: string;
  /** Key into the generated audio index ("<id>" or "<id>.female"). */
  audioKey: string;
}

const byCode = new Map(LANGUAGES.map((l) => [l.code, l]));
const phraseById = new Map(PHRASES.map((p) => [p.id, p]));
const categoryById = new Map(CATEGORIES.map((c) => [c.id, c]));

export const getLanguage = (code: string | undefined) => (code ? byCode.get(code) : undefined);
export const getCategory = (cid: string | undefined) => (cid ? categoryById.get(cid as CategoryId) : undefined);
export const phrasesInCategory = (cid: CategoryId) => PHRASES.filter((p) => p.category === cid);

export const makeUid = (langCode: string, phraseId: string) => `${langCode}:${phraseId}`;

export function parseUid(uid: string) {
  const i = uid.indexOf(':');
  return { langCode: uid.slice(0, i), phraseId: uid.slice(i + 1) };
}

export function localize(lang: Language, phraseId: string, speaker: Speaker): LocalPhrase | undefined {
  const phrase = phraseById.get(phraseId);
  const entry = TRANSLATIONS[lang.code]?.[phraseId];
  if (!phrase || !entry) return undefined;
  const female = speaker === 'female' && entry.ft !== undefined;
  return {
    uid: makeUid(lang.code, phraseId),
    phrase,
    lang,
    text: female ? entry.ft! : entry.t,
    roman: female ? entry.fr : entry.r,
    usageNote: entry.n,
    audioKey: female ? `${phraseId}.female` : phraseId,
  };
}

export function localizeAll(lang: Language, phrases: Phrase[], speaker: Speaker): LocalPhrase[] {
  return phrases.flatMap((p) => localize(lang, p.id, speaker) ?? []);
}

/** Lowercase, strip diacritics, so "senor" finds "señor" and "cafe" finds "café". */
const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/** Matches the English meaning, the translation, or its romanization. */
export function searchPhrases(lang: Language, query: string, speaker: Speaker): LocalPhrase[] {
  const q = fold(query.trim());
  if (!q) return [];
  return localizeAll(lang, PHRASES, speaker).filter(
    (lp) =>
      fold(lp.phrase.en).includes(q) ||
      fold(lp.text).includes(q) ||
      (lp.roman !== undefined && fold(lp.roman).includes(q)),
  );
}

/** Strip the translator placeholder from English text for display. */
export const englishFor = (phrase: Phrase, lang: Language) => phrase.en.replace('{LANG}', lang.name);

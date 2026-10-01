# Contributing to Travel Phrases

The most useful help right now comes from native speakers. The translations were machine-generated and the audio is AI-generated, and nobody fluent has checked most of it yet. Each language has an open review issue: look for the [translation label](https://github.com/lucas-pospor/travel-phrases/issues?q=is%3Aissue+is%3Aopen+label%3Atranslation).

## Report a problem

You don't need to know how to code. Pick the form that fits:

- [Wrong translation](https://github.com/lucas-pospor/travel-phrases/issues/new?template=translation.yml): a phrase is wrong, rude, too formal or unnatural.
- [Audio sounds wrong](https://github.com/lucas-pospor/travel-phrases/issues/new?template=audio.yml): wrong pronunciation or tone, a different word, or a clip that is cut off.
- [Bug](https://github.com/lucas-pospor/travel-phrases/issues/new?template=bug.yml): anything else that doesn't work.

## Fix a translation yourself

Each language is one file in `src/data/translations/`, named by its language code (`ja.json`, `pt.json` and so on). Entries are keyed by phrase id, and the English text for each id is in `src/data/phrases.ts`.

```json
"basics.thank_you": { "t": "Obrigado", "ft": "Obrigada" },
"directions.where_bathroom": { "t": "トイレはどこですか？", "r": "Toire wa doko desu ka?" }
```

- `t` is the phrase as a native speaker writes it. The app reads it aloud, so give one form only: no slashes, brackets or alternatives, and write numbers as words.
- `r` is the pronunciation guide in Latin letters. Arabic, Chinese, Greek, Hindi, Japanese, Korean, Russian and Thai need it.
- `ft` and `fr` hold the form a woman would say, and its pronunciation guide. Add them only when that form is different.
- `n` is an optional short usage note in English.

Use the polite form you would use with a stranger, and write what people say in that situation, not a word-for-word translation.

Check your change, then open a pull request:

```bash
npm install
npm run validate
```

You don't need to regenerate the audio. Changing `t` or `ft` makes the old clip outdated, and the maintainer regenerates the audio before the next release.

Please only change languages you speak fluently. Machine-translated corrections don't help, because that's how the current text was made.

## New phrases and new languages

Open an issue first. A new phrase needs a translation in all 20 languages, and a new language needs all 177 phrases plus audio, so it's worth agreeing on a plan before you start.

## Code

- `npm start` runs the app in Expo Go or a browser.
- `npm run check` (data validation, typecheck and lint) must pass before you open a pull request.
- Keep each pull request focused, and say how you tested it: Expo Go, an Android build or the web version.
- The app uses Expo SDK 57. Expo's APIs change between versions, so check the docs for that version.
- Keep the AI voice notice in Settings and under the phrase lists. OpenAI's usage policies require it.

## License of contributions

By contributing, you agree that your contribution is licensed under the GNU General Public License, version 3 or later, together with the additional permission for app stores in [LICENSE-APP-STORE.md](LICENSE-APP-STORE.md). That permission lets the app be published on app stores whose terms the plain GPL doesn't allow. The source code always stays available under the GPL.

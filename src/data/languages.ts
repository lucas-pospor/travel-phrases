/**
 * Supported target languages.
 *
 * `speechLocale` is the BCP-47 tag used for the on-device voice fallback.
 * `googleTtsLocale` is the language code sent to Google Cloud Text-to-Speech
 * when pre-generating audio (it differs for Arabic and Mandarin).
 *
 * This file must stay free of runtime imports: Node scripts import it directly.
 */

export interface Language {
  code: string;
  name: string;
  native: string;
  flag: string;
  speechLocale: string;
  googleTtsLocale: string;
  /** Non-Latin script: every translation must carry a romanization. */
  romanized: boolean;
  rtl?: boolean;
  /** Which variety the phrases are written in, shown in the UI. */
  variant?: string;
}

export const LANGUAGES: Language[] = [
  { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦', speechLocale: 'ar-SA', googleTtsLocale: 'ar-XA', romanized: true, rtl: true, variant: 'Modern Standard' },
  { code: 'zh', name: 'Chinese', native: '中文', flag: '🇨🇳', speechLocale: 'zh-CN', googleTtsLocale: 'cmn-CN', romanized: true, variant: 'Mandarin, Simplified' },
  { code: 'hr', name: 'Croatian', native: 'Hrvatski', flag: '🇭🇷', speechLocale: 'hr-HR', googleTtsLocale: 'hr-HR', romanized: false },
  { code: 'cs', name: 'Czech', native: 'Čeština', flag: '🇨🇿', speechLocale: 'cs-CZ', googleTtsLocale: 'cs-CZ', romanized: false },
  { code: 'nl', name: 'Dutch', native: 'Nederlands', flag: '🇳🇱', speechLocale: 'nl-NL', googleTtsLocale: 'nl-NL', romanized: false },
  { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷', speechLocale: 'fr-FR', googleTtsLocale: 'fr-FR', romanized: false },
  { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪', speechLocale: 'de-DE', googleTtsLocale: 'de-DE', romanized: false },
  { code: 'el', name: 'Greek', native: 'Ελληνικά', flag: '🇬🇷', speechLocale: 'el-GR', googleTtsLocale: 'el-GR', romanized: true },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳', speechLocale: 'hi-IN', googleTtsLocale: 'hi-IN', romanized: true },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia', flag: '🇮🇩', speechLocale: 'id-ID', googleTtsLocale: 'id-ID', romanized: false },
  { code: 'it', name: 'Italian', native: 'Italiano', flag: '🇮🇹', speechLocale: 'it-IT', googleTtsLocale: 'it-IT', romanized: false },
  { code: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵', speechLocale: 'ja-JP', googleTtsLocale: 'ja-JP', romanized: true },
  { code: 'ko', name: 'Korean', native: '한국어', flag: '🇰🇷', speechLocale: 'ko-KR', googleTtsLocale: 'ko-KR', romanized: true },
  { code: 'pl', name: 'Polish', native: 'Polski', flag: '🇵🇱', speechLocale: 'pl-PL', googleTtsLocale: 'pl-PL', romanized: false },
  { code: 'pt', name: 'Portuguese', native: 'Português', flag: '🇧🇷', speechLocale: 'pt-BR', googleTtsLocale: 'pt-BR', romanized: false, variant: 'Brazilian' },
  { code: 'ru', name: 'Russian', native: 'Русский', flag: '🇷🇺', speechLocale: 'ru-RU', googleTtsLocale: 'ru-RU', romanized: true },
  { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸', speechLocale: 'es-ES', googleTtsLocale: 'es-ES', romanized: false },
  { code: 'th', name: 'Thai', native: 'ไทย', flag: '🇹🇭', speechLocale: 'th-TH', googleTtsLocale: 'th-TH', romanized: true },
  { code: 'tr', name: 'Turkish', native: 'Türkçe', flag: '🇹🇷', speechLocale: 'tr-TR', googleTtsLocale: 'tr-TR', romanized: false },
  { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt', flag: '🇻🇳', speechLocale: 'vi-VN', googleTtsLocale: 'vi-VN', romanized: false },
];

import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts } from '@/constants/theme';
import type { Language } from '@/data';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'caption' | 'label';

/** Interface text, set in Overpass. */
export function UIText({ variant = 'body', muted, style, ...rest }: TextProps & { variant?: Variant; muted?: boolean }) {
  const c = useTheme();
  return <Text {...rest} style={[styles[variant], { color: muted ? c.textMuted : c.text }, style]} />;
}

/**
 * Text in the target language. Uses the system font so every script renders,
 * and right-aligns right-to-left languages.
 */
export function PhraseText({ language, style, ...rest }: TextProps & { language: Language }) {
  const c = useTheme();
  return (
    <Text
      {...rest}
      // Web only (not in RN's types): picks the right CJK glyph variants.
      {...({ lang: language.speechLocale } as object)}
      style={[
        styles.phrase,
        { color: c.text },
        language.rtl && { writingDirection: 'rtl', textAlign: 'right' },
        style,
      ]}
    />
  );
}

// Native platforms pick per-script system fonts on their own. Browsers fall
// back per character through this list, so name plain sans faces for each script
// rather than letting the OS choose (Linux can pick a calligraphic Arabic face).
const systemFont = Platform.select({
  web: [
    'system-ui',
    '-apple-system',
    '"Segoe UI"',
    'Roboto',
    '"Noto Sans"',
    '"Noto Sans Arabic"',
    '"Noto Sans Devanagari"',
    '"Noto Sans Thai"',
    '"Noto Sans CJK SC"',
    'sans-serif',
  ].join(', '),
  default: undefined,
});

const styles = StyleSheet.create({
  display: { fontFamily: Fonts.heavy, fontSize: 34, lineHeight: 38, letterSpacing: -0.5 },
  title: { fontFamily: Fonts.bold, fontSize: 24, lineHeight: 30 },
  heading: { fontFamily: Fonts.bold, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: Fonts.regular, fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: Fonts.regular, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: Fonts.semibold, fontSize: 13, lineHeight: 18 },
  phrase: { fontFamily: systemFont, fontSize: 21, lineHeight: 29, fontWeight: '600' },
});

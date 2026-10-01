import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PhraseRow } from '@/components/phrase-row';
import { UIText } from '@/components/text';
import { MaxContentWidth, Radius, Space } from '@/constants/theme';
import { LANGUAGES, getLanguage, localize, parseUid, type LocalPhrase } from '@/data';
import { useTheme } from '@/hooks/use-theme';
import { stopPlayback } from '@/state/playback';
import { useSettings } from '@/state/settings';

export default function FavoritesScreen() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const favorites = useSettings((s) => s.favorites);
  const speaker = useSettings((s) => s.speaker);

  useEffect(() => stopPlayback, []);

  // Grouped by language, in the language list's order; newest first within each.
  const sections = useMemo(() => {
    const byLang = new Map<string, LocalPhrase[]>();
    for (const uid of favorites) {
      const { langCode, phraseId } = parseUid(uid);
      const lang = getLanguage(langCode);
      const lp = lang && localize(lang, phraseId, speaker);
      if (!lp) continue;
      byLang.set(langCode, [...(byLang.get(langCode) ?? []), lp]);
    }
    return LANGUAGES.filter((l) => byLang.has(l.code)).map((l) => ({ lang: l, data: byLang.get(l.code)! }));
  }, [favorites, speaker]);

  if (sections.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="star-outline" size={40} color={c.textMuted} />
        <UIText variant="title">No saved phrases yet</UIText>
        <UIText muted style={styles.emptyText}>
          Tap the star next to a phrase to save it here.
        </UIText>
      </View>
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(lp) => lp.uid}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Space.xxl }]}
      renderSectionHeader={({ section }) => (
        <UIText variant="heading" style={styles.sectionHeader}>
          {section.lang.flag}  {section.lang.name}
        </UIText>
      )}
      renderItem={({ item, index, section }) => (
        <View style={[styles.clip, index === 0 && styles.first, index === section.data.length - 1 && styles.last]}>
          <PhraseRow lp={item} />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: Space.lg, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  sectionHeader: { marginTop: Space.lg, marginBottom: Space.sm, marginLeft: Space.xs },
  clip: { overflow: 'hidden' },
  first: { borderTopLeftRadius: Radius.sheet, borderTopRightRadius: Radius.sheet },
  last: { borderBottomLeftRadius: Radius.sheet, borderBottomRightRadius: Radius.sheet },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Space.md, padding: Space.xl },
  emptyText: { textAlign: 'center', maxWidth: 300 },
});

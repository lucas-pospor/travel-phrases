import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { languageHasRecordings } from '@/audio/player';
import { PillButton, ToggleChip } from '@/components/controls';
import { PhraseRow } from '@/components/phrase-row';
import { UIText } from '@/components/text';
import { MaxContentWidth, Radius, Space } from '@/constants/theme';
import { getCategory, getLanguage, localizeAll, phrasesInCategory } from '@/data';
import { useTheme } from '@/hooks/use-theme';
import { playQueue, stopPlayback, usePlayback } from '@/state/playback';
import { useSettings } from '@/state/settings';

export default function CategoryScreen() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ lang: string; category: string }>();
  const lang = getLanguage(params.lang);
  const category = getCategory(params.category);
  const speaker = useSettings((s) => s.speaker);
  const slow = useSettings((s) => s.slow);
  const setSlow = useSettings((s) => s.setSlow);

  const phrases = useMemo(
    () => (lang && category ? localizeAll(lang, phrasesInCategory(category.id), speaker) : []),
    [lang, category, speaker],
  );
  const queueId = lang && category ? `${lang.code}/${category.id}` : '';
  const playingAll = usePlayback((s) => s.queueId === queueId);

  // Leaving the screen silences it.
  useEffect(() => stopPlayback, []);

  if (!lang || !category) {
    return (
      <View style={styles.notFound}>
        <UIText variant="title">Category not found</UIText>
        <UIText muted>Go back and pick another one.</UIText>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: `${lang.flag}  ${category.title}` }} />
      <FlatList
        data={phrases}
        keyExtractor={(lp) => lp.uid}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Space.xxl }]}
        ListHeaderComponent={
          <View style={styles.controls}>
            <PillButton
              icon={playingAll ? 'stop' : 'play'}
              label={playingAll ? 'Stop' : `Play all ${phrases.length}`}
              onPress={() => (playingAll ? stopPlayback() : playQueue(queueId, phrases))}
            />
            <ToggleChip label="Slow" value={slow} onChange={setSlow} />
          </View>
        }
        renderItem={({ item, index }) => (
          <View
            style={[
              styles.clip,
              { borderColor: c.line },
              index === 0 && styles.first,
              index === phrases.length - 1 && styles.last,
            ]}>
            <PhraseRow lp={item} />
          </View>
        )}
        ListFooterComponent={
          languageHasRecordings(lang.code) ? (
            <UIText variant="caption" muted style={styles.footer}>
              Spoken by an AI-generated voice.
            </UIText>
          ) : null
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: Space.lg, paddingTop: Space.sm, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  controls: { flexDirection: 'row', gap: Space.sm, marginBottom: Space.lg, flexWrap: 'wrap' },
  clip: { overflow: 'hidden' },
  first: { borderTopLeftRadius: Radius.sheet, borderTopRightRadius: Radius.sheet },
  last: { borderBottomLeftRadius: Radius.sheet, borderBottomRightRadius: Radius.sheet },
  footer: { textAlign: 'center', marginTop: Space.lg },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Space.sm, padding: Space.xl },
});

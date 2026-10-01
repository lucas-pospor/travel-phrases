import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { deviceHasVoice, languageHasRecordings } from '@/audio/player';
import { PhraseRow } from '@/components/phrase-row';
import { CategoryRow } from '@/components/rows';
import { SearchField } from '@/components/search-field';
import { SignHero } from '@/components/sign-hero';
import { PhraseText, UIText } from '@/components/text';
import { MaxContentWidth, Radius, Space } from '@/constants/theme';
import {
  CATEGORIES,
  PHRASES,
  getLanguage,
  phrasesInCategory,
  searchPhrases,
  type Category,
  type Language,
  type LocalPhrase,
} from '@/data';
import { useTheme } from '@/hooks/use-theme';
import { stopPlayback } from '@/state/playback';
import { useSettings } from '@/state/settings';

export default function LanguageScreen() {
  const { lang: code } = useLocalSearchParams<{ lang: string }>();
  const lang = getLanguage(code);
  if (!lang) return <NotFound />;
  return <LanguageHome lang={lang} />;
}

function LanguageHome({ lang }: { lang: Language }) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const speaker = useSettings((s) => s.speaker);
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchPhrases(lang, query, speaker), [lang, query, speaker]);
  const searching = query.trim().length > 0;
  const voiceMissing = useVoiceMissing(lang);

  useEffect(() => stopPlayback, []);

  const header = (
    <View style={styles.header}>
      <SignHero kicker={lang.variant ? `${lang.name}, ${lang.variant}` : lang.name} right={<UIText style={styles.flag}>{lang.flag}</UIText>}>
        <PhraseText language={lang} style={[styles.native, { color: c.signText }]}>
          {lang.native}
        </PhraseText>
      </SignHero>
      {voiceMissing && (
        <View style={[styles.notice, { backgroundColor: c.surface, borderColor: c.line }]}>
          <Ionicons name="volume-mute-outline" size={20} color={c.text} />
          <UIText variant="caption" style={styles.noticeText}>
            This device has no {lang.name} voice, so it can’t play these phrases. You can add one in your
            phone’s text-to-speech settings. Show mode still works for letting someone read a phrase.
          </UIText>
        </View>
      )}
      <SearchField value={query} onChangeText={setQuery} placeholder={`Search ${PHRASES.length} ${lang.name} phrases`} />
      {searching && (
        <UIText variant="label" muted>
          {results.length === 0
            ? `Nothing matches “${query.trim()}”. Search in English or ${lang.name}.`
            : `${results.length} ${results.length === 1 ? 'phrase' : 'phrases'}`}
        </UIText>
      )}
    </View>
  );

  // One list for both modes, so the search field (in the header) stays mounted
  // and keeps focus while the rows switch between categories and results.
  const rows: Row[] = searching
    ? results.map((lp) => ({ kind: 'phrase', key: lp.uid, lp }))
    : CATEGORIES.map((category) => ({ kind: 'category', key: category.id, category }));

  return (
    <>
      <Stack.Screen options={{ title: lang.name }} />
      <FlatList
        data={rows}
        keyExtractor={(row) => row.key}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Space.xxl }]}
        ListHeaderComponent={header}
        renderItem={({ item, index }) => (
          <View style={[styles.clip, index === 0 && styles.first, index === rows.length - 1 && styles.last]}>
            {item.kind === 'phrase' ? (
              <PhraseRow lp={item.lp} />
            ) : (
              <CategoryRow
                category={item.category}
                count={phrasesInCategory(item.category.id).length}
                onPress={() =>
                  router.push({ pathname: '/[lang]/[category]', params: { lang: lang.code, category: item.category.id } })
                }
              />
            )}
          </View>
        )}
      />
    </>
  );
}

type Row = { kind: 'phrase'; key: string; lp: LocalPhrase } | { kind: 'category'; key: string; category: Category };

/** True only when we know there is neither a recording nor a device voice. */
function useVoiceMissing(lang: Language) {
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    if (languageHasRecordings(lang.code)) return;
    let alive = true;
    deviceHasVoice(lang.speechLocale).then((has) => alive && setMissing(!has));
    return () => {
      alive = false;
    };
  }, [lang]);
  return missing;
}

function NotFound() {
  return (
    <View style={styles.notFound}>
      <UIText variant="title">Language not found</UIText>
      <UIText muted>Go back and pick one from the list.</UIText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: Space.lg, paddingTop: Space.sm, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  header: { gap: Space.lg, marginBottom: Space.lg },
  flag: { fontSize: 44, lineHeight: 52 },
  native: { fontSize: 36, lineHeight: 46, fontWeight: '800', textAlign: 'left' },
  notice: {
    flexDirection: 'row',
    gap: Space.md,
    padding: Space.md,
    borderRadius: Radius.field,
    borderWidth: StyleSheet.hairlineWidth,
  },
  noticeText: { flex: 1 },
  clip: { overflow: 'hidden' },
  first: { borderTopLeftRadius: Radius.sheet, borderTopRightRadius: Radius.sheet },
  last: { borderBottomLeftRadius: Radius.sheet, borderBottomRightRadius: Radius.sheet },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Space.sm, padding: Space.xl },
});

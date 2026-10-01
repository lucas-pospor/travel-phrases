import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/icon-button';
import { PlayButton } from '@/components/play-button';
import { PhraseText, UIText } from '@/components/text';
import { Fonts, Palette, Space } from '@/constants/theme';
import { englishFor, getLanguage, localize, parseUid } from '@/data';
import { playPhrase, stopPlayback, togglePhrase, usePlayback } from '@/state/playback';
import { useIsFavorite, useSettings } from '@/state/settings';

/** Phrase size steps down with length so it stays legible at arm's length. */
function sizeFor(text: string) {
  const n = [...text].length;
  if (n <= 10) return 64;
  if (n <= 22) return 50;
  if (n <= 40) return 40;
  return 32;
}

/**
 * Full-screen phrase to hold up to someone: a yellow sign with the phrase in
 * large type. Plays once on open.
 */
export default function ShowScreen() {
  const insets = useSafeAreaInsets();
  const { uid = '' } = useLocalSearchParams<{ uid: string }>();
  const { langCode, phraseId } = parseUid(uid);
  const lang = getLanguage(langCode);
  const speaker = useSettings((s) => s.speaker);
  const slow = useSettings((s) => s.slow);
  const setSlow = useSettings((s) => s.setSlow);
  const showRoman = useSettings((s) => s.showRomanization);
  const toggleFavorite = useSettings((s) => s.toggleFavorite);
  const favorite = useIsFavorite(uid);
  const lp = lang ? localize(lang, phraseId, speaker) : undefined;
  const playing = usePlayback((s) => s.activeUid === uid);

  useEffect(() => {
    if (lp) void playPhrase(lp);
    return stopPlayback;
    // Play once per phrase, not on every settings change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (!lp || !lang) {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top }]}>
        <UIText variant="title" style={styles.ink}>
          Phrase not found
        </UIText>
        <IconButton icon="close" label="Close" color={Palette.charcoal} onPress={close} />
      </View>
    );
  }

  const english = englishFor(lp.phrase, lang);
  const size = sizeFor(lp.text);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + Space.sm, paddingBottom: insets.bottom + Space.lg }]}>
      <View style={styles.topBar}>
        <IconButton icon="close" label="Close" color={Palette.charcoal} size={28} onPress={close} />
        <UIText style={styles.langTag}>
          {lang.flag}  {lang.name}
        </UIText>
        <IconButton
          icon={favorite ? 'star' : 'star-outline'}
          label={favorite ? 'Remove from saved' : 'Save phrase'}
          color={Palette.charcoal}
          size={26}
          onPress={() => toggleFavorite(uid)}
        />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <PhraseText language={lang} selectable style={[styles.ink, styles.phrase, { fontSize: size, lineHeight: size * 1.25 }]}>
          {lp.text}
        </PhraseText>
        {showRoman && lp.roman ? (
          <PhraseText language={lang} style={[styles.ink, styles.roman]}>
            {lp.roman}
          </PhraseText>
        ) : null}
        <View style={styles.rule} />
        <UIText style={[styles.ink, styles.english]}>{english}</UIText>
      </ScrollView>

      <View style={styles.bottomBar}>
        <PlayButton playing={playing} onPress={() => togglePhrase(lp)} size={72} tone="ink" label={english} />
        <View style={styles.speedRow}>
          <IconButton
            icon={slow ? 'checkbox' : 'square-outline'}
            label={slow ? 'Slow playback on' : 'Slow playback off'}
            color={Palette.charcoal}
            onPress={() => setSlow(!slow)}
          />
          <UIText style={[styles.ink, styles.speedLabel]} onPress={() => setSlow(!slow)}>
            Slow
          </UIText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Palette.signal, paddingHorizontal: Space.lg },
  center: { alignItems: 'center', justifyContent: 'center', gap: Space.lg },
  ink: { color: Palette.charcoal },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  langTag: { fontFamily: Fonts.bold, fontSize: 16, color: Palette.charcoal },
  body: { flexGrow: 1, justifyContent: 'center', paddingVertical: Space.xl, paddingHorizontal: Space.sm, gap: Space.md },
  phrase: { fontWeight: '800' },
  roman: { fontSize: 22, lineHeight: 30, fontWeight: '500', textAlign: 'left', writingDirection: 'ltr' },
  rule: { height: 3, width: 48, backgroundColor: Palette.charcoal, marginVertical: Space.sm },
  english: { fontFamily: Fonts.semibold, fontSize: 18, lineHeight: 24 },
  bottomBar: { alignItems: 'center', gap: Space.sm },
  speedRow: { flexDirection: 'row', alignItems: 'center' },
  speedLabel: { fontFamily: Fonts.bold, fontSize: 16 },
});

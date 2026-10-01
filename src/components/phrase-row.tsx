import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Space } from '@/constants/theme';
import { englishFor, type LocalPhrase } from '@/data';
import { useTheme } from '@/hooks/use-theme';
import { togglePhrase, usePlayback } from '@/state/playback';
import { useIsFavorite, useSettings } from '@/state/settings';

import { IconButton } from './icon-button';
import { PlayButton } from './play-button';
import { PhraseText, UIText } from './text';

interface Props {
  lp: LocalPhrase;
  /** Show the language's flag before the English text (favorites list). */
  showLanguage?: boolean;
}

/** Tap anywhere on the row to hear the phrase; the expand icon opens Show mode. */
export const PhraseRow = memo(function PhraseRow({ lp, showLanguage }: Props) {
  const c = useTheme();
  const playing = usePlayback((s) => s.activeUid === lp.uid);
  const favorite = useIsFavorite(lp.uid);
  const toggleFavorite = useSettings((s) => s.toggleFavorite);
  const showRoman = useSettings((s) => s.showRomanization);
  const english = englishFor(lp.phrase, lp.lang);

  return (
    // The row is a convenience tap target for sighted users; the play button is
    // the accessible control, so the row itself is not exposed as a button.
    <Pressable
      onPress={() => togglePhrase(lp)}
      accessible={false}
      style={({ pressed }) => {
        const bg = pressed ? c.surfacePressed : c.surface;
        return [styles.row, { backgroundColor: bg, borderBottomColor: c.line, borderLeftColor: playing ? c.signal : bg }];
      }}>
      <View style={styles.text}>
        <View style={styles.labelRow}>
          <UIText variant="label" muted numberOfLines={2} style={styles.label}>
            {showLanguage ? `${lp.lang.flag}  ` : ''}
            {english}
          </UIText>
          <IconButton
            icon={favorite ? 'star' : 'star-outline'}
            color={favorite ? c.favorite : c.textMuted}
            size={18}
            label={favorite ? `Remove ${english} from saved` : `Save ${english}`}
            onPress={() => toggleFavorite(lp.uid)}
          />
          <IconButton
            icon="expand-outline"
            color={c.textMuted}
            size={18}
            label={`Show ${english} full screen`}
            onPress={() => router.push({ pathname: '/show', params: { uid: lp.uid } })}
          />
        </View>
        <PhraseText language={lp.lang} style={styles.phrase}>
          {lp.text}
        </PhraseText>
        {showRoman && lp.roman ? (
          <PhraseText language={lp.lang} style={[styles.roman, { color: c.textMuted }]}>
            {lp.roman}
          </PhraseText>
        ) : null}
        {lp.phrase.note || lp.usageNote ? (
          <View style={styles.noteRow}>
            <Ionicons name="information-circle-outline" size={14} color={c.textMuted} style={styles.noteIcon} />
            <UIText variant="caption" muted style={styles.noteText}>
              {[lp.phrase.note, lp.usageNote].filter(Boolean).join('. ')}
            </UIText>
          </View>
        ) : null}
      </View>

      <View style={styles.play}>
        <PlayButton playing={playing} onPress={() => togglePhrase(lp)} label={english} />
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Space.md,
    paddingTop: Space.sm,
    paddingBottom: Space.md,
    paddingRight: Space.lg,
    paddingLeft: Space.lg - 4,
    borderLeftWidth: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  text: { flex: 1 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginRight: -6 },
  label: { flex: 1 },
  phrase: { marginTop: -2 },
  roman: { fontSize: 15, lineHeight: 20, fontWeight: '400', textAlign: 'left', writingDirection: 'ltr' },
  noteRow: { flexDirection: 'row', gap: 4, marginTop: 4 },
  noteIcon: { marginTop: 2 },
  noteText: { flex: 1 },
  play: { justifyContent: 'center', paddingTop: Space.xs },
});

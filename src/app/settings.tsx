import Constants from 'expo-constants';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AUDIO_SOURCE, languageHasRecordings } from '@/audio/player';
import { Segmented, SettingBlock } from '@/components/controls';
import { UIText } from '@/components/text';
import { MaxContentWidth, Space } from '@/constants/theme';
import { LANGUAGES } from '@/data';
import { useTheme } from '@/hooks/use-theme';
import { useSettings } from '@/state/settings';

const romanizedNames = LANGUAGES.filter((l) => l.romanized).map((l) => l.name);
const listFormat = (items: string[]) =>
  items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

export default function SettingsScreen() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const s = useSettings();
  const recorded = LANGUAGES.filter((l) => languageHasRecordings(l.code)).length;

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Space.xxl }]}>
      <SettingBlock
        title="Phrase forms"
        description="Some phrases change with the speaker’s gender. In Portuguese, for example, a man says obrigado and a woman says obrigada. Choose which form to show and play.">
        <Segmented
          value={s.speaker}
          onChange={s.setSpeaker}
          options={[
            { value: 'male', label: 'Masculine' },
            { value: 'female', label: 'Feminine' },
          ]}
        />
      </SettingBlock>

      <SettingBlock
        title="Pronunciation guide"
        description={`Shows how to say ${listFormat(romanizedNames)} phrases, written in Latin letters.`}>
        <Row label="Show pronunciation guide" value={s.showRomanization} onChange={s.setShowRomanization} />
      </SettingBlock>

      <SettingBlock title="Playback" description="Plays every phrase at 70% speed. You can also turn this on from any phrase list.">
        <Row label="Slow playback" value={s.slow} onChange={s.setSlow} />
      </SettingBlock>

      <SettingBlock title="Audio">
        <UIText variant="caption" muted>
          {recorded === 0
            ? 'Your phone’s built-in voice reads the phrases. How it sounds, and which languages it covers, depends on the phone.'
            : `An AI-generated voice (${AUDIO_SOURCE}) reads the phrases. It is not a recording of a real person. ` +
              (recorded === LANGUAGES.length
                ? 'The audio is stored in the app, so it works offline.'
                : `${recorded} of ${LANGUAGES.length} languages have this audio built in. The rest use your phone’s voice.`)}
        </UIText>
      </SettingBlock>

      <SettingBlock title="About the translations">
        <UIText variant="caption" muted>
          The translations were machine-generated, and native speakers haven’t checked them yet. For anything
          important, like allergies or medication, check with a local.
        </UIText>
      </SettingBlock>

      <View style={styles.footer}>
        <UIText variant="caption" muted style={{ color: c.textMuted }}>
          Travel Phrases {Constants.expoConfig?.version}
        </UIText>
      </View>
    </ScrollView>
  );
}

function Row({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  const c = useTheme();
  return (
    <View style={styles.row}>
      <UIText style={styles.rowLabel}>{label}</UIText>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={label}
        trackColor={{ true: c.sign, false: c.line }}
        thumbColor={value ? c.signal : undefined}
        // Web: thumb color when on.
        {...({ activeThumbColor: c.signal } as object)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: Space.lg, gap: Space.md, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Space.md },
  rowLabel: { flex: 1 },
  footer: { alignItems: 'center', marginTop: Space.lg },
});

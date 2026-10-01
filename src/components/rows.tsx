import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { CategoryIcon, Fonts, Radius, Space, categoryTile } from '@/constants/theme';
import type { Category, Language } from '@/data';
import { useTheme } from '@/hooks/use-theme';

import { PhraseText, UIText } from './text';

/** Departure-board style row: flag, names, and the language code as a gate tag. */
export function LanguageRow({ lang, onPress }: { lang: Language; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${lang.name}, ${lang.native}`}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? c.surfacePressed : c.surface, borderColor: c.line },
      ]}>
      <UIText style={styles.flag}>{lang.flag}</UIText>
      <View style={styles.grow}>
        <UIText variant="heading">{lang.name}</UIText>
        <PhraseText language={lang} style={[styles.native, { color: c.textMuted }]} numberOfLines={1}>
          {lang.native}
        </PhraseText>
      </View>
      <View style={[styles.codeTag, { backgroundColor: c.signal }]}>
        <UIText style={[styles.codeText, { color: c.onSignal }]}>{lang.code.toUpperCase()}</UIText>
      </View>
    </Pressable>
  );
}

/** Directional-sign style row: pictogram tile, title, what's inside, phrase count. */
export function CategoryRow({ category, count, onPress }: { category: Category; count: number; onPress: () => void }) {
  const c = useTheme();
  const tile = categoryTile(category.id, c);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${category.title}, ${count} phrases`}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? c.surfacePressed : c.surface, borderColor: c.line },
      ]}>
      <View style={[styles.tile, { backgroundColor: tile.bg }]}>
        <Ionicons name={CategoryIcon[category.id]} size={24} color={tile.fg} />
      </View>
      <View style={styles.grow}>
        <UIText variant="heading">{category.title}</UIText>
        <UIText variant="caption" muted numberOfLines={2}>
          {category.blurb}
        </UIText>
      </View>
      <UIText variant="label" muted>
        {count}
      </UIText>
      <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    paddingHorizontal: Space.lg,
    paddingVertical: Space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  grow: { flex: 1 },
  flag: { fontSize: 30, lineHeight: 38 },
  native: { fontSize: 15, lineHeight: 20, fontWeight: '400', textAlign: 'left' },
  codeTag: { borderRadius: Radius.tile - 2, paddingHorizontal: 8, paddingTop: 4, paddingBottom: 2, minWidth: 42, alignItems: 'center' },
  codeText: { fontFamily: Fonts.heavy, fontSize: 16, lineHeight: 20, letterSpacing: 1 },
  tile: { width: 44, height: 44, borderRadius: Radius.tile, alignItems: 'center', justifyContent: 'center' },
});

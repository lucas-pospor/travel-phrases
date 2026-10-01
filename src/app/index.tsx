import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/icon-button';
import { LanguageRow } from '@/components/rows';
import { SearchField } from '@/components/search-field';
import { SignHero } from '@/components/sign-hero';
import { UIText } from '@/components/text';
import { MaxContentWidth, Space } from '@/constants/theme';
import { LANGUAGES } from '@/data';
import { useTheme } from '@/hooks/use-theme';

const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

export default function LanguagesScreen() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const languages = useMemo(() => {
    const q = fold(query.trim());
    if (!q) return LANGUAGES;
    return LANGUAGES.filter((l) => fold(l.name).includes(q) || fold(l.native).includes(q) || l.code === q);
  }, [query]);

  return (
    <FlatList
      data={languages}
      keyExtractor={(l) => l.code}
      keyboardShouldPersistTaps="handled"
      style={{ backgroundColor: c.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + Space.sm, paddingBottom: insets.bottom + Space.xxl }]}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.toolbar}>
            <UIText variant="heading">Travel Phrases</UIText>
            <View style={styles.toolbarActions}>
              <IconButton icon="star-outline" label="Saved phrases" onPress={() => router.push('/favorites')} />
              <IconButton icon="settings-outline" label="Settings" onPress={() => router.push('/settings')} />
            </View>
          </View>
          <SignHero kicker={`${LANGUAGES.length} languages, spoken aloud`}>Where are you headed?</SignHero>
          <SearchField value={query} onChangeText={setQuery} placeholder="Search languages" />
        </View>
      }
      renderItem={({ item, index }) => (
        <View style={[index === 0 && styles.firstRow, index === languages.length - 1 && styles.lastRow, styles.clip]}>
          <LanguageRow lang={item} onPress={() => router.push({ pathname: '/[lang]', params: { lang: item.code } })} />
        </View>
      )}
      ListEmptyComponent={
        <UIText muted style={styles.empty}>
          No language matches “{query}”. Try its English or native name.
        </UIText>
      }
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: Space.lg, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  header: { gap: Space.lg, marginBottom: Space.lg },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: Space.xs },
  toolbarActions: { flexDirection: 'row', gap: Space.xs },
  clip: { overflow: 'hidden' },
  firstRow: { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  lastRow: { borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  empty: { textAlign: 'center', paddingVertical: Space.xl },
});

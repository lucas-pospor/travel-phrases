import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Fonts, Radius, Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { UIText } from './text';

/**
 * The charcoal sign panel that opens the main screens, like an overhead
 * airport sign: a small yellow line and a large white one.
 */
export function SignHero({ kicker, children, right }: { kicker: string; children: ReactNode; right?: ReactNode }) {
  const c = useTheme();
  return (
    <View style={[styles.panel, { backgroundColor: c.sign }]}>
      <View style={styles.text}>
        <UIText style={[styles.kicker, { color: c.signal }]}>{kicker}</UIText>
        {typeof children === 'string' ? (
          <UIText variant="display" style={{ color: c.signText }}>
            {children}
          </UIText>
        ) : (
          children
        )}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Space.md,
    borderRadius: Radius.sheet,
    paddingHorizontal: Space.xl,
    paddingTop: Space.xl,
    paddingBottom: Space.lg + 2,
  },
  text: { flex: 1, gap: Space.xs },
  kicker: { fontFamily: Fonts.bold, fontSize: 15, lineHeight: 20 },
});

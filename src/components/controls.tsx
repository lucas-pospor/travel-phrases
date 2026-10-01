import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Fonts, Radius, Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { UIText } from './text';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Pill button. "signal" is the primary yellow action. */
export function PillButton({
  icon,
  label,
  onPress,
  tone = 'signal',
}: {
  icon?: IconName;
  label: string;
  onPress: () => void;
  tone?: 'signal' | 'plain';
}) {
  const c = useTheme();
  const bg = tone === 'signal' ? c.signal : c.surface;
  const fg = tone === 'signal' ? c.onSignal : c.text;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.pill,
        { backgroundColor: bg, opacity: pressed ? 0.8 : 1 },
        tone === 'plain' && { borderColor: c.line, borderWidth: StyleSheet.hairlineWidth },
      ]}>
      {icon && <Ionicons name={icon} size={18} color={fg} />}
      <UIText style={[styles.pillText, { color: fg }]}>{label}</UIText>
    </Pressable>
  );
}

/** On/off chip, e.g. "Slow". */
export function ToggleChip({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  const c = useTheme();
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      style={({ pressed }) => [
        styles.pill,
        {
          backgroundColor: value ? c.sign : c.surface,
          borderColor: value ? c.sign : c.line,
          borderWidth: StyleSheet.hairlineWidth,
          opacity: pressed ? 0.8 : 1,
        },
      ]}>
      <Ionicons name={value ? 'checkmark' : 'speedometer-outline'} size={16} color={value ? c.signal : c.textMuted} />
      <UIText style={[styles.pillText, { color: value ? c.signText : c.text }]}>{label}</UIText>
    </Pressable>
  );
}

/** Two or more mutually exclusive options. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const c = useTheme();
  return (
    <View style={[styles.segmented, { backgroundColor: c.background, borderColor: c.line }]} accessibilityRole="radiogroup">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            style={[styles.segment, selected && { backgroundColor: c.sign }]}>
            <UIText style={[styles.pillText, { color: selected ? c.signText : c.text }]}>{o.label}</UIText>
          </Pressable>
        );
      })}
    </View>
  );
}

/** A settings group: heading, explanation, then the control. */
export function SettingBlock({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  const c = useTheme();
  return (
    <View style={[styles.block, { backgroundColor: c.surface, borderColor: c.line }]}>
      <UIText variant="heading">{title}</UIText>
      {description ? (
        <UIText variant="caption" muted>
          {description}
        </UIText>
      ) : null}
      <View style={styles.blockControl}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radius.pill,
    paddingHorizontal: Space.lg,
    height: 40,
  },
  pillText: { fontFamily: Fonts.bold, fontSize: 15, lineHeight: 20, marginTop: 2 },
  segmented: { flexDirection: 'row', borderRadius: Radius.field, borderWidth: StyleSheet.hairlineWidth, padding: 3 },
  segment: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 38, borderRadius: Radius.field - 3 },
  block: { borderRadius: Radius.sheet, borderWidth: StyleSheet.hairlineWidth, padding: Space.lg, gap: Space.xs },
  blockControl: { marginTop: Space.sm },
});

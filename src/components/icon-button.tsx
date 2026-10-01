import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

interface Props {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  color?: string;
  size?: number;
}

export function IconButton({ icon, label, onPress, color, size = 24 }: Props) {
  const c = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={10}
      style={({ pressed }) => ({ padding: 6, opacity: pressed ? 0.55 : 1 })}>
      <Ionicons name={icon} size={size} color={color ?? c.text} />
    </Pressable>
  );
}

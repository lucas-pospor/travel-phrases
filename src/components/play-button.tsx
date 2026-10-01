import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Palette } from '@/constants/theme';

interface Props {
  playing: boolean;
  onPress: () => void;
  size?: number;
  /** "signal": yellow button (default). "ink": charcoal button, for use on yellow. */
  tone?: 'signal' | 'ink';
  label: string;
}

/** Round play control. While playing it shows a stop glyph and a ripple ring. */
export function PlayButton({ playing, onPress, size = 48, tone = 'signal', label }: Props) {
  const reduceMotion = useReducedMotion();
  const ripple = useSharedValue(0);

  useEffect(() => {
    if (playing && !reduceMotion) {
      ripple.value = 0;
      ripple.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) }), -1, false);
    } else {
      cancelAnimation(ripple);
      ripple.value = 0;
    }
  }, [playing, reduceMotion, ripple]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: playing ? 0.55 * (1 - ripple.value) : 0,
    transform: [{ scale: 1 + ripple.value * 0.45 }],
  }));

  const bg = tone === 'signal' ? Palette.signal : Palette.charcoal;
  const fg = tone === 'signal' ? Palette.charcoal : Palette.signal;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={playing ? `Stop ${label}` : `Play ${label}`}
      hitSlop={8}
      style={({ pressed }) => [{ width: size, height: size, opacity: pressed ? 0.8 : 1 }]}>
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { borderRadius: size / 2, backgroundColor: bg }, ringStyle]}
      />
      <View style={[styles.face, { borderRadius: size / 2, backgroundColor: bg }]}>
        <Ionicons
          name={playing ? 'stop' : 'play'}
          size={size * 0.42}
          color={fg}
          // The play triangle looks off-centre unless nudged right.
          style={playing ? undefined : { marginLeft: size * 0.06 }}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  face: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

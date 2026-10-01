/**
 * Visual system borrowed from airport and railway wayfinding: signal yellow on
 * sign charcoal, a cool concrete ground, red for emergencies and green for
 * health — the same meanings those colors carry on real signage.
 */
import type { ComponentProps } from 'react';
import type Ionicons from '@expo/vector-icons/Ionicons';

import type { CategoryId } from '@/data/phrases';

export const Palette = {
  signal: '#FFC72C',
  charcoal: '#23272B',
  emergency: '#D7263D',
  health: '#2E9E5B',
};

export const Colors = {
  light: {
    background: '#E9EBEE',
    surface: '#FFFFFF',
    surfacePressed: '#F3F4F6',
    text: '#23272B',
    textMuted: '#5B636B',
    line: '#D5D9DE',
    sign: Palette.charcoal,
    signText: '#FFFFFF',
    signal: Palette.signal,
    onSignal: Palette.charcoal,
    /** Filled star. Yellow is too faint on white, so light mode uses charcoal. */
    favorite: Palette.charcoal,
    emergency: Palette.emergency,
    health: Palette.health,
  },
  dark: {
    background: '#15181B',
    surface: '#1F2327',
    surfacePressed: '#2A2F34',
    text: '#F1F2F3',
    textMuted: '#9BA3AB',
    line: '#30363C',
    sign: '#2B3035',
    signText: '#FFFFFF',
    signal: Palette.signal,
    onSignal: Palette.charcoal,
    favorite: Palette.signal,
    emergency: '#E5485C',
    health: '#3DB26E',
  },
};

export type ThemeColors = typeof Colors.light;

/** Overpass descends from Highway Gothic, the road-sign typeface. Latin only,
 *  so it is used for the English interface; phrases use the system font so
 *  every script renders. */
export const Fonts = {
  regular: 'Overpass_400Regular',
  semibold: 'Overpass_600SemiBold',
  bold: 'Overpass_700Bold',
  heavy: 'Overpass_800ExtraBold',
};

export const Space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const Radius = { tile: 6, field: 10, sheet: 16, pill: 999 } as const;

export const MaxContentWidth = 720;

type IconName = ComponentProps<typeof Ionicons>['name'];

export const CategoryIcon: Record<CategoryId, IconName> = {
  basics: 'hand-left',
  conversation: 'chatbubbles',
  emergency: 'warning',
  directions: 'navigate',
  transport: 'train',
  accommodation: 'bed',
  food: 'restaurant',
  shopping: 'bag-handle',
  health: 'medkit',
  sightseeing: 'camera',
  numbers: 'keypad',
  time: 'time',
};

/** Pictogram tile colors: charcoal with yellow, except the two signage meanings. */
export function categoryTile(id: CategoryId, c: ThemeColors) {
  if (id === 'emergency') return { bg: c.emergency, fg: '#FFFFFF' };
  if (id === 'health') return { bg: c.health, fg: '#FFFFFF' };
  return { bg: c.sign, fg: c.signal };
}

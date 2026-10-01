import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Speaker } from '@/data';

interface SettingsState {
  /** Which form to use for phrases that change with the speaker's gender. */
  speaker: Speaker;
  showRomanization: boolean;
  slow: boolean;
  /** Phrase uids ("<lang>:<phrase id>"), most recently added first. */
  favorites: string[];
  setSpeaker: (speaker: Speaker) => void;
  setShowRomanization: (on: boolean) => void;
  setSlow: (on: boolean) => void;
  toggleFavorite: (uid: string) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      speaker: 'male',
      showRomanization: true,
      slow: false,
      favorites: [],
      setSpeaker: (speaker) => set({ speaker }),
      setShowRomanization: (showRomanization) => set({ showRomanization }),
      setSlow: (slow) => set({ slow }),
      toggleFavorite: (uid) =>
        set((s) => ({
          favorites: s.favorites.includes(uid) ? s.favorites.filter((f) => f !== uid) : [uid, ...s.favorites],
        })),
    }),
    {
      name: 'settings',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export const useIsFavorite = (uid: string) => useSettings((s) => s.favorites.includes(uid));

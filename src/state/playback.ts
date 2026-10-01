import { create } from 'zustand';

import { speak, stop } from '@/audio/player';
import type { LocalPhrase } from '@/data';

import { useSettings } from './settings';

interface PlaybackState {
  /** uid of the phrase currently sounding, if any. */
  activeUid: string | null;
  /** Set while a "play all" run is in progress (the list's identity). */
  queueId: string | null;
}

export const usePlayback = create<PlaybackState>(() => ({ activeUid: null, queueId: null }));

const GAP_BETWEEN_PHRASES_MS = 700;

// Each run gets a token; starting anything new invalidates older runs.
let runToken = 0;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const isSlow = () => useSettings.getState().slow;

export async function playPhrase(lp: LocalPhrase, opts: { slow?: boolean } = {}) {
  const token = ++runToken;
  usePlayback.setState({ activeUid: lp.uid, queueId: null });
  await speak(lp, opts.slow ?? isSlow());
  if (token === runToken) usePlayback.setState({ activeUid: null });
}

/** Tapping the phrase that is already playing stops it. */
export function togglePhrase(lp: LocalPhrase) {
  if (usePlayback.getState().activeUid === lp.uid) stopPlayback();
  else void playPhrase(lp);
}

export async function playQueue(queueId: string, list: LocalPhrase[]) {
  const token = ++runToken;
  usePlayback.setState({ queueId });
  for (let i = 0; i < list.length; i++) {
    if (token !== runToken) return;
    usePlayback.setState({ activeUid: list[i].uid });
    await speak(list[i], isSlow());
    if (token !== runToken) return;
    if (i < list.length - 1) await wait(GAP_BETWEEN_PHRASES_MS);
  }
  if (token === runToken) usePlayback.setState({ activeUid: null, queueId: null });
}

export function stopPlayback() {
  runToken++;
  stop();
  usePlayback.setState({ activeUid: null, queueId: null });
}

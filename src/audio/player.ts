/**
 * Plays one phrase at a time: the bundled recording when one exists, otherwise
 * the device's text-to-speech voice. Starting a new phrase stops the previous
 * one. `speak()` resolves when playback ends or is stopped — never rejects —
 * so callers can await it in a loop for "play all".
 */
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';

import type { LocalPhrase } from '@/data';

import { AUDIO, AUDIO_SOURCE } from './audio-index';

export { AUDIO_SOURCE };

export const SLOW_RATE = 0.7;

/** Longest a single phrase may take before we assume a lost "finished" event. */
const WATCHDOG_MS = 20_000;

let active: { cancel: () => void } | null = null;
let audioModeReady: Promise<void> | null = null;

export function hasRecording(lp: LocalPhrase) {
  return AUDIO[lp.lang.code]?.[lp.audioKey] !== undefined;
}

export function languageHasRecordings(langCode: string) {
  return Object.keys(AUDIO[langCode] ?? {}).length > 0;
}

export function stop() {
  active?.cancel();
  active = null;
}

export function speak(lp: LocalPhrase, slow: boolean): Promise<void> {
  stop();
  return new Promise((resolve) => {
    let player: AudioPlayer | null = null;
    let watchdog: ReturnType<typeof setTimeout> | undefined;
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(watchdog);
      if (player) {
        player.remove();
        player = null;
      } else {
        Speech.stop();
      }
      if (active === handle) active = null;
      resolve();
    };
    const handle = { cancel: finish };
    active = handle;
    watchdog = setTimeout(finish, WATCHDOG_MS);

    const source = AUDIO[lp.lang.code]?.[lp.audioKey];
    if (source !== undefined) {
      audioModeReady ??= setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'duckOthers' }).catch(() => {});
      player = createAudioPlayer(source);
      player.setPlaybackRate(slow ? SLOW_RATE : 1, 'high');
      player.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) finish();
      });
      player.play();
    } else {
      Speech.speak(lp.text, {
        language: lp.lang.speechLocale,
        rate: slow ? SLOW_RATE : 1,
        onDone: finish,
        onStopped: finish,
        onError: finish,
      });
    }
  });
}

/** Whether the device has a text-to-speech voice for a language (fallback path). */
export async function deviceHasVoice(speechLocale: string): Promise<boolean> {
  try {
    const voices = await Promise.race([
      Speech.getAvailableVoicesAsync(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
    ]);
    const prefix = speechLocale.split('-')[0].toLowerCase();
    return voices.some((v) => v.language.replace('_', '-').toLowerCase().split('-')[0] === prefix);
  } catch {
    // Unknown — don't warn about something we can't verify.
    return true;
  }
}

/**
 * React hook around the AudioManager singleton.
 * - Preloads all sounds once on mount.
 * - Unlocks the AudioContext on the first user gesture (autoplay policy).
 * - Keeps the manager's mute in sync with the game store.
 */

import { useCallback, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { audio } from './AudioManager';
import type { PlayOptions, SoundId } from './types';

export function useAudio() {
  const mute = useGameStore((s) => s.mute);

  // Preload once + register a one-time gesture listener to unlock audio.
  useEffect(() => {
    void audio.preload();

    const unlock = () => audio.resume();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });

    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  // Mirror store mute → manager.
  useEffect(() => {
    audio.setMute(mute);
  }, [mute]);

  const play = useCallback((id: SoundId, opts?: PlayOptions) => audio.play(id, opts), []);
  const stop = useCallback((id: SoundId) => audio.stop(id), []);

  return { play, stop };
}

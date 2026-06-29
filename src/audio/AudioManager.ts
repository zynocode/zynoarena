/**
 * Centralized, singleton AudioManager.
 *
 * - Lazy AudioContext (mobile + autoplay safe)
 * - Preloads & caches every sound as an AudioBuffer (low latency, no dupes)
 * - Overlapping playback via short-lived AudioBufferSourceNodes
 * - Mute / volume / stop / dispose with proper memory cleanup
 *
 * Importable from both React (via useAudio) and Phaser (direct singleton).
 */

import type { IAudioManager, PlayOptions, SoundId } from './types';
import { ALL_SOUND_IDS, MASTER_VOLUME, SOUND_REGISTRY } from './audioConstants';

class AudioManager implements IAudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private readonly buffers = new Map<SoundId, AudioBuffer>();
  private readonly active = new Map<SoundId, Set<AudioBufferSourceNode>>();

  private muted = false;
  private volume = MASTER_VOLUME;
  private preloadPromise: Promise<void> | null = null;

  // ── Context lifecycle ────────────────────────────────────────────────────

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctor: typeof AudioContext =
        window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : this.volume;
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  /** Resume the context after a user gesture (browser autoplay policy). */
  resume(): void {
    const ctx = this.ensureContext();
    if (ctx && ctx.state === 'suspended') {
      void ctx.resume();
    }
  }

  // ── Preload ──────────────────────────────────────────────────────────────

  /** Decode the file asset(s) and render every procedural buffer once. Idempotent. */
  preload(): Promise<void> {
    if (this.preloadPromise) return this.preloadPromise;

    this.preloadPromise = (async () => {
      const ctx = this.ensureContext();
      if (!ctx) return;

      await Promise.all(
        ALL_SOUND_IDS.map(async (id) => {
          if (this.buffers.has(id)) return;
          const def = SOUND_REGISTRY[id];
          try {
            if (def.kind === 'file' && def.url) {
              const res = await fetch(def.url);
              const arr = await res.arrayBuffer();
              this.buffers.set(id, await ctx.decodeAudioData(arr));
            } else if (def.kind === 'synth' && def.render) {
              this.buffers.set(id, await def.render(ctx.sampleRate));
            }
          } catch (err) {
            // A single failed sound must never break the rest of the game.
            console.warn(`[audio] failed to preload "${id}"`, err);
          }
        }),
      );
    })();

    return this.preloadPromise;
  }

  // ── Playback ─────────────────────────────────────────────────────────────

  play(id: SoundId, opts: PlayOptions = {}): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    const buffer = this.buffers.get(id);
    const master = this.masterGain;
    if (!ctx || !buffer || !master) return;

    // Autoplay policy: resume on demand (covers the very first gesture).
    if (ctx.state === 'suspended') void ctx.resume();

    if (opts.interrupt) this.stop(id);

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = opts.rate ?? 1;

    const gain = ctx.createGain();
    const base = SOUND_REGISTRY[id].volume;
    gain.gain.value = base * (opts.volume ?? 1);

    src.connect(gain);
    gain.connect(master);

    // Track for stop()/overlap bookkeeping; auto-clean on end (no leaks).
    let set = this.active.get(id);
    if (!set) {
      set = new Set();
      this.active.set(id, set);
    }
    set.add(src);
    src.onended = () => {
      set!.delete(src);
      src.disconnect();
      gain.disconnect();
    };

    src.start();
  }

  stop(id: SoundId): void {
    const set = this.active.get(id);
    if (!set) return;
    set.forEach((src) => {
      try {
        src.onended = null;
        src.stop();
        src.disconnect();
      } catch {
        /* already stopped */
      }
    });
    set.clear();
  }

  stopAll(): void {
    this.active.forEach((_set, id) => this.stop(id));
  }

  // ── Mix controls ─────────────────────────────────────────────────────────

  setMute(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : this.volume, this.ctx.currentTime, 0.01);
    }
    if (muted) this.stopAll();
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.masterGain && this.ctx && !this.muted) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.01);
    }
  }

  // ── Teardown ─────────────────────────────────────────────────────────────

  dispose(): void {
    this.stopAll();
    this.buffers.clear();
    this.active.clear();
    this.masterGain?.disconnect();
    this.masterGain = null;
    if (this.ctx && this.ctx.state !== 'closed') void this.ctx.close();
    this.ctx = null;
    this.preloadPromise = null;
  }
}

/** Process-wide singleton. */
export const audio = new AudioManager();

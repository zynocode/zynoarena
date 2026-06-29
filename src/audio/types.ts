/**
 * Audio system type definitions.
 * Strongly-typed sound identifiers and play options for the AudioManager.
 */

/** Every sound the game can play. */
export type SoundId =
  | 'diceRoll'
  | 'tokenStep'
  | 'tokenKill'
  | 'tokenHome'
  | 'safeCell'
  | 'gameWin'
  | 'buttonClick'
  | 'popupOpen'
  | 'popupClose'
  | 'chessMove'
  | 'chessCapture'
  | 'chessCastle'
  | 'chessCheck'
  | 'chessCheckmate'
  | 'chessDraw'
  | 'chessPromotion'
  | 'chessIllegal';

/** How a sound's AudioBuffer is produced. */
export type SoundKind = 'file' | 'synth';

/** Registry entry describing one sound. */
export interface SoundDef {
  /** Source type: decoded from an asset file, or rendered procedurally. */
  kind: SoundKind;
  /** Base playback volume (0..1) applied on top of the master volume. */
  volume: number;
  /** Asset URL — required when kind === 'file'. */
  url?: string;
  /** Procedural renderer (rendered once at preload) — required when kind === 'synth'. */
  render?: (sampleRate: number) => Promise<AudioBuffer>;
}

/** Per-call playback options. */
export interface PlayOptions {
  /** Override the sound's registry volume for this call (0..1). */
  volume?: number;
  /** Playback rate multiplier (1 = normal, >1 faster/higher). */
  rate?: number;
  /** Stop any currently-playing instances of this sound before playing. */
  interrupt?: boolean;
}

/** Public AudioManager surface. */
export interface IAudioManager {
  preload(): Promise<void>;
  play(id: SoundId, opts?: PlayOptions): void;
  stop(id: SoundId): void;
  stopAll(): void;
  setMute(muted: boolean): void;
  setVolume(volume: number): void;
  resume(): void;
  dispose(): void;
}

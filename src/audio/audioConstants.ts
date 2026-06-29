/**
 * Audio registry + tunable constants.
 * Maps every SoundId to its source (recorded file or procedural renderer)
 * and default mix volume.
 */

import type { SoundDef, SoundId } from './types';
import diceRollUrl from '../assets/audio/dice-roll.ogg?url';
import {
  renderTokenStep,
  renderTokenKill,
  renderTokenHome,
  renderSafeCell,
  renderGameWin,
  renderButtonClick,
  renderPopupOpen,
  renderPopupClose,
  renderChessMove,
  renderChessCapture,
  renderChessCastle,
  renderChessCheck,
  renderChessCheckmate,
  renderChessDraw,
  renderChessPromotion,
  renderChessIllegal,
} from './synth';

/** Master output volume (0..1). */
export const MASTER_VOLUME = 0.85;

/** The full sound registry consumed by the AudioManager. */
export const SOUND_REGISTRY: Record<SoundId, SoundDef> = {
  diceRoll: { kind: 'file', url: diceRollUrl, volume: 0.9 },
  tokenStep: { kind: 'synth', volume: 0.55, render: renderTokenStep },
  tokenKill: { kind: 'synth', volume: 0.85, render: renderTokenKill },
  tokenHome: { kind: 'synth', volume: 0.8, render: renderTokenHome },
  safeCell: { kind: 'synth', volume: 0.6, render: renderSafeCell },
  gameWin: { kind: 'synth', volume: 0.9, render: renderGameWin },
  buttonClick: { kind: 'synth', volume: 0.5, render: renderButtonClick },
  popupOpen: { kind: 'synth', volume: 0.55, render: renderPopupOpen },
  popupClose: { kind: 'synth', volume: 0.55, render: renderPopupClose },
  chessMove: { kind: 'synth', volume: 0.65, render: renderChessMove },
  chessCapture: { kind: 'synth', volume: 0.7, render: renderChessCapture },
  chessCastle: { kind: 'synth', volume: 0.65, render: renderChessCastle },
  chessCheck: { kind: 'synth', volume: 0.7, render: renderChessCheck },
  chessCheckmate: { kind: 'synth', volume: 0.8, render: renderChessCheckmate },
  chessDraw: { kind: 'synth', volume: 0.65, render: renderChessDraw },
  chessPromotion: { kind: 'synth', volume: 0.7, render: renderChessPromotion },
  chessIllegal: { kind: 'synth', volume: 0.5, render: renderChessIllegal },
};

export const ALL_SOUND_IDS = Object.keys(SOUND_REGISTRY) as SoundId[];

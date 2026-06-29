import { useAudio } from '../audio/useAudio';

export const useChessSounds = () => {
  const { play } = useAudio();

  const playMoveSound = (flags: string = '') => {
    // chess.js flags:
    // 'n' - a non-capture
    // 'b' - a pawn push of two squares
    // 'a' - an en passant capture
    // 'c' - a standard capture
    // 'p' - a promotion
    // 'k' - kingside castling
    // 'q' - queenside castling
    if (flags.includes('k') || flags.includes('q')) {
      play('chessCastle');
    } else if (flags.includes('c') || flags.includes('a')) {
      play('chessCapture');
    } else if (flags.includes('p')) {
      play('chessPromotion');
    } else {
      play('chessMove');
    }
  };

  const playCheckSound = () => play('chessCheck');
  const playCheckmateSound = () => play('chessCheckmate');
  const playDrawSound = () => play('chessDraw');
  const playIllegalSound = () => play('chessIllegal');

  return {
    playMoveSound,
    playCheckSound,
    playCheckmateSound,
    playDrawSound,
    playIllegalSound,
  };
};

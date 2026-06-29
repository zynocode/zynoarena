import { describe, it, expect } from 'vitest';
import { Chess } from 'chess.js';
import { evaluateBoard } from './chessEvaluation';

describe('chessEvaluation', () => {
  it('should evaluate the initial board as equal (0)', () => {
    const chess = new Chess();
    const evaluation = evaluateBoard(chess);
    // Since PSTs for white and black are mirrored, the initial board should evaluate to exactly 0.
    expect(evaluation).toBe(0);
  });

  it('should evaluate a board where white has captured a pawn positively', () => {
    const chess = new Chess();
    // Simulate a position where white is up a pawn
    chess.load('rnbqkbnr/pppp1ppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    const evaluation = evaluateBoard(chess);
    
    // White should be favored (score > 0) since black is missing a pawn.
    expect(evaluation).toBeGreaterThan(0);
  });
});

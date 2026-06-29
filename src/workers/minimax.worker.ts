import { Chess } from 'chess.js';
import type { DifficultyLevel } from '../types/chess.types';

import { evaluateBoard } from '../utils/chessEvaluation';

interface NodeCounter { n: number; limit: number }

const minimax = (
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximising: boolean,
  nc: NodeCounter
): number => {
  nc.n++;
  if (nc.n > nc.limit) return evaluateBoard(chess); // abort at node budget
  if (depth === 0 || chess.isGameOver()) return evaluateBoard(chess);

  const moves = chess.moves({ verbose: false });

  if (isMaximising) {
    let best = -Infinity;
    for (const move of moves) {
      chess.move(move);
      best = Math.max(best, minimax(chess, depth - 1, alpha, beta, false, nc));
      chess.undo();
      alpha = Math.max(alpha, best);
      if (beta <= alpha || nc.n > nc.limit) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of moves) {
      chess.move(move);
      best = Math.min(best, minimax(chess, depth - 1, alpha, beta, true, nc));
      chess.undo();
      beta = Math.min(beta, best);
      if (beta <= alpha || nc.n > nc.limit) break;
    }
    return best;
  }
};

const DIFFICULTY_CONFIG: Record<DifficultyLevel, { depth: number; randomness: number; nodeLimit: number }> = {
  beginner: { depth: 1, randomness: 0.95, nodeLimit:    500 }, // ~random
  easy:     { depth: 1, randomness: 0.6,  nodeLimit:   1000 }, // mostly random
  medium:   { depth: 2, randomness: 0.1,  nodeLimit:   5000 }, // light strategy
  hard:     { depth: 2, randomness: 0,    nodeLimit:  10000 }, // full depth 2
  expert:   { depth: 3, randomness: 0,    nodeLimit:  25000 }, // full depth 3
  master:   { depth: 4, randomness: 0,    nodeLimit:  80000 }, // depth 4, slow but strong
};

self.onmessage = (e: MessageEvent) => {
  const { fen, difficulty } = e.data;
  if (!fen || !difficulty) return;

  try {
    const chess = new Chess(fen);
    if (chess.isGameOver()) {
      self.postMessage('');
      return;
    }

    const moves = chess.moves({ verbose: true });
    if (moves.length === 0) {
      self.postMessage('');
      return;
    }

    const { depth, randomness, nodeLimit } = DIFFICULTY_CONFIG[difficulty as DifficultyLevel];

    if (Math.random() < randomness) {
      const randMove = moves[Math.floor(Math.random() * moves.length)];
      self.postMessage(`${randMove.from}${randMove.to}${randMove.promotion ?? ''}`);
      return;
    }

    const nc: NodeCounter = { n: 0, limit: nodeLimit };

    let bestMove = moves[0];
    let bestScore = -Infinity;

    for (const move of moves) {
      chess.move(move);
      // Wait, in useStockfish.ts localBestMove loop, they just negated minimax score!
      const score = -minimax(chess, depth - 1, -Infinity, Infinity, false, nc);
      chess.undo();
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
      if (nc.n > nc.limit) break;
    }

    self.postMessage(`${bestMove.from}${bestMove.to}${bestMove.promotion ?? ''}`);
  } catch (err) {
    self.postMessage('');
  }
};

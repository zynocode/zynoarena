/**
 * Lightweight Opening Book for the AI.
 * Maps FEN strings to a list of weighted moves.
 * 
 * FENs are matched exactly (including castling/en passant rights),
 * so these represent the very first few moves of the game.
 */

interface BookMove {
  m: string; // e.g. "e2e4"
  w: number; // weight (relative probability)
}

const OPENING_BOOK: Record<string, BookMove[]> = {
  // Starting position
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1': [
    { m: 'e2e4', w: 50 }, // King's Pawn
    { m: 'd2d4', w: 35 }, // Queen's Pawn
    { m: 'c2c4', w: 10 }, // English
    { m: 'g1f3', w: 5  }, // Reti
  ],

  // 1. e4
  'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1': [
    { m: 'c7c5', w: 40 }, // Sicilian Defense
    { m: 'e7e5', w: 30 }, // Open Game
    { m: 'e7e6', w: 15 }, // French Defense
    { m: 'c7c6', w: 10 }, // Caro-Kann
    { m: 'd7d5', w: 5  }, // Scandinavian
  ],

  // 1. d4
  'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1': [
    { m: 'g8f6', w: 40 }, // Indian Defense
    { m: 'd7d5', w: 40 }, // Closed Game
    { m: 'e7e6', w: 10 }, // Horwitz Defense
    { m: 'f7f5', w: 10 }, // Dutch Defense
  ],

  // 1. c4 (English)
  'rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR b KQkq c3 0 1': [
    { m: 'e7e5', w: 40 }, // King's English
    { m: 'c7c5', w: 30 }, // Symmetrical
    { m: 'g8f6', w: 30 }, // Anglo-Indian
  ],

  // 1. e4 e5 (Open Game)
  'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2': [
    { m: 'g1f3', w: 70 }, // Knight development
    { m: 'f4', w: 10 },   // King's Gambit (wait, UCI format is f2f4)
  ],
};

// Fix UCI formats
OPENING_BOOK['rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2'] = [
  { m: 'g1f3', w: 80 }, 
  { m: 'f2f4', w: 10 }, 
  { m: 'f1c4', w: 10 }, 
];

// 1. e4 c5 (Sicilian)
OPENING_BOOK['rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2'] = [
  { m: 'g1f3', w: 70 }, // Open Sicilian
  { m: 'b1c3', w: 20 }, // Closed Sicilian
  { m: 'c2c3', w: 10 }, // Alapin
];

// 1. d4 d5
OPENING_BOOK['rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w KQkq d6 0 2'] = [
  { m: 'c2c4', w: 60 }, // Queen's Gambit
  { m: 'g1f3', w: 30 },
  { m: 'c1f4', w: 10 }, // London System
];

// 1. d4 g8f6 (Indian)
OPENING_BOOK['rnbqkb1r/pppppppp/5n2/8/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 1 2'] = [
  { m: 'c2c4', w: 70 }, // Main line
  { m: 'g1f3', w: 20 },
  { m: 'c1f4', w: 10 }, // London System
];

/**
 * Returns a book move for the given FEN, or null if out of book.
 * Moves are selected randomly based on their weights.
 */
export const getOpeningMove = (fen: string): string | null => {
  const options = OPENING_BOOK[fen];
  if (!options || options.length === 0) return null;

  const totalWeight = options.reduce((sum, opt) => sum + opt.w, 0);
  let random = Math.random() * totalWeight;

  for (const opt of options) {
    random -= opt.w;
    if (random <= 0) return opt.m;
  }

  // Fallback to the first option if math fails due to precision
  return options[0].m;
};

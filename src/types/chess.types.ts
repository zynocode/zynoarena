export type GameMode = 'local' | 'ai';

export type DifficultyLevel = 'beginner' | 'easy' | 'medium' | 'hard' | 'expert' | 'master';

export type PieceColor = 'w' | 'b';

export type PlayerType = 'human' | 'bot';

export interface ChessPlayer {
  name: string;
  color: PieceColor;
  type: PlayerType;
}

export interface CapturedPieces {
  w: {
    p: number;
    n: number;
    b: number;
    r: number;
    q: number;
  };
  b: {
    p: number;
    n: number;
    b: number;
    r: number;
    q: number;
  };
}

export interface ChessMove {
  from: string;
  to: string;
  san: string;
  color: PieceColor;
  piece: string;
  captured?: string;
  promotion?: string;
}

export interface GameStatus {
  isGameOver: boolean;
  isCheck: boolean;
  winner: PieceColor | null;
  reason: 'checkmate' | 'stalemate' | 'threefold' | 'fifty-moves' | 'insufficient' | 'draw' | null;
}

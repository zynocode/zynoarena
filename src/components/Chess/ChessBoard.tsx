import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import type { PieceColor, ChessMove } from '../../types/chess.types';

// ── react-chessboard v5 types ────────────────────────────────────────────────
interface SquareHandlerArgs {
  piece: { pieceType: string } | null;
  square: string;
}
interface PieceDropHandlerArgs {
  piece: { isSparePiece: boolean; position: string; pieceType: string };
  sourceSquare: string;
  targetSquare: string | null;
}
interface PieceHandlerArgs {
  isSparePiece: boolean;
  piece: { pieceType: string };
  square: string | null;
}

interface ChessBoardProps {
  fen: string;
  isFlipped: boolean;
  lastMove: ChessMove | null;
  turn: PieceColor;
  isCheck: boolean;
  playerColor: PieceColor;
  gameMode: 'local' | 'ai';
  disabled?: boolean;
  onPieceDrop: (sourceSquare: string, targetSquare: string, piece: string) => boolean;
  getPossibleMoves: (square: string) => any[];
  boardWidth: number;
  theme: { light: string; dark: string };
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  fen,
  isFlipped,
  lastMove,
  turn,
  isCheck,
  playerColor,
  gameMode,
  disabled = false,
  onPieceDrop,
  getPossibleMoves,
  boardWidth,
  theme,
}) => {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [optionSquares, setOptionSquares] = useState<string[]>([]);
  const [isShaking, setIsShaking] = useState(false);
  const shakeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear selection when FEN changes (a move happened)
  useEffect(() => {
    setSelectedSquare(null);
    setOptionSquares([]);
  }, [fen]);

  useEffect(() => {
    return () => { if (shakeTimeout.current) clearTimeout(shakeTimeout.current); };
  }, []);

  const triggerShake = useCallback(() => {
    setIsShaking(true);
    if (shakeTimeout.current) clearTimeout(shakeTimeout.current);
    shakeTimeout.current = setTimeout(() => setIsShaking(false), 450);
  }, []);

  // ── Find the King's square when in check ────────────────────────────────────
  const kingInCheckSquare = useMemo((): string | null => {
    if (!isCheck) return null;
    const boardPart = fen.split(' ')[0];
    const rows = boardPart.split('/');
    const targetKing = turn === 'w' ? 'K' : 'k';
    for (let r = 0; r < 8; r++) {
      let c = 0;
      for (const char of rows[r]) {
        if (/\d/.test(char)) {
          c += parseInt(char, 10);
        } else {
          if (char === targetKing) return `${String.fromCharCode(97 + c)}${8 - r}`;
          c++;
        }
      }
    }
    return null;
  }, [fen, isCheck, turn]);

  // ── Core click handler (same logic for square click + piece click) ──────────
  const handleSquareSelect = useCallback(
    (square: string) => {
      // Block interaction while reviewing history
      if (disabled) return;
      // Block interaction when it's AI's turn
      if (gameMode === 'ai' && turn !== playerColor) return;

      // Deselect on second click of same square
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setOptionSquares([]);
        return;
      }

      // Move to a highlighted destination
      if (selectedSquare && optionSquares.includes(square)) {
        const success = onPieceDrop(selectedSquare, square, '');
        if (!success) triggerShake();
        setSelectedSquare(null);
        setOptionSquares([]);
        return;
      }

      // Select a new piece
      const moves = getPossibleMoves(square);
      if (moves.length > 0) {
        setSelectedSquare(square);
        setOptionSquares(moves.map((m: any) => m.to));
      } else {
        if (selectedSquare) triggerShake(); // illegal destination
        setSelectedSquare(null);
        setOptionSquares([]);
      }
    },
    [disabled, selectedSquare, optionSquares, gameMode, turn, playerColor, getPossibleMoves, onPieceDrop, triggerShake]
  );

  // ── v5 event handlers (receive object args) ─────────────────────────────────
  const handleSquareClick = useCallback(
    ({ square }: SquareHandlerArgs) => {
      handleSquareSelect(square);
    },
    [handleSquareSelect]
  );

  const handlePieceClick = useCallback(
    ({ square }: PieceHandlerArgs) => {
      if (square) handleSquareSelect(square);
    },
    [handleSquareSelect]
  );

  const handlePieceDrop = useCallback(
    ({ sourceSquare, targetSquare }: PieceDropHandlerArgs): boolean => {
      if (disabled) return false;
      if (!targetSquare) return false;
      if (gameMode === 'ai' && turn !== playerColor) return false;
      const success = onPieceDrop(sourceSquare, targetSquare, '');
      if (!success) triggerShake();
      return success;
    },
    [disabled, gameMode, turn, playerColor, onPieceDrop, triggerShake]
  );

  // ── Square highlight styles ──────────────────────────────────────────────────
  const squareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};

    // 1. Last move from/to (yellow)
    if (lastMove) {
      styles[lastMove.from] = {
        background: 'rgba(234, 179, 8, 0.2)',
        boxShadow: 'inset 0 0 0 2px rgba(234, 179, 8, 0.4)',
      };
      styles[lastMove.to] = {
        background: 'rgba(234, 179, 8, 0.28)',
        boxShadow: 'inset 0 0 0 2px rgba(234, 179, 8, 0.55)',
      };
    }

    // 2. Selected piece (indigo ring)
    if (selectedSquare) {
      styles[selectedSquare] = {
        background: 'rgba(99, 102, 241, 0.3)',
        boxShadow: '0 0 0 3px #818cf8 inset',
      };
    }

    // 3. Legal move dots + capture rings
    if (selectedSquare && optionSquares.length > 0) {
      const moves = getPossibleMoves(selectedSquare);
      optionSquares.forEach((sq) => {
        const move = moves.find((m: any) => m.to === sq);
        // en passant flag 'e' = capture on empty square
        const isCapture = move && (move.captured || (move.flags && move.flags.includes('e')));
        if (isCapture) {
          styles[sq] = {
            background:
              'radial-gradient(circle, transparent 54%, rgba(239, 68, 68, 0.25) 56%, rgba(239, 68, 68, 0.6) 64%, transparent 70%)',
            cursor: 'pointer',
          };
        } else {
          styles[sq] = {
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.8) 24%, transparent 30%)',
            cursor: 'pointer',
          };
        }
      });
    }

    // 4. King in check (pulsing red — overrides everything)
    if (kingInCheckSquare) {
      styles[kingInCheckSquare] = {
        animation: 'chessCheckPulse 1.2s ease-in-out infinite alternate',
        background: 'rgba(239, 68, 68, 0.45)',
        boxShadow: 'inset 0 0 6px 3px rgba(239, 68, 68, 0.85)',
      };
    }

    return styles;
  }, [lastMove, selectedSquare, optionSquares, kingInCheckSquare, getPossibleMoves]);

  return (
    <div style={{ position: 'relative', width: boardWidth }}>
      <style>{`
        @keyframes chessCheckPulse {
          0%   { background-color: rgba(239,68,68,0.2); box-shadow: inset 0 0 3px 1px rgba(239,68,68,0.5); }
          100% { background-color: rgba(239,68,68,0.6); box-shadow: inset 0 0 10px 4px rgba(239,68,68,0.9); }
        }
        @keyframes chessShake {
          0%   { transform: translateX(0); }
          15%  { transform: translateX(-7px); }
          30%  { transform: translateX(7px); }
          45%  { transform: translateX(-5px); }
          60%  { transform: translateX(5px); }
          75%  { transform: translateX(-3px); }
          100% { transform: translateX(0); }
        }
        .chess-shake { animation: chessShake 0.4s ease-in-out; }
      `}</style>

      {/* v5 API: all config goes inside options={} */}
      <div className={isShaking ? 'chess-shake' : ''}>
        <Chessboard
          options={{
            position: fen,
            boardOrientation: isFlipped ? 'black' : 'white',
            squareStyles: squareStyles,
            darkSquareStyle: { backgroundColor: theme.dark },
            lightSquareStyle: { backgroundColor: theme.light },
            darkSquareNotationStyle: { color: theme.light },
            lightSquareNotationStyle: { color: theme.dark },
            animationDurationInMs: 180,
            onSquareClick: handleSquareClick,
            onPieceClick: handlePieceClick,
            onPieceDrop: handlePieceDrop,
            boardStyle: {
              width: `${boardWidth}px`,
              borderRadius: '16px',
              boxShadow: '0 20px 30px -8px rgba(0,0,0,0.5), 0 8px 12px -4px rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.08)',
              overflow: 'hidden',
            },
          }}
        />
      </div>
    </div>
  );
};

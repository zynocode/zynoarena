import React, { useMemo } from 'react';
import { Chess } from 'chess.js';
import { evaluateBoard } from '../../utils/chessEvaluation';

interface EvaluationBarProps {
  fen: string;
  isFlipped: boolean;
  height: number;
}

export const EvaluationBar: React.FC<EvaluationBarProps> = ({ fen, isFlipped, height }) => {
  const { score, whitePercentage, label } = useMemo(() => {
    try {
      const chess = new Chess(fen);
      // Static evaluation is extremely fast
      let currentScore = evaluateBoard(chess);
      
      // If checkmate, score is theoretically infinity. We cap it.
      if (chess.isGameOver()) {
        if (chess.isCheckmate()) {
          currentScore = chess.turn() === 'w' ? -10000 : 10000;
        } else {
          currentScore = 0; // Draw
        }
      }

      // Map score to a percentage (50% is equal). 
      // 800 centipawns (8 pawns) = 100% (capped at 95% to show a sliver).
      const rawPercent = 50 + (currentScore / 800) * 50;
      const whitePercentage = Math.max(5, Math.min(95, rawPercent));

      // Formatting label (e.g., +1.5 or -2.3)
      const absPawns = (Math.abs(currentScore) / 100).toFixed(1);
      const isWhiteWinning = currentScore >= 0;
      
      let label = isWhiteWinning ? `+${absPawns}` : `-${absPawns}`;
      if (Math.abs(currentScore) > 9000) {
        label = isWhiteWinning ? 'M' : '-M'; // Checkmate
      } else if (currentScore === 0) {
        label = '0.0';
      }

      return { score: currentScore, whitePercentage, label };
    } catch {
      return { score: 0, whitePercentage: 50, label: '0.0' };
    }
  }, [fen]);

  // If flipped, black is on bottom, so black bar fills from bottom up.
  // Standard bar: White is at bottom, Black is at top.
  const fillBottomColor = isFlipped ? '#333333' : '#ffffff';
  const fillTopColor = isFlipped ? '#ffffff' : '#333333';
  const fillBottomPercent = isFlipped ? (100 - whitePercentage) : whitePercentage;

  const isBottomWinning = isFlipped ? score < 0 : score > 0;
  
  return (
    <div style={{
      height: `${height}px`,
      width: '24px',
      borderRadius: '4px',
      backgroundColor: fillTopColor,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      overflow: 'hidden',
      position: 'relative',
      border: '1px solid rgba(255,255,255,0.1)',
      transition: 'height 0.3s ease',
    }}>
      <div style={{
        height: `${fillBottomPercent}%`,
        backgroundColor: fillBottomColor,
        width: '100%',
        transition: 'height 0.5s ease-in-out',
      }} />
      
      <div style={{
        position: 'absolute',
        bottom: isBottomWinning ? '4px' : 'auto',
        top: isBottomWinning ? 'auto' : '4px',
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: '9px',
        fontWeight: 700,
        color: isBottomWinning ? fillTopColor : fillBottomColor, // contrast
      }}>
        {label === '0.0' ? '=' : label}
      </div>
    </div>
  );
};

import React from 'react';
import type { GameStatus as GameStatusType } from '../../types/chess.types';

interface GameStatusProps {
  status: GameStatusType;
  onPlayAgain: () => void;
  onHome: () => void;
  timeOutLoser?: 'w' | 'b' | null;
}

const CONFETTI_COLORS = ['#ef4444', '#22c55e', '#eab308', '#3b82f6', '#a855f7', '#ec4899'];

const Confetti: React.FC = () => {
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 2}s`,
    duration: `${2.5 + Math.random() * 2}s`,
    size: `${8 + Math.random() * 10}px`,
    shape: Math.random() > 0.5 ? '50%' : '2px',
  }));

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      overflow: 'hidden',
      zIndex: 99,
    }}>
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            position: 'absolute',
            left: p.left,
            top: '-20px',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.shape,
            opacity: 0.85,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  );
};

export const GameStatus: React.FC<GameStatusProps> = ({
  status,
  onPlayAgain,
  onHome,
  timeOutLoser,
}) => {
  const { isGameOver, winner, reason } = status;

  if (!isGameOver && !timeOutLoser) return null;

  // Determine game-over message
  let title = 'Game Over';
  let subtitle = '';
  let showConfetti = false;

  if (timeOutLoser) {
    title = timeOutLoser === 'w' ? 'Black Wins!' : 'White Wins!';
    subtitle = 'Won on time limit (timeout)';
    showConfetti = true;
  } else if (reason === 'checkmate') {
    title = winner === 'w' ? 'White Wins!' : 'Black Wins!';
    subtitle = 'Checkmate!';
    showConfetti = true;
  } else {
    title = 'Draw!';
    if (reason === 'stalemate') {
      subtitle = 'Stalemate (No legal moves left)';
    } else if (reason === 'threefold') {
      subtitle = 'Threefold Repetition';
    } else if (reason === 'fifty-moves') {
      subtitle = 'Fifty-Move Rule Draw';
    } else if (reason === 'insufficient') {
      subtitle = 'Insufficient Material to Mate';
    } else {
      subtitle = 'Draw';
    }
  }

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 110,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '16px',
    }}>
      {showConfetti && <Confetti />}

      <div style={{
        background: 'rgba(30, 41, 59, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        padding: '32px',
        maxWidth: '380px',
        width: '90%',
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
      }}>
        {/* Decorative Medal / Trophy Icon */}
        <div style={{
          fontSize: '64px',
          lineHeight: 1,
          marginBottom: '16px',
          textShadow: '0 0 16px rgba(234, 179, 8, 0.3)',
        }}>
          {showConfetti ? '🏆' : '🤝'}
        </div>

        <h2 style={{
          margin: '0 0 8px 0',
          fontSize: '26px',
          fontWeight: 700,
          color: '#f8fafc',
          background: showConfetti ? 'linear-gradient(to right, #f59e0b, #fbbf24)' : '#f8fafc',
          WebkitBackgroundClip: showConfetti ? 'text' : 'none',
          WebkitTextFillColor: showConfetti ? 'transparent' : 'initial',
        }}>
          {title}
        </h2>

        <p style={{
          margin: '0 0 28px 0',
          fontSize: '14px',
          color: '#94a3b8',
          fontWeight: 500,
        }}>
          {subtitle}
        </p>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <button
            onClick={onPlayAgain}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(to right, #6366f1, #4f46e5)',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.4)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = '0 6px 12px -1px rgba(99, 102, 241, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(99, 102, 241, 0.4)';
            }}
          >
            Play Again
          </button>

          <button
            onClick={onHome}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.03)',
              color: '#e2e8f0',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
            }}
          >
            Lobby Menu
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useRef } from 'react';
import type { PieceColor } from '../../types/chess.types';

interface PromotionDialogProps {
  color: PieceColor;
  onSelect: (pieceType: string) => void;
  onClose: () => void;
}

const PROMOTION_PIECES: Record<PieceColor, Array<{ type: string; label: string; icon: string }>> = {
  w: [
    { type: 'q', label: 'Queen',  icon: '♕' },
    { type: 'r', label: 'Rook',   icon: '♖' },
    { type: 'n', label: 'Knight', icon: '♘' },
    { type: 'b', label: 'Bishop', icon: '♗' },
  ],
  b: [
    { type: 'q', label: 'Queen',  icon: '♛' },
    { type: 'r', label: 'Rook',   icon: '♜' },
    { type: 'n', label: 'Knight', icon: '♞' },
    { type: 'b', label: 'Bishop', icon: '♝' },
  ],
};

// #8 fix: role="dialog", aria-modal, autofocus Queen, Esc closes, focus trapped
export const PromotionDialog: React.FC<PromotionDialogProps> = ({ color, onSelect, onClose }) => {
  const choices  = PROMOTION_PIECES[color];
  const queenRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Autofocus the Queen button when the dialog mounts
  useEffect(() => {
    queenRef.current?.focus();
  }, []);

  // Esc = cancel move; focus-trap Tab inside dialog
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      // Focus trap — keep Tab cycling through the 4+1 buttons only
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled])')
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last  = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="presentation"
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Pawn promotion — choose a piece"
        style={{
          background: 'rgba(30, 41, 59, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '300px',
          width: '90%',
          textAlign: 'center',
          boxShadow: '0 20px 40px -8px rgba(0,0,0,0.6)',
        }}
      >
        <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
          Pawn Promotion
        </h3>
        <p style={{ margin: '0 0 18px 0', fontSize: '12px', color: '#64748b' }}>
          Choose a piece (Esc = cancel)
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '10px',
          marginBottom: '14px',
        }}>
          {choices.map((choice, idx) => (
            <button
              key={choice.type}
              ref={idx === 0 ? queenRef : undefined}
              onClick={() => onSelect(choice.type)}
              aria-label={`Promote to ${choice.label}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '14px 8px',
                background: idx === 0 ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${idx === 0 ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.background = 'rgba(99,102,241,0.2)';
                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.7)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.background = idx === 0 ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)';
                e.currentTarget.style.borderColor = idx === 0 ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)';
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(99,102,241,0.2)';
                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)';
                e.currentTarget.style.transform = 'scale(1.04)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = idx === 0 ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)';
                e.currentTarget.style.borderColor = idx === 0 ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <span style={{
                fontSize: '32px',
                color: color === 'w' ? '#f8fafc' : '#0f172a',
                lineHeight: 1,
                marginBottom: '4px',
                textShadow: color === 'w' ? '0 0 4px rgba(255,255,255,0.3)' : '0 0 4px rgba(0,0,0,0.3)',
              }}>
                {choice.icon}
              </span>
              <span style={{ fontSize: '10px', color: idx === 0 ? '#a5b4fc' : '#94a3b8', fontWeight: 600 }}>
                {choice.label}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          aria-label="Cancel promotion"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#475569',
            fontSize: '12px',
            cursor: 'pointer',
            padding: '4px 8px',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#94a3b8')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}
        >
          Cancel Move
        </button>
      </div>
    </div>
  );
};

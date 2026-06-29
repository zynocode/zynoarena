import React from 'react';

interface CapturedPiecesProps {
  captured: {
    p: number;
    n: number;
    b: number;
    r: number;
    q: number;
  };
  color: 'w' | 'b'; // Color of the pieces that were captured (lost)
}

const UNICODE_PIECES: Record<'w' | 'b', Record<string, string>> = {
  w: { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕' },
  b: { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛' },
};

export const CapturedPieces: React.FC<CapturedPiecesProps> = ({ captured, color }) => {
  const pieces = UNICODE_PIECES[color];

  const renderPieceGroup = (type: 'q' | 'r' | 'b' | 'n' | 'p') => {
    const count = captured[type];
    if (count <= 0) return null;

    return (
      <span key={type} className="chess-captured-group" style={{
        display: 'inline-flex',
        alignItems: 'center',
        marginRight: '8px',
        color: color === 'w' ? '#e2e8f0' : '#0f172a',
        textShadow: color === 'w' ? '0 0 2px rgba(255,255,255,0.5)' : '0 0 2px rgba(0,0,0,0.5)',
        fontSize: '18px',
        fontWeight: 'bold',
      }}>
        {Array.from({ length: count }).map((_, i) => (
          <span key={i} style={{ marginRight: '-4px' }}>{pieces[type]}</span>
        ))}
        {count > 1 && (
          <span style={{
            fontSize: '10px',
            marginLeft: '6px',
            padding: '1px 4px',
            borderRadius: '4px',
            background: 'rgba(255, 255, 255, 0.1)',
            color: '#94a3b8',
            fontFamily: 'monospace'
          }}>
            x{count}
          </span>
        )}
      </span>
    );
  };

  const hasAny = Object.values(captured).some((c) => c > 0);

  return (
    <div className="chess-captured-container" style={{
      display: 'flex',
      alignItems: 'center',
      minHeight: '28px',
      padding: '4px 10px',
      borderRadius: '8px',
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      opacity: hasAny ? 1 : 0.4,
      transition: 'opacity 0.2s ease-in-out',
    }}>
      {!hasAny ? (
        <span style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>No captures</span>
      ) : (
        <>
          {renderPieceGroup('q')}
          {renderPieceGroup('r')}
          {renderPieceGroup('b')}
          {renderPieceGroup('n')}
          {renderPieceGroup('p')}
        </>
      )}
    </div>
  );
};

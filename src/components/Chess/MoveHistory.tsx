import React, { useEffect, useRef } from 'react';
import type { ChessMove } from '../../types/chess.types';

interface MoveHistoryProps {
  history: ChessMove[];
  /** Ply index currently shown on the board (0-based), or null when live. */
  currentPly?: number | null;
  /** Jump the board to the position after the given ply index. */
  onSelectPly?: (ply: number) => void;
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({ history, currentPly = null, onSelectPly }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto scroll to bottom when moves are added
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [history]);

  // Group moves into pairs (White move + Black move)
  const pairs: Array<{ num: number; white: ChessMove; black?: ChessMove }> = [];
  for (let i = 0; i < history.length; i += 2) {
    pairs.push({
      num: Math.floor(i / 2) + 1,
      white: history[i],
      black: history[i + 1],
    });
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'rgba(15, 23, 42, 0.3)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '12px',
      padding: '16px',
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      <h3 style={{
        margin: '0 0 12px 0',
        fontSize: '14px',
        fontWeight: 600,
        color: '#f8fafc',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        paddingBottom: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span>Move History</span>
        <span style={{
          fontSize: '11px',
          color: '#64748b',
          fontWeight: 'normal',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '2px 8px',
          borderRadius: '20px',
        }}>
          {history.length} ply
        </span>
      </h3>

      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingRight: '4px',
        }}
        className="custom-scrollbar"
      >
        {pairs.length === 0 ? (
          <div style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            fontSize: '13px',
            fontStyle: 'italic',
          }}>
            No moves played yet
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {pairs.map((pair) => (
              <div
                key={pair.num}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  background: pair.num % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                  fontSize: '13px',
                }}
              >
                {/* Move Number */}
                <div style={{ width: '40px', color: '#475569', fontFamily: 'monospace', fontWeight: 600 }}>
                  {pair.num}.
                </div>

                {/* White Move */}
                <div style={{ flex: 1 }}>
                  <button
                    onClick={() => onSelectPly?.((pair.num - 1) * 2)}
                    style={plyBtn((pair.num - 1) * 2 === currentPly, '#e2e8f0')}
                  >
                    {pair.white.san}
                  </button>
                </div>

                {/* Black Move */}
                <div style={{ flex: 1 }}>
                  {pair.black ? (
                    <button
                      onClick={() => onSelectPly?.((pair.num - 1) * 2 + 1)}
                      style={plyBtn((pair.num - 1) * 2 + 1 === currentPly, '#94a3b8')}
                    >
                      {pair.black.san}
                    </button>
                  ) : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Ply button style ───────────────────────────────────────────────────────────
const plyBtn = (active: boolean, baseColor: string): React.CSSProperties => ({
  background: active ? 'rgba(99,102,241,0.25)' : 'transparent',
  border: active ? '1px solid rgba(99,102,241,0.6)' : '1px solid transparent',
  borderRadius: '5px',
  color: active ? '#a5b4fc' : baseColor,
  fontWeight: active ? 700 : 500,
  fontFamily: 'monospace',
  fontSize: '13px',
  padding: '2px 6px',
  cursor: 'pointer',
  transition: 'background 0.15s, color 0.15s',
  width: '100%',
  textAlign: 'left' as const,
});

import { useGameStore } from '../store/gameStore';
import type { PlayerColor } from '../store/gameStore';

interface DiceProps {
  onRoll?: () => void;
}

export default function Dice({ onRoll }: DiceProps = {}) {
  const { diceValue, gameStatus, players, activePlayerIndex, rollDice } = useGameStore();

  const handleRoll = onRoll ?? rollDice;

  const activePlayer = players[activePlayerIndex];
  const isHuman = activePlayer?.isHuman ?? false;
  const isRolling = gameStatus === 'ROLLING';
  const canRoll = gameStatus === 'WAITING_FOR_ROLL' && isHuman;

  const getColorHex = (color: PlayerColor) => {
    switch (color) {
      case 'red': return '#ef4444';
      case 'green': return '#22c55e';
      case 'yellow': return '#eab308';
      case 'blue': return '#3b82f6';
      default: return '#ffffff';
    }
  };

  const activeColorHex = activePlayer ? getColorHex(activePlayer.color) : '#fff';

  // Dots arrangement mapping for dice values 1 to 6
  // Grid coordinates (col, row) on a 3x3 layout
  const dotPositions: Record<number, number[][]> = {
    1: [[1, 1]],
    2: [[0, 0], [2, 2]],
    3: [[0, 0], [1, 1], [2, 2]],
    4: [[0, 0], [0, 2], [2, 0], [2, 2]],
    5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
    6: [[0, 0], [0, 1], [0, 2], [2, 0], [2, 1], [2, 2]]
  };

  const currentDots = dotPositions[diceValue] || [[1, 1]];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100%' }}>
      {/* 3D Glass Die Container */}
      <button
        onClick={() => canRoll && handleRoll()}
        disabled={!canRoll || isRolling}
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '18px',
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          border: `2.5px solid ${isRolling ? 'rgba(255,255,255,0.2)' : activeColorHex}`,
          cursor: canRoll ? 'pointer' : 'default',
          boxShadow: isRolling 
            ? '0 12px 32px rgba(0, 0, 0, 0.4), 0 0 25px rgba(255,255,255,0.15)' 
            : canRoll 
              ? `0 12px 24px rgba(0, 0, 0, 0.4), 0 0 20px ${activeColorHex}4d, inset 0 2px 4px rgba(255,255,255,0.1)` 
              : '0 8px 16px rgba(0,0,0,0.3)',
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'repeat(3, 1fr)',
          padding: '14px',
          gap: '5px',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          animation: isRolling ? 'dice-shake 0.5s infinite linear' : 'none',
          transform: canRoll ? 'scale(1.0) translateY(0)' : 'scale(0.95)',
          opacity: (canRoll || isRolling) ? 1.0 : 0.65
        }}
        className={`dice-btn ${canRoll ? 'can-roll' : ''}`}
      >
        {/* Inner light reflection overlay for 3D glass look */}
        <div style={{
          position: 'absolute',
          top: '3px',
          left: '3px',
          right: '3px',
          height: '45%',
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 100%)',
          borderRadius: '13px 13px 4px 4px',
          pointerEvents: 'none'
        }} />

        {/* Render dots */}
        {!isRolling && Array.from({ length: 9 }).map((_, idx) => {
          const row = Math.floor(idx / 3);
          const col = idx % 3;
          const hasDot = currentDots.some(([dCol, dRow]) => dCol === col && dRow === row);

          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {hasDot && (
                <div
                  style={{
                    width: '11px',
                    height: '11px',
                    borderRadius: '50%',
                    backgroundColor: activeColorHex,
                    boxShadow: `0 0 8px ${activeColorHex}, inset 0 2px 2px rgba(255,255,255,0.5)`,
                    border: '1px solid rgba(0,0,0,0.25)',
                    transition: 'all 0.2s ease'
                  }}
                />
              )}
            </div>
          );
        })}

        {/* Rolling indicator dots (animated) */}
        {isRolling && (
          <div
            style={{
              gridColumn: 'span 3',
              gridRow: 'span 3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: 800,
              color: '#94a3b8',
              fontFamily: 'Outfit, sans-serif',
              animation: 'dice-pulse 0.4s infinite alternate'
            }}
          >
            ?
          </div>
        )}
      </button>

      {/* Action Helper Label */}
      {canRoll && (
        <span 
          style={{ 
            fontSize: '11px', 
            color: activeColorHex, 
            fontWeight: 800, 
            textTransform: 'uppercase', 
            letterSpacing: '1.5px', 
            animation: 'pulse 1.5s infinite',
            textShadow: `0 0 8px ${activeColorHex}40`
          }}
        >
          Your Turn
        </span>
      )}

      {/* Custom Shake Animation CSS styles */}
      <style>{`
        @keyframes dice-shake {
          0% { transform: translate(2px, 1px) rotate(0deg); }
          10% { transform: translate(-1px, -2px) rotate(-3deg); }
          20% { transform: translate(-3px, 0px) rotate(1deg); }
          30% { transform: translate(0px, 2px) rotate(0deg); }
          40% { transform: translate(1px, -1px) rotate(3deg); }
          50% { transform: translate(-1px, 2px) rotate(-1deg); }
          60% { transform: translate(-3px, 1px) rotate(0deg); }
          70% { transform: translate(2px, 1px) rotate(-3deg); }
          80% { transform: translate(-1px, -1px) rotate(2deg); }
          90% { transform: translate(2px, 2px) rotate(0deg); }
          100% { transform: translate(1px, -2px) rotate(-1deg); }
        }
        @keyframes dice-pulse {
          from { opacity: 0.3; transform: scale(0.9); }
          to { opacity: 1.0; transform: scale(1.1); }
        }
        .dice-btn.can-roll:hover {
          transform: scale(1.08) translateY(-2px);
          filter: brightness(1.1);
        }
      `}</style>
    </div>
  );
}

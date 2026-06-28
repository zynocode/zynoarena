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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      {/* Dice Face Container */}
      <button
        onClick={() => canRoll && handleRoll()}
        disabled={!canRoll || isRolling}
        style={{
          width: '76px',
          height: '76px',
          borderRadius: '16px',
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          border: `2px solid ${isRolling ? '#94a3b8' : activeColorHex}`,
          cursor: canRoll ? 'pointer' : 'default',
          boxShadow: isRolling 
            ? '0 0 20px rgba(148, 163, 184, 0.4)' 
            : canRoll 
              ? `0 0 16px ${activeColorHex}4d` 
              : 'none',
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'repeat(3, 1fr)',
          padding: '12px',
          gap: '4px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          animation: isRolling ? 'dice-shake 0.5s infinite linear' : 'none',
          transform: canRoll ? 'scale(1.0)' : 'scale(0.95)',
          opacity: (canRoll || isRolling) ? 1.0 : 0.6
        }}
      >
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
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: activeColorHex,
                    boxShadow: `0 0 4px ${activeColorHex}`
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
              fontSize: '24px',
              fontWeight: 800,
              color: '#94a3b8'
            }}
          >
            ?
          </div>
        )}
      </button>

      {/* Action Helper Label */}
      {canRoll && (
        <span style={{ fontSize: '12px', color: '#60a5fa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', animation: 'pulse 1.5s infinite' }}>
          Roll Dice
        </span>
      )}

      {/* Custom Shake Animation CSS styles */}
      <style>{`
        @keyframes dice-shake {
          0% { transform: translate(2px, 1px) rotate(0deg); }
          10% { transform: translate(-1px, -2px) rotate(-2deg); }
          20% { transform: translate(-3px, 0px) rotate(1deg); }
          30% { transform: translate(0px, 2px) rotate(0deg); }
          40% { transform: translate(1px, -1px) rotate(1deg); }
          50% { transform: translate(-1px, 2px) rotate(-1deg); }
          60% { transform: translate(-3px, 1px) rotate(0deg); }
          70% { transform: translate(21x, 1px) rotate(-2deg); }
          80% { transform: translate(-1px, -1px) rotate(1deg); }
          90% { transform: translate(2px, 2px) rotate(0deg); }
          100% { transform: translate(1px, -2px) rotate(-1deg); }
        }
        @keyframes pulse {
          0% { opacity: 0.5; }
          50% { opacity: 1.0; }
          100% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

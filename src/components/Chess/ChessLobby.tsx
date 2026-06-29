import React from 'react';
import type { GameMode, DifficultyLevel, PieceColor } from '../../types/chess.types';

// Time control presets: { time in seconds, Fischer increment in seconds, display label }
export const TIME_CONTROLS = [
  { time: 60,   inc: 0,  label: '1m Bullet'  },
  { time: 180,  inc: 2,  label: '3+2 Blitz'  },
  { time: 300,  inc: 3,  label: '5+3 Blitz'  },
  { time: 600,  inc: 5,  label: '10+5 Rapid' },
  { time: 1800, inc: 0,  label: '30m Slow'   },
];

interface ChessLobbyProps {
  selectedMode: GameMode;
  setSelectedMode: (m: GameMode) => void;
  selectedDifficulty: DifficultyLevel;
  setSelectedDifficulty: (d: DifficultyLevel) => void;
  selectedColor: PieceColor;
  setSelectedColor: (c: PieceColor) => void;
  selectedTC: typeof TIME_CONTROLS[0];
  setSelectedTC: (tc: typeof TIME_CONTROLS[0]) => void;
  selectedAutoQueen: boolean;
  setSelectedAutoQueen: any;
  savedGame: any;
  botEngineName: string;
  formatDiff: (d: string) => string;
  handleResumeGame: () => void;
  handleStartGame: () => void;
  onBackToLobby: () => void;
}

export const ChessLobby: React.FC<ChessLobbyProps> = ({
  selectedMode, setSelectedMode,
  selectedDifficulty, setSelectedDifficulty,
  selectedColor, setSelectedColor,
  selectedTC, setSelectedTC,
  selectedAutoQueen, setSelectedAutoQueen,
  savedGame, botEngineName, formatDiff,
  handleResumeGame, handleStartGame, onBackToLobby,
}) => {
  return (
    <div style={{
      width: '100%',
      maxWidth: '520px',
      margin: '32px auto 0 auto',
      padding: '0 16px',
      fontFamily: "'Inter', sans-serif",
      color: '#f8fafc',
    }}>
      <div style={{
        background: 'rgba(30, 41, 59, 0.5)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '24px',
        padding: '32px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.55)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <span style={{ fontSize: '52px', lineHeight: 1 }}>♟️</span>
          <h2 style={{ margin: '8px 0 4px', fontSize: '24px', fontWeight: 700 }}>Chess Arena</h2>
          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
            Play local chess or challenge the Stockfish engine (with a built-in fallback bot).
          </p>
        </div>

        {/* Game Mode */}
        <div style={{ marginBottom: '22px' }}>
          <label style={labelStyle}>Select Game Mode</label>
          <div style={{ display: 'flex', gap: '12px' }}>
            {([['ai', '🤖 vs Computer'], ['local', '👥 Pass & Play']] as [GameMode, string][]).map(([mode, label]) => (
              <button key={mode} onClick={() => setSelectedMode(mode)} style={modeBtn(selectedMode === mode)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        {selectedMode === 'ai' && (
          <div style={{ marginBottom: '22px' }}>
            <label style={labelStyle}>Bot Difficulty</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {(['beginner','easy','medium','hard','expert','master'] as DifficultyLevel[]).map((d) => (
                <button key={d} onClick={() => setSelectedDifficulty(d)} style={diffBtn(selectedDifficulty === d)}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Color selection */}
        {selectedMode === 'ai' && (
          <div style={{ marginBottom: '22px' }}>
            <label style={labelStyle}>Your Side</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setSelectedColor('w')} style={colorBtn(selectedColor === 'w', '#e2e8f0')}>⚪ White</button>
              <button onClick={() => setSelectedColor('b')} style={colorBtn(selectedColor === 'b', '#38bdf8')}>⚫ Black</button>
            </div>
          </div>
        )}

        {/* Time Controls */}
        <div style={{ marginBottom: '30px' }}>
          <label style={labelStyle}>Time Control</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
            {TIME_CONTROLS.map((tc) => (
              <button
                key={tc.label}
                onClick={() => setSelectedTC(tc)}
                style={{
                  padding: '8px 4px',
                  borderRadius: '8px',
                  border: `1px solid ${selectedTC.label === tc.label ? '#10b981' : 'rgba(255,255,255,0.06)'}`,
                  background: selectedTC.label === tc.label ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.01)',
                  color: selectedTC.label === tc.label ? '#34d399' : '#94a3b8',
                  fontSize: '10px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  lineHeight: 1.3,
                }}
              >
                {tc.label}
              </button>
            ))}
          </div>
        </div>

        {/* Auto-promote toggle */}
        <div style={{ marginBottom: '22px' }}>
          <button
            onClick={() => setSelectedAutoQueen(!selectedAutoQueen)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: '10px',
              border: `1px solid ${selectedAutoQueen ? '#6366f1' : 'rgba(255,255,255,0.07)'}`,
              background: selectedAutoQueen ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.02)',
              color: '#cbd5e1',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <span>♕ Auto-promote to Queen</span>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              color: selectedAutoQueen ? '#818cf8' : '#64748b',
            }}>
              {selectedAutoQueen ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {savedGame && (
            <button onClick={handleResumeGame} style={resumeBtn}>
              ⏳ Resume Last Game
              <span style={{ display: 'block', fontSize: '11px', fontWeight: 500, opacity: 0.8, marginTop: '2px' }}>
                {savedGame.mode === 'ai'
                  ? `vs ${botEngineName} (${formatDiff(savedGame.difficulty)})`
                  : 'Pass & Play'}
              </span>
            </button>
          )}
          <button onClick={handleStartGame} style={startBtn}>Start Match ♟</button>
          <button
            onClick={onBackToLobby}
            style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '13px', cursor: 'pointer', padding: '4px' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#e2e8f0'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
          >
            ← Back to Arcade Launcher
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Shared inline style helpers ──────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 600,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '1px',
  marginBottom: '8px',
};

const modeBtn = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: '13px',
  borderRadius: '12px',
  border: `1px solid ${active ? '#6366f1' : 'rgba(255,255,255,0.07)'}`,
  background: active ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.02)',
  color: active ? '#818cf8' : '#cbd5e1',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  fontSize: '13px',
});

const diffBtn = (active: boolean): React.CSSProperties => ({
  padding: '8px',
  borderRadius: '8px',
  border: `1px solid ${active ? '#f59e0b' : 'rgba(255,255,255,0.05)'}`,
  background: active ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.01)',
  color: active ? '#fbbf24' : '#94a3b8',
  fontSize: '11px',
  fontWeight: 600,
  cursor: 'pointer',
  textTransform: 'capitalize',
  transition: 'all 0.2s ease',
});

const colorBtn = (active: boolean, activeColor: string): React.CSSProperties => ({
  flex: 1,
  padding: '10px',
  borderRadius: '8px',
  border: `1px solid ${active ? activeColor : 'rgba(255,255,255,0.05)'}`,
  background: active ? `${activeColor}18` : 'rgba(255,255,255,0.02)',
  color: activeColor,
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
});

const startBtn: React.CSSProperties = {
  width: '100%',
  padding: '14px',
  borderRadius: '12px',
  border: 'none',
  background: 'linear-gradient(to right, #6366f1, #4f46e5)',
  color: '#fff',
  fontSize: '15px',
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
  letterSpacing: '0.3px',
};

const resumeBtn: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  borderRadius: '12px',
  border: '1px solid rgba(16,185,129,0.5)',
  background: 'rgba(16,185,129,0.12)',
  color: '#34d399',
  fontSize: '14px',
  fontWeight: 700,
  cursor: 'pointer',
};

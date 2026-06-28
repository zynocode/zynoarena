import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { PlayerColor, AIDifficulty } from '../store/gameStore';
import { Play, Volume2, VolumeX, Sparkles } from 'lucide-react';

export default function MainMenu() {
  const { setupGame, mute, toggleMute } = useGameStore();
  const [showSetup, setShowSetup] = useState(false);
  const [numCPUs, setNumCPUs] = useState<number>(3);
  const [difficulty, setDifficulty] = useState<AIDifficulty>('medium');
  const [playerColor, setPlayerColor] = useState<PlayerColor>('red');

  const handleStartGame = () => {
    setupGame(numCPUs, difficulty, playerColor);
  };

  const colors: { name: PlayerColor; hex: string }[] = [
    { name: 'red', hex: '#ef4444' },
    { name: 'green', hex: '#22c55e' },
    { name: 'yellow', hex: '#eab308' },
    { name: 'blue', hex: '#3b82f6' },
  ];

  return (
    <div className="glass-panel interactive" style={{ padding: '40px', width: '420px', maxWidth: '90%' }}>
      {/* Sound Toggle */}
      <button
        onClick={toggleMute}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'none',
          border: 'none',
          color: '#64748b',
          cursor: 'pointer',
        }}
      >
        {mute ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>

      {!showSetup ? (
        <div style={{ textAlign: 'center' }}>
          {/* Logo Animation */}
          <div className="float-animation" style={{ marginBottom: '24px' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                width: '72px',
                height: '72px',
                borderRadius: '20px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
                marginBottom: '16px',
              }}
            >
              <Sparkles size={36} color="#fff" />
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 8px 0', background: 'linear-gradient(to right, #3b82f6, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Ludo Royale AI
            </h1>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
              Sleek offline matches vs smart CPU
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button className="btn-primary" onClick={() => setShowSetup(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Play size={18} fill="#fff" /> Start Match
            </button>
            <button className="btn-secondary" style={{ pointerEvents: 'none', opacity: 0.5 }}>
              Leaderboards (Online)
            </button>
          </div>
        </div>
      ) : (
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', marginTop: 0, marginBottom: '24px', textAlign: 'center' }}>
            Match Configuration
          </h2>

          {/* Color Selector */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', color: '#64748b', fontWeight: '600', marginBottom: '8px', letterSpacing: '0.5px' }}>
              Select Your Color
            </label>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
              {colors.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setPlayerColor(c.name)}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: c.hex,
                    border: playerColor === c.name ? '3px solid #fff' : '3px solid transparent',
                    cursor: 'pointer',
                    transform: playerColor === c.name ? 'scale(1.1)' : 'scale(1.0)',
                    transition: 'all 0.2s ease',
                    boxShadow: playerColor === c.name ? `0 0 16px ${c.hex}cc` : 'none',
                  }}
                />
              ))}
            </div>
          </div>

          {/* CPU Count Selector */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', color: '#64748b', fontWeight: '600', marginBottom: '8px', letterSpacing: '0.5px' }}>
              Match Mode
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[1, 2, 3].map((num) => (
                <button
                  key={num}
                  onClick={() => setNumCPUs(num)}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: numCPUs === num ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)',
                    backgroundColor: numCPUs === num ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                    color: numCPUs === num ? '#60a5fa' : '#f1f5f9',
                    cursor: 'pointer',
                    fontWeight: numCPUs === num ? '600' : '400',
                  }}
                >
                  {num + 1} Players
                </button>
              ))}
            </div>
          </div>

          {/* AI Difficulty Selector */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', color: '#64748b', fontWeight: '600', marginBottom: '8px', letterSpacing: '0.5px' }}>
              AI Difficulty
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {(['easy', 'medium', 'hard'] as AIDifficulty[]).map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: difficulty === level ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)',
                    backgroundColor: difficulty === level ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                    color: difficulty === level ? '#60a5fa' : '#f1f5f9',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    fontWeight: difficulty === level ? '600' : '400',
                  }}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-secondary" onClick={() => setShowSetup(false)} style={{ flex: 1 }}>
              Back
            </button>
            <button className="btn-primary" onClick={handleStartGame} style={{ flex: 2 }}>
              Roll To Play
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

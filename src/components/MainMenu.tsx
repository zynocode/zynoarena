import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { PlayerColor, AIDifficulty, ConfiguredPlayer } from '../store/gameStore';
import { Volume2, VolumeX, ArrowLeft, Cpu, Users, Dices, Check } from 'lucide-react';
import { useAudio } from '../audio/useAudio';

const colorDetails: Record<PlayerColor, { hex: string; label: string }> = {
  red: { hex: '#ef4444', label: 'Red' },
  green: { hex: '#22c55e', label: 'Green' },
  yellow: { hex: '#eab308', label: 'Yellow' },
  blue: { hex: '#3b82f6', label: 'Blue' },
};

const DIFFICULTY_COLOR: Record<AIDifficulty, string> = {
  easy: '#22c55e',
  medium: '#f59e0b',
  hard: '#ef4444',
};

// Pin display order (matches Ludo King: blue, red, green, yellow)
const PIN_ORDER: PlayerColor[] = ['blue', 'red', 'green', 'yellow'];
// Canonical seating order used when building the player list
const CANON_ORDER: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];
// Standard Ludo diagonals for 2-player matches
const DIAGONAL_OF: Record<PlayerColor, PlayerColor> = {
  red: 'yellow', yellow: 'red',
  green: 'blue', blue: 'green',
};

type Mode = 'cpu' | 'local';
type Screen = 'home' | 'setup';

export default function MainMenu({ onBackToArena }: { onBackToArena?: () => void }) {
  const { setupGame, mute, toggleMute } = useGameStore();
  const { play } = useAudio();

  const [screen, setScreen] = useState<Screen>('home');
  const [mode, setMode] = useState<Mode>('cpu');
  const [humanColor, setHumanColor] = useState<PlayerColor>('red');
  const [playerCount, setPlayerCount] = useState<2 | 4>(4);
  const [difficulty, setDifficulty] = useState<AIDifficulty>('medium');

  const openSetup = (m: Mode) => {
    setMode(m);
    setScreen('setup');
  };

  const handlePlay = () => {
    // Decide which colors are seated this match
    let colors: PlayerColor[];
    if (playerCount === 4) {
      colors = [...CANON_ORDER];
    } else {
      const dia = DIAGONAL_OF[humanColor];
      colors = CANON_ORDER.filter((c) => c === humanColor || c === dia);
    }

    const configuredPlayers: ConfiguredPlayer[] = colors.map((c) => {
      const label = colorDetails[c].label;
      const isHuman = mode === 'local' ? true : c === humanColor;
      return {
        name: isHuman ? `${label} Player` : `${label} CPU`,
        isHuman,
        color: c,
        difficulty: isHuman ? undefined : difficulty,
      };
    });

    setupGame(configuredPlayers);
  };

  return (
    <div
      className="lk-panel"
      style={{
        padding: '28px',
        width: screen === 'setup' ? '480px' : '440px',
        maxWidth: '95%',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Sound toggle */}
      <button onClick={() => { play('buttonClick'); toggleMute(); }} className="lk-sound" title={mute ? 'Unmute' : 'Mute'}>
        {mute ? <VolumeX size={17} /> : <Volume2 size={17} />}
      </button>

      {screen === 'home' ? (
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          {/* Logo */}
          <div className="float-animation" style={{ margin: '10px 0 18px', position: 'relative' }}>
            <div
              className="menu-logo-glow"
              style={{
                width: '104px', height: '104px', borderRadius: '26px',
                display: 'inline-grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '7px',
                background: '#0b1220', padding: '9px', position: 'relative', boxSizing: 'border-box',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div style={{ backgroundColor: '#ef4444', borderRadius: '8px' }} />
              <div style={{ backgroundColor: '#22c55e', borderRadius: '8px' }} />
              <div style={{ backgroundColor: '#3b82f6', borderRadius: '8px' }} />
              <div style={{ backgroundColor: '#eab308', borderRadius: '8px' }} />
              <div
                className="menu-logo-star-spin"
                style={{
                  position: 'absolute', top: '50%', left: '50%', width: '30px', height: '30px',
                  backgroundColor: '#0b1220', borderRadius: '50%', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', border: '1.5px solid rgba(251,191,36,0.5)',
                  fontSize: '15px', color: '#fbbf24', fontWeight: 'bold',
                }}
              >
                ★
              </div>
            </div>
          </div>

          <h1 className="lk-title" style={{ fontSize: '38px', margin: '0 0 24px 0' }}>
            Ludo Royale
          </h1>

          {/* Mode cards */}
          <div className="lk-modes">
            <button className="lk-mode-card" onClick={() => { play('popupOpen'); openSetup('cpu'); }}>
              <span className="lk-mode-icon"><Cpu size={28} /></span>
              <span className="lk-mode-label">Vs Computer</span>
            </button>
            <button className="lk-mode-card" onClick={() => { play('popupOpen'); openSetup('local'); }}>
              <span className="lk-mode-icon"><Users size={28} /></span>
              <span className="lk-mode-label">Pass &amp; Play</span>
            </button>
          </div>

          {onBackToArena && (
            <button className="lk-btn lk-btn--gray" onClick={() => { play('buttonClick'); onBackToArena(); }} style={{ marginTop: '18px', width: '100%' }}>
              <ArrowLeft size={16} /> Exit to Arena
            </button>
          )}
        </div>
      ) : (
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 className="lk-header" style={{ fontSize: '22px', margin: '2px 0 18px' }}>
            {mode === 'cpu' ? <Cpu size={20} /> : <Users size={20} />}
            {mode === 'cpu' ? 'Vs Computer' : 'Pass & Play'}
          </h2>

          {/* SELECT YOUR COLOR */}
          <div className="lk-section">
            <h3 className="lk-section-title">Select Your Color</h3>
            <div className="lk-pin-row">
              {PIN_ORDER.map((c) => {
                const selected = humanColor === c;
                return (
                  <button
                    key={c}
                    className={`lk-pin-wrap ${selected ? 'selected' : ''}`}
                    style={{ '--c': colorDetails[c].hex } as React.CSSProperties}
                    onClick={() => { play('buttonClick'); setHumanColor(c); }}
                  >
                    <span className="lk-pin"><i /></span>
                    <span className="lk-pin-check">{selected && <Check size={20} strokeWidth={3} />}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SELECT PLAYERS */}
          <div className="lk-section">
            <h3 className="lk-section-title">Select Players</h3>
            {([2, 4] as const).map((count) => {
              const selected = playerCount === count;
              return (
                <div
                  key={count}
                  className={`lk-radio ${selected ? 'selected' : ''}`}
                  onClick={() => { play('buttonClick'); setPlayerCount(count); }}
                >
                  <span className="lk-radio-dot">{selected && <Check size={18} strokeWidth={3.5} />}</span>
                  <span className="lk-radio-label">{count} Players</span>
                </div>
              );
            })}
          </div>

          {/* DIFFICULTY (CPU only) */}
          {mode === 'cpu' && (
            <div className="lk-section">
              <h3 className="lk-section-title">Bot Difficulty</h3>
              <div className="lk-seg" style={{ display: 'flex', width: '100%' }}>
                {(['easy', 'medium', 'hard'] as AIDifficulty[]).map((level) => (
                  <button
                    key={level}
                    className={`lk-seg-pill ${difficulty === level ? 'active' : ''}`}
                    style={{ '--pill': DIFFICULTY_COLOR[level], flex: 1, justifyContent: 'center' } as React.CSSProperties}
                    onClick={() => { play('buttonClick'); setDifficulty(level); }}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
            <button className="lk-btn lk-btn--gray" onClick={() => { play('popupClose'); setScreen('home'); }} style={{ flex: 1 }}>
              <ArrowLeft size={16} /> Back
            </button>
            <button className="lk-btn lk-btn--purple lk-btn--pulse" onClick={() => { play('buttonClick'); handlePlay(); }} style={{ flex: 2 }}>
              <Dices size={18} /> Play
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

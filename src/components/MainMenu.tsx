import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { PlayerColor, AIDifficulty, ConfiguredPlayer } from '../store/gameStore';
import { Play, Volume2, VolumeX, ArrowLeft, Users, ShieldAlert } from 'lucide-react';

interface SeatConfig {
  color: PlayerColor;
  joined: boolean;
  name: string;
  isHuman: boolean;
  difficulty: AIDifficulty;
}

const colorDetails = {
  red: { hex: '#ef4444', label: 'Red' },
  green: { hex: '#22c55e', label: 'Green' },
  yellow: { hex: '#eab308', label: 'Yellow' },
  blue: { hex: '#3b82f6', label: 'Blue' },
};

export default function MainMenu({ onBackToArena }: { onBackToArena?: () => void }) {
  const { setupGame, mute, toggleMute } = useGameStore();
  const [showSetup, setShowSetup] = useState(false);

  // Initialize 4 seats
  const [seats, setSeats] = useState<SeatConfig[]>([
    { color: 'red', joined: true, name: 'Red Player', isHuman: true, difficulty: 'medium' },
    { color: 'green', joined: true, name: 'Green CPU', isHuman: false, difficulty: 'medium' },
    { color: 'yellow', joined: false, name: 'Yellow CPU', isHuman: false, difficulty: 'medium' },
    { color: 'blue', joined: false, name: 'Blue CPU', isHuman: false, difficulty: 'medium' },
  ]);

  const handleSeatChange = (index: number, updates: Partial<SeatConfig>) => {
    setSeats((prev) =>
      prev.map((s, idx) => {
        if (idx !== index) return s;
        const nextState = { ...s, ...updates };
        // Sync default name if player type changes and name wasn't custom modified
        if (updates.isHuman !== undefined) {
          const typeLabel = updates.isHuman ? 'Player' : 'CPU';
          const colorLabel = colorDetails[s.color].label;
          nextState.name = `${colorLabel} ${typeLabel}`;
        }
        return nextState;
      })
    );
  };

  const activeSeats = seats.filter((s) => s.joined);
  const isValidSetup = activeSeats.length >= 2;

  const handleStartGame = () => {
    if (!isValidSetup) return;

    // Convert seat config to store configured players list
    const configuredPlayers: ConfiguredPlayer[] = activeSeats.map((s) => ({
      name: s.name.trim(),
      isHuman: s.isHuman,
      color: s.color,
      difficulty: s.isHuman ? undefined : s.difficulty,
    }));

    setupGame(configuredPlayers);
  };

  return (
    <div
      className="glass-panel interactive"
      style={{
        padding: '32px',
        width: showSetup ? '520px' : '400px',
        maxWidth: '95%',
        transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
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
          zIndex: 10,
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
                width: '72px',
                height: '72px',
                borderRadius: '16px',
                display: 'inline-grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '4px',
                background: '#fff',
                padding: '4px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                marginBottom: '16px',
                position: 'relative',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ backgroundColor: '#ef4444', borderRadius: '4px' }} />
              <div style={{ backgroundColor: '#22c55e', borderRadius: '4px' }} />
              <div style={{ backgroundColor: '#3b82f6', borderRadius: '4px' }} />
              <div style={{ backgroundColor: '#eab308', borderRadius: '4px' }} />
              
              {/* Center white junction with star */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '20px',
                  height: '20px',
                  backgroundColor: '#fff',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: '#eab308'
                }}
              >
                ★
              </div>
            </div>
            <h1
              style={{
                fontSize: '32px',
                fontWeight: '800',
                margin: '0 0 8px 0',
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              Ludo Royale
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
              Classic Ludo match with friends & bots
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              className="btn-primary"
              onClick={() => setShowSetup(true)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <Play size={18} fill="#fff" /> Setup Match
            </button>
            {onBackToArena && (
              <button
                className="btn-secondary"
                onClick={onBackToArena}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <ArrowLeft size={16} /> Exit to Arena
              </button>
            )}
          </div>
        </div>
      ) : (
        <div>
          <h2
            style={{
              fontSize: '22px',
              fontWeight: '700',
              marginTop: 0,
              marginBottom: '20px',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontFamily: 'Outfit, sans-serif',
            }}
          >
            <Users size={20} />
            Lobby Configuration
          </h2>

          {/* Seat setup rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            {seats.map((seat, index) => {
              const details = colorDetails[seat.color];
              return (
                <div
                  key={seat.color}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: seat.joined ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255,255,255,0.01)',
                    border: seat.joined ? `1px solid ${details.hex}33` : '1px solid rgba(255,255,255,0.05)',
                    opacity: seat.joined ? 1 : 0.6,
                    transition: 'all 0.3s ease',
                  }}
                >
                  {/* Top line of row: checkbox + color circle + join status + name input */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox"
                      checked={seat.joined}
                      onChange={(e) => handleSeatChange(index, { joined: e.target.checked })}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <span
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: details.hex,
                        display: 'inline-block',
                      }}
                    />
                    {seat.joined ? (
                      <input
                        type="text"
                        value={seat.name}
                        onChange={(e) => handleSeatChange(index, { name: e.target.value })}
                        maxLength={14}
                        style={{
                          background: 'rgba(0,0,0,0.2)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '6px',
                          color: '#fff',
                          padding: '4px 8px',
                          fontSize: '13px',
                          flexGrow: 1,
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: '13px', color: '#64748b', flexGrow: 1 }}>
                        Empty Seat ({details.label})
                      </span>
                    )}
                  </div>

                  {/* Settings toggles if seat is joined */}
                  {seat.joined && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '10px',
                        paddingTop: '8px',
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        gap: '12px',
                      }}
                    >
                      {/* Player Type Switch */}
                      <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '2px', borderRadius: '6px' }}>
                        <button
                          onClick={() => handleSeatChange(index, { isHuman: true })}
                          style={{
                            border: 'none',
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: 600,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            backgroundColor: seat.isHuman ? 'rgba(255,255,255,0.1)' : 'transparent',
                            color: seat.isHuman ? '#fff' : '#64748b',
                          }}
                        >
                          Human 👤
                        </button>
                        <button
                          onClick={() => handleSeatChange(index, { isHuman: false })}
                          style={{
                            border: 'none',
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: 600,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            backgroundColor: !seat.isHuman ? 'rgba(255,255,255,0.1)' : 'transparent',
                            color: !seat.isHuman ? '#fff' : '#64748b',
                          }}
                        >
                          Bot 🤖
                        </button>
                      </div>

                      {/* Difficulty Selection if Bot */}
                      {!seat.isHuman && (
                        <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '2px', borderRadius: '6px' }}>
                          {(['easy', 'medium', 'hard'] as AIDifficulty[]).map((level) => (
                            <button
                              key={level}
                              onClick={() => handleSeatChange(index, { difficulty: level })}
                              style={{
                                border: 'none',
                                padding: '4px 6px',
                                fontSize: '10px',
                                textTransform: 'capitalize',
                                fontWeight: 600,
                                borderRadius: '4px',
                                cursor: 'pointer',
                                backgroundColor: seat.difficulty === level ? details.hex : 'transparent',
                                color: seat.difficulty === level ? '#000' : '#64748b',
                              }}
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Validation Warning */}
          {!isValidSetup && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#f87171',
                fontSize: '12px',
                marginBottom: '16px',
                justifyContent: 'center',
                backgroundColor: 'rgba(239,68,68,0.1)',
                padding: '8px',
                borderRadius: '8px',
              }}
            >
              <ShieldAlert size={14} />
              At least 2 players must join to play.
            </div>
          )}

          {/* Setup Action Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-secondary" onClick={() => setShowSetup(false)} style={{ flex: 1 }}>
              Back
            </button>
            <button
              className="btn-primary"
              onClick={handleStartGame}
              disabled={!isValidSetup}
              style={{ flex: 2 }}
            >
              Roll To Play
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

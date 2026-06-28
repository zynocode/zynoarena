import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { PlayerColor, AIDifficulty, ConfiguredPlayer } from '../store/gameStore';
import { Play, Volume2, VolumeX, ArrowLeft, Users, ShieldAlert, Cpu, User } from 'lucide-react';

interface SeatConfig {
  color: PlayerColor;
  joined: boolean;
  name: string;
  isHuman: boolean;
  difficulty: AIDifficulty;
}

const colorDetails = {
  red: { hex: '#ef4444', label: 'Red', glow: 'rgba(239, 68, 68, 0.25)', bg: 'rgba(239, 68, 68, 0.08)' },
  green: { hex: '#22c55e', label: 'Green', glow: 'rgba(34, 197, 94, 0.25)', bg: 'rgba(34, 197, 94, 0.08)' },
  yellow: { hex: '#eab308', label: 'Yellow', glow: 'rgba(234, 179, 8, 0.25)', bg: 'rgba(234, 179, 8, 0.08)' },
  blue: { hex: '#3b82f6', label: 'Blue', glow: 'rgba(59, 130, 246, 0.25)', bg: 'rgba(59, 130, 246, 0.08)' },
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
      className="glass-panel interactive mm-panel"
      style={{
        padding: '36px',
        width: showSetup ? '560px' : '440px',
        maxWidth: '95%',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Absolute sound toggle */}
      <button
        onClick={toggleMute}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '50%',
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#94a3b8',
          cursor: 'pointer',
          zIndex: 10,
          transition: 'all 0.2s ease',
        }}
        className="sound-toggle-btn"
      >
        {mute ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>

      {!showSetup ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          {/* Logo Animation */}
          <div className="float-animation" style={{ marginBottom: '28px', position: 'relative' }}>
            <div
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '22px',
                display: 'inline-grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '6px',
                background: '#12121a',
                padding: '8px',
                boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6), 0 0 15px rgba(99, 102, 241, 0.2)',
                position: 'relative',
                boxSizing: 'border-box',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div style={{ backgroundColor: '#ef4444', borderRadius: '6px' }} />
              <div style={{ backgroundColor: '#22c55e', borderRadius: '6px' }} />
              <div style={{ backgroundColor: '#3b82f6', borderRadius: '6px' }} />
              <div style={{ backgroundColor: '#eab308', borderRadius: '6px' }} />
              
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '24px',
                  height: '24px',
                  backgroundColor: '#12121a',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 3px 6px rgba(0,0,0,0.3)',
                  border: '1.5px solid rgba(255,255,255,0.15)',
                  fontSize: '12px',
                  color: '#fbbf24',
                  fontWeight: 'bold',
                }}
              >
                ★
              </div>
            </div>
          </div>

          <h1
            style={{
              fontSize: '38px',
              fontWeight: '800',
              margin: '0 0 8px 0',
              background: 'linear-gradient(135deg, #fff 0%, #cbd5e1 50%, #64748b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontFamily: 'Outfit, sans-serif',
              letterSpacing: '-0.02em',
            }}
          >
            Ludo Royale
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 36px 0', maxWidth: '320px', lineHeight: 1.5 }}>
            A premium classic board match with intelligent bot behaviors.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
            <button
              className="ap-cta-primary"
              onClick={() => setShowSetup(true)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px' }}
            >
              <Play size={16} fill="#fff" /> Setup Match
            </button>
            {onBackToArena && (
              <button
                className="ap-cta-ghost"
                onClick={onBackToArena}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px' }}
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
              fontSize: '24px',
              fontWeight: '800',
              marginTop: 0,
              marginBottom: '24px',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              fontFamily: 'Outfit, sans-serif',
              color: '#fff',
              letterSpacing: '-0.01em',
            }}
          >
            <Users size={22} className="text-indigo-400" />
            Lobby Configuration
          </h2>

          {/* Seat setup rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
            {seats.map((seat, index) => {
              const details = colorDetails[seat.color];
              return (
                <div
                  key={seat.color}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '14px 18px',
                    borderRadius: '16px',
                    background: seat.joined ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255,255,255,0.005)',
                    border: seat.joined ? `1px solid ${details.hex}40` : '1px solid rgba(255,255,255,0.04)',
                    boxShadow: seat.joined ? `0 4px 20px ${details.glow}` : 'none',
                    opacity: seat.joined ? 1 : 0.5,
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  className="seat-row-card"
                >
                  {/* Top line of row: checkbox + color circle + join status + name input */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        checked={seat.joined}
                        onChange={(e) => handleSeatChange(index, { joined: e.target.checked })}
                        style={{
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer',
                          accentColor: details.hex,
                        }}
                      />
                    </div>
                    <span
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: details.hex,
                        boxShadow: `0 0 8px ${details.hex}`,
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
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '8px',
                          color: '#fff',
                          padding: '6px 12px',
                          fontSize: '13px',
                          fontFamily: 'Inter, sans-serif',
                          flexGrow: 1,
                          outline: 'none',
                          transition: 'border-color 0.2s',
                        }}
                        className="seat-name-input"
                      />
                    ) : (
                      <span style={{ fontSize: '13px', color: '#475569', fontWeight: 500, flexGrow: 1 }}>
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
                        marginTop: '12px',
                        paddingTop: '10px',
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        gap: '12px',
                      }}
                    >
                      {/* Player Type Switch */}
                      <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '3px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <button
                          onClick={() => handleSeatChange(index, { isHuman: true })}
                          style={{
                            border: 'none',
                            padding: '5px 12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            borderRadius: '6px',
                            cursor: 'pointer',
                            backgroundColor: seat.isHuman ? 'rgba(255,255,255,0.08)' : 'transparent',
                            color: seat.isHuman ? '#fff' : '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.2s',
                          }}
                        >
                          <User size={12} /> Human
                        </button>
                        <button
                          onClick={() => handleSeatChange(index, { isHuman: false })}
                          style={{
                            border: 'none',
                            padding: '5px 12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            borderRadius: '6px',
                            cursor: 'pointer',
                            backgroundColor: !seat.isHuman ? 'rgba(255,255,255,0.08)' : 'transparent',
                            color: !seat.isHuman ? '#fff' : '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.2s',
                          }}
                        >
                          <Cpu size={12} /> Bot
                        </button>
                      </div>

                      {/* Difficulty Selection if Bot */}
                      {!seat.isHuman && (
                        <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '3px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                          {(['easy', 'medium', 'hard'] as AIDifficulty[]).map((level) => {
                            const activeColors = {
                              easy: { bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.3)', text: '#4ade80' },
                              medium: { bg: 'rgba(234, 179, 8, 0.15)', border: 'rgba(234, 179, 8, 0.3)', text: '#fde047' },
                              hard: { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)', text: '#fca5a5' }
                            };
                            const isActive = seat.difficulty === level;
                            return (
                              <button
                                key={level}
                                onClick={() => handleSeatChange(index, { difficulty: level })}
                                style={{
                                  padding: '5px 10px',
                                  fontSize: '11px',
                                  textTransform: 'capitalize',
                                  fontWeight: 700,
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  backgroundColor: isActive ? activeColors[level].bg : 'transparent',
                                  border: isActive ? `1.5px solid ${activeColors[level].border}` : '1.5px solid transparent',
                                  color: isActive ? activeColors[level].text : '#475569',
                                  transition: 'all 0.2s',
                                }}
                              >
                                {level}
                              </button>
                            );
                          })}
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
                marginBottom: '20px',
                justifyContent: 'center',
                backgroundColor: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.15)',
                padding: '10px',
                borderRadius: '10px',
              }}
            >
              <ShieldAlert size={14} />
              At least 2 players must join to play.
            </div>
          )}

          {/* Setup Action Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="ap-cta-ghost" onClick={() => setShowSetup(false)} style={{ flex: 1, padding: '12px' }}>
              Back
            </button>
            <button
              className="ap-cta-primary"
              onClick={handleStartGame}
              disabled={!isValidSetup}
              style={{ flex: 2, padding: '12px', opacity: isValidSetup ? 1 : 0.6 }}
            >
              Roll To Play
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

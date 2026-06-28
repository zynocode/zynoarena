import { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from './store/gameStore';
import ArenaPortal from './components/ArenaPortal';
import MainMenu from './components/MainMenu';
import Dice from './components/Dice';
import { initLudoGame } from './game/LudoGame';
import { evaluateCPUMove } from './game/utils/ludoAI';
import { playSound } from './game/utils/audioEngine';
import { Volume2, VolumeX, RotateCcw, Play, Trophy, ArrowLeft } from 'lucide-react';

// ---- Confetti burst component -------------------------------------------
const CONFETTI_COLORS = ['#ef4444', '#22c55e', '#eab308', '#3b82f6', '#a855f7', '#ec4899'];

function Confetti() {
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 2}s`,
    duration: `${2.5 + Math.random() * 2}s`,
    size: `${8 + Math.random() * 10}px`,
    shape: Math.random() > 0.5 ? '50%' : '2px',
  }));

  return (
    <>
      {pieces.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            top: '-20px',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.shape,
            animationDuration: p.duration,
            animationDelay: p.delay,
          }}
        />
      ))}
    </>
  );
}

// =========================================================================
export default function App() {
  const [activeGame, setActiveGame] = useState<'ARENA' | 'LUDO'>('ARENA');

  const { 
    currentScreen, 
    setupGame,
    resetGame, 
    players, 
    activePlayerIndex, 
    gameStatus, 
    diceValue, 
    winner, 
    mute, 
    toggleMute, 
    validMoves, 
    rollDice, 
    selectToken,
    lastActionNotice,
    lastMatchConfig
  } = useGameStore();

  const gameRef = useRef<Phaser.Game | null>(null);
  const prevScreenRef = useRef(currentScreen);

  // Phaser Initialization
  useEffect(() => {
    if (activeGame === 'LUDO' && currentScreen === 'PLAYING' && !gameRef.current) {
      gameRef.current = initLudoGame('game-container');
    }
    if ((activeGame !== 'LUDO' || currentScreen !== 'PLAYING') && gameRef.current) {
      gameRef.current.destroy(true);
      gameRef.current = null;
    }
    return () => {
      if (gameRef.current) { gameRef.current.destroy(true); gameRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScreen, activeGame]);

  // Play win sound on game over transition
  useEffect(() => {
    if (activeGame === 'LUDO' && currentScreen === 'GAME_OVER' && prevScreenRef.current !== 'GAME_OVER') {
      playSound('win', mute);
    }
    prevScreenRef.current = currentScreen;
  }, [currentScreen, activeGame, mute]);

  // Wrapped rollDice with sound
  const handleRollDice = useCallback(() => {
    playSound('roll', mute);
    rollDice();
  }, [rollDice, mute]);

  // CPU Player AI Loop
  useEffect(() => {
    if (activeGame !== 'LUDO' || currentScreen !== 'PLAYING') return;
    const activePlayer = players[activePlayerIndex];
    if (!activePlayer || activePlayer.isHuman) return;

    let timeoutId: number;

    if (gameStatus === 'WAITING_FOR_ROLL') {
      timeoutId = window.setTimeout(() => {
        playSound('roll', mute);
        rollDice();
      }, 1000);
    } else if (gameStatus === 'WAITING_FOR_MOVE') {
      timeoutId = window.setTimeout(() => {
        if (validMoves.length > 0) {
          const chosenTokenIdx = evaluateCPUMove(
            players, activePlayerIndex, validMoves, diceValue,
            activePlayer.difficulty || 'medium'
          );
          if (chosenTokenIdx !== -1) selectToken(chosenTokenIdx);
        }
      }, 1200);
    }

    return () => { if (timeoutId) window.clearTimeout(timeoutId); };
  }, [currentScreen, activeGame, activePlayerIndex, gameStatus, validMoves, players, rollDice, selectToken, diceValue, mute]);

  // Human Auto-Move hook: automatically select token if only 1 is playable
  useEffect(() => {
    if (activeGame !== 'LUDO' || currentScreen !== 'PLAYING') return;
    const activePlayer = players[activePlayerIndex];
    if (!activePlayer || !activePlayer.isHuman) return;

    if (gameStatus === 'WAITING_FOR_MOVE' && validMoves.length === 1) {
      const timeoutId = window.setTimeout(() => {
        selectToken(validMoves[0]);
      }, 800); // 800ms delay so human can see what was rolled
      return () => window.clearTimeout(timeoutId);
    }
  }, [currentScreen, activeGame, activePlayerIndex, gameStatus, validMoves, selectToken, players]);

  const activePlayer = players[activePlayerIndex];

  // Scoreboard: sort players by tokens home (desc)
  const scoreboard = [...players].sort((a, b) => {
    const aHome = a.tokens.filter(t => t === 56).length;
    const bHome = b.tokens.filter(t => t === 56).length;
    return bHome - aHome;
  });

  const colorStyle = (color: string) => ({
    red: { bg: 'rgba(239,68,68,0.15)', border: '#ef4444', text: '#fca5a5' },
    green: { bg: 'rgba(34,197,94,0.15)', border: '#22c55e', text: '#86efac' },
    yellow: { bg: 'rgba(234,179,8,0.15)', border: '#eab308', text: '#fde047' },
    blue: { bg: 'rgba(59,130,246,0.15)', border: '#3b82f6', text: '#93c5fd' },
  }[color] ?? { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', text: '#f1f5f9' });

  // Navigation handlers
  const handleBackToArena = () => {
    resetGame();
    setActiveGame('ARENA');
  };

  const renderPlayerProfile = (color: 'red' | 'green' | 'yellow' | 'blue', position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right') => {
    const p = players.find(player => player.color === color);
    if (!p) return null;

    const cs = colorStyle(color);
    const home = p.tokens.filter(t => t === 56).length;
    const isActive = players[activePlayerIndex]?.id === p.id;

    // Position styles
    const posStyles: Record<string, React.CSSProperties> = {
      'top-left': { position: 'absolute', top: '-75px', left: '-10px', display: 'flex', alignItems: 'center', gap: '8px' },
      'top-right': { position: 'absolute', top: '-75px', right: '-10px', display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', gap: '8px' },
      'bottom-left': { position: 'absolute', bottom: '-75px', left: '-10px', display: 'flex', alignItems: 'center', gap: '8px' },
      'bottom-right': { position: 'absolute', bottom: '-75px', right: '-10px', display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', gap: '8px' },
    };

    return (
      <div style={posStyles[position]} className={`player-profile-overlay ${isActive ? 'active' : ''}`}>
        {/* Active turn indicator: dice */}
        {isActive && (
          <div style={{
            position: 'absolute',
            top: position.startsWith('top') ? '55px' : '-85px',
            left: position.endsWith('left') ? '0' : 'auto',
            right: position.endsWith('right') ? '0' : 'auto',
            zIndex: 100
          }}>
            <Dice onRoll={handleRollDice} />
          </div>
        )}

        {/* Avatar Circle */}
        <div
          className={`player-avatar-circle ${isActive ? 'active' : ''}`}
          style={{
            '--player-color': cs.border,
            '--player-glow': cs.bg,
          } as React.CSSProperties}
        >
          <span className="player-avatar-icon">
            {p.isHuman ? '👤' : '🤖'}
          </span>
        </div>

        {/* Info Box */}
        <div
          className={`player-details-card ${isActive ? 'active' : ''}`}
          style={{
            '--player-color': cs.border,
            '--player-glow': cs.bg,
          } as React.CSSProperties}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className={`player-name-text ${isActive ? 'active' : ''}`}>{p.name}</span>
            {!p.isHuman && p.difficulty && (
              <span style={{ fontSize: '8px', fontWeight: 800, padding: '1px 3px', borderRadius: '3px', backgroundColor: 'rgba(255,255,255,0.08)', color: cs.text }}>
                {p.difficulty.substring(0, 3).toUpperCase()}
              </span>
            )}
          </div>

          {/* 4 progress dots */}
          <div style={{ display: 'flex', gap: '3px', marginTop: '2px' }}>
            {Array.from({ length: 4 }).map((_, idx) => {
              const isHome = idx < home;
              return (
                <div
                  key={idx}
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: isHome ? cs.border : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${isHome ? cs.border : 'rgba(255,255,255,0.1)'}`,
                    boxShadow: isHome ? `0 0 5px ${cs.border}` : 'none',
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

      {/* ARENA PORTAL LANDING PAGE */}
      {activeGame === 'ARENA' && (
        <ArenaPortal onSelectGame={(gameId) => {
          if (gameId === 'ludo') {
            setActiveGame('LUDO');
          }
        }} />
      )}

      {/* LUDO ROYALE MODULE */}
      {activeGame === 'LUDO' && (
        <div className={`ludo-module-container ${currentScreen === 'PLAYING' ? 'playing-full-bleed' : ''}`}>
          {/* MENU / SETUP */}
          {(currentScreen === 'MENU' || currentScreen === 'SETUP') && (
            <MainMenu onBackToArena={handleBackToArena} />
          )}

          {/* PLAYING */}
          {currentScreen === 'PLAYING' && (
            <div className="ludo-game-container">
              
              {/* Floating Pill HUD Bar */}
              <div className="glass-panel game-hud" style={{
                position: 'fixed',
                top: '20px',
                zIndex: 200,
                width: 'auto',
                minWidth: '280px',
                padding: '8px 18px',
                borderRadius: '100px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '24px',
                border: '1px solid rgba(255,255,255,0.08)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    display: 'inline-block',
                    width: '10px', height: '10px', borderRadius: '50%',
                    backgroundColor: colorStyle(activePlayer?.color ?? 'blue').border,
                    boxShadow: `0 0 10px ${colorStyle(activePlayer?.color ?? 'blue').border}`,
                    animation: 'pulse 1.2s infinite'
                  }} />
                  <span style={{ fontWeight: 800, fontSize: '13px', color: '#fff', letterSpacing: '-0.2px' }}>
                    {activePlayer?.name}'s Turn
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button onClick={toggleMute} title={mute ? 'Unmute' : 'Mute'}
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                    {mute ? <VolumeX size={13} /> : <Volume2 size={13} />}
                  </button>
                  <button onClick={handleBackToArena} title="Exit to Arena"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '100px', padding: '4px 12px', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, transition: 'all 0.2s' }}>
                    <ArrowLeft size={12} /> Exit
                  </button>
                </div>
              </div>

              {/* Board Wrapper with Corner Overlays */}
              <div className="ludo-board-wrapper">
                
                {/* Corner Player Overlays */}
                {renderPlayerProfile('red', 'top-left')}
                {renderPlayerProfile('green', 'top-right')}
                {renderPlayerProfile('blue', 'bottom-left')}
                {renderPlayerProfile('yellow', 'bottom-right')}

                {/* Phaser Canvas */}
                <div id="game-container" className="game-canvas-wrap" />

                {/* Event Banner Overlay (Centered on Ludo Board) */}
                {lastActionNotice !== 'NONE' && (
                  <div className="glass-panel" style={{
                    position: 'absolute',
                    padding: '12px 24px',
                    borderRadius: '16px',
                    zIndex: 150,
                    fontSize: '15px',
                    fontWeight: 800,
                    border: `1.5px solid ${lastActionNotice === 'SIX_EXTRA' ? '#22c55e' : '#ef4444'}`,
                    backgroundColor: 'rgba(2,6,23,0.92)',
                    color: lastActionNotice === 'SIX_EXTRA' ? '#86efac' : lastActionNotice === 'THREE_SIXES' ? '#fca5a5' : '#fcd34d',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
                    animation: 'bannerIn 0.3s ease forwards',
                    pointerEvents: 'none',
                    textAlign: 'center',
                    maxWidth: '85%'
                  }}>
                    {lastActionNotice === 'CAPTURE'      && `⚔️  ${activePlayer?.name} Captured an Opponent!`}
                    {lastActionNotice === 'SIX_EXTRA'    && `🎲  Extra Roll Granted!`}
                    {lastActionNotice === 'THREE_SIXES'  && `⚠️  Three 6s! Turn Voided.`}
                    {lastActionNotice === 'NO_MOVES'     && `💤  No Valid Moves — Passing Turn.`}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* GAME OVER */}
          {currentScreen === 'GAME_OVER' && (
            <>
              <Confetti />
              <div className="glass-panel" style={{ padding: '36px', width: 'clamp(300px, 90vw, 440px)', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)', position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>🏆</div>
                <h2 style={{ color: '#fbbf24', fontSize: '28px', fontWeight: 800, margin: '0 0 4px 0', fontFamily: 'Outfit, sans-serif' }}>
                  Victory!
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '15px', margin: '0 0 28px 0' }}>
                  <strong style={{ color: '#fff' }}>{winner?.name}</strong> has conquered the board!
                </p>

                {/* Scoreboard */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
                  {scoreboard.map((p, rank) => {
                    const cs = colorStyle(p.color);
                    const home = p.tokens.filter(t => t === 56).length;
                    const medals = ['🥇', '🥈', '🥉', '4️⃣'];
                    return (
                      <div key={p.id} style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '10px 14px', borderRadius: '10px',
                        background: rank === 0 ? 'rgba(251,191,36,0.1)' : cs.bg,
                        border: `1px solid ${rank === 0 ? '#fbbf24' : cs.border}`,
                      }}>
                        <span style={{ fontSize: '18px' }}>{medals[rank]}</span>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: cs.border, flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: '13px', fontWeight: 600, color: rank === 0 ? '#fbbf24' : cs.text, textAlign: 'left' }}>{p.name}</span>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                          <Trophy size={11} style={{ marginRight: '3px', verticalAlign: 'middle' }} />
                          {home} / 4
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  {lastMatchConfig && lastMatchConfig.length > 0 && (
                    <button className="btn-primary" onClick={() => setupGame(lastMatchConfig)} style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                      <Play size={16} /> Play Again
                    </button>
                  )}
                  <button className="btn-secondary" onClick={handleBackToArena} style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                    <RotateCcw size={16} /> Arena
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

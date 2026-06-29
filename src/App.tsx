import { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from './store/gameStore';
import ArenaPortal from './components/ArenaPortal';
import MainMenu from './components/MainMenu';
import Dice from './components/Dice';
import { initLudoGame } from './game/LudoGame';
import { evaluateCPUMove } from './game/utils/ludoAI';
import { useAudio } from './audio/useAudio';
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
  const { play } = useAudio();

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
    lastMatchConfig,
    
    // Timer and Autoplay Hook mappings
    isAutoPlay,
    turnTimeLeft,
    resumeControl,
    tickTimer
  } = useGameStore();

  const gameRef = useRef<Phaser.Game | null>(null);

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

  // Play popup open sound on game over transition
  useEffect(() => {
    if (activeGame === 'LUDO' && currentScreen === 'GAME_OVER') {
      play('popupOpen');
    }
  }, [currentScreen, activeGame, play]);

  // Turn Timer ticks
  useEffect(() => {
    if (activeGame !== 'LUDO' || currentScreen !== 'PLAYING' || gameStatus === 'GAME_OVER') return;
    
    const intervalId = window.setInterval(() => {
      tickTimer();
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [activeGame, currentScreen, gameStatus, tickTimer]);

  // Wrapped rollDice with sound
  const handleRollDice = useCallback(() => {
    play('diceRoll');
    rollDice();
  }, [rollDice, play]);

  // Bot & Autoplay Player AI Loop
  useEffect(() => {
    if (activeGame !== 'LUDO' || currentScreen !== 'PLAYING') return;
    const activePlayer = players[activePlayerIndex];
    if (!activePlayer) return;

    const isBotOrAutoplay = !activePlayer.isHuman || isAutoPlay[activePlayerIndex];
    if (!isBotOrAutoplay) return;

    let timeoutId: number;

    if (gameStatus === 'WAITING_FOR_ROLL') {
      timeoutId = window.setTimeout(() => {
        play('diceRoll');
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
  }, [currentScreen, activeGame, activePlayerIndex, gameStatus, validMoves, players, rollDice, selectToken, diceValue, play, isAutoPlay]);

  // Human Auto-Move hook: automatically select token if only 1 is playable
  useEffect(() => {
    if (activeGame !== 'LUDO' || currentScreen !== 'PLAYING') return;
    const activePlayer = players[activePlayerIndex];
    if (!activePlayer || !activePlayer.isHuman || isAutoPlay[activePlayerIndex]) return;

    if (gameStatus === 'WAITING_FOR_MOVE' && validMoves.length === 1) {
      const timeoutId = window.setTimeout(() => {
        selectToken(validMoves[0]);
      }, 800); // 800ms delay so human can see what was rolled
      return () => window.clearTimeout(timeoutId);
    }
  }, [currentScreen, activeGame, activePlayerIndex, gameStatus, validMoves, selectToken, players, isAutoPlay]);

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
    play('buttonClick');
    resetGame();
    setActiveGame('ARENA');
  };

  // ─── Corner Dice Slot Renderer ───────────────────────────────────────────
  const renderCornerSlot = (pos: 'tl' | 'tr' | 'bl' | 'br') => {
    const humanPlayer = players.find(p => p.isHuman);
    const isRotated = humanPlayer && (humanPlayer.color === 'red' || humanPlayer.color === 'green');

    // Map screen positions to color bases based on board rotation
    const posToColor = isRotated
      ? { tl: 'yellow', tr: 'blue', bl: 'green', br: 'red' }
      : { tl: 'red', tr: 'green', bl: 'blue', br: 'yellow' };

    const color = posToColor[pos];
    const player = players.find(p => p.color === color);

    if (!player) return null;

    const isAct = activePlayer?.id === player.id;
    const cs = colorStyle(player.color);
    const home = player.tokens.filter(t => t === 56).length;

    return (
      <div 
        className={`corner-dice-slot corner-dice-slot-${pos}`}
        style={{ '--player-color': cs.border, '--player-color-glow': `${cs.border}33` } as React.CSSProperties}
      >
        <div className={`corner-dice-card ${isAct ? 'active' : ''}`}>
          <div className="corner-dice-profile">
            <div className="corner-dice-name" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', width: '100%' }}>
              <span>{player.name.replace(/^(red|green|yellow|blue)\s+/i, '')}</span>
              {isAct && isAutoPlay[player.id] && player.isHuman && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    play('buttonClick');
                    resumeControl(player.id);
                  }}
                  style={{
                    background: '#a855f7',
                    color: '#fff',
                    fontSize: '9px',
                    fontWeight: 800,
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '4px',
                    padding: '2px 6px',
                    cursor: 'pointer',
                    fontFamily: 'Outfit, sans-serif',
                    textTransform: 'uppercase',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  }}
                >
                  Resume
                </button>
              )}
            </div>
            <div className="corner-dice-status">
              {!player.isHuman && <span className="corner-dice-badge">BOT</span>}
              {player.isHuman && isAutoPlay[player.id] && (
                <span className="corner-dice-badge" style={{ backgroundColor: '#ef4444', animation: 'pulse 1.2s infinite' }}>AUTO</span>
              )}
              {isAct && gameStatus !== 'GAME_OVER' && (
                <span style={{ color: turnTimeLeft <= 4 ? '#f87171' : '#4ade80', fontWeight: 700, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  ⏱️ {turnTimeLeft}s
                </span>
              )}
              <span>🏁 {home}/4</span>
            </div>
          </div>
          <div className="corner-dice-slot-box">
            {isAct && gameStatus !== 'GAME_OVER' && (
              <Dice onRoll={handleRollDice} />
            )}
          </div>
        </div>
      </div>
    );
  };

  // ─── Playing Screen ───────────────────────────────────────────────────────


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

      {/* LUDO GAME MODULE */}
      {activeGame === 'LUDO' && (
        <div className={`ludo-module-container ${currentScreen === 'PLAYING' ? 'playing-full-bleed' : ''}`}>
          {/* MENU / SETUP */}
          {(currentScreen === 'MENU' || currentScreen === 'SETUP') && (
            <MainMenu onBackToArena={handleBackToArena} />
          )}

          {/* PLAYING */}
          {currentScreen === 'PLAYING' && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', width: '100%', height: '100vh',
              padding: '0', gap: '0', position: 'relative',
            }}>

              {/* ── Top Header Bar ── */}
              <div style={{
                width: '100%',
                height: '52px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 20px',
                background: 'rgba(10, 18, 35, 0.65)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(16px)',
                zIndex: 300,
                boxSizing: 'border-box',
                flexShrink: 0
              }}>
                {/* Active Player Turn Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '7px', height: '7px', borderRadius: '50%',
                    background: colorStyle(activePlayer?.color ?? 'blue').border,
                    boxShadow: `0 0 10px ${colorStyle(activePlayer?.color ?? 'blue').border}`,
                    animation: 'pulse 1.2s infinite', display: 'inline-block',
                  }} />
                  <span style={{
                    fontFamily: "'Chakra Petch', 'Outfit', sans-serif",
                    fontSize: '13px', fontWeight: 700, color: '#fff', letterSpacing: '0.3px'
                  }}>
                    {activePlayer?.name}'s Turn
                  </span>
                </div>

                {/* Game Title Logo (Center) */}
                <div style={{
                  fontSize: '14px',
                  fontWeight: 800,
                  fontFamily: 'Outfit, sans-serif',
                  color: '#94a3b8',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>🎲</span> Ludo Royale
                </div>

                {/* Controls (Right) */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={() => {
                      play('buttonClick');
                      toggleMute();
                    }}
                    title={mute ? 'Unmute' : 'Mute'}
                    style={{
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer',
                      color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {mute ? <VolumeX size={13} /> : <Volume2 size={13} />}
                  </button>
                  <button
                    onClick={handleBackToArena}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: '8px', padding: '5px 12px', cursor: 'pointer',
                      color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px',
                      fontSize: '11px', fontWeight: 700, letterSpacing: '0.3px',
                      transition: 'all 0.2s ease', fontFamily: "'Chakra Petch', sans-serif",
                    }}
                  >
                    <ArrowLeft size={11} /> Exit
                  </button>
                </div>
              </div>

              {/* Main Content Area */}
              <div style={{
                flex: 1,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div className="ludo-board-wrapper">
                  <div id="game-container" className="game-canvas-wrap" />

                  {/* Corner slots for profile + dice */}
                  {renderCornerSlot('tl')}
                  {renderCornerSlot('tr')}
                  {renderCornerSlot('bl')}
                  {renderCornerSlot('br')}
                </div>
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
                    <button className="btn-primary" onClick={() => { play('buttonClick'); setupGame(lastMatchConfig); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
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

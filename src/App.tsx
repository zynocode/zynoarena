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
    consecutiveSixes, 
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

      {/* LUDO ROYALE AI MODULE */}
      {activeGame === 'LUDO' && (
        <>
          {/* MENU / SETUP */}
          {(currentScreen === 'MENU' || currentScreen === 'SETUP') && (
            <MainMenu onBackToArena={handleBackToArena} />
          )}

          {/* PLAYING */}
          {currentScreen === 'PLAYING' && (
            <div className="game-layout">

              {/* Board Column */}
              <div className="game-board-col">

                {/* HUD Bar */}
                <div className="glass-panel game-hud">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      display: 'inline-block',
                      width: '12px', height: '12px', borderRadius: '50%',
                      backgroundColor: colorStyle(activePlayer?.color ?? 'blue').border,
                      animation: 'shimmer 2s ease-in-out infinite',
                      color: colorStyle(activePlayer?.color ?? 'blue').border,
                    }} />
                    <span style={{ fontWeight: 700, fontSize: '14px' }}>{activePlayer?.name}'s Turn</span>
                    <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {gameStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={toggleMute} title={mute ? 'Unmute' : 'Mute'}
                      style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', padding: '7px', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                      {mute ? <VolumeX size={15} /> : <Volume2 size={15} />}
                    </button>
                    <button onClick={handleBackToArena} title="Exit to Arena"
                      style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', padding: '7px', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                      <ArrowLeft size={14} /> Exit
                    </button>
                  </div>
                </div>

                {/* Phaser Canvas */}
                <div id="game-container" className="game-canvas-wrap" />

                {/* Event Banner */}
                {lastActionNotice !== 'NONE' && (
                  <div className="glass-panel" style={{
                    position: 'absolute',
                    top: '80px',
                    padding: '14px 28px',
                    borderRadius: '14px',
                    zIndex: 100,
                    fontSize: '16px',
                    fontWeight: 700,
                    border: `1px solid ${lastActionNotice === 'SIX_EXTRA' ? '#22c55e' : '#ef4444'}`,
                    backgroundColor: 'rgba(2,6,23,0.92)',
                    color: lastActionNotice === 'SIX_EXTRA' ? '#86efac' : lastActionNotice === 'THREE_SIXES' ? '#fca5a5' : '#fcd34d',
                    animation: 'bannerIn 0.3s ease forwards',
                    pointerEvents: 'none',
                  }}>
                    {lastActionNotice === 'CAPTURE'      && `⚔️  ${activePlayer?.name} Captured an Opponent!`}
                    {lastActionNotice === 'SIX_EXTRA'    && `🎲  Extra Roll Granted!`}
                    {lastActionNotice === 'THREE_SIXES'  && `⚠️  Three 6s! Turn Voided.`}
                    {lastActionNotice === 'NO_MOVES'     && `💤  No Valid Moves — Passing Turn.`}
                  </div>
                )}
              </div>

              {/* Control Deck */}
              <div className="glass-panel control-deck">
                <h3 style={{ margin: 0, fontSize: '14px', color: '#94a3b8', fontWeight: 600, textAlign: 'center' }}>Control Deck</h3>

                <Dice onRoll={handleRollDice} />

                <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                    Last Roll: <strong style={{ color: '#fff', fontSize: '18px' }}>{diceValue}</strong>
                  </div>
                  {consecutiveSixes > 0 && (
                    <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600, animation: 'pulse 1.2s infinite', marginTop: '4px' }}>
                      ⚠️ {consecutiveSixes} / 3 Sixes
                    </div>
                  )}
                  {gameStatus === 'WAITING_FOR_MOVE' && activePlayer?.isHuman && (
                    <div style={{ fontSize: '12px', color: '#60a5fa', marginTop: '8px', fontWeight: 500, animation: 'pulse 1.5s infinite' }}>
                      ✨ Select a highlighted token
                    </div>
                  )}
                </div>

                {/* Mini player status */}
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {players.map((p) => {
                    const cs = colorStyle(p.color);
                    const home = p.tokens.filter(t => t === 56).length;
                    const isActive = players[activePlayerIndex]?.id === p.id;
                    return (
                      <div key={p.id} style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '6px 10px', borderRadius: '8px',
                        background: isActive ? cs.bg : 'transparent',
                        border: `1px solid ${isActive ? cs.border : 'transparent'}`,
                        transition: 'all 0.3s ease',
                      }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cs.border, flexShrink: 0 }} />
                        <span style={{ fontSize: '11px', fontWeight: 600, flex: 1, color: isActive ? cs.text : '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>🏠 {home}/4</span>
                      </div>
                    );
                  })}
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
        </>
      )}
    </div>
  );
}

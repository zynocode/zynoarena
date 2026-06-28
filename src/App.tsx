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

  // ─── Player Panel Renderer ───────────────────────────────────────────────
  const renderPanel = (
    p: typeof players[0],
    flip = false,         // true = flip vertically (top player in 2P mode)
    isCorner = false,     // true = compact corner card (4P mode)
    cornerPos?: 'tl' | 'tr' | 'bl' | 'br'
  ) => {
    const cs      = colorStyle(p.color);
    const home    = p.tokens.filter(t => t === 56).length;
    const isAct   = players[activePlayerIndex]?.id === p.id;

    const cardStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: isCorner
        ? (cornerPos === 'tr' || cornerPos === 'br') ? 'row-reverse' : 'row'
        : flip ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: isCorner ? '8px' : '14px',
      padding: isCorner ? '8px 12px' : '12px 20px',
      borderRadius: isCorner ? '14px' : '18px',
      background: isAct
        ? `linear-gradient(135deg, ${cs.bg} 0%, rgba(15,23,42,0.9) 100%)`
        : 'rgba(10,18,35,0.75)',
      border: `1.5px solid ${isAct ? cs.border : 'rgba(255,255,255,0.07)'}`,
      boxShadow: isAct
        ? `0 0 0 1px ${cs.border}22, 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)`
        : '0 4px 16px rgba(0,0,0,0.4)',
      backdropFilter: 'blur(16px)',
      transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      cursor: 'default',
      userSelect: 'none',
      minWidth: isCorner ? 'auto' : '180px',
      position: 'relative',
      overflow: 'hidden',
    };

    const avatarSize = isCorner ? 36 : 48;

    return (
      <div style={cardStyle}>
        {/* Glow shimmer for active */}
        {isAct && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 'inherit',
            background: `radial-gradient(ellipse 80% 60% at 20% 50%, ${cs.bg} 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />
        )}

        {/* Avatar */}
        <div style={{
          width: avatarSize, height: avatarSize, borderRadius: '50%', flexShrink: 0,
          background: isAct ? `radial-gradient(circle at 35% 35%, ${cs.border}33, rgba(10,18,35,0.95))` : 'rgba(10,18,35,0.8)',
          border: `2px solid ${isAct ? cs.border : 'rgba(255,255,255,0.1)'}`,
          boxShadow: isAct ? `0 0 16px ${cs.border}66, inset 0 1px 0 rgba(255,255,255,0.15)` : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.35s ease',
          position: 'relative', zIndex: 1,
        }}>
          {p.isHuman
            ? <svg width={isCorner ? 16 : 20} height={isCorner ? 16 : 20} viewBox="0 0 24 24" fill="none" stroke={isAct ? cs.border : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
            : <svg width={isCorner ? 16 : 20} height={isCorner ? 16 : 20} viewBox="0 0 24 24" fill="none" stroke={isAct ? cs.border : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="15" x2="8" y2="15"/><line x1="12" y1="15" x2="12" y2="15"/><line x1="16" y1="15" x2="16" y2="15"/></svg>
          }
        </div>

        {/* Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, position: 'relative', zIndex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              fontFamily: "'Chakra Petch', 'Outfit', sans-serif",
              fontSize: isCorner ? '11px' : '14px',
              fontWeight: 700,
              color: isAct ? '#fff' : '#94a3b8',
              letterSpacing: '0.3px',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              maxWidth: isCorner ? '70px' : '120px',
              transition: 'color 0.3s ease',
            }}>
              {p.name}
            </span>
            {!p.isHuman && (
              <span style={{
                fontSize: '8px', fontWeight: 800, padding: '1px 5px', borderRadius: '4px',
                background: 'rgba(255,255,255,0.07)', color: cs.text,
                border: `1px solid ${cs.border}33`, letterSpacing: '0.8px',
                textTransform: 'uppercase', fontFamily: "'Chakra Petch', monospace",
              }}>
                BOT
              </span>
            )}
          </div>

          {/* Token progress dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isCorner ? '3px' : '4px' }}>
            {Array.from({ length: 4 }).map((_, i) => {
              const done = i < home;
              return (
                <div key={i} style={{
                  width: isCorner ? '7px' : '9px', height: isCorner ? '7px' : '9px',
                  borderRadius: '50%',
                  background: done
                    ? `radial-gradient(circle at 35% 35%, ${cs.text}, ${cs.border})`
                    : 'rgba(255,255,255,0.05)',
                  border: `1.5px solid ${done ? cs.border : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: done ? `0 0 6px ${cs.border}` : 'none',
                  transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                }} />
              );
            })}
            {!isCorner && (
              <span style={{ fontSize: '10px', color: isAct ? cs.text : '#475569', marginLeft: '4px', fontWeight: 700, fontFamily: "'Chakra Petch', monospace" }}>
                {home}/4
              </span>
            )}
          </div>
        </div>

        {/* Inline Dice — only for active player */}
        {isAct && (
          <div style={{ flexShrink: 0, position: 'relative', zIndex: 1 }}>
            <Dice onRoll={handleRollDice} compact />
          </div>
        )}
      </div>
    );
  };

  // ─── Playing Screen ───────────────────────────────────────────────────────
  const playerCount = players.length;
  const is2Player   = playerCount === 2;

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

              {/* ── Floating Pill HUD ───────────────────────────────────── */}
              <div style={{
                position: 'fixed', top: '16px', left: '50%', transform: 'translateX(-50%)',
                zIndex: 300,
                display: 'flex', alignItems: 'center', gap: '18px',
                padding: '7px 14px 7px 10px',
                background: 'rgba(10,18,35,0.88)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: '100px',
                backdropFilter: 'blur(20px)',
                boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${colorStyle(activePlayer?.color ?? 'blue').border}22`,
              }}>
                {/* Color dot + name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '8px', height: '8px', borderRadius: '50%',
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
                {/* Controls */}
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button
                    onClick={toggleMute}
                    title={mute ? 'Unmute' : 'Mute'}
                    style={{
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer',
                      color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {mute ? <VolumeX size={13} /> : <Volume2 size={13} />}
                  </button>
                  <button
                    onClick={handleBackToArena}
                    style={{
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '100px', padding: '5px 14px', cursor: 'pointer',
                      color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px',
                      fontSize: '11px', fontWeight: 700, letterSpacing: '0.3px',
                      transition: 'all 0.2s ease', fontFamily: "'Chakra Petch', sans-serif",
                    }}
                  >
                    <ArrowLeft size={11} /> Exit
                  </button>
                </div>
              </div>

              {/* ── 2-PLAYER LAYOUT: Top ↔ Bottom ───────────────────────── */}
              {is2Player ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: '16px', paddingTop: '72px', paddingBottom: '16px',
                }}>
                  {/* Top player (P2, flipped) */}
                  <div style={{ transform: 'rotate(180deg)' }}>
                    {renderPanel(players[1], true)}
                  </div>

                  {/* Board */}
                  <div style={{ position: 'relative' }}>
                    <div id="game-container" className="game-canvas-wrap" />
                    {/* Event Banner */}
                    {lastActionNotice !== 'NONE' && (
                      <div style={{
                        position: 'absolute', top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%)',
                        padding: '12px 22px', borderRadius: '16px', zIndex: 150,
                        fontSize: '14px', fontWeight: 800,
                        fontFamily: "'Chakra Petch', sans-serif",
                        border: `1.5px solid ${lastActionNotice === 'SIX_EXTRA' ? '#22c55e' : '#ef4444'}`,
                        background: 'rgba(2,6,23,0.94)',
                        color: lastActionNotice === 'SIX_EXTRA' ? '#86efac' : lastActionNotice === 'THREE_SIXES' ? '#fca5a5' : '#fcd34d',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
                        animation: 'bannerIn 0.3s ease forwards',
                        pointerEvents: 'none', textAlign: 'center', whiteSpace: 'nowrap',
                      }}>
                        {lastActionNotice === 'CAPTURE'     && `${activePlayer?.name} Captured!`}
                        {lastActionNotice === 'SIX_EXTRA'   && 'Extra Roll!'}
                        {lastActionNotice === 'THREE_SIXES' && 'Three 6s — Turn Voided'}
                        {lastActionNotice === 'NO_MOVES'    && 'No Moves — Skipping'}
                      </div>
                    )}
                  </div>

                  {/* Bottom player (P1, normal) */}
                  {renderPanel(players[0], false)}
                </div>

              ) : (
              /* ── 4-PLAYER LAYOUT: Corner Cards ──────────────────────── */
                <div style={{
                  display: 'grid',
                  gridTemplateAreas: `
                    "tl  top  tr"
                    "lft board rgt"
                    "bl  bot  br"
                  `,
                  gridTemplateColumns: '1fr auto 1fr',
                  gridTemplateRows: '1fr auto 1fr',
                  gap: '12px',
                  alignItems: 'center',
                  justifyItems: 'center',
                  paddingTop: '64px',
                  paddingBottom: '16px',
                  width: '100%',
                  maxWidth: '100vw',
                  boxSizing: 'border-box',
                }}>
                  {/* TL — Red */}
                  <div style={{ gridArea: 'tl', justifySelf: 'end', alignSelf: 'end' }}>
                    {players.find(p => p.color === 'red') && renderPanel(players.find(p => p.color === 'red')!, false, true, 'tl')}
                  </div>
                  {/* Top spacer */}
                  <div style={{ gridArea: 'top' }} />
                  {/* TR — Green */}
                  <div style={{ gridArea: 'tr', justifySelf: 'start', alignSelf: 'end' }}>
                    {players.find(p => p.color === 'green') && renderPanel(players.find(p => p.color === 'green')!, false, true, 'tr')}
                  </div>

                  {/* Left / Right spacers */}
                  <div style={{ gridArea: 'lft' }} />

                  {/* Board */}
                  <div style={{ gridArea: 'board', position: 'relative' }}>
                    <div id="game-container" className="game-canvas-wrap" />
                    {lastActionNotice !== 'NONE' && (
                      <div style={{
                        position: 'absolute', top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%)',
                        padding: '12px 22px', borderRadius: '16px', zIndex: 150,
                        fontSize: '14px', fontWeight: 800,
                        fontFamily: "'Chakra Petch', sans-serif",
                        border: `1.5px solid ${lastActionNotice === 'SIX_EXTRA' ? '#22c55e' : '#ef4444'}`,
                        background: 'rgba(2,6,23,0.94)',
                        color: lastActionNotice === 'SIX_EXTRA' ? '#86efac' : lastActionNotice === 'THREE_SIXES' ? '#fca5a5' : '#fcd34d',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
                        animation: 'bannerIn 0.3s ease forwards',
                        pointerEvents: 'none', textAlign: 'center', whiteSpace: 'nowrap',
                      }}>
                        {lastActionNotice === 'CAPTURE'     && `${activePlayer?.name} Captured!`}
                        {lastActionNotice === 'SIX_EXTRA'   && 'Extra Roll!'}
                        {lastActionNotice === 'THREE_SIXES' && 'Three 6s — Turn Voided'}
                        {lastActionNotice === 'NO_MOVES'    && 'No Moves — Skipping'}
                      </div>
                    )}
                  </div>

                  <div style={{ gridArea: 'rgt' }} />

                  {/* BL — Blue */}
                  <div style={{ gridArea: 'bl', justifySelf: 'end', alignSelf: 'start' }}>
                    {players.find(p => p.color === 'blue') && renderPanel(players.find(p => p.color === 'blue')!, false, true, 'bl')}
                  </div>
                  {/* Bottom spacer */}
                  <div style={{ gridArea: 'bot' }} />
                  {/* BR — Yellow */}
                  <div style={{ gridArea: 'br', justifySelf: 'start', alignSelf: 'start' }}>
                    {players.find(p => p.color === 'yellow') && renderPanel(players.find(p => p.color === 'yellow')!, false, true, 'br')}
                  </div>
                </div>
              )}
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

import React, { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import { ChessBoard } from './ChessBoard';
import { CapturedPieces } from './CapturedPieces';
import { MoveHistory } from './MoveHistory';
import { PromotionDialog } from './PromotionDialog';
import { GameStatus } from './GameStatus';
import { Timer } from './Timer';
import { DrawOfferDialog } from './DrawOfferDialog';
import { EvaluationBar } from './EvaluationBar';
import { useTheme } from '../../hooks/useTheme';
import type { GameMode, PieceColor } from '../../types/chess.types';

// Import TIME_CONTROLS type implicitly via the object shape passed in
interface TimeControl {
  time: number;
  inc: number;
  label: string;
}

interface ChessMatchProps {
  gameMode: GameMode;
  selectedColor: PieceColor;
  selectedTC: TimeControl;
  opponentName: string;
  playerName: string;

  // useChessGame values
  fen: string;
  history: any[];
  isFlipped: boolean;
  flipBoard: () => void;
  undoMove: () => void;
  handlePieceDrop: (source: string, target: string, piece: string) => boolean;
  captured: any;
  status: any;
  turn: PieceColor;
  pendingPromotion: any;
  setPendingPromotion: (p: any) => void;
  executePromotion: (p: string) => void;
  getPossibleMoves: (sq: string) => any[];
  exportPGN: (res?: string) => string;
  canUndo: boolean;

  // parent controls
  handlePlayAgain: () => void;
  handleQuitGame: () => void;
  resetKey: number;
  timeOutLoser: 'w' | 'b' | null;
  setTimeOutLoser: (l: 'w' | 'b' | null) => void;
}

export const ChessMatch: React.FC<ChessMatchProps> = ({
  gameMode, selectedColor, selectedTC,
  opponentName, playerName,
  fen, history, isFlipped, flipBoard, undoMove, handlePieceDrop,
  captured, status, turn, pendingPromotion, setPendingPromotion, executePromotion,
  getPossibleMoves, exportPGN, canUndo,
  handlePlayAgain, handleQuitGame, resetKey, timeOutLoser, setTimeOutLoser
}) => {
  // Draw / Resign dialog states
  const [drawOfferVisible, setDrawOfferVisible] = useState(false);
  const [drawOfferedBy, setDrawOfferedBy] = useState<'w' | 'b'>('w');
  const [resignConfirmVisible, setResignConfirmVisible] = useState(false);
  const [pgnCopied, setPgnCopied] = useState(false);

  const { themeColors, cycleTheme } = useTheme();

  const [forcedDraw, setForcedDraw] = useState(false);
  const [resignedColor, setResignedColor] = useState<'w' | 'b' | null>(null);
  const [botDeclinedDraw, setBotDeclinedDraw] = useState(false);

  const [viewPly, setViewPly] = useState<number | null>(null);
  const isReviewing = viewPly !== null;

  const [isWide, setIsWide] = useState(true);
  const [boardWidth, setBoardWidth] = useState(500);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const maxByH = Math.max(280, h - 200); // Vertical space constraint

      // 340px controls + 16px gap + 32px eval + 40px padding = 428px
      if (w < 900) {
        setIsWide(false);
        // Stacked mode: Controls go below the board
        setBoardWidth(Math.min(w - 40, maxByH, 500));
      } else {
        setIsWide(true);
        // Side-by-side mode
        const maxByW = w - 428; 
        setBoardWidth(Math.max(300, Math.min(maxByW, maxByH, 600)));
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Material total (in pawns) for draw adjudication
  const PIECE_PTS = { p: 1, n: 3, b: 3, r: 5, q: 9 } as const;
  const sideMaterial = (c: { p: number; n: number; b: number; r: number; q: number }) =>
    c.p * PIECE_PTS.p + c.n * PIECE_PTS.n + c.b * PIECE_PTS.b + c.r * PIECE_PTS.r + c.q * PIECE_PTS.q;

  const handleOfferDraw = () => {
    if (gameMode === 'ai') {
      const whiteAdv = sideMaterial(captured.w) - sideMaterial(captured.b);
      const aiColor = selectedColor === 'w' ? 'b' : 'w';
      const aiAdv = aiColor === 'w' ? whiteAdv : -whiteAdv;
      const botAccepts = history.length >= 20 && aiAdv <= 1;
      if (botAccepts) {
        setForcedDraw(true);
      } else {
        setBotDeclinedDraw(true);
        setTimeout(() => setBotDeclinedDraw(false), 2200);
      }
      return;
    }
    setDrawOfferedBy(turn);
    setDrawOfferVisible(true);
  };

  const handleAcceptDraw = () => {
    setDrawOfferVisible(false);
    setTimeOutLoser(null);
    setForcedDraw(true);
  };

  const handleDeclineDraw = () => setDrawOfferVisible(false);

  const handleResign = () => setResignConfirmVisible(true);
  const handleResignConfirm = () => {
    setResignConfirmVisible(false);
    setResignedColor(turn);
  };

  const gameResultToken = (): string | undefined => {
    if (resignedColor) return resignedColor === 'w' ? '0-1' : '1-0';
    if (forcedDraw) return '1/2-1/2';
    if (timeOutLoser) return timeOutLoser === 'w' ? '0-1' : '1-0';
    if (status.isGameOver) {
      if (status.reason === 'checkmate') return status.winner === 'w' ? '1-0' : '0-1';
      return '1/2-1/2';
    }
    return undefined;
  };

  const handleCopyPGN = () => {
    const pgn = exportPGN(gameResultToken());
    navigator.clipboard.writeText(pgn).then(() => {
      setPgnCopied(true);
      setTimeout(() => setPgnCopied(false), 2000);
    });
  };

  useEffect(() => {
    setForcedDraw(false);
    setResignedColor(null);
    setBotDeclinedDraw(false);
  }, [resetKey]);

  const reviewFen = useCallback((ply: number): string => {
    try {
      const tmp = new Chess();
      const moves = history.slice(0, ply + 1);
      for (const m of moves) tmp.move(m.san);
      return tmp.fen();
    } catch {
      return fen;
    }
  }, [history, fen]);

  const displayFen = isReviewing ? reviewFen(viewPly) : fen;
  const exitReview = useCallback(() => setViewPly(null), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (history.length === 0) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setViewPly((p) => {
          const cur = p === null ? history.length - 1 : p;
          return Math.max(0, cur - 1);
        });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setViewPly((p) => {
          if (p === null) return null;
          const next = p + 1;
          return next >= history.length ? null : next;
        });
      } else if (e.key === 'Escape') {
        setViewPly(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [history.length]);

  useEffect(() => { setViewPly(null); }, [fen]);

  const isEffectivelyOver = status.isGameOver || !!timeOutLoser || forcedDraw || !!resignedColor;
  const isBotThinking = gameMode === 'ai' && turn !== selectedColor && !isEffectivelyOver;
  const actionsLocked = isEffectivelyOver || isBotThinking;

  const whiteScore = sideMaterial(captured.w) - sideMaterial(captured.b);
  const blackScore = -whiteScore;

  const scoreBadge = (color: 'w' | 'b') => {
    const adv = color === 'w' ? whiteScore : blackScore;
    if (adv <= 0) return null;
    return (
      <span style={{
        fontSize: '11px', fontWeight: 700,
        color: '#34d399', background: 'rgba(16,185,129,0.12)',
        border: '1px solid rgba(16,185,129,0.3)',
        borderRadius: '5px', padding: '1px 5px', marginLeft: '6px',
      }}>
        +{adv}
      </span>
    );
  };

  useEffect(() => {
    if (gameMode !== 'local' || isEffectivelyOver) return;
    const shouldBeFlipped = turn === 'b';
    if (shouldBeFlipped !== isFlipped) flipBoard();
  }, [turn]); // eslint-disable-line react-hooks/exhaustive-deps

  const overlayStatus = resignedColor
    ? { isGameOver: true, isCheck: false, winner: (resignedColor === 'w' ? 'b' : 'w') as PieceColor, reason: 'checkmate' as const }
    : forcedDraw
    ? { isGameOver: true, isCheck: false, winner: null, reason: 'draw' as const }
    : status;

  return (
    <div style={{
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '12px 16px',
      color: '#f8fafc',
      fontFamily: "'Inter', sans-serif",
    }}>
      {botDeclinedDraw && (
        <div style={{
          position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
          background: 'rgba(30,41,59,0.96)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: 600,
          color: '#e2e8f0', boxShadow: '0 10px 25px -8px rgba(0,0,0,0.6)',
        }}>
          🤖 Bot declined the draw — play on.
        </div>
      )}

      {drawOfferVisible && (
        <DrawOfferDialog offeredBy={drawOfferedBy} onAccept={handleAcceptDraw} onDecline={handleDeclineDraw} />
      )}

      {resignConfirmVisible && (
        <div style={overlayBg}>
          <div style={dialogCard}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏳</div>
            <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: '#f1f5f9' }}>Resign Game?</h3>
            <p style={{ margin: '0 0 24px', fontSize: '13px', color: '#94a3b8' }}>Are you sure you want to resign? This counts as a loss.</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleResignConfirm} style={dangerBtn}>Yes, Resign</button>
              <button onClick={() => setResignConfirmVisible(false)} style={cancelBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{
        display: 'flex', flexDirection: isWide ? 'row' : 'column',
        gap: '16px', alignItems: isWide ? 'stretch' : 'center', justifyContent: 'center',
        flexWrap: 'wrap',
        width: '100%', maxWidth: '1200px', margin: '0 auto',
        padding: '0 16px', boxSizing: 'border-box',
      }}>
        {/* Board Column */}
        <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end', position: 'relative' }}>
          {pendingPromotion && <PromotionDialog color={turn} onSelect={executePromotion} onClose={() => setPendingPromotion(null)} />}
          
          {isEffectivelyOver && (
            <GameStatus status={overlayStatus} timeOutLoser={timeOutLoser} onPlayAgain={handlePlayAgain} onHome={handleQuitGame} />
          )}

          {/* Opponent Card */}
          <div style={{ ...playerCard, width: `${boardWidth}px` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>{selectedColor === 'w' ? '⚫' : '⚪'}</span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                    {opponentName}
                    {scoreBadge(selectedColor === 'w' ? 'b' : 'w')}
                    {isBotThinking && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '6px', fontSize: '10px', color: '#fbbf24', fontWeight: 600 }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24', animation: 'pulse 1s ease-in-out infinite', display: 'inline-block' }} />
                        Thinking…
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '9px', color: '#64748b' }}>Opponent</div>
                </div>
              </div>
              <CapturedPieces captured={isFlipped ? captured.b : captured.w} color={isFlipped ? 'w' : 'b'} />
            </div>

            {isReviewing && (
              <div style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', zIndex: 50,
                background: 'rgba(99,102,241,0.9)', backdropFilter: 'blur(8px)', borderRadius: '0 0 10px 10px',
                padding: '5px 14px', fontSize: '12px', fontWeight: 700, color: '#fff', display: 'flex',
                alignItems: 'center', gap: '10px', whiteSpace: 'nowrap',
              }}>
                <span>⏪ Reviewing move {viewPly! + 1}/{history.length} (← → keys)</span>
                <button onClick={exitReview} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 700, fontSize: '11px', padding: '3px 8px', cursor: 'pointer' }}>Back to Live ✕</button>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <EvaluationBar fen={displayFen} isFlipped={isFlipped} height={boardWidth} />
              <ChessBoard
                fen={displayFen}
                isFlipped={isFlipped}
                lastMove={isReviewing ? (history[viewPly!] ?? null) : (history[history.length - 1] ?? null)}
                turn={turn}
                isCheck={!isReviewing && status.isCheck}
                playerColor={selectedColor}
                gameMode={isReviewing ? 'local' : gameMode}
                onPieceDrop={isReviewing ? () => false : handlePieceDrop}
                getPossibleMoves={isReviewing ? () => [] : getPossibleMoves}
                boardWidth={boardWidth}
                theme={themeColors}
              />
            </div>

            {/* Player Card */}
            <div style={{ ...playerCard, width: `${boardWidth}px` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>{selectedColor === 'w' ? '⚪' : '⚫'}</span>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                  {playerName}
                  {scoreBadge(selectedColor)}
                </div>
                <div style={{ fontSize: '9px', color: '#64748b' }}>You</div>
              </div>
            </div>
            <CapturedPieces captured={isFlipped ? captured.w : captured.b} color={isFlipped ? 'b' : 'w'} />
          </div>
        </div>

        {/* Controls Column */}
        <div style={{
          flex: '1 1 300px', maxWidth: isWide ? '340px' : `${boardWidth}px`, display: 'flex', flexDirection: 'column', gap: '10px',
        }}>
          <Timer
            resetTrigger={resetKey}
            activeTurn={isReviewing || !!pendingPromotion ? null as any : turn}
            isGameOver={isEffectivelyOver || isReviewing || !!pendingPromotion}
            onTimeOut={setTimeOutLoser}
            initialTime={selectedTC.time}
            increment={selectedTC.inc}
          />

          <div style={{ flex: '1 1 120px', minHeight: '120px', display: 'flex', flexDirection: 'column' }}>
            <MoveHistory history={history} currentPly={viewPly} onSelectPly={(ply) => setViewPly(ply)} />
          </div>

          <div style={controlPanel}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={undoMove} disabled={!canUndo || isEffectivelyOver} style={ctrlBtn(canUndo && !isEffectivelyOver)}
                onMouseEnter={(e) => canUndo && !isEffectivelyOver && (e.currentTarget.style.background = 'rgba(255,255,255,0.13)')}
                onMouseLeave={(e) => e.currentTarget.style.background = canUndo && !isEffectivelyOver ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)'}
              >↩️ Undo</button>
              <button
                onClick={flipBoard} style={ctrlBtn(true)}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.13)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              >🔄 Flip</button>
              <button
                onClick={cycleTheme} style={ctrlBtn(true)}
                title="Change Board Theme"
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.13)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              >🎨 Theme</button>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleOfferDraw} disabled={actionsLocked} style={ctrlBtn(!actionsLocked)}
                title={isBotThinking ? "Wait for the bot's move" : 'Offer a draw'}
                onMouseEnter={(e) => !actionsLocked && (e.currentTarget.style.background = 'rgba(255,255,255,0.13)')}
                onMouseLeave={(e) => e.currentTarget.style.background = !actionsLocked ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)'}
              >🤝 Draw</button>
              <button
                onClick={handleResign} disabled={actionsLocked}
                style={{ ...ctrlBtn(!actionsLocked), background: actionsLocked ? 'rgba(255,255,255,0.02)' : 'rgba(239,68,68,0.1)', color: actionsLocked ? '#475569' : '#f87171' }}
                onMouseEnter={(e) => !actionsLocked && (e.currentTarget.style.background = 'rgba(239,68,68,0.2)')}
                onMouseLeave={(e) => e.currentTarget.style.background = !actionsLocked ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.02)'}
              >🏳 Resign</button>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handlePlayAgain} style={ctrlBtn(true)} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.13)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}>♻️ Restart</button>
              <button onClick={handleCopyPGN} style={ctrlBtn(true)} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.13)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}>
                {pgnCopied ? '✅ Copied!' : '📋 PGN'}
              </button>
            </div>
            <button
              onClick={handleQuitGame}
              style={{ width: '100%', padding: '8px', borderRadius: '8px', border: 'none', background: 'rgba(239,68,68,0.12)', color: '#f87171', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.22)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
            >🚪 Quit Match</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────
const playerCard: React.CSSProperties = {
  width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 10px',
  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px',
};
const controlPanel: React.CSSProperties = {
  background: 'rgba(30,41,59,0.35)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px',
  padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px',
};
const ctrlBtn = (enabled: boolean): React.CSSProperties => ({
  flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
  background: enabled ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
  color: enabled ? '#e2e8f0' : '#475569', fontSize: '12px', fontWeight: 600,
  cursor: enabled ? 'pointer' : 'not-allowed', transition: 'background 0.15s ease',
});
const overlayBg: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)',
  backdropFilter: 'blur(6px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const dialogCard: React.CSSProperties = {
  background: 'rgba(30,41,59,0.96)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '20px',
  padding: '28px 32px', maxWidth: '340px', width: '90%', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
};
const dangerBtn: React.CSSProperties = {
  flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: 'rgba(239,68,68,0.8)',
  color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
};
const cancelBtn: React.CSSProperties = {
  flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
};

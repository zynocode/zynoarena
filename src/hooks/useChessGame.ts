import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import type {
  GameMode,
  DifficultyLevel,
  PieceColor,
  ChessMove,
  GameStatus,
  CapturedPieces,
} from '../types/chess.types';
import { useChessSounds } from './useChessSounds';
import { useStockfish } from './useStockfish';

// ── Autosave ──────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'zyno-chess-save';

export interface SavedGame {
  pgn: string;
  mode: GameMode;
  color: PieceColor;
  difficulty: DifficultyLevel;
}

export const useChessGame = () => {
  const game = useRef(new Chess());
  const {
    playMoveSound,
    playCheckSound,
    playCheckmateSound,
    playDrawSound,
    playIllegalSound,
  } = useChessSounds();
  const { getBestMove, isEngineReady } = useStockfish();

  // ── State ────────────────────────────────────────────────────────────────────
  const [fen, setFen] = useState<string>(game.current.fen());
  const [history, setHistory] = useState<ChessMove[]>([]);
  const [gameMode, setGameModeState] = useState<GameMode>('local');
  const [difficulty, setDifficultyState] = useState<DifficultyLevel>('medium');
  const [playerColor, setPlayerColorState] = useState<PieceColor>('w');
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [status, setStatus] = useState<GameStatus>({
    isGameOver: false,
    isCheck: false,
    winner: null,
    reason: null,
  });
  const [autoQueen, setAutoQueenState] = useState<boolean>(false);

  // ── Refs — always fresh values for async code ─────────────────────────────
  const gameModeRef    = useRef<GameMode>('local');
  const playerColorRef = useRef<PieceColor>('w');
  const difficultyRef  = useRef<DifficultyLevel>('medium');
  const isGameOverRef  = useRef<boolean>(false);
  const autoQueenRef   = useRef<boolean>(false);
  // Guards against concurrent AI invocations
  const aiRunningRef   = useRef<boolean>(false);

  const setAutoQueen = useCallback((on: boolean) => {
    autoQueenRef.current = on;
    setAutoQueenState(on);
  }, []);

  // Wrapped setters — update ref AND state atomically (no stale-closure race)
  const setGameMode = useCallback((mode: GameMode) => {
    gameModeRef.current = mode;
    setGameModeState(mode);
  }, []);

  const setDifficulty = useCallback((diff: DifficultyLevel) => {
    difficultyRef.current = diff;
    setDifficultyState(diff);
  }, []);

  const setPlayerColor = useCallback((color: PieceColor) => {
    playerColorRef.current = color;
    setPlayerColorState(color);
  }, []);

  // ── Captured pieces ───────────────────────────────────────────────────────
  // Derived incrementally from history.
  const captured = useMemo((): CapturedPieces => {
    const acc: CapturedPieces = {
      w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
      b: { p: 0, n: 0, b: 0, r: 0, q: 0 },
    };
    for (const m of history) {
      if (m.captured) {
        acc[m.color][m.captured as keyof typeof acc.w]++;
      }
    }
    return acc;
  }, [history]);

  // ── Status updater ────────────────────────────────────────────────────────
  const updateGameStatus = useCallback((silent = false) => {
    const isOver  = game.current.isGameOver();
    const inCheck = game.current.inCheck();
    let winner: PieceColor | null = null;
    let reason: GameStatus['reason'] = null;

    if (isOver) {
      if (game.current.isCheckmate()) {
        reason = 'checkmate';
        winner = game.current.turn() === 'w' ? 'b' : 'w';
        if (!silent) playCheckmateSound();
      } else if (game.current.isStalemate()) {
        reason = 'stalemate';
        if (!silent) playDrawSound();
      } else if (game.current.isThreefoldRepetition()) {
        reason = 'threefold';
        if (!silent) playDrawSound();
      } else if (game.current.isInsufficientMaterial()) {
        reason = 'insufficient';
        if (!silent) playDrawSound();
      } else {
        reason = 'fifty-moves';
        if (!silent) playDrawSound();
      }
    } else if (inCheck) {
      if (!silent) playCheckSound();
    }

    isGameOverRef.current = isOver;
    setStatus({ isGameOver: isOver, isCheck: inCheck, winner, reason });
  }, [playCheckSound, playCheckmateSound, playDrawSound]);

  // ── Make a move ───────────────────────────────────────────────────────────
  const makeMove = useCallback(
    (move: { from: string; to: string; promotion?: string }) => {
      try {
        const result = game.current.move(move);
        if (result) {
          setFen(game.current.fen());
          setHistory(game.current.history({ verbose: true }) as unknown as ChessMove[]);
          playMoveSound(result.flags);
          updateGameStatus();
          return result;
        }
      } catch {
        playIllegalSound();
      }
      return null;
    },
    [playMoveSound, playIllegalSound, updateGameStatus]
  );

  // ── AI trigger ────────────────────────────────────────────────────────────
  // Uses refs so it never reads stale state from async closures.
  const triggerAIMove = useCallback(async () => {
    if (isGameOverRef.current)        return;
    if (aiRunningRef.current)         return;
    if (gameModeRef.current !== 'ai') return;
    if (game.current.turn() === playerColorRef.current) return; // human's turn

    aiRunningRef.current = true;
    try {
      // Short visual pause so the human's move renders before the AI responds
      await new Promise<void>((r) => setTimeout(r, 50));

      // Re-check after the async delay — resign/draw/timeout may have fired
      if (isGameOverRef.current)        return;
      if (gameModeRef.current !== 'ai') return;
      if (game.current.turn() === playerColorRef.current) return;

      const startTime = performance.now();
      let bestMoveStr = await getBestMove(game.current.fen(), difficultyRef.current);
      const elapsed = performance.now() - startTime;

      // ── Dynamic Thinking Delay (Humanization) ──────────────────────────────
      if (!isGameOverRef.current) {
        const legalMoves = game.current.moves();
        let targetDelay = 500; // default minimum delay

        if (legalMoves.length === 1) {
          // Forced move (e.g. recapture/only escape) -> fast response
          targetDelay = 200;
        } else if (game.current.history().length <= 8) {
          // Opening book territory -> moderate response
          targetDelay = 500 + Math.random() * 500;
        } else {
          // Complex middle game -> longer response scaled by complexity
          const complexityFactor = Math.min(legalMoves.length / 30, 1.5);
          targetDelay = 800 + Math.random() * 1000 * complexityFactor;
          
          // Higher difficulties "tank" longer
          if (['hard', 'expert', 'master'].includes(difficultyRef.current)) {
            targetDelay += 500 + Math.random() * 1000;
          }
        }

        const paddingNeeded = targetDelay - elapsed;
        if (paddingNeeded > 0) {
          await new Promise<void>((r) => setTimeout(r, paddingNeeded));
        }
      }

      // ROOT CAUSE FIX: when both engines return '' (Stockfish CDN blocked/
      // timed-out AND local minimax threw an error), the FEN never changes so
      // useEffect([fen]) never fires again — AI frozen indefinitely.
      // Iron fallback: always pick a random legal move so the game continues.
      if ((!bestMoveStr || bestMoveStr.length < 4) && !isGameOverRef.current) {
        const legal = game.current.moves({ verbose: true });
        if (legal.length > 0) {
          const rnd = legal[Math.floor(Math.random() * legal.length)];
          bestMoveStr = `${rnd.from}${rnd.to}${rnd.promotion ?? ''}`;
          console.warn('[AI] engine returned no move — random fallback:', bestMoveStr);
        }
      }

      if (bestMoveStr && bestMoveStr.length >= 4 && !isGameOverRef.current) {
        const from      = bestMoveStr.substring(0, 2);
        const to        = bestMoveStr.substring(2, 4);
        const promotion = bestMoveStr.length === 5 ? bestMoveStr[4] : undefined;
        makeMove({ from, to, promotion });
      }
    } finally {
      aiRunningRef.current = false;
    }
  }, [getBestMove, makeMove]);

  // Fire on every FEN change (after human move or board reset)
  useEffect(() => {
    void triggerAIMove();
  }, [fen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Also fire when game starts (AI plays Black first — fen stays identical to
  // starting position so useEffect([fen]) doesn't re-fire on reset).
  const triggerAIMoveAfterStart = useCallback(() => {
    setTimeout(() => void triggerAIMove(), 100);
  }, [triggerAIMove]);

  // ── Reset game ────────────────────────────────────────────────────────────
  const resetGame = useCallback(() => {
    aiRunningRef.current = false;
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    game.current.reset();
    setFen(game.current.fen());
    setHistory([]);
    setPendingPromotion(null);
    isGameOverRef.current = false;
    setStatus({ isGameOver: false, isCheck: false, winner: null, reason: null });
  }, []);

  // ── Undo ──────────────────────────────────────────────────────────────────
  const undoMove = useCallback(() => {
    // #15 fix: cancel any in-flight AI search before undoing
    aiRunningRef.current = false;

    if (gameModeRef.current === 'ai') {
      // Double-undo only when AI has already played (>=2 plies).
      // If odd ply count, AI hasn't responded yet — single undo is enough.
      const h = game.current.history();
      const timesToUndo = h.length >= 2 ? 2 : h.length === 1 ? 1 : 0;
      for (let i = 0; i < timesToUndo; i++) game.current.undo();
    } else {
      game.current.undo();
    }
    setFen(game.current.fen());
    setHistory(game.current.history({ verbose: true }) as unknown as ChessMove[]);
    updateGameStatus();
  }, [updateGameStatus]);

  // ── Promotion detection ───────────────────────────────────────────────────
  const isPromotionMove = useCallback(
    (sourceSquare: string, targetSquare: string, piece: string): boolean => {
      const targetRank = targetSquare[1];
      let isPawn = false;
      if (piece) {
        isPawn = piece.toLowerCase().endsWith('p');
      } else {
        const boardPiece = game.current.get(sourceSquare as Square);
        isPawn = boardPiece?.type === 'p';
      }
      if (!isPawn) return false;
      const t = game.current.turn();
      const isPromotionRank =
        (t === 'w' && targetRank === '8') || (t === 'b' && targetRank === '1');
      if (!isPromotionRank) return false;
      const moves = game.current.moves({ square: sourceSquare as Square, verbose: true });
      return moves.some((m) => m.to === targetSquare && m.flags.includes('p'));
    },
    []
  );

  // ── Handle piece drop / click-to-move ─────────────────────────────────────
  const handlePieceDrop = useCallback(
    (sourceSquare: string, targetSquare: string, piece: string): boolean => {
      if (
        gameModeRef.current === 'ai' &&
        game.current.turn() !== playerColorRef.current
      ) return false;

      if (isPromotionMove(sourceSquare, targetSquare, piece)) {
        if (autoQueenRef.current) {
          const result = makeMove({ from: sourceSquare, to: targetSquare, promotion: 'q' });
          return result !== null;
        }
        setPendingPromotion({ from: sourceSquare, to: targetSquare });
        return true;
      }

      const result = makeMove({ from: sourceSquare, to: targetSquare });
      return result !== null;
    },
    [isPromotionMove, makeMove]
  );

  // ── Execute promotion ─────────────────────────────────────────────────────
  const executePromotion = useCallback(
    (pieceType: string) => {
      if (pendingPromotion) {
        makeMove({
          from: pendingPromotion.from,
          to: pendingPromotion.to,
          promotion: pieceType,
        });
        setPendingPromotion(null);
      }
    },
    [pendingPromotion, makeMove]
  );

  const flipBoard = useCallback(() => setIsFlipped((f) => !f), []);
  const exportPGN = useCallback((result?: string) => {
    if (result) game.current.setHeader('Result', result);
    return game.current.pgn({ maxWidth: 72, newline: '\n' });
  }, []);
  // canClaimDraw removed: was dead code — chess.js auto-ends on threefold/50-move.

  const getPossibleMoves = useCallback((square: string) => {
    return game.current.moves({ square: square as Square, verbose: true });
  }, []);

  // ── Autosave to localStorage on every position change ──────────────────────
  useEffect(() => {
    if (game.current.history().length === 0) return;
    try {
      if (game.current.isGameOver()) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }
      const save: SavedGame = {
        pgn: game.current.pgn(),
        mode: gameModeRef.current,
        color: playerColorRef.current,
        difficulty: difficultyRef.current,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
    } catch { /* storage unavailable / quota — non-fatal */ }
  }, [fen]);

  const getSavedGame = useCallback((): SavedGame | null => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as SavedGame;
      return parsed && typeof parsed.pgn === 'string' ? parsed : null;
    } catch {
      return null;
    }
  }, []);

  const resumeSavedGame = useCallback(
    (save: SavedGame): boolean => {
      try {
        game.current.loadPgn(save.pgn);
      } catch {
        return false;
      }
      aiRunningRef.current = false;
      gameModeRef.current = save.mode;
      setGameModeState(save.mode);
      playerColorRef.current = save.color;
      setPlayerColorState(save.color);
      difficultyRef.current = save.difficulty;
      setDifficultyState(save.difficulty);
      setPendingPromotion(null);
      setFen(game.current.fen());
      setHistory(game.current.history({ verbose: true }) as unknown as ChessMove[]);
      isGameOverRef.current = game.current.isGameOver();
      updateGameStatus(true);
      return true;
    },
    [updateGameStatus]
  );

  return {
    fen,
    history,
    gameMode,
    setGameMode,
    difficulty,
    setDifficulty,
    playerColor,
    setPlayerColor,
    isFlipped,
    flipBoard,
    resetGame,
    undoMove,
    handlePieceDrop,
    captured,
    status,
    turn: game.current.turn() as PieceColor,
    pendingPromotion,
    setPendingPromotion,
    executePromotion,
    getPossibleMoves,
    exportPGN,
    canUndo: history.length > 0,
    triggerAIMoveAfterStart,
    getSavedGame,
    resumeSavedGame,
    isEngineReady,
    autoQueen,
    setAutoQueen,
  };
};

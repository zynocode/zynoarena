import { useCallback, useEffect, useState } from 'react';
import type { DifficultyLevel } from '../types/chess.types';
import { getOpeningMove } from '../utils/openingBook';



// ── Local fallback engine (runs the minimax above, off the render path) ───────
// Used when the real Stockfish worker can't load (offline, CDN/CSP blocked).
let localWorker: Worker | null = null;
let localWorkerPendingResolve: ((move: string) => void) | null = null;

const initLocalWorker = () => {
  if (!localWorker) {
    try {
      localWorker = new Worker(
        new URL('../workers/minimax.worker.ts', import.meta.url),
        { type: 'module' }
      );
      localWorker.onmessage = (e: MessageEvent) => {
        if (localWorkerPendingResolve) {
          localWorkerPendingResolve(e.data);
          localWorkerPendingResolve = null;
        }
      };
      localWorker.onerror = (e: ErrorEvent) => {
        console.error('[AI] Local fallback worker error:', e);
        if (localWorkerPendingResolve) {
          localWorkerPendingResolve('');
          localWorkerPendingResolve = null;
        }
      };
    } catch (err) {
      console.error('[AI] Could not spawn local minimax worker:', err);
    }
  }
};

const localBestMove = (fen: string, difficulty: DifficultyLevel): Promise<string> =>
  new Promise((resolve) => {
    initLocalWorker();
    if (!localWorker) {
      // Complete fallback if worker creation fails for some reason
      resolve('');
      return;
    }
    
    localWorkerPendingResolve = resolve;
    localWorker.postMessage({ fen, difficulty });
  });

// ── Real Stockfish engine driver (UCI over a Web Worker) ─────────────────────
// Per-difficulty engine strength: UCI Skill Level (0–20) + think time (ms).
const ENGINE_CONFIG: Record<DifficultyLevel, { skill: number; movetime: number }> = {
  beginner: { skill: 0,  movetime: 100 },
  easy:     { skill: 3,  movetime: 200 },
  medium:   { skill: 6,  movetime: 400 },
  hard:     { skill: 10, movetime: 700 },
  expert:   { skill: 16, movetime: 1000 },
  master:   { skill: 20, movetime: 1500 },
};

// Module-level singleton — one engine shared across the app lifetime.
let worker: Worker | null = null;
let engineReady = false;
let engineFailed = false;
let pendingResolve: ((move: string) => void) | null = null;
let readyWaiters: Array<(ok: boolean) => void> = [];
const readyListeners = new Set<(ready: boolean) => void>();

const notifyReady = () => {
  const ok = engineReady && !engineFailed;
  readyListeners.forEach((l) => l(ok));
};

const settleReady = (ok: boolean) => {
  readyWaiters.forEach((w) => w(ok));
  readyWaiters = [];
  notifyReady();
};

const initEngine = () => {
  if (worker || engineFailed) return;
  try {
    worker = new Worker(
      new URL('../workers/stockfish.worker.ts', import.meta.url),
      { type: 'classic' }
    );
  } catch (err) {
    console.warn('[AI] Stockfish worker failed to spawn, using fallback:', err);
    engineFailed = true;
    settleReady(false);
    return;
  }

  worker.onmessage = (e: MessageEvent) => {
    const line = typeof e.data === 'string' ? e.data : '';
    if (!line) return;

    if (line.startsWith('error')) {
      engineFailed = true;
      settleReady(false);
      return;
    }
    if (line === 'uciok') {
      worker?.postMessage('isready');
      return;
    }
    if (line === 'readyok') {
      engineReady = true;
      settleReady(true);
      return;
    }
    if (line.startsWith('bestmove')) {
      const mv = line.split(/\s+/)[1] ?? '';
      const resolve = pendingResolve;
      pendingResolve = null;
      resolve?.(mv && mv !== '(none)' ? mv : '');
    }
  };

  worker.onerror = (err) => {
    console.warn('[AI] Stockfish worker error, using fallback:', err);
    engineFailed = true;
    settleReady(false);
  };

  worker.postMessage('uci');
};

// Resolve once the engine is ready, or false if it failed / timed out.
const whenEngineReady = (timeoutMs: number): Promise<boolean> => {
  if (engineReady) return Promise.resolve(true);
  if (engineFailed) return Promise.resolve(false);
  return new Promise((resolve) => {
    let done = false;
    const finish = (ok: boolean) => { if (!done) { done = true; resolve(ok); } };
    readyWaiters.push(finish);
    setTimeout(() => finish(engineReady), timeoutMs);
  });
};

// Ask the engine for the best move at the given strength.
const engineBestMove = (
  fen: string,
  skill: number,
  movetime: number
): Promise<string> =>
  new Promise((resolve) => {
    if (!worker || !engineReady) { resolve(''); return; }
    let done = false;
    const finish = (mv: string) => { if (!done) { done = true; resolve(mv); } };
    pendingResolve = finish;
    worker.postMessage('ucinewgame');
    worker.postMessage(`setoption name Skill Level value ${skill}`);
    worker.postMessage(`position fen ${fen}`);
    worker.postMessage(`go movetime ${movetime}`);
    // Safety net: if no bestmove arrives, give up so we can fall back.
    setTimeout(() => {
      if (!done) { pendingResolve = null; finish(''); }
    }, movetime + 2500);
  });

// ── Main hook ────────────────────────────────────────────────────────────────
export const useStockfish = () => {
  // Reactive flag so the UI can label the opponent honestly (real vs fallback).
  const [isEngineReady, setIsEngineReady] = useState<boolean>(engineReady && !engineFailed);

  useEffect(() => {
    const listener = (ready: boolean) => setIsEngineReady(ready);
    readyListeners.add(listener);
    initEngine(); // idempotent — first mount spins the engine up
    return () => { readyListeners.delete(listener); };
  }, []);

  /**
   * Returns the best move string (e.g. "e2e4", "e7e8q") for the given FEN.
   * Tries the real Stockfish worker first; falls back to the local minimax
   * if the engine is unavailable or doesn't answer in time.
   */
  const getBestMove = useCallback(
    async (fen: string, difficulty: DifficultyLevel): Promise<string> => {
      // 1. Check Opening Book first (fastest, most human-like early game)
      const bookMove = getOpeningMove(fen);
      if (bookMove) {
        return bookMove;
      }

      // 2. Query Engine
      const cfg = ENGINE_CONFIG[difficulty];
      initEngine();

      const ready = await whenEngineReady(2000);
      if (ready) {
        const mv = await engineBestMove(fen, cfg.skill, cfg.movetime);
        if (mv) return mv;
      }
      return localBestMove(fen, difficulty);
    },
    []
  );

  return { getBestMove, isEngineReady };
};

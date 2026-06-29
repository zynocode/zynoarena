import React, { useEffect, useState, useRef } from 'react';

interface TimerProps {
  activeTurn: 'w' | 'b';
  isGameOver: boolean;
  onTimeOut: (loser: 'w' | 'b') => void;
  initialTime?: number;
  increment?: number;
  resetTrigger?: any;
}

export const Timer: React.FC<TimerProps> = ({
  activeTurn,
  isGameOver,
  onTimeOut,
  initialTime = 600,
  increment = 0,
  resetTrigger,
}) => {
  const [timeW, setTimeW] = useState<number>(initialTime);
  const [timeB, setTimeB] = useState<number>(initialTime);

  // Store mutable refs to avoid stale closures inside setInterval
  const activeTurnRef  = useRef<'w' | 'b'>(activeTurn);
  const isGameOverRef  = useRef<boolean>(isGameOver);
  const onTimeOutRef   = useRef<(loser: 'w' | 'b') => void>(onTimeOut);
  const prevTurnRef    = useRef<'w' | 'b'>(activeTurn);
  const intervalRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep refs current on every render
  activeTurnRef.current = activeTurn;
  isGameOverRef.current = isGameOver;
  onTimeOutRef.current  = onTimeOut;

  // ── Reset on new game ─────────────────────────────────────────────────────
  useEffect(() => {
    setTimeW(initialTime);
    setTimeB(initialTime);
    prevTurnRef.current = 'w'; // white always goes first
  }, [resetTrigger, initialTime]);

  // ── Fischer increment: add time to the side that just moved ───────────────
  useEffect(() => {
    if (increment <= 0) return;
    const prev = prevTurnRef.current;
    if (prev !== activeTurn) {
      if (prev === 'w') setTimeW((t) => t + increment);
      else              setTimeB((t) => t + increment);
    }
    prevTurnRef.current = activeTurn;
  }, [activeTurn, increment]);

  // ── Single persistent ticker — reads activeTurnRef, never stale ──────────
  // BUG FIX: one interval for the whole game lifetime, reads ref each tick.
  // Old code re-created interval on every turn change → 1s gap where wrong
  // player was being timed.
  useEffect(() => {
    const tick = () => {
      if (isGameOverRef.current) return;
      const who = activeTurnRef.current;
      if (who === 'w') {
        setTimeW((prev) => {
          if (prev <= 1) {
            onTimeOutRef.current('w');
            return 0;
          }
          return prev - 1;
        });
      } else {
        setTimeB((prev) => {
          if (prev <= 1) {
            onTimeOutRef.current('b');
            return 0;
          }
          return prev - 1;
        });
      }
    };

    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []); // ← runs once; all dynamic values come from refs

  // Stop interval when game is over
  useEffect(() => {
    if (isGameOver && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [isGameOver]);

  // ── Formatting ────────────────────────────────────────────────────────────
  const fmt = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isLow = (t: number) => t <= 30;

  const clockStyle = (active: boolean, low: boolean): React.CSSProperties => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: active
      ? low ? 'rgba(239, 68, 68, 0.12)' : 'rgba(99, 102, 241, 0.15)'
      : 'rgba(255, 255, 255, 0.02)',
    border: `1px solid ${active
      ? low ? 'rgba(239, 68, 68, 0.45)' : 'rgba(99, 102, 241, 0.35)'
      : 'rgba(255, 255, 255, 0.05)'}`,
    borderRadius: '10px',
    padding: '6px 14px',
    transition: 'all 0.3s ease',
  });

  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center', margin: '4px 0' }}>
      {/* White Clock */}
      <div style={clockStyle(activeTurn === 'w', isLow(timeW))}>
        <span style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>White</span>
        <span style={{
          fontSize: '20px',
          fontFamily: 'monospace',
          fontWeight: 700,
          color: isLow(timeW) ? '#ef4444' : '#e2e8f0',
          textShadow: isLow(timeW) ? '0 0 10px rgba(239,68,68,0.5)' : 'none',
          letterSpacing: '1px',
        }}>
          {fmt(timeW)}
        </span>
        {increment > 0 && <span style={{ fontSize: '8px', color: '#475569', marginTop: '1px' }}>+{increment}s</span>}
      </div>

      <div style={{ fontSize: '11px', color: '#475569', fontWeight: 700 }}>VS</div>

      {/* Black Clock */}
      <div style={clockStyle(activeTurn === 'b', isLow(timeB))}>
        <span style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Black</span>
        <span style={{
          fontSize: '20px',
          fontFamily: 'monospace',
          fontWeight: 700,
          color: isLow(timeB) ? '#ef4444' : '#e2e8f0',
          textShadow: isLow(timeB) ? '0 0 10px rgba(239,68,68,0.5)' : 'none',
          letterSpacing: '1px',
        }}>
          {fmt(timeB)}
        </span>
        {increment > 0 && <span style={{ fontSize: '8px', color: '#475569', marginTop: '1px' }}>+{increment}s</span>}
      </div>
    </div>
  );
};

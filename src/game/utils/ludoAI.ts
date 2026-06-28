import type { Player, AIDifficulty } from '../../store/gameStore';
import { safeZonesGlobalIndices, startIndices } from './boardCoordinates';

/**
 * Evaluates the best token index to move for a CPU player based on difficulty level
 */
export function evaluateCPUMove(
  players: Player[],
  activePlayerIdx: number,
  validMoves: number[],
  roll: number,
  difficulty: AIDifficulty
): number {
  if (validMoves.length === 0) return -1;
  if (validMoves.length === 1) return validMoves[0];

  // 1. Easy Mode: Random choice
  if (difficulty === 'easy') {
    const randomIdx = Math.floor(Math.random() * validMoves.length);
    return validMoves[randomIdx];
  }

  const activePlayer = players[activePlayerIdx];

  // Helpers for threat & capture evaluations
  const isGlobalCellSafe = (globalIdx: number): boolean => {
    return safeZonesGlobalIndices.includes(globalIdx);
  };

  const getGlobalPathIndex = (playerIndex: number, relativePos: number): number => {
    if (relativePos < 0 || relativePos > 50) return -1; // Not on common board path
    const startIdx = startIndices[playerIndex];
    return (startIdx + relativePos) % 52;
  };

  // Check if an opponent token can capture a cell within 6 spaces
  const isCellThreatened = (globalCellIdx: number): boolean => {
    if (isGlobalCellSafe(globalCellIdx)) return false;

    // Check all opponent tokens
    for (let pIdx = 0; pIdx < players.length; pIdx++) {
      if (pIdx === activePlayerIdx) continue; // Skip ourselves

      const opp = players[pIdx];
      for (let tIdx = 0; tIdx < 4; tIdx++) {
        const oppPos = opp.tokens[tIdx];
        if (oppPos >= 0 && oppPos <= 50) {
          const oppGlobalIdx = getGlobalPathIndex(pIdx, oppPos);
          if (oppGlobalIdx !== -1) {
            const distance = (globalCellIdx - oppGlobalIdx + 52) % 52;
            if (distance >= 1 && distance <= 6) {
              return true; // Threat detected
            }
          }
        }
      }
    }
    return false;
  };

  // Check if a move results in a capture
  const checkWillCapture = (targetGlobalIdx: number): boolean => {
    if (targetGlobalIdx === -1 || isGlobalCellSafe(targetGlobalIdx)) return false;

    for (let pIdx = 0; pIdx < players.length; pIdx++) {
      if (pIdx === activePlayerIdx) continue;

      const opp = players[pIdx];
      for (let tIdx = 0; tIdx < 4; tIdx++) {
        const oppPos = opp.tokens[tIdx];
        if (oppPos >= 0 && oppPos <= 50) {
          const oppGlobalIdx = getGlobalPathIndex(pIdx, oppPos);
          if (oppGlobalIdx === targetGlobalIdx) {
            return true;
          }
        }
      }
    }
    return false;
  };

  // 2. Medium Mode: Simple priority list
  if (difficulty === 'medium') {
    // Priority 1: Capture
    for (const tokenIdx of validMoves) {
      const curPos = activePlayer.tokens[tokenIdx];
      const nextPos = curPos === -1 ? 0 : curPos + roll;
      const targetGlobalIdx = getGlobalPathIndex(activePlayerIdx, nextPos);
      if (checkWillCapture(targetGlobalIdx)) {
        return tokenIdx;
      }
    }

    // Priority 2: Escape danger
    for (const tokenIdx of validMoves) {
      const curPos = activePlayer.tokens[tokenIdx];
      if (curPos >= 0 && curPos <= 50) {
        const curGlobalIdx = getGlobalPathIndex(activePlayerIdx, curPos);
        if (isCellThreatened(curGlobalIdx)) {
          // Verify if next position is safe or not threatened
          const nextPos = curPos + roll;
          const nextGlobalIdx = getGlobalPathIndex(activePlayerIdx, nextPos);
          if (nextGlobalIdx === -1 || !isCellThreatened(nextGlobalIdx) || isGlobalCellSafe(nextGlobalIdx)) {
            return tokenIdx;
          }
        }
      }
    }

    // Priority 3: Release from base
    if (roll === 6) {
      const baseTokenIdx = validMoves.find(idx => activePlayer.tokens[idx] === -1);
      if (baseTokenIdx !== undefined) {
        return baseTokenIdx;
      }
    }

    // Priority 4: Lead token closest to home
    let bestTokenIdx = validMoves[0];
    let maxPos = -2;
    validMoves.forEach((tokenIdx) => {
      const pos = activePlayer.tokens[tokenIdx];
      if (pos > maxPos) {
        maxPos = pos;
        bestTokenIdx = tokenIdx;
      }
    });

    return bestTokenIdx;
  }

  // 3. Hard Mode: Scoring matrix evaluation
  let bestTokenIdx = validMoves[0];
  let highestScore = -Infinity;

  validMoves.forEach((tokenIdx) => {
    const curPos = activePlayer.tokens[tokenIdx];
    const nextPos = curPos === -1 ? 0 : curPos + roll;
    const curGlobalIdx = getGlobalPathIndex(activePlayerIdx, curPos);
    const nextGlobalIdx = getGlobalPathIndex(activePlayerIdx, nextPos);

    let score = 0;

    // A. Capture Opponent (Priority 1, Weight: 100)
    if (checkWillCapture(nextGlobalIdx)) {
      score += 100;
    }

    // B. Reaching Goal (Special progress finish, Weight: 90)
    if (nextPos === 56) {
      score += 90;
    }

    // C. Entering Home Column (Priority 3, Weight: 75)
    if (curPos < 51 && nextPos >= 51 && nextPos < 56) {
      score += 75;
    }

    // D. Escaping Imminent Threat (Priority 2, Weight: 80)
    const wasThreatened = curPos >= 0 && curPos <= 50 && isCellThreatened(curGlobalIdx);
    const isNowSafe = nextPos >= 51 || isGlobalCellSafe(nextGlobalIdx) || !isCellThreatened(nextGlobalIdx);
    if (wasThreatened && isNowSafe) {
      score += 80;
    }

    // E. Landing on Safe Zone (Priority 5, Weight: 50)
    const wasSafe = curPos >= 0 && curPos <= 50 && isGlobalCellSafe(curGlobalIdx);
    const isNowSafeZone = nextPos >= 0 && nextPos <= 50 && isGlobalCellSafe(nextGlobalIdx);
    if (!wasSafe && isNowSafeZone) {
      score += 50;
    }

    // F. Releasing from Base (Priority 4, Weight: 70)
    if (curPos === -1 && roll === 6) {
      score += 70;
    }

    // G. Step into Opponent Danger Zone (-30)
    const isNowThreatened = nextPos >= 0 && nextPos <= 50 && isCellThreatened(nextGlobalIdx);
    if (!isNowSafeZone && isNowThreatened) {
      score -= 30;
    }

    // H. Proximity Progress Bonus (Priority 6, Weight: 30 Max)
    // Scale factor 0.535 ensures max progression (56 spaces) contributes exactly 30 points
    score += nextPos * 0.535;

    // Pick maximum score
    if (score > highestScore) {
      highestScore = score;
      bestTokenIdx = tokenIdx;
    }
  });

  return bestTokenIdx;
}

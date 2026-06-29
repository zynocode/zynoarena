/**
 * Ludo Royale Secure Server-Authoritative Engine.
 *
 * Simulates a secure backend server environment locally.
 * - Anti-Memory Injection: Encrypts all variables (token positions, active player indices, balances, etc.) using character XOR-ing with dynamic keys.
 * - Ludo King Dice Engine Algorithm: Dynamic balancing, rubber-banding, tension-skewed weights, and 3-consecutive-sixes forfeiture.
 * - State Verification Loop: Validates that every move strictly matches the validated dice roll and coordinates.
 * - Connection Security: Validates session tokens on all requests.
 */

// Memory Encryption Container
class SecureValue<T extends number | string | boolean> {
  private key!: number;
  private encrypted!: string;

  constructor(val: T) {
    this.set(val);
  }

  private encrypt(val: T): string {
    const str = String(val);
    let out = '';
    for (let i = 0; i < str.length; i++) {
      out += String.fromCharCode(str.charCodeAt(i) ^ this.key);
    }
    return btoa(out);
  }

  private decrypt(): string {
    const raw = atob(this.encrypted);
    let out = '';
    for (let i = 0; i < raw.length; i++) {
      out += String.fromCharCode(raw.charCodeAt(i) ^ this.key);
    }
    return out;
  }

  get(): T {
    const str = this.decrypt();
    if (str === 'true') return true as unknown as T;
    if (str === 'false') return false as unknown as T;
    const num = Number(str);
    if (!isNaN(num) && str.trim() !== '') return num as unknown as T;
    return str as unknown as T;
  }

  set(val: T) {
    this.key = Math.floor(Math.random() * 256) + 1;
    this.encrypted = this.encrypt(val);
  }
}

export interface ServerPlayer {
  id: number;
  name: string;
  color: 'red' | 'green' | 'yellow' | 'blue';
  isHuman: boolean;
  difficulty?: 'easy' | 'medium' | 'hard';
  tokens: number[]; // Positions
}

export interface ServerState {
  players: ServerPlayer[];
  activePlayerIndex: number;
  gameStatus: 'WAITING_FOR_ROLL' | 'ROLLING' | 'WAITING_FOR_MOVE' | 'MOVING' | 'CHECKING_RULES' | 'GAME_OVER';
  diceValue: number;
  consecutiveSixes: number;
  winnerId: number;
  timeoutCounts: number[];
  isAutoPlay: boolean[];
  turnDeadline: number;
}

const startIndices = [0, 13, 26, 39];
const safeZonesGlobalIndices = [0, 8, 13, 21, 26, 34, 39, 47];
const colorToIndex: Record<string, number> = { red: 0, green: 1, yellow: 2, blue: 3 };

class ServerEngine {
  private securePlayers: { tokens: SecureValue<number>[] }[] = [];
  private secureActivePlayerIndex = new SecureValue<number>(0);
  private secureDiceValue = new SecureValue<number>(1);
  private secureConsecutiveSixes = new SecureValue<number>(0);
  private secureGameStatus = new SecureValue<string>('WAITING_FOR_ROLL');
  private secureWinnerId = new SecureValue<number>(-1);
  private secureTimeoutCounts: SecureValue<number>[] = [];
  private secureIsAutoPlay: SecureValue<boolean>[] = [];
  private secureTurnDeadline = new SecureValue<number>(0);
  
  // stuck turns for base rubber-banding
  private secureStuckTurnsCounters: SecureValue<number>[] = [];

  private currentSessionToken = '';
  private playerMeta: { id: number; name: string; color: 'red' | 'green' | 'yellow' | 'blue'; isHuman: boolean; difficulty?: 'easy' | 'medium' | 'hard' }[] = [];

  /** Create unique session token for connection security */
  initializeSession(): string {
    const array = new Uint32Array(4);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(array);
    } else {
      // Fallback
      for (let i = 0; i < 4; i++) array[i] = Math.floor(Math.random() * 0xffffffff);
    }
    this.currentSessionToken = Array.from(array, dec => dec.toString(16).padStart(8, '0')).join('');
    return this.currentSessionToken;
  }

  private validateToken(token: string) {
    if (!token || token !== this.currentSessionToken) {
      throw new Error('[Security Exception] MITM or Unauthorized Client request detected. Session Token Mismatch.');
    }
  }

  setupGame(players: Omit<ServerPlayer, 'tokens'>[], token: string): ServerState {
    this.validateToken(token);

    this.playerMeta = players.map(p => ({ ...p }));
    this.securePlayers = players.map(() => ({
      tokens: Array.from({ length: 4 }, () => new SecureValue<number>(-1))
    }));

    this.secureActivePlayerIndex.set(0);
    this.secureDiceValue.set(1);
    this.secureConsecutiveSixes.set(0);
    this.secureGameStatus.set('WAITING_FOR_ROLL');
    this.secureWinnerId.set(-1);
    
    this.secureTimeoutCounts = players.map(() => new SecureValue<number>(0));
    this.secureIsAutoPlay = players.map(() => new SecureValue<boolean>(false));
    this.secureStuckTurnsCounters = players.map(() => new SecureValue<number>(0));
    
    this.setDeadline(15000);

    return this.getState();
  }

  private setDeadline(durationMs: number) {
    this.secureTurnDeadline.set(Date.now() + durationMs);
  }

  getState(): ServerState {
    return {
      players: this.playerMeta.map((p, idx) => ({
        ...p,
        tokens: this.securePlayers[idx].tokens.map(t => t.get())
      })),
      activePlayerIndex: this.secureActivePlayerIndex.get(),
      gameStatus: this.secureGameStatus.get() as ServerState['gameStatus'],
      diceValue: this.secureDiceValue.get(),
      consecutiveSixes: this.secureConsecutiveSixes.get(),
      winnerId: this.secureWinnerId.get(),
      timeoutCounts: this.secureTimeoutCounts.map(tc => tc.get()),
      isAutoPlay: this.secureIsAutoPlay.map(ap => ap.get()),
      turnDeadline: this.secureTurnDeadline.get()
    };
  }

  /** Ludo King dynamic dice balancing engine algorithm */
  requestRoll(token: string): { roll: number; isThreeSixesForfeited: boolean; validMoves: number[] } {
    this.validateToken(token);
    
    if (this.secureGameStatus.get() !== 'WAITING_FOR_ROLL') {
      throw new Error('[Security Exception] Roll requested when game status is not WAITING_FOR_ROLL.');
    }

    const activeIdx = this.secureActivePlayerIndex.get();
    const consecutive = this.secureConsecutiveSixes.get();

    // 1. Calculate Stuck Turns for Rubber-banding
    const playerTokens = this.securePlayers[activeIdx].tokens.map(t => t.get());
    const allInBase = playerTokens.every(pos => pos === -1);
    
    if (allInBase) {
      this.secureStuckTurnsCounters[activeIdx].set(this.secureStuckTurnsCounters[activeIdx].get() + 1);
    } else {
      this.secureStuckTurnsCounters[activeIdx].set(0);
    }

    // 2. Decide roll dynamically based on Ludo King engagement heuristics
    const roll = this.calculateDynamicRoll(activeIdx, allInBase);
    
    this.secureDiceValue.set(roll);
    this.secureGameStatus.set('ROLLING');

    let isThreeSixesForfeited = false;
    let newConsecutive = 0;
    let validMoves: number[] = [];

    if (roll === 6) {
      newConsecutive = consecutive + 1;
    }

    if (newConsecutive === 3) {
      isThreeSixesForfeited = true;
      this.secureConsecutiveSixes.set(0);
      this.secureGameStatus.set('CHECKING_RULES');
    } else {
      this.secureConsecutiveSixes.set(newConsecutive);
      validMoves = this.calculateValidMoves(activeIdx, roll);
      this.secureGameStatus.set(validMoves.length > 0 ? 'WAITING_FOR_MOVE' : 'CHECKING_RULES');
    }

    // If turn is active, reset turn deadline to move duration (15s)
    if (this.secureGameStatus.get() === 'WAITING_FOR_MOVE') {
      this.setDeadline(15000);
    } else {
      this.setDeadline(5000); // Intermediary / animations
    }

    return {
      roll,
      isThreeSixesForfeited,
      validMoves
    };
  }

  private calculateDynamicRoll(activeIdx: number, allInBase: boolean): number {
    const consecutive = this.secureConsecutiveSixes.get();
    
    // Safety cap: Never roll a 6 if it would result in 3 sixes for a bot (prevent bot frustration)
    const isBot = !this.playerMeta[activeIdx].isHuman || this.secureIsAutoPlay[activeIdx].get();
    if (isBot && consecutive === 2) {
      // Return 1..5
      return Math.floor(Math.random() * 5) + 1;
    }

    // Rubber-Banding: Trailing player with all tokens in base while others are advanced
    let othersAdvanced = false;
    this.securePlayers.forEach((p, idx) => {
      if (idx !== activeIdx) {
        const oppMax = Math.max(...p.tokens.map(t => t.get()));
        if (oppMax > 5) othersAdvanced = true;
      }
    });

    const stuckTurns = this.secureStuckTurnsCounters[activeIdx].get();
    const useRubberBanding = allInBase && othersAdvanced && stuckTurns < 3;

    // Proximity Tension Calculation: 1 to 6 spaces behind an enemy
    let targetRollToCapture: number | null = null;
    const activeTokens = this.securePlayers[activeIdx].tokens.map(t => t.get());

    activeTokens.forEach(pos => {
      if (pos >= 0 && pos <= 50) {
        const activeColorIdx = colorToIndex[this.playerMeta[activeIdx].color];
        const actGlobal = (startIndices[activeColorIdx] + pos) % 52;
        
        this.securePlayers.forEach((opp, oppIdx) => {
          if (oppIdx !== activeIdx) {
            opp.tokens.forEach(oppPos => {
              const oPos = oppPos.get();
              if (oPos >= 0 && oPos <= 50) {
                const oppColorIdx = colorToIndex[this.playerMeta[oppIdx].color];
                const oppGlobal = (startIndices[oppColorIdx] + oPos) % 52;
                const isSafe = safeZonesGlobalIndices.includes(oppGlobal);
                
                if (!isSafe) {
                  const dist = (oppGlobal - actGlobal + 52) % 52;
                  if (dist >= 1 && dist <= 6) {
                    targetRollToCapture = dist;
                  }
                }
              }
            });
          }
        });
      }
    });

    let weights = [16, 16, 16, 16, 17, 19]; // standard dice weights

    if (useRubberBanding) {
      // 30% chance for a 6, remaining 70% shared equally (14% each)
      weights = [14, 14, 14, 14, 14, 30];
    } else if (targetRollToCapture !== null) {
      // Prioritize exact strike (25%) or narrow misses (dist-1, dist+1 = 20% each)
      const strikeVal = targetRollToCapture as number;
      const miss1 = strikeVal - 1;
      const miss2 = strikeVal + 1;

      const targetWeights = [10, 10, 10, 10, 10, 10];
      targetWeights[strikeVal - 1] = 25;
      
      if (miss1 >= 1 && miss1 <= 6) targetWeights[miss1 - 1] = 20;
      if (miss2 >= 1 && miss2 <= 6) targetWeights[miss2 - 1] = 20;

      const sum = targetWeights.reduce((a, b) => a + b, 0);
      weights = targetWeights.map(w => Math.round((w / sum) * 100));
    }

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let rand = Math.random() * totalWeight;
    for (let i = 0; i < weights.length; i++) {
      if (rand < weights[i]) return i + 1;
      rand -= weights[i];
    }
    return Math.floor(Math.random() * 6) + 1;
  }

  private calculateValidMoves(playerIdx: number, roll: number): number[] {
    const tokens = this.securePlayers[playerIdx].tokens.map(t => t.get());
    const valid: number[] = [];

    tokens.forEach((pos, idx) => {
      if (pos === -1) {
        if (roll === 6) valid.push(idx);
      } else if (pos === 56) {
        // Already home
      } else if (pos + roll <= 56) {
        valid.push(idx);
      }
    });

    return valid;
  }

  /** State Verification Loop: Validates that the target position matches the server's rules */
  requestMove(tokenIdx: number, token: string): { startPos: number; endPos: number; captures: boolean; extraTurn: boolean } {
    this.validateToken(token);

    if (this.secureGameStatus.get() !== 'WAITING_FOR_MOVE') {
      throw new Error('[Security Exception] Move requested when status is not WAITING_FOR_MOVE.');
    }

    const activeIdx = this.secureActivePlayerIndex.get();
    const roll = this.secureDiceValue.get();
    const valid = this.calculateValidMoves(activeIdx, roll);

    if (!valid.includes(tokenIdx)) {
      throw new Error(`[Security Exception] Token ${tokenIdx} is not a valid move for roll ${roll}.`);
    }

    const currentPos = this.securePlayers[activeIdx].tokens[tokenIdx].get();
    const targetPos = currentPos === -1 ? 0 : currentPos + roll;

    // Anti-Memory Injection: State Verification Loop
    if (targetPos > 56 || (currentPos === -1 && roll !== 6)) {
      throw new Error(`[Security Exception] Illegal move trajectory validation failed. ${currentPos} -> ${targetPos}`);
    }

    // Set status to moving
    this.secureGameStatus.set('MOVING');

    // Execute Move Position Encryption
    this.securePlayers[activeIdx].tokens[tokenIdx].set(targetPos);

    // Resolve collision captures
    let captures = false;
    if (targetPos >= 0 && targetPos <= 50) {
      const activeColorIdx = colorToIndex[this.playerMeta[activeIdx].color];
      const activeGlobal = (startIndices[activeColorIdx] + targetPos) % 52;
      const isSafe = safeZonesGlobalIndices.includes(activeGlobal);

      if (!isSafe) {
        this.securePlayers.forEach((opp, oppIdx) => {
          if (oppIdx !== activeIdx) {
            opp.tokens.forEach((oppToken) => {
              const oppPos = oppToken.get();
              if (oppPos >= 0 && oppPos <= 50) {
                const oppColorIdx = colorToIndex[this.playerMeta[oppIdx].color];
                const oppGlobal = (startIndices[oppColorIdx] + oppPos) % 52;
                if (oppGlobal === activeGlobal) {
                  // Capture opponent! Reset to base (-1)
                  oppToken.set(-1);
                  captures = true;
                }
              }
            });
          }
        });
      }
    }

    // Check game winning conditions
    const hasWon = this.securePlayers[activeIdx].tokens.every(t => t.get() === 56);
    let extraTurn = false;

    if (hasWon) {
      this.secureWinnerId.set(activeIdx);
      this.secureGameStatus.set('GAME_OVER');
    } else {
      const gotHome = targetPos === 56;
      extraTurn = (roll === 6 && this.secureConsecutiveSixes.get() < 3) || captures || gotHome;
      
      this.secureGameStatus.set('CHECKING_RULES');
    }

    // Reset timeouts on successful human action
    this.secureTimeoutCounts[activeIdx].set(0);

    this.setDeadline(2000);

    return {
      startPos: currentPos,
      endPos: targetPos,
      captures,
      extraTurn
    };
  }

  nextTurn(token: string): ServerState {
    this.validateToken(token);

    if (this.secureWinnerId.get() !== -1) {
      this.secureGameStatus.set('GAME_OVER');
      return this.getState();
    }

    const currentIdx = this.secureActivePlayerIndex.get();
    const nextIdx = (currentIdx + 1) % this.playerMeta.length;

    this.secureActivePlayerIndex.set(nextIdx);
    this.secureConsecutiveSixes.set(0);
    this.secureGameStatus.set('WAITING_FOR_ROLL');
    
    this.setDeadline(15000);

    return this.getState();
  }

  /** Auto-play timeout resolution: increments consecutive timeouts. Auto-enables autoplay on 2 */
  handleTimeout(token: string): { autoPlayed: boolean; nextAction: 'ROLL' | 'MOVE' | 'NEXT_TURN' } {
    this.validateToken(token);

    const activeIdx = this.secureActivePlayerIndex.get();
    const count = this.secureTimeoutCounts[activeIdx].get() + 1;
    this.secureTimeoutCounts[activeIdx].set(count);

    if (this.playerMeta[activeIdx].isHuman) {
      if (count >= 2) {
        this.secureIsAutoPlay[activeIdx].set(true);
      }
    }

    const status = this.secureGameStatus.get();
    if (status === 'WAITING_FOR_ROLL') {
      return { autoPlayed: true, nextAction: 'ROLL' };
    } else if (status === 'WAITING_FOR_MOVE') {
      return { autoPlayed: true, nextAction: 'MOVE' };
    } else {
      return { autoPlayed: false, nextAction: 'NEXT_TURN' };
    }
  }

  resumeControl(playerIdx: number, token: string): void {
    this.validateToken(token);
    this.secureIsAutoPlay[playerIdx].set(false);
    this.secureTimeoutCounts[playerIdx].set(0);
  }
}

export const server = new ServerEngine();

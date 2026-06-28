import { create } from 'zustand';
import { getTokenGridCoordinates, safeZonesGlobalIndices } from '../game/utils/boardCoordinates';

export type GameScreen = 'MENU' | 'SETUP' | 'PLAYING' | 'GAME_OVER';
export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';
export type AIDifficulty = 'easy' | 'medium' | 'hard';

export interface Player {
  id: number; // 0 to 3
  name: string;
  color: PlayerColor;
  isHuman: boolean;
  difficulty?: AIDifficulty;
  tokens: number[]; // -1 for base, 0..50 for main path, 51..55 for home stretch, 56 for finished
}

export interface ConfiguredPlayer {
  name: string;
  isHuman: boolean;
  color: PlayerColor;
  difficulty?: AIDifficulty;
}

export type GameStatus = 'WAITING_FOR_ROLL' | 'ROLLING' | 'WAITING_FOR_MOVE' | 'MOVING' | 'CHECKING_RULES' | 'GAME_OVER';

export interface MovingTokenInfo {
  playerIdx: number;
  tokenIdx: number;
  startPos: number;
  endPos: number;
}

export type ActionNotice = 'NONE' | 'CAPTURE' | 'SIX_EXTRA' | 'THREE_SIXES' | 'NO_MOVES';

interface GameState {
  currentScreen: GameScreen;
  players: Player[];
  activePlayerIndex: number;
  gameStatus: GameStatus;
  diceValue: number;
  consecutiveSixes: number;
  winner: Player | null;
  mute: boolean;
  validMoves: number[]; // Valid token indices for active player
  movingTokenInfo: MovingTokenInfo | null;
  lastActionNotice: ActionNotice;
  lastMatchConfig: ConfiguredPlayer[];
  
  // Actions
  setScreen: (screen: GameScreen) => void;
  setupGame: (configuredPlayers: ConfiguredPlayer[]) => void;
  setGameStatus: (status: GameStatus) => void;
  setDiceValue: (val: number) => void;
  incrementConsecutiveSixes: () => void;
  resetConsecutiveSixes: () => void;
  rollDice: () => void;
  selectToken: (tokenIdx: number) => void;
  completeMove: () => void;
  nextTurn: () => void;
  setWinner: (player: Player) => void;
  toggleMute: () => void;
  resetGame: () => void;
  getValidMoves: (playerIdx: number, roll: number) => number[];
}


export const useGameStore = create<GameState>((set, get) => ({
  currentScreen: 'MENU',
  players: [],
  activePlayerIndex: 0,
  gameStatus: 'WAITING_FOR_ROLL',
  diceValue: 1,
  consecutiveSixes: 0,
  winner: null,
  mute: false,
  validMoves: [],
  movingTokenInfo: null,
  lastActionNotice: 'NONE',
  lastMatchConfig: [],

  setScreen: (screen) => set({ currentScreen: screen }),
  
  setupGame: (configuredPlayers) => {
    const finalPlayers: Player[] = configuredPlayers.map((cp, idx) => ({
      id: idx,
      name: cp.name.trim() || (cp.isHuman ? `Player ${idx + 1}` : `CPU ${idx + 1}`),
      color: cp.color,
      isHuman: cp.isHuman,
      difficulty: cp.difficulty,
      tokens: [-1, -1, -1, -1],
    }));

    set({
      players: finalPlayers,
      lastMatchConfig: configuredPlayers,
      activePlayerIndex: 0,
      gameStatus: 'WAITING_FOR_ROLL',
      diceValue: 1,
      consecutiveSixes: 0,
      winner: null,
      validMoves: [],
      movingTokenInfo: null,
      lastActionNotice: 'NONE',
      currentScreen: 'PLAYING',
    });
  },

  setGameStatus: (status) => set({ gameStatus: status }),
  setDiceValue: (val) => set({ diceValue: val }),
  incrementConsecutiveSixes: () => set((state) => ({ consecutiveSixes: state.consecutiveSixes + 1 })),
  resetConsecutiveSixes: () => set({ consecutiveSixes: 0 }),
  
  getValidMoves: (playerIdx, roll) => {
    const player = get().players[playerIdx];
    if (!player) return [];
    
    const valid: number[] = [];
    player.tokens.forEach((pos, idx) => {
      if (pos === -1) {
        if (roll === 6) valid.push(idx);
      } 
      else if (pos === 56) {
        // Already home
      } 
      else if (pos + roll <= 56) {
        valid.push(idx);
      }
    });

    return valid;
  },

  rollDice: () => {
    const { activePlayerIndex, consecutiveSixes, getValidMoves } = get();
    
    set({ gameStatus: 'ROLLING', lastActionNotice: 'NONE' });
    
    const roll = Math.floor(Math.random() * 6) + 1;
    
    let newConsecutive = 0;
    if (roll === 6) {
      newConsecutive = consecutiveSixes + 1;
    }

    setTimeout(() => {
      if (newConsecutive === 3) {
        set({
          diceValue: roll,
          consecutiveSixes: 0,
          validMoves: [],
          lastActionNotice: 'THREE_SIXES',
          gameStatus: 'CHECKING_RULES'
        });
        
        setTimeout(() => {
          get().nextTurn();
        }, 1800);
        return;
      }

      const valid = getValidMoves(activePlayerIndex, roll);

      set({
        diceValue: roll,
        consecutiveSixes: newConsecutive,
        validMoves: valid,
        lastActionNotice: valid.length === 0 ? 'NO_MOVES' : 'NONE',
        gameStatus: valid.length > 0 ? 'WAITING_FOR_MOVE' : 'CHECKING_RULES'
      });

      if (valid.length === 0) {
        setTimeout(() => {
          get().nextTurn();
        }, 1800);
      }
    }, 600);
  },

  selectToken: (tokenIdx) => {
    const { players, activePlayerIndex, diceValue } = get();
    const activePlayer = players[activePlayerIndex];
    const currentPos = activePlayer.tokens[tokenIdx];
    
    let targetPos = currentPos;
    if (currentPos === -1) {
      targetPos = 0;
    } else {
      targetPos = currentPos + diceValue;
    }

    set({
      gameStatus: 'MOVING',
      validMoves: [],
      movingTokenInfo: {
        playerIdx: activePlayerIndex,
        tokenIdx,
        startPos: currentPos,
        endPos: targetPos
      }
    });
  },

  completeMove: () => {
    const { movingTokenInfo, players, diceValue } = get();
    if (!movingTokenInfo) return;

    const { playerIdx, tokenIdx, endPos } = movingTokenInfo;
    
    const updatedPlayers = players.map((p, idx) => {
      if (idx !== playerIdx) return p;
      const updatedTokens = [...p.tokens];
      updatedTokens[tokenIdx] = endPos;
      return { ...p, tokens: updatedTokens };
    });

    const targetCoord = getTokenGridCoordinates(playerIdx, endPos, tokenIdx);
    let capturedOpponent = false;

    const finalPlayers = updatedPlayers.map((p, pIdx) => {
      if (pIdx === playerIdx) return p;

      const updatedTokens = p.tokens.map((pos, tIdx) => {
        if (pos >= 0 && pos <= 50) {
          const coord = getTokenGridCoordinates(pIdx, pos, tIdx);
          
          if (coord.x === targetCoord.x && coord.y === targetCoord.y) {
            const globalIdx = (startIndices[pIdx] + pos) % 52;
            const isSafe = safeZonesGlobalIndices.includes(globalIdx);
            
            if (!isSafe) {
              capturedOpponent = true;
              return -1;
            }
          }
        }
        return pos;
      });

      return { ...p, tokens: updatedTokens };
    });

    const hasWon = finalPlayers[playerIdx].tokens.every(pos => pos === 56);

    if (hasWon) {
      set({
        players: finalPlayers,
        movingTokenInfo: null,
        winner: finalPlayers[playerIdx],
        currentScreen: 'GAME_OVER',
        gameStatus: 'GAME_OVER'
      });
      return;
    }

    const extraTurn = (diceValue === 6 && get().consecutiveSixes < 3) || capturedOpponent;

    set({
      players: finalPlayers,
      movingTokenInfo: null,
      lastActionNotice: capturedOpponent ? 'CAPTURE' : (extraTurn ? 'SIX_EXTRA' : 'NONE'),
      gameStatus: 'CHECKING_RULES'
    });

    setTimeout(() => {
      if (extraTurn) {
        set({ gameStatus: 'WAITING_FOR_ROLL' });
      } else {
        get().nextTurn();
      }
    }, 1200);
  },
  
  nextTurn: () => set((state) => {
    const nextIdx = (state.activePlayerIndex + 1) % state.players.length;
    return {
      activePlayerIndex: nextIdx,
      gameStatus: 'WAITING_FOR_ROLL',
      consecutiveSixes: 0,
      validMoves: [],
      movingTokenInfo: null,
      lastActionNotice: 'NONE'
    };
  }),

  setWinner: (player) => set({ winner: player, currentScreen: 'GAME_OVER' }),
  toggleMute: () => set((state) => ({ mute: !state.mute })),
  
  resetGame: () => set({
    players: [],
    activePlayerIndex: 0,
    gameStatus: 'WAITING_FOR_ROLL',
    diceValue: 1,
    consecutiveSixes: 0,
    winner: null,
    validMoves: [],
    movingTokenInfo: null,
    lastActionNotice: 'NONE',
    currentScreen: 'MENU',
  }),
}));

const startIndices = [0, 13, 26, 39];
export type { GameState };

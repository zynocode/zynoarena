import { create } from 'zustand';
import { safeZonesGlobalIndices } from '../game/utils/boardCoordinates';
import { audio } from '../audio/AudioManager';
import { server } from '../game/serverEngine';

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
  actionLogs: string[];
  
  // Security session & Autoplay States
  sessionToken: string;
  turnTimeLeft: number;
  isAutoPlay: boolean[];

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
  addActionLog: (msg: string) => void;
  resumeControl: (playerIdx: number) => void;
  tickTimer: () => void;
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
  actionLogs: [],
  
  sessionToken: '',
  turnTimeLeft: 15,
  isAutoPlay: [false, false, false, false],

  setScreen: (screen) => set({ currentScreen: screen }),
  
  setupGame: (configuredPlayers) => {
    const token = server.initializeSession();
    const serverPlayersInput = configuredPlayers.map((cp, idx) => ({
      id: idx,
      name: cp.name.trim() || (cp.isHuman ? `Player ${idx + 1}` : `CPU ${idx + 1}`),
      color: cp.color,
      isHuman: cp.isHuman,
      difficulty: cp.difficulty
    }));
    const serverState = server.setupGame(serverPlayersInput, token);

    const finalPlayers: Player[] = serverState.players.map((sp) => ({
      id: sp.id,
      name: sp.name,
      color: sp.color as PlayerColor,
      isHuman: sp.isHuman,
      difficulty: sp.difficulty as AIDifficulty,
      tokens: sp.tokens,
    }));

    set({
      sessionToken: token,
      players: finalPlayers,
      lastMatchConfig: configuredPlayers,
      activePlayerIndex: serverState.activePlayerIndex,
      gameStatus: serverState.gameStatus,
      diceValue: serverState.diceValue,
      consecutiveSixes: serverState.consecutiveSixes,
      winner: null,
      validMoves: [],
      movingTokenInfo: null,
      lastActionNotice: 'NONE',
      currentScreen: 'PLAYING',
      isAutoPlay: serverState.isAutoPlay,
      turnTimeLeft: 15,
      actionLogs: ['📢 Match started! Get ready to roll.'],
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
    const { activePlayerIndex, sessionToken, players } = get();
    const activePlayer = players[activePlayerIndex];
    
    set({ gameStatus: 'ROLLING', lastActionNotice: 'NONE', diceValue: 0 });
    
    const rollResult = server.requestRoll(sessionToken);

    setTimeout(() => {
      get().addActionLog(`🎲 ${activePlayer.name} rolled a ${rollResult.roll}`);

      if (rollResult.isThreeSixesForfeited) {
        get().addActionLog(`⚠️ ${activePlayer.name} rolled three 6s! Turn forfeited.`);
        set({
          diceValue: rollResult.roll,
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

      set({
        diceValue: rollResult.roll,
        consecutiveSixes: rollResult.roll === 6 ? get().consecutiveSixes + 1 : 0,
        validMoves: rollResult.validMoves,
        lastActionNotice: rollResult.validMoves.length === 0 ? 'NO_MOVES' : 'NONE',
        gameStatus: rollResult.validMoves.length > 0 ? 'WAITING_FOR_MOVE' : 'CHECKING_RULES',
        turnTimeLeft: 15
      });

      if (rollResult.validMoves.length === 0) {
        get().addActionLog(`❌ ${activePlayer.name} has no valid moves.`);
        setTimeout(() => {
          get().nextTurn();
        }, 1800);
      }
    }, 600);
  },

  selectToken: (tokenIdx) => {
    const { activePlayerIndex, sessionToken, players } = get();
    const activePlayer = players[activePlayerIndex];
    
    const moveRes = server.requestMove(tokenIdx, sessionToken);

    if (moveRes.startPos === -1) {
      get().addActionLog(`🚀 ${activePlayer.name} released a token to start`);
    } else {
      get().addActionLog(`🏃 ${activePlayer.name} moved a token ${get().diceValue} spaces`);
    }

    set({
      gameStatus: 'MOVING',
      validMoves: [],
      movingTokenInfo: {
        playerIdx: activePlayerIndex,
        tokenIdx,
        startPos: moveRes.startPos,
        endPos: moveRes.endPos
      }
    });
  },

  completeMove: () => {
    const { movingTokenInfo, players } = get();
    if (!movingTokenInfo) return;

    const { playerIdx, endPos } = movingTokenInfo;
    const serverState = server.getState();

    let capturedOpponent = false;
    let capturedPlayerName = 'Opponent';

    const prevOpponentStates = players.map(p => [...p.tokens]);
    serverState.players.forEach((sp, spIdx) => {
      if (spIdx !== playerIdx) {
        sp.tokens.forEach((pos, tIdx) => {
          if (pos === -1 && prevOpponentStates[spIdx][tIdx] !== -1) {
            capturedOpponent = true;
            capturedPlayerName = sp.name;
          }
        });
      }
    });

    if (capturedOpponent) {
      get().addActionLog(`💥 ${serverState.players[playerIdx].name} captured ${capturedPlayerName}!`);
      audio.play('tokenKill');
    }

    const hasWon = serverState.winnerId !== -1;

    if (hasWon) {
      get().addActionLog(`🏆 ${serverState.players[playerIdx].name} has WON the match!`);
      audio.play('gameWin');

      const finalPlayers: Player[] = serverState.players.map((sp) => ({
        id: sp.id,
        name: sp.name,
        color: sp.color as PlayerColor,
        isHuman: sp.isHuman,
        difficulty: sp.difficulty as AIDifficulty,
        tokens: sp.tokens,
      }));

      set({
        players: finalPlayers,
        movingTokenInfo: null,
        winner: finalPlayers[playerIdx],
        currentScreen: 'GAME_OVER',
        gameStatus: 'GAME_OVER'
      });
      return;
    }

    if (endPos === 56) {
      get().addActionLog(`🎉 ${serverState.players[playerIdx].name} got a token home!`);
      audio.play('tokenHome');
    } else if (!capturedOpponent && endPos >= 0 && endPos <= 50) {
      const colorIdx = ['red', 'green', 'yellow', 'blue'].indexOf(players[playerIdx].color);
      const landedGlobalIdx = (startIndices[colorIdx] + endPos) % 52;
      if (safeZonesGlobalIndices.includes(landedGlobalIdx)) {
        audio.play('safeCell');
      }
    }

    const extraTurn = (get().diceValue === 6 && serverState.consecutiveSixes > 0) || capturedOpponent || endPos === 56;

    if (extraTurn) {
      if (capturedOpponent) {
        get().addActionLog(`🔄 ${serverState.players[playerIdx].name} gets an extra turn for capturing!`);
      } else if (endPos === 56) {
        get().addActionLog(`🔄 ${serverState.players[playerIdx].name} gets an extra turn for bringing token home!`);
      } else {
        get().addActionLog(`🔄 ${serverState.players[playerIdx].name} gets an extra turn for rolling a 6!`);
      }
    }

    const finalPlayers: Player[] = serverState.players.map((sp) => ({
      id: sp.id,
      name: sp.name,
      color: sp.color as PlayerColor,
      isHuman: sp.isHuman,
      difficulty: sp.difficulty as AIDifficulty,
      tokens: sp.tokens,
    }));

    set({
      players: finalPlayers,
      movingTokenInfo: null,
      lastActionNotice: capturedOpponent ? 'CAPTURE' : (extraTurn ? 'SIX_EXTRA' : 'NONE'),
      gameStatus: 'CHECKING_RULES'
    });

    setTimeout(() => {
      if (extraTurn) {
        set({ gameStatus: 'WAITING_FOR_ROLL', turnTimeLeft: 15 });
      } else {
        get().nextTurn();
      }
    }, 1200);
  },
  
  nextTurn: () => {
    const { sessionToken } = get();
    const serverState = server.nextTurn(sessionToken);

    const finalPlayers: Player[] = serverState.players.map((sp) => ({
      id: sp.id,
      name: sp.name,
      color: sp.color as PlayerColor,
      isHuman: sp.isHuman,
      difficulty: sp.difficulty as AIDifficulty,
      tokens: sp.tokens,
    }));

    set({
      players: finalPlayers,
      activePlayerIndex: serverState.activePlayerIndex,
      gameStatus: serverState.gameStatus,
      consecutiveSixes: serverState.consecutiveSixes,
      validMoves: [],
      movingTokenInfo: null,
      lastActionNotice: 'NONE',
      turnTimeLeft: 15
    });
  },

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
    actionLogs: [],
    sessionToken: '',
    turnTimeLeft: 15,
    isAutoPlay: [false, false, false, false],
  }),

  addActionLog: (msg) => set((state) => ({
    actionLogs: [msg, ...state.actionLogs].slice(0, 15)
  })),

  resumeControl: (playerIdx) => {
    const { sessionToken } = get();
    server.resumeControl(playerIdx, sessionToken);
    const serverState = server.getState();
    set({
      isAutoPlay: serverState.isAutoPlay
    });
    get().addActionLog(`🎮 ${serverState.players[playerIdx].name} resumed control.`);
  },

  tickTimer: () => {
    const { gameStatus, sessionToken, activePlayerIndex, players, selectToken } = get();
    if (gameStatus !== 'WAITING_FOR_ROLL' && gameStatus !== 'WAITING_FOR_MOVE') return;

    const newTime = get().turnTimeLeft - 1;
    if (newTime > 0) {
      set({ turnTimeLeft: newTime });
      return;
    }

    // Time ran out!
    get().addActionLog(`⏱️ Time's up for ${players[activePlayerIndex].name}!`);
    const timeoutRes = server.handleTimeout(sessionToken);
    const serverState = server.getState();

    set({
      isAutoPlay: serverState.isAutoPlay,
      turnTimeLeft: 15
    });

    if (serverState.isAutoPlay[activePlayerIndex] && players[activePlayerIndex].isHuman) {
      get().addActionLog(`⚠️ Auto-play activated for ${players[activePlayerIndex].name}!`);
    }

    // Perform autoplay next steps
    if (timeoutRes.autoPlayed) {
      if (timeoutRes.nextAction === 'ROLL') {
        get().rollDice();
      } else if (timeoutRes.nextAction === 'MOVE') {
        const rollRes = serverState.diceValue;
        const valid = serverState.players[activePlayerIndex].tokens.map((pos, idx) => {
          if (pos === -1) {
            if (rollRes === 6) return idx;
          } else if (pos === 56) {
            // home
          } else if (pos + rollRes <= 56) {
            return idx;
          }
          return -1;
        }).filter(idx => idx !== -1);

        if (valid.length > 0) {
          // Weighted choice: prioritize tokens closer to home stretch, or releasing a token
          let bestIdx = valid[0];
          let maxPos = -2;
          valid.forEach(idx => {
            const pos = serverState.players[activePlayerIndex].tokens[idx];
            if (pos > maxPos) {
              maxPos = pos;
              bestIdx = idx;
            }
          });
          selectToken(bestIdx);
        } else {
          get().nextTurn();
        }
      }
    } else {
      get().nextTurn();
    }
  },
}));

const startIndices = [0, 13, 26, 39];
export type { GameState };

import React, { useState } from 'react';
import { useChessGame } from '../../hooks/useChessGame';
import { ChessLobby, TIME_CONTROLS } from './ChessLobby';
import { ChessMatch } from './ChessMatch';

export const ChessGame: React.FC<{ onBackToLobby?: () => void }> = ({ onBackToLobby }) => {
  const [screenState, setScreenState] = useState<'menu' | 'playing'>('menu');
  const [selectedTC, setSelectedTC] = useState(TIME_CONTROLS[3]);
  const [resetKey, setResetKey] = useState(0);
  const [timeOutLoser, setTimeOutLoser] = useState<'w' | 'b' | null>(null);

  // The engine
  const botEngineName = 'Stockfish';
  
  // Provide the orchestrator hook
  const chessGameState = useChessGame();

  const formatDiff = (d: string) => d.charAt(0).toUpperCase() + d.slice(1);

  const handleStartGame = () => {
    localStorage.removeItem('zyno-chess-save');
    chessGameState.resetGame();
    if (chessGameState.gameMode === 'ai' && chessGameState.playerColor === 'b') {
      chessGameState.triggerAIMoveAfterStart();
    }
    setResetKey(Date.now());
    setTimeOutLoser(null);
    setScreenState('playing');
  };

  const handleResumeGame = () => {
    const save = chessGameState.getSavedGame();
    if (save) {
      chessGameState.resumeSavedGame(save);
      setScreenState('playing');
    }
  };

  const handlePlayAgain = () => {
    handleStartGame();
  };

  const handleQuitGame = () => {
    setScreenState('menu');
  };

  const handleBackToLobby = () => {
    if (onBackToLobby) {
      onBackToLobby();
    } else {
      window.location.href = '/';
    }
  };

  const getOpponentName = () => {
    if (chessGameState.gameMode === 'local') return 'Player 2';
    return `${botEngineName} Bot (${formatDiff(chessGameState.difficulty)})`;
  };

  const getPlayerName = () => {
    if (chessGameState.gameMode === 'local') return 'Player 1';
    return 'You';
  };

  if (screenState === 'menu') {
    return (
      <div style={containerStyle}>
        <ChessLobby
          selectedMode={chessGameState.gameMode}
          setSelectedMode={chessGameState.setGameMode}
          selectedDifficulty={chessGameState.difficulty}
          setSelectedDifficulty={chessGameState.setDifficulty}
          selectedColor={chessGameState.playerColor}
          setSelectedColor={chessGameState.setPlayerColor}
          selectedTC={selectedTC}
          setSelectedTC={setSelectedTC}
          selectedAutoQueen={chessGameState.autoQueen}
          setSelectedAutoQueen={chessGameState.setAutoQueen}
          savedGame={chessGameState.getSavedGame()}
          botEngineName={botEngineName}
          formatDiff={formatDiff}
          handleResumeGame={handleResumeGame}
          handleStartGame={handleStartGame}
          onBackToLobby={handleBackToLobby}
        />
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <ChessMatch
        gameMode={chessGameState.gameMode}
        selectedColor={chessGameState.playerColor}
        selectedTC={selectedTC}
        opponentName={getOpponentName()}
        playerName={getPlayerName()}
        
        fen={chessGameState.fen}
        history={chessGameState.history}
        isFlipped={chessGameState.isFlipped}
        flipBoard={chessGameState.flipBoard}
        undoMove={chessGameState.undoMove}
        handlePieceDrop={chessGameState.handlePieceDrop}
        captured={chessGameState.captured}
        status={chessGameState.status}
        turn={chessGameState.turn}
        pendingPromotion={chessGameState.pendingPromotion}
        setPendingPromotion={chessGameState.setPendingPromotion}
        executePromotion={chessGameState.executePromotion}
        getPossibleMoves={chessGameState.getPossibleMoves}
        exportPGN={chessGameState.exportPGN}
        canUndo={chessGameState.canUndo}

        handlePlayAgain={handlePlayAgain}
        handleQuitGame={handleQuitGame}
        resetKey={resetKey}
        timeOutLoser={timeOutLoser}
        setTimeOutLoser={setTimeOutLoser}
      />
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  width: '100%',
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
  fontFamily: "'Inter', sans-serif",
  color: '#f8fafc',
  paddingTop: '20px',
  paddingBottom: '40px',
  boxSizing: 'border-box',
  overflowX: 'hidden'
};

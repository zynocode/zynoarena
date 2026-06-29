import { useState, Suspense, lazy } from 'react';
import ArenaPortal from './components/ArenaPortal';

// Lazy load game views to keep initial bundle small
const LudoGameView = lazy(() => import('./components/Ludo/LudoGameView'));
const ChessGame = lazy(() => import('./components/Chess/ChessGame').then(m => ({ default: m.ChessGame })));

export default function App() {
  const [activeGame, setActiveGame] = useState<'ARENA' | 'LUDO' | 'CHESS'>('ARENA');

  if (activeGame === 'CHESS') {
    return (
      <Suspense fallback={<div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', color: '#94a3b8', fontFamily: 'Outfit' }}>Loading Chess Engine...</div>}>
        <ChessGame onBackToLobby={() => setActiveGame('ARENA')} />
      </Suspense>
    );
  }

  if (activeGame === 'LUDO') {
    return (
      <Suspense fallback={<div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', color: '#94a3b8', fontFamily: 'Outfit' }}>Loading Ludo Engine...</div>}>
        <LudoGameView onExit={() => setActiveGame('ARENA')} />
      </Suspense>
    );
  }

  // ARENA (Default)
  return (
    <div className="app-container">
      <div className="bg-animation" />
      <ArenaPortal onSelectGame={(gameId) => {
        if (gameId === 'ludo') setActiveGame('LUDO');
        if (gameId === 'chess') setActiveGame('CHESS');
      }} />
    </div>
  );
}

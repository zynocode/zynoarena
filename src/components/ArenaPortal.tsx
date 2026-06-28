import { useState } from 'react';
import { Gamepad, Search } from 'lucide-react';

interface GameItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  status: 'playable' | 'upcoming';
  badgeText: string;
}

const gamesList: GameItem[] = [
  {
    id: 'ludo',
    title: 'Ludo Royale AI',
    description: 'Play standard Ludo offline with Easy, Medium, and Hard AI. Beautiful animations and full ruleset included.',
    icon: '🎲',
    status: 'playable',
    badgeText: 'Shipped',
  },
  {
    id: 'chess',
    title: 'Chess',
    description: 'Classic board game with a powerful custom engine, beautiful piece designs, and historic move log.',
    icon: '♟',
    status: 'upcoming',
    badgeText: 'Coming Soon',
  },
  {
    id: 'snake_ladder',
    title: 'Snake & Ladder',
    description: 'Chutes, ladders, and dice. Play offline with CPU opponents or local friends.',
    icon: '🎯',
    status: 'upcoming',
    badgeText: 'Coming Soon',
  },
  {
    id: 'tic_tac_toe',
    title: 'Tic Tac Toe',
    description: 'The classic X and O game. Includes smart CPU that never loses on hard mode.',
    icon: '❌',
    status: 'upcoming',
    badgeText: 'Coming Soon',
  },
  {
    id: 'snake_game',
    title: 'Snake Game',
    description: 'Grow your snake, eat apples, and avoid walls in this retro arcade classic modernized.',
    icon: '🐍',
    status: 'upcoming',
    badgeText: 'Coming Soon',
  },
  {
    id: 'sudoku',
    title: 'Sudoku',
    description: 'Generate endless classic puzzles of Easy, Medium, Hard, and Expert difficulties.',
    icon: '🧩',
    status: 'upcoming',
    badgeText: 'Coming Soon',
  },
  {
    id: 'card_games',
    title: 'Card Games',
    description: 'A suite of popular single-player card games including Solitaire and Blackjack.',
    icon: '🃏',
    status: 'upcoming',
    badgeText: 'Coming Soon',
  },
  {
    id: 'pong',
    title: 'Pong',
    description: 'Retro paddle physics table tennis game. Face off against progressively faster AI.',
    icon: '🏓',
    status: 'upcoming',
    badgeText: 'Coming Soon',
  },
  {
    id: 'racing_games',
    title: 'Racing Games',
    description: '2D retro road racer. Speed down highways, dodge obstacles, and beat the clock.',
    icon: '🏎',
    status: 'upcoming',
    badgeText: 'Coming Soon',
  },
  {
    id: 'puzzle_games',
    title: 'Puzzle Games',
    description: 'Test your brain with a combination of block sliding, memory match, and logic grids.',
    icon: '🧠',
    status: 'upcoming',
    badgeText: 'Coming Soon',
  },
];

interface ArenaPortalProps {
  onSelectGame: (gameId: string) => void;
}

export default function ArenaPortal({ onSelectGame }: ArenaPortalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'playable' | 'upcoming'>('all');

  const filteredGames = gamesList.filter((game) => {
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || game.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="arena-container">
      {/* Header */}
      <header className="arena-header">
        <h1 className="arena-logo">
          <Gamepad size={40} style={{ marginRight: '12px', verticalAlign: 'middle' }} />
          ZynoArena
        </h1>
        <p className="arena-subtitle">
          An open-source collection of modern browser-based games. Built with React, Phaser 3, and TypeScript.
        </p>
      </header>

      {/* Controls */}
      <section className="arena-controls">
        <div style={{ position: 'relative', width: '100%', maxWidth: '500px' }}>
          <input
            type="text"
            className="arena-search-input"
            placeholder="Search games..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search
            size={18}
            style={{
              position: 'absolute',
              right: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#475569',
            }}
          />
        </div>

        <div className="arena-filters">
          <button
            className={`arena-filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All Games ({gamesList.length})
          </button>
          <button
            className={`arena-filter-btn ${activeFilter === 'playable' ? 'active' : ''}`}
            onClick={() => setActiveFilter('playable')}
          >
            Playable ({gamesList.filter(g => g.status === 'playable').length})
          </button>
          <button
            className={`arena-filter-btn ${activeFilter === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveFilter('upcoming')}
          >
            Coming Soon ({gamesList.filter(g => g.status === 'upcoming').length})
          </button>
        </div>
      </section>

      {/* Games Grid */}
      <main className="arena-grid">
        {filteredGames.map((game) => (
          <div
            key={game.id}
            className={`glass-panel game-card ${game.status}`}
            onClick={() => game.status === 'playable' && onSelectGame(game.id)}
          >
            <div className="game-card-icon">{game.icon}</div>
            <h2 className="game-card-title">{game.title}</h2>
            <p className="game-card-desc">{game.description}</p>
            <div className="game-card-footer">
              <span className={`game-card-badge ${game.status}`}>{game.badgeText}</span>
              <button
                className={`game-card-btn ${game.status}`}
                disabled={game.status !== 'playable'}
              >
                {game.status === 'playable' ? 'Play Now' : 'Locked'}
              </button>
            </div>
          </div>
        ))}
      </main>

      {/* Footer */}
      <footer className="arena-footer">
        <div>
          <a
            href="https://github.com/zynocode/zynoarena"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <svg
              height="16"
              width="16"
              viewBox="0 0 16 16"
              fill="currentColor"
              style={{ display: 'inline-block', verticalAlign: 'middle' }}
            >
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
            </svg>
            GitHub Repository
          </a>
        </div>
        <div>Licensed under the MIT License • ZynoArena Open Source Project</div>
      </footer>
    </div>
  );
}

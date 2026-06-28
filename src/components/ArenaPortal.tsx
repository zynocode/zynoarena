import { useState } from 'react';
import { Zap, Wifi, Trophy, Star, ChevronRight, Play, Search } from 'lucide-react';

const Github = ({ size = 20 }: { size?: number }) => (
  <svg
    height={size}
    width={size}
    viewBox="0 0 16 16"
    fill="currentColor"
    style={{ display: 'inline-block', verticalAlign: 'middle' }}
  >
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
  </svg>
);

interface GameItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  status: 'playable' | 'upcoming';
  tags: string[];
  accentColor: string;
  glowColor: string;
}

const gamesList: GameItem[] = [
  {
    id: 'ludo',
    title: 'Ludo Royale',
    description: 'Full Ludo ruleset with 3-tier AI opponents. Smooth animations, procedural audio, and glassmorphism board.',
    icon: '🎲',
    status: 'playable',
    tags: ['AI', 'Multiplayer', '2-4 Players'],
    accentColor: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.3)',
  },
  {
    id: 'chess',
    title: 'Chess',
    description: 'Classic board game with a powerful custom engine, beautiful piece designs, and move history.',
    icon: '♟',
    status: 'upcoming',
    tags: ['AI', 'Strategy', '2 Players'],
    accentColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.3)',
  },
  {
    id: 'snake_ladder',
    title: 'Snake & Ladder',
    description: 'Chutes, ladders, and dice. Play offline with CPU opponents or local friends.',
    icon: '🎯',
    status: 'upcoming',
    tags: ['Family', '2-4 Players'],
    accentColor: '#22c55e',
    glowColor: 'rgba(34, 197, 94, 0.3)',
  },
  {
    id: 'tic_tac_toe',
    title: 'Tic Tac Toe',
    description: 'X and O, reimagined. Unbeatable AI on hard mode — dare to try?',
    icon: '❌',
    status: 'upcoming',
    tags: ['AI', '2 Players', 'Quick'],
    accentColor: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.3)',
  },
  {
    id: 'snake_game',
    title: 'Snake Game',
    description: 'Grow your snake, eat apples, avoid walls. Retro arcade classic, modernized with smooth canvas rendering.',
    icon: '🐍',
    status: 'upcoming',
    tags: ['Arcade', 'Solo', 'Highscore'],
    accentColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.3)',
  },
  {
    id: 'sudoku',
    title: 'Sudoku',
    description: 'Endless puzzles across Easy, Medium, Hard, and Expert difficulties with a hint system.',
    icon: '🧩',
    status: 'upcoming',
    tags: ['Puzzle', 'Solo', 'Logic'],
    accentColor: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.3)',
  },
  {
    id: 'card_games',
    title: 'Card Games',
    description: 'Solitaire and Blackjack in one suite. Smooth card animations with a premium casino feel.',
    icon: '🃏',
    status: 'upcoming',
    tags: ['Cards', 'Casino', 'Solo'],
    accentColor: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.3)',
  },
  {
    id: 'pong',
    title: 'Pong',
    description: 'Retro paddle physics. Face off against a progressively faster AI opponent.',
    icon: '🏓',
    status: 'upcoming',
    tags: ['Arcade', 'AI', '2 Players'],
    accentColor: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.3)',
  },
  {
    id: 'racing',
    title: 'Racing Games',
    description: '2D retro road racer. Speed down highways, dodge obstacles, beat the clock.',
    icon: '🏎',
    status: 'upcoming',
    tags: ['Racing', 'Arcade', 'Highscore'],
    accentColor: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.3)',
  },
  {
    id: 'puzzle',
    title: 'Puzzle Games',
    description: 'Block sliding, memory match, and logic grids — all in one brain-teasing collection.',
    icon: '🧠',
    status: 'upcoming',
    tags: ['Puzzle', 'Solo', 'Brain'],
    accentColor: '#8b5cf6',
    glowColor: 'rgba(139, 92, 246, 0.3)',
  },
];

const features = [
  { icon: <Zap size={22} />, title: 'Zero Install', desc: 'Open browser and play. No downloads, no accounts, no nonsense.' },
  { icon: <Wifi size={22} />, title: '100% Offline', desc: 'Everything runs in your browser. No network dependency after load.' },
  { icon: <Trophy size={22} />, title: 'Smart AI', desc: '3-tier CPU opponents that actually challenge you — even on Easy.' },
  { icon: <Star size={22} />, title: 'Open Source', desc: 'MIT licensed. Fork it, improve it, contribute a new game.' },
];

const floatingSymbols = ['🎲', '♟', '🎯', '🃏', '🧩', '❌', '🐍', '🏓', '🏎', '🧠'];

interface ArenaPortalProps {
  onSelectGame: (gameId: string) => void;
}

export default function ArenaPortal({ onSelectGame }: ArenaPortalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'playable' | 'upcoming'>('all');

  const filteredGames = gamesList.filter((game) => {
    const matchesSearch =
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = activeFilter === 'all' || game.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const playableCount = gamesList.filter(g => g.status === 'playable').length;
  const upcomingCount = gamesList.filter(g => g.status === 'upcoming').length;

  return (
    <div className="ap-root">

      {/* ── Animated Background ── */}
      <div className="ap-bg">
        {floatingSymbols.map((sym, i) => (
          <span
            key={i}
            className="ap-bg-sym"
            style={{
              top: `${8 + (i * 9.2) % 85}%`,
              left: `${4 + (i * 11.7) % 90}%`,
              animationDuration: `${7 + (i % 4) * 2}s`,
              animationDelay: `${(i * 0.8) % 4}s`,
              fontSize: `${56 + (i % 3) * 20}px`,
            }}
          >
            {sym}
          </span>
        ))}
      </div>

      {/* ── HERO ── */}
      <section className="ap-hero">
        <div className="ap-hero-eyebrow">
          <span className="ap-live-dot" />
          Open Source · Free Forever · No Account Needed
        </div>

        <h1 className="ap-hero-title">
          Your Browser.
          <br />
          <span className="ap-gradient-text">Your Arena.</span>
        </h1>

        <p className="ap-hero-sub">
          A growing collection of modern, AI-powered browser games.
          Play Ludo, Chess, Snake, Sudoku and more — offline, instantly, for free.
        </p>

        <div className="ap-hero-ctas">
          <button
            className="ap-cta-primary"
            onClick={() => onSelectGame('ludo')}
          >
            <Play size={18} fill="currentColor" />
            Play Now — It's Free
          </button>
          <a
            className="ap-cta-ghost"
            href="https://github.com/zynocode/zynoarena"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github size={18} />
            View on GitHub
          </a>
        </div>

        {/* Stats bar */}
        <div className="ap-stats">
          <div className="ap-stat">
            <span className="ap-stat-num">{gamesList.length}</span>
            <span className="ap-stat-label">Games</span>
          </div>
          <div className="ap-stat-divider" />
          <div className="ap-stat">
            <span className="ap-stat-num">3</span>
            <span className="ap-stat-label">AI Levels</span>
          </div>
          <div className="ap-stat-divider" />
          <div className="ap-stat">
            <span className="ap-stat-num">0</span>
            <span className="ap-stat-label">MB to Install</span>
          </div>
          <div className="ap-stat-divider" />
          <div className="ap-stat">
            <span className="ap-stat-num">MIT</span>
            <span className="ap-stat-label">License</span>
          </div>
        </div>
      </section>

      {/* ── FEATURED GAME ── */}
      <section className="ap-section">
        <div className="ap-section-label">🎮 Featured · Now Available</div>
        <div className="ap-featured-card" onClick={() => onSelectGame('ludo')}>
          <div className="ap-featured-left">
            <div className="ap-featured-icon">🎲</div>
            <div>
              <div className="ap-featured-badge">v1.0.0 · Shipped</div>
              <h2 className="ap-featured-title">Ludo Royale</h2>
              <p className="ap-featured-desc">
                The classic board game — fully rebuilt with 3-tier AI opponents, smooth token animations,
                procedural Web Audio SFX, and a stunning dark glassmorphism UI. Play solo, with friends,
                or go full CPU.
              </p>
              <div className="ap-featured-tags">
                {['Easy AI', 'Medium AI', 'Hard AI', '1–4 Players', 'Local Multiplayer', 'Offline', 'Responsive'].map(t => (
                  <span key={t} className="ap-tag">{t}</span>
                ))}
              </div>
              <button className="ap-cta-primary ap-featured-btn" onClick={(e) => { e.stopPropagation(); onSelectGame('ludo'); }}>
                <Play size={16} fill="currentColor" />
                Play Ludo Royale
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <div className="ap-featured-right">
            <div className="ap-board-preview">
              <div className="ap-board-grid">
                {['🔴', '⬜', '⬜', '⬜', '🔵',
                  '⬜', '🟥', '⬜', '🟦', '⬜',
                  '⬜', '⬜', '🏠', '⬜', '⬜',
                  '⬜', '🟩', '⬜', '🟨', '⬜',
                  '🟢', '⬜', '⬜', '⬜', '🟡'].map((cell, i) => (
                  <div key={i} className="ap-board-cell">{cell}</div>
                ))}
              </div>
              <div className="ap-board-label">Live Board Preview</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY ZYNOARENA ── */}
      <section className="ap-section">
        <div className="ap-section-label">✨ Why ZynoArena</div>
        <div className="ap-features-grid">
          {features.map((f) => (
            <div key={f.title} className="ap-feature-card">
              <div className="ap-feature-icon">{f.icon}</div>
              <h3 className="ap-feature-title">{f.title}</h3>
              <p className="ap-feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ALL GAMES ── */}
      <section className="ap-section">
        <div className="ap-section-label">🕹️ All Games</div>

        {/* Search + Filter */}
        <div className="ap-toolbar">
          <div className="ap-search-wrap">
            <Search size={16} className="ap-search-icon" />
            <input
              type="text"
              className="ap-search"
              placeholder="Search games, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="ap-filters">
            {([
              { key: 'all', label: `All (${gamesList.length})` },
              { key: 'playable', label: `▶ Playable (${playableCount})` },
              { key: 'upcoming', label: `🔜 Coming Soon (${upcomingCount})` },
            ] as const).map(f => (
              <button
                key={f.key}
                className={`ap-filter-btn ${activeFilter === f.key ? 'active' : ''}`}
                onClick={() => setActiveFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="ap-grid">
          {filteredGames.map((game) => (
            <div
              key={game.id}
              className={`ap-card ${game.status === 'playable' ? 'ap-card-playable' : 'ap-card-upcoming'}`}
              style={{ '--card-accent': game.accentColor, '--card-glow': game.glowColor } as React.CSSProperties}
              onClick={() => game.status === 'playable' && onSelectGame(game.id)}
            >
              <div className="ap-card-glow-bg" />
              <div className="ap-card-header">
                <span className="ap-card-icon">{game.icon}</span>
                <span className={`ap-card-status ${game.status}`}>
                  {game.status === 'playable' ? '● Live' : '○ Soon'}
                </span>
              </div>
              <h3 className="ap-card-title">{game.title}</h3>
              <p className="ap-card-desc">{game.description}</p>
              <div className="ap-card-tags">
                {game.tags.map(t => <span key={t} className="ap-tag ap-tag-sm">{t}</span>)}
              </div>
              <div className="ap-card-footer">
                <button
                  className={`ap-card-btn ${game.status}`}
                  disabled={game.status !== 'playable'}
                  onClick={(e) => { e.stopPropagation(); if (game.status === 'playable') onSelectGame(game.id); }}
                >
                  {game.status === 'playable' ? (
                    <><Play size={13} fill="currentColor" /> Play Now</>
                  ) : (
                    'Coming Soon'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredGames.length === 0 && (
          <div className="ap-empty">
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
            <p>No games found for "<strong>{searchQuery}</strong>"</p>
          </div>
        )}
      </section>

      {/* ── FOOTER ── */}
      <footer className="ap-footer">
        <div className="ap-footer-brand">
          <span className="ap-footer-logo">🎮 ZynoArena</span>
          <span className="ap-footer-version">v1.0.0</span>
        </div>
        <p className="ap-footer-tagline">Open-source browser games. Built with React, Phaser & TypeScript.</p>
        <div className="ap-footer-links">
          <a href="https://github.com/zynocode/zynoarena" target="_blank" rel="noopener noreferrer">GitHub</a>
          <span className="ap-footer-dot">·</span>
          <a href="https://github.com/zynocode/zynoarena/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer">Contribute</a>
          <span className="ap-footer-dot">·</span>
          <a href="https://github.com/zynocode/zynoarena/issues" target="_blank" rel="noopener noreferrer">Report Bug</a>
          <span className="ap-footer-dot">·</span>
          <a href="https://github.com/zynocode/zynoarena/wiki" target="_blank" rel="noopener noreferrer">Wiki</a>
        </div>
        <p className="ap-footer-copy">MIT License · Made with ❤️ by <a href="https://github.com/zynocode" target="_blank" rel="noopener noreferrer">zynocode</a></p>
      </footer>
    </div>
  );
}

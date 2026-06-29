import { useState } from 'react';
import { Play, Search } from 'lucide-react';

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
    description: 'Premium Ludo experience. Smart AI bots, bouncy 3D gotis, tumbling 3D dice, and smooth canvas gameplay.',
    icon: '🎲',
    status: 'playable',
    tags: ['AI', 'Multiplayer', '2-4 Players'],
    accentColor: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.35)',
  },
  {
    id: 'chess',
    title: 'Chess Pro',
    description: 'Play with strong AI bot or local offline friend. Complete move history log, checkmate highlights.',
    icon: '♟',
    status: 'playable',
    tags: ['AI', 'Strategy', '2 Players'],
    accentColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.25)',
  },
  {
    id: 'snake_ladder',
    title: 'Snake & Ladder',
    description: 'Procedural dice, slides, chutes and ladders. Local pass-and-play or vs active computer bots.',
    icon: '🎯',
    status: 'upcoming',
    tags: ['Family', '2-4 Players'],
    accentColor: '#22c55e',
    glowColor: 'rgba(34, 197, 94, 0.25)',
  },
  {
    id: 'tic_tac_toe',
    title: 'Tic Tac Toe',
    description: 'Neon styled X & O grids. Minimax bot engine that never makes mistakes.',
    icon: '❌',
    status: 'upcoming',
    tags: ['AI', '2 Players', 'Quick'],
    accentColor: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.25)',
  },
  {
    id: 'snake_game',
    title: 'Snake Game',
    description: 'Grow your snake, eat apples, avoid walls. Retro arcade classic, modernized with smooth canvas rendering.',
    icon: '🐍',
    status: 'upcoming',
    tags: ['Arcade', 'Solo', 'Highscore'],
    accentColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.25)',
  },
  {
    id: 'sudoku',
    title: 'Sudoku',
    description: 'Endless puzzles across Easy, Medium, Hard, and Expert difficulties with a hint system.',
    icon: '🧩',
    status: 'upcoming',
    tags: ['Puzzle', 'Solo', 'Logic'],
    accentColor: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.25)',
  },
  {
    id: 'card_games',
    title: 'Card Games',
    description: 'Solitaire and Blackjack in one suite. Smooth card animations with a premium casino feel.',
    icon: '🃏',
    status: 'upcoming',
    tags: ['Cards', 'Casino', 'Solo'],
    accentColor: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.25)',
  },
  {
    id: 'pong',
    title: 'Pong Arcade',
    description: 'Retro paddle physics. Face off against a progressively faster AI opponent.',
    icon: '🏓',
    status: 'upcoming',
    tags: ['Arcade', 'AI', '2 Players'],
    accentColor: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.25)',
  },
];

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
    <div className="ap-root" style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '40px 24px', boxSizing: 'border-box' }}>
      
      {/* ── Dashboard Header ── */}
      <header style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
        marginBottom: '40px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        paddingBottom: '24px'
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: '32px',
            fontWeight: 800,
            fontFamily: 'Outfit, sans-serif',
            background: 'linear-gradient(135deg, #fff 0%, #cbd5e1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span>🎮</span> OpenBoard Arcade <span style={{
              fontSize: '11px',
              fontFamily: "'Chakra Petch', monospace",
              padding: '3px 8px',
              borderRadius: '6px',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              background: 'rgba(99, 102, 241, 0.1)',
              color: '#818cf8',
              letterSpacing: '1px',
              textTransform: 'uppercase'
            }}>Dashboard</span>
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
            Select a game to start playing locally. Runs 100% offline.
          </p>
        </div>

        {/* Toolbar: Search + Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div className="ap-search-wrap" style={{ position: 'relative', width: '280px' }}>
            <Search size={16} className="ap-search-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              className="ap-search"
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 38px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(15, 23, 42, 0.6)',
                color: '#fff',
                fontSize: '13px',
                outline: 'none',
                transition: 'all 0.2s'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', background: 'rgba(15, 23, 42, 0.5)', padding: '3px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
            {([
              { key: 'all', label: `All (${gamesList.length})` },
              { key: 'playable', label: `Playable (${playableCount})` },
              { key: 'upcoming', label: `Soon (${upcomingCount})` },
            ] as const).map(f => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                style={{
                  border: 'none',
                  padding: '7px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '7px',
                  cursor: 'pointer',
                  backgroundColor: activeFilter === f.key ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                  color: activeFilter === f.key ? '#fff' : '#475569',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Games Grid ── */}
      <main style={{ flex: 1 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '24px'
        }}>
          {filteredGames.map((game) => (
            <div
              key={game.id}
              onClick={() => game.status === 'playable' && onSelectGame(game.id)}
              style={{
                position: 'relative',
                borderRadius: '18px',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                background: 'linear-gradient(145deg, rgba(15,23,42,0.8), rgba(8,14,28,0.9))',
                padding: '24px',
                cursor: game.status === 'playable' ? 'pointer' : 'default',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
              className={`game-card-hover-${game.status}`}
            >
              {/* Highlight backdrop */}
              <div style={{
                position: 'absolute',
                top: '-40%',
                left: '-40%',
                width: '180%',
                height: '180%',
                background: `radial-gradient(circle at center, ${game.glowColor} 0%, transparent 60%)`,
                opacity: 0.15,
                pointerEvents: 'none',
                zIndex: 0
              }} />

              {/* Card Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                <span style={{ fontSize: '38px', lineHeight: 1 }}>{game.icon}</span>
                <span style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  fontFamily: "'Chakra Petch', monospace",
                  padding: '2px 8px',
                  borderRadius: '5px',
                  textTransform: 'uppercase',
                  border: `1px solid ${game.status === 'playable' ? 'rgba(34,197,94,0.3)' : 'rgba(100,116,139,0.3)'}`,
                  background: game.status === 'playable' ? 'rgba(34,197,94,0.08)' : 'rgba(100,116,139,0.08)',
                  color: game.status === 'playable' ? '#4ade80' : '#94a3b8'
                }}>
                  {game.status === 'playable' ? '● Playable' : '○ Upcoming'}
                </span>
              </div>

              {/* Title & Desc */}
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <h3 style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 700,
                  fontFamily: 'Outfit, sans-serif',
                  color: '#fff'
                }}>{game.title}</h3>
                <p style={{
                  margin: 0,
                  fontSize: '13px',
                  color: '#94a3b8',
                  lineHeight: 1.5,
                  minHeight: '60px'
                }}>{game.description}</p>
              </div>

              {/* Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', position: 'relative', zIndex: 1 }}>
                {game.tags.map(t => (
                  <span key={t} style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: '#64748b'
                  }}>{t}</span>
                ))}
              </div>

              {/* Action Button */}
              <div style={{ marginTop: 'auto', position: 'relative', zIndex: 1 }}>
                <button
                  disabled={game.status !== 'playable'}
                  style={{
                    width: '100%',
                    padding: '11px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: game.status === 'playable' ? 'pointer' : 'default',
                    background: game.status === 'playable'
                      ? `linear-gradient(135deg, ${game.accentColor} 0%, ${game.accentColor}dd 100%)`
                      : 'rgba(255,255,255,0.03)',
                    color: game.status === 'playable' ? '#fff' : '#475569',
                    borderWidth: game.status === 'playable' ? 0 : '1px',
                    borderColor: 'rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                    fontFamily: 'Outfit, sans-serif'
                  }}
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
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#64748b' }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>🔍</span>
            <p style={{ margin: 0 }}>No games found matching "<strong>{searchQuery}</strong>"</p>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer style={{
        marginTop: '60px',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        paddingTop: '20px',
        textAlign: 'center',
        color: '#475569',
        fontSize: '12px'
      }}>
        <p style={{ margin: 0 }}>OpenBoard Arcade Game Launcher · Local Host Dashboard</p>
      </footer>
    </div>
  );
}

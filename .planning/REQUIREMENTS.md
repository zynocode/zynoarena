# Scoped Requirements - Ludo Royale AI

## 1. Core Gameplay & Rules
- **Standard 4-Player Board**: Red (top-left/base), Green (top-right/base), Yellow (bottom-right/base), Blue (bottom-left/base).
- **Token Paths**: Correct global path mapping (52 common track spaces, 5 home stretch spaces, 1 home space per color).
- **Safe Zones**: Standard safe zones (starting tiles, starred tiles - total 8 safe zones).
- **Roll Rules**:
  - Need 6 to release token from base.
  - Rolling 6 grants extra turn.
  - 3 consecutive sixes voids turn, passes to next player.
  - Capturing opponent's token sends it back to base, grants capturing player extra turn.
  - Exact roll needed to land in Home.
  - Safe zones prevent token capture.

## 2. Smart AI system
- **Easy**: Selects random valid move.
- **Medium**: Priority queue:
  1. Capture opponent.
  2. Escape danger (if token in threat, move it).
  3. Advance leading token.
- **Hard**: Scoring matrix evaluated per valid move:
  - Capture score weight: +100
  - Escape danger weight: +80
  - Enter safe zone weight: +40
  - Release token from base weight: +50
  - Move token closer to home: weight proportional to distance
  - Risking token (moving to threat tile): -60

## 3. UI/UX & Audio
- **Screen States**: Main Menu, Game Setup (choose color, AI count, difficulty), Gameplay Screen, Pause Overlay, Game Over.
- **Responsive Layout**: Adapts to desktop, tablet, and mobile portrait/landscape.
- **Audio Cues**: Dice roll, token movement ticks, token capture, token home, victory fanfare, mute toggle.

## 4. Architecture
- **React UI**: Manage menus, HUD, game state config.
- **Phaser 3 Canvas**: Render board grid, tokens, dice animation, path transitions.
- **Zustand Bridge**: Synchronize React UI states (turns, scores, win state) with Phaser logic.

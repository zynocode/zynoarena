# Roadmap - Ludo Royale AI

## Milestone 1: MVP Release

### Phase 1: Tech Setup & Canvas Initialization
- Initialize React + TS + Vite + Phaser project.
- Configure Zustand store.
- Setup directory tree.
- Render empty Phaser canvas with basic main menu React overlay.

### Phase 2: Board & Path Mapping
- Draw static vector Ludo board in Phaser.
- Define grid coordinates coordinate system.
- Map index paths for all 4 player tracks (Red, Green, Yellow, Blue).
- Render 4 tokens per player at their base locations.

### Phase 3: Core Game Loop & Turn Management
- Dice rolling component with random distribution.
- Turn manager state machine (Roll -> Select Token -> Move -> Capture/Safe Check -> Next Turn).
- Token tile-by-tile movement animation.
- Easy AI implementation (random selection).

### Phase 4: Full Ruleset & Medium/Hard AI
- Safe zones, home stretch, base release rules.
- Capturing logic and base respawn animation.
- Consecutive sixes check.
- Medium and Hard scoring-based AI opponents.

### Phase 5: Polish, Audio, & Responsive UI
- Sound effects integration (Roll, slide, capture, win).
- UI overlay polish (turn banners, settings, game over screen).
- Responsive viewport scaling for mobile/desktop.
- Walkthrough and completion verification.

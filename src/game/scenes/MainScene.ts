import Phaser from 'phaser';
import { useGameStore } from '../../store/gameStore';
import type { Player } from '../../store/gameStore';
import { getTokenGridCoordinates, gridToPixel, safeZonesGlobalIndices, globalPath } from '../utils/boardCoordinates';
import { playSound } from '../utils/audioEngine';

export default class MainScene extends Phaser.Scene {
  private tokenSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private unsubscribeStore?: () => void;
  private isInitializing = true;
  
  // Animation lock to prevent double animations
  private activeMovingTokenKey: string | null = null;
  private pulseTweens: Phaser.Tweens.Tween[] = [];

  constructor() {
    super({ key: 'MainScene' });
  }

  create() {
    // Cameras set background
    this.cameras.main.setBackgroundColor('#020617');

    const cellSize = 40;
    const boardGraphics = this.add.graphics();

    // 1. Draw Pathways and common cells
    this.drawPathways(boardGraphics, cellSize);

    // 2. Draw Corner Bases (Glassmorphism look)
    this.drawBases(boardGraphics, cellSize);

    // 3. Draw Center Home Area
    this.drawHomeArea(boardGraphics, cellSize);

    // 4. Draw Safe Zone Stars
    this.drawSafeZoneStars(cellSize);

    // 5. Initial setup of tokens from Zustand
    const state = useGameStore.getState();
    if (state.players.length > 0) {
      this.initTokens(state.players);
    }

    // 6. Subscribe to Zustand store changes
    this.unsubscribeStore = useGameStore.subscribe((newState) => {
      this.syncTokens(newState.players);
      this.syncHighlights(newState);
      this.checkMovingToken(newState);
    });

    // Clean up subscription on scene shutdown
    this.events.on('shutdown', () => {
      if (this.unsubscribeStore) {
        this.unsubscribeStore();
      }
    });

    this.isInitializing = false;
  }

  private drawPathways(g: Phaser.GameObjects.Graphics, cellSize: number) {
    g.lineStyle(1.5, 0xcbd5e1, 1); // Clean slate border

    for (let x = 0; x < 15; x++) {
      for (let y = 0; y < 15; y++) {
        const isArm = (x >= 6 && x <= 8) || (y >= 6 && y <= 8);
        const isHome = x >= 6 && x <= 8 && y >= 6 && y <= 8;

        if (isArm && !isHome) {
          g.fillStyle(0xf8fafc, 1); // Clean white track squares
          g.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
          g.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }

    const colorCodes = {
      red: 0xef4444,
      green: 0x22c55e,
      yellow: 0xeab308,
      blue: 0x3b82f6
    };

    // Red Special Cells
    g.fillStyle(colorCodes.red, 1.0);
    g.fillRect(1 * cellSize, 6 * cellSize, cellSize, cellSize);
    g.strokeRect(1 * cellSize, 6 * cellSize, cellSize, cellSize);
    for (let x = 1; x <= 5; x++) {
      g.fillStyle(colorCodes.red, 1.0);
      g.fillRect(x * cellSize, 7 * cellSize, cellSize, cellSize);
      g.strokeRect(x * cellSize, 7 * cellSize, cellSize, cellSize);
    }
    g.fillStyle(colorCodes.red, 0.4);
    g.fillRect(0 * cellSize, 6 * cellSize, cellSize, cellSize);
    g.strokeRect(0 * cellSize, 6 * cellSize, cellSize, cellSize);

    // Green Special Cells
    g.fillStyle(colorCodes.green, 1.0);
    g.fillRect(8 * cellSize, 1 * cellSize, cellSize, cellSize);
    g.strokeRect(8 * cellSize, 1 * cellSize, cellSize, cellSize);
    for (let y = 1; y <= 5; y++) {
      g.fillStyle(colorCodes.green, 1.0);
      g.fillRect(7 * cellSize, y * cellSize, cellSize, cellSize);
      g.strokeRect(7 * cellSize, y * cellSize, cellSize, cellSize);
    }
    g.fillStyle(colorCodes.green, 0.4);
    g.fillRect(8 * cellSize, 0 * cellSize, cellSize, cellSize);
    g.strokeRect(8 * cellSize, 0 * cellSize, cellSize, cellSize);

    // Yellow Special Cells
    g.fillStyle(colorCodes.yellow, 1.0);
    g.fillRect(13 * cellSize, 8 * cellSize, cellSize, cellSize);
    g.strokeRect(13 * cellSize, 8 * cellSize, cellSize, cellSize);
    for (let x = 9; x <= 13; x++) {
      g.fillStyle(colorCodes.yellow, 1.0);
      g.fillRect(x * cellSize, 7 * cellSize, cellSize, cellSize);
      g.strokeRect(x * cellSize, 7 * cellSize, cellSize, cellSize);
    }
    g.fillStyle(colorCodes.yellow, 0.4);
    g.fillRect(14 * cellSize, 8 * cellSize, cellSize, cellSize);
    g.strokeRect(14 * cellSize, 8 * cellSize, cellSize, cellSize);

    // Blue Special Cells
    g.fillStyle(colorCodes.blue, 1.0);
    g.fillRect(6 * cellSize, 13 * cellSize, cellSize, cellSize);
    g.strokeRect(6 * cellSize, 13 * cellSize, cellSize, cellSize);
    for (let y = 9; y <= 13; y++) {
      g.fillStyle(colorCodes.blue, 1.0);
      g.fillRect(7 * cellSize, y * cellSize, cellSize, cellSize);
      g.strokeRect(7 * cellSize, y * cellSize, cellSize, cellSize);
    }
    g.fillStyle(colorCodes.blue, 0.4);
    g.fillRect(6 * cellSize, 14 * cellSize, cellSize, cellSize);
    g.strokeRect(6 * cellSize, 14 * cellSize, cellSize, cellSize);
  }

  private drawBases(g: Phaser.GameObjects.Graphics, cellSize: number) {
    const configs = [
      { name: 'red', color: 0xef4444, x: 0, y: 0 },
      { name: 'green', color: 0x22c55e, x: 9, y: 0 },
      { name: 'yellow', color: 0xeab308, x: 9, y: 9 },
      { name: 'blue', color: 0x3b82f6, x: 0, y: 9 }
    ];

    configs.forEach((base) => {
      const px = base.x * cellSize;
      const py = base.y * cellSize;
      const size = 6 * cellSize;

      // Solid Player Color Base
      g.fillStyle(base.color, 1.0);
      g.lineStyle(2, 0x94a3b8, 1);
      g.fillRect(px, py, size, size);
      g.strokeRect(px, py, size, size);

      // Solid White Inner Card
      g.fillStyle(0xffffff, 1.0);
      g.fillRect(px + 40, py + 40, size - 80, size - 80);
      g.strokeRect(px + 40, py + 40, size - 80, size - 80);

      g.lineStyle(1.5, 0xcbd5e1, 1);
      const pocketOffsets = [
        { dx: 1.5, dy: 1.5 },
        { dx: 3.5, dy: 1.5 },
        { dx: 1.5, dy: 3.5 },
        { dx: 3.5, dy: 3.5 }
      ];

      pocketOffsets.forEach((offset) => {
        const slotX = px + (offset.dx - base.x) * cellSize;
        const slotY = py + (offset.dy - base.y) * cellSize;
        
        // Pockets match the player's own color
        g.fillStyle(base.color, 1.0);
        g.fillCircle(slotX, slotY, 18);
        g.strokeCircle(slotX, slotY, 18);
      });
    });
  }

  private drawHomeArea(g: Phaser.GameObjects.Graphics, cellSize: number) {
    const center = 7.5 * cellSize; // 300
    const min = 6 * cellSize;    // 240
    const max = 9 * cellSize;    // 360

    // Red home (Left)
    g.fillStyle(0xef4444, 0.95);
    g.fillTriangle(min, min, min, max, center, center);
    g.lineStyle(1, 0x1e293b, 1);
    g.strokeTriangle(min, min, min, max, center, center);

    // Green home (Top)
    g.fillStyle(0x22c55e, 0.95);
    g.fillTriangle(min, min, max, min, center, center);
    g.strokeTriangle(min, min, max, min, center, center);

    // Yellow home (Right)
    g.fillStyle(0xeab308, 0.95);
    g.fillTriangle(max, min, max, max, center, center);
    g.strokeTriangle(max, min, max, max, center, center);

    // Blue home (Bottom)
    g.fillStyle(0x3b82f6, 0.95);
    g.fillTriangle(min, max, max, max, center, center);
    g.strokeTriangle(min, max, max, max, center, center);
  }

  private drawSafeZoneStars(cellSize: number) {
    safeZonesGlobalIndices.forEach((idx) => {
      const coord = globalPath[idx];
      const pixel = gridToPixel(coord, cellSize);

      const star = this.add.star(pixel.x, pixel.y, 5, 6, 12, 0xf1f5f9, 0.85);
      star.setStrokeStyle(1.5, 0x0f172a);
    });
  }

  private initTokens(players: Player[]) {
    players.forEach((player, playerIdx) => {
      const colorHex = this.getColorHex(player.color);
      const colorIdx = ['red', 'green', 'yellow', 'blue'].indexOf(player.color);

      player.tokens.forEach((position, tokenIdx) => {
        const gridCoord = getTokenGridCoordinates(colorIdx, position, tokenIdx);
        const pixel = gridToPixel(gridCoord);

        // We shift the container position so its center (16,16) aligns exactly on grid pixel
        const container = this.add.container(pixel.x - 16, pixel.y - 16);

        const shadow = this.add.circle(18, 18, 14, 0x000000, 0.45);
        
        // Outer ring (Solid Player Color with White outline)
        const outer = this.add.circle(16, 16, 14, colorHex, 1);
        outer.setStrokeStyle(2, 0xffffff, 1.0);
        
        // Inner white ring (gives the goti a beautiful physical border look)
        const innerRing = this.add.circle(16, 16, 9, 0xffffff, 1.0);
        innerRing.setStrokeStyle(1.5, colorHex, 1.0);

        // Core dot (Solid Player Color in the very center)
        const core = this.add.circle(16, 16, 4.5, colorHex, 1.0);

        container.add([shadow, outer, innerRing, core]);
        container.setSize(32, 32);

        // Click interaction binding - using default 32x32 rectangle centered on goti
        container.setInteractive();
        container.on('pointerdown', () => {
          this.handleTokenClick(playerIdx, tokenIdx);
        });

        // Hover scale feedback
        container.on('pointerover', () => {
          const state = useGameStore.getState();
          const activePlayer = state.players[state.activePlayerIndex];
          const isMyValidToken = activePlayer?.isHuman && 
                                 state.activePlayerIndex === playerIdx && 
                                 state.validMoves.includes(tokenIdx) && 
                                 state.gameStatus === 'WAITING_FOR_MOVE';

          if (isMyValidToken) {
            this.input.setDefaultCursor('pointer');
            this.tweens.add({
              targets: container,
              scale: 1.25,
              duration: 100
            });
          }
        });

        container.on('pointerout', () => {
          this.input.setDefaultCursor('default');
          this.tweens.add({
            targets: container,
            scale: 1.0,
            duration: 100
          });
        });

        const key = `${playerIdx}_${tokenIdx}`;
        this.tokenSprites.set(key, container);
      });
    });
  }

  private handleTokenClick(playerIdx: number, tokenIdx: number) {
    const state = useGameStore.getState();
    const activePlayer = state.players[state.activePlayerIndex];

    const isMyValidToken = activePlayer?.isHuman && 
                           state.activePlayerIndex === playerIdx && 
                           state.validMoves.includes(tokenIdx) && 
                           state.gameStatus === 'WAITING_FOR_MOVE';

    if (isMyValidToken) {
      this.input.setDefaultCursor('default');
      state.selectToken(tokenIdx);
    }
  }

  private syncTokens(players: Player[]) {
    if (this.tokenSprites.size === 0) {
      this.initTokens(players);
      return;
    }

    players.forEach((player, playerIdx) => {
      player.tokens.forEach((position, tokenIdx) => {
        const key = `${playerIdx}_${tokenIdx}`;
        
        // If this token is currently in the middle of a path tween, skip static sync!
        if (this.activeMovingTokenKey === key) return;

        const container = this.tokenSprites.get(key);
        if (!container) return;

        const colorIdx = ['red', 'green', 'yellow', 'blue'].indexOf(player.color);
        const targetGrid = getTokenGridCoordinates(colorIdx, position, tokenIdx);
        const targetPixel = gridToPixel(targetGrid);

        const offset = this.calculateStackOffset(players, playerIdx, tokenIdx, targetGrid);
        const finalX = targetPixel.x + offset.x - 16;
        const finalY = targetPixel.y + offset.y - 16;

        if (Math.abs(container.x - finalX) > 2 || Math.abs(container.y - finalY) > 2) {
          // If token sent back to base (-1) from the board, play spin-shrink capture respawn animation
          if (position === -1 && !this.isInitializing) {
            // Play capture sound effect
            const { mute } = useGameStore.getState();
            playSound('capture', mute);

            this.tweens.add({
              targets: container,
              scale: 0,
              angle: 360,
              duration: 500,
              ease: 'Back.easeIn',
              onComplete: () => {
                container.setPosition(finalX, finalY);
                container.setAngle(0);
                
                this.tweens.add({
                  targets: container,
                  scale: 1.0,
                  duration: 400,
                  ease: 'Back.easeOut'
                });
              }
            });
          } else {
            // Standard smooth movement slide
            this.tweens.add({
              targets: container,
              x: finalX,
              y: finalY,
              scale: 1.0,
              duration: this.isInitializing ? 0 : 300,
              ease: 'Cubic.easeOut'
            });
          }
        }
      });
    });
  }

  private syncHighlights(state: any) {
    // Clear all previous highlight pulse tweens
    this.pulseTweens.forEach(t => t.stop());
    this.pulseTweens = [];

    // Reset scales of all token containers
    this.tokenSprites.forEach((container) => {
      container.setScale(1.0);
    });

    // Check if waiting for human move
    const activePlayer = state.players[state.activePlayerIndex];
    if (activePlayer?.isHuman && state.gameStatus === 'WAITING_FOR_MOVE') {
      state.validMoves.forEach((tokenIdx: number) => {
        const key = `${state.activePlayerIndex}_${tokenIdx}`;
        const container = this.tokenSprites.get(key);
        if (container) {
          // Glow pulse animation
          const pulse = this.tweens.add({
            targets: container,
            scale: 1.18,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
          this.pulseTweens.push(pulse);
        }
      });
    }
  }

  private checkMovingToken(state: any) {
    if (state.movingTokenInfo && !this.activeMovingTokenKey) {
      const { playerIdx, tokenIdx, startPos, endPos } = state.movingTokenInfo;
      const key = `${playerIdx}_${tokenIdx}`;
      
      this.activeMovingTokenKey = key;
      this.animatePathMove(playerIdx, tokenIdx, startPos, endPos);
    }
  }

  private animatePathMove(
    playerIdx: number,
    tokenIdx: number,
    startPos: number,
    endPos: number
  ) {
    const key = `${playerIdx}_${tokenIdx}`;
    const container = this.tokenSprites.get(key);
    if (!container) return;

    // Reset scales/highlights
    this.pulseTweens.forEach(t => t.stop());
    this.pulseTweens = [];
    this.tokenSprites.forEach(c => c.setScale(1.0));

    // Build the grid waypoint list
    const waypoints: { x: number; y: number }[] = [];
    const state = useGameStore.getState();
    const player = state.players[playerIdx];
    if (!player) return;
    const colorIdx = ['red', 'green', 'yellow', 'blue'].indexOf(player.color);

    if (startPos === -1) {
      // Releasing from base to index 0: just 1 step slide
      const grid = getTokenGridCoordinates(colorIdx, 0, tokenIdx);
      waypoints.push(gridToPixel(grid));
    } else {
      // Step-by-step path array
      for (let pos = startPos + 1; pos <= endPos; pos++) {
        const grid = getTokenGridCoordinates(colorIdx, pos, tokenIdx);
        waypoints.push(gridToPixel(grid));
      }
    }

    // Recursive step tweening
    const animateStep = (idx: number) => {
      if (idx >= waypoints.length) {
        // Complete! Notify Zustand store to update token position and run capture rules
        this.activeMovingTokenKey = null;
        useGameStore.getState().completeMove();
        return;
      }

      const point = waypoints[idx];
      
      this.tweens.add({
        targets: container,
        x: point.x - 16,
        y: point.y - 16,
        duration: 180,
        ease: 'Quad.easeInOut',
        onComplete: () => {
          // Play tick sound per step
          const { mute } = useGameStore.getState();
          playSound('tick', mute);

          // Subtle compression scale tick for squishy visual feel!
          this.tweens.add({
            targets: container,
            scaleX: 1.1,
            scaleY: 0.9,
            duration: 40,
            yoyo: true,
            ease: 'Bounce.easeOut',
            onComplete: () => {
              animateStep(idx + 1);
            }
          });
        }
      });
    };

    animateStep(0);
  }

  private calculateStackOffset(
    players: Player[],
    playerIdx: number,
    tokenIdx: number,
    grid: { x: number, y: number }
  ): { x: number, y: number } {
    const matchingTokens: { playerIdx: number; tokenIdx: number }[] = [];
    
    players.forEach((p, pIdx) => {
      const pColorIdx = ['red', 'green', 'yellow', 'blue'].indexOf(p.color);
      p.tokens.forEach((pos, tIdx) => {
        if (pos === -1) return;

        const coord = getTokenGridCoordinates(pColorIdx, pos, tIdx);
        if (coord.x === grid.x && coord.y === grid.y) {
          matchingTokens.push({ playerIdx: pIdx, tokenIdx: tIdx });
        }
      });
    });

    if (matchingTokens.length <= 1) {
      return { x: 0, y: 0 };
    }

    const idx = matchingTokens.findIndex(t => t.playerIdx === playerIdx && t.tokenIdx === tokenIdx);
    if (idx === -1) return { x: 0, y: 0 };

    const spacing = 7;
    const angles = [
      { x: -spacing, y: -spacing },
      { x: spacing, y: -spacing },
      { x: -spacing, y: spacing },
      { x: spacing, y: spacing }
    ];

    return angles[idx % angles.length];
  }

  private getColorHex(color: string): number {
    switch (color) {
      case 'red': return 0xef4444;
      case 'green': return 0x22c55e;
      case 'yellow': return 0xeab308;
      case 'blue': return 0x3b82f6;
      default: return 0xffffff;
    }
  }
}

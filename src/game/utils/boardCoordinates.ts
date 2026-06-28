export interface BoardCoord {
  x: number;
  y: number;
}

// 52 common path tiles around the board starting at Red's path index (1, 6)
export const globalPath: BoardCoord[] = [
  { x: 1, y: 6 },   // 0: Red Start
  { x: 2, y: 6 },   // 1
  { x: 3, y: 6 },   // 2
  { x: 4, y: 6 },   // 3
  { x: 5, y: 6 },   // 4
  { x: 6, y: 5 },   // 5
  { x: 6, y: 4 },   // 6
  { x: 6, y: 3 },   // 7
  { x: 6, y: 2 },   // 8
  { x: 6, y: 1 },   // 9
  { x: 6, y: 0 },   // 10
  { x: 7, y: 0 },   // 11
  { x: 8, y: 0 },   // 12
  { x: 8, y: 1 },   // 13: Green Start
  { x: 8, y: 2 },   // 14
  { x: 8, y: 3 },   // 15
  { x: 8, y: 4 },   // 16
  { x: 8, y: 5 },   // 17
  { x: 9, y: 6 },   // 18
  { x: 10, y: 6 },  // 19
  { x: 11, y: 6 },  // 20
  { x: 12, y: 6 },  // 21
  { x: 13, y: 6 },  // 22
  { x: 14, y: 6 },  // 23
  { x: 14, y: 7 },  // 24
  { x: 14, y: 8 },  // 25
  { x: 13, y: 8 },  // 26: Yellow Start
  { x: 12, y: 8 },  // 27
  { x: 11, y: 8 },  // 28
  { x: 10, y: 8 },  // 29
  { x: 9, y: 8 },   // 30
  { x: 8, y: 9 },   // 31
  { x: 8, y: 10 },  // 32
  { x: 8, y: 11 },  // 33
  { x: 8, y: 12 },  // 34
  { x: 8, y: 13 },  // 35
  { x: 8, y: 14 },  // 36
  { x: 7, y: 14 },  // 37
  { x: 6, y: 14 },  // 38
  { x: 6, y: 13 },  // 39: Blue Start
  { x: 6, y: 12 },  // 40
  { x: 6, y: 11 },  // 41
  { x: 6, y: 10 },  // 42
  { x: 6, y: 9 },   // 43
  { x: 5, y: 8 },   // 44
  { x: 4, y: 8 },   // 45
  { x: 3, y: 8 },   // 46
  { x: 2, y: 8 },   // 47
  { x: 1, y: 8 },   // 48
  { x: 0, y: 8 },   // 49
  { x: 0, y: 7 },   // 50
  { x: 0, y: 6 },   // 51
];

// Base coordinates for 4 tokens of each player (0: Red, 1: Green, 2: Yellow, 3: Blue)
export const baseCoords: BoardCoord[][] = [
  // 0: Red Base (Top Left)
  [
    { x: 1.5, y: 1.5 },
    { x: 3.5, y: 1.5 },
    { x: 1.5, y: 3.5 },
    { x: 3.5, y: 3.5 }
  ],
  // 1: Green Base (Top Right)
  [
    { x: 10.5, y: 1.5 },
    { x: 12.5, y: 1.5 },
    { x: 10.5, y: 3.5 },
    { x: 12.5, y: 3.5 }
  ],
  // 2: Yellow Base (Bottom Right)
  [
    { x: 10.5, y: 10.5 },
    { x: 12.5, y: 10.5 },
    { x: 10.5, y: 12.5 },
    { x: 12.5, y: 12.5 }
  ],
  // 3: Blue Base (Bottom Left)
  [
    { x: 1.5, y: 10.5 },
    { x: 3.5, y: 10.5 },
    { x: 1.5, y: 12.5 },
    { x: 3.5, y: 12.5 }
  ]
];

// Home Stretch coordinates (5 spaces for each player color)
export const homeStretches: BoardCoord[][] = [
  // 0: Red (row 7 left side, moving right)
  [
    { x: 1, y: 7 },
    { x: 2, y: 7 },
    { x: 3, y: 7 },
    { x: 4, y: 7 },
    { x: 5, y: 7 }
  ],
  // 1: Green (col 7 top side, moving down)
  [
    { x: 7, y: 1 },
    { x: 7, y: 2 },
    { x: 7, y: 3 },
    { x: 7, y: 4 },
    { x: 7, y: 5 }
  ],
  // 2: Yellow (row 7 right side, moving left)
  [
    { x: 13, y: 7 },
    { x: 12, y: 7 },
    { x: 11, y: 7 },
    { x: 10, y: 7 },
    { x: 9, y: 7 }
  ],
  // 3: Blue (col 7 bottom side, moving up)
  [
    { x: 7, y: 13 },
    { x: 7, y: 12 },
    { x: 7, y: 11 },
    { x: 7, y: 10 },
    { x: 7, y: 9 }
  ]
];

// Home central coordinates (finished position)
export const homeCoords: BoardCoord[] = [
  { x: 6, y: 7 }, // Red finishes on left center
  { x: 7, y: 6 }, // Green finishes on top center
  { x: 8, y: 7 }, // Yellow finishes on right center
  { x: 7, y: 8 }  // Blue finishes on bottom center
];

// Player start global path index mapping
export const startIndices = [0, 13, 26, 39];

// Safe zones indices on the globalPath
// index 0: Red start, index 8: Star, index 13: Green start, index 21: Star,
// index 26: Yellow start, index 34: Star, index 39: Blue start, index 47: Star
export const safeZonesGlobalIndices = [0, 8, 13, 21, 26, 34, 39, 47];

/**
 * Returns grid coordinates for a token
 * @param playerIndex Player ID (0-3)
 * @param position Position index (-1 to 56)
 * @param tokenIdx Token ID (0-3) for base slotting
 */
export function getTokenGridCoordinates(
  playerIndex: number,
  position: number,
  tokenIdx: number
): BoardCoord {
  // Base
  if (position === -1) {
    return baseCoords[playerIndex][tokenIdx];
  }
  
  // Home
  if (position === 56) {
    return homeCoords[playerIndex];
  }

  // Home Stretch
  if (position >= 51 && position <= 55) {
    const idx = position - 51;
    return homeStretches[playerIndex][idx];
  }

  // Common Path
  const startIdx = startIndices[playerIndex];
  const globalIdx = (startIdx + position) % 52;
  return globalPath[globalIdx];
}

/**
 * Converts a grid coordinate to canvas pixel position (600x600 canvas)
 */
export function gridToPixel(coord: BoardCoord, cellSize = 40): { x: number, y: number } {
  // If base coordinate (contains decimal slot offset already)
  if (coord.x % 1 !== 0 || coord.y % 1 !== 0) {
    return {
      x: coord.x * cellSize,
      y: coord.y * cellSize
    };
  }
  
  // Symmetrical cell centering
  return {
    x: coord.x * cellSize + cellSize / 2,
    y: coord.y * cellSize + cellSize / 2
  };
}

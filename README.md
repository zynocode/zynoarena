# 🎮 ZynoArena

<div align="center">

![ZynoArena Banner](https://img.shields.io/badge/ZynoArena-Browser%20Games-blueviolet?style=for-the-badge&logo=gamepad&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react&logoColor=black)
![Phaser](https://img.shields.io/badge/Phaser-3.x-orange?style=for-the-badge)

**An open-source collection of modern, AI-powered browser games.**  
Play offline. No accounts. No installs. Just open and play.

[🕹️ Play Now](#) · [🐛 Report Bug](https://github.com/zynocode/zynoarena/issues) · [💡 Request Feature](https://github.com/zynocode/zynoarena/issues)

</div>

---

## 🎲 Current Game — Ludo Royale AI

> A fully-featured Ludo game with intelligent CPU opponents, smooth animations, and a premium dark glassmorphism UI.

| Feature | Details |
|---|---|
| 🧠 AI Difficulty | Easy · Medium · Hard (scoring matrix) |
| 👥 Game Modes | 1v1 · 1v2 · 1v3 (Human vs CPU) |
| 🎵 Sound Effects | Procedural Web Audio (no files needed) |
| 📱 Responsive | Scales from 360px mobile to 1440px desktop |
| 🌐 Offline | Zero network dependency after load |
| ⚡ Tech Stack | React + Vite + TypeScript + Phaser 3 + Zustand |

### 🖼️ Screenshots

| Main Menu | Game Board | Game Over |
|---|---|---|
| Dark glassmorphism lobby | Vector-drawn Ludo board | Confetti + medal scoreboard |

---

## 🗺️ Roadmap

### ✅ Ludo Royale AI (Shipped)
- [x] Full Ludo rule engine (base release, captures, safe zones, home stretch)
- [x] 3-tier AI — Easy (random), Medium (priority), Hard (weight matrix)
- [x] Phaser 3 step-by-step token movement with bounce tweens
- [x] Capture spin-shrink-respawn animation
- [x] Procedural SFX via Web Audio API
- [x] Responsive CSS layout with `clamp()` sizing
- [x] Event banner overlays (capture, extra roll, 3-sixes void)
- [x] Game Over confetti + medal scoreboard

### 🔜 Coming Soon

| Game | Status |
|---|---|
| ♟ Chess | Planned |
| 🎯 Snake & Ladder | Planned |
| ❌ Tic Tac Toe | Planned |
| 🐍 Snake Game | Planned |
| 🧩 Sudoku | Planned |
| 🃏 Card Games | Planned |
| 🏓 Pong | Planned |
| 🏎 Racing Games | Planned |
| 🧠 Puzzle Games | Planned |

### 🚀 Platform Features
- [ ] Multiplayer (local & online)
- [ ] Online Matchmaking
- [ ] Tournament Mode
- [ ] Achievements & Badges
- [ ] Leaderboards
- [ ] User Profiles

---

## 🛠️ Tech Stack

```
Frontend   →  React 18 + TypeScript + Vite
Game Engine →  Phaser 3 (canvas rendering, tweens, input)
State       →  Zustand (reactive game state)
Styling     →  Vanilla CSS (glassmorphism, dark theme)
Audio       →  Web Audio API (procedural synthesis)
Build       →  Vite + Rolldown
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm

### Run Locally

```bash
# Clone the repo
git clone https://github.com/zynocode/zynoarena.git
cd zynoarena

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

---

## 🧠 AI Architecture (Ludo)

The CPU AI is modular — difficulty is selected per-player and plugged into a single decision engine:

```
Easy   →  Random token selection
Medium →  Priority queue: Capture > Escape Danger > Release > Advance Leader
Hard   →  Weighted scoring matrix per candidate move:
            +100  Capture opponent
            +90   Reach home
            +60   Escape threat zone
            +45   Enter home stretch
            +40   Release from base (on 6)
            +35   Land on safe zone
            +0.5  Per-tile proximity bonus
            -25   Step into danger zone
```

---

## 📁 Project Structure

```
src/
├── components/         # React UI components (Dice, MainMenu)
├── game/
│   ├── scenes/         # Phaser scenes (MainScene)
│   └── utils/          # Board coordinates, AI engine, Audio
├── store/              # Zustand game state
└── App.tsx             # Root layout + CPU scheduler
```

---

## 🤝 Contributing

Contributions are welcome! To add a new game:

1. Fork the repo
2. Create a new folder under `src/games/<game-name>/`
3. Implement your game using the existing tech stack
4. Submit a PR with a demo screenshot

Please follow the existing code style and keep components modular.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Made with ❤️ by [zynocode](https://github.com/zynocode)

⭐ Star this repo if you like it!

</div>

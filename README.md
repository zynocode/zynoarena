# 🎮 OpenBoard Arcade

<div align="center">

[![OpenBoard Arcade](https://img.shields.io/badge/OpenBoard%20Arcade-Browser%20Games-blueviolet?style=for-the-badge&logo=gamepad&logoColor=white)](https://github.com/zynocode/openboard-arcade)
[![Version](https://img.shields.io/github/v/release/zynocode/openboard-arcade?style=for-the-badge&color=brightgreen&label=version)](https://github.com/zynocode/openboard-arcade/releases)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Stars](https://img.shields.io/github/stars/zynocode/openboard-arcade?style=for-the-badge&color=yellow)](https://github.com/zynocode/openboard-arcade/stargazers)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646cff?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Phaser](https://img.shields.io/badge/Phaser-4.x-orange?style=flat-square&logo=phaser&logoColor=white)](https://phaser.io/)
[![Open Issues](https://img.shields.io/github/issues/zynocode/openboard-arcade?style=flat-square)](https://github.com/zynocode/openboard-arcade/issues)
[![Last Commit](https://img.shields.io/github/last-commit/zynocode/openboard-arcade?style=flat-square)](https://github.com/zynocode/openboard-arcade/commits/main)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)](CONTRIBUTING.md)

**An open-source collection of modern, AI-powered browser games.**
Play offline. No accounts. No installs. Just open and play.

[🕹️ Play Now →](https://github.com/zynocode/openboard-arcade) &nbsp;·&nbsp; [🐛 Report Bug](https://github.com/zynocode/openboard-arcade/issues/new?labels=bug) &nbsp;·&nbsp; [💡 Request Feature](https://github.com/zynocode/openboard-arcade/issues/new?labels=enhancement) &nbsp;·&nbsp; [🤝 Contribute](CONTRIBUTING.md)

</div>

---

## 🎲 Current Game — Ludo Royale

> A fully-featured Ludo game with intelligent CPU opponents, smooth animations, and a premium dark glassmorphism UI.

| Feature | Details |
|---|---|
| 🧠 AI Difficulty | Easy · Medium · Hard (weighted scoring matrix) |
| 👥 Game Modes | 1v1 · 1v2 · 1v3 (Human vs CPU) |
| 🎵 Sound Effects | Hybrid (Web Audio API + CC0 Dice Roll OGG) |
| 📱 Responsive | Scales from 360px mobile to 1440px desktop |
| 🌐 Offline | Zero network dependency after load |
| ⚡ Tech Stack | React 19 + Vite 8 + TypeScript + Phaser 4 + Zustand |

### 🖼️ Screenshots

| Main Menu | Game Board | Game Over |
|---|---|---|
| Dark glassmorphism lobby | Vector-drawn Ludo board | Confetti + medal scoreboard |

> 💡 *Screenshots coming soon — contributions welcome!*

---

## 🗺️ Roadmap

### ✅ v1.0.0 — Ludo Royale (Released)
- [x] Full Ludo rule engine (base release, captures, safe zones, home stretch)
- [x] 3-tier AI — Easy (random), Medium (priority), Hard (weight matrix)
- [x] Phaser 4 step-by-step token movement with bounce tweens
- [x] Capture spin-shrink-respawn animation
- [x] Procedural SFX via Web Audio API
- [x] Responsive CSS layout with `clamp()` sizing
- [x] Event banner overlays (capture, extra roll, 3-sixes void)
- [x] Game Over confetti + medal scoreboard
- [x] Local multiplayer with custom player names

### 🔜 v2.0.0 — Coming Soon

| Game | Status | Priority |
|---|---|---|
| ♟ Chess | Planned | High |
| 🎯 Snake & Ladder | Planned | High |
| ❌ Tic Tac Toe | Planned | Medium |
| 🐍 Snake Game | Planned | Medium |
| 🧩 Sudoku | Planned | Medium |
| 🃏 Card Games (21/Solitaire) | Planned | Low |
| 🏓 Pong | Planned | Low |
| 🏎 Racing Games | Planned | Low |
| 🧠 Puzzle Games | Planned | Low |

### 🚀 Platform Features (Future)
- [ ] Online Multiplayer & Matchmaking
- [ ] Tournament Mode
- [ ] Achievements & Badges
- [ ] Global Leaderboards
- [ ] User Profiles & Stats

---

## 🛠️ Tech Stack

```
Frontend     →  React 19 + TypeScript 5.x + Vite 8
Game Engine  →  Phaser 4 (canvas rendering, tweens, physics, input)
State        →  Zustand 5 (reactive game state)
Styling      →  Vanilla CSS (glassmorphism dark theme, clamp() responsive)
Audio        →  Hybrid (Web Audio API + Real CC0 Dice Roll OGG)
Linting      →  oxlint (fast Rust-based linter)
Build        →  Vite + Rolldown
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org))
- **npm** 9+ or **pnpm** 8+

### Run Locally

```bash
# 1. Clone the repo
git clone https://github.com/zynocode/openboard-arcade.git
cd openboard-arcade

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build    # TypeScript check + Vite build
npm run preview  # Preview production build locally
```

### Lint

```bash
npm run lint     # Run oxlint
```

---

## 🧠 AI Architecture (Ludo)

The CPU AI is modular — difficulty is selected per-player at game start and plugged into a single decision engine:

```
Easy   →  Random token selection from all legal moves

Medium →  Priority queue:
          Capture > Escape Danger > Release from Base > Advance Leader

Hard   →  Weighted scoring matrix per candidate move:
            +100  Capture opponent token
            +90   Reach home column (win move)
            +60   Escape an active threat zone
            +45   Enter home stretch
            +40   Release token from base (on roll of 6)
            +35   Land on a safe zone cell
            +0.5  Per-tile proximity bonus (advancement)
            -25   Step into an opponent's danger zone
```

The engine returns the **highest-scoring legal move** deterministically (no RNG in Hard mode).

---

## 📁 Project Structure

```
openboard-arcade/
├── public/                  # Static assets
├── src/
│   ├── assets/              # Images, icons, audio (.ogg)
│   ├── audio/               # Secure AudioManager, synths, and audio hook
│   ├── components/          # React UI components (Dice, MainMenu, Lobby)
│   ├── game/
│   │   ├── scenes/          # Phaser scenes (MainScene)
│   │   ├── utils/           # Board coordinates, AI engine
│   │   └── serverEngine.ts  # Authoritative backend & memory encryption engine
│   ├── store/               # Zustand game state slices
│   ├── App.tsx              # Root layout + CPU scheduler
│   ├── main.tsx             # React entry point
│   └── index.css            # Global styles (glassmorphism design system)
├── CONTRIBUTING.md          # Contribution guidelines
├── LICENSE                  # MIT License
├── package.json
├── vite.config.ts
└── README.md
```

---

## 🤝 Contributing

We love contributions! Whether it's a bug fix, a new game, or a UI improvement — all are welcome.

Read our **[Contributing Guide](CONTRIBUTING.md)** to get started.

**Quick start for contributors:**
```bash
git checkout -b feat/your-feature-name
# make your changes
npm run lint && npm run build
git commit -m "feat: describe your change"
# open a PR 🎉
```

Please follow [Conventional Commits](https://www.conventionalcommits.org/) and keep components modular.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

You are free to use, modify, and distribute this code — just keep the attribution.

---

## 🌟 Acknowledgements

- [Phaser](https://phaser.io/) — The powerful HTML5 game framework
- [React](https://react.dev/) — UI component library
- [Zustand](https://github.com/pmndrs/zustand) — Lightweight state management
- [Vite](https://vitejs.dev/) — Lightning-fast build tooling
- All [contributors](https://github.com/zynocode/openboard-arcade/graphs/contributors) who make this project better ❤️

---

<div align="center">

Made with ❤️ by [zynocode](https://github.com/zynocode)

⭐ **Star this repo** if you find it useful — it helps us grow!

[![GitHub Stars](https://img.shields.io/github/stars/zynocode/openboard-arcade?style=social)](https://github.com/zynocode/openboard-arcade/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/zynocode/openboard-arcade?style=social)](https://github.com/zynocode/openboard-arcade/network/members)
[![Follow zynocode](https://img.shields.io/github/followers/zynocode?style=social&label=Follow%20zynocode)](https://github.com/zynocode)

</div>

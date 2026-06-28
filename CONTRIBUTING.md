# 🤝 Contributing to ZynoArena

Thank you for your interest in contributing to **ZynoArena**! We love contributions of all kinds — bug fixes, new games, UI improvements, AI enhancements, or even documentation.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Adding a New Game](#adding-a-new-game)
- [Commit Style](#commit-style)
- [Pull Request Process](#pull-request-process)
- [Labels Guide](#labels-guide)

---

## 📜 Code of Conduct

Be respectful, inclusive, and constructive. We follow the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

---

## 🚀 Getting Started

```bash
# Fork and clone the repo
git clone https://github.com/<your-username>/zynoarena.git
cd zynoarena

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🛠️ How to Contribute

### 🐛 Bug Reports
- Use the [Bug Report](https://github.com/zynocode/zynoarena/issues/new?labels=bug) issue template
- Include steps to reproduce, browser/OS info, and screenshots if possible

### 💡 Feature Requests
- Use the [Feature Request](https://github.com/zynocode/zynoarena/issues/new?labels=enhancement) issue template
- Describe the feature, why it's useful, and any design ideas

### 🔧 Code Contributions
1. **Check existing issues** — comment on one you want to work on
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
3. **Make your changes** following the code style
4. **Test your changes** — run the dev server and lint
5. **Submit a PR** with a clear description

---

## 🎮 Adding a New Game

Adding a new game is the most impactful contribution! Here's the structure:

```
src/
└── games/
    └── <game-name>/
        ├── index.tsx          # Game entry component
        ├── scenes/            # Phaser scenes (if using Phaser)
        ├── store/             # Game-specific Zustand store
        ├── utils/             # Game logic / AI
        └── <game-name>.css    # Game-specific styles
```

**Requirements for a new game PR:**
- [ ] Follows the existing tech stack (React + Vite + TypeScript + Phaser 3 / Zustand)
- [ ] Has at least one AI/CPU opponent (if applicable)
- [ ] Is responsive (works on mobile and desktop)
- [ ] Uses the dark glassmorphism design system from `index.css`
- [ ] Includes a demo screenshot in the PR description
- [ ] Updates the Roadmap section in `README.md`

---

## ✍️ Commit Style

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add chess game with stockfish-lite AI
fix: correct ludo safe zone collision detection
docs: update README roadmap with chess status
style: improve board responsive layout for mobile
refactor: extract AI engine to separate module
perf: optimize token movement tween batch
chore: bump phaser to v4.3.0
```

Keep subject lines under 72 characters. Use the body to explain *why*, not *what*.

---

## 📥 Pull Request Process

1. Ensure `npm run lint` passes with no errors
2. Make sure `npm run build` completes without errors
3. Fill out the PR template completely
4. Link the related issue (e.g., `Closes #42`)
5. Request a review from a maintainer

PRs are merged via **Squash and Merge** to keep a clean history.

---

## 🏷️ Labels Guide

| Label | When to use |
|---|---|
| `bug` | Something is broken |
| `enhancement` | New feature or improvement |
| `🎮 game` | New game addition |
| `🧠 ai` | CPU/AI logic changes |
| `🎨 ui/ux` | Visual and design changes |
| `⚡ performance` | Speed or rendering improvements |
| `documentation` | Docs only |
| `good first issue` | Beginner-friendly |
| `help wanted` | Extra eyes needed |

---

## 💬 Questions?

Open a [GitHub Discussion](https://github.com/zynocode/zynoarena/discussions) or reach out via [zynocode](https://github.com/zynocode).

---

<div align="center">

Made with ❤️ by the [zynocode](https://github.com/zynocode) team

</div>

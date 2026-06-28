# Ludo Royale AI

## Overview
Modern single-player Ludo game — human vs intelligent CPU opponents. Offline-first, mobile-responsive web game with authentic rules, smooth animations, sound effects, and progressively smarter AI.

## Problem
Most Ludo games need internet/real players. Users want instant offline matches against smart opponents that feel human.

## Tech Stack
| Layer | Choice |
|-------|--------|
| Framework | React + TypeScript |
| Build | Vite |
| Game Engine | Phaser 3 |
| State | Zustand |
| Backend | None (MVP) |
| Deploy | Vercel/Netlify |

## Architecture
- **React** → UI layers (menus, HUD, overlays, settings)
- **Phaser 3** → Game canvas (board, tokens, dice, animations)
- **Zustand** → Shared state bridge between React and Phaser
- **Modular AI** → Pluggable difficulty strategies (Easy/Medium/Hard)

## Game Modes
- 1 Human vs 1 CPU
- 1 Human vs 2 CPUs
- 1 Human vs 3 CPUs

## AI Levels
| Level | Strategy |
|-------|----------|
| Easy | Random valid moves |
| Medium | Priority: capture > escape danger > advance toward home |
| Hard | Scoring function: capture opportunity, danger avoidance, home proximity, strategic token opening |

## Team
Solo developer. Architecture follows professional standards for future team scaling.

## Status
Greenfield — Phase 1 completed.

## Future Scope
Online multiplayer (Socket.IO), rankings, daily rewards, themes, tournaments, chat, achievements, cloud sync. Architecture must support extension without major refactoring.

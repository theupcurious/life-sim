# SOMEONE — A Life Simulation

Live a full life in minutes. SOMEONE is a narrative life simulation where you create a character in one of the world's great cities, make pivotal decisions across education, career, love, and family, and watch those choices ripple across a deeply branching lifetime — from birth to death and back again.

![React](https://img.shields.io/badge/React-19-61dafb) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![Made by Upcurious](https://img.shields.io/badge/by-Upcurious-00ffff)

## How it Works

The game runs across two synchronized panels:

- **Flowchart** — a visual map of your life path. Nodes glow cyan as you visit them; taken connections light up so you can see exactly where you've been and what branches remain.
- **Story panel** — narrative text, character stats (Health / Wealth / Happiness), a responsive pixel-art scene, and decision choices. An age progress bar tracks where you are in the arc of a life.

After death, **Relive Mode** unlocks — jump back to any visited node and explore the roads not taken.

## Features

- **7 world cities** — Tokyo, Beijing, Shanghai, New York, San Francisco, Toronto, Singapore, each with unique narrative flavor, city-specific skylines, and cultural nuance.
- **Era-Specific Events** — Context-aware generation injects unique historical milestones based on your character's birth year and city (e.g., the 90s dot-com boom in SF, or the post-Olympics era in Beijing).
- **Deeply Branching Paths** — Decisions don't just change stats; they alter the sequence of events. Education, career, and family choices branch into unique mid-phase narrative arcs before reconverging.
- **Personality-Driven Life Tracking** — Traits automatically assign skills, flavor text descriptions, and even dynamically determine the timing of major life choices like marriage and commitment. 
- **Stat-gated choices** — some paths require minimum Health, Wealth, or Happiness to unlock, shown with a reason rather than hidden.
- **Procedural pixel art** — Seeded city skylines with city-specific landmarks rendered in SVG, dynamically adjusting for day/night cycles and weather based on the character's progress.
- **Life summary** — an obituary-style paragraph synthesized from your actual decisions.
- **Share card** — capture your character's life as a 1200×630 image, copied to clipboard or downloaded.
- **Relive Mode** — after death, revisit any node to explore alternate futures.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── store/
│   └── gameStore.ts          # Game state, actions, skill derivation
├── data/
│   ├── storyGenerator.ts     # Node generation, era events, branching paths
│   └── cityProfiles.ts       # City palettes, landmarks, cultural nuance
├── types/
│   └── game.ts               # TypeScript types (Character, StoryNode, Choice)
├── components/
│   ├── screens/
│   │   ├── TitleScreen.tsx
│   │   ├── CharacterCreationScreen.tsx
│   │   ├── GameScreen.tsx
│   │   └── SummaryScreen.tsx # Life summary + share card
│   ├── flowchart/
│   │   ├── Flowchart.tsx     # Zoom/pan canvas
│   │   ├── FlowchartNode.tsx # Node shapes + visited/active styling
│   │   └── ConnectionLines.tsx # Cyan glow on taken paths
│   └── panels/
│       ├── InfoPanel.tsx     # Narrative, stats, age bar, choices, responsive flex layout
│       └── ScenePixelArt.tsx # Procedural city skyline SVG renderer
```

## Tech Stack

- **React 19** + TypeScript
- **Zustand** — game state management
- **Framer Motion** — screen transitions and UI animation
- **Tailwind CSS** — utility styling
- **Vite** — development server and production build

---

Made with ♥ by [Upcurious](https://theupcurious.com)

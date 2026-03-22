# SOMEONE - Global City Life Simulation

SOMEONE is a narrative life-simulation game where you create a character in a major world city, make major life decisions, and watch those choices shape a branching life timeline from birth to death.

The experience is built around two synchronized views:
- Flowchart view: a visual life path with branching nodes.
- Story panel: scene text, character stats, and decision choices.

## Core Gameplay

1. Start a new life and create a character (or generate one randomly).
2. Progress through life events and decision points.
3. Choose paths that affect health, money, happiness, occupation, and outcomes.
4. Reach the end of life, then relive from visited points to explore different futures.

## Tech Stack

- React 19 + TypeScript
- Zustand for game state
- Framer Motion for transitions and UI animation
- Tailwind CSS for styling
- Vite for development and build

## Getting Started

```bash
npm install
npm run dev
```

Open the local Vite URL shown in your terminal (usually `http://localhost:5173`).

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Type-check and build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Project Structure

- `src/store/gameStore.ts` - Game state and core actions
- `src/data/storyGenerator.ts` - Story node and connection generation
- `src/components/screens/` - Main game screens
- `src/components/flowchart/` - Flowchart renderer and node visuals
- `src/components/panels/InfoPanel.tsx` - Narrative, stats, and choices UI

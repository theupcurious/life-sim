# Replayability Refactor Plan

## Objective

Increase replayability so that:

- repeated runs do not collapse into the same midgame and late-game storylines
- city choice changes gameplay structure, not just descriptive text
- major decisions create long-tail consequences that alter future opportunities
- stats and personality traits redirect content instead of only gating isolated choices
- each run samples a subset of possible life arcs rather than walking a mostly fixed backbone

## Current Problems

The current game generates one full life graph up front in `src/data/storyGenerator.ts` from the starting character alone. That creates several structural issues:

- early branches reconverge too quickly into shared nodes
- `madeDecisions` in `src/store/gameStore.ts` is recorded, but later content generation does not materially depend on it
- city choice mostly affects prose and flavor, not mechanics or arc availability
- traits and stats influence text and some requirements, but not chapter routing
- outcomes resolve too locally, so choices rarely echo decades later
- there is at least one fake-variation bug in the career opener path selection

## Design Principles

1. Major choices must leave persistent state behind.
2. Convergence is allowed, but only after each major fork produces distinct downstream content.
3. Cities should bias opportunity, pressure, and risk, not just aesthetics.
4. Runs should draw from mutually exclusive chapter families.
5. Traits and accumulated stats should change what kinds of problems the player sees.
6. Consequences should often resolve one or two chapters later rather than immediately.

## Target Architecture

### 1. Add a persistent life-state model

Introduce a structured life-state layer that sits alongside `Character` and `GameState`.

Planned additions in `src/types/game.ts`:

- `LifeArc`
- `LifeFlags`
- `LifeConsequences`
- `CityModifiers`
- `ChapterTemplate` or equivalent typed chapter definition
- `GeneratedChapter`

Suggested shape:

```ts
export type LifeState = {
  city: SupportedCity;
  educationArc?: 'elite-academic' | 'practical-work' | 'creative-self-made' | 'restless-explorer';
  careerArc?: 'corporate-climb' | 'creative-precarity' | 'founder-volatility' | 'stable-craft' | 'public-service';
  relationshipArc?: 'early-family' | 'independent' | 'late-commitment' | 'serial-reinvention' | 'chosen-family';
  familyArc?: 'caregiver' | 'provider' | 'estranged' | 'childfree' | 'multigenerational';
  healthArc?: 'resilient' | 'neglected' | 'recovery' | 'disciplined';
  mobilityArc?: 'rooted' | 'migrant' | 'global-opportunist';
  values: string[];
  tags: string[];
  delayedConsequences: string[];
  unlockedChapterPools: string[];
  blockedChapterPools: string[];
};
```

This state should become the main routing input for future chapter generation.

### 2. Move from full-life generation to chapter-based generation

Replace the current "generate every node at character creation" model with staged generation:

- generate a fixed opening chapter set for childhood and adolescence
- generate the next major chapter after each milestone decision
- append future nodes based on current `LifeState`, city modifiers, trait profile, and delayed consequences

This can be implemented in two steps:

- Phase 1 hybrid: keep current graph structure, but generate the next 1 to 2 chapters from decision state
- Phase 2 full: generate chapters on demand instead of a full lifetime tree

## File-Level Work Plan

### `src/types/game.ts`

Add new core types:

- `LifeState`
- `LifeTag`
- `DelayedConsequence`
- `CityModifierProfile`
- `ChapterKey`
- `ChapterContext`
- `ChapterResult`

Update existing types:

- `Choice.effects` should support state mutations, not only stat deltas
- `GameState` should include `lifeState`
- optionally add `history` or `decisionLog` entries with timestamps for downstream generation

### `src/store/gameStore.ts`

Refactor the store so it owns both current character stats and persistent life-state.

Planned changes:

- initialize `lifeState` during character creation
- when a choice is made, update:
  - visible stats on `character`
  - persistent arc/tag state on `lifeState`
  - delayed consequence queues
- after milestone decisions, generate and append the next chapter(s)
- stop treating `nodes` as a fully static graph after game start

New helper responsibilities:

- `applyChoiceEffects`
- `applyLifeStateEffects`
- `queueDelayedConsequences`
- `generateNextChapterIfNeeded`
- `rebuildConnectionsForVisibleGraph`

### `src/data/cityProfiles.ts`

Extend city profiles from flavor packs into gameplay profiles.

Add city-level mechanics such as:

- dominant industries
- cost-of-living pressure
- family-duty pressure
- social mobility profile
- risk/reward multiplier
- migration friendliness
- exclusive chapter pools
- exclusive random events

Example direction:

- `San Francisco`: startup, volatility, housing pressure, identity freedom
- `Singapore`: stability, compliance, global finance, pragmatic family planning
- `New York`: media, finance, social hustle, chosen-family networks
- `Beijing`: exam pressure, family duty, institutional careers, status expectations
- `Tokyo`: social harmony, endurance, stable organizations, quiet alienation

### `src/data/storyGenerator.ts`

This is the main rewrite target.

Refactor into separable systems:

- chapter selection
- node generation
- choice generation
- delayed consequence resolution
- city-specific injections
- convergence rules

Suggested internal split:

- `buildInitialLifeState(character, profile)`
- `generateOpeningChapters(context)`
- `generateCareerChapter(context)`
- `generateRelationshipChapter(context)`
- `generateMidlifeChapter(context)`
- `generateLateLifeChapter(context)`
- `resolveDelayedConsequences(context)`
- `chooseChapterFamily(context)`
- `generateChapterNodes(template, context)`

Immediate fixes inside this file:

- fix the career opener bug so prior education choices map to the correct opener
- remove hardcoded reconvergence where different branches immediately point to the same next node
- make chapter selection depend on actual `lifeState`, not only birth inputs

## Workstreams Mapped To The Six Problems

### 1. Persistent life flags

Implementation:

- add `lifeState` to the type system and store
- let major choices write structured arc values and tags
- treat those tags as first-class routing inputs

Acceptance criteria:

- two runs with different education or career decisions produce different chapter pools
- debug output can show which persistent tags are currently active

### 2. Stop collapsing branches into one shared node

Implementation:

- replace universal backbone nodes with branch families
- require every major fork to produce at least one later exclusive chapter before any reconvergence
- preserve some shared end themes, but arrive there through different content

Acceptance criteria:

- education branches do not all flow into the same age-25 chapter
- career branches do not all flow into the same work-life chapter
- relationship and family arcs remain distinct through at least one midlife beat

### 3. Make city affect mechanics

Implementation:

- define city modifiers in `cityProfiles.ts`
- attach city-specific chapter pools and risk tables
- weight outcomes and opportunity availability by city

Acceptance criteria:

- city choice changes available career and social arcs
- at least two exclusive chapter families exist per city
- city can alter both narrative options and difficulty tradeoffs

### 4. Add mutually exclusive chapter families

Implementation:

- create chapter pools by life domain
- let a run sample only some of them based on state
- explicitly block incompatible pools when one family is chosen

Initial family set:

- `high-ambition-urban-climb`
- `creative-precarity`
- `family-duty`
- `late-bloomer-reinvention`
- `global-migrant`
- `quiet-rooted-life`

Acceptance criteria:

- a single run cannot traverse all major chapter families
- replaying with different cities and decisions unlocks visibly different map structures

### 5. Route content using traits and stats

Implementation:

- convert stats from passive scorekeeping into chapter selectors
- let trait combinations bias chapter eligibility and choice outcomes
- use thresholds and trends, not only current static values

Examples:

- low health in midlife unlocks recovery and limitation arcs
- high empathy increases caregiving, counseling, and community paths
- adventurous plus mobility tags increases relocation and unstable-opportunity arcs
- cautious plus stable finances increases institutional and steady-growth arcs

Acceptance criteria:

- stat trajectories change which chapters appear
- traits matter beyond line-level prose variation

### 6. Introduce delayed consequences

Implementation:

- let choices add future consequence tokens
- resolve those tokens after a time gap or milestone
- surface the callback in node descriptions and available branches

Examples:

- teenage rebellion causes later credential penalties but unlocks unconventional resilience paths
- early financial recklessness creates debt pressure chapters later
- sustained family sacrifice produces later regret, pride, or burnout variants

Acceptance criteria:

- important decisions have visible callbacks at least one chapter later
- players can trace late outcomes back to earlier choices

## Delivery Plan

### Phase 1: Foundation and bug fixes

Scope:

- add `LifeState` and supporting types
- add city modifiers to `cityProfiles.ts`
- add store support for persistent state and consequence queues
- fix the career opener bug
- add instrumentation for active arcs and delayed consequences

Deliverables:

- typed life-state model
- milestone choices update persistent state
- generator helpers can read that state

### Phase 2: Career and city replayability rewrite

Scope:

- rewrite education to career transitions
- split career into distinct chapter families
- wire city mechanics into opportunity generation
- ensure early-city and early-career decisions create exclusive downstream chapters

Deliverables:

- differentiated young-adult and early-midlife career paths
- city-specific career pools and pressure systems

### Phase 3: Relationship and family replayability rewrite

Scope:

- split relationship arcs from generic family reconvergence
- add independent, early-family, late-commitment, and chosen-family tracks
- add family-duty and caregiving consequences

Deliverables:

- relationship and family content no longer collapses into one universal family chapter

### Phase 4: Midlife and late-life consequence system

Scope:

- make midlife chapters depend on accumulated arcs and unresolved consequences
- add reinvention, legacy, health-reckoning, and caretaking families
- restructure late-life generation around what happened earlier

Deliverables:

- midlife and late-life runs feel materially different across playthroughs

### Phase 5: UI and debugging support

Scope:

- expose active arc tags in a dev/debug view
- optionally annotate map nodes with why they appeared
- improve summary output so end states reflect the run’s actual path family

Deliverables:

- easier balancing and QA
- clearer player-facing causality

## Implementation Order

1. Define new types and state containers.
2. Refactor store updates so choices can mutate persistent state.
3. Add city mechanic profiles.
4. Extract generator helpers and fix known bugs.
5. Rewrite career generation.
6. Rewrite relationship and family generation.
7. Rewrite midlife and late-life generation.
8. Add debug and balancing support.

## Testing Strategy

### Automated

- unit tests for `LifeState` mutation helpers
- unit tests for city modifier application
- unit tests for delayed consequence scheduling and resolution
- generator tests asserting that different input states produce different chapter families
- regression tests for known convergence failures

### Simulation

Add a lightweight run simulator that can auto-play many runs with seeded randomness and report:

- chapter family frequency
- city-specific arc distribution
- reconvergence rate
- dead-end or impossible branch rate
- average unique nodes per run

This should be used to catch hidden convergence after refactors.

### Manual QA

Run targeted playthrough matrices such as:

- same city, different education choices
- same personality, different cities
- same city, different trait mixes
- same early choice, different later stat trajectories

Success means the map shape, not only the prose, changes visibly.

## Success Metrics

- the same starting city can lead to materially different midgame structures
- different cities produce different dominant chapter families
- early choices affect content at least one chapter later
- repeat runs expose new chapter pools instead of recycled backbone nodes
- the map shows meaningful structural variation across playthroughs

## Risks

- chapter explosion can make balancing and testing harder
- too much branching can create thin content if each branch is underwritten
- dynamic generation can complicate map layout and connection rendering
- state explosion can make bug diagnosis difficult without debugging tools

## Risk Controls

- use chapter families instead of unrestricted combinatorial branching
- allow selective convergence only after exclusive content has paid off
- add debug labels and simulation tooling early
- keep life-state tags constrained and typed rather than free-form

## Non-Goals For The First Pass

- full narrative rewriting of every existing node
- procedural text generation beyond current authored style
- major UI redesign unrelated to replayability
- perfect balancing before the new chapter system exists

## End State

When this plan is complete, the game should behave less like one authored life tree with cosmetic variation and more like a stateful life-sim engine where city, personality, choices, and accumulated consequences produce recognizably different lives.

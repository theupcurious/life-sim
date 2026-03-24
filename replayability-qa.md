# Replayability QA Snapshot

Date: 2026-03-24

## Automated Checks

### 1) Staged Generation Assertions

Command:

```bash
npm run test:replayability
```

Result:

- PASS initial chapter is bounded to opening content
- PASS education choice maps to the correct career decision node
- PASS city mechanics affect global career track availability
- PASS staged append can reach ending without duplicate node ids
- Replayability assertions passed: `4/4`

### 2) Build + Type Safety

Command:

```bash
npm run build
```

Result:

- PASS (`tsc -b` + `vite build`)

## Diagnostics Matrix

All runs used:

```bash
npm run diagnose:replayability -- --runs 5 --cities <CITY_A>,<CITY_B>
```

### Matrix A: Tokyo vs San Francisco

- Runs: `10`
- Average unique nodes/run: `32.00`
- Average unique node ratio: `1.000`
- Shared-node coverage: `24.3%`

Observed differentiation:

- Tokyo career arcs skewed to `stable-craft`; San Francisco skewed to `founder-volatility` and `global-operator`.
- Tokyo education mix favored `elite-academic`; San Francisco mix leaned `practical-work`.
- Mobility outcomes diverged (`global-opportunist` vs `migrant` presence).

### Matrix B: Singapore vs New York

- Runs: `10`
- Average unique nodes/run: `32.00`
- Average unique node ratio: `1.000`
- Shared-node coverage: `24.1%`

Observed differentiation:

- Singapore career outcomes centered on `stable-craft` with some `global-operator`.
- New York produced a broader spread including `corporate-climb`, `creative-precarity`, and `global-operator`.
- Family arcs diverged (`caregiver/provider` in Singapore vs stronger `caregiver/multigenerational` in New York sample).

### Matrix C: Beijing vs Toronto

- Runs: `10`
- Average unique nodes/run: `32.00`
- Average unique node ratio: `1.000`
- Shared-node coverage: `36.8%`

Observed differentiation:

- Beijing mix had more `creative-precarity` and `corporate-climb` outcomes in this sample.
- Toronto skewed toward `restless-explorer` education and `stable-craft`/`global-operator` careers.
- Both cities still showed stronger overlap than the first two matrices (higher shared-node coverage).

## Current QA Read

What is validated:

- Staged generation APIs behave correctly for key transitions.
- Education-to-career opener mismatch bug is fixed.
- City mechanics materially influence available branch families.
- Incremental chapter append can reach ending without duplicate node IDs.

Residual gaps:

- No formal CI test integration yet (checks are script-based).
- Shared-node coverage is still non-trivial in some city pairs (`36.8%` in Beijing/Toronto sample), indicating more branch-family differentiation is still possible.

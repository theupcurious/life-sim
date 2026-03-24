import { generateConnections, generateLifeStory, generateRandomCharacter } from './storyGenerator.ts';
import { SUPPORTED_CITIES, type SupportedCity } from './cityProfiles.ts';
import type { Character, Choice, StoryNode } from '@/types/game';

declare const process: {
  argv: string[];
  stdout: {
    write: (value: string) => void;
  };
};

export type ReplayabilityDiagnosticsOptions = {
  runsPerCity?: number;
  cities?: SupportedCity[];
  seedBase?: string;
};

export type ReplayabilityRunSummary = {
  seed: string;
  city: SupportedCity;
  character: Pick<Character, 'name' | 'gender' | 'birthplace' | 'birthYear' | 'personality' | 'skills' | 'childhoodDream'>;
  path: string[];
  visitedNodeCount: number;
  uniqueNodeCount: number;
  decisionCount: number;
  chapterFamilies: Record<string, number>;
  finalLifeState: DiagnosticLifeState;
};

export type ReplayabilityCityArcDistribution = {
  educationArcs: Record<string, number>;
  careerArcs: Record<string, number>;
  relationshipArcs: Record<string, number>;
  familyArcs: Record<string, number>;
  healthArcs: Record<string, number>;
  mobilityArcs: Record<string, number>;
  tags: Record<string, number>;
  values: Record<string, number>;
};

export type ReplayabilityDiagnosticsReport = {
  options: Required<ReplayabilityDiagnosticsOptions>;
  runs: ReplayabilityRunSummary[];
  aggregate: {
    totalRuns: number;
    chapterFamilyFrequency: Record<string, number>;
    cityArcDistribution: Record<SupportedCity, ReplayabilityCityArcDistribution>;
    reconvergence: {
      averageUniqueNodesPerRun: number;
      averageUniqueNodeRatio: number;
      averageRepeatedNodeVisitsPerRun: number;
      sharedNodeCoverage: number;
      mostCommonNodes: Array<{ nodeId: string; frequency: number }>;
    };
  };
};

type DiagnosticQueuedConsequence = {
  id: string;
  resolveAtAge: number;
  status: 'queued' | 'resolved';
  tags: string[];
};

type DiagnosticLifeState = {
  city: SupportedCity;
  educationArc?: string;
  careerArc?: string;
  relationshipArc?: string;
  familyArc?: string;
  healthArc?: string;
  mobilityArc?: string;
  values: string[];
  tags: string[];
  delayedConsequences: DiagnosticQueuedConsequence[];
  unlockedChapterPools: string[];
  blockedChapterPools: string[];
};

type DiagnosticState = {
  character: Character;
  lifeState: DiagnosticLifeState;
};

type ReplayableChoiceEffects = Choice['effects'] & {
  educationArc?: string;
  careerArc?: string;
  relationshipArc?: string;
  familyArc?: string;
  healthArc?: string;
  mobilityArc?: string;
  tags?: string[];
  values?: string[];
  delayedConsequences?: Array<string | Partial<DiagnosticQueuedConsequence>>;
  unlockedChapterPools?: string[];
  blockedChapterPools?: string[];
  lifeState?: Partial<DiagnosticLifeState>;
};

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function createSeededRandom(seed: string): () => number {
  let state = hashSeed(seed) || 1;
  return () => {
    state += 0x6D2B79F5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function withSeededRandom<T>(seed: string, fn: () => T): T {
  const originalRandom = Math.random;
  Math.random = createSeededRandom(seed);
  try {
    return fn();
  } finally {
    Math.random = originalRandom;
  }
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function bump(map: Record<string, number>, key: string, amount = 1): void {
  map[key] = (map[key] ?? 0) + amount;
}

function clampStat(value: number): number {
  return Math.max(0, Math.min(5, value));
}

function createInitialDiagnosticLifeState(character: Character): DiagnosticLifeState {
  return {
    city: character.birthplace as SupportedCity,
    values: [],
    tags: uniqueStrings([
      ...character.personality,
      ...character.skills.map((skill) => `skill:${skill}`),
      `city:${character.birthplace}`,
      character.childhoodDream ? `dream:${character.childhoodDream}` : '',
    ]),
    delayedConsequences: [],
    unlockedChapterPools: [],
    blockedChapterPools: [],
  };
}

function isChoiceAvailable(choice: Choice, character: Character): boolean {
  const requires = choice.requires;
  if (!requires) return true;
  if (requires.money !== undefined && character.money < requires.money) return false;
  if (requires.health !== undefined && character.health < requires.health) return false;
  if (requires.happiness !== undefined && character.happiness < requires.happiness) return false;
  return true;
}

function normalizeEffects(choice: Choice): ReplayableChoiceEffects {
  return choice.effects as ReplayableChoiceEffects;
}

function createQueuedConsequence(
  item: string | Partial<DiagnosticQueuedConsequence>,
  sourceChoiceId: string,
  currentAge: number,
): DiagnosticQueuedConsequence {
  if (typeof item === 'string') {
    return {
      id: item,
      resolveAtAge: currentAge + 10,
      status: 'queued',
      tags: [],
    };
  }

  return {
    id: item.id ?? `${sourceChoiceId}:${currentAge}:${Math.random().toString(36).slice(2, 8)}`,
    resolveAtAge: item.resolveAtAge ?? currentAge + 10,
    status: item.status ?? 'queued',
    tags: item.tags ?? [],
  };
}

function resolveDueConsequences(state: DiagnosticLifeState, age: number): void {
  const resolved = state.delayedConsequences.filter((consequence) => consequence.resolveAtAge <= age);
  if (resolved.length === 0) return;

  state.tags = uniqueStrings([
    ...state.tags,
    ...resolved.flatMap((consequence) => consequence.tags),
  ]);
  state.delayedConsequences = state.delayedConsequences.filter((consequence) => consequence.resolveAtAge > age);
}

function applyChoiceEffects(
  state: DiagnosticState,
  choice: Choice,
  currentAge: number,
  nextAge: number,
): void {
  const effects = normalizeEffects(choice);

  if (effects.health !== undefined) {
    state.character.health = clampStat(state.character.health + effects.health);
  }
  if (effects.money !== undefined) {
    state.character.money = clampStat(state.character.money + effects.money);
  }
  if (effects.happiness !== undefined) {
    state.character.happiness = clampStat(state.character.happiness + effects.happiness);
  }

  if (effects.lifeState) {
    Object.assign(state.lifeState, effects.lifeState);
  }
  if (effects.educationArc) state.lifeState.educationArc = effects.educationArc;
  if (effects.careerArc) state.lifeState.careerArc = effects.careerArc;
  if (effects.relationshipArc) state.lifeState.relationshipArc = effects.relationshipArc;
  if (effects.familyArc) state.lifeState.familyArc = effects.familyArc;
  if (effects.healthArc) state.lifeState.healthArc = effects.healthArc;
  if (effects.mobilityArc) state.lifeState.mobilityArc = effects.mobilityArc;

  if (effects.tags?.length) {
    state.lifeState.tags = uniqueStrings([...state.lifeState.tags, ...effects.tags]);
  }
  if (effects.values?.length) {
    state.lifeState.values = uniqueStrings([...state.lifeState.values, ...effects.values]);
  }
  if (effects.unlockedChapterPools?.length) {
    state.lifeState.unlockedChapterPools = uniqueStrings([
      ...state.lifeState.unlockedChapterPools,
      ...effects.unlockedChapterPools,
    ]);
  }
  if (effects.blockedChapterPools?.length) {
    state.lifeState.blockedChapterPools = uniqueStrings([
      ...state.lifeState.blockedChapterPools,
      ...effects.blockedChapterPools,
    ]);
  }
  if (effects.delayedConsequences?.length) {
    state.lifeState.delayedConsequences = [
      ...state.lifeState.delayedConsequences,
      ...effects.delayedConsequences.map((item) => createQueuedConsequence(item, choice.id, currentAge)),
    ];
  }

  resolveDueConsequences(state.lifeState, nextAge);
}

function classifyChapterFamily(node: StoryNode): string {
  const id = node.id;

  if (id === 'start') return 'opening';
  if (id === 'death') return 'ending';
  if (id.startsWith('childhood-')) return 'childhood';
  if (id.startsWith('teenage-') || id.startsWith('teen-')) return 'teenage';
  if (id === 'education-decision') return 'education-crossroads';
  if (id.startsWith('career-decision-')) return 'career-crossroads';
  if (id.startsWith('university-')) return 'university-track';
  if (id.startsWith('work-') && !id.startsWith('work-life-decision')) return 'work-track';
  if (id.startsWith('art-')) return 'creative-track';
  if (id.startsWith('travel-')) return 'travel-track';
  if (id.startsWith('corporate-')) return 'corporate-climb';
  if (id.startsWith('stable-')) return 'stable-craft';
  if (id.startsWith('creative-career-') || id === 'creative-career-path') return 'creative-career';
  if (id.startsWith('entrepreneur-')) return 'founder-volatility';
  if (id.startsWith('global-')) return 'global-career';
  if (id.startsWith('work-life-decision-')) return `work-life:${id.split('-').pop() ?? 'core'}`;
  if (id.startsWith('post-career-chapter-')) return `post-career:${id.split('-').pop() ?? 'core'}`;
  if (id === 'relationship-decision') return 'relationship-crossroads';
  if (['married-young', 'single-focused', 'cohabitation'].includes(id)) return 'relationship-outcome';
  if (id.startsWith('family-decision')) return 'family-crossroads';
  if (id.startsWith('parent-')) return 'parenthood';
  if (id.startsWith('childless-')) return 'childfree';
  if (id.startsWith('adoption-')) return 'adoption';
  if (id.startsWith('chosen-family-')) return 'chosen-family';
  if (id.startsWith('late-parenthood-')) return 'late-parenthood';
  if (id.startsWith('shared-home-')) return 'shared-home';
  if (id.startsWith('midlife-crisis')) return 'midlife-reflection';
  if (id === 'midlife-career') return 'midlife-career';
  if (id === 'health-reckoning') return 'health-reckoning';
  if (id === 'late-40s-fork') return 'late-life-fork';
  if (['late-career-1', 'late-career-alt', 'slow-life-path', 'second-act', 'retirement', 'health-decline'].includes(id)) {
    return 'late-life';
  }

  return node.category;
}

function simulateRun(seed: string, city: SupportedCity): ReplayabilityRunSummary {
  return withSeededRandom(seed, () => {
    const character = generateRandomCharacter();
    character.birthplace = city;
    character.location = city;

    const nodes = generateLifeStory(character);
    const connections = generateConnections(nodes);
    const nodeById = new Map(nodes.map((node) => [node.id, node] as const));
    const adjacency = new Map<string, string[]>();
    for (const connection of connections) {
      const list = adjacency.get(connection.from) ?? [];
      list.push(connection.to);
      adjacency.set(connection.from, list);
    }
    const path: string[] = [];
    const visited = new Set<string>();
    const chapterFamilies: Record<string, number> = {};
    const state: DiagnosticState = {
      character,
      lifeState: createInitialDiagnosticLifeState(character),
    };
    let currentNodeId = 'start';
    let safetyCounter = 0;

    while (safetyCounter++ < nodes.length + 20) {
      const node = nodeById.get(currentNodeId);
      if (!node) break;

      path.push(node.id);
      visited.add(node.id);
      bump(chapterFamilies, classifyChapterFamily(node));
      state.character.age = node.age;

      if (node.type === 'end') {
        break;
      }

      if (node.type === 'decision' && node.choices?.length) {
        const available = node.choices.filter((choice) => isChoiceAvailable(choice, state.character));
        const pool = available.length > 0 ? available : node.choices;
        const choice = pool[Math.floor(Math.random() * pool.length)];
        const nextNode = nodeById.get(choice.nextNodeId);

        if (nextNode) {
          applyChoiceEffects(state, choice, node.age, nextNode.age);
          currentNodeId = choice.nextNodeId;
          continue;
        }

        break;
      }

      const fallbackNextIds = node.nextNodeIds ?? adjacency.get(node.id) ?? [];
      const nextNodeId = fallbackNextIds[Math.floor(Math.random() * fallbackNextIds.length)];
      if (!nextNodeId) {
        break;
      }

      const nextNode = nodeById.get(nextNodeId);
      if (nextNode) {
        resolveDueConsequences(state.lifeState, nextNode.age);
      }
      currentNodeId = nextNodeId;
    }

    resolveDueConsequences(state.lifeState, Number.POSITIVE_INFINITY);

    return {
      seed,
      city,
      character: {
        name: state.character.name,
        gender: state.character.gender,
        birthplace: state.character.birthplace,
        birthYear: state.character.birthYear,
        personality: state.character.personality,
        skills: state.character.skills,
        childhoodDream: state.character.childhoodDream,
      },
      path,
      visitedNodeCount: visited.size,
      uniqueNodeCount: visited.size,
      decisionCount: path.filter((nodeId) => nodeById.get(nodeId)?.type === 'decision').length,
      chapterFamilies,
      finalLifeState: state.lifeState,
    };
  });
}

function createEmptyCityArcDistribution(): ReplayabilityCityArcDistribution {
  return {
    educationArcs: {},
    careerArcs: {},
    relationshipArcs: {},
    familyArcs: {},
    healthArcs: {},
    mobilityArcs: {},
    tags: {},
    values: {},
  };
}

function recordArcDistribution(
  distribution: ReplayabilityCityArcDistribution,
  run: ReplayabilityRunSummary,
): void {
  const { finalLifeState } = run;
  if (finalLifeState.educationArc) bump(distribution.educationArcs, finalLifeState.educationArc);
  if (finalLifeState.careerArc) bump(distribution.careerArcs, finalLifeState.careerArc);
  if (finalLifeState.relationshipArc) bump(distribution.relationshipArcs, finalLifeState.relationshipArc);
  if (finalLifeState.familyArc) bump(distribution.familyArcs, finalLifeState.familyArc);
  if (finalLifeState.healthArc) bump(distribution.healthArcs, finalLifeState.healthArc);
  if (finalLifeState.mobilityArc) bump(distribution.mobilityArcs, finalLifeState.mobilityArc);
  for (const tag of finalLifeState.tags) bump(distribution.tags, tag);
  for (const value of finalLifeState.values) bump(distribution.values, value);
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sortByFrequency(entries: Record<string, number>, limit: number): Array<{ nodeId: string; frequency: number }> {
  return Object.entries(entries)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([nodeId, frequency]) => ({ nodeId, frequency }));
}

export function runReplayabilityDiagnostics(
  options: ReplayabilityDiagnosticsOptions = {},
): ReplayabilityDiagnosticsReport {
  const normalized: Required<ReplayabilityDiagnosticsOptions> = {
    runsPerCity: options.runsPerCity ?? 20,
    cities: options.cities ?? [...SUPPORTED_CITIES],
    seedBase: options.seedBase ?? 'replayability',
  };

  const runs: ReplayabilityRunSummary[] = [];
  const chapterFamilyFrequency: Record<string, number> = {};
  const nodeVisitFrequency: Record<string, number> = {};
  const cityArcDistribution: Record<SupportedCity, ReplayabilityCityArcDistribution> = Object.fromEntries(
    SUPPORTED_CITIES.map((city) => [city, createEmptyCityArcDistribution()]),
  ) as Record<SupportedCity, ReplayabilityCityArcDistribution>;

  for (const city of normalized.cities) {
    for (let index = 0; index < normalized.runsPerCity; index++) {
      const seed = `${normalized.seedBase}:${city}:${index}`;
      const run = simulateRun(seed, city);
      runs.push(run);

      for (const [family, count] of Object.entries(run.chapterFamilies)) {
        bump(chapterFamilyFrequency, family, count);
      }
      for (const nodeId of new Set(run.path)) {
        bump(nodeVisitFrequency, nodeId);
      }
      recordArcDistribution(cityArcDistribution[city], run);
    }
  }

  const totalRuns = runs.length;
  const uniqueNodeCounts = runs.map((run) => run.uniqueNodeCount);
    const sharedNodeCoverage = Object.values(nodeVisitFrequency).filter((frequency) => frequency / totalRuns >= 0.5).length;
    const uniqueNodesSeen = Object.keys(nodeVisitFrequency).length || 1;

  return {
    options: normalized,
    runs,
    aggregate: {
      totalRuns,
      chapterFamilyFrequency,
      cityArcDistribution,
      reconvergence: {
        averageUniqueNodesPerRun: average(uniqueNodeCounts),
        averageUniqueNodeRatio: average(
          runs.map((run) => (run.path.length === 0 ? 0 : run.uniqueNodeCount / run.path.length)),
        ),
        averageRepeatedNodeVisitsPerRun: average(
          runs.map((run) => Math.max(0, run.path.length - run.uniqueNodeCount)),
        ),
        sharedNodeCoverage: sharedNodeCoverage / uniqueNodesSeen,
        mostCommonNodes: sortByFrequency(nodeVisitFrequency, 12),
      },
    },
  };
}

export function formatReplayabilityDiagnosticsReport(report: ReplayabilityDiagnosticsReport): string {
  const lines: string[] = [];
  lines.push(`Replayability diagnostics`);
  lines.push(`Runs: ${report.aggregate.totalRuns} across ${report.options.cities.length} cities`);
  lines.push(`Average unique nodes per run: ${report.aggregate.reconvergence.averageUniqueNodesPerRun.toFixed(2)}`);
  lines.push(`Average unique node ratio: ${report.aggregate.reconvergence.averageUniqueNodeRatio.toFixed(3)}`);
  lines.push(`Average repeated node visits per run: ${report.aggregate.reconvergence.averageRepeatedNodeVisitsPerRun.toFixed(2)}`);
  lines.push(`Shared-node coverage: ${(report.aggregate.reconvergence.sharedNodeCoverage * 100).toFixed(1)}%`);
  lines.push('');
  lines.push('Chapter family frequency');
  for (const [family, count] of Object.entries(report.aggregate.chapterFamilyFrequency).sort((a, b) => b[1] - a[1])) {
    lines.push(`- ${family}: ${count}`);
  }
  lines.push('');
  lines.push('Most common nodes');
  for (const entry of report.aggregate.reconvergence.mostCommonNodes) {
    lines.push(`- ${entry.nodeId}: ${entry.frequency}/${report.aggregate.totalRuns}`);
  }
  lines.push('');
  lines.push('City arc distribution');
  for (const city of report.options.cities) {
    const cityStats = report.aggregate.cityArcDistribution[city];
    lines.push(`- ${city}`);
    lines.push(`  education: ${formatTopCounts(cityStats.educationArcs)}`);
    lines.push(`  career: ${formatTopCounts(cityStats.careerArcs)}`);
    lines.push(`  relationship: ${formatTopCounts(cityStats.relationshipArcs)}`);
    lines.push(`  family: ${formatTopCounts(cityStats.familyArcs)}`);
    lines.push(`  health: ${formatTopCounts(cityStats.healthArcs)}`);
    lines.push(`  mobility: ${formatTopCounts(cityStats.mobilityArcs)}`);
  }
  return lines.join('\n');
}

function formatTopCounts(counts: Record<string, number>, limit = 4): string {
  const entries = Object.entries(counts)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit);
  if (entries.length === 0) return 'none';
  return entries.map(([key, count]) => `${key}(${count})`).join(', ');
}

function parseArgs(argv: string[]): ReplayabilityDiagnosticsOptions & { json: boolean } {
  const options: ReplayabilityDiagnosticsOptions & { json: boolean } = {
    runsPerCity: 20,
    cities: [...SUPPORTED_CITIES],
    seedBase: 'replayability',
    json: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--json') {
      options.json = true;
      continue;
    }
    if (arg === '--runs') {
      const next = Number.parseInt(argv[++i] ?? '', 10);
      if (Number.isFinite(next) && next > 0) options.runsPerCity = next;
      continue;
    }
    if (arg === '--seed') {
      options.seedBase = argv[++i] ?? options.seedBase;
      continue;
    }
    if (arg === '--cities') {
      const next = argv[++i];
      if (next) {
        const requested = next.split(',').map((city) => city.trim()).filter(Boolean) as SupportedCity[];
        const allowed = new Set(SUPPORTED_CITIES);
        options.cities = requested.filter((city) => allowed.has(city));
      }
      continue;
    }
  }

  return options;
}

if (process.argv[1]?.endsWith('src/data/replayabilityDiagnostics.ts')) {
  const options = parseArgs(process.argv.slice(2));
  const report = runReplayabilityDiagnostics(options);
  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(formatReplayabilityDiagnosticsReport(report));
  }
}

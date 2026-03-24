import { create } from 'zustand';
import type { StoryNode, GameState, Character, CharacterInput, GameView } from '@/types/game';
import * as storyGenerator from '@/data/storyGenerator';
import { getCityGameplayProfile } from '@/data/cityProfiles';

type LocalLifeArc =
  | 'elite-academic'
  | 'practical-work'
  | 'creative-self-made'
  | 'restless-explorer'
  | 'corporate-climb'
  | 'creative-precarity'
  | 'founder-volatility'
  | 'stable-craft'
  | 'public-service'
  | 'early-family'
  | 'independent'
  | 'late-commitment'
  | 'serial-reinvention'
  | 'chosen-family'
  | 'caregiver'
  | 'provider'
  | 'estranged'
  | 'childfree'
  | 'multigenerational'
  | 'resilient'
  | 'neglected'
  | 'recovery'
  | 'disciplined'
  | 'rooted'
  | 'migrant'
  | 'global-opportunist';

type LocalLifeState = {
  city: string;
  educationArc?: LocalLifeArc;
  careerArc?: LocalLifeArc;
  relationshipArc?: LocalLifeArc;
  familyArc?: LocalLifeArc;
  healthArc?: LocalLifeArc;
  mobilityArc?: LocalLifeArc;
  values: string[];
  tags: string[];
  delayedConsequences: LocalDelayedConsequence[];
  resolvedConsequences: LocalDelayedConsequence[];
  unlockedChapterPools: string[];
  blockedChapterPools: string[];
  choiceHistory: string[];
};

type GameLifeState = GameState extends { lifeState: infer T } ? T : LocalLifeState;

type LocalDelayedConsequence = {
  id: string;
  sourceNodeId: string;
  sourceChoiceId: string;
  createdAtAge: number;
  resolveAtAge: number;
  status: 'queued' | 'resolved';
  tags: string[];
};

type ChoiceEffectExtension = {
  educationArc?: LocalLifeArc;
  careerArc?: LocalLifeArc;
  relationshipArc?: LocalLifeArc;
  familyArc?: LocalLifeArc;
  healthArc?: LocalLifeArc;
  mobilityArc?: LocalLifeArc;
  tags?: string[];
  values?: string[];
  unlockedChapterPools?: string[];
  blockedChapterPools?: string[];
  lifeState?: Partial<LocalLifeState>;
  arcs?: Partial<Pick<LocalLifeState, 'educationArc' | 'careerArc' | 'relationshipArc' | 'familyArc' | 'healthArc' | 'mobilityArc'>>;
  addTags?: string[];
  removeTags?: string[];
  addValues?: string[];
  removeValues?: string[];
  addUnlockedChapterPools?: string[];
  addBlockedChapterPools?: string[];
  clearBlockedChapterPools?: string[];
  delayedConsequences?: Array<string | Partial<LocalDelayedConsequence>>;
  resolveConsequences?: string[];
};

type StoryGeneratorRuntime = typeof storyGenerator & {
  generateInitialLifeStory?: (character: Character) => StoryNode[] | { nodes?: StoryNode[] };
  generateNextChapter?: (context: {
    character: Character;
    lifeState: GameLifeState;
    nodes: StoryNode[];
    currentNodeId: string;
    previousNodeId?: string;
    choiceId?: string;
    visitedNodeIds: string[];
    madeDecisions: Record<string, string>;
  }) => StoryNode[] | { nodes?: StoryNode[] };
};

type ChapterGenerationContext = {
  character: Character;
  lifeState: GameLifeState;
  nodes: StoryNode[];
  currentNodeId: string;
  previousNodeId?: string;
  choiceId?: string;
  visitedNodes: Set<string>;
  madeDecisions: Map<string, string>;
};

interface GameStore extends GameState {
  currentView: GameView;
  nodes: StoryNode[];
  connections: { from: string; to: string }[];
  lifeState: GameLifeState;
  
  // Actions
  startGame: () => void;
  createCharacter: (input: CharacterInput) => void;
  createRandomCharacter: () => void;
  makeChoice: (choiceId: string) => void;
  navigateToNode: (nodeId: string) => void;
  toggleReliveMode: () => void;
  enterReliveMode: () => void;
  resetGame: () => void;
  getCurrentNode: () => StoryNode | undefined;
  getNodeById: (id: string) => StoryNode | undefined;
  getNextNodes: (nodeId: string) => StoryNode[];
  getPreviousNodes: (nodeId: string) => StoryNode[];
  isNodeReachable: (nodeId: string) => boolean;
  isNodeVisited: (nodeId: string) => boolean;
}

const PERSONALITY_SKILLS: Record<string, string[]> = {
  creative:     ['art', 'music'],
  analytical:   ['technology', 'mathematics'],
  ambitious:    ['business', 'leadership'],
  adventurous:  ['languages', 'travel'],
  empathetic:   ['writing', 'counseling'],
  shy:          ['writing', 'art'],
  outgoing:     ['business', 'languages'],
  cautious:     ['mathematics', 'technology'],
};

const createCharacterFromInput = (input: CharacterInput): Character => {
  const derived = [...new Set(
    input.personalityTraits.flatMap(t => PERSONALITY_SKILLS[t] ?? [])
  )].slice(0, 3);

  return {
    name: input.name,
    gender: input.gender,
    birthplace: input.birthplace,
    birthYear: input.birthYear,
    age: 0,
    location: input.birthplace,
    occupation: 'Newborn',
    health: 5,
    money: 1,
    happiness: 3,
    personality: input.personalityTraits,
    skills: derived,
    childhoodDream: input.childhoodDream,
  };
};

const clampStat = (value: number) => Math.max(0, Math.min(5, value));

const uniqueStrings = (items: string[]) => [...new Set(items.filter(Boolean))];

const getDreamValue = (dream?: string): string[] => {
  if (!dream) return [];
  const dreamValues: Record<string, string[]> = {
    fame: ['recognition', 'status'],
    wealth: ['security', 'ambition'],
    happiness: ['joy', 'balance'],
    knowledge: ['curiosity', 'mastery'],
    freedom: ['autonomy', 'exploration'],
    peace: ['stability', 'calm'],
    love: ['connection', 'care'],
    power: ['influence', 'control'],
  };
  return dreamValues[dream] ?? [dream];
};

const createInitialLifeState = (character: Character): GameLifeState => {
  const cityGameplay = character.birthplace ? getCityGameplayProfile(character.birthplace) : null;
  const tags = uniqueStrings([
    ...character.personality,
    ...character.skills.map((skill) => `skill:${skill}`),
    ...(cityGameplay?.startingTags ?? []),
    `city:${character.birthplace}`,
    character.childhoodDream ? `dream:${character.childhoodDream}` : '',
  ]);
  const values = uniqueStrings([
    ...getDreamValue(character.childhoodDream),
    ...(cityGameplay?.favoredValues ?? []),
    ...(character.personality.includes('empathetic') ? ['care'] : []),
    ...(character.personality.includes('ambitious') ? ['achievement'] : []),
    ...(character.personality.includes('adventurous') ? ['novelty'] : []),
    ...(character.personality.includes('cautious') ? ['security'] : []),
  ]);

  const lifeState: LocalLifeState = {
    city: character.birthplace,
    educationArc: character.personality.includes('analytical') ? 'elite-academic'
      : character.personality.includes('creative') ? 'creative-self-made'
        : character.personality.includes('adventurous') ? 'restless-explorer'
          : 'practical-work',
    careerArc: character.personality.includes('ambitious') ? 'corporate-climb'
      : character.personality.includes('creative') ? 'creative-precarity'
        : character.personality.includes('empathetic') ? 'public-service'
          : 'stable-craft',
    relationshipArc: character.personality.includes('outgoing') ? 'late-commitment'
      : character.personality.includes('empathetic') ? 'chosen-family'
        : 'independent',
    familyArc: character.personality.includes('empathetic') ? 'caregiver' : 'provider',
    healthArc: 'resilient',
    mobilityArc: character.personality.includes('adventurous') ? 'global-opportunist' : 'rooted',
    values,
    tags,
    delayedConsequences: [],
    resolvedConsequences: [],
    unlockedChapterPools: uniqueStrings([
      character.birthplace.toLowerCase().replace(/\s+/g, '-'),
      ...(cityGameplay?.exclusiveChapterPools ?? []),
      ...character.personality.map((trait) => `trait:${trait}`),
    ]),
    blockedChapterPools: [],
    choiceHistory: [],
  };

  return lifeState as GameLifeState;
};

const getChoiceEffectExtension = (choice: NonNullable<StoryNode['choices']>[number]): ChoiceEffectExtension => {
  return choice.effects as typeof choice.effects & ChoiceEffectExtension;
};

const toQueuedConsequence = (
  item: string | Partial<LocalDelayedConsequence>,
  currentNodeId: string,
  choiceId: string,
  currentAge: number,
): LocalDelayedConsequence => {
  if (typeof item === 'string') {
    return {
      id: item,
      sourceNodeId: currentNodeId,
      sourceChoiceId: choiceId,
      createdAtAge: currentAge,
      resolveAtAge: currentAge + 10,
      status: 'queued',
      tags: [],
    };
  }

  return {
    id: item.id ?? `${currentNodeId}:${choiceId}:${currentAge}`,
    sourceNodeId: item.sourceNodeId ?? currentNodeId,
    sourceChoiceId: item.sourceChoiceId ?? choiceId,
    createdAtAge: item.createdAtAge ?? currentAge,
    resolveAtAge: item.resolveAtAge ?? currentAge + 10,
    status: 'queued',
    tags: item.tags ?? [],
  };
};

const updateLifeStateFromChoice = (
  lifeState: GameLifeState,
  currentNodeId: string,
  choiceId: string,
  currentAge: number,
  nextAge: number,
  choice: NonNullable<StoryNode['choices']>[number],
): GameLifeState => {
  const current = lifeState as LocalLifeState;
  const effects = getChoiceEffectExtension(choice);
  const nextLifeState: LocalLifeState = {
    ...current,
    delayedConsequences: [...current.delayedConsequences],
    resolvedConsequences: [...current.resolvedConsequences],
    values: [...current.values],
    tags: [...current.tags],
    unlockedChapterPools: [...current.unlockedChapterPools],
    blockedChapterPools: [...current.blockedChapterPools],
    choiceHistory: [...current.choiceHistory, choiceId],
  };

  if (effects.educationArc) nextLifeState.educationArc = effects.educationArc;
  if (effects.careerArc) nextLifeState.careerArc = effects.careerArc;
  if (effects.relationshipArc) nextLifeState.relationshipArc = effects.relationshipArc;
  if (effects.familyArc) nextLifeState.familyArc = effects.familyArc;
  if (effects.healthArc) nextLifeState.healthArc = effects.healthArc;
  if (effects.mobilityArc) nextLifeState.mobilityArc = effects.mobilityArc;
  if (effects.tags?.length) {
    nextLifeState.tags = uniqueStrings([...nextLifeState.tags, ...effects.tags]);
  }
  if (effects.values?.length) {
    nextLifeState.values = uniqueStrings([...nextLifeState.values, ...effects.values]);
  }
  if (effects.unlockedChapterPools?.length) {
    nextLifeState.unlockedChapterPools = uniqueStrings([
      ...nextLifeState.unlockedChapterPools,
      ...effects.unlockedChapterPools,
    ]);
  }
  if (effects.blockedChapterPools?.length) {
    nextLifeState.blockedChapterPools = uniqueStrings([
      ...nextLifeState.blockedChapterPools,
      ...effects.blockedChapterPools,
    ]);
  }

  if (effects.lifeState) {
    Object.assign(nextLifeState, effects.lifeState);
  }
  if (effects.arcs) {
    Object.assign(nextLifeState, effects.arcs);
  }
  if (effects.addTags?.length) {
    nextLifeState.tags = uniqueStrings([...nextLifeState.tags, ...effects.addTags]);
  }
  if (effects.removeTags?.length) {
    const removed = new Set(effects.removeTags);
    nextLifeState.tags = nextLifeState.tags.filter((tag) => !removed.has(tag));
  }
  if (effects.addValues?.length) {
    nextLifeState.values = uniqueStrings([...nextLifeState.values, ...effects.addValues]);
  }
  if (effects.removeValues?.length) {
    const removed = new Set(effects.removeValues);
    nextLifeState.values = nextLifeState.values.filter((value) => !removed.has(value));
  }
  if (effects.addUnlockedChapterPools?.length) {
    nextLifeState.unlockedChapterPools = uniqueStrings([
      ...nextLifeState.unlockedChapterPools,
      ...effects.addUnlockedChapterPools,
    ]);
  }
  if (effects.addBlockedChapterPools?.length) {
    nextLifeState.blockedChapterPools = uniqueStrings([
      ...nextLifeState.blockedChapterPools,
      ...effects.addBlockedChapterPools,
    ]);
  }
  if (effects.clearBlockedChapterPools?.length) {
    const cleared = new Set(effects.clearBlockedChapterPools);
    nextLifeState.blockedChapterPools = nextLifeState.blockedChapterPools.filter((pool) => !cleared.has(pool));
  }
  if (effects.delayedConsequences?.length) {
    nextLifeState.delayedConsequences = [
      ...nextLifeState.delayedConsequences,
      ...effects.delayedConsequences.map((item) => toQueuedConsequence(item, currentNodeId, choiceId, currentAge)),
    ];
  }
  if (effects.resolveConsequences?.length) {
    const resolvedIds = new Set(effects.resolveConsequences);
    const resolvedNow = nextLifeState.delayedConsequences
      .filter((consequence) => resolvedIds.has(consequence.id))
      .map((consequence) => ({ ...consequence, status: 'resolved' as const, resolveAtAge: nextAge }));
    nextLifeState.resolvedConsequences = [...nextLifeState.resolvedConsequences, ...resolvedNow];
    nextLifeState.delayedConsequences = nextLifeState.delayedConsequences
      .filter((consequence) => !resolvedIds.has(consequence.id));
  }

  const ageResolved = nextLifeState.delayedConsequences
    .filter((consequence) => consequence.resolveAtAge <= nextAge)
    .map((consequence) => ({ ...consequence, status: 'resolved' as const }));
  if (ageResolved.length > 0) {
    nextLifeState.resolvedConsequences = [...nextLifeState.resolvedConsequences, ...ageResolved];
    nextLifeState.delayedConsequences = nextLifeState.delayedConsequences
      .filter((consequence) => consequence.resolveAtAge > nextAge);
    nextLifeState.tags = uniqueStrings([
      ...nextLifeState.tags,
      ...ageResolved.flatMap((consequence) => consequence.tags),
    ]);
  }

  return nextLifeState as GameLifeState;
};

const getStoryGeneratorRuntime = (): StoryGeneratorRuntime => (
  storyGenerator as StoryGeneratorRuntime
);

const withLifeState = (character: Character, lifeState: GameLifeState): Character => (
  { ...character, lifeState } as Character
);

const normalizeGeneratedNodes = (
  segment: StoryNode[] | { nodes?: StoryNode[] } | undefined,
): StoryNode[] => {
  if (Array.isArray(segment)) return segment;
  if (segment && Array.isArray(segment.nodes)) return segment.nodes;
  return [];
};

const mergeChoices = (
  current: StoryNode['choices'],
  incoming: StoryNode['choices'],
): StoryNode['choices'] => {
  if (!current?.length) return incoming;
  if (!incoming?.length) return current;

  const byId = new Map(current.map((choice) => [choice.id, choice]));
  for (const choice of incoming) {
    byId.set(choice.id, choice);
  }

  return Array.from(byId.values());
};

const mergeNextNodeIds = (
  current: StoryNode['nextNodeIds'],
  incoming: StoryNode['nextNodeIds'],
): StoryNode['nextNodeIds'] => {
  if (!current?.length) return incoming;
  if (!incoming?.length) return current;
  return [...new Set([...current, ...incoming])];
};

const mergeNodesById = (existingNodes: StoryNode[], incomingNodes: StoryNode[]): StoryNode[] => {
  if (incomingNodes.length === 0) return existingNodes;

  const merged = new Map(existingNodes.map((node) => [node.id, node]));
  for (const incoming of incomingNodes) {
    const current = merged.get(incoming.id);
    if (!current) {
      merged.set(incoming.id, incoming);
      continue;
    }

    merged.set(incoming.id, {
      ...current,
      ...incoming,
      visited: current.visited || incoming.visited,
      choices: mergeChoices(current.choices, incoming.choices),
      nextNodeIds: mergeNextNodeIds(current.nextNodeIds, incoming.nextNodeIds),
    });
  }

  return Array.from(merged.values());
};

const rebuildConnections = (nodes: StoryNode[]): { from: string; to: string }[] => (
  storyGenerator.generateConnections(nodes)
);

const buildInitialGraph = (
  character: Character,
  lifeState: GameLifeState,
): { nodes: StoryNode[]; connections: { from: string; to: string }[] } => {
  const runtime = getStoryGeneratorRuntime();
  const generatedNodes = normalizeGeneratedNodes(
    runtime.generateInitialLifeStory?.(withLifeState(character, lifeState)),
  );
  const nodes = generatedNodes.length > 0
    ? generatedNodes
    : storyGenerator.generateLifeStory(withLifeState(character, lifeState));

  return {
    nodes,
    connections: rebuildConnections(nodes),
  };
};

const maybeGenerateNextChapter = (context: ChapterGenerationContext): StoryNode[] => {
  const runtime = getStoryGeneratorRuntime();
  if (!runtime.generateNextChapter) return [];

  try {
    return normalizeGeneratedNodes(runtime.generateNextChapter({
      character: withLifeState(context.character, context.lifeState),
      lifeState: context.lifeState,
      nodes: context.nodes,
      currentNodeId: context.currentNodeId,
      previousNodeId: context.previousNodeId,
      choiceId: context.choiceId,
      visitedNodeIds: Array.from(context.visitedNodes),
      madeDecisions: Object.fromEntries(context.madeDecisions),
    }));
  } catch {
    return [];
  }
};

const appendGeneratedChapter = (
  nodes: StoryNode[],
  generatedNodes: StoryNode[],
): { nodes: StoryNode[]; connections: { from: string; to: string }[] } => {
  if (generatedNodes.length === 0) {
    return {
      nodes,
      connections: rebuildConnections(nodes),
    };
  }

  const mergedNodes = mergeNodesById(nodes, generatedNodes);
  return {
    nodes: mergedNodes,
    connections: rebuildConnections(mergedNodes),
  };
};

const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  character: {
    name: '',
    gender: 'female',
    birthplace: '',
    birthYear: 2000,
    age: 0,
    location: '',
    occupation: '',
    health: 5,
    money: 1,
    happiness: 3,
    personality: [],
    skills: [],
  },
  currentNodeId: 'start',
  visitedNodes: new Set(['start']),
  madeDecisions: new Map(),
  isReliveMode: false,
  gameStarted: false,
  gameEnded: false,
  lifeState: createInitialLifeState({
    name: '',
    gender: 'female',
    birthplace: '',
    birthYear: 2000,
    age: 0,
    location: '',
    occupation: '',
    health: 5,
    money: 1,
    happiness: 3,
    personality: [],
    skills: [],
  }),
  currentView: 'title',
  nodes: [],
  connections: [],

  // Start a new game - go to character creation
  startGame: () => {
    set({
      currentView: 'create',
    });
  },

  // Create character from user input
  createCharacter: (input: CharacterInput) => {
    const character = createCharacterFromInput(input);
    const lifeState = createInitialLifeState(character);
    const { nodes, connections } = buildInitialGraph(character, lifeState);

    // Mark start as visited
    const visitedNodes = new Set(['start']);
    const nodesWithVisited = nodes.map(n => ({
      ...n,
      visited: n.id === 'start',
    }));

    set({
      character,
      nodes: nodesWithVisited,
      connections,
      currentNodeId: 'start',
      visitedNodes,
      madeDecisions: new Map(),
      lifeState,
      isReliveMode: false,
      gameStarted: true,
      gameEnded: false,
      currentView: 'game',
    });
  },

  // Create random character
  createRandomCharacter: () => {
    const character = storyGenerator.generateRandomCharacter();
    const lifeState = createInitialLifeState(character);
    const { nodes, connections } = buildInitialGraph(character, lifeState);

    const visitedNodes = new Set(['start']);
    const nodesWithVisited = nodes.map(n => ({
      ...n,
      visited: n.id === 'start',
    }));

    set({
      character,
      nodes: nodesWithVisited,
      connections,
      currentNodeId: 'start',
      visitedNodes,
      madeDecisions: new Map(),
      lifeState,
      isReliveMode: false,
      gameStarted: true,
      gameEnded: false,
      currentView: 'game',
    });
  },

  // Make a choice at a decision node
  makeChoice: (choiceId: string) => {
    const state = get();
    const currentNode = state.getCurrentNode();
    if (!currentNode || !currentNode.choices) return;

    const choice = currentNode.choices.find(c => c.id === choiceId);
    if (!choice) return;

    // Update character based on choice effects
    const newCharacter = { ...state.character };
    if (choice.effects.health !== undefined) {
      newCharacter.health = clampStat(newCharacter.health + choice.effects.health);
    }
    if (choice.effects.money !== undefined) {
      newCharacter.money = clampStat(newCharacter.money + choice.effects.money);
    }
    if (choice.effects.happiness !== undefined) {
      newCharacter.happiness = clampStat(newCharacter.happiness + choice.effects.happiness);
    }
    if (choice.effects.occupation) {
      newCharacter.occupation = choice.effects.occupation;
    }
    if (choice.effects.location) {
      newCharacter.location = choice.effects.location;
    }

    const prefetchedNodes = maybeGenerateNextChapter({
      character: state.character,
      lifeState: state.lifeState,
      nodes: state.nodes,
      currentNodeId: currentNode.id,
      previousNodeId: state.currentNodeId,
      choiceId: choice.id,
      visitedNodes: state.visitedNodes,
      madeDecisions: state.madeDecisions,
    });
    const prefetchedGraph = appendGeneratedChapter(state.nodes, prefetchedNodes);

    // Update age based on next node's year
    const nextNode = prefetchedGraph.nodes.find((node) => node.id === choice.nextNodeId);
    if (!nextNode) return;
    const newLifeState = updateLifeStateFromChoice(
      state.lifeState,
      currentNode.id,
      choice.id,
      state.character.age,
      nextNode.age,
      choice,
    );
    newCharacter.age = nextNode.age;

    // Record the decision
    const newDecisions = new Map(state.madeDecisions);
    newDecisions.set(currentNode.id, choiceId);

    // Mark next node as visited
    const newVisitedNodes = new Set(state.visitedNodes);
    newVisitedNodes.add(choice.nextNodeId);

    // Update nodes array to mark as visited
    const visitedGraphNodes = prefetchedGraph.nodes.map(n =>
      n.id === choice.nextNodeId ? { ...n, visited: true } : n
    );
    const appendedNodes = maybeGenerateNextChapter({
      character: newCharacter,
      lifeState: newLifeState,
      nodes: visitedGraphNodes,
      currentNodeId: choice.nextNodeId,
      previousNodeId: currentNode.id,
      choiceId: choice.id,
      visitedNodes: newVisitedNodes,
      madeDecisions: newDecisions,
    });
    const appendedGraph = appendGeneratedChapter(visitedGraphNodes, appendedNodes);

    // Check if game ended
    const isEnd = nextNode.type === 'end';

    set({
      character: newCharacter,
      currentNodeId: choice.nextNodeId,
      visitedNodes: newVisitedNodes,
      madeDecisions: newDecisions,
      lifeState: newLifeState,
      nodes: appendedGraph.nodes,
      connections: appendedGraph.connections,
      gameEnded: isEnd,
      currentView: isEnd ? 'summary' : 'game',
    });
  },

  // Navigate to a specific node (for relive mode)
  navigateToNode: (nodeId: string) => {
    const state = get();
    const node = state.getNodeById(nodeId);
    if (!node) return;

    // In normal mode, only allow forward navigation to a directly connected next node.
    if (!state.isReliveMode) {
      const currentNode = state.getCurrentNode();
      if (currentNode?.type === 'decision') return;
      const isCurrentNode = nodeId === state.currentNodeId;
      const isNextNode = state.getNextNodes(state.currentNodeId).some(n => n.id === nodeId);
      if (!isCurrentNode && !isNextNode) return;
    }

    // Update character to match node's time period
    const newCharacter = { ...state.character };
    newCharacter.age = node.age;

    // Mark node as visited
    const newVisitedNodes = new Set(state.visitedNodes);
    newVisitedNodes.add(nodeId);

    const newNodes = state.nodes.map(n => 
      n.id === nodeId ? { ...n, visited: true } : n
    );

    const isEnd = node.type === 'end';

    set({
      currentNodeId: nodeId,
      character: newCharacter,
      visitedNodes: newVisitedNodes,
      nodes: newNodes,
      isReliveMode: false,
      gameEnded: isEnd,
      currentView: isEnd ? 'summary' : 'game',
    });
  },

  // Toggle relive mode
  toggleReliveMode: () => {
    const state = get();
    set({ isReliveMode: !state.isReliveMode });
  },

  // Enter relive mode from summary or game screens
  enterReliveMode: () => {
    const state = get();
    if (state.nodes.length === 0) return;

    const reliveStartNodeId = state.visitedNodes.has('death') ? 'death' : state.currentNodeId;
    const reliveStartNode = state.getNodeById(reliveStartNodeId);

    set({
      currentView: 'game',
      gameEnded: false,
      isReliveMode: true,
      currentNodeId: reliveStartNodeId,
      character: reliveStartNode ? { ...state.character, age: reliveStartNode.age } : state.character,
    });
  },

  // Reset the game
  resetGame: () => {
    set({
      character: {
        name: '',
        gender: 'female',
        birthplace: '',
        birthYear: 2000,
        age: 0,
        location: '',
        occupation: '',
        health: 5,
        money: 1,
        happiness: 3,
        personality: [],
        skills: [],
      },
      currentNodeId: 'start',
      visitedNodes: new Set(['start']),
      madeDecisions: new Map(),
      isReliveMode: false,
      gameStarted: false,
      gameEnded: false,
      lifeState: createInitialLifeState({
        name: '',
        gender: 'female',
        birthplace: '',
        birthYear: 2000,
        age: 0,
        location: '',
        occupation: '',
        health: 5,
        money: 1,
        happiness: 3,
        personality: [],
        skills: [],
      }),
      currentView: 'title',
      nodes: [],
      connections: [],
    });
  },

  // Get current node
  getCurrentNode: () => {
    return get().nodes.find(n => n.id === get().currentNodeId);
  },

  // Get node by ID
  getNodeById: (id: string) => {
    return get().nodes.find(n => n.id === id);
  },

  // Get next nodes for a given node
  getNextNodes: (nodeId: string) => {
    const state = get();
    const nextIds = state.connections
      .filter(conn => conn.from === nodeId)
      .map(conn => conn.to);
    return state.nodes.filter(n => nextIds.includes(n.id));
  },

  // Get previous nodes for a given node
  getPreviousNodes: (nodeId: string) => {
    const state = get();
    const prevIds = state.connections
      .filter(conn => conn.to === nodeId)
      .map(conn => conn.from);
    return state.nodes.filter(n => prevIds.includes(n.id));
  },

  // Check if a node is reachable from current position
  isNodeReachable: (nodeId: string) => {
    const state = get();
    // In relive mode, all visited nodes are reachable
    if (state.isReliveMode) {
      return state.visitedNodes.has(nodeId);
    }
    // Otherwise, only next nodes are reachable
    const nextNodes = state.getNextNodes(state.currentNodeId);
    return nextNodes.some(n => n.id === nodeId);
  },

  // Check if a node has been visited
  isNodeVisited: (nodeId: string) => {
    return get().visitedNodes.has(nodeId);
  },
}));

export default useGameStore;

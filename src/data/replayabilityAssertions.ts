import { generateInitialLifeStory, generateNextChapter } from './storyGenerator.ts';
import type { Character, StoryNode } from '@/types/game';

type TestCase = {
  name: string;
  run: () => void;
};

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message} (expected: ${String(expected)}, actual: ${String(actual)})`);
  }
}

function clampStat(value: number): number {
  return Math.max(0, Math.min(5, value));
}

function createCharacter(overrides: Partial<Character> = {}): Character {
  return {
    name: 'Test Player',
    gender: 'female',
    birthplace: 'Tokyo',
    birthYear: 2000,
    age: 0,
    location: 'Tokyo',
    occupation: 'Newborn',
    health: 5,
    money: 1,
    happiness: 3,
    personality: ['analytical', 'cautious'],
    skills: ['technology', 'mathematics'],
    childhoodDream: 'knowledge',
    ...overrides,
  };
}

function appendChapter(
  nodes: StoryNode[],
  character: Character,
  currentNodeId: string,
  lastChoiceId: string,
): StoryNode[] {
  const nextNodes = generateNextChapter({
    character,
    existingNodes: nodes,
    currentNodeId,
    lastChoiceId,
  });
  const existingById = new Map(nodes.map((node) => [node.id, node]));
  for (const node of nextNodes) {
    existingById.set(node.id, node);
  }
  return [...existingById.values()];
}

function applyChoice(
  nodes: StoryNode[],
  character: Character,
  nodeId: string,
  choiceId: string,
): { nodes: StoryNode[]; character: Character; nextNodeId: string } {
  const node = nodes.find((entry) => entry.id === nodeId);
  assertCondition(node?.choices?.length, `expected decision node "${nodeId}" with choices`);
  const choice = node.choices!.find((entry) => entry.id === choiceId);
  assertCondition(choice, `expected choice "${choiceId}" in node "${nodeId}"`);

  if (choice.requires?.money !== undefined) {
    assertCondition(character.money >= choice.requires.money, `expected money requirement for "${choiceId}"`);
  }
  if (choice.requires?.health !== undefined) {
    assertCondition(character.health >= choice.requires.health, `expected health requirement for "${choiceId}"`);
  }
  if (choice.requires?.happiness !== undefined) {
    assertCondition(character.happiness >= choice.requires.happiness, `expected happiness requirement for "${choiceId}"`);
  }

  const nextCharacter: Character = { ...character };
  if (choice.effects.money !== undefined) {
    nextCharacter.money = clampStat(nextCharacter.money + choice.effects.money);
  }
  if (choice.effects.health !== undefined) {
    nextCharacter.health = clampStat(nextCharacter.health + choice.effects.health);
  }
  if (choice.effects.happiness !== undefined) {
    nextCharacter.happiness = clampStat(nextCharacter.happiness + choice.effects.happiness);
  }
  if (choice.effects.occupation) {
    nextCharacter.occupation = choice.effects.occupation;
  }
  if (choice.effects.location) {
    nextCharacter.location = choice.effects.location;
  }

  const nextNodes = appendChapter(nodes, nextCharacter, nodeId, choiceId);
  const nextNode = nextNodes.find((entry) => entry.id === choice.nextNodeId);
  assertCondition(nextNode, `expected next node "${choice.nextNodeId}" from choice "${choiceId}"`);
  nextCharacter.age = nextNode.age;

  return {
    nodes: nextNodes,
    character: nextCharacter,
    nextNodeId: choice.nextNodeId,
  };
}

function assertAgeOrder(nodes: StoryNode[], earlierId: string, laterId: string): void {
  const earlier = nodes.find((node) => node.id === earlierId);
  const later = nodes.find((node) => node.id === laterId);
  assertCondition(earlier && later, `expected nodes "${earlierId}" and "${laterId}" to exist`);
  assertCondition(
    earlier.age < later.age,
    `expected "${laterId}" (${later.age}) to be later than "${earlierId}" (${earlier.age})`,
  );
}

function assertNodeExists(nodes: StoryNode[], id: string): void {
  assertCondition(nodes.some((node) => node.id === id), `expected node "${id}" to exist`);
}

function assertNodeMissing(nodes: StoryNode[], id: string): void {
  assertCondition(!nodes.some((node) => node.id === id), `expected node "${id}" to be absent`);
}

const tests: TestCase[] = [
  {
    name: 'initial chapter is bounded to opening content',
    run: () => {
      const character = createCharacter();
      const nodes = generateInitialLifeStory(character);
      assertNodeExists(nodes, 'start');
      assertNodeExists(nodes, 'education-decision');
      assertNodeMissing(nodes, 'midlife-career');
      assertNodeMissing(nodes, 'death');
    },
  },
  {
    name: 'education choice maps to the correct career decision node',
    run: () => {
      const character = createCharacter();
      const initial = generateInitialLifeStory(character);
      const mapping: Array<{ choiceId: string; nodeId: string }> = [
        { choiceId: 'choice-university', nodeId: 'career-decision' },
        { choiceId: 'choice-work', nodeId: 'career-decision-work' },
        { choiceId: 'choice-art', nodeId: 'career-decision-art' },
        { choiceId: 'choice-travel', nodeId: 'career-decision-travel' },
      ];

      for (const entry of mapping) {
        const nodes = appendChapter(initial, character, 'education-decision', entry.choiceId);
        assertNodeExists(nodes, entry.nodeId);
      }
    },
  },
  {
    name: 'city mechanics affect global career track availability',
    run: () => {
      const base = createCharacter({
        personality: ['analytical', 'cautious'],
        skills: ['technology'],
        childhoodDream: 'knowledge',
      });
      const tokyo = createCharacter({ ...base, birthplace: 'Tokyo', location: 'Tokyo' });
      const singapore = createCharacter({ ...base, birthplace: 'Singapore', location: 'Singapore' });

      const tokyoNodes = appendChapter(
        generateInitialLifeStory(tokyo),
        tokyo,
        'education-decision',
        'choice-university',
      );
      const singaporeNodes = appendChapter(
        generateInitialLifeStory(singapore),
        singapore,
        'education-decision',
        'choice-university',
      );

      const tokyoCareer = tokyoNodes.find((node) => node.id === 'career-decision');
      const singaporeCareer = singaporeNodes.find((node) => node.id === 'career-decision');
      assertCondition(tokyoCareer?.choices, 'expected Tokyo career decision to have choices');
      assertCondition(singaporeCareer?.choices, 'expected Singapore career decision to have choices');

      const tokyoHasGlobal = tokyoCareer!.choices!.some((choice) => choice.id === 'career-global');
      const singaporeHasGlobal = singaporeCareer!.choices!.some((choice) => choice.id === 'career-global');
      assertEqual(tokyoHasGlobal, false, 'expected Tokyo track not to default to global career');
      assertEqual(singaporeHasGlobal, true, 'expected Singapore track to expose global career');
    },
  },
  {
    name: 'decision timing varies across different starting profiles',
    run: () => {
      const earlyStructured = createCharacter({
        birthplace: 'Beijing',
        location: 'Beijing',
        personality: ['analytical', 'cautious'],
        childhoodDream: 'knowledge',
      });
      const laterExploratory = createCharacter({
        birthplace: 'San Francisco',
        location: 'San Francisco',
        personality: ['creative', 'adventurous'],
        childhoodDream: 'freedom',
      });

      const earlyNodes = generateInitialLifeStory(earlyStructured);
      const laterNodes = generateInitialLifeStory(laterExploratory);
      const earlyTeen = earlyNodes.find((node) => node.id === 'teenage-1');
      const laterTeen = laterNodes.find((node) => node.id === 'teenage-1');
      const earlyEducation = earlyNodes.find((node) => node.id === 'education-decision');
      const laterEducation = laterNodes.find((node) => node.id === 'education-decision');

      assertCondition(earlyTeen && laterTeen && earlyEducation && laterEducation, 'expected timing nodes to exist');
      assertCondition(earlyTeen.age !== laterTeen.age, 'expected teenage decision age to vary');
      assertCondition(earlyEducation.age !== laterEducation.age, 'expected education decision age to vary');
    },
  },
  {
    name: 'career occupations are specific rather than generic defaults',
    run: () => {
      const character = createCharacter({
        birthplace: 'New York',
        location: 'New York',
        personality: ['ambitious', 'analytical'],
        skills: ['business', 'mathematics'],
        childhoodDream: 'wealth',
      });

      const nodes = appendChapter(
        generateInitialLifeStory(character),
        character,
        'education-decision',
        'choice-university',
      );
      const careerDecision = nodes.find((node) => node.id === 'career-decision');
      assertCondition(careerDecision?.choices, 'expected a career decision node');

      const occupations = careerDecision.choices.map((choice) => choice.effects.occupation).filter(Boolean);
      assertCondition(occupations.length > 0, 'expected career choices to set occupations');
      assertCondition(!occupations.includes('Manager'), 'expected formal occupation to be more specific than Manager');
      assertCondition(!occupations.includes('Professional'), 'expected stable occupation to be more specific than Professional');
    },
  },
  {
    name: 'family education beats never jump backward into midlife',
    run: () => {
      const character = createCharacter({
        birthplace: 'Beijing',
        location: 'Beijing',
        personality: ['adventurous', 'ambitious'],
        skills: ['business', 'languages'],
        childhoodDream: 'freedom',
      });

      const nodes = generateLifeStoryForTest(character);
      assertAgeOrder(nodes, 'late-parenthood-event', 'midlife-crisis');
      assertAgeOrder(nodes, 'parent-event', 'midlife-crisis');
      assertAgeOrder(nodes, 'shared-home-event', 'midlife-crisis-shared');
    },
  },
  {
    name: 'family-first path can still build wealth by second act',
    run: () => {
      let character = createCharacter({
        birthplace: 'Beijing',
        location: 'Beijing',
        personality: ['analytical', 'empathetic'],
        skills: ['technology', 'writing'],
        childhoodDream: 'peace',
      });
      let nodes = generateInitialLifeStory(character);

      ({ nodes, character } = applyChoice(nodes, character, 'education-decision', 'choice-university'));
      ({ nodes, character } = applyChoice(nodes, character, 'career-decision', 'career-stable'));
      ({ nodes, character } = applyChoice(nodes, character, 'work-life-decision-stable', 'career-stable-wl-health'));
      ({ nodes, character } = applyChoice(nodes, character, 'relationship-decision', 'marry-young'));
      ({ nodes, character } = applyChoice(nodes, character, 'family-decision', 'have-children'));
      ({ nodes, character } = applyChoice(nodes, character, 'midlife-career', 'career-slow'));
      ({ nodes, character } = applyChoice(nodes, character, 'health-reckoning-restorative', 'hr-commit'));
      ({ nodes, character } = applyChoice(nodes, character, 'late-40s-fork', 'fork-give-back'));
      ({ nodes, character } = applyChoice(nodes, character, 'second-act-mentor', 'sa-create-community'));

      assertCondition(character.age >= 50, 'expected path to reach second-act timeframe');
      assertCondition(character.money >= 2, `expected wealth buffer by second act, got ${character.money}`);
    },
  },
  {
    name: 'staged append can reach ending without duplicate node ids',
    run: () => {
      const character = createCharacter({
        birthplace: 'San Francisco',
        location: 'San Francisco',
        personality: ['ambitious', 'adventurous'],
        skills: ['business', 'languages'],
        childhoodDream: 'freedom',
      });

      let nodes = generateInitialLifeStory(character);
      nodes = appendChapter(nodes, character, 'education-decision', 'choice-travel');
      nodes = appendChapter(nodes, character, 'career-decision-travel', 'career-global');
      nodes = appendChapter(nodes, character, 'work-life-decision-global', 'wl-side-global');
      nodes = appendChapter(nodes, character, 'relationship-decision', 'stay-single');
      nodes = appendChapter(nodes, character, 'midlife-career', 'midlife-global');

      const ids = nodes.map((node) => node.id);
      const uniqueIds = new Set(ids);
      assertEqual(ids.length, uniqueIds.size, 'expected no duplicate node ids after staged appends');
      assertNodeExists(nodes, 'death');
    },
  },
];

function generateLifeStoryForTest(character: Character): StoryNode[] {
  let nodes = generateInitialLifeStory(character);
  nodes = appendChapter(nodes, character, 'education-decision', 'choice-travel');
  nodes = appendChapter(nodes, character, 'career-decision-travel', 'career-global');
  nodes = appendChapter(nodes, character, 'work-life-decision-global', 'career-global-wl-community');
  nodes = appendChapter(nodes, character, 'relationship-decision', 'stay-single');
  nodes = appendChapter(nodes, character, 'family-decision-independent', 'late-parenthood');
  return nodes;
}

function runTests(): void {
  let passed = 0;
  for (const test of tests) {
    test.run();
    passed += 1;
    console.log(`PASS ${test.name}`);
  }
  console.log(`\nReplayability assertions passed: ${passed}/${tests.length}`);
}

runTests();

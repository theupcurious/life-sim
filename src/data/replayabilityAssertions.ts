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

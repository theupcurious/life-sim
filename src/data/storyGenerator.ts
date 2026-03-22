import type { Character, StoryNode, Choice } from '@/types/game';
import {
  SUPPORTED_CITIES,
  getCityProfile,
  type CityProfile,
  type SupportedCountry,
} from '@/data/cityProfiles';

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function pronouns(gender: string): { subject: string; object: string; possessive: string } {
  if (gender === 'male') return { subject: 'he', object: 'him', possessive: 'his' };
  if (gender === 'female') return { subject: 'she', object: 'her', possessive: 'her' };
  return { subject: 'they', object: 'them', possessive: 'their' };
}

function dreamLabel(dream: string | undefined): string {
  if (!dream) return 'a meaningful life';
  const labels: Record<string, string> = {
    fame: 'recognition',
    wealth: 'financial success',
    happiness: 'lasting joy',
    knowledge: 'deeper understanding',
    freedom: 'freedom',
    peace: 'peace',
    love: 'love',
    power: 'influence',
  };
  return labels[dream] ?? dream;
}

// Generate a unique life story based on character inputs
export function generateLifeStory(character: Character): StoryNode[] {
  const nodes: StoryNode[] = [];
  const profile = getCityProfile(character.birthplace);
  const lifeExpectancy = 75 + Math.floor(Math.random() * 20); // 75-95 years

  nodes.push({
    id: 'start',
    type: 'start',
    year: character.birthYear,
    age: 0,
    title: 'Birth',
    description: `${character.name} is born in ${profile.city}, ${profile.country}, ${profile.regionLine}. Family stories, neighborhood rhythms, and cultural expectations begin shaping life from day one.`,
    imagePrompt: `pixel art newborn scene in ${profile.city} with local architecture and cultural atmosphere`,
    position: { x: 400, y: 50 },
    visited: true,
    category: 'childhood',
  });

  nodes.push(...generateChildhoodNodes(character, profile));
  nodes.push(generateRandomEvent('adolescent', character, profile));
  nodes.push(...generateTeenageNodes(character, profile));
  nodes.push(generateRandomEvent('young-adult', character, profile));
  nodes.push(generateEducationDecision(character, profile));
  nodes.push(...generateCareerPaths(character, profile));
  nodes.push(...generateRelationshipNodes(character, profile));
  nodes.push(...generateMidlifeNodes(character, profile));
  nodes.push(generateRandomEvent('midlife', character, profile));
  nodes.push(...generateLateLifeNodes(character, lifeExpectancy, profile));

  const deathYear = character.birthYear + lifeExpectancy;
  nodes.push({
    id: 'death',
    type: 'end',
    year: deathYear,
    age: lifeExpectancy,
    title: 'The End',
    description: generateDeathDescription(character, lifeExpectancy, profile),
    imagePrompt: `pixel art reflective ending scene in ${profile.city} at night`,
    position: { x: 400, y: 50 + nodes.length * 100 },
    visited: false,
    category: 'health',
  });

  return positionNodes(nodes);
}

type RandomEventPhase = 'adolescent' | 'young-adult' | 'midlife';

function generateRandomEvent(phase: RandomEventPhase, character: Character, profile: CityProfile): StoryNode {
  const adolescentEvents: Array<{ title: string; description: string; category: StoryNode['category'] }> = [
    {
      title: 'A Family Shift',
      description: `${character.name}'s family moves to a new neighborhood when ${character.name} is 13. The upheaval is disorienting at first — new faces, new routines — but seeds of adaptability take root.`,
      category: 'childhood',
    },
    {
      title: 'The Rivalry',
      description: `A competitive classmate pushes ${character.name} harder than any teacher has. Whether as rival or eventual friend, this person leaves a lasting mark on how effort and ego intersect.`,
      category: 'education',
    },
    {
      title: 'A Hidden Passion',
      description: `During a rainy school break in ${profile.city}, ${character.name} stumbles into something unexpected — a book, a sport, a sound — that quietly rearranges everything that felt certain about the future.`,
      category: 'childhood',
    },
  ];

  const youngAdultEvents: Array<{ title: string; description: string; category: StoryNode['category'] }> = [
    {
      title: 'The Health Scare',
      description: `At 19, a brief but serious illness forces ${character.name} to slow down for the first time. Weeks of recovery bring unexpected clarity about what actually matters — and what has been taken for granted.`,
      category: 'health',
    },
    {
      title: 'An Unexpected Windfall',
      description: `A small inheritance from a distant relative arrives at exactly the right moment. ${character.name} faces a first real financial choice: invest, spend, or save it for a future that still feels abstract.`,
      category: 'random',
    },
    {
      title: 'A Falling Out',
      description: `A close friendship shatters unexpectedly before ${character.name} turns 20. The loss is disproportionately painful — and teaches more about forgiveness, pride, and self-respect than years of easier relationships will.`,
      category: 'relationship',
    },
  ];

  const midlifeEvents: Array<{ title: string; description: string; category: StoryNode['category'] }> = [
    {
      title: 'The Reunion',
      description: `An old friend surfaces after two decades — someone who chose an entirely different path. The conversation that follows lasts hours and leaves ${character.name} quietly measuring choices, not with regret, but with curiosity.`,
      category: 'relationship',
    },
    {
      title: 'A Health Wake-Up',
      description: `A routine checkup at 52 returns unexpected results. Nothing catastrophic, but enough to make mortality feel real for the first time. Habits change. Priorities sharpen. The body starts telling a longer story.`,
      category: 'health',
    },
    {
      title: 'Recognition',
      description: `Decades of work crystallize in a moment of unexpected recognition — an award, a mention, a letter from someone who says ${character.name}'s quiet contributions mattered. It arrives later than expected, and means more for it.`,
      category: 'career',
    },
  ];

  const pool = phase === 'adolescent' ? adolescentEvents
    : phase === 'young-adult' ? youngAdultEvents
    : midlifeEvents;

  const ages: Record<RandomEventPhase, number> = { adolescent: 13, 'young-adult': 19, midlife: 52 };
  const event = pick(pool);

  return {
    id: `random-${phase}`,
    type: 'event',
    year: character.birthYear + ages[phase],
    age: ages[phase],
    title: event.title,
    description: event.description,
    imagePrompt: `pixel art ${event.title.toLowerCase()} scene in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: event.category,
  };
}

function generateChildhoodNodes(character: Character, profile: CityProfile): StoryNode[] {
  const nodes: StoryNode[] = [];
  const personality = character.personality[0] || 'curious';
  const talent = character.skills[0] || 'learning';

  nodes.push({
    id: 'childhood-1',
    type: 'event',
    year: character.birthYear + 5,
    age: 5,
    title: 'First Memory',
    description: generateChildhoodMemory(character.name, personality, profile),
    imagePrompt: `pixel art childhood memory in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'childhood',
  });

  nodes.push({
    id: 'childhood-2',
    type: 'event',
    year: character.birthYear + 8,
    age: 8,
    title: 'School Days',
    description: `${character.name} starts school in ${profile.city}. ${profile.schoolingNuance} ${personality === 'shy'
      ? 'Making close friends is slow, but each bond runs deep.'
      : personality === 'outgoing'
        ? 'Friend groups form quickly, and social confidence grows fast.'
        : 'Curiosity and observation become a quiet strength.'}`,
    imagePrompt: `pixel art school scene in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'education',
  });

  nodes.push({
    id: 'childhood-3',
    type: 'event',
    year: character.birthYear + 12,
    age: 12,
    title: 'Hidden Talent',
    description: `Through years of routine and exploration, ${character.name} discovers a natural aptitude for ${talent}. Teachers and family begin noticing the same spark, and expectations slowly rise.`,
    imagePrompt: `pixel art after-school practice scene showing ${talent}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'childhood',
  });

  return nodes;
}

function generateTeenageNodes(character: Character, profile: CityProfile): StoryNode[] {
  const nodes: StoryNode[] = [];

  nodes.push({
    id: 'teenage-1',
    type: 'decision',
    year: character.birthYear + 15,
    age: 15,
    title: 'The Teenage Years',
    description: `At 15, pressure intensifies in ${profile.city}. ${profile.socialNuance} The first real identity choice appears: performance, belonging, or rebellion.`,
    choices: [
      {
        id: 'teen-study',
        text: 'Focus on Studies',
        description: 'Commit to academic performance and discipline',
        nextNodeId: 'teenage-2',
        effects: { happiness: -1 },
      },
      {
        id: 'teen-social',
        text: 'Build Friendships',
        description: 'Prioritize social life and emotional support',
        nextNodeId: 'teenage-2',
        effects: { happiness: 1 },
      },
      {
        id: 'teen-rebel',
        text: 'Explore Rebellion',
        description: 'Test boundaries and challenge expectations',
        nextNodeId: 'teenage-2',
        effects: { health: -1, happiness: 1 },
      },
    ],
    imagePrompt: `pixel art teenage crossroads in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'education',
  });

  nodes.push({
    id: 'teenage-2',
    type: 'event',
    year: character.birthYear + 17,
    age: 17,
    title: 'First Love',
    description: generateFirstLoveStory(character.name, character.gender, profile),
    imagePrompt: `pixel art teenage romance moment in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'relationship',
  });

  return nodes;
}

function generateEducationDecision(character: Character, profile: CityProfile): StoryNode {
  const dream = dreamLabel(character.childhoodDream);

  return {
    id: 'education-decision',
    type: 'decision',
    year: character.birthYear + 18,
    age: 18,
    title: 'The Crossroads',
    description: `School ends and adulthood begins in ${profile.city}. Family expectations, financial reality, and dreams of ${dream} collide in one irreversible decision.`,
    choices: [
      {
        id: 'choice-university',
        text: 'Attend University',
        description: 'Invest in long-term credentials and knowledge',
        nextNodeId: 'university-path',
        effects: { money: -1, happiness: 1 },
      },
      {
        id: 'choice-work',
        text: 'Start Working',
        description: 'Earn early and build practical momentum',
        nextNodeId: 'work-path',
        effects: { money: 1, occupation: 'Worker' },
      },
      {
        id: 'choice-art',
        text: 'Pursue Art/Creative Path',
        description: 'Bet on creative identity over stability',
        nextNodeId: 'art-path',
        effects: { money: -2, happiness: 2, occupation: 'Aspiring Artist' },
      },
      {
        id: 'choice-travel',
        text: 'Travel the World',
        description: 'Delay commitment and gather perspective',
        nextNodeId: 'travel-path',
        effects: { money: -2, happiness: 2 },
      },
    ],
    imagePrompt: `pixel art graduation crossroads in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'education',
  };
}

function generateCareerPaths(character: Character, profile: CityProfile): StoryNode[] {
  const nodes: StoryNode[] = [];
  const skill = character.skills[0] || 'adaptability';
  const careerChoices = generateCareerChoices(character, profile);

  nodes.push({
    id: 'university-path',
    type: 'event',
    year: character.birthYear + 22,
    age: 22,
    title: 'University Graduate',
    description: `${character.name} graduates and enters a crowded market with growing confidence in ${skill}. In ${profile.city}, credentials open doors, but grit determines which ones stay open.`,
    nextNodeIds: ['career-decision'],
    imagePrompt: `pixel art graduation ceremony in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'education',
  });

  nodes.push({
    id: 'work-path',
    type: 'event',
    year: character.birthYear + 22,
    age: 22,
    title: 'Working Life',
    description: `Four years of direct work experience sharpen ${character.name}'s instincts. ${profile.workNuance} Small wins start accumulating into professional identity.`,
    nextNodeIds: ['career-decision'],
    imagePrompt: `pixel art early career office scene in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'career',
  });

  nodes.push({
    id: 'art-path',
    type: 'event',
    year: character.birthYear + 22,
    age: 22,
    title: 'The Struggling Artist',
    description: `${character.name} spends years creating with uncertain income and occasional breakthroughs. The work is raw, personal, and often misunderstood, but impossible to abandon.`,
    nextNodeIds: ['career-decision'],
    imagePrompt: `pixel art artist studio at night in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'career',
  });

  nodes.push({
    id: 'travel-path',
    type: 'event',
    year: character.birthYear + 22,
    age: 22,
    title: 'World Wanderer',
    description: `${character.name} returns to ${profile.city} after years abroad with expanded perspective, looser assumptions, and a clearer sense of what kind of life feels authentic.`,
    nextNodeIds: ['career-decision'],
    imagePrompt: `pixel art return-from-travel scene at ${profile.city} terminal`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'random',
  });

  const careerConvergenceOpeners: Record<string, string> = {
    'choice-university': 'A degree in hand and theory in mind,',
    'choice-work': 'Having already logged real hours in the working world,',
    'choice-art':  'After years betting on creative identity over stability,',
    'choice-travel': 'Back from wandering the globe with a wider frame of reference,',
  };
  const madeEducationChoice = character.childhoodDream !== undefined
    ? Object.keys(careerConvergenceOpeners)[0]
    : undefined;
  const careerOpener = madeEducationChoice ? careerConvergenceOpeners[madeEducationChoice] : 'At 25,';

  nodes.push({
    id: 'career-decision',
    type: 'decision',
    year: character.birthYear + 25,
    age: 25,
    title: 'Career Crossroads',
    description: `${careerOpener} momentum and self-doubt arrive together. ${profile.workNuance} The path chosen now will define lifestyle, identity, and tradeoffs for decades.`,
    choices: careerChoices,
    imagePrompt: `pixel art major career decision scene in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'career',
  });

  nodes.push({
    id: 'corporate-path',
    type: 'event',
    year: character.birthYear + 28,
    age: 28,
    title: 'Corporate Climber',
    description: `${character.name} climbs quickly through demanding teams and high-stakes projects. Promotions arrive, but so do longer nights and harder boundaries between work and self.`,
    nextNodeIds: ['relationship-decision'],
    imagePrompt: `pixel art high-rise office skyline in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'career',
  });

  nodes.push({
    id: 'stable-path',
    type: 'event',
    year: character.birthYear + 28,
    age: 28,
    title: 'Steady Professional',
    description: `${character.name} opts for consistency, building trust and competence over dramatic leaps. Income grows steadily and life feels less volatile.`,
    nextNodeIds: ['relationship-decision'],
    imagePrompt: `pixel art calm professional life in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'career',
  });

  if (careerChoices.some((choice) => choice.id === 'career-creative')) {
    nodes.push({
      id: 'creative-career-path',
      type: 'event',
      year: character.birthYear + 28,
      age: 28,
      title: 'Creative Leap',
      description: `${character.name} commits fully to creative work. Recognition is uneven, but each project brings a clearer voice and deeper conviction.`,
      nextNodeIds: ['relationship-decision'],
      imagePrompt: `pixel art performance or gallery night in ${profile.city}`,
      position: { x: 0, y: 0 },
      visited: false,
      category: 'career',
    });
  }

  if (careerChoices.some((choice) => choice.id === 'career-entrepreneur')) {
    nodes.push({
      id: 'entrepreneur-path',
      type: 'event',
      year: character.birthYear + 28,
      age: 28,
      title: 'Founder Years',
      description: `${character.name} starts a venture in a volatile market. Revenue swings, sleepless nights, and occasional breakthroughs become the new normal.`,
      nextNodeIds: ['relationship-decision'],
      imagePrompt: `pixel art startup night scene in ${profile.city}`,
      position: { x: 0, y: 0 },
      visited: false,
      category: 'career',
    });
  }

  return nodes;
}

function generateCareerChoices(character: Character, profile: CityProfile): Choice[] {
  const personalities = character.personality;
  const isAmbitious = personalities.includes('ambitious');
  const isCreative = personalities.includes('creative');

  const choices: Choice[] = [
    {
      id: 'career-climb',
      text: 'Climb the Corporate Ladder',
      description: `Compete aggressively in ${profile.city}'s formal career track`,
      nextNodeId: 'corporate-path',
      effects: { money: 2, happiness: -1, occupation: 'Manager' },
      requires: { health: 2 },
    },
    {
      id: 'career-stable',
      text: 'Find Stability',
      description: 'Prioritize sustainable growth and work-life balance',
      nextNodeId: 'stable-path',
      effects: { money: 1, happiness: 1, occupation: 'Professional' },
    },
  ];

  if (isCreative || character.skills.includes('art') || character.skills.includes('music')) {
    choices.push({
      id: 'career-creative',
      text: 'Pursue Creative Dreams',
      description: 'Build a life around craft, risk, and artistic identity',
      nextNodeId: 'creative-career-path',
      effects: { money: -1, happiness: 2, occupation: 'Artist' },
      requires: { happiness: 2 },
    });
  }

  if (isAmbitious || character.skills.includes('business')) {
    choices.push({
      id: 'career-entrepreneur',
      text: 'Start a Business',
      description: 'Trade stability for ownership and upside',
      nextNodeId: 'entrepreneur-path',
      effects: { money: -2, happiness: 1, occupation: 'Entrepreneur' },
      requires: { money: 2 },
    });
  }

  return choices;
}

function generateRelationshipNodes(character: Character, profile: CityProfile): StoryNode[] {
  const nodes: StoryNode[] = [];

  nodes.push({
    id: 'relationship-decision',
    type: 'decision',
    year: character.birthYear + 28,
    age: 28,
    title: 'Love and Commitment',
    description: `${character.name} meets someone who feels like home. ${profile.socialNuance} Career plans and emotional risk now collide in the same conversation.`,
    choices: [
      {
        id: 'marry-young',
        text: 'Marry Young',
        description: 'Choose commitment and shared long-term planning',
        nextNodeId: 'married-young',
        effects: { happiness: 2, money: -1 },
      },
      {
        id: 'stay-single',
        text: 'Focus on Career',
        description: 'Protect independence and prioritize momentum',
        nextNodeId: 'single-focused',
        effects: { money: 1, happiness: -1 },
      },
      {
        id: 'live-together',
        text: 'Live Together',
        description: 'Commit deeply without formal marriage yet',
        nextNodeId: 'cohabitation',
        effects: { happiness: 1 },
      },
    ],
    imagePrompt: `pixel art relationship crossroads in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'relationship',
  });

  nodes.push({
    id: 'married-young',
    type: 'event',
    year: character.birthYear + 32,
    age: 32,
    title: 'Early Commitment',
    description: `${character.name} builds a shared household early in life. Daily routines become richer, but so do responsibilities and compromises.`,
    nextNodeIds: ['family-decision'],
    imagePrompt: `pixel art cozy apartment evening in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'relationship',
  });

  nodes.push({
    id: 'single-focused',
    type: 'event',
    year: character.birthYear + 32,
    age: 32,
    title: 'Independent Years',
    description: `${character.name} channels energy into personal goals, career growth, and chosen communities. Freedom is real, but so is occasional isolation.`,
    nextNodeIds: ['family-decision'],
    imagePrompt: `pixel art solo night walk in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'career',
  });

  nodes.push({
    id: 'cohabitation',
    type: 'event',
    year: character.birthYear + 32,
    age: 32,
    title: 'Shared Life',
    description: `${character.name} and their partner grow together through ordinary days, financial planning, and difficult conversations that slowly build trust.`,
    nextNodeIds: ['family-decision'],
    imagePrompt: `pixel art domestic life montage in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'relationship',
  });

  nodes.push({
    id: 'family-decision',
    type: 'decision',
    year: character.birthYear + 35,
    age: 35,
    title: 'Family Planning',
    description: `At 35, long-term values become concrete choices. Family, legacy, freedom, and stability all have different costs.`,
      choices: [
      {
        id: 'have-children',
        text: 'Have Children',
        description: 'Choose a demanding but deeply relational path',
        nextNodeId: 'parent-path',
        effects: { happiness: 2, money: -2, health: -1 },
        requires: { health: 2 },
      },
      {
        id: 'no-children',
        text: 'Remain Childless',
        description: 'Invest in partnership, career, and personal projects',
        nextNodeId: 'childless-path',
        effects: { money: 1, happiness: 0 },
      },
      {
        id: 'adopt',
        text: 'Adopt',
        description: 'Build family through intention and care',
        nextNodeId: 'adoption-path',
        effects: { happiness: 2, money: -1 },
        requires: { money: 1 },
      },
    ],
    imagePrompt: `pixel art family planning decision scene in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'relationship',
  });

  nodes.push({
    id: 'parent-path',
    type: 'event',
    year: character.birthYear + 38,
    age: 38,
    title: 'Parenthood',
    description: `${character.name} learns to live inside constant tradeoffs: sleep for care, ambition for presence, certainty for love. The household grows louder and more meaningful.`,
    nextNodeIds: ['midlife-crisis'],
    imagePrompt: `pixel art parent and child scene in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'relationship',
  });

  nodes.push({
    id: 'childless-path',
    type: 'event',
    year: character.birthYear + 38,
    age: 38,
    title: 'Child-Free Chapter',
    description: `${character.name} invests in friendships, travel, and mastery. Life remains flexible, and meaning is built through projects, community, and chosen rituals.`,
    nextNodeIds: ['midlife-crisis'],
    imagePrompt: `pixel art urban evening with friends in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'random',
  });

  nodes.push({
    id: 'adoption-path',
    type: 'event',
    year: character.birthYear + 38,
    age: 38,
    title: 'Adoptive Family',
    description: `${character.name} builds family through adoption, learning patience, advocacy, and unconditional care in ways that reshape identity.`,
    nextNodeIds: ['midlife-crisis'],
    imagePrompt: `pixel art adoptive family home scene in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'relationship',
  });

  return nodes;
}

function generateMidlifeNodes(character: Character, profile: CityProfile): StoryNode[] {
  const nodes: StoryNode[] = [];

  nodes.push({
    id: 'midlife-crisis',
    type: 'event',
    year: character.birthYear + 40,
    age: 40,
    title: 'The Big Four-Oh',
    description: `At 40, ${character.name} takes stock of what was gained and what was deferred. ${profile.celebrationNuance} Old dreams are reevaluated against lived reality.`,
    imagePrompt: `pixel art midlife reflection scene in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'random',
  });

  nodes.push({
    id: 'midlife-career',
    type: 'decision',
    year: character.birthYear + 45,
    age: 45,
    title: 'Peak or Pivot?',
    description: `${character.name} reaches a professional plateau. Continue maximizing status, pivot to new meaning, or reclaim time while there is still energy to use it well.`,
    choices: [
      {
        id: 'career-continue',
        text: 'Stay the Course',
        description: 'Double down on existing momentum',
        nextNodeId: 'late-career-1',
        effects: { money: 1 },
      },
      {
        id: 'career-change',
        text: 'Career Change',
        description: 'Reset identity and build from scratch',
        nextNodeId: 'late-career-1',
        effects: { money: -1, happiness: 1 },
      },
      {
        id: 'career-slow',
        text: 'Slow Down',
        description: 'Choose health and relationships over status',
        nextNodeId: 'late-career-1',
        effects: { money: -1, happiness: 2 },
      },
    ],
    imagePrompt: `pixel art midlife career decision in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'career',
  });

  return nodes;
}

function generateLateLifeNodes(character: Character, lifeExpectancy: number, profile: CityProfile): StoryNode[] {
  const nodes: StoryNode[] = [];

  nodes.push({
    id: 'late-career-1',
    type: 'event',
    year: character.birthYear + 55,
    age: 55,
    title: 'Legacy Years',
    description: `${character.name} becomes a mentor and memory-keeper. ${profile.elderNuance} Influence shifts from direct control to guidance and example.`,
    imagePrompt: `pixel art mentoring scene in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'career',
  });

  nodes.push({
    id: 'retirement',
    type: 'event',
    year: character.birthYear + 65,
    age: 65,
    title: 'Retirement',
    description: `Work obligations fall away and rhythm changes. Days are now marked by health routines, old friends, and simpler pleasures like ${profile.streetFood}.`,
    imagePrompt: `pixel art retirement neighborhood day in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'random',
  });

  nodes.push({
    id: 'health-decline',
    type: 'event',
    year: character.birthYear + 75,
    age: 75,
    title: 'Golden Years',
    description: `At 75, energy fades unpredictably, yet perspective deepens. ${character.name} learns to measure wealth in time, attention, and the people who still show up.`,
    imagePrompt: `pixel art late-life quiet evening in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'health',
  });

  // Use life expectancy to prevent unused-param warnings and add subtle narrative depth.
  if (lifeExpectancy > 88) {
    nodes[nodes.length - 1].description += ' Longevity brings unexpected extra chapters and slower, tender goodbyes.';
  }

  return nodes;
}

// Helper functions for generating descriptions
function generateChildhoodMemory(name: string, personality: string, profile: CityProfile): string {
  const memories = [
    `${name} remembers warm evening lights in ${profile.city} and the smell of ${profile.streetFood}. The city felt huge, but strangely protective.`,
    `${name} spends a rainy afternoon near home watching reflections shimmer across sidewalks. In that quiet, imagination becomes a private refuge.`,
    `${name} trails older relatives through crowded streets and learns small rituals of politeness, patience, and belonging.`,
    `${name} hears festival music in the distance and feels, for the first time, that life is larger than school and family routine.`,
  ];

  if (personality === 'analytical') {
    return `${pick(memories)} Even then, patterns and details stood out more than noise.`;
  }
  if (personality === 'adventurous') {
    return `${pick(memories)} Curiosity kept pulling toward unfamiliar corners of the neighborhood.`;
  }
  return pick(memories);
}

function generateFirstLoveStory(name: string, gender: string, profile: CityProfile): string {
  const p = pronouns(gender);
  const stories = [
    `${name} falls hard for a classmate. Between exams, late messages, and awkward courage, ${p.subject} experiences both wonder and heartbreak for the first time.`,
    `A brief romance grows through shared commutes and small routines in ${profile.city}. It ends gently, but leaves a permanent emotional vocabulary.`,
    `${name} admires someone from a distance for months, never quite speaking the right words. The silence teaches as much as confession might have.`,
    `Love arrives unexpectedly during a stressful year. It burns bright, then fades, leaving ${name} wiser about timing, vulnerability, and self-respect.`,
  ];
  return pick(stories);
}

function generateDeathDescription(character: Character, age: number, profile: CityProfile): string {
  const p = pronouns(character.gender);
  const descriptions = [
    `${character.name} passes peacefully at ${age}, surrounded by familiar voices. A life shaped by ${profile.city}'s pace and values reaches its final quiet chapter.`,
    `In ${p.possessive} final days, ${character.name} is visited by people from different chapters of life. Gratitude outweighs regret, even where dreams changed form.`,
    `${character.name} leaves this world with unfinished thoughts but a completed story: choices made with courage, compromises made with care, and love that endured.`,
    `One morning, ${character.name} takes a final breath. The room is heavy with loss and full of evidence that ${p.subject} mattered profoundly.`,
  ];
  return pick(descriptions);
}

// Position nodes in a flowchart layout
function positionNodes(nodes: StoryNode[]): StoryNode[] {
  const positionedNodes: StoryNode[] = [];
  const baseX = 400;
  const levelHeight = 100;

  const levels: Map<number, StoryNode[]> = new Map();
  nodes.forEach((node) => {
    const level = Math.floor(node.age / 5);
    if (!levels.has(level)) {
      levels.set(level, []);
    }
    levels.get(level)!.push(node);
  });

  let currentY = 50;
  levels.forEach((levelNodes) => {
    const nodeCount = levelNodes.length;
    const spacing = nodeCount > 1 ? 200 : 0;
    const startX = baseX - (spacing * (nodeCount - 1)) / 2;

    levelNodes.forEach((node, index) => {
      positionedNodes.push({
        ...node,
        position: {
          x: startX + index * spacing,
          y: currentY,
        },
      });
    });

    currentY += levelHeight;
  });

  return positionedNodes;
}

// Generate connections between nodes
export function generateConnections(nodes: StoryNode[]): { from: string; to: string }[] {
  const connections: { from: string; to: string }[] = [];

  for (let i = 0; i < nodes.length - 1; i++) {
    const current = nodes[i];
    const next = nodes[i + 1];

    if (current.choices) {
      current.choices.forEach((choice) => {
        connections.push({ from: current.id, to: choice.nextNodeId });
      });
    } else if (current.nextNodeIds) {
      current.nextNodeIds.forEach((nextId) => {
        connections.push({ from: current.id, to: nextId });
      });
    } else {
      connections.push({ from: current.id, to: next.id });
    }
  }

  return connections;
}

// Generate a random character
export function generateRandomCharacter(): Character {
  const namesByCountry: Record<
    SupportedCountry,
    { male: string[]; female: string[]; nonbinary: string[] }
  > = {
    Japan: {
      male: ['Haruto', 'Ren', 'Sota', 'Kaito', 'Yuma'],
      female: ['Yui', 'Aoi', 'Hina', 'Sakura', 'Mio'],
      nonbinary: ['Akira', 'Haru', 'Sora', 'Nao', 'Rei'],
    },
    China: {
      male: ['Wei', 'Jian', 'Ming', 'Hao', 'Yu'],
      female: ['Mei', 'Xinyi', 'Lan', 'Yue', 'Jing'],
      nonbinary: ['Rui', 'Lin', 'An', 'Chen', 'Tian'],
    },
    'United States': {
      male: ['Ethan', 'Noah', 'Liam', 'Julian', 'Miles'],
      female: ['Ava', 'Sophia', 'Maya', 'Chloe', 'Zoe'],
      nonbinary: ['Rowan', 'Jordan', 'Quinn', 'Avery', 'Skyler'],
    },
    Canada: {
      male: ['Lucas', 'Owen', 'Nathan', 'Elliot', 'Declan'],
      female: ['Amelia', 'Claire', 'Leah', 'Nora', 'Sophie'],
      nonbinary: ['Parker', 'Emerson', 'Casey', 'Sage', 'Finley'],
    },
    Singapore: {
      male: ['Kai Wen', 'Arjun', 'Darren', 'Jian Hao', 'Rizwan'],
      female: ['Hui Min', 'Aisha', 'Priya', 'Jia En', 'Nadia'],
      nonbinary: ['Ari', 'Rui', 'Sam', 'Dev', 'Nico'],
    },
  };

  const personalities = ['ambitious', 'creative', 'shy', 'outgoing', 'cautious', 'adventurous', 'analytical', 'empathetic'];
  const skills = ['art', 'music', 'writing', 'mathematics', 'sports', 'cooking', 'technology', 'business', 'languages'];
  const dreams = ['fame', 'wealth', 'happiness', 'knowledge', 'freedom', 'peace'];

  const childhoodDream = pick(dreams);
  const genders: ('male' | 'female' | 'nonbinary')[] = ['male', 'female', 'nonbinary'];
  const gender = pick(genders);

  const birthplace = pick([...SUPPORTED_CITIES]);
  const profile = getCityProfile(birthplace);
  const name = pick(namesByCountry[profile.country][gender]);
  const birthYear = 1980 + Math.floor(Math.random() * 27); // 1980-2006

  const shuffledPersonalities = [...personalities].sort(() => Math.random() - 0.5);
  const personality = shuffledPersonalities.slice(0, 2 + Math.floor(Math.random() * 2));

  const shuffledSkills = [...skills].sort(() => Math.random() - 0.5);
  const characterSkills = shuffledSkills.slice(0, 1 + Math.floor(Math.random() * 2));

  return {
    name,
    gender,
    birthplace,
    birthYear,
    age: 0,
    location: birthplace,
    occupation: 'Newborn',
    health: 5,
    money: 1,
    happiness: 3,
    personality,
    skills: characterSkills,
    childhoodDream,
  };
}


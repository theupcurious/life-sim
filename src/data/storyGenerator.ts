import type { Character, StoryNode, Choice } from '@/types/game';
import {
  SUPPORTED_CITIES,
  getCityProfile,
  type CityProfile,
  type SupportedCountry,
} from './cityProfiles.ts';
import { getHistoricalFlavor, getPopCultureHook } from './historicalFlavors.ts';

/**
 * Per-story deduplicator for historical flavor and pop-culture snippets.
 * Each call checks whether the returned text has already appeared in this
 * story; if so it returns null so the node description omits it, preventing
 * the same era sentence from repeating in back-to-back nodes.
 */
interface FlavorTracker {
  flavor: (city: string, year: number) => string | null;
  pop:    (city: string, year: number) => string | null;
}

function makeFlavorTracker(): FlavorTracker {
  const used = new Set<string>();
  const track = (text: string | null): string | null => {
    if (!text || used.has(text)) return null;
    used.add(text);
    return text;
  };
  return {
    flavor: (city, year) => track(getHistoricalFlavor(city, year)),
    pop:    (city, year) => track(getPopCultureHook(city, year)),
  };
}

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

type EducationChoiceId = 'choice-university' | 'choice-work' | 'choice-art' | 'choice-travel';
type CareerTrackId =
  | 'career-climb'
  | 'career-stable'
  | 'career-creative'
  | 'career-entrepreneur'
  | 'career-global';
type PressureLevel = 'low' | 'medium' | 'high';
type RuntimeLifeState = Partial<{
  tags: string[];
  delayedConsequences: string[];
  educationArc: string;
  careerArc: string;
  relationshipArc: string;
  familyArc: string;
  mobilityArc: string;
  unlockedChapterPools: string[];
  blockedChapterPools: string[];
}>;
type RuntimeCharacter = Character & {
  lifeState?: RuntimeLifeState;
};
type CityGameplay = {
  industries: string[];
  familyPressure: PressureLevel;
  mobility: PressureLevel;
  risk: PressureLevel;
  chapterPools: string[];
};
type ReplayContext = {
  tags: Set<string>;
  careerBias: 'formal' | 'creative' | 'global' | 'stable';
  relationshipBias: 'committed' | 'independent' | 'shared';
  familyPressure: PressureLevel;
  mobility: PressureLevel;
  risk: PressureLevel;
  industries: string[];
  chapterPools: string[];
};

function replayEffects(
  base: Choice['effects'],
  extra: Record<string, unknown>,
): Choice['effects'] {
  return { ...base, ...extra } as Choice['effects'];
}

function getCityGameplay(profile: CityProfile): CityGameplay {
  const mapPressureLevel = (value: string | undefined): PressureLevel => {
    if (value === 'high' || value === 'intense') return 'high';
    if (value === 'moderate' || value === 'medium') return 'medium';
    return 'low';
  };

  const mapMobilityLevel = (value: string | undefined): PressureLevel => {
    if (value === 'global-hub' || value === 'transient' || value === 'high') return 'high';
    if (value === 'connected' || value === 'medium') return 'medium';
    return 'low';
  };

  const mapRiskLevel = (value: string | undefined): PressureLevel => {
    if (value === 'aggressive' || value === 'high') return 'high';
    if (value === 'balanced' || value === 'medium') return 'medium';
    return 'low';
  };

  const raw = profile as CityProfile & Partial<{
    dominantIndustries: string[];
    industries: string[];
    familyPressure: PressureLevel;
    mobility: PressureLevel;
    mobilityProfile: PressureLevel;
    risk: PressureLevel;
    riskAppetite: PressureLevel;
    exclusiveChapterPools: string[];
    chapterPools: string[];
  }>;

  const fallbackByCity: Record<CityProfile['city'], CityGameplay> = {
    Tokyo: {
      industries: ['institutional', 'manufacturing', 'design'],
      familyPressure: 'medium',
      mobility: 'medium',
      risk: 'low',
      chapterPools: ['stable-organizations', 'quiet-reinvention'],
    },
    Beijing: {
      industries: ['institutional', 'technology', 'public-service'],
      familyPressure: 'high',
      mobility: 'low',
      risk: 'medium',
      chapterPools: ['family-duty', 'institutional-climb'],
    },
    Shanghai: {
      industries: ['finance', 'technology', 'global-business'],
      familyPressure: 'medium',
      mobility: 'high',
      risk: 'medium',
      chapterPools: ['urban-climb', 'global-migrant'],
    },
    'New York': {
      industries: ['finance', 'media', 'technology'],
      familyPressure: 'low',
      mobility: 'high',
      risk: 'high',
      chapterPools: ['chosen-family', 'high-ambition-urban-climb'],
    },
    'San Francisco': {
      industries: ['technology', 'startup', 'creative'],
      familyPressure: 'low',
      mobility: 'high',
      risk: 'high',
      chapterPools: ['founder-volatility', 'creative-precarity'],
    },
    Toronto: {
      industries: ['finance', 'media', 'technology'],
      familyPressure: 'medium',
      mobility: 'medium',
      risk: 'low',
      chapterPools: ['steady-growth', 'community-rooted'],
    },
    Singapore: {
      industries: ['global-business', 'finance', 'logistics'],
      familyPressure: 'high',
      mobility: 'high',
      risk: 'medium',
      chapterPools: ['global-operator', 'pragmatic-family-planning'],
    },
  };

  const fallback = fallbackByCity[profile.city];
  const gameplay = profile.gameplay;

  return {
    industries:
      gameplay?.dominantIndustries
      ?? raw.dominantIndustries
      ?? raw.industries
      ?? fallback.industries,
    familyPressure:
      gameplay?.familyPressure
        ? mapPressureLevel(gameplay.familyPressure)
        : raw.familyPressure ?? fallback.familyPressure,
    mobility:
      gameplay?.socialMobility
        ? mapMobilityLevel(gameplay.socialMobility)
        : raw.mobility ?? raw.mobilityProfile ?? fallback.mobility,
    risk:
      gameplay?.riskAppetite
        ? mapRiskLevel(gameplay.riskAppetite)
        : raw.risk ?? raw.riskAppetite ?? fallback.risk,
    chapterPools:
      gameplay?.exclusiveChapterPools
      ?? raw.exclusiveChapterPools
      ?? raw.chapterPools
      ?? fallback.chapterPools,
  };
}

function buildReplayContext(character: Character, profile: CityProfile): ReplayContext {
  const runtime = character as RuntimeCharacter;
  const lifeState = runtime.lifeState;
  const gameplay = getCityGameplay(profile);
  const tags = new Set<string>([
    ...character.personality,
    ...(lifeState?.tags ?? []),
    ...(lifeState?.delayedConsequences ?? []),
    ...(lifeState?.unlockedChapterPools ?? []),
    ...(gameplay.chapterPools ?? []),
  ]);

  const risk = gameplay.risk;
  const mobility = gameplay.mobility;
  const familyPressure = gameplay.familyPressure;

  let careerBias: ReplayContext['careerBias'] = 'stable';
  if (
    character.personality.includes('creative') ||
    character.skills.includes('art') ||
    character.skills.includes('music')
  ) {
    careerBias = 'creative';
  } else if (
    character.personality.includes('adventurous') ||
    character.childhoodDream === 'freedom' ||
    mobility === 'high'
  ) {
    careerBias = 'global';
  } else if (
    character.personality.includes('ambitious') ||
    gameplay.industries.includes('finance') ||
    gameplay.industries.includes('institutional')
  ) {
    careerBias = 'formal';
  }

  let relationshipBias: ReplayContext['relationshipBias'] = 'shared';
  if (
    familyPressure === 'high' ||
    character.personality.includes('empathetic') ||
    character.childhoodDream === 'love'
  ) {
    relationshipBias = 'committed';
  } else if (
    mobility === 'high' ||
    character.personality.includes('adventurous') ||
    character.personality.includes('ambitious')
  ) {
    relationshipBias = 'independent';
  }

  return {
    tags,
    careerBias,
    relationshipBias,
    familyPressure,
    mobility,
    risk,
    industries: gameplay.industries,
    chapterPools: gameplay.chapterPools,
  };
}

function getCareerDecisionNodeId(origin: EducationChoiceId): string {
  switch (origin) {
    case 'choice-work':
      return 'career-decision-work';
    case 'choice-art':
      return 'career-decision-art';
    case 'choice-travel':
      return 'career-decision-travel';
    default:
      return 'career-decision';
  }
}

function getWorkLifeNodeId(track: CareerTrackId): string {
  switch (track) {
    case 'career-stable':
      return 'work-life-decision-stable';
    case 'career-creative':
      return 'work-life-decision-creative';
    case 'career-entrepreneur':
      return 'work-life-decision-entrepreneur';
    case 'career-global':
      return 'work-life-decision-global';
    default:
      return 'work-life-decision';
  }
}

function getPostCareerNodeId(track: CareerTrackId): string {
  switch (track) {
    case 'career-stable':
      return 'post-career-chapter-stable';
    case 'career-creative':
      return 'post-career-chapter-creative';
    case 'career-entrepreneur':
      return 'post-career-chapter-entrepreneur';
    case 'career-global':
      return 'post-career-chapter-global';
    default:
      return 'post-career-chapter';
  }
}

export type StoryChapterKey = 'opening' | 'career' | 'relationship' | 'midlife' | 'late-life';

export type StoryGenerationRequest = {
  character: Character;
  existingNodes?: StoryNode[];
  currentNodeId?: string;
  lastChoiceId?: string;
  lifeExpectancy?: number;
};

type StoryBuildContext = {
  character: Character;
  profile: CityProfile;
  ft: FlavorTracker;
  lifeExpectancy: number;
};

function hashStorySeed(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 2147483647;
  }
  return hash;
}

function resolveLifeExpectancy(
  character: Character,
  lifeExpectancy?: number,
  existingNodes: StoryNode[] = [],
): number {
  if (lifeExpectancy !== undefined) return lifeExpectancy;

  const deathNode = existingNodes.find((node) => node.id === 'death');
  if (deathNode) return deathNode.age;

  const seed = [
    character.name,
    character.birthplace,
    String(character.birthYear),
    character.gender,
    character.childhoodDream ?? '',
    character.personality.join('|'),
    character.skills.join('|'),
  ].join('::');

  return 75 + (hashStorySeed(seed) % 20);
}

function createStoryBuildContext(
  character: Character,
  options: Pick<StoryGenerationRequest, 'existingNodes' | 'lifeExpectancy'> = {},
): StoryBuildContext {
  return {
    character,
    profile: getCityProfile(character.birthplace),
    ft: makeFlavorTracker(),
    lifeExpectancy: resolveLifeExpectancy(character, options.lifeExpectancy, options.existingNodes),
  };
}

function buildOpeningChapter(context: StoryBuildContext): StoryNode[] {
  const { character, profile, ft } = context;

  return [
    {
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
    },
    ...generateChildhoodNodes(character, profile, ft),
    generateRandomEvent('adolescent', character, profile),
    ...generateTeenageNodes(character, profile, ft),
    generateEducationDecision(character, profile, ft),
  ];
}

function buildCareerChapter(context: StoryBuildContext): StoryNode[] {
  const { character, profile, ft } = context;
  const eraEvent = getCityEraEvent(character, profile);
  const careerNodes = generateCareerPaths(character, profile, ft);
  const careerDecisionIndex = careerNodes.findIndex((node) => node.age >= 25);
  const preDecisionNodes = careerDecisionIndex === -1 ? careerNodes : careerNodes.slice(0, careerDecisionIndex);
  const postDecisionNodes = careerDecisionIndex === -1 ? [] : careerNodes.slice(careerDecisionIndex);

  return [
    generateRandomEvent('young-adult', character, profile),
    ...preDecisionNodes,
    ...(eraEvent ? [eraEvent] : []),
    ...postDecisionNodes,
    ...generateWorkLifeDecisions(character, profile),
    ...generatePostCareerBreathers(character, profile),
  ];
}

function buildRelationshipChapter(context: StoryBuildContext): StoryNode[] {
  return generateRelationshipNodes(context.character, context.profile);
}

function buildMidlifeChapter(context: StoryBuildContext): StoryNode[] {
  return generateMidlifeNodes(context.character, context.profile, context.ft);
}

function createDeathNode(context: StoryBuildContext): StoryNode {
  const { character, profile, lifeExpectancy } = context;
  const deathYear = character.birthYear + lifeExpectancy;

  return {
    id: 'death',
    type: 'end',
    year: deathYear,
    age: lifeExpectancy,
    title: 'The End',
    description: generateDeathDescription(character, lifeExpectancy, profile),
    imagePrompt: `pixel art reflective ending scene in ${profile.city} at night`,
    position: { x: 400, y: 50 },
    visited: false,
    category: 'health',
  };
}

function buildLateLifeChapter(context: StoryBuildContext): StoryNode[] {
  return [
    ...generateLateLifeNodes(context.character, context.lifeExpectancy, context.profile),
    createDeathNode(context),
  ];
}

function buildChapterByKey(context: StoryBuildContext, key: StoryChapterKey): StoryNode[] {
  switch (key) {
    case 'opening':
      return buildOpeningChapter(context);
    case 'career':
      return buildCareerChapter(context);
    case 'relationship':
      return buildRelationshipChapter(context);
    case 'midlife':
      return buildMidlifeChapter(context);
    case 'late-life':
      return buildLateLifeChapter(context);
  }
}

function isEducationChoice(choiceId?: string): boolean {
  return choiceId !== undefined && ['choice-university', 'choice-work', 'choice-art', 'choice-travel'].includes(choiceId);
}

function isWorkLifeChoice(choiceId?: string): boolean {
  return choiceId !== undefined && choiceId.includes('-wl-');
}

function isRelationshipChoice(choiceId?: string): boolean {
  return choiceId !== undefined && ['marry-young', 'stay-single', 'live-together'].includes(choiceId);
}

function isFamilyChoice(choiceId?: string): boolean {
  return choiceId !== undefined && [
    'have-children',
    'no-children',
    'adopt',
    'chosen-family',
    'late-parenthood',
    'remain-independent',
    'formalize-commitment',
    'stay-childfree-together',
    'adopt-together',
  ].includes(choiceId);
}

function isMidlifeChoice(choiceId?: string): boolean {
  return choiceId !== undefined && [
    'career-continue',
    'career-change',
    'career-slow',
    'career-global',
    'career-freelance',
    'hr-commit',
    'hr-therapy',
    'hr-accept',
    'hr-push',
    'fork-give-back',
    'fork-ambition',
    'fork-slow',
  ].includes(choiceId);
}

function inferNextChapterKey(request: StoryGenerationRequest): StoryChapterKey | null {
  const existingIds = new Set((request.existingNodes ?? []).map((node) => node.id));
  const currentNodeId = request.currentNodeId ?? request.existingNodes?.[request.existingNodes.length - 1]?.id;

  if ((request.existingNodes?.length ?? 0) === 0 || !existingIds.has('education-decision')) {
    return 'opening';
  }

  if (isEducationChoice(request.lastChoiceId) || currentNodeId === 'education-decision') {
    return 'career';
  }

  if (isWorkLifeChoice(request.lastChoiceId) || currentNodeId?.startsWith('work-life-decision') || currentNodeId?.startsWith('post-career-chapter')) {
    return 'relationship';
  }

  if (isRelationshipChoice(request.lastChoiceId) || isFamilyChoice(request.lastChoiceId) || currentNodeId === 'relationship-decision' || currentNodeId?.startsWith('family-decision')) {
    return 'midlife';
  }

  if (isMidlifeChoice(request.lastChoiceId) || currentNodeId === 'midlife-career' || currentNodeId?.startsWith('health-reckoning') || currentNodeId === 'late-40s-fork') {
    return 'late-life';
  }

  if (!existingIds.has('relationship-decision')) return 'career';
  if (!existingIds.has('midlife-career')) return 'relationship';
  if (!existingIds.has('retirement') && !existingIds.has('death')) return 'midlife';
  if (!existingIds.has('death')) return 'late-life';

  return null;
}

function positionAppendedNodes(existingNodes: StoryNode[], nextNodes: StoryNode[]): StoryNode[] {
  if (nextNodes.length === 0) return [];

  const existingIds = new Set(existingNodes.map((node) => node.id));
  const uniqueNextNodes = nextNodes.filter((node) => !existingIds.has(node.id));
  if (uniqueNextNodes.length === 0) return [];

  const positioned = positionNodes([...existingNodes, ...uniqueNextNodes]);
  return positioned.filter((node) => !existingIds.has(node.id));
}

export function generateInitialLifeStory(character: Character, lifeExpectancy?: number): StoryNode[] {
  const context = createStoryBuildContext(character, { lifeExpectancy });
  return positionNodes(buildOpeningChapter(context));
}

export function generateNextChapter(request: StoryGenerationRequest): StoryNode[] {
  const key = inferNextChapterKey(request);
  if (!key) return [];

  const existingNodes = request.existingNodes ?? [];
  const context = createStoryBuildContext(request.character, {
    existingNodes,
    lifeExpectancy: request.lifeExpectancy,
  });

  return positionAppendedNodes(existingNodes, buildChapterByKey(context, key));
}

// Generate a unique life story based on character inputs
export function generateLifeStory(character: Character): StoryNode[] {
  const context = createStoryBuildContext(character);
  return positionNodes([
    ...buildOpeningChapter(context),
    ...buildCareerChapter(context),
    ...buildRelationshipChapter(context),
    ...buildMidlifeChapter(context),
    ...buildLateLifeChapter(context),
  ]);
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
    {
      title: 'The Injury',
      description: `A sports injury at 13 sidelines ${character.name} for a full semester. The enforced stillness is frustrating, then gradually illuminating — reading, writing, or helping others fills the gap in unexpected ways.`,
      category: 'health',
    },
    {
      title: 'A Mentor Appears',
      description: `An unlikely teacher — a neighbor, a coach, a store owner near school — sees something in ${character.name} and says so directly. The encouragement arrives at exactly the right moment. Its effect lasts decades.`,
      category: 'education',
    },
  ];

  const youngAdultEvents: Array<{ title: string; description: string; category: StoryNode['category'] }> = [
    {
      title: 'The Health Scare',
      description: `At 20, a brief but serious illness forces ${character.name} to slow down for the first time. Weeks of recovery bring unexpected clarity about what actually matters — and what has been taken for granted.`,
      category: 'health',
    },
    {
      title: 'An Unexpected Windfall',
      description: `A small inheritance from a distant relative arrives at exactly the right moment. ${character.name} faces a first real financial choice: invest, spend, or save it for a future that still feels abstract.`,
      category: 'random',
    },
    {
      title: 'A Falling Out',
      description: `A close friendship shatters unexpectedly before ${character.name} turns 21. The loss is disproportionately painful — and teaches more about forgiveness, pride, and self-respect than years of easier relationships will.`,
      category: 'relationship',
    },
    {
      title: 'The Road Not Taken',
      description: `${character.name} almost takes a very different path — an offer abroad, a scholarship, a relationship that would have changed everything. The near-miss becomes a quiet reference point for years.`,
      category: 'random',
    },
    {
      title: 'A Surprising Discovery',
      description: `While exploring an unfamiliar part of ${profile.city}, ${character.name} stumbles into something unexpected — a community, a discipline, an idea — that immediately feels like home and reshapes the next few years.`,
      category: 'childhood',
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
      description: `A routine checkup returns unexpected results. Nothing catastrophic, but enough to make mortality feel real for the first time. Habits change. Priorities sharpen. The body starts telling a longer story.`,
      category: 'health',
    },
    {
      title: 'Recognition',
      description: `Decades of work crystallize in a moment of unexpected recognition — an award, a mention, a letter from someone who says ${character.name}'s quiet contributions mattered. It arrives later than expected, and means more for it.`,
      category: 'career',
    },
    {
      title: 'A Death in the Family',
      description: `A parent or close relative passes after a long decline. Grief is complicated — there is loss, relief, unfinished conversations, and the sudden weight of being next in line. ${character.name} doesn't fully process it for years.`,
      category: 'health',
    },
    {
      title: 'An Unexpected Investment',
      description: `A small business decision or property purchase in ${profile.city} that seemed unremarkable quietly compounds over a decade. By the time ${character.name} notices what it has become, it changes the rest of the plan entirely.`,
      category: 'career',
    },
  ];

  const pool = phase === 'adolescent' ? adolescentEvents
    : phase === 'young-adult' ? youngAdultEvents
    : midlifeEvents;

  const ages: Record<RandomEventPhase, number> = { adolescent: 13, 'young-adult': 20, midlife: 52 };
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

function generateChildhoodNodes(character: Character, profile: CityProfile, ft: FlavorTracker): StoryNode[] {
  const nodes: StoryNode[] = [];
  const personality = character.personality[0] || 'curious';
  const talent = character.skills[0] || 'learning';
  const eraFlavor = ft.flavor(profile.city, character.birthYear + 5);

  nodes.push({
    id: 'childhood-1',
    type: 'event',
    year: character.birthYear + 5,
    age: 5,
    title: 'First Memory',
    description: [
      generateChildhoodMemory(character.name, personality, profile),
      eraFlavor,
    ].filter(Boolean).join(' '),
    imagePrompt: `pixel art childhood memory in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'childhood',
  });

  const schoolEra = ft.flavor(profile.city, character.birthYear + 8);
  nodes.push({
    id: 'childhood-2',
    type: 'event',
    year: character.birthYear + 8,
    age: 8,
    title: 'School Days',
    description: [
      `${character.name} starts school in ${profile.city}. ${profile.schoolingNuance}`,
      personality === 'shy'
        ? 'Making close friends is slow, but each bond runs deep.'
        : personality === 'outgoing'
          ? 'Friend groups form quickly, and social confidence grows fast.'
          : 'Curiosity and observation become a quiet strength.',
      schoolEra,
    ].filter(Boolean).join(' '),
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

function generateTeenageNodes(character: Character, profile: CityProfile, ft: FlavorTracker): StoryNode[] {
  const nodes: StoryNode[] = [];
  const pop15 = ft.pop(profile.city, character.birthYear + 15);

  nodes.push({
    id: 'teenage-1',
    type: 'decision',
    year: character.birthYear + 15,
    age: 15,
    title: 'The Teenage Years',
    description: [
      `At 15, pressure intensifies in ${profile.city}. ${profile.socialNuance} The first real identity choice appears: performance, belonging, or rebellion.`,
      pop15,
    ].filter(Boolean).join(' '),
    choices: [
      {
        id: 'teen-study',
        text: 'Focus on Studies',
        description: 'Commit to academic performance and discipline',
        nextNodeId: 'teen-study-path',
        effects: replayEffects(
          { happiness: -1 },
          {
            tags: ['disciplined'],
            delayedConsequences: ['credential-momentum'],
          },
        ),
      },
      {
        id: 'teen-social',
        text: 'Build Friendships',
        description: 'Prioritize social life and emotional support',
        nextNodeId: 'teen-social-path',
        effects: replayEffects(
          { happiness: 1 },
          {
            tags: ['connector'],
            delayedConsequences: ['chosen-family-network'],
          },
        ),
      },
      {
        id: 'teen-rebel',
        text: 'Explore Rebellion',
        description: 'Test boundaries and challenge expectations',
        nextNodeId: 'teen-rebel-path',
        effects: replayEffects(
          { health: -1, happiness: 1 },
          {
            tags: ['restless'],
            delayedConsequences: ['authority-friction'],
          },
        ),
      },
    ],
    imagePrompt: `pixel art teenage crossroads in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'education',
  });

  // Unique diverging nodes before teenage-2
  nodes.push({
    id: 'teen-study-path',
    type: 'event',
    year: character.birthYear + 16,
    age: 16,
    title: 'The Exam Grind',
    description: `${character.name} becomes known as the disciplined one — top of most class rankings, last to leave the library. The social cost is real: weekends spent studying, friendships that drift. But a growing academic identity starts to feel like armor.`,
    nextNodeIds: ['teenage-2'],
    imagePrompt: `pixel art student studying late at night in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'education',
  });

  nodes.push({
    id: 'teen-social-path',
    type: 'event',
    year: character.birthYear + 16,
    age: 16,
    title: 'The Social Web',
    description: `${character.name} becomes a connector — the one who knows everyone, organizes events, navigates the politics of who belongs where. Grades are fine, not exceptional. What grows instead is an instinct for reading people that will outlast any grade.`,
    nextNodeIds: ['teenage-2'],
    imagePrompt: `pixel art teenage friends hanging out in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'relationship',
  });

  nodes.push({
    id: 'teen-rebel-path',
    type: 'event',
    year: character.birthYear + 16,
    age: 16,
    title: 'Crossing Lines',
    description: `${character.name} pushes back against every expected path. A brush with school authority — a suspended week, a late-night incident — becomes a strange turning point. The confrontation forces a question: is this who ${character.name} actually wants to be, or just who ${character.name} is pretending to be?`,
    nextNodeIds: ['teenage-2'],
    imagePrompt: `pixel art teenage rebellion scene in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'health',
  });

  const pop17 = ft.pop(profile.city, character.birthYear + 17);
  nodes.push({
    id: 'teenage-2',
    type: 'event',
    year: character.birthYear + 17,
    age: 17,
    title: 'First Love',
    description: [
      generateFirstLoveStory(character.name, character.gender, profile),
      pop17,
    ].filter(Boolean).join(' '),
    imagePrompt: `pixel art teenage romance moment in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'relationship',
  });

  return nodes;
}

function generateEducationDecision(character: Character, profile: CityProfile, ft: FlavorTracker): StoryNode {
  const context = buildReplayContext(character, profile);
  const dream = dreamLabel(character.childhoodDream);
  const eraAt18 = ft.flavor(profile.city, character.birthYear + 18);

  return {
    id: 'education-decision',
    type: 'decision',
    year: character.birthYear + 18,
    age: 18,
    title: 'The Crossroads',
    description: [
      `School ends and adulthood begins in ${profile.city}. Family expectations, financial reality, and dreams of ${dream} collide in one irreversible decision.`,
      eraAt18,
    ].filter(Boolean).join(' '),
    choices: [
      {
        id: 'choice-university',
        text: 'Attend University',
        description: 'Invest in long-term credentials and knowledge',
        nextNodeId: 'university-path',
        effects: replayEffects(
          { money: -1, happiness: 1, occupation: 'Student' },
          {
            educationArc: 'elite-academic',
            tags: ['credential-track'],
            delayedConsequences: ['credential-momentum'],
            unlockedChapterPools: ['formal-career'],
          },
        ),
      },
      {
        id: 'choice-work',
        text: 'Start Working',
        description: 'Earn early and build practical momentum',
        nextNodeId: 'work-path',
        effects: replayEffects(
          { money: 1, occupation: 'Worker' },
          {
            educationArc: 'practical-work',
            tags: ['practical-operator'],
            delayedConsequences: ['early-income'],
            unlockedChapterPools: ['steady-growth'],
          },
        ),
      },
      {
        id: 'choice-art',
        text: 'Pursue Art/Creative Path',
        description: 'Bet on creative identity over stability',
        nextNodeId: 'art-path',
        effects: replayEffects(
          { money: -2, happiness: 2, occupation: 'Aspiring Artist' },
          {
            educationArc: 'creative-self-made',
            tags: ['creative-risk'],
            delayedConsequences: ['portfolio-identity'],
            unlockedChapterPools: ['creative-precarity'],
          },
        ),
      },
      {
        id: 'choice-travel',
        text: 'Travel the World',
        description: 'Delay commitment and gather perspective',
        nextNodeId: 'travel-path',
        effects: replayEffects(
          { money: -2, happiness: 2, occupation: 'Traveller' },
          {
            educationArc: 'restless-explorer',
            mobilityArc: 'global-opportunist',
            tags: ['mobility-network'],
            delayedConsequences: ['international-door'],
            unlockedChapterPools: context.mobility === 'high' ? ['global-migrant'] : ['reinvention'],
          },
        ),
      },
    ],
    imagePrompt: `pixel art graduation crossroads in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'education',
  };
}

function generateCareerPaths(character: Character, profile: CityProfile, ft: FlavorTracker): StoryNode[] {
  const nodes: StoryNode[] = [];
  const skill = character.skills[0] || 'adaptability';
  const context = buildReplayContext(character, profile);
  const availableTrackIds = new Set<CareerTrackId>();

  nodes.push({
    id: 'university-path',
    type: 'event',
    year: character.birthYear + 20,
    age: 20,
    title: 'The Midterm Grind',
    description: `Halfway through the degree, the reality of the work sets in. Long nights in the library, the growing pressure of entering the workforce, and the feeling that ${profile.city} is moving faster than ${character.name} can study it.`,
    nextNodeIds: ['university-midpoint'],
    imagePrompt: `pixel art student studying late in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'education',
  });

  nodes.push({
    id: 'university-midpoint',
    type: 'event',
    year: character.birthYear + 22,
    age: 22,
    title: 'University Graduate',
    description: `${character.name} graduates and enters a crowded market with growing confidence in ${skill}. In ${profile.city}, credentials open doors, but grit determines which ones stay open.`,
    nextNodeIds: [getCareerDecisionNodeId('choice-university')],
    imagePrompt: `pixel art graduation ceremony in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'education',
  });

  nodes.push({
    id: 'work-path',
    type: 'event',
    year: character.birthYear + 20,
    age: 20,
    title: 'Earning Early',
    description: `While peers sit in lecture halls, ${character.name} is already earning a paycheck. The independence feels good, but navigating workplace politics at 20 requires growing up quickly.`,
    nextNodeIds: ['work-midpoint'],
    imagePrompt: `pixel art young adult at first job in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'career',
  });

  nodes.push({
    id: 'work-midpoint',
    type: 'event',
    year: character.birthYear + 22,
    age: 22,
    title: 'Working Life',
    description: `Four years of direct work experience sharpen ${character.name}'s instincts. ${profile.workNuance} Small wins start accumulating into professional identity.`,
    nextNodeIds: [getCareerDecisionNodeId('choice-work')],
    imagePrompt: `pixel art early career office scene in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'career',
  });

  nodes.push({
    id: 'art-path',
    type: 'event',
    year: character.birthYear + 20,
    age: 20,
    title: 'Finding a Voice',
    description: `The early creative years are loud and chaotic. There is no money, but there is absolute freedom. ${character.name} finds a community of like-minded people in ${profile.city} who make the struggle feel like a shared secret.`,
    nextNodeIds: ['art-midpoint'],
    imagePrompt: `pixel art young artists collaborating in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'career',
  });

  nodes.push({
    id: 'art-midpoint',
    type: 'event',
    year: character.birthYear + 22,
    age: 22,
    title: 'The Struggling Artist',
    description: `${character.name} spends years creating with uncertain income and occasional breakthroughs. The work is raw, personal, and often misunderstood, but impossible to abandon.`,
    nextNodeIds: [getCareerDecisionNodeId('choice-art')],
    imagePrompt: `pixel art artist studio at night in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'career',
  });

  nodes.push({
    id: 'travel-path',
    type: 'event',
    year: character.birthYear + 20,
    age: 20,
    title: 'Far From Home',
    description: `A missed train, a stolen wallet, a conversation with a stranger in a language ${character.name} barely speaks. The romance of travel gives way to the gritty, beautiful reality of surviving on one's own wits.`,
    nextNodeIds: ['travel-midpoint'],
    imagePrompt: `pixel art backpacker at a foreign train station`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'random',
  });

  nodes.push({
    id: 'travel-midpoint',
    type: 'event',
    year: character.birthYear + 22,
    age: 22,
    title: 'World Wanderer',
    description: `${character.name} returns to ${profile.city} after years abroad with expanded perspective, looser assumptions, and a clearer sense of what kind of life feels authentic.`,
    nextNodeIds: [getCareerDecisionNodeId('choice-travel')],
    imagePrompt: `pixel art return-from-travel scene at ${profile.city} terminal`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'random',
  });

  const careerDecisionSpecs: Array<{
    origin: EducationChoiceId;
    opener: string;
    title: string;
    emphasis: string;
  }> = [
    {
      origin: 'choice-university',
      opener: 'A degree in hand and theory in mind,',
      title: 'Career Crossroads',
      emphasis: 'Credentials created options, but not certainty.',
    },
    {
      origin: 'choice-work',
      opener: 'Having already logged real hours in the working world,',
      title: 'Practical Momentum',
      emphasis: 'Experience has become leverage, but also a kind of inertia.',
    },
    {
      origin: 'choice-art',
      opener: 'After years betting on creative identity over stability,',
      title: 'Make It Sustainable',
      emphasis: 'The question is no longer whether the work matters. It is whether it can carry a life.',
    },
    {
      origin: 'choice-travel',
      opener: 'Back from wandering with a wider frame of reference,',
      title: 'Re-Entering the City',
      emphasis: 'Perspective is richer now, but so is the pressure to commit.',
    },
  ];

  const eraAt25 = ft.flavor(profile.city, character.birthYear + 25);
  careerDecisionSpecs.forEach((spec) => {
    const choices = generateCareerChoices(character, profile, spec.origin, context);
    choices.forEach((choice) => {
      availableTrackIds.add(choice.id as CareerTrackId);
    });
    nodes.push({
      id: getCareerDecisionNodeId(spec.origin),
      type: 'decision',
      year: character.birthYear + 25,
      age: 25,
      title: spec.title,
      description: [
        `${spec.opener} momentum and self-doubt arrive together. ${profile.workNuance} ${spec.emphasis}`,
        eraAt25,
      ].filter(Boolean).join(' '),
      choices,
      imagePrompt: `pixel art major career decision scene in ${profile.city}`,
      position: { x: 0, y: 0 },
      visited: false,
      category: 'career',
    });
  });

  nodes.push({
    id: 'corporate-path',
    type: 'event',
    year: character.birthYear + 27,
    age: 27,
    title: 'Climbing the Ladder',
    description: `The hours are brutal, but the momentum is undeniable. ${character.name} learns how to navigate the unwritten rules of ${profile.city}'s corporate ecosystem. Competence turns into influence.`,
    nextNodeIds: ['corporate-event'],
    imagePrompt: `pixel art young professional in a sharp meeting in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'career',
  });

  nodes.push({
    id: 'corporate-event',
    type: 'event',
    year: character.birthYear + 29,
    age: 29,
    title: 'The Promotion',
    description: `${character.name} secures a major promotion. The title brings money and respect, but also the realization that this level of stress is now the baseline, not the exception.`,
    nextNodeIds: [getWorkLifeNodeId('career-climb')],
    imagePrompt: `pixel art high-rise office skyline at night in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'career',
  });

  nodes.push({
    id: 'stable-path',
    type: 'event',
    year: character.birthYear + 27,
    age: 27,
    title: 'Finding the Groove',
    description: `Work becomes something ${character.name} does, rather than entirely who ${character.name} is. The predictable income allows a life outside of the office to actually begin taking shape.`,
    nextNodeIds: ['stable-event'],
    imagePrompt: `pixel art leaving work on time in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'career',
  });

  nodes.push({
    id: 'stable-event',
    type: 'event',
    year: character.birthYear + 29,
    age: 29,
    title: 'Steady Professional',
    description: `${character.name} opts for consistency, building trust and competence over dramatic leaps. Income grows steadily and life feels less volatile, even if the work itself rarely surprises anymore.`,
    nextNodeIds: [getWorkLifeNodeId('career-stable')],
    imagePrompt: `pixel art calm professional life in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'career',
  });

  if (availableTrackIds.has('career-creative')) {
    nodes.push({
      id: 'creative-career-path',
      type: 'event',
      year: character.birthYear + 27,
      age: 27,
      title: 'The Hustle',
      description: `Every gig requires pitching; every month requires balancing the books. ${character.name} gets intimately familiar with the feast-and-famine cycle of being an independent creator.`,
      nextNodeIds: ['creative-event'],
      imagePrompt: `pixel art disorganized creative workspace in ${profile.city}`,
      position: { x: 0, y: 0 },
      visited: false,
      category: 'career',
    });

    nodes.push({
      id: 'creative-event',
      type: 'event',
      year: character.birthYear + 29,
      age: 29,
      title: 'Creative Breakthrough',
      description: `A project finally catches fire. Recognition arrives, uneven but real. Each success brings a clearer voice and deeper conviction, though the financial tightrope never entirely vanishes.`,
      nextNodeIds: [getWorkLifeNodeId('career-creative')],
      imagePrompt: `pixel art performance or gallery night in ${profile.city}`,
      position: { x: 0, y: 0 },
      visited: false,
      category: 'career',
    });
  }

  if (availableTrackIds.has('career-entrepreneur')) {
    nodes.push({
      id: 'entrepreneur-path',
      type: 'event',
      year: character.birthYear + 27,
      age: 27,
      title: 'The Lean Years',
      description: `Building something from zero means wearing every hat. ${character.name} pitches, builds, sells, and sweeps the floors. The burn rate is terrifying, but the absolute autonomy is intoxicating.`,
      nextNodeIds: ['entrepreneur-event'],
      imagePrompt: `pixel art messy startup garage or shared space in ${profile.city}`,
      position: { x: 0, y: 0 },
      visited: false,
      category: 'career',
    });

    nodes.push({
      id: 'entrepreneur-event',
      type: 'event',
      year: character.birthYear + 29,
      age: 29,
      title: 'Founder Momentum',
      description: `The venture survives the initial volatility. Revenue swings, sleepless nights, and occasional breakthroughs become the new normal. The business is no longer just an idea; it's a living organism.`,
      nextNodeIds: [getWorkLifeNodeId('career-entrepreneur')],
      imagePrompt: `pixel art startup night scene in ${profile.city}`,
      position: { x: 0, y: 0 },
      visited: false,
      category: 'career',
    });
  }

  if (availableTrackIds.has('career-global')) {
    nodes.push({
      id: 'global-path',
      type: 'event',
      year: character.birthYear + 27,
      age: 27,
      title: 'Borderless Momentum',
      description: `${character.name} starts working across borders, time zones, and cultures. Opportunity scales up quickly, but so does the sense of never being fully settled in one place.`,
      nextNodeIds: ['global-event'],
      imagePrompt: `pixel art airport lounge or global office scene linked to ${profile.city}`,
      position: { x: 0, y: 0 },
      visited: false,
      category: 'career',
    });

    nodes.push({
      id: 'global-event',
      type: 'event',
      year: character.birthYear + 29,
      age: 29,
      title: 'A Portable Life',
      description: `${character.name} becomes fluent in reinvention. Contracts, relocations, and international partnerships reshape identity into something more adaptive and less rooted.`,
      nextNodeIds: [getWorkLifeNodeId('career-global')],
      imagePrompt: `pixel art night flight over a city skyline`,
      position: { x: 0, y: 0 },
      visited: false,
      category: 'career',
    });
  }

  return nodes;
}

function generateCareerChoices(
  character: Character,
  profile: CityProfile,
  origin: EducationChoiceId,
  context: ReplayContext,
): Choice[] {
  const personalities = character.personality;
  const isAmbitious = personalities.includes('ambitious');
  const isCreative = personalities.includes('creative');
  const allowsCreative =
    isCreative ||
    character.skills.includes('art') ||
    character.skills.includes('music') ||
    origin === 'choice-art' ||
    context.careerBias === 'creative' ||
    context.industries.includes('creative');
  const allowsEntrepreneur =
    isAmbitious ||
    character.skills.includes('business') ||
    context.risk === 'high' ||
    context.industries.includes('startup');
  const allowsGlobal =
    origin === 'choice-travel' ||
    context.mobility === 'high' ||
    context.careerBias === 'global' ||
    context.industries.includes('global-business') ||
    context.industries.includes('logistics');

  const choices: Choice[] = [
    {
      id: 'career-climb',
      text: 'Climb the Corporate Ladder',
      description: `Compete aggressively in ${profile.city}'s formal career track`,
      nextNodeId: 'corporate-path',
      effects: replayEffects(
        { money: 2, happiness: -1, occupation: 'Manager' },
        {
          careerArc: 'corporate-climb',
          tags: ['status-striver'],
          delayedConsequences: ['burnout-risk'],
          unlockedChapterPools: ['high-ambition-urban-climb'],
        },
      ),
      requires: { health: 2 },
    },
    {
      id: 'career-stable',
      text: 'Find Stability',
      description: 'Prioritize sustainable growth and work-life balance',
      nextNodeId: 'stable-path',
      effects: replayEffects(
        { money: 1, happiness: 1, occupation: 'Professional' },
        {
          careerArc: 'stable-craft',
          tags: ['steady-builder'],
          delayedConsequences: ['reliable-network'],
          unlockedChapterPools: ['quiet-rooted-life'],
        },
      ),
    },
  ];

  if (allowsCreative) {
    choices.push({
      id: 'career-creative',
      text: 'Pursue Creative Dreams',
      description: 'Build a life around craft, risk, and artistic identity',
      nextNodeId: 'creative-career-path',
      effects: replayEffects(
        { money: -1, happiness: 2, occupation: 'Artist' },
        {
          careerArc: 'creative-precarity',
          tags: ['creative-identity'],
          delayedConsequences: ['portfolio-breakthrough'],
          unlockedChapterPools: ['creative-precarity'],
        },
      ),
      requires: { happiness: 2 },
    });
  }

  if (allowsEntrepreneur) {
    choices.push({
      id: 'career-entrepreneur',
      text: 'Start a Business',
      description: 'Trade stability for ownership and upside',
      nextNodeId: 'entrepreneur-path',
      effects: replayEffects(
        { money: -2, happiness: 1, occupation: 'Entrepreneur' },
        {
          careerArc: 'founder-volatility',
          tags: ['ownership-bet'],
          delayedConsequences: ['equity-upside'],
          unlockedChapterPools: ['founder-volatility'],
        },
      ),
      requires: { money: 2 },
    });
  }

  if (allowsGlobal) {
    choices.push({
      id: 'career-global',
      text: 'Build an International Career',
      description: 'Use mobility and networks to work across borders',
      nextNodeId: 'global-path',
      effects: replayEffects(
        { money: 1, happiness: 1, occupation: 'Global Operator' },
        {
          careerArc: 'global-operator',
          mobilityArc: 'migrant',
          tags: ['portable-identity'],
          delayedConsequences: ['cross-border-network'],
          unlockedChapterPools: ['global-migrant'],
        },
      ),
      requires: { happiness: 2 },
    });
  }

  if (origin === 'choice-art') {
    return choices.sort((left, right) => Number(right.id === 'career-creative') - Number(left.id === 'career-creative'));
  }

  if (origin === 'choice-travel') {
    return choices.sort((left, right) => Number(right.id === 'career-global') - Number(left.id === 'career-global'));
  }

  if (origin === 'choice-work' && context.careerBias === 'stable') {
    return choices.sort((left, right) => Number(right.id === 'career-stable') - Number(left.id === 'career-stable'));
  }

  return choices;
}

function generateWorkLifeDecisions(character: Character, profile: CityProfile): StoryNode[] {
  const pr = pronouns(character.gender);
  const variants: Array<{
    id: string;
    track: CareerTrackId;
    title: string;
    description: string;
  }> = [
    {
      id: getWorkLifeNodeId('career-climb'),
      track: 'career-climb',
      title: 'Work or Life?',
      description: `At 31, ${character.name} feels the tension that defines this decade in ${profile.city}: career momentum pulling one way, everything else pulling the other. ${pr.possessive.charAt(0).toUpperCase() + pr.possessive.slice(1)} recent wins have made stepping back harder than pushing forward.`,
    },
    {
      id: getWorkLifeNodeId('career-stable'),
      track: 'career-stable',
      title: 'Guard the Balance',
      description: `At 31, ${character.name} has something many peers envy: a life that is functional. The risk now is sleepwalking through it. ${profile.city}'s pace still presses from the outside, asking whether stability is enough.`,
    },
    {
      id: getWorkLifeNodeId('career-creative'),
      track: 'career-creative',
      title: 'Keep the Fire or Build a Life',
      description: `At 31, the work matters deeply, but the instability is no longer romantic. ${character.name} has to decide whether to protect the spark, broaden the base, or finally rest.`,
    },
    {
      id: getWorkLifeNodeId('career-entrepreneur'),
      track: 'career-entrepreneur',
      title: 'Scale or Stabilize',
      description: `At 31, the venture is real enough to consume everything. In ${profile.city}, growth and exhaustion often arrive in the same package. ${character.name} has to choose what gets protected.`,
    },
    {
      id: getWorkLifeNodeId('career-global'),
      track: 'career-global',
      title: 'Roots or Range',
      description: `At 31, every new opportunity seems to involve another border crossing. The life built so far is expansive, but hard to anchor. ${character.name} has to decide what kind of belonging matters now.`,
    },
  ];

  return variants.map((variant) => ({
    id: variant.id,
    type: 'decision',
    year: character.birthYear + 31,
    age: 31,
    title: variant.title,
    description: variant.description,
    choices: [
      {
        id: `${variant.track}-wl-push`,
        text: variant.track === 'career-stable' ? 'Accept More Responsibility' : 'Push Harder at Work',
        description: 'Bet on momentum while the window is open',
        nextNodeId: getPostCareerNodeId(variant.track),
        effects: replayEffects(
          { money: 2, happiness: -1, health: -1 },
          {
            delayedConsequences: ['burnout-risk'],
            tags: ['work-maximalist'],
          },
        ),
      },
      {
        id: `${variant.track}-wl-side`,
        text: variant.track === 'career-global' ? 'Build a Home Base Project' : 'Launch a Side Project',
        description: 'Channel ambition into something personal and risky',
        nextNodeId: getPostCareerNodeId(variant.track),
        effects: replayEffects(
          { money: -1, happiness: 2 },
          {
            delayedConsequences: ['second-act-seed'],
            tags: ['self-directed'],
          },
        ),
      },
      {
        id: `${variant.track}-wl-health`,
        text: 'Prioritize Health & Rest',
        description: 'Invest in the body and mind before the next chapter',
        nextNodeId: getPostCareerNodeId(variant.track),
        effects: replayEffects(
          { health: 2, happiness: 1, money: -1 },
          {
            healthArc: 'disciplined',
            delayedConsequences: ['recovery-dividend'],
          },
        ),
      },
      {
        id: `${variant.track}-wl-community`,
        text: variant.track === 'career-global' ? 'Deepen Local Roots' : 'Deepen Friendships',
        description: 'Build the social roots that sustain everything else',
        nextNodeId: getPostCareerNodeId(variant.track),
        effects: replayEffects(
          { happiness: 2 },
          {
            relationshipArc: 'chosen-family',
            delayedConsequences: ['community-safety-net'],
          },
        ),
      },
    ],
    imagePrompt: `pixel art early 30s crossroads scene in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'career',
  }));
}

/**
 * Returns the age at which the relationship decision occurs.
 * Must be deterministic (no Math.random) because it is called from two
 * separate generator functions; a random call here would produce different
 * values for the breather node vs. the relationship-decision node.
 * Must also be >= 33 so that all downstream outcome nodes (which are placed
 * at relAge + 1) stay ahead of the work-life-decision node at age 31.
 */
function getRelationshipAge(character: Character): number {
  const profile = getCityProfile(character.birthplace);
  const context = buildReplayContext(character, profile);
  if (context.relationshipBias === 'independent') return 35;
  if (context.familyPressure === 'high' || context.relationshipBias === 'committed') return 33;
  return 34;
}

function generatePostCareerBreathers(character: Character, profile: CityProfile): StoryNode[] {
  const p = pronouns(character.gender);
  const breatherAge = Math.max(32, getRelationshipAge(character) - 1);
  const variants: Array<{ id: string; title: string; description: string; category: StoryNode['category'] }> = [
    {
      id: getPostCareerNodeId('career-climb'),
      title: 'A Pause Between Meetings',
      description: `${character.name} has spent the last few years pushing hard. The results are visible, but something quieter has been accumulating: a readiness for a different kind of depth. ${profile.city} continues at full speed; ${p.subject} begins to wonder if that pace should be ${p.possessive} only speed.`,
      category: 'career',
    },
    {
      id: getPostCareerNodeId('career-stable'),
      title: 'A Life Taking Shape',
      description: `${character.name} has built something durable. Days are no longer chaotic by default, which makes it impossible to ignore a new question: what is all this steadiness supposed to make room for?`,
      category: 'random',
    },
    {
      id: getPostCareerNodeId('career-creative'),
      title: 'After the Show',
      description: `${character.name} has been deep in projects and processes. The creative work has been fulfilling, but human connection has sometimes been sacrificed for it. ${p.subject} starts to wonder what a version of this life looks like with someone else genuinely in it.`,
      category: 'relationship',
    },
    {
      id: getPostCareerNodeId('career-entrepreneur'),
      title: 'Between Funding Rounds',
      description: `Building at full intensity has narrowed the rest of life. Success is starting to look less like scale alone and more like whether there is anyone meaningful to come home to when the adrenaline fades.`,
      category: 'career',
    },
    {
      id: getPostCareerNodeId('career-global'),
      title: 'Landing Back Home',
      description: `After years of accumulating experiences, ${character.name} returns to ${profile.city} with a kind of restlessness that feels different from before. Not a need to leave — something more like a readiness to stay, properly.`,
      category: 'relationship',
    },
  ];

  return variants.map((variant) => ({
    id: variant.id,
    type: 'event',
    year: character.birthYear + breatherAge,
    age: breatherAge,
    title: variant.title,
    description: variant.description,
    nextNodeIds: ['relationship-decision'],
    imagePrompt: `pixel art reflective evening scene in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: variant.category,
  }));
}

/**
 * Injects a city-and-era-specific event if the character was born during a notable period.
 * Returns null if no matching era event exists.
 */
function getCityEraEvent(character: Character, profile: CityProfile): StoryNode | null {
  const city = profile.city;
  const adultYear = character.birthYear + 24;

  if (city === 'Tokyo' && adultYear >= 1984 && adultYear <= 1991) {
    return {
      id: 'era-event',
      type: 'event',
      year: adultYear,
      age: 24,
      title: 'The Bubble Years',
      description: `Tokyo in the late 1980s is unlike anywhere else on earth. Land prices double year over year; nightclubs distribute ten-thousand-yen notes as change. ${character.name} feels the irrational euphoria of a city that believes nothing can go wrong. The question is whether to ride it or hedge.`,
      imagePrompt: `pixel art 1980s neon bubble era Tokyo scene`,
      position: { x: 0, y: 0 },
      visited: false,
      category: 'career',
    };
  }

  if (city === 'Tokyo' && adultYear >= 1992 && adultYear <= 2002) {
    return {
      id: 'era-event',
      type: 'event',
      year: adultYear,
      age: 24,
      title: 'The Long Stagnation',
      description: `The boom has ended before ${character.name} had a chance to fully participate in it. Job offers that friends received two years ago no longer exist. Tokyo is still vast and bright, but a cautious hush has replaced the old confidence. Building something durable in a stagnant economy requires different instincts.`,
      imagePrompt: `pixel art quiet 1990s Tokyo recession scene`,
      position: { x: 0, y: 0 },
      visited: false,
      category: 'career',
    };
  }

  if (city === 'San Francisco' && adultYear >= 1997 && adultYear <= 2001) {
    return {
      id: 'era-event',
      type: 'event',
      year: adultYear,
      age: 24,
      title: 'The Dot-Com Gold Rush',
      description: `SoMa is full of companies with no revenue and hundred-million-dollar valuations. ${character.name} receives three job offers in a week. Stock options feel like lottery tickets that everyone insists are certain winners. The city smells of ambition and fresh paint. Nobody mentions what happens when the music stops.`,
      imagePrompt: `pixel art 1999 dot-com startup frenzy scene in San Francisco`,
      position: { x: 0, y: 0 },
      visited: false,
      category: 'career',
    };
  }

  if (city === 'San Francisco' && adultYear >= 2010 && adultYear <= 2019) {
    return {
      id: 'era-event',
      type: 'event',
      year: adultYear,
      age: 24,
      title: 'The Platform Era',
      description: `Apps that didn't exist five years ago now employ thousands. ${character.name} is exactly the right age to enter an industry being rebuilt from scratch. The opportunity is undeniable — so is the cost to the city around it: rising rents, displaced neighbors, protests outside tech shuttle stops.`,
      imagePrompt: `pixel art 2010s tech boom San Francisco scene`,
      position: { x: 0, y: 0 },
      visited: false,
      category: 'career',
    };
  }

  if (city === 'Shanghai' && adultYear >= 1992 && adultYear <= 2005) {
    return {
      id: 'era-event',
      type: 'event',
      year: adultYear,
      age: 24,
      title: 'Pudong Rising',
      description: `Pudong was farmland fifteen years ago. Now it hosts the Oriental Pearl Tower, a new stock exchange, and the fastest-rising property market in Asia. ${character.name} arrives in the workforce at the precise moment when connections, nerve, and timing determine everything.`,
      imagePrompt: `pixel art 1990s Pudong construction boom Shanghai scene`,
      position: { x: 0, y: 0 },
      visited: false,
      category: 'career',
    };
  }

  if (city === 'Beijing' && adultYear >= 2001 && adultYear <= 2010) {
    return {
      id: 'era-event',
      type: 'event',
      year: adultYear,
      age: 24,
      title: 'The Olympic Decade',
      description: `Beijing is being rebuilt for 2008, and the whole city feels like a construction site and a promise simultaneously. Hutongs vanish overnight; ring roads multiply. ${character.name} is growing up inside a city that believes, genuinely and loudly, that it is becoming the center of the world.`,
      imagePrompt: `pixel art 2000s Olympic era Beijing construction scene`,
      position: { x: 0, y: 0 },
      visited: false,
      category: 'career',
    };
  }

  if (city === 'New York' && adultYear >= 2001 && adultYear <= 2006) {
    return {
      id: 'era-event',
      type: 'event',
      year: adultYear,
      age: 24,
      title: 'The City After',
      description: `September 2001 reshaped New York in ways that will take decades to fully measure. ${character.name} is building a life in a city that is simultaneously grieving, defiant, and reshaping its own story. The skyline is wrong. The streets feel different. And yet the city refuses to be only its wound.`,
      imagePrompt: `pixel art post-9/11 resilient New York city scene`,
      position: { x: 0, y: 0 },
      visited: false,
      category: 'random',
    };
  }

  if (city === 'Toronto' && adultYear >= 2003 && adultYear <= 2005) {
    return {
      id: 'era-event',
      type: 'event',
      year: adultYear,
      age: 24,
      title: 'The SARS Summer',
      description: `Toronto's SARS outbreak of 2003 costs the city more than a billion dollars in tourism and trade — and costs ${character.name}'s entry-level world a raft of cancelled events, nervous employers, and quiet streets. It passes. But something about fragility has been made visible.`,
      imagePrompt: `pixel art 2003 SARS empty Toronto streets scene`,
      position: { x: 0, y: 0 },
      visited: false,
      category: 'health',
    };
  }

  if (city === 'Singapore' && adultYear >= 1997 && adultYear <= 2001) {
    return {
      id: 'era-event',
      type: 'event',
      year: adultYear,
      age: 24,
      title: 'The Asian Crisis',
      description: `The 1997 Asian financial crisis tears through neighboring economies. Singapore weathers it better than most, but ${character.name} watches colleagues across the region lose jobs overnight. The crisis teaches a generation that competence is necessary but not sufficient — institutional stability matters enormously.`,
      imagePrompt: `pixel art 1997 Asian financial crisis Singapore scene`,
      position: { x: 0, y: 0 },
      visited: false,
      category: 'career',
    };
  }

  return null;
}


function generateRelationshipNodes(character: Character, profile: CityProfile): StoryNode[] {
  const nodes: StoryNode[] = [];
  const relAge = getRelationshipAge(character);
  const context = buildReplayContext(character, profile);

  // All downstream ages are anchored to relAge so the timeline never goes
  // backward regardless of which relationship path the character is on.
  const outcomeAge   = relAge + 1;  // married-young / single-focused / cohabitation
  const familyAge    = relAge + 3;
  const familyPath1  = relAge + 5;
  const familyPath2  = relAge + 7;

  nodes.push({
    id: 'relationship-decision',
    type: 'decision',
    year: character.birthYear + relAge,
    age: relAge,
    title: 'Love and Commitment',
    description: `${character.name} meets someone who feels like home, yet the context in ${profile.city} makes commitment feel complicated. ${profile.socialNuance} ${context.relationshipBias === 'independent' ? 'Freedom and connection now pull against each other directly.' : 'Career plans and emotional risk now collide in the same conversation.'}`,
    choices: [
      {
        id: 'marry-young',
        text: 'Commit to the Relationship',
        description: 'Choose commitment and shared long-term planning',
        nextNodeId: 'married-young',
        effects: replayEffects(
          { happiness: 2, money: -1 },
          {
            relationshipArc: 'early-family',
            delayedConsequences: ['shared-obligations'],
            tags: ['committed-partnership'],
          },
        ),
      },
      {
        id: 'stay-single',
        text: 'Focus on Career',
        description: 'Protect independence and prioritize momentum',
        nextNodeId: 'single-focused',
        effects: replayEffects(
          { money: 1, happiness: -1 },
          {
            relationshipArc: 'independent',
            delayedConsequences: ['late-intimacy-question'],
            tags: ['self-authored-life'],
          },
        ),
      },
      {
        id: 'live-together',
        text: 'Live Together',
        description: 'Commit deeply without formal marriage yet',
        nextNodeId: 'cohabitation',
        effects: replayEffects(
          { happiness: 1 },
          {
            relationshipArc: 'late-commitment',
            delayedConsequences: ['shared-home'],
            tags: ['partnership-in-progress'],
          },
        ),
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
    year: character.birthYear + outcomeAge,
    age: outcomeAge,
    title: 'Early Commitment',
    description: `${character.name} builds a shared household. Daily routines become richer, but so do responsibilities and compromises.`,
    nextNodeIds: ['family-decision'],
    imagePrompt: `pixel art cozy apartment evening in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'relationship',
  });

  nodes.push({
    id: 'single-focused',
    type: 'event',
    year: character.birthYear + outcomeAge,
    age: outcomeAge,
    title: 'Independent Years',
    description: `${character.name} channels energy into personal goals, career growth, and chosen communities. Freedom is real, but so is occasional isolation.`,
    nextNodeIds: ['family-decision-independent'],
    imagePrompt: `pixel art solo night walk in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'career',
  });

  nodes.push({
    id: 'cohabitation',
    type: 'event',
    year: character.birthYear + outcomeAge,
    age: outcomeAge,
    title: 'Shared Life',
    description: `${character.name} and their partner grow together through ordinary days, financial planning, and difficult conversations that slowly build trust.`,
    nextNodeIds: ['family-decision-shared'],
    imagePrompt: `pixel art domestic life montage in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'relationship',
  });

  nodes.push({
    id: 'family-decision',
    type: 'decision',
    year: character.birthYear + familyAge,
    age: familyAge,
    title: 'Family Planning',
    description: `Long-term values become concrete choices. Family, legacy, freedom, and stability all have different costs.`,
    choices: [
      {
        id: 'have-children',
        text: 'Have Children',
        description: 'Choose a demanding but deeply relational path',
        nextNodeId: 'parent-path',
        effects: replayEffects(
          { happiness: 2, money: -2, health: -1 },
          {
            familyArc: 'provider',
            delayedConsequences: ['caregiving-load'],
            tags: ['parent-track'],
          },
        ),
        requires: { health: 2 },
      },
      {
        id: 'no-children',
        text: 'Remain Childless',
        description: 'Invest in partnership, career, and personal projects',
        nextNodeId: 'childless-path',
        effects: replayEffects(
          { money: 1, happiness: 0 },
          {
            familyArc: 'childfree',
            delayedConsequences: ['self-authored-midlife'],
            tags: ['childfree'],
          },
        ),
      },
      {
        id: 'adopt',
        text: 'Adopt',
        description: 'Build family through intention and care',
        nextNodeId: 'adoption-path',
        effects: replayEffects(
          { happiness: 2, money: -1 },
          {
            familyArc: 'caregiver',
            delayedConsequences: ['bureaucratic-delay'],
            tags: ['intentional-family'],
          },
        ),
        requires: { money: 1 },
      },
    ],
    imagePrompt: `pixel art family planning decision scene in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'relationship',
  });

  nodes.push({
    id: 'family-decision-independent',
    type: 'decision',
    year: character.birthYear + familyAge,
    age: familyAge,
    title: 'What Counts as Family?',
    description: `Without a conventional template forcing the issue, ${character.name} has to define family more intentionally. In ${profile.city}, that means deciding whether independence remains the point, or whether a different kind of belonging should take shape.`,
    choices: [
      {
        id: 'chosen-family',
        text: 'Build a Chosen Family',
        description: 'Invest in friendships, community, and mutual care',
        nextNodeId: 'chosen-family-path',
        effects: replayEffects(
          { happiness: 2 },
          {
            familyArc: 'multigenerational',
            delayedConsequences: ['community-safety-net'],
            tags: ['chosen-family'],
          },
        ),
      },
      {
        id: 'late-parenthood',
        text: 'Explore Late Parenthood',
        description: 'Re-open the question of raising a child on different terms',
        nextNodeId: 'late-parenthood-path',
        effects: replayEffects(
          { happiness: 1, money: -1 },
          {
            familyArc: 'caregiver',
            delayedConsequences: ['late-parenthood-pressure'],
            tags: ['late-family-formation'],
          },
        ),
      },
      {
        id: 'remain-independent',
        text: 'Remain Fully Independent',
        description: 'Protect freedom and build meaning through work, travel, and craft',
        nextNodeId: 'childless-path',
        effects: replayEffects(
          { money: 1, happiness: 1 },
          {
            familyArc: 'childfree',
            delayedConsequences: ['self-authored-midlife'],
            tags: ['independent-rhythm'],
          },
        ),
      },
    ],
    imagePrompt: `pixel art chosen family decision scene in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'relationship',
  });

  nodes.push({
    id: 'family-decision-shared',
    type: 'decision',
    year: character.birthYear + familyAge,
    age: familyAge,
    title: 'Build the Shared Life',
    description: `The relationship is real now, but the shape of it is still negotiable. ${character.name} and their partner have to decide whether the next step means children, deeper commitment, or a deliberately unconventional household.`,
    choices: [
      {
        id: 'formalize-commitment',
        text: 'Formalize the Commitment',
        description: 'Anchor the partnership and build a stable home',
        nextNodeId: 'shared-home-path',
        effects: replayEffects(
          { happiness: 2, money: -1 },
          {
            familyArc: 'provider',
            delayedConsequences: ['shared-obligations'],
            tags: ['shared-home'],
          },
        ),
      },
      {
        id: 'stay-childfree-together',
        text: 'Stay Childfree Together',
        description: 'Protect the relationship and keep life flexible',
        nextNodeId: 'childless-path',
        effects: replayEffects(
          { happiness: 1, money: 1 },
          {
            familyArc: 'childfree',
            delayedConsequences: ['self-authored-midlife'],
            tags: ['partnership-without-children'],
          },
        ),
      },
      {
        id: 'adopt-together',
        text: 'Adopt Together',
        description: 'Choose family through intention, structure, and care',
        nextNodeId: 'adoption-path',
        effects: replayEffects(
          { happiness: 2, money: -1 },
          {
            familyArc: 'caregiver',
            delayedConsequences: ['bureaucratic-delay'],
            tags: ['intentional-family'],
          },
        ),
        requires: { money: 1 },
      },
    ],
    imagePrompt: `pixel art domestic future planning in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'relationship',
  });

  nodes.push({
    id: 'parent-path',
    type: 'event',
    year: character.birthYear + familyPath1,
    age: familyPath1,
    title: 'The Early Years',
    description: `${character.name} learns to live inside constant tradeoffs: sleep for care, ambition for presence, certainty for love. The household grows louder and more meaningful.`,
    nextNodeIds: ['parent-event'],
    imagePrompt: `pixel art parent and toddler in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'relationship',
  });

  nodes.push({
    id: 'parent-event',
    type: 'event',
    year: character.birthYear + familyPath2,
    age: familyPath2,
    title: 'School Decisions',
    description: `The kids are older now. Navigating ${profile.city}'s education system becomes a second job. Friendships shift toward other parents out of sheer logistical necessity.`,
    nextNodeIds: ['midlife-crisis'],
    imagePrompt: `pixel art parent dropping kids at school in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'education',
  });

  nodes.push({
    id: 'childless-path',
    type: 'event',
    year: character.birthYear + familyPath1,
    age: familyPath1,
    title: 'Focusing Inward',
    description: `${character.name} invests in friendships, travel, and mastery. Life remains flexible, and meaning is built through projects, community, and chosen rituals.`,
    nextNodeIds: ['childless-event'],
    imagePrompt: `pixel art urban evening with friends in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'random',
  });

  nodes.push({
    id: 'childless-event',
    type: 'event',
    year: character.birthYear + familyPath2,
    age: familyPath2,
    title: 'The Great Consolidation',
    description: `Without the forced structure of school routines, ${character.name} realizes the necessity of designing a life intentionally. A new, demanding hobby or community role takes the center of gravity.`,
    nextNodeIds: ['midlife-crisis-independent'],
    imagePrompt: `pixel art deep focus on a personal project in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'career',
  });

  nodes.push({
    id: 'adoption-path',
    type: 'event',
    year: character.birthYear + familyPath1,
    age: familyPath1,
    title: 'The Long Wait',
    description: `The adoption process in ${profile.city} is bureaucratic, expensive, and emotionally exhausting. Entire years feel defined by paperwork and anticipation.`,
    nextNodeIds: ['adoption-event'],
    imagePrompt: `pixel art anxious waiting in an office in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'relationship',
  });

  nodes.push({
    id: 'adoption-event',
    type: 'event',
    year: character.birthYear + familyPath2,
    age: familyPath2,
    title: 'A Family Found',
    description: `${character.name} finally builds family. The transition is profound. Learning patience, advocacy, and unconditional care in these early years reshapes identity permanently.`,
    nextNodeIds: ['midlife-crisis-shared'],
    imagePrompt: `pixel art adoptive family home scene in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'relationship',
  });

  nodes.push({
    id: 'chosen-family-path',
    type: 'event',
    year: character.birthYear + familyPath1,
    age: familyPath1,
    title: 'Chosen Family',
    description: `${character.name} builds a durable circle of friends, collaborators, and neighbors who function like kin. Care flows sideways instead of downward, but it is no less real.`,
    nextNodeIds: ['chosen-family-event'],
    imagePrompt: `pixel art dinner with close friends in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'relationship',
  });

  nodes.push({
    id: 'chosen-family-event',
    type: 'event',
    year: character.birthYear + familyPath2,
    age: familyPath2,
    title: 'Community Gravity',
    description: `${character.name} becomes the person who organizes, hosts, and holds people together. Meaning arrives through consistency, reciprocity, and showing up.`,
    nextNodeIds: ['midlife-crisis-independent'],
    imagePrompt: `pixel art community gathering scene in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'relationship',
  });

  nodes.push({
    id: 'late-parenthood-path',
    type: 'event',
    year: character.birthYear + familyPath1,
    age: familyPath1,
    title: 'Reopening the Door',
    description: `${character.name} discovers that the family question did not disappear; it only changed form. The logistical reality is more complex now, but so is the emotional clarity.`,
    nextNodeIds: ['late-parenthood-event'],
    imagePrompt: `pixel art reflective late parenthood scene in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'relationship',
  });

  nodes.push({
    id: 'late-parenthood-event',
    type: 'event',
    year: character.birthYear + familyPath2,
    age: familyPath2,
    title: 'A Deliberate Household',
    description: `Parenthood arrives later than expected, but with fewer illusions and more patience. The pace is demanding, yet the commitment feels unusually conscious.`,
    nextNodeIds: ['midlife-crisis'],
    imagePrompt: `pixel art older parent household scene in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'relationship',
  });

  nodes.push({
    id: 'shared-home-path',
    type: 'event',
    year: character.birthYear + familyPath1,
    age: familyPath1,
    title: 'A Shared Home',
    description: `${character.name} and their partner commit more deeply to the life they are building. Daily logistics become smoother, but the shared future now has weight and consequence.`,
    nextNodeIds: ['shared-home-event'],
    imagePrompt: `pixel art shared home renovation or move-in scene in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'relationship',
  });

  nodes.push({
    id: 'shared-home-event',
    type: 'event',
    year: character.birthYear + familyPath2,
    age: familyPath2,
    title: 'Partnership as Infrastructure',
    description: `${character.name} realizes the relationship is no longer a romantic subplot. It has become infrastructure: emotional, financial, and practical.`,
    nextNodeIds: ['midlife-crisis-shared'],
    imagePrompt: `pixel art quiet domestic evening in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'relationship',
  });

  return nodes;
}

function createHealthReckoningChoices(nextNodeId: string): Choice[] {
  return [
    {
      id: 'hr-commit',
      text: 'Commit to Fitness',
      description: 'Overhaul diet, sleep, and movement as a daily practice',
      nextNodeId,
      effects: { health: 2, money: -1 },
    },
    {
      id: 'hr-therapy',
      text: 'Invest in Mental Health',
      description: 'Finally address the emotional weight carried for decades',
      nextNodeId,
      effects: { happiness: 2, money: -1 },
    },
    {
      id: 'hr-accept',
      text: 'Make Peace With Aging',
      description: 'Find meaning in impermanence rather than fighting it',
      nextNodeId,
      effects: { happiness: 1, health: 1 },
    },
    {
      id: 'hr-push',
      text: 'Push Through Regardless',
      description: 'Ignore the signals and keep grinding at full speed',
      nextNodeId,
      effects: { money: 1, health: -2 },
    },
  ];
}

function generateMidlifeNodes(character: Character, profile: CityProfile, ft: FlavorTracker): StoryNode[] {
  const nodes: StoryNode[] = [];
  const context = buildReplayContext(character, profile);

  const eraAt40 = ft.flavor(profile.city, character.birthYear + 40);
  nodes.push({
    id: 'midlife-crisis',
    type: 'event',
    year: character.birthYear + 40,
    age: 40,
    title: 'The Big Four-Oh',
    description: [
      `At 40, ${character.name} takes stock of what was gained and what was deferred. ${profile.celebrationNuance} Old dreams are reevaluated against lived reality.`,
      eraAt40,
    ].filter(Boolean).join(' '),
    imagePrompt: `pixel art midlife reflection scene in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'random',
    nextNodeIds: ['midlife-career'],
  });

  nodes.push({
    id: 'midlife-crisis-independent',
    type: 'event',
    year: character.birthYear + 40,
    age: 40,
    title: 'The Self-Authored Middle',
    description: [
      `${character.name} reaches 40 and realizes freedom still has to be designed, not merely protected. The life built outside convention now demands its own rituals, responsibilities, and sources of meaning.`,
      eraAt40,
    ].filter(Boolean).join(' '),
    imagePrompt: `pixel art midlife urban solitude scene in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'random',
    nextNodeIds: ['midlife-career'],
  });

  nodes.push({
    id: 'midlife-crisis-shared',
    type: 'event',
    year: character.birthYear + 40,
    age: 40,
    title: 'Shared Weight',
    description: [
      `${character.name} reaches 40 carrying not just personal ambition, but the accumulated weight of partnership, care, and mutual dependence. The question now is how to keep tenderness alive inside structure.`,
      eraAt40,
    ].filter(Boolean).join(' '),
    imagePrompt: `pixel art midlife domestic reflection scene in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'relationship',
    nextNodeIds: ['midlife-career'],
  });

  nodes.push({
    id: 'midlife-career',
    type: 'decision',
    year: character.birthYear + 45,
    age: 45,
    title: 'Peak or Pivot?',
    description: `${character.name} reaches a professional plateau in ${profile.city}. ${context.chapterPools.includes('global-migrant') ? 'The option of leaving again is still real.' : 'The shape of the next decade will be chosen more deliberately.'} Continue maximizing status, pivot to new meaning, reclaim time, go international, or trade security for independence.`,
    choices: [
      {
        id: 'career-continue',
        text: 'Stay the Course',
        description: 'Double down on existing momentum and seniority',
        nextNodeId: 'midlife-track-continue',
        effects: replayEffects(
          { money: 1 },
          {
            delayedConsequences: ['late-career-inertia'],
          },
        ),
      },
      {
        id: 'career-change',
        text: 'Reinvent Completely',
        description: 'Reset identity — new field, new colleagues, new stakes',
        nextNodeId: 'midlife-track-reinvent',
        effects: replayEffects(
          { money: -1, happiness: 2 },
          {
            delayedConsequences: ['reinvention-dividend'],
            tags: ['late-bloomer'],
          },
        ),
      },
      {
        id: 'career-slow',
        text: 'Deliberately Slow Down',
        description: 'Trade income and status for time and health',
        nextNodeId: 'midlife-track-slow',
        effects: replayEffects(
          { money: -1, happiness: 2, health: 1 },
          {
            healthArc: 'recovery',
            delayedConsequences: ['slower-richer-life'],
          },
        ),
      },
      {
        id: 'career-global',
        text: 'Go International',
        description: `Leave ${profile.city} for an overseas post or partnership`,
        nextNodeId: 'midlife-track-global',
        effects: replayEffects(
          { money: 1, happiness: 1, health: -1 },
          {
            mobilityArc: 'global-opportunist',
            delayedConsequences: ['distance-cost'],
          },
        ),
      },
      {
        id: 'career-freelance',
        text: 'Go Independent',
        description: 'Leave employment for freelance or consulting autonomy',
        nextNodeId: 'midlife-track-freelance',
        effects: replayEffects(
          { money: 0, happiness: 2, health: 1 },
          {
            delayedConsequences: ['portfolio-life'],
            tags: ['independent-operator'],
          },
        ),
      },
    ],
    imagePrompt: `pixel art midlife career decision in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'career',
  });

  const healthBridgeId = 'random-midlife';
  const midlifeTracks: Array<{
    id: string;
    age: number;
    title: string;
    description: string;
    category: StoryNode['category'];
    nextNodeId: string;
    healthTitle: string;
    healthDescription: string;
  }> = [
    {
      id: 'midlife-track-continue',
      age: 47,
      title: 'The Compounding Years',
      description: `${character.name} chooses continuity over novelty. Seniority deepens, obligations compound, and the cost of being the reliable person grows less visible but more total.`,
      category: 'career',
      nextNodeId: 'health-reckoning-driven',
      healthTitle: 'The Cost of Staying Sharp',
      healthDescription: `The body starts negotiating with the life ${character.name} chose to keep. Achievement is still possible, but it no longer feels free.`,
    },
    {
      id: 'midlife-track-reinvent',
      age: 47,
      title: 'A New Apprenticeship',
      description: `${character.name} becomes a beginner again on purpose. The ego bruise is real, but so is the electric feeling of building a different future before it feels too late.`,
      category: 'career',
      nextNodeId: 'health-reckoning-reinvented',
      healthTitle: 'Holding the Nerve',
      healthDescription: `Reinvention exposes different forms of strain: uncertainty, social comparison, and the need to keep body and mind from fragmenting under the pressure of change.`,
    },
    {
      id: 'midlife-track-slow',
      age: 47,
      title: 'Recovery as Practice',
      description: `${character.name} stops treating recovery as a reward and starts treating it as infrastructure. The new pace is awkward at first, then clarifying.`,
      category: 'health',
      nextNodeId: 'health-reckoning-restorative',
      healthTitle: 'Repair and Maintenance',
      healthDescription: `The quieter life gives ${character.name} enough stillness to notice what hurts, what heals slowly, and what routines actually restore a future.`,
    },
    {
      id: 'midlife-track-global',
      age: 47,
      title: 'A Larger Radius',
      description: `${character.name} expands life across airports, projects, and cultures. The horizon widens, but fatigue and distance become structural features of ambition.`,
      category: 'career',
      nextNodeId: 'health-reckoning-global',
      healthTitle: 'Jet Lag and Distance',
      healthDescription: `At 50, the bill for mobility arrives in subtler currencies: sleep debt, loneliness, and a body that no longer resets as quickly as before.`,
    },
    {
      id: 'midlife-track-freelance',
      age: 47,
      title: 'Running the Whole Portfolio',
      description: `${character.name} trades hierarchy for a portfolio life. The freedom is real, but so is the constant need to self-direct every decision, invoice, and boundary.`,
      category: 'career',
      nextNodeId: 'health-reckoning-independent',
      healthTitle: 'No One Else Sets the Limits',
      healthDescription: `The independent life leaves more room for self-respect and more room for self-neglect. At 50, ${character.name} has to decide which tendency will win.`,
    },
  ];

  midlifeTracks.forEach((track) => {
    nodes.push({
      id: track.id,
      type: 'event',
      year: character.birthYear + track.age,
      age: track.age,
      title: track.title,
      description: track.description,
      nextNodeIds: [track.nextNodeId],
      imagePrompt: `pixel art midlife transition scene in ${profile.city}`,
      position: { x: 0, y: 0 },
      visited: false,
      category: track.category,
    });

    nodes.push({
      id: track.nextNodeId,
      type: 'decision',
      year: character.birthYear + 50,
      age: 50,
      title: track.healthTitle,
      description: track.healthDescription,
      choices: createHealthReckoningChoices(healthBridgeId),
      imagePrompt: `pixel art midlife health reflection in ${profile.city}`,
      position: { x: 0, y: 0 },
      visited: false,
      category: 'health',
    });
  });

  const randomMidlife = {
    ...generateRandomEvent('midlife', character, profile),
    nextNodeIds: ['late-40s-fork'],
  };
  nodes.push(randomMidlife);

  nodes.push({
    id: 'late-40s-fork',
    type: 'decision',
    year: character.birthYear + 53,
    age: 53,
    title: 'The Second Half',
    description: `Past 50, the math changes. There are probably fewer years ahead than behind. The body has delivered its invoice. ${character.name} must decide what the remaining fuel should be spent on.`,
    choices: [
      {
        id: 'fork-give-back',
        text: 'Give Back',
        description: 'Shift focus to mentoring, teaching, or community',
        nextNodeId: 'late-career-alt',
        effects: { happiness: 2, money: -1 },
      },
      {
        id: 'fork-ambition',
        text: 'One Last Ambition',
        description: 'Take a final massive swing at a career goal',
        nextNodeId: 'late-career-1',
        effects: { money: 2, health: -1, happiness: 1 },
      },
      {
        id: 'fork-slow',
        text: 'The Slow Life',
        description: 'Downshift to prioritize peace and nature',
        nextNodeId: 'slow-life-path',
        effects: { health: 2, happiness: 1, money: -2 },
      }
    ],
    imagePrompt: `pixel art late 40s crossroads scene in ${profile.city}`,
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
    title: 'Peak Earning Years',
    description: `${character.name} hits maximum capacity and influence. The work is demanding but natural. ${profile.city} respects seniority, though the pace requires deliberate energy management.`,
    nextNodeIds: ['second-act-ambition'],
    imagePrompt: `pixel art senior professional scene in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'career',
  });

  nodes.push({
    id: 'late-career-alt',
    type: 'event',
    year: character.birthYear + 55,
    age: 55,
    title: 'The Mentor',
    description: `Instead of chasing the next title, ${character.name} becomes the person others come to for advice. The satisfaction shifts from personal achievement to watching younger people succeed.`,
    nextNodeIds: ['second-act-mentor'],
    imagePrompt: `pixel art mentoring a younger colleague in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'career',
  });

  nodes.push({
    id: 'slow-life-path',
    type: 'event',
    year: character.birthYear + 55,
    age: 55,
    title: 'Quiet Adjustments',
    description: `${character.name} deliberately scales back. The calendar clears. Time becomes abundant for the first time in decades. The silence in ${profile.city} is jarring at first, then deeply restorative.`,
    nextNodeIds: ['second-act-rest'],
    imagePrompt: `pixel art quiet garden or porch scene in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'random',
  });

  nodes.push({
    id: 'second-act-ambition',
    type: 'decision',
    year: character.birthYear + 59,
    age: 59,
    title: 'Legacy or Velocity',
    description: `At 59, ${character.name} still has momentum. The real decision is whether to convert it into legacy, wealth, or experiences that work never had room for.`,
    choices: [
      {
        id: 'sa-create',
        text: 'Build the Signature Project',
        description: 'Channel hard-earned leverage into one lasting piece of work',
        nextNodeId: 'retirement',
        effects: { happiness: 2, money: -1 },
      },
      {
        id: 'sa-wealth',
        text: 'Make Serious Money',
        description: 'Push one final cycle while expertise is still scarce',
        nextNodeId: 'retirement',
        effects: { money: 2, health: -1 },
      },
      {
        id: 'sa-travel',
        text: 'Cash Out and Travel',
        description: 'Spend accumulated resources on range, not status',
        nextNodeId: 'retirement',
        effects: { happiness: 2, money: -2 },
      },
    ],
    imagePrompt: `pixel art late 50s reflection scene in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'career',
  });

  nodes.push({
    id: 'second-act-mentor',
    type: 'decision',
    year: character.birthYear + 59,
    age: 59,
    title: 'Stewardship',
    description: `At 59, ${character.name} realizes influence can now be measured by what keeps going after retirement. The second act becomes a question of stewardship.`,
    choices: [
      {
        id: 'sa-mentor',
        text: 'Become a Full-Time Mentor',
        description: 'Pour knowledge into younger lives and careers',
        nextNodeId: 'retirement',
        effects: { happiness: 2 },
      },
      {
        id: 'sa-create-community',
        text: 'Build a Community Institution',
        description: 'Create something local and durable that outlives a job title',
        nextNodeId: 'retirement',
        effects: { happiness: 2, money: -1 },
      },
      {
        id: 'sa-travel-gently',
        text: 'Travel While Staying Useful',
        description: 'Combine curiosity with slower, more intentional contribution',
        nextNodeId: 'retirement',
        effects: { happiness: 1, money: -1 },
      },
    ],
    imagePrompt: `pixel art mentoring and community scene in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'relationship',
  });

  nodes.push({
    id: 'second-act-rest',
    type: 'decision',
    year: character.birthYear + 59,
    age: 59,
    title: 'A Smaller, Better Life',
    description: `At 59, ${character.name} no longer mistakes fullness for meaning. The second act is about choosing a scale of life the body, mind, and spirit can actually enjoy.`,
    choices: [
      {
        id: 'sa-garden',
        text: 'Deepen the Quiet Life',
        description: 'Invest in home, ritual, and a slower daily radius',
        nextNodeId: 'retirement',
        effects: { health: 1, happiness: 2 },
      },
      {
        id: 'sa-create-small',
        text: 'Make Small Beautiful Things',
        description: 'Create without needing recognition or scale',
        nextNodeId: 'retirement',
        effects: { happiness: 2, money: -1 },
      },
      {
        id: 'sa-wander',
        text: 'Wander Slowly',
        description: 'Travel at a human pace before the body narrows further',
        nextNodeId: 'retirement',
        effects: { happiness: 2, money: -2 },
      },
    ],
    imagePrompt: `pixel art late 50s quiet-life scene in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'random',
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
  const centerX = 400;
  const levelHeight = 95;
  const maxSpread = 75; // px per slot from center — keeps everything within 550px total width

  // Group consecutive nodes sharing the same age into a single row.
  // Using consecutive grouping (not a global age map) preserves narrative
  // array order, which must match the connection graph.
  const groups: StoryNode[][] = [];
  for (const node of nodes) {
    const last = groups[groups.length - 1];
    if (last && last[0].age === node.age) {
      last.push(node);
    } else {
      groups.push([node]);
    }
  }

  let currentY = 50;
  for (const group of groups) {
    const count = group.length;
    group.forEach((node, index) => {
      const offset = count > 1 ? (index - (count - 1) / 2) * maxSpread : 0;
      positionedNodes.push({ ...node, position: { x: centerX + offset, y: currentY } });
    });
    currentY += levelHeight;
  }

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

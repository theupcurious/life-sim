import type { Character, StoryNode, Choice } from '@/types/game';
import {
  SUPPORTED_CITIES,
  getCityProfile,
  type CityProfile,
  type SupportedCountry,
} from '@/data/cityProfiles';
import { getHistoricalFlavor, getPopCultureHook } from '@/data/historicalFlavors';

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

// Generate a unique life story based on character inputs
export function generateLifeStory(character: Character): StoryNode[] {
  const nodes: StoryNode[] = [];
  const profile = getCityProfile(character.birthplace);
  const lifeExpectancy = 75 + Math.floor(Math.random() * 20); // 75-95 years
  // One tracker per story so the same era sentence never repeats across nodes
  const ft = makeFlavorTracker();

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

  nodes.push(...generateChildhoodNodes(character, profile, ft));
  nodes.push(generateRandomEvent('adolescent', character, profile));
  nodes.push(...generateTeenageNodes(character, profile, ft));
  // Education decision at 18 precedes the young-adult random event at 20
  nodes.push(generateEducationDecision(character, profile, ft));
  nodes.push(generateRandomEvent('young-adult', character, profile));
  nodes.push(...generateCareerPaths(character, profile, ft));
  nodes.push(generateWorkLifeDecision(character, profile));

  // Optional city+era injected event — changes based on where and when you were born
  const eraEvent = getCityEraEvent(character, profile);
  if (eraEvent) nodes.push(eraEvent);

  nodes.push(generatePostCareerBreather(character, profile));
  nodes.push(...generateRelationshipNodes(character, profile));
  nodes.push(...generateMidlifeNodes(character, profile, ft));
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
        effects: { happiness: -1 },
      },
      {
        id: 'teen-social',
        text: 'Build Friendships',
        description: 'Prioritize social life and emotional support',
        nextNodeId: 'teen-social-path',
        effects: { happiness: 1 },
      },
      {
        id: 'teen-rebel',
        text: 'Explore Rebellion',
        description: 'Test boundaries and challenge expectations',
        nextNodeId: 'teen-rebel-path',
        effects: { health: -1, happiness: 1 },
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
        effects: { money: -1, happiness: 1, occupation: 'Student' },
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
        effects: { money: -2, happiness: 2, occupation: 'Traveller' },
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
  const careerChoices = generateCareerChoices(character, profile);

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
    nextNodeIds: ['career-decision'],
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
    nextNodeIds: ['career-decision'],
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
    nextNodeIds: ['career-decision'],
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

  const eraAt25 = ft.flavor(profile.city, character.birthYear + 25);
  nodes.push({
    id: 'career-decision',
    type: 'decision',
    year: character.birthYear + 25,
    age: 25,
    title: 'Career Crossroads',
    description: [
      `${careerOpener} momentum and self-doubt arrive together. ${profile.workNuance} The path chosen now will define lifestyle, identity, and tradeoffs for decades.`,
      eraAt25,
    ].filter(Boolean).join(' '),
    choices: careerChoices,
    imagePrompt: `pixel art major career decision scene in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'career',
  });

  // Post-career decision divergence nodes
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
    nextNodeIds: ['work-life-decision'],
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
    nextNodeIds: ['work-life-decision'],
    imagePrompt: `pixel art calm professional life in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'career',
  });

  if (careerChoices.some((choice) => choice.id === 'career-creative')) {
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
      nextNodeIds: ['work-life-decision'],
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
      nextNodeIds: ['work-life-decision'],
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

function generateWorkLifeDecision(character: Character, profile: CityProfile): StoryNode {
  const pr = pronouns(character.gender);
  return {
    id: 'work-life-decision',
    type: 'decision',
    year: character.birthYear + 31,
    age: 31,
    title: 'Work or Life?',
    description: `At 31, ${character.name} feels the tension that defines this decade in ${profile.city}: career momentum pulling one way, everything else pulling the other. ${pr.possessive.charAt(0).toUpperCase() + pr.possessive.slice(1)} choices in the next few years will shape the kind of person ${pr.subject} becomes.`,
    choices: [
      {
        id: 'wl-push',
        text: 'Push Harder at Work',
        description: 'Bet on professional momentum while energy is high',
        nextNodeId: 'post-career-chapter',
        effects: { money: 2, happiness: -1, health: -1 },
      },
      {
        id: 'wl-side',
        text: 'Launch a Side Project',
        description: 'Channel ambition into something personal and risky',
        nextNodeId: 'post-career-chapter',
        effects: { money: -1, happiness: 2 },
      },
      {
        id: 'wl-health',
        text: 'Prioritize Health & Rest',
        description: 'Invest in the body and mind before the next chapter',
        nextNodeId: 'post-career-chapter',
        effects: { health: 2, happiness: 1, money: -1 },
      },
      {
        id: 'wl-community',
        text: 'Deepen Friendships',
        description: 'Build the social roots that sustain everything else',
        nextNodeId: 'post-career-chapter',
        effects: { happiness: 2 },
      },
    ],
    imagePrompt: `pixel art early 30s crossroads scene in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'career',
  };
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
  if (character.personality.includes('adventurous') || character.childhoodDream === 'freedom') return 33;
  if (character.personality.includes('empathetic') || character.childhoodDream === 'love') return 32;
  return 32;
}

function generatePostCareerBreather(character: Character, profile: CityProfile): StoryNode {
  const p = pronouns(character.gender);
  const personality = character.personality[0] || 'curious';
  // Breather sits one year before the relationship decision, but never before
  // the work-life-decision node at age 31.
  const breatherAge = Math.max(32, getRelationshipAge(character) - 1);

  const descriptions: Record<string, string> = {
    ambitious: `${character.name} has spent the last few years pushing hard. The results are visible, but something quieter has been accumulating: a readiness for a different kind of depth. ${profile.city} continues at full speed; ${p.subject} begins to wonder if that pace should be ${p.possessive} only speed.`,
    creative: `${character.name} has been deep in projects and processes. The creative work has been fulfilling, but human connection has sometimes been sacrificed for it. ${p.subject} starts to wonder what a version of this life looks like with someone else genuinely in it.`,
    shy: `${character.name} has built a quiet life. Trust has taken years to extend, but ${p.possessive} slow-built friendships in ${profile.city} have proven durable. Something in ${p.possessive} chest tells ${p.object} the next chapter involves more risk than ${p.subject} has been comfortable taking.`,
    adventurous: `After years of accumulating experiences, ${character.name} returns to ${profile.city} with a kind of restlessness that feels different from before. Not a need to leave — something more like a readiness to stay, properly.`,
    analytical: `${character.name} has modeled the next decade several times in ${p.possessive} head. Every version includes another person. The question is no longer if — it is when, and with whom.`,
    empathetic: `${character.name} has given a great deal of ${p.possessive} energy to others. Now a quieter, more personal form of connection beckons — something that asks for vulnerability rather than generosity.`,
    outgoing: `${character.name} has never struggled to meet people. The difference now is a growing desire for someone who stays — not just shows up, but stays.`,
    cautious: `${character.name} has built something stable. The question now is whether stability is the end goal or the foundation for something else entirely.`,
  };

  const description = descriptions[personality] ?? `${character.name} moves through this phase with a growing sense that the scaffolding is in place — career, habits, identity. What's missing, ${p.subject} isn't quite sure, but its shape is becoming clearer.`;

  return {
    id: 'post-career-chapter',
    type: 'event',
    year: character.birthYear + breatherAge,
    age: breatherAge,
    title: 'Finding a Rhythm',
    description,
    nextNodeIds: ['relationship-decision'],
    imagePrompt: `pixel art reflective evening scene in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'random',
  };
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
      nextNodeIds: ['work-life-decision'],
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
      nextNodeIds: ['work-life-decision'],
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
      nextNodeIds: ['work-life-decision'],
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
      nextNodeIds: ['work-life-decision'],
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
      nextNodeIds: ['work-life-decision'],
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
      nextNodeIds: ['work-life-decision'],
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
      nextNodeIds: ['work-life-decision'],
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
      nextNodeIds: ['work-life-decision'],
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
      nextNodeIds: ['work-life-decision'],
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

  // All downstream ages are anchored to relAge so the timeline never goes
  // backward regardless of which relationship path the character is on.
  const outcomeAge   = relAge + 1;  // married-young / single-focused / cohabitation
  const familyAge    = relAge + 3;  // family-decision
  const familyPath1  = relAge + 5;  // first diverging family event (parent / childless / adoption)
  const familyPath2  = relAge + 7;  // second converging family event → midlife-crisis

  nodes.push({
    id: 'relationship-decision',
    type: 'decision',
    year: character.birthYear + relAge,
    age: relAge,
    title: 'Love and Commitment',
    description: `${character.name} meets someone who feels like home, yet the context in ${profile.city} makes commitment feel complicated. ${profile.socialNuance} Career plans and emotional risk now collide in the same conversation.`,
    choices: [
      {
        id: 'marry-young',
        text: 'Commit to the Relationship',
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
    nextNodeIds: ['family-decision'],
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
    nextNodeIds: ['family-decision'],
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
    nextNodeIds: ['midlife-crisis'],
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
    nextNodeIds: ['midlife-crisis'],
    imagePrompt: `pixel art adoptive family home scene in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'relationship',
  });

  return nodes;
}

function generateMidlifeNodes(character: Character, profile: CityProfile, ft: FlavorTracker): StoryNode[] {
  const nodes: StoryNode[] = [];

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
  });

  nodes.push({
    id: 'midlife-career',
    type: 'decision',
    year: character.birthYear + 45,
    age: 45,
    title: 'Peak or Pivot?',
    description: `${character.name} reaches a professional plateau in ${profile.city}. Continue maximizing status, pivot to new meaning, reclaim time, go international, or trade security for independence.`,
    choices: [
      {
        id: 'career-continue',
        text: 'Stay the Course',
        description: 'Double down on existing momentum and seniority',
        nextNodeId: 'health-reckoning',
        effects: { money: 1 },
      },
      {
        id: 'career-change',
        text: 'Reinvent Completely',
        description: 'Reset identity — new field, new colleagues, new stakes',
        nextNodeId: 'health-reckoning',
        effects: { money: -1, happiness: 2 },
      },
      {
        id: 'career-slow',
        text: 'Deliberately Slow Down',
        description: 'Trade income and status for time and health',
        nextNodeId: 'health-reckoning',
        effects: { money: -1, happiness: 2, health: 1 },
      },
      {
        id: 'career-global',
        text: 'Go International',
        description: `Leave ${profile.city} for an overseas post or partnership`,
        nextNodeId: 'health-reckoning',
        effects: { money: 1, happiness: 1, health: -1 },
      },
      {
        id: 'career-freelance',
        text: 'Go Independent',
        description: 'Leave employment for freelance or consulting autonomy',
        nextNodeId: 'health-reckoning',
        effects: { money: 0, happiness: 2, health: 1 },
      },
    ],
    imagePrompt: `pixel art midlife career decision in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'career',
  });

  nodes.push({
    id: 'health-reckoning',
    type: 'decision',
    year: character.birthYear + 50,
    age: 50,
    title: 'Body & Mind at 50',
    description: `Fifty arrives with a quiet force. In ${profile.city}, the body starts sending signals that can no longer be deferred. ${character.name} must decide how much attention to give them.`,
    choices: [
      {
        id: 'hr-commit',
        text: 'Commit to Fitness',
        description: 'Overhaul diet, sleep, and movement as a daily practice',
        nextNodeId: 'late-40s-fork',
        effects: { health: 2, money: -1 },
      },
      {
        id: 'hr-therapy',
        text: 'Invest in Mental Health',
        description: 'Finally address the emotional weight carried for decades',
        nextNodeId: 'late-40s-fork',
        effects: { happiness: 2, money: -1 },
      },
      {
        id: 'hr-accept',
        text: 'Make Peace With Aging',
        description: 'Find meaning in impermanence rather than fighting it',
        nextNodeId: 'late-40s-fork',
        effects: { happiness: 1, health: 1 },
      },
      {
        id: 'hr-push',
        text: 'Push Through Regardless',
        description: 'Ignore the signals and keep grinding at full speed',
        nextNodeId: 'late-40s-fork',
        effects: { money: 1, health: -2 },
      },
    ],
    imagePrompt: `pixel art midlife health reflection in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'health',
  });

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

  // Ambition path (existing)
  nodes.push({
    id: 'late-career-1',
    type: 'event',
    year: character.birthYear + 55,
    age: 55,
    title: 'Peak Earning Years',
    description: `${character.name} hits maximum capacity and influence. The work is demanding but natural. ${profile.city} respects seniority, though the pace requires deliberate energy management.`,
    nextNodeIds: ['second-act'],
    imagePrompt: `pixel art senior professional scene in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'career',
  });

  // Mentorship path
  nodes.push({
    id: 'late-career-alt',
    type: 'event',
    year: character.birthYear + 55,
    age: 55,
    title: 'The Mentor',
    description: `Instead of chasing the next title, ${character.name} becomes the person others come to for advice. The satisfaction shifts from personal achievement to watching younger people succeed.`,
    nextNodeIds: ['second-act'],
    imagePrompt: `pixel art mentoring a younger colleague in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'career',
  });

  // Slow down path
  nodes.push({
    id: 'slow-life-path',
    type: 'event',
    year: character.birthYear + 55,
    age: 55,
    title: 'Quiet Adjustments',
    description: `${character.name} deliberately scales back. The calendar clears. Time becomes abundant for the first time in decades. The silence in ${profile.city} is jarring at first, then deeply restorative.`,
    nextNodeIds: ['second-act'],
    imagePrompt: `pixel art quiet garden or porch scene in ${profile.city}`,
    position: { x: 0, y: 0 },
    visited: false,
    category: 'random',
  });

  nodes.push({
    id: 'second-act',
    type: 'decision',
    year: character.birthYear + 59,
    age: 59,
    title: 'The Second Act',
    description: `At 59, ${character.name} feels time becoming tangible in ${profile.city}. Retirement is close enough to plan for, but far enough away to still build something. What deserves the remaining energy?`,
    choices: [
      {
        id: 'sa-create',
        text: 'Write the Book / Build the Project',
        description: 'Channel decades of experience into a lasting creation',
        nextNodeId: 'retirement',
        effects: { happiness: 2, money: -1 },
      },
      {
        id: 'sa-mentor',
        text: 'Become a Full-Time Mentor',
        description: 'Invest energy in the next generation — pour knowledge into younger careers',
        nextNodeId: 'retirement',
        effects: { happiness: 2 },
      },
      {
        id: 'sa-wealth',
        text: 'Make Serious Money',
        description: 'One final aggressive push while expertise is still in demand',
        nextNodeId: 'retirement',
        effects: { money: 2, health: -1 },
      },
      {
        id: 'sa-travel',
        text: 'Travel Widely',
        description: 'See the places deferred for decades before time and the body say otherwise',
        nextNodeId: 'retirement',
        effects: { happiness: 2, money: -2 },
      },
    ],
    imagePrompt: `pixel art late 50s reflection scene in ${profile.city}`,
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


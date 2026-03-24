import type {
  CareerArc,
  ChapterPool,
  ChoiceLifeStateEffects,
  DelayedConsequence,
  EducationArc,
  FamilyArc,
  HealthArc,
  LifeTag,
  LifeState as ReplayLifeState,
  LifeValue,
  MobilityArc,
  RelationshipArc,
} from '@/types/replayability'

// Game Types for Life Simulation

export type Character = {
  name: string;
  gender: 'male' | 'female' | 'nonbinary';
  birthplace: string;
  birthYear: number;
  age: number;
  location: string;
  occupation: string;
  health: number; // 0-5
  money: number; // 0-5
  happiness: number; // 0-5
  personality: string[];
  skills: string[];
  childhoodDream?: string;
}

export type StoryNode = {
  id: string;
  type: 'start' | 'event' | 'decision' | 'time' | 'end' | 'milestone';
  year: number;
  age: number;
  title?: string;
  description: string;
  imagePrompt?: string;
  choices?: Choice[];
  nextNodeIds?: string[];
  position: { x: number; y: number };
  visited: boolean;
  category: 'childhood' | 'education' | 'career' | 'relationship' | 'health' | 'random';
}

export type LifeArc =
  | EducationArc
  | CareerArc
  | RelationshipArc
  | FamilyArc
  | HealthArc
  | MobilityArc

export type StructuredLifeState = ReplayLifeState<string>

export type StoredLifeConsequence = {
  id: string;
  sourceNodeId?: string;
  sourceChoiceId?: string;
  createdAtAge?: number;
  resolveAtAge?: number;
  status?: 'queued' | 'resolved' | string;
  tags?: Array<LifeTag | string>;
}

export type LifeState = {
  city: string;
  educationArc?: LifeArc;
  careerArc?: LifeArc;
  relationshipArc?: LifeArc;
  familyArc?: LifeArc;
  healthArc?: LifeArc;
  mobilityArc?: LifeArc;
  values: Array<LifeValue | string>;
  tags: Array<LifeTag | string>;
  delayedConsequences: Array<DelayedConsequence | StoredLifeConsequence>;
  unlockedChapterPools: Array<ChapterPool | string>;
  blockedChapterPools: Array<ChapterPool | string>;
}

export type ChoiceEffects = {
  health?: number;
  money?: number;
  happiness?: number;
  occupation?: string;
  location?: string;
  lifeState?: ChoiceLifeStateEffects<string>;
}

export type Choice = {
  id: string;
  text: string;
  description?: string;
  nextNodeId: string;
  effects: ChoiceEffects;
  /** Minimum stat values required to unlock this choice */
  requires?: {
    money?: number;
    health?: number;
    happiness?: number;
  };
}

export type LifePath = {
  nodes: StoryNode[];
  connections: Connection[];
}

export type Connection = {
  from: string;
  to: string;
  type: 'taken' | 'alternative' | 'unexplored';
}

export type GameState = {
  character: Character;
  lifeState?: LifeState;
  currentNodeId: string;
  visitedNodes: Set<string>;
  madeDecisions: Map<string, string>;
  isReliveMode: boolean;
  gameStarted: boolean;
  gameEnded: boolean;
}

export type GameView = 'title' | 'create' | 'game' | 'summary';

export type CharacterInput = {
  name: string;
  gender: 'male' | 'female' | 'nonbinary';
  birthplace: string;
  birthYear: number;
  personalityTraits: string[];
  childhoodDream: string;
}

export type {
  CareerArc,
  ChapterPool,
  DelayedConsequence,
  EducationArc,
  FamilyArc,
  HealthArc,
  LifeTag,
  LifeValue,
  MobilityArc,
  RelationshipArc,
} from '@/types/replayability'

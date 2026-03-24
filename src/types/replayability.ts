export type EducationArc =
  | 'elite-academic'
  | 'practical-work'
  | 'creative-self-made'
  | 'restless-explorer'

export type CareerArc =
  | 'corporate-climb'
  | 'creative-precarity'
  | 'founder-volatility'
  | 'stable-craft'
  | 'public-service'

export type RelationshipArc =
  | 'early-family'
  | 'independent'
  | 'late-commitment'
  | 'serial-reinvention'
  | 'chosen-family'

export type FamilyArc =
  | 'caregiver'
  | 'provider'
  | 'estranged'
  | 'childfree'
  | 'multigenerational'

export type HealthArc =
  | 'resilient'
  | 'neglected'
  | 'recovery'
  | 'disciplined'

export type MobilityArc =
  | 'rooted'
  | 'migrant'
  | 'global-opportunist'

export type LifeValue =
  | 'achievement'
  | 'belonging'
  | 'freedom'
  | 'stability'
  | 'care'
  | 'status'
  | 'creativity'
  | 'service'

export type LifeTag =
  | 'academic-track'
  | 'community-anchor'
  | 'creative-identity'
  | 'family-duty'
  | 'financial-pressure'
  | 'health-risk'
  | 'institutional-trust'
  | 'late-bloomer'
  | 'outsider-energy'
  | 'quiet-stability'
  | 'risk-seeking'
  | 'social-mobility'
  | 'status-driven'
  | 'worldly'

export type DelayedConsequence =
  | 'burnout-risk'
  | 'caregiving-burden'
  | 'credential-advantage'
  | 'credential-gap'
  | 'debt-pressure'
  | 'health-reckoning'
  | 'late-reinvention'
  | 'network-dividend'
  | 'relocation-opportunity'
  | 'relationship-baggage'

export type ChapterPool =
  | 'arts-underground'
  | 'caregiver-duty'
  | 'chosen-family-network'
  | 'creative-precarity'
  | 'family-duty'
  | 'global-finance'
  | 'global-migrant'
  | 'high-ambition-urban-climb'
  | 'institutional-prestige'
  | 'late-bloomer-reinvention'
  | 'public-service'
  | 'quiet-rooted-life'
  | 'startup-volatility'

export type IndustryFocus =
  | 'academia'
  | 'arts'
  | 'entrepreneurship'
  | 'finance'
  | 'media'
  | 'public-service'
  | 'technology'
  | 'trade-logistics'

export type PressureLevel = 'low' | 'moderate' | 'high' | 'intense'

export type MobilityClimate = 'rooted' | 'connected' | 'transient' | 'global-hub'

export type RiskAppetite = 'conservative' | 'balanced' | 'aggressive'

export interface CityGameplayModifiers {
  dominantIndustries: IndustryFocus[];
  costPressure: PressureLevel;
  familyPressure: PressureLevel;
  socialMobility: MobilityClimate;
  riskAppetite: RiskAppetite;
  exclusiveChapterPools: ChapterPool[];
  favoredCareerArcs: CareerArc[];
  favoredValues: LifeValue[];
  startingTags: LifeTag[];
}

export interface ChoiceLifeStateEffects<TCity extends string = string> {
  educationArc?: EducationArc;
  careerArc?: CareerArc;
  relationshipArc?: RelationshipArc;
  familyArc?: FamilyArc;
  healthArc?: HealthArc;
  mobilityArc?: MobilityArc;
  cityOverride?: TCity;
  addValues?: LifeValue[];
  addTags?: LifeTag[];
  removeTags?: LifeTag[];
  addConsequences?: DelayedConsequence[];
  resolveConsequences?: DelayedConsequence[];
  unlockChapterPools?: ChapterPool[];
  blockChapterPools?: ChapterPool[];
}

export interface LifeState<TCity extends string = string> {
  city: TCity;
  educationArc?: EducationArc;
  careerArc?: CareerArc;
  relationshipArc?: RelationshipArc;
  familyArc?: FamilyArc;
  healthArc?: HealthArc;
  mobilityArc?: MobilityArc;
  values: LifeValue[];
  tags: LifeTag[];
  delayedConsequences: DelayedConsequence[];
  unlockedChapterPools: ChapterPool[];
  blockedChapterPools: ChapterPool[];
}

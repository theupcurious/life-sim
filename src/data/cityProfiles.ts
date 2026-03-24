import type {
  CareerArc,
  ChapterPool,
  CityGameplayModifiers,
  LifeTag,
  LifeValue,
} from '@/types/replayability'

export const SUPPORTED_CITIES = [
  'Tokyo',
  'Beijing',
  'Shanghai',
  'New York',
  'San Francisco',
  'Toronto',
  'Singapore',
] as const;

export type SupportedCity = typeof SUPPORTED_CITIES[number];
export type SupportedCountry = 'Japan' | 'China' | 'United States' | 'Canada' | 'Singapore';
export type LandmarkType =
  | 'tokyo-tower'
  | 'forbidden-city'
  | 'pudong'
  | 'liberty'
  | 'golden-gate'
  | 'cn-tower'
  | 'marina-bay';

export interface CityProfile {
  city: SupportedCity;
  country: SupportedCountry;
  regionLine: string;
  schoolingNuance: string;
  socialNuance: string;
  workNuance: string;
  elderNuance: string;
  celebrationNuance: string;
  streetFood: string;
  landmark: LandmarkType;
  palette: {
    skyTop: string;
    skyBottom: string;
    skylineDark: string;
    skylineLight: string;
    neon: string;
    accent: string;
  };
  gameplay: CityGameplayModifiers;
}

const createGameplayProfile = (overrides: {
  dominantIndustries: CityGameplayModifiers['dominantIndustries'];
  costPressure: CityGameplayModifiers['costPressure'];
  familyPressure: CityGameplayModifiers['familyPressure'];
  socialMobility: CityGameplayModifiers['socialMobility'];
  riskAppetite: CityGameplayModifiers['riskAppetite'];
  exclusiveChapterPools: ChapterPool[];
  favoredCareerArcs: CareerArc[];
  favoredValues: LifeValue[];
  startingTags: LifeTag[];
}): CityGameplayModifiers => overrides

export const CITY_PROFILES: Record<SupportedCity, CityProfile> = {
  Tokyo: {
    city: 'Tokyo',
    country: 'Japan',
    regionLine: 'where neon backstreets sit beside quiet shrines and pocket parks',
    schoolingNuance: 'Club activities and exam pressure become a second timetable after classes.',
    socialNuance: 'Respect, subtlety, and reading the room shape most interactions.',
    workNuance: 'Team harmony and diligence are prized, though long workdays can blur personal time.',
    elderNuance: 'Neighborhood elders pass down practical wisdom about endurance and balance.',
    celebrationNuance: 'Seasonal matsuri and cherry-blossom evenings mark each stage of life.',
    streetFood: 'yakitori from a tiny alley stall',
    landmark: 'tokyo-tower',
    palette: {
      skyTop: '#0b1024',
      skyBottom: '#1f2a5a',
      skylineDark: '#0f172a',
      skylineLight: '#334155',
      neon: '#22d3ee',
      accent: '#f97316',
    },
    gameplay: createGameplayProfile({
      dominantIndustries: ['technology', 'public-service', 'academia'],
      costPressure: 'high',
      familyPressure: 'high',
      socialMobility: 'connected',
      riskAppetite: 'conservative',
      exclusiveChapterPools: ['institutional-prestige', 'quiet-rooted-life'],
      favoredCareerArcs: ['corporate-climb', 'stable-craft', 'public-service'],
      favoredValues: ['stability', 'service', 'belonging'],
      startingTags: ['quiet-stability', 'institutional-trust'],
    }),
  },
  Beijing: {
    city: 'Beijing',
    country: 'China',
    regionLine: 'where imperial history, ring roads, and modern ambition intersect',
    schoolingNuance: 'Structured study culture and family expectations create fierce academic focus.',
    socialNuance: 'Family ties and multigenerational duty weigh heavily on personal choices.',
    workNuance: 'Career growth moves fast, with strong emphasis on resilience and results.',
    elderNuance: 'Traditional values and practical caution guide major decisions.',
    celebrationNuance: 'Lunar New Year reunions and shared banquets renew family bonds each year.',
    streetFood: 'jianbing folded hot on a griddle at dawn',
    landmark: 'forbidden-city',
    palette: {
      skyTop: '#111827',
      skyBottom: '#3b0764',
      skylineDark: '#1f2937',
      skylineLight: '#4b5563',
      neon: '#f59e0b',
      accent: '#ef4444',
    },
    gameplay: createGameplayProfile({
      dominantIndustries: ['technology', 'public-service', 'academia'],
      costPressure: 'high',
      familyPressure: 'intense',
      socialMobility: 'connected',
      riskAppetite: 'balanced',
      exclusiveChapterPools: ['family-duty', 'institutional-prestige'],
      favoredCareerArcs: ['corporate-climb', 'public-service', 'stable-craft'],
      favoredValues: ['achievement', 'status', 'belonging'],
      startingTags: ['academic-track', 'family-duty', 'status-driven'],
    }),
  },
  Shanghai: {
    city: 'Shanghai',
    country: 'China',
    regionLine: 'where old lane houses and futuristic towers face the Huangpu River',
    schoolingNuance: 'Competitive schools push excellence while creativity finds space in city arts.',
    socialNuance: 'Style, speed, and social networks influence opportunity.',
    workNuance: 'Finance, tech, and global business culture reward adaptability and pace.',
    elderNuance: 'Family expectations remain strong even in highly modern lifestyles.',
    celebrationNuance: 'Night markets and riverfront festivals color city life.',
    streetFood: 'xiaolongbao with scalding broth and ginger vinegar',
    landmark: 'pudong',
    palette: {
      skyTop: '#0f172a',
      skyBottom: '#1d4ed8',
      skylineDark: '#111827',
      skylineLight: '#475569',
      neon: '#38bdf8',
      accent: '#a855f7',
    },
    gameplay: createGameplayProfile({
      dominantIndustries: ['finance', 'technology', 'trade-logistics'],
      costPressure: 'high',
      familyPressure: 'high',
      socialMobility: 'global-hub',
      riskAppetite: 'balanced',
      exclusiveChapterPools: ['global-finance', 'high-ambition-urban-climb'],
      favoredCareerArcs: ['corporate-climb', 'founder-volatility', 'stable-craft'],
      favoredValues: ['achievement', 'status', 'stability'],
      startingTags: ['social-mobility', 'status-driven'],
    }),
  },
  'New York': {
    city: 'New York',
    country: 'United States',
    regionLine: 'where every neighborhood speaks with a different rhythm',
    schoolingNuance: 'Public-school grit and diverse peer circles shape identity early.',
    socialNuance: 'Bold self-expression and hustle culture are often rewarded.',
    workNuance: 'High competition and opportunity coexist, especially in finance, media, and tech.',
    elderNuance: 'Community mentors often become chosen family in fast-paced city life.',
    celebrationNuance: 'Street parades, block parties, and late-night diners mark milestones.',
    streetFood: 'a folded slice grabbed between subway transfers',
    landmark: 'liberty',
    palette: {
      skyTop: '#020617',
      skyBottom: '#1e3a8a',
      skylineDark: '#111827',
      skylineLight: '#64748b',
      neon: '#f97316',
      accent: '#22d3ee',
    },
    gameplay: createGameplayProfile({
      dominantIndustries: ['finance', 'media', 'technology'],
      costPressure: 'intense',
      familyPressure: 'moderate',
      socialMobility: 'global-hub',
      riskAppetite: 'aggressive',
      exclusiveChapterPools: ['chosen-family-network', 'high-ambition-urban-climb'],
      favoredCareerArcs: ['corporate-climb', 'creative-precarity', 'founder-volatility'],
      favoredValues: ['achievement', 'freedom', 'status'],
      startingTags: ['outsider-energy', 'social-mobility'],
    }),
  },
  'San Francisco': {
    city: 'San Francisco',
    country: 'United States',
    regionLine: 'where hills, fog, and startups define the horizon',
    schoolingNuance: 'Project-based learning and creative communities encourage experimentation.',
    socialNuance: 'Individual values and identity expression are central to local culture.',
    workNuance: 'Innovation cycles are fast, and risk-taking can rapidly change fortunes.',
    elderNuance: 'Local communities emphasize inclusion, activism, and civic engagement.',
    celebrationNuance: 'Street fairs and waterfront gatherings blend tech optimism with counterculture roots.',
    streetFood: 'mission-style burritos after a long evening walk',
    landmark: 'golden-gate',
    palette: {
      skyTop: '#082f49',
      skyBottom: '#0ea5e9',
      skylineDark: '#0f172a',
      skylineLight: '#475569',
      neon: '#fb7185',
      accent: '#f97316',
    },
    gameplay: createGameplayProfile({
      dominantIndustries: ['technology', 'entrepreneurship', 'arts'],
      costPressure: 'intense',
      familyPressure: 'moderate',
      socialMobility: 'global-hub',
      riskAppetite: 'aggressive',
      exclusiveChapterPools: ['startup-volatility', 'arts-underground'],
      favoredCareerArcs: ['founder-volatility', 'creative-precarity', 'corporate-climb'],
      favoredValues: ['freedom', 'creativity', 'achievement'],
      startingTags: ['creative-identity', 'risk-seeking'],
    }),
  },
  Toronto: {
    city: 'Toronto',
    country: 'Canada',
    regionLine: 'where lake winds and multicultural neighborhoods shape daily life',
    schoolingNuance: 'Academic balance and extracurricular breadth are encouraged from early years.',
    socialNuance: 'Politeness and cultural inclusivity are strong social expectations.',
    workNuance: 'Steady growth in finance, media, and tech rewards long-term reliability.',
    elderNuance: 'Community service and mutual support are treated as civic basics.',
    celebrationNuance: 'Summer festivals and winter gatherings keep neighborhoods tightly connected.',
    streetFood: 'late-night poutine shared with friends',
    landmark: 'cn-tower',
    palette: {
      skyTop: '#0f172a',
      skyBottom: '#334155',
      skylineDark: '#111827',
      skylineLight: '#64748b',
      neon: '#38bdf8',
      accent: '#fbbf24',
    },
    gameplay: createGameplayProfile({
      dominantIndustries: ['finance', 'media', 'technology'],
      costPressure: 'high',
      familyPressure: 'moderate',
      socialMobility: 'connected',
      riskAppetite: 'balanced',
      exclusiveChapterPools: ['quiet-rooted-life', 'public-service'],
      favoredCareerArcs: ['stable-craft', 'public-service', 'corporate-climb'],
      favoredValues: ['belonging', 'stability', 'service'],
      startingTags: ['community-anchor', 'quiet-stability'],
    }),
  },
  Singapore: {
    city: 'Singapore',
    country: 'Singapore',
    regionLine: 'where dense greenery, hawker centers, and global trade meet',
    schoolingNuance: 'High standards and disciplined study are balanced with multilingual identity.',
    socialNuance: 'Pragmatism and social order coexist with rich cultural plurality.',
    workNuance: 'Efficiency and international business culture shape professional life.',
    elderNuance: 'Family cohesion and practical planning drive long-term choices.',
    celebrationNuance: 'Cultural holidays from multiple traditions are celebrated across the city.',
    streetFood: 'satay and chili crab shared at a hawker center',
    landmark: 'marina-bay',
    palette: {
      skyTop: '#0b1024',
      skyBottom: '#065f46',
      skylineDark: '#111827',
      skylineLight: '#4b5563',
      neon: '#2dd4bf',
      accent: '#facc15',
    },
    gameplay: createGameplayProfile({
      dominantIndustries: ['finance', 'technology', 'trade-logistics'],
      costPressure: 'high',
      familyPressure: 'high',
      socialMobility: 'global-hub',
      riskAppetite: 'balanced',
      exclusiveChapterPools: ['global-finance', 'public-service'],
      favoredCareerArcs: ['corporate-climb', 'public-service', 'stable-craft'],
      favoredValues: ['stability', 'achievement', 'service'],
      startingTags: ['institutional-trust', 'worldly'],
    }),
  },
};

export const CITY_OPTIONS = SUPPORTED_CITIES.map((city) => ({
  value: city,
  label: `${city}, ${CITY_PROFILES[city].country}`,
}));

export function getCityProfile(city: string): CityProfile {
  if (city in CITY_PROFILES) {
    return CITY_PROFILES[city as SupportedCity];
  }
  return CITY_PROFILES.Tokyo;
}

export function getCityGameplayProfile(city: string): CityGameplayModifiers {
  return getCityProfile(city).gameplay
}

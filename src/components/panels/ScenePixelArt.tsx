import { useId, useMemo } from 'react';
import type { StoryNode } from '@/types/game';
import { getCityProfile } from '@/data/cityProfiles';
import CitySkyline from './CitySkyline';

interface ScenePixelArtProps {
  node: StoryNode;
  birthplace: string;
}

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function lerp(a: string, b: string, t: number): string {
  const ah = parseInt(a.slice(1), 16);
  const bh = parseInt(b.slice(1), 16);
  const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
  const br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff;
  const rr = Math.round(ar + (br - ar) * t);
  const rg = Math.round(ag + (bg - ag) * t);
  const rb = Math.round(ab + (bb - ab) * t);
  return `#${((rr << 16) | (rg << 8) | rb).toString(16).padStart(6, '0')}`;
}

// Sky color palette — 10 stops across a lifetime
const SKY_STOPS: { age: number; top: string; bottom: string }[] = [
  { age: 0,  top: '#7dd3fc', bottom: '#e0f2fe' }, // dawn — newborn
  { age: 8,  top: '#38bdf8', bottom: '#bae6fd' }, // bright morning — childhood
  { age: 15, top: '#0ea5e9', bottom: '#7dd3fc' }, // clear noon — teens
  { age: 22, top: '#0284c7', bottom: '#38bdf8' }, // deep blue — young adult
  { age: 30, top: '#1e3a5f', bottom: '#3b82f6' }, // early evening — settling
  { age: 40, top: '#1e293b', bottom: '#334155' }, // city night — career peak
  { age: 50, top: '#312e81', bottom: '#4338ca' }, // deep indigo — midlife
  { age: 60, top: '#ea580c', bottom: '#f59e0b' }, // golden hour — late career
  { age: 72, top: '#7c2d12', bottom: '#c2410c' }, // deep sunset — twilight
  { age: 82, top: '#020617', bottom: '#1e1b4b' }, // night — final years
];

const SCENE_HEIGHT = 54;
const SEGMENT_WIDTH = 96;
const SEGMENT_COUNT = 3;
const SCENE_WIDTH = SEGMENT_WIDTH * SEGMENT_COUNT;

function getSkyColors(age: number) {
  if (age <= SKY_STOPS[0].age) return { top: SKY_STOPS[0].top, bottom: SKY_STOPS[0].bottom };
  const last = SKY_STOPS[SKY_STOPS.length - 1];
  if (age >= last.age) return { top: last.top, bottom: last.bottom };

  for (let i = 0; i < SKY_STOPS.length - 1; i++) {
    const a = SKY_STOPS[i], b = SKY_STOPS[i + 1];
    if (age >= a.age && age < b.age) {
      const t = (age - a.age) / (b.age - a.age);
      return { top: lerp(a.top, b.top, t), bottom: lerp(a.bottom, b.bottom, t) };
    }
  }
  return { top: last.top, bottom: last.bottom };
}


const ScenePixelArt: React.FC<ScenePixelArtProps> = ({ node, birthplace }) => {
  const sceneId = useId().replace(/:/g, '');
  const profile = getCityProfile(birthplace);

  const { stars, particles, clouds, trees, groundType } = useMemo(() => {
    const rng = mulberry32(hashString(`${birthplace}-${node.id}-${node.year}-${node.type}`));

    const generatedStars = Array.from({ length: 30 }, () => ({
      x: Math.floor(rng() * SCENE_WIDTH),
      y: Math.floor(rng() * 22),
      alpha: 0.2 + rng() * 0.8,
      delay: rng() * 4,
    }));

    const generatedClouds = Array.from({ length: 3 }, () => ({
      x: Math.floor(rng() * SCENE_WIDTH) - 20,
      y: Math.floor(rng() * 12) + 2,
      width: 10 + Math.floor(rng() * 16),
      speed: 50 + rng() * 60,
      opacity: 0.12 + rng() * 0.2,
      delay: rng() * -50,
    }));

    const particleCount = 12;
    const generatedParticles = Array.from({ length: particleCount }, () => ({
      x: Math.floor(rng() * SCENE_WIDTH),
      y: Math.floor(rng() * SCENE_HEIGHT),
      speed: 1 + rng() * 3,
      delay: rng() * -10,
      alpha: 0.3 + rng() * 0.5,
    }));

    // Foreground trees/posts distributed across the panorama
    const treeCount = 7 + Math.floor(rng() * 4);
    const generatedTrees = Array.from({ length: treeCount }, () => ({
      x: Math.floor(rng() * (SCENE_WIDTH - 6)) + 3,
      type: rng() > 0.5 ? 'tree' : 'post',
      height: 4 + Math.floor(rng() * 5),
    }));

    const gType = rng() > 0.6 ? 'grass' : 'pavement';

    return {
      stars: generatedStars,
      particles: generatedParticles,
      clouds: generatedClouds,
      trees: generatedTrees,
      groundType: gType,
    };
  }, [birthplace, node.id, node.year, node.type]);

  const skyColors = getSkyColors(node.age || 0);
  const age = node.age || 0;
  const isNight = age >= 35;
  const groundBase = groundType === 'grass' && age < 40
    ? '#1a2e1a'
    : isNight
      ? '#0a0a0a'
      : '#1a1a1a';

  const getCategoryTheme = () => {
    switch (node.category) {
      case 'career':       return { pColor: '#fbbf24', pClass: 'anim-rain' };
      case 'relationship': return { pColor: '#fb7185', pClass: 'anim-float' };
      case 'health':       return { pColor: '#34d399', pClass: 'anim-pulse-slow' };
      case 'childhood':    return { pColor: '#ffffff', pClass: 'anim-drift-up' };
      default:             return { pColor: profile.palette.accent, pClass: 'anim-twinkle' };
    }
  };
  const theme = getCategoryTheme();

  const renderSceneElement = () => {
    const dk = profile.palette.skylineDark;
    const ac = profile.palette.accent;
    const lt = isNight ? '#fbbf24' : '#ffffff';

    // Map node IDs and categories to SVG illustrations
    const id = node.id;
    const cat = node.category;

    // ----- Cradle (birth / start) -----
    if (node.type === 'start' || id === 'start') return (
      <g className="anim-float">
        <ellipse cx="47" cy="41" rx="13" ry="2" fill={dk} />
        <rect x="34" y="32" width="26" height="10" rx="5" fill={dk} />
        <path d={`M34,37 Q34,26 47,26 L47,37 Z`} fill={ac} opacity="0.6" />
        <line x1="47" y1="26" x2="47" y2="17" stroke={lt} strokeWidth="0.5" opacity="0.6" />
        <circle cx="47" cy="16" r="2" fill={ac} />
        <circle cx="41" cy="19" r="1.5" fill={lt} opacity="0.6" />
        <circle cx="53" cy="19" r="1.5" fill={lt} opacity="0.6" />
      </g>
    );

    // ----- Playground swing (childhood) -----
    if (id === 'childhood-1' || id === 'childhood-2' || cat === 'childhood') return (
      <g>
        <rect x="28" y="22" width="2" height="20" fill={dk} />
        <rect x="58" y="22" width="2" height="20" fill={dk} />
        <rect x="28" y="22" width="32" height="2" fill={dk} />
        <line x1="37" y1="24" x2="35" y2="36" stroke={ac} strokeWidth="0.7" />
        <line x1="51" y1="24" x2="53" y2="36" stroke={ac} strokeWidth="0.7" />
        <rect x="33" y="36" width="22" height="3" rx="1" fill={ac} />
        <circle cx="44" cy="31" r="3.5" fill={lt} opacity="0.9" />
      </g>
    );

    // ----- Stack of books + graduation cap (education) -----
    if (id === 'education-decision' || id === 'choice-university' || id.startsWith('school')) return (
      <g>
        <rect x="30" y="38" width="28" height="4" rx="1" fill={ac} />
        <rect x="31" y="34" width="26" height="4" rx="1" fill={dk} />
        <rect x="32" y="30" width="24" height="4" rx="1" fill={ac} opacity="0.7" />
        <line x1="35" y1="32" x2="53" y2="32" stroke={lt} strokeWidth="0.5" opacity="0.35" />
        <line x1="35" y1="33.5" x2="48" y2="33.5" stroke={lt} strokeWidth="0.5" opacity="0.35" />
        <rect x="30" y="26" width="28" height="2.5" fill={dk} />
        <rect x="39" y="23" width="10" height="3.5" rx="0.5" fill={dk} />
        <line x1="54" y1="27.5" x2="57" y2="30" stroke={ac} strokeWidth="0.8" />
        <circle cx="57" cy="31" r="1.2" fill={ac} />
      </g>
    );

    // ----- Briefcase (corporate / stable career) -----
    if (id === 'corporate-path' || id === 'stable-path' || id.includes('corporate') || id.includes('stable')) return (
      <g>
        <path d={`M41,30 Q47,26 53,30`} stroke={dk} strokeWidth="2" fill="none" />
        <rect x="35" y="30" width="24" height="14" rx="2" fill={dk} />
        <rect x="35" y="30" width="24" height="14" rx="2" fill="none" stroke={lt} strokeWidth="0.3" opacity="0.2" />
        <rect x="44" y="35" width="6" height="4" rx="1" fill={ac} />
        <line x1="35" y1="37" x2="59" y2="37" stroke={lt} strokeWidth="0.4" opacity="0.25" />
      </g>
    );

    // ----- Easel + canvas (creative career) -----
    if (id === 'creative-career-path' || id.includes('creative') || id.includes('art')) return (
      <g>
        <rect x="31" y="20" width="22" height="16" fill={lt} opacity="0.92" />
        <rect x="31" y="20" width="22" height="16" fill="none" stroke={dk} strokeWidth="1" />
        <rect x="33" y="22" width="7" height="7" rx="1.5" fill={ac} opacity="0.8" />
        <rect x="42" y="23" width="6" height="5" rx="1.5" fill="#fb7185" opacity="0.7" />
        <rect x="35" y="29" width="9" height="4" rx="1" fill="#34d399" opacity="0.6" />
        <line x1="31" y1="36" x2="26" y2="42" stroke={dk} strokeWidth="1.5" />
        <line x1="53" y1="36" x2="58" y2="42" stroke={dk} strokeWidth="1.5" />
        <line x1="42" y1="36" x2="42" y2="42" stroke={dk} strokeWidth="1" />
      </g>
    );

    // ----- Light bulb (entrepreneur) -----
    if (id === 'entrepreneur-path' || id.includes('entrepreneur')) return (
      <g className="anim-float">
        <ellipse cx="47" cy="28" rx="11" ry="12" fill={ac} opacity="0.12" />
        <ellipse cx="47" cy="28" rx="8.5" ry="9.5" fill={lt} opacity="0.9" />
        <path d={`M43,27 L45,25 L47,27 L49,25 L51,27`} stroke={dk} strokeWidth="0.8" fill="none" />
        <rect x="43" y="36" width="8" height="2" fill={dk} />
        <rect x="43" y="38" width="8" height="2" fill={ac} opacity="0.6" />
        <rect x="44" y="40" width="6" height="2" fill={dk} />
      </g>
    );

    // ----- Clock (work-life balance decision) -----
    if (id === 'work-life-decision') return (
      <g>
        <circle cx="47" cy="30" r="13" fill={ac} opacity="0.12" />
        <circle cx="47" cy="30" r="12" fill={dk} opacity="0.88" />
        <circle cx="47" cy="30" r="12" fill="none" stroke={ac} strokeWidth="1" />
        <line x1="47" y1="30" x2="47" y2="21" stroke={lt} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="47" y1="30" x2="55" y2="30" stroke={ac} strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="47" cy="30" r="1.5" fill={lt} />
        <rect x="46.5" y="19" width="1" height="2" fill={lt} opacity="0.4" />
        <rect x="46.5" y="39" width="1" height="2" fill={lt} opacity="0.4" />
        <rect x="35.5" y="29.5" width="2" height="1" fill={lt} opacity="0.4" />
        <rect x="57.5" y="29.5" width="2" height="1" fill={lt} opacity="0.4" />
      </g>
    );

    // ----- Park bench with two figures (relationship) -----
    if (id === 'relationship-decision' || cat === 'relationship') return (
      <g>
        <rect x="27" y="36" width="34" height="2.5" rx="1" fill={dk} />
        <rect x="27" y="30" width="34" height="2" rx="1" fill={dk} />
        <rect x="29" y="38" width="2" height="4" fill={dk} />
        <rect x="57" y="38" width="2" height="4" fill={dk} />
        <rect x="34" y="30" width="2" height="8" fill={dk} opacity="0.5" />
        <rect x="52" y="30" width="2" height="8" fill={dk} opacity="0.5" />
        <circle cx="37" cy="26" r="3.5" fill={lt} opacity="0.9" />
        <rect x="33" y="29" width="7" height="7" rx="2" fill={ac} opacity="0.7" />
        <circle cx="51" cy="26" r="3.5" fill={lt} opacity="0.9" />
        <rect x="47" y="29" width="7" height="7" rx="2" fill={ac} opacity="0.65" />
        <path d={`M43,25 Q44.5,23 46,25 Q47.5,23 49,25 L46,28 Z`} fill="#fb7185" />
      </g>
    );

    // ----- House (family) -----
    if (id === 'family-decision' || id.includes('family')) return (
      <g>
        <rect x="29" y="30" width="30" height="12" fill={dk} />
        <polygon points="26,30 44,18 62,30" fill={ac} />
        <rect x="51" y="14" width="4" height="8" fill={dk} />
        <rect x="40" y="34" width="7" height="8" rx="1" fill={ac} opacity="0.45" />
        <rect x="31" y="32" width="5" height="5" fill={lt} opacity="0.6" />
        <rect x="52" y="32" width="5" height="5" fill={lt} opacity="0.6" />
        <ellipse cx="53" cy="13" rx="2" ry="1.5" fill="#888" opacity="0.35" />
        <ellipse cx="52" cy="10" rx="1.5" ry="1.5" fill="#888" opacity="0.25" />
        <ellipse cx="54" cy="8" rx="1" ry="1" fill="#888" opacity="0.15" />
      </g>
    );

    // ----- Hourglass (midlife) -----
    if (id === 'midlife-crisis' || id === 'midlife-career' || id.includes('midlife')) return (
      <g>
        <rect x="34" y="22" width="26" height="2" rx="0.5" fill={dk} />
        <rect x="34" y="40" width="26" height="2" rx="0.5" fill={dk} />
        <line x1="35" y1="24" x2="47" y2="36" stroke={dk} strokeWidth="2" />
        <line x1="59" y1="24" x2="47" y2="36" stroke={dk} strokeWidth="2" />
        <line x1="47" y1="36" x2="35" y2="40" stroke={dk} strokeWidth="2" />
        <line x1="47" y1="36" x2="59" y2="40" stroke={dk} strokeWidth="2" />
        <polygon points="37,24 57,24 50,33 44,33" fill={ac} opacity="0.55" />
        <polygon points="44,36 50,36 55,40 39,40" fill={ac} opacity="0.35" />
        <circle cx="47" cy="36" r="1.2" fill={ac} />
      </g>
    );

    // ----- First aid kit (health) -----
    if (id === 'health-reckoning' || cat === 'health') return (
      <g className="anim-float">
        <rect x="34" y="27" width="26" height="17" rx="2" fill="white" opacity="0.92" />
        <rect x="45" y="29" width="4" height="13" fill="#ef4444" />
        <rect x="38" y="33" width="18" height="5" fill="#ef4444" />
        <rect x="34" y="27" width="26" height="17" rx="2" fill="none" stroke={dk} strokeWidth="0.8" />
        <rect x="41" y="25" width="12" height="3.5" rx="1.5" fill={dk} />
      </g>
    );

    // ----- Open book (second act / writing / legacy) -----
    if (id === 'second-act' || id.includes('mentor') || id.includes('legacy')) return (
      <g>
        <path d={`M24,42 L44,38 L44,26 L24,30 Z`} fill={lt} opacity="0.9" />
        <path d={`M50,38 L70,42 L70,30 L50,26 Z`} fill={lt} opacity="0.82" />
        <path d={`M44,26 L44,38 Q47,40 50,38 L50,26 Q47,24 44,26 Z`} fill={dk} />
        <line x1="27" y1="33" x2="42" y2="31" stroke={dk} strokeWidth="0.5" opacity="0.35" />
        <line x1="27" y1="35.5" x2="42" y2="33.5" stroke={dk} strokeWidth="0.5" opacity="0.35" />
        <line x1="27" y1="38" x2="42" y2="36" stroke={dk} strokeWidth="0.5" opacity="0.35" />
        <line x1="52" y1="31" x2="67" y2="33" stroke={dk} strokeWidth="0.5" opacity="0.35" />
        <line x1="52" y1="33.5" x2="67" y2="35.5" stroke={dk} strokeWidth="0.5" opacity="0.35" />
        <path d={`M63,28 L66,33 L65,33 L65,36 L64,36 L64,33 L63,33 Z`} fill={ac} />
      </g>
    );

    // ----- Rocking chair (retirement) -----
    if (id === 'retirement' || id.includes('retire')) return (
      <g>
        <path d={`M28,42 Q44,45 60,42`} stroke={dk} strokeWidth="2.5" fill="none" />
        <rect x="36" y="24" width="3" height="16" rx="1" fill={dk} />
        <rect x="36" y="36" width="22" height="3" rx="1" fill={dk} />
        <rect x="55" y="30" width="3" height="12" rx="1" fill={dk} />
        <rect x="40" y="26" width="2" height="12" fill={dk} opacity="0.45" />
        <rect x="44" y="26" width="2" height="12" fill={dk} opacity="0.45" />
        <rect x="48" y="26" width="2" height="12" fill={dk} opacity="0.45" />
        <circle cx="48" cy="20" r="4.5" fill={lt} opacity="0.9" />
        <rect x="39" y="24" width="16" height="12" rx="3" fill={ac} opacity="0.55" />
      </g>
    );

    // ----- Candle (end / death) -----
    if (node.type === 'end' || id === 'end' || id.includes('death')) return (
      <g className="anim-float">
        <ellipse cx="47" cy="28" rx="9" ry="11" fill="#fbbf24" opacity="0.13" />
        <ellipse cx="47" cy="26" rx="3.5" ry="5.5" fill="#fbbf24" opacity="0.88" />
        <ellipse cx="47" cy="27" rx="1.8" ry="3" fill="#fed7aa" />
        <rect x="46.5" y="30" width="1" height="3" fill={dk} />
        <rect x="43" y="32" width="8" height="10" rx="1" fill={lt} opacity="0.95" />
        <path d={`M43,34 Q41,37 42,39 L43,39`} fill={lt} opacity="0.55" />
        <ellipse cx="47" cy="42" rx="9" ry="2" fill={dk} />
      </g>
    );

    // ----- Globe (travel / late career) -----
    if (id.includes('travel') || id.includes('global') || id === 'late-career-1' || id === 'late-career-2') return (
      <g>
        <circle cx="47" cy="30" r="12" fill={dk} opacity="0.88" />
        <ellipse cx="47" cy="30" rx="12" ry="4" fill="none" stroke={ac} strokeWidth="0.8" opacity="0.55" />
        <ellipse cx="47" cy="30" rx="4" ry="12" fill="none" stroke={ac} strokeWidth="0.8" opacity="0.4" />
        <ellipse cx="43" cy="26" rx="4" ry="3" fill={lt} opacity="0.35" />
        <ellipse cx="52" cy="30" rx="3" ry="4" fill={lt} opacity="0.28" />
        <ellipse cx="44" cy="34" rx="3" ry="2" fill={lt} opacity="0.32" />
        <circle cx="47" cy="30" r="12" fill="none" stroke={lt} strokeWidth="0.4" opacity="0.2" />
        <rect x="44" y="42" width="6" height="2" fill={dk} />
        <ellipse cx="47" cy="43.5" rx="6" ry="1.5" fill={dk} opacity="0.6" />
      </g>
    );

    // ----- Signpost fork (generic decision) -----
    if (node.type === 'decision') return (
      <g>
        <rect x="45.5" y="30" width="3" height="12" rx="1" fill={dk} />
        <path d={`M44,30 L26,24 L26,30 L44,30 L47,27 Z`} fill={ac} />
        <path d={`M50,24 L68,24 L68,30 L50,30 L47,27 Z`} fill={dk} />
        <circle cx="47" cy="30" r="2" fill={lt} opacity="0.6" />
      </g>
    );

    // ----- Question mark (random events / teenage / default) -----
    return (
      <g className="anim-float">
        <circle cx="47" cy="30" r="14" fill={dk} opacity="0.15" />
        <path
          d={`M40,22 Q40,17 47,17 Q54,17 54,23 Q54,29 47,32 L47,35`}
          stroke={ac} strokeWidth="4" fill="none" strokeLinecap="round"
        />
        <circle cx="47" cy="39" r="2.5" fill={ac} />
      </g>
    );
  };

  const renderGround = () => {
    if (groundType === 'grass' && age < 40) {
      const grassTufts = Array.from({ length: Math.floor(SCENE_WIDTH / 14) }, (_, i) => 5 + i * 14);
      return (
        <g>
          <rect x="0" y="42" width={SCENE_WIDTH} height="12" fill="#1a2e1a" />
          <rect x="0" y="42" width={SCENE_WIDTH} height="1" fill="#2d5a2d" opacity="0.6" />
          {/* Grass tufts */}
          {grassTufts.map((gx, i) => (
            <g key={`grass-${i}`}>
              <rect x={gx} y={41} width="1" height="2" fill="#3a7a3a" opacity="0.7" />
              <rect x={gx + 1} y={40} width="1" height="3" fill="#2d6a2d" opacity="0.6" />
            </g>
          ))}
        </g>
      );
    }

    // Pavement with subtle lane markings
    const roadDashes = Array.from({ length: Math.floor((SCENE_WIDTH - 10) / 15) }, (_, i) => 10 + i * 15);
    return (
      <g>
        <rect x="0" y="42" width={SCENE_WIDTH} height="12" fill={groundBase} />
        <rect x="0" y="42" width={SCENE_WIDTH} height="1" fill="#333" opacity="0.5" />
        {/* Curb line */}
        <rect x="0" y="43" width={SCENE_WIDTH} height="0.5" fill="#555" opacity="0.3" />
        {/* Dashes */}
        {roadDashes.map((dx, i) => (
          <rect key={`dash-${i}`} x={dx} y={48} width="4" height="0.5" fill="#444" opacity="0.3" />
        ))}
      </g>
    );
  };

  const renderForeground = () => {
    return (
      <g opacity="0.5">
        {trees.map((t, i) => {
          if (t.type === 'tree') {
            const foliageColor = isNight ? '#0a2a0a' : '#1a5a1a';
            return (
              <g key={`fg-${i}`}>
                <rect x={t.x} y={42 - t.height} width="1" height={t.height} fill="#3a2a1a" />
                <rect x={t.x - 1} y={42 - t.height - 2} width="3" height="3" fill={foliageColor} />
                <rect x={t.x - 2} y={42 - t.height} width="5" height="2" fill={foliageColor} />
              </g>
            );
          }
          // Lamppost
          return (
            <g key={`fg-${i}`}>
              <rect x={t.x} y={42 - t.height} width="1" height={t.height} fill="#555" />
              <rect x={t.x - 1} y={42 - t.height} width="3" height="1" fill="#666" />
              {isNight && (
                <rect x={t.x - 1} y={42 - t.height + 1} width="3" height="1" fill="#fbbf24" opacity="0.4" />
              )}
            </g>
          );
        })}
      </g>
    );
  };

  const skyGradientId = `scene-sky-${sceneId}`;
  const windowsPatternId = `night-windows-pattern-${sceneId}`;

  return (
    <svg
      viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`}
      className="h-full w-full block"
      style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges' }}
      preserveAspectRatio="xMidYMid slice"
      aria-label={`Pixel art scene for ${node.title ?? node.type}`}
    >
      <defs>
        <style>
          {`
            .anim-twinkle { animation: twinkle 3s infinite alternate ease-in-out; }
            .anim-cloud { animation: cloudMove linear infinite; }
            .anim-rain { animation: rainFall linear infinite; }
            .anim-float { animation: floataround 4s infinite ease-in-out; }
            .anim-drift-up { animation: driftUp 8s linear infinite; }
            .anim-pulse-slow { animation: slowPulse 2s infinite alternate; }

            @keyframes twinkle { 0% { opacity: 0.1; } 100% { opacity: 1; } }
            @keyframes cloudMove { 0% { transform: translateX(0); } 100% { transform: translateX(${SCENE_WIDTH + 20}px); } }
            @keyframes rainFall { 0% { transform: translateY(0); } 100% { transform: translateY(${SCENE_HEIGHT}px); } }
            @keyframes driftUp { 0% { transform: translateY(0) rotate(0deg); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(-30px) rotate(10deg); opacity: 0; } }
            @keyframes floataround { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
            @keyframes slowPulse { 0% { opacity: 0.7; } 100% { opacity: 1; } }
          `}
        </style>
        <linearGradient id={skyGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={skyColors.top} />
          <stop offset="100%" stopColor={skyColors.bottom} />
        </linearGradient>
        <pattern id={windowsPatternId} x="0" y="0" width="3" height="3" patternUnits="userSpaceOnUse">
          <rect x="1" y="1" width="1" height="1" fill={profile.palette.neon} opacity="0.8" />
        </pattern>
      </defs>

      <rect x="0" y="0" width={SCENE_WIDTH} height={SCENE_HEIGHT} fill={`url(#${skyGradientId})`} />

      {isNight &&
        stars.map((star, i) => (
          <rect
            key={`star-${i}`}
            x={star.x}
            y={star.y}
            width="1"
            height="1"
            fill="#ffffff"
            opacity={star.alpha}
            className="anim-twinkle"
            style={{ animationDelay: `${star.delay}s`, animationDuration: `${2 + star.delay}s` }}
          />
        ))}

      {!isNight &&
        clouds.map((cloud, i) => (
          <g key={`cloud-${i}`}>
            <rect
              x={cloud.x}
              y={cloud.y}
              width={cloud.width}
              height="2"
              rx="1"
              fill="#ffffff"
              opacity={cloud.opacity}
              className="anim-cloud"
              style={{ animationDuration: `${cloud.speed}s`, animationDelay: `${cloud.delay}s` }}
            />
            <rect
              x={cloud.x + 2}
              y={cloud.y - 1}
              width={cloud.width - 4}
              height="1"
              fill="#ffffff"
              opacity={cloud.opacity * 0.7}
              className="anim-cloud"
              style={{ animationDuration: `${cloud.speed}s`, animationDelay: `${cloud.delay}s` }}
            />
          </g>
        ))}

      {Array.from({ length: SEGMENT_COUNT }).map((_, idx) => (
        <g key={`skyline-segment-${idx}`} transform={`translate(${idx * SEGMENT_WIDTH},0)`}>
          <CitySkyline
            city={profile.city}
            foregroundColor={profile.palette.skylineDark}
            backgroundColor={profile.palette.skylineLight}
            isNight={isNight}
            windowsPatternId={windowsPatternId}
            maskIdSuffix={`${sceneId}-${idx}`}
          />
        </g>
      ))}

      {renderGround()}
      {renderForeground()}

      <g transform={`translate(${SEGMENT_WIDTH},0)`}>
        {renderSceneElement()}
      </g>

      {particles.map((particle, i) => (
        <circle
          key={`particle-${i}`}
          cx={particle.x}
          cy={particle.y}
          r="0.75"
          fill={theme.pColor}
          opacity={particle.alpha}
          className={theme.pClass}
          style={{ animationDuration: `${particle.speed * 3}s`, animationDelay: `${particle.delay}s` }}
        />
      ))}
    </svg>
  );
};

export default ScenePixelArt;

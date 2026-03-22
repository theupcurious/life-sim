import { useMemo } from 'react';
import type { StoryNode } from '@/types/game';
import { getCityProfile } from '@/data/cityProfiles';

interface ScenePixelArtProps {
  node: StoryNode;
  birthplace: string;
}

type WindowPixel = {
  x: number;
  y: number;
  on: boolean;
};

type Building = {
  x: number;
  width: number;
  height: number;
  color: string;
  windows: WindowPixel[];
};

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

const ScenePixelArt: React.FC<ScenePixelArtProps> = ({ node, birthplace }) => {
  const profile = getCityProfile(birthplace);

  const { stars, buildings, particles } = useMemo(() => {
    const rng = mulberry32(hashString(`${birthplace}-${node.id}-${node.year}-${node.type}`));

    const generatedStars = Array.from({ length: 28 }, () => ({
      x: Math.floor(rng() * 96),
      y: Math.floor(rng() * 18),
      alpha: 0.35 + rng() * 0.65,
    }));

    const generatedBuildings: Building[] = [];
    let cursor = 0;
    while (cursor < 96) {
      const width = 4 + Math.floor(rng() * 8);
      const height = 12 + Math.floor(rng() * 23);
      const color = rng() > 0.5 ? profile.palette.skylineDark : profile.palette.skylineLight;
      const windows: WindowPixel[] = [];

      for (let wx = cursor + 1; wx < cursor + width - 1; wx += 2) {
        for (let wy = 46 - height + 2; wy < 45; wy += 2) {
          windows.push({ x: wx, y: wy, on: rng() > 0.7 });
        }
      }

      generatedBuildings.push({ x: cursor, width, height, color, windows });
      cursor += width + 1;
    }

    const generatedParticles = Array.from({ length: 18 }, () => ({
      x: Math.floor(rng() * 96),
      y: 28 + Math.floor(rng() * 20),
      alpha: 0.2 + rng() * 0.4,
    }));

    return { stars: generatedStars, buildings: generatedBuildings, particles: generatedParticles };
  }, [birthplace, node.id, node.type, node.year, profile.palette.skylineDark, profile.palette.skylineLight]);

  const renderLandmark = () => {
    const accent = profile.palette.accent;
    switch (profile.landmark) {
      case 'tokyo-tower':
        return (
          <g>
            <rect x="74" y="18" width="2" height="24" fill={accent} />
            <rect x="73" y="21" width="4" height="2" fill={accent} />
            <rect x="72" y="26" width="6" height="2" fill={accent} />
            <rect x="71" y="31" width="8" height="2" fill={accent} />
            <rect x="70" y="41" width="10" height="2" fill={accent} />
          </g>
        );
      case 'forbidden-city':
        return (
          <g>
            <rect x="62" y="33" width="26" height="9" fill={accent} />
            <rect x="58" y="30" width="34" height="2" fill={accent} />
            <rect x="67" y="28" width="16" height="2" fill={accent} />
          </g>
        );
      case 'pudong':
        return (
          <g>
            <rect x="70" y="14" width="3" height="28" fill={accent} />
            <rect x="67" y="20" width="2" height="22" fill={accent} />
            <rect x="74" y="24" width="3" height="18" fill={accent} />
            <rect x="69" y="12" width="5" height="2" fill={accent} />
          </g>
        );
      case 'liberty':
        return (
          <g>
            <rect x="70" y="36" width="10" height="6" fill={accent} />
            <rect x="74" y="24" width="3" height="12" fill={accent} />
            <rect x="77" y="22" width="2" height="2" fill={accent} />
          </g>
        );
      case 'golden-gate':
        return (
          <g>
            <rect x="56" y="29" width="2" height="13" fill={accent} />
            <rect x="79" y="29" width="2" height="13" fill={accent} />
            <rect x="52" y="35" width="33" height="2" fill={accent} />
            <rect x="58" y="31" width="1" height="5" fill={accent} />
            <rect x="62" y="32" width="1" height="4" fill={accent} />
            <rect x="66" y="33" width="1" height="3" fill={accent} />
            <rect x="70" y="33" width="1" height="3" fill={accent} />
            <rect x="74" y="32" width="1" height="4" fill={accent} />
            <rect x="78" y="31" width="1" height="5" fill={accent} />
          </g>
        );
      case 'cn-tower':
        return (
          <g>
            <rect x="73" y="14" width="2" height="28" fill={accent} />
            <rect x="71" y="24" width="6" height="3" fill={accent} />
            <rect x="72" y="12" width="4" height="2" fill={accent} />
          </g>
        );
      case 'marina-bay':
        return (
          <g>
            <rect x="63" y="24" width="5" height="18" fill={accent} />
            <rect x="70" y="22" width="5" height="20" fill={accent} />
            <rect x="77" y="24" width="5" height="18" fill={accent} />
            <rect x="61" y="21" width="23" height="2" fill={accent} />
          </g>
        );
      default:
        return null;
    }
  };

  const renderNodeGlyph = () => {
    if (node.type === 'decision') {
      return (
        <g>
          <rect x="8" y="33" width="2" height="9" fill={profile.palette.neon} />
          <rect x="10" y="33" width="4" height="2" fill={profile.palette.neon} />
          <rect x="12" y="31" width="4" height="2" fill={profile.palette.neon} />
          <rect x="10" y="35" width="4" height="2" fill={profile.palette.neon} />
        </g>
      );
    }
    if (node.type === 'start') {
      return (
        <g>
          <rect x="8" y="36" width="8" height="5" fill={profile.palette.neon} />
          <rect x="9" y="34" width="6" height="2" fill={profile.palette.neon} />
        </g>
      );
    }
    if (node.type === 'end') {
      return (
        <g>
          <rect x="10" y="35" width="4" height="6" fill={profile.palette.neon} />
          <rect x="11" y="33" width="2" height="2" fill={profile.palette.accent} />
        </g>
      );
    }
    return null;
  };

  return (
    <svg
      viewBox="0 0 96 54"
      className="w-full h-full"
      style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges' }}
      preserveAspectRatio="none"
      aria-label={`Pixel art scene for ${node.title ?? node.type}`}
    >
      <defs>
        <linearGradient id="scene-sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={profile.palette.skyTop} />
          <stop offset="100%" stopColor={profile.palette.skyBottom} />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="96" height="54" fill="url(#scene-sky)" />

      {stars.map((star, index) => (
        <rect key={`star-${index}`} x={star.x} y={star.y} width="1" height="1" fill="#ffffff" opacity={star.alpha} />
      ))}

      <rect x="0" y="42" width="96" height="12" fill="#0a0a0a" opacity="0.8" />

      {buildings.map((building, index) => (
        <g key={`building-${index}`}>
          <rect x={building.x} y={46 - building.height} width={building.width} height={building.height} fill={building.color} />
          {building.windows.map((windowPixel, winIndex) => (
            <rect
              key={`window-${index}-${winIndex}`}
              x={windowPixel.x}
              y={windowPixel.y}
              width="1"
              height="1"
              fill={windowPixel.on ? profile.palette.neon : '#000000'}
              opacity={windowPixel.on ? 0.9 : 0.3}
            />
          ))}
        </g>
      ))}

      {renderLandmark()}

      <g>
        <rect x="44" y="30" width="3" height="10" fill="#050505" />
        <rect x="43" y="29" width="5" height="2" fill="#050505" />
      </g>

      {particles.map((particle, index) => (
        <rect
          key={`particle-${index}`}
          x={particle.x}
          y={particle.y}
          width="1"
          height="1"
          fill={profile.palette.accent}
          opacity={particle.alpha}
        />
      ))}

      {renderNodeGlyph()}
    </svg>
  );
};

export default ScenePixelArt;


import React from 'react';
import type { SupportedCity } from '@/data/cityProfiles';

interface CitySkylineProps {
  city: SupportedCity | string;
  foregroundColor: string;
  backgroundColor: string;
  isNight: boolean;
}

const CitySkyline: React.FC<CitySkylineProps> = ({ city, foregroundColor, backgroundColor, isNight }) => {
  // We use paths scaled approximately to a 96x54 viewport where the ground sits around y=46.
  
  const renderBackgroundPaths = () => {
    switch (city) {
      case 'Tokyo':
        return (
          <g fill={backgroundColor}>
            {/* Mt Fuji in the deep background */}
            <path d="M10,46 L30,20 L35,20 L60,46 Z" opacity="0.5" />
            <path d="M25,25 L30,20 L35,20 L40,25 Z" fill="#ffffff" opacity={0.6} /> 
            {/* Background generic city blocks */}
            <path d="M5,46 L5,35 L12,35 L12,46 M60,46 L60,30 L68,30 L68,46 M80,46 L80,25 L92,25 L92,46" />
          </g>
        );
      case 'New York':
        return (
          <g fill={backgroundColor}>
            {/* Background blocks */}
            <path d="M2,46 L2,20 L12,20 L12,46 M20,46 L20,30 L30,30 L30,46 M40,46 L40,25 L50,25 L50,46 M75,46 L75,18 L85,18 L85,46" />
          </g>
        );
      case 'San Francisco':
        return (
          <g fill={backgroundColor}>
            {/* Golden Gate Bridge distant silhouette */}
            <path d="M5,46 L5,25 L7,25 L7,46 M30,46 L30,25 L32,25 L32,46" />
            <path d="M0,35 Q18,45 37,35" fill="none" stroke={backgroundColor} strokeWidth="1" />
            <path d="M0,36 Q18,46 37,36" fill="none" stroke={backgroundColor} strokeWidth="1" />
            {/* Distinct hills */}
            <path d="M0,46 Q20,35 45,46 Q70,30 96,46 Z" opacity="0.4" />
          </g>
        );
      case 'Toronto':
        return (
          <g fill={backgroundColor}>
            {/* Distant generic blocks */}
            <path d="M10,46 L10,30 L20,30 L20,46 M45,46 L45,20 L55,20 L55,46 M65,46 L65,35 L75,35 L75,46 M85,46 L85,25 L95,25 L95,46" />
          </g>
        );
      case 'Shanghai':
        return (
          <g fill={backgroundColor}>
            <path d="M5,46 L5,25 L15,25 L15,46 M80,46 L80,20 L90,20 L90,46 M25,46 L25,32 L35,32 L35,46" />
          </g>
        );
      case 'Singapore':
        return (
          <g fill={backgroundColor}>
            <path d="M10,46 L10,30 L25,30 L25,46 M70,46 L70,25 L85,25 L85,46" />
            {/* Super trees */}
            <path d="M5,46 L8,30 L2,25 L14,25 L8,30 Z M90,46 L87,35 L82,30 L92,30 L87,35 Z" />
          </g>
        );
      case 'Beijing':
        return (
          <g fill={backgroundColor}>
            {/* Temple/Pagoda silhouettes */}
            <path d="M5,46 L5,40 L3,40 L7,35 L11,40 L9,40 L9,46 Z" />
            <path d="M85,46 L85,38 L82,38 L87,32 L92,38 L89,38 L89,46 Z" />
            <path d="M30,46 L30,25 L40,25 L40,46 M60,46 L60,30 L70,30 L70,46" />
          </g>
        );
      default:
        // Generic fallback background blocks
        return (
          <g fill={backgroundColor}>
            <path d="M10,46 L10,30 L20,30 L20,46 M30,46 L30,20 L40,20 L40,46 M50,46 L50,35 L60,35 L60,46 M70,46 L70,25 L80,25 L80,46" />
          </g>
        );
    }
  };

  const renderForegroundPaths = () => {
    // Fill style includes twinkling windows in night mode using a standard pattern overlay in the parent component
    const fillProps = { fill: foregroundColor };

    switch (city) {
      case 'Tokyo':
        return (
          <g {...fillProps}>
            {/* Tokyo Tower (left-ish) */}
            <path d="M14,46 L18,20 L20,20 L24,46 Z" />
            <path d="M18,20 L19,5 L19,0 L20,5 L20,20 Z" />
            {/* Cocoon Tower */}
            <path d="M35,46 C35,25 40,5 40,5 C40,5 45,25 45,46 Z" />
            {/* Skytree (right-ish) */}
            <path d="M68,46 L71,15 L72,0 L73,15 L76,46 Z" />
            {/* Regular towers to fill gap */}
            <path d="M50,46 L50,22 L58,22 L58,46 M80,46 L80,30 L90,30 L90,46 M0,46 L0,28 L10,28 L10,46" />
          </g>
        );
      case 'New York':
        return (
          <g {...fillProps}>
            {/* One World Trade */}
            <path d="M10,46 L14,10 L18,46 Z" />
            <path d="M14,10 L14,0 L14,10 Z" stroke={foregroundColor} strokeWidth="0.5" />
            {/* Empire State */}
            <path d="M30,46 L30,18 L32,18 L32,12 L33,12 L33,6 L35,6 L35,12 L36,12 L36,18 L38,18 L38,46 Z" />
            <path d="M34,6 L34,0 L34,6 Z" stroke={foregroundColor} strokeWidth="0.5" />
            {/* Chrysler Building */}
            <path d="M56,46 L56,22 L58,15 L60,10 L62,15 L64,22 L64,46 Z" />
            <path d="M60,10 L60,0 L60,10 Z" stroke={foregroundColor} strokeWidth="0.5" />
            {/* Modern thin residential blocks (432 Park etc.) */}
            <path d="M76,46 L76,8 L80,8 L80,46 M86,46 L86,15 L92,15 L92,46" />
          </g>
        );
      case 'San Francisco':
        return (
          <g {...fillProps}>
            {/* Transamerica Pyramid */}
            <path d="M18,46 L24,12 L30,46 Z" />
            {/* Salesforce Tower */}
            <path d="M46,46 L46,20 C48,12 56,12 58,20 L58,46 Z" />
            {/* Millennium tower / generic blocks */}
            <path d="M68,46 L68,22 L76,22 L76,46 M34,46 L34,28 L42,28 L42,46 M2,46 L2,32 L12,32 L12,46 M80,46 L80,35 L92,35 L92,46" />
          </g>
        );
      case 'Toronto':
        return (
          <g {...fillProps}>
            {/* Rogers Centre Dome */}
            <path d="M10,46 A12,12 0 0,1 34,46 Z" />
            {/* CN Tower */}
            <path d="M42,46 L43,20 L42,20 L44,15 L45,0 L46,15 L48,20 L47,20 L48,46 Z" />
            {/* First Canadian Place */}
            <path d="M60,46 L60,12 L68,12 L68,46 Z" />
            <path d="M74,46 L74,20 L82,20 L82,46 M86,46 L86,30 L94,30 L94,46" />
          </g>
        );
      case 'Shanghai':
        return (
          <g {...fillProps}>
            {/* Oriental Pearl */}
            <path d="M15,46 L18,22 A4,4 0 1,0 26,22 L29,46 Z" />
            <path d="M22,22 L22,0 L22,22 Z" stroke={foregroundColor} strokeWidth="0.5" />
            <circle cx="22" cy="12" r="2" fill={foregroundColor} />
            {/* Shanghai Tower */}
            <path d="M42,46 C42,22 46,5 48,5 C50,5 54,22 54,46 Z" />
            {/* SWFC (Bottle Opener) */}
            <path d="M68,46 L68,10 L78,10 L78,46 Z M71,13 L75,13 L75,18 L71,18 Z" fillRule="evenodd" />
            <path d="M84,46 L84,30 L92,30 L92,46 M2,46 L2,35 L10,35 L10,46" />
          </g>
        );
      case 'Singapore':
        return (
          <g {...fillProps}>
            {/* Marina Bay Sands */}
            <path d="M30,46 L33,25 L37,25 L40,46 M44,46 L47,25 L51,25 L54,46 M58,46 L61,25 L65,25 L68,46" />
            {/* The boat roof */}
            <path d="M25,25 C49,18 73,25 73,25 L73,23 C49,16 25,23 25,23 Z" />
            {/* Generic tall buildings */}
            <path d="M10,46 L10,18 L20,18 L20,46 M80,46 L80,22 L88,22 L88,46 M2,46 L2,32 L7,32 L7,46" />
          </g>
        );
      case 'Beijing':
        return (
          <g {...fillProps}>
            {/* CCTV HQ */}
            <path d="M20,46 L25,20 L40,20 L40,28 L30,28 L27,46 Z" />
            <path d="M37,46 L37,20 L40,20 L40,46 Z" />
            {/* CITIC Tower (China Zun) */}
            <path d="M60,46 Q64,22 62,8 L68,8 Q66,22 70,46 Z" />
            {/* Other buildings */}
            <path d="M78,46 L78,25 L88,25 L88,46 M2,46 L2,30 L12,30 L12,46" />
          </g>
        );
      default:
        // Generic modern skyline fallback
        return (
          <g {...fillProps}>
            <path d="M5,46 L5,20 L15,20 L15,46 M20,46 L20,12 L28,12 L28,46 M35,46 L35,25 L45,25 L45,46 M50,46 L54,10 L58,46 M65,46 L65,15 L75,15 L75,46 M80,46 L80,30 L90,30 L90,46" />
          </g>
        );
    }
  };

  return (
    <g>
      {renderBackgroundPaths()}
      {/* 
        We use a mask to naturally apply the twinkle animation only inside the foreground shape 
      */}
      <mask id={`skyline-mask-${city}`}>
        <rect x="0" y="0" width="100" height="100" fill="black" />
        <g fill="white">
          {renderForegroundPaths()}
        </g>
      </mask>
      
      {/* Draw the solid shapes */}
      {renderForegroundPaths()}

      {/* Twinkle windows layer masked by the skyline shape */}
      {isNight && (
        <rect 
          x="0" 
          y="0" 
          width="96" 
          height="54" 
          fill="url(#night-windows-pattern)" 
          mask={`url(#skyline-mask-${city})`} 
          className="anim-twinkle-fast"
        />
      )}
    </g>
  );
};

export default CitySkyline;

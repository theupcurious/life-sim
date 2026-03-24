import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shuffle } from 'lucide-react';
import type { CharacterInput } from '@/types/game';
import { CITY_OPTIONS } from '@/data/cityProfiles';

interface CharacterCreationScreenProps {
  onCreate: (input: CharacterInput) => void;
  onRandom: () => void;
}

// Traits that cannot coexist — selecting one removes its opposite
const OPPOSITES: Record<string, string> = {
  shy: 'outgoing',
  outgoing: 'shy',
  cautious: 'adventurous',
  adventurous: 'cautious',
};

const personalityOptions = [
  { id: 'ambitious',   label: 'Ambitious',   icon: '🎯', unlock: 'Entrepreneur path' },
  { id: 'creative',    label: 'Creative',     icon: '🎨', unlock: 'Creative career path' },
  { id: 'shy',         label: 'Shy',          icon: '🌸' },
  { id: 'outgoing',    label: 'Outgoing',     icon: '🌟' },
  { id: 'cautious',    label: 'Cautious',     icon: '🛡️' },
  { id: 'adventurous', label: 'Adventurous',  icon: '🏔️', unlock: 'Later relationships' },
  { id: 'analytical',  label: 'Analytical',   icon: '🔍' },
  { id: 'empathetic',  label: 'Empathetic',   icon: '💝', unlock: 'Earlier relationships' },
] as const;

const dreamOptions = [
  { id: 'fame',      label: 'Fame & Recognition',  description: 'To be known and remembered' },
  { id: 'wealth',    label: 'Wealth & Success',     description: 'To live comfortably and provide' },
  { id: 'happiness', label: 'Happiness & Love',     description: 'To find joy in everyday moments' },
  { id: 'knowledge', label: 'Knowledge & Wisdom',   description: 'To understand the world deeply' },
  { id: 'freedom',   label: 'Freedom & Adventure',  description: 'To explore without boundaries' },
  { id: 'peace',     label: 'Peace & Harmony',      description: 'To live a calm, balanced life' },
];

const CharacterCreationScreen: React.FC<CharacterCreationScreenProps> = ({
  onCreate,
  onRandom,
}) => {
  const [step, setStep] = useState(1);
  const [input, setInput] = useState<CharacterInput>({
    name: '',
    gender: 'female',
    birthplace: 'Tokyo',
    birthYear: 2000,
    personalityTraits: [],
    childhoodDream: '',
  });

  const handlePersonalityToggle = (trait: string) => {
    setInput(prev => {
      if (prev.personalityTraits.includes(trait)) {
        // Deselect
        return { ...prev, personalityTraits: prev.personalityTraits.filter(t => t !== trait) };
      }
      // Remove the opposite if present, then add this trait (cap at 3)
      const opposite = OPPOSITES[trait];
      const without = opposite
        ? prev.personalityTraits.filter(t => t !== opposite)
        : prev.personalityTraits;
      return { ...prev, personalityTraits: [...without, trait].slice(0, 3) };
    });
  };

  const canProceed = () => {
    switch (step) {
      case 1: return input.name.trim().length > 0;
      case 2: return input.personalityTraits.length > 0;
      case 3: return input.childhoodDream !== '';
      default: return true;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-amber-400 mb-6">Who are you?</h2>

            {/* Name */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2 uppercase tracking-wider">Name</label>
              <input
                type="text"
                value={input.name}
                onChange={(e) => setInput(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter a name..."
                className="w-full bg-black/40 border border-white/20 px-4 py-3 text-white
                           placeholder-zinc-600 focus:border-amber-400 focus:outline-none focus:shadow-[0_0_15px_rgba(251,191,36,0.2)] transition-all backdrop-blur-sm"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2 uppercase tracking-wider">Gender</label>
              <div className="flex gap-3">
                {(['female', 'male', 'nonbinary'] as const).map(gender => (
                  <button
                    key={gender}
                    onClick={() => setInput(prev => ({ ...prev, gender }))}
                    className={`flex-1 py-3 border uppercase tracking-wider text-sm transition-all
                      ${input.gender === gender
                        ? 'border-amber-400 bg-amber-400/20 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                        : 'border-white/20 bg-white/5 text-zinc-400 hover:border-amber-400/60 hover:text-white backdrop-blur-sm'}`}
                  >
                    {gender}
                  </button>
                ))}
              </div>
            </div>

            {/* Birthplace */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2 uppercase tracking-wider">Birthplace</label>
              <select
                value={input.birthplace}
                onChange={(e) => setInput(prev => ({ ...prev, birthplace: e.target.value }))}
                className="w-full bg-black/40 border border-white/20 px-4 py-3 text-white
                           focus:border-amber-400 focus:outline-none focus:shadow-[0_0_15px_rgba(251,191,36,0.2)] appearance-none cursor-pointer backdrop-blur-sm transition-all"
              >
                {CITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* Birth Year */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2 uppercase tracking-wider">
                Birth Year: {input.birthYear}
              </label>
              <input
                type="range"
                min="1980"
                max="2010"
                value={input.birthYear}
                onChange={(e) => setInput(prev => ({ ...prev, birthYear: parseInt(e.target.value) }))}
                className="w-full accent-amber-400"
              />
              <div className="flex justify-between text-xs text-zinc-600 mt-1">
                <span>1980</span>
                <span>2010</span>
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-5"
          >
            <div>
              <h2 className="text-2xl font-bold text-amber-400 mb-1">What defines you?</h2>
              <p className="text-zinc-500 text-xs leading-relaxed">
                Select up to 3 traits. These shape your career options, relationship timing, and how your story unfolds. Opposite traits cannot be combined.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {personalityOptions.map(option => {
                const isSelected = input.personalityTraits.includes(option.id);
                const oppositeId = OPPOSITES[option.id];
                const isBlocked = !!oppositeId && input.personalityTraits.includes(oppositeId);
                const oppositeLabel = oppositeId
                  ? personalityOptions.find(p => p.id === oppositeId)?.label
                  : null;

                return (
                  <button
                    key={option.id}
                    onClick={() => handlePersonalityToggle(option.id)}
                    disabled={isBlocked}
                    className={`p-3 border text-left transition-all relative backdrop-blur-sm ${
                      isSelected
                        ? 'border-amber-400 bg-amber-400/20 shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                        : isBlocked
                          ? 'border-white/10 opacity-35 cursor-not-allowed bg-black/20'
                          : 'border-white/20 bg-white/5 hover:border-amber-400/70 hover:bg-amber-400/5'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{option.icon}</span>
                      <span className={`text-sm font-medium ${isSelected ? 'text-amber-400' : isBlocked ? 'text-zinc-600' : 'text-zinc-300'}`}>
                        {option.label}
                      </span>
                    </div>
                    {'unlock' in option && option.unlock && !isBlocked && (
                      <div className="text-[10px] text-amber-600 uppercase tracking-wide mt-0.5">
                        ↳ {option.unlock}
                      </div>
                    )}
                    {isBlocked && oppositeLabel && (
                      <div className="text-[10px] text-zinc-600 mt-0.5">
                        Conflicts with {oppositeLabel}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="text-center text-sm text-zinc-500">
              Selected: {input.personalityTraits.length}/3
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-5"
          >
            <div>
              <h2 className="text-2xl font-bold text-amber-400 mb-1">What did you dream of?</h2>
              <p className="text-zinc-500 text-xs leading-relaxed">
                As a child, what did you want most? Your dream shapes your story's direction and when you seek commitment.
              </p>
            </div>

            <div className="space-y-2">
              {dreamOptions.map(dream => (
                <button
                  key={dream.id}
                  onClick={() => setInput(prev => ({ ...prev, childhoodDream: dream.id }))}
                  className={`w-full p-3 border text-left transition-all backdrop-blur-sm
                    ${input.childhoodDream === dream.id
                      ? 'border-amber-400 bg-amber-400/20 shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                      : 'border-white/20 bg-white/5 hover:border-amber-400/70 hover:bg-amber-400/5'}`}
                >
                  <div className={input.childhoodDream === dream.id ? 'text-amber-400 font-bold text-sm' : 'text-white text-sm'}>
                    {dream.label}
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    {dream.description}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-amber-400 mb-6">Ready to begin?</h2>

            <div className="glass-panel p-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-zinc-400">Name</span>
                <span className="text-white">{input.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Gender</span>
                <span className="text-white capitalize">{input.gender}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Born</span>
                <span className="text-white">{input.birthYear} in {input.birthplace}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Personality</span>
                <span className="text-white text-right">
                  {input.personalityTraits.map(t =>
                    personalityOptions.find(p => p.id === t)?.label
                  ).join(', ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Childhood Dream</span>
                <span className="text-white text-right">
                  {dreamOptions.find(d => d.id === input.childhoodDream)?.label}
                </span>
              </div>
            </div>

            <p className="text-zinc-500 text-sm text-center">
              Your choices will shape a unique life path.
            </p>
          </motion.div>
        );
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-black px-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] md:p-6">
      {/* Background Mesh */}
      <div className="absolute inset-0 mesh-bg opacity-40 pointer-events-none">
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mx-auto flex h-full w-full max-w-xl flex-col"
      >
        {/* Header */}
        <div className="shrink-0 text-center mb-5 md:mb-8">
          <h1 className="text-3xl font-bold tracking-widest mb-2">
            <span className="text-white">CREATE </span>
            <span className="text-amber-400">LIFE</span>
          </h1>
          <p className="text-zinc-500 text-sm">Design your character's beginning</p>
        </div>

        {/* Progress Bar */}
        <div className="shrink-0 flex gap-2 mb-5 md:mb-8">
          {[1, 2, 3, 4].map(s => (
            <div
              key={s}
              className={`flex-1 h-1 transition-all ${s <= step ? 'bg-amber-400' : 'bg-zinc-800'}`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto glass-panel p-5 md:p-8">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="shrink-0 pt-4 md:pt-6">
          <div className="flex gap-4">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-3 border border-white/30 text-white hover:border-white/60 transition-all"
            >
              Back
            </button>
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="flex-1 game-button disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={() => onCreate(input)}
              className="flex-1 game-button border-amber-400 text-amber-400"
            >
              Begin Life Journey
            </button>
          )}
          </div>

          {/* Random Character — prominent button */}
          <button
            onClick={onRandom}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3 border border-white/20
                       text-zinc-400 text-sm uppercase tracking-widest
                       hover:border-amber-400 hover:text-amber-400 transition-all"
          >
            <Shuffle className="w-4 h-4" />
            Generate Random Character
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default CharacterCreationScreen;

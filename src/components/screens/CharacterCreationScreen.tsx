import { useState } from 'react';
import { motion } from 'framer-motion';
import type { CharacterInput } from '@/types/game';
import { CITY_OPTIONS } from '@/data/cityProfiles';

interface CharacterCreationScreenProps {
  onCreate: (input: CharacterInput) => void;
  onRandom: () => void;
}

const personalityOptions = [
  { id: 'ambitious', label: 'Ambitious', icon: '🎯' },
  { id: 'creative', label: 'Creative', icon: '🎨' },
  { id: 'shy', label: 'Shy', icon: '🌸' },
  { id: 'outgoing', label: 'Outgoing', icon: '🌟' },
  { id: 'cautious', label: 'Cautious', icon: '🛡️' },
  { id: 'adventurous', label: 'Adventurous', icon: '🏔️' },
  { id: 'analytical', label: 'Analytical', icon: '🔍' },
  { id: 'empathetic', label: 'Empathetic', icon: '💝' },
];

const dreamOptions = [
  { id: 'fame', label: 'Fame & Recognition', description: 'To be known and remembered' },
  { id: 'wealth', label: 'Wealth & Success', description: 'To live comfortably and provide' },
  { id: 'happiness', label: 'Happiness & Love', description: 'To find joy in everyday moments' },
  { id: 'knowledge', label: 'Knowledge & Wisdom', description: 'To understand the world deeply' },
  { id: 'freedom', label: 'Freedom & Adventure', description: 'To explore without boundaries' },
  { id: 'peace', label: 'Peace & Harmony', description: 'To live a calm, balanced life' },
];

const CharacterCreationScreen: React.FC<CharacterCreationScreenProps> = ({ 
  onCreate, 
  onRandom 
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
      const traits = prev.personalityTraits.includes(trait)
        ? prev.personalityTraits.filter(t => t !== trait)
        : [...prev.personalityTraits, trait].slice(0, 3);
      return { ...prev, personalityTraits: traits };
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
            
            {/* Name Input */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2 uppercase tracking-wider">Name</label>
              <input
                type="text"
                value={input.name}
                onChange={(e) => setInput(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter a name..."
                className="w-full bg-zinc-900 border border-white/30 px-4 py-3 text-white 
                         placeholder-zinc-600 focus:border-amber-400 focus:outline-none
                         transition-colors"
              />
            </div>

            {/* Gender Selection */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2 uppercase tracking-wider">Gender</label>
              <div className="flex gap-3">
                {(['female', 'male', 'nonbinary'] as const).map(gender => (
                  <button
                    key={gender}
                    onClick={() => setInput(prev => ({ ...prev, gender }))}
                    className={`flex-1 py-3 border uppercase tracking-wider text-sm
                              ${input.gender === gender 
                                ? 'border-amber-400 bg-amber-400/20 text-amber-400' 
                                : 'border-white/30 text-zinc-400 hover:border-white/60'}`}
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
                className="w-full bg-zinc-900 border border-white/30 px-4 py-3 text-white
                         focus:border-amber-400 focus:outline-none appearance-none cursor-pointer"
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
                className="w-full accent-cyan-400"
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
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-amber-400 mb-6">What defines you?</h2>
            <p className="text-zinc-400 text-sm mb-4">Select up to 3 personality traits</p>
            
            <div className="grid grid-cols-2 gap-3">
              {personalityOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => handlePersonalityToggle(option.id)}
                  className={`p-4 border text-left transition-all
                    ${input.personalityTraits.includes(option.id)
                      ? 'border-amber-400 bg-amber-400/10'
                      : 'border-white/30 hover:border-white/60'}`}
                >
                  <span className="text-2xl mr-3">{option.icon}</span>
                  <span className={input.personalityTraits.includes(option.id) ? 'text-amber-400' : 'text-zinc-400'}>
                    {option.label}
                  </span>
                </button>
              ))}
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
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-amber-400 mb-6">What did you dream of?</h2>
            <p className="text-zinc-400 text-sm mb-4">As a child, what did you want most?</p>
            
            <div className="space-y-2">
              {dreamOptions.map(dream => (
                <button
                  key={dream.id}
                  onClick={() => setInput(prev => ({ ...prev, childhoodDream: dream.id }))}
                  className={`w-full p-3 border text-left transition-all
                    ${input.childhoodDream === dream.id
                      ? 'border-amber-400 bg-amber-400/10'
                      : 'border-white/30 hover:border-white/60'}`}
                >
                  <div className={input.childhoodDream === dream.id ? 'text-amber-400 font-bold' : 'text-white'}>
                    {dream.label}
                  </div>
                  <div className="text-sm text-zinc-500 mt-1">
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
            
            <div className="border border-white/30 bg-zinc-900/50 p-6 space-y-4">
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
    <div className="fixed inset-0 bg-black flex items-start md:items-center justify-center p-4 md:p-6 overflow-y-auto">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 255, 255, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 255, 255, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-xl my-4"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-widest mb-2">
            <span className="text-white">CREATE </span>
            <span className="text-amber-400">LIFE</span>
          </h1>
          <p className="text-zinc-500 text-sm">Design your character's beginning</p>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map(s => (
            <div
              key={s}
              className={`flex-1 h-1 ${
                s <= step ? 'bg-amber-400' : 'bg-zinc-800'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="border border-white/30 bg-black/80 p-5 md:p-8 mb-4 md:mb-6">
          {renderStep()}
        </div>

        {/* Navigation */}
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

        {/* Random Button */}
        <div className="mt-6 text-center">
          <button
            onClick={onRandom}
            className="text-zinc-500 hover:text-amber-400 text-sm transition-colors"
          >
            Or generate a random character →
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default CharacterCreationScreen;

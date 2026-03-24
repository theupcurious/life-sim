import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Character, StoryNode } from '@/types/game';
import { Heart, Coins, Smile } from 'lucide-react';
import ScenePixelArt from './ScenePixelArt';

interface InfoPanelProps {
  character: Character;
  currentNode: StoryNode | undefined;
  onChoice: (choiceId: string) => void;
  onNext: () => void;
  onRelive: () => void;
  isReliveMode: boolean;
  gameEnded: boolean;
}

function lifeStageLabel(age: number, occupation: string): string {
  if (occupation && occupation !== 'Newborn') return occupation;
  if (age < 2)  return 'Newborn';
  if (age < 6)  return 'Child';
  if (age < 13) return 'Kid';
  if (age < 18) return 'Teenager';
  if (age < 22) return 'Young Adult';
  return 'Finding Their Way';
}

// Typewriter effect component
const TypewriterText: React.FC<{ text: string; speed?: number }> = ({ text, speed = 25 }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);
    let index = 0;
    
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        setIsComplete(true);
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <span>
      {displayedText}
      {!isComplete && <span className="animate-pulse">|</span>}
    </span>
  );
};

const InfoPanel: React.FC<InfoPanelProps> = ({
  character,
  currentNode,
  onChoice,
  onNext,
  onRelive,
  isReliveMode,
  gameEnded,
}) => {
  const [revealedChoiceNodeId, setRevealedChoiceNodeId] = useState<string | null>(null);

  useEffect(() => {
    // Show choices after a delay if this is a decision node
    if (currentNode?.type === 'decision' && currentNode.choices) {
      const nodeId = currentNode.id;
      const timer = setTimeout(() => {
        setRevealedChoiceNodeId(nodeId);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [currentNode]);

  const renderHearts = () => {
    return Array(5).fill(0).map((_, i) => (
      <Heart
        key={i}
        className={`w-4 h-4 ${
          i < character.health 
            ? 'text-red-400 fill-red-400' 
            : 'text-zinc-700'
        }`}
      />
    ));
  };

  const renderMoney = () => {
    return Array(5).fill(0).map((_, i) => (
      <Coins
        key={i}
        className={`w-4 h-4 ${
          i < character.money 
            ? 'text-yellow-400' 
            : 'text-zinc-700'
        }`}
      />
    ));
  };

  const renderHappiness = () => {
    return Array(5).fill(0).map((_, i) => (
      <Smile
        key={i}
        className={`w-4 h-4 ${
          i < character.happiness 
            ? 'text-amber-400' 
            : 'text-zinc-700'
        }`}
      />
    ));
  };

  const handleChoiceClick = (choiceId: string) => {
    setRevealedChoiceNodeId(null);
    onChoice(choiceId);
  };

  if (!currentNode) {
    return (
      <div className="info-panel h-full flex items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  const agePercent = Math.min(100, (character.age / 90) * 100);
  const showChoices = currentNode.type === 'decision'
    && !!currentNode.choices
    && revealedChoiceNodeId === currentNode.id;

  return (
    <div className="info-panel h-full flex flex-col overflow-hidden">
      {/* Header - Character Info */}
      <div className="border-b border-white/20 pb-2 mb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold tracking-[0.18em] leading-tight uppercase text-zinc-100 md:text-base">{character.name}</h2>
            <p className="text-[11px] text-zinc-400">{lifeStageLabel(character.age, character.occupation)}</p>
          </div>
          <div className="text-right text-[11px] text-zinc-400">
            <p className="text-sm font-bold leading-tight text-zinc-100 md:text-base">{character.age} yrs</p>
            <p>{character.location}</p>
          </div>
        </div>

        {/* Age timeline bar */}
        <div className="mt-2">
          <div className="mb-1 flex items-center justify-between text-[9px] uppercase tracking-[0.22em] text-zinc-600">
            <span>Birth</span>
            <span>Age {character.age}</span>
          </div>
          <div className="relative w-full h-1 bg-zinc-800">
            <div
              className="absolute left-0 top-0 h-full bg-amber-400 transition-all duration-700"
              style={{ width: `${agePercent}%` }}
            />
            {[20, 40, 60, 80].map(tick => (
              <div
                key={tick}
                className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-zinc-600"
                style={{ left: `${(tick / 90) * 100}%` }}
              />
            ))}
          </div>
        </div>
        
        {/* Stats */}
        <div className="mt-2 flex gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-zinc-500 mr-0.5 uppercase">Health</span>
            {renderHearts()}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-zinc-500 mr-0.5 uppercase">Wealth</span>
            {renderMoney()}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-zinc-500 mr-0.5 uppercase">Happy</span>
            {renderHappiness()}
          </div>
        </div>

        {/* Personality Tags */}
        {character.personality.length > 0 && (
          <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
            {character.personality.join(' • ')}
          </p>
        )}
      </div>

      {/* Scene Image */}
      <div
        className="shrink-0 mb-2 flex w-full justify-center overflow-hidden border border-white/40 bg-zinc-900"
        style={{ minHeight: '96px', height: 'clamp(96px, 16vh, 168px)' }}
      >
        <ScenePixelArt node={currentNode} birthplace={character.birthplace} />
      </div>

      <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.22em]">
        <span className="text-zinc-500">{currentNode.year}</span>
        {currentNode.category && (
          <span className="text-amber-400">{currentNode.category}</span>
        )}
      </div>

      {/* Story + Actions */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentNode.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {currentNode.title && (
                <h3 className="mb-1 text-base font-bold text-amber-400 md:text-lg">
                  {currentNode.title}
                </h3>
              )}
              <p className="text-[15px] leading-[1.7] text-zinc-200 md:text-base">
                <TypewriterText text={currentNode.description} />
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Choices */}
        {currentNode.type === 'decision' && currentNode.choices && showChoices && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-3 space-y-2 shrink-0"
          >
            <p className="text-xs uppercase tracking-widest text-zinc-500">
              Choose your path:
            </p>
            {currentNode.choices.map((choice, index) => {
              const req = choice.requires;
              const locked = req && (
                (req.money !== undefined && character.money < req.money) ||
                (req.health !== undefined && character.health < req.health) ||
                (req.happiness !== undefined && character.happiness < req.happiness)
              );
              const lockReason = locked
                ? `Requires ${req!.money !== undefined && character.money < req!.money ? `Wealth ≥ ${req!.money}` : req!.health !== undefined && character.health < req!.health ? `Health ≥ ${req!.health}` : `Happiness ≥ ${req!.happiness}`}`
                : null;

              return (
              <motion.button
                key={choice.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.08 }}
                onClick={() => !locked && handleChoiceClick(choice.id)}
                disabled={!!locked}
                className={`choice-button text-left p-3 ${locked ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-amber-400 font-bold mt-0.5">{String.fromCharCode(65 + index)}.</span>
                  <div>
                    <div className="text-white font-medium">{choice.text}</div>
                    {choice.description && (
                      <div className="text-xs text-zinc-500 mt-1">{choice.description}</div>
                    )}
                    {/* Effects + lock */}
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {lockReason && (
                        <span className="text-[10px] text-zinc-500">🔒 {lockReason}</span>
                      )}
                      {!locked && choice.effects.health !== undefined && (
                        <span className={`text-[10px] ${choice.effects.health > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          Health {choice.effects.health > 0 ? '+' : ''}{choice.effects.health}
                        </span>
                      )}
                      {!locked && choice.effects.money !== undefined && (
                        <span className={`text-[10px] ${choice.effects.money > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                          Wealth {choice.effects.money > 0 ? '+' : ''}{choice.effects.money}
                        </span>
                      )}
                      {!locked && choice.effects.happiness !== undefined && (
                        <span className={`text-[10px] ${choice.effects.happiness > 0 ? 'text-amber-400' : 'text-red-400'}`}>
                          Happy {choice.effects.happiness > 0 ? '+' : ''}{choice.effects.happiness}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.button>
              );
            })}
          </motion.div>
        )}

        {/* Next Button for non-decision nodes */}
        {currentNode.type !== 'decision' && !gameEnded && !isReliveMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-3 shrink-0"
          >
            <button
              onClick={onNext}
              className="game-button w-full"
            >
              Continue →
            </button>
          </motion.div>
        )}

        {/* Game End / Relive Button */}
        {gameEnded && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-3 space-y-3 shrink-0"
          >
            <div className="text-center py-4 border border-amber-400/50 bg-amber-400/10">
              <p className="text-amber-400 uppercase tracking-widest text-sm mb-2">
                Life Complete
              </p>
              <p className="text-xs text-zinc-400">
                Age at passing: {character.age}
              </p>
            </div>
            <button
              onClick={onRelive}
              className="game-button w-full border-amber-400 text-amber-400"
            >
              Where to Relive?
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default InfoPanel;

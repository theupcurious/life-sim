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
  const [showChoices, setShowChoices] = useState(false);

  useEffect(() => {
    // Show choices after a delay if this is a decision node
    if (currentNode?.type === 'decision' && currentNode.choices) {
      const timer = setTimeout(() => {
        setShowChoices(true);
      }, 600);
      return () => clearTimeout(timer);
    } else {
      setShowChoices(false);
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
            ? 'text-cyan-400' 
            : 'text-zinc-700'
        }`}
      />
    ));
  };

  const handleChoiceClick = (choiceId: string) => {
    setShowChoices(false);
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

  return (
    <div className="info-panel h-full flex flex-col overflow-hidden">
      {/* Header - Character Info */}
      <div className="border-b border-white/20 pb-3 mb-3">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h2 className="text-xl font-bold tracking-wider">{character.name}</h2>
            <p className="text-sm text-zinc-400">{character.occupation}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">{character.age} yrs</p>
            <p className="text-sm text-zinc-400">{character.location}</p>
          </div>
        </div>

        {/* Age timeline bar */}
        <div className="mt-2 mb-1">
          <div className="relative w-full h-1 bg-zinc-800">
            <div
              className="absolute left-0 top-0 h-full bg-cyan-400 transition-all duration-700"
              style={{ width: `${agePercent}%` }}
            />
            {[20, 40, 60, 80].map(tick => (
              <div
                key={tick}
                className="absolute top-0 w-px h-2 -translate-y-0.5 bg-zinc-600"
                style={{ left: `${(tick / 90) * 100}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between text-[9px] text-zinc-700 mt-1">
            <span>birth</span>
            <span>20</span>
            <span>40</span>
            <span>60</span>
            <span>80</span>
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex gap-4 mt-3 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-zinc-500 mr-1 uppercase">Health</span>
            {renderHearts()}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-zinc-500 mr-1 uppercase">Wealth</span>
            {renderMoney()}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-zinc-500 mr-1 uppercase">Happy</span>
            {renderHappiness()}
          </div>
        </div>

        {/* Personality Tags */}
        {character.personality.length > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {character.personality.map(trait => (
              <span 
                key={trait}
                className="text-[10px] px-2 py-1 border border-white/20 text-zinc-400 uppercase"
              >
                {trait}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Scene Image */}
      <div className="pixel-art-container w-full h-36 md:h-44 mb-3 bg-zinc-900 flex items-center justify-center border-2 border-white/70">
        <ScenePixelArt node={currentNode} birthplace={character.birthplace} />
      </div>

      <div className="flex items-center justify-between mb-3 text-[10px] uppercase tracking-wider">
        <span className="text-zinc-500">{currentNode.year}</span>
        {currentNode.category && (
          <span className="text-cyan-400">{currentNode.category}</span>
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
                <h3 className="text-lg font-bold mb-2 text-cyan-400">
                  {currentNode.title}
                </h3>
              )}
              <p className="text-base md:text-[15px] leading-relaxed text-zinc-200">
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
                  <span className="text-cyan-400 font-bold mt-0.5">{String.fromCharCode(65 + index)}.</span>
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
                        <span className={`text-[10px] ${choice.effects.happiness > 0 ? 'text-cyan-400' : 'text-red-400'}`}>
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
            <div className="text-center py-4 border border-cyan-400/50 bg-cyan-400/10">
              <p className="text-cyan-400 uppercase tracking-widest text-sm mb-2">
                Life Complete
              </p>
              <p className="text-xs text-zinc-400">
                Age at passing: {character.age}
              </p>
            </div>
            <button
              onClick={onRelive}
              className="game-button w-full border-cyan-400 text-cyan-400"
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

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Character, StoryNode } from '@/types/game';
import { Heart, Coins, Smile, ChevronDown, ChevronUp } from 'lucide-react';
import ScenePixelArt from './ScenePixelArt';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';

interface InfoPanelProps {
  character: Character;
  currentNode: StoryNode | undefined;
  causalityState?: unknown;
  showCausality: boolean;
  onToggleCausality: () => void;
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

const ARC_KEYS = [
  'educationArc',
  'careerArc',
  'relationshipArc',
  'familyArc',
  'healthArc',
  'mobilityArc',
] as const;

function prettifyTraceToken(value: string): string {
  return value
    .replace(/^trait:/, '')
    .replace(/^city:/, '')
    .replace(/^dream:/, '')
    .replace(/^skill:/, '')
    .replace(/-/g, ' ');
}

function getCausalitySnapshot(causalityState: unknown) {
  const state = (causalityState && typeof causalityState === 'object')
    ? causalityState as Record<string, unknown>
    : {};

  const arcs = ARC_KEYS
    .map((key) => state[key])
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .slice(0, 4);

  const tags = Array.isArray(state.tags)
    ? state.tags.filter((tag): tag is string => typeof tag === 'string').slice(-6).reverse()
    : [];

  const queuedConsequences = Array.isArray(state.delayedConsequences)
    ? state.delayedConsequences.length
    : 0;

  const resolvedConsequences = Array.isArray(state.resolvedConsequences)
    ? state.resolvedConsequences.length
    : 0;

  return { arcs, tags, queuedConsequences, resolvedConsequences };
}

const InfoPanel: React.FC<InfoPanelProps> = ({
  character,
  currentNode,
  causalityState,
  showCausality,
  onToggleCausality,
  onChoice,
  onNext,
  onRelive,
  isReliveMode,
  gameEnded,
}) => {
  const [revealedChoiceNodeId, setRevealedChoiceNodeId] = useState<string | null>(null);
  const [mobileChoicesNodeId, setMobileChoicesNodeId] = useState<string | null>(null);

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
    setMobileChoicesNodeId(null);
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
  const isDecisionNode = currentNode.type === 'decision' && !!currentNode.choices;
  const {
    arcs,
    tags,
    queuedConsequences,
    resolvedConsequences,
  } = getCausalitySnapshot(causalityState);
  const tracePill = arcs[0] ?? tags[0] ?? currentNode.category;
  const isMobileChoicesOpen = mobileChoicesNodeId === currentNode.id;
  const sceneHeight = isDecisionNode
    ? 'clamp(72px, 12vh, 120px)'
    : 'clamp(96px, 16vh, 168px)';

  const renderedChoices = showChoices && currentNode.choices
    ? currentNode.choices.map((choice, index) => {
        const req = choice.requires;
        const locked = req && (
          (req.money !== undefined && character.money < req.money) ||
          (req.health !== undefined && character.health < req.health) ||
          (req.happiness !== undefined && character.happiness < req.happiness)
        );
        const lockReason = locked
          ? `Requires ${req!.money !== undefined && character.money < req!.money ? `Wealth ${req!.money}+` : req!.health !== undefined && character.health < req!.health ? `Health ${req!.health}+` : `Happiness ${req!.happiness}+`}`
          : null;

        return (
          <motion.button
            key={choice.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.22 + index * 0.05 }}
            onClick={() => !locked && handleChoiceClick(choice.id)}
            disabled={!!locked}
            className={`choice-button text-left ${locked ? 'cursor-not-allowed opacity-40' : ''}`}
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 shrink-0 text-sm font-bold text-amber-400">
                {String.fromCharCode(65 + index)}.
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-base font-medium leading-tight text-white">
                  {choice.text}
                </div>
                {choice.description && (
                  <div className="mt-1 text-[11px] leading-5 text-zinc-500 sm:text-xs">
                    {choice.description}
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {lockReason && (
                    <span className="border border-white/10 bg-black/30 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                      {lockReason}
                    </span>
                  )}
                  {!locked && choice.effects.health !== undefined && (
                    <span className={`border px-2 py-1 text-[10px] uppercase tracking-[0.16em] ${choice.effects.health > 0 ? 'border-green-400/30 bg-green-400/10 text-green-300' : 'border-red-400/25 bg-red-500/10 text-red-300'}`}>
                      Health {choice.effects.health > 0 ? '+' : ''}{choice.effects.health}
                    </span>
                  )}
                  {!locked && choice.effects.money !== undefined && (
                    <span className={`border px-2 py-1 text-[10px] uppercase tracking-[0.16em] ${choice.effects.money > 0 ? 'border-amber-400/35 bg-amber-400/10 text-amber-300' : 'border-red-400/25 bg-red-500/10 text-red-300'}`}>
                      Wealth {choice.effects.money > 0 ? '+' : ''}{choice.effects.money}
                    </span>
                  )}
                  {!locked && choice.effects.happiness !== undefined && (
                    <span className={`border px-2 py-1 text-[10px] uppercase tracking-[0.16em] ${choice.effects.happiness > 0 ? 'border-orange-300/35 bg-orange-300/10 text-orange-200' : 'border-red-400/25 bg-red-500/10 text-red-300'}`}>
                      Happy {choice.effects.happiness > 0 ? '+' : ''}{choice.effects.happiness}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.button>
        );
      })
    : null;
  const choiceCount = currentNode.choices?.length ?? 0;

  return (
    <div className="info-panel h-full flex flex-col overflow-hidden">
      {/* Header - Character Info */}
      <div className="border-b border-white/20 pb-2 mb-2">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-bold tracking-[0.18em] leading-tight uppercase text-zinc-100 md:text-base">{character.name}</h2>
            <p className="text-[11px] text-zinc-400">{lifeStageLabel(character.age, character.occupation)}</p>
          </div>
          <div className="pt-0.5 text-center">
            <div className="inline-flex items-center justify-center border border-white/30 bg-white/5 px-3 py-1 text-[12px] font-bold tracking-[0.24em] text-white md:text-[13px]">
              {currentNode.year}
            </div>
          </div>
          <div className="text-right text-[11px] text-zinc-400">
            <p className="text-sm font-bold leading-tight text-zinc-100 md:text-base">{character.age} yrs</p>
            <p>{character.location}</p>
          </div>
        </div>

        {/* Age timeline bar */}
        <div className={`mt-2 ${isDecisionNode ? 'hidden sm:block' : ''}`}>
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
        <div className="mt-2 flex flex-wrap gap-3">
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
          <p className={`mt-2 text-[10px] uppercase tracking-[0.18em] text-zinc-500 ${isDecisionNode ? 'hidden sm:block' : ''}`}>
            {character.personality.join(' • ')}
          </p>
        )}
      </div>

      {/* Scene Image */}
      <div
        className={`shrink-0 mb-2 w-full justify-center overflow-hidden border border-white/40 bg-zinc-900 ${isDecisionNode ? 'hidden sm:flex' : 'flex'}`}
        style={{ minHeight: isDecisionNode ? '72px' : '96px', height: sceneHeight }}
      >
        <ScenePixelArt node={currentNode} birthplace={character.birthplace} />
      </div>

      <div className="mb-2 flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.22em]">
        <div className="flex min-w-0 items-center gap-3">
          {currentNode.category && (
            <span className="shrink-0 text-amber-400">{currentNode.category}</span>
          )}
          <span className="truncate text-zinc-600">{prettifyTraceToken(tracePill)}</span>
        </div>
        <button
          onClick={onToggleCausality}
          className="inline-flex shrink-0 items-center gap-1 border border-white/15 bg-white/5 backdrop-blur-sm px-2 py-1 text-[9px] tracking-[0.24em] text-zinc-400 transition-all hover:border-amber-400/60 hover:text-amber-300 hover:shadow-[0_0_10px_rgba(251,191,36,0.2)]"
        >
          Trace
          {showCausality ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {showCausality && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mb-2 shrink-0 border border-amber-400/30 bg-amber-400/10 backdrop-blur-md shadow-[inset_0_0_15px_rgba(251,191,36,0.1)] px-3 py-2"
        >
          <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] uppercase tracking-[0.24em] text-zinc-500">
            <span>Why This Branch</span>
            <span className="text-zinc-600">Queued {queuedConsequences}</span>
            <span className="text-zinc-600">Resolved {resolvedConsequences}</span>
          </div>
          <p className="text-[11px] leading-5 text-zinc-300">
            This {currentNode.category} branch is currently being pulled by{' '}
            <span className="text-amber-300">{prettifyTraceToken(tracePill)}</span>
            {tags.length > 1 ? ` and ${prettifyTraceToken(tags[1])}` : ''}.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {arcs.map((arc) => (
              <span
                key={arc}
                className="border border-amber-400/40 bg-amber-400/10 shadow-[0_0_10px_rgba(251,191,36,0.15)] px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-amber-200"
              >
                {prettifyTraceToken(arc)}
              </span>
            ))}
            {arcs.length === 0 && (
              <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                No persistent arcs yet
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags.slice(0, 5).map((tag) => (
              <span
                key={tag}
                className="border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-zinc-400"
              >
                {prettifyTraceToken(tag)}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Story + Actions */}
      <div className="flex-1 min-h-0 flex flex-col">
        {isDecisionNode ? (
          <div className="mt-1 flex min-h-0 flex-1 flex-col gap-3 overflow-hidden lg:grid lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:gap-4">
            <div className="min-h-0 overflow-y-auto border border-white/10 bg-black/40 backdrop-blur-md px-3 py-3 lg:px-4 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
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
                  <p className="text-[14px] leading-[1.7] text-zinc-200 md:text-[15px]">
                    <TypewriterText text={currentNode.description} />
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {showChoices && (
              <div className="shrink-0 lg:hidden">
                <button
                  onClick={() => setMobileChoicesNodeId(currentNode.id)}
                  className="game-button w-full border-amber-400 text-amber-300"
                >
                  View {choiceCount} Choices
                </button>
              </div>
            )}

            {showChoices && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
                className="hidden min-h-0 overflow-y-auto border border-white/10 bg-black/40 backdrop-blur-md shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] px-2 py-2 sm:px-3 lg:block"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">
                    Choose your path
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">
                    {choiceCount} options
                  </p>
                </div>
                <div className="space-y-2.5">
                  {renderedChoices}
                </div>
              </motion.div>
            )}

            <Drawer
              open={isMobileChoicesOpen}
              onOpenChange={(open) => setMobileChoicesNodeId(open ? currentNode.id : null)}
            >
              <DrawerContent className="max-h-[88svh] border-white/15 bg-black text-white lg:hidden">
                <DrawerHeader className="border-b border-white/10 px-4 pb-3 pt-4 text-left">
                  <DrawerTitle className="text-sm uppercase tracking-[0.24em] text-zinc-100">
                    Choose Your Path
                  </DrawerTitle>
                  <DrawerDescription className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    {choiceCount} options for {currentNode.year}
                  </DrawerDescription>
                </DrawerHeader>
                <div className="overflow-y-auto px-3 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-3">
                  <div className="space-y-2.5">
                    {renderedChoices}
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        ) : (
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
            <div className="text-center py-4 border border-amber-400/50 bg-amber-400/10 backdrop-blur-sm shadow-[0_0_20px_rgba(251,191,36,0.2)]">
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

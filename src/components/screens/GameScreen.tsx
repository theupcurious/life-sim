import { useState } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, BookOpen } from 'lucide-react';
import Flowchart from '@/components/flowchart/Flowchart';
import InfoPanel from '@/components/panels/InfoPanel';
import useGameStore from '@/store/gameStore';

const GameScreen: React.FC = () => {
  const [mobileTab, setMobileTab] = useState<'story' | 'map'>('story');

  const {
    character,
    nodes,
    connections,
    currentNodeId,
    visitedNodes,
    isReliveMode,
    gameEnded,
    makeChoice,
    navigateToNode,
    toggleReliveMode,
    getCurrentNode,
    getNextNodes,
  } = useGameStore();

  const currentNode = getCurrentNode();

  const handleNodeClick = (nodeId: string) => {
    if (!currentNode) return;

    if (isReliveMode) {
      navigateToNode(nodeId);
      return;
    }

    // Enforce explicit choice selection on decision nodes.
    if (currentNode.type === 'decision') return;

    // Normal mode - only navigate to next nodes
    const nextNodes = getNextNodes(currentNodeId);
    if (nextNodes.some(n => n.id === nodeId)) {
      navigateToNode(nodeId);
      // Switch to story tab after selecting a node on mobile
      setMobileTab('story');
    }
  };

  const handleChoice = (choiceId: string) => {
    makeChoice(choiceId);
  };

  const handleNext = () => {
    const nextNodes = getNextNodes(currentNodeId);
    if (nextNodes.length === 1) {
      navigateToNode(nextNodes[0].id);
    }
  };

  const handleRelive = () => {
    toggleReliveMode();
    // Switch to map tab so users can pick a node to relive
    setMobileTab('map');
  };

  return (
    <div className="h-screen w-screen bg-black flex flex-col lg:flex-row overflow-hidden">

      {/* ── DESKTOP LAYOUT ── */}
      {/* Flowchart Area - Left Side (desktop only) */}
      <motion.div
        className="hidden lg:flex w-full lg:h-full lg:w-[45%] border-r border-white/20"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Flowchart
          nodes={nodes}
          connections={connections}
          currentNodeId={currentNodeId}
          visitedNodes={visitedNodes}
          isReliveMode={isReliveMode}
          onNodeClick={handleNodeClick}
        />
      </motion.div>

      {/* Info Panel - Right Side (desktop only) */}
      <motion.div
        className="hidden lg:flex w-full lg:h-full lg:w-[55%] p-6"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <InfoPanel
          character={character}
          currentNode={currentNode}
          onChoice={handleChoice}
          onNext={handleNext}
          onRelive={handleRelive}
          isReliveMode={isReliveMode}
          gameEnded={gameEnded}
        />
      </motion.div>

      {/* ── MOBILE LAYOUT ── */}
      {/* Tab panels - take full height minus tab bar */}
      <div className="lg:hidden flex flex-col flex-1 min-h-0">
        {/* Story tab */}
        {mobileTab === 'story' && (
          <motion.div
            key="story"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="flex-1 min-h-0 p-4 overflow-hidden"
          >
            <InfoPanel
              character={character}
              currentNode={currentNode}
              onChoice={handleChoice}
              onNext={handleNext}
              onRelive={handleRelive}
              isReliveMode={isReliveMode}
              gameEnded={gameEnded}
            />
          </motion.div>
        )}

        {/* Map tab */}
        {mobileTab === 'map' && (
          <motion.div
            key="map"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="flex-1 min-h-0"
          >
            <Flowchart
              nodes={nodes}
              connections={connections}
              currentNodeId={currentNodeId}
              visitedNodes={visitedNodes}
              isReliveMode={isReliveMode}
              onNodeClick={handleNodeClick}
            />
          </motion.div>
        )}

        {/* Mobile Tab Bar */}
        <div className="shrink-0 flex border-t border-white/20 bg-black">
          <button
            onClick={() => setMobileTab('story')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs uppercase tracking-widest transition-all ${
              mobileTab === 'story'
                ? 'text-amber-400 border-t-2 border-amber-400 -mt-px'
                : 'text-zinc-600'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Story
          </button>
          <button
            onClick={() => setMobileTab('map')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs uppercase tracking-widest transition-all ${
              mobileTab === 'map'
                ? 'text-amber-400 border-t-2 border-amber-400 -mt-px'
                : 'text-zinc-600'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            Life Map
          </button>
        </div>
      </div>

      {/* Controls hint - desktop only */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="hidden lg:block absolute bottom-4 left-4 text-xs text-zinc-600"
      >
        <span className="mr-4">Scroll to Zoom</span>
        <span className="mr-4">Drag to Pan</span>
        <span>Click nodes to navigate</span>
      </motion.div>
    </div>
  );
};

export default GameScreen;

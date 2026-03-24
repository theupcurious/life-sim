import { useState } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, BookOpen } from 'lucide-react';
import Flowchart from '@/components/flowchart/Flowchart';
import InfoPanel from '@/components/panels/InfoPanel';
import useGameStore from '@/store/gameStore';

const GameScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'story' | 'map'>('story');

  const {
    character,
    nodes,
    connections,
    lifeState,
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
  const [showCausality, setShowCausality] = useState(false);

  const currentNode = getCurrentNode();

  const handleNodeClick = (nodeId: string) => {
    if (!currentNode) return;

    if (isReliveMode) {
      navigateToNode(nodeId);
      setActiveTab('story');
      return;
    }

    // Enforce explicit choice selection on decision nodes.
    if (currentNode.type === 'decision') return;

    // Normal mode - only navigate to next nodes
    const nextNodes = getNextNodes(currentNodeId);
    if (nextNodes.some(n => n.id === nodeId)) {
      navigateToNode(nodeId);
      setActiveTab('story');
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
    setActiveTab('map');
  };

  const tabs = [
    { id: 'story' as const, label: 'Story', icon: BookOpen },
    { id: 'map' as const, label: 'Life Map', icon: GitBranch },
  ];

  return (
    <div className="relative h-[100dvh] min-h-[100svh] w-full overflow-hidden bg-black">
      <div className="absolute inset-0 mesh-bg opacity-50 pointer-events-none" />

      <div className="relative z-10 flex h-full w-full items-stretch justify-center px-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] pt-[calc(env(safe-area-inset-top,0px)+0.5rem)] sm:px-4 lg:px-6">
        <div className="relative flex h-full w-full max-w-[980px] flex-col overflow-hidden glass-panel lg:max-w-[1040px]">
          <div className="flex min-h-0 flex-1 flex-col">
            {activeTab === 'story' && (
              <motion.div
                key="story"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="flex-1 min-h-0 overflow-hidden p-2 sm:p-3 lg:p-3"
              >
                <div className="mx-auto h-full w-full max-w-[860px]">
                  <InfoPanel
                    character={character}
                    currentNode={currentNode}
                    causalityState={lifeState}
                    showCausality={showCausality}
                    onToggleCausality={() => setShowCausality((current) => !current)}
                    onChoice={handleChoice}
                    onNext={handleNext}
                    onRelive={handleRelive}
                    isReliveMode={isReliveMode}
                    gameEnded={gameEnded}
                  />
                </div>
              </motion.div>
            )}

            {activeTab === 'map' && (
              <motion.div
                key="map"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="flex-1 min-h-0 overflow-hidden p-0 lg:p-3"
              >
                <div className="h-full w-full bg-black/50 backdrop-blur-sm shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] border border-white/5">
                  <Flowchart
                    nodes={nodes}
                    connections={connections}
                    currentNodeId={currentNodeId}
                    visitedNodes={visitedNodes}
                    isReliveMode={isReliveMode}
                    onNodeClick={handleNodeClick}
                  />
                </div>
              </motion.div>
            )}

            {activeTab === 'map' && (
              <div className="pointer-events-none absolute bottom-16 left-4 hidden text-[10px] uppercase tracking-[0.25em] text-zinc-600 lg:block">
                <span className="mr-4">Scroll to Zoom</span>
                <span className="mr-4">Drag to Pan</span>
                <span>Tap Nodes to Return</span>
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center justify-center gap-2 border-t border-white/10 bg-black/40 backdrop-blur-md px-2 py-2">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex min-w-0 flex-1 items-center justify-center gap-2 px-3 py-3 text-xs uppercase tracking-[0.25em] transition-all lg:flex-none lg:min-w-[180px] backdrop-blur-sm overflow-hidden relative ${
                  activeTab === id
                    ? 'bg-amber-400 text-black shadow-[0_0_15px_rgba(251,191,36,0.3)] font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameScreen;

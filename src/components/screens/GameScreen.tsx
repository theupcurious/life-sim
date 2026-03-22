import { motion } from 'framer-motion';
import Flowchart from '@/components/flowchart/Flowchart';
import InfoPanel from '@/components/panels/InfoPanel';
import useGameStore from '@/store/gameStore';

const GameScreen: React.FC = () => {
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
      // In relive mode, jump to any visited node
      navigateToNode(nodeId);
      return;
    }

    // Enforce explicit choice selection on decision nodes.
    if (currentNode.type === 'decision') return;

    // Normal mode - only navigate to next nodes
    const nextNodes = getNextNodes(currentNodeId);
    if (nextNodes.some(n => n.id === nodeId)) {
      navigateToNode(nodeId);
    }
  };

  const handleChoice = (choiceId: string) => {
    makeChoice(choiceId);
  };

  const handleNext = () => {
    // Auto-advance to next node if there's only one path
    const nextNodes = getNextNodes(currentNodeId);
    if (nextNodes.length === 1) {
      navigateToNode(nextNodes[0].id);
    }
  };

  const handleRelive = () => {
    toggleReliveMode();
  };

  return (
    <div className="h-screen w-screen bg-black flex flex-col lg:flex-row overflow-hidden">
      {/* Flowchart Area - Left Side */}
      <motion.div 
        className="w-full h-[45%] lg:h-full lg:w-[45%] border-b lg:border-b-0 lg:border-r border-white/20"
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

      {/* Info Panel - Right Side */}
      <motion.div 
        className="w-full h-[55%] lg:h-full lg:w-[55%] p-4 md:p-6"
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

      {/* Controls hint */}
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

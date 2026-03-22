import { motion } from 'framer-motion';
import type { StoryNode } from '@/types/game';

interface FlowchartNodeProps {
  node: StoryNode;
  isActive: boolean;
  isVisited: boolean;
  isReachable: boolean;
  isReliveMode: boolean;
  onClick: () => void;
}

const FlowchartNode: React.FC<FlowchartNodeProps> = ({
  node,
  isActive,
  isVisited,
  isReachable,
  isReliveMode,
  onClick,
}) => {
  const getNodeShape = () => {
    const baseClasses = 'transition-all duration-300 cursor-pointer';
    const activeClasses = isActive ? 'active' : '';
    const visitedClasses = isVisited ? 'visited' : '';
    
    switch (node.type) {
      case 'start':
      case 'end':
        return (
          <motion.div
            className={`node-start ${baseClasses} ${activeClasses}`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-xs uppercase tracking-wider">
              {node.type === 'start' ? 'Start' : 'End'}
            </span>
          </motion.div>
        );
        
      case 'decision':
        return (
          <motion.div
            className={`node-decision ${baseClasses} ${activeClasses}`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="node-decision-content">
              <span className="text-[10px] text-center leading-tight">
                {node.title || 'Decision'}
              </span>
            </div>
          </motion.div>
        );
        
      case 'event':
        return (
          <motion.div
            className={`node-event ${baseClasses} ${activeClasses} ${visitedClasses}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-[10px] uppercase tracking-wider text-center">
              {node.title || 'Event'}
            </span>
          </motion.div>
        );
        
      case 'time':
        return (
          <motion.div
            className={`node-time ${baseClasses} ${activeClasses} ${visitedClasses}`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-xs font-bold">{node.year}</span>
          </motion.div>
        );
        
      default:
        return null;
    }
  };

  // In relive mode, show visited nodes as selectable
  const canClick = isReliveMode ? isVisited : isReachable || isActive;
  
  return (
    <div 
      className={`group absolute transform -translate-x-1/2 -translate-y-1/2 ${
        canClick ? 'cursor-pointer' : 'cursor-default opacity-50'
      }`}
      style={{ 
        left: node.position.x, 
        top: node.position.y,
        pointerEvents: canClick ? 'auto' : 'none'
      }}
    >
      {getNodeShape()}
      
      {/* Tooltip on hover */}
      {isVisited && (
        <div
          className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 
                     bg-zinc-900 border border-white/50 text-[10px] whitespace-nowrap z-50
                     pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {node.year} - {node.title || node.type}
        </div>
      )}
    </div>
  );
};

export default FlowchartNode;

import { motion } from 'framer-motion';
import type { StoryNode } from '@/types/game';

interface ConnectionLinesProps {
  nodes: StoryNode[];
  connections: { from: string; to: string }[];
  visitedNodes: Set<string>;
}

const ConnectionLines: React.FC<ConnectionLinesProps> = ({
  nodes,
  connections,
  visitedNodes,
}) => {
  const getNodePosition = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    return node ? node.position : { x: 0, y: 0 };
  };

  const isConnectionActive = (from: string, to: string) => {
    return visitedNodes.has(from) && visitedNodes.has(to);
  };

  const isConnectionAlternative = (from: string, to: string) => {
    return visitedNodes.has(from) && !visitedNodes.has(to);
  };

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none">
      <defs>
        <marker id="arrow-taken" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L7,3 z" fill="#fbbf24" />
        </marker>
        <marker id="arrow-alternative" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L7,3 z" fill="#3f3f46" />
        </marker>
        <marker id="arrow-unexplored" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L7,3 z" fill="#27272a" />
        </marker>
        <filter id="glow-amber">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {connections.map((conn, index) => {
        const fromPos = getNodePosition(conn.from);
        const toPos = getNodePosition(conn.to);
        
        const isActive = isConnectionActive(conn.from, conn.to);
        const isAlternative = isConnectionAlternative(conn.from, conn.to);
        
        return (
          <motion.g
            key={`${conn.from}-${conn.to}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
          >
            {/* Main line */}
            <line
              x1={fromPos.x}
              y1={fromPos.y}
              x2={toPos.x}
              y2={toPos.y}
              stroke={isActive ? '#fbbf24' : isAlternative ? '#3f3f46' : '#27272a'}
              strokeWidth={isActive ? 2 : 1}
              strokeDasharray={isAlternative ? '6,4' : 'none'}
              strokeOpacity={isActive ? 1 : isAlternative ? 0.6 : 0.3}
              markerEnd={isActive ? 'url(#arrow-taken)' : isAlternative ? 'url(#arrow-alternative)' : 'url(#arrow-unexplored)'}
              filter={isActive ? 'url(#glow-amber)' : undefined}
            />
            
            {/* Animated dot for active connections */}
            {isActive && (
              <motion.circle
                r="3"
                fill="#fbbf24"
                initial={{ 
                  cx: fromPos.x, 
                  cy: fromPos.y 
                }}
                animate={{ 
                  cx: toPos.x, 
                  cy: toPos.y 
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            )}
          </motion.g>
        );
      })}
    </svg>
  );
};

export default ConnectionLines;

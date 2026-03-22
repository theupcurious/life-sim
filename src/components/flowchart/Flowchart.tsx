import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import FlowchartNode from './FlowchartNode';
import ConnectionLines from './ConnectionLines';
import type { StoryNode } from '@/types/game';

interface FlowchartProps {
  nodes: StoryNode[];
  connections: { from: string; to: string }[];
  currentNodeId: string;
  visitedNodes: Set<string>;
  isReliveMode: boolean;
  onNodeClick: (nodeId: string) => void;
}

const Flowchart: React.FC<FlowchartProps> = ({
  nodes,
  connections,
  currentNodeId,
  visitedNodes,
  isReliveMode,
  onNodeClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Auto-center on current node when it changes
  useEffect(() => {
    if (!containerRef.current) return;
    
    const currentNode = nodes.find(n => n.id === currentNodeId);
    if (!currentNode) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    // Center the current node
    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;
    
    setPosition({
      x: centerX - currentNode.position.x * scale,
      y: centerY - currentNode.position.y * scale,
    });
  }, [currentNodeId, nodes, scale]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.max(0.5, Math.min(2, prev * delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(2, prev * 1.2));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(0.5, prev / 1.2));
  };

  const handleResetView = () => {
    setScale(1);
    const currentNode = nodes.find(n => n.id === currentNodeId);
    if (currentNode && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      setPosition({
        x: containerRect.width / 2 - currentNode.position.x,
        y: containerRect.height / 2 - currentNode.position.y,
      });
    }
  };

  const currentNode = nodes.find(n => n.id === currentNodeId);
  const currentNodeRequiresChoice = currentNode?.type === 'decision';

  const isNodeReachable = (nodeId: string) => {
    if (!isReliveMode && currentNodeRequiresChoice) {
      return false;
    }

    // Check if this node is directly connected from current node
    return connections.some(
      conn => conn.from === currentNodeId && conn.to === nodeId
    );
  };

  // Calculate bounds for the flowchart
  const maxY = Math.max(...nodes.map(n => n.position.y), 0) + 200;

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {/* Controls */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="w-10 h-10 border border-white/50 bg-black/80 text-white 
                     hover:bg-amber-400/20 hover:border-amber-400 transition-all"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className="w-10 h-10 border border-white/50 bg-black/80 text-white 
                     hover:bg-amber-400/20 hover:border-amber-400 transition-all"
        >
          -
        </button>
        <button
          onClick={handleResetView}
          className="w-10 h-10 border border-white/50 bg-black/80 text-white 
                     hover:bg-amber-400/20 hover:border-amber-400 transition-all text-xs"
        >
          ⌖
        </button>
      </div>

      {/* Scale indicator */}
      <div className="absolute bottom-4 left-4 z-20 text-xs text-white/50">
        {Math.round(scale * 100)}%
      </div>

      {/* Flowchart container */}
      <div
        ref={containerRef}
        className={`w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <motion.div
          className="relative"
          style={{
            width: 800,
            height: maxY,
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: '0 0',
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* Connection lines */}
          <ConnectionLines
            nodes={nodes}
            connections={connections}
            visitedNodes={visitedNodes}
          />

          {/* Nodes */}
          {nodes.map((node) => (
            <FlowchartNode
              key={node.id}
              node={node}
              isActive={node.id === currentNodeId}
              isVisited={visitedNodes.has(node.id)}
              isReachable={isNodeReachable(node.id)}
              isReliveMode={isReliveMode}
              onClick={() => {
                if (isReliveMode && visitedNodes.has(node.id)) {
                  onNodeClick(node.id);
                } else if (isNodeReachable(node.id)) {
                  onNodeClick(node.id);
                }
              }}
            />
          ))}
        </motion.div>
      </div>

      {/* Relive mode indicator */}
      {isReliveMode && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20
                     px-6 py-2 border-2 border-amber-400 bg-black/90
                     text-amber-400 uppercase tracking-widest text-sm"
        >
          Where to Relive?
        </motion.div>
      )}
    </div>
  );
};

export default Flowchart;

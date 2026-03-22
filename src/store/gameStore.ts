import { create } from 'zustand';
import type { StoryNode, GameState, Character, CharacterInput, GameView } from '@/types/game';
import { generateLifeStory, generateConnections, generateRandomCharacter } from '@/data/storyGenerator';

interface GameStore extends GameState {
  currentView: GameView;
  nodes: StoryNode[];
  connections: { from: string; to: string }[];
  
  // Actions
  startGame: () => void;
  createCharacter: (input: CharacterInput) => void;
  createRandomCharacter: () => void;
  makeChoice: (choiceId: string) => void;
  navigateToNode: (nodeId: string) => void;
  toggleReliveMode: () => void;
  enterReliveMode: () => void;
  resetGame: () => void;
  getCurrentNode: () => StoryNode | undefined;
  getNodeById: (id: string) => StoryNode | undefined;
  getNextNodes: (nodeId: string) => StoryNode[];
  getPreviousNodes: (nodeId: string) => StoryNode[];
  isNodeReachable: (nodeId: string) => boolean;
  isNodeVisited: (nodeId: string) => boolean;
}

const PERSONALITY_SKILLS: Record<string, string[]> = {
  creative:     ['art', 'music'],
  analytical:   ['technology', 'mathematics'],
  ambitious:    ['business', 'leadership'],
  adventurous:  ['languages', 'travel'],
  empathetic:   ['writing', 'counseling'],
  shy:          ['writing', 'art'],
  outgoing:     ['business', 'languages'],
  cautious:     ['mathematics', 'technology'],
};

const createCharacterFromInput = (input: CharacterInput): Character => {
  const derived = [...new Set(
    input.personalityTraits.flatMap(t => PERSONALITY_SKILLS[t] ?? [])
  )].slice(0, 3);

  return {
    name: input.name,
    gender: input.gender,
    birthplace: input.birthplace,
    birthYear: input.birthYear,
    age: 0,
    location: input.birthplace,
    occupation: 'Newborn',
    health: 5,
    money: 1,
    happiness: 3,
    personality: input.personalityTraits,
    skills: derived,
    childhoodDream: input.childhoodDream,
  };
};

const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  character: {
    name: '',
    gender: 'female',
    birthplace: '',
    birthYear: 2000,
    age: 0,
    location: '',
    occupation: '',
    health: 5,
    money: 1,
    happiness: 3,
    personality: [],
    skills: [],
  },
  currentNodeId: 'start',
  visitedNodes: new Set(['start']),
  madeDecisions: new Map(),
  isReliveMode: false,
  gameStarted: false,
  gameEnded: false,
  currentView: 'title',
  nodes: [],
  connections: [],

  // Start a new game - go to character creation
  startGame: () => {
    set({
      currentView: 'create',
    });
  },

  // Create character from user input
  createCharacter: (input: CharacterInput) => {
    const character = createCharacterFromInput(input);
    const nodes = generateLifeStory(character);
    const connections = generateConnections(nodes);

    // Mark start as visited
    const visitedNodes = new Set(['start']);
    const nodesWithVisited = nodes.map(n => ({
      ...n,
      visited: n.id === 'start',
    }));

    set({
      character,
      nodes: nodesWithVisited,
      connections,
      currentNodeId: 'start',
      visitedNodes,
      madeDecisions: new Map(),
      isReliveMode: false,
      gameStarted: true,
      gameEnded: false,
      currentView: 'game',
    });
  },

  // Create random character
  createRandomCharacter: () => {
    const character = generateRandomCharacter();
    const nodes = generateLifeStory(character);
    const connections = generateConnections(nodes);

    const visitedNodes = new Set(['start']);
    const nodesWithVisited = nodes.map(n => ({
      ...n,
      visited: n.id === 'start',
    }));

    set({
      character,
      nodes: nodesWithVisited,
      connections,
      currentNodeId: 'start',
      visitedNodes,
      madeDecisions: new Map(),
      isReliveMode: false,
      gameStarted: true,
      gameEnded: false,
      currentView: 'game',
    });
  },

  // Make a choice at a decision node
  makeChoice: (choiceId: string) => {
    const state = get();
    const currentNode = state.getCurrentNode();
    if (!currentNode || !currentNode.choices) return;

    const choice = currentNode.choices.find(c => c.id === choiceId);
    if (!choice) return;

    // Update character based on choice effects
    const newCharacter = { ...state.character };
    if (choice.effects.health !== undefined) {
      newCharacter.health = Math.max(0, Math.min(5, newCharacter.health + choice.effects.health));
    }
    if (choice.effects.money !== undefined) {
      newCharacter.money = Math.max(0, Math.min(5, newCharacter.money + choice.effects.money));
    }
    if (choice.effects.happiness !== undefined) {
      newCharacter.happiness = Math.max(0, Math.min(5, newCharacter.happiness + choice.effects.happiness));
    }
    if (choice.effects.occupation) {
      newCharacter.occupation = choice.effects.occupation;
    }
    if (choice.effects.location) {
      newCharacter.location = choice.effects.location;
    }

    // Update age based on next node's year
    const nextNode = state.getNodeById(choice.nextNodeId);
    if (!nextNode) return;
    newCharacter.age = nextNode.age;

    // Record the decision
    const newDecisions = new Map(state.madeDecisions);
    newDecisions.set(currentNode.id, choiceId);

    // Mark next node as visited
    const newVisitedNodes = new Set(state.visitedNodes);
    newVisitedNodes.add(choice.nextNodeId);

    // Update nodes array to mark as visited
    const newNodes = state.nodes.map(n => 
      n.id === choice.nextNodeId ? { ...n, visited: true } : n
    );

    // Check if game ended
    const isEnd = nextNode.type === 'end';

    set({
      character: newCharacter,
      currentNodeId: choice.nextNodeId,
      visitedNodes: newVisitedNodes,
      madeDecisions: newDecisions,
      nodes: newNodes,
      gameEnded: isEnd,
      currentView: isEnd ? 'summary' : 'game',
    });
  },

  // Navigate to a specific node (for relive mode)
  navigateToNode: (nodeId: string) => {
    const state = get();
    const node = state.getNodeById(nodeId);
    if (!node) return;

    // In normal mode, only allow forward navigation to a directly connected next node.
    if (!state.isReliveMode) {
      const currentNode = state.getCurrentNode();
      if (currentNode?.type === 'decision') return;
      const isCurrentNode = nodeId === state.currentNodeId;
      const isNextNode = state.getNextNodes(state.currentNodeId).some(n => n.id === nodeId);
      if (!isCurrentNode && !isNextNode) return;
    }

    // Update character to match node's time period
    const newCharacter = { ...state.character };
    newCharacter.age = node.age;

    // Mark node as visited
    const newVisitedNodes = new Set(state.visitedNodes);
    newVisitedNodes.add(nodeId);

    const newNodes = state.nodes.map(n => 
      n.id === nodeId ? { ...n, visited: true } : n
    );

    const isEnd = node.type === 'end';

    set({
      currentNodeId: nodeId,
      character: newCharacter,
      visitedNodes: newVisitedNodes,
      nodes: newNodes,
      isReliveMode: false,
      gameEnded: isEnd,
      currentView: isEnd ? 'summary' : 'game',
    });
  },

  // Toggle relive mode
  toggleReliveMode: () => {
    const state = get();
    set({ isReliveMode: !state.isReliveMode });
  },

  // Enter relive mode from summary or game screens
  enterReliveMode: () => {
    const state = get();
    if (state.nodes.length === 0) return;

    const reliveStartNodeId = state.visitedNodes.has('death') ? 'death' : state.currentNodeId;
    const reliveStartNode = state.getNodeById(reliveStartNodeId);

    set({
      currentView: 'game',
      gameEnded: false,
      isReliveMode: true,
      currentNodeId: reliveStartNodeId,
      character: reliveStartNode ? { ...state.character, age: reliveStartNode.age } : state.character,
    });
  },

  // Reset the game
  resetGame: () => {
    set({
      character: {
        name: '',
        gender: 'female',
        birthplace: '',
        birthYear: 2000,
        age: 0,
        location: '',
        occupation: '',
        health: 5,
        money: 1,
        happiness: 3,
        personality: [],
        skills: [],
      },
      currentNodeId: 'start',
      visitedNodes: new Set(['start']),
      madeDecisions: new Map(),
      isReliveMode: false,
      gameStarted: false,
      gameEnded: false,
      currentView: 'title',
      nodes: [],
      connections: [],
    });
  },

  // Get current node
  getCurrentNode: () => {
    return get().nodes.find(n => n.id === get().currentNodeId);
  },

  // Get node by ID
  getNodeById: (id: string) => {
    return get().nodes.find(n => n.id === id);
  },

  // Get next nodes for a given node
  getNextNodes: (nodeId: string) => {
    const state = get();
    const nextIds = state.connections
      .filter(conn => conn.from === nodeId)
      .map(conn => conn.to);
    return state.nodes.filter(n => nextIds.includes(n.id));
  },

  // Get previous nodes for a given node
  getPreviousNodes: (nodeId: string) => {
    const state = get();
    const prevIds = state.connections
      .filter(conn => conn.to === nodeId)
      .map(conn => conn.from);
    return state.nodes.filter(n => prevIds.includes(n.id));
  },

  // Check if a node is reachable from current position
  isNodeReachable: (nodeId: string) => {
    const state = get();
    // In relive mode, all visited nodes are reachable
    if (state.isReliveMode) {
      return state.visitedNodes.has(nodeId);
    }
    // Otherwise, only next nodes are reachable
    const nextNodes = state.getNextNodes(state.currentNodeId);
    return nextNodes.some(n => n.id === nodeId);
  },

  // Check if a node has been visited
  isNodeVisited: (nodeId: string) => {
    return get().visitedNodes.has(nodeId);
  },
}));

export default useGameStore;

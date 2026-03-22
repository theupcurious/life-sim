import { AnimatePresence } from 'framer-motion';
import useGameStore from '@/store/gameStore';
import TitleScreen from '@/components/screens/TitleScreen';
import CharacterCreationScreen from '@/components/screens/CharacterCreationScreen';
import GameScreen from '@/components/screens/GameScreen';
import SummaryScreen from '@/components/screens/SummaryScreen';
import './App.css';

function App() {
  const { currentView, gameStarted, gameEnded, startGame, createCharacter, createRandomCharacter } = useGameStore();

  return (
    <div className="bg-black min-h-screen text-white">
      <AnimatePresence mode="wait">
        {currentView === 'title' && (
          <TitleScreen key="title" onStart={startGame} />
        )}
        {currentView === 'create' && (
          <CharacterCreationScreen 
            key="create" 
            onCreate={createCharacter}
            onRandom={createRandomCharacter}
          />
        )}
        {currentView === 'game' && gameStarted && (
          <GameScreen key="game" />
        )}
        {currentView === 'summary' && gameEnded && (
          <SummaryScreen key="summary" />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;

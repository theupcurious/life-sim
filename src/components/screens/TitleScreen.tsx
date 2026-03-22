import { useState } from 'react';
import { motion } from 'framer-motion';

interface TitleScreenProps {
  onStart: () => void;
}

const TitleScreen: React.FC<TitleScreenProps> = ({ onStart }) => {
  const [language, setLanguage] = useState<'en' | 'jp'>('en');

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Grid Effect */}
      <div className="absolute inset-0 opacity-10">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 255, 255, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 255, 255, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array(20).fill(0).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 text-center"
      >
        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-6xl md:text-8xl font-bold tracking-[0.3em] mb-4"
        >
          <span className="text-white">SOME</span>
          <span className="text-cyan-400">ONE</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-zinc-400 text-sm md:text-base tracking-widest uppercase mb-12"
        >
          {language === 'en' 
            ? 'A Life Simulation Experience' 
            : '人生シミュレーション体験'}
        </motion.p>

        {/* How to Play */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mb-12 max-w-md mx-auto px-6"
        >
          <div className="border border-white/20 bg-black/50 p-6">
            <h3 className="text-xs uppercase tracking-widest text-cyan-400 mb-4">
              {language === 'en' ? 'How to Play' : '遊び方'}
            </h3>
            <ol className="text-left text-sm text-zinc-300 space-y-2">
              <li className="flex gap-3">
                <span className="text-cyan-400">1.</span>
                {language === 'en' 
                  ? 'Follow a character across iconic world cities'
                  : '世界の象徴的な都市を舞台に人生を追う'}
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400">2.</span>
                {language === 'en' 
                  ? 'Make major life decisions at key moments'
                  : '重要な瞬間に人生の大きな決断をする'}
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400">3.</span>
                {language === 'en' 
                  ? 'After life ends, return to explore different paths'
                  : '人生が終わったら、違う道を探るために戻る'}
              </li>
            </ol>
          </div>
        </motion.div>

        {/* Language Selection */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="flex justify-center gap-4 mb-8"
        >
          <button
            onClick={() => setLanguage('en')}
            className={`px-4 py-2 border text-sm uppercase tracking-wider transition-all ${
              language === 'en'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-400/10'
                : 'border-white/30 text-zinc-500 hover:border-white/60'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLanguage('jp')}
            className={`px-4 py-2 border text-sm uppercase tracking-wider transition-all ${
              language === 'jp'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-400/10'
                : 'border-white/30 text-zinc-500 hover:border-white/60'
            }`}
          >
            日本語
          </button>
        </motion.div>

        {/* Start Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          onClick={onStart}
          className="game-button text-lg px-12 py-4"
        >
          {language === 'en' ? 'BEGIN JOURNEY' : '旅を始める'}
        </motion.button>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3, duration: 0.6 }}
        className="absolute bottom-8 flex flex-col items-center gap-1"
      >
        <span className="text-xs text-zinc-600 tracking-wider">A Life Simulation Experience</span>
        <a
          href="https://theupcurious.com"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-zinc-700 tracking-[0.2em] hover:text-zinc-400 transition-colors"
        >
          by Upcurious
        </a>
      </motion.div>
    </div>
  );
};

export default TitleScreen;

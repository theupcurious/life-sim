import { useState } from 'react';
import { motion } from 'framer-motion';

interface TitleScreenProps {
  onStart: () => void;
}

const TitleScreen: React.FC<TitleScreenProps> = ({ onStart }) => {
  const [language, setLanguage] = useState<'en' | 'jp'>('en');

  return (
    <div
      className="fixed inset-0 overflow-y-auto"
      style={{ background: 'hsl(25, 10%, 4%)' }}
    >
      {/* Subtle vignette radial gradient */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, rgba(251,191,36,0.04) 0%, transparent 70%)',
        }}
      />

      {/* Very subtle grid — far less intrusive than before */}
      <div
        className="fixed inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Centering wrapper — min-h-full + flex so content is centered when it
          fits the viewport, and padding ensures breathing room when it scrolls */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center py-12 px-6">

      {/* Main content card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-lg mx-auto"
      >
        {/* Upcurious eyebrow */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="text-center text-xs uppercase tracking-[0.35em] text-zinc-500 mb-8"
        >
          Upcurious Presents
        </motion.p>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="text-center mb-3"
        >
          <h1
            className="leading-none tracking-tight select-none"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(72px, 14vw, 120px)',
              fontWeight: 900,
            }}
          >
            <span style={{ color: '#fbbf24' }}>IF</span>
          </h1>
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-center text-zinc-400 text-xs uppercase tracking-[0.3em] mb-10"
        >
          {language === 'en' ? 'A Life Simulation' : '人生シミュレーション'}
        </motion.p>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.6 }}
          className="border border-white/10 mb-8"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          <div className="px-6 py-5 border-b border-white/10">
            <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 mb-3">
              {language === 'en' ? 'How to Play' : '遊び方'}
            </p>
            <ol className="space-y-2">
              {(language === 'en' ? [
                'Create a character and choose their birthplace',
                'Make decisions at key moments across a full lifetime',
                'When life ends, revisit any node to explore the other paths',
              ] : [
                'キャラクターを作成し、出生地を選ぶ',
                '人生の重要な瞬間に決断を下す',
                '人生が終わったら、別の道を探るために戻る',
              ]).map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-zinc-300">
                  <span style={{ color: '#fbbf24' }} className="shrink-0 font-mono text-xs mt-0.5">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Language selector inside card */}
          <div className="flex">
            {(['en', 'jp'] as const).map((lang, i) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`flex-1 py-3 text-xs uppercase tracking-widest transition-all ${
                  i === 0 ? 'border-r border-white/10' : ''
                } ${
                  language === lang
                    ? 'text-amber-400 bg-amber-400/5'
                    : 'text-zinc-600 hover:text-zinc-300'
                }`}
              >
                {lang === 'en' ? 'English' : '日本語'}
              </button>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.6 }}
          onClick={onStart}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 font-semibold text-sm uppercase tracking-[0.25em] transition-all"
          style={{
            background: '#fbbf24',
            color: '#0c0a08',
            fontFamily: "'Share Tech Mono', monospace",
          }}
        >
          {language === 'en' ? 'Begin' : '旅を始める'}
        </motion.button>
      </motion.div>

      {/* Footer */}
      <motion.a
        href="https://theupcurious.com"
        target="_blank"
        rel="noreferrer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="mt-8 text-xs tracking-[0.2em] text-zinc-700 hover:text-zinc-400 transition-colors"
      >
        by Upcurious
      </motion.a>

      </div>{/* end centering wrapper */}
    </div>
  );
};

export default TitleScreen;

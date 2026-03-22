import { useRef } from 'react';
import { motion } from 'framer-motion';
import useGameStore from '@/store/gameStore';
import { Heart, Coins, Smile, RotateCcw, Share2 } from 'lucide-react';
import type { Character, StoryNode } from '@/types/game';

function generateLifeSummary(
  character: Character,
  visitedNodeList: StoryNode[],
  lifeQuality: number,
): string {
  const p = character.gender === 'male' ? { sub: 'he', pos: 'his' }
    : character.gender === 'female' ? { sub: 'she', pos: 'her' }
    : { sub: 'they', pos: 'their' };

  const decisions = visitedNodeList.filter(n => n.type === 'decision');
  void decisions; // referenced for type narrowing only

  const educationRef = visitedNodeList.find(n => ['university-path','work-path','art-path','travel-path'].includes(n.id));
  const careerRef = visitedNodeList.find(n => ['corporate-path','stable-path','creative-career-path','entrepreneur-path'].includes(n.id));
  const familyRef = visitedNodeList.find(n => ['parent-path','childless-path','adoption-path'].includes(n.id));

  const educationLine = educationRef
    ? `${p.sub === 'they' ? 'They' : p.sub.charAt(0).toUpperCase() + p.sub.slice(1)} ${
        educationRef.id === 'university-path' ? 'chose the academic path' :
        educationRef.id === 'work-path' ? 'entered the workforce early' :
        educationRef.id === 'art-path' ? 'bet on a creative life' :
        'spent years traveling before settling down'}.`
    : '';

  const careerLine = careerRef
    ? `${p.pos.charAt(0).toUpperCase() + p.pos.slice(1)} career became that of ${
        careerRef.id === 'corporate-path' ? 'a determined corporate climber' :
        careerRef.id === 'stable-path' ? 'a steady, trusted professional' :
        careerRef.id === 'creative-career-path' ? 'a committed creative voice' :
        'an entrepreneur navigating uncertain waters'}.`
    : '';

  const familyLine = familyRef
    ? `${p.sub === 'they' ? 'They' : p.sub.charAt(0).toUpperCase() + p.sub.slice(1)} ${
        familyRef.id === 'parent-path' ? 'raised children and built a loud, loving household' :
        familyRef.id === 'adoption-path' ? 'built family through adoption, with intention and care' :
        'chose to remain child-free, investing in work and chosen community'}.`
    : '';

  const closingLine = lifeQuality >= 80
    ? `By most measures — and ${p.pos} own — it was a life well-lived.`
    : lifeQuality >= 60
    ? `It was not a perfect life, but it was authentically ${p.pos} own.`
    : `It was a difficult road, but ${p.sub} walked it.`;

  return [
    `${character.name} lived to ${character.age} in ${character.birthplace}.`,
    educationLine,
    careerLine,
    familyLine,
    closingLine,
  ].filter(Boolean).join(' ');
}

const SummaryScreen: React.FC = () => {
  const shareRef = useRef<HTMLButtonElement>(null);
  const { character, visitedNodes, nodes, resetGame, enterReliveMode } = useGameStore();

  const handleRelive = () => {
    enterReliveMode();
  };

  const handleNewGame = () => {
    resetGame();
  };

  // Calculate statistics
  const visitedCount = visitedNodes.size;
  const totalNodes = nodes.length;
  const completionPercentage = totalNodes > 0 ? Math.round((visitedCount / totalNodes) * 100) : 0;

  // Get visited nodes in order
  const visitedNodeList = nodes.filter(n => visitedNodes.has(n.id));

  // Calculate life quality score
  const lifeQuality = Math.round((character.health + character.money + character.happiness) / 3 * 20);
  const lifeSummary = generateLifeSummary(character, visitedNodeList, lifeQuality);

  const handleShare = async () => {
    const btn = shareRef.current;
    if (!btn) return;
    const original = btn.textContent;

    const W = 1200, H = 630;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // Background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(251,191,36,0.04)';
    ctx.lineWidth = 1;
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }

    // Title
    ctx.font = 'bold 120px serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fbbf24';
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 25;
    ctx.fillText('IF', W / 2, 145);
    ctx.shadowBlur = 0;

    // Divider
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W/2 - 260, 165); ctx.lineTo(W/2 + 260, 165); ctx.stroke();

    // Character name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 52px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(character.name, W / 2, 230);

    ctx.fillStyle = '#71717a';
    ctx.font = '22px monospace';
    ctx.fillText(`${character.birthplace}  ·  Age ${character.age}`, W / 2, 268);

    // Score
    ctx.fillStyle = '#fbbf24';
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 20;
    ctx.font = 'bold 100px monospace';
    ctx.fillText(`${lifeQuality}%`, W / 2, 390);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#52525b';
    ctx.font = '18px monospace';
    ctx.fillText('LIFE QUALITY SCORE', W / 2, 425);

    // Summary
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '19px monospace';
    const words = lifeSummary.split(' ');
    let line = ''; const maxW = 900; const lines: string[] = [];
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxW) { lines.push(line); line = word; }
      else { line = test; }
    }
    if (line) lines.push(line);
    lines.slice(0, 3).forEach((l, i) => ctx.fillText(l, W / 2, 475 + i * 28));

    // Attribution
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = '16px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('by Upcurious', W - 40, H - 28);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        if (btn) btn.textContent = '✓ Copied!';
      } catch {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `if-${character.name.toLowerCase()}.png`; a.click();
        URL.revokeObjectURL(url);
        if (btn) btn.textContent = '✓ Saved!';
      }
      setTimeout(() => { if (btn) btn.textContent = original; }, 2500);
    }, 'image/png');
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-start md:justify-center p-4 md:p-8 overflow-y-auto">
      {/* Background Effect */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, rgba(251, 191, 36, 0.3) 0%, transparent 50%)`,
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-2xl w-full"
      >
        {/* Title */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl md:text-4xl font-bold tracking-widest mb-2"
          >
            <span className="text-white">LIFE </span>
            <span className="text-amber-400">COMPLETE</span>
          </motion.h1>
          <p className="text-zinc-500 text-sm tracking-wider">
            The journey of {character.name} has ended
          </p>
        </div>

        {/* Life Quality Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="border-2 border-amber-400/50 bg-amber-400/10 p-4 md:p-6 mb-4 md:mb-6 text-center"
        >
          <p className="text-xs text-amber-400 uppercase tracking-wider mb-2">Life Quality Score</p>
          <p className="text-4xl md:text-5xl font-bold text-amber-400">{lifeQuality}%</p>
          <p className="text-sm text-zinc-400 mt-2">
            {lifeQuality >= 80 ? 'A life well-lived' : 
             lifeQuality >= 60 ? 'A balanced existence' : 
             lifeQuality >= 40 ? 'A challenging journey' : 'A life of struggle'}
          </p>
        </motion.div>

        {/* Character Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="border-2 border-white/30 bg-zinc-900/50 p-4 md:p-6 mb-4 md:mb-6"
        >
          <div className="grid grid-cols-2 gap-3 md:gap-6">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Name</p>
              <p className="text-xl font-bold">{character.name}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Age at Passing</p>
              <p className="text-xl font-bold">{character.age} years</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Final Occupation</p>
              <p className="text-lg">{character.occupation}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Birthplace</p>
              <p className="text-lg">{character.birthplace}</p>
            </div>
          </div>

          {/* Final Stats */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Final Status</p>
            <div className="flex gap-4 md:gap-8 flex-wrap">
              <div>
                <p className="text-xs text-zinc-500 mb-1">Health</p>
                <div className="flex gap-1">
                  {Array(5).fill(0).map((_, i) => (
                    <Heart
                      key={i}
                      className={`w-5 h-5 ${
                        i < character.health ? 'text-red-400 fill-red-400' : 'text-zinc-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-1">Wealth</p>
                <div className="flex gap-1">
                  {Array(5).fill(0).map((_, i) => (
                    <Coins
                      key={i}
                      className={`w-5 h-5 ${
                        i < character.money ? 'text-yellow-400' : 'text-zinc-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-1">Happiness</p>
                <div className="flex gap-1">
                  {Array(5).fill(0).map((_, i) => (
                    <Smile
                      key={i}
                      className={`w-5 h-5 ${
                        i < character.happiness ? 'text-amber-400' : 'text-zinc-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Life Path Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="border-2 border-white/30 bg-zinc-900/50 p-4 md:p-6 mb-4 md:mb-6"
        >
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-4">Life Path Statistics</p>
          <div className="flex justify-between items-center mb-4">
            <span className="text-zinc-400">Nodes Visited</span>
            <span className="text-amber-400 font-bold">{visitedCount} / {totalNodes}</span>
          </div>
          <div className="w-full bg-zinc-800 h-2 mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="h-full bg-amber-400"
            />
          </div>
          <p className="text-right text-xs text-zinc-500">{completionPercentage}% explored</p>
        </motion.div>

        {/* Key Life Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="border-2 border-white/30 bg-zinc-900/50 p-4 md:p-6 mb-4 md:mb-8"
        >
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-4">Key Life Events</p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {visitedNodeList
              .filter(n => n.type === 'decision' || n.type === 'milestone')
              .slice(-5)
              .map((node) => (
                <div key={node.id} className="flex gap-3 text-sm">
                  <span className="text-amber-400 w-12">{node.year}</span>
                  <span className="text-zinc-300">{node.title || node.type}</span>
                </div>
              ))}
          </div>
        </motion.div>

        {/* Life Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="border-l-2 border-amber-400/40 pl-4 mb-6"
        >
          <p className="text-sm text-zinc-400 leading-relaxed italic">{lifeSummary}</p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex gap-3 mb-3"
        >
          <button
            onClick={handleRelive}
            className="flex-1 game-button border-amber-400 text-amber-400"
          >
            Where to Relive?
          </button>
          <button
            onClick={handleNewGame}
            className="flex-1 game-button"
          >
            <RotateCcw className="w-4 h-4 inline mr-2" />
            New Life
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center"
        >
          <button
            ref={shareRef}
            onClick={handleShare}
            className="inline-flex items-center gap-2 text-zinc-500 hover:text-white text-sm transition-colors py-2"
          >
            <Share2 className="w-3 h-3" />
            Share this life
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SummaryScreen;

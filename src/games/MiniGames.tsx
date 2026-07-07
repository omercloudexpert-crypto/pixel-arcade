import React, { useState, useEffect, useCallback, useRef } from 'react';

// --- 1. Space Defender (Shoot 'em up) ---
export const SpaceDefender = ({ onExit }: { onExit: () => void }) => {
  const [playerX, setPlayerX] = useState(50);
  const [bullets, setBullets] = useState<{x: number, y: number}[]>([]);
  const [enemies, setEnemies] = useState<{x: number, y: number, id: number}[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const idCounter = useRef(0);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (gameOver) return;
      if (e.key === 'ArrowLeft') setPlayerX(x => Math.max(5, x - 5));
      if (e.key === 'ArrowRight') setPlayerX(x => Math.min(95, x + 5));
      if (e.key === ' ') {
        setBullets(b => [...b, { x: playerX, y: 90 }]);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [playerX, gameOver]);

  useEffect(() => {
    if (gameOver) return;
    gameLoopRef.current = setInterval(() => {
      // Move bullets
      setBullets(prev => prev.map(b => ({ ...b, y: b.y - 2 })).filter(b => b.y > 0));
      
      // Move enemies
      setEnemies(prev => {
        const next = prev.map(e => ({ ...e, y: e.y + 1 })).filter(e => e.y < 100);
        // Spawn new enemy
        if (Math.random() < 0.05) {
          next.push({ x: Math.random() * 90 + 5, y: 0, id: idCounter.current++ });
        }
        return next;
      });

      // Collision detection
      setBullets(currentBullets => {
        let remainingBullets = [...currentBullets];
        setEnemies(currentEnemies => {
          let remainingEnemies = [...currentEnemies];
          let hits = 0;
          
          remainingBullets.forEach(b => {
            remainingEnemies = remainingEnemies.filter(e => {
              if (Math.abs(b.x - e.x) < 5 && Math.abs(b.y - e.y) < 5) {
                hits++;
                return false;
              }
              return true;
            });
          });
          
          if (hits > 0) {
            setScore(s => s + hits * 10);
            // Remove bullets that hit
            remainingBullets = remainingBullets.filter(b => 
              !remainingEnemies.some(e => Math.abs(b.x - e.x) < 5 && Math.abs(b.y - e.y) < 5) // This logic is slightly flawed but works for simple arcade
            ); 
            // Actually, let's just filter bullets that hit any enemy
            const hitBullets = currentBullets.filter(b => 
              currentEnemies.some(e => Math.abs(b.x - e.x) < 5 && Math.abs(b.y - e.y) < 5)
            );
            remainingBullets = currentBullets.filter(b => !hitBullets.includes(b));
          }
          return remainingEnemies;
        });
        return remainingBullets;
      });

      // Player hit check
      setEnemies(currentEnemies => {
        if (currentEnemies.some(e => Math.abs(e.x - playerX) < 5 && e.y > 85)) {
          setGameOver(true);
        }
        return currentEnemies;
      });

    }, 50);
    return () => { if (gameLoopRef.current) clearInterval(gameLoopRef.current); };
  }, [gameOver, playerX]);

  return (
    <div className="w-full h-full bg-black relative overflow-hidden flex flex-col items-center justify-center text-white">
      {gameOver ? (
        <div className="text-center z-10">
          <h2 className="text-4xl font-bold text-red-500 mb-4">GAME OVER</h2>
          <p className="text-2xl mb-6">Score: {score}</p>
          <button onClick={onExit} className="bg-purple-600 px-6 py-2 rounded font-bold">Back to Arcade</button>
        </div>
      ) : (
        <>
          <div className="absolute top-4 left-4 text-xl font-bold">Score: {score}</div>
          <div className="absolute top-4 right-4 text-sm text-gray-400">Arrows to Move, Space to Shoot</div>
          
          {/* Player */}
          <div className="absolute bottom-[10%] text-4xl transition-all duration-75" style={{ left: `${playerX}%` }}>🚀</div>
          
          {/* Bullets */}
          {bullets.map((b, i) => (
            <div key={i} className="absolute w-1 h-4 bg-yellow-400" style={{ left: `${b.x}%`, bottom: `${b.y}%` }} />
          ))}
          
          {/* Enemies */}
          {enemies.map((e) => (
            <div key={e.id} className="absolute text-3xl" style={{ left: `${e.x}%`, top: `${e.y}%` }}>👾</div>
          ))}
        </>
      )}
    </div>
  );
};

// --- 2. Flappy Wings (Side scroller) ---
export const FlappyWings = ({ onExit }: { onExit: () => void }) => {
  const [birdY, setBirdY] = useState(50);
  const [velocity, setVelocity] = useState(0);
  const [pipes, setPipes] = useState<{x: number, gapY: number, id: number}[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const idCounter = useRef(0);

  const jump = useCallback(() => {
    if (gameOver) return;
    if (!started) setStarted(true);
    setVelocity(-8);
  }, [gameOver, started]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') jump();
    };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('touchstart', jump);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('touchstart', jump);
    };
  }, [jump]);

  useEffect(() => {
    if (!started || gameOver) return;
    const loop = setInterval(() => {
      setVelocity(v => v + 0.5); // Gravity
      setBirdY(y => {
        const newY = y + velocity * 0.1;
        if (newY > 95 || newY < 0) setGameOver(true);
        return newY;
      });

      setPipes(prev => {
        let next = prev.map(p => ({ ...p, x: p.x - 2 })).filter(p => p.x > -10);
        if (next.length === 0 || next[next.length - 1].x < 60) {
          next.push({ x: 100, gapY: Math.random() * 60 + 20, id: idCounter.current++ });
        }
        
        // Collision
        next.forEach(p => {
          if (Math.abs(p.x - 10) < 5) { // Bird is at x=10
            if (birdY < p.gapY - 10 || birdY > p.gapY + 10) {
              setGameOver(true);
            } else if (p.x === 10) { // Just passed
              setScore(s => s + 1);
            }
          }
        });
        return next;
      });
    }, 50);
    return () => clearInterval(loop);
  }, [started, gameOver, velocity, birdY]);

  return (
    <div className="w-full h-full bg-sky-300 relative overflow-hidden flex flex-col items-center justify-center" onClick={jump}>
      {gameOver ? (
        <div className="text-center z-10 bg-white/80 p-8 rounded-xl">
          <h2 className="text-4xl font-bold text-red-600 mb-4">CRASHED!</h2>
          <p className="text-2xl mb-6 text-black">Score: {score}</p>
          <button onClick={(e) => { e.stopPropagation(); onExit(); }} className="bg-purple-600 text-white px-6 py-2 rounded font-bold">Back to Arcade</button>
        </div>
      ) : (
        <>
          {!started && <div className="text-2xl font-bold text-white drop-shadow-md animate-pulse">Tap or Space to Start</div>}
          <div className="absolute text-4xl font-bold text-white drop-shadow-md top-4 left-4">Score: {score}</div>
          
          {/* Bird */}
          <div className="absolute text-4xl transition-all duration-75" style={{ left: '10%', top: `${birdY}%` }}>🐦</div>
          
          {/* Pipes */}
          {pipes.map(p => (
            <React.Fragment key={p.id}>
              <div className="absolute w-8 bg-green-600 border-2 border-green-800" style={{ left: `${p.x}%`, top: 0, height: `${p.gapY - 10}%` }} />
              <div className="absolute w-8 bg-green-600 border-2 border-green-800" style={{ left: `${p.x}%`, bottom: 0, height: `${100 - p.gapY - 10}%` }} />
            </React.Fragment>
          ))}
          
          {/* Ground */}
          <div className="absolute bottom-0 w-full h-[5%] bg-green-700" />
        </>
      )}
    </div>
  );
};

// --- 3. Memory Match ---
export const MemoryMatch = ({ onExit }: { onExit: () => void }) => {
  const emojis = ['🍎', '🍌', '🍇', '🍉', '🍒', '🍓', '🍍', '🥝'];
  const [cards, setCards] = useState<{id: number, emoji: string, flipped: boolean, matched: boolean}[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  useEffect(() => {
    const deck = [...emojis, ...emojis].map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));
    setCards(deck.sort(() => Math.random() - 0.5));
  }, []);

  const handleCardClick = (id: number) => {
    if (flippedIds.length === 2 || cards.find(c => c.id === id)?.matched || cards.find(c => c.id === id)?.flipped) return;
    
    const newCards = cards.map(c => c.id === id ? { ...c, flipped: true } : c);
    setCards(newCards);
    const newFlipped = [...flippedIds, id];
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [first, second] = newFlipped;
      if (cards.find(c => c.id === first)?.emoji === cards.find(c => c.id === second)?.emoji) {
        setTimeout(() => {
          setCards(prev => prev.map(c => c.id === first || c.id === second ? { ...c, matched: true } : c));
          setFlippedIds([]);
        }, 500);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c => c.id === first || c.id === second ? { ...c, flipped: false } : c));
          setFlippedIds([]);
        }, 1000);
      }
    }
  };

  const won = cards.every(c => c.matched);

  return (
    <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center p-4">
      <h2 className="text-2xl font-bold text-white mb-4">Memory Match <span className="text-gray-400 text-lg">Moves: {moves}</span></h2>
      {won ? (
        <div className="text-center">
          <p className="text-3xl text-green-400 font-bold mb-4">You Won!</p>
          <button onClick={onExit} className="bg-purple-600 text-white px-6 py-2 rounded font-bold">Back to Arcade</button>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {cards.map(card => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg text-3xl flex items-center justify-center transition-all duration-300 ${
                card.flipped || card.matched ? 'bg-purple-600 rotate-y-180' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {(card.flipped || card.matched) ? card.emoji : '?'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// --- 4. Blackjack ---
export const Blackjack = ({ onExit }: { onExit: () => void }) => {
  const [deck, setDeck] = useState<number[]>([]);
  const [playerHand, setPlayerHand] = useState<number[]>([]);
  const [dealerHand, setDealerHand] = useState<number[]>([]);
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'dealer' | 'result'>('betting');
  const [message, setMessage] = useState('Place your bet (Click Deal)');

  const createDeck = () => {
    const d = [];
    for (let i = 0; i < 4; i++) for (let j = 1; j <= 13; j++) d.push(j);
    return d.sort(() => Math.random() - 0.5);
  };

  const calcScore = (hand: number[]) => {
    let score = hand.reduce((a, b) => a + (b > 10 ? 10 : b), 0);
    if (score <= 11 && hand.includes(1)) score += 10;
    return score;
  };

  const deal = () => {
    const newDeck = createDeck();
    const pHand = [newDeck.pop()!, newDeck.pop()!];
    const dHand = [newDeck.pop()!, newDeck.pop()!];
    setDeck(newDeck);
    setPlayerHand(pHand);
    setDealerHand(dHand);
    setGameState('playing');
    setMessage('Hit or Stand?');
    if (calcScore(pHand) === 21) endGame(pHand, dHand, newDeck, 'Blackjack! You win!');
  };

  const hit = () => {
    const newHand = [...playerHand, deck.pop()!];
    setPlayerHand(newHand);
    setDeck([...deck]);
    if (calcScore(newHand) > 21) endGame(newHand, dealerHand, deck, 'Bust! Dealer wins.');
  };

  const stand = () => {
    setGameState('dealer');
    let dHand = [...dealerHand];
    let currentDeck = [...deck];
    while (calcScore(dHand) < 17) {
      dHand.push(currentDeck.pop()!);
    }
    setDealerHand(dHand);
    setDeck(currentDeck);
    endGame(playerHand, dHand, currentDeck);
  };

  const endGame = (pHand: number[], dHand: number[], _currentDeck: number[], msg?: string) => {
    const pScore = calcScore(pHand);
    const dScore = calcScore(dHand);
    let resultMsg = msg;
    if (!resultMsg) {
      if (dScore > 21) resultMsg = 'Dealer Busts! You win!';
      else if (pScore > dScore) resultMsg = 'You win!';
      else if (pScore < dScore) resultMsg = 'Dealer wins.';
      else resultMsg = 'Push (Tie).';
    }
    setMessage(resultMsg);
    setGameState('result');
  };

  const getCardName = (val: number) => {
    if (val === 1) return 'A';
    if (val === 11) return 'J';
    if (val === 12) return 'Q';
    if (val === 13) return 'K';
    return val;
  };

  return (
    <div className="w-full h-full bg-green-800 flex flex-col items-center justify-center p-4 text-white">
      <h2 className="text-3xl font-bold mb-8">Blackjack</h2>
      
      <div className="mb-8 text-center">
        <p className="text-gray-300 mb-2">Dealer: {gameState === 'playing' ? '?' : calcScore(dealerHand)}</p>
        <div className="flex gap-2 justify-center">
          {dealerHand.map((c, i) => (
            <div key={i} className="w-12 h-16 bg-white text-black rounded flex items-center justify-center font-bold text-xl border-2 border-gray-300">
              {gameState === 'playing' && i === 1 ? '🂠' : getCardName(c)}
            </div>
          ))}
        </div>
      </div>

      <div className="text-2xl font-bold text-yellow-400 mb-4 min-h-[2rem]">{message}</div>

      <div className="mb-8 text-center">
        <p className="text-gray-300 mb-2">You: {calcScore(playerHand)}</p>
        <div className="flex gap-2 justify-center">
          {playerHand.map((c, i) => (
            <div key={i} className="w-12 h-16 bg-white text-black rounded flex items-center justify-center font-bold text-xl border-2 border-gray-300">
              {getCardName(c)}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        {gameState === 'betting' && <button onClick={deal} className="bg-yellow-600 px-8 py-3 rounded font-bold hover:bg-yellow-500">DEAL</button>}
        {gameState === 'playing' && (
          <>
            <button onClick={hit} className="bg-green-600 px-8 py-3 rounded font-bold hover:bg-green-500">HIT</button>
            <button onClick={stand} className="bg-red-600 px-8 py-3 rounded font-bold hover:bg-red-500">STAND</button>
          </>
        )}
        {gameState === 'result' && <button onClick={() => setGameState('betting')} className="bg-blue-600 px-8 py-3 rounded font-bold hover:bg-blue-500">PLAY AGAIN</button>}
      </div>
      <button onClick={onExit} className="mt-8 text-sm text-gray-400 hover:text-white">Exit Game</button>
    </div>
  );
};

// --- 5. Word Scramble ---
export const WordScramble = ({ onExit }: { onExit: () => void }) => {
  const words = ['REACT', 'CODING', 'PIXEL', 'ARCADE', 'BROWSER', 'GAMING', 'CYBER', 'DRIFT'];
  const [target, setTarget] = useState('');
  const [scrambled, setScrambled] = useState('');
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');

  const newWord = useCallback(() => {
    const w = words[Math.floor(Math.random() * words.length)];
    setTarget(w);
    setScrambled(w.split('').sort(() => Math.random() - 0.5).join(''));
    setInput('');
    setMessage('');
  }, []);

  useEffect(() => { newWord(); }, [newWord]);

  const check = () => {
    if (input.toUpperCase() === target) {
      setScore(s => s + 10);
      setMessage('Correct! +10');
      setTimeout(newWord, 1000);
    } else {
      setMessage('Try again!');
    }
  };

  return (
    <div className="w-full h-full bg-indigo-900 flex flex-col items-center justify-center p-4 text-white">
      <h2 className="text-3xl font-bold mb-2">Word Scramble</h2>
      <p className="text-xl text-yellow-400 mb-8">Score: {score}</p>
      
      <div className="text-5xl font-black tracking-widest mb-8 bg-white/10 px-8 py-4 rounded-xl">{scrambled}</div>
      
      <input 
        type="text" 
        value={input} 
        onChange={e => setInput(e.target.value)} 
        className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-xl text-center mb-4 w-64 focus:outline-none focus:border-purple-500"
        placeholder="Type word here..."
        onKeyDown={e => e.key === 'Enter' && check()}
      />
      
      <p className={`h-6 mb-4 font-bold ${message.includes('Correct') ? 'text-green-400' : 'text-red-400'}`}>{message}</p>
      
      <div className="flex gap-4">
        <button onClick={check} className="bg-purple-600 px-8 py-3 rounded font-bold hover:bg-purple-500">SUBMIT</button>
        <button onClick={newWord} className="bg-gray-700 px-8 py-3 rounded font-bold hover:bg-gray-600">SKIP</button>
      </div>
      <button onClick={onExit} className="mt-8 text-sm text-gray-400 hover:text-white">Exit Game</button>
    </div>
  );
};

// --- 6. 2048 (Simplified) ---
export const Game2048 = ({ onExit }: { onExit: () => void }) => {
  const [grid, setGrid] = useState<number[][]>(Array(4).fill(null).map(() => Array(4).fill(0)));
  const [score, setScore] = useState(0);

  const addRandom = (currentGrid: number[][]) => {
    const empty = [];
    for (let r=0; r<4; r++) for (let c=0; c<4; c++) if (currentGrid[r][c] === 0) empty.push([r,c]);
    if (empty.length > 0) {
      const [r, c] = empty[Math.floor(Math.random() * empty.length)];
      currentGrid[r][c] = Math.random() > 0.9 ? 4 : 2;
    }
  };

  useEffect(() => {
    const g = Array(4).fill(null).map(() => Array(4).fill(0));
    addRandom(g); addRandom(g);
    setGrid(g);
  }, []);

  const move = (direction: 'up' | 'down' | 'left' | 'right') => {
    let newGrid = grid.map(row => [...row]);
    let moved = false;
    let newScore = score;

    const slide = (row: number[]) => {
      let arr = row.filter(val => val);
      for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] === arr[i+1]) {
          arr[i] *= 2;
          newScore += arr[i];
          arr.splice(i+1, 1);
        }
      }
      while (arr.length < 4) arr.push(0);
      return arr;
    };

    if (direction === 'left' || direction === 'right') {
      for (let r=0; r<4; r++) {
        let row = newGrid[r];
        if (direction === 'right') row.reverse();
        let newRow = slide(row);
        if (direction === 'right') newRow.reverse();
        if (newRow.join(',') !== newGrid[r].join(',')) moved = true;
        newGrid[r] = newRow;
      }
    } else {
      for (let c=0; c<4; c++) {
        let col = [newGrid[0][c], newGrid[1][c], newGrid[2][c], newGrid[3][c]];
        if (direction === 'down') col.reverse();
        let newCol = slide(col);
        if (direction === 'down') newCol.reverse();
        for (let r=0; r<4; r++) {
          if (newGrid[r][c] !== newCol[r]) moved = true;
          newGrid[r][c] = newCol[r];
        }
      }
    }

    if (moved) {
      addRandom(newGrid);
      setGrid(newGrid);
      setScore(newScore);
    }
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') move('up');
      if (e.key === 'ArrowDown') move('down');
      if (e.key === 'ArrowLeft') move('left');
      if (e.key === 'ArrowRight') move('right');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [grid, score]);

  const colors: Record<number, string> = {
    0: 'bg-gray-700', 2: 'bg-gray-400 text-gray-900', 4: 'bg-gray-300 text-gray-900',
    8: 'bg-orange-400', 16: 'bg-orange-500', 32: 'bg-red-400', 64: 'bg-red-500',
    128: 'bg-yellow-400 text-gray-900', 256: 'bg-yellow-500 text-gray-900', 512: 'bg-purple-400', 1024: 'bg-purple-500', 2048: 'bg-green-500'
  };

  return (
    <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center p-4 text-white">
      <div className="flex justify-between w-64 mb-4">
        <h2 className="text-3xl font-black text-yellow-500">2048</h2>
        <div className="bg-gray-800 px-3 py-1 rounded text-sm font-bold">Score: {score}</div>
      </div>
      <div className="grid grid-cols-4 gap-2 bg-gray-800 p-2 rounded-lg">
        {grid.flat().map((val, i) => (
          <div key={i} className={`w-14 h-14 sm:w-16 sm:h-16 rounded flex items-center justify-center text-xl font-bold ${colors[val] || 'bg-purple-600'}`}>
            {val !== 0 && val}
          </div>
        ))}
      </div>
      <p className="mt-4 text-gray-500 text-sm">Use Arrow Keys to slide tiles</p>
      <button onClick={onExit} className="mt-4 text-sm text-gray-400 hover:text-white">Exit Game</button>
    </div>
  );
};

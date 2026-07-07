// Maze Escape - Navigate randomly generated mazes
import { useEffect, useRef, useCallback } from 'react';
import GameWrapper from '../components/GameWrapper';
import { useGameEngine } from '../hooks/useGameEngine';
import { getGameById } from './registry';
import { playMove, playCollect, playWin } from '../utils/sound';

export default function MazeGame({ onBack }: { onBack: () => void }) {
  const config = getGameById('maze')!;
  const engine = useGameEngine({ gameId: 'maze' });
  const stateRef = useRef(engine.gameState);
  const mazeRef = useRef<boolean[][]>([]);
  const playerRef = useRef({ x: 1, y: 1 });
  const exitRef = useRef({ x: 0, y: 0 });
  const gemsRef = useRef<{ x: number; y: number }[]>([]);
  const scoreRef = useRef(0);
  const levelRef = useRef(1);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => { stateRef.current = engine.gameState; }, [engine.gameState]);

  const generateMaze = useCallback((size: number): boolean[][] => {
    const maze = Array.from({ length: size }, () => Array(size).fill(true));

    const carve = (x: number, y: number) => {
      maze[y][x] = false;
      const dirs = [[0, -2], [0, 2], [-2, 0], [2, 0]].sort(() => Math.random() - 0.5);
      for (const [dx, dy] of dirs) {
        const nx = x + dx, ny = y + dy;
        if (nx > 0 && nx < size - 1 && ny > 0 && ny < size - 1 && maze[ny][nx]) {
          maze[y + dy / 2][x + dx / 2] = false;
          carve(nx, ny);
        }
      }
    };
    carve(1, 1);
    return maze;
  }, []);

  const initLevel = useCallback((level: number) => {
    const size = Math.min(11 + level * 2, 25) | 1;
    const maze = generateMaze(size);
    mazeRef.current = maze;
    playerRef.current = { x: 1, y: 1 };
    exitRef.current = { x: size - 2, y: size - 2 };
    maze[size - 2][size - 2] = false;

    // Place gems
    const gems: { x: number; y: number }[] = [];
    for (let i = 0; i < 3 + level; i++) {
      let gx: number, gy: number;
      let attempts = 0;
      do {
        gx = 1 + Math.floor(Math.random() * (size - 2));
        gy = 1 + Math.floor(Math.random() * (size - 2));
        attempts++;
      } while ((maze[gy][gx] || (gx === 1 && gy === 1) || gems.some(g => g.x === gx && g.y === gy)) && attempts < 50);
      if (!maze[gy][gx]) gems.push({ x: gx, y: gy });
    }
    gemsRef.current = gems;
    levelRef.current = level;
    engine.updateState({ level });
  }, [generateMaze, engine]);

  const movePlayer = useCallback((dx: number, dy: number) => {
    if (stateRef.current.status !== 'playing') return;
    const p = playerRef.current;
    const nx = p.x + dx, ny = p.y + dy;
    const maze = mazeRef.current;
    if (ny < 0 || ny >= maze.length || nx < 0 || nx >= maze[0].length || maze[ny][nx]) return;
    p.x = nx; p.y = ny;
    playMove();

    // Check gems
    const gi = gemsRef.current.findIndex(g => g.x === nx && g.y === ny);
    if (gi >= 0) {
      gemsRef.current.splice(gi, 1);
      scoreRef.current += 50;
      engine.updateState({ score: scoreRef.current });
      playCollect();
    }

    // Check exit
    if (nx === exitRef.current.x && ny === exitRef.current.y) {
      scoreRef.current += 100 * levelRef.current;
      engine.updateState({ score: scoreRef.current });
      playWin();
      initLevel(levelRef.current + 1);
    }
  }, [engine, initLevel]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': movePlayer(0, -1); e.preventDefault(); break;
        case 'ArrowDown': case 's': case 'S': movePlayer(0, 1); e.preventDefault(); break;
        case 'ArrowLeft': case 'a': case 'A': movePlayer(-1, 0); e.preventDefault(); break;
        case 'ArrowRight': case 'd': case 'D': movePlayer(1, 0); e.preventDefault(); break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [movePlayer]);

  // Touch controls
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
      const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
      if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
      if (Math.abs(dx) > Math.abs(dy)) movePlayer(dx > 0 ? 1 : -1, 0);
      else movePlayer(0, dy > 0 ? 1 : -1);
    };
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [movePlayer]);

  // Render loop
  useEffect(() => {
    const canvas = engine.canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let running = true;

    const resize = () => {
      const p = canvas.parentElement!;
      canvas.width = Math.min(p.clientWidth, 600);
      canvas.height = Math.min(p.clientHeight, 600);
    };
    resize();

    const loop = () => {
      if (!running) return;
      const W = canvas.width, H = canvas.height;
      const maze = mazeRef.current;
      if (maze.length === 0) { engine.animFrameRef.current = requestAnimationFrame(loop); return; }

      const cellW = W / maze[0].length;
      const cellH = H / maze.length;
      const cell = Math.min(cellW, cellH);
      const offX = (W - cell * maze[0].length) / 2;
      const offY = (H - cell * maze.length) / 2;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, W, H);

      // Draw maze
      for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
          if (maze[y][x]) {
            ctx.fillStyle = '#334155';
            ctx.fillRect(offX + x * cell, offY + y * cell, cell, cell);
          } else {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(offX + x * cell, offY + y * cell, cell, cell);
          }
        }
      }

      // Exit
      const ex = exitRef.current;
      ctx.fillStyle = '#22c55e';
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 10;
      ctx.fillRect(offX + ex.x * cell + 2, offY + ex.y * cell + 2, cell - 4, cell - 4);
      ctx.shadowBlur = 0;

      // Gems
      gemsRef.current.forEach(g => {
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(offX + g.x * cell + cell / 2, offY + g.y * cell + cell / 2, cell * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Player
      const p = playerRef.current;
      ctx.fillStyle = '#6366f1';
      ctx.shadowColor = '#6366f1';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(offX + p.x * cell + cell / 2, offY + p.y * cell + cell / 2, cell * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      engine.animFrameRef.current = requestAnimationFrame(loop);
    };
    engine.animFrameRef.current = requestAnimationFrame(loop);

    return () => { running = false; cancelAnimationFrame(engine.animFrameRef.current); };
  }, []);

  const handleStart = () => {
    engine.startGame();
    scoreRef.current = 0;
    initLevel(1);
  };

  return (
    <GameWrapper config={config} gameState={engine.gameState} onStart={handleStart}
      onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}
      extraHud={<div className="px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-emerald-400 text-xs pointer-events-none">Lv.{engine.gameState.level}</div>}
    >
      <canvas ref={engine.canvasRef} style={{ maxHeight: '100%', maxWidth: '100%' }} />
    </GameWrapper>
  );
}

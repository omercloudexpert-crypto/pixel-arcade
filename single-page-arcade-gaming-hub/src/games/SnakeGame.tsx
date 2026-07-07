// Snake Game - Classic snake with smooth movement, particles, and screen shake
import { useEffect, useRef, useCallback } from 'react';
import GameWrapper from '../components/GameWrapper';
import { useGameEngine } from '../hooks/useGameEngine';
import { getGameById } from './registry';
import { playCollect, playHit } from '../utils/sound';

const CELL = 20;

interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; color: string; size: number;
}

export default function SnakeGame({ onBack }: { onBack: () => void }) {
  const config = getGameById('snake')!;
  const engine = useGameEngine({ gameId: 'snake' });
  const stateRef = useRef(engine.gameState);
  const snakeRef = useRef<{ x: number; y: number }[]>([]);
  const dirRef = useRef({ x: 1, y: 0 });
  const nextDirRef = useRef({ x: 1, y: 0 });
  const foodRef = useRef({ x: 5, y: 5 });
  const scoreRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const shakeRef = useRef(0);
  const speedRef = useRef(120);
  const lastMoveRef = useRef(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => { stateRef.current = engine.gameState; }, [engine.gameState]);

  const spawnParticles = useCallback((x: number, y: number, color: string, count = 8) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      particlesRef.current.push({
        x: x * CELL + CELL / 2, y: y * CELL + CELL / 2,
        vx: Math.cos(angle) * (2 + Math.random() * 3),
        vy: Math.sin(angle) * (2 + Math.random() * 3),
        life: 1, maxLife: 0.5 + Math.random() * 0.3,
        color, size: 2 + Math.random() * 3,
      });
    }
  }, []);

  const placeFood = useCallback((cols: number, rows: number) => {
    let x: number, y: number;
    do {
      x = Math.floor(Math.random() * cols);
      y = Math.floor(Math.random() * rows);
    } while (snakeRef.current.some(s => s.x === x && s.y === y));
    foodRef.current = { x, y };
  }, []);

  const initGame = useCallback(() => {
    const canvas = engine.canvasRef.current;
    if (!canvas) return;
    const cols = Math.floor(canvas.width / CELL);
    const rows = Math.floor(canvas.height / CELL);
    const cx = Math.floor(cols / 2);
    const cy = Math.floor(rows / 2);
    snakeRef.current = [{ x: cx, y: cy }, { x: cx - 1, y: cy }, { x: cx - 2, y: cy }];
    dirRef.current = { x: 1, y: 0 };
    nextDirRef.current = { x: 1, y: 0 };
    scoreRef.current = 0;
    particlesRef.current = [];
    shakeRef.current = 0;
    speedRef.current = 120;
    lastMoveRef.current = 0;
    placeFood(cols, rows);
  }, [engine.canvasRef, placeFood]);

  // Main game loop
  useEffect(() => {
    const canvas = engine.canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let running = true;

    const resize = () => {
      const parent = canvas.parentElement!;
      canvas.width = Math.floor(parent.clientWidth / CELL) * CELL;
      canvas.height = Math.floor(parent.clientHeight / CELL) * CELL;
    };
    resize();
    window.addEventListener('resize', resize);

    const handleKey = (e: KeyboardEvent) => {
      if (stateRef.current.status !== 'playing') return;
      const d = dirRef.current;
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W':
          if (d.y !== 1) nextDirRef.current = { x: 0, y: -1 }; e.preventDefault(); break;
        case 'ArrowDown': case 's': case 'S':
          if (d.y !== -1) nextDirRef.current = { x: 0, y: 1 }; e.preventDefault(); break;
        case 'ArrowLeft': case 'a': case 'A':
          if (d.x !== 1) nextDirRef.current = { x: -1, y: 0 }; e.preventDefault(); break;
        case 'ArrowRight': case 'd': case 'D':
          if (d.x !== -1) nextDirRef.current = { x: 1, y: 0 }; e.preventDefault(); break;
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current || stateRef.current.status !== 'playing') return;
      const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
      const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
      if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
      const d = dirRef.current;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0 && d.x !== -1) nextDirRef.current = { x: 1, y: 0 };
        else if (dx < 0 && d.x !== 1) nextDirRef.current = { x: -1, y: 0 };
      } else {
        if (dy > 0 && d.y !== -1) nextDirRef.current = { x: 0, y: 1 };
        else if (dy < 0 && d.y !== 1) nextDirRef.current = { x: 0, y: -1 };
      }
    };

    window.addEventListener('keydown', handleKey);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchend', handleTouchEnd);

    let lastTime = 0;
    const loop = (time: number) => {
      if (!running) return;
      const dt = time - lastTime;
      lastTime = time;

      const cols = Math.floor(canvas.width / CELL);
      const rows = Math.floor(canvas.height / CELL);

      // Update
      if (stateRef.current.status === 'playing') {
        lastMoveRef.current += dt;
        if (lastMoveRef.current >= speedRef.current) {
          lastMoveRef.current = 0;
          dirRef.current = { ...nextDirRef.current };
          const head = snakeRef.current[0];
          const newHead = { x: head.x + dirRef.current.x, y: head.y + dirRef.current.y };

          // Check collisions
          if (newHead.x < 0 || newHead.x >= cols || newHead.y < 0 || newHead.y >= rows ||
            snakeRef.current.some(s => s.x === newHead.x && s.y === newHead.y)) {
            playHit();
            shakeRef.current = 10;
            spawnParticles(head.x, head.y, '#ef4444', 15);
            engine.gameOver(scoreRef.current);
            return;
          }

          snakeRef.current.unshift(newHead);

          // Check food
          if (newHead.x === foodRef.current.x && newHead.y === foodRef.current.y) {
            scoreRef.current += 10;
            playCollect();
            spawnParticles(foodRef.current.x, foodRef.current.y, '#22c55e', 12);
            engine.updateState({ score: scoreRef.current });
            placeFood(cols, rows);
            if (speedRef.current > 50) speedRef.current -= 2;
          } else {
            snakeRef.current.pop();
          }
        }
      }

      // Update particles
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.life -= dt / 1000 / p.maxLife;
        return p.life > 0;
      });

      // Shake decay
      if (shakeRef.current > 0) shakeRef.current *= 0.9;

      // Draw
      ctx.save();
      if (shakeRef.current > 0.5) {
        ctx.translate(
          (Math.random() - 0.5) * shakeRef.current,
          (Math.random() - 0.5) * shakeRef.current
        );
      }

      // Background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.3)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= cols; x++) {
        ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, canvas.height); ctx.stroke();
      }
      for (let y = 0; y <= rows; y++) {
        ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(canvas.width, y * CELL); ctx.stroke();
      }

      // Food with glow
      const food = foodRef.current;
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Snake
      snakeRef.current.forEach((seg, i) => {
        const t = i / snakeRef.current.length;
        const r = Math.floor(99 * (1 - t * 0.5));
        const g = Math.floor(102 + 153 * (1 - t));
        const b = Math.floor(241 * (1 - t * 0.3));
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        const padding = i === 0 ? 1 : 2;
        ctx.beginPath();
        ctx.roundRect(seg.x * CELL + padding, seg.y * CELL + padding, CELL - padding * 2, CELL - padding * 2, 4);
        ctx.fill();

        // Eyes on head
        if (i === 0) {
          ctx.fillStyle = '#fff';
          const ex = dirRef.current.x * 3;
          const ey = dirRef.current.y * 3;
          ctx.beginPath();
          ctx.arc(seg.x * CELL + CELL / 2 - 3 + ex, seg.y * CELL + CELL / 2 - 2 + ey, 2, 0, Math.PI * 2);
          ctx.arc(seg.x * CELL + CELL / 2 + 3 + ex, seg.y * CELL + CELL / 2 - 2 + ey, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Particles
      particlesRef.current.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      ctx.restore();
      engine.animFrameRef.current = requestAnimationFrame(loop);
    };

    engine.animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(engine.animFrameRef.current);
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  const handleStart = () => {
    engine.startGame();
    initGame();
  };

  return (
    <GameWrapper
      config={config}
      gameState={engine.gameState}
      onStart={handleStart}
      onPause={engine.pauseGame}
      onResume={engine.resumeGame}
      onRestart={handleStart}
      onBack={onBack}
    >
      <canvas ref={engine.canvasRef} className="w-full h-full" />
    </GameWrapper>
  );
}

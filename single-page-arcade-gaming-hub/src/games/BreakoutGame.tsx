// Brick Breaker - Breakout-style game with particles and power-ups
import { useEffect, useRef, useCallback } from 'react';
import GameWrapper from '../components/GameWrapper';
import { useGameEngine } from '../hooks/useGameEngine';
import { getGameById } from './registry';
import { playBounce, playHit, playCollect, playExplosion } from '../utils/sound';

interface Brick { x: number; y: number; w: number; h: number; color: string; hits: number; }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number; }

export default function BreakoutGame({ onBack }: { onBack: () => void }) {
  const config = getGameById('breakout')!;
  const engine = useGameEngine({ gameId: 'breakout' });
  const stateRef = useRef(engine.gameState);
  const paddleRef = useRef({ x: 0, w: 100, h: 14 });
  const ballRef = useRef({ x: 0, y: 0, vx: 4, vy: -4, r: 6, launched: false });
  const bricksRef = useRef<Brick[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const levelRef = useRef(1);
  const shakeRef = useRef(0);
  const mouseXRef = useRef(0);

  useEffect(() => { stateRef.current = engine.gameState; }, [engine.gameState]);

  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#6366f1', '#a855f7', '#ec4899'];

  const createBricks = useCallback((canvas: HTMLCanvasElement, level: number) => {
    const bricks: Brick[] = [];
    const cols = Math.min(10 + level, 14);
    const rows = Math.min(3 + level, 8);
    const bw = (canvas.width - 40) / cols;
    const bh = 22;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        bricks.push({
          x: 20 + c * bw, y: 50 + r * (bh + 4),
          w: bw - 4, h: bh,
          color: colors[r % colors.length],
          hits: r < 2 && level > 2 ? 2 : 1,
        });
      }
    return bricks;
  }, []);

  const initGame = useCallback(() => {
    const canvas = engine.canvasRef.current!;
    scoreRef.current = 0;
    livesRef.current = 3;
    levelRef.current = 1;
    particlesRef.current = [];
    shakeRef.current = 0;
    paddleRef.current = { x: canvas.width / 2 - 50, w: 100, h: 14 };
    ballRef.current = { x: canvas.width / 2, y: canvas.height - 40, vx: 4, vy: -4, r: 6, launched: false };
    bricksRef.current = createBricks(canvas, 1);
    engine.updateState({ lives: 3 });
  }, [engine, createBricks]);

  const spawnParticles = (x: number, y: number, color: string, count = 6) => {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      particlesRef.current.push({
        x, y, vx: Math.cos(a) * (2 + Math.random() * 4), vy: Math.sin(a) * (2 + Math.random() * 4),
        life: 1, color, size: 2 + Math.random() * 3,
      });
    }
  };

  useEffect(() => {
    const canvas = engine.canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let running = true;

    const resize = () => {
      const p = canvas.parentElement!;
      canvas.width = Math.min(p.clientWidth, 600);
      canvas.height = Math.min(p.clientHeight, 800);
    };
    resize();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseXRef.current = e.clientX - rect.left;
    };
    const handleTouchMove = (e: TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseXRef.current = e.touches[0].clientX - rect.left;
    };
    const handleClick = () => {
      if (stateRef.current.status === 'playing' && !ballRef.current.launched) {
        ballRef.current.launched = true;
        ballRef.current.vy = -5;
        ballRef.current.vx = (Math.random() - 0.5) * 4;
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === ' ' && stateRef.current.status === 'playing') handleClick();
      if (e.key === 'ArrowLeft') mouseXRef.current -= 30;
      if (e.key === 'ArrowRight') mouseXRef.current += 30;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
    canvas.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKey);

    const loop = (_time: number) => {
      void _time;
      if (!running) return;

      const paddle = paddleRef.current;
      const ball = ballRef.current;
      const W = canvas.width, H = canvas.height;

      if (stateRef.current.status === 'playing') {
        // Move paddle
        paddle.x += (mouseXRef.current - paddle.x - paddle.w / 2) * 0.2;
        paddle.x = Math.max(0, Math.min(W - paddle.w, paddle.x));

        if (!ball.launched) {
          ball.x = paddle.x + paddle.w / 2;
          ball.y = H - 30 - ball.r;
        } else {
          ball.x += ball.vx;
          ball.y += ball.vy;

          // Wall collisions
          if (ball.x - ball.r <= 0 || ball.x + ball.r >= W) { ball.vx *= -1; playBounce(); }
          if (ball.y - ball.r <= 0) { ball.vy *= -1; playBounce(); }

          // Paddle collision
          if (ball.vy > 0 && ball.y + ball.r >= H - 20 - paddle.h &&
            ball.x >= paddle.x && ball.x <= paddle.x + paddle.w) {
            ball.vy = -Math.abs(ball.vy);
            ball.vx = ((ball.x - paddle.x - paddle.w / 2) / (paddle.w / 2)) * 6;
            playBounce();
            spawnParticles(ball.x, ball.y, '#6366f1', 4);
          }

          // Ball fell
          if (ball.y > H + 20) {
            livesRef.current--;
            engine.updateState({ lives: livesRef.current });
            if (livesRef.current <= 0) {
              playExplosion();
              engine.gameOver(scoreRef.current);
            } else {
              playHit();
              ball.launched = false;
              ball.x = paddle.x + paddle.w / 2;
              ball.y = H - 30 - ball.r;
              ball.vx = 4;
              ball.vy = -4;
            }
          }

          // Brick collisions
          for (let i = bricksRef.current.length - 1; i >= 0; i--) {
            const b = bricksRef.current[i];
            if (ball.x + ball.r > b.x && ball.x - ball.r < b.x + b.w &&
              ball.y + ball.r > b.y && ball.y - ball.r < b.y + b.h) {
              b.hits--;
              if (b.hits <= 0) {
                bricksRef.current.splice(i, 1);
                scoreRef.current += 10 * levelRef.current;
                engine.updateState({ score: scoreRef.current });
                spawnParticles(b.x + b.w / 2, b.y + b.h / 2, b.color, 8);
                playCollect();
              } else {
                playBounce();
              }
              ball.vy *= -1;
              shakeRef.current = 3;
              break;
            }
          }

          // Level complete
          if (bricksRef.current.length === 0) {
            levelRef.current++;
            engine.updateState({ level: levelRef.current });
            bricksRef.current = createBricks(canvas, levelRef.current);
            ball.launched = false;
            ball.vx = 4;
            ball.vy = -4;
            const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
            ball.vx = (ball.vx / speed) * (speed + 0.5);
            ball.vy = (ball.vy / speed) * (speed + 0.5);
          }
        }
      }

      // Particles
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life -= 0.025;
        return p.life > 0;
      });
      if (shakeRef.current > 0) shakeRef.current *= 0.9;

      // Draw
      ctx.save();
      if (shakeRef.current > 0.5) ctx.translate((Math.random() - 0.5) * shakeRef.current, (Math.random() - 0.5) * shakeRef.current);

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, W, H);

      // Bricks
      bricksRef.current.forEach(b => {
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.roundRect(b.x, b.y, b.w, b.h, 4);
        ctx.fill();
        if (b.hits > 1) {
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.beginPath();
          ctx.roundRect(b.x, b.y, b.w, b.h, 4);
          ctx.fill();
        }
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(b.x + 2, b.y + 1, b.w - 4, 3);
      });

      // Paddle
      const grad = ctx.createLinearGradient(paddle.x, H - 20, paddle.x + paddle.w, H - 20);
      grad.addColorStop(0, '#6366f1');
      grad.addColorStop(1, '#a855f7');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(paddle.x, H - 20 - paddle.h, paddle.w, paddle.h, 6);
      ctx.fill();

      // Ball
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Lives
      for (let i = 0; i < livesRef.current; i++) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(W - 20 - i * 20, H - 8, 5, 0, Math.PI * 2);
        ctx.fill();
      }

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
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKey);
    };
  }, []);

  const handleStart = () => { engine.startGame(); initGame(); };

  return (
    <GameWrapper config={config} gameState={engine.gameState} onStart={handleStart}
      onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}
      extraHud={<>
        <div className="px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-red-400 text-xs">❤️ {engine.gameState.lives}</div>
        <div className="px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-indigo-400 text-xs">Lv.{engine.gameState.level}</div>
      </>}
    >
      <canvas ref={engine.canvasRef} style={{ maxHeight: '100%', maxWidth: '100%' }} />
    </GameWrapper>
  );
}

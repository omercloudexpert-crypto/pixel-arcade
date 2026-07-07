// Endless Runner - Jump over obstacles
import { useEffect, useRef, useCallback } from 'react';
import GameWrapper from '../components/GameWrapper';
import { useGameEngine } from '../hooks/useGameEngine';
import { getGameById } from './registry';
import { playBounce, playHit } from '../utils/sound';

interface Obstacle { x: number; w: number; h: number; type: 'low' | 'high'; }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; }

export default function RunnerGame({ onBack }: { onBack: () => void }) {
  const config = getGameById('runner')!;
  const engine = useGameEngine({ gameId: 'runner' });
  const stateRef = useRef(engine.gameState);
  const playerRef = useRef({ x: 60, y: 0, vy: 0, jumping: false, ducking: false, h: 40 });
  const obstaclesRef = useRef<Obstacle[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const speedRef = useRef(5);
  const distRef = useRef(0);
  const scoreRef = useRef(0);
  const groundY = useRef(0);
  const shakeRef = useRef(0);
  const frameRef = useRef(0);

  useEffect(() => { stateRef.current = engine.gameState; }, [engine.gameState]);

  const jump = useCallback(() => {
    const p = playerRef.current;
    if (!p.jumping && stateRef.current.status === 'playing') {
      p.vy = -12;
      p.jumping = true;
      playBounce();
    }
  }, []);

  const duck = useCallback((on: boolean) => {
    playerRef.current.ducking = on;
    playerRef.current.h = on ? 20 : 40;
  }, []);

  const initGame = useCallback(() => {
    const canvas = engine.canvasRef.current!;
    groundY.current = canvas.height - 50;
    playerRef.current = { x: 60, y: groundY.current, vy: 0, jumping: false, ducking: false, h: 40 };
    obstaclesRef.current = [];
    particlesRef.current = [];
    speedRef.current = 5;
    distRef.current = 0;
    scoreRef.current = 0;
    frameRef.current = 0;
  }, [engine.canvasRef]);

  useEffect(() => {
    const canvas = engine.canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let running = true;

    const resize = () => {
      const p = canvas.parentElement!;
      canvas.width = Math.min(p.clientWidth, 700);
      canvas.height = Math.min(p.clientHeight, 400);
      groundY.current = canvas.height - 50;
    };
    resize();

    const kd = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') { jump(); e.preventDefault(); }
      if (e.key === 'ArrowDown' || e.key === 's') { duck(true); e.preventDefault(); }
    };
    const ku = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 's') duck(false);
    };
    const handleTouch = () => jump();

    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    canvas.addEventListener('touchstart', handleTouch, { passive: true });
    canvas.addEventListener('click', handleTouch);

    const loop = () => {
      if (!running) return;
      const W = canvas.width, H = canvas.height;
      const GY = groundY.current;
      const player = playerRef.current;

      if (stateRef.current.status === 'playing') {
        frameRef.current++;
        distRef.current += speedRef.current;
        scoreRef.current = Math.floor(distRef.current / 10);
        engine.updateState({ score: scoreRef.current });
        speedRef.current = 5 + scoreRef.current * 0.005;

        // Physics
        player.vy += 0.6;
        player.y += player.vy;
        if (player.y >= GY) {
          player.y = GY;
          player.vy = 0;
          player.jumping = false;
        }

        // Spawn obstacles
        if (frameRef.current % Math.max(30, 60 - Math.floor(speedRef.current * 2)) === 0) {
          const type: 'low' | 'high' = Math.random() > 0.7 ? 'high' : 'low';
          obstaclesRef.current.push({
            x: W + 20,
            w: 20 + Math.random() * 20,
            h: type === 'low' ? 30 + Math.random() * 20 : 20,
            type,
          });
        }

        // Run particles
        if (frameRef.current % 3 === 0 && !player.jumping) {
          particlesRef.current.push({
            x: player.x - 5, y: GY, vx: -speedRef.current * 0.5 + (Math.random() - 0.5), vy: -Math.random() * 2,
            life: 0.5 + Math.random() * 0.3,
          });
        }

        // Update obstacles
        for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
          const o = obstaclesRef.current[i];
          o.x -= speedRef.current;
          if (o.x + o.w < 0) { obstaclesRef.current.splice(i, 1); continue; }

          // Collision
          const py = player.y - player.h;
          const px = player.x;
          if (o.type === 'low') {
            if (px + 15 > o.x && px - 10 < o.x + o.w && player.y > GY - o.h) {
              playHit();
              shakeRef.current = 10;
              engine.gameOver(scoreRef.current);
            }
          } else {
            const oy = GY - 50;
            if (px + 15 > o.x && px - 10 < o.x + o.w && py < oy + o.h && !player.ducking) {
              playHit();
              shakeRef.current = 10;
              engine.gameOver(scoreRef.current);
            }
          }
        }
      }

      // Particles
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx; p.y += p.vy; p.life -= 0.04;
        return p.life > 0;
      });
      if (shakeRef.current > 0) shakeRef.current *= 0.9;

      // Draw
      ctx.save();
      if (shakeRef.current > 0.5) ctx.translate((Math.random() - 0.5) * shakeRef.current, (Math.random() - 0.5) * shakeRef.current);

      // Sky
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, W, H);

      // Ground
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, GY, W, H - GY);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, GY); ctx.lineTo(W, GY); ctx.stroke();

      // Obstacles
      obstaclesRef.current.forEach(o => {
        if (o.type === 'low') {
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(o.x, GY - o.h, o.w, o.h);
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(o.x + 2, GY - o.h, o.w - 4, 4);
        } else {
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(o.x, GY - 50, o.w, o.h);
        }
      });

      // Player
      const pY = player.y - player.h;
      ctx.fillStyle = '#6366f1';
      ctx.beginPath();
      ctx.roundRect(player.x - 10, pY, 20, player.h, 4);
      ctx.fill();
      // Eyes
      ctx.fillStyle = '#fff';
      ctx.fillRect(player.x + 2, pY + 5, 5, 5);
      // Legs (running animation)
      if (!player.jumping) {
        const legOff = Math.sin(frameRef.current * 0.3) * 5;
        ctx.fillStyle = '#4f46e5';
        ctx.fillRect(player.x - 6, pY + player.h - 2, 6, 8 + legOff);
        ctx.fillRect(player.x + 2, pY + player.h - 2, 6, 8 - legOff);
      }

      // Particles
      particlesRef.current.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      ctx.restore();

      engine.animFrameRef.current = requestAnimationFrame(loop);
    };
    engine.animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      running = false; cancelAnimationFrame(engine.animFrameRef.current);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      canvas.removeEventListener('touchstart', handleTouch);
      canvas.removeEventListener('click', handleTouch);
    };
  }, []);

  const handleStart = () => { engine.startGame(); initGame(); };

  return (
    <GameWrapper config={config} gameState={engine.gameState} onStart={handleStart}
      onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}>
      <canvas ref={engine.canvasRef} style={{ maxHeight: '100%', maxWidth: '100%' }} />
    </GameWrapper>
  );
}

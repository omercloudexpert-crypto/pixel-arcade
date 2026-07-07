// Flappy Wings - Tap to fly through pipe gaps
import { useEffect, useRef, useCallback } from 'react';
import GameWrapper from '../components/GameWrapper';
import { useGameEngine } from '../hooks/useGameEngine';
import { getGameById } from './registry';
import { playBounce, playCollect, playHit } from '../utils/sound';

interface Pipe { x: number; gapY: number; scored: boolean; }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number; }

export default function FlappyGame({ onBack }: { onBack: () => void }) {
  const config = getGameById('flappy')!;
  const engine = useGameEngine({ gameId: 'flappy' });
  const stateRef = useRef(engine.gameState);
  const birdRef = useRef({ x: 80, y: 200, vy: 0, rotation: 0 });
  const pipesRef = useRef<Pipe[]>([]);
  const scoreRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const shakeRef = useRef(0);
  const frameRef = useRef(0);

  useEffect(() => { stateRef.current = engine.gameState; }, [engine.gameState]);

  const GRAVITY = 0.4;
  const FLAP = -7;
  const PIPE_W = 52;
  const GAP = 150;
  const SPEED = 2.5;

  const flap = useCallback(() => {
    if (stateRef.current.status !== 'playing') return;
    birdRef.current.vy = FLAP;
    playBounce();
    // Wing particles
    for (let i = 0; i < 4; i++) {
      particlesRef.current.push({
        x: birdRef.current.x, y: birdRef.current.y,
        vx: -1 - Math.random() * 2, vy: 1 + Math.random() * 2,
        life: 1, color: '#fbbf24', size: 2 + Math.random() * 2,
      });
    }
  }, []);

  const initGame = useCallback(() => {
    birdRef.current = { x: 80, y: 200, vy: 0, rotation: 0 };
    pipesRef.current = [];
    scoreRef.current = 0;
    particlesRef.current = [];
    shakeRef.current = 0;
    frameRef.current = 0;
  }, []);

  useEffect(() => {
    const canvas = engine.canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let running = true;

    const resize = () => {
      const p = canvas.parentElement!;
      canvas.width = Math.min(p.clientWidth, 400);
      canvas.height = Math.min(p.clientHeight, 700);
    };
    resize();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp') { flap(); e.preventDefault(); }
    };
    const handleClick = () => flap();

    window.addEventListener('keydown', handleKey);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchstart', handleClick, { passive: true });

    const loop = () => {
      if (!running) return;
      const bird = birdRef.current;
      const W = canvas.width, H = canvas.height;

      if (stateRef.current.status === 'playing') {
        frameRef.current++;
        // Physics
        bird.vy += GRAVITY;
        bird.y += bird.vy;
        bird.rotation = Math.min(bird.vy * 3, 80);

        // Spawn pipes
        if (frameRef.current % 90 === 0) {
          const gapY = 80 + Math.random() * (H - 80 - GAP - 80);
          pipesRef.current.push({ x: W, gapY, scored: false });
        }

        // Move pipes
        for (let i = pipesRef.current.length - 1; i >= 0; i--) {
          const p = pipesRef.current[i];
          p.x -= SPEED;
          if (p.x + PIPE_W < 0) { pipesRef.current.splice(i, 1); continue; }

          // Scoring
          if (!p.scored && p.x + PIPE_W < bird.x) {
            p.scored = true;
            scoreRef.current++;
            engine.updateState({ score: scoreRef.current });
            playCollect();
          }

          // Collision
          if (bird.x + 12 > p.x && bird.x - 12 < p.x + PIPE_W) {
            if (bird.y - 12 < p.gapY || bird.y + 12 > p.gapY + GAP) {
              playHit();
              shakeRef.current = 10;
              for (let j = 0; j < 15; j++) {
                const a = Math.random() * Math.PI * 2;
                particlesRef.current.push({
                  x: bird.x, y: bird.y,
                  vx: Math.cos(a) * (3 + Math.random() * 4), vy: Math.sin(a) * (3 + Math.random() * 4),
                  life: 1, color: '#fbbf24', size: 2 + Math.random() * 4,
                });
              }
              engine.gameOver(scoreRef.current);
            }
          }
        }

        // Floor/ceiling
        if (bird.y + 12 > H || bird.y - 12 < 0) {
          playHit();
          engine.gameOver(scoreRef.current);
        }
      }

      // Particles
      particlesRef.current = particlesRef.current.filter(pt => {
        pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.1; pt.life -= 0.03;
        return pt.life > 0;
      });
      if (shakeRef.current > 0) shakeRef.current *= 0.9;

      // Draw
      ctx.save();
      if (shakeRef.current > 0.5) ctx.translate((Math.random() - 0.5) * shakeRef.current, (Math.random() - 0.5) * shakeRef.current);

      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0, '#0ea5e9');
      skyGrad.addColorStop(1, '#38bdf8');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // Ground
      ctx.fillStyle = '#65a30d';
      ctx.fillRect(0, H - 20, W, 20);
      ctx.fillStyle = '#84cc16';
      ctx.fillRect(0, H - 20, W, 4);

      // Pipes
      pipesRef.current.forEach(p => {
        // Top pipe
        const pipeGrad = ctx.createLinearGradient(p.x, 0, p.x + PIPE_W, 0);
        pipeGrad.addColorStop(0, '#16a34a');
        pipeGrad.addColorStop(0.5, '#22c55e');
        pipeGrad.addColorStop(1, '#16a34a');
        ctx.fillStyle = pipeGrad;
        ctx.fillRect(p.x, 0, PIPE_W, p.gapY);
        ctx.fillRect(p.x - 4, p.gapY - 20, PIPE_W + 8, 20);
        // Bottom pipe
        ctx.fillRect(p.x, p.gapY + GAP, PIPE_W, H - p.gapY - GAP);
        ctx.fillRect(p.x - 4, p.gapY + GAP, PIPE_W + 8, 20);
      });

      // Bird
      ctx.save();
      ctx.translate(bird.x, bird.y);
      ctx.rotate((bird.rotation * Math.PI) / 180);

      // Body
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.ellipse(0, 0, 15, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      // Wing
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.ellipse(-5, 2, 10, 5, -0.3, 0, Math.PI * 2);
      ctx.fill();
      // Eye
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(6, -4, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(7, -4, 2.5, 0, Math.PI * 2);
      ctx.fill();
      // Beak
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(12, -1);
      ctx.lineTo(20, 1);
      ctx.lineTo(12, 4);
      ctx.fill();
      ctx.restore();

      // Particles
      particlesRef.current.forEach(pt => {
        ctx.globalAlpha = pt.life;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size * pt.life, 0, Math.PI * 2);
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
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('touchstart', handleClick);
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

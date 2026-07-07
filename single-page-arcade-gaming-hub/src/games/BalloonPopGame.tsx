// Balloon Pop - Pop balloons before they float away
import { useEffect, useRef, useCallback } from 'react';
import GameWrapper from '../components/GameWrapper';
import { useGameEngine } from '../hooks/useGameEngine';
import { getGameById } from './registry';
import { playCollect, playError } from '../utils/sound';

interface Balloon { x: number; y: number; r: number; color: string; speed: number; popped: boolean; popTimer: number; golden: boolean; }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number; }

export default function BalloonPopGame({ onBack }: { onBack: () => void }) {
  const config = getGameById('balloonpop')!;
  const engine = useGameEngine({ gameId: 'balloonpop' });
  const stateRef = useRef(engine.gameState);
  const balloonsRef = useRef<Balloon[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const scoreRef = useRef(0);
  const missedRef = useRef(0);
  const frameRef = useRef(0);

  useEffect(() => { stateRef.current = engine.gameState; }, [engine.gameState]);

  const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ec4899', '#f97316'];

  const spawnBalloon = useCallback((W: number, H: number) => {
    const golden = Math.random() < 0.05;
    balloonsRef.current.push({
      x: 20 + Math.random() * (W - 40),
      y: H + 30,
      r: 18 + Math.random() * 12,
      color: golden ? '#ffd700' : COLORS[Math.floor(Math.random() * COLORS.length)],
      speed: 1 + Math.random() * 2,
      popped: false, popTimer: 0, golden,
    });
  }, []);

  const initGame = useCallback(() => {
    balloonsRef.current = [];
    particlesRef.current = [];
    scoreRef.current = 0;
    missedRef.current = 0;
    frameRef.current = 0;
  }, []);

  useEffect(() => {
    const canvas = engine.canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let running = true;

    const resize = () => {
      const p = canvas.parentElement!;
      canvas.width = Math.min(p.clientWidth, 500);
      canvas.height = Math.min(p.clientHeight, 700);
    };
    resize();

    const handleClick = (e: MouseEvent | TouchEvent) => {
      if (stateRef.current.status !== 'playing') return;
      const rect = canvas.getBoundingClientRect();
      let cx: number, cy: number;
      if ('touches' in e) {
        cx = e.changedTouches[0].clientX - rect.left;
        cy = e.changedTouches[0].clientY - rect.top;
      } else {
        cx = e.clientX - rect.left;
        cy = e.clientY - rect.top;
      }

      let hit = false;
      for (const b of balloonsRef.current) {
        if (!b.popped && Math.hypot(cx - b.x, cy - b.y) < b.r + 5) {
          b.popped = true;
          b.popTimer = 15;
          const pts = b.golden ? 50 : 10;
          scoreRef.current += pts;
          engine.updateState({ score: scoreRef.current });
          playCollect();
          for (let i = 0; i < 8; i++) {
            const a = Math.random() * Math.PI * 2;
            particlesRef.current.push({
              x: b.x, y: b.y, vx: Math.cos(a) * (3 + Math.random() * 3), vy: Math.sin(a) * (3 + Math.random() * 3),
              life: 1, color: b.color, size: 3 + Math.random() * 4,
            });
          }
          hit = true;
          break;
        }
      }
      if (!hit) playError();
    };

    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchstart', (e) => { handleClick(e); e.preventDefault(); }, { passive: false });

    const loop = () => {
      if (!running) return;
      const W = canvas.width, H = canvas.height;

      if (stateRef.current.status === 'playing') {
        frameRef.current++;
        const spawnRate = Math.max(15, 40 - Math.floor(frameRef.current / 300));
        if (frameRef.current % spawnRate === 0) spawnBalloon(W, H);

        // Update balloons
        for (let i = balloonsRef.current.length - 1; i >= 0; i--) {
          const b = balloonsRef.current[i];
          if (b.popped) {
            b.popTimer--;
            if (b.popTimer <= 0) balloonsRef.current.splice(i, 1);
          } else {
            b.y -= b.speed;
            b.x += Math.sin(frameRef.current * 0.02 + i) * 0.5;
            if (b.y < -b.r * 2) {
              balloonsRef.current.splice(i, 1);
              missedRef.current++;
              if (missedRef.current >= 10) engine.gameOver(scoreRef.current);
            }
          }
        }
      }

      // Particles
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life -= 0.03;
        return p.life > 0;
      });

      // Draw
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0, '#1e3a5f');
      skyGrad.addColorStop(1, '#0c1929');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // Balloons
      balloonsRef.current.forEach(b => {
        if (b.popped) return;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.ellipse(b.x, b.y, b.r * 0.8, b.r, 0, 0, Math.PI * 2);
        ctx.fill();
        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.ellipse(b.x - b.r * 0.25, b.y - b.r * 0.3, b.r * 0.2, b.r * 0.3, -0.3, 0, Math.PI * 2);
        ctx.fill();
        // String
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y + b.r);
        ctx.quadraticCurveTo(b.x + 5, b.y + b.r + 15, b.x - 3, b.y + b.r + 25);
        ctx.stroke();
        if (b.golden) {
          ctx.strokeStyle = '#ffd700';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r + 4, 0, Math.PI * 2);
          ctx.stroke();
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

      // Missed indicator
      if (stateRef.current.status === 'playing') {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(10, H - 24, 120, 16);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(10, H - 24, (missedRef.current / 10) * 120, 16);
        ctx.fillStyle = '#fff';
        ctx.font = '10px sans-serif';
        ctx.fillText(`Missed: ${missedRef.current}/10`, 14, H - 13);
      }

      engine.animFrameRef.current = requestAnimationFrame(loop);
    };
    engine.animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      running = false; cancelAnimationFrame(engine.animFrameRef.current);
      canvas.removeEventListener('click', handleClick);
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

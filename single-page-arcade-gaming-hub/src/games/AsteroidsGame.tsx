// Asteroids - Navigate and shoot asteroids
import { useEffect, useRef, useCallback } from 'react';
import GameWrapper from '../components/GameWrapper';
import { useGameEngine } from '../hooks/useGameEngine';
import { getGameById } from './registry';
import { playShoot, playExplosion, playBounce } from '../utils/sound';

interface Obj { x: number; y: number; vx: number; vy: number; r: number; angle: number; }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; }

export default function AsteroidsGame({ onBack }: { onBack: () => void }) {
  const config = getGameById('asteroids')!;
  const engine = useGameEngine({ gameId: 'asteroids' });
  const stateRef = useRef(engine.gameState);
  const shipRef = useRef<Obj>({ x: 0, y: 0, vx: 0, vy: 0, r: 15, angle: -Math.PI / 2 });
  const asteroidsRef = useRef<Obj[]>([]);
  const bulletsRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number }[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const keysRef = useRef<Set<string>>(new Set());
  const shakeRef = useRef(0);
  const invulnRef = useRef(0);

  useEffect(() => { stateRef.current = engine.gameState; }, [engine.gameState]);

  const spawnAsteroids = useCallback((count: number, W: number, H: number, avoid?: { x: number; y: number }) => {
    const arr: Obj[] = [];
    for (let i = 0; i < count; i++) {
      let x: number, y: number;
      do {
        x = Math.random() * W;
        y = Math.random() * H;
      } while (avoid && Math.hypot(x - avoid.x, y - avoid.y) < 100);
      const a = Math.random() * Math.PI * 2;
      const s = 0.5 + Math.random() * 1.5;
      arr.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: 25 + Math.random() * 15, angle: Math.random() * Math.PI * 2 });
    }
    return arr;
  }, []);

  const initGame = useCallback(() => {
    const canvas = engine.canvasRef.current!;
    const W = canvas.width, H = canvas.height;
    shipRef.current = { x: W / 2, y: H / 2, vx: 0, vy: 0, r: 15, angle: -Math.PI / 2 };
    asteroidsRef.current = spawnAsteroids(4, W, H, { x: W / 2, y: H / 2 });
    bulletsRef.current = [];
    particlesRef.current = [];
    scoreRef.current = 0;
    livesRef.current = 3;
    shakeRef.current = 0;
    invulnRef.current = 120;
    engine.updateState({ lives: 3 });
  }, [engine, spawnAsteroids]);

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

    const kd = (e: KeyboardEvent) => { keysRef.current.add(e.key); if (e.key === ' ') e.preventDefault(); };
    const ku = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    let shootCooldown = 0;

    const loop = () => {
      if (!running) return;
      const W = canvas.width, H = canvas.height;
      const ship = shipRef.current;
      const keys = keysRef.current;

      if (stateRef.current.status === 'playing') {
        if (invulnRef.current > 0) invulnRef.current--;

        // Controls
        if (keys.has('ArrowLeft') || keys.has('a')) ship.angle -= 0.07;
        if (keys.has('ArrowRight') || keys.has('d')) ship.angle += 0.07;
        if (keys.has('ArrowUp') || keys.has('w')) {
          ship.vx += Math.cos(ship.angle) * 0.15;
          ship.vy += Math.sin(ship.angle) * 0.15;
          // Thrust particles
          for (let i = 0; i < 2; i++) {
            particlesRef.current.push({
              x: ship.x - Math.cos(ship.angle) * ship.r,
              y: ship.y - Math.sin(ship.angle) * ship.r,
              vx: -Math.cos(ship.angle) * (2 + Math.random() * 2) + (Math.random() - 0.5),
              vy: -Math.sin(ship.angle) * (2 + Math.random() * 2) + (Math.random() - 0.5),
              life: 0.5 + Math.random() * 0.3,
            });
          }
        }

        if (keys.has(' ') && shootCooldown <= 0) {
          bulletsRef.current.push({
            x: ship.x + Math.cos(ship.angle) * ship.r,
            y: ship.y + Math.sin(ship.angle) * ship.r,
            vx: Math.cos(ship.angle) * 8 + ship.vx * 0.5,
            vy: Math.sin(ship.angle) * 8 + ship.vy * 0.5,
            life: 60,
          });
          shootCooldown = 8;
          playShoot();
        }
        if (shootCooldown > 0) shootCooldown--;

        // Physics
        ship.x += ship.vx; ship.y += ship.vy;
        ship.vx *= 0.99; ship.vy *= 0.99;

        // Wrap
        if (ship.x < 0) ship.x = W; if (ship.x > W) ship.x = 0;
        if (ship.y < 0) ship.y = H; if (ship.y > H) ship.y = 0;

        // Bullets
        bulletsRef.current = bulletsRef.current.filter(b => {
          b.x += b.vx; b.y += b.vy; b.life--;
          if (b.x < 0) b.x = W; if (b.x > W) b.x = 0;
          if (b.y < 0) b.y = H; if (b.y > H) b.y = 0;
          return b.life > 0;
        });

        // Asteroids
        asteroidsRef.current.forEach(a => {
          a.x += a.vx; a.y += a.vy; a.angle += 0.01;
          if (a.x < -a.r) a.x = W + a.r; if (a.x > W + a.r) a.x = -a.r;
          if (a.y < -a.r) a.y = H + a.r; if (a.y > H + a.r) a.y = -a.r;
        });

        // Bullet-asteroid collision
        for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
          const b = bulletsRef.current[i];
          for (let j = asteroidsRef.current.length - 1; j >= 0; j--) {
            const a = asteroidsRef.current[j];
            if (Math.hypot(b.x - a.x, b.y - a.y) < a.r) {
              bulletsRef.current.splice(i, 1);
              // Split asteroid
              if (a.r > 15) {
                for (let k = 0; k < 2; k++) {
                  const ang = Math.random() * Math.PI * 2;
                  const spd = 1 + Math.random() * 2;
                  asteroidsRef.current.push({ x: a.x, y: a.y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, r: a.r * 0.6, angle: 0 });
                }
              }
              // Particles
              for (let k = 0; k < 8; k++) {
                const ang = Math.random() * Math.PI * 2;
                particlesRef.current.push({ x: a.x, y: a.y, vx: Math.cos(ang) * (2 + Math.random() * 3), vy: Math.sin(ang) * (2 + Math.random() * 3), life: 1 });
              }
              asteroidsRef.current.splice(j, 1);
              scoreRef.current += Math.round(100 / a.r * 10);
              engine.updateState({ score: scoreRef.current });
              playExplosion();
              shakeRef.current = 4;
              break;
            }
          }
        }

        // Ship-asteroid collision
        if (invulnRef.current <= 0) {
          for (const a of asteroidsRef.current) {
            if (Math.hypot(ship.x - a.x, ship.y - a.y) < ship.r + a.r * 0.7) {
              livesRef.current--;
              engine.updateState({ lives: livesRef.current });
              shakeRef.current = 10;
              invulnRef.current = 120;
              playBounce();
              for (let k = 0; k < 12; k++) {
                const ang = Math.random() * Math.PI * 2;
                particlesRef.current.push({ x: ship.x, y: ship.y, vx: Math.cos(ang) * 4, vy: Math.sin(ang) * 4, life: 1 });
              }
              if (livesRef.current <= 0) { engine.gameOver(scoreRef.current); }
              break;
            }
          }
        }

        // Spawn more asteroids
        if (asteroidsRef.current.length === 0) {
          asteroidsRef.current = spawnAsteroids(4 + Math.floor(scoreRef.current / 500), W, H, ship);
        }
      }

      // Particles
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx; p.y += p.vy; p.life -= 0.03;
        return p.life > 0;
      });
      if (shakeRef.current > 0) shakeRef.current *= 0.9;

      // Draw
      ctx.save();
      if (shakeRef.current > 0.5) ctx.translate((Math.random() - 0.5) * shakeRef.current, (Math.random() - 0.5) * shakeRef.current);

      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, W, H);

      // Ship
      if (invulnRef.current <= 0 || Math.floor(invulnRef.current / 5) % 2 === 0) {
        ctx.save();
        ctx.translate(ship.x, ship.y);
        ctx.rotate(ship.angle);
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ship.r, 0);
        ctx.lineTo(-ship.r * 0.7, -ship.r * 0.6);
        ctx.lineTo(-ship.r * 0.4, 0);
        ctx.lineTo(-ship.r * 0.7, ship.r * 0.6);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }

      // Bullets
      ctx.fillStyle = '#22d3ee';
      bulletsRef.current.forEach(b => {
        ctx.beginPath(); ctx.arc(b.x, b.y, 2, 0, Math.PI * 2); ctx.fill();
      });

      // Asteroids
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      asteroidsRef.current.forEach(a => {
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(a.angle);
        ctx.beginPath();
        const verts = 8;
        for (let i = 0; i <= verts; i++) {
          const ang = (Math.PI * 2 * i) / verts;
          const r = a.r * (0.7 + 0.3 * Math.sin(i * 3.7));
          if (i === 0) ctx.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
          else ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      });

      // Particles
      particlesRef.current.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;
      ctx.restore();

      engine.animFrameRef.current = requestAnimationFrame(loop);
    };
    engine.animFrameRef.current = requestAnimationFrame(loop);

    return () => { running = false; cancelAnimationFrame(engine.animFrameRef.current); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, []);

  const handleStart = () => { engine.startGame(); initGame(); };

  return (
    <GameWrapper config={config} gameState={engine.gameState} onStart={handleStart}
      onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}
      extraHud={<div className="px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-red-400 text-xs pointer-events-none">❤️ {engine.gameState.lives}</div>}
    >
      <canvas ref={engine.canvasRef} style={{ maxHeight: '100%', maxWidth: '100%' }} />
    </GameWrapper>
  );
}

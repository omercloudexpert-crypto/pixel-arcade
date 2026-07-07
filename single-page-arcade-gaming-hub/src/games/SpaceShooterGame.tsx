// Space Shooter - Shoot waves of alien enemies
import { useEffect, useRef, useCallback } from 'react';
import GameWrapper from '../components/GameWrapper';
import { useGameEngine } from '../hooks/useGameEngine';
import { getGameById } from './registry';
import { playShoot, playExplosion, playHit } from '../utils/sound';

interface Entity { x: number; y: number; w: number; h: number; }
interface Bullet extends Entity { vy: number; }
interface Enemy extends Entity { vx: number; vy: number; hp: number; type: number; }
interface Star { x: number; y: number; speed: number; size: number; }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number; }

export default function SpaceShooterGame({ onBack }: { onBack: () => void }) {
  const config = getGameById('spaceshooter')!;
  const engine = useGameEngine({ gameId: 'spaceshooter' });
  const stateRef = useRef(engine.gameState);
  const playerRef = useRef({ x: 0, y: 0, w: 30, h: 30 });
  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const enemyBulletsRef = useRef<Bullet[]>([]);
  const starsRef = useRef<Star[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const frameRef = useRef(0);
  const shakeRef = useRef(0);
  const keysRef = useRef<Set<string>>(new Set());
  const shootTimerRef = useRef(0);
  const touchRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => { stateRef.current = engine.gameState; }, [engine.gameState]);

  const initGame = useCallback(() => {
    const canvas = engine.canvasRef.current!;
    playerRef.current = { x: canvas.width / 2 - 15, y: canvas.height - 60, w: 30, h: 30 };
    bulletsRef.current = [];
    enemiesRef.current = [];
    enemyBulletsRef.current = [];
    scoreRef.current = 0;
    livesRef.current = 3;
    frameRef.current = 0;
    shakeRef.current = 0;
    shootTimerRef.current = 0;
    particlesRef.current = [];
    starsRef.current = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: 0.5 + Math.random() * 2,
      size: Math.random() * 2,
    }));
  }, [engine.canvasRef]);

  const spawnParticles = (x: number, y: number, color: string, count = 8) => {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      particlesRef.current.push({
        x, y, vx: Math.cos(a) * (2 + Math.random() * 5), vy: Math.sin(a) * (2 + Math.random() * 5),
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
      canvas.width = Math.min(p.clientWidth, 500);
      canvas.height = Math.min(p.clientHeight, 700);
    };
    resize();

    const kd = (e: KeyboardEvent) => { keysRef.current.add(e.key); if (e.key === ' ') e.preventDefault(); };
    const ku = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    const tm = (e: TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      touchRef.current = { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    };
    const te = () => { touchRef.current = null; };

    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    canvas.addEventListener('touchmove', tm, { passive: true });
    canvas.addEventListener('touchstart', tm, { passive: true });
    canvas.addEventListener('touchend', te);

    const loop = () => {
      if (!running) return;
      const W = canvas.width, H = canvas.height;
      const player = playerRef.current;
      const keys = keysRef.current;

      if (stateRef.current.status === 'playing') {
        frameRef.current++;
        const spd = 5;

        // Player movement
        if (keys.has('ArrowLeft') || keys.has('a')) player.x -= spd;
        if (keys.has('ArrowRight') || keys.has('d')) player.x += spd;
        if (keys.has('ArrowUp') || keys.has('w')) player.y -= spd;
        if (keys.has('ArrowDown') || keys.has('s')) player.y += spd;

        if (touchRef.current) {
          player.x += (touchRef.current.x - player.x - player.w / 2) * 0.1;
          player.y += (touchRef.current.y - player.y - player.h / 2) * 0.1;
        }

        player.x = Math.max(0, Math.min(W - player.w, player.x));
        player.y = Math.max(0, Math.min(H - player.h, player.y));

        // Auto-shoot
        shootTimerRef.current++;
        if (shootTimerRef.current >= 8 || keys.has(' ') || touchRef.current) {
          if (shootTimerRef.current >= 8) {
            shootTimerRef.current = 0;
            bulletsRef.current.push({ x: player.x + player.w / 2 - 2, y: player.y - 5, w: 4, h: 10, vy: -8 });
            playShoot();
          }
        }

        // Spawn enemies
        if (frameRef.current % 40 === 0) {
          const type = Math.random() > 0.7 ? 1 : 0;
          enemiesRef.current.push({
            x: Math.random() * (W - 30), y: -30, w: type ? 35 : 25, h: type ? 35 : 25,
            vx: (Math.random() - 0.5) * 3, vy: 1.5 + Math.random() * 2,
            hp: type ? 3 : 1, type,
          });
        }

        // Update bullets
        bulletsRef.current = bulletsRef.current.filter(b => { b.y += b.vy; return b.y > -10; });

        // Update enemy bullets
        enemyBulletsRef.current = enemyBulletsRef.current.filter(b => { b.y += b.vy; return b.y < H + 10; });

        // Update enemies
        for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
          const e = enemiesRef.current[i];
          e.x += e.vx; e.y += e.vy;
          if (e.x < 0 || e.x > W - e.w) e.vx *= -1;
          if (e.y > H + 40) { enemiesRef.current.splice(i, 1); continue; }

          // Enemy shoots
          if (e.type === 1 && Math.random() < 0.005) {
            enemyBulletsRef.current.push({ x: e.x + e.w / 2 - 2, y: e.y + e.h, w: 4, h: 8, vy: 4 });
          }

          // Bullet-enemy collision
          for (let j = bulletsRef.current.length - 1; j >= 0; j--) {
            const b = bulletsRef.current[j];
            if (b.x < e.x + e.w && b.x + b.w > e.x && b.y < e.y + e.h && b.y + b.h > e.y) {
              bulletsRef.current.splice(j, 1);
              e.hp--;
              if (e.hp <= 0) {
                enemiesRef.current.splice(i, 1);
                scoreRef.current += e.type === 1 ? 30 : 10;
                engine.updateState({ score: scoreRef.current });
                spawnParticles(e.x + e.w / 2, e.y + e.h / 2, e.type === 1 ? '#ef4444' : '#f97316', 10);
                playExplosion();
                shakeRef.current = 4;
              } else {
                spawnParticles(b.x, b.y, '#fbbf24', 3);
                playHit();
              }
              break;
            }
          }

          // Enemy-player collision
          if (e.x < player.x + player.w && e.x + e.w > player.x &&
            e.y < player.y + player.h && e.y + e.h > player.y) {
            enemiesRef.current.splice(i, 1);
            livesRef.current--;
            engine.updateState({ lives: livesRef.current });
            shakeRef.current = 10;
            spawnParticles(player.x + player.w / 2, player.y, '#6366f1', 12);
            playHit();
            if (livesRef.current <= 0) engine.gameOver(scoreRef.current);
          }
        }

        // Enemy bullet-player collision
        for (let j = enemyBulletsRef.current.length - 1; j >= 0; j--) {
          const b = enemyBulletsRef.current[j];
          if (b.x < player.x + player.w && b.x + b.w > player.x &&
            b.y < player.y + player.h && b.y + b.h > player.y) {
            enemyBulletsRef.current.splice(j, 1);
            livesRef.current--;
            engine.updateState({ lives: livesRef.current });
            shakeRef.current = 6;
            playHit();
            if (livesRef.current <= 0) engine.gameOver(scoreRef.current);
          }
        }
      }

      // Stars
      starsRef.current.forEach(s => { s.y += s.speed; if (s.y > H) { s.y = 0; s.x = Math.random() * W; } });

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

      // Stars
      starsRef.current.forEach(s => {
        ctx.fillStyle = `rgba(255,255,255,${0.3 + s.speed * 0.3})`;
        ctx.fillRect(s.x, s.y, s.size, s.size);
      });

      // Player
      ctx.fillStyle = '#6366f1';
      ctx.beginPath();
      ctx.moveTo(player.x + player.w / 2, player.y);
      ctx.lineTo(player.x + player.w, player.y + player.h);
      ctx.lineTo(player.x + player.w / 2, player.y + player.h - 8);
      ctx.lineTo(player.x, player.y + player.h);
      ctx.closePath();
      ctx.fill();
      // Engine glow
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(player.x + player.w / 2, player.y + player.h + 2, 4 + Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();

      // Bullets
      ctx.fillStyle = '#22d3ee';
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 8;
      bulletsRef.current.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));
      ctx.shadowBlur = 0;

      // Enemy bullets
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 6;
      enemyBulletsRef.current.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));
      ctx.shadowBlur = 0;

      // Enemies
      enemiesRef.current.forEach(e => {
        if (e.type === 0) {
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.moveTo(e.x + e.w / 2, e.y + e.h);
          ctx.lineTo(e.x, e.y);
          ctx.lineTo(e.x + e.w, e.y);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(e.x + e.w / 2, e.y + e.h / 2, e.w / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fca5a5';
          ctx.beginPath();
          ctx.arc(e.x + e.w / 2, e.y + e.h / 2, e.w / 4, 0, Math.PI * 2);
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
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      canvas.removeEventListener('touchmove', tm);
      canvas.removeEventListener('touchstart', tm);
      canvas.removeEventListener('touchend', te);
    };
  }, []);

  const handleStart = () => { engine.startGame(); initGame(); };

  return (
    <GameWrapper config={config} gameState={engine.gameState} onStart={handleStart}
      onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}
      extraHud={<div className="px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-red-400 text-xs">❤️ {engine.gameState.lives}</div>}
    >
      <canvas ref={engine.canvasRef} style={{ maxHeight: '100%', maxWidth: '100%' }} />
    </GameWrapper>
  );
}

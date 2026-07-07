// CanvasGameFactory - Generates many canvas-based games from config
// Each game is a self-contained canvas component with full game loop
import { useEffect, useRef, useCallback } from 'react';
import GameWrapper from '../components/GameWrapper';
import { useGameEngine } from '../hooks/useGameEngine';
import { getGameById } from './registry';
import { playCollect, playHit, playBounce, playShoot, playExplosion, playScore as _playScore } from '../utils/sound';
const playScore = _playScore;

// ==================== HELICOPTER GAME ====================
export function HelicopterGame({ onBack }: { onBack: () => void }) {
  const config = getGameById('helicopter')!;
  const engine = useGameEngine({ gameId: 'helicopter' });
  const stateRef = useRef(engine.gameState);
  useEffect(() => { stateRef.current = engine.gameState; }, [engine.gameState]);

  const heliRef = useRef({ y: 200, vy: 0 });
  const obstaclesRef = useRef<{ x: number; gapY: number; gapH: number }[]>([]);
  const scoreRef = useRef(0);
  const frameRef = useRef(0);
  const holdRef = useRef(false);

  const initGame = useCallback(() => {
    const c = engine.canvasRef.current!;
    heliRef.current = { y: c.height / 2, vy: 0 };
    obstaclesRef.current = [];
    scoreRef.current = 0;
    frameRef.current = 0;
  }, [engine.canvasRef]);

  useEffect(() => {
    const c = engine.canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    let running = true;
    const p = c.parentElement!;
    c.width = Math.min(p.clientWidth, 600);
    c.height = Math.min(p.clientHeight, 500);

    const down = () => { holdRef.current = true; };
    const up = () => { holdRef.current = false; };
    const kd = (e: KeyboardEvent) => { if (e.key === ' ' || e.key === 'ArrowUp') { holdRef.current = true; e.preventDefault(); } };
    const ku = (e: KeyboardEvent) => { if (e.key === ' ' || e.key === 'ArrowUp') holdRef.current = false; };
    c.addEventListener('mousedown', down); c.addEventListener('mouseup', up);
    c.addEventListener('touchstart', down, { passive: true }); c.addEventListener('touchend', up);
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);

    const loop = () => {
      if (!running) return;
      const W = c.width, H = c.height, h = heliRef.current;
      if (stateRef.current.status === 'playing') {
        frameRef.current++;
        h.vy += holdRef.current ? -0.4 : 0.3;
        h.vy = Math.max(-5, Math.min(5, h.vy));
        h.y += h.vy;
        if (frameRef.current % 60 === 0) {
          const gapH = Math.max(100, 180 - scoreRef.current * 2);
          obstaclesRef.current.push({ x: W, gapY: 40 + Math.random() * (H - 80 - gapH), gapH });
        }
        for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
          const o = obstaclesRef.current[i];
          o.x -= 3;
          if (o.x < -30) { obstaclesRef.current.splice(i, 1); scoreRef.current++; engine.updateState({ score: scoreRef.current }); playScore(); continue; }
          if (60 + 20 > o.x && 60 - 20 < o.x + 25 && (h.y - 10 < o.gapY || h.y + 10 > o.gapY + o.gapH)) {
            playHit(); engine.gameOver(scoreRef.current); return;
          }
        }
        if (h.y < 10 || h.y > H - 10) { playHit(); engine.gameOver(scoreRef.current); return; }
      }
      ctx.fillStyle = '#0c1929'; ctx.fillRect(0, 0, W, H);
      // Cave walls
      ctx.fillStyle = '#1e3a5f';
      ctx.fillRect(0, 0, W, 10); ctx.fillRect(0, H - 10, W, 10);
      // Obstacles
      obstaclesRef.current.forEach(o => {
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(o.x, 0, 25, o.gapY);
        ctx.fillRect(o.x, o.gapY + o.gapH, 25, H - o.gapY - o.gapH);
      });
      // Helicopter
      ctx.fillStyle = '#6366f1';
      ctx.beginPath(); ctx.ellipse(60, h.y, 18, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#818cf8';
      ctx.fillRect(45, h.y - 14, 30, 4); // rotor
      ctx.fillStyle = '#4f46e5';
      ctx.beginPath(); ctx.moveTo(42, h.y); ctx.lineTo(36, h.y + 8); ctx.lineTo(42, h.y + 6); ctx.fill(); // tail
      // Thrust particles
      if (holdRef.current && stateRef.current.status === 'playing') {
        for (let i = 0; i < 3; i++) {
          ctx.globalAlpha = 0.3 + Math.random() * 0.4;
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath(); ctx.arc(45 + Math.random() * 5, h.y + 8 + Math.random() * 10, 2 + Math.random() * 3, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      engine.animFrameRef.current = requestAnimationFrame(loop);
    };
    engine.animFrameRef.current = requestAnimationFrame(loop);
    return () => { running = false; cancelAnimationFrame(engine.animFrameRef.current); c.removeEventListener('mousedown', down); c.removeEventListener('mouseup', up); c.removeEventListener('touchstart', down); c.removeEventListener('touchend', up); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, []);

  const handleStart = () => { engine.startGame(); initGame(); };
  return (<GameWrapper config={config} gameState={engine.gameState} onStart={handleStart} onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}><canvas ref={engine.canvasRef} style={{ maxHeight: '100%', maxWidth: '100%' }} /></GameWrapper>);
}

// ==================== FROG CROSSING ====================
export function FrogCrossingGame({ onBack }: { onBack: () => void }) {
  const config = getGameById('frogcrossing')!;
  const engine = useGameEngine({ gameId: 'frogcrossing' });
  const stateRef = useRef(engine.gameState);
  useEffect(() => { stateRef.current = engine.gameState; }, [engine.gameState]);
  const frogRef = useRef({ x: 0, y: 0, row: 0 });
  const lanesRef = useRef<{ y: number; speed: number; cars: { x: number; w: number }[]; dir: number }[]>([]);
  const scoreRef = useRef(0);
  const bestRowRef = useRef(0);
  const CELL = 40;
  const touchRef = useRef<{ x: number; y: number } | null>(null);

  const initGame = useCallback(() => {
    const c = engine.canvasRef.current!;
    const cols = Math.floor(c.width / CELL);
    frogRef.current = { x: Math.floor(cols / 2) * CELL, y: c.height - CELL, row: 0 };
    bestRowRef.current = 0; scoreRef.current = 0;
    const lanes: typeof lanesRef.current = [];
    for (let i = 1; i < Math.floor(c.height / CELL) - 1; i++) {
      const speed = 1 + Math.random() * 2.5;
      const dir = i % 2 === 0 ? 1 : -1;
      const cars: { x: number; w: number }[] = [];
      const count = 2 + Math.floor(Math.random() * 3);
      for (let j = 0; j < count; j++) cars.push({ x: j * (c.width / count) + Math.random() * 60, w: 30 + Math.random() * 40 });
      lanes.push({ y: c.height - (i + 1) * CELL, speed, cars, dir });
    }
    lanesRef.current = lanes;
  }, [engine.canvasRef]);

  useEffect(() => {
    const c = engine.canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!; let running = true;
    const p = c.parentElement!;
    c.width = Math.min(p.clientWidth, 500);
    c.height = Math.min(p.clientHeight, 600);

    const move = (dx: number, dy: number) => {
      if (stateRef.current.status !== 'playing') return;
      const f = frogRef.current;
      f.x = Math.max(0, Math.min(c.width - CELL, f.x + dx * CELL));
      f.y = Math.max(0, Math.min(c.height - CELL, f.y + dy * CELL));
      if (dy < 0) { f.row++; if (f.row > bestRowRef.current) { bestRowRef.current = f.row; scoreRef.current += 10; engine.updateState({ score: scoreRef.current }); } }
      if (f.y <= 0) { scoreRef.current += 100; engine.updateState({ score: scoreRef.current }); playCollect(); f.x = Math.floor(Math.floor(c.width / CELL) / 2) * CELL; f.y = c.height - CELL; f.row = 0; bestRowRef.current = 0; }
      playBounce();
    };
    const kd = (e: KeyboardEvent) => {
      switch (e.key) { case 'ArrowUp': case 'w': move(0, -1); break; case 'ArrowDown': case 's': move(0, 1); break; case 'ArrowLeft': case 'a': move(-1, 0); break; case 'ArrowRight': case 'd': move(1, 0); break; }
      e.preventDefault();
    };
    const ts = (e: TouchEvent) => { touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
    const te = (e: TouchEvent) => {
      if (!touchRef.current) return;
      const dx = e.changedTouches[0].clientX - touchRef.current.x, dy = e.changedTouches[0].clientY - touchRef.current.y;
      if (Math.abs(dx) < 15 && Math.abs(dy) < 15) { move(0, -1); return; }
      if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 1 : -1, 0); else move(0, dy > 0 ? 1 : -1);
    };
    window.addEventListener('keydown', kd);
    c.addEventListener('touchstart', ts, { passive: true }); c.addEventListener('touchend', te);

    const loop = () => {
      if (!running) return;
      const W = c.width, H = c.height, f = frogRef.current;
      if (stateRef.current.status === 'playing') {
        lanesRef.current.forEach(lane => {
          lane.cars.forEach(car => {
            car.x += lane.speed * lane.dir;
            if (car.x > W + 50) car.x = -car.w - 10;
            if (car.x < -car.w - 50) car.x = W + 10;
            // Collision
            if (f.y >= lane.y && f.y < lane.y + CELL && f.x + CELL - 5 > car.x && f.x + 5 < car.x + car.w) {
              playHit(); engine.gameOver(scoreRef.current);
            }
          });
        });
      }
      ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, W, H);
      // Safe zones
      ctx.fillStyle = '#22c55e20'; ctx.fillRect(0, 0, W, CELL); ctx.fillRect(0, H - CELL, W, CELL);
      // Lanes
      lanesRef.current.forEach((lane, i) => {
        ctx.fillStyle = i % 2 === 0 ? '#334155' : '#2d3748';
        ctx.fillRect(0, lane.y, W, CELL);
        lane.cars.forEach(car => {
          ctx.fillStyle = ['#ef4444', '#3b82f6', '#f59e0b', '#a855f7', '#ec4899'][i % 5];
          ctx.beginPath(); ctx.roundRect(car.x, lane.y + 6, car.w, CELL - 12, 6); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(car.x + 4, lane.y + 8, car.w * 0.3, 4);
        });
      });
      // Frog
      ctx.fillStyle = '#22c55e';
      ctx.beginPath(); ctx.arc(f.x + CELL / 2, f.y + CELL / 2, CELL * 0.38, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(f.x + CELL / 2 - 5, f.y + CELL / 2 - 4, 4, 0, Math.PI * 2); ctx.arc(f.x + CELL / 2 + 5, f.y + CELL / 2 - 4, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(f.x + CELL / 2 - 4, f.y + CELL / 2 - 4, 2, 0, Math.PI * 2); ctx.arc(f.x + CELL / 2 + 6, f.y + CELL / 2 - 4, 2, 0, Math.PI * 2); ctx.fill();
      engine.animFrameRef.current = requestAnimationFrame(loop);
    };
    engine.animFrameRef.current = requestAnimationFrame(loop);
    return () => { running = false; cancelAnimationFrame(engine.animFrameRef.current); window.removeEventListener('keydown', kd); c.removeEventListener('touchstart', ts); c.removeEventListener('touchend', te); };
  }, []);

  const handleStart = () => { engine.startGame(); initGame(); };
  return (<GameWrapper config={config} gameState={engine.gameState} onStart={handleStart} onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}><canvas ref={engine.canvasRef} style={{ maxHeight: '100%', maxWidth: '100%' }} /></GameWrapper>);
}

// ==================== GRAVITY SWITCH ====================
export function GravitySwitchGame({ onBack }: { onBack: () => void }) {
  const config = getGameById('gravityswitch')!;
  const engine = useGameEngine({ gameId: 'gravityswitch' });
  const stateRef = useRef(engine.gameState);
  useEffect(() => { stateRef.current = engine.gameState; }, [engine.gameState]);
  const playerRef = useRef({ x: 60, y: 200, vy: 0, gravity: 1 });
  const obstaclesRef = useRef<{ x: number; y: number; w: number; h: number }[]>([]);
  const scoreRef = useRef(0);
  const frameRef = useRef(0);

  const initGame = useCallback(() => {
    const c = engine.canvasRef.current!;
    playerRef.current = { x: 60, y: c.height / 2, vy: 0, gravity: 1 };
    obstaclesRef.current = []; scoreRef.current = 0; frameRef.current = 0;
  }, [engine.canvasRef]);

  useEffect(() => {
    const c = engine.canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!; let running = true;
    const p = c.parentElement!;
    c.width = Math.min(p.clientWidth, 500); c.height = Math.min(p.clientHeight, 500);
    const flip = () => { if (stateRef.current.status === 'playing') { playerRef.current.gravity *= -1; playerRef.current.vy = 0; playBounce(); } };
    const kd = (e: KeyboardEvent) => { if (e.key === ' ' || e.key === 'ArrowUp') { flip(); e.preventDefault(); } };
    window.addEventListener('keydown', kd); c.addEventListener('click', flip); c.addEventListener('touchstart', flip, { passive: true });

    const loop = () => {
      if (!running) return;
      const W = c.width, H = c.height, pl = playerRef.current;
      if (stateRef.current.status === 'playing') {
        frameRef.current++;
        pl.vy += 0.5 * pl.gravity;
        pl.vy = Math.max(-8, Math.min(8, pl.vy));
        pl.y += pl.vy;
        if (pl.y < 5 || pl.y > H - 5) { playHit(); engine.gameOver(scoreRef.current); engine.animFrameRef.current = requestAnimationFrame(loop); return; }
        if (frameRef.current % 50 === 0) {
          const gap = 80 + Math.random() * 60;
          const y = Math.random() * (H - gap - 40) + 20;
          obstaclesRef.current.push({ x: W, y, w: 20, h: gap });
          obstaclesRef.current.push({ x: W + 10, y: 0, w: 20, h: y });
          obstaclesRef.current.push({ x: W + 10, y: y + gap, w: 20, h: H - y - gap });
        }
        for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
          const o = obstaclesRef.current[i]; o.x -= 3;
          if (o.x < -30) { obstaclesRef.current.splice(i, 1); scoreRef.current++; engine.updateState({ score: scoreRef.current }); continue; }
          if (pl.x + 10 > o.x && pl.x - 10 < o.x + o.w && pl.y + 10 > o.y && pl.y - 10 < o.y + o.h) {
            playHit(); engine.gameOver(scoreRef.current); engine.animFrameRef.current = requestAnimationFrame(loop); return;
          }
        }
      }
      ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0, 0, W, H);
      // Floor/ceiling glow
      const g1 = pl.gravity > 0 ? '#6366f120' : '#ef444420';
      const g2 = pl.gravity > 0 ? '#ef444420' : '#6366f120';
      ctx.fillStyle = g2; ctx.fillRect(0, 0, W, 4);
      ctx.fillStyle = g1; ctx.fillRect(0, H - 4, W, 4);
      obstaclesRef.current.forEach(o => { ctx.fillStyle = '#334155'; ctx.fillRect(o.x, o.y, o.w, o.h); });
      // Player
      ctx.fillStyle = pl.gravity > 0 ? '#6366f1' : '#ec4899';
      ctx.shadowColor = pl.gravity > 0 ? '#6366f1' : '#ec4899'; ctx.shadowBlur = 15;
      ctx.beginPath(); ctx.arc(pl.x, pl.y, 10, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      // Arrow indicator
      ctx.fillStyle = '#fff'; ctx.beginPath();
      if (pl.gravity > 0) { ctx.moveTo(pl.x - 4, pl.y - 6); ctx.lineTo(pl.x + 4, pl.y - 6); ctx.lineTo(pl.x, pl.y + 6); }
      else { ctx.moveTo(pl.x - 4, pl.y + 6); ctx.lineTo(pl.x + 4, pl.y + 6); ctx.lineTo(pl.x, pl.y - 6); }
      ctx.fill();
      engine.animFrameRef.current = requestAnimationFrame(loop);
    };
    engine.animFrameRef.current = requestAnimationFrame(loop);
    return () => { running = false; cancelAnimationFrame(engine.animFrameRef.current); window.removeEventListener('keydown', kd); c.removeEventListener('click', flip); c.removeEventListener('touchstart', flip); };
  }, []);
  const handleStart = () => { engine.startGame(); initGame(); };
  return (<GameWrapper config={config} gameState={engine.gameState} onStart={handleStart} onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}><canvas ref={engine.canvasRef} style={{ maxHeight: '100%', maxWidth: '100%' }} /></GameWrapper>);
}

// ==================== ORBITAL DODGE ====================
export function OrbitalDodgeGame({ onBack }: { onBack: () => void }) {
  const config = getGameById('orbitaldodge')!;
  const engine = useGameEngine({ gameId: 'orbitaldodge' });
  const stateRef = useRef(engine.gameState);
  useEffect(() => { stateRef.current = engine.gameState; }, [engine.gameState]);
  const angleRef = useRef(0);
  const obstaclesRef = useRef<{ angle: number; dist: number; speed: number; size: number }[]>([]);
  const scoreRef = useRef(0);
  const frameRef = useRef(0);
  const dirRef = useRef(1);

  const initGame = useCallback(() => {
    angleRef.current = 0; obstaclesRef.current = []; scoreRef.current = 0; frameRef.current = 0; dirRef.current = 1;
  }, []);

  useEffect(() => {
    const c = engine.canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!; let running = true;
    const p = c.parentElement!;
    c.width = Math.min(p.clientWidth, 500); c.height = Math.min(p.clientHeight, 500);
    const flip = () => { if (stateRef.current.status === 'playing') { dirRef.current *= -1; playBounce(); } };
    const kd = (e: KeyboardEvent) => { if (e.key === ' ') { flip(); e.preventDefault(); } };
    window.addEventListener('keydown', kd); c.addEventListener('click', flip); c.addEventListener('touchstart', flip, { passive: true });

    const loop = () => {
      if (!running) return;
      const W = c.width, H = c.height, cx = W / 2, cy = H / 2, orbitR = Math.min(W, H) * 0.3;
      if (stateRef.current.status === 'playing') {
        frameRef.current++; angleRef.current += 0.03 * dirRef.current;
        if (frameRef.current % 30 === 0) {
          const a = Math.random() * Math.PI * 2;
          obstaclesRef.current.push({ angle: a, dist: Math.min(W, H) * 0.6, speed: 1.5 + Math.random() * 2, size: 8 + Math.random() * 12 });
        }
        const px = cx + Math.cos(angleRef.current) * orbitR, py = cy + Math.sin(angleRef.current) * orbitR;
        for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
          const o = obstaclesRef.current[i]; o.dist -= o.speed;
          if (o.dist < 10) { obstaclesRef.current.splice(i, 1); scoreRef.current++; engine.updateState({ score: scoreRef.current }); continue; }
          const ox = cx + Math.cos(o.angle) * o.dist, oy = cy + Math.sin(o.angle) * o.dist;
          if (Math.hypot(ox - px, oy - py) < o.size + 8) { playHit(); engine.gameOver(scoreRef.current); engine.animFrameRef.current = requestAnimationFrame(loop); return; }
        }
      }
      ctx.fillStyle = '#05051a'; ctx.fillRect(0, 0, W, H);
      // Orbit ring
      ctx.strokeStyle = '#ffffff10'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, orbitR, 0, Math.PI * 2); ctx.stroke();
      // Center
      ctx.fillStyle = '#6366f140'; ctx.beginPath(); ctx.arc(cx, cy, 15, 0, Math.PI * 2); ctx.fill();
      // Obstacles
      obstaclesRef.current.forEach(o => {
        const ox = cx + Math.cos(o.angle) * o.dist, oy = cy + Math.sin(o.angle) * o.dist;
        ctx.fillStyle = '#ef4444'; ctx.globalAlpha = 0.6 + 0.4 * (1 - o.dist / (Math.min(W, H) * 0.6));
        ctx.beginPath(); ctx.arc(ox, oy, o.size, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;
      // Player
      const px = cx + Math.cos(angleRef.current) * orbitR, py = cy + Math.sin(angleRef.current) * orbitR;
      ctx.fillStyle = '#22d3ee'; ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 20;
      ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      // Trail
      for (let i = 1; i <= 8; i++) {
        const ta = angleRef.current - 0.04 * i * dirRef.current;
        ctx.globalAlpha = 0.3 - i * 0.035; ctx.fillStyle = '#22d3ee';
        ctx.beginPath(); ctx.arc(cx + Math.cos(ta) * orbitR, cy + Math.sin(ta) * orbitR, 8 - i * 0.6, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      engine.animFrameRef.current = requestAnimationFrame(loop);
    };
    engine.animFrameRef.current = requestAnimationFrame(loop);
    return () => { running = false; cancelAnimationFrame(engine.animFrameRef.current); window.removeEventListener('keydown', kd); c.removeEventListener('click', flip); c.removeEventListener('touchstart', flip); };
  }, []);
  const handleStart = () => { engine.startGame(); initGame(); };
  return (<GameWrapper config={config} gameState={engine.gameState} onStart={handleStart} onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}><canvas ref={engine.canvasRef} style={{ maxHeight: '100%', maxWidth: '100%' }} /></GameWrapper>);
}

// ==================== ALIEN INVADERS ====================
export function AlienInvadersGame({ onBack }: { onBack: () => void }) {
  const config = getGameById('alieninvaders')!;
  const engine = useGameEngine({ gameId: 'alieninvaders' });
  const stateRef = useRef(engine.gameState);
  useEffect(() => { stateRef.current = engine.gameState; }, [engine.gameState]);
  const playerRef = useRef({ x: 0 });
  const aliensRef = useRef<{ x: number; y: number; alive: boolean }[]>([]);
  const bulletsRef = useRef<{ x: number; y: number }[]>([]);
  const alienBulletsRef = useRef<{ x: number; y: number }[]>([]);
  const dirRef = useRef(1);
  const scoreRef = useRef(0);
  const keysRef = useRef<Set<string>>(new Set());
  const shootCdRef = useRef(0);

  const initGame = useCallback(() => {
    const c = engine.canvasRef.current!;
    playerRef.current = { x: c.width / 2 };
    const aliens: typeof aliensRef.current = [];
    for (let r = 0; r < 4; r++) for (let col = 0; col < 8; col++) aliens.push({ x: 40 + col * 45, y: 40 + r * 35, alive: true });
    aliensRef.current = aliens;
    bulletsRef.current = []; alienBulletsRef.current = []; dirRef.current = 1; scoreRef.current = 0; shootCdRef.current = 0;
  }, [engine.canvasRef]);

  useEffect(() => {
    const c = engine.canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!; let running = true;
    const p = c.parentElement!;
    c.width = Math.min(p.clientWidth, 500); c.height = Math.min(p.clientHeight, 600);
    const kd = (e: KeyboardEvent) => { keysRef.current.add(e.key); if (e.key === ' ') e.preventDefault(); };
    const ku = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    let touchX: number | null = null;
    const tm = (e: TouchEvent) => { touchX = e.touches[0].clientX - c.getBoundingClientRect().left; };

    c.addEventListener('touchmove', tm, { passive: true }); c.addEventListener('touchstart', (e) => { tm(e as any); }, { passive: true });

    const loop = () => {
      if (!running) return;
      const W = c.width, H = c.height, pl = playerRef.current, keys = keysRef.current;
      if (stateRef.current.status === 'playing') {
        if (keys.has('ArrowLeft') || keys.has('a')) pl.x -= 4;
        if (keys.has('ArrowRight') || keys.has('d')) pl.x += 4;
        if (touchX !== null) pl.x += (touchX - pl.x) * 0.1;
        pl.x = Math.max(15, Math.min(W - 15, pl.x));
        shootCdRef.current--;
        if ((keys.has(' ') || touchX !== null) && shootCdRef.current <= 0) { bulletsRef.current.push({ x: pl.x, y: H - 40 }); shootCdRef.current = 10; playShoot(); }
        // Move bullets
        bulletsRef.current = bulletsRef.current.filter(b => { b.y -= 6; return b.y > -5; });
        alienBulletsRef.current = alienBulletsRef.current.filter(b => { b.y += 4; return b.y < H + 5; });
        // Move aliens
        let hitEdge = false;
        aliensRef.current.forEach(a => { if (a.alive) { a.x += 0.5 * dirRef.current; if (a.x < 15 || a.x > W - 15) hitEdge = true; } });
        if (hitEdge) { dirRef.current *= -1; aliensRef.current.forEach(a => { if (a.alive) a.y += 12; }); }
        // Alien shooting
        const alive = aliensRef.current.filter(a => a.alive);
        if (alive.length > 0 && Math.random() < 0.02) { const a = alive[Math.floor(Math.random() * alive.length)]; alienBulletsRef.current.push({ x: a.x, y: a.y + 15 }); }
        // Bullet-alien collision
        for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
          const b = bulletsRef.current[i];
          for (const a of aliensRef.current) {
            if (a.alive && Math.abs(b.x - a.x) < 15 && Math.abs(b.y - a.y) < 12) {
              a.alive = false; bulletsRef.current.splice(i, 1); scoreRef.current += 20; engine.updateState({ score: scoreRef.current }); playExplosion(); break;
            }
          }
        }
        // Alien bullet-player collision
        for (const b of alienBulletsRef.current) {
          if (Math.abs(b.x - pl.x) < 15 && Math.abs(b.y - (H - 30)) < 12) { playHit(); engine.gameOver(scoreRef.current); break; }
        }
        // Aliens reach bottom
        if (alive.some(a => a.y > H - 60)) { engine.gameOver(scoreRef.current); }
        // All aliens dead
        if (alive.length === 0) { scoreRef.current += 200; engine.updateState({ score: scoreRef.current }); initGame(); }
      }
      ctx.fillStyle = '#020617'; ctx.fillRect(0, 0, W, H);
      // Stars
      for (let i = 0; i < 30; i++) { ctx.fillStyle = `rgba(255,255,255,${0.1 + (i * 7 % 10) * 0.05})`; ctx.fillRect((i * 37 + 13) % W, (i * 53 + 7) % H, 1, 1); }
      // Player
      ctx.fillStyle = '#22d3ee'; ctx.beginPath(); ctx.moveTo(pl.x, H - 40); ctx.lineTo(pl.x - 15, H - 20); ctx.lineTo(pl.x + 15, H - 20); ctx.closePath(); ctx.fill();
      // Aliens
      aliensRef.current.forEach(a => {
        if (!a.alive) return;
        ctx.fillStyle = '#22c55e'; ctx.beginPath();
        ctx.arc(a.x, a.y, 12, Math.PI, 0); ctx.lineTo(a.x + 12, a.y + 8);
        for (let i = 0; i < 5; i++) ctx.lineTo(a.x + 12 - i * 6, a.y + (i % 2 === 0 ? 12 : 6));
        ctx.lineTo(a.x - 12, a.y + 8); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(a.x - 4, a.y - 2, 3, 0, Math.PI * 2); ctx.arc(a.x + 4, a.y - 2, 3, 0, Math.PI * 2); ctx.fill();
      });
      // Bullets
      ctx.fillStyle = '#22d3ee'; bulletsRef.current.forEach(b => ctx.fillRect(b.x - 1, b.y, 3, 8));
      ctx.fillStyle = '#ef4444'; alienBulletsRef.current.forEach(b => ctx.fillRect(b.x - 1, b.y, 3, 8));
      engine.animFrameRef.current = requestAnimationFrame(loop);
    };
    engine.animFrameRef.current = requestAnimationFrame(loop);
    return () => { running = false; cancelAnimationFrame(engine.animFrameRef.current); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, []);
  const handleStart = () => { engine.startGame(); initGame(); };
  return (<GameWrapper config={config} gameState={engine.gameState} onStart={handleStart} onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}><canvas ref={engine.canvasRef} style={{ maxHeight: '100%', maxWidth: '100%' }} /></GameWrapper>);
}

// ==================== CANNON SHOOTER ====================
export function CannonShooterGame({ onBack }: { onBack: () => void }) {
  const config = getGameById('cannonshooter')!;
  const engine = useGameEngine({ gameId: 'cannonshooter' });
  const stateRef = useRef(engine.gameState);
  useEffect(() => { stateRef.current = engine.gameState; }, [engine.gameState]);
  const angleRef = useRef(-Math.PI / 4);
  const ballsRef = useRef<{ x: number; y: number; vx: number; vy: number }[]>([]);
  const targetsRef = useRef<{ x: number; y: number; r: number; hit: boolean }[]>([]);
  const scoreRef = useRef(0);
  const shotsRef = useRef(20);

  const initGame = useCallback(() => {
    const c = engine.canvasRef.current!;
    angleRef.current = -Math.PI / 4; ballsRef.current = []; scoreRef.current = 0; shotsRef.current = 20;
    const targets: typeof targetsRef.current = [];
    for (let i = 0; i < 8; i++) targets.push({ x: 150 + Math.random() * (c.width - 200), y: 50 + Math.random() * (c.height - 200), r: 15 + Math.random() * 15, hit: false });
    targetsRef.current = targets;
  }, [engine.canvasRef]);

  useEffect(() => {
    const c = engine.canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!; let running = true;
    const p = c.parentElement!;
    c.width = Math.min(p.clientWidth, 600); c.height = Math.min(p.clientHeight, 500);
    const shoot = () => {
      if (stateRef.current.status !== 'playing' || shotsRef.current <= 0) return;
      shotsRef.current--;
      const power = 12;
      ballsRef.current.push({ x: 30, y: c.height - 30, vx: Math.cos(angleRef.current) * power, vy: Math.sin(angleRef.current) * power });
      playShoot();
    };
    const mm = (e: MouseEvent) => { const r = c.getBoundingClientRect(); angleRef.current = Math.atan2(e.clientY - r.top - (c.height - 30), e.clientX - r.left - 30); angleRef.current = Math.max(-Math.PI / 2, Math.min(0, angleRef.current)); };
    const kd = (e: KeyboardEvent) => {
      if (e.key === ' ') { shoot(); e.preventDefault(); }
      if (e.key === 'ArrowUp') angleRef.current = Math.max(-Math.PI / 2, angleRef.current - 0.05);
      if (e.key === 'ArrowDown') angleRef.current = Math.min(0, angleRef.current + 0.05);
    };
    c.addEventListener('mousemove', mm); c.addEventListener('click', shoot);
    c.addEventListener('touchstart', shoot, { passive: true }); window.addEventListener('keydown', kd);

    const loop = () => {
      if (!running) return;
      const W = c.width, H = c.height;
      if (stateRef.current.status === 'playing') {
        ballsRef.current = ballsRef.current.filter(b => {
          b.x += b.vx; b.y += b.vy; b.vy += 0.3;
          for (const t of targetsRef.current) {
            if (!t.hit && Math.hypot(b.x - t.x, b.y - t.y) < t.r + 5) {
              t.hit = true; scoreRef.current += 100; engine.updateState({ score: scoreRef.current }); playExplosion(); return false;
            }
          }
          return b.x > -10 && b.x < W + 10 && b.y < H + 10;
        });
        if (shotsRef.current <= 0 && ballsRef.current.length === 0) engine.gameOver(scoreRef.current);
        if (targetsRef.current.every(t => t.hit)) { scoreRef.current += 500; engine.gameOver(scoreRef.current); }
      }
      ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H);
      // Ground
      ctx.fillStyle = '#334155'; ctx.fillRect(0, H - 15, W, 15);
      // Targets
      targetsRef.current.forEach(t => {
        if (t.hit) return;
        ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(t.x, t.y, t.r * 0.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(t.x, t.y, t.r * 0.2, 0, Math.PI * 2); ctx.fill();
      });
      // Cannon
      ctx.save(); ctx.translate(30, H - 30); ctx.rotate(angleRef.current);
      ctx.fillStyle = '#6366f1'; ctx.fillRect(0, -5, 35, 10);
      ctx.restore();
      ctx.fillStyle = '#4f46e5'; ctx.beginPath(); ctx.arc(30, H - 30, 12, 0, Math.PI * 2); ctx.fill();
      // Balls
      ctx.fillStyle = '#fbbf24';
      ballsRef.current.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI * 2); ctx.fill(); });
      // Ammo
      ctx.fillStyle = '#fff'; ctx.font = '14px sans-serif'; ctx.fillText(`Shots: ${shotsRef.current}`, 10, 25);
      engine.animFrameRef.current = requestAnimationFrame(loop);
    };
    engine.animFrameRef.current = requestAnimationFrame(loop);
    return () => { running = false; cancelAnimationFrame(engine.animFrameRef.current); c.removeEventListener('mousemove', mm); c.removeEventListener('click', shoot); window.removeEventListener('keydown', kd); };
  }, []);
  const handleStart = () => { engine.startGame(); initGame(); };
  return (<GameWrapper config={config} gameState={engine.gameState} onStart={handleStart} onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}><canvas ref={engine.canvasRef} style={{ maxHeight: '100%', maxWidth: '100%' }} /></GameWrapper>);
}

// ==================== COIN COLLECTOR ====================
export function CoinCollectorGame({ onBack }: { onBack: () => void }) {
  const config = getGameById('coincollector')!;
  const engine = useGameEngine({ gameId: 'coincollector' });
  const stateRef = useRef(engine.gameState);
  useEffect(() => { stateRef.current = engine.gameState; }, [engine.gameState]);
  const playerRef = useRef({ x: 0, y: 0 });
  const coinsRef = useRef<{ x: number; y: number; collected: boolean; gold: boolean }[]>([]);
  const bombsRef = useRef<{ x: number; y: number }[]>([]);
  const scoreRef = useRef(0);
  const timeRef = useRef(30);
  const frameRef = useRef(0);
  const keysRef = useRef<Set<string>>(new Set());

  const initGame = useCallback(() => {
    const c = engine.canvasRef.current!;
    playerRef.current = { x: c.width / 2, y: c.height / 2 };
    scoreRef.current = 0; timeRef.current = 30; frameRef.current = 0;
    const coins: typeof coinsRef.current = [];
    for (let i = 0; i < 15; i++) coins.push({ x: 20 + Math.random() * (c.width - 40), y: 20 + Math.random() * (c.height - 40), collected: false, gold: Math.random() < 0.15 });
    coinsRef.current = coins;
    const bombs: typeof bombsRef.current = [];
    for (let i = 0; i < 5; i++) bombs.push({ x: 20 + Math.random() * (c.width - 40), y: 20 + Math.random() * (c.height - 40) });
    bombsRef.current = bombs;
  }, [engine.canvasRef]);

  useEffect(() => {
    const c = engine.canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!; let running = true;
    const p = c.parentElement!;
    c.width = Math.min(p.clientWidth, 500); c.height = Math.min(p.clientHeight, 500);
    const kd = (e: KeyboardEvent) => keysRef.current.add(e.key);
    const ku = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    let touchTarget: { x: number; y: number } | null = null;
    const tm = (e: TouchEvent) => { const r = c.getBoundingClientRect(); touchTarget = { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top }; };
    c.addEventListener('touchmove', tm, { passive: true }); c.addEventListener('touchstart', tm as any, { passive: true });

    const loop = () => {
      if (!running) return;
      const W = c.width, H = c.height, pl = playerRef.current, keys = keysRef.current;
      if (stateRef.current.status === 'playing') {
        frameRef.current++;
        if (frameRef.current % 60 === 0) { timeRef.current--; if (timeRef.current <= 0) { engine.gameOver(scoreRef.current); } }
        const spd = 4;
        if (keys.has('ArrowLeft') || keys.has('a')) pl.x -= spd;
        if (keys.has('ArrowRight') || keys.has('d')) pl.x += spd;
        if (keys.has('ArrowUp') || keys.has('w')) pl.y -= spd;
        if (keys.has('ArrowDown') || keys.has('s')) pl.y += spd;
        if (touchTarget) { pl.x += (touchTarget.x - pl.x) * 0.08; pl.y += (touchTarget.y - pl.y) * 0.08; }
        pl.x = Math.max(10, Math.min(W - 10, pl.x)); pl.y = Math.max(10, Math.min(H - 10, pl.y));
        // Collect coins
        coinsRef.current.forEach(co => {
          if (!co.collected && Math.hypot(pl.x - co.x, pl.y - co.y) < 18) {
            co.collected = true; scoreRef.current += co.gold ? 50 : 10; engine.updateState({ score: scoreRef.current }); playCollect();
          }
        });
        // Bomb collision
        bombsRef.current.forEach(b => {
          if (Math.hypot(pl.x - b.x, pl.y - b.y) < 18) { playHit(); engine.gameOver(scoreRef.current); }
        });
        // All collected => spawn more
        if (coinsRef.current.every(co => co.collected)) {
          const coins: typeof coinsRef.current = [];
          for (let i = 0; i < 15; i++) coins.push({ x: 20 + Math.random() * (W - 40), y: 20 + Math.random() * (H - 40), collected: false, gold: Math.random() < 0.15 });
          coinsRef.current = coins;
          timeRef.current += 10;
          bombsRef.current.push({ x: 20 + Math.random() * (W - 40), y: 20 + Math.random() * (H - 40) });
        }
      }
      ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H);
      // Grid dots
      ctx.fillStyle = '#1e293b';
      for (let x = 0; x < W; x += 30) for (let y = 0; y < H; y += 30) ctx.fillRect(x, y, 2, 2);
      // Coins
      coinsRef.current.forEach(co => {
        if (co.collected) return;
        ctx.fillStyle = co.gold ? '#ffd700' : '#fbbf24'; ctx.shadowColor = co.gold ? '#ffd700' : '#fbbf24'; ctx.shadowBlur = co.gold ? 12 : 6;
        ctx.beginPath(); ctx.arc(co.x, co.y, co.gold ? 10 : 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = co.gold ? '#b8860b' : '#d97706'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(co.gold ? '★' : '$', co.x, co.y + 4);
        ctx.shadowBlur = 0;
      });
      // Bombs
      bombsRef.current.forEach(b => { ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(b.x, b.y, 10, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('💣', b.x, b.y + 5); });
      // Player
      ctx.fillStyle = '#6366f1'; ctx.shadowColor = '#6366f1'; ctx.shadowBlur = 15;
      ctx.beginPath(); ctx.arc(pl.x, pl.y, 10, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      // Timer
      ctx.fillStyle = timeRef.current <= 5 ? '#ef4444' : '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'right'; ctx.fillText(`⏱ ${timeRef.current}s`, W - 10, 25);
      engine.animFrameRef.current = requestAnimationFrame(loop);
    };
    engine.animFrameRef.current = requestAnimationFrame(loop);
    return () => { running = false; cancelAnimationFrame(engine.animFrameRef.current); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, []);
  const handleStart = () => { engine.startGame(); initGame(); };
  return (<GameWrapper config={config} gameState={engine.gameState} onStart={handleStart} onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}><canvas ref={engine.canvasRef} style={{ maxHeight: '100%', maxWidth: '100%' }} /></GameWrapper>);
}

// ==================== TANK BATTLE ====================
export function TankBattleGame({ onBack }: { onBack: () => void }) {
  const config = getGameById('tankbattle')!;
  const engine = useGameEngine({ gameId: 'tankbattle' });
  const stateRef = useRef(engine.gameState);
  useEffect(() => { stateRef.current = engine.gameState; }, [engine.gameState]);
  const tankRef = useRef({ x: 0, y: 0, angle: -Math.PI / 2 });
  const enemiesRef = useRef<{ x: number; y: number; angle: number; hp: number; shootCd: number }[]>([]);
  const bulletsRef = useRef<{ x: number; y: number; vx: number; vy: number; enemy: boolean }[]>([]);
  const scoreRef = useRef(0); const keysRef = useRef<Set<string>>(new Set()); const shootCdRef = useRef(0);
  const wallsRef = useRef<{ x: number; y: number; w: number; h: number }[]>([]);

  const initGame = useCallback(() => {
    const c = engine.canvasRef.current!;
    tankRef.current = { x: c.width / 2, y: c.height - 50, angle: -Math.PI / 2 };
    scoreRef.current = 0; shootCdRef.current = 0;
    const enemies: typeof enemiesRef.current = [];
    for (let i = 0; i < 4; i++) enemies.push({ x: 50 + Math.random() * (c.width - 100), y: 30 + Math.random() * (c.height * 0.4), angle: Math.PI / 2, hp: 2, shootCd: 60 + Math.floor(Math.random() * 120) });
    enemiesRef.current = enemies; bulletsRef.current = [];
    const walls: typeof wallsRef.current = [];
    for (let i = 0; i < 6; i++) walls.push({ x: 30 + Math.random() * (c.width - 90), y: 60 + Math.random() * (c.height - 140), w: 30 + Math.random() * 40, h: 15 + Math.random() * 20 });
    wallsRef.current = walls;
  }, [engine.canvasRef]);

  useEffect(() => {
    const c = engine.canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!; let running = true;
    const p = c.parentElement!;
    c.width = Math.min(p.clientWidth, 550); c.height = Math.min(p.clientHeight, 550);
    const kd = (e: KeyboardEvent) => { keysRef.current.add(e.key); if (e.key === ' ') e.preventDefault(); };
    const ku = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);

    const loop = () => {
      if (!running) return;
      const W = c.width, H = c.height, t = tankRef.current, keys = keysRef.current;
      if (stateRef.current.status === 'playing') {
        if (keys.has('ArrowLeft') || keys.has('a')) t.angle -= 0.05;
        if (keys.has('ArrowRight') || keys.has('d')) t.angle += 0.05;
        if (keys.has('ArrowUp') || keys.has('w')) { t.x += Math.cos(t.angle) * 2.5; t.y += Math.sin(t.angle) * 2.5; }
        if (keys.has('ArrowDown') || keys.has('s')) { t.x -= Math.cos(t.angle) * 1.5; t.y -= Math.sin(t.angle) * 1.5; }
        t.x = Math.max(15, Math.min(W - 15, t.x)); t.y = Math.max(15, Math.min(H - 15, t.y));
        shootCdRef.current--;
        if (keys.has(' ') && shootCdRef.current <= 0) {
          bulletsRef.current.push({ x: t.x + Math.cos(t.angle) * 18, y: t.y + Math.sin(t.angle) * 18, vx: Math.cos(t.angle) * 7, vy: Math.sin(t.angle) * 7, enemy: false });
          shootCdRef.current = 15; playShoot();
        }
        // Enemies
        enemiesRef.current.forEach(e => {
          e.angle = Math.atan2(t.y - e.y, t.x - e.x);
          e.shootCd--;
          if (e.shootCd <= 0) { bulletsRef.current.push({ x: e.x, y: e.y, vx: Math.cos(e.angle) * 4, vy: Math.sin(e.angle) * 4, enemy: true }); e.shootCd = 80 + Math.floor(Math.random() * 60); }
        });
        // Bullets
        bulletsRef.current = bulletsRef.current.filter(b => { b.x += b.vx; b.y += b.vy; return b.x > -5 && b.x < W + 5 && b.y > -5 && b.y < H + 5; });
        // Hit detection
        for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
          const b = bulletsRef.current[i];
          if (!b.enemy) {
            for (let j = enemiesRef.current.length - 1; j >= 0; j--) {
              if (Math.hypot(b.x - enemiesRef.current[j].x, b.y - enemiesRef.current[j].y) < 16) {
                bulletsRef.current.splice(i, 1); enemiesRef.current[j].hp--;
                if (enemiesRef.current[j].hp <= 0) { enemiesRef.current.splice(j, 1); scoreRef.current += 50; engine.updateState({ score: scoreRef.current }); playExplosion(); }
                else playHit(); break;
              }
            }
          } else {
            if (Math.hypot(b.x - t.x, b.y - t.y) < 14) { playHit(); engine.gameOver(scoreRef.current); }
          }
        }
        if (enemiesRef.current.length === 0) { // Respawn
          for (let i = 0; i < 4 + Math.floor(scoreRef.current / 200); i++)
            enemiesRef.current.push({ x: 50 + Math.random() * (W - 100), y: 30 + Math.random() * (H * 0.4), angle: Math.PI / 2, hp: 2, shootCd: 60 + Math.floor(Math.random() * 120) });
        }
      }
      ctx.fillStyle = '#1a1a0e'; ctx.fillRect(0, 0, W, H);
      // Walls
      ctx.fillStyle = '#4a3728';
      wallsRef.current.forEach(w => { ctx.beginPath(); ctx.roundRect(w.x, w.y, w.w, w.h, 3); ctx.fill(); });
      // Enemies
      enemiesRef.current.forEach(e => {
        ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.angle);
        ctx.fillStyle = '#ef4444'; ctx.fillRect(-12, -10, 24, 20); ctx.fillStyle = '#dc2626'; ctx.fillRect(0, -3, 18, 6);
        ctx.restore();
      });
      // Player tank
      ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(t.angle);
      ctx.fillStyle = '#22c55e'; ctx.fillRect(-12, -10, 24, 20); ctx.fillStyle = '#16a34a'; ctx.fillRect(0, -3, 20, 6);
      ctx.restore();
      // Bullets
      bulletsRef.current.forEach(b => { ctx.fillStyle = b.enemy ? '#ef4444' : '#fbbf24'; ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2); ctx.fill(); });
      engine.animFrameRef.current = requestAnimationFrame(loop);
    };
    engine.animFrameRef.current = requestAnimationFrame(loop);
    return () => { running = false; cancelAnimationFrame(engine.animFrameRef.current); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, []);
  const handleStart = () => { engine.startGame(); initGame(); };
  return (<GameWrapper config={config} gameState={engine.gameState} onStart={handleStart} onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}><canvas ref={engine.canvasRef} style={{ maxHeight: '100%', maxWidth: '100%' }} /></GameWrapper>);
}

// ==================== PENGUIN SLIDE ====================
export function PenguinSlideGame({ onBack }: { onBack: () => void }) {
  const config = getGameById('penguinslide')!;
  const engine = useGameEngine({ gameId: 'penguinslide' });
  const stateRef = useRef(engine.gameState);
  useEffect(() => { stateRef.current = engine.gameState; }, [engine.gameState]);
  const penguinRef = useRef({ x: 0, lane: 1 });
  const obstaclesRef = useRef<{ x: number; lane: number; type: 'rock' | 'fish' }[]>([]);
  const scoreRef = useRef(0); const frameRef = useRef(0); const speedRef = useRef(3);
  const touchRef = useRef<{ x: number } | null>(null);

  const LANES = 3; const LANE_H = 60;

  const initGame = useCallback(() => {
    penguinRef.current = { x: 60, lane: 1 }; obstaclesRef.current = []; scoreRef.current = 0; frameRef.current = 0; speedRef.current = 3;
  }, []);

  useEffect(() => {
    const c = engine.canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!; let running = true;
    const p = c.parentElement!;
    c.width = Math.min(p.clientWidth, 600); c.height = Math.min(p.clientHeight, 400);
    const changeLane = (dir: number) => { if (stateRef.current.status !== 'playing') return; penguinRef.current.lane = Math.max(0, Math.min(LANES - 1, penguinRef.current.lane + dir)); playBounce(); };
    const kd = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w') { changeLane(-1); e.preventDefault(); }
      if (e.key === 'ArrowDown' || e.key === 's') { changeLane(1); e.preventDefault(); }
    };
    const ts = (e: TouchEvent) => { touchRef.current = { x: e.touches[0].clientY }; };
    const te = (e: TouchEvent) => { if (!touchRef.current) return; const dy = e.changedTouches[0].clientY - touchRef.current.x; if (Math.abs(dy) > 20) changeLane(dy > 0 ? 1 : -1); touchRef.current = null; };
    window.addEventListener('keydown', kd); c.addEventListener('touchstart', ts, { passive: true }); c.addEventListener('touchend', te);

    const loop = () => {
      if (!running) return;
      const W = c.width, H = c.height;
      const laneTop = (H - LANES * LANE_H) / 2;
      if (stateRef.current.status === 'playing') {
        frameRef.current++; speedRef.current = 3 + frameRef.current * 0.002;
        scoreRef.current = Math.floor(frameRef.current / 10); engine.updateState({ score: scoreRef.current });
        if (frameRef.current % Math.max(20, 50 - Math.floor(frameRef.current / 200)) === 0) {
          const lane = Math.floor(Math.random() * LANES);
          obstaclesRef.current.push({ x: W + 20, lane, type: Math.random() > 0.3 ? 'rock' : 'fish' });
        }
        for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
          const o = obstaclesRef.current[i]; o.x -= speedRef.current;
          if (o.x < -30) { obstaclesRef.current.splice(i, 1); continue; }
          if (o.lane === penguinRef.current.lane && Math.abs(o.x - 60) < 22) {
            if (o.type === 'fish') { obstaclesRef.current.splice(i, 1); scoreRef.current += 30; engine.updateState({ score: scoreRef.current }); playCollect(); }
            else { playHit(); engine.gameOver(scoreRef.current); }
          }
        }
      }
      // Background ice
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#e0f2fe'); grad.addColorStop(1, '#bae6fd');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
      // Lanes
      for (let i = 0; i < LANES; i++) {
        const ly = laneTop + i * LANE_H;
        ctx.fillStyle = i % 2 === 0 ? '#dbeafe80' : '#bfdbfe80';
        ctx.fillRect(0, ly, W, LANE_H);
      }
      // Snow particles
      for (let i = 0; i < 15; i++) {
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath(); ctx.arc((frameRef.current * 2 + i * 47) % W, (frameRef.current * 0.5 + i * 31) % H, 2, 0, Math.PI * 2); ctx.fill();
      }
      // Obstacles
      obstaclesRef.current.forEach(o => {
        const oy = laneTop + o.lane * LANE_H + LANE_H / 2;
        if (o.type === 'rock') { ctx.fillStyle = '#6b7280'; ctx.beginPath(); ctx.arc(o.x, oy, 15, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#9ca3af'; ctx.beginPath(); ctx.arc(o.x - 3, oy - 4, 5, 0, Math.PI * 2); ctx.fill(); }
        else { ctx.fillStyle = '#f97316'; ctx.font = '22px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🐟', o.x, oy + 7); }
      });
      // Penguin
      const py = laneTop + penguinRef.current.lane * LANE_H + LANE_H / 2;
      ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.ellipse(60, py, 14, 18, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(60, py + 4, 9, 12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.moveTo(56, py - 5); ctx.lineTo(52, py - 2); ctx.lineTo(58, py - 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(56, py - 10, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(56, py - 10, 1.5, 0, Math.PI * 2); ctx.fill();
      engine.animFrameRef.current = requestAnimationFrame(loop);
    };
    engine.animFrameRef.current = requestAnimationFrame(loop);
    return () => { running = false; cancelAnimationFrame(engine.animFrameRef.current); window.removeEventListener('keydown', kd); c.removeEventListener('touchstart', ts); c.removeEventListener('touchend', te); };
  }, []);
  const handleStart = () => { engine.startGame(); initGame(); };
  return (<GameWrapper config={config} gameState={engine.gameState} onStart={handleStart} onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}><canvas ref={engine.canvasRef} style={{ maxHeight: '100%', maxWidth: '100%' }} /></GameWrapper>);
}

// ==================== NINJA RUNNER ====================
export function NinjaRunnerGame({ onBack }: { onBack: () => void }) {
  const config = getGameById('ninjarunner')!;
  const engine = useGameEngine({ gameId: 'ninjarunner' });
  const stateRef = useRef(engine.gameState);
  useEffect(() => { stateRef.current = engine.gameState; }, [engine.gameState]);
  const ninjaRef = useRef({ x: 80, y: 0, vy: 0, jumping: false, doubleJump: false });
  const shurikensRef = useRef<{ x: number; y: number; r: number }[]>([]);
  const obstaclesRef = useRef<{ x: number; h: number; type: 'spike' | 'wall' }[]>([]);
  const coinsRef = useRef<{ x: number; y: number; taken: boolean }[]>([]);
  const scoreRef = useRef(0); const frameRef = useRef(0); const groundRef = useRef(0);

  const initGame = useCallback(() => {
    const c = engine.canvasRef.current!;
    groundRef.current = c.height - 40;
    ninjaRef.current = { x: 80, y: groundRef.current, vy: 0, jumping: false, doubleJump: false };
    shurikensRef.current = []; obstaclesRef.current = []; coinsRef.current = [];
    scoreRef.current = 0; frameRef.current = 0;
  }, [engine.canvasRef]);

  useEffect(() => {
    const c = engine.canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!; let running = true;
    const p = c.parentElement!;
    c.width = Math.min(p.clientWidth, 650); c.height = Math.min(p.clientHeight, 400);
    const jump = () => {
      if (stateRef.current.status !== 'playing') return;
      const n = ninjaRef.current;
      if (!n.jumping) { n.vy = -12; n.jumping = true; playBounce(); }
      else if (!(n as any).doubleJump) { n.vy = -10; (n as any).doubleJump = true; playBounce(); }
    };
    const throwStar = () => {
      if (stateRef.current.status !== 'playing') return;
      shurikensRef.current.push({ x: ninjaRef.current.x + 15, y: ninjaRef.current.y - 15, r: 0 });
      playShoot();
    };
    const kd = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp') { jump(); e.preventDefault(); }
      if (e.key === 'z' || e.key === 'Z' || e.key === 'x') throwStar();
    };
    window.addEventListener('keydown', kd);
    c.addEventListener('touchstart', jump, { passive: true });

    const loop = () => {
      if (!running) return;
      const W = c.width, H = c.height, GY = groundRef.current, n = ninjaRef.current;
      if (stateRef.current.status === 'playing') {
        frameRef.current++;
        const speed = 4 + frameRef.current * 0.003;
        n.vy += 0.6; n.y += n.vy;
        if (n.y >= GY) { n.y = GY; n.vy = 0; n.jumping = false; (n as any).doubleJump = false; }
        scoreRef.current = Math.floor(frameRef.current / 8); engine.updateState({ score: scoreRef.current });
        // Spawn
        if (frameRef.current % Math.max(25, 60 - Math.floor(speed * 3)) === 0) {
          obstaclesRef.current.push({ x: W + 20, h: 20 + Math.random() * 30, type: Math.random() > 0.5 ? 'spike' : 'wall' });
        }
        if (frameRef.current % 40 === 0) coinsRef.current.push({ x: W + 20, y: GY - 50 - Math.random() * 80, taken: false });
        // Move
        for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
          const o = obstaclesRef.current[i]; o.x -= speed;
          if (o.x < -30) { obstaclesRef.current.splice(i, 1); continue; }
          if (n.x + 10 > o.x && n.x - 10 < o.x + 20 && n.y > GY - o.h) { playHit(); engine.gameOver(scoreRef.current); }
        }
        coinsRef.current = coinsRef.current.filter(co => {
          co.x -= speed;
          if (!co.taken && Math.hypot(n.x - co.x, (n.y - 15) - co.y) < 20) { co.taken = true; scoreRef.current += 15; playCollect(); }
          return co.x > -20;
        });
        shurikensRef.current = shurikensRef.current.filter(s => { s.x += 8; s.r += 0.3; return s.x < W + 10; });
        // Shuriken vs obstacle
        for (let i = shurikensRef.current.length - 1; i >= 0; i--) {
          for (let j = obstaclesRef.current.length - 1; j >= 0; j--) {
            if (Math.abs(shurikensRef.current[i].x - obstaclesRef.current[j].x) < 20 && shurikensRef.current[i].y > GY - obstaclesRef.current[j].h - 10) {
              shurikensRef.current.splice(i, 1); obstaclesRef.current.splice(j, 1); scoreRef.current += 20; playExplosion(); break;
            }
          }
        }
      }
      // Draw - night scene
      ctx.fillStyle = '#0f0f23'; ctx.fillRect(0, 0, W, H);
      // Moon
      ctx.fillStyle = '#fef3c7'; ctx.beginPath(); ctx.arc(W - 60, 50, 25, 0, Math.PI * 2); ctx.fill();
      // Ground
      ctx.fillStyle = '#1e293b'; ctx.fillRect(0, GY, W, H - GY);
      // Obstacles
      obstaclesRef.current.forEach(o => {
        if (o.type === 'spike') { ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.moveTo(o.x, GY); ctx.lineTo(o.x + 10, GY - o.h); ctx.lineTo(o.x + 20, GY); ctx.fill(); }
        else { ctx.fillStyle = '#64748b'; ctx.fillRect(o.x, GY - o.h, 20, o.h); }
      });
      // Coins
      coinsRef.current.forEach(co => { if (co.taken) return; ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(co.x, co.y, 7, 0, Math.PI * 2); ctx.fill(); });
      // Shurikens
      shurikensRef.current.forEach(s => {
        ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.r);
        ctx.fillStyle = '#94a3b8'; ctx.beginPath();
        for (let i = 0; i < 4; i++) { const a = (Math.PI / 2) * i; ctx.lineTo(Math.cos(a) * 8, Math.sin(a) * 8); ctx.lineTo(Math.cos(a + 0.4) * 3, Math.sin(a + 0.4) * 3); }
        ctx.closePath(); ctx.fill(); ctx.restore();
      });
      // Ninja
      ctx.fillStyle = '#1e1e1e'; ctx.fillRect(n.x - 8, n.y - 28, 16, 28);
      ctx.fillStyle = '#dc2626'; ctx.fillRect(n.x - 10, n.y - 28, 20, 8); // headband
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(n.x + 2, n.y - 22, 2, 0, Math.PI * 2); ctx.fill(); // eye
      // Running legs
      if (!n.jumping) {
        const leg = Math.sin(frameRef.current * 0.4) * 6;
        ctx.fillStyle = '#1e1e1e'; ctx.fillRect(n.x - 5, n.y, 4, 8 + leg); ctx.fillRect(n.x + 1, n.y, 4, 8 - leg);
      }
      engine.animFrameRef.current = requestAnimationFrame(loop);
    };
    engine.animFrameRef.current = requestAnimationFrame(loop);
    return () => { running = false; cancelAnimationFrame(engine.animFrameRef.current); window.removeEventListener('keydown', kd); c.removeEventListener('touchstart', jump); };
  }, []);
  const handleStart = () => { engine.startGame(); initGame(); };
  return (<GameWrapper config={config} gameState={engine.gameState} onStart={handleStart} onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}><canvas ref={engine.canvasRef} style={{ maxHeight: '100%', maxWidth: '100%' }} /></GameWrapper>);
}

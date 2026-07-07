// MoreGames1 - Pac-Man, Pinball, Sports games, and more
import { useEffect, useRef, useCallback, useState } from 'react';
import GameWrapper from '../components/GameWrapper';
import { useGameEngine } from '../hooks/useGameEngine';
import { getGameById } from './registry';
import { playCollect, playHit, playBounce, playScore, playWin, playPowerUp } from '../utils/sound';

// ==================== PAC-MAN INSPIRED ====================
export function PacManGame({ onBack }: { onBack: () => void }) {
  const config = getGameById('pacman')!;
  const engine = useGameEngine({ gameId: 'pacman' });
  const stateRef = useRef(engine.gameState);
  useEffect(() => { stateRef.current = engine.gameState; }, [engine.gameState]);

  const CELL = 20;
  const playerRef = useRef({ x: 1, y: 1, dir: { x: 1, y: 0 }, nextDir: { x: 1, y: 0 }, mouth: 0 });
  const ghostsRef = useRef<{ x: number; y: number; dir: { x: number; y: number }; color: string; scared: boolean }[]>([]);
  const dotsRef = useRef<{ x: number; y: number; power: boolean }[]>([]);
  const mazeRef = useRef<number[][]>([]);
  const scoreRef = useRef(0);
  const powerModeRef = useRef(0);
  const frameRef = useRef(0);

  const MAZE = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,0,1,0,1,0,1,1,0,1],
    [1,2,0,0,0,0,0,0,0,0,0,0,0,2,1],
    [1,0,1,0,1,0,1,1,1,0,1,0,1,0,1],
    [1,0,0,0,1,0,0,0,0,0,1,0,0,0,1],
    [1,1,1,0,1,1,1,0,1,1,1,0,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,0,1,0,1,0,1,1,0,1],
    [1,0,0,0,0,1,0,0,0,1,0,0,0,0,1],
    [1,0,1,0,1,1,1,0,1,1,1,0,1,0,1],
    [1,2,0,0,0,0,0,0,0,0,0,0,0,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ];

  const initGame = useCallback(() => {
    mazeRef.current = MAZE.map(r => [...r]);
    playerRef.current = { x: 1, y: 1, dir: { x: 1, y: 0 }, nextDir: { x: 1, y: 0 }, mouth: 0 };
    const dots: typeof dotsRef.current = [];
    for (let y = 0; y < MAZE.length; y++) {
      for (let x = 0; x < MAZE[0].length; x++) {
        if (MAZE[y][x] === 0) dots.push({ x, y, power: false });
        if (MAZE[y][x] === 2) dots.push({ x, y, power: true });
      }
    }
    dotsRef.current = dots;
    ghostsRef.current = [
      { x: 7, y: 5, dir: { x: 1, y: 0 }, color: '#ef4444', scared: false },
      { x: 7, y: 6, dir: { x: -1, y: 0 }, color: '#ec4899', scared: false },
      { x: 6, y: 6, dir: { x: 0, y: -1 }, color: '#06b6d4', scared: false },
    ];
    scoreRef.current = 0; powerModeRef.current = 0; frameRef.current = 0;
  }, []);

  useEffect(() => {
    const c = engine.canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!; let running = true;
    c.width = MAZE[0].length * CELL; c.height = MAZE.length * CELL;

    const kd = (e: KeyboardEvent) => {
      const p = playerRef.current;
      switch (e.key) {
        case 'ArrowUp': case 'w': p.nextDir = { x: 0, y: -1 }; break;
        case 'ArrowDown': case 's': p.nextDir = { x: 0, y: 1 }; break;
        case 'ArrowLeft': case 'a': p.nextDir = { x: -1, y: 0 }; break;
        case 'ArrowRight': case 'd': p.nextDir = { x: 1, y: 0 }; break;
      }
      e.preventDefault();
    };
    window.addEventListener('keydown', kd);

    let lastMove = 0;
    const loop = (time: number) => {
      if (!running) return;
      const p = playerRef.current, maze = mazeRef.current;
      if (stateRef.current.status === 'playing') {
        frameRef.current++;
        p.mouth = Math.sin(frameRef.current * 0.3) * 0.3;
        if (powerModeRef.current > 0) powerModeRef.current--;
        if (time - lastMove > 150) {
          lastMove = time;
          // Try next direction
          const nx1 = p.x + p.nextDir.x, ny1 = p.y + p.nextDir.y;
          if (maze[ny1]?.[nx1] !== 1) { p.dir = { ...p.nextDir }; }
          // Move
          const nx = p.x + p.dir.x, ny = p.y + p.dir.y;
          if (maze[ny]?.[nx] !== 1) { p.x = nx; p.y = ny; }
          // Collect dots
          const di = dotsRef.current.findIndex(d => d.x === p.x && d.y === p.y);
          if (di >= 0) {
            const dot = dotsRef.current[di];
            dotsRef.current.splice(di, 1);
            scoreRef.current += dot.power ? 50 : 10;
            if (dot.power) { powerModeRef.current = 60; playPowerUp(); ghostsRef.current.forEach(g => g.scared = true); }
            else playCollect();
            engine.updateState({ score: scoreRef.current });
          }
          // Move ghosts
          ghostsRef.current.forEach(g => {
            g.scared = powerModeRef.current > 0;
            const dirs = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
            const valid = dirs.filter(d => maze[g.y + d.y]?.[g.x + d.x] !== 1);
            if (valid.length > 0) {
              // Simple chase/flee AI
              if (g.scared) {
                valid.sort((a, b) => {
                  const da = Math.hypot(g.x + a.x - p.x, g.y + a.y - p.y);
                  const db = Math.hypot(g.x + b.x - p.x, g.y + b.y - p.y);
                  return db - da;
                });
              } else {
                valid.sort((a, b) => {
                  const da = Math.hypot(g.x + a.x - p.x, g.y + a.y - p.y);
                  const db = Math.hypot(g.x + b.x - p.x, g.y + b.y - p.y);
                  return da - db;
                });
              }
              const best = valid[Math.random() < 0.7 ? 0 : Math.floor(Math.random() * valid.length)];
              g.x += best.x; g.y += best.y; g.dir = best;
            }
            // Collision
            if (g.x === p.x && g.y === p.y) {
              if (g.scared) { g.x = 7; g.y = 6; g.scared = false; scoreRef.current += 200; playScore(); engine.updateState({ score: scoreRef.current }); }
              else { playHit(); engine.gameOver(scoreRef.current); }
            }
          });
          // Win check
          if (dotsRef.current.length === 0) { playWin(); engine.gameOver(scoreRef.current + 1000); }
        }
      }
      // Draw
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, c.width, c.height);
      // Maze
      for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[0].length; x++) {
          if (maze[y][x] === 1) {
            ctx.fillStyle = '#1e40af'; ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
            ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2;
            ctx.strokeRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
          }
        }
      }
      // Dots
      dotsRef.current.forEach(d => {
        ctx.fillStyle = d.power ? '#fbbf24' : '#fff';
        const r = d.power ? 5 : 2;
        ctx.beginPath(); ctx.arc(d.x * CELL + CELL / 2, d.y * CELL + CELL / 2, r, 0, Math.PI * 2); ctx.fill();
      });
      // Ghosts
      ghostsRef.current.forEach(g => {
        ctx.fillStyle = g.scared ? '#3b82f6' : g.color;
        const gx = g.x * CELL + CELL / 2, gy = g.y * CELL + CELL / 2;
        ctx.beginPath();
        ctx.arc(gx, gy - 2, 8, Math.PI, 0);
        ctx.lineTo(gx + 8, gy + 6);
        for (let i = 0; i < 4; i++) ctx.lineTo(gx + 8 - i * 4 - 2, gy + (i % 2 === 0 ? 6 : 3));
        ctx.lineTo(gx - 8, gy + 6);
        ctx.closePath(); ctx.fill();
        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(gx - 3, gy - 3, 3, 0, Math.PI * 2); ctx.arc(gx + 3, gy - 3, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = g.scared ? '#fff' : '#000';
        ctx.beginPath(); ctx.arc(gx - 2, gy - 3, 1.5, 0, Math.PI * 2); ctx.arc(gx + 4, gy - 3, 1.5, 0, Math.PI * 2); ctx.fill();
      });
      // Player (Pac-Man)
      const px = p.x * CELL + CELL / 2, py = p.y * CELL + CELL / 2;
      ctx.fillStyle = '#fbbf24';
      const angle = Math.atan2(p.dir.y, p.dir.x);
      ctx.beginPath();
      ctx.arc(px, py, 8, angle + 0.3 + p.mouth, angle + Math.PI * 2 - 0.3 - p.mouth);
      ctx.lineTo(px, py);
      ctx.closePath(); ctx.fill();
      engine.animFrameRef.current = requestAnimationFrame(loop);
    };
    engine.animFrameRef.current = requestAnimationFrame(loop);
    return () => { running = false; cancelAnimationFrame(engine.animFrameRef.current); window.removeEventListener('keydown', kd); };
  }, []);

  const handleStart = () => { engine.startGame(); initGame(); };
  return (<GameWrapper config={config} gameState={engine.gameState} onStart={handleStart} onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}><canvas ref={engine.canvasRef} style={{ maxHeight: '100%', maxWidth: '100%' }} /></GameWrapper>);
}

// ==================== PINBALL ====================
export function PinballGame({ onBack }: { onBack: () => void }) {
  const config = getGameById('pinball')!;
  const engine = useGameEngine({ gameId: 'pinball' });
  const stateRef = useRef(engine.gameState);
  useEffect(() => { stateRef.current = engine.gameState; }, [engine.gameState]);

  const ballRef = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const flippersRef = useRef({ left: 0, right: 0 });
  const bumpersRef = useRef<{ x: number; y: number; r: number; hit: number }[]>([]);
  const scoreRef = useRef(0);
  const ballsRef = useRef(3);

  const initGame = useCallback(() => {
    const c = engine.canvasRef.current!;
    ballRef.current = { x: c.width - 30, y: c.height - 100, vx: -2 + Math.random() * -3, vy: -8 };
    flippersRef.current = { left: 0, right: 0 };
    const bumpers: typeof bumpersRef.current = [];
    bumpers.push({ x: c.width * 0.3, y: c.height * 0.25, r: 25, hit: 0 });
    bumpers.push({ x: c.width * 0.7, y: c.height * 0.25, r: 25, hit: 0 });
    bumpers.push({ x: c.width * 0.5, y: c.height * 0.35, r: 20, hit: 0 });
    bumpers.push({ x: c.width * 0.25, y: c.height * 0.5, r: 18, hit: 0 });
    bumpers.push({ x: c.width * 0.75, y: c.height * 0.5, r: 18, hit: 0 });
    bumpersRef.current = bumpers;
    scoreRef.current = 0; ballsRef.current = 3;
  }, [engine.canvasRef]);

  useEffect(() => {
    const c = engine.canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!; let running = true;
    const p = c.parentElement!;
    c.width = Math.min(p.clientWidth, 400); c.height = Math.min(p.clientHeight, 650);

    const keysDown = new Set<string>();
    const kd = (e: KeyboardEvent) => { keysDown.add(e.key); };
    const ku = (e: KeyboardEvent) => { keysDown.delete(e.key); };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);

    const FLIPPER_LEN = 50, FLIPPER_W = 10;
    const flipperLeftX = c.width * 0.25, flipperRightX = c.width * 0.75;
    const flipperY = c.height - 80;

    const loop = () => {
      if (!running) return;
      const W = c.width, H = c.height, ball = ballRef.current, fl = flippersRef.current;

      if (stateRef.current.status === 'playing') {
        // Flipper controls
        const leftActive = keysDown.has('ArrowLeft') || keysDown.has('a') || keysDown.has('z');
        const rightActive = keysDown.has('ArrowRight') || keysDown.has('d') || keysDown.has('/');
        fl.left += (leftActive ? -0.4 : 0.15);
        fl.right += (rightActive ? 0.4 : -0.15);
        fl.left = Math.max(-0.6, Math.min(0.2, fl.left));
        fl.right = Math.max(-0.2, Math.min(0.6, fl.right));

        // Ball physics
        ball.vy += 0.15; // gravity
        ball.x += ball.vx; ball.y += ball.vy;
        ball.vx *= 0.998; ball.vy *= 0.998;

        // Wall collisions
        if (ball.x < 20) { ball.x = 20; ball.vx = Math.abs(ball.vx) * 0.8; playBounce(); }
        if (ball.x > W - 20) { ball.x = W - 20; ball.vx = -Math.abs(ball.vx) * 0.8; playBounce(); }
        if (ball.y < 20) { ball.y = 20; ball.vy = Math.abs(ball.vy) * 0.8; playBounce(); }

        // Bumper collisions
        bumpersRef.current.forEach(b => {
          const dist = Math.hypot(ball.x - b.x, ball.y - b.y);
          if (dist < b.r + 6) {
            const angle = Math.atan2(ball.y - b.y, ball.x - b.x);
            const speed = Math.hypot(ball.vx, ball.vy) * 1.2 + 3;
            ball.vx = Math.cos(angle) * speed;
            ball.vy = Math.sin(angle) * speed;
            ball.x = b.x + Math.cos(angle) * (b.r + 8);
            ball.y = b.y + Math.sin(angle) * (b.r + 8);
            b.hit = 10;
            scoreRef.current += 100;
            engine.updateState({ score: scoreRef.current });
            playScore();
          }
          if (b.hit > 0) b.hit--;
        });

        // Flipper collisions
        const checkFlipper = (fx: number, fy: number, angle: number, dir: number) => {
          const endX = fx + Math.cos(angle) * FLIPPER_LEN * dir;
          const endY = fy + Math.sin(angle) * FLIPPER_LEN;
          // Simple line-circle collision
          const dx = endX - fx, dy = endY - fy;
          const t = Math.max(0, Math.min(1, ((ball.x - fx) * dx + (ball.y - fy) * dy) / (dx * dx + dy * dy)));
          const closestX = fx + t * dx, closestY = fy + t * dy;
          const dist = Math.hypot(ball.x - closestX, ball.y - closestY);
          if (dist < 10 && ball.vy > 0) {
            const bounceAngle = angle - Math.PI / 2;
            const speed = Math.hypot(ball.vx, ball.vy) + 5;
            ball.vx = Math.cos(bounceAngle) * speed * dir;
            ball.vy = -Math.abs(Math.sin(bounceAngle) * speed) - 3;
            ball.y = closestY - 12;
            playBounce();
          }
        };
        checkFlipper(flipperLeftX, flipperY, fl.left, 1);
        checkFlipper(flipperRightX, flipperY, fl.right, -1);

        // Ball lost
        if (ball.y > H + 20) {
          ballsRef.current--;
          engine.updateState({ lives: ballsRef.current });
          if (ballsRef.current <= 0) {
            playHit();
            engine.gameOver(scoreRef.current);
          } else {
            ball.x = W - 30; ball.y = H - 100;
            ball.vx = -2 + Math.random() * -3; ball.vy = -8;
          }
        }
      }

      // Draw
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#1e1b4b'); grad.addColorStop(1, '#0f0a2e');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

      // Walls
      ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(10, H); ctx.lineTo(10, 40); ctx.quadraticCurveTo(10, 10, 40, 10);
      ctx.lineTo(W - 40, 10); ctx.quadraticCurveTo(W - 10, 10, W - 10, 40);
      ctx.lineTo(W - 10, H);
      ctx.stroke();

      // Bumpers
      bumpersRef.current.forEach(b => {
        ctx.fillStyle = b.hit > 0 ? '#fbbf24' : '#ef4444';
        ctx.shadowColor = b.hit > 0 ? '#fbbf24' : '#ef4444';
        ctx.shadowBlur = b.hit > 0 ? 20 : 10;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 0.4, 0, Math.PI * 2); ctx.fill();
      });

      // Flippers
      const drawFlipper = (x: number, y: number, angle: number, dir: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(0, -FLIPPER_W / 2, FLIPPER_LEN * dir, FLIPPER_W);
        ctx.beginPath();
        ctx.ellipse(FLIPPER_LEN * dir, 0, 6, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      };
      drawFlipper(flipperLeftX, flipperY, flippersRef.current.left, 1);
      drawFlipper(flipperRightX, flipperY, flippersRef.current.right, -1);

      // Ball
      ctx.fillStyle = '#c0c0c0';
      ctx.shadowColor = '#fff'; ctx.shadowBlur = 15;
      ctx.beginPath(); ctx.arc(ball.x, ball.y, 8, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath(); ctx.arc(ball.x - 2, ball.y - 2, 3, 0, Math.PI * 2); ctx.fill();

      // Balls remaining
      for (let i = 0; i < ballsRef.current; i++) {
        ctx.fillStyle = '#6366f1';
        ctx.beginPath(); ctx.arc(25 + i * 18, H - 20, 6, 0, Math.PI * 2); ctx.fill();
      }

      engine.animFrameRef.current = requestAnimationFrame(loop);
    };
    engine.animFrameRef.current = requestAnimationFrame(loop);
    return () => { running = false; cancelAnimationFrame(engine.animFrameRef.current); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, []);

  const handleStart = () => { engine.startGame(); initGame(); };
  return (<GameWrapper config={config} gameState={engine.gameState} onStart={handleStart} onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}
    extraHud={<div className="px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-indigo-400 text-xs">🎱 {engine.gameState.lives}</div>}
  ><canvas ref={engine.canvasRef} style={{ maxHeight: '100%', maxWidth: '100%' }} /></GameWrapper>);
}

// ==================== BASKETBALL SHOOT ====================
export function BasketballGame({ onBack }: { onBack: () => void }) {
  const config = getGameById('basketball')!;
  const engine = useGameEngine({ gameId: 'basketball' });
  const stateRef = useRef(engine.gameState);
  useEffect(() => { stateRef.current = engine.gameState; }, [engine.gameState]);

  const ballRef = useRef({ x: 0, y: 0, vx: 0, vy: 0, shooting: false, thrown: false });
  const hoopRef = useRef({ x: 0, y: 0 });
  const scoreRef = useRef(0);
  const shotsRef = useRef(10);
  const aimRef = useRef({ power: 50, angle: 45 });
  const powerDirRef = useRef(1);

  const initGame = useCallback(() => {
    const c = engine.canvasRef.current!;
    ballRef.current = { x: 80, y: c.height - 80, vx: 0, vy: 0, shooting: false, thrown: false };
    hoopRef.current = { x: c.width - 80, y: 150 };
    scoreRef.current = 0; shotsRef.current = 10;
    aimRef.current = { power: 50, angle: 45 };
  }, [engine.canvasRef]);

  useEffect(() => {
    const c = engine.canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!; let running = true;
    const p = c.parentElement!;
    c.width = Math.min(p.clientWidth, 600); c.height = Math.min(p.clientHeight, 450);

    const shoot = () => {
      if (stateRef.current.status !== 'playing' || ballRef.current.thrown || shotsRef.current <= 0) return;
      const ball = ballRef.current, aim = aimRef.current;
      const rad = (aim.angle * Math.PI) / 180;
      const power = aim.power * 0.18;
      ball.vx = Math.cos(rad) * power;
      ball.vy = -Math.sin(rad) * power;
      ball.thrown = true;
      shotsRef.current--;
    };

    const kd = (e: KeyboardEvent) => { if (e.key === ' ') { shoot(); e.preventDefault(); } };
    c.addEventListener('click', shoot);
    window.addEventListener('keydown', kd);

    const loop = () => {
      if (!running) return;
      const W = c.width, H = c.height, ball = ballRef.current, hoop = hoopRef.current;

      if (stateRef.current.status === 'playing') {
        // Power oscillation
        if (!ball.thrown) {
          aimRef.current.power += powerDirRef.current * 1.5;
          if (aimRef.current.power > 100 || aimRef.current.power < 20) powerDirRef.current *= -1;
        }

        if (ball.thrown) {
          ball.vy += 0.35;
          ball.x += ball.vx; ball.y += ball.vy;

          // Check score
          if (!ball.shooting && Math.abs(ball.x - hoop.x) < 20 && Math.abs(ball.y - hoop.y) < 15 && ball.vy > 0) {
            ball.shooting = true;
            scoreRef.current += 100;
            engine.updateState({ score: scoreRef.current });
            playScore();
          }

          // Ball out of bounds - reset
          if (ball.y > H + 50 || ball.x > W + 50 || ball.x < -50) {
            if (shotsRef.current <= 0) {
              engine.gameOver(scoreRef.current);
            } else {
              ball.x = 80; ball.y = H - 80;
              ball.vx = 0; ball.vy = 0;
              ball.thrown = false; ball.shooting = false;
            }
          }
        }
      }

      // Draw court
      ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#2d3748'; ctx.fillRect(0, H - 30, W, 30);

      // Backboard
      ctx.fillStyle = '#fff';
      ctx.fillRect(hoop.x + 25, hoop.y - 50, 8, 80);
      // Hoop
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(hoop.x, hoop.y, 25, 8, 0, 0, Math.PI * 2); ctx.stroke();
      // Net
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(hoop.x - 20 + i * 8, hoop.y);
        ctx.lineTo(hoop.x - 15 + i * 6, hoop.y + 35);
        ctx.stroke();
      }

      // Power meter
      if (!ball.thrown) {
        ctx.fillStyle = '#333'; ctx.fillRect(20, H - 25, 100, 10);
        const powerColor = aimRef.current.power > 70 ? '#22c55e' : aimRef.current.power > 40 ? '#fbbf24' : '#ef4444';
        ctx.fillStyle = powerColor; ctx.fillRect(20, H - 25, aimRef.current.power, 10);
        // Aim line
        ctx.strokeStyle = '#ffffff60'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
        const rad = (aimRef.current.angle * Math.PI) / 180;
        ctx.beginPath();
        ctx.moveTo(ball.x, ball.y);
        ctx.lineTo(ball.x + Math.cos(rad) * 60, ball.y - Math.sin(rad) * 60);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Ball
      ctx.fillStyle = '#f97316';
      ctx.beginPath(); ctx.arc(ball.x, ball.y, 15, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(ball.x, ball.y, 15, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ball.x - 15, ball.y); ctx.lineTo(ball.x + 15, ball.y); ctx.stroke();
      ctx.beginPath(); ctx.arc(ball.x, ball.y, 15, -0.3, 0.3); ctx.stroke();

      // Shots remaining
      ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`Shots: ${shotsRef.current}`, W - 90, 25);

      engine.animFrameRef.current = requestAnimationFrame(loop);
    };
    engine.animFrameRef.current = requestAnimationFrame(loop);
    return () => { running = false; cancelAnimationFrame(engine.animFrameRef.current); c.removeEventListener('click', shoot); window.removeEventListener('keydown', kd); };
  }, []);

  const handleStart = () => { engine.startGame(); initGame(); };
  return (<GameWrapper config={config} gameState={engine.gameState} onStart={handleStart} onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}><canvas ref={engine.canvasRef} style={{ maxHeight: '100%', maxWidth: '100%' }} /></GameWrapper>);
}

// ==================== GOLF ====================
export function GolfGame({ onBack }: { onBack: () => void }) {
  const config = getGameById('golf')!;
  const engine = useGameEngine({ gameId: 'golf' });
  const stateRef = useRef(engine.gameState);
  useEffect(() => { stateRef.current = engine.gameState; }, [engine.gameState]);

  const ballRef = useRef({ x: 0, y: 0, vx: 0, vy: 0, moving: false });
  const holeRef = useRef({ x: 0, y: 0 });
  const strokesRef = useRef(0);
  const levelRef = useRef(1);
  const aimAngleRef = useRef(0);
  const powerRef = useRef(0);
  const chargingRef = useRef(false);

  const initLevel = useCallback((level: number) => {
    const c = engine.canvasRef.current!;
    ballRef.current = { x: 60, y: c.height / 2, vx: 0, vy: 0, moving: false };
    holeRef.current = { x: c.width - 60 - (level % 3) * 30, y: c.height / 2 + (level % 2 === 0 ? -50 : 50) };
    aimAngleRef.current = 0; powerRef.current = 0;
  }, [engine.canvasRef]);

  useEffect(() => {
    const c = engine.canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!; let running = true;
    const p = c.parentElement!;
    c.width = Math.min(p.clientWidth, 600); c.height = Math.min(p.clientHeight, 400);

    const mm = (e: MouseEvent) => {
      if (ballRef.current.moving) return;
      const rect = c.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      aimAngleRef.current = Math.atan2(my - ballRef.current.y, mx - ballRef.current.x);
    };
    const md = () => { if (!ballRef.current.moving && stateRef.current.status === 'playing') chargingRef.current = true; };
    const mu = () => {
      if (chargingRef.current && stateRef.current.status === 'playing') {
        const ball = ballRef.current;
        ball.vx = Math.cos(aimAngleRef.current) * powerRef.current * 0.15;
        ball.vy = Math.sin(aimAngleRef.current) * powerRef.current * 0.15;
        ball.moving = true;
        strokesRef.current++;
        chargingRef.current = false;
        powerRef.current = 0;
        playBounce();
      }
    };
    c.addEventListener('mousemove', mm);
    c.addEventListener('mousedown', md);
    window.addEventListener('mouseup', mu);

    const loop = () => {
      if (!running) return;
      const W = c.width, H = c.height, ball = ballRef.current, hole = holeRef.current;

      if (stateRef.current.status === 'playing') {
        if (chargingRef.current) {
          powerRef.current = Math.min(100, powerRef.current + 2);
        }

        if (ball.moving) {
          ball.x += ball.vx; ball.y += ball.vy;
          ball.vx *= 0.98; ball.vy *= 0.98;

          // Walls
          if (ball.x < 10 || ball.x > W - 10) { ball.vx *= -0.7; ball.x = Math.max(10, Math.min(W - 10, ball.x)); }
          if (ball.y < 10 || ball.y > H - 10) { ball.vy *= -0.7; ball.y = Math.max(10, Math.min(H - 10, ball.y)); }

          // Stop
          if (Math.abs(ball.vx) < 0.1 && Math.abs(ball.vy) < 0.1) {
            ball.vx = 0; ball.vy = 0; ball.moving = false;
          }

          // Hole check
          if (Math.hypot(ball.x - hole.x, ball.y - hole.y) < 12) {
            const bonus = Math.max(0, 500 - strokesRef.current * 50);
            scoreRef.current += 100 + bonus;
            engine.updateState({ score: scoreRef.current, level: levelRef.current });
            playWin();
            levelRef.current++;
            if (levelRef.current > 9) {
              engine.gameOver(scoreRef.current);
            } else {
              initLevel(levelRef.current);
            }
          }
        }
      }

      // Draw
      ctx.fillStyle = '#22c55e'; ctx.fillRect(0, 0, W, H);
      // Rough edges
      ctx.fillStyle = '#15803d';
      ctx.fillRect(0, 0, W, 15); ctx.fillRect(0, H - 15, W, 15);
      ctx.fillRect(0, 0, 15, H); ctx.fillRect(W - 15, 0, 15, H);

      // Hole
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath(); ctx.arc(hole.x, hole.y, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#333';
      ctx.beginPath(); ctx.arc(hole.x, hole.y, 8, 0, Math.PI * 2); ctx.fill();
      // Flag
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(hole.x, hole.y - 40, 2, 40);
      ctx.beginPath(); ctx.moveTo(hole.x + 2, hole.y - 40); ctx.lineTo(hole.x + 20, hole.y - 32); ctx.lineTo(hole.x + 2, hole.y - 24); ctx.fill();

      // Ball
      ctx.fillStyle = '#fff'; ctx.shadowColor = '#000'; ctx.shadowBlur = 5;
      ctx.beginPath(); ctx.arc(ball.x, ball.y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;

      // Aim line
      if (!ball.moving && stateRef.current.status === 'playing') {
        const len = 30 + powerRef.current * 0.5;
        ctx.strokeStyle = chargingRef.current ? '#ef4444' : '#ffffff80';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(ball.x, ball.y);
        ctx.lineTo(ball.x + Math.cos(aimAngleRef.current) * len, ball.y + Math.sin(aimAngleRef.current) * len);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Power bar
      if (chargingRef.current) {
        ctx.fillStyle = '#333'; ctx.fillRect(20, H - 30, 100, 15);
        ctx.fillStyle = powerRef.current > 70 ? '#ef4444' : powerRef.current > 40 ? '#fbbf24' : '#22c55e';
        ctx.fillRect(20, H - 30, powerRef.current, 15);
      }

      // Info
      ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`Hole ${levelRef.current}/9`, 20, 35);
      ctx.fillText(`Strokes: ${strokesRef.current}`, W - 100, 35);

      engine.animFrameRef.current = requestAnimationFrame(loop);
    };

    let scoreRef = { current: 0 };
    engine.animFrameRef.current = requestAnimationFrame(loop);
    return () => { running = false; cancelAnimationFrame(engine.animFrameRef.current); c.removeEventListener('mousemove', mm); c.removeEventListener('mousedown', md); window.removeEventListener('mouseup', mu); };
  }, []);

  const handleStart = () => { engine.startGame(); strokesRef.current = 0; levelRef.current = 1; initLevel(1); };
  return (<GameWrapper config={config} gameState={engine.gameState} onStart={handleStart} onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}
    extraHud={<div className="px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-green-400 text-xs">⛳ {levelRef.current}/9</div>}
  ><canvas ref={engine.canvasRef} style={{ maxHeight: '100%', maxWidth: '100%' }} /></GameWrapper>);
}

// ==================== ARCHERY ====================
export function ArcheryGame({ onBack }: { onBack: () => void }) {
  const config = getGameById('archery')!;
  const engine = useGameEngine({ gameId: 'archery' });
  const stateRef = useRef(engine.gameState);
  useEffect(() => { stateRef.current = engine.gameState; }, [engine.gameState]);

  const arrowRef = useRef({ x: 0, y: 0, vx: 0, vy: 0, flying: false });
  const targetRef = useRef({ x: 0, y: 0, vy: 0 });
  const scoreRef = useRef(0);
  const arrowsRef = useRef(10);
  const windRef = useRef(0);

  const initGame = useCallback(() => {
    const c = engine.canvasRef.current!;
    arrowRef.current = { x: 60, y: c.height / 2, vx: 0, vy: 0, flying: false };
    targetRef.current = { x: c.width - 80, y: c.height / 2, vy: 1 };
    scoreRef.current = 0; arrowsRef.current = 10;
    windRef.current = (Math.random() - 0.5) * 0.1;
  }, [engine.canvasRef]);

  useEffect(() => {
    const c = engine.canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!; let running = true;
    const p = c.parentElement!;
    c.width = Math.min(p.clientWidth, 650); c.height = Math.min(p.clientHeight, 400);

    const shoot = () => {
      if (stateRef.current.status !== 'playing' || arrowRef.current.flying || arrowsRef.current <= 0) return;
      arrowRef.current.vx = 12;
      arrowRef.current.vy = 0;
      arrowRef.current.flying = true;
      arrowsRef.current--;
      windRef.current = (Math.random() - 0.5) * 0.15;
      playBounce();
    };

    c.addEventListener('click', shoot);
    const kd = (e: KeyboardEvent) => { if (e.key === ' ') { shoot(); e.preventDefault(); } };
    window.addEventListener('keydown', kd);

    const loop = () => {
      if (!running) return;
      const W = c.width, H = c.height;
      const arrow = arrowRef.current, target = targetRef.current;

      if (stateRef.current.status === 'playing') {
        // Move target
        target.y += target.vy;
        if (target.y < 80 || target.y > H - 80) target.vy *= -1;

        if (arrow.flying) {
          arrow.x += arrow.vx;
          arrow.vy += windRef.current;
          arrow.y += arrow.vy;

          // Hit target?
          const dist = Math.hypot(arrow.x - target.x, arrow.y - target.y);
          if (arrow.x >= target.x - 30) {
            if (dist < 50) {
              let points = 0;
              if (dist < 10) points = 100;
              else if (dist < 20) points = 50;
              else if (dist < 35) points = 25;
              else points = 10;
              scoreRef.current += points;
              engine.updateState({ score: scoreRef.current });
              playScore();
            }
            // Reset arrow
            arrow.x = 60; arrow.y = H / 2;
            arrow.vx = 0; arrow.vy = 0; arrow.flying = false;
            if (arrowsRef.current <= 0) engine.gameOver(scoreRef.current);
          }

          // Out of bounds
          if (arrow.x > W + 10 || arrow.y < -10 || arrow.y > H + 10) {
            arrow.x = 60; arrow.y = H / 2;
            arrow.vx = 0; arrow.vy = 0; arrow.flying = false;
            if (arrowsRef.current <= 0) engine.gameOver(scoreRef.current);
          }
        }
      }

      // Draw sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0, '#0ea5e9'); skyGrad.addColorStop(1, '#38bdf8');
      ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, W, H);

      // Ground
      ctx.fillStyle = '#22c55e'; ctx.fillRect(0, H - 40, W, 40);

      // Wind indicator
      ctx.fillStyle = '#fff'; ctx.font = '12px sans-serif';
      const windStr = windRef.current > 0 ? `Wind: → ${Math.abs(windRef.current * 100).toFixed(0)}` : `Wind: ← ${Math.abs(windRef.current * 100).toFixed(0)}`;
      ctx.fillText(windStr, W / 2 - 30, 25);

      // Target
      const rings = [
        { r: 50, color: '#fff' },
        { r: 40, color: '#000' },
        { r: 30, color: '#3b82f6' },
        { r: 20, color: '#ef4444' },
        { r: 10, color: '#fbbf24' },
      ];
      rings.forEach(ring => {
        ctx.fillStyle = ring.color;
        ctx.beginPath(); ctx.arc(target.x, target.y, ring.r, 0, Math.PI * 2); ctx.fill();
      });

      // Bow
      ctx.strokeStyle = '#92400e'; ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(40, arrow.flying ? H / 2 : arrow.y, 40, -Math.PI / 2 + 0.3, Math.PI / 2 - 0.3);
      ctx.stroke();
      // String
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, (arrow.flying ? H / 2 : arrow.y) - 35);
      ctx.lineTo(arrow.flying ? 40 : 55, arrow.flying ? H / 2 : arrow.y);
      ctx.lineTo(40, (arrow.flying ? H / 2 : arrow.y) + 35);
      ctx.stroke();

      // Arrow
      ctx.fillStyle = '#8b4513';
      ctx.save();
      ctx.translate(arrow.x, arrow.y);
      const angle = Math.atan2(arrow.vy, arrow.vx || 1);
      ctx.rotate(angle);
      ctx.fillRect(-25, -2, 50, 4);
      // Arrowhead
      ctx.fillStyle = '#6b7280';
      ctx.beginPath(); ctx.moveTo(25, 0); ctx.lineTo(18, -5); ctx.lineTo(18, 5); ctx.fill();
      // Fletching
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.moveTo(-25, 0); ctx.lineTo(-20, -6); ctx.lineTo(-15, 0); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-25, 0); ctx.lineTo(-20, 6); ctx.lineTo(-15, 0); ctx.fill();
      ctx.restore();

      // Arrows remaining
      ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`Arrows: ${arrowsRef.current}`, 20, H - 55);

      engine.animFrameRef.current = requestAnimationFrame(loop);
    };
    engine.animFrameRef.current = requestAnimationFrame(loop);
    return () => { running = false; cancelAnimationFrame(engine.animFrameRef.current); c.removeEventListener('click', shoot); window.removeEventListener('keydown', kd); };
  }, []);

  const handleStart = () => { engine.startGame(); initGame(); };
  return (<GameWrapper config={config} gameState={engine.gameState} onStart={handleStart} onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}><canvas ref={engine.canvasRef} style={{ maxHeight: '100%', maxWidth: '100%' }} /></GameWrapper>);
}

// ==================== COOKIE CLICKER ====================
export function CookieClickerGame({ onBack }: { onBack: () => void }) {
  const config = getGameById('cookieclicker')!;
  const engine = useGameEngine({ gameId: 'cookieclicker' });
  const [cookies, setCookies] = useState(0);
  const [cps, setCps] = useState(0); // cookies per second
  const [upgrades, setUpgrades] = useState({ cursor: 0, grandma: 0, farm: 0, factory: 0 });
  const [clickPower, setClickPower] = useState(1);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; val: number }[]>([]);
  const particleId = useRef(0);

  const UPGRADE_COSTS = {
    cursor: (lvl: number) => Math.floor(15 * Math.pow(1.15, lvl)),
    grandma: (lvl: number) => Math.floor(100 * Math.pow(1.15, lvl)),
    farm: (lvl: number) => Math.floor(500 * Math.pow(1.15, lvl)),
    factory: (lvl: number) => Math.floor(2000 * Math.pow(1.15, lvl)),
  };

  useEffect(() => {
    if (engine.gameState.status !== 'playing') return;
    const newCps = upgrades.cursor * 0.1 + upgrades.grandma * 1 + upgrades.farm * 5 + upgrades.factory * 20;
    setCps(newCps);
    const interval = setInterval(() => {
      setCookies(c => {
        const newC = c + newCps / 10;
        engine.updateState({ score: Math.floor(newC) });
        return newC;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [upgrades, engine.gameState.status, engine]);

  const handleClick = (e: React.MouseEvent) => {
    if (engine.gameState.status !== 'playing') return;
    setCookies(c => c + clickPower);
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setParticles(p => [...p, { id: particleId.current++, x, y, val: clickPower }]);
    setTimeout(() => setParticles(p => p.slice(1)), 800);
    playCollect();
  };

  const buyUpgrade = (type: keyof typeof upgrades) => {
    const cost = UPGRADE_COSTS[type](upgrades[type]);
    if (cookies >= cost) {
      setCookies(c => c - cost);
      setUpgrades(u => ({ ...u, [type]: u[type] + 1 }));
      if (type === 'cursor') setClickPower(p => p + 1);
      playScore();
    }
  };

  const handleStart = () => {
    engine.startGame();
    setCookies(0); setCps(0); setClickPower(1);
    setUpgrades({ cursor: 0, grandma: 0, farm: 0, factory: 0 });
  };

  const formatNum = (n: number) => n >= 1000000 ? (n / 1000000).toFixed(1) + 'M' : n >= 1000 ? (n / 1000).toFixed(1) + 'K' : Math.floor(n).toString();

  return (
    <GameWrapper config={config} gameState={engine.gameState} onStart={handleStart} onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}>
      <div className="absolute inset-0 bg-gradient-to-br from-amber-900 via-amber-800 to-yellow-900 flex">
        {/* Cookie area */}
        <div className="flex-1 flex flex-col items-center justify-center relative" onClick={handleClick}>
          <div className="text-4xl font-black text-white mb-2">{formatNum(cookies)} 🍪</div>
          <div className="text-sm text-amber-200 mb-6">per second: {cps.toFixed(1)}</div>
          <div className="text-8xl cursor-pointer hover:scale-110 active:scale-95 transition-transform select-none drop-shadow-2xl">
            🍪
          </div>
          <div className="text-xs text-amber-300 mt-4">+{clickPower} per click</div>
          {/* Particles */}
          {particles.map(p => (
            <div key={p.id} className="absolute text-yellow-300 font-bold pointer-events-none animate-fade-in"
              style={{ left: p.x, top: p.y, animation: 'floatUp 0.8s ease-out forwards' }}>
              +{p.val}
            </div>
          ))}
        </div>
        {/* Shop */}
        <div className="w-48 bg-black/30 p-3 overflow-y-auto">
          <h3 className="text-sm font-bold text-amber-200 mb-3">🏪 Shop</h3>
          {[
            { key: 'cursor' as const, icon: '👆', name: 'Cursor', desc: '+1 click power' },
            { key: 'grandma' as const, icon: '👵', name: 'Grandma', desc: '+1 CPS' },
            { key: 'farm' as const, icon: '🌾', name: 'Farm', desc: '+5 CPS' },
            { key: 'factory' as const, icon: '🏭', name: 'Factory', desc: '+20 CPS' },
          ].map(u => {
            const cost = UPGRADE_COSTS[u.key](upgrades[u.key]);
            const canBuy = cookies >= cost;
            return (
              <button key={u.key} onClick={() => buyUpgrade(u.key)}
                className={`w-full p-2 rounded-lg mb-2 text-left transition-all ${canBuy ? 'bg-amber-600/50 hover:bg-amber-600/70' : 'bg-gray-800/50 opacity-50'}`}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{u.icon}</span>
                  <div>
                    <div className="text-xs font-bold text-white">{u.name} ({upgrades[u.key]})</div>
                    <div className="text-[10px] text-amber-200">{formatNum(cost)} 🍪</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <style>{`
          @keyframes floatUp {
            0% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-60px); }
          }
        `}</style>
      </div>
    </GameWrapper>
  );
}

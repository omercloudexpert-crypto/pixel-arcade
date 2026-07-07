// Platform Jump - Jump from platform to platform, go as high as possible
import { useEffect, useRef, useCallback } from 'react';
import GameWrapper from '../components/GameWrapper';
import { useGameEngine } from '../hooks/useGameEngine';
import { getGameById } from './registry';
import { playBounce, playHit } from '../utils/sound';

interface Platform { x: number; y: number; w: number; type: 'normal' | 'moving' | 'breaking'; vx: number; broken: boolean; }

export default function DoodleJumpGame({ onBack }: { onBack: () => void }) {
  const config = getGameById('doodlejump')!;
  const engine = useGameEngine({ gameId: 'doodlejump' });
  const stateRef = useRef(engine.gameState);
  const playerRef = useRef({ x: 0, y: 0, vx: 0, vy: 0, w: 24, h: 30 });
  const platformsRef = useRef<Platform[]>([]);
  const cameraRef = useRef(0);
  const scoreRef = useRef(0);
  const maxHeightRef = useRef(0);
  const keysRef = useRef<Set<string>>(new Set());

  useEffect(() => { stateRef.current = engine.gameState; }, [engine.gameState]);

  const initGame = useCallback(() => {
    const canvas = engine.canvasRef.current!;
    const W = canvas.width, H = canvas.height;
    playerRef.current = { x: W / 2 - 12, y: H - 80, vx: 0, vy: -8, w: 24, h: 30 };
    cameraRef.current = 0;
    scoreRef.current = 0;
    maxHeightRef.current = 0;

    // Generate initial platforms
    const plats: Platform[] = [];
    for (let i = 0; i < 15; i++) {
      plats.push({
        x: Math.random() * (W - 60), y: H - 50 - i * (H / 12),
        w: 50 + Math.random() * 20,
        type: i < 3 ? 'normal' : Math.random() > 0.8 ? 'moving' : Math.random() > 0.9 ? 'breaking' : 'normal',
        vx: Math.random() > 0.5 ? 1 : -1, broken: false,
      });
    }
    // Ensure first platform under player
    plats[0] = { x: W / 2 - 30, y: H - 50, w: 60, type: 'normal', vx: 0, broken: false };
    platformsRef.current = plats;
  }, [engine.canvasRef]);

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

    const kd = (e: KeyboardEvent) => keysRef.current.add(e.key);
    const ku = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    // Touch tilt emulation
    let touchX: number | null = null;
    const ts = (e: TouchEvent) => { touchX = e.touches[0].clientX; };
    const tm = (e: TouchEvent) => { touchX = e.touches[0].clientX; };
    const te = () => { touchX = null; };
    canvas.addEventListener('touchstart', ts, { passive: true });
    canvas.addEventListener('touchmove', tm, { passive: true });
    canvas.addEventListener('touchend', te);

    const loop = () => {
      if (!running) return;
      const W = canvas.width, H = canvas.height;
      const player = playerRef.current;
      const keys = keysRef.current;

      if (stateRef.current.status === 'playing') {
        // Controls
        if (keys.has('ArrowLeft') || keys.has('a')) player.vx = -5;
        else if (keys.has('ArrowRight') || keys.has('d')) player.vx = 5;
        else if (touchX !== null) {
          const center = W / 2;
          player.vx = (touchX - canvas.getBoundingClientRect().left - center) * 0.05;
        } else {
          player.vx *= 0.85;
        }

        // Physics
        player.vy += 0.35;
        player.x += player.vx;
        player.y += player.vy;

        // Wrap horizontally
        if (player.x + player.w < 0) player.x = W;
        if (player.x > W) player.x = -player.w;

        // Platform collision (only when falling)
        if (player.vy > 0) {
          for (const p of platformsRef.current) {
            if (p.broken) continue;
            if (player.x + player.w > p.x && player.x < p.x + p.w &&
              player.y + player.h >= p.y - cameraRef.current && player.y + player.h <= p.y - cameraRef.current + 15) {
              if (p.type === 'breaking') {
                p.broken = true;
                playHit();
              } else {
                player.vy = -10;
                playBounce();
              }
            }
          }
        }

        // Camera follows player upward
        const screenY = player.y + cameraRef.current;
        if (screenY < H * 0.4) {
          const diff = H * 0.4 - screenY;
          cameraRef.current -= diff;
          // Track height for scoring
          const height = Math.floor(-player.y / 10);
          if (height > maxHeightRef.current) {
            maxHeightRef.current = height;
            scoreRef.current = height;
            engine.updateState({ score: scoreRef.current });
          }
        }

        // Generate new platforms as player goes up
        const topVisible = -cameraRef.current - 100;
        const topPlatY = Math.min(...platformsRef.current.map(p => p.y));
        if (topPlatY > topVisible) {
          const gap = 40 + Math.random() * 60;
          const type: 'normal' | 'moving' | 'breaking' = Math.random() > 0.7 ? (Math.random() > 0.5 ? 'moving' : 'breaking') : 'normal';
          platformsRef.current.push({
            x: Math.random() * (W - 60), y: topPlatY - gap, w: 50 + Math.random() * 20,
            type, vx: Math.random() > 0.5 ? 1.5 : -1.5, broken: false,
          });
        }

        // Remove platforms below screen
        platformsRef.current = platformsRef.current.filter(p => p.y + cameraRef.current < H + 50);

        // Moving platforms
        platformsRef.current.forEach(p => {
          if (p.type === 'moving') {
            p.x += p.vx;
            if (p.x < 0 || p.x + p.w > W) p.vx *= -1;
          }
        });

        // Game over
        if (player.y + cameraRef.current > H + 50) {
          engine.gameOver(scoreRef.current);
        }
      }

      // Draw
      ctx.fillStyle = '#f0f9ff';
      ctx.fillRect(0, 0, W, H);

      // Platforms
      platformsRef.current.forEach(p => {
        const sy = p.y + cameraRef.current;
        if (sy < -20 || sy > H + 20 || p.broken) return;
        ctx.fillStyle = p.type === 'normal' ? '#22c55e' : p.type === 'moving' ? '#3b82f6' : '#ef4444';
        ctx.beginPath();
        ctx.roundRect(p.x, sy, p.w, 10, 5);
        ctx.fill();
      });

      // Player
      const py = player.y + cameraRef.current;
      ctx.fillStyle = '#6366f1';
      ctx.beginPath();
      ctx.roundRect(player.x, py, player.w, player.h, 6);
      ctx.fill();
      // Face
      ctx.fillStyle = '#fff';
      ctx.fillRect(player.x + 5, py + 6, 5, 5);
      ctx.fillRect(player.x + 14, py + 6, 5, 5);
      ctx.fillStyle = '#000';
      ctx.fillRect(player.x + 6, py + 7, 3, 3);
      ctx.fillRect(player.x + 15, py + 7, 3, 3);

      engine.animFrameRef.current = requestAnimationFrame(loop);
    };
    engine.animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      running = false; cancelAnimationFrame(engine.animFrameRef.current);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      canvas.removeEventListener('touchstart', ts);
      canvas.removeEventListener('touchmove', tm);
      canvas.removeEventListener('touchend', te);
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

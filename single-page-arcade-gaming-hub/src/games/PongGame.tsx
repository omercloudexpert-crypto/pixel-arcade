// Pong - Classic 2-player table tennis vs AI
import { useEffect, useRef, useCallback } from 'react';
import GameWrapper from '../components/GameWrapper';
import { useGameEngine } from '../hooks/useGameEngine';
import { getGameById } from './registry';
import { playBounce, playScore, playHit } from '../utils/sound';

interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string; }

export default function PongGame({ onBack }: { onBack: () => void }) {
  const config = getGameById('pong')!;
  const engine = useGameEngine({ gameId: 'pong' });
  const stateRef = useRef(engine.gameState);
  const playerRef = useRef({ y: 0, score: 0 });
  const aiRef = useRef({ y: 0, score: 0 });
  const ballRef = useRef({ x: 0, y: 0, vx: 5, vy: 3 });
  const scoreRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const shakeRef = useRef(0);
  const keysRef = useRef<Set<string>>(new Set());
  const touchYRef = useRef<number | null>(null);

  useEffect(() => { stateRef.current = engine.gameState; }, [engine.gameState]);

  const PW = 12, PH = 80, BR = 8;

  const initGame = useCallback(() => {
    const canvas = engine.canvasRef.current!;
    const cy = canvas.height / 2;
    playerRef.current = { y: cy - PH / 2, score: 0 };
    aiRef.current = { y: cy - PH / 2, score: 0 };
    ballRef.current = { x: canvas.width / 2, y: cy, vx: 5, vy: 3 * (Math.random() > 0.5 ? 1 : -1) };
    scoreRef.current = 0;
    particlesRef.current = [];
    shakeRef.current = 0;
  }, [engine.canvasRef]);

  useEffect(() => {
    const canvas = engine.canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let running = true;

    const resize = () => {
      const p = canvas.parentElement!;
      canvas.width = Math.min(p.clientWidth, 700);
      canvas.height = Math.min(p.clientHeight, 500);
    };
    resize();

    const handleKeyDown = (e: KeyboardEvent) => keysRef.current.add(e.key);
    const handleKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    const handleTouchMove = (e: TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      touchYRef.current = e.touches[0].clientY - rect.top;
    };
    const handleTouchEnd = () => { touchYRef.current = null; };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
    canvas.addEventListener('touchend', handleTouchEnd);

    const resetBall = (dir: number) => {
      const W = canvas.width, H = canvas.height;
      ballRef.current = { x: W / 2, y: H / 2, vx: 5 * dir, vy: (Math.random() - 0.5) * 6 };
    };

    const loop = () => {
      if (!running) return;
      const W = canvas.width, H = canvas.height;
      const ball = ballRef.current;
      const player = playerRef.current;
      const ai = aiRef.current;

      if (stateRef.current.status === 'playing') {
        // Player input
        const keys = keysRef.current;
        const spd = 6;
        if (keys.has('ArrowUp') || keys.has('w') || keys.has('W')) player.y -= spd;
        if (keys.has('ArrowDown') || keys.has('s') || keys.has('S')) player.y += spd;
        if (touchYRef.current !== null) {
          player.y += (touchYRef.current - player.y - PH / 2) * 0.15;
        }
        player.y = Math.max(0, Math.min(H - PH, player.y));

        // AI
        const aiTarget = ball.y - PH / 2 + (Math.random() - 0.5) * 20;
        ai.y += (aiTarget - ai.y) * 0.06;
        ai.y = Math.max(0, Math.min(H - PH, ai.y));

        // Ball movement
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Wall bounce
        if (ball.y - BR <= 0 || ball.y + BR >= H) {
          ball.vy *= -1;
          playBounce();
        }

        // Paddle collisions
        // Player paddle (left)
        if (ball.vx < 0 && ball.x - BR <= 30 + PW && ball.y >= player.y && ball.y <= player.y + PH) {
          ball.vx = Math.abs(ball.vx) * 1.05;
          ball.vy += ((ball.y - player.y - PH / 2) / (PH / 2)) * 4;
          playBounce();
          shakeRef.current = 3;
          for (let i = 0; i < 6; i++) {
            particlesRef.current.push({
              x: 30 + PW, y: ball.y, vx: 2 + Math.random() * 3, vy: (Math.random() - 0.5) * 4,
              life: 1, color: '#6366f1',
            });
          }
        }
        // AI paddle (right)
        if (ball.vx > 0 && ball.x + BR >= W - 30 - PW && ball.y >= ai.y && ball.y <= ai.y + PH) {
          ball.vx = -Math.abs(ball.vx) * 1.05;
          ball.vy += ((ball.y - ai.y - PH / 2) / (PH / 2)) * 4;
          playBounce();
          shakeRef.current = 3;
        }

        // Scoring
        if (ball.x < 0) {
          ai.score++;
          playHit();
          shakeRef.current = 8;
          if (ai.score >= 11) engine.gameOver(player.score * 100);
          else resetBall(1);
        }
        if (ball.x > W) {
          player.score++;
          scoreRef.current = player.score * 100;
          engine.updateState({ score: scoreRef.current });
          playScore();
          shakeRef.current = 5;
          if (player.score >= 11) engine.gameOver(scoreRef.current + 500);
          else resetBall(-1);
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

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, W, H);

      // Center line
      ctx.setLineDash([8, 8]);
      ctx.strokeStyle = 'rgba(100,116,139,0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W / 2, 0);
      ctx.lineTo(W / 2, H);
      ctx.stroke();
      ctx.setLineDash([]);

      // Score display
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.font = 'bold 64px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(String(player.score), W / 2 - 60, 80);
      ctx.fillText(String(ai.score), W / 2 + 60, 80);

      // Paddles
      ctx.fillStyle = '#6366f1';
      ctx.beginPath();
      ctx.roundRect(30, player.y, PW, PH, 6);
      ctx.fill();
      ctx.shadowColor = '#6366f1';
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.roundRect(W - 30 - PW, ai.y, PW, PH, 6);
      ctx.fill();

      // Ball
      ctx.fillStyle = '#fff';
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BR, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Particles
      particlesRef.current.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
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
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
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

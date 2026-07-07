// Block Puzzle (Tetris-inspired) - Falling blocks puzzle game
import { useEffect, useRef, useCallback } from 'react';
import GameWrapper from '../components/GameWrapper';
import { useGameEngine } from '../hooks/useGameEngine';
import { getGameById } from './registry';
import { playDrop, playLineClear, playMove, playRotate } from '../utils/sound';

const COLS = 10;
const ROWS = 20;
const CELL = 28;

const PIECES = [
  { shape: [[1,1,1,1]], color: '#06b6d4' },           // I
  { shape: [[1,1],[1,1]], color: '#eab308' },          // O
  { shape: [[0,1,0],[1,1,1]], color: '#a855f7' },      // T
  { shape: [[1,0,0],[1,1,1]], color: '#3b82f6' },      // J
  { shape: [[0,0,1],[1,1,1]], color: '#f97316' },      // L
  { shape: [[0,1,1],[1,1,0]], color: '#22c55e' },      // S
  { shape: [[1,1,0],[0,1,1]], color: '#ef4444' },      // Z
];

interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number; }

export default function TetrisGame({ onBack }: { onBack: () => void }) {
  const config = getGameById('tetris')!;
  const engine = useGameEngine({ gameId: 'tetris' });
  const stateRef = useRef(engine.gameState);
  const boardRef = useRef<(string | null)[][]>([]);
  const pieceRef = useRef<{ shape: number[][]; color: string; x: number; y: number }>({ shape: [[]], color: '', x: 0, y: 0 });
  const nextRef = useRef(0);
  const scoreRef = useRef(0);
  const levelRef = useRef(1);
  const linesRef = useRef(0);
  const dropTimerRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const shakeRef = useRef(0);
  const touchStartRef = useRef<{ x: number; y: number; t: number } | null>(null);

  useEffect(() => { stateRef.current = engine.gameState; }, [engine.gameState]);

  const createBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null));

  const randomPiece = () => Math.floor(Math.random() * PIECES.length);

  const rotate = (shape: number[][]): number[][] => {
    const rows = shape.length, cols = shape[0].length;
    return Array.from({ length: cols }, (_, c) =>
      Array.from({ length: rows }, (_, r) => shape[rows - 1 - r][c])
    );
  };

  const collides = (board: (string | null)[][], shape: number[][], px: number, py: number): boolean => {
    for (let r = 0; r < shape.length; r++)
      for (let c = 0; c < shape[r].length; c++)
        if (shape[r][c]) {
          const nx = px + c, ny = py + r;
          if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
          if (ny >= 0 && board[ny][nx]) return true;
        }
    return false;
  };

  const lockPiece = useCallback(() => {
    const p = pieceRef.current;
    const board = boardRef.current;
    for (let r = 0; r < p.shape.length; r++)
      for (let c = 0; c < p.shape[r].length; c++)
        if (p.shape[r][c] && p.y + r >= 0)
          board[p.y + r][p.x + c] = p.color;

    // Check lines
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r].every(cell => cell !== null)) {
        // Spawn particles for cleared line
        for (let c = 0; c < COLS; c++) {
          for (let i = 0; i < 3; i++) {
            particlesRef.current.push({
              x: c * CELL + CELL / 2, y: r * CELL + CELL / 2,
              vx: (Math.random() - 0.5) * 8, vy: -Math.random() * 5 - 2,
              life: 1, color: board[r][c] || '#fff', size: 3 + Math.random() * 3,
            });
          }
        }
        board.splice(r, 1);
        board.unshift(Array(COLS).fill(null));
        cleared++;
        r++;
      }
    }

    if (cleared > 0) {
      const points = [0, 100, 300, 500, 800][cleared] * levelRef.current;
      scoreRef.current += points;
      linesRef.current += cleared;
      levelRef.current = Math.floor(linesRef.current / 10) + 1;
      playLineClear();
      shakeRef.current = cleared * 3;
      engine.updateState({ score: scoreRef.current, level: levelRef.current });
    } else {
      playDrop();
    }

    // Spawn next piece
    const idx = nextRef.current;
    nextRef.current = randomPiece();
    const tmpl = PIECES[idx];
    pieceRef.current = { shape: tmpl.shape.map(r => [...r]), color: tmpl.color, x: Math.floor((COLS - tmpl.shape[0].length) / 2), y: -tmpl.shape.length };

    if (collides(board, pieceRef.current.shape, pieceRef.current.x, pieceRef.current.y + 1)) {
      engine.gameOver(scoreRef.current);
    }
  }, [engine]);

  const initGame = useCallback(() => {
    boardRef.current = createBoard();
    scoreRef.current = 0;
    levelRef.current = 1;
    linesRef.current = 0;
    dropTimerRef.current = 0;
    particlesRef.current = [];
    shakeRef.current = 0;
    nextRef.current = randomPiece();
    const idx = randomPiece();
    const tmpl = PIECES[idx];
    pieceRef.current = { shape: tmpl.shape.map(r => [...r]), color: tmpl.color, x: Math.floor((COLS - tmpl.shape[0].length) / 2), y: 0 };
  }, []);

  const tryMove = useCallback((dx: number, dy: number): boolean => {
    const p = pieceRef.current;
    if (!collides(boardRef.current, p.shape, p.x + dx, p.y + dy)) {
      p.x += dx;
      p.y += dy;
      return true;
    }
    return false;
  }, []);

  const tryRotate = useCallback(() => {
    const p = pieceRef.current;
    const rotated = rotate(p.shape);
    if (!collides(boardRef.current, rotated, p.x, p.y)) {
      p.shape = rotated;
      playRotate();
    } else if (!collides(boardRef.current, rotated, p.x - 1, p.y)) {
      p.shape = rotated; p.x -= 1; playRotate();
    } else if (!collides(boardRef.current, rotated, p.x + 1, p.y)) {
      p.shape = rotated; p.x += 1; playRotate();
    }
  }, []);

  const hardDrop = useCallback(() => {
    const p = pieceRef.current;
    while (!collides(boardRef.current, p.shape, p.x, p.y + 1)) p.y++;
    lockPiece();
  }, [lockPiece]);

  useEffect(() => {
    const canvas = engine.canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let running = true;

    canvas.width = COLS * CELL;
    canvas.height = ROWS * CELL;

    const handleKey = (e: KeyboardEvent) => {
      if (stateRef.current.status !== 'playing') return;
      switch (e.key) {
        case 'ArrowLeft': case 'a': case 'A': tryMove(-1, 0); playMove(); e.preventDefault(); break;
        case 'ArrowRight': case 'd': case 'D': tryMove(1, 0); playMove(); e.preventDefault(); break;
        case 'ArrowDown': case 's': case 'S': if (tryMove(0, 1)) scoreRef.current += 1; e.preventDefault(); break;
        case 'ArrowUp': case 'w': case 'W': tryRotate(); e.preventDefault(); break;
        case ' ': hardDrop(); e.preventDefault(); break;
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
    };
    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current || stateRef.current.status !== 'playing') return;
      const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
      const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
      const dt = Date.now() - touchStartRef.current.t;
      if (Math.abs(dx) < 20 && Math.abs(dy) < 20 && dt < 300) { tryRotate(); return; }
      if (Math.abs(dy) > 50 && dy > 0) { hardDrop(); return; }
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 20) { tryMove(1, 0); playMove(); }
        else if (dx < -20) { tryMove(-1, 0); playMove(); }
      }
    };

    window.addEventListener('keydown', handleKey);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchend', handleTouchEnd);

    let lastTime = 0;
    const loop = (time: number) => {
      if (!running) return;
      const dt = time - lastTime;
      lastTime = time;

      if (stateRef.current.status === 'playing') {
        dropTimerRef.current += dt;
        const speed = Math.max(100, 800 - (levelRef.current - 1) * 60);
        if (dropTimerRef.current >= speed) {
          dropTimerRef.current = 0;
          if (!tryMove(0, 1)) lockPiece();
        }
      }

      // Update particles
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.2;
        p.life -= dt / 600; return p.life > 0;
      });
      if (shakeRef.current > 0) shakeRef.current *= 0.9;

      // Draw
      ctx.save();
      if (shakeRef.current > 0.5) {
        ctx.translate((Math.random() - 0.5) * shakeRef.current, (Math.random() - 0.5) * shakeRef.current);
      }

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid
      ctx.strokeStyle = 'rgba(51,65,85,0.2)';
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++) {
          ctx.strokeRect(c * CELL, r * CELL, CELL, CELL);
        }

      // Board
      const board = boardRef.current;
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++) {
          if (board[r]?.[c]) {
            ctx.fillStyle = board[r][c]!;
            ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, 3);
          }
        }

      // Current piece + ghost
      const p = pieceRef.current;
      if (stateRef.current.status === 'playing' || stateRef.current.status === 'paused') {
        // Ghost
        let ghostY = p.y;
        while (!collides(board, p.shape, p.x, ghostY + 1)) ghostY++;
        for (let r = 0; r < p.shape.length; r++)
          for (let c = 0; c < p.shape[r].length; c++)
            if (p.shape[r][c] && ghostY + r >= 0) {
              ctx.fillStyle = 'rgba(255,255,255,0.1)';
              ctx.fillRect((p.x + c) * CELL + 1, (ghostY + r) * CELL + 1, CELL - 2, CELL - 2);
            }

        // Active piece
        for (let r = 0; r < p.shape.length; r++)
          for (let c = 0; c < p.shape[r].length; c++)
            if (p.shape[r][c] && p.y + r >= 0) {
              ctx.fillStyle = p.color;
              ctx.fillRect((p.x + c) * CELL + 1, (p.y + r) * CELL + 1, CELL - 2, CELL - 2);
              ctx.fillStyle = 'rgba(255,255,255,0.2)';
              ctx.fillRect((p.x + c) * CELL + 1, (p.y + r) * CELL + 1, CELL - 2, 3);
            }
      }

      // Particles
      particlesRef.current.forEach(pt => {
        ctx.globalAlpha = pt.life;
        ctx.fillStyle = pt.color;
        ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
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
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  const handleStart = () => { engine.startGame(); initGame(); };

  return (
    <GameWrapper config={config} gameState={engine.gameState} onStart={handleStart}
      onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}
      extraHud={<div className="px-3 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-indigo-400 text-xs">Lv.{engine.gameState.level}</div>}
    >
      <canvas ref={engine.canvasRef} style={{ maxHeight: '100%', maxWidth: '100%' }} />
    </GameWrapper>
  );
}

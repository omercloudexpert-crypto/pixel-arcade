// Sound effects engine using Web Audio API
// All sounds are procedurally generated - no external audio files needed

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let muted = false;
let volume = 0.7;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = volume;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function getGain(): GainNode {
  getCtx();
  return masterGain!;
}

export function setMuted(m: boolean): void {
  muted = m;
}

export function isMuted(): boolean {
  return muted;
}

export function setVolume(v: number): void {
  volume = Math.max(0, Math.min(1, v));
  if (masterGain) {
    masterGain.gain.value = volume;
  }
}

// Play a tone with given frequency, duration, and type
function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'square',
  gainVal = 0.3,
  delay = 0
): void {
  if (muted) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    gain.gain.setValueAtTime(gainVal, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    osc.connect(gain);
    gain.connect(getGain());
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  } catch {}
}

// Play noise burst (for explosions, hits, etc.)
function playNoise(duration: number, gainVal = 0.2): void {
  if (muted) return;
  try {
    const ctx = getCtx();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    source.connect(gain);
    gain.connect(getGain());
    source.start();
  } catch {}
}

// === Sound Effects Library ===

export function playClick(): void {
  playTone(800, 0.1, 'square', 0.15);
}

export function playCollect(): void {
  playTone(587, 0.1, 'square', 0.2);
  playTone(880, 0.15, 'square', 0.2, 0.08);
}

export function playHit(): void {
  playTone(200, 0.15, 'sawtooth', 0.25);
  playNoise(0.1, 0.15);
}

export function playExplosion(): void {
  playNoise(0.4, 0.3);
  playTone(100, 0.3, 'sawtooth', 0.2);
}

export function playGameOver(): void {
  playTone(400, 0.2, 'square', 0.25);
  playTone(300, 0.2, 'square', 0.25, 0.2);
  playTone(200, 0.4, 'square', 0.25, 0.4);
}

export function playLevelUp(): void {
  playTone(523, 0.1, 'square', 0.2);
  playTone(659, 0.1, 'square', 0.2, 0.1);
  playTone(784, 0.1, 'square', 0.2, 0.2);
  playTone(1047, 0.2, 'square', 0.2, 0.3);
}

export function playScore(): void {
  playTone(660, 0.08, 'square', 0.15);
}

export function playBounce(): void {
  playTone(440, 0.05, 'triangle', 0.2);
}

export function playMove(): void {
  playTone(300, 0.03, 'sine', 0.1);
}

export function playRotate(): void {
  playTone(500, 0.05, 'triangle', 0.15);
}

export function playLineClear(): void {
  playTone(523, 0.08, 'square', 0.2);
  playTone(659, 0.08, 'square', 0.2, 0.06);
  playTone(784, 0.08, 'square', 0.2, 0.12);
}

export function playWin(): void {
  playTone(523, 0.15, 'square', 0.2);
  playTone(659, 0.15, 'square', 0.2, 0.15);
  playTone(784, 0.15, 'square', 0.2, 0.3);
  playTone(1047, 0.3, 'square', 0.25, 0.45);
}

export function playShoot(): void {
  playTone(800, 0.1, 'sawtooth', 0.15);
  playTone(400, 0.05, 'sawtooth', 0.1, 0.05);
}

export function playPowerUp(): void {
  for (let i = 0; i < 5; i++) {
    playTone(400 + i * 100, 0.08, 'square', 0.15, i * 0.05);
  }
}

export function playDrop(): void {
  playTone(200, 0.15, 'sine', 0.2);
}

export function playMenuSelect(): void {
  playTone(600, 0.06, 'sine', 0.15);
}

export function playError(): void {
  playTone(200, 0.15, 'square', 0.2);
  playTone(150, 0.2, 'square', 0.2, 0.15);
}

export function playTick(): void {
  playTone(1000, 0.02, 'sine', 0.1);
}

export function playSwipe(): void {
  const ctx = getCtx();
  if (muted) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(getGain());
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch {}
}

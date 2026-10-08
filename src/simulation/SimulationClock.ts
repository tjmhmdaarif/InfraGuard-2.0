export interface SimulationClock {
  time: number;
  speed: number;
  isRunning: boolean;
  startTime: number;
  lastTick: number;
}

export type SimulationSpeed = 0.1 | 0.25 | 0.5 | 1 | 2 | 5 | 10;

export const SIMULATION_SPEEDS: SimulationSpeed[] = [0.1, 0.25, 0.5, 1, 2, 5, 10];

export const SPEED_LABELS: Record<SimulationSpeed, string> = {
  0.1: '0.1x',
  0.25: '0.25x',
  0.5: '0.5x',
  1: '1x',
  2: '2x',
  5: '5x',
  10: '10x',
};

export function formatSimulationTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function parseSimulationTime(timeString: string): number {
  const parts = timeString.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}

export class SimulationClockManager {
  private clock: SimulationClock;
  private subscribers: Set<(clock: SimulationClock) => void>;
  private animationFrame: number | null;
  private lastFrameTime: number;

  constructor(initialSpeed: SimulationSpeed = 1) {
    this.clock = {
      time: 0,
      speed: initialSpeed,
      isRunning: false,
      startTime: 0,
      lastTick: 0,
    };
    this.subscribers = new Set();
    this.animationFrame = null;
    this.lastFrameTime = 0;
  }

  subscribe(callback: (clock: SimulationClock) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notify(): void {
    this.subscribers.forEach((cb) => cb({ ...this.clock }));
  }

  getClock(): SimulationClock {
    return { ...this.clock };
  }

  getTime(): number {
    return this.clock.time;
  }

  getSpeed(): number {
    return this.clock.speed;
  }

  isRunning(): boolean {
    return this.clock.isRunning;
  }

  setTime(time: number): void {
    this.clock.time = Math.max(0, time);
    this.notify();
  }

  setSpeed(speed: SimulationSpeed): void {
    if (this.clock.isRunning) {
      const elapsed = (Date.now() - this.clock.startTime) * this.clock.speed;
      this.clock.startTime = Date.now() - elapsed / speed;
    }
    this.clock.speed = speed;
    this.notify();
  }

  play(): void {
    if (!this.clock.isRunning) {
      this.clock.isRunning = true;
      this.clock.startTime = Date.now() - this.clock.time / this.clock.speed;
      this.clock.lastTick = Date.now();
      this.startLoop();
      this.notify();
    }
  }

  pause(): void {
    if (this.clock.isRunning) {
      this.clock.isRunning = false;
      this.clock.time += (Date.now() - this.clock.lastTick) * this.clock.speed;
      this.stopLoop();
      this.notify();
    }
  }

  reset(): void {
    this.clock.time = 0;
    this.clock.startTime = 0;
    this.clock.lastTick = 0;
    if (this.clock.isRunning) {
      this.clock.isRunning = false;
      this.stopLoop();
    }
    this.notify();
  }

  restart(): void {
    this.reset();
    this.play();
  }

  tick(deltaTime: number): void {
    if (this.clock.isRunning) {
      this.clock.time += deltaTime * this.clock.speed;
      this.clock.lastTick = Date.now();
      this.notify();
    }
  }

  private startLoop(): void {
    if (this.animationFrame) return;
    const loop = () => {
      const now = Date.now();
      const delta = (now - this.lastFrameTime) / 1000;
      this.lastFrameTime = now;
      if (this.clock.isRunning) {
        this.clock.time += delta * this.clock.speed;
        this.clock.lastTick = now;
        this.notify();
      }
      this.animationFrame = requestAnimationFrame(loop);
    };
    this.lastFrameTime = Date.now();
    this.animationFrame = requestAnimationFrame(loop);
  }

  private stopLoop(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  destroy(): void {
    this.stopLoop();
    this.subscribers.clear();
  }
}

export const simulationClockManager = new SimulationClockManager();
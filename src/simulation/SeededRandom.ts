export class SeededRandom {
  private seed: number;
  private multiplier = 1664525;
  private increment = 1013904223;
  private modulus = 4294967296;

  constructor(seed: string | number) {
    if (typeof seed === 'string') {
      this.seed = this.hashString(seed);
    } else {
      this.seed = seed;
    }
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash) || 1;
  }

  next(): number {
    this.seed = (this.seed * this.multiplier + this.increment) % this.modulus;
    return this.seed / this.modulus;
  }

  nextFloat(): number {
    return this.next();
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextBoolean(probability = 0.5): boolean {
    return this.next() < probability;
  }

  nextGaussian(mean = 0, stdDev = 1): number {
    let u = 0, v = 0;
    while (u === 0) u = this.next();
    while (v === 0) v = this.next();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdDev + mean;
  }

  nextChoice<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }

  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  getState(): number {
    return this.seed;
  }

  setState(seed: number): void {
    this.seed = seed;
  }

  clone(): SeededRandom {
    const cloned = new SeededRandom(0);
    cloned.seed = this.seed;
    return cloned;
  }
}

export function createSeededRandom(seed: string): SeededRandom {
  return new SeededRandom(seed);
}

export const DEMO_SEED = 'INFRAGUARD-DEMO-2026';
/**
 * 可控伪随机（seed 确定则输出序列确定）
 * 用于模板的随机布局 / 波点 / 粒子分布
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function nextInt(rand: () => number, min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min
}

export function nextFloat(rand: () => number, min: number, max: number): number {
  return rand() * (max - min) + min
}

export function pick<T>(rand: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)]
}

/** 工具：随机生成一个新 seed（仅在用户点"重新随机"时使用） */
export function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff)
}

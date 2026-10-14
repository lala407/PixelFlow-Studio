/**
 * Demo 2 验证模块：像素读取 + 简单颜色统计（桶量化）
 * readPixels 依赖浏览器 Canvas；countTopColors 为纯函数，可在 jsdom 单测
 */
export interface ColorSwatch {
  hex: string
  r: number
  g: number
  b: number
  proportion: number
}

const ALPHA_THRESHOLD = 32
const SAMPLE_MAX_SIDE = 256

function toHex(v: number): string {
  return v.toString(16).padStart(2, '0')
}

/** 纯函数：对 RGBA 像素数据做 4bit 桶量化，返回按占比排序的主色 */
export function countTopColors(pixels: Uint8ClampedArray, topK = 5): ColorSwatch[] {
  const buckets = new Map<number, { count: number; r: number; g: number; b: number }>()
  let total = 0
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] < ALPHA_THRESHOLD) continue
    const r = pixels[i]
    const g = pixels[i + 1]
    const b = pixels[i + 2]
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4)
    const entry = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 }
    entry.count++
    entry.r += r
    entry.g += g
    entry.b += b
    buckets.set(key, entry)
    total++
  }
  if (total === 0) return []
  return [...buckets.values()]
    .map((e) => {
      const r = Math.round(e.r / e.count)
      const g = Math.round(e.g / e.count)
      const b = Math.round(e.b / e.count)
      return { hex: `#${toHex(r)}${toHex(g)}${toHex(b)}`, r, g, b, proportion: e.count / total }
    })
    .sort((a, b) => b.proportion - a.proportion)
    .slice(0, topK)
}

/** 浏览器端：将位图缩放采样后读取像素（验证 getImageData 可用） */
export async function readPixels(bitmap: ImageBitmap): Promise<Uint8ClampedArray> {
  const scale = Math.min(1, SAMPLE_MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('无法创建 2D 上下文')
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(bitmap, 0, 0, w, h)
  return ctx.getImageData(0, 0, w, h).data
}

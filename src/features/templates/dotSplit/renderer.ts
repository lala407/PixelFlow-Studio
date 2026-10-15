/**
 * Dot Split 渲染器
 *
 * 布局：左侧 splitRatio 占比区域绘原图，右侧绘波点（叠加或替代）
 * 坐标系：RenderContext 已完成 contain 换算，这里用画布坐标直接绘
 */
import type { RenderContext, TemplateConfig } from '../../../domain/models/types'
import type { DotSplitParams } from './config'
import { mulberry32, nextFloat, pick } from '../../../image/utils/random'

interface DotPoint {
  x: number
  y: number
  r: number
  color: string
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  points = 5,
): void {
  ctx.beginPath()
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2
    const rr = i % 2 === 0 ? r : r * 0.45
    const px = cx + Math.cos(angle) * rr
    const py = cy + Math.sin(angle) * rr
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fill()
}

function generateDots(
  rand: () => number,
  areaW: number,
  areaH: number,
  params: DotSplitParams,
  palette: string[],
): DotPoint[] {
  const dots: DotPoint[] = []
  const baseR = Math.min(areaW, areaH) * params.dotSize
  if (params.distribution === 'grid') {
    const cols = Math.ceil(Math.sqrt(params.dotCount * (areaW / Math.max(areaH, 1))))
    const rows = Math.ceil(params.dotCount / cols)
    const cellW = areaW / cols
    const cellH = areaH / rows
    for (let i = 0; i < params.dotCount && dots.length < params.dotCount; i++) {
      const col = i % cols
      const row = Math.floor(i / cols)
      dots.push({
        x: col * cellW + cellW / 2 + nextFloat(rand, -cellW * 0.2, cellW * 0.2),
        y: row * cellH + cellH / 2 + nextFloat(rand, -cellH * 0.2, cellH * 0.2),
        r: baseR * (1 + nextFloat(rand, -params.dotJitter, params.dotJitter)),
        color: pick(rand, palette),
      })
    }
  } else {
    for (let i = 0; i < params.dotCount; i++) {
      dots.push({
        x: nextFloat(rand, baseR, areaW - baseR),
        y: nextFloat(rand, baseR, areaH - baseR),
        r: baseR * (1 + nextFloat(rand, -params.dotJitter, params.dotJitter)),
        color: pick(rand, palette),
      })
    }
  }
  return dots
}

export function renderDotSplit(
  ctx: RenderContext,
  config: TemplateConfig<DotSplitParams>,
): void {
  const { context2d: g2d, width, height, analysis } = ctx
  const p = config.params
  const rand = mulberry32(config.seed)

  // 1. 背景
  g2d.fillStyle = p.rightBgColor
  g2d.fillRect(0, 0, width, height)

  // 2. 左栏：原图区域（contain 适配，按 splitRatio 限定）
  const leftW = width * p.splitRatio
  g2d.save()
  g2d.beginPath()
  g2d.rect(0, 0, leftW, height)
  g2d.clip()
  // 原图适配到左栏
  const leftScale = Math.min(leftW / ctx.sourceImage.width, height / ctx.sourceImage.height)
  const leftDrawW = ctx.sourceImage.width * leftScale
  const leftDrawH = ctx.sourceImage.height * leftScale
  const leftOffsetX = (leftW - leftDrawW) / 2
  const leftOffsetY = (height - leftDrawH) / 2
  const bm = ctx.sourceImage.bitmap
  if (bm) {
    g2d.drawImage(bm, leftOffsetX, leftOffsetY, leftDrawW, leftDrawH)
  }
  g2d.restore()

  // 3. 右栏：波点
  const rightX = leftW
  const rightW = width - leftW
  const palette =
    analysis.capabilities.color === 'ready' && analysis.dominantColors.length > 0
      ? analysis.dominantColors.map((s) => s.hex)
      : ['#ffffff', '#f3f4f6', '#d1d5db']

  const dots = generateDots(rand, rightW, height, p, palette)
  g2d.globalAlpha = p.dotOpacity
  for (const d of dots) {
    g2d.fillStyle = d.color
    if (p.dotShape === 'star') {
      drawStar(g2d, rightX + d.x, d.y, d.r)
    } else {
      g2d.beginPath()
      g2d.arc(rightX + d.x, d.y, d.r, 0, Math.PI * 2)
      g2d.fill()
    }
  }
  g2d.globalAlpha = 1
}

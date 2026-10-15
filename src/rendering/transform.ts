/**
 * 渲染工具：坐标换算与适配模式（contain / cover）
 *
 * 职责：给定源图尺寸 + 目标画布尺寸 + 适配模式，计算 scale / offset。
 * 所有模板共享同一套坐标换算，避免各自实现导致检测框错位。
 */
import type { BoundingBox, FitMode, LoadedImage, RenderContext } from '../domain/models/types'

export interface FitTransform {
  scale: number
  offsetX: number
  offsetY: number
}

/** 计算 contain / cover 变换参数 */
export function computeFitTransform(
  sourceW: number,
  sourceH: number,
  canvasW: number,
  canvasH: number,
  mode: FitMode,
): FitTransform {
  const scaleX = canvasW / sourceW
  const scaleY = canvasH / sourceH
  const scale = mode === 'cover' ? Math.max(scaleX, scaleY) : Math.min(scaleX, scaleY)
  const offsetX = (canvasW - sourceW * scale) / 2
  const offsetY = (canvasH - sourceH * scale) / 2
  return { scale, offsetX, offsetY }
}

/** 原图像素 → 画布像素（正向） */
export function imageToCanvas(
  imageX: number,
  imageY: number,
  t: FitTransform,
): { x: number; y: number } {
  return { x: imageX * t.scale + t.offsetX, y: imageY * t.scale + t.offsetY }
}

/** 画布像素 → 原图像素（反向，用于手动拖拽框） */
export function canvasToImage(
  canvasX: number,
  canvasY: number,
  t: FitTransform,
): { x: number; y: number } {
  return { x: (canvasX - t.offsetX) / t.scale, y: (canvasY - t.offsetY) / t.scale }
}

/** 在画布上绘制源图（处理 contain/cover 适配） */
export function drawSourceImage(
  ctx: CanvasRenderingContext2D,
  img: LoadedImage,
  t: FitTransform,
): void {
  const sx = img.crop.x
  const sy = img.crop.y
  const sw = img.crop.width
  const sh = img.crop.height
  const dx = sx * t.scale + t.offsetX
  const dy = sy * t.scale + t.offsetY
  const dw = sw * t.scale
  const dh = sh * t.scale
  const source = img.bitmap
  if (source) {
    ctx.drawImage(source, sx, sy, sw, sh, dx, dy, dw, dh)
  } else if (img.blob) {
    // 兜底：用 blob 重新 createImageBitmap（避免 bitmap 已释放）
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    createImageBitmap(img.blob).then((bm) => {
      ctx.drawImage(bm, sx, sy, sw, sh, dx, dy, dw, dh)
      bm.close()
    })
  }
}

/** 用原图像素 BoundingBox 在画布上绘制矩形（处理坐标换算） */
export function drawImageRectOnCanvas(
  ctx: CanvasRenderingContext2D,
  box: BoundingBox,
  t: FitTransform,
): void {
  const p = imageToCanvas(box.x, box.y, t)
  ctx.strokeRect(p.x, p.y, box.width * t.scale, box.height * t.scale)
}

/** 构建 RenderContext：按模板参数渲染的统一入口 */
export function buildRenderContext(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  source: LoadedImage,
  analysis: import('../domain/models/types').AnalysisResult,
  fit: FitMode,
): RenderContext {
  const t = computeFitTransform(source.width, source.height, width, height, fit)
  return {
    context2d: ctx,
    width,
    height,
    sourceImage: source,
    analysis,
    fit,
    scale: t.scale,
    offsetX: t.offsetX,
    offsetY: t.offsetY,
  }
}

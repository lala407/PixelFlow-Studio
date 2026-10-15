/**
 * CanvasRenderer：统一渲染入口
 *
 * 所有模板的渲染都通过本文件执行。渲染层只依赖 RenderContext，不感知 UI。
 * 预览画布与导出画布共享同一套逻辑——区别仅在于目标尺寸。
 */
import type { AnalysisResult, LoadedImage, TemplateConfig } from '../domain/models/types'
import { TemplateRegistry, renderTemplate } from '../domain/templates/contract'
import { buildRenderContext } from './transform'

export interface RenderTarget {
  width: number
  height: number
  fit: import('../domain/models/types').FitMode
  background: string
}

/**
 * 在给定 canvas 上渲染模板。
 * 调用方负责：创建 canvas / 管理 bitmap 生命周期 / 调用 toBlob
 */
export function renderToCanvas(
  canvas: HTMLCanvasElement,
  source: LoadedImage,
  analysis: AnalysisResult,
  config: TemplateConfig,
  target: RenderTarget,
): void {
  canvas.width = target.width
  canvas.height = target.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建 2D 上下文')

  // 1. 背景
  ctx.fillStyle = target.background
  ctx.fillRect(0, 0, target.width, target.height)

  // 2. 渲染模板（模板内部决定是否/如何绘制源图）
  const renderCtx = buildRenderContext(ctx, target.width, target.height, source, analysis, target.fit)
  renderTemplate(renderCtx, config, analysis)
}

/** 便捷方法：创建离屏 canvas 渲染后返回 HTMLCanvasElement */
export function renderOffscreen(
  source: LoadedImage,
  analysis: AnalysisResult,
  config: TemplateConfig,
  target: RenderTarget,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  renderToCanvas(canvas, source, analysis, config, target)
  return canvas
}

/** 列出所有已注册模板（用于模板切换下拉） */
export function listTemplates() {
  return TemplateRegistry.list()
}

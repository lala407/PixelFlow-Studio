/**
 * 导出适配：调用 CanvasRenderer 重渲染后 toBlob 下载
 *
 * 职责：
 *   - 按目标尺寸调用 CanvasRenderer.renderOffscreen()
 *   - 导出文件名 = 项目名 + 模板名 + 时间戳
 *   - 大尺寸校验（避免导出 16k+ 像素导致内存爆炸）
 */
import type { AnalysisResult, LoadedImage, TemplateConfig } from '../../domain/models/types'
import { renderOffscreen } from '../../rendering/CanvasRenderer'

const MAX_EXPORT_PIXELS = 16_000 * 16_000 // 256M 像素
const TO_BLOB_TIMEOUT_MS = 5000
/** 生成的 blob URL 保留时长：留足手动保存/预览的时间 */
const OBJECT_URL_TTL_MS = 5 * 60 * 1000

export interface ExportRequest {
  source: LoadedImage
  analysis: AnalysisResult
  config: TemplateConfig
  outputWidth: number
  outputHeight: number
  background: string
  projectName: string
}

export interface ExportResult {
  filename: string
  /** 生成的 blob URL，供页面手动保存兜底（TTL 见 OBJECT_URL_TTL_MS） */
  url: string
  width: number
  height: number
  bytes: number
}

export class ExportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ExportError'
  }
}

/**
 * canvas.toBlob 包装：加超时，避免回调永不触发导致 Promise 永久 pending
 */
function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    let settled = false
    const timer = window.setTimeout(() => {
      if (settled) return
      settled = true
      reject(new ExportError(`toBlob 超时（${TO_BLOB_TIMEOUT_MS / 1000}s 未回调），画布可能过大或被污染`))
    }, TO_BLOB_TIMEOUT_MS)
    const done = (blob: Blob | null) => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      if (blob) resolve(blob)
      else reject(new ExportError('toBlob 返回空 Blob，导出失败'))
    }
    try {
      canvas.toBlob(done, type)
    } catch (err) {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      reject(err instanceof Error ? err : new ExportError(String(err)))
    }
  })
}

function sanitizeFilename(s: string): string {
  return s.replace(/[\\/:*?"<>|]/g, '_').trim() || 'untitled'
}

function buildFilename(projectName: string, templateId: string): string {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  return `${sanitizeFilename(projectName)}_${templateId}_${ts}.png`
}

export async function exportPng(req: ExportRequest): Promise<Blob> {
  const { outputWidth, outputHeight } = req
  if (outputWidth <= 0 || outputHeight <= 0) {
    throw new ExportError('导出尺寸必须大于 0')
  }
  if (outputWidth * outputHeight > MAX_EXPORT_PIXELS) {
    throw new ExportError(
      `导出像素过大: ${outputWidth * outputHeight} > ${MAX_EXPORT_PIXELS}，请缩小尺寸`,
    )
  }

  const canvas = renderOffscreen(req.source, req.analysis, req.config, {
    width: outputWidth,
    height: outputHeight,
    fit: 'contain',
    background: req.background,
  })

  const blob = await canvasToBlob(canvas, 'image/png')
  return blob
}

/**
 * 触发下载
 *
 * 关键点（修 BUG：某些浏览器/内嵌预览 iframe 下不触发下载）：
 *   1. <a> 必须先挂到 DOM 再 click()，否则部分浏览器忽略点击
 *   2. 不能立即 revokeObjectURL，否则正在进行的下载会被取消
 * @returns 生成的 blob URL（保留 OBJECT_URL_TTL_MS，供调用方做手动保存兜底）
 */
export function downloadBlob(blob: Blob, filename: string): string {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.setTimeout(() => URL.revokeObjectURL(url), OBJECT_URL_TTL_MS)
  return url
}

/** 一次完成渲染 + 下载 */
export async function exportAndDownload(req: ExportRequest): Promise<ExportResult> {
  const blob = await exportPng(req)
  const filename = buildFilename(req.projectName, req.config.templateId)
  const url = downloadBlob(blob, filename)
  return {
    filename,
    url,
    width: req.outputWidth,
    height: req.outputHeight,
    bytes: blob.size,
  }
}
